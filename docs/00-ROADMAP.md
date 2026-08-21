# 00 — Roadmap HW05: từ đề bài đến file nộp

> Sinh viên: **Phạm Vũ Ngọc Duy — 23127183** · SUT: EShop (https://github.com/ttbhanh/eshop-sut)
> **Đọc file này trước tiên.** Mỗi mục dưới trỏ tới một file hướng dẫn chi tiết trong `docs/`.
> Nguyên tắc chung giống HW02/HW04 (2 bài đã 100đ): **AI làm từng bước — người review từng bước — ghi log ngay lúc làm — mỗi bước 1 commit.**

---

## 1. Bài này khác HW02/HW04 ở chỗ nào

| | HW02 / HW04 | **HW05** |
|---|---|---|
| Đối tượng test | UI web/mobile, từng feature | **Backend API `:3000`** — 1 workflow end-to-end |
| Kỹ thuật | Domain / BVA / Automation | **Load · Stress · Spike · Soak** |
| Bằng chứng | ảnh bug + report HTML | **raw `.jtl` + HTML dashboard + ảnh Task Manager cùng khung + video ≥6 phút** |
| Cái dễ mất điểm nhất | thiếu TC | **bịa số** — §11 nói TA sẽ mở raw `.jtl` ra kiểm |

**Điều quan trọng nhất của HW05:** mọi con số trong README và báo cáo phải **tính lại được từ raw `.jtl`**. Không được gõ tay số từ dashboard. Vì thế guide này bắt bạn dựng `tools/summarize-jtl.mjs` — nó là **nguồn duy nhất** sinh ra số liệu.

---

## 2. Phạm vi đã chốt (§5) — kế thừa đúng lựa chọn của HW02

§5 đòi 3 nhóm endpoint: **auth-heavy · read-heavy · transactional**, và cả 3 test plan phải chạy **cùng một workflow end-to-end**.

HW02 bạn đã chọn FR-02 (đăng nhập & khóa), FR-09 (coupon), FR-15 (product CRUD) và HW04 automation cũng 3 feature đó. HW05 **giữ nguyên hướng khách hàng** — workflow *storefront* dưới đây phủ đúng 3 nhóm mà không phải học lại SUT:

| Bước | Endpoint | Nhóm §5 | Vì sao đáng đo | Liên hệ HW02 |
|---|---|---|---|---|
| 1 | `POST /api/login` (mật khẩu **đúng**, tài khoản riêng mỗi VU) | **auth-heavy** | mọi request sau cần JWT; mỗi lần login là 1 `SELECT` + 1 `UPDATE` trên `users` | FR-02 |
| 2 | `GET /api/products?search={keyword}` | **read-heavy** | `LIKE '%...%'` nối chuỗi → **full table scan**, không dùng được index → đây là điểm nóng đọc | FR-05 |
| 3 | `GET /api/products/{id}` | **read-heavy** | đọc 1 dòng theo PK — đối chứng với bước 2 để tách chi phí *scan* khỏi chi phí *đọc* | FR-06 |
| 4 | `POST /api/cart` | **transactional** | ghi vào **RAM** (`userCarts`), không chạm DB → biến số quyết định của lượt **Soak** (xem §5 dưới) | FR-07 |
| 5 | `POST /api/apply-coupon` | **transactional** | 1 `SELECT` coupon + 1 `COUNT(*)` trên `coupon_usage` | FR-09 |
| 6 | `POST /api/checkout` | **transactional** | **`INSERT` thật vào `orders`** — đây là điểm nóng ghi, SQLite ghi tuần tự | FR-08 |
| 7 | `POST /api/login` (mật khẩu **sai**, tài khoản mồi riêng) | **auth-heavy** | nhánh phủ **account-lockout** mà §6 đòi đích danh | FR-02 (B001/B002) |

→ Chi tiết + bằng chứng không trùng thành viên nhóm: [`02-PHAM-VI-WORKFLOW.md`](02-PHAM-VI-WORKFLOW.md).

**Bài tham khảo `tham_khao/HW05-Performance-Testing-main` chọn workflow *admin back-office*** (`/api/admin/orders`, `/api/admin/users`, `/api/admin/import-products`). Workflow của bạn là *storefront* — khác hẳn. Giữ nguyên sự khác biệt này, đừng bắt chước sang admin.

---

## 3. Bản đồ: yêu cầu của đề → thứ phải nộp → guide

| Đề | Yêu cầu định lượng | Nộp bằng cái gì | Guide |
|---|---|---|---|
| §6 T1 | 3 test plan **Load/Stress/Spike**, tên `23127183_{Scenario}_{YYYYMMDD}` | `test-plans/*.jmx` | [04](04-TEST-PLAN-LOAD.md) [05](05-TEST-PLAN-STRESS.md) [06](06-TEST-PLAN-SPIKE.md) |
| §6 T1 | cả 3 plan **cùng 1 workflow**, phủ đủ 3 nhóm | `tools/gen-test-plans.py` (1 định nghĩa → 4 plan) | [04](04-TEST-PLAN-LOAD.md) §3 |
| §6 T1 | **data-driven bằng CSV** | `data/*.csv` | [03](03-DATA-DRIVEN-CSV.md) |
| §6 T1 | **3 listener khác loại**, không lặp | Summary(Load) · Aggregate(Stress) · View Results Tree(Spike) | [04](04-TEST-PLAN-LOAD.md) §5 |
| §6 T1 | **Human review**: AI sai gì, **vì sao** | `report/main-report.md` §2.4 | [04](04-TEST-PLAN-LOAD.md) §6 |
| §6 T1 | raw `.jtl` **đầy đủ** + HTML report folder | `results/jtl/` · `results/html/` | [07](07-CHAY-VA-THU-BANG-CHUNG.md) |
| §6 T1 | ảnh **JMeter + Task Manager cùng khung** mỗi lượt | `resource-monitor/screenshots/` | [07](07-CHAY-VA-THU-BANG-CHUNG.md) §4 |
| §6 T1 | **hardware report** (dxdiag + bảng spec), hostname khớp HW trước | `resource-monitor/hardware-report.md` | [07](07-CHAY-VA-THU-BANG-CHUNG.md) §5 |
| §6 T1 | **reset lockout giữa các lượt** + ghi lại thủ tục | `tools/reset-lockout.mjs` + báo cáo §2.6 | [07](07-CHAY-VA-THU-BANG-CHUNG.md) §3 |
| §6 T1 | **endurance threshold** 10–15 phút, báo bằng **số cụ thể** | `endurance/endurance-threshold.md` | [08](08-ENDURANCE-THRESHOLD.md) |
| §6 T1 | **video ≥6 phút** unlisted, tool + monitor cùng khung, giọng Việt | link trong README | [12](12-VIDEO-DEMO.md) |
| §6 T1 | **báo bug** lên GitHub Issues kèm ảnh | `bug-report/` + Issues | [11](11-BUG-REPORT-GITHUB-ISSUES.md) |
| Task 2 | AI phân tích `.jtl` → **bắt chỗ AI đọc sai metric**, kèm **giá trị đúng lấy từ raw `.jtl`** | báo cáo §3 + `ai-audit/task2-ai-output-verbatim.md` | [09](09-TASK2-AI-ANALYSIS.md) |
| Task 2 | phân loại tối ưu AI đề xuất: **feasible / hallucinated** | báo cáo §3.3 | [09](09-TASK2-AI-ANALYSIS.md) §4 |
| Task 3 | mô hình continuous perf testing + **flow chart** + **trade-off** | báo cáo §4 + `report/assets/` | [10](10-TASK3-CONTINUOUS-PERF.md) |
| §7 | **Agent Skill** + video demo skill end-to-end | `.claude/skills/` | [13](13-AGENT-SKILLS.md) |
| §9 | **AI Audit Report** (tool, ngày giờ, prompt, output) | `ai-audit/ai-audit-report.md` + PDF | [14](14-AI-AUDIT-CRITIQUE.md) |
| §10 | **AI Critique 200–300 từ** | `ai-audit/ai-critique.md` + PDF | [14](14-AI-AUDIT-CRITIQUE.md) |
| §12 | **1 bước = 1 commit** | `git-log/commit-log.txt` | [15](15-GIT-COMMIT-LOG.md) |
| §14 | README **bảng tự chấm + test summary** · zip đúng tên | `README.md` | [16](16-DONG-GOI-CHECKLIST.md) |

**§17: thiếu bất kỳ tài liệu bắt buộc nào = 0 điểm.** Trước khi nộp bắt buộc chạy checklist ở [16](16-DONG-GOI-CHECKLIST.md).

---

## 4. Nguyên tắc dùng AI (§2) — chỗ ăn/mất điểm

1. **Cấm prompt gộp.** Đề nêu đích danh ví dụ xấu: *"run a load test and tell me whether the performance is good"*. Phải chia theo **các bước của kỹ thuật**: mô tả SUT → chốt tham số → sinh plan → gắn CSV + extractor + assertion → smoke test → sửa → chạy chính thức. Mỗi bước một lượt hỏi, mỗi lượt ghi 1 block vào `ai-audit/ai-audit-report.md`.
2. **Ghi log ngay lúc dùng**, không dồn về cuối. Block gồm: tool, ngày giờ, **prompt nguyên văn**, output, và **Human Review Notes** — mục quan trọng nhất, ghi bạn đã kiểm/sửa/loại cái gì và **vì sao**. (Đúng format đã ăn 100đ ở HW02.)
3. **Không bịa số.** Con số duy nhất được phép xuất hiện trong báo cáo là con số `tools/summarize-jtl.mjs` in ra từ raw `.jtl`.
4. **Không bịa "đã kiểm hết".** Trong Human Review Notes, cái nào bạn thật sự chạy tay thì ghi *(SV đã kiểm)*, cái nào chưa thì ghi *(SV chưa tự kiểm)*. §11 phạt bằng chứng dựng, không phạt sự thành thật.

> ⚠️ **§17 chống chép bài:** `HW05/tham_khao/HW05-Performance-Testing-main` là bài của **sinh viên khác (23127178)**. Chép file, số liệu, câu chữ hay **prompt** của họ = **0 điểm cho cả hai bên**. Dùng nó để hiểu *cách tổ chức*; workflow của bạn là *storefront* nên số liệu, bug, và nhận định tự nhiên sẽ khác.

---

## 5. Ba đặc điểm SUT quyết định toàn bộ thiết kế (đọc kỹ, đừng bỏ)

Đây là ba thứ mà AI **sẽ đoán sai** nếu bạn không dán code cho nó — và cũng chính là ba chỗ ghi điểm §6 "review and fix".

### 5.1 Lockout kích hoạt sau **2** lần sai, khóa **180 giây**

`backend/server.js:54` — `const newAttempts = user.login_attempts + 2;` rồi `if (newAttempts >= 3)`. Spec ghi +1/lần và khóa 30s, code làm +2/lần và `Date.now() + 180000`. Bạn đã chứng minh việc này ở HW02 (bug B001/B002).

**Hệ quả cho HW05:** nếu mọi VU dùng chung `test@eshop.com`, chỉ cần **một** lần login sai là toàn bộ VU bị 403 trong 3 phút → bảng kết quả thành rác. → **Bắt buộc mỗi VU một tài khoản riêng** (xem [03](03-DATA-DRIVEN-CSV.md)) và **reset lockout giữa các lượt** (xem [07](07-CHAY-VA-THU-BANG-CHUNG.md) §3).

### 5.2 `POST /api/cart` ghi vào **RAM**, không chạm DB, và **không bao giờ xóa**

`server.js:290` — `userCarts[userId].push(req.body)`. Đây là biến toàn cục trong process `node`. Mỗi request add-to-cart **cộng thêm vĩnh viễn** một phần tử; `POST /api/checkout` **không** gọi `clearCart`.

**Hệ quả cho HW05:** đây là ứng viên **rò rỉ bộ nhớ** rõ ràng nhất của SUT, và lượt **Soak** (§6 đòi endurance threshold) chính là chỗ đo nó. Theo dõi RSS của process `node` đầu và cuối lượt soak — nếu RSS đi lên đơn điệu thì bạn có một phát hiện thật, đo được, kèm dòng code giải thích. Xem [08](08-ENDURANCE-THRESHOLD.md) §4.

> Lưu ý khi diễn giải: restart backend là RAM về 0 — nên **đo RSS trong cùng một lần chạy process**, và ghi rõ trong báo cáo rằng số liệu chỉ có nghĩa nếu backend không bị restart giữa chừng.

### 5.3 Nhiều endpoint trả **HTTP 200 kèm nội dung lỗi**, hoặc 4xx là hành vi đúng

| Endpoint | Cái bẫy | Assertion phải làm gì |
|---|---|---|
| `GET /api/products/:id` | id không tồn tại → **200** + body `{}` (`server.js:160`) | assert **JSON có field `id`**, không chỉ assert status 200 |
| `POST /api/apply-coupon` | `if (total_amount > coupon.min_order_amount)` dùng `>` (`server.js:379`) → đơn **đúng bằng** ngưỡng bị từ chối 400 | CSV phải để `total_amount` **lớn hơn hẳn** ngưỡng (bug off-by-one B006 của HW02 — đã báo rồi, không cần báo lại) |
| `POST /api/login` bước 7 | mật khẩu sai → **401 là ĐÚNG** | phải gắn Response Assertion nhận 401 làm **thành công**, nếu không JMeter tính thành lỗi → error rate giả |
| `POST /api/apply-coupon` mã `SAVE10` | công thức percent sai `total*(1 - 10)` → tiền giảm âm (bug B007 HW02) | dùng coupon **`BIGBUY`** (type `fixed`, 50.000đ, min 500.000) cho luồng chính → kết quả xác định, không dính bug |

**Bốn dòng trên là 4 lỗi mà AI gần như chắc chắn sẽ mắc khi sinh test plan.** Bắt được chúng ở bước smoke test và ghi vào bảng human review = điểm §6.

---

## 6. Thứ tự làm — 10 giờ theo đề, chia 5 buổi

| Buổi | Việc | Output kiểm chứng được | Guide |
|---|---|---|---|
| **1** (~2h) | Cài JMeter, chạy SUT, viết `preflight.mjs` + `seed-perf-data.mjs`, sinh CSV, chốt workflow | `npm run preflight` in ra toàn `[OK]`; `data/*.csv` có dòng thật | [01](01-SETUP.md) [02](02-PHAM-VI-WORKFLOW.md) [03](03-DATA-DRIVEN-CSV.md) |
| **2** (~2.5h) | Task 1 — AI sinh **Load** plan từng bước → smoke test → sửa → chạy chính thức | `results/jtl/23127183_Load_*.jtl` + dashboard + ảnh | [04](04-TEST-PLAN-LOAD.md) [07](07-CHAY-VA-THU-BANG-CHUNG.md) |
| **3** (~2h) | **Stress** + **Spike** + soak 12 phút | 3 lượt `.jtl` nữa + `endurance-threshold.md` chốt bằng số | [05](05-TEST-PLAN-STRESS.md) [06](06-TEST-PLAN-SPIKE.md) [08](08-ENDURANCE-THRESHOLD.md) |
| **4** (~2h) | Task 2 (AI phân tích + bắt lỗi đọc metric) + Task 3 (flow chart + trade-off + chạy CI thật) | báo cáo §3, §4 xong; `ci/ci-runs.md` có lượt chạy thật | [09](09-TASK2-AI-ANALYSIS.md) [10](10-TASK3-CONTINUOUS-PERF.md) |
| **5** (~1.5h) | Bug report + Issues → video ≥6' → Agent Skills → AI Audit + Critique → git log → README → zip | checklist [16] tick hết | [11](11-BUG-REPORT-GITHUB-ISSUES.md) → [16](16-DONG-GOI-CHECKLIST.md) |

Mỗi buổi commit ≥ 2 lần → hết buổi 4 đã vượt xa yêu cầu §12 một cách tự nhiên. **Đừng dồn commit vào 1 ngày** — §12 nhìn được lịch sử.

---

## 7. Cây thư mục bài nộp

```
HW05-Performance-Testing/
├── README.md                      ← §14: bảng tự chấm + test summary (viết CUỐI CÙNG)
├── package.json                   ← npm run preflight / seed / plans / run / summary / drift
├── test-plans/                    ← 4 file .jmx — 23127183_{Load,Stress,Spike,Soak}_YYYYMMDD.jmx (§11 kiểm TÊN)
├── data/                          ← CSV data-driven: users · lockout-users · search-terms · products · orders
├── results/
│   ├── jtl/                       ← raw .jtl ĐẦY ĐỦ (§11) + jmeter.log
│   ├── html/{load,stress,spike}/  ← HTML dashboard từng lượt
│   ├── resources/                 ← mẫu CPU/RAM của node + jmeter, 2 giây/lần
│   ├── run-log.md                 ← mốc giờ từng lượt — để đối chiếu với ảnh Task Manager
│   └── summary.md                 ← SINH TỰ ĐỘNG từ raw .jtl — nguồn DUY NHẤT của mọi con số
├── endurance/                     ← lượt soak 12 phút + endurance-threshold.md (§6)
├── resource-monitor/
│   ├── hardware-report.md         ← bảng spec + hostname Pham_Vu_Ngoc_Duy (§11 đối chiếu HW trước)
│   └── screenshots/               ← JMeter + Task Manager CÙNG KHUNG, 1 ảnh/lượt + ảnh dxdiag
├── report/main-report.md (+.pdf)  ← Task 1 + Task 2 + Task 3 trong MỘT báo cáo (§14 đòi vậy)
├── ai-audit/                      ← ai-audit-report.md · ai-critique.md · design-log.md · task2-ai-output-verbatim.md
├── bug-report/                    ← bug-report.md + screenshots/ + link GitHub Issues
├── ci/ci-runs.md · .github/workflows/perf-smoke.yml   ← bằng chứng Task 3 đã chạy thật
├── k6/                            ← bonus §8: mirror cùng workflow bằng k6
├── git-log/commit-log.txt
├── tools/                         ← preflight · seed · gen-test-plans · run-scenario · sample-resources · summarize · drift · reset-lockout
├── .claude/skills/                ← §7: 4 Agent Skill
└── docs/                          ← CÁC FILE HƯỚNG DẪN NÀY (giữ trong repo, KHÔNG cần cho vào .zip)
```

**Vì sao không tách `task1/ task2/ task3/`:** §14 đòi *"Main report … including the performance-testing report **and** your AI analysis critique"* — Task 1 và Task 2 phải nằm trong **một** báo cáo, vì Task 2 phân tích chính số liệu Task 1 sinh ra. Ba task = **ba chương** của `report/main-report.md`; bằng chứng xếp theo **loại** (`results/`, `test-plans/`, `endurance/`) đúng như §14 gọi tên.

---

## 8. Bắt đầu

→ Mở [01-SETUP.md](01-SETUP.md).
