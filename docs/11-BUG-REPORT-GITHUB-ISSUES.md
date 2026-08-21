# 11 — Bug report và GitHub Issues

> §6: *"Log any **genuine bugs or performance issues** (error responses, crashes, functional regressions) on your GitHub Issues page with screenshots. Logging performance issues such as high latency or elevated error rate is **encouraged but not penalised if absent**."*
> Nghĩa là: bug **chức năng** phát hiện được trong lúc chạy tải thì **phải** báo; bug **hiệu năng** thì báo được là điểm cộng.
> Output: `bug-report/bug-report.md` (+PDF) · `bug-report/screenshots/` · Issues trên GitHub · script `verify-bugs` để chạy lại bằng chứng.

---

## 1. Bug nào **không** được báo lại

Ở HW02 bạn đã báo 16 bug (B001–B016) trên repo nhóm. Những bug đó **đã có Issue rồi** — báo lại là trùng lặp, và TA sẽ thấy ngay vì cùng nội dung.

| Đã báo ở HW02 | Issue cũ | HW05 làm gì |
|---|---|---|
| B001 lockout sau 2 lần (`+2`) | có | **Trích dẫn** khi giải thích thiết kế workflow, **không** mở Issue mới |
| B002 khóa 180s thay vì 30s | có | như trên |
| B006 off-by-one `>` ở coupon | có | như trên (là lý do `total_amount` phải > 500000) |
| B007 công thức percent sai | có | như trên (là lý do dùng `BIGBUY` chứ không phải `SAVE10`) |
| B013 ô tổng tiền sửa được | có | như trên |

Trong `bug-report.md`, mở đầu bằng một mục **"Bug đã báo từ HW02, chỉ trích dẫn"** kèm link Issue cũ. Việc này thể hiện bạn theo dõi liên tục, và tránh bị hiểu là báo trùng.

---

## 2. Bug **mới** mà chỉ khi chạy tải mới lộ ra — chỗ nên tìm

Đây là danh sách ứng viên có căn cứ từ code, xếp theo khả năng bắt được. **Chỉ báo cái nào bạn thật sự quan sát được kèm bằng chứng** — đừng báo cái chỉ đọc code mà đoán.

### 2.1 Rò rỉ bộ nhớ ở `userCarts` (khả năng cao nhất)

- **Code:** `server.js:290` — `userCarts[userId].push(req.body)`, không giới hạn, không xóa; `POST /api/checkout` không gọi `clearCart`.
- **Bằng chứng cần có:** bảng RSS theo phút từ `npm run drift` cho thấy tăng đơn điệu + phép kiểm "dừng tải 60s, RSS không về" ([08](08-ENDURANCE-THRESHOLD.md) §5).
- **Loại:** performance issue (điểm cộng).

### 2.2 `SQLITE_BUSY` / HTTP 500 ở bước checkout dưới tải cao

