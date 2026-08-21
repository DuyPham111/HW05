// NGUON DUY NHAT sinh ra moi con so cua bai nay.
//
// Moi so lieu trong README, bao cao va Task 2 deu phai in ra tu day — KHONG go tay
// tu HTML dashboard. Go tay la cach chac chan nhat de README va bao cao lech nhau,
// va nguoi cham se thay.
//
// Cach goi:
//   node tools/summarize-jtl.mjs                          quet results/jtl + endurance/jtl -> results/summary.md
//   node tools/summarize-jtl.mjs --file <path.jtl>        chi mot file
//   node tools/summarize-jtl.mjs --windows "10-60,60-95"  cat theo cua so giay (goc = timeStamp nho nhat)
//   node tools/summarize-jtl.mjs --stdout                 in ra man hinh, khong ghi file

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
function argVal(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}
const ONE_FILE = argVal("--file");
const WINDOWS_ARG = argVal("--windows");
const TO_STDOUT = args.includes("--stdout");
const INCLUDE_ALL = args.includes("--all");   // gom ca file smoke-/validate-

// ---------------------------------------------------------------------------
// Percentile: nearest-rank.  p = sorted[ceil(n*q) - 1]
// Ghi ro cong thuc vao output vi JMeter dashboard noi suy hoi khac -> con so co the
// lech 1-2 ms; neu khong noi ro thi khong giai thich duoc cho nguoi cham.
// ---------------------------------------------------------------------------
function pct(sortedArr, q) {
  if (sortedArr.length === 0) return 0;
  const rank = Math.ceil(sortedArr.length * q);
  return sortedArr[Math.min(Math.max(rank, 1), sortedArr.length) - 1];
}

function parseJtl(path) {
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  // Doc header, KHONG hard-code chi so cot — cau hinh jmeter.properties khac nhau
  // cho ra so cot khac nhau.
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h.trim()] = i));

  const need = ["timeStamp", "elapsed", "label", "responseCode", "success"];
  for (const n of need) {
    if (idx[n] === undefined) throw new Error(`${basename(path)}: thieu cot bat buoc '${n}'`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Cot URL/failureMessage co the chua dau phay trong ngoac kep -> tach thu cong
    const f = splitCsv(lines[i]);
    if (f.length < header.length - 2) continue;
    rows.push({
      ts: Number(f[idx.timeStamp]),
      elapsed: Number(f[idx.elapsed]),
      label: f[idx.label],
      code: f[idx.responseCode],
      success: f[idx.success] === "true",
      latency: idx.Latency !== undefined ? Number(f[idx.Latency]) : null,
      allThreads: idx.allThreads !== undefined ? Number(f[idx.allThreads]) : null,
    });
  }
  return rows;
}

