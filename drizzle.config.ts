// eslint-disable-next-line n/no-unpublished-import
import type { Config } from "drizzle-kit";

export default {
  dbCredentials: {
    database: "dmarc",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    host: process.env.DB_HOST!,
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
  },
  dialect: "mysql",
  out: "./drizzle",
  schema: "./src/schema/*",
} satisfies Config;
