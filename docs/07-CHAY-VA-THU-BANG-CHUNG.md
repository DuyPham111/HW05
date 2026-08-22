# 07 — Chạy các lượt và thu bằng chứng (§6, §11)

> §11 nói thẳng: raw `.jtl`, ảnh monitor, hardware report và video là những thứ **TA sẽ mở ra kiểm**, và **không được AI sinh ra hay dựng lên**. File này là quy trình để mọi bằng chứng đó khớp nhau về thời gian.
> Output: `tools/run-scenario.mjs` · `tools/sample-resources.ps1` · `tools/summarize-jtl.mjs` · `tools/reset-lockout.mjs` · `results/` đầy đủ · `resource-monitor/`.

---

## 1. Nguyên tắc: mọi bằng chứng phải **khớp mốc thời gian**

TA đối chiếu 3 thứ:

```
results/run-log.md          "Load bắt đầu 20/08/2026 14:05:12, kết thúc 14:11:14"
        ↕ phải khớp
results/jtl/…Load….jtl      timeStamp dòng đầu / dòng cuối (epoch ms)
        ↕ phải khớp
screenshots/taskmgr-load.png  giờ trên đồng hồ Windows trong ảnh + mtime của file ảnh
```

→ Vì thế: **chụp ảnh trong lúc lượt đang chạy**, không chụp trước, không dựng lại sau. Và trong ảnh phải nhìn thấy **đồng hồ của Windows** (góc phải taskbar) — đó là dấu thời gian không giả được.

---

## 1b. Ba lỗi thật đã gặp khi dựng bộ script này — đọc trước khi chạy

**Đã tự viết và tự kiểm chứng** `run-scenario.mjs`, `sample-resources.ps1`, `hardware-report.ps1` (không chỉ để prompt mẫu). Ba lỗi dưới đây là lỗi **thật**, bắt được bằng cách chạy `--smoke` (2 VU × 40s) trước khi tin tưởng script:

### 1b.1 `fetch()` không timeout → treo **6 tiếng** không báo lỗi gì

Mọi `fetch()` trong `reset-lockout.mjs`, `seed-perf-data.mjs`, `preflight.mjs`, `run-scenario.mjs` **không có timeout**. Nếu một request bị treo (backend chậm phản hồi, hoặc đang bận xử lý 200 request khác), `Promise.all` trong `runInBatches` chờ **mãi mãi**, và không có gì báo cho bạn biết pipeline đã chết đứng.

**Đã xảy ra thật:** một lượt `--smoke` chạy nền đã treo **hơn 6 tiếng** ở đúng bước reset lockout, trước khi JMeter kịp khởi động. Không có bất kỳ thông báo lỗi nào — script vẫn "đang chạy" trong Task Manager.

**Đã sửa:** thêm `signal: AbortSignal.timeout(15000)` vào mọi lệnh gọi `fetch()`. Giờ một request treo sẽ tự huỷ sau 15 giây và ném lỗi rõ ràng thay vì treo vô hạn.

> **Bài học áp dụng chung:** bất kỳ script nào gọi HTTP trong vòng lặp — kể cả script bạn tự viết cho môn học — đều phải có timeout. Không có timeout không phải là "ổn vì local nhanh", mà là một quả bom hẹn giờ chưa nổ.

### 1b.2 Đường dẫn có dấu tiếng Việt làm JMeter đọc sai tham số dòng lệnh

Thư mục gốc `D:\Nam3\HK3\Kiểm thử phần mềm\...` có dấu tiếng Việt. Khi Node gọi `jmeter.bat` qua `shell: true` (bắt buộc vì `.bat` cần `cmd.exe`), JVM giải mã tham số dòng lệnh theo **bảng mã ANSI của hệ thống**, không phải UTF-8/UTF-16 — nên `ể`, `ử` bị hỏng thành `?`.

**Hậu quả quan sát được:**
```
ERROR ... FileManager (D:\Nam3\HK3\Ki?m) java.io.IOException: Bad pathname
An error occurred: Unknown arg: th?
```
(`Kiểm` → `Ki?m`, và `thử` bị tách thành token rác `th?` làm JMeter tưởng là một tham số lạ.)

