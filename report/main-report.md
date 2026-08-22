# HW05 — Performance Testing on EShop — Báo cáo chính

> **KHUNG CHỜ ĐIỀN.** Điền dần theo tiến độ, đừng để cuối. Mọi con số phải truy được về `results/summary.md`.
> §14 đòi Task 1 và Task 2 nằm trong **một** báo cáo — vì thế ba task là **ba chương** của file này.

**Họ và tên:** Phạm Vũ Ngọc Duy · **MSSV:** 23127183 · **Nhóm:** 10
**Ngày thực hiện:** …/08/2026 → …/08/2026
**SUT:** EShop — https://github.com/ttbhanh/eshop-sut · backend `http://127.0.0.1:3000/api`
**Công cụ:** Apache JMeter 5.6.3 · Java Temurin 17 · Node v22.16 · Task Manager
**Máy đo:** Windows 11, hostname `Pham_Vu_Ngoc_Duy` — xem [`resource-monitor/hardware-report.md`](../resource-monitor/hardware-report.md)

**Khai báo AI (§9):** *"I use AI tools for the following tasks."* — nhật ký đầy đủ ở [`ai-audit/ai-audit-report.md`](../ai-audit/ai-audit-report.md).

---

# 1. Phạm vi — ba endpoint group (§5)

## 1.1 Đăng ký của nhóm và bằng chứng không trùng

Đã đăng ký workflow **Customer Storefront** (đủ 7 bước) trong nhóm chat của Nhóm 10 **trước khi bắt tay làm**; ảnh chụp tin nhắn kèm mốc thời gian: [`docs/endpoint-selection.md`](../docs/endpoint-selection.md) §5.

Tính tới thời điểm chốt, các thành viên khác **chưa công bố workflow của họ**, nên báo cáo này **không lập bảng đăng ký của cả nhóm** — điền giá trị tự suy đoán thay cho người khác là bịa dữ liệu chứ không phải bằng chứng. Thứ được khẳng định ở đây đúng bằng thứ chứng minh được: workflow của tôi đã công bố công khai có mốc thời gian, và nó khác hoàn toàn workflow *admin back-office* của bài tham khảo.

## 1.2 Workflow đã chọn — Customer Storefront

Chi tiết đầy đủ (số dòng code, lý do từng bước, lựa chọn bị loại): [`docs/endpoint-selection.md`](../docs/endpoint-selection.md).

| Bước | Endpoint | Nhóm §5 | Chi phí ở server (file:dòng) | Vì sao đáng đo |
|---|---|---|---|---|
| 1 | `POST /api/login` | auth-heavy | 1 SELECT (`server.js:35`) + 1 UPDATE khi đúng (`server.js:48`) | Mọi bước sau phụ thuộc token của nó; không băm mật khẩu (`server.js:46`) nên p95 không đại diện cho hệ thống có bcrypt |
| 2 | `GET /api/products?search=` | read-heavy | quét bảng `LIKE '%X%'` nối chuỗi, không tham số hóa (`server.js:144`) | không có index nào dùng được (wildcard đầu chuỗi) — endpoint đọc đắt nhất, quyết định cách phân loại đề xuất "thêm index" ở Task 2 |
| 3 | `GET /api/products/{id}` | read-heavy | đọc PK (`server.js:160`) | tách chi phí đọc PK khỏi chi phí quét bảng ở bước 2; lưu ý id lạ vẫn trả 200+`{}` |
| 4 | `POST /api/cart` | transactional | ghi RAM, **0 truy vấn DB**, không bao giờ xóa (`server.js:290-293`) | ứng viên rò rỉ bộ nhớ — biến chính của lượt Soak |
| 5 | `POST /api/apply-coupon` | transactional | 1 SELECT (`server.js:370`) + 1 COUNT lồng nhau (`server.js:388`) | độ trễ cộng dồn từ 2 round-trip nối tiếp |
| 6 | `POST /api/checkout` | transactional | **INSERT** thật (`server.js:302`) | điểm nghẽn ghi thật — SQLite ghi tuần tự; là chỗ đề xuất bật WAL ở Task 2 có ý nghĩa |
| 7 | `POST /api/login` (sai) | auth-heavy | nhánh lockout: `+2`/lần, khóa khi `>=3` tức sau 2 lần, 180s (`server.js:54,56,57`) | phủ yêu cầu account-lockout đích danh của §6 |

**Tỉ lệ phủ:** auth-heavy 2/7 (28,6%) · read-heavy 2/7 (28,6%) · transactional 3/7 (42,8%).

## 1.3 Dữ liệu data-driven (§6)

| File CSV | Cột | Dùng ở bước | Số dòng |
|---|---|---|---|
| `data/users.csv` | `email,password,user_id` | 1, 5 | |
| `data/users_lockout.csv` | `email,wrong_password` | 7 | |
| `data/search-terms.csv` | `keyword` | 2 | |
| `data/products.csv` | `product_id,product_name,price` | 3, 4 | |
| `data/orders.csv` | `total_amount,shipping_address,coupon_code` | 5, 6 | |

*(Giải thích 3 ràng buộc dữ liệu bắt buộc: `total_amount` > 500.000 · keyword không chứa `'` · `product_id` là id thật. Xem `docs/03-DATA-DRIVEN-CSV.md` §3.)*

---

# 2. Task 1 — Thiết kế và chạy (60đ)

## 2.1 Tham số từng scenario và lý do

