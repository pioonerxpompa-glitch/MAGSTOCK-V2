import bcrypt from "bcryptjs";
import type {FastifyInstance,FastifyRequest} from "fastify";
import {db} from "./db.js";
export async function registerAuth(app:FastifyInstance){await app.register(import("@fastify/jwt"),{secret:process.env.JWT_SECRET||"development-only-secret"});}
export async function authenticate(request:FastifyRequest){await request.jwtVerify();}
export async function loginUser(app:FastifyInstance,pin:string){
  const users=await db.user.findMany({where:{active:true}});
  for(const user of users){
    if(await bcrypt.compare(pin,user.pinHash)){
      if(user.role!=="ADMIN"){
        const license=await db.license.findUnique({where:{userId:user.id}});
        if(!license||!license.active||(license.expiresAt&&license.expiresAt<=new Date())) return {error:"LICENSE_REQUIRED" as const};
      }
      return {token:app.jwt.sign({sub:user.id,role:user.role,name:user.name}),user:{id:user.id,name:user.name,role:user.role}};
    }
  }
  return {error:"INVALID_PIN" as const};
}
