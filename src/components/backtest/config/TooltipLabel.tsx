import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipLabelProps {
  label: string;
  tooltip: string;
  className?: string;
  error?: boolean;
}

export function TooltipLabel({ label, tooltip, className, error }: TooltipLabelProps) {
  return (
    <div className="flex items-center gap-1">
      <Label className={cn(className, error && "text-destructive")}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}