| Scenario | VU | Ramp-up | Think-time | Thời lượng | Listener | Lý do chọn |
|---|---|---|---|---|---|---|
| Load | 20 | 60s | 1–3s | 360s | Summary Report | Tải kỳ vọng của shop demo. 20 VU đủ tạo tín hiệu mà không bão hòa CPU của chính JMeter (generator cùng máy). Ramp 60s = 1 VU/3s, tránh "cú đấm" làm p95 30 giây đầu vô nghĩa. 360s = 60s ramp + ~300s ổn định → cửa sổ tính p95 đủ dài. |
| Stress | 25→50→100→200 (4 bậc, cộng dồn, bước **90s**) | 10–20s/bậc | 0,3–1s | **420s** | Aggregate Report | Bậc rời rạc cho **4 con số p95 so sánh được** để định vị điểm gãy; ramp tuyến tính chỉ cho một đường cong mượt không chỉ ra được bậc nào gãy. Think-time giảm còn 0,3–1s để ép tải cao hơn với cùng số VU. 200 VU là trần vì CSV có đúng 200 tài khoản. |
| Spike | 10 nền + 200 trong 5s | 5s | 0–0,5s | 240s | View Results Tree | 60s nền **trước** để có baseline đo trên cùng lượt; 145s nền **sau** để đo hồi phục — đây mới là phần §6 chấm. Ramp 5s (không phải 0) vì dựng 200 thread trong một tick thì chi phí khởi tạo thread của JMeter lấn át tín hiệu. |
| Soak | 20 | 60s | 1–2s | 720s | Summary Report | Cùng mức VU với Load để so trực tiếp lượt 6 phút với lượt 12 phút. 12 phút nằm trong khoảng 10–15 phút §6 yêu cầu. |

**Tham số nào từ đâu:**
- **Suy từ code:** trần 200 VU (số dòng `users.csv`, để không có 2 VU dùng chung 1 tài khoản → tránh tranh chấp ghi trên cùng dòng `users`); think-time Stress thấp hơn Load.
- **Quy ước ngành:** ramp-up ≈ 1/6 thời lượng; think-time 1–3s cho hành vi duyệt web thật; soak 10–15 phút.
- **Đã sửa sau smoke test:** `datadir` mặc định `../data` → **`data`** (JMeter được gọi từ thư mục gốc repo, `../data` trỏ ra ngoài repo).

> **Lưu ý khi đọc RPS của lượt Load.** Think-time đặt ở cấp Thread Group nên áp dụng trước **mỗi** trong 7 sampler → một vòng lặp mất ~14 giây, và 20 VU cho RPS kỳ vọng chỉ **~10 req/s**. Đây là **cố ý**: Load mô phỏng tải người dùng thật đang duyệt shop, **không** phải đo throughput cực đại — việc đó là của Stress. Đọc con số ~10 RPS thành "hệ thống chỉ chịu được 10 RPS" là sai.

## 2.2 Kết quả — tổng quan

| Scenario | Sample | Peak VU | Thời lượng | RPS | Error% (thật) | p50 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|---|---|
| Load | 3.282 | 20 | 358,5s | 9,2 | 0,0% | 4 | 15 | **16** | 20 | 199 |
| Stress | 59.628 | 200 | 419,5s | 142,1 | 0,0% | 46 | 232 | **289** | 419 | 976 |
| Spike | 18.102 | 210 | 239,5s | 75,6 | 0,0% | 117 | 455 | **530** | 682 | 893 |
| Soak | 9.176 | 20 | 718,6s | 12,8 | 0,0% | 4 | 14 | **15** | 18 | 121 |

*(Nguồn: `results/summary.md`, sinh tự động từ raw `.jtl`. Error% Spike/Stress cao "thô" chỉ vì gồm nhiều sample bước 7 theo thiết kế — xem cột "thật" ở trên, luôn 0%.)*

### Stress — theo từng bậc VU (cắt cửa sổ ổn định bằng `--windows`)

| Bậc | VU đỉnh cửa sổ | Sample | RPS | p50 | p90 | **p95** | p99 | max | CPU `node` đỉnh | CPU `java` đỉnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 (10–90s) | 27 | 3.027 | 37,9 | 5 | 17 | **20** | 35 | 111 | 19,1% (avg) | — |
| 2 (100–180s) | 53 | 6.055 | 75,7 | 6 | 19 | **24** | 36 | 66 | 40,6% (avg) | — |
| 3 (195–270s) | 104 | 11.148 | 148,6 | 14 | 44 | **60** | 159 | 432 | 77,0% (avg) | — |
| 4 (290–420s) | 200 | 32.582 | 251,6 | 125 | 280 | **340** | 461 | 976 | **102,7% (avg) / 117,1% (đỉnh)** | 34,9% (đỉnh) |

**Kết luận — điểm gãy rõ ràng, không phải "chịu tải tốt":**

