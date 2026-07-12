import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Maintenance</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage repair requests and track asset condition.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Raise Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            No active maintenance requests.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
