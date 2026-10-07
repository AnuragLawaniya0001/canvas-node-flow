import subprocess
import tempfile
import os
import shutil
from typing import Dict, Any

def run_ngspice(netlist_content: str, timeout_seconds: int = 5) -> Dict[str, Any]:
    """
    Executes ngspice in batch mode (-b) with temporary netlist file.
    If ngspice is not installed on host environment, reports ngspice_not_found.
    """
    if not shutil.which("ngspice"):
        return {
            "success": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": "ngspice executable not found on host system",
            "timed_out": False,
            "ngspice_not_found": True
        }

    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".cir", delete=False) as f:
            f.write(netlist_content)
            temp_file = f.name

        cmd = ["ngspice", "-b", temp_file]
        process = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_seconds
        )

        stdout = process.stdout
        stderr = process.stderr
        return {
            "success": process.returncode == 0,
            "exit_code": process.returncode,
            "stdout": stdout,
            "stderr": stderr,
            "timed_out": False,
            "ngspice_not_found": False
        }

    except subprocess.TimeoutExpired as e:
        return {
            "success": False,
            "exit_code": -1,
            "stdout": e.stdout or "",
            "stderr": "ngspice process timed out",
            "timed_out": True,
            "ngspice_not_found": False
        }
    except FileNotFoundError:
        return {
            "success": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": "ngspice executable not found",
            "timed_out": False,
            "ngspice_not_found": True
        }
    except Exception as e:
        return {
            "success": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": str(e),
            "timed_out": False,
            "ngspice_not_found": False
        }
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except OSError:
                pass
