# 12 — Video demo (≥ 6 phút, unlisted, tiếng Việt)

> §6: *"An unlisted YouTube video of **at least 6 minutes** total (you may split it into one clip per scenario), showing **the tool and the resource monitor in the same frame**, with **your own Vietnamese narration**."*
> §11 liệt kê video vào danh sách **không được AI sinh / không được dựng**: *"The demo video, which must show the tool and the resource monitor in the same frame with your own voice narration."*
> Và §7 đòi thêm: video demo **Agent Skill** end-to-end. Gộp vào cùng video này được — tiết kiệm thời gian.

---

## 1. Ba ràng buộc cứng — sai một cái là mất điểm cả video

| Ràng buộc | Cách thỏa | Cách tự kiểm |
|---|---|---|
| **≥ 6 phút** | quay đủ, đừng cắt quá tay | xem thời lượng trên YouTube sau khi upload |
| **Tool + resource monitor CÙNG KHUNG** | JMeter/terminal nửa trái, Task Manager nửa phải, quay **toàn màn hình** | tua ngẫu nhiên 5 mốc, mốc nào cũng phải thấy cả hai |
| **Giọng nói của chính bạn, tiếng Việt** | nói trực tiếp lúc quay | không dùng TTS, không dùng nhạc nền thay lời |

Thêm hai thứ nên có (không bắt buộc nhưng chống nghi ngờ rất tốt):
- Mở đầu quay **`hostname`** trong terminal → phải ra `Pham_Vu_Ngoc_Duy`, khớp `hardware-report.md` (§11 đối chiếu hostname).
- Quay **đồng hồ Windows** ở góc — mốc thời gian khớp `results/run-log.md`.

---

## 2. Chuẩn bị

### Phần mềm quay
- **Xbox Game Bar** (`Win + Alt + R`) — có sẵn, nhưng **không quay được desktop/File Explorer**, chỉ quay được cửa sổ ứng dụng đang focus → **không dùng cho bài này** vì bạn cần cả hai cửa sổ.
- **OBS Studio** (khuyến nghị) — Display Capture, thu cả màn hình + micro. Miễn phí.

Cấu hình OBS tối thiểu: Sources → **Display Capture** (màn hình chính) + **Audio Input Capture** (micro). Output → 1920×1080, 30fps, MP4.

### Bố trí màn hình (giống lúc chụp ảnh, [07](07-CHAY-VA-THU-BANG-CHUNG.md) §4.1)

```
┌──────────────────────────────┬─────────────────────────────┐
│ Terminal chạy JMeter          │ Task Manager → Details      │
│ (dòng summariser đang chạy)   │ node.exe · java.exe · CPU   │
└──────────────────────────────┴─────────────────────────────┘
                              đồng hồ Windows góc phải
```

### Kiểm trước khi quay
- [ ] Micro có tiếng (thu thử 10 giây, nghe lại)
- [ ] Backend đang chạy, DB đã seed
- [ ] `npm run reset:lockout` xong
- [ ] Tắt thông báo (`Win + N` → Focus assist / Do not disturb)
- [ ] Đóng tab/cửa sổ riêng tư

---

## 3. Kịch bản — 11–13 phút, quay một mạch

Viết ra `demo/kich-ban-video.md` rồi bám theo. **Không cần thuộc lòng** — cứ nhìn kịch bản mà nói, nhưng nói bằng lời của mình, đừng đọc từng chữ.

