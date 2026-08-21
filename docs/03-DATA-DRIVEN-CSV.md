# 03 — Data-driven: sinh dữ liệu và 5 file CSV

> §6 đòi: *"Make the workflow data-driven. Use CSV input data in the end-to-end workflow to parameterize requests (e.g., credentials, product IDs, or order payloads)."*
> Output: `data/users.csv` · `data/users_lockout.csv` · `data/search-terms.csv` · `data/products.csv` · `data/orders.csv` + script sinh ra chúng.

---

## 1. Vì sao phải seed thêm dữ liệu trước

DB seed gốc chỉ có **2 user** và **5 sản phẩm**. Đo hiệu năng trên 5 dòng là vô nghĩa: mọi truy vấn nằm gọn trong page cache của SQLite, p95 sẽ ~1ms bất kể tải, và bạn không có gì để nói.

**Mục tiêu seed:**

| Bảng | Trước | Sau | Vì sao |
|---|---|---|---|
| `users` | 2 | **+400** (200 hợp lệ + 200 mồi lockout) | mỗi VU một tài khoản riêng, tránh tranh chấp ghi và lockout dây chuyền (xem [02](02-PHAM-VI-WORKFLOW.md) §3) |
| `products` | 5 | **+20.000** | để `LIKE '%X%'` thật sự phải quét bảng — nếu không thì bước read-heavy không có tín hiệu |

> **Ghi số dòng `products` vào `results/run-log.md` mỗi lượt.** Nó là điều kiện đo. Hai lượt chạy trên kích thước dữ liệu khác nhau thì p95 không so được với nhau — và nếu bạn không ghi lại, đến lúc viết Task 2 sẽ không giải thích nổi vì sao hai lượt lệch nhau.

---

## 2. `tools/seed-perf-data.mjs`

**Prompt cho AI:**

> Viết `tools/seed-perf-data.mjs` (Node 22, ESM, chỉ dùng `fetch` + `node:fs`, không dependency ngoài) cho SUT EShop ở `http://localhost:3000`. Tham số dòng lệnh: `--users 200 --products 20000`.
>
> Nó phải làm đúng theo thứ tự:
> 1. Đăng nhập `admin@eshop.com / Admin123!` qua `POST /api/login`, lấy `token` và `user.id`.
> 2. Tạo `--users` tài khoản hợp lệ qua `POST /api/register` với email `perf-u{i}@hw05.test`, mật khẩu `Test1234!`, name `PerfUser{i}`. **Chạy tuần tự theo lô 20 request song song** — SQLite ghi tuần tự, bắn 200 request cùng lúc sẽ dính `SQLITE_BUSY`.
> 3. Tạo thêm `--users` tài khoản **mồi** email `lock-u{i}@hw05.test`, cùng mật khẩu.
> 4. Với mỗi tài khoản vừa tạo, gọi lại `POST /api/login` một lần để **lấy `user.id` thật** trả về trong `user` object — cần `user_id` cho bước apply-coupon.
> 5. Tạo `--products` sản phẩm qua `POST /api/products` (endpoint này **không** cần token, xem `server.js:167`), tên dạng `PerfProduct-{i}-{keyword}` với `keyword` lấy xoay vòng từ danh sách `["iPhone","Samsung","MacBook","AirPods","Keychron","Laptop","Tai nghe","Ban phim"]`, `price` ngẫu nhiên 100000–5000000, `category_id` xoay vòng 1–3. Lô 20 song song như trên.
> 6. Ghi ra 5 file CSV trong `data/` (mô tả cột ở dưới), header đúng tên cột, encoding UTF-8 **không BOM**, xuống dòng `\n`.
> 7. In ra tổng kết: số user tạo được, số user lỗi, số product, tổng số dòng `products` sau khi seed (gọi `GET /api/products` và đếm).
>
> Script phải **idempotent ở mức chấp nhận được**: nếu email đã tồn tại thì `POST /api/register` trả lỗi — bắt lỗi đó, bỏ qua, vẫn ghi dòng vào CSV (vì tài khoản đã có sẵn từ lần chạy trước).

### Năm file CSV — cột và ý nghĩa

