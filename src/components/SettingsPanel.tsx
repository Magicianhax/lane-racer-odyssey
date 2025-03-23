
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Volume, VolumeX, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SoundSettings = {
  masterVolume: number;
  engineVolume: number;
  effectsVolume: number;
  uiVolume: number;
  isSoundEnabled: boolean;
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  soundSettings: SoundSettings;
  onSoundSettingsChange: (newSettings: Partial<SoundSettings>) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  soundSettings,
  onSoundSettingsChange,
}) => {
  if (!isOpen) return null;

  const handleMasterVolumeChange = (value: number[]) => {
    onSoundSettingsChange({ masterVolume: value[0] });
  };

  const handleEngineVolumeChange = (value: number[]) => {
    onSoundSettingsChange({ engineVolume: value[0] });
  };

  const handleEffectsVolumeChange = (value: number[]) => {
    onSoundSettingsChange({ effectsVolume: value[0] });
  };

  const handleUIVolumeChange = (value: number[]) => {
    onSoundSettingsChange({ uiVolume: value[0] });
  };

  const toggleSound = () => {
    onSoundSettingsChange({ isSoundEnabled: !soundSettings.isSoundEnabled });
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glassmorphism rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-scale-in border border-[#91d3d1]/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full hover:bg-[#91d3d1]/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="master-sound-toggle" className="text-lg">Sound</Label>
              <Switch 
                id="master-sound-toggle" 
                checked={soundSettings.isSoundEnabled}
                onCheckedChange={toggleSound}
                className="data-[state=checked]:bg-[#91d3d1]"
              />
            </div>

            <div className={cn("space-y-6", !soundSettings.isSoundEnabled && "opacity-50 pointer-events-none")}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="master-volume" className="flex items-center">
                    <Volume className="mr-2 h-4 w-4" />
                    Master Volume
                  </Label>
                  <span className="text-sm">{Math.round(soundSettings.masterVolume * 100)}%</span>
                </div>
                <Slider 
                  id="master-volume"
                  defaultValue={[soundSettings.masterVolume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleMasterVolumeChange}
                  className="[&>.relative]:bg-[#91d3d1]/30 [&_[data-state=active]]:bg-[#91d3d1]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="engine-volume">Engine Volume</Label>
                  <span className="text-sm">{Math.round(soundSettings.engineVolume * 100)}%</span>
                </div>
                <Slider 
                  id="engine-volume"
                  defaultValue={[soundSettings.engineVolume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleEngineVolumeChange}
                  className="[&>.relative]:bg-[#91d3d1]/30 [&_[data-state=active]]:bg-[#91d3d1]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="effects-volume">Sound Effects</Label>
                  <span className="text-sm">{Math.round(soundSettings.effectsVolume * 100)}%</span>
                </div>
                <Slider 
                  id="effects-volume"
                  defaultValue={[soundSettings.effectsVolume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleEffectsVolumeChange}
                  className="[&>.relative]:bg-[#91d3d1]/30 [&_[data-state=active]]:bg-[#91d3d1]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ui-volume">UI Sounds</Label>
                  <span className="text-sm">{Math.round(soundSettings.uiVolume * 100)}%</span>
                </div>
                <Slider 
                  id="ui-volume"
                  defaultValue={[soundSettings.uiVolume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleUIVolumeChange}
                  className="[&>.relative]:bg-[#91d3d1]/30 [&_[data-state=active]]:bg-[#91d3d1]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#91d3d1]/20">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-5 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
