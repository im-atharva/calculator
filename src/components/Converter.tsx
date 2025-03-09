import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Currency,
  Unit,
  currencies,
  units,
  categories,
  fetchExchangeRates,
  convertUnit,
} from "../lib/converters";

interface ConverterProps {
  onClose: () => void;
  initialValue?: string;
}

export function Converter({ onClose, initialValue = "0" }: ConverterProps) {
  const [mode, setMode] = useState<"currency" | "unit">("currency");
  const [amount, setAmount] = useState(initialValue);
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState<Unit>(units.length[0]);
  const [toUnit, setToUnit] = useState<Unit>(units.length[1]);
  const [fromCurrency, setFromCurrency] = useState<Currency>(currencies[0]);
  const [toCurrency, setToCurrency] = useState<Currency>(currencies[1]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(
    {}
  );
  const [result, setResult] = useState("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "currency") {
      fetchExchangeRates(fromCurrency.code).then(setExchangeRates);
    }
  }, [mode, fromCurrency.code]);

  // Auto-convert when input changes
  useEffect(() => {
    handleConvert();
  }, [amount, fromUnit, toUnit, fromCurrency, toCurrency, mode, category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and at most one decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      e.key === "." ||
      // Allow: numbers
      /^\d$/.test(e.key)
    ) {
      // Let it happen
      return;
    }
    // Block everything else
    e.preventDefault();
  };

  const handleConvert = () => {
    setError(null);
    if (!amount) {
      setResult("0");
      return;
    }

    const value = parseFloat(amount);
    if (isNaN(value)) {
      setError("Please enter a valid number");
      return;
    }

    try {
      if (mode === "currency") {
        const rate = exchangeRates[toCurrency.code];
        if (!rate) {
          setError("Exchange rate not available");
          return;
        }
        setResult((value * rate).toFixed(2));
      } else {
        const converted = convertUnit(value, fromUnit, toUnit);
        setResult(converted.toFixed(4));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setFromUnit(units[newCategory][0]);
    setToUnit(units[newCategory][1]);
    setResult("0");
  };

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-2xl shadow-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setMode("currency")}
            className={`${
              mode === "currency"
                ? "bg-[#5ad3c5] text-white"
                : "bg-[#242424] text-[#5ad3c5]"
            } border-0`}
          >
            Currency
          </Button>
          <Button
            variant="outline"
            onClick={() => setMode("unit")}
            className={`${
              mode === "unit"
                ? "bg-[#5ad3c5] text-white"
                : "bg-[#242424] text-[#5ad3c5]"
            } border-0`}
          >
            Units
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-[#e76e50] text-white border-0"
        >
          Close
        </Button>
      </div>

      {mode === "unit" && (
        <div className="flex gap-2 mb-4">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              onClick={() => handleCategoryChange(cat.id)}
              className={`${
                category === cat.id
                  ? "bg-[#e8c468] text-white"
                  : "bg-[#242424] text-[#e8c468]"
              } border-0 text-sm`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={amount}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter value"
            className="flex-1 bg-[#242424] text-white p-2 rounded-xl border-0 focus:ring-1 focus:ring-[#5ad3c5] focus:outline-none"
          />
          <select
            value={mode === "currency" ? fromCurrency.code : fromUnit.id}
            onChange={(e) => {
              if (mode === "currency") {
                setFromCurrency(
                  currencies.find((c) => c.code === e.target.value) ||
                    currencies[0]
                );
              } else {
                setFromUnit(
                  units[category].find((u) => u.id === e.target.value) ||
                    units[category][0]
                );
              }
            }}
            className="w-24 bg-[#242424] text-white p-2 rounded-xl border-0 focus:ring-1 focus:ring-[#5ad3c5] focus:outline-none"
          >
            {mode === "currency"
              ? currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))
              : units[category].map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.id.toUpperCase()}
                  </option>
                ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={result}
            readOnly
            className="flex-1 bg-[#242424] text-white p-2 rounded-xl border-0"
          />
          <select
            value={mode === "currency" ? toCurrency.code : toUnit.id}
            onChange={(e) => {
              if (mode === "currency") {
                setToCurrency(
                  currencies.find((c) => c.code === e.target.value) ||
                    currencies[1]
                );
              } else {
                setToUnit(
                  units[category].find((u) => u.id === e.target.value) ||
                    units[category][1]
                );
              }
            }}
            className="w-24 bg-[#242424] text-white p-2 rounded-xl border-0 focus:ring-1 focus:ring-[#5ad3c5] focus:outline-none"
          >
            {mode === "currency"
              ? currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))
              : units[category].map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.id.toUpperCase()}
                  </option>
                ))}
          </select>
        </div>

        {error && <div className="text-[#e76e50] text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
}
