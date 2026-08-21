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
| **P1** | | | | | | Open |
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
