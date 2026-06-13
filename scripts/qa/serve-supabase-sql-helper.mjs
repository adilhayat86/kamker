import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const port = Number(process.env.KAMKER_SQL_HELPER_PORT || "8787");
const host = "127.0.0.1";
const phoneOnly = process.argv.includes("--phone-only");
const sqlPath = path.join(root, "tmp", "kamker-mvp-production.sql");
const htmlPath = path.join(root, "tmp", "kamker-mvp-production.html");

function main() {
  const buildArgs = ["scripts/qa/build-mvp-supabase-sql.mjs"];

  if (phoneOnly) {
    buildArgs.push("--phone-only");
  }

  const build = spawnSync(process.execPath, buildArgs, {
    cwd: root,
    encoding: "utf8",
  });

  if (build.status !== 0) {
    console.error(build.stderr || build.stdout || "Could not build SQL helper.");
    process.exit(build.status ?? 1);
  }

  if (!fs.existsSync(sqlPath) || !fs.existsSync(htmlPath)) {
    console.error("SQL helper files were not generated.");
    process.exit(1);
  }

  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (url.pathname === "/sql") {
      sendText(response, fs.readFileSync(sqlPath, "utf8"), "text/plain; charset=utf-8");
      return;
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      sendText(response, fs.readFileSync(htmlPath, "utf8"), "text/html; charset=utf-8");
      return;
    }

    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });

  server.listen(port, host, () => {
    console.log(JSON.stringify({
      ok: true,
      url: `http://${host}:${port}/`,
      sqlUrl: `http://${host}:${port}/sql`,
      sqlPath,
      htmlPath,
      nextStep: "Open the URL, click Copy SQL, paste into Supabase SQL Editor, run it, then npm run qa:mvp-readiness.",
    }, null, 2));
  });
}

function sendText(response, body, contentType) {
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": contentType,
  });
  response.end(body);
}

main();
