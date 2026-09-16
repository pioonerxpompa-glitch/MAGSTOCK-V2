import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { z } from "zod";
import { db } from "./db.js";
import { authenticate, loginUser, registerAuth } from "./auth.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.WEB_ORIGIN || "http://localhost:5173" });
await app.register(multipart);
await registerAuth(app);

const productInput = z.object({
  name: z.string().min(1).max(200),
  ean: z.string().regex(/^\d{13}$/).optional().nullable(),
  eurocashIndex: z.string().max(100).optional().nullable(),
  aen: z.string().max(100).optional().nullable(),
  subgroup: z.string().max(100).optional().nullable(),
  unit: z.string().min(1).max(30).default("szt"),
  volume: z.string().max(30).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  minStock: z.number().nonnegative().default(0)
});
const categoryInput = z.object({ name: z.string().min(1).max(100), parentId: z.string().optional().nullable() });
const transactionInput = z.object({
  productId: z.string(), warehouseId: z.string(), quantity: z.number().positive(),
  note: z.string().max(500).optional(), type: z.enum(["RECEIPT", "ISSUE"])
});
const transferInput = z.object({
  productId: z.string(), fromWarehouseId: z.string(), toWarehouseId: z.string(),
  quantity: z.number().positive(), note: z.string().max(500).optional()
});

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}
function cleanName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function validEan13(ean?: string | null) {
  if (!ean) return true;
  if (!/^\d{13}$/.test(ean)) return false;
  const d=[...ean].map(Number);
  const sum=d.slice(0,12).reduce((acc,n,i)=>acc+n*(i%2===0?1:3),0);
  return (10-(sum%10))%10===d[12];
}
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if ((request.user as {role?:string})?.role !== "ADMIN") return reply.code(403).send({error:"ADMIN_REQUIRED"});
}

app.get("/health", async()=>({ok:true,version:"2.0.0",service:"MAGSTOCK API"}));

app.post("/auth/login", async(request,reply)=>{
  const body=z.object({pin:z.string().min(1).max(32)}).parse(request.body);
  const result=await loginUser(app,body.pin);
  if("error" in result) return reply.code(result.error==="LICENSE_REQUIRED"?403:401).send(result);
  return result;
});
app.get("/me",{preHandler:authenticate},async request=>request.user);

app.get("/warehouses",{preHandler:authenticate},async()=>db.warehouse.findMany({
  where:{active:true},include:{_count:{select:{stocks:true}}},orderBy:{name:"asc"}
}));

app.get("/categories",{preHandler:authenticate},async()=>db.category.findMany({
  include:{parent:true,children:true,_count:{select:{products:true}}},orderBy:{name:"asc"}
}));
app.post("/categories",{preHandler:[authenticate,requireAdmin]},async request=>{
  const body=categoryInput.parse(request.body);
  return db.category.create({data:{name:cleanName(body.name),parentId:body.parentId??null}});
});
app.put("/categories/:id",{preHandler:[authenticate,requireAdmin]},async request=>{
  const {id}=request.params as {id:string};
  const body=categoryInput.partial().parse(request.body);
  return db.category.update({where:{id},data:{name:body.name?cleanName(body.name):undefined,parentId:body.parentId}});
});
app.delete("/categories/:id",{preHandler:[authenticate,requireAdmin]},async(request,reply)=>{
  const {id}=request.params as {id:string};
  const count=await db.product.count({where:{categoryId:id}});
  if(count>0) return reply.code(409).send({error:"CATEGORY_IN_USE",count});
  await db.category.delete({where:{id}});
  return {ok:true};
});

