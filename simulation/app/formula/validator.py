import re

from app.formula.lexer import Lexer, InvalidFormulaError
from app.formula.parser import Parser, ASTNode


def parse_and_validate_formula(formula_str: str) -> ASTNode:
    if not formula_str or not isinstance(formula_str, str):
        raise InvalidFormulaError("Formula must be a non-empty string", code="FORMULA_INVALID_SYNTAX")

    if re.search(r"(?i)(?:^|\s|[()*/+-])(?:shell|system|process|eval|exec|control|plot|op|save|print)\b", formula_str):
        raise InvalidFormulaError("Formula contains a forbidden keyword or directive", code="FORMULA_UNSAFE_EXPRESSION")

    if re.search(r"(?i)\b(?:sin|cos|tan|sqrt|pow|abs|log|ln|exp|min|max|floor|ceil)\s*\(", formula_str):
        raise InvalidFormulaError("Unsupported function in formula", code="FORMULA_INVALID_TOKEN")

    if re.search(r"(?:\n\s*\.\w+|\s*\.\w+)", formula_str):
        raise InvalidFormulaError("Formula contains an ngspice directive", code="FORMULA_UNSAFE_EXPRESSION")

    if re.search(r"(?:;|`|\$|\|\||&&|\|)", formula_str):
        raise InvalidFormulaError("Formula contains an unsafe command separator", code="FORMULA_UNSAFE_EXPRESSION")

    lexer = Lexer(formula_str)
    tokens = lexer.tokenize()
    parser = Parser(tokens)
    ast = parser.parse()
    return ast
