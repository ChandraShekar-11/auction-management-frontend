import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./schema";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env and configure MySQL.");
}

export const pool = mysql.createPool(databaseUrl);
export const db = drizzle(pool, { schema, mode: "default" });
