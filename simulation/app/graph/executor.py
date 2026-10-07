from typing import List, Dict, Any, Tuple, Set
from app.graph.validator import validate_graph_structure
from app.netlist.generator import generate_ngspice_netlist
from app.netlist.parser import parse_ngspice_output
from app.netlist.net_resolver import resolve_nets
from app.services.ngspice_runner import run_ngspice
from app.services.result_mapper import map_results_and_propagate
from app.formula.evaluator import evaluate_formula

def check_divide_by_zero_early(nodes: List[dict], edges: List[dict]) -> Dict[str, dict]:
    """
    Statically checks if any Divide node is explicitly fed 0 into input handle 'b'.
    Returns dict mapping divide_node_id -> error_dict.
    """
    errors = {}
    node_map = {n["id"]: n for n in nodes}

    for edge in edges:
        target_id = edge.get("target")
        target_handle = edge.get("targetHandle") or "a"
        source_id = edge.get("source")

        target_node = node_map.get(target_id)
        if target_node and target_node.get("type") == "divide" and target_handle == "b":
            source_node = node_map.get(source_id)
            if source_node and source_node.get("type") == "number":
                val = float(source_node.get("data", {}).get("value", 0))
                if val == 0:
                    errors[target_id] = {
                        "errorCode": "DIVIDE_BY_ZERO",
                        "message": "Division by zero"
                    }
    return errors

def analytical_eval_fallback(nodes: List[dict], edges: List[dict]) -> Tuple[Dict[str, float], Dict[str, dict]]:
    """
    Analytical evaluation fallback for host environments where ngspice CLI is not installed (e.g. Windows unit tests).
    In Docker container, ngspice is installed and executed directly.
    """
    node_output_nets, node_input_nets = resolve_nets(nodes, edges)
    node_map = {n["id"]: n for n in nodes}
    voltages: Dict[str, float] = {}
    initial_errors: Dict[str, dict] = {}

    # Topological sort order
    visited = set()
    order = []
    
    adj = {n["id"]: [] for n in nodes}
    for e in edges:
        s = e.get("source")
        t = e.get("target")
        if s in adj:
            adj[s].append(t)

    def dfs(u):
        visited.add(u)
        for v in adj[u]:
            if v not in visited:
                dfs(v)
        order.append(u)

    for n in nodes:
        if n["id"] not in visited:
            dfs(n["id"])

    order.reverse()

    for nid in order:
        node = node_map[nid]
        ntype = node.get("type")
        out_net = node_output_nets[nid].lower()
        in_nets = node_input_nets.get(nid, {})

        if ntype == "number":
            val = float(node.get("data", {}).get("value", 0))
            voltages[out_net] = val

        elif ntype in ("add", "multiply", "divide", "formula"):
            a_net = in_nets.get("a", "").lower()
            b_net = in_nets.get("b", "").lower()
            val_a = voltages.get(a_net, 0.0)
            val_b = voltages.get(b_net, 0.0)

            if ntype == "add":
                voltages[out_net] = val_a + val_b
            elif ntype == "multiply":
                voltages[out_net] = val_a * val_b
            elif ntype == "divide":
                if val_b == 0:
                    initial_errors[nid] = {
                        "errorCode": "DIVIDE_BY_ZERO",
                        "message": "Division by zero"
                    }
                else:
                    voltages[out_net] = val_a / val_b
            elif ntype == "formula":
                formula_str = node.get("data", {}).get("formula", "")
                try:
                    res_val = evaluate_formula(formula_str, {"a": val_a, "b": val_b})
                    voltages[out_net] = res_val
                except Exception as e:
                    initial_errors[nid] = {
                        "errorCode": "INVALID_FORMULA",
                        "message": str(e)
                    }

    return voltages, initial_errors