| File | Header | Dùng ở bước | Ghi chú |
|---|---|---|---|
| `data/users.csv` | `email,password,user_id` | 1 (login đúng), 5 (`user_id` cho coupon) | 200 dòng, mật khẩu **đúng** |
| `data/users_lockout.csv` | `email,wrong_password` | 7 (login sai) | 200 dòng, `wrong_password` = `Sai_MK_123!` |
| `data/search-terms.csv` | `keyword` | 2 | ~30 dòng: 8 keyword thật + biến thể. **Không chứa dấu nháy đơn `'`** — `server.js:144` nối chuỗi SQL, một dấu nháy là lỗi 500 |
| `data/products.csv` | `product_id,product_name,price` | 3, 4 | ~500 dòng lấy từ id thật sau khi seed |
| `data/orders.csv` | `total_amount,shipping_address,coupon_code` | 5, 6 | ~50 dòng; `total_amount` **> 500000** (xem §3), `coupon_code` = `BIGBUY` |

Chạy:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run seed:perf -- --users 200 --products 20000
```

Mất khoảng 3–6 phút. Trong lúc chờ thì viết `docs/endpoint-selection.md` (bước [02](02-PHAM-VI-WORKFLOW.md) §6).

---

## 3. Ba giá trị trong CSV **bắt buộc** phải đúng, nếu sai là hỏng cả lượt đo

### 3.1 `total_amount` phải **lớn hơn hẳn** 500.000

`server.js:379`: `if (total_amount > coupon.min_order_amount)` — dùng `>` chứ không phải `>=` (bug off-by-one B006 bạn đã báo ở HW02). `BIGBUY` có `min_order_amount = 500000`.

- `total_amount = 500000` → **400** "Đơn hàng chưa đủ giá trị tối thiểu" → bước 5 lỗi 100%
- `total_amount = 600000` → 200, `discount_amount = 50000`, `final_amount = 550000` ✔

→ Trong `orders.csv`, để `total_amount` trong khoảng **600000–2000000**. Ghi chú lý do ngay trong file script sinh CSV.

### 3.2 `keyword` không được chứa `'`, `%`, `_`

`server.js:144`: `SELECT * FROM products WHERE name LIKE '%${searchQuery}%'` — nối chuỗi trực tiếp.

- `'` → lỗi cú pháp SQL → **500** → error rate giả
- `%` hoặc `_` → wildcard của LIKE → tập kết quả to bất thường, thời gian đáp ứng nhảy loạn giữa các dòng CSV → phương sai không giải thích được

Chỉ dùng chữ, số, khoảng trắng, dấu gạch ngang.

### 3.2b `keyword` còn phải giới hạn **KÍCH THƯỚC TẬP KẾT QUẢ** — chỗ này đã làm chết SUT một lần

`GET /api/products` **không có phân trang** (`server.js:141–157`) — nó trả về **toàn bộ** dòng khớp.
Tên sản phẩm seed có dạng `PerfProduct-{i}-{keyword}` với 8 keyword xoay vòng, nên:

| Từ khoá | Số dòng khớp | Payload đo được |
|---|---|---|
| `Perf` / `PerfProduct` | **20.000** | **3.605.474 B ≈ 3,6 MB** |
| `iPhone` (1 trong 8 keyword gốc) | 2.501 | 448.048 B ≈ 448 KB |
| `PerfProduct-100` (tiền tố 3 chữ số) | ~111 | 20.162 B ≈ 20 KB |
| `PerfProduct-1234` (tiền tố 4 chữ số) | ~11 | 1.998 B |
| `iPhone 15 Pro Max` (tên đầy đủ) | 1 | 185 B |

**Chuyện đã xảy ra thật:** lượt Spike đầu tiên dùng `search-terms.csv` có `Perf`/`PerfProduct`.
Ở 200 VU, tiến trình `node.exe` phải buffer hàng trăm MB JSON cùng lúc → **bị OOM-kill giữa lượt**.
Lượt chạy **45 phút** thay vì 4, chỉ **70 sample**, `max elapsed = 2.717.210 ms`, và log backend
**không có một dòng lỗi nào** (tiến trình bị hệ điều hành giết, không kịp ghi gì).

→ Dùng **tiền tố số** cho tập kết quả có giới hạn, mô phỏng hành vi thật: duyệt danh mục (~111 dòng)
/ tìm hẹp (~11) / tìm đúng tên (1). Sau khi sửa, cùng plan đó chạy **19.454 sample, 0% error, đúng 4:00**.

> Bản thân việc `/api/products` không phân trang là một **vấn đề hiệu năng thật của SUT** — ghi vào
> bug report (ứng viên P5), vì §6 khuyến khích báo performance issue.

