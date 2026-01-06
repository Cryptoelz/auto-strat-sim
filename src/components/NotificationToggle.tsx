import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NotificationToggleProps {
  permission: NotificationPermission;
  isSupported: boolean;
  onRequestPermission: () => void;
}

export function NotificationToggle({
  permission,
  isSupported,
  onRequestPermission,
}: NotificationToggleProps) {
  if (!isSupported) {
    return null;
  }

  const getIcon = () => {
    switch (permission) {
      case 'granted':
        return <BellRing className="h-4 w-4" />;
      case 'denied':
        return <BellOff className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTooltip = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked in browser';
      default:
        return 'Enable notifications';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={onRequestPermission}
            disabled={permission === 'denied'}
          >
            {getIcon()}
            <span className="sr-only">{getTooltip()}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
