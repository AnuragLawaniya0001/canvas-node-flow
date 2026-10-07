import os
import shutil
import subprocess
import tempfile
from typing import Any, Dict

NGSPICE_TIMEOUT_SECONDS = int(os.getenv("NGSPICE_TIMEOUT_SECONDS", "5"))


def run_ngspice(netlist_content: str, timeout_seconds: int | None = None) -> Dict[str, Any]:
    """Execute a netlist through ngspice in batch mode."""
    ngspice_bin = shutil.which("ngspice")
    if not ngspice_bin:
        return {
            "success": False,
            "error_code": "NGSPICE_NOT_FOUND",
            "message": "ngspice executable not found",
            "stdout": "",
            "stderr": "ngspice executable not found",
            "return_code": None,
            "timed_out": False,
        }

    timeout_value = timeout_seconds if timeout_seconds is not None else NGSPICE_TIMEOUT_SECONDS
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".cir", delete=False) as handle:
            handle.write(netlist_content)
            temp_path = handle.name

        completed = subprocess.run(
            [ngspice_bin, "-b", temp_path],
            capture_output=True,
            text=True,
            timeout=timeout_value,
            check=False,
        )

        return {
            "success": completed.returncode == 0,
            "error_code": None if completed.returncode == 0 else "NGSPICE_FAILED",
            "message": None if completed.returncode == 0 else "ngspice execution failed",
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "return_code": completed.returncode,
            "timed_out": False,
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "success": False,
            "error_code": "NGSPICE_TIMEOUT",
            "message": "ngspice process timed out",
            "stdout": exc.stdout or "",
            "stderr": exc.stderr or "ngspice process timed out",
            "return_code": None,
            "timed_out": True,
        }
    except Exception as exc:  # pragma: no cover - defensive fallback
        return {
            "success": False,
            "error_code": "NGSPICE_PROCESS_ERROR",
            "message": str(exc),
            "stdout": "",
            "stderr": str(exc),
            "return_code": None,
            "timed_out": False,
        }
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