1. **p95 tăng phi tuyến, không tuyến tính theo VU.** Từ bậc 1→2 (25→50 VU), p95 gần như không đổi (20→24ms, +20%). Nhưng từ bậc 2→3 (50→100 VU) và 3→4 (100→200 VU), p95 nhảy vọt: 24→60ms (+150%) rồi 60→340ms (+467%). Đây chính là dấu hiệu "đuôi phân phối dãn" mà §6 muốn tìm — hệ thống bắt đầu gãy đâu đó giữa 50 và 200 VU.
2. **CPU `node.exe` tăng gần tuyến tính và CHẠM TRẦN một lõi ở bậc 4**: 19,1% → 40,6% → 77,0% → **117,1%** (vượt 100% của một lõi — Node đơn luồng cho JS nên đây là bão hòa thật, dù máy còn 7 lõi rảnh).
3. **`java.exe` (JMeter) KHÔNG phải điểm nghẽn**: CPU đỉnh chỉ 34,9% ở bậc 4, thấp hơn nhiều so với `node.exe` (117,1%) — khác hẳn tình huống ở lượt Soak (`endurance/endurance-threshold.md` §4), nơi JMeter mới là điểm nghẽn ở tải nhẹ. Kết luận: **ở Stress, chính SUT là nút cổ chai**, số đo đáng tin cậy.
4. **Chưa tìm được điểm gãy tuyệt đối** — 200 VU là trần vì CSV chỉ có 200 tài khoản, chưa tăng tiếp tới khi error rate thật sự bật lên. Ngưỡng gãy nằm đâu đó **trên** 200 VU.

## 2.3 Kết quả theo từng endpoint (lượt Load — tải nhẹ, phản ánh đúng chi phí xử lý, chưa bị hàng đợi làm nhiễu)

| Sampler | Nhóm | Sample | avg elapsed | p95 | max | Error% (thật) |
|---|---|---|---|---|---|---|
| 01 Login | auth | 477 | 6,3ms | 10ms | 53ms | 0% |
| 02 Search (quét bảng) | read | 476 | **12,5ms** | 18ms | 28ms | 0% |
| 03 Product detail (đọc PK) | read | 472 | **2,8ms** | 4ms | 89ms | 0% |
| 04 Add to cart | trans | 468 | 3,6ms | 5ms | 7ms | 0% |
| 05 Apply coupon | trans | 465 | 3,6ms | 6ms | 16ms | 0% |
| 06 Checkout (INSERT) | trans | 464 | 14,9ms | 18ms | 199ms | 0% |
| 07 Login sai | auth | 460 | 3,2ms | 4ms | 17ms | 0% |

**So sánh bước 2 với bước 3 — kết quả có nội dung, không chỉ liệt kê:** `GET /api/products?search=` (quét bảng `LIKE '%X%'`, không dùng được index) mất **12,5ms** trung bình, trong khi `GET /api/products/{id}` (đọc theo PRIMARY KEY) chỉ mất **2,8ms** — **chậm hơn 4,5 lần**. Đây là bằng chứng thực nghiệm trực tiếp cho lý do chọn workflow ở `docs/endpoint-selection.md`: chi phí *full table scan* tách bạch rõ ràng khỏi chi phí *đọc PK thuần*, và là căn cứ để Task 2 phân loại đề xuất "thêm index" là **feasible-nhưng-vô-ích** (wildcard đầu chuỗi không dùng được B-tree index).

**Quan sát phụ:** `06 Checkout` (ghi `INSERT` thật) đứng thứ 2 về chi phí (14,9ms) sau Search — hợp lý vì SQLite ghi tuần tự tốn hơn đọc. `01 Login` khá nhanh (6,3ms) vì so sánh mật khẩu **plaintext**, không băm — đúng như lưu ý ở §1.2, p95 của endpoint này không đại diện cho hệ thống có bcrypt.

## 2.4 Human review — AI sai gì, vì sao (§6 chấm mục này)