| # | Thời lượng | Nội dung | Nói gì |
|---|---|---|---|
| 1 | 0:00–0:45 | **Giới thiệu + danh tính** | "Em là Phạm Vũ Ngọc Duy, MSSV 23127183, HW05 Performance Testing trên SUT EShop." Gõ `hostname` → chỉ vào `Pham_Vu_Ngoc_Duy`. Gõ `jmeter --version`. |
| 2 | 0:45–2:00 | **Phạm vi §5** | Mở `docs/endpoint-selection.md`, chỉ bảng 7 bước. Nói rõ bước nào thuộc nhóm nào: "bước 1 và 7 là auth-heavy, 2 và 3 read-heavy, 4-5-6 transactional." Nói vì sao bước 7 tồn tại: phủ account-lockout mà đề đòi. |
| 3 | 2:00–3:00 | **Test plan trong JMeter GUI** | Mở `23127183_Load_20260820.jmx` bằng GUI. Bung cây: 7 sampler, 5 CSV Data Set (chỉ vào **Sharing mode = All threads**), JSON Extractor lấy token, và **Response Assertion của bước 7 nhận 401\|403**. Giải thích: "nếu không có assertion này, JMeter tính 401 là lỗi và error rate giả 14%." |
| 4 | 3:00–5:30 | **CHẠY LOAD THẬT** ⭐ | Chạy `node tools/run-scenario.mjs Load`. Để chạy **ít nhất 2 phút liên tục trong khung hình**, vừa chạy vừa thuyết minh: chỉ vào dòng summariser đang tăng, chỉ sang Task Manager: "`node.exe` đang ở {x}% CPU, `java.exe` là JMeter ở {y}%". Đây là đoạn **quan trọng nhất** của cả video — đừng tua nhanh. |
| 5 | 5:30–7:00 | **Ba listener khác loại** | Mở lần lượt 3 file `.jmx`, chỉ vào listener của từng cái: Summary Report / Aggregate Report / View Results Tree. Với Spike, mở View Results Tree ra, bấm vào sample `07 Login sai`, chỉ vào response 401 → "đây là bằng chứng 401 là hành vi thiết kế, không phải lỗi." |
| 6 | 7:00–8:30 | **Kết quả + endurance threshold** | `npm run summary` → mở `results/summary.md`, đọc p95 từng scenario. Mở `endurance/endurance-threshold.md`, đọc **con số ngưỡng**: max stable RPS, p95, RSS trần, độ trôi. |
| 7 | 8:30–10:00 | **Task 2 — chỗ AI đọc sai** ⭐ | Mở `ai-audit/task2-ai-output-verbatim.md`, chỉ vào **một** nhận định sai của AI. Rồi mở terminal chạy lệnh `awk` tính lại con số đúng từ raw `.jtl` **ngay trên video**. "AI nói error rate 14% là hệ thống từ chối request; em kiểm raw log thì 100% số đó là 401/403 của bước 7 — nhánh lockout cố ý." |
| 8 | 10:00–11:30 | **Agent Skill end-to-end (§7)** | Gọi skill `/perf-test-plan` hoặc `/jtl-analysis` **thật** trong Claude Code, cho nó chạy trên một endpoint, xem output. Đây là phần §7 đòi *"shows, end to end, how you used the skill on a complete endpoint group"*. |
| 9 | 11:30–12:30 | **Task 3 + kết** | Mở flow chart, giải thích 3 nhánh (watch commits → decide → flag p95). Mở `ci/ci-runs.md` chỉ vào lượt **FAIL** thật: "cổng chặn hoạt động thật, đây là lượt đỏ." Kết: tóm tắt 1 phát hiện tâm đắc nhất. |

> **Nếu quay một mạch quá khó:** §6 cho phép **chia thành nhiều clip, mỗi scenario một clip**. Nhưng tổng vẫn phải ≥ 6 phút và **mỗi** clip phải có tool + monitor cùng khung. Chia nhỏ thì phải nộp **nhiều link**, và ghi tổng thời lượng vào README.

---

## 4. Đoạn 4 (chạy thật) — đừng làm hỏng

Đây là đoạn TA xem kỹ nhất. Ba lỗi hay gặp:

| Lỗi | Hậu quả | Tránh bằng |
|---|---|---|
| Tua nhanh / cắt đoạn đang chạy | mất bằng chứng "đã chạy thật" | để chạy liên tục ≥ 2 phút, không cắt |
| Chỉ quay cửa sổ JMeter | thiếu "cùng khung với resource monitor" → **vi phạm §11** | quay **toàn màn hình** (Display Capture), không phải Window Capture |
| Im lặng suốt đoạn chạy | không có thuyết minh = không thỏa "your own narration" | vừa chạy vừa đọc số trên Task Manager |

---

## 5. Upload và điền link

1. YouTube → Upload → **Visibility: Unlisted** (không phải Private — Private thì TA không xem được!).
2. Tiêu đề: `HW05 Performance Testing - EShop - 23127183 Pham Vu Ngoc Duy`.
3. Mô tả: dán link repo + timestamp từng phần (giúp TA nhảy tới đoạn cần xem — điểm cộng về trình bày):
   ```
   00:00 Giới thiệu & hostname
   00:45 Phạm vi §5 - 3 endpoint group
   02:00 Test plan trong JMeter GUI
   03:00 Chạy Load test thật + Task Manager
   05:30 Ba listener khác loại
   07:00 Kết quả + endurance threshold
   08:30 Task 2 - bắt lỗi AI đọc sai metric
   10:00 Agent Skill end-to-end
   11:30 Task 3 - CI pipeline
   ```
4. **Tự kiểm bằng cửa sổ ẩn danh** (Ctrl+Shift+N, dán link) → phải xem được mà không cần đăng nhập. Nếu báo "Video unavailable" thì bạn để Private, sửa lại.
5. Dán link vào: `README.md` mục Demo video · `report/main-report.md` §2.5 · `demo/README.md`.

**Commit:** `docs: link video demo (unlisted, {mm:ss}, tieng Viet)`

---

## 6. Checklist video

- [ ] Thời lượng ≥ 6:00 (ghi số thật vào README, vd "11:42")
- [ ] Unlisted — **kiểm bằng cửa sổ ẩn danh**
- [ ] Tua ngẫu nhiên 5 mốc: mốc nào cũng thấy **cả** tool **và** Task Manager
- [ ] Có giọng tiếng Việt của bạn suốt video, không phải TTS
- [ ] Có `hostname` = `Pham_Vu_Ngoc_Duy` trong khung hình
- [ ] Có đoạn chạy test **liên tục ≥ 2 phút** không cắt
- [ ] Có đoạn Agent Skill end-to-end (§7)
- [ ] Link đã dán vào README + main-report + demo/README.md

---

→ Tiếp: [13-AGENT-SKILLS.md](13-AGENT-SKILLS.md)
