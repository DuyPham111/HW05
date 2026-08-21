#!/usr/bin/env python3
"""Sinh 4 test plan JMeter 5.6.3 (.jmx) tu MOT dinh nghia workflow duy nhat.

§6 cua de doi ca 3 plan Load/Stress/Spike chay CUNG mot workflow end-to-end.
Viet tay 4 file XML 500-1000 dong thi som muon cung lech nhau mot assertion,
va luc do so sanh Load voi Stress voi Spike mat y nghia. Vi the: sua WORKFLOW
o mot cho, chay lai script, ca 4 plan dong bo.

Cach goi:
    python tools/gen-test-plans.py [--date YYYYMMDD] [--outdir test-plans]

Chi dung thu vien chuan cua Python 3.10.
"""

import argparse
import datetime
import os

STUDENT_ID = "23127183"

# ---------------------------------------------------------------------------
# WORKFLOW — dinh nghia MOT LAN, dung cho ca 4 scenario
# ---------------------------------------------------------------------------
# Moi buoc: (ten sampler, method, path, body, can_token, extractors, assertions)
#   extractors: [(ten_bien, json_path)]
#   assertions: [(test_field, pattern, test_type, assume_success)]
#     test_field: "code" (response code) hoac "text" (response body)
#     test_type : "equals" | "contains" | "matches"
#
# Can cu thiet ke assertion — doc ky truoc khi sua:
#   - B2 search  : LIKE '%X%' noi chuoi (server.js:144) -> keyword khong duoc chua ' % _
#   - B3 detail  : id khong ton tai van tra 200 + {} (server.js:159-161)
#                  -> BAT BUOC assert body chua "id", khong chi assert status
#   - B5 coupon  : total_amount > min_order_amount dung `>` (server.js:379)
#                  -> orders.csv de total_amount > 500000, va assert "success":true
#   - B7 login sai: 401 la hanh vi DUNG. Sau 2 lan sai lien tiep, `locked_until`
#                  duoc SET (login_attempts + 2 >= 3, server.js:54-57) nhung 403
#                  chi xuat hien tu lan thu 3 vi code kiem `locked_until` o DAU
#                  request bang trang thai da luu TU TRUOC (server.js:40).
#                  -> assert regex `401|403` + Ignore Status. Khong lam vay thi
#                     JMeter tinh ca 2 truong hop la LOI -> error rate gia ~14%.

WORKFLOW = [
    {
        "name": "01 Login",
        "group": "auth-heavy",
        "method": "POST",
        "path": "/api/login",
        "body": '{"email":"${email}","password":"${password}"}',
        "auth": False,
        "extractors": [("token", "$.token"), ("uid", "$.user.id")],
        "assertions": [
            ("code", "200", "equals", False),
            ("text", "token", "contains", False),
        ],
    },
    {
        "name": "02 Search products",
        "group": "read-heavy",
        "method": "GET",
        "path": "/api/products?search=${__urlencode(${keyword})}",
        "body": None,
        "auth": False,
        "extractors": [],
        "assertions": [("code", "200", "equals", False)],
    },
    {
        "name": "03 Product detail",
        "group": "read-heavy",
        "method": "GET",
        "path": "/api/products/${product_id}",
        "body": None,
        "auth": False,
        "extractors": [],
        # id khong ton tai van tra 200 + {} -> phai kiem body co field "id"
        "assertions": [
            ("code", "200", "equals", False),
            ("text", '"id"', "contains", False),
        ],
    },
    {
        "name": "04 Add to cart",
        "group": "transactional",
        "method": "POST",
        "path": "/api/cart",
        "body": '{"product_id":${product_id},"quantity":1}',
        "auth": True,
        "extractors": [],
        "assertions": [
            ("code", "200", "equals", False),
            ("text", "Added to cart", "contains", False),
        ],
    },
    {
        "name": "05 Apply coupon",
        "group": "transactional",
        "method": "POST",
        "path": "/api/apply-coupon",
        "body": '{"code":"${coupon_code}","total_amount":${total_amount},"user_id":${uid}}',
        "auth": False,
        "extractors": [],
        "assertions": [
            ("code", "200", "equals", False),
            ("text", '"success":true', "contains", False),
        ],
    },
    {
        "name": "06 Checkout",
        "group": "transactional",
        "method": "POST",
        "path": "/api/checkout",
        "body": '{"total_amount":${total_amount},"shipping_address":"${shipping_address}"}',
        "auth": True,
        "extractors": [],
        "assertions": [
            ("code", "200", "equals", False),
            ("text", "orderId", "contains", False),
        ],
    },
    {
        "name": "07 Login sai (lockout)",
        "group": "auth-heavy",
        "method": "POST",
        "path": "/api/login",
        "body": '{"email":"${lock_email}","password":"${wrong_password}"}',
        "auth": False,
        "extractors": [],
        # 401 va 403 deu la hanh vi DUNG cua nhanh nay -> Ignore Status
        "assertions": [("code", "401|403", "matches", True)],
    },
]

