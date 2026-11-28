import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ROLES, STAFF_ROLES } from './context/AuthContext';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { PublicLayout } from './components/public/PublicLayout';
import { ProtectedRoute, DashboardRedirect } from './components/routing/ProtectedRoute';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { MobileAppGuidePage } from './pages/MobileAppGuidePage';
import { BranchesPage } from './pages/BranchesPage';
import { PartnersPage } from './pages/PartnersPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { TriageGuidePage } from './pages/TriageGuidePage';
import { ProtocolsPage } from './pages/ProtocolsPage';
import { CareersPage } from './pages/CareersPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { LoginPage } from './pages/LoginPage';
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
import { AuditLogsPage } from './pages/AuditLogsPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Patient-Focused Multi-Page Public Website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/mobile-app" element={<MobileAppGuidePage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/triage-guide" element={<TriageGuidePage />} />
          <Route path="/protocols" element={<ProtocolsPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Route>

        {/* Staff-Only Portal Login & Clean Aliases (/portal and /login -> /staff-login) */}
        <Route path="/staff-login" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/staff-login" replace />} />
        <Route path="/portal" element={<Navigate to="/staff-login" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Dedicated Staff Workspace (Admin / Doctor / Nurse Only — Zero Public Navbar/Footer) */}
        <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="settings" element={<DashboardRedirect />} />

            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="dashboard/admin" element={<AdminDashboardPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
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

      {/* Classic RA 10173 Cookie Consent Banner */}
      <CookieConsentBanner />
    </>
  );
}