**Đã sửa:** đổi mọi tham số `-t / -l / -j / -o` truyền cho JMeter sang **đường dẫn tương đối** (chỉ ASCII, vd `test-plans/23127183_Load_....jmx`), dựa vào `cwd` để JMeter tự ghép — vì thư mục làm việc (`cwd`) được đặt qua Windows API dạng chuỗi rộng (wide string), không đi qua bước giải mã ANSI của Java nên không bị lỗi này.

> **Nếu bạn tự viết thêm script gọi JMeter:** luôn dùng đường dẫn tương đối làm tham số `-t/-l/-j/-o`, không dùng đường dẫn tuyệt đối — bất kể máy bạn có dấu tiếng Việt hay không, đây là cách an toàn chung.

### 1b.3 `0.0 -eq ""` trong PowerShell trả về `TRUE`

Bản đầu của `sample-resources.ps1` dùng `if ($cpuPct -eq "") { continue }` để bỏ qua mẫu đầu tiên (chưa có mốc trước để tính CPU%). Nhưng PowerShell ép kiểu toán hạng phải theo toán hạng **trái**: `0.0 -eq ""` cho ra `True` vì `""` bị ép thành `0`. Hậu quả: **mọi mẫu lúc tiến trình đang rảnh (CPU=0%) bị âm thầm bỏ qua**, không chỉ mẫu đầu tiên.

**Đã sửa:** dùng cờ `$havePrev` tường minh thay vì so sánh giá trị.

> Đây là lớp lỗi PowerShell rất dễ mắc: khi so sánh với `-eq`, **luôn đặt hằng số ở bên trái** (`"" -eq $cpuPct`) hoặc dùng biến cờ boolean tường minh — đừng so sánh số với chuỗi rỗng.

**Cả ba lỗi đều được kiểm chứng bằng cách chạy lại `node tools/run-scenario.mjs Load --smoke`** sau khi sửa — kết quả: 22 sample, 0% error, chạy đúng 44 giây (so với hơn 6 tiếng trước khi sửa).

### 1b.4 Một điều cần biết khi đọc `resources/*.csv`: sampler bắt MỌI tiến trình `node.exe`

`sample-resources.ps1` lấy mẫu theo **tên tiến trình**, nên nếu bạn chạy `run-scenario.mjs` (tự nó cũng là một tiến trình `node`) trong lúc backend cũng là `node`, file `.resources.csv` sẽ có **hai dòng `node` khác PID** ở mỗi mốc thời gian. Khi đọc file để lấy RSS/CPU của **backend**, phải lọc đúng PID của backend (ổn định qua nhiều lượt nếu bạn không restart nó) — đừng cộng gộp hai dòng `node` lại, và đừng nhầm PID của chính script chạy lượt đo với PID của SUT.

---

## 2. `tools/run-scenario.mjs` — một lượt chạy là một lệnh

**Prompt cho AI:**

> Viết `tools/run-scenario.mjs` (Node 22, ESM, không dependency ngoài) chạy trên **Windows 11**. Cách gọi: `node tools/run-scenario.mjs <Load|Stress|Spike|Soak> [--dry]`.
>
> Trình tự:
> 1. Đọc tên file plan mới nhất khớp `test-plans/23127183_<Scenario>_*.jmx`. Không có → thoát mã 1.
> 2. Gọi `node tools/reset-lockout.mjs` và chờ xong. In kết quả.
> 3. Tạo `stamp = YYYYMMDD-HHmmss` theo giờ máy. Tên cơ sở `23127183_<Scenario>_<stamp>`.
> 4. **Xóa** thư mục `results/html/<scenario-lowercase>/` nếu đã tồn tại — JMeter báo lỗi *sau khi* chạy xong nếu thư mục `-o` không rỗng, và như vậy là mất cả lượt.
> 5. Khởi động tiến trình lấy mẫu tài nguyên **song song**: `powershell -ExecutionPolicy Bypass -File tools/sample-resources.ps1 -OutFile results/resources/<base>.resources.csv -IntervalSec 2`.
> 6. Chạy JMeter, `stdio: inherit` để thấy dòng summariser trực tiếp:
>    `jmeter -n -t <plan> -l results/jtl/<base>.jtl -j results/jtl/<base>.jmeter.log -e -o results/html/<scenario>/ -Jdatadir=../data -Jhost=localhost -Jport=3000`
>    (với `Soak` thì ghi vào `endurance/jtl/` và `endurance/html/soak/`.)
> 7. Kết thúc: dừng tiến trình lấy mẫu (gửi SIGTERM / `taskkill /PID`).
> 8. Ghi **append** một block vào `results/run-log.md` (Soak → `endurance/run-log.md`) gồm: scenario, tên file plan, giờ bắt đầu/kết thúc **theo giờ địa phương và epoch ms**, thời lượng, đường dẫn `.jtl` + dashboard + resources, số dòng bảng `products` tại thời điểm chạy (gọi `GET /api/products` và đếm), và một dòng trống *"Ảnh Task Manager: ……"* để tôi tự điền tên file.
> 9. In nhắc nhở to trước khi chạy: **"MỞ TASK MANAGER, CHỤP ẢNH LÚC GIÂY THỨ N"** với N tùy scenario (Load 180, Stress 200, Spike 70, Soak 400).
>
> `--dry` thì in ra lệnh sẽ chạy rồi thoát, không chạy gì.

