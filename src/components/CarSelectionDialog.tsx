
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car, Check } from 'lucide-react';

interface CarSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCar: (carUrl: string) => void;
  selectedCar: string;
}

const CarSelectionDialog: React.FC<CarSelectionDialogProps> = ({
  open,
  onOpenChange,
  onSelectCar,
  selectedCar
}) => {
  const carOptions = [
    { name: "Superseed Car", url: "/playercar.png" },
    { name: "Super Car", url: "/playercar2.png" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] max-h-[90vh] bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] text-white border-[#91d3d1]/20 p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[#91d3d1]" />
            <DialogTitle className="text-gradient">Choose Your Car</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Select a car to drive in the game
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 p-5">
          {carOptions.map((car) => (
            <div 
              key={car.url}
              className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                selectedCar === car.url 
                  ? 'bg-[#91d3d1]/20 border-2 border-[#91d3d1]/50' 
                  : 'bg-black/20 border border-white/10'
              }`}
              onClick={() => onSelectCar(car.url)}
            >
              <div className="relative w-full aspect-video bg-black/30 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img 
                  src={car.url} 
                  alt={car.name} 
                  className="h-16 object-contain" 
                />
                {selectedCar === car.url && (
                  <div className="absolute top-2 right-2 bg-[#91d3d1] text-zinc-900 rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium">{car.name}</span>
            </div>
          ))}
        </div>
        
        <div className="p-5 pt-0">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-4 text-base font-medium shadow-lg shadow-[#91d3d1]/20"
          >
            Continue with Selected Car
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarSelectionDialog;