function splitCsv(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Loi "theo THIET KE" cua workflow nay: buoc 7 co tinh dang nhap sai.
// 401 = sai mat khau (dung), 403 = tai khoan dang bi khoa (dung).
// Tach chung ra TRUOC khi noi bat cu dieu gi ve error rate.
function isByDesign(r) {
  return /Login sai/i.test(r.label) && (r.code === "401" || r.code === "403");
}

function stats(rows) {
  if (rows.length === 0) return null;
  const el = rows.map((r) => r.elapsed).sort((a, b) => a - b);
  const lat = rows.filter((r) => r.latency !== null).map((r) => r.latency).sort((a, b) => a - b);
  const t0 = Math.min(...rows.map((r) => r.ts));
  const t1 = Math.max(...rows.map((r) => r.ts + r.elapsed));
  const durSec = Math.max((t1 - t0) / 1000, 0.001);
  const fails = rows.filter((r) => !r.success);
  const byDesign = rows.filter(isByDesign);
  const realFails = fails.filter((r) => !isByDesign(r));
  const threads = rows.map((r) => r.allThreads).filter((v) => v !== null);

  return {
    n: rows.length,
    durSec,
    rps: rows.length / durSec,
    errPct: (fails.length / rows.length) * 100,
    realErrPct: (realFails.length / rows.length) * 100,
    realFails: realFails.length,
    byDesign: byDesign.length,
    avg: el.reduce((a, b) => a + b, 0) / el.length,
    p50: pct(el, 0.5), p90: pct(el, 0.9), p95: pct(el, 0.95), p99: pct(el, 0.99),
    max: el[el.length - 1], min: el[0],
    latAvg: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : null,
    latP95: lat.length ? pct(lat, 0.95) : null,
    peakThreads: threads.length ? Math.max(...threads) : null,
  };
}

const f1 = (x) => (x === null || x === undefined ? "—" : x.toFixed(1));
const f0 = (x) => (x === null || x === undefined ? "—" : String(Math.round(x)));

function rowLine(name, s) {
  return `| ${name} | ${s.n} | ${f1(s.durSec)} | ${f1(s.rps)} | ${f1(s.errPct)}% | ${f1(s.realErrPct)}% | ` +
         `${f1(s.avg)} | ${f0(s.p50)} | ${f0(s.p90)} | **${f0(s.p95)}** | ${f0(s.p99)} | ${f0(s.max)} | ` +
         `${f1(s.latAvg)} | ${f0(s.latP95)} | ${s.peakThreads ?? "—"} |`;
}

const TABLE_HEAD =
  "| | Sample | Thời lượng (s) | RPS | Error% (thô) | Error% (**thật**) | avg | p50 | p90 | **p95** | p99 | max | Lat avg | Lat p95 | peak VU |\n" +
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|";

function reportFile(path) {
  const rows = parseJtl(path);
  if (!rows || rows.length === 0) return `\n### ${basename(path)}\n\n*(file rỗng hoặc không đọc được)*\n`;

  const s = stats(rows);
  let out = `\n### ${basename(path)}\n\n**Tổng thể**\n\n${TABLE_HEAD}\n${rowLine("Toàn lượt", s)}\n`;

  out += `\n> **Error% (thô)** đếm mọi sample \`success=false\`. **Error% (thật)** đã loại các sample là *hành vi theo thiết kế* — bước 7 cố tình đăng nhập sai nên 401/403 ở đó **không phải lỗi hệ thống**. Lượt này có **${s.byDesign}** sample thuộc nhóm thiết kế và **${s.realFails}** lỗi thật.\n`;

  // Theo tung sampler
  const labels = [...new Set(rows.map((r) => r.label))].sort();
  out += `\n**Theo từng sampler**\n\n${TABLE_HEAD}\n`;
  for (const lb of labels) {
    const st = stats(rows.filter((r) => r.label === lb));
    out += rowLine(lb, st) + "\n";
  }

  // Phan ra response code
  out += `\n**Phân rã response code**\n\n| responseCode | sampler | Số sample | Theo thiết kế? |\n|---|---|---|---|\n`;
  const combo = {};
  for (const r of rows) {
    const k = `${r.code}||${r.label}`;
    combo[k] = combo[k] || { n: 0, design: isByDesign(r) };
    combo[k].n++;
  }
  for (const k of Object.keys(combo).sort()) {
    const [code, label] = k.split("||");
    out += `| ${code} | ${label} | ${combo[k].n} | ${combo[k].design ? "✅ có" : "—"} |\n`;
  }

  // Cua so thoi gian
  if (WINDOWS_ARG) {
    const t0 = Math.min(...rows.map((r) => r.ts));
    out += `\n**Theo cửa sổ thời gian** *(gốc = timeStamp nhỏ nhất của file)*\n\n${TABLE_HEAD}\n`;
    for (const w of WINDOWS_ARG.split(",")) {
      const [a, b] = w.split("-").map(Number);
      const sub = rows.filter((r) => {
        const sec = (r.ts - t0) / 1000;
        return sec >= a && sec < b;
      });
      if (sub.length === 0) { out += `| ${w}s | 0 | — | — | — | — | — | — | — | — | — | — | — | — | — |\n`; continue; }
      out += rowLine(`${w}s`, stats(sub)) + "\n";
    }
  }

  return out;
}

function main() {
  let files = [];
  if (ONE_FILE) {
    files = [ONE_FILE];
  } else {
    for (const d of ["results/jtl", "endurance/jtl"]) {
      const abs = join(ROOT, d);
      if (!existsSync(abs)) continue;
      for (const f of readdirSync(abs)) {
        if (!f.endsWith(".jtl")) continue;
        // Bo qua file smoke/validate — chung la buoc KIEM CHUNG plan, khong phai
        // luot do chinh thuc. Tron vao summary.md se lam lech moi con so bao cao.
        // Dung --all de xem ca chung.
        if (/^(smoke|validate)-/i.test(f) && !INCLUDE_ALL) continue;
        files.push(join(abs, f));
      }
    }
  }
  files = files.filter((f) => existsSync(f)).sort();

  if (files.length === 0) {
    console.error("[FAIL] Khong tim thay file .jtl nao trong results/jtl/ hay endurance/jtl/.");
    process.exit(1);
  }

  let md = `# Test Summary — sinh tự động từ raw \`.jtl\`

> **File này sinh tự động bằng \`npm run summary\`. ĐỪNG SỬA TAY.**
> Mọi con số trong \`README.md\` và \`report/main-report.md\` phải copy từ đây.
>
> **Cách tính percentile:** nearest-rank — sắp xếp tăng dần, \`p = sorted[ceil(n × q) − 1]\`.
> JMeter dashboard nội suy hơi khác nên p95 có thể lệch **1–2 ms**; đó là bình thường và
> đã được giải thích, không phải sai số liệu.
>
> **Đơn vị:** thời gian = **ms**, trừ cột "Thời lượng" = giây.
> Sinh lúc: ${new Date().toISOString()}
> Số file đọc được: ${files.length}
`;

  for (const f of files) md += reportFile(f);

  if (TO_STDOUT) {
    console.log(md);
  } else {
    const out = join(ROOT, "results", "summary.md");
    writeFileSync(out, md, "utf8");
    console.log(`[OK] Da ghi ${out}`);
    console.log(`     ${files.length} file .jtl:`);
    for (const f of files) console.log(`       - ${basename(f)}`);
  }
}

main();
