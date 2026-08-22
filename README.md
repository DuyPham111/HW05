# HW05 — Performance Testing on EShop

> **KHUNG CHỜ ĐIỀN.** Viết file này **cuối cùng**, sau khi `npm run summary` và `npm run drift` đã sinh xong số.
> Mọi con số dưới đây phải **copy từ `results/summary.md`** — không gõ tay từ HTML dashboard.
> Hướng dẫn: [`docs/16-DONG-GOI-CHECKLIST.md`](docs/16-DONG-GOI-CHECKLIST.md) §3.

- **Sinh viên:** Phạm Vũ Ngọc Duy — **MSSV:** 23127183 — **Nhóm:** 10
- **Môn:** Kiểm thử phần mềm — **Bài:** HW05-AI Performance Testing
- **SUT:** EShop — https://github.com/ttbhanh/eshop-sut
- **Công cụ:** Apache JMeter 5.6.3 (mặc định §8) · Task Manager (resource monitor) · Claude Code (AI)

## Liên kết

| | |
|---|---|
| **Repo bài làm (public)** | https://github.com/DuyPham111/HW05 *(kiểm bằng cửa sổ ẩn danh)* |
| **GitHub Issues** | *(điền link từng Issue)* |
| **Video demo (≥6 phút, unlisted)** | *(điền link + thời lượng thật, vd `11:42`)* |
| **Báo cáo chính** | [report/main-report.md](report/main-report.md) |
| **Test summary sinh tự động** | [results/summary.md](results/summary.md) |
| **Endurance threshold** | [endurance/endurance-threshold.md](endurance/endurance-threshold.md) |
| **AI Audit + Critique** | [ai-audit/](ai-audit/) |
| **Bug report** | [bug-report/bug-report.md](bug-report/bug-report.md) |
| **Bằng chứng chống trùng nhóm (§5)** | [docs/endpoint-selection.md](docs/endpoint-selection.md) |

---

## 1. Phạm vi — ba endpoint group (§5)

Một workflow end-to-end **Customer Storefront**, phủ đủ 3 nhóm, không trùng thành viên nào trong nhóm.

| Bước | Endpoint | Nhóm §5 | p95 ở Stress |
|---|---|---|---|
| 1 | `POST /api/login` (mật khẩu đúng) | **auth-heavy** | *(điền)* |
| 2 | `GET /api/products?search=` | **read-heavy** | *(điền)* |
| 3 | `GET /api/products/{id}` | **read-heavy** | *(điền)* |
| 4 | `POST /api/cart` | **transactional** | *(điền)* |
| 5 | `POST /api/apply-coupon` | **transactional** | *(điền)* |
| 6 | `POST /api/checkout` | **transactional** | *(điền)* |
| 7 | `POST /api/login` (mật khẩu sai) | **auth-heavy** | *(điền)* — nhánh phủ account-lockout |

Cả 4 test plan (Load / Stress / Spike / Soak) chạy **cùng** workflow này, chỉ khác tham số tải — đúng yêu cầu §6. Sinh từ một định nghĩa duy nhất: `npm run plans`.

---

## 2. Test Summary Report (§14)

> Bảng dưới lấy từ `results/summary.md` (sinh tự động từ raw `.jtl`).

| Chỉ số | Giá trị |
|---|---|
| Scenario đã chạy | **4** — Load · Stress · Spike · Soak (endurance) |
| Endpoint group được phủ | **3** — auth-heavy · read-heavy · transactional |
| Tổng sample | **90.188** (3.282 + 59.628 + 18.102 + 9.176) |
| Error rate (**ngoài thiết kế**) | **0,00%** ở cả 4 lượt — mọi 401/403 đều thuộc bước 7 (nhánh lockout cố ý) |
| Điều kiện khi đo | `products` = **20.005** dòng · `users` = 402 · JMeter và SUT **cùng máy** |
| **Endurance threshold** | **12,8 req/s** ổn định 12 phút · p95 **15 ms** · trôi p95 **−6,3%** · trôi RSS **−15,0%** (không tăng) · trần RSS **113,7 MB** — nhưng 1/4 tiêu chí FAIL (CPU `java` 246,3% > `node` 16,3%), xem `endurance/endurance-threshold.md` §4 |
| Tải cao nhất quan sát được | Stress 200 VU: **142,1 req/s**, p95 **289 ms**, error **0%**, `node.exe` CPU đỉnh **13%** |
| Hồi phục sau spike | W1 (nền) p95 **15ms** → W2 (sốc, 210 VU) p95 **479ms** → W3 (ngay sau) p95 **12ms** → W4 (nền sau) p95 **18ms** — hồi phục tức thì, không tồn đọng |
| Bug / performance issue | **4** ứng viên (P1 register trùng email, P2 200+`{}`, P5 payload 3,6MB không phân trang, P6 restart xoá DB) — ảnh + Issue đang hoàn thiện |
| Lỗi của AI đã bắt và sửa | **9 lỗi** thiết kế test plan (bảng human review) + phát hiện 3 bug vận hành thật (fetch treo 6h, encoding path tiếng Việt, PowerShell `-eq`) |
| Ảnh bằng chứng | **6 ảnh**: 4 Task Manager (mỗi lượt) + dxdiag + hardware, tất cả khớp mốc thời gian |

