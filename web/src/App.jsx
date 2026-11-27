import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES, STAFF_ROLES } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { PublicLayout } from './components/public/PublicLayout';
import { RoleRoute } from './components/routing/RoleRoute';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { PublicLandingPage } from './pages/PublicLandingPage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { TriageGuidePage } from './pages/TriageGuidePage';
import { ProtocolsPage } from './pages/ProtocolsPage';
import { CareersPage } from './pages/CareersPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { TriagePage } from './pages/TriagePage';
import { ClinicalOrdersPage } from './pages/ClinicalOrdersPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { InventoryPage } from './pages/InventoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BranchesPage } from './pages/BranchesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export default function App() {
  return (
    <>
      <Routes>
        {/* Public-Facing Mobile-Responsive Website with Shared Header, 3-Variant Pet Background & Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicLandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/triage-guide" element={<TriageGuidePage />} />
          <Route path="/protocols" element={<ProtocolsPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Authenticated Clinical Portal */}
        <Route element={<RoleRoute allowedRoles={STAFF_ROLES} />}>
          <Route element={<AppShell />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="triage" element={<TriagePage />} />
            <Route path="clinical-orders" element={<ClinicalOrdersPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="audit" element={<AuditLogsPage />} />

            <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="branches" element={<BranchesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Non-Intrusive RA 10173 Cookie Consent Bottom Banner */}
      <CookieConsentBanner />
    </>
  );
}
