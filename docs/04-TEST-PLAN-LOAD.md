# 04 — Task 1: Load test plan (20đ) — AI sinh từng bước, người duyệt từng bước

> Đây là file **dài nhất và quan trọng nhất**. Làm xong Load plan thì Stress và Spike chỉ là đổi tham số.
> Output: `test-plans/23127183_Load_20260821.jmx` · `tools/gen-test-plans.py` · bảng human review trong `report/main-report.md` §2.4.

---

## 1. Nguyên tắc: 7 bước, 7 lượt hỏi AI — không gộp

§2 của đề cấm đích danh prompt kiểu *"run a load test and tell me whether the performance is good"*. Cách chấm §6 nhìn vào **`ai-audit/design-log.md`** — nếu chỉ có 1 lượt hỏi thì mất điểm dù plan chạy tốt.

| Bước | Việc | Ghi log | Commit |
|---|---|---|---|
| 1 | Dạy AI về SUT (dán code, nêu 3 đặc điểm ở [00](00-ROADMAP.md) §5) | LOG-00x | — |
| 2 | Cùng AI chốt **tham số** Load: VU, ramp-up, think-time, duration + lý do | LOG-00x | `docs: chot tham so scenario Load` |
| 3 | AI sinh `tools/gen-test-plans.py` → phát ra `.jmx` | LOG-00x | `test(load): JMeter plan cho workflow storefront` |
| 4 | Gắn CSV + JSON Extractor lấy token/user_id + assertion từng bước | LOG-00x | `test(load): data-driven CSV + token extraction + assertion` |
| 5 | Chọn listener (Load = **Summary Report**) | — | |
| 6 | **Smoke test 40 giây** → đọc `.jtl` → sửa → lặp tới khi lỗi đúng nguyên nhân | LOG-00x | `test(load): sua think-time va assertion sau smoke test` |
| 7 | **Human review** — ghi AI sai gì, **vì sao** | LOG-00x | `docs: human review test plan do AI sinh` |

**Bước 6 tuyệt đối không được bỏ.** Test plan sai vẫn chạy trơn tru và vẫn ra bảng số đẹp — đó chính là lý do nó nguy hiểm.

---

## 2. Bước 1 — Dạy AI về SUT trước khi cho nó viết bất cứ thứ gì

### Prompt

> Tôi sắp làm performance test bằng **JMeter 5.6.3** trên backend Node.js/Express + SQLite của SUT EShop, chạy ở `http://localhost:3000`. **Chưa viết test plan.** Bước này tôi chỉ muốn bạn đọc code và trả lời.
>
> Đây là mã nguồn các handler tôi sẽ đo: [dán `backend/server.js` dòng 32–66, 141–165, 284–310, 363–412] và schema: [dán `backend/database.js` dòng 20–110].
>
> Trả lời đúng 6 câu, **chỉ dựa trên code tôi dán, không suy diễn**:
> 1. Với mỗi trong 6 endpoint (`POST /api/login`, `GET /api/products?search`, `GET /api/products/:id`, `POST /api/cart`, `POST /api/apply-coupon`, `POST /api/checkout`): liệt kê **số truy vấn DB** và **loại** (đọc theo PK / quét bảng / ghi), kèm số dòng code.
> 2. Endpoint nào **không** chạm DB?
> 3. Có index nào ngoài PRIMARY KEY không? Truy vấn nào **không thể** dùng index kể cả khi thêm?
> 4. Cơ chế lockout: sau **bao nhiêu** lần sai thì khóa, khóa **bao lâu**, reset khi nào? Trích số dòng.
> 5. Endpoint nào trả **HTTP 2xx nhưng nội dung là lỗi/rỗng**? Endpoint nào trả 4xx **như hành vi đúng theo thiết kế**?
> 6. Với mỗi endpoint, một assertion **chỉ kiểm HTTP status** có đủ để kết luận request thành công không? Chỗ nào không đủ thì phải kiểm thêm cái gì?

### Đáp án đúng (đối chiếu — nếu AI trả khác là AI sai)

