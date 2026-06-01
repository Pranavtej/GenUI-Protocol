from dataclasses import dataclass
from typing import Any, Dict, List, Optional

@dataclass
class UINode:
    t: str
    p: Optional[Dict[str, Any]] = None
    c: Optional[List["UINode"]] = None
    id: Optional[str] = None


def create_node(t: str, p: Optional[Dict[str, Any]] = None, c: Optional[List[UINode]] = None, id: Optional[str] = None) -> UINode:
    return UINode(t=t, p=p, c=c, id=id)


def create_dashboard_ast(title: str, value: str) -> Dict[str, Any]:
    return {
        "version": "1.0.0",
        "root": create_node("dashboard", {}, [create_node("kpi", {"label": title, "value": value})]).__dict__
    }