### 3.3 `product_id` phải là **id thật đang tồn tại**

`server.js:159`: id không tồn tại → **HTTP 200 + body `{}`**. Nghĩa là JMeter báo "thành công" trong khi thực ra không đọc được gì, và bạn đo nhầm chi phí của một truy vấn miss. Vì thế `products.csv` phải lấy id từ `GET /api/products` **sau khi seed**, không được tự sinh `1..500`.

Kiểm nhanh sau khi seed:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && head -3 data/products.csv && curl -s "http://localhost:3000/api/products/$(sed -n '2p' data/products.csv | cut -d, -f1)" | head -c 200
```

Phải ra JSON **có field `id`**, không phải `{}`.

---

## 4. Cấu hình CSV Data Set Config trong JMeter (dùng lại ở mọi test plan)

Mỗi file CSV một element `CSV Data Set Config`, đặt ở **cấp Thread Group**:

| Thuộc tính | Giá trị | Vì sao |
|---|---|---|
| Filename | `${__P(datadir,data)}/users.csv` | đường dẫn tương đối qua property → chạy được cả GUI lẫn non-GUI |
| File encoding | `UTF-8` | tên sản phẩm có tiếng Việt |
| Variable Names | `email,password,csv_user_id` | **phải ghi rõ, không để trống** — xem cảnh báo va chạm tên biến bên dưới |
| Ignore first line | `True` | có header |
| Delimiter | `,` | |
| **Recycle on EOF** | `True` | hết file thì quay lại đầu — cần cho lượt dài |
| **Stop thread on EOF** | `False` | |
| **Sharing mode** | **`All threads`** | mỗi thread lấy dòng **kế tiếp** → 200 VU ↔ 200 tài khoản, không đụng nhau |

> ⚠️ **Va chạm tên biến giữa hai file CSV — lỗi này im lặng làm hỏng cả lượt đo.**
> `users.csv` và `users_lockout.csv` **đều có cột tên `email`**. Nếu để JMeter tự lấy tên biến từ
> header, CSV Data Set nạp sau sẽ **ghi đè** `${email}` của cái nạp trước → bước 1 đăng nhập bằng
> email của tài khoản mồi kèm mật khẩu đúng → sai hoàn toàn, mà JMeter **không báo lỗi gì cả**.
> Vì thế phải đặt tên biến tường minh và khác nhau:
>
> | File | Variable Names |
> |---|---|
> | `users.csv` | `email,password,csv_user_id` |
> | `users_lockout.csv` | **`lock_email,wrong_password`** ← đổi `email` → `lock_email` |
>
> `csv_user_id` cố ý **không dùng** trong workflow: bước 5 dùng `${uid}` trích từ response của
> bước 1 (`$.user.id`), vì giá trị đó chắc chắn khớp với `${token}` đang cầm. Cột trong CSV giữ
> lại làm đối chứng.

> **`Sharing mode` là chỗ AI hay để sai.** Nếu để `Current thread group` hay `Current thread`, **mỗi thread đọc file từ đầu** → tất cả VU dùng dòng 1 → 200 VU cùng một tài khoản → đúng cái thảm họa mà [02](02-PHAM-VI-WORKFLOW.md) §3 nói. Kiểm bằng cách mở `.jmx` và tìm `shareMode`, phải là `shareMode.all`.

---

## 5. Checklist trước khi sang bước sinh test plan

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && for f in users users_lockout search-terms products orders; do printf "%-16s %s dong\n" "$f.csv" "$(($(wc -l < data/$f.csv) - 1))"; done
```

- [ ] `users.csv` ≥ 200 dòng, thử đăng nhập tay 1 dòng bất kỳ → 200 + có `token`
- [ ] `users_lockout.csv` ≥ 200 dòng
- [ ] `search-terms.csv` không có ký tự `'` `%` `_`
- [ ] `products.csv` — kiểm 3 id ngẫu nhiên, đều trả JSON có `id`
- [ ] `orders.csv` — mọi `total_amount` > 500000
- [ ] `npm run preflight` vẫn toàn `[OK]`
- [ ] số dòng `products` đã ghi vào `results/run-log.md`

**Commit:** `feat(data): seed 400 tai khoan + 20k san pham, sinh 5 file CSV data-driven`

---

→ Tiếp: [04-TEST-PLAN-LOAD.md](04-TEST-PLAN-LOAD.md)
