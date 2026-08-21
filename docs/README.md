# docs/ — 17 file hướng dẫn quy trình làm HW05

> **Bắt đầu ở [00-ROADMAP.md](00-ROADMAP.md).** Các file được đánh số theo thứ tự làm.
> Đây là tài liệu quy trình, không phải bài nộp — nhưng cứ để trong repo và trong `.zip`, nó cho thấy bạn làm có phương pháp.

| # | File | Nội dung | Buổi |
|---|---|---|---|
| 00 | [ROADMAP](00-ROADMAP.md) | bản đồ đề bài → file nộp · phạm vi đã chốt · 3 đặc điểm SUT quyết định thiết kế · cây thư mục | — |
| 01 | [SETUP](01-SETUP.md) | cài JMeter trên Windows · sửa `jmeter.properties` · chạy SUT · git · `preflight.mjs` | 1 |
| 02 | [PHẠM VI & WORKFLOW](02-PHAM-VI-WORKFLOW.md) | §5: workflow 7 bước · 3 endpoint group · chống trùng nhóm | 1 |
| 03 | [DATA-DRIVEN CSV](03-DATA-DRIVEN-CSV.md) | seed 400 tài khoản + 20k sản phẩm · 5 file CSV · 3 ràng buộc dữ liệu bắt buộc | 1 |
| 04 | [TEST PLAN LOAD](04-TEST-PLAN-LOAD.md) | ⭐ 7 bước dùng AI · bảng assertion · smoke test · bảng human review | 2 |
| 05 | [TEST PLAN STRESS](05-TEST-PLAN-STRESS.md) | 4 bậc VU · 4 dấu hiệu điểm gãy · đừng kết luận "chịu tải tốt" | 3 |
| 06 | [TEST PLAN SPIKE](06-TEST-PLAN-SPIKE.md) | hình dạng tải · phân tích hồi phục 4 cửa sổ · dùng View Results Tree | 3 |
| 07 | [CHẠY & THU BẰNG CHỨNG](07-CHAY-VA-THU-BANG-CHUNG.md) | ⭐ `run-scenario` · reset lockout · ảnh Task Manager · hardware report · `summarize-jtl` | 2–3 |
| 08 | [ENDURANCE THRESHOLD](08-ENDURANCE-THRESHOLD.md) | định nghĩa "ổn định" trước khi chạy · soak 12 phút · RSS và `userCarts` | 3 |
| 09 | [TASK 2 — AI ANALYSIS](09-TASK2-AI-ANALYSIS.md) | ⭐ 8 lỗi đọc metric + lệnh tính con số đúng · phân loại feasible/hallucinated | 4 |
| 10 | [TASK 3 — CONTINUOUS PERF](10-TASK3-CONTINUOUS-PERF.md) | flow chart · trade-off · chạy CI thật (kể cả lượt đỏ) | 4 |
| 11 | [BUG REPORT & ISSUES](11-BUG-REPORT-GITHUB-ISSUES.md) | bug nào không báo lại · 5 ứng viên bug mới có căn cứ từ code | 5 |
| 12 | [VIDEO DEMO](12-VIDEO-DEMO.md) | 3 ràng buộc cứng · kịch bản 9 phần · upload unlisted | 5 |
| 13 | [AGENT SKILLS](13-AGENT-SKILLS.md) | 4 skill · demo end-to-end §7 đòi | 5 |
| 14 | [AI AUDIT & CRITIQUE](14-AI-AUDIT-CRITIQUE.md) | 17 block mẫu · design-log · critique 200–300 từ · xuất PDF | 5 |
| 15 | [GIT COMMIT LOG](15-GIT-COMMIT-LOG.md) | bản đồ 28 commit · xuất log | 5 |
| 16 | [ĐÓNG GÓI & CHECKLIST](16-DONG-GOI-CHECKLIST.md) | checklist §14 14 mục · lệnh tự kiểm · đóng zip | 5 |

## File bạn phải tự tạo trong `docs/` khi làm

| File | Nội dung | Guide |
|---|---|---|
| `endpoint-selection.md` | bằng chứng §5 — **nộp kèm** | [02](02-PHAM-VI-WORKFLOW.md) §6 |
| `nhom-dang-ky-workflow.png` | ảnh tin nhắn đăng ký workflow trong nhóm | [02](02-PHAM-VI-WORKFLOW.md) §4 |

## Cảnh báo §17

`HW05/tham_khao/HW05-Performance-Testing-main` là bài của **sinh viên khác (23127178)**. Chép file, số liệu, câu chữ hay **prompt** của họ = **0 điểm cho cả hai bên**. Workflow của bạn là *Customer Storefront*, của họ là *admin back-office* — số liệu và phát hiện tự nhiên sẽ khác.