| Câu | Sự thật |
|---|---|
| 1 | login: 1 `SELECT` + 1 `UPDATE` (`:35`, `:47`/`:59`) · products?search: 1 **quét bảng** `LIKE '%..%'` (`:144`) · products/:id: 1 đọc PK (`:160`) · cart: **0** · apply-coupon: 1 `SELECT` coupons + 1 `COUNT(*)` coupon_usage (`:366`, `:385`) · checkout: 1 **`INSERT`** (`:300`) |
| 2 | `POST /api/cart` — ghi vào biến RAM `userCarts` (`:290`) |
| 3 | Không có `CREATE INDEX` nào. `LIKE '%X%'` không dùng được index kể cả khi thêm (wildcard đầu chuỗi) |
| 4 | `+2` mỗi lần sai (`:54`), khóa khi `>= 3` → **2 lần sai**; khóa `180000ms = 180s` (`:57`); reset về 0 khi đăng nhập đúng (`:47`) |
| 5 | `GET /api/products/:id` id không tồn tại → **200 + `{}`** (`:160`) · `POST /api/login` sai mật khẩu → **401 là đúng thiết kế** · `apply-coupon` dưới ngưỡng → **400 là đúng thiết kế** |
| 6 | Không đủ ở: products/:id (phải kiểm có field `id`), apply-coupon (phải kiểm `success:true` và `discount_amount`), checkout (phải kiểm có `orderId`), login (phải kiểm có `token`) |

> Nếu AI trả lời **"lockout sau 3 lần sai"** — đó là lỗi đầu tiên của nó, và là dòng đầu tiên trong bảng human review. Lý do nó sai: nó đọc `if (newAttempts >= 3)` rồi khớp với spec, mà **không** cộng dồn `+2` qua từng request. Đây là lỗi *không mô phỏng trạng thái qua nhiều request* — đúng loại lỗi bạn đã ghi ở HW02.

---

## 3. Bước 2 — Chốt tham số Load cùng AI

### Prompt

> Dựa trên các dữ kiện bạn vừa xác nhận về SUT, hãy đề xuất tham số cho **một** scenario **Load test** (tải kỳ vọng, không phải tìm điểm gãy) trên workflow 7 bước sau: [dán bảng workflow §2 của `02-PHAM-VI-WORKFLOW.md`].
>
> Cho tôi bảng gồm: số thread (VU), ramp-up, kiểu think-time và khoảng giá trị, số vòng lặp hoặc thời lượng, và **lý do cho từng con số**. Ràng buộc:
> - Load generator (JMeter) và SUT chạy **trên cùng một máy Windows 11**, 8 lõi. Tham số phải tính đến việc JMeter tự nó ăn CPU.
> - Có 200 tài khoản riêng biệt trong CSV; số VU không được vượt quá con số này.
> - Think-time phải mô phỏng người dùng thật đang duyệt shop, **không** phải bắn liên tục.
> - Thời lượng phải đủ để có **trạng thái ổn định** sau ramp-up (ít nhất 3–4 phút ở mức tải đầy đủ).
> Ghi rõ tham số nào bạn suy từ code, tham số nào là quy ước ngành, tham số nào là phỏng đoán cần tôi kiểm chứng bằng smoke test.

### Tham số khởi điểm (chốt lại cùng AI, đừng bê nguyên si)

| Tham số | Load | Lý do |
|---|---|---|
| Threads (VU) | **20** | tải kỳ vọng của shop demo; đủ tạo tín hiệu mà không bão hòa CPU của chính JMeter |
| Ramp-up | **60s** | 1 VU mới mỗi 3 giây — tránh "cú đấm" lúc bắt đầu làm p95 30 giây đầu vô nghĩa |
| Think-time | **Uniform Random Timer**, hằng 1000ms + độ lệch 2000ms → **1–3 giây** giữa các bước | người thật đọc trang trước khi bấm; think-time cố định sẽ tạo cộng hưởng (mọi VU bắn cùng lúc) |
| Duration | **360s (6 phút)**, Scheduler bật | 60s ramp + ~300s ổn định → cửa sổ tính p95 đủ dài |
| Loop | `-1` (vô hạn, dừng theo scheduler) | dừng theo thời gian dễ so sánh giữa các lượt hơn dừng theo số vòng |
| Listener | **Summary Report** | xem §5 |

Ghi bảng này (bản đã chốt) vào `report/main-report.md` §2.1, cột "lý do" là phần được chấm.

**Commit:** `docs: chot tham so scenario Load (20 VU / 60s ramp / think 1-3s / 6 phut)`

---

## 4. Bước 3 — Sinh `.jmx`: dùng script Python, đừng viết XML tay

### Vì sao

§6 đòi **cả 3 plan chạy cùng một workflow**. File `.jmx` là XML 500–1000 dòng. Viết tay 4 file thì sớm muộn cũng lệch nhau một assertion hoặc một header, và lúc đó so Load với Stress với Spike **mất ý nghĩa** — bạn không biết chênh lệch đến từ tải hay từ plan.

