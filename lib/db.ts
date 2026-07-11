import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  return drizzle(neon(databaseUrl));
}
