import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import { SkeletonList, SkeletonStats } from '../../components/Skeleton.jsx';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097144.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center]);
    return null;
}

export default function RiderTrack() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef(null);

    useEffect(() => {
        fetchOrder();
        connectWebSocket();
        const interval = setInterval(fetchOrder, 15000);
        return () => {
            clearInterval(interval);
            if (wsRef.current) wsRef.current.close();
        };
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${orderId}/`);
            setOrder(res.data);
            if (res.data.status === 'DELIVERED') {
                if (wsRef.current) wsRef.current.close();
            }
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/tracking/${orderId}/`;
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'location_update') {
                setDriverLocation([data.lat, data.lng]);
            }
        };
        wsRef.current.onclose = () => {
            setTimeout(connectWebSocket, 3000);
        };
    };

    const statusSteps = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'DELIVERED'];
    const statusLabels = {
        PENDING: 'Finding driver...',
        ACCEPTED: 'Driver heading to pickup',
        PICKED_UP: 'Package picked up, on the way!',
        DELIVERED: 'Delivered! 🎉',
        CANCELLED: 'Cancelled',
    };

    const mapCenter = driverLocation
        || (order?.pickup_lat ? [order.pickup_lat, order.pickup_lng] : [6.5244, 3.3792]);

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
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Tracking Order #{orderId}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order?.status === 'DELIVERED' ? 'bg-green-100 text-green-600'
                        : order?.status === 'CANCELLED' ? 'bg-red-100 text-red-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                        {order?.status}
                    </span>
                </div>

                {/* Status Bar */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm font-medium text-gray-600 mb-4">
                        {statusLabels[order?.status]}
                    </p>
                    <div className="flex items-center gap-1">
                        {statusSteps.map((step, i) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${statusSteps.indexOf(order?.status) >= i
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                    }`}>
                                    {statusSteps.indexOf(order?.status) > i ? '✓' : i + 1}
                                </div>
                                {i < statusSteps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 rounded ${statusSteps.indexOf(order?.status) > i ? 'bg-orange-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        {statusSteps.map((step) => (
                            <span key={step} className="text-xs text-gray-400 capitalize">
                                {step.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Map */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div style={{ height: '320px' }}>
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapUpdater center={driverLocation} />
                            {order?.pickup_lat && (
                                <Marker position={[order.pickup_lat, order.pickup_lng]}>
                                    <Popup>📍 Pickup</Popup>
                                </Marker>
                            )}
                            {order?.dropoff_lat && (
                                <Marker position={[order.dropoff_lat, order.dropoff_lng]}>
                                    <Popup>🏁 Drop-off</Popup>
                                </Marker>
                            )}
                            {driverLocation && (
                                <Marker position={driverLocation} icon={driverIcon}>
                                    <Popup>🚗 Driver</Popup>
                                </Marker>
                            )}
                        </MapContainer>
                    </div>
                </div>

                {/* Order Info */}
                <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
                    <h3 className="font-semibold text-gray-800">Order Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex gap-3">
                            <span className="text-orange-500">📍</span>
                            <div>
                                <p className="text-gray-500 text-xs">Pickup</p>
                                <p className="text-gray-800">{order?.pickup_address}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-orange-500">🏁</span>
                            <div>
                                <p className="text-gray-500 text-xs">Drop-off</p>
                                <p className="text-gray-800">{order?.dropoff_address}</p>
                            </div>
                        </div>
                        {order?.driver_name && (
                            <div className="flex gap-3">
                                <span className="text-orange-500">🚗</span>
                                <div>
                                    <p className="text-gray-500 text-xs">Driver</p>
                                    <p className="text-gray-800">{order?.driver_name} ⭐ {order?.driver_avg_rating}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="text-gray-500">Fare</span>
                            <span className="font-bold text-orange-600">₦{Number(order?.fare).toLocaleString()}</span>
                        </div>
                    </div>
                    {order?.driver && order?.status !== 'DELIVERED' && order?.status !== 'CANCELLED' && (
                        <button
                            onClick={() => navigate(`/chat/${orderId}`)}
                            className="w-full bg-white border border-gray-200 hover:border-orange-300 text-gray-700 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <span>💬</span> Message Driver
                        </button>
                    )}
                </div>

                {/* Rate Driver button after delivery */}
                {order?.status === 'DELIVERED' && (
                    <button
                        onClick={() => navigate(`/rider/rate/${orderId}`)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl"
                    >
                        ⭐ Rate Your Driver
                    </button>
                )}
            </div>
        </Layout>
    );
}