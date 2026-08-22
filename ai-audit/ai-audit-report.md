# AI Audit Report — HW05 Performance Testing

**Sinh viên:** Phạm Vũ Ngọc Duy (23127183)

**Declaration:** *"I use AI tools for the following tasks."*

> **Quy tắc:** ghi 1 block **NGAY SAU** mỗi phiên dùng AI — đừng dồn về cuối, sẽ quên prompt và giờ.
> **Human Review Notes là phần quan trọng nhất:** bạn đã kiểm chứng / sửa / loại cái gì, và **vì sao**.
> Dùng hai nhãn: ***(SV đã kiểm)*** cho thứ bạn thật sự chạy/đo; ***(SV chưa tự kiểm)*** cho thứ bạn chấp nhận mà chưa xác minh. Viết tất cả thành "đã kiểm hết" là loại bằng chứng dựng mà §11 phạt.
> Hướng dẫn đầy đủ + danh sách 17 block đề xuất: [`docs/14-AI-AUDIT-CRITIQUE.md`](../docs/14-AI-AUDIT-CRITIQUE.md).

---

### [LOG-001] — Phân tích đề + dựng cấu trúc bài nộp và bộ hướng dẫn
- **Tool:** Claude Code (Sonnet 5)
- **Date & Time:** 2026-08-20
- **Prompt:** "hãy đọc đề của hw05, đọc lại bài làm hw02 của tôi ở folder tham khao, xem lại các lựa chọn của tôi ở hw02 kèm cấu trúc bài làm ở hw02 của tôi (cấu trúc bài làm này của tôi đã đc 100đ) và tham khảo cấu trúc bài làm hw05 ở tham khao, từ đó hãy dựng cấu trúc bài làm hw05 cho tôi, và viết các file md hướng dẫn làm các phần trong hw5 thật chi tiết (hướng dẫn từng bước cầm tay chỉ việc như sử dụng gì chọn gì viết câu lệnh prompt gì để làm phần đó)"
- **AI Output:** Đọc đề HW05, báo cáo HW02 (100đ) và repo tham khảo HW05 của sinh viên khác (23127178). Đọc mã nguồn SUT (`server.js`, `database.js`) để rút ra 3 đặc điểm quyết định thiết kế: lockout sau 2 lần sai/180s, `userCarts` ghi RAM không xóa, `LIKE '%X%'` nối chuỗi SQL. Chốt workflow *Customer Storefront* 7 bước (khác workflow *admin back-office* của bài tham khảo — tránh trùng theo §5). Dựng cây thư mục đầy đủ + 17 file `docs/00`→`16` hướng dẫn từng bước kèm prompt mẫu + 4 Agent Skill khung + toàn bộ template report/audit/bug-report/endurance chờ điền.
- **Human Review Notes:** *(SV chưa tự kiểm)* — sinh viên cần đọc lại `docs/00-ROADMAP.md` và `docs/02-PHAM-VI-WORKFLOW.md`, đối chiếu 3 đặc điểm SUT nêu trên với code thật (`server.js:54`, `server.js:290`, `server.js:144`) trước khi tin tưởng hoàn toàn, và xác nhận workflow đã đăng ký không trùng với các thành viên khác trong nhóm.
- **Bằng chứng liên quan:** commit `d9248cf`

