import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';
import { Package, ShieldAlert, User, Briefcase } from 'lucide-react';

type RoleSelection = 'Admin' | 'Asset Manager' | 'Employee' | null;

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<RoleSelection>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // When a role is selected, auto-fill the demo email for convenience
  useEffect(() => {
    if (selectedRole === 'Admin') setEmail('admin@assetflow.com');
    if (selectedRole === 'Asset Manager') setEmail('manager@assetflow.com');
    if (selectedRole === 'Employee') setEmail('alice@assetflow.com');
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl mx-auto flex rounded-3xl overflow-hidden shadow-xl bg-card border border-border h-[600px]">
        {/* Left Side - Image/Gradient */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-emerald-950 to-stone-900 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80')] opacity-15 bg-cover bg-center mix-blend-overlay"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-emerald-400" />
              <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4 leading-tight">Manage your enterprise resources flawlessly.</h1>
              <p className="text-base text-emerald-200/80 max-w-md font-light">The modern ERP platform for tracking, allocating, and maintaining physical assets and shared spaces.</p>
            </div>
            <div className="text-xs text-emerald-300/60">© 2026 AssetFlow Inc.</div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center relative bg-card">
          <div className="w-full max-w-md mx-auto">
            
            {!selectedRole ? (
              // STEP 1: ROLE SELECTION
              <div className="space-y-6 fade-in font-sans">
                <div className="text-center lg:text-left mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Select your role</h2>
                  <p className="text-sm text-muted-foreground mt-1">How are you logging in today?</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedRole('Admin')}
                    className="w-full flex items-center p-4 border border-border rounded-2xl hover:border-primary/60 hover:bg-accent/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary mr-4 group-hover:scale-105 transition-transform shrink-0">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Administrator</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Manage organization, categories & audits</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedRole('Asset Manager')}
                    className="w-full flex items-center p-4 border border-border rounded-2xl hover:border-primary/60 hover:bg-accent/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary mr-4 group-hover:scale-105 transition-transform shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Asset Manager</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Approve allocations & maintenance</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedRole('Employee')}
                    className="w-full flex items-center p-4 border border-border rounded-2xl hover:border-primary/60 hover:bg-accent/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary mr-4 group-hover:scale-105 transition-transform shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Employee</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Book resources & view assigned assets</p>
                    </div>
                  </button>
                </div>
                
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  New to the company? <Link to="/signup" className="text-primary hover:underline font-medium">Create an account</Link>
                </div>
              </div>
            ) : (
              // STEP 2: CREDENTIALS
              <div className="fade-in font-sans">
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center transition-colors"
                >
                  ← Back to roles
                </button>

                <div className="text-center lg:text-left mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                  <p className="text-sm text-muted-foreground mt-1">Log in as <span className="font-semibold text-primary">{selectedRole}</span></p>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-xs mb-5 border border-destructive/20">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                    <Input 
                      type="email" 
                      required 
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground">Password</label>
                      <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                    </div>
                    <Input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full mt-4 h-11 text-sm font-semibold" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
