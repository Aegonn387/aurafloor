"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  PlayCircle, HelpCircle, Copy, Check, Plus, Minus, Music,
  ShoppingBag, Send, History, Wallet, User, Shield, ExternalLink, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import type { PiInitOptions, PiAuthResult, PiPaymentCallbacks } from '@/lib/pi-auth';

interface InlineWalletProps {
  mode?: 'collector' | 'creator';
  connected?: boolean;
}

interface OwnedNFT {
  tokenId: string;
  price: number;
  seller: string;
  owner?: string;
  royaltyInfo: { basis_points: number };
  metadata?: {
    name: string;
    description: string;
    image: string;
  };
  audioUrl: string;
}

declare global {
  interface Window {
    Pi: {
      init: (options: PiInitOptions) => void;
      authenticate: (scopes: string[], onIncompletePaymentFound: (payment: any) => void) => Promise<PiAuthResult>;
      createPayment: (paymentData: { amount: number; memo: string; metadata: any }, callbacks: PiPaymentCallbacks) => Promise<any>;
    };
    PiSDK?: any;
  }
}

export function InlineWallet({ mode = 'collector', connected = true }: InlineWalletProps) {
  const [platformBalance, setPlatformBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('balance');
  const [copied, setCopied] = useState<boolean>(false);
  const [piSDKReady, setPiSDKReady] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [piUser, setPiUser] = useState<any>(null);

  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState<boolean>(true);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);

  const [listingModalOpen, setListingModalOpen] = useState<boolean>(false);
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);
  const [listPrice, setListPrice] = useState<string>('');
  const [isListing, setIsListing] = useState<boolean>(false);

  const user = useStore((state) => state.user);
  const setCurrentTrack = useStore((state) => state.setCurrentTrack);

  useEffect(() => {
    async function fetchUserNFTs() {
      if (!user?.uid) return;

      try {
        setLoadingNFTs(true);
        const response = await fetch(`/api/user/${user.uid}/nfts`);

        if (response.ok) {
          const data = await response.json();
          setOwnedNFTs(data.nfts || []);
        } else {
          const allResponse = await fetch('/api/stellar/get-listing/?getAll=true');
          const allData = await allResponse.json();

          if (allData.success) {
            const userOwned = allData.listings.filter((nft: any) =>
              nft.owner === user.walletAddress ||
              nft.seller === user.walletAddress
            );
            setOwnedNFTs(userOwned);
          }
        }
      } catch (error) {
        console.error('[InlineWallet] Error fetching owned NFTs:', error);
      } finally {
        setLoadingNFTs(false);
      }
    }

    async function fetchTransactions() {
      if (!user?.uid) return;

      try {
        setLoadingTransactions(true);
        const response = await fetch(`/api/user/${user.uid}/transactions`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        }
      } catch (error) {
        console.error('[InlineWallet] Error fetching transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    }

    if (user?.uid) {
      fetchUserNFTs();
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    const checkPiSDK = () => {
      if (typeof window !== 'undefined') {
        if (window.Pi) {
          console.log('Pi SDK detected:', window.Pi);
          setPiSDKReady(true);
        } else if (window.PiSDK) {
          console.log('PiSDK detected:', window.PiSDK);
          setPiSDKReady(true);
        } else {
          console.log('Pi SDK not detected');
        }
      }
    };

    checkPiSDK();
    window.addEventListener('pi-sdk-ready', checkPiSDK);
    return () => window.removeEventListener('pi-sdk-ready', checkPiSDK);
  }, []);

  const copyAddress = () => {
    if (user?.piaddr) {
      navigator.clipboard.writeText(user.piaddr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlayAudio = (nft: OwnedNFT) => {
    setCurrentTrack({
      id: nft.tokenId,
      title: nft.metadata?.name || `NFT #${nft.tokenId}`,
      artist: nft.seller || 'Unknown',
      coverUrl: nft.metadata?.image || '/placeholder.svg',
      audioUrl: nft.audioUrl,
      duration: 180,
      price: nft.price / 1000000 || 0,
      owned: true
    });
  };

  const handleOpenListingModal = (nft: OwnedNFT) => {
    setSelectedNFT(nft);
    setListPrice('');
    setListingModalOpen(true);
  };

  const handleListForSale = async () => {
    if (!selectedNFT || !listPrice || parseFloat(listPrice) <= 0) return;

    setIsListing(true);
    try {
      const response = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedNFT.tokenId,
          price: parseFloat(listPrice) * 1000000,
        }),
      });

      if (response.ok) {
        alert('NFT listed successfully!');
        setListingModalOpen(false);

        if (user?.uid) {
          const refreshResponse = await fetch(`/api/user/${user.uid}/nfts`);
          const data = await refreshResponse.json();
          if (data.nfts) setOwnedNFTs(data.nfts);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to list NFT');
      }
    } catch (error) {
      console.error('Failed to list NFT:', error);
      alert('Failed to list NFT');
    } finally {
      setIsListing(false);
    }
  };

  const handlePiAuth = async () => {
    if (!piSDKReady) {
      alert('Pi Network SDK not available');
      return null;
    }

    try {
      const pi = window.Pi;

      const auth = await pi.authenticate(['username', 'payments'], (payment: any) => {
        console.log('Incomplete payment found:', payment);
      });
      return auth;
    } catch (error) {
      console.error('Pi auth failed:', error);
      throw error;
    }
  };

  const handleAddPi = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    if (!piSDKReady) {
      alert('Pi Network SDK is not available. Demo mode active.');
      setPlatformBalance(prev => prev + parseFloat(depositAmount));
      setDepositAmount('');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const amount = parseFloat(depositAmount);
      const pi = window.Pi;

      if (!piUser) {
        const authResult = await handlePiAuth();
        if (authResult) {
          setPiUser(authResult);
        }
      }

      const payment = await pi.createPayment({
        amount: amount,
        memo: `Deposit ${amount} π to Aurafloor`,
        metadata: {
          type: 'deposit',
          amount: amount,
          userId: user?.uid
        }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('Payment ready for approval:', paymentId);
          try {
            await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId })
            });
          } catch (error) {
            console.error('Server approval failed:', error);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('Payment ready for completion:', paymentId, txid);
          try {
            await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid })
            });
            setPlatformBalance(prev => prev + amount);
            setDepositAmount('');
            alert(`Successfully deposited ${amount} π!`);
          } catch (error) {
            console.error('Server completion failed:', error);
          }
        },
        onCancel: (paymentId: string) => {
          console.log('Payment cancelled:', paymentId);
          alert('Payment was cancelled');
        },
        onError: (error: Error) => {
          console.error('Payment error:', error);
          alert(`Payment failed: ${error.message}`);
        }
      });

      console.log('Payment created:', payment);
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleWithdrawPi = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    if (parseFloat(withdrawAmount) > platformBalance) return;
    setPlatformBalance(prev => prev - parseFloat(withdrawAmount));
    setWithdrawAmount('');
    setWithdrawAddress('');
    alert(`Withdrawal request for ${withdrawAmount} π submitted`);
  };

  const handleTransferNFT = (nftId: string) => {
    window.location.href = `/marketplace/transfer?nft=${nftId}`;
  };

  return (
    <div className="w-full space-y-4">
      {user && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{user.dname || user.piuser || user.username || 'User'}</div>
                {user.piaddr && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">
                      {user.piaddr.slice(0, 6)}...{user.piaddr.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

        <TabsContent value="balance" className="space-y-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pi Network Balance</CardTitle>
              <CardDescription className="text-sm">Your internal π balance on Aurafloor</CardDescription>
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
                      disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isProcessingPayment}
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
                      Pi Network SDK not detected. Demo mode active.
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

        <TabsContent value="nfts" className="space-y-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Your Audio NFT Collection</CardTitle>
                  <CardDescription className="text-sm">
                    {ownedNFTs.length} owned NFTs
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
              {loadingNFTs ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : ownedNFTs.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No NFTs owned yet</p>
                  <Button
                    variant="link"
                    onClick={() => window.location.href = '/marketplace'}
                    className="mt-2"
                  >
                    Browse Marketplace
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ownedNFTs.map((nft) => (
                    <div key={nft.tokenId} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer"
                        onClick={() => handlePlayAudio(nft)}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-primary/50" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {nft.metadata?.name || `NFT #${nft.tokenId}`}
                          </span>
                          <Badge className="bg-green-600 text-xs">Owned</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Price: {(nft.price / 1000000).toFixed(2)} π
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                          {nft.tokenId}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePlayAudio(nft)}
                        >
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenListingModal(nft)}
                          title="List on Marketplace"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleTransferNFT(nft.tokenId)}
                          title="Transfer NFT"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription className="text-sm">Platform balance changes</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loadingTransactions ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tx.type}</span>
                          <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                        {tx.txId && (
                          <div className="text-xs font-mono text-muted-foreground truncate" title={tx.txId}>
                            {tx.txId}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className={`font-medium text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} π
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <Card className="border-t rounded-t-none">
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
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={listingModalOpen} onOpenChange={setListingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>
              Set a price for your NFT on the secondary market
            </DialogDescription>
          </DialogHeader>
          {selectedNFT && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary/50" />
                </div>
                <div>
                  <p className="font-medium">{selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}</p>
                  <p className="text-xs text-muted-foreground">Token ID: {selectedNFT.tokenId}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (π)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setListingModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleListForSale}
                  disabled={!listPrice || parseFloat(listPrice) <= 0 || isListing}
                >
                  {isListing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Listing...
                    </>
                  ) : (
                    'List for Sale'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
