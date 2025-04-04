
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Coins, TrendingUp, Check } from "lucide-react";
import { ethers } from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';

type CreateCompetitionModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const createCompetitionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().min(5, "Description must be at least 5 characters").max(200, "Description must be less than 200 characters"),
  startDate: z.string().refine(date => !isNaN(new Date(date).getTime()), "Invalid start date"),
  endDate: z.string().refine(date => !isNaN(new Date(date).getTime()), "Invalid end date"),
  prizePool: z.string().refine(value => {
    try {
      const parsed = ethers.utils.parseEther(value);
      return parsed.gt(0);
    } catch (e) {
      return false;
    }
  }, "Prize pool must be a valid ETH amount"),
  firstPlacePercentage: z.preprocess(
    val => Number(val),
    z.number().min(1).max(100)
  ),
  secondPlacePercentage: z.preprocess(
    val => Number(val),
    z.number().min(0).max(99)
  ),
  thirdPlacePercentage: z.preprocess(
    val => Number(val),
    z.number().min(0).max(98)
  ),
});

export const CreateCompetitionModal: React.FC<CreateCompetitionModalProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { wallet, createCompetition } = useWeb3();
  const [isCreating, setIsCreating] = useState(false);
  
  // Set minimum datetime to now
  const now = new Date();
  const minStartDate = now.toISOString().slice(0, 16);
  
  // Tomorrow date for minimum end date
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minEndDate = tomorrow.toISOString().slice(0, 16);
  
  const form = useForm<z.infer<typeof createCompetitionSchema>>({
    resolver: zodResolver(createCompetitionSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: minStartDate,
      endDate: minEndDate,
      prizePool: "0.01",
      firstPlacePercentage: 60,
      secondPlacePercentage: 30,
      thirdPlacePercentage: 10,
    },
  });
  
  const onSubmit = async (data: z.infer<typeof createCompetitionSchema>) => {
    try {
      setIsCreating(true);
      
      // Validate total percentage is 100%
      const totalPercentage = data.firstPlacePercentage + data.secondPlacePercentage + data.thirdPlacePercentage;
      if (totalPercentage !== 100) {
        toast.error("Total reward percentage must equal 100%");
        return;
      }
      
      // Validate wallet balance
      if (wallet.balance) {
        const balance = ethers.utils.parseEther(wallet.balance);
        const prizePool = ethers.utils.parseEther(data.prizePool);
        
        if (balance.lt(prizePool)) {
          toast.error("Insufficient balance for prize pool");
          return;
        }
      }
      
      // Create distribution array
      const rewardDistribution = [
        data.firstPlacePercentage,
        data.secondPlacePercentage,
        data.thirdPlacePercentage,
      ].filter(percentage => percentage > 0);
      
      // Convert dates to timestamps
      const startDate = new Date(data.startDate).getTime();
      const endDate = new Date(data.endDate).getTime();
      
      if (endDate <= startDate) {
        toast.error("End date must be after start date");
        return;
      }
      
      // Create competition
      await createCompetition({
        name: data.name,
        description: data.description,
        startDate,
        endDate,
        prizePool: data.prizePool,
        rewardDistribution,
      });
      
      // Reset form and close modal
      form.reset();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error creating competition:", error);
      toast.error("Failed to create competition");
    } finally {
      setIsCreating(false);
    }
  };
  
  // Calculate total percentage
  const firstPlacePercentage = form.watch("firstPlacePercentage") || 0;
  const secondPlacePercentage = form.watch("secondPlacePercentage") || 0;
  const thirdPlacePercentage = form.watch("thirdPlacePercentage") || 0;
  const totalPercentage = firstPlacePercentage + secondPlacePercentage + thirdPlacePercentage;
  
  // Get color for total percentage
  const getPercentageColor = () => {
    if (totalPercentage === 100) return "text-green-500";
    return "text-red-500";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-b from-[#0b131e] to-[#172637] border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Create Competition</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competition Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Weekend Challenge"
                      className="bg-gray-800/40 border-gray-700 text-white"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Compete for the highest score this weekend!"
                      className="bg-gray-800/40 border-gray-700 text-white"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                          type="datetime-local"
                          min={minStartDate}
                          className="bg-gray-800/40 border-gray-700 text-white pl-8"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                          type="datetime-local"
                          min={minEndDate}
                          className="bg-gray-800/40 border-gray-700 text-white pl-8"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="prizePool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Pool (ETH)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Coins className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input 
                        type="text"
                        placeholder="0.01"
                        className="bg-gray-800/40 border-gray-700 text-white pl-8"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  {wallet.balance && (
                    <FormDescription className="text-xs text-gray-400">
                      Your balance: {parseFloat(wallet.balance).toFixed(4)} ETH
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Reward Distribution</FormLabel>
                <span className={`text-xs ${getPercentageColor()}`}>
                  Total: {totalPercentage}%
                </span>
              </div>
              
              <div className="space-y-2 bg-gray-800/30 p-3 rounded-lg">
                <FormField
                  control={form.control}
                  name="firstPlacePercentage"
                  render={({ field }) => (
                    <FormItem className="flex items-center">
                      <FormLabel className="min-w-24 text-sm">🥇 1st Place</FormLabel>
                      <FormControl>
                        <div className="relative flex-1">
                          <TrendingUp className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            type="number"
                            min="1"
                            max="100"
                            className="bg-gray-800/40 border-gray-700 text-white pl-8"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="secondPlacePercentage"
                  render={({ field }) => (
                    <FormItem className="flex items-center">
                      <FormLabel className="min-w-24 text-sm">🥈 2nd Place</FormLabel>
                      <FormControl>
                        <div className="relative flex-1">
                          <TrendingUp className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            type="number"
                            min="0"
                            max="99"
                            className="bg-gray-800/40 border-gray-700 text-white pl-8"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="thirdPlacePercentage"
                  render={({ field }) => (
                    <FormItem className="flex items-center">
                      <FormLabel className="min-w-24 text-sm">🥉 3rd Place</FormLabel>
                      <FormControl>
                        <div className="relative flex-1">
                          <TrendingUp className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            type="number"
                            min="0"
                            max="98"
                            className="bg-gray-800/40 border-gray-700 text-white pl-8"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="teal"
                disabled={isCreating || totalPercentage !== 100}
              >
                {isCreating ? (
                  <>
                    <span className="animate-spin mr-2">⚪</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Competition
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
