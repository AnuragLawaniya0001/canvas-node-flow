from typing import List
from app.netlist.net_resolver import resolve_nets, sanitize_name
from app.formula.evaluator import formula_to_ngspice


def generate_ngspice_netlist(nodes: List[dict], edges: List[dict]) -> str:
    """
    Generates SPICE netlist for ngspice execution.
    """
    output_nets, input_nets = resolve_nets(nodes, edges)

    lines = [
        "* Live Node Graph Engine Netlist",
        ".option quiet"
    ]

    for node in nodes:
        nid = node["id"]
        ntype = node.get("type")
        s_id = sanitize_name(nid)
        out_net = output_nets[nid]
        in_nets = input_nets.get(nid, {})

        if ntype == "number":
            val = float(node.get("data", {}).get("value", 0))
            lines.append(f"V_{s_id} {out_net} 0 DC {val}")

        elif ntype == "add":
            a_net = in_nets.get("a", "0")
            b_net = in_nets.get("b", "0")
            lines.append(f"B_{s_id} {out_net} 0 V = V({a_net}) + V({b_net})")

        elif ntype == "multiply":
            a_net = in_nets.get("a", "0")
            b_net = in_nets.get("b", "0")
            lines.append(f"B_{s_id} {out_net} 0 V = V({a_net}) * V({b_net})")

        elif ntype == "divide":
            a_net = in_nets.get("a", "0")
            b_net = in_nets.get("b", "0")
            lines.append(f"B_{s_id} {out_net} 0 V = V({a_net}) / V({b_net})")

        elif ntype == "formula":
            formula_data = node.get("data", {})
            formula_str = formula_data.get("expression") or formula_data.get("formula", "")
            expr_ngspice = formula_to_ngspice(formula_str, in_nets)
            lines.append(f"B_{s_id} {out_net} 0 V = {expr_ngspice}")

        elif ntype == "display":
            pass

    lines.append(".op")
    lines.append(".end")

    return "\n".join(lines)
