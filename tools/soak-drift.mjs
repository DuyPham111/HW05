// Tinh do troi p95/RSS theo tung phut cho luot Soak, va chot 4 tieu chi on dinh
// da dinh nghia TRUOC khi chay (endurance/endurance-threshold.md §1).
//
// Cach goi:
//   node tools/soak-drift.mjs              doc file .jtl/.resources.csv MOI NHAT, ghi vao
//                                           endurance/endurance-threshold.md muc "3. So lieu do duoc"
//   node tools/soak-drift.mjs --stdout      in ra man hinh, khong ghi file

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TO_STDOUT = process.argv.includes("--stdout");

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

function latestFile(dir, ext) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith(ext) && !f.startsWith("smoke-") && !f.startsWith("validate-"));
  return files.length ? join(dir, files.sort().at(-1)) : null;
}

function parseJtl(path) {
  const lines = readFileSync(path, "utf8").split("\n").filter((l) => l.trim());
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h.trim()] = i));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsv(lines[i]);
    if (f.length < header.length - 2) continue;
    rows.push({
      ts: Number(f[idx.timeStamp]),
      elapsed: Number(f[idx.elapsed]),
      code: f[idx.responseCode],
      success: f[idx.success] === "true",
      label: f[idx.label],
    });
  }
  return rows;
}

function parseResources(path) {
  const lines = readFileSync(path, "utf8").split("\n").filter((l) => l.trim());
  const header = lines[0].split(",");
  const idx = {};
  header.forEach((h, i) => (idx[h.trim()] = i));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(",");
    if (f.length < header.length) continue;
    rows.push({
      iso: f[idx.timestamp_iso],
      epochMs: Number(f[idx.epoch_ms]),
      process: f[idx.process],
      pid: f[idx.pid],
      cpu: Number(f[idx.cpu_percent_of_one_core]),
      wsMb: Number(f[idx.working_set_mb]),
    });
  }
  return rows;
}

// Bang chung thuc nghiem (Soak 22/8/2026): khi chay `run-scenario.mjs` tu terminal cua
// sinh vien, sampler bat CA HAI tien trinh node — backend that (PID on dinh qua nhieu
// luot) VA chinh tien trinh dang chay script dieu phoi (PID moi moi lan goi). Phan biet
// bang CPU trung binh: backend xu ly request nen CPU > 0 ro ret; script dieu phoi chi
// `await` cho JMeter nen gan nhu luon 0%. Da kiem chung: PID backend 3728 -> avg 6.80%,
// PID script dieu phoi 13132 -> avg 0.03%.
function pickBackendPid(resRows) {
  const nodeRows = resRows.filter((r) => r.process === "node");
  const byPid = {};
  for (const r of nodeRows) {
    byPid[r.pid] = byPid[r.pid] || { sum: 0, n: 0, maxWs: 0 };
    byPid[r.pid].sum += r.cpu;
    byPid[r.pid].n++;
    byPid[r.pid].maxWs = Math.max(byPid[r.pid].maxWs, r.wsMb);
  }
  let best = null;
  for (const [pid, s] of Object.entries(byPid)) {
    const avg = s.sum / s.n;
    if (!best || avg > best.avg) best = { pid, avg, maxWs: s.maxWs };
  }
  return best;
}

