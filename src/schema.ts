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
    domain: varchar("domain", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    extra_contact_info: varchar("extra_contact_info", { length: 255 }),
    maxdate: timestamp("maxdate"),
    mindate: timestamp("mindate", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
    org: varchar("org", { length: 255 }).notNull(),
    policy_adkim: varchar("policy_adkim", { length: 20 }),
    policy_aspf: varchar("policy_aspf", { length: 20 }),
    policy_p: varchar("policy_p", { length: 20 }),
    policy_sp: varchar("policy_sp", { length: 20 }),
    policy_pct: unsignedTinyint("policy_pct"),
    raw_xml: mediumtext("raw_xml"),
    reportid: varchar("reportid", { length: 255 }).notNull(),
    serial: serial("serial"),
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
    serial: unsignedBigint("serial")
      .notNull()
      .references(() => report.serial, { onDelete: "cascade" }),
    ip: unsignedInt("ip"),
    rcount: unsignedInt("rcount").notNull(),
    disposition: mysqlEnum("disposition", [
      "none",
      "quarantine",
      "reject",
      "unknown",
    ]),
    dkim_align: mysqlEnum("dkim_align", ["fail", "pass", "unknown"]).notNull(),
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
    id: serial("id"),
    identifier_hfrom: varchar("identifier_hfrom", { length: 255 }),
    ip6: binary("ip6"),
    reason: varchar("reason", { length: 255 }),
    serial: serial("serial")
      .notNull()
      .references(() => report.serial, { onDelete: "cascade" }),
    spf_align: mysqlEnum("spf_align", ["fail", "pass", "unknown"]).notNull(),
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
  },
  (rptrecord) => ({
    serial6Index: index("serial6_idx")
      .on(rptrecord.serial, rptrecord.ip6)
      .using("btree"),
    serialIndex: index("serial_idx")
      .on(rptrecord.serial, rptrecord.ip)
      .using("btree"),
  }),
);
