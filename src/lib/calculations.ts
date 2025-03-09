type OperationType = "basic" | "advanced";

export interface Operation {
  symbol: string;
  type: OperationType;
  execute: (a: number, b?: number) => number;
  validateInput?: (a: number) => void;
  format?: (a: number) => string;
  needsSecondOperand?: boolean;
  displayPrefix?: string;
}

// Utility functions for validation
const validatePositive = (n: number) => {
  if (n <= 0) throw new Error("Input must be positive");
};

const validateNonNegative = (n: number) => {
  if (n < 0) throw new Error("Input cannot be negative");
};

const validateTangent = (degrees: number) => {
  const normalized = degrees % 360;
  if (normalized === 90 || normalized === 270) {
    throw new Error("Tangent is undefined at 90° and 270°");
  }
};

export const operations: Record<string, Operation> = {
  "+": {
    symbol: "+",
    type: "basic",
    execute: (a, b = 0) => a + b,
  },
  "-": {
    symbol: "-",
    type: "basic",
    execute: (a, b = 0) => a - b,
  },
  "×": {
    symbol: "×",
    type: "basic",
    execute: (a, b = 0) => a * b,
  },
  "÷": {
    symbol: "÷",
    type: "basic",
    execute: (a, b = 1) => {
      if (b === 0) throw new Error("Cannot divide by zero");
      return a / b;
    },
  },
  "^": {
    symbol: "xʸ",
    type: "advanced",
    execute: (a, b = 1) => {
      const result = Math.pow(a, b);
      if (!Number.isFinite(result)) {
        throw new Error("Result is too large or undefined");
      }
      return result;
    },
    needsSecondOperand: true,
    format: (a) => `${a}^`,
  },
  sqrt: {
    symbol: "√",
    type: "advanced",
    validateInput: validateNonNegative,
    execute: (a) => Math.sqrt(a),
    displayPrefix: "√",
  },
  "x²": {
    symbol: "x²",
    type: "advanced",
    execute: (a) => a * a,
    format: (a) => `${a}²`,
  },
  "x^(1/y)": {
    symbol: "x^(1/y)",
    type: "advanced",
    execute: (a, b = 2) => {
      if (b === 0) throw new Error("Root cannot be zero");
      const result = Math.pow(a, 1 / b);
      if (!Number.isFinite(result)) {
        throw new Error("Result is undefined or infinite");
      }
      if (b % 2 === 0 && a < 0) {
        throw new Error("Even root of negative number is undefined");
      }
      return result;
    },
    needsSecondOperand: true,
    format: (a) => `${a}^(1/`,
  },
  "1/x": {
    symbol: "1/x",
    type: "advanced",
    execute: (a) => {
      if (a === 0) throw new Error("Cannot divide by zero");
      return 1 / a;
    },
    format: (a) => `1/${a}`,
  },
  "%": {
    symbol: "%",
    type: "advanced",
    execute: (a) => a / 100,
    format: (a) => `${a}%`,
  },
  sin: {
    symbol: "sin",
    type: "advanced",
    execute: (degrees) => {
      const radians = ((degrees % 360) * Math.PI) / 180;
      return parseFloat(Math.sin(radians).toFixed(10));
    },
    displayPrefix: "sin(",
  },
  cos: {
    symbol: "cos",
    type: "advanced",
    execute: (degrees) => {
      const radians = ((degrees % 360) * Math.PI) / 180;
      return parseFloat(Math.cos(radians).toFixed(10));
    },
    displayPrefix: "cos(",
  },
  tan: {
    symbol: "tan",
    type: "advanced",
    validateInput: validateTangent,
    execute: (degrees) => {
      const radians = ((degrees % 360) * Math.PI) / 180;
      return parseFloat(Math.tan(radians).toFixed(10));
    },
    displayPrefix: "tan(",
  },
  log: {
    symbol: "log",
    type: "advanced",
    validateInput: validatePositive,
    execute: (a) => Math.log10(a),
    displayPrefix: "log(",
  },
  ln: {
    symbol: "ln",
    type: "advanced",
    validateInput: validatePositive,
    execute: (a) => Math.log(a),
    displayPrefix: "ln(",
  },
  exp: {
    symbol: "eˣ",
    type: "advanced",
    execute: (a) => Math.exp(a),
    displayPrefix: "e^",
  },
  π: {
    symbol: "π",
    type: "advanced",
    execute: () => Math.PI,
  },
};

export const formatResult = (result: number): string => {
  if (!Number.isFinite(result)) {
    throw new Error("Result is undefined or infinite");
  }

  // Handle very small or very large numbers
  if (Math.abs(result) < 1e-10 && result !== 0) {
    return result.toExponential(4);
  }
  if (Math.abs(result) > 1e10) {
    return result.toExponential(4);
  }

  const resultStr = result.toString();
  if (resultStr.includes(".")) {
    // Limit to 8 decimal places and remove trailing zeros
    return parseFloat(result.toFixed(8)).toString();
  }
  return resultStr;
};

export const isAdvancedOperation = (op: string): boolean => {
  return operations[op]?.type === "advanced";
};

// Keyboard mapping for calculator operations
export const keyboardMap: Record<string, string> = {
  "+": "+",
  "-": "-",
  "*": "×",
  "/": "÷",
  "^": "^",
  Enter: "=",
  "=": "=",
  Escape: "AC",
  Backspace: "←",
  s: "sin",
  c: "cos",
  t: "tan",
  l: "log",
  p: "π",
  r: "sqrt",
  q: "x²",
};
