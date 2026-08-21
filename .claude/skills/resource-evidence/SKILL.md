---
name: resource-evidence
description: >-
  Thu bằng chứng tài nguyên và phần cứng cho một lượt performance test trên Windows: lấy
  mẫu CPU/RSS của tiến trình SUT và load generator, chụp ảnh tool + Task Manager cùng khung
  đúng mốc thời gian, sinh hardware report có hostname, và ghi run-log để mọi bằng chứng
  khớp nhau. Dùng trước và trong khi chạy mỗi lượt đo.
---

# Resource Evidence — thu bằng chứng đúng chuẩn

> **KHUNG CHỜ HOÀN THIỆN.** Hướng dẫn: `docs/07-CHAY-VA-THU-BANG-CHUNG.md`.

## Nguyên tắc: ba thứ phải khớp mốc thời gian

```
run-log.md (giờ bắt đầu/kết thúc)  ↔  .jtl (timeStamp đầu/cuối)  ↔  ảnh (đồng hồ trong ảnh + mtime file)
```

→ Chụp ảnh **trong lúc lượt đang chạy**. Chụp trước hoặc dựng lại sau là bằng chứng không hợp lệ.

## Bố trí màn hình

```
┌──────────────────────────────┬─────────────────────────────┐
│ Terminal đang chạy JMeter     │ Task Manager → tab Details  │
│ (dòng summariser đang tăng)   │ sắp xếp theo CPU giảm dần   │
└──────────────────────────────┴─────────────────────────────┘
                    đồng hồ Windows góc phải phải nhìn được
```

`Win + →` / `Win + ←` để chia đôi. Task Manager → Details → chuột phải header → Select columns → bật `CPU`, `Memory (private working set)`, `Threads`, `PID`.

Chụp bằng `Win + Shift + S` → **Fullscreen** (không dùng vùng chọn — cần thấy taskbar).

## Bốn thứ phải nhìn thấy trong ảnh

- [ ] cửa sổ tool đang chạy, có số sample đang tăng
- [ ] tiến trình **SUT** (`node.exe`), đọc được CPU và Memory
- [ ] tiến trình **load generator** (`java.exe`)
- [ ] **đồng hồ Windows**

## Mốc chụp theo scenario

| Scenario | Giây thứ | Vì sao |
|---|---|---|
| Load | ~180 | giữa vùng ổn định, sau ramp |
| Stress | ~200–230 | đúng bậc VU cao nhất |
| Spike | ~62–90 | trong cửa sổ sốc (ngắn — nên quay màn hình rồi cắt frame) |
| Soak | ~400 | giữa lượt, để so RSS đầu/giữa/cuối |

## Lấy mẫu CPU/RSS trên Windows

Dùng hiệu của `(Get-Process).CPU` (tổng giây CPU) giữa hai lần lấy mẫu, chia cho số giây trôi qua, nhân 100 → **% của một lõi**.

**Không** dùng `Get-Counter '\Process(name)\% Processor Time'`: tên instance đổi khi có nhiều tiến trình cùng tên (`node#1`, `node#2`) và sẽ ghi nhầm tiến trình.

Ghi **một dòng cho mỗi PID**, không cộng gộp. Cột: `timestamp_iso, epoch_ms, process, pid, cpu_percent_of_one_core, working_set_mb, private_mb, threads, handles`.

Diễn giải: `cpu_percent_of_one_core = 100` là bão hòa **một lõi** — với Node (single-threaded cho JS) đó là trần thực tế, dù máy còn nhiều lõi rảnh.

## Ba con số phải rút ra cho mỗi lượt

| Chỉ số | Ý nghĩa |
|---|---|
| CPU đỉnh của SUT | chạm ~100% một lõi = bão hòa |
| CPU đỉnh của load generator | **> CPU của SUT ⇒ generator là điểm nghẽn**, phải công bố |
| RSS đầu / cuối lượt | dùng cho endurance threshold |

## Hardware report

Bảng spec + **hostname** (phải khớp các bài trước). Trên Windows: `dxdiag` → tab System → chụp fullscreen, và `dxdiag /t <file>` để xuất bản text.

Phải có một mục ghi rõ: **load generator và SUT chạy cùng máy hay không** — đây là giới hạn quyết định cách đọc mọi con số.

## Áp dụng cho lượt đo khác

Đổi tên tiến trình SUT trong `-ProcessNames`. Mốc chụp tính lại theo thời lượng và hình dạng tải của scenario mới: luôn chụp ở **giữa vùng tải cao nhất**, không chụp lúc ramp.
