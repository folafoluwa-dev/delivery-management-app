import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Layout from '../../components/Layout.jsx';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';
import api from '../../api/axios.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const myLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097144.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center]);
    return null;
}

export default function DriverMap() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [myLocation, setMyLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const wsRef = useRef(null);
    const watchRef = useRef(null);
    const { user } = { user: JSON.parse(localStorage.getItem('user') || '{}') };

    useEffect(() => {
        fetchOrder();
        startLocationTracking();
        return () => {
            if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${orderId}/`);
            setOrder(res.data);
        } catch {
            setError('Order not found.');
        } finally {
            setLoading(false);
        }
    };

    // Replace the startLocationTracking function in DriverMap.jsx
    const startLocationTracking = async () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        // ✅ Fetch driver ID once, not on every GPS ping
        let driverId = null;
        try {
            const res = await api.get('/auth/me/');
            driverId = res.data.id;
        } catch {
            setError('Could not get driver info.');
            return;
        }

        // Connect WebSocket
        const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/tracking/${orderId}/`;
        wsRef.current = new WebSocket(wsUrl);

        // Watch GPS position
        watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setMyLocation([lat, lng]);

                // ✅ Send location via WebSocket cleanly
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ driver_id: driverId, lat, lng }));
                }
            },
            (err) => console.error('GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
    };

    const handleConfirmPickup = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/orders/${orderId}/pickup/`);
            setOrder(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to confirm pickup.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmDelivery = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/orders/${orderId}/deliver/`);
            setOrder(res.data);
            setTimeout(() => navigate('/driver/orders'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to confirm delivery.');
        } finally {
            setActionLoading(false);
        }
    };

    // Pre-pickup: show pickup location. Post-pickup: show dropoff
    const targetLocation = order?.status === 'ACCEPTED'
        ? (order?.pickup_lat ? [order.pickup_lat, order.pickup_lng] : null)
        : (order?.dropoff_lat ? [order.dropoff_lat, order.dropoff_lng] : null);

    const mapCenter = myLocation || targetLocation || [6.5244, 3.3792];

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-64">
                <SkeletonList count={3} />
                <SkeletonStats />
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {order?.status === 'ACCEPTED' ? '📍 Go to Pickup' : '🏁 Go to Drop-off'}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order?.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-orange-100 text-orange-600'
                        }`}>
                        {order?.status}
                    </span>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Delivered Success */}
                {order?.status === 'DELIVERED' && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                        <div className="text-5xl mb-3">🎉</div>
                        <p className="text-green-700 font-bold text-lg">Delivery Complete!</p>
                        <p className="text-green-600 text-sm mt-1">
                            ₦{Number(order.driver_earnings).toLocaleString()} credited to your wallet
                        </p>
                    </div>
                )}

                {/* Map */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div style={{ height: '350px' }}>
                        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapUpdater center={myLocation} />

                            {/* My location */}
                            {myLocation && (
                                <Marker position={myLocation} icon={myLocationIcon}>
                                    <Popup>📍 You are here</Popup>
                                </Marker>
                            )}

                            {/* Pickup pin — shown before pickup */}
                            {order?.status === 'ACCEPTED' && order?.pickup_lat && (
                                <Marker position={[order.pickup_lat, order.pickup_lng]}>
                                    <Popup>📦 Pickup Location</Popup>
                                </Marker>
                            )}

                            {/* Dropoff pin — shown after pickup */}
                            {order?.status === 'PICKED_UP' && order?.dropoff_lat && (
                                <Marker position={[order.dropoff_lat, order.dropoff_lng]}>
                                    <Popup>🏁 Drop-off Location</Popup>
                                </Marker>
                            )}
                        </MapContainer>
                    </div>
                </div>

                {/* Order Info Card */}
                <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
                    <h3 className="font-semibold text-gray-800">Order #{orderId}</h3>

                    <div className="space-y-2 text-sm">
                        {order?.status === 'ACCEPTED' ? (
                            <div className="flex gap-3">
                                <span className="text-green-500">📍</span>
                                <div>
                                    <p className="text-gray-400 text-xs">Go to pickup</p>
                                    <p className="text-gray-800 font-medium">{order?.pickup_address}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <span className="text-red-500">🏁</span>
                                <div>
                                    <p className="text-gray-400 text-xs">Deliver to</p>
                                    <p className="text-gray-800 font-medium">{order?.dropoff_address}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="text-gray-500">Your earnings</span>
                            <span className="font-bold text-green-600">
                                ₦{Number(order?.driver_earnings).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Distance</span>
                            <span className="font-medium text-gray-700">{order?.distance_km} km</span>
                        </div>
                        {order?.package_description && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Package</span>
                                <span className="font-medium text-gray-700">{order.package_description}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {order?.status === 'ACCEPTED' && (
                    <button
                        onClick={handleConfirmPickup}
                        disabled={actionLoading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
                    >
                        {actionLoading ? 'Confirming...' : '📦 Confirm Pickup'}
                    </button>
                )}

                {(order?.status === 'ACCEPTED' || order?.status === 'PICKED_UP') && (
                    <button
                        onClick={() => navigate(`/chat/${orderId}`)}
                        className="w-full bg-white border border-gray-200 hover:border-orange-300 text-gray-700 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <span>💬</span> Message Rider
                    </button>
                )}

                {order?.status === 'PICKED_UP' && (
                    <button
                        onClick={handleConfirmDelivery}
                        disabled={actionLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
                    >
                        {actionLoading ? 'Confirming...' : '✅ Confirm Delivery'}
                    </button>
                )}
            </div>
        </Layout>
    );
}