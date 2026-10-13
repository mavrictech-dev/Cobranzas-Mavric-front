// Artificial GPS metadata for a synthetic test image. No customer photo is used.
export function jpegWithGps(image = new Uint8Array([255, 216, 255, 217])) {
  const tiff = new Uint8Array(128);
  const view = new DataView(tiff.buffer);
  const short = (offset, value) => view.setUint16(offset, value, true);
  const long = (offset, value) => view.setUint32(offset, value, true);
  tiff.set([73, 73]);
  short(2, 42);
  long(4, 8);
  short(8, 1);
  short(10, 0x8825);
  short(12, 4);
  long(14, 1);
  long(18, 26);
  short(26, 4);
  const entry = (offset, tag, type, count, value) => {
    short(offset, tag);
    short(offset + 2, type);
    long(offset + 4, count);
    long(offset + 8, value);
  };
  entry(28, 1, 2, 2, 83); // S: south.
  entry(40, 2, 5, 3, 80);
  entry(52, 3, 2, 2, 87); // W: west.
  entry(64, 4, 5, 3, 104);
  [12, 7, 12, 77, 1, 48].forEach((value, index) => {
    long(80 + index * 8, value);
    long(84 + index * 8, 1);
  });
  const payload = new Uint8Array(134);
  payload.set([69, 120, 105, 102, 0, 0]);
  payload.set(tiff, 6);
  const segment = new Uint8Array(payload.length + 4);
  segment.set([255, 225, 0, payload.length + 2]);
  segment.set(payload, 4);
  const jpeg = new Uint8Array(image.length + segment.length);
  jpeg.set(image.subarray(0, 2));
  jpeg.set(segment, 2);
  jpeg.set(image.subarray(2), 2 + segment.length);
  return jpeg;
}