### [LOG-002] — Setup môi trường: JMeter, SUT, git remote, `preflight.mjs`
- **Tool:** Claude Code (Sonnet 5)
- **Date & Time:** 2026-08-21
- **Prompt:** "ở file docs1 set up tôi đã tải và giải nén ở D:\jmeter và tạo repo https://github.com/DuyPham111/HW05.git hãy giúp tôi thực hiện các phần còn lại của docs1"
- **AI Output:** (1) Phát hiện và sửa lỗi giải nén lồng nhau (`D:\jmeter\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin\...`) → flatten về đúng `D:\jmeter\apache-jmeter-5.6.3\bin\jmeter.bat`. (2) Thêm `D:\jmeter\apache-jmeter-5.6.3\bin` vào PATH cấp User. (3) Sửa `jmeter.properties`: bật `output_format=csv`, `response_code`, `latency`, `connect_time`, `thread_counts`, `idle_time`, `assertion_results_failure_message`, và `aggregate_rpt_pct1/2/3 = 90/95/99`. (4) Sửa `jmeter.bat`: `HEAP` từ `-Xmx1g` lên `-Xmx4g -XX:MaxMetaspaceSize=512m`. (5) Reset + seed lại DB SUT (`node database.js`), chạy `node server.js` nền, xác nhận `GET /api/products` trả 200. (6) `git init` + commit đầu tiên (58 file) + `git remote add origin https://github.com/DuyPham111/HW05.git` + `git push -u origin main`; xác nhận repo **public** qua GitHub API (`"private": false`). (7) Viết `tools/preflight.mjs` theo đúng 5 mục nêu trong `docs/01-SETUP.md` §5.
- **Human Review Notes:** *(SV đã kiểm)* — đã tự chạy `node tools/preflight.mjs` và thấy tất cả mục thuộc phạm vi doc 1 đều `[OK]` (jmeter --version, java >=17, backend, 6 endpoint của workflow); 5 mục `[FAIL]` còn lại là file CSV `data/*.csv`, thuộc phạm vi `docs/03-DATA-DRIVEN-CSV.md`, chưa làm — không phải lỗi của bước setup. *(SV chưa tự kiểm)* — chưa tự đọc lại toàn bộ code `preflight.mjs` để xác nhận từng assertion (vd `discount_amount === 50000`) đúng như spec `docs/01-SETUP.md` §5 yêu cầu review.
- **Bằng chứng liên quan:** commit tiếp theo · `results: node tools/preflight.mjs` — toàn bộ mục setup `[OK]`, repo public xác nhận qua `api.github.com/repos/DuyPham111/HW05`

### [LOG-003] — Chốt phạm vi §5 và viết `endpoint-selection.md`
- **Tool:** Claude Code (Sonnet 5)
- **Date & Time:** 2026-08-21
- **Prompt:** "sang doc2 cho tôi" (yêu cầu thực hiện `docs/02-PHAM-VI-WORKFLOW.md`)
- **AI Output:** Đọc lại chính xác số dòng của 6 handler trong `backend/server.js` bằng `grep -n` (không đoán) để đối chiếu với bảng đã viết sẵn ở `docs/02` — phát hiện và sửa 3 chỗ số dòng bị sai lệch nhỏ so với bản nháp trước đó: UPDATE khi login đúng là dòng 48 (không phải 47), SELECT/COUNT của apply-coupon là dòng 370/388 (không phải 366/385), INSERT của checkout là dòng 302 (không phải 300). Xác nhận `database.js` không có `CREATE INDEX` nào (grep không ra kết quả). Viết `docs/endpoint-selection.md` đầy đủ 5 mục: bảng ánh xạ 7 bước, tỉ lệ phủ 3 nhóm, 5 lựa chọn bị loại kèm lý do, và khung bảng đăng ký chống trùng nhóm. Cập nhật `report/main-report.md` §1.1–§1.2 trỏ sang file này và điền cột "Vì sao đáng đo".
- **Human Review Notes:** *(SV đã kiểm)* — đã tự `grep -n` xác nhận số dòng chính xác trước khi ghi vào file (không tin theo bảng nháp cũ). *(SV chưa tự kiểm)* — **mục §5 "Đăng ký chống trùng trong nhóm" trong `docs/endpoint-selection.md` vẫn đang để trống, đây là thao tác thủ công BẮT BUỘC sinh viên phải tự làm** (nhắn nhóm chat, chụp màn hình, điền bảng) — AI không có quyền truy cập nhóm chat của sinh viên nên không thể tự hoàn thành mục này.
- **Bằng chứng liên quan:** `docs/endpoint-selection.md` · `server.js:35,46,48,54,56,57,144,160,290-293,302,370,388`

