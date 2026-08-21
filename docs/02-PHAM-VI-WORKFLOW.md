# 02 — Phạm vi §5: chốt workflow end-to-end và 3 nhóm endpoint

> Đây là bước **đầu tiên phải chốt và không được đổi giữa chừng**. Cả 4 test plan (Load/Stress/Spike/Soak) đều phát ra từ workflow này — đổi workflow sau khi đã chạy = phải chạy lại hết.
> Output của bước này: file `docs/endpoint-selection.md` (nộp kèm, là bằng chứng §5) + mục §1 của `report/main-report.md`.

---

## 1. Đề đòi gì ở §5

> *"Target three backend API endpoint groups: **Read-heavy** … **Auth-heavy** (login, taking the account-lockout behaviour into account) … **Transactional** (add-to-cart and checkout / order creation). Ensure that your selection is not duplicated among the members of your group."*

Và §6 Task 1 đòi thêm: *"All three test plans must exercise the **same end-to-end workflow**, covering all three endpoint groups."*

→ Nghĩa là: **một** workflow, **ba** nhóm, **ba** plan cùng workflow đó.

---

## 2. Workflow đã chốt: *Customer Storefront* — 7 bước

Mỗi vòng lặp của 1 virtual user (VU) chạy đúng chuỗi này:

```
[1] POST /api/login              (auth-heavy)   → lấy JWT token + user_id
[2] GET  /api/products?search=X  (read-heavy)   → tìm sản phẩm, LIKE '%X%' full scan
[3] GET  /api/products/{id}      (read-heavy)   → xem chi tiết 1 sản phẩm
[4] POST /api/cart               (transactional)→ thêm vào giỏ (ghi RAM server)
[5] POST /api/apply-coupon       (transactional)→ áp mã BIGBUY
[6] POST /api/checkout           (transactional)→ INSERT thật vào bảng orders
[7] POST /api/login (sai mk)     (auth-heavy)   → nhánh phủ account-lockout §6
```

### Vì sao chọn đúng 7 bước này

| Bước | Nhóm | Chi phí thật ở server (đọc từ `backend/server.js`) | Vì sao **đáng đo** |
|---|---|---|---|
| 1 | auth | `SELECT * FROM users WHERE email=?` + `UPDATE users SET login_attempts=0` | Mọi bước sau phụ thuộc nó. So sánh **không** băm mật khẩu (`user.password === password`, `server.js:46`) — nên p95 của nó **không** đại diện cho hệ thống có bcrypt. Phải ghi câu này vào báo cáo, nếu không là đọc sai metric. |
| 2 | read | `SELECT * FROM products WHERE name LIKE '%X%'` **nối chuỗi** (`server.js:144`) | `LIKE '%...%'` **không dùng được index** → full table scan. Đây là endpoint đọc đắt nhất, và là chỗ tối ưu "thêm index" của Task 2 sẽ **không** ăn thua — dữ kiện quan trọng để phân loại đề xuất của AI. |
| 3 | read | `SELECT * FROM products WHERE id=?` | Đọc theo primary key. Đặt cạnh bước 2 để **tách** chi phí *scan* khỏi chi phí *đọc thuần* — hai con số p95 này so với nhau là một kết quả có nội dung, không phải chỉ liệt kê. |
| 4 | trans | `userCarts[userId].push(...)` — **RAM, không DB** (`server.js:290`) | Ứng viên **rò rỉ bộ nhớ**: không có giới hạn, không bao giờ xóa. Là biến chính của lượt Soak. |
| 5 | trans | `SELECT coupons` + `SELECT COUNT(*) FROM coupon_usage` | Hai truy vấn nối tiếp trong callback lồng nhau → độ trễ cộng dồn. |
| 6 | trans | `INSERT INTO orders` | **Ghi thật**. SQLite ghi tuần tự, khóa file → điểm nghẽn ghi của cả hệ thống. Đây là chỗ đề xuất **bật WAL** của Task 2 có ý nghĩa. |
| 7 | auth | nhánh sai mật khẩu: `UPDATE users SET login_attempts = +2, locked_until` | §6 đòi đích danh *"taking the account-lockout behaviour into account"* và *"When Stress/Spike runs trigger the 3-fail login lockout, reset it between runs and document the steps."* Không có bước này là **thiếu yêu cầu**. |