### Bốn lượt chạy

| Scenario | Sample | Peak VU | Thời lượng | RPS | Error % (thật) | avg | p50 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Load** | 3.282 | 20 | 358,5s | 9,2 | 0,0% | 6,7 | 4 | 15 | **16** | 20 | 199 |
| **Stress** | 59.628 | 200 | 419,5s | 142,1 | 0,0% | 88,7 | 46 | 232 | **289** | 419 | 976 |
| **Spike** | 18.102 | 210 | 239,5s | 75,6 | 0,0% | 184,0 | 117 | 455 | **530** | 682 | 893 |
| **Soak** | 9.176 | 20 | 718,6s | 12,8 | 0,0% | 6,4 | 4 | 14 | **15** | 18 | 121 |

Đơn vị: **ms**. Mốc thời gian từng lượt: [results/run-log.md](results/run-log.md) · [endurance/run-log.md](endurance/run-log.md).

---

## 3. Bảng tự đánh giá (§15)

> **Lưu ý lỗi số học trong đề:** sáu dòng tiêu chí cộng thành 90 (`20+20+20+10+10+10`) nhưng dòng Total của mẫu ghi 100. Bảng dưới giữ nguyên từng mức tối đa của đề và dùng `100` theo đúng dòng Total + định dạng `SelfAssessedGrade` 3 chữ số; không tự tạo thêm tiêu chí.

| No. | Tiêu chí | Điểm tối đa | **Tự chấm** | Căn cứ |
|-----|----------|-------------|--------------|--------|
| 1 | Task 1 — Load testing | 20 | | |
| 2 | Task 1 — Stress testing | 20 | | |
| 3 | Task 1 — Spike testing | 20 | | |
| 4 | Task 2 — AI analysis + misinterpretation hunt | 10 | | |
| 5 | Task 3 — Continuous Performance Testing (G9.6) | 10 | | |
| 6 | Agent Skills | 10 | | |
| | **Tổng theo mẫu đề** | **100** | | |

**Tên file nộp:** `23127183_HW05_AI_Performance_<điểm>.zip`

---

## 4. Cách chạy lại toàn bộ

```bash
npm run preflight
```

```bash
npm run seed:perf -- --users 200 --products 20000
```

```bash
npm run plans
```

```bash
node tools/run-scenario.mjs Load
```

```bash
npm run summary && npm run drift && npm run hardware
```

Chi tiết từng bước: [`docs/00-ROADMAP.md`](docs/00-ROADMAP.md).

---

## 5. Cấu trúc repo

```
test-plans/          4 test plan .jmx — {MSSV}_{Scenario}_{YYYYMMDD} (§6, §11 kiểm tên)
data/                5 file CSV data-driven (§6)
results/
├── jtl/             raw .jtl ĐẦY ĐỦ (§11) — Load · Stress · Spike + jmeter.log
├── html/<scenario>/ HTML dashboard từng lượt
├── resources/       mẫu CPU/RSS 2 giây/lần của node.exe và java.exe
├── run-log.md       mốc giờ từng lượt, để đối chiếu ảnh monitor (§11)
└── summary.md       SINH TỰ ĐỘNG từ raw .jtl — nguồn duy nhất của mọi con số
endurance/           lượt soak 12 phút + endurance-threshold.md (§6)
resource-monitor/    hardware-report.md (spec + hostname) + screenshots/
report/              main-report.md — Task 1 + 2 + 3 trong MỘT báo cáo (§14)
ai-audit/            audit report · critique · design-log · task2 output nguyên văn
bug-report/          bug-report.md + screenshots + verify-bugs.mjs
ci/ .github/         bằng chứng Task 3 đã chạy CI thật
tools/               preflight · seed · gen-test-plans · run-scenario · summarize · drift · reset-lockout
.claude/skills/      4 Agent Skill (§7)
docs/                17 file hướng dẫn quy trình làm bài
git-log/             commit-log.txt (§12)
```

---

## 6. Ba điều quyết định cách đọc mọi con số của bài này

> *(Điền sau khi chạy xong — đây là mục thể hiện bạn hiểu giới hạn của phép đo của chính mình.)*

1. **Load generator và SUT cùng một máy.** CPU đỉnh của `java.exe` (JMeter) là *(điền)*, của `node.exe` là *(điền)*. *(Nếu java > node thì nói rõ số đo bị trần bởi load generator.)*
2. **Mật khẩu lưu plaintext** ([`server.js:46`](https://github.com/ttbhanh/eshop-sut/blob/main/backend/server.js#L46)) — login không tốn CPU băm, nên p95 của nó **không** đại diện cho hệ thống băm mật khẩu đúng cách.
3. **Lockout kích hoạt sau 2 lần sai, không phải 3** (`login_attempts + 2`, ngưỡng `>= 3` — [`server.js:54`](https://github.com/ttbhanh/eshop-sut/blob/main/backend/server.js#L54)). Mọi `403` ở bước 7 là **hành vi chức năng**, không phải lỗi hệ thống.