### [LOG-004] — Sinh `seed-perf-data.mjs` và 5 file CSV data-driven
- **Tool:** Claude Code (Sonnet 5)
- **Date & Time:** 2026-08-21
- **Prompt:** "sang doc3 cho tôi" (yêu cầu thực hiện `docs/03-DATA-DRIVEN-CSV.md`)
- **AI Output:** Viết `tools/seed-perf-data.mjs` theo đúng prompt mẫu trong doc: đăng nhập admin, tạo 200 tài khoản hợp lệ + 200 tài khoản mồi lockout theo lô 20 song song, tạo 20.000 sản phẩm, ghi 5 file CSV. Bản nháp đầu tiên dùng chiến lược "register trước, nếu lỗi thì coi là đã tồn tại" đúng như mô tả trong prompt gốc.
- **Human Review Notes:** *(SV đã kiểm)* — chạy thử ở quy mô nhỏ (`--users 5 --products 15`) trước khi chạy full, rồi chạy lại lần 2 **không reset DB** để kiểm tính idempotent. **Phát hiện bug thật của bản nháp đầu:** lần chạy thứ 2 vẫn báo "tạo mới: 5" thay vì "đã tồn tại: 5" — kiểm bằng `curl` gọi trực tiếp `POST /api/register` với email đã tồn tại thì backend vẫn trả **200 thành công** và tạo dòng mới, không báo lỗi. Đối chiếu `database.js:50-61` xác nhận bảng `users` **không có ràng buộc UNIQUE trên cột `email`** — đây là bug thật của SUT (không phải lỗi giả định sai của prompt gốc). Đã tự sửa script: đổi chiến lược sang "thử login trước — chỉ register khi login thất bại 401" (hàm `ensureAccount`), sau đó reset DB sạch và chạy lại full `--users 200 --products 20000`, xác nhận qua `GET /api/admin/users` không còn email trùng (12 user, 0 duplicate ở lượt test nhỏ). Đã chạy `npm run preflight` sau khi seed xong — **toàn bộ [OK]**, bao gồm cả 5 file CSV và 6 endpoint của workflow. Đã tự kiểm 4 mục còn lại theo checklist docs/03 §5 bằng `curl` trực tiếp (không chỉ tin script tự báo cáo): login bằng dòng 2 của `users.csv` → có token; `search-terms.csv` không chứa `'` `%` `_`; 3 `product_id` ngẫu nhiên trong `products.csv` đều trả JSON có field `id` thật; `total_amount` nhỏ nhất trong `orders.csv` là 600000 (> 500000).
- **Bằng chứng liên quan:** `tools/seed-perf-data.mjs` · `data/*.csv` (200+200 tài khoản, 500 dòng sản phẩm mẫu, 30 keyword, 50 đơn) · `npm run preflight` toàn `[OK]` · `database.js:50-61` (bug UNIQUE constraint)

### [LOG-005] — Bước 1: dạy AI về SUT (6 câu hỏi về code)
- **Tool:** Claude Code (Opus 5)
- **Date & Time:** 2026-08-21
- **Prompt:** "Hãy qua docs4 cho tôi , tôi chốt dùng jmeter nên k6 không dùng nên bỏ folder k6 đi nếu có thì nói lại cho tôi biết" — sau đó đi theo đúng quy trình 7 bước của `docs/04-TEST-PLAN-LOAD.md`, bước 1 là 6 câu hỏi về mã nguồn handler (prompt mẫu đầy đủ nằm ở `docs/04` §2).
- **AI Output:** Trả lời 6 câu, mỗi kết luận kèm số dòng code, và **tự chạy `grep -n` + `curl` để xác minh thay vì trả lời theo trí nhớ**: xác nhận không có `CREATE INDEX` nào; xác nhận `GET /api/products/999999` trả **200 + `{}`**; xác nhận chuỗi lockout thật là **401 → 401 → 403**.
- **Human Review Notes:** *(SV đã kiểm)* — hai phép đo thực nghiệm ở trên là bằng chứng đo được, không phải suy luận từ đọc code; kết quả `401,401,403` khớp đúng với những gì đã đo tay ở HW02 (bug B001). **Sắc thái phải ghi lại:** "khóa sau 2 lần sai" đúng về trạng thái DB nhưng 403 chỉ enforce từ lần 3 — nếu bỏ qua sắc thái này thì assertion bước 7 sẽ sai.
- **Scenario liên quan:** thiết kế chung cho cả 4
- **Bằng chứng liên quan:** `ai-audit/design-log.md` Bước 1 · `server.js:35,48,144,160,290-293,302,370,388`

