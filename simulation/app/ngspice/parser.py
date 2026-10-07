import re
from typing import Dict


_NUMBER_PATTERN = r"[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?"


def parse_ngspice_output(stdout: str) -> Dict[str, float]:
    """Extract node net voltages from ngspice output."""
    if not stdout:
        return {}

    results: Dict[str, float] = {}
    patterns = [
        re.compile(r"(?:v\()?([A-Za-z0-9_]+)\)?\s*=\s*" + _NUMBER_PATTERN, re.IGNORECASE),
        re.compile(r"([A-Za-z0-9_]+)\s+" + _NUMBER_PATTERN, re.IGNORECASE),
    ]

    for pattern in patterns:
        for match in pattern.finditer(stdout):
            net_name = match.group(1).lower()
            value_text = match.group(2) if match.lastindex == 2 else None
            if value_text is None:
                continue
            try:
                results[net_name] = float(value_text)
            except ValueError:
                continue

    if not results:
        for line in stdout.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if "node" in stripped.lower() and "voltage" in stripped.lower():
                continue
            if "=" in stripped:
                left, right = stripped.split("=", 1)
                net_name = left.strip().strip("vV()").strip()
                if net_name:
                    try:
                        results[net_name.lower()] = float(right.strip().split()[0])
                    except ValueError:
                        continue

    return results