Kiểm bằng `--dry` trước:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && node tools/run-scenario.mjs Load --dry
```

---

## 3. `tools/reset-lockout.mjs` — §6 đòi ghi lại thủ tục này

**Vì sao cần:** bước 7 của workflow cố tình đăng nhập sai. Với `+2` mỗi lần và ngưỡng `>=3`, tài khoản mồi bị khóa **180 giây** sau 2 lần. Lượt sau chạy trên tài khoản còn khóa = đo nhánh 403 (thoát sớm ở `server.js:40`) chứ không phải nhánh 401 (so mật khẩu) → hai lượt không so được với nhau.

**Prompt:**

> Viết `tools/reset-lockout.mjs` (Node 22, ESM). Nó mở khóa mọi tài khoản đang bị khóa của SUT EShop bằng cách **đăng nhập đúng mật khẩu** — vì `server.js:47` reset `login_attempts = 0, locked_until = NULL` khi đăng nhập thành công.
> - Đọc `data/users.csv` và `data/users_lockout.csv`; mọi tài khoản đều có mật khẩu đúng là `Test1234!`.
> - **Vấn đề:** nếu tài khoản đang bị khóa thì `POST /api/login` trả **403 trước khi** so mật khẩu (`server.js:39–43`), nên đăng nhập đúng **không** mở khóa được. Vì vậy script phải: gọi login đúng cho từng tài khoản, nếu trả **403** thì ghi vào danh sách "còn khóa" kèm thời điểm ước tính hết khóa, và in ra **cần đợi bao nhiêu giây** rồi thoát mã 2.
> - Tùy chọn `--wait`: tự đợi tới khi mọi tài khoản mở được (poll mỗi 15 giây, tối đa 200 giây).
> - Tùy chọn `--check`: chỉ báo cáo, không đăng nhập nhiều lần.
> - Tùy chọn `--hard`: reset triệt để bằng cách chạy `node database.js` trong thư mục backend — **cảnh báo rõ** rằng cách này **xóa sạch DB** (mất luôn 20.000 sản phẩm và 400 tài khoản đã seed) nên phải seed lại.
> - In bảng tổng kết: tổng số tài khoản, số mở được, số còn khóa, thời gian đợi cần thiết.

**Thủ tục viết vào báo cáo §2.6** (đề đòi *"document the steps"*) — chép nguyên đoạn này rồi sửa theo thực tế của bạn:

```markdown
### 2.6 Xử lý account-lockout giữa các lượt

Bước 7 của workflow cố tình đăng nhập sai bằng tài khoản mồi (`data/users_lockout.csv`), nên sau
mỗi lượt các tài khoản này đang ở trạng thái khóa. Cơ chế: `login_attempts + 2` mỗi lần sai
(`server.js:54`), khóa khi `>= 3` (tức **2 lần sai**), thời gian khóa `Date.now() + 180000`
= **180 giây** (`server.js:57`). Khóa được gỡ theo **hai** cách: (a) hết 180s, hoặc (b) một lần
đăng nhập **đúng** — nhưng (b) chỉ hiệu lực khi khóa đã hết, vì `server.js:39–43` trả 403 và
`return` **trước khi** so mật khẩu.

