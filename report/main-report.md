# HW05 — Performance Testing on EShop — Báo cáo chính

> **KHUNG CHỜ ĐIỀN.** Điền dần theo tiến độ, đừng để cuối. Mọi con số phải truy được về `results/summary.md`.
> §14 đòi Task 1 và Task 2 nằm trong **một** báo cáo — vì thế ba task là **ba chương** của file này.

**Họ và tên:** Phạm Vũ Ngọc Duy · **MSSV:** 23127183 · **Nhóm:** 10
**Ngày thực hiện:** …/08/2026 → …/08/2026
**SUT:** EShop — https://github.com/ttbhanh/eshop-sut · backend `http://localhost:3000/api`
**Công cụ:** Apache JMeter 5.6.3 · Java Temurin 17 · Node v22.16 · Task Manager
**Máy đo:** Windows 11, hostname `Pham_Vu_Ngoc_Duy` — xem [`resource-monitor/hardware-report.md`](../resource-monitor/hardware-report.md)

**Khai báo AI (§9):** *"I use AI tools for the following tasks."* — nhật ký đầy đủ ở [`ai-audit/ai-audit-report.md`](../ai-audit/ai-audit-report.md).

---

# 1. Phạm vi — ba endpoint group (§5)

## 1.1 Đăng ký của nhóm và bằng chứng không trùng

Đã đăng ký workflow *Customer Storefront* trong nhóm chat của Nhóm 10 (bằng chứng đầy đủ, kèm bảng đăng ký của cả nhóm và ảnh tin nhắn: [`docs/endpoint-selection.md`](../docs/endpoint-selection.md) §5). *(SV: sau khi có phản hồi của cả nhóm, chép bảng đăng ký thật vào cả hai nơi — file này và `docs/endpoint-selection.md` — rồi xóa ghi chú "chưa tự làm" trong đó.)*

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
| Stress | 25→50→100→200 (4 bậc, cộng dồn) | 10–20s/bậc | 0,3–1s | ~480s | Aggregate Report | Bậc rời rạc cho **4 con số p95 so sánh được** để định vị điểm gãy; ramp tuyến tính chỉ cho một đường cong mượt không chỉ ra được bậc nào gãy. Think-time giảm còn 0,3–1s để ép tải cao hơn với cùng số VU. 200 VU là trần vì CSV có đúng 200 tài khoản. |
| Spike | 10 nền + 200 trong 5s | 5s | 0–0,5s | 240s | View Results Tree | 60s nền **trước** để có baseline đo trên cùng lượt; 145s nền **sau** để đo hồi phục — đây mới là phần §6 chấm. Ramp 5s (không phải 0) vì dựng 200 thread trong một tick thì chi phí khởi tạo thread của JMeter lấn át tín hiệu. |
| Soak | 20 | 60s | 1–2s | 720s | Summary Report | Cùng mức VU với Load để so trực tiếp lượt 6 phút với lượt 12 phút. 12 phút nằm trong khoảng 10–15 phút §6 yêu cầu. |

**Tham số nào từ đâu:**
- **Suy từ code:** trần 200 VU (số dòng `users.csv`, để không có 2 VU dùng chung 1 tài khoản → tránh tranh chấp ghi trên cùng dòng `users`); think-time Stress thấp hơn Load.
- **Quy ước ngành:** ramp-up ≈ 1/6 thời lượng; think-time 1–3s cho hành vi duyệt web thật; soak 10–15 phút.
- **Đã sửa sau smoke test:** `datadir` mặc định `../data` → **`data`** (JMeter được gọi từ thư mục gốc repo, `../data` trỏ ra ngoài repo).

> **Lưu ý khi đọc RPS của lượt Load.** Think-time đặt ở cấp Thread Group nên áp dụng trước **mỗi** trong 7 sampler → một vòng lặp mất ~14 giây, và 20 VU cho RPS kỳ vọng chỉ **~10 req/s**. Đây là **cố ý**: Load mô phỏng tải người dùng thật đang duyệt shop, **không** phải đo throughput cực đại — việc đó là của Stress. Đọc con số ~10 RPS thành "hệ thống chỉ chịu được 10 RPS" là sai.

## 2.2 Kết quả — tổng quan

*(Bảng 4 lượt, copy từ `results/summary.md`.)*

### Stress — theo từng bậc VU

| Bậc | VU | Sample | RPS | Error% | p50 | p90 | p95 | p99 | max | CPU node đỉnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 25 | | | | | | | | | |
| 2 | 50 | | | | | | | | | |
| 3 | 100 | | | | | | | | | |
| 4 | 200 | | | | | | | | | |

*(Kết luận về điểm gãy — kiểm đủ 4 dấu hiệu ở `docs/05` §4, không kết luận "chịu tải tốt" chỉ từ p95.)*