Giải pháp: **một** định nghĩa workflow trong Python → phát ra 4 file `.jmx`. Sửa workflow ở một chỗ, chạy lại script, cả 4 plan đồng bộ.

### Prompt

> Viết `tools/gen-test-plans.py` (Python 3.10, chỉ dùng thư viện chuẩn) sinh ra **4 file JMeter 5.6.3 `.jmx`** hợp lệ.
>
> **Một** hằng `WORKFLOW` định nghĩa 7 bước dùng chung cho cả 4 plan:
> ```
> 1. POST /api/login          body {"email":"${email}","password":"${password}"}
> 2. GET  /api/products?search=${keyword}
> 3. GET  /api/products/${product_id}
> 4. POST /api/cart           body {"product_id":${product_id},"quantity":1}          [Bearer ${token}]
> 5. POST /api/apply-coupon   body {"code":"${coupon_code}","total_amount":${total_amount},"user_id":${uid}}
> 6. POST /api/checkout       body {"total_amount":${total_amount},"shipping_address":"${shipping_address}"}  [Bearer ${token}]
> 7. POST /api/login          body {"email":"${lock_email}","password":"${wrong_password}"}
> ```
>
> Một hằng `SCENARIOS` định nghĩa 4 kịch bản, chỉ khác nhau ở tham số tải và listener:
> | tên | thread group | listener |
> |---|---|---|
> | Load | ThreadGroup thường: 20 threads, ramp 60s, scheduler 360s | Summary Report (`ResultCollector` + `SummariserGui`) |
> | Stress | **4 ThreadGroup nối tiếp** (`SetupThreadGroup` không dùng; dùng `ThreadGroup` với delay khởi động): 25/50/100/200 threads, mỗi bậc 60s | Aggregate Report |
> | Spike | ThreadGroup nền 10 threads chạy 240s + ThreadGroup xung 200 threads ramp **5s**, khởi động trễ 60s, chạy 30s | View Results Tree |
> | Soak | 20 threads, ramp 60s, scheduler **720s** | Summary Report |
>
> Yêu cầu bắt buộc với **mọi** plan:
> - Tên file: `{MSSV}_{Scenario}_{YYYYMMDD}.jmx` với `MSSV=23127183`, ngày lấy từ tham số `--date` (mặc định hôm nay).
> - `HTTP Request Defaults`: server `${__P(host,localhost)}`, port `${__P(port,3000)}`, protocol http, **Connect timeout 10000, Response timeout 30000**.
> - `HTTP Header Manager` cấp Thread Group: `Content-Type: application/json`.
> - 5 `CSVDataSet`, tất cả **`shareMode.all`**, `recycle=true`, `stopThread=false`, ignoreFirstLine=true, fileEncoding UTF-8, filename `${__P(datadir,data)}/<tên>.csv` (mặc định `data`, vì JMeter được gọi từ thư mục gốc repo).
> - Bước 1: `JSONPostProcessor` lấy `$.token` → biến `token`, và `$.user.id` → biến `uid`.
> - Bước 4 và 6: `HeaderManager` cấp sampler thêm `Authorization: Bearer ${token}`.
> - `UniformRandomTimer` cấp Thread Group (delay/range lấy từ `SCENARIOS`).
> - Assertion — **khác nhau theo bước**, xem bảng §4b dưới đây.
> - `ResultCollector` ghi `.jtl` với `filename` rỗng (đường dẫn truyền qua `-l` lúc chạy).
>
> In ra đường dẫn 4 file đã sinh. **Không** dùng thư viện sinh XML của bên thứ ba; dùng `xml.etree.ElementTree` hoặc template chuỗi, nhưng file phải mở được bằng JMeter GUI.

### 4b. Bảng assertion — chỗ AI hay làm ẩu nhất

| Bước | Assertion **phải** có | Vì sao chỉ kiểm status là sai |
|---|---|---|
| 1 login | Response Assertion: code `200` **VÀ** `Response Text` chứa `"token"` | 200 mà không có token thì các bước sau chạy với `${token}` rỗng và vẫn "thành công" |
| 2 search | code `200` + **JSON Assertion** `$` là mảng | 500 do keyword có `'` sẽ lộ ra ngay |
| 3 detail | code `200` + `Response Text` chứa `"id"` | id không tồn tại → **200 + `{}`** (`server.js:160`) |
| 4 cart | code `200` + chứa `Added to cart` | thiếu token → 401/403 |
| 5 coupon | code `200` + chứa `"success":true` | dưới ngưỡng → **400**; và 200 vẫn có thể là tiền giảm âm |
| 6 checkout | code `200` + chứa `"orderId"` | đây là bằng chứng có ghi DB thật |
| **7 login sai** | Response Assertion: **code `401` = THÀNH CÔNG** (tick *Ignore Status*, pattern `401`) | ⚠️ **Đây là bẫy lớn nhất của bài.** Mặc định JMeter coi mọi non-2xx là **lỗi**. Không xử lý → bước 7 báo lỗi 100% → error rate toàn lượt ~14% **hoàn toàn giả**, và mọi kết luận sau đó sai theo |