Thủ tục thực tế đã áp dụng giữa mọi lượt:
1. `npm run reset:lockout -- --check` → liệt kê tài khoản còn khóa và số giây còn lại.
2. Nếu còn khóa: `npm run reset:lockout -- --wait` (đợi tối đa 200s, poll 15s/lần).
3. Cooldown thêm **90 giây** sau khi mở khóa xong, để GC của Node và page cache SQLite ổn định lại.
4. Ghi mốc giờ của cả 3 bước vào `results/run-log.md` trước khi bấm chạy lượt tiếp theo.

Nhật ký từng lượt: [`results/run-log.md`](../results/run-log.md).
```

---

## 4. Ảnh bằng chứng — §6 và §11 kiểm rất kỹ

> §6: *"capture, for each run, a screenshot of the tool together with the backend process's resource usage (htop / **Task Manager** / Activity Monitor)"* — **cùng một ảnh**, không phải hai ảnh ghép.

### 4.1 Bố trí màn hình trước khi chạy

```
┌─────────────────────────────┬──────────────────────────────┐
│  Terminal đang chạy JMeter  │   Task Manager → tab Details  │
│  (thấy dòng summariser:     │   sắp xếp theo CPU giảm dần   │
│   "summary + 1234 in …")    │   thấy rõ:  node.exe  java.exe│
└─────────────────────────────┴──────────────────────────────┘
                     đồng hồ Windows góc phải taskbar phải nhìn được
```

**Cách làm cụ thể:**
1. `Win + →` cho terminal (chiếm nửa trái), `Win + ←` cho Task Manager (nửa phải).
2. Task Manager → tab **Details** → chuột phải header → **Select columns** → bật `CPU`, `Memory (private working set)`, `Threads`, `PID`.
3. Sắp xếp theo cột **CPU** giảm dần.
4. Chụp bằng **`Win + Shift + S`** → chọn **Fullscreen** (không phải vùng chọn — cần thấy taskbar có đồng hồ).
5. Lưu đúng tên: `resource-monitor/screenshots/taskmgr-<scenario>.png`.

### 4.2 Chụp lúc nào

| Scenario | Chụp ở giây thứ | Vì sao |
|---|---|---|
| Load | ~180 | giữa vùng ổn định, sau ramp |
| **Stress** | **~200–230** | đang ở **bậc 200 VU** — ảnh giá trị nhất của cả bài |
| **Spike** | **~62–90** | trong cửa sổ sốc, chỉ 30 giây → nên **quay màn hình** rồi cắt frame |
| Soak | ~400 | giữa lượt, để so RSS với lúc đầu và lúc cuối |

### 4.3 Bốn thứ phải nhìn thấy trong ảnh (tự soi lại từng ảnh)

- [ ] Cửa sổ **JMeter/terminal** đang chạy, có dòng summariser với số sample đang tăng
- [ ] **`node.exe`** trong Task Manager, đọc được số CPU và Memory
- [ ] **`java.exe`** (chính là JMeter) — cần để chứng minh load generator ăn bao nhiêu
- [ ] **Đồng hồ Windows** — mốc thời gian khớp `run-log.md`

> Ảnh mờ, ảnh chụp bằng điện thoại, ảnh crop mất đồng hồ → coi như không có bằng chứng. Chụp lại thì phải chạy lại lượt, nên **làm đúng ngay lần đầu**.

### 4.4 Số liệu tài nguyên đo được — `tools/sample-resources.ps1`

Ảnh chỉ là một khoảnh khắc. Cần thêm chuỗi số theo thời gian để vẽ và để đối chiếu ở Task 2.

**Prompt:**

> Viết `tools/sample-resources.ps1` (PowerShell 7, chạy trên Windows 11). Tham số: `-OutFile <path>`, `-IntervalSec 2`, `-ProcessNames @("node","java")`.
> Mỗi `IntervalSec` giây, với **mỗi** tiến trình trong danh sách, ghi một dòng CSV gồm:
> `timestamp_iso, epoch_ms, process, pid, cpu_percent_of_one_core, working_set_mb, private_mb, threads, handles`
> Cách tính `cpu_percent_of_one_core`: lấy hiệu của `(Get-Process).CPU` (tổng giây CPU đã dùng) giữa hai lần lấy mẫu, chia cho số giây trôi qua, nhân 100. **Không** dùng `Get-Counter '\Process(...)\% Processor Time'` vì tên instance đổi khi có nhiều tiến trình cùng tên (`node#1`, `node#2`) và sẽ ghi nhầm tiến trình.
> Nếu có nhiều tiến trình cùng tên, ghi **một dòng cho mỗi PID** (đừng cộng gộp) — cần phân biệt được backend với process node khác.
> Ghi header ngay dòng đầu, flush sau mỗi lần ghi (dùng `Add-Content`), và chạy tới khi bị kill.
> Ghi chú trong file: `cpu_percent_of_one_core = 100` nghĩa là bão hòa **một lõi**; máy có 8 lõi nên trần lý thuyết là 800.

