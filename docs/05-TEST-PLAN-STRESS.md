# 05 — Task 1: Stress test plan (20đ)

> Load hỏi *"hệ thống chạy thế nào ở tải kỳ vọng?"*. Stress hỏi **"nó gãy ở đâu?"** — và câu trả lời phải là **một điểm cụ thể**, không phải "chịu tải tốt".
> Output: `test-plans/23127183_Stress_20260820.jmx` + lượt chạy + mục §2.2 báo cáo.

---

## 1. Khác biệt duy nhất so với Load: **tăng tải theo bậc**

Cùng workflow 7 bước, cùng CSV, cùng assertion. Chỉ đổi cách sinh tải:

| | Load | **Stress** |
|---|---|---|
| Mục tiêu | p95 ở trạng thái ổn định | **tìm bậc mà hệ thống bắt đầu gãy** |
| VU | 20 cố định | **25 → 50 → 100 → 200 theo bậc** |
| Mỗi bậc | — | 60 giây |
| Think-time | 1–3s | **0,3–1s** (ép tải cao hơn với cùng số VU) |
| Tổng thời lượng | 360s | ~480s (4 bậc × 60s + ramp + đuôi) |
| Listener | Summary Report | **Aggregate Report** (cần cột percentile) |

### Vì sao phải là **bậc**, không phải ramp tuyến tính lên 200

Ramp tuyến tính 0→200 trong 8 phút thì mỗi thời điểm là một mức tải khác nhau → bạn có một đường cong mượt và **không chỉ được** ra bậc nào là điểm gãy. Với 4 bậc, mỗi bậc 60 giây ổn định, bạn có **4 con số p95 rời rạc** so sánh được với nhau:

```
p95 theo bậc:  25 VU → ?ms   50 VU → ?ms   100 VU → ?ms   200 VU → ?ms
```

Nếu p95 tăng gần tuyến tính theo VU thì hệ thống còn dư địa. Nếu tới một bậc mà p95 **nhảy vọt** (2–5 lần) hoặc p99/max bung ra trong khi p50 gần như đứng yên → **đuôi phân phối đang dãn** = điểm gãy. Đó chính là kết luận mà §6 muốn.

### Cách dựng bậc trong JMeter (không cần plugin)

Trong `tools/gen-test-plans.py`, scenario `Stress` sinh **4 `ThreadGroup` song song trong cùng Test Plan**, mỗi cái có:

| Bậc | num_threads | ramp_time | **delay khởi động** | duration |
|---|---|---|---|---|
| 1 | 25 | 10s | 0s | 420s |
| 2 | 25 (cộng dồn → 50) | 10s | 60s | 360s |
| 3 | 50 (cộng dồn → 100) | 15s | 120s | 300s |
| 4 | 100 (cộng dồn → 200) | 20s | 180s | 240s |

Dùng `Scheduler` với `delay` + `duration` trên từng ThreadGroup. **Cộng dồn** chứ không thay thế — tại giây thứ 200 có đủ 25+25+50+100 = 200 VU đang chạy.

> **Đừng dùng "Ultimate Thread Group"** của plugin JMeter Plugins — nó đòi cài `jpgc-casutg`, và nếu TA mở `.jmx` trên máy không có plugin thì file **không mở được**. Bốn ThreadGroup chuẩn thì mở được ở mọi bản JMeter.

**Prompt bổ sung cho AI** (nối tiếp lượt hỏi ở [04](04-TEST-PLAN-LOAD.md), **không** hỏi lại từ đầu):

> Bây giờ thêm scenario `Stress` vào `SCENARIOS` trong `tools/gen-test-plans.py`, dùng **cùng** hằng `WORKFLOW` đã có. Sinh **4 `ThreadGroup` chuẩn của JMeter** (không dùng plugin) với các tham số [dán bảng trên]. Mỗi ThreadGroup bật `Scheduler` với `delay` và `duration` riêng, `LoopController` vô hạn. `UniformRandomTimer` cho scenario này là delay 300ms range 700ms. Listener là **Aggregate Report** (`ResultCollector` với `guiclass="StatVisualizer"`). Tên file `23127183_Stress_{date}.jmx`. Đừng đụng vào các scenario khác.

---

## 2. Ba thứ phải chuẩn bị trước khi bấm chạy Stress

### 2.1 Reset lockout — bắt buộc, và §6 đòi **ghi lại thủ tục**

> *"When Stress/Spike runs trigger the 3-fail login lockout, reset it between runs and document the steps."*

Sau lượt Load, 200 tài khoản mồi trong `users_lockout.csv` đã bị khóa 180 giây. Nếu chạy Stress ngay, bước 7 trả **403** thay vì 401 ngay từ đầu — không sai (assertion nhận cả hai), nhưng **thay đổi ý nghĩa số liệu**: 403 trả về sớm hơn 401 vì nó thoát ở `server.js:40` trước khi so mật khẩu. Không ghi lại thì đến Task 2 bạn không giải thích nổi vì sao p95 bước 7 lượt này thấp hơn lượt trước.

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run reset:lockout && npm run reset:lockout -- --check
```

Chi tiết script: [07-CHAY-VA-THU-BANG-CHUNG.md](07-CHAY-VA-THU-BANG-CHUNG.md) §3.

### 2.2 Cooldown 90 giây sau lượt trước

Chạy Stress ngay sau Load là đo một server **chưa hồi phục**: page cache SQLite còn nóng, GC của Node chưa chạy, `userCarts` còn đầy. Đợi 90 giây, và **ghi mốc giờ** vào `results/run-log.md`.

> Đây đúng là loại lỗi đọc số liệu mà Task 2 yêu cầu chỉ ra — nếu bạn tự mắc thì mất cả hai đầu điểm.

### 2.3 Heap của JMeter

200 VU × 7 sampler = load generator phải giữ nhiều state. Nếu chưa sửa `set HEAP=-Xmx4g` ở [01](01-SETUP.md) §1b thì làm ngay, không thì JMeter `OutOfMemoryError` giữa lượt và mất cả lượt đo.

---

## 3. Chạy

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && node tools/run-scenario.mjs Stress
```

