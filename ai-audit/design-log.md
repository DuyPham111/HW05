# Design Log — thiết kế test plan theo từng bước (§2)

> File này chứng minh §2: *"drive an AI tool — **step by step**, not with a single generic prompt"*.
> Khác `ai-audit-report.md` (ghi từng phiên) ở chỗ: file này ghi **luồng thiết kế**, cho thấy
> đầu ra của bước trước là **đầu vào** của bước sau.
> Ngày thực hiện: 2026-08-21 · Tool: Claude Code (Opus 5)

---

## Bước 1 — Dạy AI về SUT (chưa viết dòng test plan nào)

- **Đầu vào:** `backend/server.js` dòng 32–66, 141–165, 284–310, 363–412 + `backend/database.js` dòng 20–110
- **Câu hỏi:** 6 câu về số truy vấn DB / index / lockout / mã trạng thái bất thường / assertion đủ chưa
- **Kết luận chốt được (đã tự `grep -n` xác minh từng số dòng, không lấy theo trí nhớ):**

| # | Kết luận | Trích |
|---|---|---|
| 1 | login: 1 `SELECT` + 1 `UPDATE` · search: 1 **quét bảng** · detail: 1 đọc PK · cart: **0 truy vấn** · coupon: 1 `SELECT` + 1 `COUNT` · checkout: 1 `INSERT` | `server.js:35,48,144,160,290-293,302,370,388` |
| 2 | `POST /api/cart` không chạm DB — ghi biến RAM `userCarts` | `server.js:290-293` |
| 3 | **Không có `CREATE INDEX` nào** (`grep` trên `database.js` ra rỗng). `LIKE '%X%'` không dùng được index kể cả khi thêm | `database.js` |
| 4 | `+2` mỗi lần sai, khóa khi `>= 3`, khóa 180s | `server.js:54,56,57` |
| 5 | `GET /api/products/:id` id lạ → **200 + `{}`** · login sai → **401 đúng thiết kế** | `server.js:160`, `server.js:63` |
| 6 | Assertion chỉ kiểm status **không đủ** ở: detail, coupon, checkout, login | — |

- **Kiểm chứng bằng thực nghiệm, không chỉ đọc code:**

```
GET /api/products/999999            -> 200 {}          (xác nhận câu 5)
POST /api/login (sai) x3            -> 401, 401, 403   (xác nhận câu 4)
```

> **Sắc thái quan trọng rút ra từ thực nghiệm:** nói "khóa sau **2** lần sai" là đúng về **trạng thái DB**
> (lần sai thứ 2 làm `login_attempts` = 4 ≥ 3 nên `locked_until` được SET), nhưng **403 chỉ xuất hiện từ
> lần thứ 3** vì `server.js:40` kiểm `locked_until` ở **đầu** request bằng trạng thái đã lưu **từ trước**.
> Hai phát biểu này đều đúng và phải viết tách bạch — nếu chỉ ghi "khóa sau 2 lần" rồi thiết kế assertion
> chỉ nhận `403` thì 2 lần đầu của mỗi tài khoản mồi sẽ bị tính là lỗi.

- → **đầu vào cho bước 2 và cho toàn bộ bảng assertion ở bước 4**

---

## Bước 2 — Chốt tham số scenario

- **Đầu vào:** kết luận bước 1 + ràng buộc: 200 tài khoản trong CSV · load generator **cùng máy** với SUT · 8 lõi · think-time phải mô phỏng người dùng thật
- **Chốt:**

| Scenario | VU | Ramp | Think-time | Duration | Listener |
|---|---|---|---|---|---|
| Load | 20 | 60s | 1–3s | 360s | Summary Report |
| Stress | 25→50→100→200 (4 bậc) | 10–20s/bậc | 0,3–1s | ~480s | Aggregate Report |
| Spike | 10 nền + 200 trong 5s | 5s | 0–0,5s | 240s | View Results Tree |
| Soak | 20 | 60s | 1–2s | 720s | Summary Report |

- **Quyết định có ý thức về throughput:** think-time đặt ở **cấp Thread Group** nên áp dụng trước **mỗi** trong 7 sampler → một vòng lặp mất ~14 giây. Với 20 VU, RPS kỳ vọng chỉ **~10 req/s**. Đây là **cố ý**: Load test mô phỏng **tải kỳ vọng của người dùng thật đang duyệt shop**, không phải đo throughput cực đại (đó là việc của Stress). Ghi rõ điều này vào báo cáo để không bị đọc nhầm thành "hệ thống chỉ chịu được 10 RPS".
- → **đầu vào cho bước 3**

---

## Bước 3 — Sinh `.jmx` bằng script, không viết XML tay

