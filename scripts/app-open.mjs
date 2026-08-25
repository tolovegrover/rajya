#!/usr/bin/env node
// Upload an APK to Firebase App Distribution AND publish it to an open tester
// GROUP with a public join link — friends sign in with Google and get access,
// no per-email invites.
//
// Usage: node app-open.mjs <apk> <appId> <releaseNotes> [groupAlias]
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const [apk, appId, notes, aliasArg] = process.argv.slice(2);
if (!apk || !appId) {
  console.error("usage: app-open.mjs <apk> <appId> <notes> [groupAlias]");
  process.exit(1);
}
const alias = aliasArg || "rajya";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const home = process.env.HOME || "";
const saCandidates = [
  process.env.FIREBASE_SA_KEY,
  ...fs.readdirSync(path.join(repoRoot, "..")).filter((f) => /-firebase-adminsdk-.*\.json$/.test(f)).map((f) => path.join(repoRoot, "..", f)),
  ...(home ? fs.readdirSync(path.join(home, "claudelovegrover.com")).filter((f) => /-firebase-adminsdk-.*\.json$/.test(f)).map((f) => path.join(home, "claudelovegrover.com", f)) : []),
];
const saPath = saCandidates.find((p) => p && fs.existsSync(p));
if (!saPath) {
  console.error("no firebase-adminsdk key found (set FIREBASE_SA_KEY or place it in ~)");
  process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
const projectNum = appId.split(":")[1];

const b64url = (b) => Buffer.from(b).toString("base64url");
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const s = crypto.createSign("RSA-SHA256");
  s.update(`${header}.${claim}`);
  const assertion = `${header}.${claim}.${b64url(s.sign(sa.private_key))}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("auth failed: " + JSON.stringify(j).slice(0, 150));
  return j.access_token;
}

const at = await token();
const base = "https://firebaseappdistribution.googleapis.com/v1";

// 1. upload
const bin = fs.readFileSync(apk);
const up = await fetch(`https://firebaseappdistribution.googleapis.com/upload/v1/projects/${projectNum}/apps/${appId}/releases:upload`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${at}`,
    "Content-Type": "application/octet-stream",
    "X-Goog-Upload-Protocol": "raw",
    "X-Goog-Upload-File-Name": path.basename(apk),
  },
  body: bin,
});
const upJ = await up.json();
if (!up.ok) throw new Error("upload failed: " + JSON.stringify(upJ).slice(0, 250));
console.log("uploaded, processing…");

let release = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const op = await fetch(`${base}/${upJ.name}`, { headers: { Authorization: `Bearer ${at}` } }).then((r) => r.json());
  if (op.done) {
    release = op.response?.release?.name;
    console.log("result:", op.response?.result);
    break;
  }
}
if (!release) throw new Error("processing timed out");

if (notes) {
  await fetch(`${base}/${release}?updateMask=releaseNotes.text`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
    body: JSON.stringify({ releaseNotes: { text: notes } }),
  });
}

// 2. ensure the open tester group exists (create once with a fixed groupId — that id is the join-link alias)
let groupAlias = alias;
try {
  const existing = await fetch(`${base}/projects/${projectNum}/groups/${alias}`, { headers: { Authorization: `Bearer ${at}` } });
  if (existing.ok) {
    console.log("group exists:", alias);
  } else if (existing.status === 404) {
    const cr = await fetch(`${base}/projects/${projectNum}/groups?groupId=${alias}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Rajya — open testers" }),
    });
    if (!cr.ok) throw new Error("group create failed: " + JSON.stringify(await cr.json()).slice(0, 200));
    console.log("group created:", alias);
  } else {
    throw new Error("group lookup failed: " + existing.status);
  }
} catch (e) {
  console.log("group note:", e instanceof Error ? e.message : String(e));
  process.exit(1);
}

// 3. distribute to the group (link joiners get it immediately)
const dist = await fetch(`${base}/${release}:distribute`, {
  method: "POST",
  headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
  body: JSON.stringify({ groupAliases: [groupAlias] }),
});
if (!dist.ok) throw new Error("distribute failed: " + (await dist.text()).slice(0, 250));
console.log("distributed to group", groupAlias);
console.log("\n✅ OPEN TESTING LINK — send this to friends:");
console.log(`   https://appdistribution.firebase.google.com/join/${groupAlias}`);
console.log("   (they sign in with any Google account; no email invite needed)");
