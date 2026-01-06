import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getVolume, setVolume, playBuySound } from '@/lib/sounds';

export function VolumeControl() {
  const [volume, setVolumeState] = useState(getVolume() * 100);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolumeState(newVolume);
    setVolume(newVolume / 100);
  };

  const handleTestSound = () => {
    playBuySound();
  };

  const isMuted = volume === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          <span className="sr-only">Volume control</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Alert Volume</span>
            <span className="text-xs text-muted-foreground">{Math.round(volume)}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={5}
            className="w-full"
          />
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full"
            onClick={handleTestSound}
          >
            Test Sound
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
