from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.graph.executor import execute_simulation_graph

router = APIRouter()

class SimulationRequest(BaseModel):
    version: int = Field(default=1, description="Monotonically increasing graph state version")
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)

@router.post("/simulate")
def simulate_graph(req: SimulationRequest):
    try:
        result = execute_simulation_graph(req.version, req.nodes, req.edges)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