function main() {
  const jtlPath = latestFile(join(ROOT, "endurance/jtl"), ".jtl");
  const resDir = join(ROOT, "endurance/resources");
  const resPath = jtlPath ? join(resDir, basename(jtlPath).replace(/\.jtl$/, ".resources.csv")) : null;

  if (!jtlPath || !existsSync(resPath || "")) {
    console.error("[FAIL] Khong tim thay cap file .jtl + .resources.csv trong endurance/. Chay lot Soak truoc.");
    process.exit(1);
  }

  const rows = parseJtl(jtlPath);
  const resRows = parseResources(resPath);
  const backend = pickBackendPid(resRows);
  const t0 = Math.min(...rows.map((r) => r.ts));
  const totalDurSec = (Math.max(...rows.map((r) => r.ts + r.elapsed)) - t0) / 1000;

  // 1. Bang theo tung phut
  const totalMin = Math.ceil(totalDurSec / 60);
  const perMinRows = [];
  for (let m = 0; m < totalMin; m++) {
    const a = m * 60, b = (m + 1) * 60;
    const sub = rows.filter((r) => { const s = (r.ts - t0) / 1000; return s >= a && s < b; });
    const el = sub.map((r) => r.elapsed).sort((x, y) => x - y);
    const err = sub.filter((r) => !r.success && !(/Login sai/i.test(r.label) && (r.code === "401" || r.code === "403")));
    const wsInMin = resRows.filter((r) => r.pid === backend.pid && (r.epochMs - resRows[0].epochMs) / 1000 >= a && (r.epochMs - resRows[0].epochMs) / 1000 < b).map((r) => r.wsMb);
    perMinRows.push({
      min: m + 1,
      n: sub.length,
      rps: el.length ? (sub.length / Math.min(60, totalDurSec - a)).toFixed(1) : "0.0",
      errPct: sub.length ? ((err.length / sub.length) * 100).toFixed(2) : "0.00",
      p50: pct(el, 0.5), p95: pct(el, 0.95), p99: pct(el, 0.99), max: el.at(-1) ?? 0,
      wsAvg: wsInMin.length ? (wsInMin.reduce((a, b) => a + b, 0) / wsInMin.length).toFixed(1) : "—",
    });
  }

  let out = `\n### Bảng theo từng phút (${basename(jtlPath)})\n\n`;
  out += `| Phút | Sample | RPS | Error% | p50 | **p95** | p99 | max | RSS \`node\` (PID ${backend.pid}, MB) |\n`;
  out += `|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of perMinRows) {
    out += `| ${r.min} | ${r.n} | ${r.rps} | ${r.errPct}% | ${r.p50} | **${r.p95}** | ${r.p99} | ${r.max} | ${r.wsAvg} |\n`;
  }

  // 2. Bon tieu chi on dinh
  const allFails = rows.filter((r) => !r.success);
  const designedFails = allFails.filter((r) => /Login sai/i.test(r.label) && (r.code === "401" || r.code === "403"));
  const realFails = allFails.filter((r) => !(/Login sai/i.test(r.label) && (r.code === "401" || r.code === "403")));
  const realErrPct = (realFails.length / rows.length) * 100;

  const first5min = rows.filter((r) => (r.ts - t0) / 1000 < 300).map((r) => r.elapsed).sort((a, b) => a - b);
  const last5min = rows.filter((r) => (r.ts - t0) / 1000 >= totalDurSec - 300).map((r) => r.elapsed).sort((a, b) => a - b);
  const p95First = pct(first5min, 0.95), p95Last = pct(last5min, 0.95);
  const p95DriftPct = ((p95Last - p95First) / p95First) * 100;

  const backendRows = resRows.filter((r) => r.pid === backend.pid);
  const t0res = backendRows[0]?.epochMs ?? 0;
  const min2Rows = backendRows.filter((r) => (r.epochMs - t0res) / 1000 >= 60 && (r.epochMs - t0res) / 1000 < 120);
  const lastMinRows = backendRows.filter((r) => (r.epochMs - t0res) / 1000 >= totalDurSec - 60);
  const rssMin2 = min2Rows.length ? min2Rows.reduce((a, b) => a + b.wsMb, 0) / min2Rows.length : backendRows[0]?.wsMb ?? 0;
  const rssLast = lastMinRows.length ? lastMinRows.reduce((a, b) => a + b.wsMb, 0) / lastMinRows.length : backendRows.at(-1)?.wsMb ?? 0;
  const rssDriftPct = ((rssLast - rssMin2) / rssMin2) * 100;
  const rssMax = Math.max(...backendRows.map((r) => r.wsMb));

  const javaRows = resRows.filter((r) => r.process === "java");
  const javaPeakCpu = javaRows.length ? Math.max(...javaRows.map((r) => r.cpu)) : 0;
  const nodePeakCpu = Math.max(...backendRows.map((r) => r.cpu));

  const c1 = realErrPct < 1;
  const c2 = Math.abs(p95DriftPct) <= 20;
  const c3 = rssDriftPct <= 20;
  const c4 = javaPeakCpu < nodePeakCpu;

  out += `\n### Kiểm 4 tiêu chí ổn định (đã định nghĩa trước ở mục 1)\n\n`;
  out += `| # | Tiêu chí | Kết quả |\n|---|---|---|\n`;
  out += `| 1 | Error rate thật < 1% | ${c1 ? "[PASS]" : "[FAIL]"} ${realErrPct.toFixed(3)}% (${realFails.length}/${rows.length} lỗi thật; ${designedFails.length} thuộc thiết kế bước 7) |\n`;
  out += `| 2 | \\|Δp95\\| 5' đầu vs 5' cuối ≤ 20% | ${c2 ? "[PASS]" : "[FAIL]"} p95 đầu=${p95First}ms, p95 cuối=${p95Last}ms, chênh ${p95DriftPct >= 0 ? "+" : ""}${p95DriftPct.toFixed(1)}% |\n`;
  out += `| 3 | Δ RSS phút 2 → phút cuối ≤ 20% | ${c3 ? "[PASS]" : "[FAIL]"} RSS phút 2=${rssMin2.toFixed(1)}MB, RSS cuối=${rssLast.toFixed(1)}MB, chênh ${rssDriftPct >= 0 ? "+" : ""}${rssDriftPct.toFixed(1)}%, trần=${rssMax.toFixed(1)}MB |\n`;
  out += `| 4 | CPU đỉnh \`java\` < CPU đỉnh \`node\` | ${c4 ? "[PASS]" : "[FAIL]"} java=${javaPeakCpu.toFixed(1)}%, node=${nodePeakCpu.toFixed(1)}% |\n`;

  // 3. Ket luan bang so
  const rps = (rows.length / totalDurSec).toFixed(1);
  out += `\n### Kết luận bằng số\n\n`;
  out += `> Ngưỡng chịu tải ổn định đo được trên máy này: **${rps} req/s** duy trì ${Math.round(totalDurSec / 60)} phút, `;
  out += `p95 **${pct(rows.map((r) => r.elapsed).sort((a, b) => a - b), 0.95)} ms**, error **${realErrPct.toFixed(2)}%**, `;
  out += `RSS trần **${rssMax.toFixed(1)} MB**, độ trôi p95 **${p95DriftPct >= 0 ? "+" : ""}${p95DriftPct.toFixed(1)}%**, độ trôi RSS **${rssDriftPct >= 0 ? "+" : ""}${rssDriftPct.toFixed(1)}%**.\n`;

  // 4. Neu RSS tang don dieu -> hoi quy tuyen tinh
  if (!c3) {
    const pts = backendRows.map((r) => [(r.epochMs - t0res) / 60000, r.wsMb]);
    const n = pts.length;
    const sx = pts.reduce((a, [x]) => a + x, 0), sy = pts.reduce((a, [, y]) => a + y, 0);
    const sxy = pts.reduce((a, [x, y]) => a + x * y, 0), sxx = pts.reduce((a, [x]) => a + x * x, 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const intercept = (sy - slope * sx) / n;
    const minutesTo1GB = (1024 - intercept) / slope;
    out += `\n**[CẢNH BÁO RSS TĂNG ĐƠN ĐIỆU]** Hệ số góc hồi quy tuyến tính: **${slope.toFixed(2)} MB/phút**. `;
    out += `Ngoại suy (giả định tuyến tính tiếp diễn): chạm 1024 MB sau khoảng **${minutesTo1GB.toFixed(0)} phút** kể từ lúc bắt đầu lấy mẫu.\n`;
  }

  if (TO_STDOUT) {
    console.log(out);
  } else {
    const thresholdPath = join(ROOT, "endurance/endurance-threshold.md");
    let content = existsSync(thresholdPath) ? readFileSync(thresholdPath, "utf8") : "";
    const marker = "## 3. Số liệu đo được — `npm run drift` SINH RA, đừng sửa tay";
    const nextMarker = "\n## 4.";
    if (content.includes(marker)) {
      const start = content.indexOf(marker) + marker.length;
      const end = content.indexOf(nextMarker, start);
      const before = content.slice(0, start);
      const after = end >= 0 ? content.slice(end) : "\n";
      content = before + "\n" + out + after;
    } else {
      content += `\n${marker}\n${out}\n`;
    }
    writeFileSync(thresholdPath, content, "utf8");
    console.log(`[OK] Da ghi ${thresholdPath}`);
    console.log(out);
  }
}

main();
