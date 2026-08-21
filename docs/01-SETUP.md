# 01 — Setup: JMeter trên Windows, SUT, preflight

> Mục tiêu buổi 1 (phần đầu): gõ `npm run preflight` ra **toàn `[OK]`**.
> Máy bạn (đã kiểm): Java **Temurin 17** ✔ · Node **v22.16** ✔ · Python **3.10.6** ✔ · **JMeter chưa có** ✘ · hostname **`Pham_Vu_Ngoc_Duy`** (khớp HW trước — §11 kiểm đúng chỗ này).

---

## 1. Cài Apache JMeter (bắt buộc — §8 nói JMeter là tool mặc định)

JMeter là file zip, không có installer. Làm đúng 4 bước:

**Bước 1.** Tải bản binary mới nhất tại https://jmeter.apache.org/download_jmeter.cgi → mục **Binaries** → `apache-jmeter-5.6.3.zip` (~90 MB).

**Bước 2.** Giải nén vào `C:\jmeter\` sao cho có `C:\jmeter\apache-jmeter-5.6.3\bin\jmeter.bat`.

> Đừng để trong `Downloads` hay đường dẫn có dấu tiếng Việt/khoảng trắng — JMeter gọi Java bằng script `.bat`, đường dẫn có khoảng trắng là nguồn lỗi khó chịu.

**Bước 3.** Thêm vào PATH (PowerShell, **không cần quyền admin**):

```bash
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\jmeter\apache-jmeter-5.6.3\bin", "User")
```

Đóng **hết** cửa sổ terminal rồi mở lại (PATH chỉ nạp lúc khởi động shell).

**Bước 4.** Kiểm:

```bash
jmeter --version
```

Phải in ra `Copyright (c) 1999-2024 The Apache Software Foundation` và dòng `5.6.3`. Nếu báo *"jmeter is not recognized"* → PATH chưa nạp, mở terminal mới; nếu vẫn không được thì gọi bằng đường dẫn đầy đủ `C:\jmeter\apache-jmeter-5.6.3\bin\jmeter.bat`.

### 1b. Chỉnh 2 tham số của JMeter trước khi chạy lượt thật

Mở `C:\jmeter\apache-jmeter-5.6.3\bin\jmeter.properties`, sửa/thêm:

```properties
# Ghi đủ cột cho .jtl — thiếu mấy cột này thì Task 2 không soát được metric
jmeter.save.saveservice.output_format=csv
jmeter.save.saveservice.response_code=true
jmeter.save.saveservice.latency=true
jmeter.save.saveservice.connect_time=true
jmeter.save.saveservice.thread_counts=true
jmeter.save.saveservice.idle_time=true
jmeter.save.saveservice.assertion_results_failure_message=true

# Percentile mặc định của dashboard: p90/p95/p99 (đề hỏi p95)
aggregate_rpt_pct1=90
aggregate_rpt_pct2=95
aggregate_rpt_pct3=99
```

Cột **`Latency`** và **`allThreads`** là hai cột Task 2 cần nhất:
- `elapsed` = tổng thời gian request (gồm cả truyền dữ liệu), `Latency` = tới byte đầu tiên. AI rất hay **đọc `elapsed` như thời gian xử lý của server** — có cột `Latency` thì bạn bác bỏ được bằng số.
- `allThreads` = số VU đang chạy tại thời điểm mẫu đó — dùng để chứng minh Stress thực sự đã lên tới bậc 200 VU.

Tăng heap cho JMeter (mặc định 1 GB, lượt Stress 200 VU sẽ chật). Sửa `C:\jmeter\apache-jmeter-5.6.3\bin\jmeter.bat`, tìm dòng `set HEAP=` và đổi thành:

```
set HEAP=-Xms1g -Xmx4g -XX:MaxMetaspaceSize=512m
```

> Ghi lại 3 thay đổi này vào `ai-audit/design-log.md` — chúng ảnh hưởng tới số liệu, nên phải nằm trong tài liệu chứ không nằm trong đầu bạn.

---

## 2. Chạy SUT

SUT đã có sẵn ở `D:\Nam3\HK3\Kiểm thử phần mềm\HW02-new\eshop-sut-main`. **Đừng copy sang thư mục HW05** — nó không phải bài làm của bạn, và §14 chỉ đòi nộp test plan + kết quả.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW02-new/eshop-sut-main/backend" && node database.js && node server.js
```

- `node database.js` = **reset + seed lại DB**. Chạy nó **trước mỗi buổi đo**, và ghi giờ vào `results/run-log.md`.
- `node server.js` giữ terminal đó chạy suốt buổi → backend ở `http://localhost:3000`.

Tài khoản seed: `admin@eshop.com / Admin123!` · `test@eshop.com / Test1234!`
Coupon seed: `SAVE10` (percent, min 300k) · **`BIGBUY` (fixed 50.000đ, min 500k)** ← workflow dùng cái này · `VIP100` · `EXPIRED`.

Bài này **chỉ đo backend API `:3000`**. Frontend web/admin không cần chạy để đo, nhưng nên mở khi quay video cho người xem dễ hiểu đang test cái gì.

### Smoke test bằng tay trước khi làm gì tiếp

```bash
curl -s http://localhost:3000/api/products | head -c 300
```

Ra JSON mảng 5 sản phẩm = backend sống.

---

