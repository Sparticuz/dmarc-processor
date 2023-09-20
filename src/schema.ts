import {
  binary,
  customType,
  index,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const unsignedBigint = customType<{ data: number }>({
  dataType() {
    return "bigint UNSIGNED";
  },
});

const unsignedTinyint = customType<{ data: number }>({
  dataType() {
    return "tinyint UNSIGNED";
  },
});

const unsignedInt = customType<{ data: number }>({
  dataType() {
    return "int UNSIGNED";
  },
});

export const report = mysqlTable(
  "report",
  {
    serial: serial("serial"),
    mindate: timestamp("mindate", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
    maxdate: timestamp("maxdate"),
    domain: varchar("domain", { length: 255 }).notNull(),
    org: varchar("org", { length: 255 }).notNull(),
    reportid: varchar("reportid", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    extra_contact_info: varchar("extra_contact_info", { length: 255 }),
    policy_adkim: varchar("policy_adkim", { length: 20 }),
    policy_aspf: varchar("policy_aspf", { length: 20 }),
    policy_p: varchar("policy_p", { length: 20 }),
    policy_sp: varchar("policy_sp", { length: 20 }),
    policy_pct: unsignedTinyint("policy_pct"),
    raw_xml: mediumtext("raw_xml"),
  },
  (report) => ({
    domainIndex: uniqueIndex("domain_idx")
      .on(report.domain, report.org, report.reportid)
      .using("btree"),
  }),
);

export const rptrecord = mysqlTable(
  "rptrecord",
  {
    id: serial("id"),
    serial: unsignedBigint("serial")
      .notNull()
      .references(() => report.serial, { onDelete: "cascade" }),
    ip: unsignedInt("ip"),
    ip6: binary("ip6"),
    rcount: unsignedInt("rcount").notNull(),
    disposition: mysqlEnum("disposition", [
      "none",
      "quarantine",
      "reject",
      "unknown",
    ]),
    reason: varchar("reason", { length: 255 }),
    dkimdomain: varchar("dkimdomain", { length: 255 }),
    dkimresult: mysqlEnum("dkimresult", [
      "none",
      "pass",
      "fail",
      "neutral",
      "policy",
      "temperror",
      "permerror",
      "unknown",
    ]),
    spfdomain: varchar("spfdomain", { length: 255 }),
    spfresult: mysqlEnum("spfresult", [
      "none",
      "neutral",
      "pass",
      "fail",
      "softfail",
      "temperror",
      "permerror",
      "unknown",
    ]),
    spf_align: mysqlEnum("spf_align", ["fail", "pass", "unknown"]).notNull(),
    dkim_align: mysqlEnum("dkim_align", ["fail", "pass", "unknown"]).notNull(),
    identifier_hfrom: varchar("identifier_hfrom", { length: 255 }),
  },
  (rptrecord) => ({
    serialIndex: index("serial_idx")
      .on(rptrecord.serial, rptrecord.ip)
      .using("btree"),
    serial6Index: index("serial6_idx")
      .on(rptrecord.serial, rptrecord.ip6)
      .using("btree"),
  }),
);