| # | AI sai/sót gì | Bằng chứng | Sửa thành | **Vì sao AI sót** | Plan có báo lỗi không? |
|---|---|---|---|---|---|
| 1 | Đặc tả CSV ở bản thiết kế ban đầu để **cả `users.csv` lẫn `users_lockout.csv` cùng có cột tên `email`** | Hai `CSVDataSet` cùng khai báo biến `email` → cái nạp sau ghi đè cái nạp trước; bước 1 sẽ đăng nhập bằng email tài khoản **mồi** kèm mật khẩu đúng | Đổi tên biến của `users_lockout.csv` thành **`lock_email,wrong_password`** | **Chất lượng prompt** — bản đặc tả liệt kê header từng file riêng lẻ, không ai đối chiếu chéo xem có trùng tên biến giữa các file không | ❌ **Không** — JMeter ghi đè biến im lặng, plan vẫn chạy 0% error |
| 2 | Bảng assertion ban đầu ghi bước 7 *"code `401` = THÀNH CÔNG"* | Đo thật: 3 lần đăng nhập sai liên tiếp cho **401 → 401 → 403**. Nếu assertion chỉ nhận `401` thì từ lần thứ 3 trở đi mọi sample bước 7 bị tính là **lỗi** | Response Assertion regex **`401\|403`** + tick *Ignore Status* | **Đặc điểm endpoint** — `+2`/lần và ngưỡng `>=3` làm khóa được SET ở lần 2 nhưng chỉ **enforce** từ lần 3, vì `server.js:40` kiểm `locked_until` ở đầu request bằng trạng thái đã lưu từ trước | ✅ Có — nhưng chỉ sau khi tài khoản mồi bị khóa, tức **giữa lượt**, không lộ ra ở smoke ngắn |
| 3 | `datadir` mặc định đặt là `../data` | JMeter được gọi từ thư mục gốc repo → `../data` trỏ ra **ngoài** repo, không tìm thấy file | Đổi mặc định thành **`data`** | **Chất lượng prompt** — bản đặc tả không nói rõ CWD lúc chạy là thư mục nào | ✅ Có — CSV rỗng, mọi biến thành literal `${email}` |
| 4 | Assertion bước 3 ban đầu chỉ kiểm HTTP status 200 | `GET /api/products/999999` trả **200 + `{}`** (`server.js:160-161`) → assertion status-only **luôn pass**, và ta đo nhầm chi phí của một truy vấn miss | Thêm assertion body **chứa `"id"`**. Kiểm chứng bằng cách cố tình sửa bước 3 thành id `999999`: kết quả `code=200 success=false`, `failureMessage="Test failed: text expected to contain /"id"/"` | **Đặc điểm endpoint** — trả 200 cho not-found là bất thường, không suy ra được từ quy ước REST | ❌ **Không** — đây là loại nguy hiểm nhất: pass mà vô nghĩa |
| 5 | Nguồn `user_id` cho bước 5 nhập nhằng: `users.csv` có cột `user_id`, mà bước 1 cũng trích được `$.user.id` | Dùng giá trị CSV có rủi ro lệch với `${token}` đang cầm nếu hai nguồn phân kỳ | Dùng **`${uid}` trích từ response** bước 1; đổi cột CSV thành `csv_user_id` và giữ làm đối chứng | **Chất lượng prompt** — đặc tả đưa ra hai nguồn cho cùng một giá trị mà không nói lấy cái nào | ❌ **Không** — cả hai nguồn đều cho số hợp lệ trong điều kiện bình thường |
| 6 | Mô tả lockout trong tài liệu thiết kế ghi gọn *"khóa sau 2 lần sai"* | Đúng về **trạng thái DB** (lần 2 làm `login_attempts`=4 ≥ 3 nên `locked_until` được SET) nhưng **403 chỉ xuất hiện từ lần 3** | Tách bạch hai phát biểu trong tài liệu và trong thiết kế assertion | **Đặc điểm endpoint** — lỗi về **thứ tự** xử lý (kiểm-khóa-trước rồi mới xử-lý-mật-khẩu-sau), giống hệt loại lỗi đã ghi ở HW02 | ❌ **Không** — nhưng nó là nguyên nhân gốc của lỗi #2 |
| 7 | Bậc Stress đặt bước **60 giây**, trong khi bậc 4 ramp 100 thread mất **20 giây** | Với `delay` 0/60/120/180 và `duration` 420/360/300/240, các nhóm cùng kết thúc ở t=420s → bậc 1–3 chỉ có 60s còn **bậc 4 chiếm 240s**; và cửa sổ *ổn định* của bậc 4 chỉ còn 40s nếu ép về 60s | Đổi bước bậc thành **90 giây** (`delay` 0/90/180/270, `duration` 420/330/240/150) → mọi bậc có cửa sổ ổn định ≥ 70s, tổng 420s | **Chất lượng prompt** — đặc tả ghi "mỗi bậc 60s" nhưng bộ số `delay`/`duration` kèm theo lại không tạo ra các bậc bằng nhau; không ai đối chiếu ý định với con số | ❌ **Không** — plan chạy đúng, chỉ là cửa sổ p95 của bậc quan trọng nhất bị ngắn |
| 8 | `search-terms.csv` chứa từ khoá **`Perf`** và **`PerfProduct`** — khớp *toàn bộ* 20.000 sản phẩm | Đo trực tiếp: `?search=Perf` trả **3.605.474 byte ≈ 3,6 MB** mỗi request (`?search=iPhone` = 448 KB). Ở 200 VU, tiến trình `node.exe` **bị OOM-kill giữa lượt**: lượt chạy 45 phút thay vì 4, chỉ 70 sample, `max elapsed = 2.717.210 ms`, log backend không có dòng lỗi nào | Đổi sang tiền tố số: `PerfProduct-100` (~20 KB) / `PerfProduct-1234` (~2 KB) / tên đầy đủ (185 B) → giảm **180 lần**. Chạy lại: **19.454 sample, 0% error, đúng 4:00** | **Chất lượng prompt** — đặc tả CSV chỉ ràng buộc *ký tự* (`'` `%` `_`) mà quên ràng buộc **kích thước tập kết quả**; và seed sinh tên theo mẫu `PerfProduct-{i}-{keyword}` khiến 8 từ khoá gốc mỗi cái khớp đúng 2.500 dòng | ✅ Có — nhưng theo cách tệ nhất: **giết SUT**, không phải báo lỗi |
| 9 | Mặc định `host` là `localhost` | Trong môi trường này `localhost` phân giải hỏng: `curl http://localhost:3000` trả **000 sau 2,2s** (timeout IPv6) trong khi `http://127.0.0.1:3000` trả **200 trong 32 ms** | Đổi mặc định của cả 4 test plan và 4 script sang **`127.0.0.1`** | **Giới hạn mô hình** — không đoán được cấu hình phân giải tên của một máy cụ thể; chỉ lộ ra khi chạy thật | ⚠️ Không ổn định — JMeter phân giải được nhưng `curl` thì không, nên bẫy này ẩn cho tới khi kiểm tay |

**Tổng: 9 lỗi** — chất lượng prompt **5** · đặc điểm endpoint **3** · giới hạn mô hình **1**.

> **Điều đáng nói nhất:** **5/9 lỗi không làm test plan báo lỗi** — plan vẫn chạy 0% error với chúng. Chúng chỉ lộ ra khi (a) đọc kỹ tên biến giữa các file CSV, và (b) **cố tình phá assertion để kiểm nó có thật sự bắt được gì không**. Nếu chỉ nhìn "smoke test 0% error → plan đúng" thì cả 4 lỗi này đi thẳng vào bộ số liệu cuối cùng.

**Hai phép kiểm đã dùng để chứng minh assertion không vô nghĩa** (không dừng ở "0% error nên chắc đúng"):

