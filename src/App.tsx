/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ManagementProvider } from './contexts/ManagementContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import CartPage from './pages/CartPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import TicketsPage from './pages/TicketsPage';
import PaymentPage from './pages/PaymentPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import EditProfilePage from './pages/EditProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ConnectedAccountsPage from './pages/ConnectedAccountsPage';
import MembershipPage from './pages/MembershipPage';
import MembershipPaymentPage from './pages/MembershipPaymentPage';
import FavoritesPage from './pages/FavoritesPage';
import RewardsPage from './pages/RewardsPage';

import GlobalErrorBoundary from './components/GlobalErrorBoundary';

export default function App() {
  return (
    <GlobalErrorBoundary name="RootApp">
      <SettingsProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <AuthProvider>
          <ManagementProvider>
            <Router>
            <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* User Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/event/:id" element={<EventDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/payment-history" element={
              <ProtectedRoute>
                <PaymentHistoryPage />
              </ProtectedRoute>
            } />
            
            <Route path="/tickets" element={
              <ProtectedRoute>
                <TicketsPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/edit-profile" element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            } />
            <Route path="/connected-accounts" element={
              <ProtectedRoute>
                <ConnectedAccountsPage />
              </ProtectedRoute>
            } />
            <Route path="/membership" element={
              <ProtectedRoute>
                <MembershipPage />
              </ProtectedRoute>
            } />
            <Route path="/membership/payment" element={
              <ProtectedRoute>
                <MembershipPaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/rewards" element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            } />
            
            {/* Organizer Routes */}
            <Route path="/dashboard" element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}>
                <OrganizerDashboard />
              </RoleProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
          </ManagementProvider>
        </AuthProvider>
      </SettingsProvider>
    </GlobalErrorBoundary>
  );
}

