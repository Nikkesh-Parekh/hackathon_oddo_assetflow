import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Briefcase, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assets', path: '/assets', icon: Package },
    { name: 'Allocations', path: '/allocations', icon: Briefcase },
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Audits', path: '/audits', icon: ClipboardCheck },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Organization', path: '/org', icon: Settings, roles: ['Admin'] },
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Package className="h-5 w-5 text-primary" />
          <span className="ml-3 text-base font-semibold tracking-tight text-foreground">AssetFlow</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-semibold' 
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 mr-3 shrink-0 opacity-80" />
              {item.name}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm uppercase">
              {user?.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-150"
          >
            <LogOut className="h-4.5 w-4.5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-10">
          <h1 className="text-xl font-semibold text-foreground">
            {/* Can use a route matcher to display active page name */}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 relative bg-background/50">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
