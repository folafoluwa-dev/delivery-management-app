import { useState, useEffect, useRef } from 'react';

export default function AddressAutocomplete({ label, icon, value, onChange, onSelect }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val);
        setSuggestions([]);

        if (val.length < 2) {
            setSuggestions([]);
            return;
        }

        // Debounce — wait 400ms after user stops typing
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 400);
    };

    const fetchSuggestions = async (searchQuery) => {
        setLoading(true);
        try {
            // Try with Nigeria country filter first
            let res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=ng&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            let data = await res.json();

            // If no results, try without country filter (broader search)
            if (data.length === 0) {
                res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Nigeria')}&limit=5&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                data = await res.json();
            }

            // If still no results, try just the street name + Lagos
            if (data.length === 0 && !searchQuery.toLowerCase().includes('lagos')) {
                res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Lagos Nigeria')}&limit=5&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                data = await res.json();
            }

            setSuggestions(data);
            setShowSuggestions(true);
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (place) => {
        const address = place.display_name;
        setQuery(address);
        onChange(address);
        setSuggestions([]);
        setShowSuggestions(false);
        onSelect({
            address,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
        });
    };

    return (
        <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {icon} {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10"
                />
                {/* Loading spinner inside input */}
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((place, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(place)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                        >
                            <div className="flex gap-2">
                                <span className="text-orange-400 mt-0.5 shrink-0">📍</span>
                                <span className="text-gray-700 line-clamp-2">{place.display_name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results */}
            {showSuggestions && !loading && suggestions.length === 0 && query.length >= 3 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                    No locations found. Try a different search.
                </div>
            )}
        </div>
    );
}