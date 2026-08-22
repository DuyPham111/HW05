// Kiem moi truong truoc moi buoi lam viec: JMeter/Java, backend SUT, 6 endpoint cua
// workflow storefront, va cac file CSV data-driven da co du lieu chua.
//
// Luu y tac dung phu: buoc kiem checkout thuc su goi POST /api/checkout, tuc la se
// ghi mot dong moi vao bang `orders` moi lan chay preflight.

import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const API_URL = process.env.API_URL || "http://127.0.0.1:3000";
const JMETER_CANDIDATES = [
  process.env.JMETER_BIN,
  "jmeter",
  "D:\\jmeter\\apache-jmeter-5.6.3\\bin\\jmeter.bat",
].filter(Boolean);

let failCount = 0;

function ok(label, detail = "") {
  console.log(`[OK]   ${label}${detail ? " — " + detail : ""}`);
}

function fail(label, detail = "") {
  failCount += 1;
  console.log(`[FAIL] ${label}${detail ? " — " + detail : ""}`);
}

async function findWorkingJMeter() {
  for (const candidate of JMETER_CANDIDATES) {
    try {
      // .bat can NHAT THIET shell:true tren Windows — execFile khong tu goi cmd.exe cho .bat
      const { stdout, stderr } = await execFileAsync(candidate, ["--version"], {
        timeout: 15000,
        windowsHide: true,
        shell: true,
      });
      const out = stdout + stderr;
      if (/Copyright.*Apache Software Foundation/i.test(out) || /\b5\.\d+\.\d+/.test(out)) {
        const versionMatch = out.match(/\b\d+\.\d+\.\d+\b/);
        return { bin: candidate, versionLine: versionMatch ? versionMatch[0] : out.trim().slice(0, 80) };
      }
    } catch {
      // thu candidate ke tiep
    }
  }
  return null;
}

async function checkJavaVersion() {
  try {
    const { stderr, stdout } = await execFileAsync("java", ["-version"], {
      timeout: 10000,
      windowsHide: true,
    });
    const out = stderr + stdout;
    const match = out.match(/version "(\d+)(?:\.(\d+))?/);
    if (!match) return { ok: false, detail: "khong doc duoc version" };
    const major = match[1] === "1" ? Number(match[2]) : Number(match[1]);
    return { ok: major >= 17, detail: `Java major=${major}`, raw: out.split("\n")[0] };
  } catch (e) {
    return { ok: false, detail: e.message };
  }
}

// Timeout bat buoc — mot request treo se lam preflight cho mai mai khong bao loi
// (xem ghi chu day du trong tools/reset-lockout.mjs).
const FETCH_TIMEOUT_MS = 15000;

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...opts, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // response khong phai JSON, giu body = null
  }
  return { status: res.status, body };
}

