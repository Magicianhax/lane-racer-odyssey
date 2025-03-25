
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { 
  Rocket, Loader2, X, Copy, Check, ExternalLink, 
  Wallet, AlertTriangle, ChevronRight, User
} from 'lucide-react';
import { validateUsername } from '@/components/ModeSelectionComponents';
import { toast } from 'sonner';

interface OnboardingProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete }) => {
  // Setup state for multi-step flow
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [walletCreated, setWalletCreated] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // Get Web3 context
  const { 
    createUserWallet, isLoading, error, registerUsername, 
    isConnected, wallet, checkUsernameAvailable, refreshBalance
  } = useWeb3();
  
  // Check for existing wallet on load
  useEffect(() => {
    if (isConnected && wallet.address) {
      setWalletCreated(true);
      
      // If we have a wallet but no username registered, go to step 2 or 3
      const savedUsername = localStorage.getItem('username');
      
      if (Number(wallet.balance || 0) === 0) {
        setCurrentStep(2); // Need to fund wallet
      } else if (!savedUsername) {
        setCurrentStep(3); // Need username registration
      }
    }
  }, [isConnected, wallet.address, wallet.balance]);

  // Refresh balance periodically on step 2
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentStep === 2 && wallet.address) {
      // Initial refresh
      refreshBalance();
      
      // Setup interval to check every 10 seconds
      interval = setInterval(() => {
        refreshBalance();
      }, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, wallet.address, refreshBalance]);
  
  // Handle wallet creation
  const handleCreateWallet = async () => {
    try {
      // Generate a temporary username for wallet creation
      // We'll update this later with the user's real choice
      const tempUsername = `user_${Math.floor(Math.random() * 1000000)}`;
      
      const success = await createUserWallet(tempUsername);
      
      if (success) {
        setWalletCreated(true);
        // Advance to the "Fund your wallet" step
        setCurrentStep(2);
        toast.success("Wallet created successfully!");
      }
    } catch (err) {
      console.error("Failed to create wallet:", err);
      toast.error("Failed to create wallet");
    }
  };
  
  // Handle username validation
  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Local validation
    if (value.trim()) {
      const validation = validateUsername(value);
      setValidationError(validation.isValid ? null : validation.error);
    } else {
      setValidationError(null);
    }
  };
  
  // Handle username registration
  const handleRegisterUsername = async () => {
    if (!username.trim() || validationError) return;
    
    try {
      // Check availability first
      const isAvailable = await checkUsernameAvailable(username);
      
      if (!isAvailable) {
        setValidationError("Username already taken on blockchain");
        return;
      }
      
      // Register the username
      await registerUsername(username);
      
      // Update localStorage
      localStorage.setItem('username', username);
      
      // Complete onboarding
      toast.success("Username registered successfully!");
      onComplete();
      
    } catch (err: any) {
      console.error("Failed to register username:", err);
      
      // Check if it's an "insufficient funds" error
      if (err.toString().includes("insufficient funds")) {
        toast.error("You need ETH to register a username", {
          description: "Please add some testnet ETH to your wallet first."
        });
        setCurrentStep(2); // Go back to funding step
      } else {
        toast.error("Failed to register username");
      }
    }
  };
  
  // Handle copy address
  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      toast.success("Address copied to clipboard");
      
      setTimeout(() => setCopiedAddress(false), 3000);
    }
  };
  
  // Step 1: Create Wallet
  const renderCreateWalletStep = () => (
    <>
      <h3 className="text-xl font-bold mb-2">Step 1: Create Your Wallet</h3>
      <p className="text-sm text-gray-300 mb-6">
        First, let's create a new blockchain wallet for your game account.
      </p>
      
      <div className="bg-black/30 p-4 rounded-lg mb-4 border border-[#91d3d1]/20">
        <div className="flex items-start mb-3">
          <Wallet className="h-5 w-5 mr-2 text-[#91d3d1] mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">What is a wallet?</h4>
            <p className="text-xs text-gray-300">
              A blockchain wallet is like a digital bank account that stores your game data and achievements securely. 
              You'll need it to register a unique username and track your scores on the blockchain.
            </p>
          </div>
        </div>
      </div>
      
      <Button
        onClick={handleCreateWallet}
        className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 mt-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Wallet...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Create Wallet
          </>
        )}
      </Button>
    </>
  );
  
  // Step 2: Fund Wallet
  const renderFundWalletStep = () => (
    <>
      <h3 className="text-xl font-bold mb-2">Step 2: Add ETH to Your Wallet</h3>
      <p className="text-sm text-gray-300 mb-4">
        You need a small amount of testnet ETH to register your username.
      </p>
      
      <div className="bg-black/30 p-4 rounded-lg mb-4 border border-[#91d3d1]/20">
        <div className="mb-3">
          <h4 className="font-medium mb-1 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-yellow-400" />
            Why do I need ETH?
          </h4>
          <p className="text-xs text-gray-300">
            Registering a username requires a small transaction on the blockchain.
            This uses "gas" which is paid in ETH. For testing, you can get free ETH from a "faucet".
          </p>
        </div>
        
        <div className="border-t border-[#91d3d1]/10 pt-3 mb-3">
          <h4 className="font-medium mb-2">Your Wallet Address:</h4>
          <div className="bg-black/30 p-2 rounded flex items-center justify-between">
            <code className="text-xs text-gray-300 font-mono overflow-hidden overflow-ellipsis">
              {wallet.address}
            </code>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopyAddress}
              className="h-7 w-7 p-0"
            >
              {copiedAddress ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="border-t border-[#91d3d1]/10 pt-3">
          <h4 className="font-medium mb-2">Current Balance:</h4>
          <div className="flex items-center justify-between">
            <span className="font-mono">{wallet.balance || '0'} ETH</span>
            
            {Number(wallet.balance || 0) === 0 ? (
              <div className="text-xs py-1 px-2 bg-yellow-500/20 text-yellow-400 rounded-full">
                Needs ETH
              </div>
            ) : (
              <div className="text-xs py-1 px-2 bg-green-500/20 text-green-400 rounded-full">
                Ready
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://sepoliafaucet.com/', '_blank')}
          className="flex items-center justify-center gap-1"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Get Free Testnet ETH
        </Button>
        
        <Button
          onClick={() => setCurrentStep(3)}
          className="w-full mt-2 bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900"
          disabled={Number(wallet.balance || 0) === 0}
        >
          <ChevronRight className="mr-1 h-4 w-4" />
          Continue to Next Step
        </Button>
      </div>
    </>
  );
  
  // Step 3: Register Username
  const renderRegisterUsernameStep = () => (
    <>
      <h3 className="text-xl font-bold mb-2">Step 3: Choose Your Username</h3>
      <p className="text-sm text-gray-300 mb-4">
        Choose a unique username that will be registered on the blockchain.
      </p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2 text-white">
            Username
          </label>
          <Input
            id="username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter your username (3-16 characters)"
            className="w-full bg-black/30 border-zinc-700 text-white"
            required
            disabled={isLoading}
          />
          {validationError && (
            <p className="text-xs text-red-400 mt-1 ml-1">
              {validationError}
            </p>
          )}
        </div>
        
        {error && (
          <div className="text-red-400 text-sm py-2 px-3 bg-red-400/10 rounded-md">
            {error}
          </div>
        )}
        
        <div className="bg-black/30 p-3 rounded-lg border border-[#91d3d1]/20">
          <div className="flex items-start">
            <User className="h-4 w-4 mr-2 text-[#91d3d1] mt-0.5" />
            <div>
              <h4 className="text-sm font-medium mb-1">Username Info</h4>
              <p className="text-xs text-gray-300">
                Your username will be permanently registered on the blockchain and visible to other players.
                This requires a small amount of ETH for the transaction fee.
              </p>
            </div>
          </div>
        </div>
  
        <Button 
          onClick={handleRegisterUsername} 
          className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900"
          disabled={isLoading || !username.trim() || !!validationError}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <User className="mr-2 h-4 w-4" />
              Register Username
            </>
          )}
        </Button>
      </div>
    </>
  );
  
  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderCreateWalletStep();
      case 2:
        return renderFundWalletStep();
      case 3:
        return renderRegisterUsernameStep();
      default:
        return renderCreateWalletStep();
    }
  };
  
  return (
    <div className="glassmorphism p-6 rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <div className="inline-flex rounded-full bg-[#91d3d1]/20 p-3">
          <Rocket className="h-6 w-6 text-[#91d3d1]" />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onComplete}
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === step 
                  ? 'bg-[#91d3d1] text-zinc-900 font-medium' 
                  : currentStep > step 
                    ? 'bg-[#91d3d1]/30 text-white' 
                    : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {currentStep > step ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < 3 && (
              <div 
                className={`flex-1 h-1 mx-2 ${
                  currentStep > step ? 'bg-[#91d3d1]/30' : 'bg-zinc-800'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {renderCurrentStep()}
    </div>
  );
};
