import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoutes.jsx';
import { useEffect } from 'react';


import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import Unauthorized from './pages/Auth/Unauthorized.jsx';

import RiderRequest from './pages/Rider/RiderRequest.jsx';
import RiderTrack from './pages/Rider/RiderTrack.jsx';
import RiderHistory from './pages/Rider/RiderHistory.jsx';
import RateDriver from './pages/Rider/RateDriver.jsx';
import RiderWallet from "./pages/Rider/RiderWallet.jsx"

import DriverOrders from './pages/Driver/DriverOrders.jsx';
import DriverMap from './pages/Driver/DriverMap.jsx';
import DriverEarnings from './pages/Driver/DriverEarnings.jsx';

import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import AdminDrivers from './pages/Admin/AdminDrivers.jsx';
import AdminRatings from './pages/Admin/AdminRatings.jsx';
import AdminUsers from './pages/Admin/AdminUsers.jsx';
import AdminOrders from './pages/Admin/AdminOrders.jsx';


import NotFound from './pages/NotFound.jsx';
import Home from './pages/Home.jsx';


import OrderChat from './pages/Chat/OrderChat.jsx';

import { ToastProvider } from './components/Toast.jsx';

export default function App() {

  function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [pathname]);
    return null;
  }

  return (
    <AuthProvider>
      <ToastProvider>

        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Rider */}
            <Route path="/rider/request" element={<ProtectedRoute role="RIDER"><RiderRequest /></ProtectedRoute>} />
            <Route path="/rider/track/:orderId" element={<ProtectedRoute role="RIDER"><RiderTrack /></ProtectedRoute>} />
            <Route path="/rider/history" element={<ProtectedRoute role="RIDER"><RiderHistory /></ProtectedRoute>} />
            <Route path="/rider/rate/:orderId" element={<ProtectedRoute role="RIDER"><RateDriver /></ProtectedRoute>} />

            {/* Driver */}
            <Route path="/driver/orders" element={<ProtectedRoute role="DRIVER"><DriverOrders /></ProtectedRoute>} />
            <Route path="/driver/map/:orderId" element={<ProtectedRoute role="DRIVER"><DriverMap /></ProtectedRoute>} />
            <Route path="/driver/earnings" element={<ProtectedRoute role="DRIVER"><DriverEarnings /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/drivers" element={<ProtectedRoute role="ADMIN"><AdminDrivers /></ProtectedRoute>} />
            <Route path="/admin/ratings" element={<ProtectedRoute role="ADMIN"><AdminRatings /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute role="ADMIN"><AdminOrders /></ProtectedRoute>} />
            <Route path='*' element={<NotFound />} />
            <Route path="/rider/wallet" element={
              <ProtectedRoute role="RIDER"><RiderWallet /></ProtectedRoute>
            } />
            <Route path="/chat/:orderId" element={
              <ProtectedRoute><OrderChat /></ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}