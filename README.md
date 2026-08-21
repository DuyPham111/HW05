# HW05 — Performance Testing on EShop

> **KHUNG CHỜ ĐIỀN.** Viết file này **cuối cùng**, sau khi `npm run summary` và `npm run drift` đã sinh xong số.
> Mọi con số dưới đây phải **copy từ `results/summary.md`** — không gõ tay từ HTML dashboard.
> Hướng dẫn: [`docs/16-DONG-GOI-CHECKLIST.md`](docs/16-DONG-GOI-CHECKLIST.md) §3.

- **Sinh viên:** Phạm Vũ Ngọc Duy — **MSSV:** 23127183 — **Nhóm:** 10
- **Môn:** Kiểm thử phần mềm — **Bài:** HW05-AI Performance Testing
- **SUT:** EShop — https://github.com/ttbhanh/eshop-sut
- **Công cụ:** Apache JMeter 5.6.3 (mặc định §8) · k6 (bonus) · Task Manager (resource monitor) · Claude Code (AI)

## Liên kết

| | |
|---|---|
| **Repo bài làm (public)** | https://github.com/DuyPham111/HW05-Performance-Testing *(kiểm bằng cửa sổ ẩn danh)* |
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
| Tổng sample | *(điền)* |
| Error rate (**ngoài thiết kế**) | *(điền — 401/403 của bước 7 là hành vi cố ý, không tính là lỗi)* |
| Điều kiện khi đo | `products` = *(N)* dòng · `users` = 402 · JMeter và SUT **cùng máy** |
| **Endurance threshold** | *(điền: RPS ổn định · p95 · trôi p95 · trôi RSS · trần RSS)* |
| Tải cao nhất quan sát được | *(điền: RPS ở 200 VU, p95, error%, CPU node đỉnh)* |
| Hồi phục sau spike | *(điền: p95 của 4 cửa sổ W1–W4)* |
| Bug / performance issue | *(điền số)* |
| Lỗi của AI đã bắt và sửa | *(điền: n lỗi ở test plan + m nhận định đọc sai metric)* |
| Ảnh bằng chứng | *(điền số)* ảnh khớp mốc thời gian |

### Bốn lượt chạy

| Scenario | Sample | Peak VU | Thời lượng | RPS | Error % | avg | p50 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Load** | | | | | | | | | | | |
| **Stress** | | | | | | | | | | | |
| **Spike** | | | | | | | | | | | |
| **Soak** | | | | | | | | | | | |

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
k6/                  bonus §8 — mirror cùng workflow
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