### Ba nhóm được phủ như thế nào

| Nhóm §5 | Bước | Tỉ lệ request/vòng |
|---|---|---|
| **auth-heavy** | 1, 7 | 2/7 ≈ 28,6% |
| **read-heavy** | 2, 3 | 2/7 ≈ 28,6% |
| **transactional** | 4, 5, 6 | 3/7 ≈ 42,8% |

Ghi bảng này vào báo cáo — §6 đòi *"briefly justify how the workflow covers each endpoint group"*.

---

## 3. Bước 7 phải dùng **tài khoản mồi riêng** — đọc kỹ chỗ này

Bước 7 cố tình đăng nhập sai. Với `login_attempts + 2` và ngưỡng `>= 3`, tài khoản bị khóa **180 giây** sau **2** lần sai.

Nếu bước 7 dùng chính tài khoản của bước 1:
- vòng lặp thứ 1: sai lần 1 → attempts = 2
- vòng lặp thứ 2: **bước 1 đăng nhập đúng → reset về 0** (`server.js:47`)

→ nghe thì có vẻ tự khỏi, nhưng dưới tải cao, thứ tự request giữa các VU **không xác định**: hai lần sai có thể lọt vào giữa hai lần đúng → tài khoản khóa 180s → **toàn bộ vòng lặp sau của VU đó trả 403**, và bạn không phân biệt nổi "403 do thiết kế" với "403 do quá tải".

**Giải pháp đã chốt:** hai file CSV tách biệt.

| File | Dùng ở bước | Nội dung |
|---|---|---|
| `data/users.csv` | 1 | 200 tài khoản **hợp lệ**, mỗi VU một dòng — chỉ đăng nhập đúng, không bao giờ bị khóa |
| `data/users_lockout.csv` | 7 | 200 tài khoản **mồi**, chỉ dùng để đăng nhập sai; bị khóa là *đúng mong đợi* |

Chi tiết sinh CSV: [03-DATA-DRIVEN-CSV.md](03-DATA-DRIVEN-CSV.md).

> **Vì sao 200 dòng:** lượt Stress lên tới 200 VU. Nếu số tài khoản < số VU, JMeter sẽ vòng lại đầu file (`recycle`) → 2 VU cùng một tài khoản → cùng ghi `UPDATE login_attempts` lên **cùng một dòng `users`** → bạn đo ra tranh chấp ghi của *cách sinh tải*, không phải của endpoint. Đây là lỗi kinh điển, và AI hầu như luôn bỏ qua.

---

## 4. Chống trùng trong nhóm (§5) — phải có bằng chứng

§5: *"ensure that your selection is not duplicated among the members of your group: no two members may test the same workflow."*

**Việc phải làm:**

1. Nhắn vào nhóm chat, đăng ký workflow của mình bằng đúng chữ:
   > *23127183 — HW05 đăng ký workflow **Customer Storefront**: `POST /api/login` → `GET /api/products?search` → `GET /api/products/:id` → `POST /api/cart` → `POST /api/apply-coupon` → `POST /api/checkout` (+ nhánh login sai để phủ lockout).*
2. **Chụp màn hình** tin nhắn đó + phản hồi của các bạn khác → lưu `docs/nhom-dang-ky-workflow.png`.
3. Ghi bảng đăng ký của cả nhóm vào `docs/endpoint-selection.md`:

```markdown
| Thành viên | MSSV | Workflow đăng ký | Endpoint chính | Ngày chốt |
|---|---|---|---|---|
| Phạm Vũ Ngọc Duy | 23127183 | Customer Storefront | login · products?search · products/:id · cart · apply-coupon · checkout | 20/08/2026 |
| … | … | … | … | … |
```

