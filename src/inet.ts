export const inet_aton = (ip: string): number => {
  // split into octets
  const octets = ip.split(".");
  const buffer = new ArrayBuffer(4);
  const dv = new DataView(buffer);
  for (let i = 0; i < 4; i++) {
    dv.setUint8(i, Number.parseInt(octets[i]!));
  }
  return dv.getUint32(0);
};
