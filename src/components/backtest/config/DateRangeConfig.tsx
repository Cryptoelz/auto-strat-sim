import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TooltipLabel, FieldError } from './TooltipLabel';

interface DateRangeConfigProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  error?: string;
}

export function DateRangeConfig({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error,
}: DateRangeConfigProps) {
  return (
    <div className="space-y-3">
      <TooltipLabel 
        label="Date Range" 
        tooltip="Historical period to test your strategy. Longer periods provide more reliable results but take longer to compute."
        className="text-sm font-medium"
      />
      <div className="grid grid-cols-2 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "justify-start text-left font-normal",
                error && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(startDate, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && onStartDateChange(date)}
              disabled={(date) => date > endDate || date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "justify-start text-left font-normal",
                error && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(endDate, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => date && onEndDateChange(date)}
              disabled={(date) => date < startDate || date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <FieldError message={error} />
    </div>
  );
}
