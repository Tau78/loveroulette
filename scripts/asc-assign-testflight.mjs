#!/usr/bin/env node
// After an IPA upload, App Store Connect has the build but testers only see
// it if the internal group "Test" is linked. hasAccessToAllBuilds is false
// and cannot be patched via API — assign the new build explicitly.
import { createSign, createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY_PATH = join(homedir(), ".app-store/asc-api/AuthKey_5WS8U99P9G.p8");
const KEY_ID = "5WS8U99P9G";
const ISSUER = "a5c2ff50-1df7-493e-a4fa-50ae13cbe810";
const APP_ID = "6805227768";
const GROUP_ID = "85d69403-b714-4acb-b532-4036d6f5f2e8";
const API = "https://api.appstoreconnect.apple.com";
const WANT = process.argv[2] || "";

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  const payload = {
    iss: ISSUER,
    iat: now,
    exp: now + 18 * 60,
    aud: "appstoreconnect-v1",
  };
  const data = `${b64url(header)}.${b64url(payload)}`;
  const key = createPrivateKey(readFileSync(KEY_PATH));
  const sign = createSign("SHA256");
  sign.update(data);
  sign.end();
  const sig = sign.sign({ key, dsaEncoding: "ieee-p1363" });
  return `${data}.${sig.toString("base64url")}`;
}

async function req(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} ${res.status} ${text.slice(0, 800)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function findBuild() {
  const json = await req(
    "GET",
    `/v1/builds?filter[app]=${APP_ID}&sort=-uploadedDate&limit=20`,
  );
  const rows = json.data ?? [];
  if (WANT) {
    const match = rows.find((b) => b.attributes?.version === String(WANT));
    if (match) return match;
  }
  return rows[0] ?? null;
}

async function waitForBuild() {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    const build = await findBuild();
    if (build && (!WANT || build.attributes?.version === String(WANT))) {
      return build;
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  return null;
}

const build = await waitForBuild();
if (!build) {
  console.error(`Nessuna build ${WANT || "recente"} su App Store Connect.`);
  process.exit(1);
}

const version = build.attributes?.version;
await req("POST", `/v1/betaGroups/${GROUP_ID}/relationships/builds`, {
  data: [{ type: "builds", id: build.id }],
});
console.log(`TestFlight gruppo Test → build ${version} (${build.id}).`);
console.log("Tira giù per aggiornare in TestFlight.");