# ---------------------------------------------------------------------------
# CSV data-driven (§6) — dat o cap Test Plan, shareMode.all
# ---------------------------------------------------------------------------
# shareMode.all = moi thread lay dong KE TIEP -> 200 VU <-> 200 tai khoan, khong dung nhau.
# De "Current thread group"/"Current thread" thi MOI thread doc file tu dau -> tat ca VU
# dung dong 1 -> 200 VU cung mot tai khoan -> do ra tranh chap ghi cua cach sinh tai.
#
# Luu y ten bien: users_lockout.csv co cot `email` TRUNG ten voi users.csv,
# nen doi thanh `lock_email` de khong ghi de len nhau.
CSV_SETS = [
    ("users.csv", "email,password,csv_user_id"),
    ("users_lockout.csv", "lock_email,wrong_password"),
    ("search-terms.csv", "keyword"),
    ("products.csv", "product_id,product_name,price"),
    ("orders.csv", "total_amount,shipping_address,coupon_code"),
]

# ---------------------------------------------------------------------------
# SCENARIOS — chi khac nhau o THAM SO TAI va LISTENER
# ---------------------------------------------------------------------------
# Scenario 1 thread group (Load, Soak) cho phep ghi de bang -Jthreads / -Jduration
# (can cho smoke test 40 giay). Scenario nhieu thread group (Stress, Spike) dung
# gia tri co dinh vi moi bac/pha co so rieng.
SCENARIOS = {
    "Load": {
        "desc": "Tai ky vong, do p95 o trang thai on dinh",
        "thread_groups": [
            {"name": "Storefront Load", "threads": "${__P(threads,20)}",
             "ramp": 60, "duration": "${__P(duration,360)}", "delay": 0},
        ],
        "timer": (1000, 2000),      # think-time 1-3s
        "listener": "summary",
    },
    # Bac cong don: moi bac them thread vao so dang chay, TAT CA cung ket thuc o t=420s.
    # Chon buoc bac 90s (khong phai 60s) vi ramp cua bac 4 mat 20s -> neu bac chi 60s thi
    # cua so ON DINH cua bac 4 chi con 40s, qua ngan de tinh p95 dang tin cay.
    # Voi 90s: bac 4 co 70s on dinh, va cac bac 1-3 deu co >= 75s.
    #
    #   bac 1: t=  0..420   25 VU   -> cua so on dinh  10.. 90  (25 VU)
    #   bac 2: t= 90..420  +25=50   -> cua so on dinh 100..180  (50 VU)
    #   bac 3: t=180..420  +50=100  -> cua so on dinh 195..270  (100 VU)
    #   bac 4: t=270..420 +100=200  -> cua so on dinh 290..420  (200 VU)
    "Stress": {
        "desc": "Tang tai theo bac de tim diem gay",
        "thread_groups": [
            {"name": "Bac 1 - 25 VU",          "threads": 25,  "ramp": 10, "duration": 420, "delay": 0},
            {"name": "Bac 2 - them 25 (=50)",  "threads": 25,  "ramp": 10, "duration": 330, "delay": 90},
            {"name": "Bac 3 - them 50 (=100)", "threads": 50,  "ramp": 15, "duration": 240, "delay": 180},
            {"name": "Bac 4 - them 100 (=200)","threads": 100, "ramp": 20, "duration": 150, "delay": 270},
        ],
        "timer": (300, 700),        # think-time 0.3-1s, ep tai cao hon
        "listener": "aggregate",
    },
    "Spike": {
        "desc": "Doi cu soc roi rut, do hoi phuc",
        "thread_groups": [
            {"name": "Baseline 10 VU",    "threads": 10,  "ramp": 10, "duration": 240, "delay": 0},
            {"name": "Spike burst 200 VU","threads": 200, "ramp": 5,  "duration": 30,  "delay": 60},
        ],
        "timer": (0, 500),          # think-time 0-0.5s
        "listener": "vrt",
    },
    "Soak": {
        "desc": "Endurance 12 phut, tim nguong on dinh cua phan cung",
        "thread_groups": [
            {"name": "Storefront Soak", "threads": "${__P(threads,20)}",
             "ramp": 60, "duration": "${__P(duration,720)}", "delay": 0},
        ],
        "timer": (1000, 1000),      # think-time 1-2s
        "listener": "summary",
    },
}