app.get("/products",{preHandler:authenticate},async request=>{
  const q=z.object({
    search:z.string().optional(),active:z.coerce.boolean().optional(),
    categoryId:z.string().optional(),warehouseId:z.string().optional()
  }).parse(request.query);
  return db.product.findMany({
    where:{
      active:q.active??true,
      categoryId:q.categoryId||undefined,
      ...(q.warehouseId?{stocks:{some:{warehouseId:q.warehouseId}}}:{}),
      OR:q.search?[
        {name:{contains:q.search,mode:"insensitive"}},
        {normalizedName:{contains:normalizeName(q.search),mode:"insensitive"}},
        {ean:{contains:q.search}},
        {eurocashIndex:{contains:q.search,mode:"insensitive"}},
        {aen:{contains:q.search,mode:"insensitive"}}
      ]:undefined
    },
    include:{category:true,stocks:{include:{warehouse:true}}},
    orderBy:{name:"asc"}
  });
});
app.get("/products/:id",{preHandler:authenticate},async(request,reply)=>{
  const {id}=request.params as {id:string};
  const product=await db.product.findUnique({where:{id},include:{category:true,stocks:{include:{warehouse:true}}}});
  if(!product) return reply.code(404).send({error:"PRODUCT_NOT_FOUND"});
  return product;
});
app.post("/products",{preHandler:[authenticate,requireAdmin]},async(request,reply)=>{
  const body=productInput.parse(request.body);
  if(!validEan13(body.ean)) return reply.code(400).send({error:"INVALID_EAN13"});
  const name=cleanName(body.name);
  return db.product.create({data:{
    name,normalizedName:normalizeName(name),ean:body.ean||null,
    eurocashIndex:body.eurocashIndex||null,aen:body.aen||null,subgroup:body.subgroup||null,
    unit:body.unit,volume:body.volume||null,categoryId:body.categoryId||null,minStock:body.minStock
  }});
});
app.put("/products/:id",{preHandler:[authenticate,requireAdmin]},async(request,reply)=>{
  const {id}=request.params as {id:string};
  const body=productInput.partial().parse(request.body);
  if(body.ean!==undefined&&!validEan13(body.ean)) return reply.code(400).send({error:"INVALID_EAN13"});
  const name=body.name?cleanName(body.name):undefined;
  return db.product.update({where:{id},data:{
    name,normalizedName:name?normalizeName(name):undefined,ean:body.ean,
    eurocashIndex:body.eurocashIndex,aen:body.aen,subgroup:body.subgroup,unit:body.unit,
    volume:body.volume,categoryId:body.categoryId,minStock:body.minStock
  }});
});
app.delete("/products/:id",{preHandler:[authenticate,requireAdmin]},async request=>{
  const {id}=request.params as {id:string};
  return db.product.update({where:{id},data:{active:false}});
});

app.post("/inventory/transaction",{preHandler:authenticate},async(request,reply)=>{
  const body=transactionInput.parse(request.body);
  const userId=(request.user as {sub:string}).sub;
  try{
    return await db.$transaction(async tx=>{
      const existing=await tx.stock.findUnique({where:{productId_warehouseId:{productId:body.productId,warehouseId:body.warehouseId}}});
      const current=existing?Number(existing.quantity):0;
      const delta=body.type==="ISSUE"?-body.quantity:body.quantity;
      const next=current+delta;
      if(next<0) throw new Error("INSUFFICIENT_STOCK");
      const stock=await tx.stock.upsert({
        where:{productId_warehouseId:{productId:body.productId,warehouseId:body.warehouseId}},
        update:{quantity:next},
        create:{productId:body.productId,warehouseId:body.warehouseId,quantity:next}
      });
      await tx.transaction.create({data:{productId:body.productId,warehouseId:body.warehouseId,userId,type:body.type,quantity:body.quantity,note:body.note}});
      return stock;
    });
  }catch(error){
    if(error instanceof Error&&error.message==="INSUFFICIENT_STOCK") return reply.code(409).send({error:"INSUFFICIENT_STOCK"});
    throw error;
  }
});

app.post("/inventory/transfer",{preHandler:authenticate},async(request,reply)=>{
  const body=transferInput.parse(request.body);
  if(body.fromWarehouseId===body.toWarehouseId) return reply.code(400).send({error:"SAME_WAREHOUSE"});
  const userId=(request.user as {sub:string}).sub;
  try{
    return await db.$transaction(async tx=>{
      const source=await tx.stock.findUnique({where:{productId_warehouseId:{productId:body.productId,warehouseId:body.fromWarehouseId}}});
      const current=source?Number(source.quantity):0;
      if(current<body.quantity) throw new Error("INSUFFICIENT_STOCK");
      await tx.stock.update({where:{productId_warehouseId:{productId:body.productId,warehouseId:body.fromWarehouseId}},data:{quantity:current-body.quantity}});
      const target=await tx.stock.upsert({
        where:{productId_warehouseId:{productId:body.productId,warehouseId:body.toWarehouseId}},
        update:{quantity:{increment:body.quantity}},
        create:{productId:body.productId,warehouseId:body.toWarehouseId,quantity:body.quantity}
      });
      await tx.transaction.createMany({data:[
        {productId:body.productId,warehouseId:body.fromWarehouseId,userId,type:"TRANSFER_OUT",quantity:body.quantity,note:body.note},
        {productId:body.productId,warehouseId:body.toWarehouseId,userId,type:"TRANSFER_IN",quantity:body.quantity,note:body.note}
      ]});
      return {sourceQuantity:current-body.quantity,targetQuantity:Number(target.quantity)};
    });
  }catch(error){
    if(error instanceof Error&&error.message==="INSUFFICIENT_STOCK") return reply.code(409).send({error:"INSUFFICIENT_STOCK"});
    throw error;
  }
});

