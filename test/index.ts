import { readFile } from "node:fs/promises";

import t from "ava";
import { sql } from "drizzle-orm";
import { type ParsedMail } from "mailparser";

import { compressString, gunzipFile, unzipFile } from "../src/compression.js";
import { pool } from "../src/database.drizzle.js";
import {
  checkIfAlreadyStored,
  processRecords,
  storeReportInDatabase,
  type DmarcFeedback,
} from "../src/index.js";
import { parseEmail, parseXml } from "../src/parser.js";

const gzipMime = readFile("./test/payloads/gzipMime");
const zipMime = readFile("./test/payloads/zipMime");

let email: ParsedMail;
let xml: string[];

t.before("put a test record in", async (t) => {
  const truncate = `TRUNCATE report; TRUNCATE rptrecord;
     INSERT INTO report (serial, domain, org, reportid) VALUES (1, 'test', 'test', 'test')`;
  pool.execute(sql.raw(`${truncate}`));
  t.pass();
});

t.serial("test parseEmail", async (t) => {
  // @ts-expect-error I know it's a ParsedMail
  email = parseEmail((await gzipMime).toString());
  const reply = (await email).inReplyTo;
  t.is(reply, "<1692529091.356936@dmarc.yahoo.com>");
});

t.serial("test gzip", async (t) => {
  const attachment = (await email).attachments[0];
  xml = [await gunzipFile(attachment!.content)];
  // t.log(xml);
  t.pass();
});

t.serial("test zip", async (t) => {
  const email = parseEmail((await zipMime).toString());
  const attachment = (await email).attachments[0];
  xml = await unzipFile(attachment!.content);

  t.pass();
});

let parsed: DmarcFeedback;
t.serial("parse xml", (t) => {
  parsed = parseXml(xml[0]!);
  // t.log(parsed.feedback.record);
  t.is(parsed.feedback.report_metadata.org_name, "google.com");
});

t("check if already stored", async (t) => {
  const bool = await checkIfAlreadyStored("test");
  t.is(bool, true);
});

let compressedXml = "";
t.serial("compress xml", async (t) => {
  compressedXml = await compressString(xml[0]!);
  t.is(compressedXml.length > 0, true);
});

let reportid: number;
t.serial("test store report", async (t) => {
  reportid = await storeReportInDatabase(parsed.feedback, compressedXml);
  t.is(reportid > 0, true);
});

t.serial("test records", async (t) => {
  const bool = await processRecords(reportid, parsed.feedback);
  t.is(bool, true);
});
