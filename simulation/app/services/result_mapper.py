from typing import List, Dict, Any, Set
from app.netlist.net_resolver import resolve_nets

def map_results_and_propagate(
    nodes: List[dict],
    edges: List[dict],
    net_voltages: Dict[str, float],
    initial_errors: Dict[str, dict] = None
) -> Dict[str, dict]:
    """
    Maps net voltages to node IDs and performs error propagation to downstream dependent nodes.
    Returns dict mapping node_id -> { status, value, errorCode, message, blockedBy }
    """
    initial_errors = initial_errors or {}
    node_output_nets, node_input_nets = resolve_nets(nodes, edges)
    node_map = {n["id"]: n for n in nodes}

    # Build adjacency list for downstream dependency graph (source -> targets)
    downstream: Dict[str, List[str]] = {n["id"]: [] for n in nodes}
    upstream: Dict[str, List[str]] = {n["id"]: [] for n in nodes}
    for edge in edges:
        s = edge.get("source")
        t = edge.get("target")
        if s in downstream and t in downstream:
            downstream[s].append(t)
            upstream[t].append(s)

    results: Dict[str, dict] = {}

    # Step 1: Assign initial states (success or initial error)
    for node in nodes:
        nid = node["id"]
        ntype = node.get("type")

        if nid in initial_errors:
            err = initial_errors[nid]
            results[nid] = {
                "status": "error",
                "value": None,
                "errorCode": err.get("errorCode", "EXECUTION_ERROR"),
                "message": err.get("message", "Error executing node")
            }
            continue

        out_net = node_output_nets.get(nid, "").lower()
        val = net_voltages.get(out_net)

        if ntype == "display":
            # Display node gets value from its connected input net 'a'
            in_a_net = node_input_nets.get(nid, {}).get("a", "").lower()
            val = net_voltages.get(in_a_net)

        results[nid] = {
            "status": "success",
            "value": round(val, 6) if val is not None else 0.0,
            "errorCode": None,
            "message": None
        }

    # Step 2: Propagate errors and blocks downstream
    # We use BFS / Queue starting from all error nodes
    queue: List[str] = [nid for nid, res in results.items() if res["status"] == "error"]
    visited_blocked: Set[str] = set()

    while queue:
        curr = queue.pop(0)
        curr_res = results[curr]
        blocking_source = curr

        for child in downstream[curr]:
            if child not in visited_blocked and results[child]["status"] != "error":
                results[child] = {
                    "status": "blocked",
                    "value": None,
                    "errorCode": "BLOCKED",
                    "message": f"Blocked by upstream node '{blocking_source}'",
                    "blockedBy": [blocking_source]
                }
                visited_blocked.add(child)
                queue.append(child)

    return results
