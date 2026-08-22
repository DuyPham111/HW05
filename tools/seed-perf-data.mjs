// Seed du lieu hieu nang cho HW05 va sinh 5 file CSV data-driven (docs/03-DATA-DRIVEN-CSV.md).
// Node 22 ESM, chi dung fetch + node:fs, khong dependency ngoai.
//
// Cach goi: node tools/seed-perf-data.mjs --users 200 --products 20000
//
// Idempotent: voi moi tai khoan, THU LOGIN TRUOC — chi goi register khi login that bai (401).
// Ly do phai lam vay (khong chi dua vao "register that bai"): SUT KHONG co UNIQUE constraint
// tren cot users.email (database.js:50-61), nen POST /api/register KHONG BAO GIO bao loi du
// email da ton tai — goi lai se tao tai khoan TRUNG thay vi bao loi nhu gia dinh ban dau.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

const API_URL = process.env.API_URL || "http://127.0.0.1:3000";
const BATCH_SIZE = 20; // SQLite ghi tuan tu — ban 200 request cung luc de dinh SQLITE_BUSY
const PASSWORD = "Test1234!";
const WRONG_PASSWORD = "Sai_MK_123!";
const KEYWORDS = ["iPhone", "Samsung", "MacBook", "AirPods", "Keychron", "Laptop", "Tai nghe", "Ban phim"];

function parseArgs(argv) {
  const args = { users: 200, products: 20000 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--users") args.users = Number(argv[++i]);
    if (argv[i] === "--products") args.products = Number(argv[++i]);
  }
  return args;
}

const { users: USER_COUNT, products: PRODUCT_COUNT } = parseArgs(process.argv.slice(2));

// Timeout bat buoc — xem ghi chu trong tools/reset-lockout.mjs: mot request treo
// se ket toan bo pipeline seed hang gio khong bao loi.
const FETCH_TIMEOUT_MS = 15000;

async function postJson(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // response khong phai JSON — giu json = null
  }
  return { status: res.status, body: json };
}

async function runInBatches(items, worker, label) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(worker));
    process.stdout.write(`\r  ${label}: ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`);
  }
  process.stdout.write("\n");
}

