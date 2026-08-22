// Mo khoa cac tai khoan bi lockout giua cac luot do (§6 doi ghi lai thu tuc nay).
//
// CO CHE (backend/server.js):
//   - Moi lan dang nhap SAI: login_attempts += 2  (server.js:54)
//   - Khoa khi login_attempts >= 3                (server.js:56)  -> tuc SAU 2 LAN SAI
//   - Thoi gian khoa: Date.now() + 180000 = 180s  (server.js:57)
//   - Dang nhap DUNG: reset login_attempts = 0, locked_until = NULL (server.js:48)
//
// BAY QUAN TRONG: khi tai khoan DANG bi khoa, server tra 403 va `return` NGAY o
// server.js:40 — TRUOC khi so mat khau. Nghia la dang nhap dung KHONG mo khoa duoc
// trong luc con khoa; phai doi het 180s roi moi login dung de reset bo dem.
//
// Cach goi:
//   node tools/reset-lockout.mjs            mo khoa (login dung tung tai khoan)
//   node tools/reset-lockout.mjs --check    chi bao cao, khong thay doi gi
//   node tools/reset-lockout.mjs --wait     doi toi khi moi tai khoan mo duoc (toi da 200s)
//   node tools/reset-lockout.mjs --hard     reset DB triet de (XOA SACH du lieu da seed!)

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const API_URL = process.env.API_URL || "http://127.0.0.1:3000";
const PASSWORD = "Test1234!";
const BATCH = 20;
const LOCK_SECONDS = 180;

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const WAIT = args.includes("--wait");
const HARD = args.includes("--hard");

function readEmails(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return [];
  const lines = readFileSync(abs, "utf8").split("\n").filter((l) => l.trim());
  return lines.slice(1).map((l) => l.split(",")[0].trim()).filter(Boolean);
}

// TIMEOUT LA BAT BUOC: neu backend treo o mot request bat ky (vd dang bi OOM, hay
// dang xu ly 200 request khac), fetch() KHONG co timeout se cho MAI MAI — va vi
// tryLogin() duoc goi tuan tu qua tung batch, MOT request treo se ket toan bo
// pipeline reset-lockout, roi keo theo run-scenario.mjs, HANG GIO khong bao loi gi.
// Da xay ra that: mot lan chay --smoke bi treo hon 6 tieng vi ly do nay.
const FETCH_TIMEOUT_MS = 15000;

async function tryLogin(email) {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return res.status;
  } catch (e) {
    return 0;
  }
}

// --check phai THAT SU chi doc. Neu dung `POST /api/login` de kiem thi chinh viec kiem
// da lam reset login_attempts ve 0 tren moi tai khoan chua bi khoa (server.js:48) —
// tuc la "phep do" lam thay doi thu dang do. Dung GET /api/admin/users thay the:
// endpoint nay tra thang login_attempts va locked_until, khong dung toi gi ca.
async function inspectReadOnly(emailSet) {
  const login = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@eshop.com", password: "Admin123!" }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!login.ok) throw new Error(`khong dang nhap duoc admin (HTTP ${login.status})`);
  const { token } = await login.json();

  const res = await fetch(`${API_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GET /api/admin/users tra HTTP ${res.status}`);
  const users = await res.json();

  const now = Date.now();
  const ok = [], locked = [], missing = [];
  const byEmail = new Map(users.map((u) => [u.email, u]));
  for (const email of emailSet) {
    const u = byEmail.get(email);
    if (!u) { missing.push({ email, status: "khong co trong DB" }); continue; }
    const until = u.locked_until ? new Date(u.locked_until).getTime() : 0;
    if (until > now) locked.push({ email, secondsLeft: Math.ceil((until - now) / 1000), attempts: u.login_attempts });
    else ok.push(email);
  }
  return { ok, locked, other: missing };
}

async function probeAll(emails) {
  const locked = [];
  const ok = [];
  const other = [];
  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (e) => [e, await tryLogin(e)]));
    for (const [email, status] of results) {
      if (status === 200) ok.push(email);
      else if (status === 403) locked.push(email);
      else other.push({ email, status });
    }
    process.stdout.write(`\r  da kiem ${Math.min(i + BATCH, emails.length)}/${emails.length}`);
  }
  process.stdout.write("\n");
  return { ok, locked, other };
}

