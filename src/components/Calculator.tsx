import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import {
  operations,
  formatResult,
  isAdvancedOperation,
  keyboardMap,
} from "../lib/calculations";
import { History } from "./History";
import { Converter } from "./Converter";
import {
  CalculationHistory,
  addToHistory,
  getHistory,
  clearHistory,
} from "../lib/history";

interface CalculatorProps {
  className?: string;
}

export function Calculator({ className }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [displayPrefix, setDisplayPrefix] = useState<string>("");
  const [history, setHistory] = useState<CalculationHistory[]>(getHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [showConverter, setShowConverter] = useState(false);

  const handleNumberInput = (num: string) => {
    setError(null);

    if (num === "." && display.includes(".")) {
      return; // Prevent multiple decimal points
    }

    if (shouldResetDisplay) {
      setDisplay(num === "." ? "0." : num);
      setShouldResetDisplay(false);
    } else {
      // Prevent leading zeros and handle maximum length
      if (display.length >= 16) {
        setError("Maximum input length reached");
        return;
      }
      if (display === "0" && num !== ".") {
        setDisplay(num);
      } else {
        setDisplay(display + num);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleOperation = (op: string) => {
    setError(null);
    const isAdvanced = isAdvancedOperation(op);
    const currentOp = operations[op];

    try {
      if (op === "π") {
        setDisplay(Math.PI.toString());
        setShouldResetDisplay(true);
        return;
      }

      const current = parseFloat(display);

      if (isAdvanced) {
        if (currentOp.displayPrefix) {
          // For operations like sin, cos, log that need input after the operator
          setDisplayPrefix(currentOp.displayPrefix);
          setPendingOperation(op);
          setDisplay("0");
          return;
        } else if (currentOp.needsSecondOperand) {
          // For operations like x^y that need two operands
          setPreviousValue(display);
          setOperation(op);
          setShouldResetDisplay(true);
          setDisplayPrefix(currentOp.format ? currentOp.format(current) : "");
          return;
        } else if (currentOp.format) {
          // For operations like x² that format the display
          setDisplayPrefix(currentOp.format(current));
        }

        // Validate input if required
        if (currentOp.validateInput) {
          currentOp.validateInput(current);
        }

        // Calculate immediately for single-operand operations
        const result = currentOp.execute(current);
        setDisplay(formatResult(result));
        setShouldResetDisplay(true);
        setDisplayPrefix("");
      } else {
        if (previousValue === null) {
          setPreviousValue(display);
          setOperation(op);
          setShouldResetDisplay(true);
        } else {
          // Calculate result of previous operation
          const result = calculateResult();
          setPreviousValue(result);
          setDisplay(result);
          setOperation(op);
          setShouldResetDisplay(true);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid operation");
      }
      setDisplayPrefix("");
      setPendingOperation(null);
    }
  };

  const calculateResult = (): string => {
    if (pendingOperation) {
      // Handle pending advanced operations
      const current = parseFloat(display);
      const op = operations[pendingOperation];

      try {
        if (op.validateInput) {
          op.validateInput(current);
        }
        const result = op.execute(current);
        setPendingOperation(null);
        setDisplayPrefix("");
        return formatResult(result);
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error("Calculation error");
      }
    }

    if (!previousValue || !operation || !operations[operation]) return display;

    try {
      const prev = parseFloat(previousValue);
      const current = parseFloat(display);
      const result = operations[operation].execute(prev, current);
      setDisplayPrefix("");
      return formatResult(result);
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Calculation error");
    }
  };

  const handleEquals = () => {
    if ((!operation && !pendingOperation) || (operation && !previousValue))
      return;

    try {
      const result = calculateResult();
      setDisplay(result);
      setPreviousValue(null);
      setOperation(null);
      setPendingOperation(null);
      setDisplayPrefix("");
      setShouldResetDisplay(true);

      // Add to history
      const expression = pendingOperation
        ? `${pendingOperation}(${display})`
        : `${previousValue} ${operation} ${display}`;
      const updatedHistory = addToHistory(expression, result);
      setHistory(updatedHistory);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Calculation error");
      }
    }
  };

  const handleHistoryItemClick = (expression: string, result: string) => {
    setDisplay(result);
    setPreviousValue(null);
    setOperation(null);
    setPendingOperation(null);
    setDisplayPrefix("");
    setShouldResetDisplay(true);
    setError(null);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(false);
    setError(null);
    setPendingOperation(null);
    setDisplayPrefix("");
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore keyboard events if converter is open
      if (showConverter) return;

      event.preventDefault();
      const key = event.key;

      // Handle numbers and decimal
      if (/^[0-9.]$/.test(key)) {
        handleNumberInput(key);
        return;
      }

      // Handle mapped operations
      if (key in keyboardMap) {
        const op = keyboardMap[key];
        if (op === "=") {
          handleEquals();
        } else if (op === "AC") {
          handleClear();
        } else if (op === "←") {
          handleBackspace();
        } else {
          handleOperation(op);
        }
      }
    },
    [display, operation, previousValue, showConverter]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center pt-2">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#5ad3c5] tracking-wider">
        Superr Calculator App
      </h1>
      <div className="flex flex-col lg:flex-row gap-3 w-full max-w-[720px]">
        <div className="flex flex-col gap-3">
          <div
            className={`calculator w-full lg:w-[350px] ${
              className || ""
            } bg-[#1a1a1a] p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e76e50]/10`}
          >
            {/* Display */}
            <div className="display bg-[#242424] text-right p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
              <div className="previous-operation text-[#e76e50]/60 text-xs sm:text-sm h-4 sm:h-5 font-medium">
                {previousValue && `${previousValue} ${operation}`}
              </div>
              <div className="flex flex-col items-end">
                {error && (
                  <div className="text-white/80 text-xs sm:text-sm font-normal mb-1">
                    {error}
                  </div>
                )}
                <div className="current-value text-white text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {displayPrefix}
                  {display}
                </div>
              </div>
            </div>

            {/* Advanced Functions */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {[
                "^",
                "sqrt",
                "x²",
                "x^(1/y)",
                "%",
                "sin",
                "cos",
                "tan",
                "log",
                "ln",
                "exp",
                "π",
              ].map((op) => (
                <Button
                  key={op}
                  variant="outline"
                  onClick={() => handleOperation(op)}
                  className="bg-[#e8c468] hover:bg-[#e8c468]/90 text-white border-0 h-8 sm:h-10 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-colors"
                >
                  {operations[op].symbol}
                </Button>
              ))}
            </div>

            {/* Basic Keypad */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                onClick={handleClear}
                className="col-span-2 bg-[#5e9db5] hover:bg-[#5e9db5]/90 text-white border-0 h-10 sm:h-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-colors"
              >
                AC
              </Button>
              <Button
                variant="outline"
                onClick={handleBackspace}
                className="bg-[#5e9db5] hover:bg-[#5e9db5]/90 text-white border-0 h-10 sm:h-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-colors"
              >
                ←
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOperation("÷")}
                className="bg-[#5ad3c5] hover:bg-[#5ad3c5]/90 text-white border-0 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-lg sm:rounded-xl transition-colors"
              >
                ÷
              </Button>

              {[7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => handleNumberInput(num.toString())}
                  className="bg-[#242424] hover:bg-[#2a2a2a] text-white border-0 h-10 sm:h-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-colors active:scale-95"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handleOperation("×")}
                className="bg-[#5ad3c5] hover:bg-[#5ad3c5]/90 text-white border-0 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-lg sm:rounded-xl transition-colors"
              >
                ×
              </Button>

              {[4, 5, 6].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => handleNumberInput(num.toString())}
                  className="bg-[#242424] hover:bg-[#2a2a2a] text-white border-0 h-10 sm:h-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-colors active:scale-95"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handleOperation("-")}
                className="bg-[#5ad3c5] hover:bg-[#5ad3c5]/90 text-white border-0 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-lg sm:rounded-xl transition-colors"
              >
                -
              </Button>

              {[1, 2, 3].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => handleNumberInput(num.toString())}
                  className="bg-[#242424] hover:bg-[#2a2a2a] text-white border-0 h-10 sm:h-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-colors active:scale-95"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handleOperation("+")}
                className="bg-[#5ad3c5] hover:bg-[#5ad3c5]/90 text-white border-0 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-lg sm:rounded-xl transition-colors"
              >
                +
              </Button>

              <Button
                variant="outline"
                onClick={() => handleNumberInput("0")}
                className="col-span-2 bg-[#242424] hover:bg-[#2a2a2a] text-white border-0 h-10 sm:h-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-colors active:scale-95"
              >
                0
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumberInput(".")}
                className="bg-[#242424] hover:bg-[#2a2a2a] text-white border-0 h-10 sm:h-12 text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-colors active:scale-95"
              >
                .
              </Button>
              <Button
                variant="outline"
                onClick={handleEquals}
                className="bg-[#e76e50] hover:bg-[#e76e50]/90 text-white border-0 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-lg sm:rounded-xl transition-colors"
              >
                =
              </Button>
            </div>
          </div>

          {/* Converter Toggle Button */}
          <button
            onClick={() => setShowConverter(!showConverter)}
            className="w-full bg-[#1a1a1a] p-2 rounded-xl text-[#5ad3c5] text-sm font-medium hover:bg-[#242424] transition-colors"
          >
            {showConverter ? "Hide Converter" : "Show Converter"}
          </button>

          {/* Converter Panel */}
          {showConverter && (
            <Converter
              onClose={() => setShowConverter(false)}
              initialValue={display}
            />
          )}
        </div>

        {/* History Toggle Button (Mobile Only) */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="lg:hidden w-full bg-[#1a1a1a] p-2 rounded-xl text-[#5ad3c5] text-sm font-medium hover:bg-[#242424] transition-colors mt-2"
        >
          {showHistory ? "Hide History" : "Show History"}
        </button>

        {/* History Panel */}
        <div
          className={`w-full lg:w-[350px] bg-[#1a1a1a] p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e76e50]/10 ${
            showHistory ? "block" : "hidden"
          } lg:block`}
        >
          <History
            history={history}
            onClearHistory={handleClearHistory}
            onHistoryItemClick={handleHistoryItemClick}
          />
        </div>
      </div>
    </div>
  );
}
