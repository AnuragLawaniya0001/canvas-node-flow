from typing import List, Dict, Tuple

def sanitize_name(name: str) -> str:
    """Sanitizes node IDs to create valid ngspice net/component names."""
    return str(name).replace("-", "_").replace(" ", "_")

def resolve_nets(nodes: List[dict], edges: List[dict]) -> Tuple[Dict[str, str], Dict[str, Dict[str, str]]]:
    """
    Resolves net names.
    - node_output_nets: maps node_id -> output net name (e.g. 'out_n1')
    - node_input_nets: maps node_id -> { input_handle ('a'/'b'): connected net name }
    """
    node_output_nets = {}
    for node in nodes:
        nid = node["id"]
        s_id = sanitize_name(nid)
        node_output_nets[nid] = f"out_{s_id}"

    node_input_nets = {n["id"]: {} for n in nodes}

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        target_handle = edge.get("targetHandle") or "a"

        if source in node_output_nets and target in node_input_nets:
            source_net = node_output_nets[source]
            node_input_nets[target][target_handle] = source_net

    return node_output_nets, node_input_nets