function csvEscape(value) {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(filename, header, rows) {
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((h) => csvEscape(row[h])).join(","));
  }
  writeFileSync(join(DATA_DIR, filename), lines.join("\n") + "\n", { encoding: "utf8" });
  console.log(`  -> ${filename}: ${rows.length} dong du lieu`);
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  console.log(`== Seed HW05 — API_URL=${API_URL} — users=${USER_COUNT} products=${PRODUCT_COUNT} ==\n`);

  // 0. Xac nhan admin dang nhap duoc — dong thoi xac nhan backend con song
  const adminLogin = await postJson("/api/login", { email: "admin@eshop.com", password: "Admin123!" });
  if (adminLogin.status !== 200) {
    console.error(`Khong dang nhap duoc admin (status=${adminLogin.status}). Backend co dang chay khong?`);
    process.exit(1);
  }
  console.log(`[OK] Dang nhap admin thanh cong, user.id=${adminLogin.body.user.id}\n`);

  const indices = Array.from({ length: USER_COUNT }, (_, i) => i + 1);

  // LUU Y QUAN TRONG (phat hien khi test script nay): POST /api/register KHONG kiem tra
  // email trung — bang `users` khong co UNIQUE constraint tren cot email (database.js:50-61).
  // Goi register 2 lan cung email se tao 2 dong rieng biet, khong bao gio tra loi.
  // Vi vay KHONG the dua vao "register that bai" de biet tai khoan da ton tai (nhu ban nhap
  // dau cua doc 03 gia dinh) — phai LOGIN THU truoc, chi register khi login that bai (401).
  // Day la mot bug that cua SUT, ghi lai o day de dua vao AI Audit / can nhac bao cao.
  async function ensureAccount(email, name, password) {
    const loginRes = await postJson("/api/login", { email, password });
    if (loginRes.status === 200 && loginRes.body?.user?.id) {
      return { email, user_id: loginRes.body.user.id, created: false };
    }
    const registerRes = await postJson("/api/register", { name, email, password });
    if (registerRes.status !== 200) {
      return { email, user_id: null, created: false, error: `register status=${registerRes.status}` };
    }
    const loginRes2 = await postJson("/api/login", { email, password });
    if (loginRes2.status === 200 && loginRes2.body?.user?.id) {
      return { email, user_id: loginRes2.body.user.id, created: true };
    }
    return { email, user_id: null, created: true, error: `login sau register status=${loginRes2.status}` };
  }

  // 1. Dam bao N tai khoan hop le ton tai (khong tao trung) va lay user_id that
  console.log(`Buoc 1/4 — dam bao ${USER_COUNT} tai khoan hop le ton tai (perf-u{i}@hw05.test), lay user_id`);
  const validUsersRaw = [];
  await runInBatches(
    indices,
    async (i) => {
      const email = `perf-u${i}@hw05.test`;
      const result = await ensureAccount(email, `PerfUser${i}`, PASSWORD);
      validUsersRaw.push(result);
    },
    "tai khoan hop le",
  );
  const validUsers = validUsersRaw.filter((r) => r.user_id).map((r) => ({ email: r.email, password: PASSWORD, user_id: r.user_id }));
  const validCreated = validUsersRaw.filter((r) => r.created && r.user_id).length;
  const validExisted = validUsersRaw.filter((r) => !r.created && r.user_id).length;
  const validFailed = validUsersRaw.filter((r) => !r.user_id);
  console.log(`  tao moi: ${validCreated} · da ton tai tu truoc (dung lai): ${validExisted} · loi: ${validFailed.length}\n`);

  // 2. Dam bao N tai khoan moi lockout ton tai (khong tao trung)
  console.log(`Buoc 2/4 — dam bao ${USER_COUNT} tai khoan moi lockout ton tai (lock-u{i}@hw05.test)`);
  const lockUsersRaw = [];
  await runInBatches(
    indices,
    async (i) => {
      const email = `lock-u${i}@hw05.test`;
      const result = await ensureAccount(email, `LockUser${i}`, PASSWORD);
      lockUsersRaw.push(result);
    },
    "tai khoan moi lockout",
  );
  const lockCreated = lockUsersRaw.filter((r) => r.created && r.user_id).length;
  const lockExisted = lockUsersRaw.filter((r) => !r.created && r.user_id).length;
  const lockFailed = lockUsersRaw.filter((r) => !r.user_id);
  console.log(`  tao moi: ${lockCreated} · da ton tai tu truoc (dung lai): ${lockExisted} · loi: ${lockFailed.length}\n`);

  const loginFailures = [...validFailed, ...lockFailed];
  if (loginFailures.length > 0) {
    console.log(`  [CANH BAO] ${loginFailures.length} tai khoan khong xu ly duoc:`);
    for (const f of loginFailures.slice(0, 5)) console.log(`    ${f.email} → ${f.error}`);
    if (loginFailures.length > 5) console.log(`    ... va ${loginFailures.length - 5} tai khoan khac`);
    console.log("");
  }

  const lockoutUsers = lockUsersRaw
    .filter((r) => r.user_id)
    .map((r) => ({ email: r.email, wrong_password: WRONG_PASSWORD }));

  // 4. Tao san pham — POST /api/products khong can token (server.js:167)
  console.log(`Buoc 3/4 — tao ${PRODUCT_COUNT} san pham`);
  const productIndices = Array.from({ length: PRODUCT_COUNT }, (_, i) => i + 1);
  const createdProducts = [];
  let failedProducts = 0;
  await runInBatches(
    productIndices,
    async (i) => {
      const keyword = KEYWORDS[i % KEYWORDS.length];
      const name = `PerfProduct-${i}-${keyword}`;
      const price = 100000 + Math.floor(Math.random() * 4900000);
      const category_id = (i % 3) + 1;
      const res = await postJson("/api/products", {
        name,
        price,
        description: `Du lieu hieu nang HW05 #${i}`,
        imageUrl: "https://placehold.co/300x300/png?text=Perf",
        category_id,
      });
      if (res.status === 200 && res.body?.id) {
        createdProducts.push({ product_id: res.body.id, product_name: name, price });
      } else {
        failedProducts++;
      }
    },
    "tao san pham",
  );
  console.log(`  tao thanh cong: ${createdProducts.length}/${PRODUCT_COUNT} · loi: ${failedProducts}\n`);

  // 5. Ghi 5 file CSV
  console.log("Buoc 4/4 — ghi 5 file CSV vao data/");

  writeCsv("users.csv", ["email", "password", "user_id"], validUsers);
  writeCsv("users_lockout.csv", ["email", "wrong_password"], lockoutUsers);

  // Tu khoa tim kiem — hai rang buoc:
  //
  // (1) KHONG duoc chua ' % _ — server.js:144 noi chuoi SQL truc tiep (docs/03 §3.2).
  //
  // (2) KICH THUOC TAP KET QUA phai co gioi han. `GET /api/products` KHONG CO PHAN TRANG
  //     (server.js:141-157) — no tra ve TOAN BO dong khop. Ten san pham seed co dang
  //     `PerfProduct-{i}-{keyword}` voi keyword xoay vong 8 gia tri, nen:
  //         "iPhone"      -> khop 2.500 dong  (~500 KB JSON)
  //         "Perf"        -> khop 20.000 dong (~4 MB JSON!)
  //     Dung cac tu khoa do o 200 VU thi thu do duoc la toc do Node serialize JSON,
  //     KHONG phai chi phi truy van — va thuc te da lam tien trinh backend chet
  //     (xem bao cao §2.4 dong 8 va bug-report P5).
  //
  //     Vi the dung tien to so: "PerfProduct-123" khop nhung i bat dau bang "123"
  //     (123, 1230-1239, 12300-12399) = ~111 dong; tien to 4 chu so = ~11 dong.
  //     Phan bo duoi mo phong hanh vi that: duyet danh muc (~111) / tim hep (~11) /
  //     tim dung ten (1-2).
  const browseTerms = ["100","112","128","134","147","156","163","178","185","192"]
    .map((p) => `PerfProduct-${p}`);                       // ~111 dong moi tu khoa
  const narrowTerms = ["1234","2468","3579","4680","5791","6802","7913","9024","1357","8135"]
    .map((p) => `PerfProduct-${p}`);                       // ~11 dong moi tu khoa
  const exactTerms = [
    "iPhone 15 Pro Max", "Samsung Galaxy S24 Ultra", "MacBook Pro M3",
    "Tai nghe AirPods Pro 2", "Ban phim co Keychron Q1",
  ];                                                        // 1 dong moi tu khoa
  const searchTerms = [...browseTerms, ...narrowTerms, ...exactTerms].map((keyword) => ({ keyword }));
  writeCsv("search-terms.csv", ["keyword"], searchTerms);

  // Lay tu id THAT vua tao — id khong ton tai van tra 200+{} (server.js:159-161)
  const sampleSize = Math.min(500, createdProducts.length);
  const step = Math.max(1, Math.floor(createdProducts.length / Math.max(sampleSize, 1)));
  const sampledProducts = [];
  for (let i = 0; i < createdProducts.length && sampledProducts.length < sampleSize; i += step) {
    sampledProducts.push(createdProducts[i]);
  }
  writeCsv("products.csv", ["product_id", "product_name", "price"], sampledProducts);

  // total_amount LUON > 500000 — server.js:379 dung `>` khong phai `>=` (off-by-one B006, HW02)
  const orders = Array.from({ length: 50 }, (_, i) => ({
    total_amount: 600000 + (i % 15) * 100000,
    shipping_address: `${i + 1} Duong Hieu Nang, Quan HW05, TP.HCM`,
    coupon_code: "BIGBUY",
  }));
  writeCsv("orders.csv", ["total_amount", "shipping_address", "coupon_code"], orders);

  // Tong ket
  const productsAfterRes = await fetch(`${API_URL}/api/products`);
  const productsAfter = await productsAfterRes.json().catch(() => []);
  console.log(`\n== Tong ket ==`);
  console.log(`  Tai khoan hop le: ${validCreated} tao moi + ${validExisted} da co truoc → ${validUsers.length} co user_id trong CSV`);
  console.log(`  Tai khoan moi lockout: ${lockCreated} tao moi + ${lockExisted} da co truoc → ${lockoutUsers.length} dong trong CSV`);
  console.log(`  San pham: ${createdProducts.length}/${PRODUCT_COUNT} tao thanh cong, ${failedProducts} loi`);
  console.log(`  Tong so dong bang 'products' HIEN TAI: ${productsAfter.length} — GHI SO NAY VAO results/run-log.md moi lan chay lot do.`);

  if (loginFailures.length > 0 || failedProducts > 0) {
    console.log(`\n[CANH BAO] Co loi xay ra — kiem tra lai truoc khi dung file CSV cho luot do that.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Loi khong mong doi:", err);
  process.exit(1);
});
