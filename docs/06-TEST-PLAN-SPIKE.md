# 06 — Task 1: Spike test plan (20đ)

> Spike hỏi câu khác hẳn Load và Stress: **"dội một cú sốc rồi rút, hệ thống có trở lại bình thường không, và mất bao lâu?"**
> Cái được chấm ở đây là **đo được sự hồi phục**, không phải chỉ tạo được cú sốc.
> Output: `test-plans/23127183_Spike_20260820.jmx` + lượt chạy + mục §2.3 và §3.4 báo cáo.

---

## 1. Hình dạng tải

```
VU
200 |            ┌────┐
    |            │    │
    |            │    │
 10 |────────────┘    └──────────────────
    └────────────────────────────────────► t
     0s        60s   65s  95s          240s
     [ nền ]   [ dội 5s ][giữ 30s][ hồi phục 145s ]
```

| Thành phần | Cấu hình |
|---|---|
| **ThreadGroup nền** | 10 VU, ramp 10s, scheduler **duration 240s**, delay 0 |
| **ThreadGroup xung** | 200 VU, ramp **5 giây**, scheduler **duration 30s**, **delay 60s** |
| Think-time | 0–500ms (`UniformRandomTimer` delay 0, range 500) |
| Listener | **View Results Tree** |
| Tổng | ~240s (4 phút) |

### Vì sao **60 giây nền trước** và **145 giây nền sau**

- **Trước:** cần một đường cơ sở (baseline) đo trên **cùng lượt chạy**. So cú sốc với p95 của lượt Load hôm trước là so hai điều kiện khác nhau — vô nghĩa.
- **Sau:** đây mới là phần được chấm. §6 nói *"measure recovery"*. Nếu tắt ngay sau cú sốc thì bạn không có dữ liệu để nói hệ thống có hồi phục hay không.

### Vì sao ramp **5 giây** chứ không phải 0

Ramp = 0 nghĩa là JMeter cố khởi tạo 200 thread trong cùng một tick. Trên máy 8 lõi chạy cả SUT lẫn JMeter, chi phí **khởi tạo thread của JMeter** sẽ lấn át tín hiệu — bạn đo cú sốc của load generator, không phải của SUT. 5 giây vẫn là cú sốc thật (40 VU/giây) nhưng load generator theo kịp.

**Prompt bổ sung cho AI:**

> Thêm scenario `Spike` vào `SCENARIOS` trong `tools/gen-test-plans.py`, dùng **cùng** hằng `WORKFLOW`. Sinh **2 `ThreadGroup`**: (a) "Baseline" 10 threads, ramp 10s, scheduler duration 240s delay 0; (b) "Spike burst" 200 threads, ramp **5s**, scheduler duration 30s **delay 60s**. `UniformRandomTimer` delay 0 range 500. Listener **View Results Tree** (`ResultCollector` guiclass `ViewResultsFullVisualizer`) — **chỉ** scenario này mới có listener đó. Tên file `23127183_Spike_{date}.jmx`. Đừng đụng vào scenario khác.

---

