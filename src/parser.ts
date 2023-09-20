import { XMLParser } from "fast-xml-parser";
import { simpleParser } from "mailparser";

import { type DmarcFeedback } from "./index.js";

const xmlparser = new XMLParser();

export const parseEmail = async (mime: string) => simpleParser(mime, {});
export const parseXml = (xmlString: string): DmarcFeedback =>
  xmlparser.parse(xmlString) as unknown as DmarcFeedback;
