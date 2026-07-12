import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

export default function Bookings() {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Resource Bookings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Book meeting rooms, vehicles, and shared equipment.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Booking
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <CalendarIcon className="h-10 w-10 text-gray-300 mb-2" />
            No upcoming bookings.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
