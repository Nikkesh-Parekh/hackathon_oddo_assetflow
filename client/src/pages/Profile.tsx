import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Package, Calendar, Wrench, ArrowLeftRight, User, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();

  const [myAllocations, setMyAllocations] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myMaintenance, setMyMaintenance] = useState<any[]>([]);
  const [myTransfers, setMyTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const [allocRes, bookRes, maintRes] = await Promise.all([
          api.get('/allocations'),
          api.get('/bookings'),
          api.get('/maintenance'),
        ]);

        // Filter by logged-in user
        const userId = user?._id;
        setMyAllocations(allocRes.data.filter((a: any) =>
          a.assignedToUser?._id === userId && a.status === 'Active'
        ));
        setMyBookings(bookRes.data.filter((b: any) =>
          b.user?._id === userId && (b.status === 'Upcoming' || b.status === 'Ongoing')
        ));
        setMyMaintenance(maintRes.data.filter((m: any) =>
          m.requestedBy?._id === userId && m.status !== 'Resolved'
        ));
        setMyTransfers(allocRes.data.filter((a: any) =>
          a.transferRequestedBy?._id === userId && a.status === 'Transfer Requested'
        ));
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyData();
  }, [user]);

  const roleColor: Record<string, string> = {
    Admin: 'bg-red-950/30 text-red-400 border-red-900/30',
    'Asset Manager': 'bg-primary/20 text-primary border-primary/30',
    Employee: 'bg-stone-800/60 text-stone-400 border-stone-700',
  };

  return (
    <div className="space-y-6 fade-in font-sans max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-extrabold uppercase shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${roleColor[user?.role || ''] || roleColor['Employee']}`}>
                <Shield className="h-3 w-3 mr-1" />{user?.role}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-accent/20 text-accent-foreground border-border">
                <User className="h-3 w-3 mr-1" />{(user?.department as any)?.name || (typeof user?.department === 'string' ? user.department : 'No Department')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Assets', count: myAllocations.length, icon: Package, color: 'text-primary' },
          { label: 'Active Bookings', count: myBookings.length, icon: Calendar, color: 'text-emerald-400' },
          { label: 'Open Requests', count: myMaintenance.length, icon: Wrench, color: 'text-amber-400' },
          { label: 'Pending Transfers', count: myTransfers.length, icon: ArrowLeftRight, color: 'text-sky-400' },
        ].map((stat, i) => (
          <Card key={i} className="border border-border bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-extrabold text-foreground mt-0.5">{stat.count}</p>
              </div>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading your data...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* My Assigned Assets */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> My Assigned Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myAllocations.length === 0 ? (
                <p className="text-xs text-muted-foreground">No assets currently assigned to you.</p>
              ) : (
                <div className="space-y-2">
                  {myAllocations.map(a => (
                    <div key={a._id} className="p-2.5 rounded-lg border border-border bg-accent/10 flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{a.asset?.name}</p>
                        <p className="text-xs text-muted-foreground">{a.asset?.assetTag} · {a.asset?.location}</p>
                      </div>
                      {a.expectedReturnDate && (
                        <span className="text-xs text-amber-400 shrink-0 ml-2">
                          Due {format(new Date(a.expectedReturnDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Bookings */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" /> My Upcoming Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active bookings found.</p>
              ) : (
                <div className="space-y-2">
                  {myBookings.map(b => (
                    <div key={b._id} className="p-2.5 rounded-lg border border-border bg-accent/10">
                      <p className="text-sm font-semibold text-foreground">{b.asset?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.startTime), 'MMM d, h:mm a')} → {format(new Date(b.endTime), 'h:mm a')}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-1 inline-block ${
                        b.status === 'Upcoming' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                      }`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Maintenance Requests */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-400" /> My Open Maintenance Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myMaintenance.length === 0 ? (
                <p className="text-xs text-muted-foreground">No open maintenance requests.</p>
              ) : (
                <div className="space-y-2">
                  {myMaintenance.map(m => (
                    <div key={m._id} className="p-2.5 rounded-lg border border-border bg-accent/10 flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{m.asset?.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{m.issueDescription}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${
                        m.priority === 'Critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        m.priority === 'High' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' :
                        'bg-stone-900/60 text-stone-400 border-stone-700'
                      }`}>{m.priority}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Pending Transfers */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-sky-400" /> My Pending Transfer Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myTransfers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pending transfer requests.</p>
              ) : (
                <div className="space-y-2">
                  {myTransfers.map(t => (
                    <div key={t._id} className="p-2.5 rounded-lg border border-border bg-accent/10">
                      <p className="text-sm font-semibold text-foreground">{t.asset?.name}</p>
                      <p className="text-xs text-muted-foreground">{t.transferNotes || 'No notes provided'}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-1 inline-block bg-amber-950/20 text-amber-400 border-amber-900/30">
                        Awaiting Approval
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