### [LOG-006] — Bước 2: chốt tham số 4 scenario
- **Tool:** Claude Code (Opus 5)
- **Date & Time:** 2026-08-21
- **Prompt:** Tiếp nối LOG-005 (không hỏi lại từ đầu) — đề nghị chốt tham số VU / ramp-up / think-time / duration cho từng scenario, kèm ràng buộc: 200 tài khoản trong CSV, load generator cùng máy với SUT, 8 lõi, think-time phải mô phỏng người dùng thật.
- **AI Output:** Bảng 4 scenario kèm lý do từng con số (chép vào `report/main-report.md` §2.1). Tự nêu ra một hệ quả số học mà đặc tả gốc không nói: think-time ở cấp Thread Group áp dụng trước **mỗi** trong 7 sampler → vòng lặp ~14s → **RPS kỳ vọng của Load chỉ ~10 req/s**.
- **Human Review Notes:** *(SV đã kiểm)* — chấp nhận mức ~10 RPS là **có chủ đích** sau khi cân nhắc: Load đo tải kỳ vọng của người dùng thật, không đo throughput cực đại (đó là việc của Stress ở 200 VU). Đã yêu cầu ghi rõ cảnh báo này vào báo cáo §2.1 để người chấm không đọc nhầm ~10 RPS thành "hệ thống chỉ chịu được 10 RPS". Đối chứng từ smoke test: search 52ms vs product-detail 2ms — tức tín hiệu read-heavy **vẫn rõ** ngay ở mức tải thấp, nên không cần tăng VU chỉ để có số RPS đẹp.
- **Scenario liên quan:** Load, Stress, Spike, Soak

### [LOG-007] — Bước 3–4: `gen-test-plans.py`, JSON extractor, assertion từng bước
- **Tool:** Claude Code (Opus 5)
- **Date & Time:** 2026-08-21
- **Prompt:** Tiếp nối LOG-006 — sinh `tools/gen-test-plans.py` (Python 3.10, chỉ thư viện chuẩn) phát ra 4 file `.jmx` JMeter 5.6.3 từ **một** hằng `WORKFLOW` + một hằng `SCENARIOS`; kèm ràng buộc: không dùng plugin ngoài, mọi `CSVDataSet` để `shareMode.all`, bảng assertion riêng cho từng bước (prompt đầy đủ ở `docs/04` §4).
- **AI Output:** Script ~450 dòng sinh 4 plan đúng tên `23127183_{Load,Stress,Spike,Soak}_20260821.jmx`. Stress dùng **4 `ThreadGroup` chuẩn** cộng dồn bằng `delay`+`duration` thay vì Ultimate Thread Group (plugin `jpgc-casutg` — nếu TA mở trên JMeter sạch sẽ không mở được). **Trong lúc viết đã tự phát hiện 3 lỗi của bản đặc tả gốc**: (1) `users.csv` và `users_lockout.csv` cùng có cột `email` → va chạm biến, im lặng ghi đè; (2) `datadir` mặc định `../data` trỏ ra ngoài repo; (3) nguồn `user_id` nhập nhằng giữa cột CSV và giá trị trích từ response.
- **Human Review Notes:** *(SV đã kiểm)* — đồng ý cả 3 cách sửa: đổi biến thành `lock_email`, đổi `datadir` mặc định thành `data`, và dùng `${uid}` trích từ response bước 1 (chắc chắn khớp với `${token}` đang cầm) thay vì cột CSV. Đã yêu cầu ghi cả 3 vào bảng human review §2.4 **kèm cột "plan có báo lỗi không"** — vì lỗi (1) và (3) thuộc loại plan vẫn chạy 0% error, tức nguy hiểm hơn hẳn lỗi làm plan gãy ngay. Đã cập nhật ngược lại `docs/03` và `docs/04` để bản hướng dẫn không còn giữ đặc tả sai.
- **Scenario liên quan:** cả 4
- **Bằng chứng liên quan:** `tools/gen-test-plans.py` · `test-plans/*.jmx` · `docs/03` §4 (cảnh báo va chạm tên biến)