async function main() {
  console.log(`== Preflight HW05 — API_URL=${API_URL} ==\n`);

  // 1. JMeter + Java
  const jmeter = await findWorkingJMeter();
  if (jmeter) {
    ok("jmeter --version", `${jmeter.bin} → ${jmeter.versionLine}`);
  } else {
    fail("jmeter --version", "khong tim thay jmeter tren PATH hoac D:\\jmeter\\...\\bin. Neu vua sua PATH, mo terminal moi roi thu lai.");
  }

  const java = await checkJavaVersion();
  if (java.ok) {
    ok("java -version >= 17", java.raw || java.detail);
  } else {
    fail("java -version >= 17", java.detail);
  }

  // 2. Backend song
  try {
    const { status, body } = await fetchJson("/api/products");
    if (status === 200 && Array.isArray(body) && body.length >= 5) {
      ok("GET /api/products", `status=200, ${body.length} san pham`);
    } else {
      fail("GET /api/products", `status=${status}, mang co ${Array.isArray(body) ? body.length : "?"} phan tu (can >=5)`);
    }
  } catch (e) {
    fail("GET /api/products", `backend khong phan hoi: ${e.message}. Chay 'node server.js' trong HW02-new/eshop-sut-main/backend truoc.`);
  }

  // 3. Sau endpoint cua workflow
  let token = null;
  let uid = null;
  try {
    const { status, body } = await fetchJson("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@eshop.com", password: "Test1234!" }),
    });
    if (status === 200 && body?.token) {
      token = body.token;
      uid = body.user?.id;
      ok("POST /api/login (dung mat khau)", `token nhan duoc, user.id=${uid}`);
    } else {
      fail("POST /api/login (dung mat khau)", `status=${status}, body=${JSON.stringify(body)}`);
    }
  } catch (e) {
    fail("POST /api/login (dung mat khau)", e.message);
  }

  try {
    const { status, body } = await fetchJson("/api/products?search=iPhone");
    if (status === 200 && Array.isArray(body)) {
      ok("GET /api/products?search=iPhone", `status=200, ${body.length} ket qua`);
    } else {
      fail("GET /api/products?search=iPhone", `status=${status}`);
    }
  } catch (e) {
    fail("GET /api/products?search=iPhone", e.message);
  }

  try {
    const { status, body } = await fetchJson("/api/products/1");
    if (status === 200 && body?.id) {
      ok("GET /api/products/1", `status=200, co field id=${body.id}`);
    } else {
      fail("GET /api/products/1", `status=${status}, body=${JSON.stringify(body)} (chu y: id khong ton tai van tra 200+{})`);
    }
  } catch (e) {
    fail("GET /api/products/1", e.message);
  }

  if (token) {
    try {
      const { status, body } = await fetchJson("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: 1, quantity: 1 }),
      });
      if (status === 200) {
        ok("POST /api/cart", `status=200, message=${body?.message}`);
      } else {
        fail("POST /api/cart", `status=${status}`);
      }
    } catch (e) {
      fail("POST /api/cart", e.message);
    }

    try {
      const { status, body } = await fetchJson("/api/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "BIGBUY", total_amount: 600000, user_id: uid }),
      });
      if (status === 200 && body?.success === true && body?.discount_amount === 50000) {
        ok("POST /api/apply-coupon (BIGBUY)", `success=true, discount_amount=50000`);
      } else {
        fail("POST /api/apply-coupon (BIGBUY)", `status=${status}, body=${JSON.stringify(body)} (ky vong discount_amount=50000)`);
      }
    } catch (e) {
      fail("POST /api/apply-coupon (BIGBUY)", e.message);
    }

    try {
      const { status, body } = await fetchJson("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ total_amount: 600000, shipping_address: "Preflight test address" }),
      });
      if (status === 200 && body?.orderId) {
        ok("POST /api/checkout", `status=200, orderId=${body.orderId} (LUU Y: da ghi 1 don hang moi vao DB)`);
      } else {
        fail("POST /api/checkout", `status=${status}, body=${JSON.stringify(body)}`);
      }
    } catch (e) {
      fail("POST /api/checkout", e.message);
    }
  } else {
    fail("POST /api/cart, /api/apply-coupon, /api/checkout", "bo qua vi buoc login that bai, khong co token");
  }

  // 4. File CSV data-driven
  const csvFiles = [
    "data/users.csv",
    "data/users_lockout.csv",
    "data/search-terms.csv",
    "data/products.csv",
    "data/orders.csv",
  ];
  for (const rel of csvFiles) {
    if (!existsSync(rel)) {
      fail(rel, "chua ton tai — chay 'npm run seed:perf' truoc");
      continue;
    }
    const lines = readFileSync(rel, "utf8").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length >= 2) {
      ok(rel, `${lines.length - 1} dong du lieu`);
    } else {
      fail(rel, `chi co ${Math.max(lines.length - 1, 0)} dong du lieu, can >=1`);
    }
  }

  // 5. So dong bang products — anh huong chi phi buoc read-heavy
  try {
    const { status, body } = await fetchJson("/api/products");
    if (status === 200 && Array.isArray(body)) {
      console.log(`\nSo dong bang 'products' hien tai: ${body.length} — GHI SO NAY VAO results/run-log.md moi lan chay lot do.`);
    }
  } catch {
    // da bao fail o muc 2, khong lap lai
  }

  console.log(`\n== Ket qua: ${failCount === 0 ? "TOAN BO [OK]" : `${failCount} muc [FAIL]`} ==`);
  process.exit(failCount === 0 ? 0 : 1);
}

main();
