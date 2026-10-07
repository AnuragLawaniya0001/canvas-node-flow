import re


class InvalidFormulaError(Exception):
    def __init__(self, message="Formula contains unsupported syntax", detail=None, code="FORMULA_INVALID_SYNTAX"):
        super().__init__(message)
        self.message = message
        self.detail = detail
        self.code = code


class TokenType:
    NUMBER = "NUMBER"
    VAR = "VAR"
    PLUS = "PLUS"
    MINUS = "MINUS"
    MUL = "MUL"
    DIV = "DIV"
    LPAREN = "LPAREN"
    RPAREN = "RPAREN"
    EOF = "EOF"


class Token:
    def __init__(self, type_, value):
        self.type = type_
        self.value = value

    def __repr__(self):
        return f"Token({self.type}, {self.value})"


class Lexer:
    def __init__(self, text: str):
        self.text = text or ""
        self.pos = 0
        self.current_char = self.text[0] if len(self.text) > 0 else None

    def advance(self):
        self.pos += 1
        if self.pos < len(self.text):
            self.current_char = self.text[self.pos]
        else:
            self.current_char = None

    def tokenize(self):
        tokens = []
        while self.current_char is not None:
            if self.current_char.isspace():
                self.advance()
                continue

            if self.current_char in ("a", "b"):
                var_char = self.current_char
                self.advance()
                if self.current_char is not None and (self.current_char.isalpha() or self.current_char == "_"):
                    raise InvalidFormulaError(f"Unsupported identifier or keyword starting with '{var_char}'", code="FORMULA_INVALID_IDENTIFIER")
                tokens.append(Token(TokenType.VAR, var_char))
                continue

            if self.current_char.isdigit() or self.current_char == ".":
                tokens.append(self.number())
                continue

            if self.current_char == "+":
                tokens.append(Token(TokenType.PLUS, "+"))
                self.advance()
                continue

            if self.current_char == "-":
                tokens.append(Token(TokenType.MINUS, "-"))
                self.advance()
                continue

            if self.current_char == "*":
                tokens.append(Token(TokenType.MUL, "*"))
                self.advance()
                continue

            if self.current_char == "/":
                tokens.append(Token(TokenType.DIV, "/"))
                self.advance()
                continue

            if self.current_char == "(":
                tokens.append(Token(TokenType.LPAREN, "("))
                self.advance()
                continue

            if self.current_char == ")":
                tokens.append(Token(TokenType.RPAREN, ")"))
                self.advance()
                continue

            if self.current_char in (";", "!", "%", "^", "=", "?", "[", "]", "{", "}", "\\", "|", "&", "~", ":"):
                raise InvalidFormulaError(f"Unsupported token in formula: '{self.current_char}'", code="FORMULA_INVALID_TOKEN")

            if self.current_char.isalpha():
                ident = ""
                while self.current_char is not None and self.current_char.isalpha():
                    ident += self.current_char
                    self.advance()
                raise InvalidFormulaError(f"Unsupported identifier '{ident}'", code="FORMULA_INVALID_IDENTIFIER")

            if self.current_char in ("\n", "\r"):
                self.advance()
                continue

            raise InvalidFormulaError(f"Forbidden character in formula: '{self.current_char}'", code="FORMULA_INVALID_TOKEN")

        tokens.append(Token(TokenType.EOF, None))
        return tokens

    def number(self):
        num_str = ""
        dot_count = 0
        while self.current_char is not None:
            if self.current_char.isdigit():
                num_str += self.current_char
                self.advance()
                continue
            if self.current_char == ".":
                dot_count += 1
                if dot_count > 1:
                    raise InvalidFormulaError("Malformed number with multiple decimal points", code="FORMULA_INVALID_SYNTAX")
                num_str += self.current_char
                self.advance()
                continue
            if self.current_char in ("e", "E"):
                if not num_str:
                    raise InvalidFormulaError("Malformed scientific notation", code="FORMULA_INVALID_SYNTAX")
                num_str += self.current_char
                self.advance()
                if self.current_char in ("+", "-"):
                    num_str += self.current_char
                    self.advance()
                if self.current_char is None or not self.current_char.isdigit():
                    raise InvalidFormulaError("Malformed scientific notation", code="FORMULA_INVALID_SYNTAX")
                while self.current_char is not None and self.current_char.isdigit():
                    num_str += self.current_char
                    self.advance()
                continue
            break

        try:
            value = float(num_str) if "." in num_str or "e" in num_str.lower() else int(num_str)
        except ValueError as exc:
            raise InvalidFormulaError("Malformed number literal", code="FORMULA_INVALID_SYNTAX") from exc
        return Token(TokenType.NUMBER, value)