| Phép kiểm | Cách làm | Kết quả |
|---|---|---|
| Assertion bước 3 có thật sự bắt được bẫy 200+`{}`? | Sửa path thành `/api/products/999999`, chạy 20s | `code=200 success=false` — **bắt được** |
| Assertion bước 7 có nhận cả nhánh 403 không? | Trỏ `lock_email` vào tài khoản đang bị khóa, chạy 18s | `code=403 success=true`, error 0% — **nhận đúng** |

## 2.5 Bằng chứng chạy

| Lượt | Raw `.jtl` | Dashboard | Ảnh Task Manager | Mốc giờ (local) |
|---|---|---|---|---|
| Load | `results/jtl/23127183_Load_20260822-183102.jtl` (3.282 sample) | `results/html/load/` | `taskmgr-load.png` — giây 180 | 18:31:04 → 18:37:09 |
| Stress | `results/jtl/23127183_Stress_20260822-191048.jtl` (59.628 sample) | `results/html/stress/` | `taskmgr-stress.png` — giây 350, bậc 200 VU | 19:10:50 → 19:17:59 |
| Spike | `results/jtl/23127183_Spike_20260822-192951.jtl` (18.102 sample) | `results/html/spike/` | `taskmgr-spike.png` — giây 75, giữa cú sốc (Active:190) | 19:29:53 → 19:33:58 |
| Soak | `endurance/jtl/23127183_Soak_20260822-193744.jtl` (9.176 sample) | `endurance/html/soak/` | `taskmgr-soak.png` — giây 400 | 19:37:46 → 19:49:52 |

Ba listener khác loại (§6): **Summary Report** (Load, Soak) · **Aggregate Report** (Stress) · **View Results Tree** (Spike). Ảnh bằng chứng nằm ở `resource-monitor/screenshots/`; mỗi ảnh chụp trong lúc lượt đang chạy (mtime nằm trong khoảng "Mốc giờ" ở trên), thấy cả cửa sổ PowerShell đang chạy JMeter và Task Manager trong cùng một khung.

**Video demo:** *(chưa quay — xem `docs/HUONG-DAN-VIEC-TU-LAM.md` mục E)*

## 2.6 Xử lý account-lockout và state giữa các lượt (§6 đòi ghi lại)

Thủ tục thực tế đã áp dụng giữa cả 4 lượt: `tools/run-scenario.mjs` tự động gọi `reset-lockout.mjs --wait` ở bước [1/4] trước khi khởi động JMeter, đợi tới khi 0/400 tài khoản còn bị khóa (dùng `GET /api/admin/users` để đọc `login_attempts`/`locked_until` — chỉ đọc, không đăng nhập nên không tự làm thay đổi thứ đang kiểm, xem `docs/07` §3). Ngoài ra, cooldown thực tế giữa các lượt đều vượt xa mức 90 giây tối thiểu:

| Giữa lượt | Cooldown thực tế |
|---|---|
| Load → Stress | ~33 phút |
| Stress → Spike | ~12 phút |
| Spike → Soak | ~4 phút (đủ, do bận cập nhật báo cáo giữa các lượt) |

Không lượt nào bị lockout tồn dư từ lượt trước — xác nhận bằng dòng "[OK] Không còn tài khoản nào bị khóa" trong log mỗi lượt (`results/run-log.md`).

## 2.7 Endurance threshold (§6)

Tóm tắt — chi tiết đầy đủ ở [`endurance/endurance-threshold.md`](../endurance/endurance-threshold.md):

| Chỉ số | Giá trị |
|---|---|
| Max stable RPS | **12,8 req/s**, duy trì đều 12 phút, error 0% |
| p95 | 15 ms · độ trôi **−6,3%** (5' đầu → 5' cuối) |
| RSS `node.exe` | trần **113,7 MB** (đỉnh phút 1, warm-up) → ổn định **~76 MB** từ phút 3, độ trôi **−15,0%** (giảm, không tăng) |
| Rò rỉ bộ nhớ? | **Không** phát hiện ở quy mô 12 phút — `userCarts` (`server.js:290-293`) không có cơ chế xoá, nhưng RSS không tăng đơn điệu; xem giới hạn ở §6 của file |
| **3/4 tiêu chí ổn định đạt** | Tiêu chí 4 (CPU `java` < CPU `node`) **FAIL**: java đỉnh 246,3% vs node 16,3% → **12,8 req/s là trần của JMeter trên máy này**, không phải trần thật của SUT |

## 2.8 Một phát hiện tự bác bỏ

**Kết luận ban đầu (sai) khi mới nhìn số Soak:** "RSS giảm từ lúc bắt đầu (61,5 MB đọc tay trước khi chạy) xuống mức ổn định trong lượt (~76 MB)?" — thoạt nhìn có vẻ vô lý (RSS đang chạy lại thấp hơn lúc đứng yên?). Nhìn kỹ chuỗi số theo phút mới thấy: RSS thực ra **tăng vọt lên đỉnh 113,7 MB ở phút 1** rồi mới giảm và ổn định quanh 76 MB — nên con số 61,5 MB đọc tay trước khi chạy không phải là "RSS bình thường của backend" mà là RSS ở trạng thái nghỉ dài, còn 113,7 MB mới là đỉnh thật ngay khi bắt đầu nhận tải (JIT warm-up + ramp 60s). Nếu chỉ so sánh "đầu" và "cuối" bằng hai điểm đơn lẻ (61,5 MB vs con số cuối) mà không nhìn cả chuỗi theo phút, sẽ bỏ lỡ đỉnh này và có thể rút ra kết luận ngược — đây chính là lý do `docs/08-ENDURANCE-THRESHOLD.md` §5 yêu cầu bảng theo từng phút, không chỉ hai điểm đầu/cuối.

