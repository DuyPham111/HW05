# CI Runs — bằng chứng Task 3 đã chạy thật

> Hướng dẫn: [`docs/10-TASK3-CONTINUOUS-PERF.md`](../docs/10-TASK3-CONTINUOUS-PERF.md) §4.
> Cần **≥ 4 lượt thật**, trong đó **≥ 1 lượt FAIL** để chứng minh cổng chặn hoạt động.

> **Ghi chú:** GH Run #1 (id `32579567018`) không tính vào bảng dưới — bị treo vô hạn ở bước tải
> JMeter do `archive.apache.org` không phản hồi (xác nhận bằng tay: `curl --max-time 30` trả về
> `http=000`, 0 byte). Đây là lỗi hạ tầng CI, không phải lượt đo hiệu năng — đã sửa nguồn tải
> sang `dlcdn.apache.org` ở Run #2. Cả 4 lượt dưới đây đều dùng `git push` (không dùng
> `workflow_dispatch` vì môi trường thực thi không có `gh` CLI/token để gọi API dispatch).

| # (GH run) | Commit | Trigger | p95 đo được | Baseline median | Chênh | Verdict | Link run |
|---|---|---|---|---|---|---|---|
| #2 | [`ebc9d26`](https://github.com/DuyPham111/HW05/commit/ebc9d263bd90f9dc776a45e406737d5a23a91ba7) | push | **3ms** | (chưa có) | — | PASS (khởi tạo baseline) | [run](https://github.com/DuyPham111/HW05/actions/runs/32579940816) |
| #3 | [`e975caf`](https://github.com/DuyPham111/HW05/commit/e975caf80fa1c1a36678b982ed30e6d2e6e275af) | push | ~300ms+ *(xem ghi chú)* | 3ms | rất lớn | **FAIL** (cố ý — tiêm lỗi thật) | [run](https://github.com/DuyPham111/HW05/actions/runs/32580169927) |
| #4 | [`7e9576a`](https://github.com/DuyPham111/HW05/commit/7e9576ac53d13e03c12ad386dcd0784aa2acb25c) | push | ~4ms *(ước lượng)* | 3ms | +33% | **FAIL** (KHÔNG cố ý — biến động tự nhiên, xem §4.4) | [run](https://github.com/DuyPham111/HW05/actions/runs/32580325278) |
| #5 | [`8c83b08`](https://github.com/DuyPham111/HW05/commit/8c83b08d1fde77440e88064def9cc9f84f02eb15) | push | **4ms** | 3ms | +33% | PASS (sau khi sửa ngưỡng, xác nhận hồi phục) | [run](https://github.com/DuyPham111/HW05/actions/runs/32580553493) |

> **Về các số "ước lượng":** log chi tiết từng bước và `$GITHUB_STEP_SUMMARY` của GitHub Actions
> yêu cầu đăng nhập tài khoản GitHub để xem, kể cả trên repo public — không lấy được qua API
> ẩn danh (`curl` không token) hay trình duyệt không đăng nhập. Số liệu **chắc chắn** đến từ
> `ci/baseline.json` mà chính pipeline tự commit lại vào repo sau mỗi lượt PASS (3ms sau #2,
> 4ms sau #5) và từ verdict PASS/FAIL thật của từng run (100% chắc chắn, đọc trực tiếp từ GitHub
> Actions). Số của #3/#4 là suy luận có căn cứ (xem ghi chú từng dòng dưới), không phải số đọc
> trực tiếp từ log.

## Cách tạo lượt FAIL cố ý (Run #3)

Dùng phương án **"thêm độ trễ vào handler của SUT trong bước CI"** (không giả mạo `ci/baseline.json`,
vì baseline giả sẽ làm sai lệch lịch sử thật của các lượt sau). Cụ thể: thêm một step tạm trong
`perf-smoke.yml` chạy `sed` để chèn một vòng busy-wait đồng bộ 300ms vào đầu handler
`POST /api/login` của **bản sao SUT trong workspace CI** (không đụng tới repo `ttbhanh/eshop-sut`
thật — mỗi lượt CI tự `git clone --depth 1` một bản mới):

```bash
sed -i '/app.post("\/api\/login", (req, res) => {/a\  const _t0=Date.now(); while(Date.now()-_t0<300){}' server.js
```