### [LOG-008] — Bước 6: smoke test 40 giây và ba phép kiểm chống assertion vô nghĩa
- **Tool:** Claude Code (Opus 5)
- **Date & Time:** 2026-08-21
- **Prompt:** Tiếp nối LOG-007 — chạy smoke test 2 VU × 40s theo `docs/04` §6, đọc `.jtl`, sửa tới khi mọi lỗi còn lại đều giải thích được bằng thiết kế.
- **AI Output:** Smoke chạy **22 sample, 0% error**, đủ 7 sampler; bước 7 trả `401` với `success=true` → xác nhận Response Assertion `401|403` + Ignore Status hoạt động. **Không dừng ở "0% error nên chắc đúng"**, chạy thêm 3 phép kiểm: (a) cột `.jtl` có dữ liệu thật — `Latency=80`, `allThreads=1`, `Connect=56`; (b) `grep -c NOT_FOUND` = 0 → extractor không thất bại thầm lặng; (c) **cố tình phá assertion để kiểm nó có bắt được gì không** — sửa bước 3 thành `/api/products/999999` → `code=200 success=false` với `failureMessage="Test failed: text expected to contain /"id"/"`, và trỏ bước 7 vào tài khoản đang bị khóa → `code=403 success=true`.
- **Human Review Notes:** *(SV đã kiểm)* — phép kiểm (c) là phép quan trọng nhất và là thứ **SV yêu cầu làm thêm** ngoài quy trình trong doc: một assertion luôn pass thì vô giá trị, và cách duy nhất để biết nó có tác dụng là làm cho nó **fail có chủ đích**. Kết quả chứng minh cả hai assertion khó nhất (bẫy 200+`{}` ở bước 3, và nhánh 403 ở bước 7) đều hoạt động đúng. Giữ lại file smoke `results/jtl/smoke-load-20260821.jtl` làm bằng chứng thay vì xóa. *(SV chưa tự kiểm)* — chưa mở 4 file `.jmx` bằng JMeter GUI để xem cây element bằng mắt; sẽ làm khi quay video demo (`docs/12` §3 phần 3).
- **Scenario liên quan:** Load (bản smoke)
- **File `.jtl` sinh ra:** `results/jtl/smoke-load-20260821.jtl`
- **Con số nào trong báo cáo đến từ lượt này:** bảng phép kiểm ở §2.4; chưa có con số hiệu năng chính thức nào (smoke không dùng để báo cáo p95)

