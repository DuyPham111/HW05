# TODO — việc đang dồn lại, làm sau

> File theo dõi những thứ đã **cố ý hoãn** hoặc **chỉ sinh viên tự làm được**.
> Rà file này trước khi đóng gói ([`16-DONG-GOI-CHECKLIST.md`](16-DONG-GOI-CHECKLIST.md)).
> Cập nhật lần cuối: 2026-08-21

---

## 0. ⚠️ HAI BẪY VẬN HÀNH — đọc trước mỗi buổi đo

### 0.1 Khởi động lại backend là XOÁ SẠCH database

`server.js:4` require `database.js`, mà file này gọi `initDatabase()` ngay lúc load — và việc đầu
tiên nó làm là `DROP TABLE IF EXISTS` cho cả 6 bảng (`database.js:13-21`).

→ **Bộ dữ liệu 20.005 sản phẩm + 400 tài khoản chỉ sống đúng bằng vòng đời tiến trình `node`.**
Tắt/khởi động lại backend = mất hết, phải chạy lại `npm run seed:perf -- --users 200 --products 20000` (~4 phút).

Hệ quả cho các lượt đo:
- **Mọi lượt phải chạy trên CÙNG một lần khởi động backend** thì mới so sánh được với nhau.
- Nếu backend chết giữa chừng (đã xảy ra 1 lần — xem bug P5), **mọi lượt trước đó không còn so được với lượt sau**.
- Doc 8 (soak) đã cấm restart để đo RSS — giờ có thêm lý do thứ hai còn nặng hơn.

### 0.2 `localhost` phân giải hỏng trong môi trường này

`curl http://localhost:3000` trả **000 sau 2,2s** (timeout IPv6) trong khi `http://127.0.0.1:3000`
trả **200 trong 32 ms**. Đã đổi mặc định `host` của cả 4 test plan và 4 script sang `127.0.0.1`.
Nếu thấy request "treo 2 giây rồi lỗi" thì kiểm chỗ này đầu tiên.

---

## 1. ⭐ k6 — ĐIỂM CỘNG (§8), đã bỏ folder nhưng CÓ THỂ LÀM LẠI

**Trạng thái:** đã xóa `k6/` ngày 2026-08-21 theo quyết định "chốt dùng JMeter".

**Vì sao vẫn ghi lại:** §8 của đề ghi nguyên văn *"JMeter (default) or **k6 (bonus)**"* — k6 là **điểm cộng**. Bỏ đi **không** ảnh hưởng 100 điểm của bảng §15 (6 tiêu chí đều không nhắc k6), nhưng cũng có nghĩa là **không lấy được phần thưởng đó**.

**Nếu cuối bài còn thời gian (~30–45 phút) thì làm lại:**

| Việc | Ghi chú |
|---|---|
| k6 đã cài sẵn trên máy | `C:\Program Files\k6\k6.exe` — kiểm bằng `k6 version` |
| Viết `k6/workflow.js` mirror **đúng 7 bước** của workflow storefront | dùng lại `data/*.csv` qua `papaparse` của k6 hoặc `open()` + `SharedArray` |
| Chạy 1 lượt Load tương đương (20 VU, 6 phút) | `k6 run --vus 20 --duration 6m k6/load.js` |
| **Giá trị thật của việc này:** đối chiếu chéo | nếu k6 và JMeter cho p95 **tương đương** → con số đo được là của **SUT**; nếu **lệch nhiều** → một trong hai load generator đang là điểm nghẽn. Đây là một kết quả có nội dung, viết được vào mục "Giới hạn" của báo cáo |

**Ưu tiên:** thấp — chỉ làm sau khi 6 tiêu chí chính đã xong hết.

---

## 2. Doc 7 — chạy và thu bằng chứng (ĐANG DỒN, ưu tiên CAO)

**Trạng thái:** hoãn theo yêu cầu, làm sau doc 5 + doc 6.

Doc 7 chứa các script mà doc 5/6 **cần để chạy lượt chính thức**:

| Script | Trạng thái | Ai cần |
|---|---|---|
| `tools/reset-lockout.mjs` | ✅ **đã làm sớm** (doc 5 cần) | doc 5, 6, 8 |
| `tools/run-scenario.mjs` | ❌ chưa | doc 5, 6, 8 |
| `tools/sample-resources.ps1` | ❌ chưa | doc 5, 6, 8 |
| `tools/summarize-jtl.mjs` | ✅ **đã làm sớm** (doc 6 cần `--windows`) | doc 5, 6, 8, 9 |
| `tools/hardware-report.ps1` | ❌ chưa | §11 |

→ **Chưa chạy được lượt chính thức nào** cho tới khi làm xong doc 7. Doc 5 và doc 6 hiện chỉ làm được phần **thiết kế + kiểm chứng cơ chế**.

---

## 3. Việc CHỈ SINH VIÊN tự làm được (AI không thay được)

