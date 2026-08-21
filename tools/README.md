# tools/ — cac script se duoc dung theo huong dan trong docs/

| Script | Viec | Dung o guide |
|---|---|---|
| `preflight.mjs` | kiem tool + SUT + 6 endpoint + CSV truoc khi chay | docs/01 §5 |
| `seed-perf-data.mjs` | 400 tai khoan + 20k san pham + 5 file CSV | docs/03 §2 |
| `gen-test-plans.py` | sinh 4 file .jmx tu MOT dinh nghia workflow | docs/04 §4 |
| `run-scenario.mjs` | 1 luot: reset lockout -> chay -> .jtl + dashboard + run-log + mau tai nguyen | docs/07 §2 |
| `sample-resources.ps1` | mau CPU/RSS cua node.exe va java.exe, 2 giay/lan | docs/07 §4.4 |
| `reset-lockout.mjs` | mo khoa tai khoan giua cac luot (§6 doi ghi lai thu tuc) | docs/07 §3 |
| `hardware-report.ps1` | bang spec + hostname | docs/07 §5.2 |
| `summarize-jtl.mjs` | raw .jtl -> results/summary.md — NGUON DUY NHAT cua moi con so | docs/07 §6 |
| `soak-drift.mjs` | p95 va RSS theo tung phut + kiem 4 tieu chi on dinh | docs/08 §4 |
| `ci-gate.mjs` | cong chan p95 regression cho pipeline Task 3 | docs/10 §4.2 |