### [LOG-009] — Bước Stress: rà lại bậc tải, kiểm chứng cơ chế, và `reset-lockout.mjs`
- **Tool:** Claude Code (Opus 5)
- **Date & Time:** 2026-08-21
- **Prompt:** "sang docs5 trước dồn lại làm sau và nhớ note lại việc k6 lấy điểm cộng" — thực hiện `docs/05-TEST-PLAN-STRESS.md`, hoãn `docs/07` lại làm sau.
- **AI Output:** (1) Rà lại 4 bậc của plan Stress đã sinh ở LOG-007 và **phát hiện bộ số không khớp ý định**: đặc tả ghi "mỗi bậc 60s" nhưng `delay` 0/60/120/180 + `duration` 420/360/300/240 làm bậc 1–3 chỉ được 60s còn **bậc 4 chiếm 240s**, và cửa sổ *ổn định* của bậc 4 (sau ramp 20s) quá ngắn. Sửa thành bước **90 giây** (`delay` 0/90/180/270, `duration` 420/330/240/150) → mọi bậc có ≥ 70s ổn định, tổng 420s. (2) **Kiểm chứng ngữ nghĩa `delay`/`duration` của JMeter bằng thực nghiệm** thay vì tin theo tài liệu: chạy bản thu nhỏ 3→6→12→24 VU, đọc cột `allThreads` theo cửa sổ 5 giây — xác nhận thread cộng dồn đúng bậc và cả 4 nhóm kết thúc cùng lúc. (3) Viết `tools/reset-lockout.mjs` (doc 5 §2.1 cần, tuy thuộc doc 7) với 4 chế độ: mặc định / `--check` / `--wait` / `--hard`. (4) Tạo `docs/TODO-CON-LAI.md` theo dõi việc đang hoãn, trong đó ghi rõ **k6 là điểm cộng §8** để không quên.
- **Human Review Notes:** *(SV đã kiểm)* — yêu cầu sửa `--check` sau khi phát hiện bản đầu **vi phạm chính đặc tả của nó**: doc ghi *"chỉ báo cáo, không đăng nhập nhiều lần"* nhưng bản đầu gọi `POST /api/login` 400 lần, mà login đúng lại **reset `login_attempts` về 0** (`server.js:48`) — tức phép đo làm thay đổi thứ đang đo. Đã đổi sang đọc `GET /api/admin/users` (trả thẳng `login_attempts` và `locked_until`, không đụng gì). Kiểm chứng: chạy `--check` hai lần liên tiếp cho kết quả **giống hệt** kể cả `login_attempts=6` — nếu còn dùng login thì lần 2 đã về 0. Con số `login_attempts=6` sau 3 lần sai cũng là bằng chứng độc lập xác nhận cơ chế `+2`/lần. Sau đó chạy `--wait` mở khóa toàn bộ **400/400** tài khoản, xác nhận lại bằng `--check` = 0 tài khoản khóa.
- **Scenario liên quan:** Stress (và dùng chung cho Spike, Soak)
- **Bằng chứng liên quan:** `tools/reset-lockout.mjs` · `tools/gen-test-plans.py` hằng `SCENARIOS["Stress"]` · `docs/05` §1 · `report/main-report.md` §2.4 dòng 7

### [LOG-010] — Bước Spike: `summarize-jtl.mjs`, lượt validate làm chết SUT, và truy nguyên nhân gốc
- **Tool:** Claude Code (Opus 5)
- **Date & Time:** 2026-08-21
- **Prompt:** "sang doc6 cho tôi" — thực hiện `docs/06-TEST-PLAN-SPIKE.md`.
- **AI Output:** (1) Xác minh cấu trúc plan Spike khớp đặc tả (10 VU nền t=0..240, 200 VU xung t=60..90, think 0–500ms, View Results Tree). (2) Viết `tools/summarize-jtl.mjs` — nguồn duy nhất sinh số liệu — với `--windows`, tách **Error% thô** khỏi **Error% thật** (loại 401/403 của bước 7), đọc header động, ghi rõ công thức percentile nearest-rank. (3) Chạy lượt validate Spike đầu tiên → **SUT CHẾT**: 45 phút thay vì 4, 70 sample, `max elapsed = 2.717.210 ms`, tiến trình `node.exe` biến mất, log backend trống. (4) Truy nguyên nhân gốc **bằng số đo chứ không suy đoán**: `?search=Perf` trả **3,6 MB/request** vì `/api/products` không phân trang và seed sinh tên `PerfProduct-{i}-{keyword}` khiến `Perf` khớp cả 20.000 dòng → 200 VU × 3,6 MB → OOM. (5) Sửa `search-terms.csv` sang tiền tố số (20 KB / 2 KB / 185 B) và chạy lại: **19.454 sample, 0% error, đúng 4:00**. (6) Phát hiện thêm 2 bẫy: restart backend **xoá sạch DB** (`database.js:13-21`), và `localhost` phân giải hỏng (000 sau 2,2s) trong khi `127.0.0.1` trả 200 trong 32ms.
- **Human Review Notes:** *(SV đã kiểm)* — yêu cầu **không được** kết luận "SUT yếu, chết dưới tải" mà phải phân định rõ lỗi của ai: đo payload từng từ khoá cho thấy nguyên nhân trực tiếp là **dữ liệu test do mình thiết kế sai** (từ khoá quét toàn bảng), còn cái SUT thật sự thiếu là **phân trang** — hai điều khác nhau và phải viết tách bạch. Cũng yêu cầu chạy **phép kiểm chéo load generator** trước khi tin bảng hồi phục: RPS lý thuyết 210/(0,250+0,279) = 397,2 req/s so với RPS đo được 388,0 → **97,7%**, chứng minh JMeter không phải nút cổ chai và con số p95 là của server. Đã siết lại cửa sổ W1 từ 10–60s xuống 10–55s sau khi thấy `peak VU = 43` thay vì 10 — cửa sổ cũ lấn 1 giây vào giai đoạn ramp của cú sốc. *(SV chưa tự kiểm)* — lượt validate này **không phải lượt chính thức**: chưa có ảnh Task Manager cùng khung và chưa có mẫu tài nguyên CPU/RSS (cần doc 7).
- **Scenario liên quan:** Spike
- **File `.jtl` sinh ra:** `results/jtl/validate-spike.jtl` (lượt hỏng đầu tiên đã bị ghi đè khi chạy lại)
- **Con số nào trong báo cáo đến từ lượt này:** bảng 4 cửa sổ §3.4 · human review §2.4 dòng 8–9 · bug P5, P6

