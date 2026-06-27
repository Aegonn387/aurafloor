"use client"

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  pi_address: string;
  pi_username: string;
  display_name: string;
  bio: string;
  writing_sample: string;
  topics_interested: string[];
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
}

export default function CreatorReviewPage() {
  const user = useStore((state) => state.user);
  const router = useRouter();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    checkAuth();
    fetchApplications();
  }, []);

  const checkAuth = async () => {
    if (!user?.piaddr) {
      alert('Please sign in with Pi Network first');
      router.push('/');
      return;
    }

    try {
      const response = await fetch(`/api/creators/check-auth?pi_address=${user.piaddr}`);
      const data = await response.json();
      
      if (!data.is_admin) {
        alert('Access denied: Super admin only');
        router.push('/');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/creators/applications');
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (appId: string, action: 'approve' | 'reject') => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/creators/applications/${appId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          review_notes: reviewNotes,
          reviewed_by: user?.piuser || 'Admin'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedApp(null);
        setReviewNotes('');
        fetchApplications();
        alert(`Application ${action}ed successfully!`);
      } else {
        alert(data.error || `Failed to ${action} application`);
      }
    } catch (error) {
      console.error(`Failed to ${action} application:`, error);
      alert(`Failed to ${action} application`);
    } finally {
      setProcessing(false);
    }
  };

  const filteredApps = applications.filter(app => 
    filter === 'all' ? true : app.status === filter
  );

  const stats = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 py-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Creator Applications</h1>
          <p className="text-muted-foreground">Review and approve content creator applications</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className={filter === 'pending' ? 'border-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <Button 
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm" 
                className="w-full mt-2"
                onClick={() => setFilter('pending')}
              >
                View Pending
              </Button>
            </CardContent>
          </Card>

          <Card className={filter === 'approved' ? 'border-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <Button 
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm" 
                className="w-full mt-2"
                onClick={() => setFilter('approved')}
              >
                View Approved
              </Button>
            </CardContent>
          </Card>

          <Card className={filter === 'rejected' ? 'border-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <Button 
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm" 
                className="w-full mt-2"
                onClick={() => setFilter('rejected')}
              >
                View Rejected
              </Button>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} applications found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApps.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{app.display_name}</h3>
                        <Badge variant="outline">@{app.pi_username}</Badge>
                        {app.status === 'pending' && <Badge className="bg-orange-600">Pending</Badge>}
                        {app.status === 'approved' && <Badge className="bg-green-600">Approved</Badge>}
                        {app.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{app.bio}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {app.topics_interested?.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                        {app.reviewed_at && ` â€¢ Reviewed: ${new Date(app.reviewed_at).toLocaleDateString()}`}
                      </p>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewNotes(app.review_notes || '');
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Application Review</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Display Name:</span>
                                <p className="font-medium">{app.display_name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pi Username:</span>
                                <p className="font-medium">@{app.pi_username}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Pi Address:</span>
                                <p className="font-mono text-xs">{app.pi_address}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label>Bio</Label>
                            <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{app.bio}</p>
                          </div>

                          <div>
                            <Label>Writing Sample</Label>
                            <div className="text-sm mt-1 p-4 bg-muted rounded-lg whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {app.writing_sample}
                            </div>
                          </div>

                          <div>
                            <Label>Topics Interested In</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {app.topics_interested?.map((topic, i) => (
                                <Badge key={i}>{topic}</Badge>
                              ))}
                            </div>
                          </div>

                          {app.status === 'pending' && (
                            <div>
                              <Label>Review Notes (Optional)</Label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={3}
                                placeholder="Add notes about your decision..."
                              />
                            </div>
                          )}

                          {app.review_notes && app.status !== 'pending' && (
                            <div>
                              <Label>Review Notes</Label>
                              <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{app.review_notes}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Reviewed by {app.reviewed_by} on {new Date(app.reviewed_at!).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          {app.status === 'pending' && (
                            <div className="flex gap-2 pt-4">
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleReview(app.id, 'reject')}
                                disabled={processing}
                              >
                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                Reject
                              </Button>
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleReview(app.id, 'approve')}
                                disabled={processing}
                              >
                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
