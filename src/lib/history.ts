export interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

const HISTORY_KEY = "calculator_history";

export const getHistory = (): CalculationHistory[] => {
  const history = localStorage.getItem(HISTORY_KEY);
  return history ? JSON.parse(history) : [];
};

export const addToHistory = (expression: string, result: string) => {
  const history = getHistory();
  const newEntry: CalculationHistory = {
    id: Date.now().toString(),
    expression,
    result,
    timestamp: Date.now(),
  };

  // Keep only the last 100 calculations
  const updatedHistory = [newEntry, ...history].slice(0, 100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
