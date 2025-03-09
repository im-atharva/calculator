import { Button } from "./ui/button";
import { CalculationHistory, formatTimestamp } from "../lib/history";

interface HistoryProps {
  history: CalculationHistory[];
  onClearHistory: () => void;
  onHistoryItemClick: (expression: string, result: string) => void;
}

export function History({
  history,
  onClearHistory,
  onHistoryItemClick,
}: HistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center p-4 text-white/60">
        No calculation history
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-white/80 text-sm font-medium">History</h2>
        <Button
          variant="outline"
          onClick={onClearHistory}
          className="h-7 px-2 text-xs bg-[#e76e50]/10 hover:bg-[#e76e50]/20 text-[#e76e50] border-0"
        >
          Clear All
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5 pr-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onHistoryItemClick(item.expression, item.result)}
              className="w-full text-left p-2 rounded-lg bg-[#242424] hover:bg-[#2a2a2a] transition-colors group"
            >
              <div className="flex justify-between items-start">
                <span className="text-white/60 text-xs">
                  {formatTimestamp(item.timestamp)}
                </span>
                <span className="text-[#5ad3c5] text-sm font-medium group-hover:text-[#5ad3c5]/80">
                  {item.result}
                </span>
              </div>
              <div className="text-white/80 text-xs truncate mt-0.5">
                {item.expression}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
