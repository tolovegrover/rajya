#!/usr/bin/env node
// Invite testers to the newest Rajya build already on Firebase App Distribution.
// No rebuild, no upload — it just distributes the latest release to more people.
//
// Usage: node scripts/invite.mjs a@x.com b@y.com …
import crypto from "crypto";
import fs from "fs";

const APP_ID = "1:848967463250:android:b59d6ec833b7912df0ca8b";
const SA = process.env.FIREBASE_SA_KEY
  || `${process.env.HOME}/claudelovegrover.com/lovegrover-firebase-adminsdk-yv3jz-5f5b6993e1.json`;

const emails = process.argv.slice(2).flatMap((a) => a.split(",")).map((s) => s.trim()).filter(Boolean);
if (!emails.length) {
  console.error("usage: node scripts/invite.mjs tester@example.com [more@example.com …]");
  process.exit(1);
}
const bad = emails.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
if (bad.length) {
  console.error("not an email address:", bad.join(", "));
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(SA, "utf8"));
const b64 = (b) => Buffer.from(b).toString("base64url");
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const c = b64(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const s = crypto.createSign("RSA-SHA256"); s.update(`${h}.${c}`);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${h}.${c}.${b64(s.sign(sa.private_key))}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("auth failed: " + JSON.stringify(j).slice(0, 150));
  return j.access_token;
}

const at = await token();
const api = (path, init = {}) => fetch(`https://firebaseappdistribution.googleapis.com/v1/${path}`, {
  ...init,
  headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json", ...(init.headers || {}) },
});

const projectNum = APP_ID.split(":")[1];
const list = await api(`projects/${projectNum}/apps/${APP_ID}/releases?pageSize=1&orderBy=createTime desc`).then((r) => r.json());
const release = list.releases?.[0];
if (!release) throw new Error("no releases found — run ./release.sh first");

const dist = await api(`${release.name}:distribute`, { method: "POST", body: JSON.stringify({ testerEmails: emails }) });
if (!dist.ok) throw new Error("distribute failed: " + (await dist.text()).slice(0, 200));

console.log(`invited ${emails.length} tester(s) to ${release.displayVersion} (build ${release.buildVersion})`);
console.log("they get an email from Firebase; it walks them through installing App Tester.");
console.log(`share link: ${release.testingUri ?? "(enable a public link in the Firebase console)"}`);