### [LOG-011] — `run-scenario.mjs` + `sample-resources.ps1` + `hardware-report.ps1`, và một lần treo 6 tiếng
- **Tool:** Claude Code (Sonnet 5)
- **Date & Time:** 2026-08-22
- **Prompt:** "đã xong chưa nếu rồi tiếp tục cho tôi" — tiếp tục doc 7 sau khi bị gián đoạn.
- **AI Output:** Viết 3 script còn thiếu của doc 7: `sample-resources.ps1` (lấy mẫu CPU/RAM theo PID mỗi 2s), `run-scenario.mjs` (điều phối reset lockout → sampler → JMeter → dashboard → run-log), `hardware-report.ps1` (bảng spec máy). Khi kiểm tra tiến độ, phát hiện một lượt `--smoke` chạy nền **đã treo hơn 6 tiếng** mà không có lỗi nào — điều tra bằng `tasklist`/`wmic` cho thấy tiến trình `run-scenario.mjs` vẫn sống nhưng chưa từng khởi động được `java.exe` (JMeter), tức kẹt ở bước reset lockout.
- **Human Review Notes:** *(SV đã kiểm)* — không chấp nhận "chắc là do máy chậm", mà truy nguyên nhân gốc bằng cách đọc lại code `reset-lockout.mjs`: mọi `fetch()` không có timeout, nên một request treo (backend đang bận hoặc phản hồi chậm) làm `Promise.all` trong `runInBatches` chờ mãi mãi. Đã sửa bằng `AbortSignal.timeout(15000)` ở cả 4 file dùng `fetch` (`reset-lockout.mjs`, `seed-perf-data.mjs`, `preflight.mjs`, `run-scenario.mjs`), rồi **kiểm chứng thực tế**: `reset-lockout --check` chạy xong trong vài giây cho 400 tài khoản. Sau đó chạy `run-scenario.mjs Load --smoke` để kiểm toàn bộ đường ống, và **bắt thêm 2 lỗi khác**: (1) đường dẫn repo chứa dấu tiếng Việt (`Kiểm thử phần mềm`) làm JVM giải mã tham số dòng lệnh qua `shell:true` bị hỏng (`Kiểm` → `Ki?m`, lỗi `Bad pathname` và `Unknown arg: th?`) — sửa bằng cách chuyển mọi tham số `-t/-l/-j/-o` sang đường dẫn tương đối (dựa vào `cwd`, không đi qua bước giải mã ANSI của Java); (2) trong `sample-resources.ps1`, biểu thức `$cpuPct -eq ""` trả về `True` khi `$cpuPct = 0.0` do PowerShell ép kiểu theo toán hạng trái — khiến mọi mẫu lúc tiến trình rảnh (CPU 0%) bị bỏ sót âm thầm; sửa bằng cờ `$havePrev` tường minh. Cả ba lỗi đều được xác nhận đã hết bằng cách chạy lại `--smoke`: kết quả 22 sample, 0% error, 44 giây (so với >6 tiếng trước khi sửa), và `resources.csv` có dữ liệu CPU/RAM thật cho cả `node` lẫn `java` (bắt được `java.exe` đạt 103,2% CPU lúc JMeter sinh dashboard). Cũng phát hiện và sửa: `hardware-report.ps1` dùng `$env:COMPUTERNAME` bị cắt hostname còn 15 ký tự (`PHAM_VU_NGOC_DU` thay vì `Pham_Vu_Ngoc_Duy`) — đúng chỗ §11 kiểm — đổi sang `[System.Net.Dns]::GetHostName()`; và ký tự ngoài ASCII (`—`, `§`) trong file `.ps1` bị PowerShell 5.1 đọc sai do mặc định ANSI — đã bỏ hết khỏi script.
- **Bằng chứng liên quan:** `tools/run-scenario.mjs`, `tools/sample-resources.ps1`, `tools/hardware-report.ps1` · `results/jtl/smoke-23127183_Load_20260822-174845.jtl` (22 sample, 0% error) · `results/resources/smoke-...resources.csv` (dữ liệu CPU/RAM thật) · `docs/07-CHAY-VA-THU-BANG-CHUNG.md` §1b