**Đọc kết quả:**

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && awk -F, 'NR>1 && $3=="node"{if($5>m)m=$5; s+=$5; n++} END{printf "node CPU: dinh %.1f%% cua 1 loi, trung binh %.1f%%\n", m, s/n}' results/resources/23127183_Load_*.resources.csv
```

Ba con số phải lấy ra từ file này cho mỗi lượt (điền vào báo cáo):

| Chỉ số | Ý nghĩa |
|---|---|
| **CPU đỉnh của `node`** (% của một lõi) | chạm ~100 = bão hòa single-thread, dù máy còn 7 lõi rảnh |
| **CPU đỉnh của `java`** | > CPU của `node` ⇒ **load generator là điểm nghẽn** → bắt buộc ghi vào mục Giới hạn |
| **`working_set_mb` đầu / cuối lượt** | dùng cho endurance threshold ([08](08-ENDURANCE-THRESHOLD.md)) |

---

## 5. Hardware report (§6, §11) — hostname phải khớp HW trước

> §11: *"The hardware report, whose hostname matches your previous homework deployments."*
> Hostname máy bạn: **`Pham_Vu_Ngoc_Duy`** — khớp với HW02/HW04. Đừng đổi tên máy trước khi nộp.

### 5.1 Chụp dxdiag

```bash
dxdiag
```

Cửa sổ mở ra → tab **System** → chụp **fullscreen** (`Win+Shift+S` → Fullscreen) → lưu `resource-monitor/screenshots/hardware-dxdiag.png`.

Trong ảnh phải đọc được: **Computer Name**, Operating System, Processor, Memory.

Xuất luôn bản text (nộp kèm càng chắc):

```bash
dxdiag /t "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing/resource-monitor/dxdiag.txt"
```

### 5.2 `tools/hardware-report.ps1` → bảng spec

**Prompt:**

> Viết `tools/hardware-report.ps1` (PowerShell 7) sinh ra `resource-monitor/hardware-report.md` gồm một bảng Markdown: Hostname (`$env:COMPUTERNAME`), User, OS + build (`Get-CimInstance Win32_OperatingSystem`), CPU model + số lõi vật lý + logic + xung cơ bản (`Win32_Processor`), RAM tổng GB (`Win32_ComputerSystem.TotalPhysicalMemory`), loại + dung lượng ổ đĩa chứa SUT (`Win32_DiskDrive` + `Win32_LogicalDisk`), phiên bản Java (`java -version`), phiên bản JMeter (`jmeter --version`), phiên bản Node (`node -v`), ngày giờ sinh báo cáo. Thêm một mục ghi rõ: **load generator (JMeter) và SUT chạy trên cùng máy này** — đây là giới hạn phải công bố.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run hardware && cat resource-monitor/hardware-report.md
```

**Commit:** `docs: hardware report + anh dxdiag (hostname Pham_Vu_Ngoc_Duy)`

---

## 6. `tools/summarize-jtl.mjs` — **nguồn duy nhất** của mọi con số

Đây là script quan trọng nhất của bài. Mọi con số trong README, báo cáo, và Task 2 đều phải in ra từ đây. Gõ tay số từ HTML dashboard là cách chắc chắn nhất để README và báo cáo lệch nhau — và TA sẽ thấy.

**Prompt:**

