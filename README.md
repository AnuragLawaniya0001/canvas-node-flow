# Live Node Graph Engine / Live Circuit Simulator

A high-performance, real-time, browser-based visual node graph engine and electrical circuit simulator built with React Flow, Node.js Express, Python FastAPI, MongoDB, Docker, and ngspice.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User UI)                      │
│                    React + React Flow                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
                               v
┌─────────────────────────────────────────────────────────────┐
│                     Node.js + Express API                   │
│   • Graph Persistence (MongoDB)                             │
│   • Endpoint Proxying                                       │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ Mongoose                     │ HTTP (Internal)
               v                              v
┌──────────────────────────────┐┌──────────────────────────────┐
│           MongoDB            ││       Python + FastAPI       │
│  Stores nodes, edges, state  ││  • AST Formula Lexer/Parser  │
└──────────────────────────────┘│  • Graph Validation & DFS    │
                                │  • ngspice Netlist Generator │
                                └──────────────┬───────────────┘
                                               │ subprocess: ngspice -b
                                               v
                                ┌──────────────────────────────┐
                                │           ngspice            │
                                │   Batch Simulation Engine    │
                                └──────────────────────────────┘
```

> **Security Rule Enforced**: React frontend NEVER communicates directly with Python. Only Python executes ngspice in batch mode (`ngspice -b`).

## 📁 Project Structure

```text
api/
  src/
    config/       MongoDB connection
    controllers/  HTTP request handlers
    models/       MongoDB schemas
    routes/       API routes
    services/     Persistence and simulation proxy
    validators/   Request validation
frontend/
  src/
    components/   Header, palette, and status UI
    hooks/        Graph state and execution
    nodes/        React Flow node components
    services/     API client
    utils/        Graph validation
simulation/
  app/
    formula/      Safe formula lexer/parser/validator
    graph/        Graph validation and cycle detection
    netlist/      ngspice netlist generation
    ngspice/      Simulation runner and output parser
    services/     Simulation orchestration
docker-compose.yml
```

---

## 🚀 How to Run

Ensure Docker and Docker Compose are installed, then run:

```bash
docker compose up --build
```

Docker Compose supplies the service connection settings directly. No `.env` file is required.

### Exposed Services:
- **Frontend App**: `http://localhost:3000`
- **Node.js Express API**: `http://localhost:3001` (`/health`, `/api/graphs`, `/api/simulate`)
- **Python FastAPI Service**: `http://localhost:8000` (`/health`, `/simulate`)
- **MongoDB**: `localhost:27017`

---

## ⚡ Graph → ngspice Netlist Mapping

The Python service maps arbitrary node graphs into shared electrical voltage nets using deterministic net naming (`net_<node_id>`):

1. **Number Node**: Generates a DC Voltage Source:
   `V_<node_id> net_<node_id> 0 DC <value>`
2. **Add Node**: Generates a Behavioral Voltage Source:
   `B_<node_id> net_<node_id> 0 V = V(<net_a>) + V(<net_b>)`
3. **Multiply Node**: Generates a Behavioral Voltage Source:
   `B_<node_id> net_<node_id> 0 V = V(<net_a>) * V(<net_b>)`
4. **Divide Node**: Generates a Behavioral Voltage Source:
   `B_<node_id> net_<node_id> 0 V = V(<net_a>) / V(<net_b>)`
5. **Formula Node**: Generates a Behavioral Source from validated AST:
   `B_<node_id> net_<node_id> 0 V = <ngspice_expr>`
6. **Display Node**: Reads input net voltage from ngspice analysis output.

Netlist execution block:
```cir
.op
.control
run
print all
.endc
.end
```

---

## 🔄 Cycle Detection

Cycle detection uses Depth First Search (DFS) with three-color node tagging (WHITE/GRAY/BLACK) in `simulation/app/graph/`.
If a directed cycle (e.g. `Add -> Multiply -> Add`) is detected:
- The graph is rejected before calling ngspice.
- Returns `errorCode: "CYCLE_DETECTED"` and the involved node IDs.
- The UI highlights all cycle nodes in orange/yellow.

---

## 🛡️ Execution & Stale Response Protection

Simulation runs only when the user selects **Run**. Each graph mutation updates its version, and stale or cancelled responses are ignored so an older run cannot overwrite newer results.

---

## 🔒 Formula Security & ngspice Injection Protection

Formula nodes allow users to specify expressions like `a * 2 + b`. To prevent arbitrary code execution or ngspice directive injection (e.g., `a + b\n.control\nshell ls`):
1. **No `eval()` or `exec()`**: Neither JavaScript nor Python dynamic code execution is ever used.
2. **Custom Recursive Descent AST Parser**: `simulation/app/formula/` implements a strict tokenizing Lexer and AST Parser.
3. **Strict Allowed Grammar**:
   - Variables: `a`, `b`
   - Numbers: integers & floats
   - Operators: `+`, `-`, `*`, `/`, `(`, `)`
4. **Instant Rejection**: Any forbidden character, shell directive, dot commands, or unknown identifiers raise `InvalidFormulaError` (`errorCode: "INVALID_FORMULA"`).

---

## 🚫 Error Propagation & Service Recovery

- **Divide by Zero**: Mark `Divide` node as `error` (`DIVIDE_BY_ZERO`). All downstream dependent nodes (e.g. `Display`) transition to `blocked` state and their old displayed values are cleared.
- **Backend/ngspice Failure**: If Python or ngspice fails or times out, the Node API returns a structured error. The UI reports the error while keeping the editor available. Run again after the service recovers.

---

## ⚠️ Known Limitations

1. **Analytic AC/Transient Simulation**: The current engine runs DC operating point (`.op`) analysis. AC frequency sweep and transient time domain analysis can be added by extending netlist directives.
2. **Node Palette Extension**: The architecture uses centralized `nodeDefinitions.js` and `generator.py`, making it trivial to add `Subtract` or `Square` nodes.

---
