import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export function UnauthorizedPage() {
  const { role, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldOff className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your current account role (<span className="font-semibold">{role || 'unknown'}</span>) does
          not have permission to view this clinical workspace.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="secondary">Return to Overview</Button>
          </Link>
          <Button variant="danger" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
