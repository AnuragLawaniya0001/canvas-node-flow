from app.formula.validator import parse_and_validate_formula
from app.formula.lexer import InvalidFormulaError

def evaluate_formula(formula_str: str, var_values: dict) -> float:
    ast = parse_and_validate_formula(formula_str)
    return ast.evaluate(var_values)

def formula_to_ngspice(formula_str: str, net_map: dict) -> str:
    ast = parse_and_validate_formula(formula_str)
    return ast.to_ngspice(net_map)