**Một phát hiện tương phản khác đáng ghi:** ở Stress (200 VU), `java.exe` **không** phải điểm nghẽn (CPU đỉnh 34,9% so với `node.exe` 117,1%) — nhưng ở Soak (20 VU, tải nhẹ hơn), `java.exe` lại **là** điểm nghẽn (CPU đỉnh 246,3% so với `node.exe` 16,3%). Cùng một load generator, cùng một máy, nhưng vai trò "ai là nút cổ chai" đảo ngược hoàn toàn tùy theo mức tải — không thể khái quát một kết luận chung như "JMeter luôn/không bao giờ là điểm nghẽn trên máy này". Đây là dữ kiện quan trọng cho Task 2 (đọc số liệu phải theo từng điều kiện cụ thể, không suy rộng).

---

# 3. Task 2 — AI phân tích và soát lỗi đọc metric (10đ)

## 3.1 Phân tích của AI — nguyên văn

Toàn bộ prompt và output nguyên văn (không chỉnh sửa) ở [`ai-audit/task2-ai-output-verbatim.md`](../ai-audit/task2-ai-output-verbatim.md). Prompt **chỉ** chứa dữ liệu thô (`results/summary.md` đầy đủ, 200 dòng đầu raw `.jtl` của Stress, toàn bộ `resources.csv` của Stress) — **không** kèm theo bất kỳ phát hiện nào đã làm ở §2 (bảng theo bậc, `allThreads`, CPU generator...), để phép săn lỗi ở §3.2 có ý nghĩa thật.

**Tóm tắt 5 nhận định chính của AI:**
1. Error rate "thô" 13,8–14,2% ở cả 4 lượt là "đáng lo ngại", cần điều tra nguyên nhân concurrency trên SQLite.
2. Endpoint đắt nhất là `05 Apply coupon` (133,4ms) và `02 Search products` (94,9ms) — nghi do thiếu index.
3. Hệ thống "ổn định xuyên suốt từ 25 VU tới 200 VU" dựa trên p95=289ms (tổng thể Stress) dưới ngưỡng 500ms "chuẩn ngành".
4. Đề xuất SLO: p95 ≤ 300ms, error ≤ 1%, RPS tối thiểu 140 req/s.
5. Không đủ dữ liệu Soak trong prompt để đánh giá rò rỉ bộ nhớ — AI thành thật nhận giới hạn này (điểm tốt, không phải lỗi).

## 3.2 Soát lại — chỗ AI đọc sai metric

| # | AI nói gì (trích nguyên văn) | Sai ở đâu | **Giá trị đúng từ raw `.jtl`** | Vì sao AI sai |
|---|---|---|---|---|
| 1 | *"error rate thô 13,8–14,2%... đáng lo ngại nếu đây là hệ thống production... thường ngưỡng chấp nhận được là dưới 1%"* | Gộp thẳng error rate **thô** vào kết luận mà không kiểm nguồn gốc từng mã lỗi | `23127183_Stress_....jtl`: `awk -F, 'NR>1{n[$4"\|"$3]++}...'` cho thấy **8.430/59.628** sample "lỗi" đều mang mã `401`/`403` và **100% thuộc sampler `07 Login sai (lockout)`** — nhánh cố ý sai mật khẩu. **Error rate thật = 0,00%** ở cả 4 lượt | AI không được cho biết bước 7 là nhánh lockout cố ý (đúng như thiết kế thử nghiệm — không mớm đáp án); nó không tự đối chiếu tên `label` với mã lỗi trước khi kết luận |
| 2 | *"avg 88,7ms... nhìn chung ở mức chấp nhận được cho một API backend"* | Dùng trung bình trên phân phối lệch phải nghiêm trọng, che mất đuôi | Cùng file: `p99=419ms`, `max=976ms` — gấp **11×** và **gần 11×** so với avg. Tỉ số `max/p50` = 976/46 ≈ **21 lần** | AI trích đúng số avg từ `summary.md` nhưng không đối chiếu với p99/max nằm ngay cột bên cạnh trong cùng bảng nó vừa đọc |
| 3 | *"Soak xử lý được 9.176 sample trong khi Load chỉ xử lý 3.282 sample — Soak có khả năng chịu tải/thông lượng cao hơn đáng kể"* | So sánh **số sample tuyệt đối** giữa hai lượt có **thời lượng khác nhau** mà không chuẩn hóa | Load chạy 358,5s, Soak chạy 718,6s (gấp 2×). RPS thật: Load = **9,2 req/s**, Soak = **12,8 req/s** — Soak nhỉnh hơn thật (~39%), nhưng **không phải** "đáng kể" như ấn tượng "gấp gần 3 lần" mà số sample thô tạo ra | AI có đủ dữ liệu (`summary.md` in cả cột RPS lẫn "Thời lượng (s)") nhưng chọn so sánh sample count — con số bắt mắt hơn nhưng gây hiểu lầm |
| 4 | *"hệ thống xử lý ổn định xuyên suốt từ 25 VU tới 200 VU"* dựa trên **p95=289ms tổng thể** của Stress | Kết luận "ổn định xuyên suốt" chỉ từ MỘT con số p95 gộp cả 4 bậc tải, không cắt theo từng bậc | Cắt theo cửa sổ ổn định từng bậc (`--windows "10-90,100-180,195-270,290-420"`): p95 bậc 1(25VU)=**20ms** → bậc 2(50VU)=**24ms** → bậc 3(100VU)=**60ms** → bậc 4(200VU)=**340ms**. Tăng **17 lần** từ bậc 1 đến bậc 4, và CPU `node.exe` đạt **117,1%** (bão hòa 1 lõi) ở bậc 4 — hoàn toàn không phải "ổn định xuyên suốt" | `summary.md` không tự tách theo bậc — AI phải chủ động cắt theo `allThreads`/thời gian mới thấy được, nhưng nó dừng lại ở con số tổng hợp sẵn có |
| 5 | *"RPS tối thiểu: 140 req/s — dựa trên năng lực đã chứng minh của hệ thống"* | Đề xuất ngưỡng SLO **tối thiểu** đúng bằng mức tải mà hệ thống **đã bão hòa**, không phải mức an toàn | Ở đúng thời điểm RPS=142,1 req/s (bậc 4 Stress), `node.exe` đã đạt CPU đỉnh **117,1%** — tức đây là **gần trần**, không phải nền an toàn. Đặt SLO tối thiểu = mức bão hòa là nguy hiểm, hệ thống sẽ luôn ở ranh giới vi phạm SLO | AI không đối chiếu ngưỡng RPS đề xuất với dữ liệu CPU có sẵn ngay trong `resources.csv` mà chính nó nhận được trong prompt |
| 6 | Toàn bộ phân tích **không hề nhắc tới CPU của `java.exe`** dù `resources.csv` đầy đủ 634 dòng đã có trong prompt | Bỏ qua hoàn toàn khả năng load generator (JMeter) ở cùng máy ảnh hưởng số đo | Từ chính file đã đưa: CPU đỉnh `java.exe` ở bậc 4 = **34,9%**, thấp hơn nhiều so với `node.exe` = **117,1%** — may mắn không đổi chiều kết luận ở Stress, nhưng **AI không hề kiểm tra khả năng này**, dù dữ liệu đã có sẵn. Ở Soak (lượt khác, không có trong prompt Task 2), tình huống đảo ngược hoàn toàn (`java`=246,3% > `node`=16,3%) — cho thấy việc bỏ qua kiểm tra này là rủi ro thật, không phải lý thuyết suông | Đây là loại lỗi **im lặng nguy hiểm nhất**: không sai ở lượt này nhưng phương pháp phân tích thiếu bước kiểm tra bắt buộc, nên có thể sai ở lượt khác |