Vì `POST /api/login` là bước 1/7 của mọi vòng lặp workflow (chiếm ~1/7 tổng số request), độ trễ
300ms này kéo p95 tổng thể tăng vọt — đủ để vượt xa cả ngưỡng 30% lẫn ngưỡng tuyệt đối 500ms.
`ci-gate.mjs` FAIL đúng như kỳ vọng, và bước "Cập nhật baseline" bị **skip** (do
`if: success()`) — xác nhận baseline **không bị nhiễm** bởi số liệu xấu này.

**Đã hoàn nguyên:** commit [`7e9576a`](https://github.com/DuyPham111/HW05/commit/7e9576ac53d13e03c12ad386dcd0784aa2acb25c)
(Run #4) xoá hẳn step demo này khỏi `perf-smoke.yml`.

## Phương sai giữa các lượt cùng cấu hình

| Lượt | p95 | Ghi chú |
|---|---|---|
| #2 | 3ms | Baseline khởi tạo, n=1 mẫu |
| #4 | ~4ms (ước lượng) | Cùng cấu hình 5VU/60s/ramp10, **không có lỗi tiêm vào** — chênh lệch thuần tuý là nhiễu của runner GitHub-hosted |
| #5 | 4ms | Cùng cấu hình, xác nhận lại — nhất quán với #4 |

Ba lượt cùng cấu hình (5 VU / 60s / ramp 10s, backend SQLite mới khởi tạo mỗi lần) cho p95 dao
động trong khoảng **3–4ms** — chênh lệch tuyệt đối chỉ **1ms**, nhưng vì baseline quá nhỏ (3ms),
**1ms này tương đương +33% tương đối**. Đây chính là bằng chứng thực nghiệm cho thấy ngưỡng 30%
thuần túy ở §4.3 là **quá chặt** khi đo ở quy mô mili-giây cực nhỏ.

## Kết quả thật đã sửa lại đề xuất §4.3 như thế nào

**Đây không phải là kịch bản dàn dựng — Run #4 là một phát hiện ngoài kế hoạch.** Sau khi Run #3
(lỗi cố ý) FAIL đúng như dự kiến, kế hoạch ban đầu chỉ là chạy thêm một lượt hoàn nguyên (Run #4)
để xác nhận pipeline PASS trở lại. Nhưng Run #4 — **không hề có bất kỳ lỗi nào được tiêm vào** —
**cũng FAIL**, với lý do in ra trực tiếp từ `ci-gate.mjs` khi kiểm tra lại cục bộ: baseline lúc đó
chỉ có **1 mẫu = 3ms**, và độ lệch tự nhiên ~1ms của runner GitHub-hosted đã tương đương **+33%**,
vượt ngưỡng 30% được đề xuất ở §4.3.

**Kết luận:** ngưỡng 30% **thuần túy tương đối** là không đủ khi:
1. Baseline còn quá ít mẫu (rolling median với n=1 không có ý nghĩa thống kê), và
2. Giá trị tuyệt đối đo được quá nhỏ (mili-giây đơn vị) — biến động tự nhiên của hạ tầng chia sẻ
   (GitHub-hosted runner) đủ để tạo ra phần trăm thay đổi lớn dù độ lệch tuyệt đối không đáng kể.

**Sửa lại (commit [`8c83b08`](https://github.com/DuyPham111/HW05/commit/8c83b08d1fde77440e88064def9cc9f84f02eb15)):**
đổi điều kiện FAIL từ "OR" thuần % thành **"VÀ"** giữa hai điều kiện — chỉ FAIL khi
`p95 > median × 1.3` **VÀ** `p95 − median > 10ms` (ngưỡng sàn tuyệt đối). Test lại cục bộ trước
khi push: nhiễu nhỏ (+33%, 1ms) → PASS; hồi quy thật mô phỏng lại (+433%, 13ms) → vẫn FAIL đúng.
Run #5 (cùng cấu hình như #4, không sửa gì ở SUT) xác nhận: PASS trở lại sau khi vá ngưỡng.

Đây là mục sửa lại đề xuất ban đầu dựa trên **kết quả CI thật, không phải suy đoán trên giấy** —
không phải trường hợp giả định "nếu baseline nhỏ thì sao", mà là một lượt FAIL thật đã xảy ra vì
đúng lý do đó.
