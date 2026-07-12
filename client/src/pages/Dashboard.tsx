import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Package, Briefcase, Wrench, Calendar } from 'lucide-react';
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

const chartData = [
  { name: 'Jan', Allocated: 45, Available: 120 },
  { name: 'Feb', Allocated: 58, Available: 125 },
  { name: 'Mar', Allocated: 69, Available: 130 },
  { name: 'Apr', Allocated: 78, Available: 110 },
  { name: 'May', Allocated: 85, Available: 105 },
  { name: 'Jun', Allocated: 89, Available: 142 },
];

export default function Dashboard() {
  const { user } = useAuth();
  
  const stats = [
    { title: 'Assets Available', value: '142', icon: Package, bg: 'bg-emerald-50 dark:bg-emerald-950/20', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
    { title: 'Assets Allocated', value: '89', icon: Briefcase, bg: 'bg-stone-50 dark:bg-stone-900/40', color: 'text-stone-600 dark:text-stone-400', border: 'border-stone-100 dark:border-stone-800' },
    { title: 'Maintenance Today', value: '12', icon: Wrench, bg: 'bg-amber-50 dark:bg-amber-950/20', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' },
    { title: 'Active Bookings', value: '24', icon: Calendar, bg: 'bg-accent/50', color: 'text-primary', border: 'border-accent' },
  ];

  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className={`hover:shadow-md hover:border-primary/20 transition-all duration-200 border ${stat.border}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl border ${stat.border} ${stat.bg} ${stat.color} shrink-0`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Chart and Activity */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Asset Allocation Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-6 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-card)', 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-foreground)',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="Allocated" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAllocated)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'New asset registered', desc: 'MacBook Pro was added to Engineering', time: '2h ago' },
                { label: 'Booking confirmed', desc: 'Meeting Room B booked for tomorrow', time: '4h ago' },
                { label: 'Maintenance complete', desc: 'Dell Monitor repaired successfully', time: '1d ago' },
                { label: 'Asset assigned', desc: 'iPad Air allocated to Sales Team', time: '2d ago' },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <p className="text-sm font-semibold text-foreground leading-none">{act.label}</p>
                    <p className="text-xs text-muted-foreground">{act.desc}</p>
                  </div>
                  <div className="text-xs text-muted-foreground/60 shrink-0">{act.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
