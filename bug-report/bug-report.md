# Bug Report — HW05 Performance Testing on EShop

**Họ và tên:** Phạm Vũ Ngọc Duy · **MSSV:** 23127183 · **Nhóm:** 10
**SUT:** EShop — https://github.com/ttbhanh/eshop-sut
**Repo GitHub Issues:** https://github.com/DuyPham111/HW05/issues
**Môi trường:** Windows 11, Node v22.16, JMeter 5.6.3, backend `:3000`, `products` = 20.005 dòng (lúc chạy `verify-bugs.mjs`)
**Bằng chứng chạy lại được:** `node bug-report/verify-bugs.mjs`

> Hướng dẫn: [`docs/11-BUG-REPORT-GITHUB-ISSUES.md`](../docs/11-BUG-REPORT-GITHUB-ISSUES.md)
> Chỉ đưa vào bảng những lỗi bạn **đã tự chạy và chụp được ảnh**. Dự đoán từ đọc code mà chưa quan sát được thì không phải bug.

---

## 0. Bug đã báo từ HW02 — chỉ trích dẫn, KHÔNG báo lại

| ID cũ | Nội dung | Issue cũ | Vai trò trong HW05 |
|---|---|---|---|
| B001 | Lockout sau 2 lần sai (`login_attempts + 2`, `server.js:54`) | *(link)* | căn cứ tách CSV tài khoản mồi; giải thích 403 ở bước 7 |
| B002 | Thời gian khóa 180s thay vì 30s (`server.js:57`) | *(link)* | căn cứ cooldown và thủ tục reset lockout giữa các lượt |
| B006 | Off-by-one `>` ở apply-coupon (`server.js:379`) | *(link)* | căn cứ đặt `total_amount` > 500.000 trong `orders.csv` |
| B007 | Công thức percent sai (`total*(1-10)`, `server.js:399`) | *(link)* | căn cứ chọn `BIGBUY` (fixed) thay `SAVE10` cho luồng chính |
| B013 | Ô tổng tiền sửa được, backend không tính lại | *(link)* | lý do `total_amount` do client quyết định — ảnh hưởng cách thiết kế payload |

---

## 1. Bảng tổng hợp bug MỚI của HW05

| ID | Tiêu đề | Loại | Severity | Bằng chứng | GitHub Issue | Status |
|---|---|---|---|---|---|---|
| **P3** | `GET /api/products?search=` nối chuỗi SQL trực tiếp → SQL injection, rút được toàn bộ bảng `users` (kể cả admin, mật khẩu plaintext) | Chức năng + Bảo mật | **Critical** | `curl` thật — xem §2.P3, output đầy đủ của `node bug-report/verify-bugs.mjs` | *(SV điền sau khi tạo Issue)* | Open — *(SV cần: ảnh, Issue)* |
| **P5** | `GET /api/products` **không có phân trang** — trả về toàn bộ tập khớp, tới **3,6 MB/request**; ở 200 VU làm tiến trình backend bị OOM-kill | Hiệu năng | **High** | Đo thật: `?search=Perf` → **3.605.474 byte**; `/api/products` không lọc → **3.606.442 byte** (xác nhận lại lúc viết report: 20.005 sản phẩm, **3.606.511 byte**). Lượt Spike đầu tiên dùng từ khoá quét toàn bảng: chạy **45 phút** thay vì 4, chỉ **70 sample**, `max elapsed = 2.717.210 ms`, tiến trình `node.exe` **biến mất** khỏi Task Manager, log backend **không có dòng lỗi nào**. Sau khi đổi sang từ khoá có tập kết quả giới hạn (~20 KB): cùng plan chạy **19.454 sample, 0% error, đúng 4:00** | *(SV điền sau khi tạo Issue)* | Open — *(SV cần: ảnh, Issue)* |
| **P6** | **Khởi động lại backend là XOÁ SẠCH database** | Chức năng | **High** | `server.js:4` `require("./database")` → `database.js` gọi `initDatabase()` ngay lúc load (dòng cuối file), và việc đầu tiên nó làm là `DROP TABLE IF EXISTS` cho cả 6 bảng (`database.js:13-21`, xác nhận lại bằng cách tải trực tiếp source từ GitHub trong `verify-bugs.mjs`, không phụ thuộc đường dẫn cục bộ). Hệ quả đã gặp thật: sau khi backend chết vì P5, khởi động lại làm mất toàn bộ 20.005 sản phẩm + 400 tài khoản đã seed, phải seed lại từ đầu | *(SV điền sau khi tạo Issue)* | Open — *(SV cần: ảnh, Issue)* |
| **P1** | `POST /api/register` không có ràng buộc UNIQUE trên `email` — đăng ký trùng email luôn thành công, tạo tài khoản trùng thay vì báo lỗi | Chức năng | **Medium** — không crash, nhưng vi phạm bất biến dữ liệu cơ bản của một hệ thống auth (2 tài khoản khác mật khẩu, cùng email, không rõ tài khoản nào "thật") | Phát hiện khi viết `tools/seed-perf-data.mjs` (docs/03) — gọi lại `POST /api/register` với email đã tồn tại vẫn trả **200** + `id` mới thay vì lỗi. Xác nhận lại thật trong `verify-bugs.mjs`: 2 lần gọi cùng email → id=405 và id=406. Đối chiếu `database.js`: bảng `users` không có `UNIQUE` trên cột `email` | *(SV điền sau khi tạo Issue)* | Open — *(SV cần: ảnh, Issue)* |
| **P2** | `GET /api/products/:id` trả **200 + `{}`** cho id không tồn tại thay vì 404 | Chức năng | Low/Medium — sai chuẩn REST, dễ gây lỗi ẩn ở client (client tưởng thành công vì status 200) | `curl http://127.0.0.1:3000/api/products/999999999` → HTTP 200, body `{}`. Phát hiện lúc thiết kế Response Assertion cho bước 3 (docs/04) — nếu chỉ assert status code sẽ không bắt được lỗi này, phải assert thêm `id` có tồn tại trong body | *(SV điền sau khi tạo Issue)* | Open — *(SV cần: ảnh, Issue)* |