## 2.3 Kết quả theo từng endpoint

| Sampler | Nhóm | Sample | avg elapsed | avg Latency | p95 | max | Error% |
|---|---|---|---|---|---|---|---|
| 01 Login | auth | | | | | | |
| 02 Search | read | | | | | | |
| 03 Product detail | read | | | | | | |
| 04 Add to cart | trans | | | | | | |
| 05 Apply coupon | trans | | | | | | |
| 06 Checkout | trans | | | | | | |
| 07 Login sai | auth | | | | | | |

*(So sánh bước 2 với bước 3 để tách chi phí quét bảng khỏi chi phí đọc PK — đây là kết quả có nội dung, không chỉ liệt kê.)*

## 2.4 Human review — AI sai gì, vì sao (§6 chấm mục này)

| # | AI sai/sót gì | Bằng chứng | Sửa thành | **Vì sao AI sót** | Plan có báo lỗi không? |
|---|---|---|---|---|---|
| 1 | Đặc tả CSV ở bản thiết kế ban đầu để **cả `users.csv` lẫn `users_lockout.csv` cùng có cột tên `email`** | Hai `CSVDataSet` cùng khai báo biến `email` → cái nạp sau ghi đè cái nạp trước; bước 1 sẽ đăng nhập bằng email tài khoản **mồi** kèm mật khẩu đúng | Đổi tên biến của `users_lockout.csv` thành **`lock_email,wrong_password`** | **Chất lượng prompt** — bản đặc tả liệt kê header từng file riêng lẻ, không ai đối chiếu chéo xem có trùng tên biến giữa các file không | ❌ **Không** — JMeter ghi đè biến im lặng, plan vẫn chạy 0% error |
| 2 | Bảng assertion ban đầu ghi bước 7 *"code `401` = THÀNH CÔNG"* | Đo thật: 3 lần đăng nhập sai liên tiếp cho **401 → 401 → 403**. Nếu assertion chỉ nhận `401` thì từ lần thứ 3 trở đi mọi sample bước 7 bị tính là **lỗi** | Response Assertion regex **`401\|403`** + tick *Ignore Status* | **Đặc điểm endpoint** — `+2`/lần và ngưỡng `>=3` làm khóa được SET ở lần 2 nhưng chỉ **enforce** từ lần 3, vì `server.js:40` kiểm `locked_until` ở đầu request bằng trạng thái đã lưu từ trước | ✅ Có — nhưng chỉ sau khi tài khoản mồi bị khóa, tức **giữa lượt**, không lộ ra ở smoke ngắn |
| 3 | `datadir` mặc định đặt là `../data` | JMeter được gọi từ thư mục gốc repo → `../data` trỏ ra **ngoài** repo, không tìm thấy file | Đổi mặc định thành **`data`** | **Chất lượng prompt** — bản đặc tả không nói rõ CWD lúc chạy là thư mục nào | ✅ Có — CSV rỗng, mọi biến thành literal `${email}` |
| 4 | Assertion bước 3 ban đầu chỉ kiểm HTTP status 200 | `GET /api/products/999999` trả **200 + `{}`** (`server.js:160-161`) → assertion status-only **luôn pass**, và ta đo nhầm chi phí của một truy vấn miss | Thêm assertion body **chứa `"id"`**. Kiểm chứng bằng cách cố tình sửa bước 3 thành id `999999`: kết quả `code=200 success=false`, `failureMessage="Test failed: text expected to contain /"id"/"` | **Đặc điểm endpoint** — trả 200 cho not-found là bất thường, không suy ra được từ quy ước REST | ❌ **Không** — đây là loại nguy hiểm nhất: pass mà vô nghĩa |
| 5 | Nguồn `user_id` cho bước 5 nhập nhằng: `users.csv` có cột `user_id`, mà bước 1 cũng trích được `$.user.id` | Dùng giá trị CSV có rủi ro lệch với `${token}` đang cầm nếu hai nguồn phân kỳ | Dùng **`${uid}` trích từ response** bước 1; đổi cột CSV thành `csv_user_id` và giữ làm đối chứng | **Chất lượng prompt** — đặc tả đưa ra hai nguồn cho cùng một giá trị mà không nói lấy cái nào | ❌ **Không** — cả hai nguồn đều cho số hợp lệ trong điều kiện bình thường |
| 6 | Mô tả lockout trong tài liệu thiết kế ghi gọn *"khóa sau 2 lần sai"* | Đúng về **trạng thái DB** (lần 2 làm `login_attempts`=4 ≥ 3 nên `locked_until` được SET) nhưng **403 chỉ xuất hiện từ lần 3** | Tách bạch hai phát biểu trong tài liệu và trong thiết kế assertion | **Đặc điểm endpoint** — lỗi về **thứ tự** xử lý (kiểm-khóa-trước rồi mới xử-lý-mật-khẩu-sau), giống hệt loại lỗi đã ghi ở HW02 | ❌ **Không** — nhưng nó là nguyên nhân gốc của lỗi #2 |

