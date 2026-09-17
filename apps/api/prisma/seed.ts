import {PrismaClient,Role} from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma=new PrismaClient();
async function main(){
  const pin=process.env.ADMIN_PIN||"1234";
  const pinHash=await bcrypt.hash(pin,12);
  await prisma.warehouse.upsert({where:{code:"ALKOHOL"},update:{name:"MAGAZYN ALKOHOLE"},create:{code:"ALKOHOL",name:"MAGAZYN ALKOHOLE"}});
  await prisma.warehouse.upsert({where:{code:"NAPOJE"},update:{name:"MAGAZYN NAPOJE"},create:{code:"NAPOJE",name:"MAGAZYN NAPOJE"}});
  await prisma.user.upsert({where:{id:"admin"},update:{name:"Administrator",pinHash,role:Role.ADMIN,active:true},create:{id:"admin",name:"Administrator",pinHash,role:Role.ADMIN}});
  console.log("MAGSTOCK seed OK");
}
main().finally(()=>prisma.$disconnect());