LISTENERS = {
    "summary":   ("SummaryReport",             "Summary Report"),
    "aggregate": ("StatVisualizer",            "Aggregate Report"),
    "vrt":       ("ViewResultsFullVisualizer", "View Results Tree"),
}

ASSERT_TYPE = {"matches": 1, "contains": 2, "equals": 8, "substring": 16}
ASSERT_FIELD = {"code": "Assertion.response_code", "text": "Assertion.response_data"}


def java_hash(s):
    """Java String.hashCode() — JMeter GUI dung lam ten cho stringProp trong collection."""
    h = 0
    for ch in s:
        h = (31 * h + ord(ch)) & 0xFFFFFFFF
    return h - 0x100000000 if h >= 0x80000000 else h


def xml_escape(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def ind(level):
    return "  " * level


# ---------------------------------------------------------------------------
# Cac ham sinh tung element
# ---------------------------------------------------------------------------

def el_http_defaults(lvl):
    return f"""{ind(lvl)}<ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Request Defaults" enabled="true">
{ind(lvl+1)}<elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
{ind(lvl+2)}<collectionProp name="Arguments.arguments"/>
{ind(lvl+1)}</elementProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.domain">${{__P(host,localhost)}}</stringProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.port">${{__P(port,3000)}}</stringProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.protocol">http</stringProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.path"></stringProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.connect_timeout">10000</stringProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.response_timeout">30000</stringProp>
{ind(lvl)}</ConfigTestElement>
{ind(lvl)}<hashTree/>
"""


def el_header_manager(lvl, headers, testname="HTTP Header Manager"):
    rows = "".join(
        f"""{ind(lvl+2)}<elementProp name="" elementType="Header">
{ind(lvl+3)}<stringProp name="Header.name">{xml_escape(k)}</stringProp>
{ind(lvl+3)}<stringProp name="Header.value">{xml_escape(v)}</stringProp>
{ind(lvl+2)}</elementProp>
""" for k, v in headers)
    return f"""{ind(lvl)}<HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="{xml_escape(testname)}" enabled="true">
{ind(lvl+1)}<collectionProp name="HeaderManager.headers">
{rows}{ind(lvl+1)}</collectionProp>
{ind(lvl)}</HeaderManager>
{ind(lvl)}<hashTree/>
"""


def el_csv_dataset(lvl, filename, varnames):
    return f"""{ind(lvl)}<CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="CSV {xml_escape(filename)}" enabled="true">
{ind(lvl+1)}<stringProp name="filename">${{__P(datadir,data)}}/{xml_escape(filename)}</stringProp>
{ind(lvl+1)}<stringProp name="fileEncoding">UTF-8</stringProp>
{ind(lvl+1)}<stringProp name="variableNames">{xml_escape(varnames)}</stringProp>
{ind(lvl+1)}<boolProp name="ignoreFirstLine">true</boolProp>
{ind(lvl+1)}<stringProp name="delimiter">,</stringProp>
{ind(lvl+1)}<boolProp name="quotedData">true</boolProp>
{ind(lvl+1)}<boolProp name="recycle">true</boolProp>
{ind(lvl+1)}<boolProp name="stopThread">false</boolProp>
{ind(lvl+1)}<stringProp name="shareMode">shareMode.all</stringProp>
{ind(lvl)}</CSVDataSet>
{ind(lvl)}<hashTree/>
"""


def el_timer(lvl, delay, rng):
    return f"""{ind(lvl)}<UniformRandomTimer guiclass="UniformRandomTimerGui" testclass="UniformRandomTimer" testname="Think time {delay}-{delay+rng} ms" enabled="true">
{ind(lvl+1)}<stringProp name="ConstantTimer.delay">{delay}</stringProp>
{ind(lvl+1)}<stringProp name="RandomTimer.range">{rng}.0</stringProp>
{ind(lvl)}</UniformRandomTimer>
{ind(lvl)}<hashTree/>
"""


def el_json_extractor(lvl, varname, jsonpath):
    return f"""{ind(lvl)}<JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract {xml_escape(varname)}" enabled="true">
{ind(lvl+1)}<stringProp name="JSONPostProcessor.referenceNames">{xml_escape(varname)}</stringProp>
{ind(lvl+1)}<stringProp name="JSONPostProcessor.jsonPathExprs">{xml_escape(jsonpath)}</stringProp>
{ind(lvl+1)}<stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
{ind(lvl+1)}<stringProp name="JSONPostProcessor.defaultValues">NOT_FOUND</stringProp>
{ind(lvl)}</JSONPostProcessor>
{ind(lvl)}<hashTree/>
"""


def el_assertion(lvl, field, pattern, ttype, assume_success):
    h = java_hash(pattern)
    name = "Assert " + ("status " if field == "code" else "body chua ") + pattern
    return f"""{ind(lvl)}<ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="{xml_escape(name)}" enabled="true">
{ind(lvl+1)}<collectionProp name="Asserion.test_strings">
{ind(lvl+2)}<stringProp name="{h}">{xml_escape(pattern)}</stringProp>
{ind(lvl+1)}</collectionProp>
{ind(lvl+1)}<stringProp name="Assertion.custom_message"></stringProp>
{ind(lvl+1)}<stringProp name="Assertion.test_field">{ASSERT_FIELD[field]}</stringProp>
{ind(lvl+1)}<boolProp name="Assertion.assume_success">{"true" if assume_success else "false"}</boolProp>
{ind(lvl+1)}<intProp name="Assertion.test_type">{ASSERT_TYPE[ttype]}</intProp>
{ind(lvl)}</ResponseAssertion>
{ind(lvl)}<hashTree/>
"""


def el_sampler(lvl, step):
    has_body = step["body"] is not None
    if has_body:
        args = f"""{ind(lvl+1)}<boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
{ind(lvl+1)}<elementProp name="HTTPsampler.Arguments" elementType="Arguments">
{ind(lvl+2)}<collectionProp name="Arguments.arguments">
{ind(lvl+3)}<elementProp name="" elementType="HTTPArgument">
{ind(lvl+4)}<boolProp name="HTTPArgument.always_encode">false</boolProp>
{ind(lvl+4)}<stringProp name="Argument.value">{xml_escape(step["body"])}</stringProp>
{ind(lvl+4)}<stringProp name="Argument.metadata">=</stringProp>
{ind(lvl+3)}</elementProp>
{ind(lvl+2)}</collectionProp>
{ind(lvl+1)}</elementProp>
"""
    else:
        args = f"""{ind(lvl+1)}<elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
{ind(lvl+2)}<collectionProp name="Arguments.arguments"/>
{ind(lvl+1)}</elementProp>
"""

    children = ""
    if step["auth"]:
        children += el_header_manager(lvl + 1, [("Authorization", "Bearer ${token}")],
                                      "Header Authorization")
    for varname, jsonpath in step["extractors"]:
        children += el_json_extractor(lvl + 1, varname, jsonpath)
    for field, pattern, ttype, assume in step["assertions"]:
        children += el_assertion(lvl + 1, field, pattern, ttype, assume)

    return f"""{ind(lvl)}<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{xml_escape(step["name"])}" enabled="true">
{args}{ind(lvl+1)}<stringProp name="HTTPSampler.path">{xml_escape(step["path"])}</stringProp>
{ind(lvl+1)}<stringProp name="HTTPSampler.method">{step["method"]}</stringProp>
{ind(lvl+1)}<boolProp name="HTTPSampler.follow_redirects">true</boolProp>
{ind(lvl+1)}<boolProp name="HTTPSampler.auto_redirects">false</boolProp>
{ind(lvl+1)}<boolProp name="HTTPSampler.use_keepalive">true</boolProp>
{ind(lvl+1)}<boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
{ind(lvl)}</HTTPSamplerProxy>
{ind(lvl)}<hashTree>
{children}{ind(lvl)}</hashTree>
"""


def el_thread_group(lvl, tg, timer):
    delay, rng = timer
    body = el_timer(lvl + 1, delay, rng)
    for step in WORKFLOW:
        body += el_sampler(lvl + 1, step)

    return f"""{ind(lvl)}<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="{xml_escape(tg["name"])}" enabled="true">
{ind(lvl+1)}<stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
{ind(lvl+1)}<elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
{ind(lvl+2)}<boolProp name="LoopController.continue_forever">false</boolProp>
{ind(lvl+2)}<stringProp name="LoopController.loops">-1</stringProp>
{ind(lvl+1)}</elementProp>
{ind(lvl+1)}<stringProp name="ThreadGroup.num_threads">{tg["threads"]}</stringProp>
{ind(lvl+1)}<stringProp name="ThreadGroup.ramp_time">{tg["ramp"]}</stringProp>
{ind(lvl+1)}<boolProp name="ThreadGroup.scheduler">true</boolProp>
{ind(lvl+1)}<stringProp name="ThreadGroup.duration">{tg["duration"]}</stringProp>
{ind(lvl+1)}<stringProp name="ThreadGroup.delay">{tg["delay"]}</stringProp>
{ind(lvl+1)}<boolProp name="ThreadGroup.same_user_on_next_iteration">false</boolProp>
{ind(lvl)}</ThreadGroup>
{ind(lvl)}<hashTree>
{body}{ind(lvl)}</hashTree>
"""


SAVE_CONFIG = """<time>true</time>
<latency>true</latency>
<timestamp>true</timestamp>
<success>true</success>
<label>true</label>
<code>true</code>
<message>true</message>
<threadName>true</threadName>
<dataType>true</dataType>
<encoding>false</encoding>
<assertions>true</assertions>
<subresults>true</subresults>
<responseData>false</responseData>
<samplerData>false</samplerData>
<xml>false</xml>
<fieldNames>true</fieldNames>
<responseHeaders>false</responseHeaders>
<requestHeaders>false</requestHeaders>
<responseDataOnError>false</responseDataOnError>
<saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
<assertionsResultsToSave>0</assertionsResultsToSave>
<bytes>true</bytes>
<sentBytes>true</sentBytes>
<url>true</url>
<threadCounts>true</threadCounts>
<idleTime>true</idleTime>
<connectTime>true</connectTime>"""


def el_listener(lvl, kind):
    guiclass, testname = LISTENERS[kind]
    cfg = "\n".join(ind(lvl + 3) + line for line in SAVE_CONFIG.split("\n"))
    return f"""{ind(lvl)}<ResultCollector guiclass="{guiclass}" testclass="ResultCollector" testname="{xml_escape(testname)}" enabled="true">
{ind(lvl+1)}<boolProp name="ResultCollector.error_logging">false</boolProp>
{ind(lvl+1)}<objProp>
{ind(lvl+2)}<name>saveConfig</name>
{ind(lvl+2)}<value class="SampleSaveConfiguration">
{cfg}
{ind(lvl+2)}</value>
{ind(lvl+1)}</objProp>
{ind(lvl+1)}<stringProp name="filename"></stringProp>
{ind(lvl)}</ResultCollector>
{ind(lvl)}<hashTree/>
"""


def build_plan(scenario_name, date_str):
    sc = SCENARIOS[scenario_name]
    plan_name = f"{STUDENT_ID}_{scenario_name}_{date_str}"

    body = el_http_defaults(3)
    body += el_header_manager(3, [("Content-Type", "application/json")])
    for filename, varnames in CSV_SETS:
        body += el_csv_dataset(3, filename, varnames)
    for tg in sc["thread_groups"]:
        body += el_thread_group(3, tg, sc["timer"])
    body += el_listener(3, sc["listener"])

    comment = (f"{sc['desc']} | Workflow Customer Storefront 7 buoc, phu 3 nhom endpoint "
               f"(auth-heavy 2/7, read-heavy 2/7, transactional 3/7). "
               f"Listener: {LISTENERS[sc['listener']][1]}.")

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="{xml_escape(plan_name)}" enabled="true">
      <stringProp name="TestPlan.comments">{xml_escape(comment)}</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
{body}    </hashTree>
  </hashTree>
</jmeterTestPlan>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().strftime("%Y%m%d"),
                    help="Ngay trong ten file, dinh dang YYYYMMDD")
    ap.add_argument("--outdir", default="test-plans")
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    print(f"Sinh test plan cho MSSV {STUDENT_ID}, ngay {args.date}")
    print(f"Workflow: {len(WORKFLOW)} buoc — " + " -> ".join(s["name"] for s in WORKFLOW))
    print()

    for scenario in SCENARIOS:
        path = os.path.join(args.outdir, f"{STUDENT_ID}_{scenario}_{args.date}.jmx")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(build_plan(scenario, args.date))
        sc = SCENARIOS[scenario]
        total_vu = sum(int(tg["threads"]) if str(tg["threads"]).isdigit() else 0
                       for tg in sc["thread_groups"])
        vu_txt = f"{total_vu} VU" if total_vu else "VU theo -Jthreads"
        print(f"  [OK] {path}")
        print(f"       {len(sc['thread_groups'])} thread group · {vu_txt} · "
              f"think {sc['timer'][0]}-{sc['timer'][0]+sc['timer'][1]}ms · "
              f"listener {LISTENERS[sc['listener']][1]}")

    print(f"\nDa sinh {len(SCENARIOS)} plan tu MOT dinh nghia WORKFLOW duy nhat.")
    print("Kiem 3 listener khac loai:")
    for scenario, sc in SCENARIOS.items():
        print(f"  {scenario:8s} -> {LISTENERS[sc['listener']][1]}")


if __name__ == "__main__":
    main()
