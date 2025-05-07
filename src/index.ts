import { eq, sql } from "drizzle-orm";
// This is actually a package name
// eslint-disable-next-line n/no-missing-import
import ipaddr from "ipaddr.js";

import { getStringFromS3 } from "./aws.s3.js";
import { compressString, gunzipFile, unzipFile } from "./compression.js";
import { pool as database } from "./database.drizzle.js";
import { parseEmail, parseXml } from "./parser.js";
import { report, rptrecord } from "./schema.js";

enum ALLOWED_DISPOSITION {
  "none",
  "quarantine",
  "reject",
  "unknown",
}

enum ALLOWED_DKIM_ALIGN {
  "fail",
  "pass",
  "unknown",
}

enum ALLOWED_DKIMRESULT {
  "none",
  "pass",
  "fail",
  "neutral",
  // "softfail",
  "policy",
  "temperror",
  "permerror",
  "unknown",
}

enum ALLOWED_SPF_ALIGN {
  "fail",
  "pass",
  "unknown",
}

enum ALLOWED_SPFRESULT {
  "none",
  "neutral",
  "pass",
  "fail",
  "softfail",
  "temperror",
  "permerror",
  "unknown",
}

export interface DmarcFeedback {
  feedback: {
    policy_published: {
      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      adkim: "r" | string;
      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      aspf: "r" | string;
      domain: string;
      p: string;
      pct: number;
      sp: string;
    };
    record: DmarcRecord | DmarcRecord[];
    report_metadata: {
      date_range: {
        begin: number;
        end: number;
      };
      email: string;
      extra_contact_info: string;
      org_name: string;
      report_id: string;
    };
  };
}

interface DmarcRecord {
  auth_results: {
    dkim?: {
      domain: string;
      result: ALLOWED_DKIMRESULT;
      selector: string;
    };
    spf: {
      domain: string;
      result: ALLOWED_SPFRESULT;
    };
  };
  identifiers: {
    header_from: string;
  };
  row: {
    count: number;
    policy_evaluated: {
      disposition: ALLOWED_DISPOSITION;
      dkim: ALLOWED_DKIM_ALIGN;
      spf: ALLOWED_SPF_ALIGN;
    };
    source_ip: string;
  };
}

export const checkIfAlreadyStored = async (
  reportid: string,
): Promise<boolean> => {
  const result = await database
    .select()
    .from(report)
    .where(eq(report.reportid, reportid));

  return result.length > 0;
};

export const storeReportInDatabase = async (
  record: DmarcFeedback["feedback"],
  xml: string,
): Promise<number> => {
  const [results] = await database.insert(report).values({
    domain: record.policy_published.domain,
    email: record.report_metadata.email,
    extra_contact_info: record.report_metadata.extra_contact_info,
    maxdate: new Date(record.report_metadata.date_range.end * 1000),
    mindate: new Date(record.report_metadata.date_range.begin * 1000),
    org: record.report_metadata.org_name,
    policy_adkim: record.policy_published.adkim,
    policy_aspf: record.policy_published.aspf,
    policy_p: record.policy_published.p,
    policy_pct: record.policy_published.pct,
    policy_sp: record.policy_published.sp,
    raw_xml: await compressString(xml),
    reportid: record.report_metadata.report_id,
  });

  return results.insertId;
};

export const processRecords = async (
  reportId: number,
  records: DmarcFeedback["feedback"],
): Promise<boolean> => {
  const ipv4Records = [];
  const ipv6Records = [];

  const payloads =
    Symbol.iterator in records.record ? records.record : [records.record];

  for (const record of payloads) {
    // console.log(`Processing ${JSON.stringify(record)}`);

    const ipInfo = ipaddr.parse(record.row.source_ip);
    if (ipInfo.kind() === "ipv4") {
      ipv4Records.push({
        disposition: record.row.policy_evaluated.disposition,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        dkim_align: record.row.policy_evaluated.dkim ?? "unknown",
        dkimdomain: record.auth_results.dkim?.domain ?? null,
        dkimresult: record.auth_results.dkim?.result ?? null,
        identifier_hfrom: record.identifiers.header_from,
        ip: sql`INET_ATON(${record.row.source_ip})`,
        rcount: record.row.count,
        reason: null,
        serial: reportId,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        spf_align: record.row.policy_evaluated.spf ?? "unknown",
        spfdomain: record.auth_results.spf.domain,
        spfresult: record.auth_results.spf.result,
      });
    } else {
      ipv6Records.push({
        disposition: record.row.policy_evaluated.disposition,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        dkim_align: record.row.policy_evaluated.dkim ?? "unknown",
        dkimdomain: record.auth_results.dkim?.domain ?? null,
        dkimresult: record.auth_results.dkim?.result ?? null,
        identifier_hfrom: record.identifiers.header_from,
        ip6: sql`INET6_ATON(${record.row.source_ip})`,
        rcount: record.row.count,
        reason: null,
        serial: reportId,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        spf_align: record.row.policy_evaluated.spf ?? "unknown",
        spfdomain: record.auth_results.spf.domain,
        spfresult: record.auth_results.spf.result,
      });
    }
  }

  const queries = [
    ipv4Records.length > 0
      ? // @ts-expect-error it works, i think this is from the enums
        await database.insert(rptrecord).values(ipv4Records)
      : undefined,
    ipv6Records.length > 0
      ? // @ts-expect-error it works, i think this is from the enums
        await database.insert(rptrecord).values(ipv6Records)
      : undefined,
  ];

  await Promise.allSettled(queries);

  return true;
};

/* c8 ignore start */
const index = async (event: AWSLambda.S3Event): Promise<void> => {
  console.log(JSON.stringify(event));
  for (const record of event.Records) {
    // record

    // First, Get the attachment
    const email = await getStringFromS3(
      record.s3.bucket.name,
      record.s3.object.key,
    );

    // Parse the email
    const parsedMessage = await parseEmail(email);

    let xml: string[] = [];
    // Process the attachments, get a string returned
    for (const attachment of parsedMessage.attachments) {
      if (
        attachment.contentType === "application/gzip" ||
        attachment.contentType === "application/x-gzip"
      ) {
        // gz files
        xml.push(await gunzipFile(attachment.content));
      } else if (
        attachment.contentType === "application/zip" ||
        attachment.contentType === "application/x-zip-compressed"
      ) {
        // zip files
        xml = await unzipFile(attachment.content);
      } else {
        throw new Error(`Invalid Content Type: ${attachment.contentType}`);
      }
    }

    for (const singleXml of xml) {
      // Parse the xml
      const record = parseXml(singleXml);

      // Skip if it's already in the database
      const isAlreadyInDatabase = await checkIfAlreadyStored(
        record.feedback.report_metadata.report_id,
      );

      if (!isAlreadyInDatabase) {
        // Insert the Report
        const reportId = storeReportInDatabase(record.feedback, singleXml);

        // Process the Records
        const records = processRecords(await reportId, record.feedback);

        await records;
      }
    }
  }
};
export default index;
/* c8 ignore end */
