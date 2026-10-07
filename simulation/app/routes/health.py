from fastapi import APIRouter
import shutil
import subprocess

router = APIRouter()

@router.get("/health")
def health_check():
    ngspice_path = shutil.which("ngspice")
    ngspice_available = False
    version_info = "Not found"

    if ngspice_path:
        try:
            res = subprocess.run(["ngspice", "-v"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2)
            ngspice_available = True
            version_info = res.stdout.splitlines()[0] if res.stdout else "Available"
        except Exception as e:
            version_info = str(e)

    return {
        "status": "ok",
        "service": "simulation",
        "ngspice": ngspice_available,
        "ngspiceVersion": version_info
    }
