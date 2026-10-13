import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {spawn} from "node:child_process";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../out",
);
const port = Number(process.argv[2] ?? 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer((req, res) => {
  let requestPath;
  try {
    requestPath = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
  } catch {
    res.writeHead(400).end();
    return;
  }
  let file = path.resolve(root, "." + requestPath);
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) throw new Error("not found");
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(file).pipe(res);
  } catch {
    res
      .writeHead(404, { "Content-Type": "text/plain;charset=utf-8" })
      .end("Página no encontrada");
  }
});
server.listen(port, "127.0.0.1", () =>
  { const url="http://127.0.0.1:"+port;console.log("Local: "+url);if(process.argv.includes("--open"))spawn("cmd.exe",["/c","start","",url],{windowsHide:true,stdio:"ignore"}); },
);