## 3. Khởi tạo repo bài làm

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && git init && git add -A && git commit -m "chore: khởi tạo skeleton HW05 + docs"
```

Tạo repo **public** trên GitHub tên `HW05-Performance-Testing` (§14 đòi link repo công khai) rồi:

```bash
git remote add origin https://github.com/DuyPham111/HW05.git && git branch -M main && git push -u origin main
```

Thêm `.gitignore` (raw `.jtl` **phải commit**, chỉ loại rác):

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && printf 'node_modules/\n*.log.gz\n.DS_Store\nThumbs.db\n*.tmp\n' > .gitignore
```

> **Cẩn thận:** đừng thêm `*.jtl` hay `results/` vào `.gitignore`. §11 đòi raw `.jtl` nộp **đầy đủ**, và §14 đòi repo public chứa test plan + data file. File `.jtl` lượt Stress có thể vài chục MB — vẫn dưới giới hạn 100 MB/file của GitHub, cứ commit bình thường.

---

## 4. `package.json` — các lệnh sẽ dùng suốt bài

Tạo file `package.json` ở gốc `HW05-Performance-Testing/`:

```json
{
  "name": "hw05-performance-testing",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "HW05 - Performance Testing on EShop - 23127183 Pham Vu Ngoc Duy",
  "scripts": {
    "preflight": "node tools/preflight.mjs",
    "seed:perf": "node tools/seed-perf-data.mjs",
    "plans": "python tools/gen-test-plans.py",
    "summary": "node tools/summarize-jtl.mjs",
    "drift": "node tools/soak-drift.mjs",
    "reset:lockout": "node tools/reset-lockout.mjs",
    "hardware": "powershell -ExecutionPolicy Bypass -File tools/hardware-report.ps1"
  }
}
```

Không có dependency ngoài — mọi script dùng `fetch` và `fs` có sẵn của Node 22.

---

## 5. `tools/preflight.mjs` — kiểm môi trường trước mỗi buổi

**Prompt cho AI** (bước 1 của §2 — ghi log vào `ai-audit/ai-audit-report.md` ngay sau khi chạy):

> Viết cho tôi `tools/preflight.mjs` (Node 22, ESM, không dependency ngoài). Nó phải kiểm và in `[OK]`/`[FAIL]` cho từng mục:
> 1. `jmeter --version` chạy được (spawn, đọc stdout, tìm chuỗi `5.6`), và `java -version` là 17 trở lên.
> 2. Backend sống: `GET http://localhost:3000/api/products` trả 200 và mảng ≥ 5 phần tử.
> 3. Sáu endpoint của workflow đều phản hồi đúng như mong đợi: `POST /api/login` (đúng mật khẩu → 200 có `token`), `GET /api/products?search=iPhone` (200, mảng), `GET /api/products/1` (200, có field `id`), `POST /api/cart` (có Bearer token → 200), `POST /api/apply-coupon` với `{code:"BIGBUY", total_amount:600000, user_id:2}` (200, `success:true`, `discount_amount` = 50000), `POST /api/checkout` (200, có `orderId`).
> 4. Năm file trong `data/` tồn tại và có ≥ 1 dòng dữ liệu ngoài header (đây là kết quả của `docs/03-DATA-DRIVEN-CSV.md` — nếu chưa làm buổi đó thì mục này `[FAIL]` là bình thường, chưa cần lo).
> 5. In ra số dòng bảng `products` (gọi `GET /api/products` rồi đếm) — số này phải được ghi vào `results/run-log.md` mỗi lượt vì nó ảnh hưởng chi phí của bước search.
> Kết thúc: exit code 1 nếu có bất kỳ `[FAIL]` nào.
> Đừng dùng thư viện ngoài, đừng dùng `axios`.

**Review của bạn sau khi AI sinh xong** (đây là phần ghi vào Human Review Notes):

- [ ] Mục 3 có kiểm **giá trị** `discount_amount === 50000` không, hay chỉ kiểm status 200? (Kiểm status không đủ — `apply-coupon` trả 200 kể cả khi tính sai.)
- [ ] `GET /api/products/1` có kiểm **field `id` tồn tại** không? (id không tồn tại vẫn trả **200 + `{}`** — xem [00](00-ROADMAP.md) §5.3.)
- [ ] Script có tự tạo đơn hàng rác không? Bước 6 gọi `/api/checkout` thật sẽ ghi 1 dòng vào `orders`. Chấp nhận được, nhưng phải **ghi chú** trong script rằng preflight có tác dụng phụ này.

Chạy:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run preflight
```

**Commit:** `chore: preflight kiem moi truong + 6 endpoint cua workflow`

---

## 6. Xong buổi setup khi

- [ ] `jmeter --version` in ra 5.6.3
- [ ] `jmeter.properties` đã bật `latency` + `thread_counts`, heap = 4g
- [ ] backend `:3000` chạy, DB vừa seed
- [ ] repo git đã init + push, repo GitHub ở trạng thái **public**
- [ ] `npm run preflight` toàn `[OK]`
- [ ] đã ghi **2 block đầu tiên** vào `ai-audit/ai-audit-report.md` (LOG-001: dựng cấu trúc; LOG-002: sinh preflight)

→ Tiếp: [02-PHAM-VI-WORKFLOW.md](02-PHAM-VI-WORKFLOW.md)
