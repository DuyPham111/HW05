// Cong chan hoi quy hieu nang cho pipeline perf-smoke.
//
// Doc file .jtl MOI NHAT vua sinh ra trong lan chay CI nay (moi runner la mot
// checkout sach, nen "moi nhat" = dung lan nay, khong lan nen tu nhung run cu).
// So p95 voi median cua ci/baseline.json (5 gia tri gan nhat CUNG mot loai runner).
//
// FAIL neu: (p95 > median*1.3 VA chenh tuyet doi > 10ms)  HOAC
//           error% (thuc, da loai 401/403 buoc 7 lockout) > 1%  HOAC
//           p95 > 500ms (nguong tuyet doi, chong "luoc ech" khi baseline troi dan).
//
// Sua ngay 22/8: ban dau chi co dieu kien %; mot lan chay CI hoan toan sach (khong
// tiem loi gi) da FAIL vi baseline luc do chi co 1 mau = 3ms, va 1ms nhieu runner
// da la +33%. Them dieu kien VA voi do lech tuyet doi >= 10ms de % khong con y nghia
// gia tao o quy mo mili-giay cuc nho.
//
// Cach goi:
//   node tools/ci-gate.mjs                  tu tim .jtl moi nhat trong results/jtl/
//   node tools/ci-gate.mjs --file <path>    chi mot file cu the

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, appendFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASELINE_PATH = join(ROOT, "ci", "baseline.json");

const args = process.argv.slice(2);
function argVal(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

function pct(sortedArr, q) {
  if (sortedArr.length === 0) return 0;
  const rank = Math.ceil(sortedArr.length * q);
  return sortedArr[Math.min(Math.max(rank, 1), sortedArr.length) - 1];
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

function isByDesign(label, code) {
  return /Login sai/i.test(label) && (code === "401" || code === "403");
}

function parseJtl(path) {
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h.trim()] = i));
  const need = ["elapsed", "label", "responseCode", "success"];
  for (const n of need) {
    if (idx[n] === undefined) throw new Error(`${basename(path)}: thieu cot bat buoc '${n}'`);
  }
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsv(lines[i]);
    if (f.length < header.length - 2) continue;
    rows.push({
      elapsed: Number(f[idx.elapsed]),
      label: f[idx.label],
      code: f[idx.responseCode],
      success: f[idx.success] === "true",
    });
  }
  return rows;
}

function findLatestJtl() {
  const dir = join(ROOT, "results", "jtl");
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith(".jtl"));
  if (files.length === 0) return null;
  return files
    .map((f) => join(dir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  } catch {
    return [];
  }
}

function saveBaseline(arr) {
  const last5 = arr.slice(-5);
  writeFileSync(BASELINE_PATH, JSON.stringify(last5, null, 2) + "\n", "utf8");
}

function main() {
  const jtlPath = argVal("--file") || findLatestJtl();
  if (!jtlPath || !existsSync(jtlPath)) {
    console.error("[FAIL] Khong tim thay file .jtl nao de cham diem.");
    process.exit(1);
  }

  const rows = parseJtl(jtlPath);
  if (!rows || rows.length === 0) {
    console.error(`[FAIL] ${basename(jtlPath)} rong hoac khong doc duoc.`);
    process.exit(1);
  }

  const el = rows.map((r) => r.elapsed).sort((a, b) => a - b);
  const p95 = pct(el, 0.95);
  const realFails = rows.filter((r) => !r.success && !isByDesign(r.label, r.code));
  const realErrPct = (realFails.length / rows.length) * 100;

  const baseline = loadBaseline();
  const baseMedian = baseline.length ? median(baseline) : null;
  const pctChange = baseMedian ? ((p95 - baseMedian) / baseMedian) * 100 : null;

  // Ngan-30-thang-8: nguong 30% THUAN TUY da tung FAIL mot lan chay hoan toan sach
  // (khong tiem loi gi) chi vi baseline luc do co 1 mau = 3ms — 1ms nhieu tu nhien
  // cua runner da la +33%. O quy mo mili-giay nho, % tuong doi khong co y nghia neu
  // khong co san mot do lech TUYET DOI toi thieu di kem. Them MIN_ABS_DELTA_MS lam
  // dieu kien VA, khong phai HOAC, voi nguong 30%.
  const MIN_ABS_DELTA_MS = 10;
  const reasons = [];
  if (baseMedian !== null && p95 > baseMedian * 1.3 && p95 - baseMedian > MIN_ABS_DELTA_MS) {
    reasons.push(`p95 (${p95}ms) > median baseline × 1.3 (${(baseMedian * 1.3).toFixed(1)}ms) VA chenh tuyet doi ${(p95 - baseMedian).toFixed(1)}ms > ${MIN_ABS_DELTA_MS}ms`);
  }
  if (realErrPct > 1) {
    reasons.push(`error% thuc (${realErrPct.toFixed(2)}%) > 1%`);
  }
  if (p95 > 500) {
    reasons.push(`p95 (${p95}ms) > nguong tuyet doi 500ms`);
  }

  const verdict = reasons.length > 0 ? "FAIL" : "PASS";

  const table = [
    `| File | Sample | p95 do duoc | Baseline median (n=${baseline.length}) | Chenh | Error% thuc | Verdict |`,
    `|---|---|---|---|---|---|---|`,
    `| ${basename(jtlPath)} | ${rows.length} | ${p95}ms | ${baseMedian === null ? "(chua co)" : baseMedian.toFixed(1) + "ms"} | ${pctChange === null ? "—" : (pctChange >= 0 ? "+" : "") + pctChange.toFixed(1) + "%"} | ${realErrPct.toFixed(2)}% | **${verdict}** |`,
  ].join("\n");

  console.log(table);
  if (reasons.length > 0) {
    console.log("\nLy do FAIL:");
    for (const r of reasons) console.log(`  - ${r}`);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, "\n## Ci-gate ket qua\n\n" + table + "\n");
    if (reasons.length > 0) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, "\nLy do FAIL:\n" + reasons.map((r) => `- ${r}`).join("\n") + "\n");
    }
  }

  if (verdict === "PASS") {
    saveBaseline([...baseline, p95]);
    console.log(`\n[OK] Da cap nhat ${BASELINE_PATH} (${Math.min(baseline.length + 1, 5)} gia tri gan nhat).`);
    process.exit(0);
  } else {
    console.error("\n[FAIL] ci-gate chan build.");
    process.exit(1);
  }
}

main();