- **Đầu vào:** WORKFLOW 7 bước + SCENARIOS 4 kịch bản ở bước 2
- **Output:** `tools/gen-test-plans.py` — một hằng `WORKFLOW` + một hằng `SCENARIOS` → phát ra 4 file `.jmx`
- **Lý do dùng script:** §6 đòi cả 3 plan chạy **cùng** workflow. 4 file XML ~600 dòng viết tay thì sớm muộn lệch nhau một assertion, và lúc đó so Load với Stress mất ý nghĩa.
- **Ràng buộc kỹ thuật đã áp:** không dùng plugin ngoài (Ultimate Thread Group cần `jpgc-casutg`; nếu TA mở `.jmx` trên JMeter sạch sẽ **không mở được**) → Stress dùng **4 `ThreadGroup` chuẩn** cộng dồn bằng `delay` + `duration`.
- → **đầu vào cho bước 4**

---

## Bước 4 — CSV + JSON Extractor + Assertion

- **Đầu vào:** 5 file CSV từ `docs/03` + bảng "assertion nào là đủ" từ bước 1
- **Ba quyết định thiết kế, mỗi cái có lý do từ code:**

| Quyết định | Lý do |
|---|---|
| `users_lockout.csv` đổi tên biến `email` → **`lock_email`** | trùng tên với `email` của `users.csv` → CSV nạp sau **ghi đè** biến của cái nạp trước, JMeter **không báo lỗi**, bước 1 sẽ đăng nhập bằng tài khoản mồi |
| Bước 5 dùng `${uid}` **trích từ response** bước 1, không dùng cột `user_id` của CSV | giá trị trích chắc chắn khớp với `${token}` đang cầm; cột CSV đổi tên thành `csv_user_id` và giữ làm đối chứng |
| CSV Data Set đặt ở **cấp Test Plan**, `shareMode.all` | Stress có 4 thread group; đặt ở cấp Test Plan để cả 4 **dùng chung một pool tài khoản** → không có 2 VU nào trùng tài khoản |

- **Bảng assertion cuối cùng:** xem `report/main-report.md` §2.4 và `tools/gen-test-plans.py` hằng `WORKFLOW`
- → **đầu vào cho bước 6**

---

## Bước 5 — Chọn listener (3 loại khác nhau, §6 kiểm)

| Plan | Listener | Vì sao đặt ở đây |
|---|---|---|
| Load | **Summary Report** | tải ổn định → cần bảng tổng hợp gọn theo từng sampler |
| Stress | **Aggregate Report** | cần **cột percentile** để thấy đuôi phân phối dãn ra ở bậc nào |
| Spike | **View Results Tree** | cần xem **nội dung** response lúc sốc (403 lockout? 500? timeout?) — và chỉ bật ở lượt ngắn 4 phút vì listener này giữ toàn bộ response trong RAM |
| Soak | Summary Report | dùng lại loại của Load để so trực tiếp lượt 6 phút với lượt 12 phút |

---

## Bước 6 — Smoke test 40 giây (KHÔNG BỎ)

```
jmeter -n -t test-plans/23127183_Load_20260821.jmx -l results/jtl/smoke-load-20260821.jtl \
       -Jthreads=2 -Jduration=40 -Jdatadir=data
```

**Kết quả:** 22 sample, **0% error**, đủ 7 sampler.

| responseCode \| label | success | Số sample |
|---|---|---|
| 200 \| 01 Login | true | 4 |
| 200 \| 02 Search products | true | 4 |
| 200 \| 03 Product detail | true | 4 |
| 200 \| 04 Add to cart | true | 4 |
| 200 \| 05 Apply coupon | true | 2 |
| 200 \| 06 Checkout | true | 2 |
| **401** \| 07 Login sai (lockout) | **true** | 2 |

Ba phép kiểm bổ sung đã chạy — **không dừng ở "0% error nên chắc là đúng"**:

1. **Cột `.jtl` có đủ dữ liệu thật:** `Latency=80`, `allThreads=1`, `Connect=56` → Task 2 soát metric được.
2. **Extractor không thất bại thầm lặng:** `grep -c NOT_FOUND` = **0**.
3. **Assertion không vô nghĩa** — kiểm bằng cách *cố tình phá*:
   - Sửa bước 3 thành `/api/products/999999` → kết quả `code=200 success=false`, `failureMessage="Test failed: text expected to contain /"id"/"` → **assertion thật sự bắt được bẫy 200+`{}`**.
   - Trỏ bước 7 vào tài khoản **đang bị khóa** → `code=403 success=true`, error rate 0% → **nhánh 403 cũng được nhận đúng**, không chỉ 401.

- → **đầu vào cho bước 7**

---

## Bước 7 — Human review

- **Số lỗi bắt được:** 6 (xem bảng đầy đủ ở `report/main-report.md` §2.4)
- **Phân theo nhóm nguyên nhân:** chất lượng prompt 3 · đặc điểm endpoint 3 · giới hạn mô hình 0
- **Đáng chú ý:** 4/6 lỗi thuộc loại **không làm test plan báo lỗi** — plan vẫn chạy 0% error với chúng. Đây là loại nguy hiểm nhất và chỉ lộ ra khi cố tình phá assertion hoặc đọc kỹ tên biến.
- → kết quả ghi vào `report/main-report.md` §2.4