**Tổng: 6 lỗi** — chất lượng prompt **3** · đặc điểm endpoint **3** · giới hạn mô hình **0**.

> **Điều đáng nói nhất:** **4/6 lỗi không làm test plan báo lỗi** — plan vẫn chạy 0% error với chúng. Chúng chỉ lộ ra khi (a) đọc kỹ tên biến giữa các file CSV, và (b) **cố tình phá assertion để kiểm nó có thật sự bắt được gì không**. Nếu chỉ nhìn "smoke test 0% error → plan đúng" thì cả 4 lỗi này đi thẳng vào bộ số liệu cuối cùng.

**Hai phép kiểm đã dùng để chứng minh assertion không vô nghĩa** (không dừng ở "0% error nên chắc đúng"):

| Phép kiểm | Cách làm | Kết quả |
|---|---|---|
| Assertion bước 3 có thật sự bắt được bẫy 200+`{}`? | Sửa path thành `/api/products/999999`, chạy 20s | `code=200 success=false` — **bắt được** |
| Assertion bước 7 có nhận cả nhánh 403 không? | Trỏ `lock_email` vào tài khoản đang bị khóa, chạy 18s | `code=403 success=true`, error 0% — **nhận đúng** |

## 2.5 Bằng chứng chạy

| Lượt | Raw `.jtl` | Dashboard | Ảnh Task Manager | Mốc giờ |
|---|---|---|---|---|
| Load | | | | |
| Stress | | | | |
| Spike | | | | |
| Soak | | | | |

*(Nhúng ảnh. Kèm ảnh 3 listener khác loại và ảnh View Results Tree cho thấy response 401 của bước 7.)*

**Video demo:** *(link + thời lượng)*

## 2.6 Xử lý account-lockout và state giữa các lượt (§6 đòi ghi lại)

*(Chép mẫu ở `docs/07-CHAY-VA-THU-BANG-CHUNG.md` §3, sửa theo thực tế.)*

## 2.7 Endurance threshold (§6)

*(Tóm tắt từ `endurance/endurance-threshold.md` — bảng kết luận bằng số + phần diễn giải RSS/`userCarts`.)*

## 2.8 *(Tuỳ chọn)* Một phát hiện hoặc một kết luận đã tự bác bỏ

*(Nếu trong quá trình đo bạn rút ra một kết luận rồi dữ liệu sau bác bỏ nó — giữ lại cả hai và giải thích. Đây là loại nội dung ăn điểm cao nhất vì nó chứng minh bạn đọc số liệu thật.)*

---

# 3. Task 2 — AI phân tích và soát lỗi đọc metric (10đ)

## 3.1 Phân tích của AI — nguyên văn

*(Trỏ tới [`ai-audit/task2-ai-output-verbatim.md`](../ai-audit/task2-ai-output-verbatim.md) và tóm tắt các nhận định chính.)*

## 3.2 Soát lại — chỗ AI đọc sai metric

| # | AI nói gì (trích nguyên văn) | Sai ở đâu | **Giá trị đúng từ raw `.jtl`** | Vì sao AI sai |
|---|---|---|---|---|
| 1 | | | *(tên file + con số)* | |
| 2 | | | | |

*(≥5 dòng. Mỗi dòng phải có con số trích từ raw, và ghi lại lệnh dùng để tính con số đó. Danh sách 8 lỗi hay gặp: `docs/09-TASK2-AI-ANALYSIS.md` §3.)*

## 3.3 Đề xuất tối ưu — feasible hay hallucinated

| Đề xuất của AI | Phân loại | Lý do — trích file:dòng | Cách đo lại |
|---|---|---|---|
| | | | |

*(Nếu có A/B test thật — vd bật SQLite WAL — ghi kết quả trước/sau kể cả khi không cải thiện, và ghi rõ đã hoàn nguyên thay đổi trên SUT.)*

## 3.4 Đo hồi phục sau cú sốc (Spike)

| Cửa sổ | Khoảng | Peak VU | Sample | RPS | Error% | p50 | p95 | p99 | max |
|---|---|---|---|---|---|---|---|---|---|
| W1 nền trước | 10–60s | | | | | | | | |
| W2 trong sốc | 60–95s | | | | | | | | |
| W3 ngay sau | 95–125s | | | | | | | | |
| W4 nền sau | 125–240s | | | | | | | | |

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