> 📖 **Hướng dẫn từng bước chi tiết: [`HUONG-DAN-VIEC-TU-LAM.md`](HUONG-DAN-VIEC-TU-LAM.md)** — bấm gì, gõ gì, lưu tên file gì, kiểm lại thế nào.

| # | Việc | Đề mục | Thời gian | Trạng thái |
|---|---|---|---|---|
| 1 | ~~Đăng ký workflow trong nhóm chat + chụp màn hình~~ | §5 | — | ✅ **XONG** — ảnh `docs/nhom-dang-ky-workflow.png`, nhúng ở `endpoint-selection.md` §5 |
| 2 | **Chụp `dxdiag`** + xuất `dxdiag.txt` | §6, §11 | 5 phút | ❌ chưa — [mục A](HUONG-DAN-VIEC-TU-LAM.md#a-chụp-dxdiag--hardware-report-6-11--5-phút) · **làm được ngay, không phụ thuộc gì** |
| 3 | **4 ảnh Task Manager cùng khung với JMeter** | §6, §11 | trong lúc chạy | ❌ chưa — [mục B](HUONG-DAN-VIEC-TU-LAM.md#b-chụp-ảnh-task-manager-cùng-khung-với-jmeter-6-11--4-ảnh) · cần doc 7 xong trước |
| 4 | **4 ảnh bằng chứng bug** (P1, P2, P3, P5) | §6 | 15 phút | ❌ chưa — [mục C](HUONG-DAN-VIEC-TU-LAM.md#c-chụp-ảnh-bằng-chứng-cho-4-bug-6--15-phút) · **làm được ngay** (backend đang chạy) |
| 5 | **Tạo GitHub Issues** + dán link thật vào `bug-report.md` | §6 | 20 phút | ❌ chưa — [mục D](HUONG-DAN-VIEC-TU-LAM.md#d-tạo-github-issues-6--20-phút) · cần mục 4 xong trước |
| 6 | **Quay video ≥6 phút**, unlisted, giọng tiếng Việt | §6, §11 | ~1 giờ | ❌ chưa — [mục E](HUONG-DAN-VIEC-TU-LAM.md#e-quay-video-demo--6-phút-6-11--1-giờ) · **làm cuối cùng** |

**Thứ tự đề xuất:** 2 (dxdiag) → 4 (ảnh bug) → 5 (Issues) → 3 (ảnh Task Manager, cùng lúc chạy 4 lượt) → 6 (video).
Mục 2 và 4 làm được **ngay bây giờ** mà không cần chờ doc 7.

---

## 4. Ứng viên bug đã phát hiện, chờ xử lý ở doc 11

| ID | Bug | Phát hiện khi | Cần gì thêm |
|---|---|---|---|
| **P1** | `POST /api/register` không có UNIQUE trên `email` → tạo tài khoản trùng, trả 200 | doc 3, lúc kiểm idempotency của `seed-perf-data.mjs` | ảnh chụp 2 lần gọi cùng email ra 2 `id` khác nhau + Issue |
| P2 *(ứng viên)* | `GET /api/products/:id` trả **200 + `{}`** cho id không tồn tại | doc 4, lúc thiết kế assertion bước 3 | đã có bằng chứng `success=false` từ phép kiểm phá assertion; cần ảnh + Issue |
| P3 *(ứng viên)* | `GET /api/products?search=` nối chuỗi SQL → SQL injection | đọc code `server.js:144` | **chưa kiểm chứng bằng request thật** — phải chạy `curl` trước khi báo |
| **P5** | `/api/products` không phân trang → 3,6 MB/request, làm chết backend ở 200 VU | doc 6, lượt validate Spike đầu tiên | ✅ **đã có bằng chứng số đo đầy đủ**; cần ảnh + Issue |
| **P6** | Restart backend xoá sạch DB (`database.js:13-21`) | doc 6, khi khôi phục sau sự cố | ✅ **đã xác minh bằng code + thực tế**; cần ảnh + Issue |
| P4 *(ứng viên)* | Rò rỉ bộ nhớ `userCarts` | đọc code `server.js:290-293` | cần lượt Soak (doc 8) + phép kiểm dừng-tải-60s |

---

## 5. Đã xong (để đối chiếu)

- ✅ doc 1 — setup JMeter, SUT, git, preflight
- ✅ doc 2 — chốt phạm vi §5, `endpoint-selection.md` *(trừ mục đăng ký nhóm)*
- ✅ doc 3 — seed 400 tài khoản + 20k sản phẩm, 5 file CSV
- ✅ doc 4 — 4 test plan `.jmx`, smoke test, human review 6 lỗi
- ✅ doc 5 — sửa bậc Stress 60s→90s, kiểm chứng `allThreads` cộng dồn, `reset-lockout.mjs`
- ✅ doc 6 — thiết kế Spike, `summarize-jtl.mjs` + `--windows`, **lượt validate 19.454 sample 0% error**, phân tích hồi phục 4 cửa sổ
