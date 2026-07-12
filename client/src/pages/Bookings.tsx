import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar as CalendarIcon, Plus, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  Upcoming: 'bg-primary/20 text-primary border-primary/30',
  Ongoing: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30',
  Completed: 'bg-stone-900/60 text-stone-400 border-stone-800',
  Cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');

  const [assetId, setAssetId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isManager = user?.role === 'Admin' || user?.role === 'Asset Manager';

  const fetchData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [bookingsRes, assetsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/assets'),
      ]);
      setBookings(bookingsRes.data);
      setAssets(assetsRes.data);
    } catch (err) {
      console.error('Failed to load bookings data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(true); }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/bookings', { assetId, startTime, endTime, notes });
      setShowModal(false);
      setAssetId(''); setStartTime(''); setEndTime(''); setNotes('');
      fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to register booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const bookableAssets = assets.filter(a => a.isSharedBookable && a.status === 'Available');
  const myBookings = bookings.filter(b => b.user?._id === user?._id);
  const displayedBookings = (isManager && activeTab === 'all') ? bookings : myBookings;

  // Slot availability helper — show next available slot for a given asset
  const getAvailability = (assetId: string) => {
    const assetBookings = bookings
      .filter(b => b.asset?._id === assetId && (b.status === 'Upcoming' || b.status === 'Ongoing'))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    if (assetBookings.length === 0) return { available: true, next: null };
    const now = new Date();
    const current = assetBookings.find(b => new Date(b.startTime) <= now && new Date(b.endTime) >= now);
    const next = assetBookings.find(b => new Date(b.startTime) > now);
    return { available: !current, current, next };
  };

  return (
    <div className="space-y-6 fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Resource Bookings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isManager ? 'Manage all shared resource reservations.' : 'Reserve shared conference rooms, workspaces, and equipment.'}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 text-sm font-semibold">
          <Plus className="h-4.5 w-4.5" /> New Booking
        </Button>
      </div>

      {/* Tabs — manager sees org-wide view; employee only sees their own */}
      {isManager && (
        <div className="flex border-b border-border gap-1">
          {(['mine', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer capitalize ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'mine' ? 'My Bookings' : `All Bookings (${bookings.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Resource availability strip — shown to all users */}
      {bookableAssets.length > 0 && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Resource Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              {assets.filter(a => a.isSharedBookable).slice(0, 6).map(a => {
                const avail = getAvailability(a._id);
                return (
                  <div key={a._id} className={`p-3 rounded-xl border ${avail.available ? 'border-emerald-900/30 bg-emerald-950/10' : 'border-amber-900/30 bg-amber-950/10'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-foreground">{a.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${avail.available ? 'text-emerald-400 border-emerald-900/30 bg-emerald-950/20' : 'text-amber-400 border-amber-900/30 bg-amber-950/20'}`}>
                        {avail.available ? '● Available' : '● Occupied'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{a.location}</p>
                    {!avail.available && avail.current && (
                      <p className="text-[10px] text-amber-400 mt-1">Until {format(new Date(avail.current.endTime), 'h:mma')}</p>
                    )}
                    {avail.available && avail.next && (
                      <p className="text-[10px] text-muted-foreground mt-1">Next booked {format(new Date(avail.next.startTime), 'MMM d, h:mma')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings list */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {isManager && activeTab === 'all' ? 'All Reservations' : 'My Reservations'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : displayedBookings.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-2 border border-dashed border-border rounded-xl m-4">
              <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
              <p>No reservations found.</p>
              <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>Make a Booking</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/20 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Asset / Space</th>
                    {isManager && activeTab === 'all' && <th className="px-6 py-4 font-semibold">Reserved By</th>}
                    <th className="px-6 py-4 font-semibold">Start</th>
                    <th className="px-6 py-4 font-semibold">End</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedBookings.map(b => {
                    const canCancel = b.status === 'Upcoming' && (b.user?._id === user?._id || isManager);
                    return (
                      <tr key={b._id} className="hover:bg-accent/10 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{b.asset?.name || 'Deleted Resource'}</p>
                          <p className="text-xs text-muted-foreground">{b.asset?.location || 'HQ'}</p>
                        </td>
                        {isManager && activeTab === 'all' && (
                          <td className="px-6 py-4 text-foreground font-medium">{b.user?.name || 'Unknown'}</td>
                        )}
                        <td className="px-6 py-4 text-muted-foreground">{format(new Date(b.startTime), 'MMM d, h:mm a')}</td>
                        <td className="px-6 py-4 text-muted-foreground">{format(new Date(b.endTime), 'MMM d, h:mm a')}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${STATUS_STYLES[b.status] || ''}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canCancel ? (
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 gap-1" onClick={() => handleCancel(b._id)}>
                              <X className="h-3.5 w-3.5" /> Cancel
                            </Button>
                          ) : '—'}
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
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">{submitError}</div>
            )}
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Choose Shared Resource</label>
                <select required value={assetId} onChange={e => setAssetId(e.target.value)}
                  className="w-full h-10 px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-1">
                  <option value="">-- Select Resource / Room --</option>
                  {bookableAssets.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.location})</option>
                  ))}
                </select>
                {assetId && (() => {
                  const avail = getAvailability(assetId);
                  if (!avail.available && avail.next) return (
                    <p className="text-[10px] text-amber-400">⚠ Occupied until {format(new Date(avail.current?.endTime || ''), 'h:mma')} — next free slot after that</p>
                  );
                  return null;
                })()}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Start Date & Time</label>
                <Input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">End Date & Time</label>
                <Input type="datetime-local" required value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Purpose / Notes</label>
                <Input placeholder="What is this booking for?" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Reserving...' : 'Confirm Booking'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