> Viết `tools/summarize-jtl.mjs` (Node 22, ESM, không dependency ngoài) đọc **mọi** file `.jtl` trong `results/jtl/` và `endurance/jtl/`, rồi ghi `results/summary.md`.
>
> Định dạng `.jtl` là CSV có header: `timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect`. Tự đọc header, **đừng hard-code chỉ số cột**.
>
> Với mỗi file, tính và in:
> 1. **Tổng thể**: số sample, thời lượng (max timeStamp − min timeStamp), RPS = sample/thời lượng, error rate = tỉ lệ `success == false`, avg/p50/p90/**p95**/p99/max của `elapsed`, và **avg/p95 của `Latency`** (cột riêng, không trộn với `elapsed`).
> 2. **Theo từng sampler (`label`)**: cùng bộ chỉ số trên → để chỉ ra endpoint nào đắt nhất.
> 3. **Phân rã `responseCode`**: đếm từng mã (200/400/401/403/500/Non HTTP…), kèm sampler nào sinh ra mã đó. Mục này là chỗ tách "lỗi thiết kế" khỏi "lỗi thật".
> 4. **Peak `allThreads`** — bằng chứng lượt chạy thật sự đạt tới mức VU đã thiết kế.
> 5. Tuỳ chọn `--windows "a-b,c-d"` (giây, gốc = timeStamp nhỏ nhất): lặp lại mục 1 cho từng cửa sổ.
>
> **Cách tính percentile phải ghi rõ trong output**: sắp xếp tăng dần, `p = mảng[ceil(n * q) - 1]` (nearest-rank). Ghi luôn công thức vào đầu file `summary.md` — Task 2 cần đối chiếu và nếu không nói rõ thì con số của bạn lệch với dashboard JMeter một chút mà không giải thích được.
>
> Đầu file `summary.md` ghi: *"File này sinh tự động bằng `npm run summary`. Đừng sửa tay."*

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run summary && head -40 results/summary.md
```

### Tự kiểm script đúng: đối chiếu chéo với JMeter

Mở `results/html/load/index.html` → bảng **Statistics** → so `Samples`, `Error %`, `95th pct` với `summary.md`.

- Lệch **0** ở số sample và error% → đọc file đúng
- Lệch **1–2 ms** ở p95 → bình thường, do JMeter dùng cách nội suy percentile khác. **Ghi câu giải thích này vào báo cáo** — đây chính là loại chi tiết chứng minh bạn tự tính chứ không chép.
- Lệch nhiều → script sai, sửa trước khi đi tiếp.

**Commit:** `feat(tools): summarize-jtl sinh moi con so tu raw jtl`

---

## 7. Thứ tự chạy 4 lượt trong một buổi

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && node tools/run-scenario.mjs Load
```

Rồi lần lượt (mỗi lượt cách nhau **cooldown 90 giây**, và **reset lockout** trước mỗi lượt):

| # | Lệnh | Thời lượng | Ảnh chụp ở giây |
|---|---|---|---|
| 1 | `node tools/run-scenario.mjs Load` | 6 phút | 180 |
| 2 | `node tools/run-scenario.mjs Stress` | 8 phút | 200–230 |
| 3 | `node tools/run-scenario.mjs Spike` | 4 phút | 62–90 |
| 4 | `node tools/run-scenario.mjs Soak` | 12 phút | 400 |

Tổng ~30 phút chạy + 5 phút cooldown. **Chạy tuần tự, không bao giờ song song** — 2 lượt tranh CPU thì cả 2 bộ số liệu vô nghĩa.

### Sau khi chạy hết

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run summary && ls -la results/jtl/ results/html/ resource-monitor/screenshots/
```

- [ ] 4 file `.jtl` + 4 `.jmeter.log`
- [ ] 4 thư mục HTML dashboard, mở được `index.html`
- [ ] 4 file `.resources.csv`
- [ ] 4 ảnh Task Manager + 1 ảnh dxdiag + 1 ảnh View Results Tree
- [ ] `results/run-log.md` có 4 block, mốc giờ khớp với `.jtl`
- [ ] `results/summary.md` sinh xong, số khớp dashboard

**Commit:** `test: 4 luot chay + raw jtl + dashboard + anh bang chung`

---

→ Tiếp: [08-ENDURANCE-THRESHOLD.md](08-ENDURANCE-THRESHOLD.md)
