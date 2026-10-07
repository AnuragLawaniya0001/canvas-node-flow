from app.formula.lexer import Lexer, TokenType, InvalidFormulaError

class ASTNode:
    def to_ngspice(self, net_map: dict) -> str:
        raise NotImplementedError

    def evaluate(self, var_values: dict) -> float:
        raise NotImplementedError

class NumNode(ASTNode):
    def __init__(self, value):
        self.value = value

    def to_ngspice(self, net_map: dict) -> str:
        return str(self.value)

    def evaluate(self, var_values: dict) -> float:
        return float(self.value)

    def __repr__(self):
        return f"Num({self.value})"

class VarNode(ASTNode):
    def __init__(self, name):
        self.name = name # 'a' or 'b'

    def to_ngspice(self, net_map: dict) -> str:
        net_name = net_map.get(self.name)
        if not net_name:
            raise InvalidFormulaError(f"Variable '{self.name}' is not connected to a valid input net")
        return f"V({net_name})"

    def evaluate(self, var_values: dict) -> float:
        if self.name not in var_values or var_values[self.name] is None:
            raise InvalidFormulaError(f"Missing value for variable '{self.name}'")
        return float(var_values[self.name])

    def __repr__(self):
        return f"Var({self.name})"

class BinOpNode(ASTNode):
    def __init__(self, left: ASTNode, op: str, right: ASTNode):
        self.left = left
        self.op = op
        self.right = right

    def to_ngspice(self, net_map: dict) -> str:
        l_str = self.left.to_ngspice(net_map)
        r_str = self.right.to_ngspice(net_map)
        return f"({l_str} {self.op} {r_str})"

    def evaluate(self, var_values: dict) -> float:
        l_val = self.left.evaluate(var_values)
        r_val = self.right.evaluate(var_values)
        if self.op == '+':
            return l_val + r_val
        elif self.op == '-':
            return l_val - r_val
        elif self.op == '*':
            return l_val * r_val
        elif self.op == '/':
            if r_val == 0:
                raise ZeroDivisionError("Division by zero in formula evaluation")
            return l_val / r_val
        raise InvalidFormulaError(f"Unknown operator {self.op}")

    def __repr__(self):
        return f"BinOp({self.left} {self.op} {self.right})"

class UnaryOpNode(ASTNode):
    def __init__(self, op: str, operand: ASTNode):
        self.op = op
        self.operand = operand

    def to_ngspice(self, net_map: dict) -> str:
        val_str = self.operand.to_ngspice(net_map)
        return f"({self.op}{val_str})"

    def evaluate(self, var_values: dict) -> float:
        val = self.operand.evaluate(var_values)
        if self.op == '+':
            return val
        elif self.op == '-':
            return -val
        raise InvalidFormulaError(f"Unknown unary operator {self.op}")

    def __repr__(self):
        return f"UnaryOp({self.op}{self.operand})"

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0
        self.current_token = tokens[0] if len(tokens) > 0 else None

    def advance(self):
        self.pos += 1
        if self.pos < len(self.tokens):
            self.current_token = self.tokens[self.pos]
        else:
            self.current_token = None

    def parse(self) -> ASTNode:
        if not self.current_token or self.current_token.type == TokenType.EOF:
            raise InvalidFormulaError("Empty formula")
        node = self.expr()
        if self.current_token and self.current_token.type != TokenType.EOF:
            raise InvalidFormulaError("Unexpected tokens at end of formula")
        return node

    def expr(self) -> ASTNode:
        node = self.term()
        while self.current_token and self.current_token.type in (TokenType.PLUS, TokenType.MINUS):
            op_token = self.current_token
            self.advance()
            right = self.term()
            node = BinOpNode(node, op_token.value, right)
        return node

    def term(self) -> ASTNode:
        node = self.factor()
        while self.current_token and self.current_token.type in (TokenType.MUL, TokenType.DIV):
            op_token = self.current_token
            self.advance()
            right = self.factor()
            node = BinOpNode(node, op_token.value, right)
        return node

    def factor(self) -> ASTNode:
        token = self.current_token
        if not token or token.type == TokenType.EOF:
            raise InvalidFormulaError("Unexpected end of formula")

        if token.type in (TokenType.PLUS, TokenType.MINUS):
            self.advance()
            operand = self.factor()
            return UnaryOpNode(token.value, operand)

        if token.type == TokenType.NUMBER:
            self.advance()
            return NumNode(token.value)

        if token.type == TokenType.VAR:
            self.advance()
            return VarNode(token.value)

        if token.type == TokenType.LPAREN:
            self.advance()
            node = self.expr()
            if not self.current_token or self.current_token.type != TokenType.RPAREN:
                raise InvalidFormulaError("Missing closing parenthesis ')'")
            self.advance()
            return node

        raise InvalidFormulaError(f"Unexpected token '{token.value}'")
