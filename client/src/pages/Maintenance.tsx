import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Wrench, AlertTriangle } from 'lucide-react';

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // New Request Form State
  const [assetId, setAssetId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('Medium');

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState('Approved'); // Approved or Rejected
  const [technician, setTechnician] = useState('');

  // Resolve Form State
  const [cost, setCost] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'all' | 'pending' | 'resolved'>('mine');
  const isManager = user?.role === 'Admin' || user?.role === 'Asset Manager';

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [maintRes, assetsRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/assets')
      ]);
      setRequests(maintRes.data);
      setAssets(assetsRes.data);
    } catch (err) {
      console.error('Failed to load maintenance data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/maintenance', {
        assetId,
        issueDescription,
        priority
      });
      setShowRequestModal(false);
      setAssetId('');
      setIssueDescription('');
      setPriority('Medium');
      fetchInitialData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.put(`/maintenance/${selectedRequest._id}/approve`, {
        status: reviewStatus,
        technician
      });
      setShowReviewModal(false);
      setSelectedRequest(null);
      setTechnician('');
      fetchInitialData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to review request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.put(`/maintenance/${selectedRequest._id}/resolve`, {
        cost: cost ? parseFloat(cost) : undefined,
        resolutionNotes
      });
      setShowResolveModal(false);
      setSelectedRequest(null);
      setCost('');
      setResolutionNotes('');
      fetchInitialData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to resolve request');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Maintenance Log</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isManager ? 'Review, approve, and resolve all maintenance tickets across the organisation.' : 'Report issues with your equipment and track repair status.'}
          </p>
        </div>
        <Button onClick={() => setShowRequestModal(true)} className="gap-2 text-sm font-semibold">
          <Plus className="h-4.5 w-4.5" /> Raise Request
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {isManager ? (
          (['all', 'pending', 'resolved'] as const).map(tab => {
            const counts: Record<string, number> = {
              all: requests.length,
              pending: requests.filter(r => r.status === 'Pending').length,
              resolved: requests.filter(r => r.status === 'Resolved').length,
            };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer capitalize ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {tab === 'all' ? `All Tickets (${counts.all})` : tab === 'pending' ? `Pending (${counts.pending})` : `Resolved (${counts.resolved})`}
              </button>
            );
          })
        ) : (
          (['mine'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab('mine')}
              className="px-5 py-2.5 text-sm font-semibold border-b-2 border-primary text-primary cursor-pointer">
              My Tickets ({requests.filter(r => r.requestedBy?._id === user?._id).length})
            </button>
          ))
        )}
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Active Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tickets...</div>
          ) : (() => {
            const displayed = isManager
              ? activeTab === 'pending' ? requests.filter(r => r.status === 'Pending')
              : activeTab === 'resolved' ? requests.filter(r => r.status === 'Resolved')
              : requests
              : requests.filter(r => r.requestedBy?._id === user?._id);
            return displayed.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
              <Wrench className="h-10 w-10 text-muted-foreground/30 mb-2" />
              No active maintenance tickets found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Asset Tag</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Priority</th>
                    <th className="px-6 py-4 font-semibold">Requested By</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(() => {
                    const displayed = isManager
                      ? activeTab === 'pending' ? requests.filter(r => r.status === 'Pending')
                      : activeTab === 'resolved' ? requests.filter(r => r.status === 'Resolved')
                      : requests
                      : requests.filter(r => r.requestedBy?._id === user?._id);
                    return displayed.map((req) => (
                    <tr key={req._id} className="hover:bg-accent/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="flex flex-col">
                          <span className="font-semibold text-foreground">{req.asset?.name || 'Deleted Asset'}</span>
                          <span className="text-xs text-primary">{req.asset?.assetTag || 'N/A'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium max-w-xs truncate">{req.issueDescription}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          req.priority === 'Critical' || req.priority === 'High' ? 'bg-red-950/20 text-red-400 border-red-900/30' :
                          req.priority === 'Medium' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' :
                          'bg-stone-900/60 text-stone-400 border-stone-850'
                        }`}>
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{req.requestedBy?.name || 'User'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          req.status === 'Pending' ? 'bg-primary/20 text-primary border-primary/30' :
                          req.status === 'Approved' || req.status === 'In Progress' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                          req.status === 'Resolved' ? 'bg-stone-900/60 text-stone-400 border-stone-800' :
                          'bg-red-950/10 text-red-500 border-red-900/20'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isManager ? (
                          req.status === 'Pending' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowReviewModal(true);
                              }}
                            >
                              Review
                            </Button>
                          ) : req.status === 'Approved' || req.status === 'In Progress' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowResolveModal(true);
                              }}
                            >
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* CREATE TICKET MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Raise Maintenance Request</h3>
            
            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Select Affected Asset</label>
                <select 
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Issue Description</label>
                <textarea 
                  required
                  placeholder="Detail the issue: error codes, screen cracks, or power issues..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full h-24 px-3 py-2 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Raise Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW TICKET MODAL */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Review Ticket</h3>
            <p className="text-sm text-muted-foreground">
              Reviewing request for <span className="font-semibold text-foreground">{selectedRequest.asset?.name}</span>: "{selectedRequest.issueDescription}"
            </p>

            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleReviewRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Action</label>
                <select 
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="Approved">Approve / Put in Repair</option>
                  <option value="Rejected">Reject Request</option>
                </select>
              </div>

              {reviewStatus === 'Approved' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Technician Name (Optional)</label>
                  <Input 
                    placeholder="E.g., John (Internal Support) / External Vendor" 
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Reviewing...' : 'Save Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE TICKET MODAL */}
      {showResolveModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Resolve Ticket</h3>
            <p className="text-sm text-muted-foreground">
              Finalize repairs on <span className="font-semibold text-foreground">{selectedRequest.asset?.name}</span>
            </p>

            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleResolveRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Repair Cost (USD)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={cost} 
                  onChange={(e) => setCost(e.target.value)} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Resolution Notes</label>
                <textarea 
                  required
                  placeholder="What was fixed? E.g., Replaced battery, cleaned fan..." 
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full h-24 px-3 py-2 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowResolveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Resolving...' : 'Complete Repair'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
