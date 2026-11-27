import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES, STAFF_ROLES } from './context/AuthContext';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { PublicLayout } from './components/public/PublicLayout';
import { ProtectedRoute, DashboardRedirect } from './components/routing/ProtectedRoute';
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
import { MobileAppRequiredPage } from './pages/MobileAppRequiredPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { AdminDashboardPage } from './pages/dashboards/AdminDashboardPage';
import { NurseDashboardPage } from './pages/dashboards/NurseDashboardPage';
import { DoctorDashboardPage } from './pages/dashboards/DoctorDashboardPage';
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
        {/* Public-Facing Mobile-Responsive Website with Shared Header, Pet Background & Footer */}
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

        {/* Patient app gate (no web dashboard for patients) + public sample QR target */}
        <Route path="/mobile-app-only" element={<MobileAppRequiredPage />} />
        <Route path="/app-download" element={<MobileAppRequiredPage />} />
        <Route path="/download" element={<Navigate to="/app-download" replace />} />
        <Route path="/mobile-app" element={<Navigate to="/mobile-app-only" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Authenticated Clinical Dashboards (staff only) */}
        <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardRedirect />} />

            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="dashboard/admin" element={<AdminDashboardPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="branches" element={<BranchesPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.NURSE]} />}>
              <Route path="dashboard/nurse" element={<NurseDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.DOCTOR]} />}>
              <Route path="dashboard/doctor" element={<DoctorDashboardPage />} />
            </Route>

            <Route path="patients" element={<PatientsPage />} />
            <Route path="triage" element={<TriagePage />} />
            <Route path="clinical-orders" element={<ClinicalOrdersPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Compact, dismissable RA 10173 cookie notice */}
      <CookieConsentBanner />
    </>
  );
}