**Ứng viên đã kiểm và LOẠI** (ghi ra để chứng minh không báo bug bừa):

| Ứng viên | Vì sao loại | Bằng chứng kiểm |
|---|---|---|
| P4 — Rò rỉ bộ nhớ ở `userCarts` (`server.js:290-293` push không giới hạn, không xoá sau checkout) | **Đã kiểm bằng lượt Soak thật (12 phút, 20 VU) và bị BÁC BỎ** — không phải "chưa đủ bằng chứng để báo" mà là "đã đo và không thấy" | `endurance/endurance-threshold.md` §5: RSS tăng lên đỉnh 113,7 MB ở phút 1 (JIT warm-up) rồi **ổn định quanh 76 MB** suốt 12 phút, không tăng đơn điệu. Phép kiểm độc lập "dừng tải, đọc lại RSS": **31,6 MB** — **thấp hơn cả** mức bắt đầu (61,5 MB) và mức trong-lượt (~76 MB). Nếu `userCarts` rò rỉ thật, RSS sau khi dừng phải ≥ mức trong-lượt, không thể thấp hơn cả lúc bắt đầu. Kết luận: đây là bộ nhớ tạm được V8 GC thu hồi hoàn toàn, không phải rò rỉ — **ở quy mô 12 phút / 20 VU đã đo được**. Không loại trừ khả năng lộ ra ở quy mô lớn hơn nhiều (xem giới hạn ở §6 file trên), nhưng với bằng chứng hiện có thì không đủ căn cứ để báo là bug |

---

## 2. Chi tiết từng bug

### P3 — `GET /api/products?search=` nối chuỗi SQL trực tiếp → SQL injection

**Pre-conditions:** backend chạy ở `:3000`, DB đã seed (users, products).
**Steps:**
1. `curl "http://127.0.0.1:3000/api/products?search=a'"` (một dấu nháy đơn)
2. `curl "http://127.0.0.1:3000/api/products?search=zzz_no_match%25%27%20UNION%20SELECT%201,email,password,role,1,1%20FROM%20users--%20"`

**Expected:** dấu nháy đơn trong tham số tìm kiếm phải được tham số hoá hoặc escape; HTTP 200 với mảng rỗng (không khớp), không bao giờ lộ cấu trúc câu truy vấn hay dữ liệu bảng khác.

**Actual:**
- Bước 1 → **HTTP 500**, body `<h1>Database Error</h1><p>SQLITE_ERROR: unrecognized token: "'"</p>` — rò rỉ chi tiết lỗi SQL thật ra client.
- Bước 2 (UNION injection, đoán đúng 6 cột khớp bảng `products`) → **HTTP 200**, trả về **406 dòng** dữ liệu thật của bảng `users`, dòng đầu tiên: `email="admin@eshop.com"`, `password="Admin123!"` — **mật khẩu lưu dạng plaintext**, rút được qua một endpoint không hề liên quan tới xác thực.

