"""Build, validate and (optionally) publish a data-bound dashboard with the Python SDK.

    pip install -e packages/sdk/python
    python examples/python/build_dashboard.py            # validate and print
    python examples/python/build_dashboard.py --publish  # also stream it to a local MCP server
"""

import json
import sys

from genui_protocol_sdk import McpClient, actions, assert_valid, bind, document, tpl, ui

doc = document(
    ui.page(
        ui.grid(
            ui.kpi(id="rev", label="Revenue", value=bind("kpis.revenue"), trend="up", trend_value="+8%"),
            ui.kpi(id="users", label="Active users", value=bind("kpis.users")),
            cols=2,
        ),
        ui.chart(type="bar", title="Weekly signups", data=bind("signups")),
        ui.button(label="Email me this report", on_click=actions.emit("send_report", {"format": "pdf"})),
        title=tpl("Overview — {{period}}"),
    ),
    data={
        "period": "this week",
        "kpis": {"revenue": "$94,201", "users": "12,847"},
        "signups": [{"label": d, "value": v} for d, v in zip(["Mon", "Tue", "Wed", "Thu", "Fri"], [40, 55, 38, 70, 64])],
    },
)

assert_valid(doc)  # raises InvalidDocumentError listing every problem
print(json.dumps(doc, indent=2))

if "--publish" in sys.argv:
    with McpClient("http://127.0.0.1:4000") as client:
        print("published:", client.stream_document(doc))