## 2. Chạy

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run reset:lockout && node tools/run-scenario.mjs Spike
```

**Cooldown 90 giây sau lượt Stress trước khi chạy Spike.** Bỏ qua bước này thì "cú sốc" của bạn dội lên một server còn đang thở dốc từ 200 VU — và mọi kết luận hồi phục đều sai.

**Ảnh:** chụp lúc **giây thứ 62–90** (đang trong cú sốc). Lưu `resource-monitor/screenshots/taskmgr-spike.png`.

> Mốc này khó canh hơn Stress vì cửa sổ chỉ 30 giây. Cách chắc ăn: **quay màn hình cả lượt** (Win+Alt+R hoặc OBS) rồi cắt frame sau. Video này dùng luôn được cho [12-VIDEO-DEMO.md](12-VIDEO-DEMO.md).

---

## 3. Phân tích hồi phục — đây mới là phần ăn điểm

Chia lượt thành **4 cửa sổ thời gian** và tính p95 riêng cho từng cửa sổ:

| Cửa sổ | Khoảng | Ý nghĩa |
|---|---|---|
| **W1 — nền trước** | 10s → 60s | baseline |
| **W2 — trong sốc** | 60s → 95s | đỉnh |
| **W3 — ngay sau sốc** | 95s → 125s | có tồn đọng hàng đợi không |
| **W4 — nền sau** | 125s → 240s | đã về baseline chưa |

`tools/summarize-jtl.mjs` phải hỗ trợ tham số `--windows` để cắt theo mốc này. Prompt bổ sung:

> Thêm cho `tools/summarize-jtl.mjs` tuỳ chọn `--windows "10-60,60-95,95-125,125-240"` (giây, tính từ `timeStamp` nhỏ nhất trong file). Với mỗi cửa sổ, in: số sample, RPS, error%, p50, p90, p95, p99, max, và **số thread lớn nhất** (cột `allThreads`). Output dạng bảng Markdown ghi vào `results/summary.md`.

### Bảng phải điền vào báo cáo §3.4

```markdown
| Cửa sổ | Khoảng | Peak VU | Sample | RPS | Error% | p50 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|---|
| W1 nền trước | 10–60s | 10 | | | | | | | |
| W2 trong sốc | 60–95s | ~210 | | | | | | | |
| W3 ngay sau | 95–125s | 10 | | | | | | | |
| W4 nền sau | 125–240s | 10 | | | | | | | |
```

### Cách đọc đúng

| Quan sát | Kết luận đúng |
|---|---|
| p95(W2) cao hơn W1 nhiều lần, nhưng **W3 ≈ W1** | Hồi phục **tức thì** — không có hàng đợi tồn đọng. Hệ thống đẩy lùi tải bằng độ trễ chứ không tích lũy |
| p95(W3) vẫn cao rồi mới về ở W4 | Có **tồn đọng**; đo thời gian hồi phục = mốc mà p95 quay về trong 20% của W1 |
| p95(W2) ≈ p95(W1) | Cú sốc **chưa đủ mạnh** để tạo tín hiệu — hoặc load generator không kịp sinh tải. Kiểm cột `allThreads` trong `.jtl`: nếu max < 200 thì JMeter không dựng đủ thread → phải nói ra, không được lờ đi |
| Error rate W2 > 0 | Phân loại kỹ: **403** (lockout, hành vi đúng) vs **500/timeout** (thật sự gãy). Đây là chỗ **View Results Tree** phát huy tác dụng — mở nó ra đọc nội dung response |

> **Bẫy diễn giải lớn nhất:** *"p95 lúc sốc chỉ 7ms nên hệ thống hoàn hảo"*. Không. Với think-time 0–500ms và 200 VU, nếu RPS ở W2 **không** tăng tương ứng thì có thể chính JMeter đang là nút cổ chai. Kiểm chéo bằng: RPS(W2) / RPS(W1) so với VU(W2) / VU(W1). Nếu VU tăng 20 lần mà RPS chỉ tăng 3 lần và p95 gần như không đổi → tải không tới được server. **Ghi phát hiện này ra**; nó có giá trị hơn một con số đẹp.

---

## 4. Dùng View Results Tree đúng cách

Đây là listener **duy nhất** cho bạn xem *nội dung*. Việc phải làm sau lượt Spike:

1. Mở GUI: `jmeter -t test-plans/23127183_Spike_20260820.jmx`
2. Chạy lại **một lượt ngắn** (30 giây) trong GUI → View Results Tree có dữ liệu
3. Bấm vào một sample **đỏ** (nếu có) → tab **Response data** → chụp màn hình
4. Bấm vào sample `07 Login sai` → cho thấy body `{"error":"Invalid email or password"}` với status 401 → **chụp** → đây là bằng chứng "401 là hành vi đúng, không phải lỗi hệ thống"
5. Lưu vào `resource-monitor/screenshots/vrt-spike-401.png`, nhúng vào báo cáo §2.5

Ảnh này trả lời trực tiếp một câu mà TA sẽ hỏi khi oral defense: *"em phân biệt lỗi thật với lỗi thiết kế bằng cách nào?"*

---

## 5. Checklist Spike

- [ ] Cooldown ≥ 90s sau Stress, đã ghi mốc giờ
- [ ] Reset lockout trước lượt
- [ ] Listener trong `.jmx` là **View Results Tree** (khác Load và Stress) — đủ 3 loại khác nhau, §6 kiểm
- [ ] Cột `allThreads` trong `.jtl` có giá trị chạm ~210 → chứng minh cú sốc thật sự xảy ra
- [ ] Bảng 4 cửa sổ điền đủ, sinh từ `npm run summary -- --windows ...`
- [ ] Ảnh Task Manager chụp **trong cửa sổ sốc**
- [ ] Ảnh View Results Tree cho thấy response 401 của bước 7
- [ ] Đã kiểm chéo RPS/VU để loại khả năng load generator là nút cổ chai

**Commit:** `test(spike): 10 VU nen + 200 VU trong 5s + phan tich hoi phuc 4 cua so`

---

→ Tiếp: [07-CHAY-VA-THU-BANG-CHUNG.md](07-CHAY-VA-THU-BANG-CHUNG.md)
