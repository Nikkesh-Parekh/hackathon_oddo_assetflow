import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, X, Inbox, ArrowLeftRight, Wrench, AlertTriangle } from 'lucide-react';

export default function Approvals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'transfers' | 'maintenance' | 'history'>('transfers');

  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [pendingMaintenance, setPendingMaintenance] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [allocRes, maintRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/maintenance'),
      ]);
      setPendingTransfers(allocRes.data.filter((a: any) => a.status === 'Transfer Requested'));
      setPendingMaintenance(maintRes.data.filter((m: any) => m.status === 'Pending'));
      
      const pastMaint = maintRes.data.filter((m: any) => m.status === 'Approved' || m.status === 'Rejected' || m.status === 'Resolved');
      setHistory(pastMaint);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  const handleTransferAction = async (id: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} this transfer?`)) return;
    try {
      await api.post(`/allocations/${id}/transfer/review`, {
        action,
        conditionIn: 'Good',
        notes: `${action === 'approve' ? 'Transfer approved' : 'Transfer rejected'} by ${user?.name}`,
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} transfer`);
    }
  };

  const handleMaintenanceAction = async (id: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} this maintenance request?`)) return;
    try {
      await api.put(`/maintenance/${id}/approve`, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} maintenance request`);
    }
  };

  const totalPending = pendingTransfers.length + pendingMaintenance.length;

  return (
    <div className="space-y-6 fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" /> Approval Inbox
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and action all pending approval workflows in one place.
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/30 border border-amber-900/30 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-bold">{totalPending} pending {totalPending === 1 ? 'approval' : 'approvals'}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'transfers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          Transfer Requests
          {pendingTransfers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {pendingTransfers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'maintenance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wrench className="h-4 w-4" />
          Maintenance Approvals
          {pendingMaintenance.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
              {pendingMaintenance.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Inbox className="h-4 w-4" />
          Previously Approved
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Loading approvals...</div>
      ) : (
        <>
          {/* TRANSFER APPROVALS */}
          {activeTab === 'transfers' && (
            <div className="space-y-3">
              {pendingTransfers.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <ArrowLeftRight className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm">No pending transfer requests.</p>
                </div>
              ) : (
                pendingTransfers.map(t => (
                  <Card key={t._id} className="border border-border bg-card">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        {/* Asset info */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {t.asset?.assetTag}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{t.asset?.name}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Current Holder:</span>
                            <span className="text-foreground font-semibold ml-1">
                              {t.assignedToUser?.name || t.assignedToDepartment?.name || 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Requested By:</span>
                            <span className="text-emerald-400 font-semibold ml-1">{t.transferRequestedBy?.name || 'Unknown'}</span>
                          </div>
                          {t.expectedReturnDate && (
                            <div>
                              <span className="text-muted-foreground">Expected Return:</span>
                              <span className="text-amber-400 font-semibold ml-1">
                                {new Date(t.expectedReturnDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {t.transferNotes && (
                          <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                            "{t.transferNotes}"
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleTransferAction(t._id, 'approve')}
                          className="gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white border-0"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransferAction(t._id, 'reject')}
                          className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* MAINTENANCE APPROVALS */}
          {activeTab === 'maintenance' && (
            <div className="space-y-3">
              {pendingMaintenance.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Wrench className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm">No pending maintenance requests.</p>
                </div>
              ) : (
                pendingMaintenance.map(m => (
                  <Card key={m._id} className="border border-border bg-card">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {m.asset?.assetTag}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{m.asset?.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            m.priority === 'Critical' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                            m.priority === 'High' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' :
                            m.priority === 'Medium' ? 'bg-sky-950/20 text-sky-400 border-sky-900/30' :
                            'bg-stone-900/60 text-stone-400 border-stone-700'
                          }`}>{m.priority}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Raised By:</span>
                            <span className="text-foreground font-semibold ml-1">{m.requestedBy?.name || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <span className="text-amber-400 font-semibold ml-1">{m.status}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                          {m.issueDescription}
                        </p>
                      </div>

                      {m.status === 'Pending' && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleMaintenanceAction(m._id, 'approve')}
                            className="gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white border-0"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMaintenanceAction(m._id, 'reject')}
                            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                      {m.status === 'Approved' && (
                        <span className="text-xs font-semibold text-emerald-400 border border-emerald-900/30 px-3 py-1 rounded-lg bg-emerald-950/20 shrink-0">
                          ✓ Approved
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* HISTORY APPROVALS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Inbox className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm">No previously approved requests.</p>
                </div>
              ) : (
                history.map(m => (
                  <Card key={m._id} className="border border-border bg-card opacity-80">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {m.asset?.assetTag}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{m.asset?.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            m.priority === 'Critical' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                            m.priority === 'High' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' :
                            m.priority === 'Medium' ? 'bg-sky-950/20 text-sky-400 border-sky-900/30' :
                            'bg-stone-900/60 text-stone-400 border-stone-700'
                          }`}>{m.priority}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Raised By:</span>
                            <span className="text-foreground font-semibold ml-1">{m.requestedBy?.name || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Final Status:</span>
                            <span className={`font-semibold ml-1 ${m.status === 'Approved' ? 'text-emerald-400' : m.status === 'Resolved' ? 'text-blue-400' : 'text-destructive'}`}>{m.status}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                          {m.issueDescription}
                        </p>
                      </div>

                      <span className={`text-xs font-semibold border px-3 py-1 rounded-lg shrink-0 ${m.status === 'Approved' ? 'text-emerald-400 border-emerald-900/30 bg-emerald-950/20' : m.status === 'Resolved' ? 'text-blue-400 border-blue-900/30 bg-blue-950/20' : 'text-destructive border-destructive/30 bg-destructive/10'}`}>
                        {m.status === 'Approved' ? '✓ Approved' : m.status === 'Resolved' ? '✓ Resolved' : '✗ Rejected'}
                      </span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
