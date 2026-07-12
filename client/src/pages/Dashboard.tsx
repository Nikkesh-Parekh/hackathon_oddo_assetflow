import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Package, Briefcase, Wrench, Calendar, 
  ArrowLeftRight, AlertTriangle, Play, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [assetsRes, bookingsRes, maintRes, allocRes, logsRes] = await Promise.all([
          api.get('/assets'),
          api.get('/bookings'),
          api.get('/maintenance'),
          api.get('/allocations'),
          api.get('/users/logs')
        ]);
        setAssets(assetsRes.data);
        setBookings(bookingsRes.data);
        setMaintenance(maintRes.data);
        setAllocations(allocRes.data);
        setActivities(logsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Compute metrics
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const allocatedCount = assets.filter(a => a.status === 'Allocated').length;
  const activeBookingsCount = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length;
  const maintenanceCount = maintenance.filter(m => m.status === 'Approved' || m.status === 'In Progress' || m.status === 'Pending').length;
  const pendingTransfersCount = allocations.filter(a => a.status === 'Transfer Requested').length;

  const now = new Date();
  const overdueAllocations = allocations.filter(a => {
    return (
      a.status === 'Active' && 
      a.expectedReturnDate && 
      new Date(a.expectedReturnDate) < now
    );
  });

  const upcomingReturnsCount = allocations.filter(a => {
    return (
      a.status === 'Active' && 
      a.expectedReturnDate && 
      new Date(a.expectedReturnDate) >= now
    );
  }).length;

  const stats = [
    { title: 'Assets Available', value: availableCount.toString(), icon: Package, border: 'border-border' },
    { title: 'Assets Allocated', value: allocatedCount.toString(), icon: Briefcase, border: 'border-border' },
    { title: 'Active Repairs', value: maintenanceCount.toString(), icon: Wrench, border: 'border-border' },
    { title: 'Active Bookings', value: activeBookingsCount.toString(), icon: Calendar, border: 'border-border' },
  ];

  return (
    <div className="space-y-6 fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-primary">{user?.name}</span> ({user?.role}). Here is the current state of company assets.
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <Card className="border border-border bg-accent/10">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-4.5 w-4.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Quick Commands:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {(user?.role === 'Admin' || user?.role === 'Asset Manager') && (
              <Button size="sm" onClick={() => navigate('/assets')}>
                Register Asset
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => navigate('/bookings')}>
              Book Resource
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/maintenance')}>
              Raise Repair Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Returns Alert Panel */}
      {overdueAllocations.length > 0 && (
        <Card className="border border-destructive/25 bg-destructive/10 text-destructive">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-bold text-foreground">Overdue Returns Alert!</h4>
              <p className="text-xs text-muted-foreground">
                The following {overdueAllocations.length} assets have passed their expected return date. Please coordinate checkout reconciliations.
              </p>
              <div className="mt-2 space-y-1">
                {overdueAllocations.slice(0, 3).map((alloc) => (
                  <div key={alloc._id} className="text-xs flex justify-between max-w-md bg-card/60 p-1.5 rounded border border-border">
                    <span className="font-semibold text-foreground">{alloc.asset?.name} ({alloc.asset?.assetTag})</span>
                    <span className="text-muted-foreground">Held by: {alloc.assignedToUser?.name || alloc.assignedToDepartment?.name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-28 border border-border animate-pulse bg-accent/20" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="hover:border-primary/20 transition-all duration-250 border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4.5 w-4.5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Auxiliary Metrics row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Transfers</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">{pendingTransfersCount}</div>
            <ArrowLeftRight className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Returns</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">{upcomingReturnsCount}</div>
            <Calendar className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Inventory Assets</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">{assets.length}</div>
            <Package className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Visual trends and activities */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Dynamic Area chart */}
        <Card className="md:col-span-4 border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Asset Utilizations</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={[
                  { name: 'Available', count: availableCount },
                  { name: 'Allocated', count: allocatedCount },
                  { name: 'Maintenance', count: maintenanceCount }
                ]} 
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorAllocated)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-time System activities logs */}
        <Card className="md:col-span-3 border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">System Audit Trails</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-xs text-muted-foreground py-8">Loading audit logs...</div>
            ) : activities.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 flex flex-col items-center justify-center">
                <HelpCircle className="h-8 w-8 text-muted-foreground/30 mb-1" />
                No actions logged yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {activities.map((act) => (
                  <div key={act._id} className="flex items-start gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="space-y-0.5 flex-1 overflow-hidden">
                      <p className="text-xs font-semibold text-foreground truncate uppercase tracking-wider">{act.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        By {act.user?.name || 'System'} | ID: {act.entityId || '-'}
                      </p>
                    </div>
                    <div className="text-[10px] text-muted-foreground/50 shrink-0">
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
