export function downloadCsv(
  name: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const escape = (v: string | number) => {
    let text = String(v);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const body =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  saveBlob(
    new Blob([body], { type: "text/csv;charset=utf-8;" }),
    name + ".csv",
  );
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadPdf(
  name: string,
  headers: string[],
  rows: (string | number)[][],
  context: string,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: headers.length > 4 ? "landscape" : "portrait",
  });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const col = (width - 32) / Math.max(headers.length, 1);
  const pageHeader = () => {
    pdf.setFontSize(18);
    pdf.text("mavric. / " + name, 16, 20);
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text("PRESENTACIÓN · DATOS FICTICIOS", 16, 28);
    pdf.text(pdf.splitTextToSize(context, width - 32), 16, 35);
    pdf.setTextColor(30);
    headers.forEach((h, i) =>
      pdf.text(pdf.splitTextToSize(h, col - 4), 16 + i * col, 48),
    );
  };
  pageHeader();
  let y = 60;
  for (const row of rows) {
    const cells = row.map((v) => pdf.splitTextToSize(String(v), col - 4));
    const needed = Math.max(...cells.map((c) => c.length)) * 4 + 5;
    if (y + needed > height - 15) {
      pdf.addPage();
      pageHeader();
      y = 60;
    }
    cells.forEach((cell, i) => pdf.text(cell, 16 + i * col, y));
    y += needed;
  }
  pdf.save(name + ".pdf");
}
export async function putFile(id: string, file: File) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
export async function getFile(id: string): Promise<Blob | undefined> {
  const db = await openDb();
  const result = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction("files");
    const request = tx.objectStore("files").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}
export async function removeFile(id: string) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mavric-documents", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
