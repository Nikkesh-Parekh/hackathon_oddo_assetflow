import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Check, ShieldAlert, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function Audits() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [cycleResults, setCycleResults] = useState<any[]>([]);

  // New Cycle State
  const [name, setName] = useState('');
  const [locationScope, setLocationScope] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditorIds, setAuditorIds] = useState<string[]>([]);
  
  // Submit Verification State
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchCyclesAndMetadata = async () => {
    setIsLoading(true);
    try {
      const [cycleRes, assetRes, userRes] = await Promise.all([
        api.get('/audits/cycles'),
        api.get('/assets'),
        api.get('/users')
      ]);
      setCycles(cycleRes.data);
      setAssets(assetRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error('Failed to fetch audits data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCyclesAndMetadata();
  }, []);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/audits/cycles', {
        name,
        locationScope,
        startDate,
        endDate,
        auditors: auditorIds
      });
      setShowCreateModal(false);
      setName('');
      setLocationScope('');
      setStartDate('');
      setEndDate('');
      setAuditorIds([]);
      fetchCyclesAndMetadata();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to start audit cycle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAsset = async (assetId: string, status: string) => {
    setSubmitError('');
    try {
      await api.post('/audits/results', {
        auditCycleId: activeCycle._id,
        assetId,
        status,
        notes: notes || 'Verified during cycle'
      });
      setNotes('');
      // Reload results for current cycle
      const resultsRes = await api.get(`/audits/cycles/${activeCycle._id}/results`);
      setCycleResults(resultsRes.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit verification');
    }
  };

  const handleViewDetails = async (cycle: any) => {
    setActiveCycle(cycle);
    try {
      const resultsRes = await api.get(`/audits/cycles/${cycle._id}/results`);
      setCycleResults(resultsRes.data);
    } catch (err) {
      console.error('Failed to load audit results', err);
    }
  };

  const isManager = user?.role === 'Admin' || user?.role === 'Asset Manager';
  const isDesignatedAuditor = activeCycle?.auditors?.some((aud: any) => aud._id === user?._id);
  const isAuditor = isManager || isDesignatedAuditor;

  // Toggle auditor selection
  const handleToggleAuditor = (id: string) => {
    if (auditorIds.includes(id)) {
      setAuditorIds(auditorIds.filter(a => a !== id));
    } else {
      setAuditorIds([...auditorIds, id]);
    }
  };

  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Asset Reconciliation & Auditing</h2>
          <p className="text-sm text-muted-foreground mt-1">Conduct active inventory verification audits to log verified, missing, or damaged assets.</p>
        </div>
        {isManager && !activeCycle && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 text-sm font-semibold">
            <Plus className="h-4.5 w-4.5" /> Start Audit Cycle
          </Button>
        )}
        {activeCycle && (
          <Button variant="outline" onClick={() => setActiveCycle(null)}>
            ← Back to Cycles
          </Button>
        )}
      </div>

      {!activeCycle ? (
        // CYCLES LIST VIEW
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Audit Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground font-sans">Loading audits...</div>
            ) : cycles.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                <ShieldAlert className="h-10 w-10 text-muted-foreground/35 mb-2" />
                No inventory audits created yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cycles.map(cycle => {
                  // Compute progress from results stored on the cycle (or default to 0)
                  const scopedAssets = assets.filter(a =>
                    !cycle.locationScope || a.location?.includes(cycle.locationScope)
                  );
                  const total = scopedAssets.length;
                  const verified = cycle.results?.filter((r: any) => r.condition !== 'Missing' && r.condition !== 'Damaged').length || 0;
                  const missing = cycle.results?.filter((r: any) => r.condition === 'Missing').length || 0;
                  const damaged = cycle.results?.filter((r: any) => r.condition === 'Damaged').length || 0;
                  const remaining = Math.max(0, total - (verified + missing + damaged));
                  const pct = total > 0 ? Math.round(((verified + missing + damaged) / total) * 100) : 0;

                  return (
                    <div key={cycle._id} className="rounded-xl border border-border bg-accent/5 p-4 space-y-3 hover:border-primary/20 transition-colors">
                      {/* Title + Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-sm text-foreground">{cycle.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cycle.locationScope ? `📍 ${cycle.locationScope}` : '🌐 All Locations'}
                            {' · '}
                            {format(new Date(cycle.startDate), 'MMM d')} – {format(new Date(cycle.endDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          cycle.status === 'Ongoing' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                          cycle.status === 'Upcoming' ? 'bg-primary/20 text-primary border-primary/30' :
                          'bg-stone-900/60 text-stone-400 border-stone-700'
                        }`}>
                          {cycle.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Audit Progress</span>
                          <span className="font-bold text-foreground">{pct}% complete</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Breakdown stats */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: 'Verified', val: verified, color: 'text-emerald-400' },
                          { label: 'Missing', val: missing, color: 'text-destructive' },
                          { label: 'Damaged', val: damaged, color: 'text-amber-400' },
                          { label: 'Remaining', val: remaining, color: 'text-muted-foreground' },
                        ].map(s => (
                          <div key={s.label} className="bg-card rounded-lg p-2 border border-border">
                            <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" onClick={() => handleViewDetails(cycle)}>
                        <Eye className="h-3.5 w-3.5" /> Open Reconciliation Sheet
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      ) : (
        // ACTIVE CYCLE SHEET
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card className="border border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-lg font-bold text-foreground">
                  Audit Reconciliation list: {activeCycle.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Check assets in scope and log their actual physical status.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {assets
                    .filter(asset => !activeCycle.locationScope || asset.location?.includes(activeCycle.locationScope))
                    .map(asset => {
                      const res = cycleResults.find(r => r.asset?._id === asset._id);
                      return (
                        <div key={asset._id} className="p-4 flex items-center justify-between hover:bg-accent/5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-sm text-foreground">{asset.name}</span>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>Tag: <strong className="text-primary">{asset.assetTag}</strong></span>
                              <span>Location: {asset.location}</span>
                              <span>Condition: {asset.condition}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {res ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                                  res.status === 'Verified' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                                  res.status === 'Missing' ? 'bg-red-950/10 text-red-400 border-red-900/30' :
                                  'bg-amber-950/20 text-amber-400 border-amber-900/30'
                                }`}>
                                  {res.status === 'Verified' && <Check className="h-3 w-3 shrink-0" />}
                                  {res.status}
                                </span>
                                {isAuditor && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs px-2 text-muted-foreground"
                                    onClick={() => handleVerifyAsset(asset._id, 'Verified')}
                                  >
                                    Reset
                                  </Button>
                                )}
                              </div>
                            ) : isAuditor ? (
                              <div className="flex gap-1.5">
                                <Button 
                                  variant="outline" 
                                  className="h-8 text-xs font-semibold px-2.5 text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/20"
                                  onClick={() => handleVerifyAsset(asset._id, 'Verified')}
                                >
                                  Verify
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="h-8 text-xs font-semibold px-2.5 text-amber-400 border-amber-900/30 hover:bg-amber-950/20"
                                  onClick={() => handleVerifyAsset(asset._id, 'Damaged')}
                                >
                                  Damage
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="h-8 text-xs font-semibold px-2.5 text-red-400 border-red-900/30 hover:bg-red-950/20"
                                  onClick={() => handleVerifyAsset(asset._id, 'Missing')}
                                >
                                  Missing
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Awaiting Auditor</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-md font-semibold text-foreground">Cycle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium text-foreground">{format(new Date(activeCycle.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-medium text-foreground">{format(new Date(activeCycle.endDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auditors:</span>
                  <span className="font-medium text-foreground">
                    {activeCycle.auditors?.map((a: any) => a.name).join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <h4 className="font-semibold text-foreground text-xs mb-2">Audit Notes / Custom Override</h4>
                  <Input 
                    placeholder="Log audit observations..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* INITIATE CYCLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-foreground">Initiate Audit Cycle</h3>
            
            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Audit Cycle Name</label>
                <Input 
                  required 
                  placeholder="E.g., Q3 HQ Electronics Audit" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Location Scope (Optional)</label>
                <Input 
                  placeholder="E.g., Floor 1 / HQ" 
                  value={locationScope}
                  onChange={(e) => setLocationScope(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
                  <Input 
                    type="date" 
                    required 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">End Date</label>
                  <Input 
                    type="date" 
                    required 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Assign Auditors</label>
                <div className="max-h-28 overflow-y-auto border border-border rounded-lg p-2 space-y-1.5 bg-background">
                  {users.map(u => (
                    <label key={u._id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-accent/40 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={auditorIds.includes(u._id)} 
                        onChange={() => handleToggleAuditor(u._id)} 
                      />
                      {u.name} ({u.role})
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Starting...' : 'Initiate Audit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
