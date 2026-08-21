import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, getDefaultRouteForUser, useAuth } from './context/AuthContext';
import { getSettings } from './services/api';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterRestaurantPage from './pages/RegisterRestaurantPage';
import RestaurantOnboardingPage from './pages/RestaurantOnboardingPage';
import SetupSuperadminPage from './pages/SetupSuperadminPage';
import AdminLayout from './layouts/AdminLayout.jsx';
import Dashboard from './components/Dashboard.jsx';
import OrderHistory from './components/OrderHistory.jsx';
import DishManagement from './components/DishManagement.jsx';
import OrderManagement from './components/OrderManagement.jsx';
import AdManagement from './components/AdManagement.jsx';
import Settings from './components/Settings.jsx';
import DatabaseSettings from './components/DatabaseSettings.jsx';
import RatingsManagement from './components/RatingsManagement.jsx';
import SystemLogs from './components/SystemLogs.jsx';
import WaiterCalls from './components/WaiterCalls.jsx';
import CategoryManagement from './components/CategoryManagement.jsx';
import ClientChannelSettings from './components/ClientChannelSettings.jsx';
import SuperAdminOverview from './components/SuperAdminOverview.jsx';

function RoleHomeRedirect() {
  const { user } = useAuth();
  const [target, setTarget] = React.useState(null);

  React.useEffect(() => {
    let active = true;

    const resolveTarget = async () => {
      if (!user) {
        if (active) setTarget('/login');
        return;
      }

      if (user.role === 'superadmin') {
        if (active) setTarget(getDefaultRouteForUser(user));
        return;
      }

      try {
        const settings = await getSettings();
        const onboardingValue = settings?.onboarding_completed;
        const onboardingCompleted = onboardingValue === undefined || onboardingValue === null
          ? true
          : onboardingValue === true || onboardingValue === 'true';
        if (active) {
          setTarget(onboardingCompleted ? '/dashboard' : '/onboarding');
        }
      } catch (error) {
        if (active) setTarget('/dashboard');
      }
    };

    resolveTarget();
    return () => {
      active = false;
    };
  }, [user]);

  if (!target) {
    return <div className="p-10 text-center">Carregando...</div>;
  }

  return <Navigate to={target} replace />;
}

function AdminOnboardingGate({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [allowed, setAllowed] = React.useState(null);

  React.useEffect(() => {
    let active = true;

    const resolveAccess = async () => {
      if (!user || user.role !== 'admin') {
        if (active) setAllowed(true);
        return;
      }

      try {
        const settings = await getSettings();
        const onboardingValue = settings?.onboarding_completed;
        const onboardingCompleted = onboardingValue === undefined || onboardingValue === null
          ? true
          : onboardingValue === true || onboardingValue === 'true';

        if (!active) return;

        if (!onboardingCompleted && location.pathname !== '/onboarding') {
          setAllowed('/onboarding');
          return;
        }

        if (onboardingCompleted && location.pathname === '/onboarding') {
          setAllowed('/dashboard');
          return;
        }

        setAllowed(true);
      } catch (error) {
        if (active) setAllowed(true);
      }
    };

    resolveAccess();
    return () => {
      active = false;
    };
  }, [location.pathname, user]);

  if (allowed === null) {
    return <div className="p-10 text-center">Carregando...</div>;
  }

  if (allowed !== true) {
    return <Navigate to={allowed} replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterRestaurantPage />} />
          <Route path="/setup-superadmin" element={<SetupSuperadminPage />} />

          <Route path="/" element={<ProtectedRoute><AdminOnboardingGate><AdminLayout /></AdminOnboardingGate></ProtectedRoute>}>
            <Route index element={<RoleHomeRedirect />} />
            <Route path="/superadmin" element={<ProtectedRoute roles={['superadmin']}><SuperAdminOverview /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute roles={['admin']}><RestaurantOnboardingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute roles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/current-orders" element={<ProtectedRoute roles={['admin']}><OrderManagement /></ProtectedRoute>} />
            <Route path="/waiter-calls" element={<ProtectedRoute roles={['admin']}><WaiterCalls /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute roles={['admin']}><OrderHistory /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute roles={['admin']}><CategoryManagement /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute roles={['admin']}><DishManagement /></ProtectedRoute>} />
            <Route path="/ads" element={<ProtectedRoute roles={['admin']}><AdManagement /></ProtectedRoute>} />
            <Route path="/ratings" element={<ProtectedRoute roles={['admin']}><RatingsManagement /></ProtectedRoute>} />
            <Route path="/client-channels" element={<ProtectedRoute roles={['admin']}><ClientChannelSettings /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/database" element={<ProtectedRoute roles={['admin']}><DatabaseSettings /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute roles={['admin']}><SystemLogs /></ProtectedRoute>} />
            <Route path="*" element={<RoleHomeRedirect />} />
          </Route>
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;
