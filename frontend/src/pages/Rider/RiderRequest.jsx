import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Layout from '../../components/Layout.jsx';
import api from '../../api/axios.js';
import AddressAutocomplete from "../../components/AddressAutocomplete.jsx";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function RiderRequest() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: form, 2: price preview, 3: confirmed
    const [form, setForm] = useState({
        pickup_address: '', dropoff_address: '',
        pickup_lat: '', pickup_lng: '',
        dropoff_lat: '', dropoff_lng: '',
        package_description: '',
    });
    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Geocode address to coordinates using Nominatim
    const geocodeAddress = async (address, type) => {
        setLocating(type);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await res.json();
            if (data.length === 0) {
                setError(`Could not find location: "${address}". Try a more specific address.`);
                return;
            }
            const { lat, lon } = data[0];
            setForm((prev) => ({
                ...prev,
                [`${type}_lat`]: parseFloat(lat),
                [`${type}_lng`]: parseFloat(lon),
            }));
            setError('');
        } catch {
            setError('Location lookup failed. Please try again.');
        } finally {
            setLocating('');
        }
    };

    const handleEstimate = async () => {
        setError('');
        if (!form.pickup_lat || !form.dropoff_lat) {
            setError('Please locate both addresses first.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/orders/estimate/', {
                pickup_lat: form.pickup_lat, pickup_lng: form.pickup_lng,
                dropoff_lat: form.dropoff_lat, dropoff_lng: form.dropoff_lng,
            });
            setEstimate(res.data);
            setStep(2);
        } catch {
            setError('Failed to get price estimate. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/orders/create/', form);
            navigate(`/rider/track/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place order. Check your wallet balance.');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const mapCenter = form.pickup_lat
        ? [form.pickup_lat, form.pickup_lng]
        : [6.5244, 3.3792]; // Default: Lagos

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Request Delivery</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

                        {/* Pickup */}
                        <AddressAutocomplete
                            label="Pickup Address"
                            icon="📍"
                            value={form.pickup_address}
                            onChange={(val) => setForm((prev) => ({ ...prev, pickup_address: val }))}
                            onSelect={({ address, lat, lng }) =>
                                setForm((prev) => ({
                                    ...prev,
                                    pickup_address: address,
                                    pickup_lat: lat,
                                    pickup_lng: lng,
                                }))
                            }
                        />
                        {form.pickup_lat && (
                            <p className="text-xs text-green-600 -mt-3">
                                ✅ Located: {form.pickup_lat.toFixed(4)}, {form.pickup_lng.toFixed(4)}
                            </p>
                        )}

                        {/* Dropoff */}
                        <AddressAutocomplete
                            label="Drop-off Address"
                            icon="🏁"
                            value={form.dropoff_address}
                            onChange={(val) => setForm((prev) => ({ ...prev, dropoff_address: val }))}
                            onSelect={({ address, lat, lng }) =>
                                setForm((prev) => ({
                                    ...prev,
                                    dropoff_address: address,
                                    dropoff_lat: lat,
                                    dropoff_lng: lng,
                                }))
                            }
                        />
                        {form.dropoff_lat && (
                            <p className="text-xs text-green-600 -mt-3">
                                ✅ Located: {form.dropoff_lat.toFixed(4)}, {form.dropoff_lng.toFixed(4)}
                            </p>
                        )}

                        {/* Package Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📝 Package Description (optional)
                            </label>
                            <input
                                name="package_description" value={form.package_description}
                                onChange={handleChange}
                                placeholder="e.g. Small box, fragile"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>

                        {/* Map Preview */}
                        {form.pickup_lat && (
                            <div className="rounded-xl overflow-hidden h-48 border border-gray-200">
                                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {form.pickup_lat && (
                                        <Marker position={[form.pickup_lat, form.pickup_lng]}>
                                            <Popup>Pickup</Popup>
                                        </Marker>
                                    )}
                                    {form.dropoff_lat && (
                                        <Marker position={[form.dropoff_lat, form.dropoff_lng]}>
                                            <Popup>Drop-off</Popup>
                                        </Marker>
                                    )}
                                </MapContainer>
                            </div>
                        )}

                        <button
                            onClick={handleEstimate}
                            disabled={loading || !form.pickup_lat || !form.dropoff_lat}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Get Price Estimate →'}
                        </button>
                    </div>
                )}

                {/* Step 2 — Price Preview */}
                {step === 2 && estimate && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-800">Price Breakdown</h2>

                        <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Distance</span>
                                <span className="font-medium">{estimate.distance_km} km</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Base fare</span>
                                <span className="font-medium">₦500</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Distance fare</span>
                                <span className="font-medium">
                                    ₦{(estimate.fare - 500).toLocaleString()}
                                </span>
                            </div>
                            <div className="border-t border-orange-200 pt-3 flex justify-between">
                                <span className="font-bold text-gray-800">Total Fare</span>
                                <span className="font-bold text-orange-600 text-lg">
                                    ₦{Number(estimate.fare).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
                            >
                                {loading ? 'Placing order...' : 'Confirm & Pay ₦' + Number(estimate.fare).toLocaleString()}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}