app.post("/inventory/stocktake",{preHandler:authenticate},async request=>{
  const body=z.object({productId:z.string(),warehouseId:z.string(),quantity:z.number().nonnegative(),note:z.string().max(500).optional()}).parse(request.body);
  const userId=(request.user as {sub:string}).sub;
  return db.$transaction(async tx=>{
    const stock=await tx.stock.upsert({
      where:{productId_warehouseId:{productId:body.productId,warehouseId:body.warehouseId}},
      update:{quantity:body.quantity},
      create:{productId:body.productId,warehouseId:body.warehouseId,quantity:body.quantity}
    });
    await tx.transaction.create({data:{productId:body.productId,warehouseId:body.warehouseId,userId,type:"STOCKTAKE",quantity:body.quantity,note:body.note||"Korekta stanu"}});
    return stock;
  });
});

app.get("/inventory/history",{preHandler:authenticate},async request=>{
  const q=z.object({
    warehouseId:z.string().optional(),productId:z.string().optional(),
    type:z.enum(["RECEIPT","ISSUE","TRANSFER_IN","TRANSFER_OUT","STOCKTAKE"]).optional()
  }).parse(request.query);
  return db.transaction.findMany({
    where:{warehouseId:q.warehouseId,productId:q.productId,type:q.type},
    include:{product:true,warehouse:true,user:{select:{name:true}}},
    orderBy:{createdAt:"desc"},take:500
  });
});

app.get("/licenses",{preHandler:[authenticate,requireAdmin]},async()=>db.license.findMany({
  include:{user:{select:{id:true,name:true,role:true,active:true}}},orderBy:{createdAt:"desc"}
}));
app.post("/licenses",{preHandler:[authenticate,requireAdmin]},async(request,reply)=>{
  const body=z.object({userId:z.string(),key:z.string().min(6).max(100),expiresAt:z.string().datetime().optional().nullable()}).parse(request.body);
  try{
    return await db.license.upsert({
      where:{userId:body.userId},
      update:{key:body.key,expiresAt:body.expiresAt?new Date(body.expiresAt):null,active:true},
      create:{userId:body.userId,key:body.key,expiresAt:body.expiresAt?new Date(body.expiresAt):null}
    });
  }catch{return reply.code(409).send({error:"LICENSE_KEY_ALREADY_EXISTS"});}
});
app.get("/users",{preHandler:[authenticate,requireAdmin]},async()=>db.user.findMany({
  select:{id:true,name:true,role:true,active:true,license:true},orderBy:{name:"asc"}
}));
app.post("/users",{preHandler:[authenticate,requireAdmin]},async(request,reply)=>{
  const body=z.object({name:z.string().min(1).max(120),pin:z.string().regex(/^\d{4,12}$/),role:z.enum(["ADMIN","WORKER"]).default("WORKER")}).parse(request.body);
  const bcrypt=await import("bcryptjs");
  const pinHash=await bcrypt.hash(body.pin,12);
  try{return await db.user.create({data:{name:cleanName(body.name),pinHash,role:body.role}});}
  catch{return reply.code(409).send({error:"USER_CREATE_FAILED"});}
});

app.get("/dashboard",{preHandler:authenticate},async()=>{
  const [products,categories,transactions,lowStock]=await Promise.all([
    db.product.count({where:{active:true}}),
    db.category.count(),
    db.transaction.count(),
    db.product.count({where:{active:true,minStock:{gt:0},stocks:{some:{quantity:{lt:1}}}}})
  ]);
  return {products,categories,transactions,lowStock};
});

await app.listen({port:Number(process.env.API_PORT||4000),host:"0.0.0.0"});