async function hardReset() {
  console.log("\n[--hard] CANH BAO: cach nay chay `node database.js` trong thu muc backend,");
  console.log("         tuc XOA SACH va seed lai DB — mat toan bo 400 tai khoan va 20.000");
  console.log("         san pham da seed o docs/03. Sau do PHAI chay lai:");
  console.log("             npm run seed:perf -- --users 200 --products 20000\n");

  const backend = join(ROOT, "..", "..", "HW02-new", "eshop-sut-main", "backend");
  if (!existsSync(join(backend, "database.js"))) {
    console.error(`[FAIL] Khong tim thay database.js o ${backend}`);
    process.exit(1);
  }
  console.log(`Dang chay: node database.js  (cwd=${backend})`);
  const { stdout } = await execFileAsync("node", ["database.js"], { cwd: backend, timeout: 60000 });
  console.log(stdout.trim());
  console.log("\n[OK] DB da reset. NHO seed lai du lieu hieu nang truoc khi chay luot do.");
}

async function main() {
  if (HARD) {
    await hardReset();
    return;
  }

  const validEmails = readEmails("data/users.csv");
  const lockEmails = readEmails("data/users_lockout.csv");
  const all = [...validEmails, ...lockEmails];

  if (all.length === 0) {
    console.error("[FAIL] Khong doc duoc data/users.csv va data/users_lockout.csv — chay `npm run seed:perf` truoc.");
    process.exit(1);
  }

  console.log(`== Reset lockout — ${validEmails.length} tai khoan hop le + ${lockEmails.length} tai khoan moi ==`);
  console.log(`   API: ${API_URL} · mat khau dung: ${PASSWORD}`);

  if (CHECK_ONLY) {
    console.log("   Che do: --check — CHI DOC qua GET /api/admin/users, khong dung toi gi\n");
    const { ok, locked, other } = await inspectReadOnly(all);
    console.log("== Ket qua (chi doc) ==");
    console.log(`  Khong bi khoa:  ${ok.length}`);
    console.log(`  Dang bi khoa:   ${locked.length}`);
    if (other.length) console.log(`  Khong thay trong DB: ${other.length}`);
    if (locked.length) {
      const maxLeft = Math.max(...locked.map((l) => l.secondsLeft));
      console.log(`\n  Con phai doi toi da ${maxLeft}s de tat ca het khoa.`);
      console.log("  Chi tiet (toi da 5 dong):");
      for (const l of locked.slice(0, 5)) {
        console.log(`    ${l.email} — con ${l.secondsLeft}s, login_attempts=${l.attempts}`);
      }
      process.exit(2);
    }
    console.log("\n[OK] Khong co tai khoan nao dang bi khoa.");
    return;
  }

  console.log("   Dang nhap DUNG tung tai khoan -> reset login_attempts ve 0\n");

  let { ok, locked, other } = await probeAll(all);

  if (WAIT && locked.length > 0) {
    const deadline = Date.now() + (LOCK_SECONDS + 20) * 1000;
    while (locked.length > 0 && Date.now() < deadline) {
      const remain = Math.ceil((deadline - Date.now()) / 1000);
      console.log(`\n  Con ${locked.length} tai khoan bi khoa. Doi 15s roi thu lai (toi da con ${remain}s)...`);
      await new Promise((r) => setTimeout(r, 15000));
      const retry = await probeAll(locked);
      ok = ok.concat(retry.ok);
      locked = retry.locked;
      other = other.concat(retry.other);
    }
  }

  console.log("\n== Ket qua ==");
  console.log(`  Mo duoc (HTTP 200, bo dem da reset ve 0): ${ok.length}`);
  console.log(`  Con bi khoa (HTTP 403):                   ${locked.length}`);
  console.log(`  Trang thai khac:                          ${other.length}`);

  if (other.length > 0) {
    console.log("\n  Chi tiet trang thai khac (toi da 5 dong):");
    for (const o of other.slice(0, 5)) console.log(`    ${o.email} -> HTTP ${o.status || "khong ket noi duoc"}`);
  }

  if (locked.length > 0) {
    console.log(`\n  [CHUA XONG] ${locked.length} tai khoan van dang bi khoa.`);
    console.log(`  Khoa keo dai ${LOCK_SECONDS}s va KHONG mo duoc bang cach dang nhap dung`);
    console.log(`  (server.js:40 tra 403 truoc khi so mat khau). Cach xu ly:`);
    console.log(`    - doi toi da ${LOCK_SECONDS}s roi chay lai, hoac`);
    console.log(`    - chay: node tools/reset-lockout.mjs --wait`);
    console.log(`  Vi du 3 tai khoan con khoa: ${locked.slice(0, 3).join(", ")}`);
    process.exit(2);
  }

  console.log("\n[OK] Khong con tai khoan nao bi khoa — san sang chay luot tiep theo.");
  console.log("     Nho cooldown >= 90 giay truoc khi bat dau, va ghi moc gio vao results/run-log.md.");
}

main().catch((e) => {
  console.error("Loi khong mong doi:", e);
  process.exit(1);
});
