import { useState, useEffect } from 'react';

/**
 * Countdown timer component for pending saves
 */
export function PendingSaveCountdown({ 
  startTime, 
  delay 
}: { 
  startTime: number; 
  delay: number; 
}) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Date.now() - startTime;
    return Math.max(0, delay - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, delay - elapsed);
      setRemaining(newRemaining);
      
      if (newRemaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, delay]);

  const seconds = (remaining / 1000).toFixed(1);
  const progress = ((delay - remaining) / delay) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-4 w-4">
        <svg className="h-4 w-4 -rotate-90" viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted/30"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${progress * 0.377} 100`}
            className="text-amber-500 transition-all duration-100"
          />
        </svg>
      </div>
      <span className="font-mono text-xs tabular-nums">{seconds}s</span>
    </div>
  );
}
