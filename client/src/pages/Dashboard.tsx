import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Package, Wrench, Calendar,
  ArrowLeftRight, AlertTriangle, TrendingUp, Users,
  CheckCircle2, Clock, ClipboardCheck, BarChart3,
  Inbox, Star, Zap, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';

const PIE_COLORS = ['#34d399', 'hsl(151 65% 42%)', '#fbbf24', '#f87171'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const calls: Promise<any>[] = [
          api.get('/assets'),
          api.get('/bookings'),
          api.get('/maintenance'),
          api.get('/allocations'),
          api.get('/users/logs'),
        ];
        const isManager = user?.role === 'Admin' || user?.role === 'Asset Manager';
        if (isManager) {
          calls.push(api.get('/users'));
          calls.push(api.get('/audits/cycles'));
        }
        const [assetsRes, bookingsRes, maintRes, allocRes, logsRes, usersRes, auditsRes] = await Promise.all(calls);
        setAssets(assetsRes.data);
        setBookings(bookingsRes.data);
        setMaintenance(maintRes.data);
        setAllocations(allocRes.data);
        setActivities(logsRes.data);
        if (usersRes) setUsers(usersRes.data);
        if (auditsRes) setAudits(auditsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.role]);

  const now = new Date();
  const isAdmin = user?.role === 'Admin';
  const isAssetManager = user?.role === 'Asset Manager';
  const isManager = isAdmin || isAssetManager;
  const userId = user?._id;

  // Org-wide metrics
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const allocatedCount = assets.filter(a => a.status === 'Allocated').length;
  const maintenanceCount = assets.filter(a => a.status === 'Under Maintenance').length;
  const retiredCount = assets.filter(a => a.status === 'Retired' || a.status === 'Disposed').length;
  const pendingTransfersCount = allocations.filter(a => a.status === 'Transfer Requested').length;
  const pendingMaintenanceCount = maintenance.filter(m => m.status === 'Pending').length;
  const overdueAllocations = allocations.filter(a =>
    a.status === 'Active' && a.expectedReturnDate && new Date(a.expectedReturnDate) < now
  );
  const allocationPct = assets.length > 0 ? Math.round((allocatedCount / assets.length) * 100) : 0;
  const totalMaintenanceCost = maintenance.filter(m => m.status === 'Resolved' && m.cost).reduce((s, m) => s + (m.cost || 0), 0);

  // Department breakdown
  const deptMap: Record<string, number> = {};
  assets.forEach(a => { const d = a.department?.name || 'Unassigned'; deptMap[d] = (deptMap[d] || 0) + 1; });
  const deptData = Object.entries(deptMap).map(([name, count]) => ({ name, count }));

  // Condition distribution
  const condMap: Record<string, number> = { Excellent: 0, Good: 0, Fair: 0, 'Needs Repair': 0 };
  assets.forEach(a => { if (condMap[a.condition] !== undefined) condMap[a.condition]++; });
  const conditionData = Object.entries(condMap).map(([name, value]) => ({ name, value }));

  // Ongoing audit cycles
  const ongoingAudits = audits.filter(a => a.status === 'Ongoing');

  // My own data (employee view)
  const myAssets = allocations.filter(a => a.assignedToUser?._id === userId && a.status === 'Active');
  const myBookings = bookings.filter(b => b.user?._id === userId && (b.status === 'Upcoming' || b.status === 'Ongoing'));
  const myMaintenance = maintenance.filter(m => m.requestedBy?._id === userId);
  const myOverdue = myAssets.filter(a => a.expectedReturnDate && new Date(a.expectedReturnDate) < now);

  // Alert strip (manager only for most)
  const alerts = [
    overdueAllocations.length > 0 && {
      label: `${overdueAllocations.length} Overdue Return${overdueAllocations.length > 1 ? 's' : ''}`,
      color: 'bg-destructive/15 text-destructive border-destructive/25',
      icon: AlertTriangle,
    },
    pendingTransfersCount > 0 && isManager && {
      label: `${pendingTransfersCount} Pending Transfer${pendingTransfersCount > 1 ? 's' : ''}`,
      color: 'bg-amber-950/20 text-amber-400 border-amber-900/30',
      icon: ArrowLeftRight,
    },
    pendingMaintenanceCount > 0 && isManager && {
      label: `${pendingMaintenanceCount} Maintenance Awaiting Approval`,
      color: 'bg-amber-950/20 text-amber-400 border-amber-900/30',
      icon: Wrench,
    },
  ].filter(Boolean) as { label: string; color: string; icon: any }[];

  if (isLoading) return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(8)].map((_, i) => <Card key={i} className="h-24 border border-border animate-pulse bg-accent/10" />)}
    </div>
  );

  /* ═══════════════════════════════════════════
     ADMIN DASHBOARD
  ═══════════════════════════════════════════ */
  if (isAdmin) return (
    <div className="space-y-6 fade-in font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Admin</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Organisation Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Full visibility across all departments, assets, and operations.</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-bold text-foreground">{user?.name}</p>
        </div>
      </div>

      {/* Alert strip */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${a.color}`}>
              <a.icon className="h-3.5 w-3.5 shrink-0" />{a.label}
            </div>
          ))}
        </div>
      )}

      {/* Top KPI row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Total Assets', val: assets.length, icon: Package, color: 'text-primary', bg: 'bg-primary/10', sub: 'Registered in system' },
          { label: 'Employees', val: users.length, icon: Users, color: 'text-sky-400', bg: 'bg-sky-950/20', sub: 'Active users' },
          { label: 'Ongoing Audits', val: ongoingAudits.length, icon: ClipboardCheck, color: 'text-emerald-400', bg: 'bg-emerald-950/20', sub: 'In progress' },
          { label: 'Overdue Returns', val: overdueAllocations.length, icon: AlertTriangle, color: overdueAllocations.length > 0 ? 'text-destructive' : 'text-muted-foreground', bg: overdueAllocations.length > 0 ? 'bg-destructive/10' : 'bg-accent/10', sub: 'Need attention' },
        ].map((s, i) => (
          <Card key={i} className="border border-border bg-card">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`${s.bg} p-2.5 rounded-xl shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-none">{s.val}</p>
                <p className="text-xs font-semibold text-foreground mt-1">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset status breakdown */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Available', val: availableCount, color: 'text-emerald-400', border: 'border-emerald-900/30', bg: 'bg-emerald-950/10' },
          { label: 'Allocated', val: allocatedCount, color: 'text-primary', border: 'border-primary/30', bg: 'bg-primary/10' },
          { label: 'In Maintenance', val: maintenanceCount, color: 'text-amber-400', border: 'border-amber-900/30', bg: 'bg-amber-950/10' },
          { label: 'Retired/Disposed', val: retiredCount, color: 'text-muted-foreground', border: 'border-border', bg: 'bg-accent/10' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-4 text-center`}>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rate bars */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Allocation Rate', val: allocationPct, color: 'bg-primary' },
          { label: 'Pending Transfers', val: pendingTransfersCount, display: String(pendingTransfersCount), raw: Math.min(pendingTransfersCount * 10, 100), color: 'bg-amber-500' },
          { label: 'Total Repair Costs', val: null, display: `₹${totalMaintenanceCost.toLocaleString()}`, raw: 100, color: 'bg-sky-500' },
        ].map((s, i) => (
          <Card key={i} className="border border-border bg-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</span>
                <span className="text-xl font-extrabold text-foreground">{s.display ?? `${s.val}%`}</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.raw ?? s.val}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + Audit summary */}
      <div className="grid gap-5 md:grid-cols-7">
        <Card className="md:col-span-4 border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Assets by Department
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[230px]">
            {deptData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" name="Assets" fill="hsl(151 65% 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Condition Split
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={conditionData.filter(c => c.value > 0)} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {conditionData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Overdue + Activity */}
      {overdueAllocations.length > 0 && (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Overdue Returns — Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {overdueAllocations.slice(0, 6).map(a => (
                <div key={a._id} className="flex justify-between items-center p-2.5 rounded-lg bg-card border border-border text-xs">
                  <div>
                    <p className="font-bold text-foreground">{a.asset?.name}</p>
                    <p className="text-muted-foreground">{a.assignedToUser?.name || a.assignedToDepartment?.name}</p>
                  </div>
                  <span className="text-destructive font-bold">{a.expectedReturnDate ? format(new Date(a.expectedReturnDate), 'MMM d') : 'No date'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick nav */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Manage Assets', icon: Package, path: '/assets', sub: 'Register & edit' },
          { label: 'Approval Inbox', icon: Inbox, path: '/approvals', sub: `${pendingTransfersCount + pendingMaintenanceCount} pending`, highlight: pendingTransfersCount + pendingMaintenanceCount > 0 },
          { label: 'Run Audit', icon: ClipboardCheck, path: '/audits', sub: `${ongoingAudits.length} active cycles` },
          { label: 'Organisation', icon: Users, path: '/org', sub: 'Users & departments' },
        ].map((item, i) => (
          <button key={i} onClick={() => navigate(item.path)}
            className={`text-left p-4 rounded-xl border transition-all hover:border-primary/40 hover:bg-primary/5 ${item.highlight ? 'border-amber-900/30 bg-amber-950/10' : 'border-border bg-card'}`}>
            <item.icon className={`h-5 w-5 mb-2 ${item.highlight ? 'text-amber-400' : 'text-primary'}`} />
            <p className="text-sm font-bold text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     ASSET MANAGER DASHBOARD
  ═══════════════════════════════════════════ */
  if (isAssetManager) return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Asset Manager</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Inventory Control Centre</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage allocations, maintenance, and transfers.</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-bold text-foreground">{user?.name}</p>
        </div>
      </div>

      {/* Alert strip */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${a.color}`}>
              <a.icon className="h-3.5 w-3.5 shrink-0" />{a.label}
            </div>
          ))}
        </div>
      )}

      {/* Actionable KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Pending Transfers', val: pendingTransfersCount, icon: ArrowLeftRight, color: 'text-amber-400', bg: 'bg-amber-950/20', border: 'border-amber-900/30', cta: () => navigate('/approvals'), ctaLabel: 'Review' },
          { label: 'Maintenance Pending', val: pendingMaintenanceCount, icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-950/20', border: 'border-orange-900/30', cta: () => navigate('/approvals'), ctaLabel: 'Approve' },
          { label: 'Overdue Returns', val: overdueAllocations.length, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', cta: () => navigate('/allocations'), ctaLabel: 'View' },
          { label: 'Available for Issue', val: availableCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-900/30', cta: () => navigate('/assets'), ctaLabel: 'Allocate' },
        ].map((s, i) => (
          <Card key={i} className={`border ${s.border} bg-card`}>
            <CardContent className="p-4">
              <div className={`${s.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <p className="text-3xl font-extrabold text-foreground">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">{s.label}</p>
              <button onClick={s.cta} className={`text-[10px] font-bold ${s.color} hover:opacity-80 transition-opacity`}>
                {s.ctaLabel} →
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset status bar summary */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground">Inventory Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Available', val: availableCount, color: 'bg-emerald-500' },
              { label: 'Allocated', val: allocatedCount, color: 'bg-primary' },
              { label: 'In Maintenance', val: maintenanceCount, color: 'bg-amber-500' },
              { label: 'Retired / Disposed', val: retiredCount, color: 'bg-stone-600' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="text-foreground font-bold">{s.val} <span className="text-muted-foreground font-normal">of {assets.length}</span></span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: assets.length > 0 ? `${(s.val / assets.length) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent bookings + recent maintenance */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Active Resource Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No active bookings</p>
            ) : (
              <div className="space-y-2">
                {bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').slice(0, 5).map(b => (
                  <div key={b._id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-accent/10">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{b.asset?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.user?.name} · {format(new Date(b.startTime), 'MMM d, h:mma')}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${b.status === 'Ongoing' ? 'text-emerald-400 border-emerald-900/30 bg-emerald-950/10' : 'text-primary border-primary/30 bg-primary/10'}`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-400" /> Maintenance Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {maintenance.filter(m => m.status === 'Pending' || m.status === 'Approved').length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No pending maintenance</p>
            ) : (
              <div className="space-y-2">
                {maintenance.filter(m => m.status === 'Pending' || m.status === 'Approved').slice(0, 5).map(m => (
                  <div key={m._id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-accent/10">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{m.asset?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{m.issueDescription}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                      m.priority === 'Critical' ? 'text-destructive border-destructive/30 bg-destructive/10' :
                      m.priority === 'High' ? 'text-amber-400 border-amber-900/30 bg-amber-950/10' :
                      'text-muted-foreground border-border bg-accent/20'
                    }`}>{m.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit progress */}
      {ongoingAudits.length > 0 && (
        <Card className="border border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Active Audit Cycles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ongoingAudits.map(a => {
                const verified = a.results?.filter((r: any) => r.condition !== 'Missing' && r.condition !== 'Damaged').length || 0;
                const total = assets.filter(x => !a.locationScope || x.location?.includes(a.locationScope)).length;
                const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
                return (
                  <div key={a._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">{a.name}</span>
                      <span className="text-primary font-bold">{pct}% verified</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dept chart */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Asset Distribution by Department
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          {deptData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" name="Assets" fill="hsl(151 65% 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );

  /* ═══════════════════════════════════════════
     EMPLOYEE DASHBOARD
  ═══════════════════════════════════════════ */
  return (
    <div className="space-y-6 fade-in font-sans">
      {/* Personalised greeting */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Employee</span>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Here's a quick overview of your assets and activity.</p>
        </div>
        <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-extrabold uppercase shrink-0">
          {user?.name?.charAt(0)}
        </div>
      </div>

      {/* My overdue warning */}
      {myOverdue.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">You have {myOverdue.length} overdue return{myOverdue.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Please return the following assets as soon as possible: {myOverdue.map(a => a.asset?.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* My stat cards */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Assets Held', val: myAssets.length, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Active Bookings', val: myBookings.length, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-950/20' },
          { label: 'Maintenance Raised', val: myMaintenance.length, icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-950/20' },
        ].map((s, i) => (
          <Card key={i} className="border border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{s.val}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My assets list */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> My Assigned Assets
            </CardTitle>
            <button onClick={() => navigate('/profile')} className="text-[10px] text-primary hover:underline">View all →</button>
          </div>
        </CardHeader>
        <CardContent>
          {myAssets.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Package className="h-10 w-10 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground">No assets currently assigned to you.</p>
              <p className="text-xs text-muted-foreground">Contact your Asset Manager to request equipment.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myAssets.map(a => {
                const isOverdue = a.expectedReturnDate && new Date(a.expectedReturnDate) < now;
                return (
                  <div key={a._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{a.asset?.name}</p>
                        <p className="text-xs text-muted-foreground">{a.asset?.assetTag} · {a.asset?.location || 'No location'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {a.expectedReturnDate ? (
                        <p className={`text-xs font-semibold ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {isOverdue ? '⚠ Overdue' : 'Due'} {format(new Date(a.expectedReturnDate), 'MMM d')}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No return date</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My upcoming bookings */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" /> My Upcoming Bookings
            </CardTitle>
            <button onClick={() => navigate('/bookings')} className="text-[10px] text-primary hover:underline">Book resource →</button>
          </div>
        </CardHeader>
        <CardContent>
          {myBookings.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Calendar className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/bookings')}>Book a Resource</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myBookings.map(b => (
                <div key={b._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-accent/5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-950/20 flex flex-col items-center justify-center shrink-0 border border-emerald-900/30">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">{format(new Date(b.startTime), 'MMM')}</span>
                    <span className="text-sm font-extrabold text-emerald-400 leading-none">{format(new Date(b.startTime), 'd')}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{b.asset?.name}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(b.startTime), 'h:mma')} → {format(new Date(b.endTime), 'h:mma')}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${b.status === 'Ongoing' ? 'text-emerald-400 border-emerald-900/30 bg-emerald-950/10' : 'text-primary border-primary/30 bg-primary/10'}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent system activity */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 6).map((act: any) => (
                <div key={act._id} className="flex items-start gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider truncate">{act.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-muted-foreground">By {act.user?.name || 'System'}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 shrink-0">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
