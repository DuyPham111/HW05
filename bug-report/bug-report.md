# Bug Report — HW05 Performance Testing on EShop

**Họ và tên:** Phạm Vũ Ngọc Duy · **MSSV:** 23127183 · **Nhóm:** 10
**SUT:** EShop — https://github.com/ttbhanh/eshop-sut
**Repo GitHub Issues:** *(điền)*
**Môi trường:** Windows 11, Node v22.16, JMeter 5.6.3, backend `:3000`, `products` = *(N)* dòng
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
| **P1** | `POST /api/register` không có ràng buộc UNIQUE trên `email` — đăng ký trùng email luôn thành công, tạo tài khoản trùng thay vì báo lỗi | Chức năng | *(điền — gợi ý Medium/High: không crash, nhưng vi phạm bất biến dữ liệu cơ bản của một hệ thống auth)* | Phát hiện khi viết `tools/seed-perf-data.mjs` (docs/03) — gọi lại `POST /api/register` với email đã tồn tại (`perf-u1@hw05.test`) vẫn trả **200** + `id` mới thay vì lỗi. Đối chiếu `database.js:50-61`: bảng `users` không có `UNIQUE` trên cột `email`. Cần chụp ảnh minh họa (2 lần gọi cùng email, 2 `id` khác nhau) trước khi báo Issue chính thức | | Open — *(SV cần: chụp ảnh bằng chứng, viết steps đầy đủ theo mẫu §2, tạo Issue thật ở docs 11)* |
| **P5** | `GET /api/products` **không có phân trang** — trả về toàn bộ tập khớp, tới **3,6 MB/request**; ở 200 VU làm tiến trình backend bị OOM-kill | Hiệu năng | **High** | Đo thật: `?search=Perf` → **3.605.474 byte**; `/api/products` không lọc → **3.606.442 byte**. Lượt Spike đầu tiên dùng từ khoá quét toàn bảng: chạy **45 phút** thay vì 4, chỉ **70 sample**, `max elapsed = 2.717.210 ms`, tiến trình `node.exe` **biến mất** khỏi Task Manager, log backend **không có dòng lỗi nào**. Sau khi đổi sang từ khoá có tập kết quả giới hạn (~20 KB): cùng plan chạy **19.454 sample, 0% error, đúng 4:00** | | Open — *(SV cần: chụp ảnh, viết steps, tạo Issue)* |
| **P6** | **Khởi động lại backend là XOÁ SẠCH database** | Chức năng | **High** | `server.js:4` `require("./database")` → `database.js` gọi `initDatabase()` ngay lúc load (dòng cuối file), và việc đầu tiên nó làm là `DROP TABLE IF EXISTS` cho cả 6 bảng (`database.js:13-21`). Hệ quả đã gặp thật: sau khi backend chết vì P5, khởi động lại làm mất toàn bộ 20.005 sản phẩm + 400 tài khoản đã seed, phải seed lại từ đầu | | Open — *(SV cần: chụp ảnh, viết steps, tạo Issue)* |
| **P2** | | | | | | Open |
| **P3** | | | | | | Open |

**Ứng viên đã kiểm và LOẠI** (ghi ra để chứng minh không báo bug bừa):

| Ứng viên | Vì sao loại | Bằng chứng kiểm |
|---|---|---|
| | | |

---

## 2. Chi tiết từng bug

### P1 — *(tiêu đề)*

**Pre-conditions:**
**Steps:**
**Expected:**
**Actual:**
**Nguyên nhân (code):** `server.js:…`
**Phát hiện trong bối cảnh nào:** *(quan trọng — kể lại nó lộ ra ở bước nào của quy trình đo)*
**Severity:**

![P1](screenshots/p1.png)

---

### P2 — *(tiêu đề)*

**Pre-conditions:**
**Steps:**
**Expected:**
**Actual:**
**Nguyên nhân (code):**
**Severity:**

![P2](screenshots/p2.png)

---

### P3 — *(tiêu đề — nếu là performance issue, phải kèm bảng số theo thời gian)*

**Pre-conditions:**
**Steps:**
**Expected:**
**Actual:**
**Số liệu:** *(bảng RSS/latency theo phút, trích từ `endurance/endurance-threshold.md`)*
**Phép kiểm chứng độc lập đã làm:** *(vd: dừng tải 60s, đọc lại RSS → phân biệt rò rỉ với áp lực GC)*
**Severity:**

![P3](screenshots/p3.png)
