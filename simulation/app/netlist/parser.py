import re
from typing import Dict

def parse_ngspice_output(stdout: str) -> Dict[str, float]:
    """
    Parses ngspice output text to extract net voltages.
    Returns dict mapping net_name (e.g. 'net_n1') -> float voltage value.
    """
    results: Dict[str, float] = {}
    if not stdout:
        return results

    # Format 1: v(net_n1) = 2.000000e+00 or net_n1 = 2.000000e+00
    pattern1 = re.compile(r"(?:v\()?([a-zA-Z0-9_]+)\)?\s*=\s*([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)", re.IGNORECASE)
    for match in pattern1.finditer(stdout):
        net_name = match.group(1).lower()
        val_str = match.group(2)
        try:
            results[net_name] = float(val_str)
        except ValueError:
            pass

    # Format 2: Tabular output under Node / Voltage header
    in_table = False
    for line in stdout.splitlines():
        line = line.strip()
        if "node" in line.lower() and "voltage" in line.lower():
            in_table = True
            continue
        if in_table:
            if line.startswith("---") or not line:
                continue
            parts = line.split()
            if len(parts) >= 2:
                net_name = parts[0].lower()
                try:
                    val = float(parts[1])
                    if net_name not in results:
                        results[net_name] = val
                except ValueError:
                    in_table = False

    return results
