import { db } from './db';
import { ApiError } from './http';
// Atomic UPSERT in PostgreSQL avoids concurrent clients evading the counter.
export async function rateLimit(key:string,max:number,seconds:number){
  const result = await db.$queryRaw<{count:number}[]>`
    INSERT INTO "RateLimit" ("key","windowStart","count") VALUES (${key},now(),1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < now() - (${seconds} * interval '1 second') THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < now() - (${seconds} * interval '1 second') THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  if ((result[0]?.count ?? max+1)>max) throw new ApiError(429,'Too many attempts. Try again later.');
}
export function ipFor(request:Request){return (request.headers.get('x-forwarded-for')??'unknown').split(',')[0].trim().slice(0,64);}