4. Trong `report/main-report.md` §1.1: một đoạn nói rõ đã đăng ký, không trùng ai, kèm đường dẫn tới ảnh.

> Mục này **không tự động kiểm được** — nó là mục duy nhất phụ thuộc hoàn toàn vào bằng chứng bạn tự lưu. Làm ngay hôm nay, đừng để tới lúc đóng gói.

---

## 5. Những thứ **cố ý không** đưa vào workflow (ghi vào báo cáo §6 "Giới hạn")

Ghi rõ ra là điểm cộng — nó cho thấy bạn cân nhắc có chủ đích chứ không phải bỏ sót:

| Không dùng | Lý do |
|---|---|
| `POST /api/admin/import-products` | thuộc workflow *admin back-office* — bạn của bạn (23127178) đã dùng ở bài tham khảo; và §5 cấm trùng |
| `POST /api/coupon-usage` | gọi nó sẽ ghi `coupon_usage`, sau 1 lượt là `max_uses_per_user` của `BIGBUY` (=1) bị chạm → bước 5 trả 400 hàng loạt từ lượt thứ hai → **error rate giả**. Cố tình không gọi, và ghi rõ hệ quả: workflow không mô phỏng đúng ràng buộc "1 lần/user" |
| coupon `SAVE10` (type percent) | dính bug công thức B007 của HW02 (`total*(1-10)` → tiền giảm âm). Dùng `BIGBUY` (type fixed) cho luồng chính để kết quả **xác định**; bug percent đã báo ở HW02 rồi, không báo lại |
| `PUT /api/orders/:id/cancel` | state machine FR-10 sẽ trả 400 cho phần lớn request → 99% sample là 400, tín hiệu ghi bị che |
| Frontend web/admin | §5 nói rõ *"backend API endpoint groups"* — đo qua trình duyệt sẽ trộn chi phí render vào số liệu |

---

## 6. Viết `docs/endpoint-selection.md`

**Prompt cho AI** (ghi log ngay sau khi dùng):

> Dựa trên các dữ kiện sau, viết cho tôi file `docs/endpoint-selection.md` bằng tiếng Việt:
> - Workflow *Customer Storefront* 7 bước: [dán bảng §2 ở trên]
> - Mã nguồn handler tương ứng: [dán `backend/server.js` các dòng 32–66, 141–165, 284–310, 363–410]
> Yêu cầu file có: (1) bảng ánh xạ bước → endpoint → nhóm §5 → chi phí ở server, trích **số dòng code** làm căn cứ; (2) mục giải thích vì sao workflow này phủ đủ 3 nhóm, kèm tỉ lệ request; (3) mục "lựa chọn bị loại và lý do"; (4) mục đăng ký chống trùng nhóm để tôi điền tay.
> Không được suy diễn hành vi endpoint nào mà tôi chưa dán code cho bạn — nếu thiếu dữ kiện thì ghi "cần kiểm chứng" thay vì đoán.

**Review của bạn — 3 thứ AI hay sai ở bước này:**

| AI hay nói | Sự thật trong code | Kiểm bằng |
|---|---|---|
| *"`GET /api/products` dùng index trên `name`"* | Không có index nào ngoài PK, và `LIKE '%X%'` cũng không dùng được index kể cả khi có | `grep -n "CREATE INDEX" backend/database.js` → không có dòng nào |
| *"add-to-cart ghi vào DB"* | Ghi vào biến RAM `userCarts` | `server.js:284–295` |
| *"lockout sau 3 lần sai"* | Sau **2** lần (`+2`, ngưỡng `>=3`) | `server.js:54–58`, và bạn đã đo tay ở HW02 |

**Commit:** `docs: chot pham vi workflow storefront + bang chung khong trung nhom`

---

→ Tiếp: [03-DATA-DRIVEN-CSV.md](03-DATA-DRIVEN-CSV.md)