**Nguyên nhân (code):** `server.js:144` — `db.all(\`SELECT * FROM products WHERE name LIKE '%${searchQuery}%'\`)` nối chuỗi tham số người dùng trực tiếp vào câu SQL, không dùng parameterized query (`?` + mảng tham số) như các endpoint khác trong cùng file.

**Phát hiện trong bối cảnh nào:** khi thiết kế `data/search-terms.csv` cho bước read-heavy (docs/03) — một từ khoá vô tình chứa dấu nháy làm cả sampler báo lỗi 500 trong lượt validate; nếu không phát hiện, error rate của lượt Load sẽ bị nhiễu và bị đọc nhầm thành "server quá tải" thay vì lỗi bảo mật thật.

**Ghi chú đối chiếu HW02:** ở HW02 đã kiểm SQL injection tại form đăng nhập (`FR02-BV-R03`) và **an toàn** (parameterized query, xác nhận `server.js:35` dùng `db.get("SELECT * FROM users WHERE email = ?", [email], ...)`). Endpoint search dùng cách nối chuỗi khác và **không an toàn** — cùng một backend, hai cách viết query khác nhau cho hai kết quả bảo mật trái ngược nhau.

**Chạy lại được:** `node bug-report/verify-bugs.mjs` → `BUG-P3a`, `BUG-P3b`.

**Severity:** **Critical** (rút được toàn bộ bảng người dùng, gồm cả tài khoản admin và mật khẩu, qua một endpoint public không cần xác thực).

![P3](screenshots/p3-sqli.png)

---

### P5 — `GET /api/products` không phân trang → OOM ở tải cao

**Pre-conditions:** backend chạy ở `:3000`, DB có 20.005 sản phẩm (seed cho perf test).
**Steps:**
1. `curl -s -o /dev/null -w "%{size_download}" "http://127.0.0.1:3000/api/products"`
2. Chạy lượt Spike (10 nền + 200 dội trong 5s) với `data/search-terms.csv` chứa từ khoá quét toàn bảng (vd `"Perf"`).

**Expected:** response có phân trang (`?page=&limit=`) hoặc giới hạn số bản ghi trả về mỗi request, không phụ thuộc kích thước bảng.

**Actual:** bước 1 → **3.606.511 byte** cho một request duy nhất (không có tham số lọc). Bước 2 (sự cố thật đã xảy ra, xem `docs/06`/`docs/TODO-CON-LAI.md`): mỗi request ở tải cao trả cùng kích thước MB, tại 200 VU đồng thời tổng băng thông/bộ nhớ đệm response vượt quá khả năng của tiến trình → lượt chạy kéo dài **45 phút** thay vì 4 phút cấu hình, chỉ ghi được **70 sample**, `max elapsed = 2.717.210 ms`, và tiến trình `node.exe` **biến mất khỏi Task Manager** (bị hệ điều hành kill do cạn bộ nhớ) — log backend không có dòng lỗi nào vì tiến trình chết đột ngột, không kịp ghi log.

**Nguyên nhân (code):** `server.js` route `GET /api/products` và `GET /api/products?search=` đều `db.all(...)` không `LIMIT`, trả toàn bộ tập kết quả khớp trong một response JSON duy nhất.

**Phát hiện trong bối cảnh nào:** lượt validate đầu tiên của Spike (docs/06) — trước khi đổi sang từ khoá tìm kiếm có tập kết quả giới hạn (`PerfProduct-1234`, ~2KB/request), phải điều tra vì sao tiến trình biến mất giữa chừng.

**Severity:** **High** (không cần bất kỳ input độc hại nào — chỉ cần đủ tải đồng thời trên dữ liệu thật là sập tiến trình).

![P5](screenshots/p5-oom.png)

---

### P6 — Khởi động lại backend xoá sạch database

**Pre-conditions:** backend đang chạy, DB đã có dữ liệu.
**Steps:**
1. Dừng backend (`Ctrl+C` hoặc process chết vì lý do khác, vd bug P5).
2. Chạy lại `node server.js`.
3. `curl http://127.0.0.1:3000/api/products` → đếm số sản phẩm.

**Expected:** dữ liệu đã seed trước đó vẫn còn nguyên sau khi restart (đây là hành vi bình thường của mọi backend có DB persistent).

