import { drizzle } from "drizzle-orm/mysql2";
import { createConnection, createPool } from "mysql2/promise";

import * as schema from "./schema.js";

const poolConnection = await createPool({
  connectionLimit: 10,
  database: "dmarc",
  host: process.env["DB_HOST"],
  multipleStatements: true,
  password: process.env["DB_PASS"],
  user: process.env["DB_USER"],
});

export const pool = drizzle(poolConnection, { schema, mode: "default" });

const connection = await createConnection({
  connectionLimit: 10,
  database: "dmarc",
  host: process.env["DB_HOST"],
  multipleStatements: true,
  password: process.env["DB_PASS"],
  user: process.env["DB_USER"],
});

export const single = drizzle(connection, { schema, mode: "default" });
