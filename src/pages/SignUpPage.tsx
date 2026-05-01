import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Apple, ChevronLeft, Ticket, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!agreedTerms) {
      setError('You must agree to the Terms and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex flex-col items-center relative overflow-hidden">
      {/* Mobile Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-5 h-16">
        <Link to="/login" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all active:scale-90">
          <ChevronLeft className="h-6 w-6 text-slate-900" />
        </Link>
        
        {/* Update: Membungkus Logo & Tulisan dengan Link ke "/" */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
           <div className="w-6 h-6 premium-gradient rounded flex items-center justify-center shrink-0">
            <Ticket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-center">Tiketmu</span>
        </Link>
        
        <div className="w-10"></div>
      </header>

      <main className="flex-grow pt-24 pb-32 px-5 max-w-md mx-auto w-full z-10">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight leading-tight">Create Account</h2>
          <p className="text-slate-500 mt-2 font-medium">Unlock exclusive events and seamless booking experiences.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="full_name">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                id="full_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-white border ${error?.includes('name') ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'} rounded-xl py-4 pl-12 pr-4 font-medium transition-all outline-none focus:ring-2`} 
                placeholder="Enter your full name" 
                type="text"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="email">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-white border ${error?.includes('email') ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'} rounded-xl py-4 pl-12 pr-4 font-medium transition-all outline-none focus:ring-2`} 
                placeholder="name@example.com" 
                type="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="password">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors h-5 w-5" />
              <input 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-white border ${error?.includes('Password') ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'} rounded-xl py-4 pl-12 pr-12 font-medium transition-all outline-none focus:ring-2`} 
                placeholder="Min. 8 characters" 
                type={showPassword ? "text" : "password"}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 px-1 pt-2">
            <input 
              id="terms" 
              type="checkbox" 
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 transition-all cursor-pointer" 
            />
            <label className="text-sm text-slate-500 font-medium leading-relaxed cursor-pointer" htmlFor="terms">
              By signing up, you agree to our <span className="text-indigo-600 font-bold hover:underline">Terms of Service</span> and <span className="text-indigo-600 font-bold hover:underline">Privacy Policy</span>.
            </label>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !name || !email.includes('@') || password.length < 8 || !agreedTerms}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white py-4.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 mt-4 h-14"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-10 py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-slate-400">
            <span className="bg-surface px-4 italic">Or register with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 h-14 bg-white border border-slate-200 rounded-xl active:scale-95 transition-all shadow-sm hover:bg-slate-50">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFomCCujSelVExahfGgd3kann1DcEQTgM0psYlMAJ3nWtx4kzfJN77JYivHdABdvTpijSUIWXVVs8h3D8wsCjqBduaTBsxSnv83UUT6qgHjNvLRURvC32410FgJyQjrUyTbrZzPHsYw_h16W3QA0jPOLPC47gNrqYZgeyfXsECNHqgAWKvOlNRO30dftXbpJhHo3_P2c9qsv3z74SZGKQaSLHvlhKLcNhkacGO2ifJEKaC9oLks2GxGPCSU6apsu7reNJfDyylUGIK" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-semibold text-slate-700">Google</span>
          </button>
          <button className="flex items-center justify-center gap-3 h-14 bg-slate-900 text-white rounded-xl active:scale-95 transition-all shadow-sm hover:bg-black">
            <Apple className="h-5 w-5" />
            <span className="text-sm font-semibold text-white">Apple</span>
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            Already have an account? 
            <Link to="/login" className="text-indigo-600 font-bold ml-1 hover:text-indigo-700">Sign In</Link>
          </p>
        </div>
      </main>

      <div className="fixed top-0 right-0 -z-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-80 h-80 bg-slate-100 rounded-full blur-[100px] opacity-30"></div>
    </div>
  );
}