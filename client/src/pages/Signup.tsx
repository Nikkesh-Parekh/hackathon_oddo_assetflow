import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';
import { Package, UserPlus } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      login(res.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-5xl mx-auto flex rounded-3xl overflow-hidden shadow-xl bg-card border border-border h-[600px]">
        
        {/* Left Side - Image/Gradient */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-emerald-950 to-stone-900 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80')] opacity-15 bg-cover bg-center mix-blend-overlay"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-emerald-400" />
              <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4 leading-tight">Join your organization.</h1>
              <p className="text-base text-emerald-200/80 max-w-md font-light">Create an employee account to start booking resources and tracking assets.</p>
            </div>
            <div className="text-xs text-emerald-300/60">© 2026 AssetFlow Inc.</div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center relative bg-card">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign up as a standard employee</p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-xs mb-5 border border-destructive/20 flex items-center gap-2">
                <UserPlus className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <Input 
                  type="text" 
                  required 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                <Input 
                  type="email" 
                  required 
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <Input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button type="submit" className="w-full mt-6 h-11 text-sm font-semibold" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign up'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