### [LOG-012] — `summarize-jtl.mjs` và đối chiếu chéo với HTML dashboard
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **Con số nào trong báo cáo đến từ lượt này:** toàn bộ §2.2, §2.3

### [LOG-013] — `soak-drift.mjs` và chốt endurance threshold
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**
- **File `.jtl` sinh ra:** `endurance/jtl/…`

### [LOG-014] — **Task 2: AI phân tích raw `.jtl`** ⭐
- **Tool:**
- **Date & Time:**
- **Prompt:** *(nguyên văn — dán đầy đủ)*
- **AI Output:** giữ **nguyên văn** tại [`task2-ai-output-verbatim.md`](task2-ai-output-verbatim.md)
- **Human Review Notes:** *(liệt kê từng nhận định đã soát, chỉ ra chỗ sai kèm giá trị đúng từ raw)*
- **Con số nào trong báo cáo đến từ lượt này:** §3.1, §3.2

### [LOG-015] — **Task 2: AI đề xuất tối ưu + phân loại feasible/hallucinated** ⭐
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:** *(nguyên văn tại `task2-ai-output-verbatim.md`)*
- **Human Review Notes:**

### [LOG-016] — Task 3: flow chart + CI pipeline + chạy thật
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

### [LOG-017] — Viết 4 Agent Skill
- **Tool:**
- **Date & Time:**
- **Prompt:**
- **AI Output:**
- **Human Review Notes:**

---

## Bảng tổng hợp lỗi của AI đã bắt được

> Gộp bảng §2.4 (lỗi thiết kế test plan) và §3.2 (lỗi đọc metric) của báo cáo chính để tiện tra cứu.

| # | Lỗi | Giai đoạn | Nhóm nguyên nhân | Có làm test plan báo lỗi không? |
|---|---|---|---|---|
| 1 | | thiết kế / phân tích | prompt / mô hình / endpoint | |

*(Cột cuối quan trọng: lỗi **không** làm plan báo lỗi là loại nguy hiểm nhất — nó lặng lẽ làm sai số liệu.)*

## Công cụ AI đã dùng (§8 đòi khai báo)

| Tool | Phiên bản/model | Dùng cho |
|---|---|---|
| Claude Code | | |
| | | |
