export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Unit {
  id: string;
  name: string;
  category: string;
  conversionToBase: (value: number) => number;
  conversionFromBase: (value: number) => number;
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

export const units: Record<string, Unit[]> = {
  length: [
    {
      id: "m",
      name: "Meters",
      category: "length",
      conversionToBase: (value) => value,
      conversionFromBase: (value) => value,
    },
    {
      id: "km",
      name: "Kilometers",
      category: "length",
      conversionToBase: (value) => value * 1000,
      conversionFromBase: (value) => value / 1000,
    },
    {
      id: "cm",
      name: "Centimeters",
      category: "length",
      conversionToBase: (value) => value / 100,
      conversionFromBase: (value) => value * 100,
    },
    {
      id: "ft",
      name: "Feet",
      category: "length",
      conversionToBase: (value) => value * 0.3048,
      conversionFromBase: (value) => value / 0.3048,
    },
    {
      id: "in",
      name: "Inches",
      category: "length",
      conversionToBase: (value) => value * 0.0254,
      conversionFromBase: (value) => value / 0.0254,
    },
  ],
  weight: [
    {
      id: "kg",
      name: "Kilograms",
      category: "weight",
      conversionToBase: (value) => value,
      conversionFromBase: (value) => value,
    },
    {
      id: "g",
      name: "Grams",
      category: "weight",
      conversionToBase: (value) => value / 1000,
      conversionFromBase: (value) => value * 1000,
    },
    {
      id: "lb",
      name: "Pounds",
      category: "weight",
      conversionToBase: (value) => value * 0.453592,
      conversionFromBase: (value) => value / 0.453592,
    },
    {
      id: "oz",
      name: "Ounces",
      category: "weight",
      conversionToBase: (value) => value * 0.0283495,
      conversionFromBase: (value) => value / 0.0283495,
    },
  ],
  temperature: [
    {
      id: "c",
      name: "Celsius",
      category: "temperature",
      conversionToBase: (value) => value,
      conversionFromBase: (value) => value,
    },
    {
      id: "f",
      name: "Fahrenheit",
      category: "temperature",
      conversionToBase: (value) => (value - 32) * (5 / 9),
      conversionFromBase: (value) => (value * 9) / 5 + 32,
    },
    {
      id: "k",
      name: "Kelvin",
      category: "temperature",
      conversionToBase: (value) => value - 273.15,
      conversionFromBase: (value) => value + 273.15,
    },
  ],
};

export const categories = [
  { id: "length", name: "Length" },
  { id: "weight", name: "Weight" },
  { id: "temperature", name: "Temperature" },
];

export async function fetchExchangeRates(
  base: string = "USD"
): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`
    );
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return {};
  }
}

export function convertUnit(
  value: number,
  fromUnit: Unit,
  toUnit: Unit
): number {
  if (fromUnit.category !== toUnit.category) {
    throw new Error("Cannot convert between different unit categories");
  }

  // Convert to base unit first, then to target unit
  const baseValue = fromUnit.conversionToBase(value);
  return toUnit.conversionFromBase(baseValue);
}
