import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, Filter } from 'lucide-react';

export default function AssetDirectory() {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.get('/assets');
        setAssets(res.data);
      } catch (error) {
        console.error('Failed to fetch assets', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Asset Directory</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all company assets.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Register Asset
        </Button>
      </div>

      <Card>
        <div className="p-4 flex gap-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search assets..." className="pl-9" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading assets...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 bg-gray-50/50 dark:bg-gray-800/50 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Asset Tag</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Assigned To</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No assets found</td>
                    </tr>
                  ) : (
                    assets.map((asset: any) => (
                      <tr key={asset._id} className="hover:bg-accent/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary hover:underline cursor-pointer">{asset.assetTag}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{asset.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{asset.category?.name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50' :
                            asset.status === 'Allocated' ? 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900/60 dark:text-stone-300 dark:border-stone-800' :
                            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{asset.assignedTo?.name || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm">View</Button>
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
    </div>
  );
}
