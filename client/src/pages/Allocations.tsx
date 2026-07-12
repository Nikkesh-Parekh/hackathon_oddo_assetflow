import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus } from 'lucide-react';

export default function Allocations() {
  const { user } = useAuth();
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

  // Return Form State
  const [conditionIn, setConditionIn] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');
  
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
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
    fetchInitialData();
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
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
      // Reset form
      setAssetId('');
      setTargetUserId('');
      setTargetDeptId('');
      setExpectedReturnDate('');
      setConditionOut('Good');
      setNotes('');
      fetchInitialData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to allocate asset');
    } finally {
      setIsSubmitting(false);
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

  const isManager = user?.role === 'Admin' || user?.role === 'Asset Manager';
  const availableAssets = assets.filter((a) => a.status === 'Available');

  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Asset Allocations</h2>
          <p className="text-sm text-muted-foreground mt-1">Track which assets are allocated to users and departments.</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowAllocModal(true)} className="gap-2 text-sm font-semibold">
            <Plus className="h-4.5 w-4.5" /> Allocate Asset
          </Button>
        )}
      </div>

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
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No allocations recorded.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((alloc) => (
                      <tr key={alloc._id} className="hover:bg-accent/10 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary">{alloc.asset?.assetTag || 'N/A'}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{alloc.asset?.name || 'Deleted Asset'}</td>
                        <td className="px-6 py-4 text-foreground">
                          {alloc.assignedToUser ? (
                            <span className="flex flex-col">
                              <span className="font-medium">{alloc.assignedToUser.name}</span>
                              <span className="text-xs text-muted-foreground">Employee</span>
                            </span>
                          ) : alloc.assignedToDepartment ? (
                            <span className="flex flex-col">
                              <span className="font-medium">{alloc.assignedToDepartment.name}</span>
                              <span className="text-xs text-muted-foreground">Department</span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{alloc.assignedBy?.name || 'System'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            alloc.status === 'Active' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-stone-900/60 text-stone-400 border-stone-800'
                          }`}>
                            {alloc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {alloc.status === 'Active' && isManager ? (
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
                          ) : (
                            <span className="text-xs text-muted-foreground">Completed</span>
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

      {/* ALLOCATE MODAL */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Allocate Asset</h3>
            
            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Select Asset</label>
                <select 
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="">-- Choose Available Asset --</option>
                  {availableAssets.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
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
