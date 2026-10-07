from typing import List, Dict, Any, Tuple
from app.graph.cycle_detector import detect_cycles
from app.formula.validator import parse_and_validate_formula
from app.formula.lexer import InvalidFormulaError

ALLOWED_NODE_TYPES = {"number", "add", "multiply", "divide", "display", "formula"}

NODE_REQUIRED_INPUTS = {
    "number": [],
    "add": ["a", "b"],
    "multiply": ["a", "b"],
    "divide": ["a", "b"],
    "display": ["a"],
    "formula": []
}

OUTPUT_HANDLES = {
    "number": {"out"},
    "add": {"out"},
    "multiply": {"out"},
    "divide": {"out"},
    "display": set(),
    "formula": {"out"}
}

INPUT_HANDLES = {
    "number": set(),
    "add": {"a", "b"},
    "multiply": {"a", "b"},
    "divide": {"a", "b"},
    "display": {"a", "in"},
    "formula": {"a", "b"}
}


def _invalid_graph(code: str, message: str, **details) -> Tuple[bool, str, dict]:
    payload = {"error": {"code": code, "message": message}}
    payload.update(details)
    return False, code, payload


def validate_graph_structure(nodes: List[dict], edges: List[dict]) -> Tuple[bool, str, dict]:
    """
    Validates structural correctness of graph.
    Returns (is_valid, error_code, error_details).
    """
    if not isinstance(nodes, list):
        return _invalid_graph("INVALID_GRAPH", "Nodes must be an array")

    if not isinstance(edges, list):
        return _invalid_graph("INVALID_GRAPH", "Edges must be an array")

    node_map: Dict[str, dict] = {}
    for node in nodes:
        if not isinstance(node, dict):
            return _invalid_graph("INVALID_GRAPH", "Each node must be an object")
        node_id = node.get("id")
        if not node_id:
            return _invalid_graph("INVALID_GRAPH", "Each node must include an id")
        if node_id in node_map:
            return _invalid_graph("INVALID_GRAPH", f"Duplicate node id: {node_id}", nodeId=node_id)
        node_map[node_id] = node

    for node in nodes:
        ntype = node.get("type")
        if ntype not in ALLOWED_NODE_TYPES:
            return _invalid_graph(
                "INVALID_NODE_TYPE",
                f"Unsupported node type: {ntype}",
                nodeId=node.get("id"),
                type=ntype
            )

    seen_edge_ids = set()
    target_handle_counts: Dict[Tuple[str, str], int] = {}
    for edge in edges:
        if not isinstance(edge, dict):
            return _invalid_graph("INVALID_EDGE", "Each edge must be an object")

        edge_id = edge.get("id")
        if edge_id is not None:
            if edge_id in seen_edge_ids:
                return _invalid_graph("INVALID_EDGE", f"Duplicate edge id: {edge_id}", edgeId=edge_id)
            seen_edge_ids.add(edge_id)

        source = edge.get("source")
        target = edge.get("target")
        if source is None or target is None:
            return _invalid_graph("INVALID_EDGE", "Edge must include source and target")

        if source == target:
            return _invalid_graph("INVALID_EDGE", "Self-loop edges are not allowed", nodeId=source, edgeId=edge.get("id"))

        if source not in node_map or target not in node_map:
            return _invalid_graph(
                "INVALID_EDGE",
                "Edge references a nonexistent node",
                nodeId=target if target not in node_map else source,
                edgeId=edge.get("id")
            )

        source_handle = edge.get("sourceHandle") or "out"
        target_handle = edge.get("targetHandle") or "a"

        source_type = node_map[source].get("type")
        target_type = node_map[target].get("type")
        if source_handle not in OUTPUT_HANDLES.get(source_type, set()):
            return _invalid_graph(
                "INVALID_EDGE",
                f"Invalid source handle '{source_handle}' for node '{source_type}'",
                nodeId=source,
                handle=source_handle
            )
        if target_handle not in INPUT_HANDLES.get(target_type, set()):
            return _invalid_graph(
                "INVALID_EDGE",
                f"Invalid target handle '{target_handle}' for node '{target_type}'",
                nodeId=target,
                handle=target_handle
            )

        key = (target, target_handle)
        target_handle_counts[key] = target_handle_counts.get(key, 0) + 1
        if target_handle_counts[key] > 1:
            return _invalid_graph(
                "MULTIPLE_INPUT_WIRES",
                f"Input '{target_handle}' on node '{target}' has multiple incoming connections",
                nodeId=target,
                handle=target_handle
            )

    has_cycle, cycle_nodes = detect_cycles(nodes, edges)
    if has_cycle:
        return _invalid_graph(
            "CYCLE_DETECTED",
            "Graph contains a cycle",
            nodeIds=cycle_nodes,
            nodes=cycle_nodes
        )

    for node in nodes:
        nid = node.get("id")
        ntype = node.get("type")
        if ntype == "formula":
            formula_data = node.get("data", {})
            formula_str = formula_data.get("expression") or formula_data.get("formula", "")
            try:
                parse_and_validate_formula(formula_str)
            except InvalidFormulaError as e:
                return _invalid_graph(
                    "INVALID_FORMULA",
                    str(e),
                    nodeId=nid,
                    formulaErrorCode=getattr(e, "code", "INVALID_FORMULA")
                )

    incoming_handles: Dict[str, set] = {n["id"]: set() for n in nodes if "id" in n}
    for edge in edges:
        target = edge.get("target")
        target_handle = edge.get("targetHandle") or "a"
        if target in incoming_handles:
            incoming_handles[target].add(target_handle)

    for node in nodes:
        nid = node["id"]
        ntype = node.get("type")
        connected = incoming_handles[nid]

        if ntype in ("add", "multiply", "divide"):
            required = NODE_REQUIRED_INPUTS[ntype]
            for req in required:
                if req not in connected:
                    return _invalid_graph(
                        "MISSING_INPUT",
                        f"Input '{req}' is not connected",
                        nodeId=nid,
                        handle=req
                    )

        elif ntype == "display":
            if "a" not in connected and "in" not in connected:
                return _invalid_graph(
                    "MISSING_INPUT",
                    "Input 'in' is not connected",
                    nodeId=nid,
                    handle="in"
                )

        elif ntype == "formula":
            formula_data = node.get("data", {})
            formula_str = formula_data.get("expression") or formula_data.get("formula", "")
            try:
                ast = parse_and_validate_formula(formula_str)
                used_vars = set()

                def collect_vars(ast_node):
                    if hasattr(ast_node, 'name'):
                        used_vars.add(ast_node.name)
                    if hasattr(ast_node, 'left'):
                        collect_vars(ast_node.left)
                    if hasattr(ast_node, 'right'):
                        collect_vars(ast_node.right)
                    if hasattr(ast_node, 'operand'):
                        collect_vars(ast_node.operand)

                collect_vars(ast)
                for var_name in sorted(used_vars):
                    if var_name not in connected:
                        return _invalid_graph(
                            "MISSING_INPUT",
                            f"Input '{var_name}' is not connected",
                            nodeId=nid,
                            handle=var_name
                        )
            except InvalidFormulaError:
                pass

    return True, "SUCCESS", {}

