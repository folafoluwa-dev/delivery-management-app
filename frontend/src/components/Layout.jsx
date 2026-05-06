import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const navRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [walletBalance, setWalletBalance] = useState(user?.wallet_balance || 0);

    useEffect(() => {
        fetchNotifications();
        fetchWallet();
        const interval = setInterval(() => {
            fetchNotifications();
            fetchWallet(); // ✅ Refresh wallet every 30 seconds
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // ✅ Also refresh wallet every time the page/route changes
    useEffect(() => {
        fetchWallet();
    }, [location.pathname]);

    useEffect(() => {
        const handleClick = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setShowNotifications(false);
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchWallet = async () => {
        try {
            const res = await api.get('/wallet/balance/');
            setWalletBalance(res.data.balance);
        } catch { }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read/');
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch { }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const riderLinks = [
        { path: '/rider/request', label: 'Request', icon: '📦' },
        { path: '/rider/history', label: 'History', icon: '🕐' },
        { path: '/rider/wallet', label: 'Wallet', icon: '💰' },
    ];

    const driverLinks = [
        { path: '/driver/orders', label: 'Orders', icon: '📋' },
        { path: '/driver/earnings', label: 'Earnings', icon: '💰' },
    ];

    const adminLinks = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/drivers', label: 'Drivers', icon: '🚗' },
        { path: '/admin/ratings', label: 'Ratings', icon: '⭐' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/orders', label: 'Orders', icon: '📦' },
    ];

    const links = user?.role === 'RIDER' ? riderLinks
        : user?.role === 'DRIVER' ? driverLinks
            : adminLinks;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav ref={navRef} className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                                <span className="text-white text-lg">🚚</span>
                            </div>
                            <span className="font-bold text-gray-800 text-lg">DeliverNG</span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.path)
                                        ? 'bg-orange-50 text-orange-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <span>{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3">

                            {/* ✅ Live Wallet Balance */}
                            {(user?.role === 'RIDER' || user?.role === 'DRIVER') && (
                                <div
                                    onClick={fetchWallet}
                                    title="Click to refresh"
                                    className="hidden md:flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-orange-100 transition-all"
                                >
                                    <span className="text-orange-500 text-sm">💰</span>
                                    <span className="text-orange-600 font-semibold text-sm">
                                        ₦{Number(walletBalance).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowNotifications(!showNotifications); setShowMenu(false); }}
                                    className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    <span className="text-lg">🔔</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                            <span className="font-semibold text-gray-800">Notifications</span>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                notifications.slice(0, 10).map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`px-4 py-3 border-b border-gray-50 text-sm ${!n.is_read ? 'bg-orange-50' : ''
                                                            }`}
                                                    >
                                                        <p className="text-gray-700">{n.message}</p>
                                                        <p className="text-gray-400 text-xs mt-1">
                                                            {new Date(n.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowMenu(!showMenu); setShowNotifications(false); }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="hidden md:block text-sm font-medium text-gray-700">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                    <span className="text-gray-400 text-xs">▼</span>
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                                            <p className="text-xs text-gray-400">{user?.role}</p>
                                            {/* ✅ Show wallet in menu on mobile */}
                                            {(user?.role === 'RIDER' || user?.role === 'DRIVER') && (
                                                <p className="text-xs text-orange-500 font-semibold mt-1">
                                                    💰 ₦{Number(walletBalance).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            🚪 Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Nav Links */}
                    <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${isActive(link.path)
                                    ? 'bg-orange-50 text-orange-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <span>{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}