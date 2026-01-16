"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlayCircle, LogOut, HelpCircle, Copy, Check, Plus, Minus, Music, ShoppingBag, Send, History, Wallet, User, Shield, ExternalLink, Loader2 } from 'lucide-react';

interface InlineWalletProps {
  mode?: 'collector' | 'creator';
  connected?: boolean;
}

export function InlineWallet({ mode = 'collector', connected = true }: InlineWalletProps) {
  const [platformBalance, setPlatformBalance] = useState<number>(156.25);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(connected);
  const [activeTab, setActiveTab] = useState<string>('balance');
  const [copied, setCopied] = useState<boolean>(false);
  const [piSDKReady, setPiSDKReady] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const piAccount = {
    username: 'pi_music_lover',
    walletAddress: 'GD7FQKYT2VTHUCAFYF774KQ7O4Q7RGD5FP2RZ2SKO5E2NYKG3GEDGXYZ',
    truncatedAddress: 'GD7F...GXYZ'
  };

  const nfts = [
    { id: '1', title: 'Midnight Sonata', artist: 'Beethoven', owned: true, tokenId: 'PI_NFT_001', favorite: true },
    { id: '2', title: 'Summer Vibes', artist: 'DJ Solar', owned: true, tokenId: 'PI_NFT_002', favorite: false },
    { id: '3', title: 'Ocean Waves', artist: 'Aqua Sound', owned: false, tokenId: 'PI_NFT_003', favorite: true },
    { id: '4', title: 'Neon Dreams', artist: 'Synthwave AI', owned: true, tokenId: 'PI_NFT_004', favorite: true },
    { id: '5', title: 'Desert Echo', artist: 'Nomadic Beats', owned: true, tokenId: 'PI_NFT_005', favorite: false },
    { id: '6', title: 'Urban Pulse', artist: 'City Sounds', owned: false, tokenId: 'PI_NFT_006', favorite: false },
    { id: '7', title: 'Mountain Stream', artist: 'Nature Records', owned: true, tokenId: 'PI_NFT_007', favorite: true },
    { id: '8', title: 'Digital Rain', artist: 'Cyber Composer', owned: true, tokenId: 'PI_NFT_008', favorite: false },
    { id: '9', title: 'Jazz Noir', artist: 'Midnight Trio', owned: false, tokenId: 'PI_NFT_009', favorite: true },
    { id: '10', title: 'Solar Flare', artist: 'Cosmic DJ', owned: true, tokenId: 'PI_NFT_010', favorite: true }
  ];

  const transactions = [
    { id: 'TX001', type: 'Deposit', amount: '+100.00 π', status: 'Completed', timestamp: 'Jan 10, 14:30', piTxId: 'PI_TX_5E6F7G8H9I' },
    { id: 'TX002', type: 'Tip Sent', amount: '-25.50 π', status: 'Completed', timestamp: 'Jan 9, 11:20', piTxId: 'PI_TX_1A2B3C4D5E' },
    { id: 'TX003', type: 'Withdrawal', amount: '-75.00 π', status: 'Processing', timestamp: 'Jan 7, 16:45', piTxId: 'PI_TX_PENDING_001' },
    { id: 'TX004', type: 'NFT Purchase', amount: '-45.50 π', status: 'Completed', timestamp: 'Jan 6, 09:15', piTxId: 'PI_TX_A1B2C3D4E5' },
    { id: 'TX005', type: 'Sale Income', amount: '+28.75 π', status: 'Completed', timestamp: 'Jan 5, 20:30', piTxId: 'PI_TX_F6G7H8I9J0' },
    { id: 'TX006', type: 'Deposit', amount: '+50.00 π', status: 'Completed', timestamp: 'Jan 4, 12:10', piTxId: 'PI_TX_K1L2M3N4O5' },
    { id: 'TX007', type: 'Tip Received', amount: '+10.00 π', status: 'Completed', timestamp: 'Jan 3, 17:45', piTxId: 'PI_TX_P6Q7R8S9T0' },
    { id: 'TX008', type: 'Withdrawal', amount: '-30.00 π', status: 'Completed', timestamp: 'Jan 2, 10:20', piTxId: 'PI_TX_U1V2W3X4Y5' },
    { id: 'TX009', type: 'NFT Purchase', amount: '-62.00 π', status: 'Completed', timestamp: 'Jan 1, 14:00', piTxId: 'PI_TX_Z6A7B8C9D0' }
  ];

  // Check for Pi SDK on mount
  useEffect(() => {
    const checkPiSDK = () => {
      if (window.Pi) {
        setPiSDKReady(true);
      }
    };

    checkPiSDK();

    // Listen for Pi SDK ready event
    window.addEventListener('pi-sdk-ready', checkPiSDK);
    
    return () => {
      window.removeEventListener('pi-sdk-ready', checkPiSDK);
    };
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(piAccount.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectToggle = () => {
    setIsConnected(!isConnected);
  };

  const handleAddPi = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    if (!piSDKReady || !window.Pi) {
      alert('Pi Network SDK is not available. Please ensure you are using the Pi Browser.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const amount = parseFloat(depositAmount);
      
      // Create payment using Pi Network SDK
      const payment = await window.Pi.createPayment({
        amount: amount,
        memo: `Deposit ${amount} π to Aurafloor platform`,
        metadata: { 
          type: 'deposit',
          amount: amount,
          timestamp: new Date().toISOString()
        }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('Payment ready for approval:', paymentId);
          
          // Call your backend to approve the payment
          try {
            const response = await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId })
            });

            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || 'Payment approval failed');
            }
          } catch (error) {
            console.error('Server approval failed:', error);
            throw error;
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('Payment ready for completion:', paymentId, txid);
          
          // Call your backend to complete the payment
          try {
            const response = await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid })
            });

            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || 'Payment completion failed');
            }

            // Update platform balance on successful completion
            setPlatformBalance(prev => prev + amount);
            setDepositAmount('');
            alert(`Successfully deposited ${amount} π to your platform balance!`);
          } catch (error) {
            console.error('Server completion failed:', error);
            throw error;
          }
        },
        onCancel: (paymentId: string) => {
          console.log('Payment cancelled:', paymentId);
          setIsProcessingPayment(false);
          alert('Payment was cancelled');
        },
        onError: (error: Error, payment?: any) => {
          console.error('Payment error:', error, payment);
          setIsProcessingPayment(false);
          alert(`Payment failed: ${error.message}`);
        }
      });

      console.log('Payment initiated:', payment);
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Failed to initiate payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleWithdrawPi = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    if (parseFloat(withdrawAmount) > platformBalance) return;
    setPlatformBalance(prev => prev - parseFloat(withdrawAmount));
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  const handleListForSale = (nftId: string) => {
    // Link to marketplace list functionality
    window.location.href = `/marketplace/list?nft=${nftId}`;
  };

  const handleTransferNFT = (nftId: string) => {
    // Link to marketplace transfer functionality
    window.location.href = `/marketplace/transfer?nft=${nftId}`;
  };

  const handlePlayAudio = (nftId: string) => {
    // Link to audio player
    window.location.href = `/player/${nftId}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Connected Account - Fixed height */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{piAccount.username}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono">{piAccount.truncatedAddress}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleConnectToggle}
            >
              {isConnected ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Wallet Interface with Scrollable Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="balance" className="gap-2 text-xs sm:text-sm">
            <Wallet className="w-4 h-4" />
            Balance
          </TabsTrigger>
          <TabsTrigger value="nfts" className="gap-2 text-xs sm:text-sm">
            <Music className="w-4 h-4" />
            NFTs
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs sm:text-sm">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* 1. Balance Interface with Scrollable Content */}
        <TabsContent value="balance" className="space-y-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Platform Balance</CardTitle>
              <CardDescription className="text-sm">Your internal π balance</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="text-center py-4 flex-shrink-0">
                <div className="text-3xl font-bold">{platformBalance.toFixed(2)} π</div>
                <div className="text-sm text-muted-foreground mt-1">Available</div>
              </div>

              <Separator className="flex-shrink-0" />

              <div className="space-y-4 flex-1 overflow-y-auto pt-4">
                <div className="space-y-3">
                  <Label htmlFor="deposit-amount" className="text-sm">Add π to Platform</Label>
                  <div className="flex gap-2">
                    <Input
                      id="deposit-amount"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1"
                      disabled={isProcessingPayment}
                    />
                    <Button
                      onClick={handleAddPi}
                      disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isProcessingPayment || !piSDKReady}
                      className="gap-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add π
                        </>
                      )}
                    </Button>
                  </div>
                  {!piSDKReady && (
                    <p className="text-xs text-amber-600">
                      Pi Network SDK not detected. Please use the Pi Browser to make payments.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="withdraw-amount" className="text-sm">Withdraw π</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        id="withdraw-amount"
                        placeholder="Amount"
                        type="number"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Pi Address (G...)"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleWithdrawPi}
                      disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 ||
                               parseFloat(withdrawAmount) > platformBalance || !withdrawAddress}
                      className="w-full gap-2"
                    >
                      <Minus className="w-4 h-4" />
                      Request Withdrawal
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Processed within 24 hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. NFT Showcase with Scrollable Gallery */}
        <TabsContent value="nfts" className="space-y-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Audio NFT Collection</CardTitle>
                  <CardDescription className="text-sm">
                    {nfts.filter(n => n.owned).length} owned • {nfts.filter(n => n.favorite).length} favorites
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.location.href = '/marketplace'}
                >
                  <ExternalLink className="w-4 h-4" />
                  Browse Marketplace
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {nfts.map((nft) => (
                  <div key={nft.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer"
                      onClick={() => handlePlayAudio(nft.id)}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                        <Music className="w-6 h-6 text-primary/50" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{nft.title}</span>
                        {nft.owned && (
                          <Badge className="bg-green-600 text-xs">Owned</Badge>
                        )}
                        {nft.favorite && (
                          <Badge variant="outline" className="text-xs">Favorited</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{nft.artist}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{nft.tokenId}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePlayAudio(nft.id)}
                      >
                        <PlayCircle className="w-4 h-4" />
                      </Button>
                      {nft.owned && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleListForSale(nft.id)}
                            title="List on Marketplace"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleTransferNFT(nft.id)}
                            title="Transfer NFT"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Transaction History with Scrollable List */}
        <TabsContent value="history" className="space-y-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription className="text-sm">Platform balance changes</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tx.type}</span>
                        <Badge variant={tx.status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                      <div className="text-xs font-mono text-muted-foreground truncate" title={tx.piTxId}>
                        {tx.piTxId}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className={`font-medium text-sm ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Information - Fixed height, not scrollable */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Security Information</span>
              </div>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>• Uses Pi Network's official payment system</p>
                <p>• All transactions recorded on Pi blockchain</p>
                <p>• We don't hold private keys</p>
                <p>• Withdrawals require verification</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={() => window.location.href = '/help'}
              >
                <HelpCircle className="w-4 h-4" />
                Help & Support
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