def build_execution_order(nodes: List[dict], edges: List[dict]) -> List[str]:
    node_ids = [node["id"] for node in nodes if "id" in node]
    adjacency = {node_id: [] for node_id in node_ids}
    indegree = {node_id: 0 for node_id in node_ids}

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source in adjacency and target in adjacency and source != target:
            adjacency[source].append(target)
            indegree[target] += 1

    ready = [node_id for node_id in node_ids if indegree[node_id] == 0]
    order: List[str] = []
    while ready:
        current = ready.pop(0)
        order.append(current)
        for neighbor in adjacency[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                ready.append(neighbor)

    return order


def build_error_response(version: int, error_code: str, details: Dict[str, Any]) -> Dict[str, Any]:
    error = details.get("error") if isinstance(details, dict) and isinstance(details.get("error"), dict) else None
    if error:
        payload_error = {"code": error.get("code", error_code), "message": error.get("message", "Graph validation failed")}
        for field in ("nodeId", "handle", "edgeId", "nodeIds"):
            if field in error:
                payload_error[field] = error[field]
        if "nodeIds" in error:
            payload_error["nodeIds"] = error["nodeIds"]
        result = {
            "version": version,
            "status": "error",
            "errorCode": error.get("code", error_code),
            "message": error.get("message", "Graph validation failed"),
            "errors": [payload_error]
        }
        if "nodeIds" in payload_error:
            result["nodeIds"] = payload_error["nodeIds"]
        if "nodeId" in payload_error:
            result["nodeId"] = payload_error["nodeId"]
        return result

    message = details.get("message") or f"Graph validation error: {error_code}"
    payload_error = {"code": error_code, "message": message}
    for field in ("nodeId", "handle", "edgeId", "nodeIds"):
        if field in details:
            payload_error[field] = details[field]
    result = {
        "version": version,
        "status": "error",
        "errorCode": error_code,
        "message": message,
        "errors": [payload_error]
    }
    if "nodeIds" in payload_error:
        result["nodeIds"] = payload_error["nodeIds"]
    if "nodeId" in payload_error:
        result["nodeId"] = payload_error["nodeId"]
    return result


def execute_simulation_graph(version: int, nodes: List[dict], edges: List[dict]) -> Dict[str, Any]:
    """
    Main entry point for Python simulation execution.
    Supports arbitrary graphs, ngspice netlist generation, cycle detection,
    divide-by-zero, formula parsing, error propagation, and result mapping.
    """
    is_valid, error_code, details = validate_graph_structure(nodes, edges)
    if not is_valid:
        if error_code == "CYCLE_DETECTED":
            cycle_nodes = details.get("nodes", details.get("nodeIds", []))
            node_results = {}
            for n in nodes:
                nid = n["id"]
                if nid in cycle_nodes:
                    node_results[nid] = {
                        "status": "error",
                        "value": None,
                        "errorCode": "CYCLE_DETECTED",
                        "message": "Node is part of a graph cycle"
                    }
                else:
                    node_results[nid] = {
                        "status": "idle",
                        "value": None,
                        "errorCode": None,
                        "message": None
                    }
            response = build_error_response(version, error_code, details)
            response.update({
                "nodes": node_results,
                "cycleNodes": cycle_nodes
            })
            return response

        if error_code in ("MISSING_INPUT", "INVALID_FORMULA", "MULTIPLE_INPUT_WIRES", "INVALID_EDGE", "INVALID_NODE_TYPE"):
            err_node_id = details.get("nodeId")
            if err_node_id:
                initial_errors = {
                    err_node_id: {
                        "errorCode": error_code,
                        "message": details.get("message") or f"Graph validation failed: {error_code}"
                    }
                }
                node_results = map_results_and_propagate(nodes, edges, {}, initial_errors)
                response = build_error_response(version, error_code, details)
                response["nodes"] = node_results
                return response

        response = build_error_response(version, error_code, details)
        response["nodes"] = {}
        return response

    initial_errors = check_divide_by_zero_early(nodes, edges)
    node_output_nets, node_input_nets = resolve_nets(nodes, edges)
    netlist_str = generate_ngspice_netlist(nodes, edges)
    ng_result = run_ngspice(netlist_str)

    if ng_result.get("ngspice_not_found"):
        voltages, fallback_errors = analytical_eval_fallback(nodes, edges)
        initial_errors.update(fallback_errors)
    else:
        if not ng_result["success"] and not initial_errors:
            stderr = ng_result.get("stderr", "")
            if "divide by zero" in stderr.lower() or "singular matrix" in stderr.lower():
                for node in nodes:
                    if node.get("type") == "divide":
                        initial_errors[node["id"]] = {
                            "errorCode": "DIVIDE_BY_ZERO",
                            "message": "Division by zero in simulation"
                        }
            else:
                return {
                    "version": version,
                    "status": "error",
                    "errorCode": "NGSPICE_ERROR",
                    "message": f"ngspice execution failed: {stderr}",
                    "nodes": {}
                }
        voltages = parse_ngspice_output(ng_result.get("stdout", ""))

    node_results = map_results_and_propagate(nodes, edges, voltages, initial_errors)
    has_node_error = any(res.get("status") == "error" for res in node_results.values())
    overall_status = "error" if has_node_error else "success"
    execution_order = build_execution_order(nodes, edges)

    display_meta = {}
    for node in nodes:
        if node.get("type") == "display":
            handle_data = node_input_nets.get(node["id"], {})
            display_meta[node["id"]] = {
                "inputNet": handle_data.get("a") or handle_data.get("in")
            }

    response = {
        "version": version,
        "status": overall_status,
        "executionStatus": "valid" if overall_status == "success" else "error",
        "executionOrder": execution_order,
        "netlist": netlist_str,
        "nodeNets": node_output_nets,
        "outputNets": node_output_nets,
        "displayInputs": display_meta,
        "nodes": node_results
    }
    return response
