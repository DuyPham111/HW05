# Endpoint Selection — HW05 Performance Testing (§5)

**Sinh viên:** Phạm Vũ Ngọc Duy — **MSSV:** 23127183 — **Nhóm:** 10
**SUT:** EShop — https://github.com/ttbhanh/eshop-sut · handler: `backend/server.js`

> File này là bằng chứng nộp kèm cho §5: workflow đã chọn, 3 nhóm endpoint được phủ, các lựa chọn bị loại có chủ đích, và bảng đăng ký chống trùng trong nhóm.

---

## 1. Workflow đã chọn — *Customer Storefront* (7 bước)

Mỗi vòng lặp của một virtual user chạy đúng chuỗi sau:

```
[1] POST /api/login              (auth-heavy)    → lấy JWT token + user_id
[2] GET  /api/products?search=X  (read-heavy)     → tìm sản phẩm, LIKE '%X%' full scan
[3] GET  /api/products/{id}      (read-heavy)     → xem chi tiết 1 sản phẩm
[4] POST /api/cart                (transactional) → thêm vào giỏ (ghi RAM server)
[5] POST /api/apply-coupon        (transactional) → áp mã BIGBUY
[6] POST /api/checkout            (transactional) → INSERT thật vào bảng orders
[7] POST /api/login (sai mật khẩu) (auth-heavy)    → nhánh phủ account-lockout §6
```

## 2. Bảng ánh xạ: bước → endpoint → nhóm §5 → chi phí ở server

| Bước | Endpoint | Nhóm §5 | Chi phí thật ở server (trích `backend/server.js`) | Vì sao đáng đo |
|---|---|---|---|---|
| 1 | `POST /api/login` | **auth-heavy** | `db.get("SELECT * FROM users WHERE email = ?", ...)` — `server.js:35`. Khi đúng mật khẩu: `db.run("UPDATE users SET login_attempts = 0, locked_until = NULL ...")` — `server.js:48`. So sánh mật khẩu **plaintext** `user.password === password` — `server.js:46` | Mọi bước sau phụ thuộc token của nó. Không băm mật khẩu (không bcrypt) nên p95 của endpoint này **không** đại diện cho một hệ thống có hash mật khẩu đúng cách — phải ghi rõ điều này khi đọc số liệu, nếu không là đọc sai metric (Task 2). |
| 2 | `GET /api/products?search=` | **read-heavy** | `` `SELECT * FROM products WHERE name LIKE '%${searchQuery}%'` `` — nối chuỗi trực tiếp, **không tham số hóa** — `server.js:144` | `LIKE '%...%'` có wildcard ở **đầu chuỗi** nên B-tree index không dùng được kể cả khi thêm — xác nhận không có `CREATE INDEX` nào trong `database.js`. Đây là endpoint đọc đắt nhất, và là lý do đề xuất "thêm index" của Task 2 sẽ bị phân loại **feasible-nhưng-vô-ích**. |
| 3 | `GET /api/products/{id}` | **read-heavy** | `db.get("SELECT * FROM products WHERE id = ?", ...)` — đọc theo PRIMARY KEY — `server.js:160` | Đặt cạnh bước 2 để **tách** chi phí *full scan* khỏi chi phí *đọc PK thuần*. Lưu ý riêng: id không tồn tại vẫn trả **HTTP 200 + `{}`** (`server.js:160-161`), nên assertion phải kiểm có field `id`, không chỉ status. |
| 4 | `POST /api/cart` | **transactional** | `userCarts[userId].push(req.body)` — ghi vào **biến RAM toàn cục**, **0 truy vấn DB** — `server.js:290-293` | Không có giới hạn kích thước, không bao giờ bị xóa (kể cả sau checkout thành công) → ứng viên **rò rỉ bộ nhớ** rõ nhất của SUT. Là biến chính cần theo dõi ở lượt Soak. |
| 5 | `POST /api/apply-coupon` | **transactional** | `db.get("SELECT * FROM coupons WHERE code = ? AND is_active = 1", ...)` — `server.js:370`; nếu đủ ngưỡng còn thêm `db.get("SELECT COUNT(*) as usage_count FROM coupon_usage ...")` — `server.js:388`, hai truy vấn **nối tiếp** trong callback lồng nhau | Đường ống truy vấn lồng nhau tạo độ trễ cộng dồn — chi phí thật của nó nằm ở round-trip, không phải ở tính toán. |
| 6 | `POST /api/checkout` | **transactional** | `db.run("INSERT INTO orders (...) VALUES (...)")` — **ghi thật** vào DB — `server.js:302` | SQLite ghi tuần tự (single-writer), là điểm nghẽn ghi thật của cả hệ thống. Đây là chỗ đề xuất **bật SQLite WAL** của Task 2 có ý nghĩa thật. |
| 7 | `POST /api/login` (sai mật khẩu) | **auth-heavy** | nhánh else: `newAttempts = user.login_attempts + 2` (`server.js:54`), khóa khi `newAttempts >= 3` (`server.js:56`) tức **sau 2 lần sai**, `lockedUntil = Date.now() + 180000` = **180 giây** (`server.js:57`) | §6 đòi đích danh *"taking the account-lockout behaviour into account"* và yêu cầu reset lockout giữa các lượt Stress/Spike. Thiếu bước này là thiếu yêu cầu của đề. |

