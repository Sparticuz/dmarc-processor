import { sql } from "drizzle-orm";
import { type ParsedMail } from "mailparser";
import { readFile } from "node:fs/promises";
import { beforeAll, expect, test } from "vitest";

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

beforeAll(async () => {
  const truncate = `TRUNCATE report; TRUNCATE rptrecord;
     INSERT INTO report (serial, domain, org, reportid) VALUES (1, 'test', 'test', 'test')`;
  await pool.execute(sql.raw(truncate));
});

test("parseEmail", async () => {
  const gzipContent = await gzipMime;
  email = await parseEmail(gzipContent.toString());
  const reply = email.inReplyTo;
  expect(reply).toBe("<1692529091.356936@dmarc.yahoo.com>");
});

test("gzip", async () => {
  const attachment = email.attachments[0];
  if (attachment) {
    const gunzippedFile = await gunzipFile(attachment.content);
    xml = [gunzippedFile];
  } else {
    xml = [];
  }
  expect(xml.length > 0).toBe(true);
});

test("zip", async () => {
  const zipContent = await zipMime;
  const email = await parseEmail(zipContent.toString());
  const attachment = email.attachments[0];
  xml = attachment ? await unzipFile(attachment.content) : [];
  expect(xml.length > 0).toBe(true);
});

let parsed: DmarcFeedback;
test("parse xml", () => {
  parsed = xml[0] ? parseXml(xml[0]) : parseXml("<xml></xml>");
  expect(parsed.feedback.report_metadata.org_name).toBe("google.com");
});

test("check if already stored", async () => {
  const bool = await checkIfAlreadyStored("test");
  expect(bool).toBeTruthy();
});

let compressedXml = "";
test("compress xml", async () => {
  compressedXml = xml[0] ? await compressString(xml[0]) : "";
  expect(compressedXml.length).toBeGreaterThan(0);
});

let reportid: number;
test("store report", async () => {
  reportid = await storeReportInDatabase(parsed.feedback, compressedXml);
  expect(reportid).toBeGreaterThan(0);
});

test("records", async () => {
  const bool = await processRecords(reportid, parsed.feedback);
  expect(bool).toBeTruthy();
});
