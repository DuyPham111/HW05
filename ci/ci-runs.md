# CI Runs — bằng chứng Task 3 đã chạy thật

> Hướng dẫn: [`docs/10-TASK3-CONTINUOUS-PERF.md`](../docs/10-TASK3-CONTINUOUS-PERF.md) §4.
> Cần **≥ 4 lượt thật**, trong đó **≥ 1 lượt FAIL** để chứng minh cổng chặn hoạt động.

| # | Thời điểm | Trigger | p95 đo được | Baseline median | Chênh | Verdict | Link run |
|---|---|---|---|---|---|---|---|
| 1 | | workflow_dispatch | | (chưa có) | — | PASS (khởi tạo baseline) | |
| 2 | | push | | | | | |
| 3 | | push | | | | **FAIL** (cố ý) | |
| 4 | | workflow_dispatch | | | | | |

## Cách tạo lượt FAIL cố ý

*(Ghi rõ đã dùng cách nào: sửa `ci/baseline.json` cho median thấp giả tạo, hay thêm độ trễ vào handler của SUT trong bước CI. Và ghi đã hoàn nguyên chưa.)*

## Phương sai giữa các lượt cùng cấu hình

| Lượt | p95 | Ghi chú |
|---|---|---|
| | | |

*(Ba lượt cùng cấu hình chênh nhau bao nhiêu % — đây là căn cứ để đánh giá ngưỡng 30% ở §4.3 có hợp lý không.)*

## Kết quả thật đã sửa lại đề xuất §4.3 như thế nào

*(Mục ăn điểm cao nhất của Task 3 — xem `docs/10` §4.4.)*
