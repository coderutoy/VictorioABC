import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const { isAuthenticated, isSupabaseConfigured, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    const rawTarget = location.state?.from?.pathname;
    const target = rawTarget && rawTarget !== '/' ? rawTarget : '/dashboard';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const rawTarget = location.state?.from?.pathname;
      const target = rawTarget && rawTarget !== '/' ? rawTarget : '/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F2F2ED] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#464B71] hover:text-[#118AB2]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Victorio ABC Public Website</span>
        </Link>

        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3.5">
            <img
              src="/victorio_logo.jpg"
              alt="Victorio Animal Bite Center Logo"
              className="h-14 w-14 rounded-full border-2 border-[#7CD5C7] object-cover shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold text-[#464B71]">Victorio ABC Portal</h1>
              <p className="text-xs font-medium text-[#118AB2]">
                San Jose del Monte • Multi-Branch Rabies PEP &amp; EMR
              </p>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Configure <code className="font-semibold">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-semibold">VITE_SUPABASE_ANON_KEY</code> inside{' '}
                <code className="font-semibold">web/.env</code> to enable authentication.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Work or Patient Email"
              placeholder="clinician@victorioabc.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !isSupabaseConfigured}
            >
              <Lock className="h-4 w-4" />
              <span>{submitting ? 'Signing in...' : 'Sign In to Clinical Portal'}</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
