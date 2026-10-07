from typing import List, Dict, Set, Tuple

def detect_cycles(nodes: List[dict], edges: List[dict]) -> Tuple[bool, List[str]]:
    """
    Detects cycles in the node graph using DFS color tagging.
    Returns (has_cycle, cycle_node_ids).
    """
    node_ids = {n["id"] for n in nodes if "id" in n}
    adj: Dict[str, List[str]] = {nid: [] for nid in node_ids}

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source in adj and target in node_ids:
            adj[source].append(target)

    # 0 = WHITE (unvisited), 1 = GRAY (visiting), 2 = BLACK (visited)
    state = {nid: 0 for nid in node_ids}
    parent = {}
    cycle_nodes: Set[str] = set()

    def dfs(u: str, path: List[str]) -> bool:
        state[u] = 1 # GRAY
        path.append(u)

        for v in adj[u]:
            if state[v] == 1: # Found cycle!
                cycle_start_idx = path.index(v)
                cycle_nodes.update(path[cycle_start_idx:])
                return True
            elif state[v] == 0:
                if dfs(v, path):
                    return True

        path.pop()
        state[u] = 2 # BLACK
        return False

    has_cycle = False
    for nid in node_ids:
        if state[nid] == 0:
            if dfs(nid, []):
                has_cycle = True

    return has_cycle, sorted(list(cycle_nodes))
