---
name: jtl-analysis
description: >-
  Phân tích raw .jtl của JMeter, tính lại mọi chỉ số từ dữ liệu thô, chốt ngưỡng hiệu năng,
  và soát các lỗi đọc sai metric (elapsed vs Latency, gộp 4xx-thiết-kế vào lỗi hệ thống,
  dùng average trên phân phối lệch phải…). Dùng khi cần đọc kết quả một lượt performance
  test, so sánh nhiều lượt, hoặc rà lại phân tích do AI sinh ra.
---

# JTL Analysis — phân tích raw `.jtl` và bắt lỗi đọc metric

> **KHUNG CHỜ HOÀN THIỆN.** Hướng dẫn: `docs/13-AGENT-SKILLS.md` §4 và `docs/09-TASK2-AI-ANALYSIS.md`.

## Đầu vào

`.jtl` (CSV có header: `timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL,Latency,IdleTime,Connect`) + `.resources.csv` cùng basename.

**Đọc header, đừng hard-code chỉ số cột** — cấu hình `jmeter.properties` khác nhau cho ra số cột khác nhau.

## Quy trình

1. **Tính lại mọi chỉ số từ raw** — không đọc số từ HTML dashboard. Percentile: nearest-rank, `p = sorted[ceil(n*q) - 1]`. **Ghi công thức vào output**, vì con số sẽ lệch 1–2 ms so với dashboard JMeter và phải giải thích được.
2. Phân rã theo `label` (từng sampler) và theo `responseCode`.
3. **Tách lỗi thiết kế khỏi lỗi thật** trước khi nói bất cứ điều gì về error rate.
4. Đọc `Latency` **riêng**, không trộn với `elapsed`.
5. Kiểm `allThreads` max — tải có thật sự đạt mức thiết kế không.
6. Đối chiếu `.resources.csv`: CPU của tiến trình SUT so với CPU của load generator.

## Bảng kiểm 8 lỗi đọc metric — chạy mỗi lần

| # | Lỗi | Kiểm bằng | Con số phải trích |
|---|---|---|---|
| 1 | đọc `elapsed` như thời gian xử lý server | awk so `elapsed` vs `Latency` theo label | avg của cả hai + hiệu |
| 2 | gộp 4xx-thiết-kế vào lỗi hệ thống | đếm `(responseCode, label)` | số sample từng mã, thuộc sampler nào |
| 3 | dùng average trên phân phối lệch phải | so p50 / p95 / p99 / max | tỉ số `max/p50`, `p99/p50` |
| 4 | so RPS giữa hai lượt khác thời lượng | chuẩn hóa theo giây, trừ giai đoạn ramp | RPS ở vùng ổn định |
| 5 | bỏ qua `allThreads` | max của cột đó | peak VU thực tế |
| 6 | quy nhân quả khi chưa cô lập biến | — | nêu **tương quan**, không nêu nguyên nhân |
| 7 | bỏ qua việc generator ở cùng máy | so CPU java vs CPU node | CPU đỉnh của cả hai |
| 8 | kết luận rò rỉ chỉ từ đồ thị RSS đi lên | phép kiểm dừng-tải-60s | RSS trước / sau khi dừng tải |

## Chốt ngưỡng

Định nghĩa "ổn định" phải viết **trước** khi nhìn số, nếu không sẽ tự chọn định nghĩa làm cho số của mình đẹp. Bốn tiêu chí: error% · độ trôi p95 · độ trôi RSS · CPU generator < CPU SUT.

## Phân loại đề xuất tối ưu

Bốn nhãn, mỗi cái phải trích được `file:dòng` làm căn cứ:

| Nhãn | Nghĩa |
|---|---|
| **feasible** | làm được, có tác dụng, đo lại được |
| **feasible nhưng vô ích ở đây** | đúng nguyên lý nhưng không áp dụng được với dạng truy vấn/engine cụ thể này |
| **feasible nhưng ngoài phạm vi** | đúng, nhưng là thay đổi kiến trúc chứ không phải tối ưu |
| **hallucinated** | không tồn tại trong ngữ cảnh này (vd "connection pool" cho SQLite nhúng) |

## Áp dụng cho lượt đo khác

Đổi đường dẫn `.jtl`. Bảng 8 lỗi và 4 nhãn giữ nguyên — chúng không phụ thuộc SUT. Cái phải làm lại: danh sách **mã trạng thái nào là hành vi thiết kế** của SUT mới.