- **Code:** `server.js:300` `INSERT INTO orders`, không có retry, không có `busy_timeout`.
- **Bằng chứng cần có:** dòng trong `.jtl` có `responseCode=500` ở sampler checkout + nội dung response từ **View Results Tree** ở lượt Spike.
- **Kiểm:**

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && grep -h ",500," results/jtl/*.jtl | head -20
```

- **Loại:** bug chức năng thật (error response) → **phải** báo nếu bắt được.

### 2.3 `GET /api/products?search=` trả 500 với ký tự `'` — SQL injection

- **Code:** `server.js:144` — `LIKE '%${searchQuery}%'` nối chuỗi trực tiếp, không tham số hóa.
- **Đây là lỗ hổng bảo mật thật**, và khác với HW02 (ở đó bạn chỉ kiểm SQLi ở form login và nó **an toàn** vì dùng parameterized query — xem `FR02-BV-R03` Pass). Endpoint search thì **không** an toàn. Đây là **bug mới, chưa báo**.
- **Bằng chứng:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/products?search=a'" && curl -s "http://localhost:3000/api/products?search=x%25'%20UNION%20SELECT%20id,email,password,role,id%20FROM%20users--" | head -c 400
```

- **Loại:** bug chức năng + bảo mật. **Severity: Critical.** Báo Issue riêng.

> Cẩn thận khi viết Issue: mô tả lỗ hổng và cách tái lập trên **SUT demo cục bộ của mình**, không tấn công hệ thống của ai khác. Đây là SUT do giảng viên phát hành cho mục đích tìm lỗi.

### 2.4 `GET /api/products/:id` trả 200 cho id không tồn tại

- **Code:** `server.js:160` — `if (!row) return res.status(200).json({})`.
- **Loại:** functional regression (sai chuẩn REST, phải là 404). Nhẹ nhưng thật, và bạn phát hiện nó **trong lúc thiết kế assertion** — kể được câu chuyện đó.
- **Loại:** bug chức năng, Severity Low/Medium.

### 2.5 Thời gian đáp ứng bước search tăng phi tuyến theo số dòng `products`

- Nếu bạn đo được ở hai kích thước dữ liệu khác nhau (vd 5 dòng lúc đầu vs 20.000 sau khi seed) → có số liệu so sánh.
- **Cẩn thận:** đây là **tương quan**, và bạn không cô lập được biến (hai lượt chạy ở hai thời điểm). Viết là "quan sát", đừng viết là "chứng minh".
- **Loại:** performance issue (điểm cộng, không bắt buộc).

---

## 3. `bug-report/verify-bugs.sh` — chạy lại được bằng chứng

Bài tham khảo có script này và nó là ý hay: TA chạy một lệnh là tái lập được mọi bug bạn báo. Làm bản Node cho chạy được trên Windows:

**Prompt:**

> Viết `bug-report/verify-bugs.mjs` (Node 22, ESM). Với mỗi bug tôi báo, nó gọi request thật vào `http://localhost:3000` và in `[CONFIRMED]`/`[NOT REPRODUCED]` kèm response thật:
> - BUG-P1: `GET /api/products?search=a'` → kỳ vọng HTTP 500 (SQL injection do nối chuỗi)
> - BUG-P2: `GET /api/products/999999` → kỳ vọng HTTP **200** và body `{}` (đáng lẽ phải 404)
> - BUG-P3: [nếu bắt được 500 ở checkout] gửi N request checkout song song, đếm số 500
> - BUG-P4: [nếu có rò rỉ] đọc `endurance/resources/*.csv`, in RSS phút đầu / phút cuối / % chênh
> In tổng kết cuối: bao nhiêu confirmed. `process.exit(0)` luôn (đây là script kiểm chứng, không phải test gate).

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && node bug-report/verify-bugs.mjs
```

Chụp màn hình output → `bug-report/screenshots/verify-bugs-output.png` → nhúng vào `bug-report.md`.

---

## 4. Mẫu `bug-report/bug-report.md`

Giữ đúng format 1-block-1-bug đã dùng ở HW02 (format đó đã được 100đ):

```markdown
# Bug Report — HW05 Performance Testing on EShop

**Họ và tên:** Phạm Vũ Ngọc Duy · **MSSV:** 23127183
**SUT:** EShop — https://github.com/ttbhanh/eshop-sut
**Repo GitHub Issues:** [link repo nhóm hoặc cá nhân]
**Môi trường:** Windows 11, Node v22.16, JMeter 5.6.3, backend :3000, dữ liệu `products` = {N} dòng
**Bằng chứng chạy lại được:** `node bug-report/verify-bugs.mjs`

---

## 0. Bug đã báo từ HW02 — chỉ trích dẫn, KHÔNG báo lại
| ID cũ | Nội dung | Issue | Vai trò trong HW05 |
|---|---|---|---|
| B001 | lockout sau 2 lần sai (`+2`) | [#…] | căn cứ tách CSV tài khoản mồi, và giải thích 403 ở bước 7 |
| B006 | off-by-one `>` ở apply-coupon | [#…] | căn cứ đặt `total_amount` > 500.000 trong `orders.csv` |
| B007 | công thức percent sai | [#…] | căn cứ chọn `BIGBUY` (fixed) thay `SAVE10` cho luồng chính |

---

## 1. Bảng tổng hợp bug MỚI của HW05

| ID | Tiêu đề | Loại | Severity | Bằng chứng | GitHub Issue | Status |
|---|---|---|---|---|---|---|
| **P1** | `GET /api/products?search` nối chuỗi SQL → 500 và cho phép SQL injection | Chức năng + Bảo mật | **Critical** | [ảnh](screenshots/p1-sqli.png) · `verify-bugs.mjs` | [#…] | Open |
| **P2** | `GET /api/products/:id` trả 200 + `{}` cho id không tồn tại | Chức năng | Medium | [ảnh](screenshots/p2-200-empty.png) | [#…] | Open |
| **P3** | RSS của backend tăng {x}% trong 12 phút soak — `userCarts` không bao giờ được xóa | Hiệu năng | High | [bảng RSS](../endurance/endurance-threshold.md) · [ảnh](screenshots/p3-rss.png) | [#…] | Open |

## 2. Chi tiết từng bug

### P1 — …
**Pre-conditions:** backend chạy ở `:3000`, DB đã seed.
**Steps:** 1. `curl "http://localhost:3000/api/products?search=a'"` 2. Đọc status code và body.
**Expected:** HTTP 200 với mảng rỗng, hoặc HTTP 400 — tham số người dùng phải được tham số hóa.
**Actual:** HTTP **500**, body chứa thông báo lỗi SQL. Nguyên nhân: `server.js:144`
`SELECT * FROM products WHERE name LIKE '%${searchQuery}%'` nối chuỗi trực tiếp.
**Phát hiện trong bối cảnh nào:** khi thiết kế `data/search-terms.csv` cho bước read-heavy — một
keyword chứa dấu nháy làm cả sampler báo lỗi 500, và nếu không phát hiện thì error rate của lượt
Load sẽ bị nhiễu và bị đọc nhầm thành "server quá tải".
**Ghi chú đối chiếu HW02:** ở HW02 tôi đã kiểm SQL injection tại form đăng nhập (`FR02-BV-R03`) và
kết quả là **an toàn** (parameterized query). Endpoint search dùng cách khác và **không** an toàn —
tức lỗ hổng không đồng nhất giữa các endpoint của cùng backend.
**Severity:** Critical
![P1](screenshots/p1-sqli.png)
```

---

## 5. Tạo GitHub Issues

AI **không** tạo Issue thay bạn được (không có quyền trên tài khoản GitHub của bạn) — ở HW02 bạn đã ghi đúng điều này vào audit log, giữ nguyên cách làm đó.

Nếu có `gh` CLI thì nhanh hơn:

```bash
gh issue create --repo DuyPham111/HW05 --title "[PERF][P1] GET /api/products?search noi chuoi SQL - HTTP 500 va SQL injection" --body-file bug-report/issue-p1.md
```

Mỗi Issue phải có: bước tái lập, expected/actual, **ảnh nhúng sẵn** (kéo thả ảnh vào ô soạn Issue để GitHub tự upload), và trích số dòng code. Sau khi tạo, **dán link thật** vào cột "GitHub Issue" của `bug-report.md` — cột này để trống là mất điểm.

**Commit:** `docs: bug report 3 bug moi + verify-bugs chay lai duoc + link Issues`

---

→ Tiếp: [12-VIDEO-DEMO.md](12-VIDEO-DEMO.md)
