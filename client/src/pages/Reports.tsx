import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Shield, Wrench, DollarSign, Package } from 'lucide-react';

const COLORS = ['var(--color-primary)', 'var(--color-accent-foreground)', '#b794f4', '#f56565'];

export default function Reports() {
  const [assets, setAssets] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, maintRes] = await Promise.all([
          api.get('/assets'),
          api.get('/maintenance')
        ]);
        setAssets(assetsRes.data);
        setMaintenance(maintRes.data);
      } catch (err) {
        console.error('Failed to fetch reports data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. Calculate stats
  const totalAssets = assets.length;
  const availableAssetsCount = assets.filter(a => a.status === 'Available').length;
  const allocatedAssetsCount = assets.filter(a => a.status === 'Allocated').length;
  const maintenanceAssetsCount = assets.filter(a => a.status === 'Under Maintenance').length;

  const totalMaintenanceCost = maintenance
    .filter(m => m.status === 'Resolved' && m.cost)
    .reduce((sum, current) => sum + (current.cost || 0), 0);

  // 2. Data formatting for Charts
  const statusData = [
    { name: 'Available', value: availableAssetsCount },
    { name: 'Allocated', value: allocatedAssetsCount },
    { name: 'Under Repair', value: maintenanceAssetsCount }
  ];

  // Category Distribution Chart
  const categoriesMap: { [key: string]: number } = {};
  assets.forEach(asset => {
    const catName = asset.category?.name || 'Uncategorized';
    categoriesMap[catName] = (categoriesMap[catName] || 0) + 1;
  });
  const categoryData = Object.keys(categoriesMap).map(key => ({
    name: key,
    count: categoriesMap[key]
  }));

  // Cost by Priority
  const costMap: { [key: string]: number } = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  maintenance
    .filter(m => m.status === 'Resolved' && m.cost)
    .forEach(m => {
      costMap[m.priority] = (costMap[m.priority] || 0) + (m.cost || 0);
    });
  const costData = Object.keys(costMap).map(key => ({
    priority: key,
    cost: costMap[key]
  }));

  return (
    <div className="space-y-6 fade-in font-sans">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Operational Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Audit logs, asset distributions, and maintenance cost reports.</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Generating reports data...</div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Inventory</CardTitle>
                <Package className="h-4.5 w-4.5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">{totalAssets}</div>
                <p className="text-xs text-muted-foreground mt-1">Physical assets registered</p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Repair Cost</CardTitle>
                <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">${totalMaintenanceCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Resolved maintenance cost</p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Ratio</CardTitle>
                <Shield className="h-4.5 w-4.5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">
                  {totalAssets ? ((availableAssetsCount / totalAssets) * 100).toFixed(0) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{availableAssetsCount} assets ready for use</p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Repairs</CardTitle>
                <Wrench className="h-4.5 w-4.5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">{maintenanceAssetsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Assets currently under repair</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', fontSize: 11 }} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Allocation Status Ratio</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', fontSize: 11 }} />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Costs priority distribution */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Repair Cost Distribution by Ticket Priority</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                  <XAxis dataKey="priority" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `$${value}`} contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', fontSize: 11 }} />
                  <Bar dataKey="cost" fill="var(--color-accent-foreground)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
