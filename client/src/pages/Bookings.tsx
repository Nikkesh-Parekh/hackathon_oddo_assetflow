import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Booking State
  const [assetId, setAssetId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookingsAndAssets = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, assetsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/assets')
      ]);
      setBookings(bookingsRes.data);
      setAssets(assetsRes.data);
    } catch (err) {
      console.error('Failed to load bookings data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndAssets();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/bookings', {
        assetId,
        startTime,
        endTime,
        notes
      });
      setShowModal(false);
      // Reset form
      setAssetId('');
      setStartTime('');
      setEndTime('');
      setNotes('');
      fetchBookingsAndAssets();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to register booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      fetchBookingsAndAssets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const bookableAssets = assets.filter(a => a.isSharedBookable && a.status === 'Available');

  return (
    <div className="space-y-6 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Resource Bookings</h2>
          <p className="text-sm text-muted-foreground mt-1">Reserve shared conference rooms, workspaces, and auxiliary equipment.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 text-sm font-semibold">
          <Plus className="h-4.5 w-4.5" /> New Booking
        </Button>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">All Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading reservations...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
              <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
              No active reservations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Asset / Space</th>
                    <th className="px-6 py-4 font-semibold">Reserved By</th>
                    <th className="px-6 py-4 font-semibold">Start Time</th>
                    <th className="px-6 py-4 font-semibold">End Time</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((booking) => {
                    const isOwner = booking.user?._id === user?._id || user?.role === 'Admin';
                    return (
                      <tr key={booking._id} className="hover:bg-accent/10 transition-colors">
                        <td className="px-6 py-4">
                          <span className="flex flex-col">
                            <span className="font-semibold text-foreground">{booking.asset?.name || 'Deleted Resource'}</span>
                            <span className="text-xs text-muted-foreground">{booking.asset?.location || 'HQ'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{booking.user?.name || 'Unknown User'}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {format(new Date(booking.startTime), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {format(new Date(booking.endTime), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            booking.status === 'Upcoming' ? 'bg-primary/20 text-primary border-primary/30' :
                            booking.status === 'Ongoing' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                            booking.status === 'Completed' ? 'bg-stone-900/60 text-stone-400 border-stone-800' :
                            'bg-destructive/10 text-destructive border-destructive/20'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {booking.status === 'Upcoming' && isOwner ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleCancelBooking(booking._id)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW BOOKING MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Reserve Resource</h3>
            
            {submitError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Choose Shared Resource</label>
                <select 
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="">-- Select Resource / Room --</option>
                  {bookableAssets.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.location})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Start Date & Time</label>
                <Input 
                  type="datetime-local" 
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">End Date & Time</label>
                <Input 
                  type="datetime-local" 
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Booking Notes</label>
                <Input 
                  placeholder="Purpose of reservation..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Reserving...' : 'Confirm Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
