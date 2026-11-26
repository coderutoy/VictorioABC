import { Link } from 'react-router-dom';
import { ShieldOff, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export function UnauthorizedPage() {
  const { role, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2ED] px-4">
      <div className="max-w-md rounded-2xl border border-[#DDDCD4] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldOff className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-[#464B71]">Clinical Staff Workspace Restricted</h1>
        <p className="mt-2 text-sm text-[#464B71]/80">
          Your current account role (<span className="font-semibold">{role || 'unknown'}</span>) does
          not have permission to access this clinical staff route. Patients can use the Victorio ABC Mobile App for their Digital QR Pass and PEP schedules.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/">
            <Button variant="secondary">
              <Globe className="h-4 w-4" />
              <span>Public Website</span>
            </Button>
          </Link>
          <Button variant="danger" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