**Điều đáng ghi nhận:** AI **đúng** khi từ chối trả lời câu 5 (rò rỉ bộ nhớ) vì thiếu dữ liệu Soak trong prompt — đây là hành vi tốt (biết giới hạn của mình), không phải lỗi.

## 3.3 Đề xuất tối ưu — feasible hay hallucinated

| Đề xuất của AI | Phân loại | Lý do — trích file:dòng | Cách đo lại |
|---|---|---|---|
| 1. Thêm `CREATE INDEX` cho `products.name` | ⚠️ **Feasible nhưng vô ích ở đây** | Truy vấn là `` `SELECT * FROM products WHERE name LIKE '%${searchQuery}%'` `` (`server.js:144`) — wildcard ở **đầu chuỗi** nên B-tree index không dùng được kể cả khi thêm. Xác nhận `database.js` không có `CREATE INDEX` nào từ trước. Đây là ví dụ kinh điển: AI đề xuất "thêm index" như phản xạ mặc định cho mọi truy vấn chậm, mà không đọc kỹ dạng truy vấn |
| 2. Bật SQLite WAL (`PRAGMA journal_mode=WAL`) | ✅ **Feasible** | `POST /api/checkout` có `INSERT` thật (`server.js:302`); SQLite mặc định (rollback journal) khoá cả file khi ghi. WAL cho phép đọc đồng thời với ghi — cải thiện thật khi có nhiều request đọc (bước 2,3) chạy song song với ghi (bước 6) |
| 3. Thêm connection pool cho SQLite | ❌ **Hallucinated** | `sqlite3` của Node mở **một handle trên file cục bộ**, không có mô hình client–server → không tồn tại khái niệm "pool" theo nghĩa PostgreSQL/MySQL. Đây là đề xuất chép từ ngữ cảnh khác, không áp dụng được cho SQLite nhúng |
| 4. Băm mật khẩu bằng bcrypt "để cải thiện hiệu năng" | ❌ **Hallucinated (về hiệu năng)** | `server.js:46` so sánh `user.password === password` (plaintext, tốn ~0ms). Thêm `bcrypt.compare()` **LÀM CHẬM ĐI** hàng chục lần (bcrypt cố tình chậm để chống brute-force) — AI trộn lẫn mục tiêu bảo mật với mục tiêu hiệu năng, đúng về bảo mật nhưng **sai hoàn toàn** về hiệu năng |
| 5. Xoá giỏ hàng (`userCarts`) sau checkout | ✅ **Feasible** | `server.js:290-293` — `userCarts[userId].push(...)`, không có `clearCart` sau `POST /api/checkout`. Liên quan trực tiếp tới quan sát RSS ở Soak (`endurance/endurance-threshold.md` §5): dù chưa thấy rò rỉ rõ ở 12 phút, đây vẫn là sửa chữa đúng hướng phòng ngừa |

**Tổng kết phân loại:** 2 feasible thật sự có ích (WAL, xoá giỏ hàng) · 1 feasible nhưng vô ích do đặc điểm truy vấn (index) · 2 hallucinated (connection pool, bcrypt-vì-hiệu-năng).