(Script này dựng ở [07](07-CHAY-VA-THU-BANG-CHUNG.md) §2 — nó tự reset lockout, chạy, ghi `.jtl` + dashboard + run-log, và lấy mẫu CPU/RAM song song.)

**Trong lúc chạy — việc của bạn:**
1. Task Manager mở sẵn cạnh cửa sổ terminal, tab **Details**, sắp xếp theo CPU, thấy rõ dòng `node.exe` và `java.exe`.
2. **Chụp màn hình đúng lúc đang ở bậc 200 VU** — tức khoảng **giây thứ 200–230** kể từ lúc bắt đầu. Đây là ảnh có giá trị nhất của cả bài: nó bắt được `node.exe` ở mức CPU cao nhất.
3. Lưu `resource-monitor/screenshots/taskmgr-stress.png`.

---

## 4. Đọc kết quả — và **đừng** kết luận "chịu tải tốt"

Sau khi chạy:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run summary
```

`results/summary.md` phải có **p95 tách theo từng bậc VU** (dùng cột `allThreads` của `.jtl` để chia cửa sổ). Bảng cần điền vào báo cáo §2.2:

```markdown
| Bậc | VU | Sample | RPS | Error% | p50 | p90 | **p95** | p99 | max | CPU node đỉnh |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 25 | | | | | | | | | |
| 2 | 50 | | | | | | | | | |
| 3 | 100 | | | | | | | | | |
| 4 | 200 | | | | | | | | | |
```

### Bốn dấu hiệu điểm gãy — phải kiểm cả bốn, không chỉ p95

| Dấu hiệu | Đọc ở đâu | Vì sao quan trọng |
|---|---|---|
| **p99 và max bung ra trong khi p50 đứng yên** | `summary.md` | Đuôi dãn = một phần request bị xếp hàng. p95 có thể vẫn đẹp mà hệ thống đã bắt đầu gãy |
| **CPU của `node.exe` sát trần một lõi (~100% của 1 core)** | `results/resources/*.csv` | Node là single-threaded cho JS. Chạm 100% một lõi = bão hòa, dù máy còn 7 lõi rảnh |
| **Error rate > 0 ở bước 6 (checkout)** | `summary.md` phân rã theo sampler | `SQLITE_BUSY` khi ghi tranh chấp |
| **CPU của `java.exe` (JMeter) > CPU của `node.exe`** | `results/resources/*.csv` | ⚠️ **Load generator tự nó là điểm nghẽn** → số đo bị trần bởi JMeter, không phải bởi SUT. **Bắt buộc ghi vào báo cáo mục "Giới hạn"** nếu xảy ra |

**Câu kết luận đúng** trông như thế này (điền số thật của bạn):

> Ở 200 VU, hệ thống đạt **{X} RPS** với p95 **{Y} ms** và error rate **{Z}%**. Tuy nhiên **không** kết luận "chịu tải tốt": CPU của `node.exe` đi từ **{a}%** ở bậc 25 VU lên **{b}%** ở bậc 200 VU, p99 từ **{c} ms** lên **{d} ms** và max đạt **{e} ms** — tức đuôi phân phối đang dãn và tiến trình đã sát trần một lõi. Đây **chưa phải** ngưỡng cực đại vì tôi dừng ở 200 VU (giới hạn bởi số tài khoản trong CSV) chứ không tăng tiếp tới khi error rate bật lên.

Câu cuối — thừa nhận **chưa** tìm được điểm gãy tuyệt đối — là điểm cộng chứ không phải trừ. Bịa ra một "điểm gãy" không đo được mới là chỗ bị trừ.

---

## 5. Checklist Stress

- [ ] Đã reset lockout **trước** lượt và ghi vào `run-log.md`
- [ ] Cooldown ≥ 90s sau lượt Load
- [ ] Listener trong `.jmx` là **Aggregate Report** (khác Load và Spike)
- [ ] `.jtl` đầy đủ trong `results/jtl/23127183_Stress_*.jtl` + `jmeter.log` kèm theo
- [ ] HTML dashboard ở `results/html/stress/`
- [ ] Ảnh Task Manager chụp **đúng lúc bậc 200 VU**, có cả JMeter và `node.exe` trong **cùng khung**
- [ ] `results/resources/23127183_Stress_*.csv` có mẫu CPU/RAM của cả `node` và `java`
- [ ] Bảng 4 bậc điền đủ số từ `summary.md`, **không gõ tay từ dashboard**
- [ ] Nếu `java.exe` ăn CPU nhiều hơn `node.exe` → đã ghi vào mục "Giới hạn" của báo cáo

**Commit:** `test(stress): 4 bac 25-50-100-200 VU + raw jtl + dashboard`

---

→ Tiếp: [06-TEST-PLAN-SPIKE.md](06-TEST-PLAN-SPIKE.md)