> Bước 7 còn một tình huống nữa: sau 2 vòng lặp, tài khoản mồi bị khóa → trả **403** chứ không phải 401. Vậy assertion đúng là **chấp nhận cả `401` và `403`** (Response Assertion, Pattern Matching Rules = `Matches`, pattern `401|403`, tick *Ignore Status*). Ghi rõ lý do này trong báo cáo — nó chứng minh bạn hiểu lockout chứ không chỉ chép cấu hình.

Chạy:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run plans && ls test-plans/
```

Mở thử bằng GUI để chắc file hợp lệ:

```bash
jmeter -t "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing/test-plans/23127183_Load_20260821.jmx"
```

**Commit:** `test(load): sinh 4 plan .jmx tu mot dinh nghia workflow chung`

---

## 5. Bước 5 — Ba listener khác loại (§6) — chỗ dễ mất điểm oan

§6: *"Across the three test plans, use three distinct listener / report types … do not repeat a type."*

| Test plan | Listener | Vì sao đặt ở đây (viết câu này vào báo cáo) |
|---|---|---|
| **Load** | **Summary Report** | tải ổn định, cái cần là bảng tổng hợp gọn theo từng sampler: count / avg / min / max / error% / throughput |
| **Stress** | **Aggregate Report** | cần **cột percentile** (p90/p95/p99) để nhìn ra đuôi phân phối dãn ra ở bậc nào → đó là dấu hiệu điểm gãy |
| **Spike** | **View Results Tree** | cần xem **nội dung response** đúng lúc sốc: 403 do lockout? 500? timeout? Summary chỉ cho con số, không cho nội dung |

**Cảnh báo:** View Results Tree lưu **toàn bộ** request/response vào RAM. Chỉ bật ở lượt Spike (ngắn, ~4 phút). Bật ở lượt Soak 12 phút thì listener tự nó ăn hết heap và JMeter chậm hơn cả SUT — lúc đó bạn đo JMeter, không đo EShop.

> Ở chế độ non-GUI (`-n`), listener trong `.jmx` **không hiển thị**, nhưng nó **vẫn nằm trong file plan** — và đó là thứ TA mở ra kiểm. Đồng thời, cứ mở GUI một lần cho mỗi plan, chạy 30 giây, **chụp màn hình listener đang có dữ liệu** → ảnh này vào báo cáo §2.5 làm bằng chứng "đã dùng 3 listener khác loại".

---

## 6. Bước 6 — Smoke test 40 giây (KHÔNG ĐƯỢC BỎ)

Sinh một bản smoke: 2 VU, 40 giây.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && jmeter -n -t test-plans/23127183_Load_20260821.jmx -l results/jtl/smoke.jtl -Jthreads=2 -Jduration=40 -Jdatadir=data
```

Rồi soi ngay:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && awk -F, 'NR>1{n[$3"|"$4]++} END{for(k in n) printf "%-45s %s\n", k, n[k]}' results/jtl/smoke.jtl | sort
```

Lệnh trên đếm **(response code | tên sampler)**. Đọc bảng đó và đối chiếu:

| Bạn thấy | Nghĩa là | Sửa gì |
|---|---|---|
| `401 | 07 Login sai` xuất hiện và bị đếm là lỗi | assertion bước 7 chưa nhận 401 | thêm Response Assertion `401|403` + Ignore Status |
| `403 | 01 Login` | tài khoản hợp lệ **đang bị khóa** | chạy `npm run reset:lockout`; kiểm `users.csv` không lẫn mật khẩu sai |
| `400 | 05 Apply coupon` | `total_amount` ≤ 500000 | sửa `orders.csv` |
| `500 | 02 Search` | keyword chứa `'` | sửa `search-terms.csv` |
| `200` nhưng body `{}` ở bước 3 | `product_id` không tồn tại | sinh lại `products.csv` từ id thật |
| bước 4/6 ra `401` | `${token}` rỗng → JSON Extractor sai path | kiểm `$.token`, kiểm bước 1 có Header `Content-Type: application/json` |
| tổng số sample **quá ít** so với 40s | think-time bị nhân sai (vd 10–30s thay vì 1–3s) | kiểm `UniformRandomTimer`: `delay=1000`, `range=2000` |

