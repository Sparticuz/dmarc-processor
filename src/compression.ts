import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";

import { Open } from "unzipper";

export const gzipPromise = promisify(gzip);
export const gunzipPromise = promisify(gunzip);

export const gunzipFile = async (file: Buffer) => {
  const gunzipedFileBuffer = await gunzipPromise(file);
  return gunzipedFileBuffer.toString();
};

export const unzipFile = async (file: Buffer) => {
  const xml = [];
  const unzippedFileBuffer = await Open.buffer(file);
  for (const file of unzippedFileBuffer.files) {
    xml.push((await file.buffer()).toString());
  }
  return xml;
};

export const compressString = async (uncompressed: string): Promise<string> => {
  return Buffer.from(await gzipPromise(uncompressed)).toString("base64");
};
