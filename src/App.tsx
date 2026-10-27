import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  OnboardedApp,
  OnboardingOnly,
  PublicOnly,
  RequireAuth,
} from './components/OnboardingGate'
import { AgentsProvider } from './context/AgentsContext'
import { AuthProvider } from './context/AuthContext'
import { CoreProvider } from './context/CoreContext'
import { MailProvider } from './context/MailContext'
import AppShell from './layouts/AppShell'
import ActivityPage from './pages/ActivityPage'
import AgentsPage from './pages/AgentsPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AuthPage from './pages/AuthPage'
import CalendarPage from './pages/CalendarPage'
import ClientsPage from './pages/ClientsPage'
import ConnectionsPage from './pages/ConnectionsPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import MailPage from './pages/MailPage'
import OnboardingPage from './pages/OnboardingPage'
import ProjectsPage from './pages/ProjectsPage'
import SettingsPage from './pages/SettingsPage'
import SetupGooglePage from './pages/SetupGooglePage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <CoreProvider>
        <MailProvider>
          <AgentsProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<PublicOnly />}>
                  <Route path="connexion" element={<AuthPage />} />
                  <Route path="inscription" element={<AuthPage />} />
                </Route>

                <Route path="auth/callback" element={<AuthCallbackPage />} />

                <Route element={<RequireAuth />}>
                  <Route element={<OnboardingOnly />}>
                    <Route path="onboarding" element={<OnboardingPage />} />
                  </Route>

                  <Route element={<OnboardedApp />}>
                    <Route element={<AppShell />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="connexions" element={<ConnectionsPage />} />
                      <Route path="setup-google" element={<SetupGooglePage />} />
                      <Route path="mail" element={<MailPage />} />
                      <Route path="agenda" element={<CalendarPage />} />
                      <Route path="agents" element={<AgentsPage />} />
                      <Route path="clients" element={<ClientsPage />} />
                      <Route path="projets" element={<ProjectsPage />} />
                      <Route path="documents" element={<DocumentsPage />} />
                      <Route path="activite" element={<ActivityPage />} />
                      <Route path="reglages" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/connexion" replace />} />
              </Routes>
            </BrowserRouter>
          </AgentsProvider>
        </MailProvider>
      </CoreProvider>
    </AuthProvider>
  )
}