*(A/B test thật cho đề xuất WAL: chưa thực hiện — ghi vào `docs/TODO-CON-LAI.md` làm việc điểm cộng nếu còn thời gian, cần sửa `database.js`, restart backend, re-seed dữ liệu, chạy lại Load để so sánh, rồi hoàn nguyên.)*

## 3.4 Đo hồi phục sau cú sốc (Spike)

> **Nguồn:** lượt **chính thức** `results/jtl/23127183_Spike_20260822-192951.jtl` (18.102 sample, 0% lỗi thật, 22/8/2026 19:29:53–19:33:58), ảnh `taskmgr-spike.png` chụp trong cửa sổ sốc.

| Cửa sổ | Khoảng | Peak VU | Sample | RPS | Error% | p50 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|---|
| W1 nền trước | 10–55s | 10 | 1.767 | 39,3 | 0% | 5 | **18** | 27 | 94 |
| W2 trong sốc | 65–90s | **210** | 8.742 | **349,1** | 0% | 333 | **597** | 745 | 893 |
| W3 ngay sau | 96–125s | 10 | 1.120 | 38,7 | 0% | 4 | **15** | 19 | 25 |
| W4 nền sau | 130–238s | 10 | 4.116 | 38,1 | 0% | 4 | **16** | 23 | 298 |

**Đọc kết quả:**

1. **Hồi phục tức thì, không tồn đọng hàng đợi.** p95 ở W3 = **15 ms**, thậm chí *thấp hơn* baseline W1 = 18 ms, và W4 = 16 ms cũng ở mức nền. Nếu có hàng đợi tích lũy thì W3 phải còn cao rồi mới giảm dần — ở đây không có dấu hiệu đó.
2. **Hệ thống hấp thụ cú sốc bằng ĐỘ TRỄ chứ không bằng cách từ chối request:** VU tăng **21×** (10 → 210), p95 tăng **33×** (18 → 597 ms), nhưng **error rate = 0%** ở cả 4 cửa sổ và `max` chỉ 893 ms — không có timeout, không có 5xx.
3. **Load generator KHÔNG phải điểm nghẽn** — phép kiểm chéo mà §3 của `docs/06` đòi:
   - RPS lý thuyết tối đa = VU / (think trung bình + latency) = 210 / (0,250 + 0,343) = **354,0 req/s**
   - RPS đo được ở W2 = **349,1 req/s** → đạt **98,6%** mức lý thuyết
   - ⇒ VU được dùng gần hết công suất; giới hạn nằm ở **độ trễ của server**, không phải ở khả năng sinh tải của JMeter. Nếu JMeter là nút cổ chai thì RPS đã thấp hơn nhiều so với mức lý thuyết. Nhất quán với phát hiện ở Stress (§2.2): SUT, không phải generator, là nút cổ chai khi tải đủ cao.
4. **RPS tăng dưới tuyến tính** (8,9× so với VU 21×) — đúng như kỳ vọng khi hệ thống bị giới hạn bởi độ trễ: mỗi VU phải chờ lâu hơn nên số vòng lặp/giây không tăng theo kịp số VU.
5. **Điểm khác biệt với Stress ở cùng 200 VU:** Stress bậc 4 (200 VU ổn định, ramp từ từ) cho p95=340ms; Spike (200 VU dội trong 5 giây) cho p95=597ms — cao hơn dù cùng số VU. Sốc đột ngột gây áp lực tức thời lớn hơn tăng tải từ từ, dù hệ thống vẫn hồi phục ngay khi tải giảm.

---

# 4. Task 3 — Đề xuất Continuous Performance Testing (10đ, G9.6)

## 4.1 Mô hình

*(Nhúng flow chart mermaid + ảnh `assets/task3-flowchart.svg`.)*

## 4.2 Giải thích từng nhánh quyết định

*(Bảng ở `docs/10-TASK3-CONTINUOUS-PERF.md` §2 — mỗi nút một lý do.)*

## 4.3 Trade-off

*(Bảng ≥6 dòng, bắt buộc có **cost** và **false alarms**.)*

## 4.4 Đã chạy thật trong CI

*(Bảng `ci/ci-runs.md` + đoạn nói kết quả thật đã sửa lại đề xuất §4.3 như thế nào.)*

---

# 5. Bug và vấn đề hiệu năng

*(Tóm tắt từ [`bug-report/bug-report.md`](../bug-report/bug-report.md) + link Issues. Nêu rõ bug nào là mới của HW05, bug nào chỉ trích dẫn lại từ HW02.)*

---

# 6. Giới hạn của bài đo này

*(Liệt kê thành thật — mục này ăn điểm, không mất điểm:)*

1. Load generator (JMeter) và SUT chạy **cùng một máy** — CPU đỉnh `java.exe` *(x)*% vs `node.exe` *(y)*%.
2. Soak chỉ 12 phút — mốc tối thiểu của đề, chưa đủ kết luận chắc chắn về rò rỉ bộ nhớ dài hạn.
3. Số VU tối đa 200, giới hạn bởi số tài khoản trong CSV — **chưa** tăng tới khi hệ thống thật sự gãy.
4. Tải nền của máy không được cô lập giữa các lượt — mọi so sánh giữa hai lượt chỉ là **tương quan**, không phải nhân quả.
5. *(bổ sung theo thực tế)*

---

# 7. AI Critique

*(200–300 từ — file riêng [`ai-audit/ai-critique.md`](../ai-audit/ai-critique.md), chép vào đây hoặc trỏ sang.)*
