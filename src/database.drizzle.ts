import { drizzle } from "drizzle-orm/mysql2";
import { createConnection, createPool } from "mysql2/promise";

import * as schema from "./schema.js";

const poolConnection = createPool({
  connectionLimit: 10,
  database: process.env["DATABASE"],
  host: process.env["HOST"],
  multipleStatements: true,
  password: process.env["PASSWORD"],
  user: process.env["USER"],
});

export const pool = drizzle(poolConnection, { schema, mode: "default" });

const connection = await createConnection({
  connectionLimit: 10,
  database: process.env["DATABASE"],
  host: process.env["HOST"],
  multipleStatements: true,
  password: process.env["PASSWORD"],
  user: process.env["USER"],
});

export const single = drizzle(connection, { schema, mode: "default" });
