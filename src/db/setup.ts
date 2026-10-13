import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required before the database can be initialized.");
}

function splitMysqlUrl(url: string) {
  const match = url.match(/^mysql:\/\/([^/]+)\/([^?]+)/);
  if (!match) {
    throw new Error("DATABASE_URL must look like mysql://user:pass@host:3306/database_name");
  }
  return {
    serverUrl: `mysql://${match[1]}`,
    database: match[2],
  };
}

const { serverUrl, database } = splitMysqlUrl(databaseUrl);

const admin = await mysql.createConnection(serverUrl);
try {
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
} finally {
  await admin.end();
}

const connection = await mysql.createConnection({
  uri: databaseUrl,
  multipleStatements: true,
});

try {
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  const statements = schema
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await connection.query(statement);
    } catch (error) {
      const errno = (error as { errno?: number }).errno;
      if (errno === 1061 || errno === 1060) continue;
      throw error;
    }
  }
  await connection.query(
    "ALTER TABLE auctions MODIFY image MEDIUMTEXT NOT NULL",
  );
  console.log(`MySQL database "${database}" is ready.`);
} finally {
  await connection.end();
}