## 3. Vì sao workflow phủ đủ 3 nhóm — tỉ lệ request

| Nhóm §5 | Bước | Số bước | Tỉ lệ request/vòng |
|---|---|---|---|
| **auth-heavy** | 1, 7 | 2 | 2/7 ≈ 28,6% |
| **read-heavy** | 2, 3 | 2 | 2/7 ≈ 28,6% |
| **transactional** | 4, 5, 6 | 3 | 3/7 ≈ 42,8% |

Cả bốn test plan (Load / Stress / Spike / Soak) chạy **cùng** workflow này, chỉ khác tham số tải — đúng yêu cầu §6 *"All three test plans must exercise the same end-to-end workflow"*.

## 4. Lựa chọn bị loại và lý do

Ghi rõ ra để chứng minh đây là quyết định có chủ đích, không phải bỏ sót:

| Không dùng | Lý do |
|---|---|
| `POST /api/admin/import-products` | thuộc workflow *admin back-office* — bài tham khảo trong `HW05/tham_khao/` (sinh viên 23127178, khác trường/lớp) đã dùng workflow này; §5 cấm trùng workflow trong nhóm và §17 cấm chép bài |
| `POST /api/coupon-usage` | gọi nó sẽ ghi vào `coupon_usage`; sau 1 lượt, `max_uses_per_user = 1` của `BIGBUY` bị chạm → bước 5 trả 400 hàng loạt từ lượt thứ hai trở đi → **error rate giả**. Cố tình không gọi endpoint này; ghi nhận workflow vì thế không mô phỏng đúng ràng buộc "1 lần dùng/user" của coupon |
| coupon `SAVE10` (type `percent`) | dính bug công thức đã báo ở HW02 (B007): `Math.floor(total_amount * (1 - coupon.discount_value))` với `discount_value = 10` (không phải `0.1`) → `total * (1 - 10) = -9 * total`, tiền giảm ra số âm. Dùng `BIGBUY` (type `fixed`, giảm cố định 50.000đ) cho luồng chính để kết quả **xác định**; bug percent không báo lại ở HW05 |
| `PUT /api/orders/:id/cancel` | state machine FR-10 sẽ trả 400 cho phần lớn request theo trạng thái đơn hàng → phần lớn sample là 400, tín hiệu ghi thật bị che |
| Frontend web/admin (`:5173`, `:5174`) | §5 nói rõ *"backend API endpoint groups"* — đo qua trình duyệt sẽ trộn chi phí render/JS vào số liệu hiệu năng backend |

## 5. Đăng ký chống trùng trong nhóm (§5)

> §5: *"Ensure that your selection is not duplicated among the members of your group: no two members may test the same workflow."*

**Trạng thái:** ⚠️ *(SV chưa tự làm — việc này cần thao tác thủ công của sinh viên, không thể tự động hóa)*

**Việc cần làm ngay:**
1. Nhắn vào nhóm chat (Messenger/Zalo/Discord của nhóm 10), đăng ký đúng nguyên văn:
   > *23127183 — HW05 đăng ký workflow **Customer Storefront**: `POST /api/login` → `GET /api/products?search` → `GET /api/products/:id` → `POST /api/cart` → `POST /api/apply-coupon` → `POST /api/checkout` (+ nhánh login sai để phủ lockout).*
2. Chụp màn hình tin nhắn + phản hồi/đăng ký của các bạn khác → lưu vào `docs/nhom-dang-ky-workflow.png`.
3. Điền bảng dưới đây bằng dữ liệu thật của cả nhóm.

| Thành viên | MSSV | Workflow đăng ký | Endpoint chính | Ngày chốt |
|---|---|---|---|---|
| Phạm Vũ Ngọc Duy | 23127183 | Customer Storefront | login · products?search · products/:id · cart · apply-coupon · checkout | *(điền ngày thật)* |
| *(tên)* | *(MSSV)* | | | |
| *(tên)* | *(MSSV)* | | | |
| *(tên)* | *(MSSV)* | | | |

> Mục này **không tự động kiểm được** — TA sẽ đối chiếu bảng này với thực tế bài làm của cả nhóm. Làm ngay, đừng để tới lúc đóng gói mới nhớ ra.
