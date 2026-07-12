import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Check, X, Info } from 'lucide-react';

export default function Allocations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'transfers'>('active');

  const [allocations, setAllocations] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<any>(null);

  // New Allocation Form State
  const [assetId, setAssetId] = useState('');
  const [assignType, setAssignType] = useState<'user' | 'department'>('user');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [conditionOut, setConditionOut] = useState('Good');
  const [notes, setNotes] = useState('');

  // Conflict state
  const [conflictAllocId, setConflictAllocId] = useState('');
  const [conflictHolder, setConflictHolder] = useState('');
  const [conflictDept, setConflictDept] = useState('');
  const [conflictReturnDate, setConflictReturnDate] = useState('');
  const [conflictAssetName, setConflictAssetName] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [isRequestingTransfer, setIsRequestingTransfer] = useState(false);

  // Return Form State
  const [conditionIn, setConditionIn] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');
  
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [allocRes, assetRes, userRes, deptRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/assets'),
        api.get('/users'),
        api.get('/org/departments')
      ]);
      setAllocations(allocRes.data);
      setAssets(assetRes.data);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData(true);
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setConflictAllocId('');
    setConflictHolder('');
    setIsSubmitting(true);
    try {
      const payload = {
        assetId,
        assignedToUser: assignType === 'user' ? targetUserId || undefined : undefined,
        assignedToDepartment: assignType === 'department' ? targetDeptId || undefined : undefined,
        expectedReturnDate: expectedReturnDate || undefined,
        conditionOut,
        notes
      };
      await api.post('/allocations', payload);
      setShowAllocModal(false);
      resetForm();
      fetchInitialData();
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Double allocation conflict! Offer transfer request
        const d = err.response.data;
        setConflictAllocId(d.allocationId);
        setConflictHolder(d.currentHolder || 'Unknown');
        setConflictDept(d.department || '');
        setConflictReturnDate(d.expectedReturnDate || '');
        setConflictAssetName(assets.find(a => a._id === assetId)?.name || '');
        setSubmitError('CONFLICT');
      } else {
        setSubmitError(err.response?.data?.message || 'Failed to allocate asset');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestTransfer = async () => {
    if (!conflictAllocId) return;
    setSubmitError('');
    setIsRequestingTransfer(true);
    try {
      await api.post(`/allocations/${conflictAllocId}/transfer`, {
        transferNotes: transferNotes || 'Requesting transfer of this item.'
      });
      setShowAllocModal(false);
      resetForm();
      fetchInitialData();
      alert('Transfer request submitted successfully!');
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to request transfer');
    } finally {
      setIsRequestingTransfer(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post(`/allocations/${selectedAlloc._id}/return`, {
        conditionIn,
        notes: returnNotes
      });
      setShowReturnModal(false);
      setSelectedAlloc(null);
      setReturnNotes('');
      fetchInitialData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewTransfer = async (allocId: string, action: 'approve' | 'reject') => {
    const confirmation = window.confirm(`Are you sure you want to ${action} this transfer request?`);
    if (!confirmation) return;
    try {
      await api.post(`/allocations/${allocId}/transfer/review`, {
        action,
        conditionIn: 'Good',
        notes: `${action.toUpperCase()} transfer request`
      });
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process transfer review');
    }
  };

  const resetForm = () => {
    setAssetId('');
    setTargetUserId('');
    setTargetDeptId('');
    setExpectedReturnDate('');
    setConditionOut('Good');
    setNotes('');
    setConflictAllocId('');
    setConflictHolder('');
    setConflictDept('');
    setConflictReturnDate('');
    setConflictAssetName('');
    setTransferNotes('');
  };

  const isManager = user?.role === 'Admin' || user?.role === 'Asset Manager';
  
  // Available assets (status is 'Available' OR status is 'Allocated' for transfer checks)
  const allocationAssets = assets.filter((a) => a.status === 'Available' || a.status === 'Allocated');

  const activeAllocations = allocations.filter(a => a.status === 'Active');
  const transferRequests = allocations.filter(a => a.status === 'Transfer Requested');

  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Asset Allocations & Transfers</h2>
          <p className="text-sm text-muted-foreground mt-1">Track asset ownership or review cross-departmental transfer requests.</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowAllocModal(true)} className="gap-2 text-sm font-semibold">
            <Plus className="h-4.5 w-4.5" /> Allocate Asset
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'active' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Active Checkouts
        </button>
        {isManager && (
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'transfers' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Transfers ({transferRequests.length})
          </button>
        )}
      </div>

      {/* ACTIVE CHECKOUTS GRID */}
      {activeTab === 'active' && (
        <Card className="border border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading allocations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Asset Tag</th>
                      <th className="px-6 py-4 font-semibold">Asset Name</th>
                      <th className="px-6 py-4 font-semibold">Allocated To</th>
                      <th className="px-6 py-4 font-semibold">Allocated By</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeAllocations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          No active checkouts found.
                        </td>
                      </tr>
                    ) : (
                      activeAllocations.map((alloc) => (
                        <tr key={alloc._id} className="hover:bg-accent/10 transition-colors">
                          <td className="px-6 py-4 font-semibold text-primary">{alloc.asset?.assetTag || 'N/A'}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{alloc.asset?.name || 'Deleted Asset'}</td>
                          <td className="px-6 py-4 text-foreground">
                            {alloc.assignedToUser ? (
                              <span className="flex flex-col">
                                <span className="font-semibold">{alloc.assignedToUser.name}</span>
                                <span className="text-xs text-muted-foreground">Employee</span>
                              </span>
                            ) : alloc.assignedToDepartment ? (
                              <span className="flex flex-col">
                                <span className="font-semibold">{alloc.assignedToDepartment.name}</span>
                                <span className="text-xs text-muted-foreground">Department</span>
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{alloc.assignedBy?.name || 'System'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border bg-emerald-950/20 text-emerald-400 border-emerald-900/30">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isManager && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedAlloc(alloc);
                                  setShowReturnModal(true);
                                }}
                              >
                                Return
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PENDING TRANSFERS REVIEW GRID */}
      {activeTab === 'transfers' && isManager && (
        <Card className="border border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Asset Tag</th>
                    <th className="px-6 py-4 font-semibold">Current Holder</th>
                    <th className="px-6 py-4 font-semibold">Transfer Requester</th>
                    <th className="px-6 py-4 font-semibold">Reason / Notes</th>
                    <th className="px-6 py-4 font-semibold text-right">Review Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transferRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No pending asset transfer requests found.
                      </td>
                    </tr>
                  ) : (
                    transferRequests.map((alloc) => (
                      <tr key={alloc._id} className="hover:bg-accent/10 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary">{alloc.asset?.assetTag}</td>
                        <td className="px-6 py-4 text-foreground">
                          {alloc.assignedToUser?.name || alloc.assignedToDepartment?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 font-medium text-emerald-400">
                          {alloc.transferRequestedBy?.name || 'Employee'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{alloc.transferNotes}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/20"
                            onClick={() => handleReviewTransfer(alloc._id, 'approve')}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-400 border-red-900/30 hover:bg-red-950/20"
                            onClick={() => handleReviewTransfer(alloc._id, 'reject')}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ALLOCATE MODAL WITH CONFLICT RESOLUTION */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground">Allocate Asset</h3>
            
            {submitError && submitError !== 'CONFLICT' && (
              <div className="p-3 text-xs rounded-lg border flex gap-2 items-start bg-destructive/10 text-destructive border-destructive/20">
                <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <p className="font-semibold">{submitError}</p>
              </div>
            )}

            {/* Rich Conflict Card */}
            {conflictAllocId && (
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 overflow-hidden">
                <div className="px-4 py-3 bg-amber-950/20 border-b border-amber-900/30 flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Asset Currently In Use</p>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">{conflictAssetName}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Holder</p>
                      <p className="text-sm font-bold text-foreground">{conflictHolder}</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Department</p>
                      <p className="text-sm font-bold text-foreground">{conflictDept || '—'}</p>
                    </div>
                    {conflictReturnDate && (
                      <div className="col-span-2 bg-card rounded-lg p-3 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Expected Return</p>
                        <p className="text-sm font-bold text-amber-400">{new Date(conflictReturnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">You can raise a transfer request to move this asset to a new holder.</p>
                </div>
              </div>
            )}

            {!conflictAllocId ? (
              <form onSubmit={handleAllocate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Select Asset</label>
                  <select 
                    required
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                  >
                    <option value="">-- Choose Asset --</option>
                    {allocationAssets.map(a => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({a.assetTag}) [{a.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Allocate To</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                      <input 
                        type="radio" 
                        name="assignType" 
                        checked={assignType === 'user'} 
                        onChange={() => setAssignType('user')} 
                      />
                      User
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                      <input 
                        type="radio" 
                        name="assignType" 
                        checked={assignType === 'department'} 
                        onChange={() => setAssignType('department')} 
                      />
                      Department
                    </label>
                  </div>
                </div>

                {assignType === 'user' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Target User</label>
                    <select 
                      required
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                    >
                      <option value="">-- Select User --</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Target Department</label>
                    <select 
                      required
                      value={targetDeptId}
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Expected Return</label>
                    <Input 
                      type="date" 
                      value={expectedReturnDate} 
                      onChange={(e) => setExpectedReturnDate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Condition Out</label>
                    <select 
                      value={conditionOut}
                      onChange={(e) => setConditionOut(e.target.value)}
                      className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Needs Repair">Needs Repair</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Notes</label>
                  <Input 
                    placeholder="Additional context/serial numbers..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowAllocModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Allocate'}
                  </Button>
                </div>
              </form>
            ) : (
              // TRANSFER REQUEST ACTIONS
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Transfer Request Reason</label>
                  <Input 
                    required 
                    placeholder={`E.g., Urgently required for department presentation...`} 
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleRequestTransfer} disabled={isRequestingTransfer}>
                    {isRequestingTransfer ? 'Requesting...' : `Request Transfer from ${conflictHolder}`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {showReturnModal && selectedAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Return Asset</h3>
            <p className="text-sm text-muted-foreground">
              Confirm return of <span className="font-semibold text-foreground">{selectedAlloc.asset?.name}</span>
            </p>

            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleReturn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Condition In</label>
                <select 
                  value={conditionIn}
                  onChange={(e) => setConditionIn(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Repair">Needs Repair</option>
                  <option value="Broken">Broken</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Return Notes</label>
                <Input 
                  placeholder="Reason for return/damage notes..." 
                  value={returnNotes} 
                  onChange={(e) => setReturnNotes(e.target.value)} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Confirm Return'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
