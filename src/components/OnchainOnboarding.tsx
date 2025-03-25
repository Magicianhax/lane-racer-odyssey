
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { 
  Rocket, Loader2, X, Copy, Check, ExternalLink, 
  Wallet, AlertTriangle, ChevronRight, User, ArrowLeft, RefreshCw
} from 'lucide-react';
import { validateUsername } from '@/components/ModeSelectionComponents';
import { toast } from 'sonner';

interface OnchainOnboardingProps {
  onComplete: () => void;
}

export const OnchainOnboarding: React.FC<OnchainOnboardingProps> = ({ onComplete }) => {
  // Setup state for multi-step flow
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [walletCreated, setWalletCreated] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [usernameRegistered, setUsernameRegistered] = useState(false);
  
  // Get Web3 context
  const { 
    createUserWallet, isLoading, error, registerUsername, 
    isConnected, wallet, checkUsernameAvailable, refreshBalance
  } = useWeb3();
  
  // Check for existing wallet on load
  useEffect(() => {
    if (isConnected && wallet.address) {
      setWalletCreated(true);
      
      // Check if we already have a registered username
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        setUsername(savedUsername);
        setUsernameRegistered(true);
        
        // If we have both wallet and username, onboarding is complete
        onComplete();
      } else {
        // If we have a wallet with balance, go to username registration
        // even if no username is registered
        if (Number(wallet.balance || 0) > 0) {
          setCurrentStep(2);
        } else {
          // If no balance, stay on step 1 to allow user to get ETH
          setCurrentStep(1);
        }
      }
    }
  }, [isConnected, wallet.address, wallet.balance, onComplete]);
  
  // Auto-check balance periodically when wallet is created but has no ETH
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (walletCreated && currentStep === 1 && Number(wallet.balance || 0) === 0) {
      // Check balance every 10 seconds
      intervalId = setInterval(async () => {
        await refreshBalance();
        if (Number(wallet.balance || 0) > 0) {
          toast.success("ETH detected in wallet!", {
            description: "You can now proceed to register your username."
          });
          // Move to username registration instead of completing
          setCurrentStep(2);
          clearInterval(intervalId);
        }
      }, 10000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [walletCreated, currentStep, wallet.balance, refreshBalance]);
  
  // Handle wallet creation
  const handleCreateWallet = async () => {
    try {
      // Generate a temporary username for wallet creation
      const tempUsername = `user_${Math.floor(Math.random() * 1000000)}`;
      
      // Call createUserWallet without checking its return value directly
      await createUserWallet(tempUsername);
      
      // If we reach here without an error being thrown, we consider it a success
      setWalletCreated(true);
      toast.success("Wallet created successfully!");
      
      // Automatically refresh balance after wallet creation
      await refreshBalance();
    } catch (err) {
      console.error("Failed to create wallet:", err);
      toast.error("Failed to create wallet");
    }
  };
  
  // Handle refreshing wallet balance
  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    try {
      await refreshBalance();
      
      // If balance is detected, show a success toast and go to step 2
      if (Number(wallet.balance || 0) > 0) {
        toast.success("ETH detected in wallet!", {
          description: "You can now proceed to register your username."
        });
        // Move to username registration step
        setCurrentStep(2);
      }
    } catch (err) {
      console.error("Error refreshing balance:", err);
    } finally {
      setRefreshingBalance(false);
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
  
  // Handle username validation
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Set username as registered
      setUsernameRegistered(true);
      
      // Complete onboarding only after successful username registration
      toast.success("Username registered successfully!");
      onComplete();
      
    } catch (err) {
      console.error("Failed to register username:", err);
      
      // Check if it's an "insufficient funds" error
      if (err.toString().includes("insufficient funds")) {
        toast.error("You need ETH to register a username", {
          description: "Please add some testnet ETH to your wallet first."
        });
        // Go back to wallet funding
        setCurrentStep(1);
      } else {
        toast.error("Failed to register username");
      }
    }
  };
  
  // Step 1: Create Wallet & Fund it
  const renderWalletCreationStep = () => (
    <>
      <h3 className="text-xl font-bold mb-2">Create & Fund Your Wallet</h3>
      
      {!walletCreated ? (
        // WALLET CREATION UI
        <>
          <p className="text-sm text-gray-300 mb-6">
            First, create a blockchain wallet to store your game progress and achievements.
          </p>
          
          <Button
            onClick={handleCreateWallet}
            className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 py-3 rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Wallet...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Create Wallet
              </>
            )}
          </Button>
        </>
      ) : (
        // WALLET FUNDING UI - Shown after wallet is created
        <>
          <p className="text-sm text-gray-300 mb-4 text-center">
            Add some ETH to this address to continue.
          </p>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center mb-4">
            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-green-400">Wallet created successfully!</p>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg mb-4 border border-[#91d3d1]/20">
            <div className="mb-4">
              <h4 className="font-medium mb-3 text-center">Your Wallet Address</h4>
              <div className="bg-black/30 p-3 rounded flex items-center justify-between border border-[#91d3d1]/20">
                <code className="text-sm text-white font-mono overflow-hidden overflow-ellipsis mr-2">
                  {wallet.address}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyAddress}
                  className="h-8 w-8 p-0 bg-[#91d3d1]/10 hover:bg-[#91d3d1]/20"
                >
                  {copiedAddress ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#91d3d1]" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-gray-300 mt-2">
                Add some ETH to this address to continue
              </p>
            </div>
            
            <div className="pt-3 border-t border-[#91d3d1]/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Current Balance:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshBalance}
                  className="h-8 w-8 p-0 bg-[#91d3d1]/10 hover:bg-[#91d3d1]/20"
                  disabled={refreshingBalance}
                >
                  <RefreshCw className={`h-4 w-4 text-[#91d3d1] ${refreshingBalance ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg">{wallet.balance || '0'} ETH</span>
                
                {Number(wallet.balance || 0) === 0 ? (
                  <div className="text-xs py-1 px-2 bg-yellow-500/20 text-yellow-400 rounded-full">
                    Waiting for ETH
                  </div>
                ) : (
                  <div className="text-xs py-1 px-2 bg-green-500/20 text-green-400 rounded-full">
                    Ready!
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
            
            {/* Continue button is always visible but only enabled when balance > 0 */}
            <Button
              onClick={() => setCurrentStep(2)}
              className={`w-full mt-2 ${
                Number(wallet.balance || 0) > 0 
                  ? "bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900" 
                  : "bg-gradient-to-r from-[#91d3d1]/50 to-[#7ec7c5]/50 text-zinc-900/50 cursor-not-allowed"
              }`}
              disabled={Number(wallet.balance || 0) === 0}
            >
              <ChevronRight className="mr-1 h-4 w-4" />
              Continue to Username Registration
              {Number(wallet.balance || 0) === 0 && (
                <span className="ml-1 text-xs">(Need ETH first)</span>
              )}
            </Button>
            
            {Number(wallet.balance || 0) === 0 && (
              <p className="text-amber-400 text-xs text-center mt-2">
                Balance will refresh automatically when ETH is detected.
                <br />You can also click the refresh button to check manually.
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
  
  // Step 2: Register Username
  const renderUsernameRegistrationStep = () => (
    <>
      <h3 className="text-xl font-bold mb-2">Choose Your Username</h3>
      <p className="text-sm text-gray-300 mb-4">
        Choose a unique username that will be registered on the blockchain.
      </p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2 text-white text-left">
            Username
          </label>
          <Input
            id="username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter your username (3-16 characters)"
            className="w-full bg-black/30 border-zinc-700 text-white"
            required
          />
          {validationError && (
            <p className="text-xs text-red-400 mt-1 ml-1 text-left">
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
            <div className="text-left">
              <h4 className="text-sm font-medium mb-1">Username Info</h4>
              <p className="text-xs text-gray-300">
                Your username will be permanently registered on the blockchain and visible to other players.
                This requires a small amount of ETH for the transaction fee.
              </p>
            </div>
          </div>
        </div>
  
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleRegisterUsername} 
            className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 py-3 rounded-xl"
            disabled={isLoading || !username.trim() || !!validationError}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <User className="mr-2 h-5 w-5" />
                Register Username
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setCurrentStep(1)}
            className="text-[#91d3d1]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wallet
          </Button>
        </div>
      </div>
    </>
  );
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e]/95 via-[#172637]/95 to-[#1f3a57]/95 backdrop-blur-sm z-50">
      <div className="glassmorphism p-6 rounded-xl max-w-md w-full">
        <div className="flex justify-center items-center mb-3">
          <div className="inline-flex rounded-full bg-[#91d3d1]/20 p-2">
            <Rocket className="h-5 w-5 text-[#91d3d1]" />
          </div>
        </div>
        
        {/* Step indicator */}
        <div className="flex items-center mb-6">
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-default ${
                  currentStep === step 
                    ? 'bg-[#91d3d1] text-zinc-900 font-medium' 
                    : currentStep > step 
                      ? 'bg-[#91d3d1]/30 text-white' 
                      : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </button>
              {step < 2 && (
                <div 
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-[#91d3d1]/30' : 'bg-zinc-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {currentStep === 1 ? renderWalletCreationStep() : renderUsernameRegistrationStep()}
      </div>
    </div>
  );
};