**Actual:** số sản phẩm về lại 0 (hoặc về đúng bộ seed mặc định ban đầu của repo, không phải dữ liệu đã seed cho perf test) — toàn bộ 20.005 sản phẩm và 400 tài khoản test bị xoá sạch, phải chạy lại `tools/seed-perf-data.mjs` từ đầu.

**Nguyên nhân (code):** `server.js:4` `require("./database")` nạp `database.js`, và `database.js` gọi `initDatabase()` **ngay lúc module được load** (không phải lúc có request đầu tiên) — việc đầu tiên hàm này làm là `DROP TABLE IF EXISTS` cho toàn bộ 6 bảng rồi mới `CREATE TABLE` lại, không có điều kiện nào kiểm tra "đã có dữ liệu chưa" trước khi xoá.

**Phát hiện trong bối cảnh nào:** khi khôi phục backend sau sự cố OOM của bug P5 (docs/06) — mất toàn bộ dữ liệu vừa seed, phải làm lại từ đầu, và từ đó phải ghi thành quy tắc bắt buộc "không bao giờ restart backend giữa các lượt đo" (`docs/TODO-CON-LAI.md` §0.1).

**Severity:** **High** (không mất dữ liệu do lỗi người dùng, mà mất do chính hành vi khởi động bình thường — cực kỳ dễ xảy ra ngoài ý muốn trong vận hành thật, vd sau khi deploy/restart server).

![P6](screenshots/p6-restart-wipe.png)

---

### P1 — `POST /api/register` không có ràng buộc UNIQUE trên `email`

**Pre-conditions:** backend chạy ở `:3000`.
**Steps:**
1. `curl -X POST http://127.0.0.1:3000/api/register -H "Content-Type: application/json" -d '{"name":"A","email":"dup@test.com","password":"Pass1!"}'`
2. Gọi lại y hệt bước 1 nhưng đổi `password` khác, cùng `email`.

**Expected:** lần gọi thứ 2 phải bị từ chối (HTTP 409 Conflict hoặc 400) vì email đã tồn tại.

**Actual:** cả hai lần đều trả **HTTP 200** kèm `{"message":"User registered successfully","id":...}`, hai `id` khác nhau cho cùng một email (xác nhận thật lúc viết report: `id=405` và `id=406` cho cùng email `dup-test-p1@hw05.test`).

**Nguyên nhân (code):** bảng `users` trong `database.js` không khai báo ràng buộc `UNIQUE` trên cột `email`; `POST /api/register` chỉ `INSERT` trực tiếp mà không kiểm tra tồn tại trước.

**Phát hiện trong bối cảnh nào:** khi viết `tools/seed-perf-data.mjs` (docs/03) — script ban đầu giả định "gọi register với email đã tồn tại sẽ báo lỗi" để quyết định user đã có hay chưa; giả định này sai, phải đổi chiến lược sang login-trước (`ensureAccount()`).

**Chạy lại được:** `node bug-report/verify-bugs.mjs` → `BUG-P1`.

**Severity:** Medium (không crash hệ thống, nhưng vi phạm bất biến dữ liệu cơ bản của một hệ thống xác thực — hai tài khoản khác nhau hoàn toàn dùng chung một email, không rõ tài khoản nào là "chủ" của email đó).

![P1](screenshots/p1-dup-email.png)

---

### P2 — `GET /api/products/:id` trả 200 + `{}` cho id không tồn tại

**Pre-conditions:** backend chạy ở `:3000`.
**Steps:** `curl -w "\nHTTP_CODE=%{http_code}\n" "http://127.0.0.1:3000/api/products/999999999"`
**Expected:** HTTP 404 Not Found.
**Actual:** HTTP **200**, body rỗng `{}`.
**Nguyên nhân (code):** `server.js:160` — `if (!row) return res.status(200).json({})` dùng nhầm status 200 thay vì 404 khi không tìm thấy bản ghi.
**Phát hiện trong bối cảnh nào:** khi thiết kế Response Assertion cho bước 3 (product detail) của workflow JMeter (docs/04) — nếu chỉ assert response code = 200 thì test **sẽ không bao giờ bắt được lỗi này**; phải assert thêm nội dung body (có field `id`) mới lộ ra được.
**Chạy lại được:** `node bug-report/verify-bugs.mjs` → `BUG-P2`.
**Severity:** Low/Medium (sai chuẩn REST; nguy hiểm hơn vẻ ngoài vì client có thể tưởng request thành công do status 200).

![P2](screenshots/p2-200-empty.png)
