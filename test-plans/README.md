# test-plans/

Bon test plan JMeter, sinh bang `npm run plans` tu MOT dinh nghia workflow chung
(`tools/gen-test-plans.py`) — de ca 4 plan chay dung cung mot workflow end-to-end (§6).

| File | Scenario | Listener (§6 doi 3 loai KHAC nhau) |
|---|---|---|
| `23127183_Load_YYYYMMDD.jmx` | 20 VU / ramp 60s / think 1-3s / 360s | **Summary Report** |
| `23127183_Stress_YYYYMMDD.jmx` | 4 bac 25-50-100-200 VU / moi bac 60s | **Aggregate Report** |
| `23127183_Spike_YYYYMMDD.jmx` | 10 VU nen + 200 VU trong 5s | **View Results Tree** |
| `23127183_Soak_YYYYMMDD.jmx` | 20 VU / 720s (endurance) | Summary Report |

**§11 kiem TEN FILE** — phai dung mau `{MSSV}_{ScenarioType}_{YYYYMMDD}`.

Huong dan: `docs/04-TEST-PLAN-LOAD.md`, `docs/05`, `docs/06`.