**Lặp bước này tới khi**: mọi lỗi còn lại đều là lỗi **bạn giải thích được bằng thiết kế**, không phải lỗi cấu hình. Xóa `results/jtl/smoke.jtl` sau khi xong (hoặc giữ và đặt tên `smoke-*.jtl` — giữ lại còn hay hơn, nó là bằng chứng cho bảng human review).

**Commit:** `test(load): sua assertion buoc 7 va du lieu coupon sau smoke test`

---

## 7. Bước 7 — Human review: bảng "AI sai gì, vì sao" (§6 chấm mục này)

§6: *"Report what the AI got wrong or missed — for example, unrealistic ramp-up or think time, wrong thread counts, weak assertions, or missing account-lockout handling — **and explain why it missed them** (prompt quality, model limitations, or characteristics of the endpoint)."*

**Cột "vì sao" mới là cột được chấm.** Chép mẫu bảng này vào `report/main-report.md` §2.4 và điền bằng lỗi **thật** bạn gặp:

```markdown
| # | AI sai/sót gì | Bằng chứng | Sửa thành | **Vì sao AI sót** (nhóm nguyên nhân) |
|---|---|---|---|---|
| 1 | Kết luận "lockout sau 3 lần sai" | `server.js:54` `+2`, ngưỡng `>=3` → thực tế 2 lần | ghi đúng 2 lần vào thiết kế, tách CSV tài khoản mồi | **Đặc điểm endpoint**: AI khớp hằng số `3` với spec mà không mô phỏng trạng thái cộng dồn qua nhiều request |
| 2 | Bước 7 không có assertion → 401 bị tính là lỗi | smoke.jtl: 100% sample bước 7 `success=false` | Response Assertion `401\|403` + Ignore Status | **Giới hạn mô hình**: JMeter mặc định coi non-2xx là lỗi; AI không biết ngữ cảnh "401 ở đây là hành vi đúng" |
| 3 | CSV `shareMode` để `Current thread group` | mở `.jmx` grep `shareMode` | đổi `shareMode.all` | **Chất lượng prompt**: tôi chưa nói rõ "mỗi VU một tài khoản riêng" ở lượt hỏi đầu |
| 4 | Assertion bước 3 chỉ kiểm status 200 | id lạ → 200 + `{}` (`server.js:160`) | thêm kiểm chứa `"id"` | **Đặc điểm endpoint**: hành vi trả 200 cho not-found là bất thường, không suy ra được từ quy ước REST |
| 5 | `total_amount` = đúng 500000 trong dữ liệu mẫu | 400 "chưa đủ giá trị tối thiểu" | đổi 600000–2.000.000 | **Đặc điểm endpoint**: off-by-one `>` thay vì `>=` (`server.js:379`) |
| 6 | Think-time đề xuất 5–10s | 40s smoke chỉ ra ~15 sample | đổi 1–3s | **Chất lượng prompt**: tôi chưa nói mục tiêu là tạo tải đo được, không phải mô phỏng phiên duyệt dài |
| … | | | | |
```

**Ba nhóm nguyên nhân** — mỗi dòng phải quy về một trong ba, đề nêu đích danh:
1. **Chất lượng prompt** — tôi chưa cung cấp dữ kiện đó.
2. **Giới hạn mô hình** — AI không có cách nào biết (không chạy được, không thấy hành vi thật).
3. **Đặc điểm endpoint** — SUT hành xử khác quy ước, đọc code mới biết.

> Số lượng không quan trọng bằng chất lượng, nhưng thực tế nếu làm đủ smoke test thì bạn sẽ có **6–12 dòng**. Ghi cả những lỗi *không* làm test plan báo lỗi (như dòng 3, 5) — đó mới là loại nguy hiểm, và ghi ra là điểm cộng.

**Commit:** `docs: human review - 8 loi cua AI trong test plan Load va nguyen nhan`

---

## 8. Chạy lượt Load chính thức

→ Sang [07-CHAY-VA-THU-BANG-CHUNG.md](07-CHAY-VA-THU-BANG-CHUNG.md), làm đúng quy trình chụp ảnh, rồi quay lại đây làm Stress.

---

→ Tiếp: [05-TEST-PLAN-STRESS.md](05-TEST-PLAN-STRESS.md)
