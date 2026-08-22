// Chay MOT luot do hoan chinh: reset lockout -> lay mau tai nguyen -> chay JMeter
// -> sinh dashboard -> ghi run-log. Moi bang chung sinh ra deu khop moc thoi gian.
//
// Cach goi:
//   node tools/run-scenario.mjs Load           chay that
//   node tools/run-scenario.mjs Stress --dry   chi in ra se lam gi roi thoat
//   node tools/run-scenario.mjs Spike --no-reset   bo qua buoc reset lockout
//
// §11 doi ba thu phai khop nhau:
//   run-log.md (gio bat dau/ket thuc)  <->  .jtl (timeStamp)  <->  anh (dong ho trong anh)
// Script nay lo hai cai dau; cai thu ba la viec cua ban — script se dem nguoc toi
// dung giay can chup.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, appendFileSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const JMETER = process.env.JMETER_BIN || "D:\\jmeter\\apache-jmeter-5.6.3\\bin\\jmeter.bat";
const STUDENT_ID = "23127183";
const API_URL = process.env.API_URL || "http://127.0.0.1:3000";

// Giay thu may nen chup anh Task Manager, tinh tu luc bat dau luot.
// Can cu: xem docs/07 §4.2 — luon chup GIUA vung tai cao nhat, khong chup luc ramp.
const SHOT_AT = { Load: 180, Stress: 350, Spike: 75, Soak: 400 };

const args = process.argv.slice(2);
const scenario = args.find((a) => !a.startsWith("--"));
const DRY = args.includes("--dry");
const NO_RESET = args.includes("--no-reset");
// --smoke: chay rut gon 2 VU x 40s de KIEM CHUNG duong ong (reset -> sampler -> JMeter ->
// dashboard -> run-log) ma khong tot mot luot chinh thuc. Chi co tac dung voi Load/Soak
// (hai scenario mot thread group, nhan duoc -Jthreads/-Jduration).
const SMOKE = args.includes("--smoke");

if (!scenario || !SHOT_AT[scenario]) {
  console.error("Cach goi: node tools/run-scenario.mjs <Load|Stress|Spike|Soak> [--dry] [--no-reset]");
  process.exit(1);
}

const isSoak = scenario === "Soak";
const jtlDir = join(ROOT, isSoak ? "endurance/jtl" : "results/jtl");
const resDir = join(ROOT, isSoak ? "endurance/resources" : "results/resources");
const htmlDir = join(ROOT, isSoak ? "endurance/html/soak" : `results/html/${scenario.toLowerCase()}`);
const runLog = join(ROOT, isSoak ? "endurance/run-log.md" : "results/run-log.md");

function findPlan() {
  const dir = join(ROOT, "test-plans");
  const matches = readdirSync(dir)
    .filter((f) => f.startsWith(`${STUDENT_ID}_${scenario}_`) && f.endsWith(".jmx"))
    .sort();
  return matches.length ? join(dir, matches[matches.length - 1]) : null;
}

// QUAN TRONG: duong dan tuyet doi cua repo chua dau tieng Viet ("Kiểm thử phần mềm").
// Khi goi JMeter qua shell:true (bat buoc vi jmeter.bat can cmd.exe), Java giai ma
// argv bang ACTIVE CODE PAGE cua he thong (khong phai UTF-8/UTF-16), nen "ể"/"ử"
// bi hong thanh "?" -> path sai + dau ngoac bi vo -> loi "Bad pathname" va
// "Unknown arg: th?". Da xac nhan bang thuc nghiem (xem AI Audit LOG lien quan).
// Cach tranh CHAC CHAN: dung DUONG DAN TUONG DOI (chi ASCII) lam tham so dong lenh,
// dua vao `cwd: ROOT` (khong bi loi ma hoa nay vi CreateProcess dung wide-string
// rieng cho current directory, khong qua buoc giai ma argv cua Java).
function toRel(absPath) {
  return absPath.slice(ROOT.length + 1).split("\\").join("/");
}

function stampNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function countProducts() {
  try {
    // Timeout bat buoc — xem ghi chu day du trong tools/reset-lockout.mjs.
    const r = await fetch(`${API_URL}/api/products`, { signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    return Array.isArray(j) ? j.length : "?";
  } catch {
    return "khong doc duoc";
  }
}

function fmt(d) {
  return d.toLocaleString("vi-VN", { hour12: false }) + ` (epoch ${d.getTime()})`;
}

async function main() {
  const plan = findPlan();
  if (!plan) {
    console.error(`[FAIL] Khong tim thay test plan cho '${scenario}' trong test-plans/.`);
    console.error(`       Chay 'npm run plans' truoc.`);
    process.exit(1);
  }

  const stamp = stampNow();
  const base = `${STUDENT_ID}_${scenario}_${stamp}`;
  const jtl = join(jtlDir, `${SMOKE ? "smoke-" : ""}${base}.jtl`);
  const jmlog = join(jtlDir, `${SMOKE ? "smoke-" : ""}${base}.jmeter.log`);
  const resCsv = join(resDir, `${SMOKE ? "smoke-" : ""}${base}.resources.csv`);

  const jmeterArgs = [
    "-n", "-t", toRel(plan),
    "-l", toRel(jtl),
    "-j", toRel(jmlog),
    "-e", "-o", toRel(htmlDir),
    "-Jdatadir=data",
    ...(SMOKE ? ["-Jthreads=2", "-Jduration=40"] : []),
    `-Jhost=${new URL(API_URL).hostname}`,
    `-Jport=${new URL(API_URL).port || 80}`,
  ];

  console.log(`== Luot ${scenario}${SMOKE ? "  [SMOKE - 2 VU x 40s, KHONG phai luot chinh thuc]" : ""} ==`);
  console.log(`  Plan       : ${plan}`);
  console.log(`  Raw .jtl   : ${jtl}`);
  console.log(`  Dashboard  : ${htmlDir}`);
  console.log(`  Resources  : ${resCsv}`);
  console.log(`  Chup anh o : giay thu ${SHOT_AT[scenario]}`);

  if (DRY) {
    console.log(`\n[--dry] Lenh se chay:`);
    console.log(`  ${JMETER} ${jmeterArgs.join(" ")}`);
    console.log(`\n[--dry] Khong chay gi ca. Bo --dry de chay that.`);
    return;
  }

  for (const d of [jtlDir, resDir]) mkdirSync(d, { recursive: true });

  // JMeter BAO LOI SAU KHI chay xong neu thu muc -o khong rong -> mat ca luot do.
  // Vi the phai don TRUOC.
  if (existsSync(htmlDir)) {
    rmSync(htmlDir, { recursive: true, force: true });
    console.log(`  Da xoa dashboard cu: ${htmlDir}`);
  }

  // 1. Reset lockout
  if (!NO_RESET) {
    console.log(`\n[1/4] Reset lockout...`);
    const r = spawnSync("node", [join(__dirname, "reset-lockout.mjs"), "--wait"], {
      cwd: ROOT, encoding: "utf8", timeout: 300000,
    });
    const tail = (r.stdout || "").trim().split("\n").slice(-3).join("\n");
    console.log(tail);
    if (r.status !== 0) {
      console.error(`\n[FAIL] Van con tai khoan bi khoa. Doi them roi chay lai, hoac dung --no-reset neu co y do rieng.`);
      process.exit(2);
    }
  } else {
    console.log(`\n[1/4] Bo qua reset lockout (--no-reset)`);
  }

  const products = await countProducts();
  console.log(`\n[2/4] So dong bang 'products' truoc khi chay: ${products}`);

  // 2. Lay mau tai nguyen song song
  console.log(`[3/4] Bat dau lay mau CPU/RAM (node + java) moi 2 giay...`);
  const sampler = spawn("powershell", [
    "-ExecutionPolicy", "Bypass", "-File", join(__dirname, "sample-resources.ps1"),
    "-OutFile", resCsv, "-IntervalSec", "2",
  ], { cwd: ROOT, stdio: "ignore", windowsHide: true, detached: false });

  // 3. Chay JMeter + dem nguoc toi giay can chup anh
  const startedAt = new Date();
  console.log(`\n${"=".repeat(64)}`);
  console.log(`  MO TASK MANAGER (tab Details) CANH BEN CUA SO NAY NGAY BAY GIO`);
  console.log(`  CHUP TOAN MAN HINH (Win+Shift+S -> Fullscreen) o GIAY THU ${SHOT_AT[scenario]}`);
  console.log(`  Luu thanh: resource-monitor/screenshots/taskmgr-${scenario.toLowerCase()}.png`);
  console.log(`${"=".repeat(64)}\n`);
  console.log(`[4/4] Bat dau luc ${fmt(startedAt)}\n`);

  const ticker = setInterval(() => {
    const el = Math.round((Date.now() - startedAt.getTime()) / 1000);
    const left = SHOT_AT[scenario] - el;
    if (left > 0 && left <= 15) process.stdout.write(`\r  >>> CHUAN BI CHUP: con ${left}s   `);
    else if (left === 0) process.stdout.write(`\r  >>> CHUP NGAY BAY GIO! <<<          \n`);
  }, 1000);

  const code = await new Promise((resolve) => {
    const jm = spawn(JMETER, jmeterArgs, { cwd: ROOT, stdio: "inherit", shell: true });
    jm.on("close", resolve);
  });

  clearInterval(ticker);
  const endedAt = new Date();

  // 4. Dung sampler
  try {
    spawnSync("taskkill", ["/PID", String(sampler.pid), "/T", "/F"], { stdio: "ignore" });
  } catch { /* sampler co the da tu thoat */ }

  const durSec = Math.round((endedAt - startedAt) / 1000);
  console.log(`\n\nKet thuc luc ${fmt(endedAt)} — keo dai ${durSec}s, JMeter exit code ${code}`);

  // 5. Ghi run-log
  const block = `
## Luot ${scenario} — ${stamp}

| | |
|---|---|
| Test plan | \`${toRel(plan)}\` |
| Bat dau | ${fmt(startedAt)} |
| Ket thuc | ${fmt(endedAt)} |
| Thoi luong | ${durSec}s |
| Raw \`.jtl\` | \`${toRel(jtl)}\` |
| \`jmeter.log\` | \`${toRel(jmlog)}\` |
| Dashboard | \`${toRel(htmlDir)}\` |
| Resource CSV | \`${toRel(resCsv)}\` |
| \`products\` khi do | ${products} dong |
| JMeter exit code | ${code} |
| **Anh Task Manager** | \`resource-monitor/screenshots/taskmgr-${scenario.toLowerCase()}.png\` — *(dien gio chup)* |
| Reset lockout truoc luot | ${NO_RESET ? "BO QUA (--no-reset)" : "co, chay toi khi 0 tai khoan bi khoa"} |
| Cooldown truoc luot | *(dien so giay)* |
| Ghi chu | *(tai nen may, viec khac dang chay...)* |
`;
  if (SMOKE) {
    console.log(`
[SMOKE] KHONG ghi vao run-log — day chi la luot kiem chung duong ong.`);
    console.log(`[SMOKE] File .jtl co tien to "smoke-" nen 'npm run summary' se tu bo qua.`);
  } else {
    appendFileSync(runLog, block, "utf8");
    console.log(`Da ghi run-log: ${runLog}`);
  }

  console.log(`\nBuoc tiep theo:`);
  console.log(`  1. Dien gio chup anh vao run-log (moc gio phai nam trong khoang chay o tren)`);
  console.log(`  2. npm run summary   -> sinh lai results/summary.md tu raw .jtl`);
  console.log(`  3. Cooldown >= 90 giay truoc luot ke tiep`);
}

main().catch((e) => {
  console.error("Loi khong mong doi:", e);
  process.exit(1);
});
