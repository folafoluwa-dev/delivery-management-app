const config = {
    PENDING: { color: 'bg-yellow-100 text-yellow-600', label: '⏳ Pending' },
    ACCEPTED: { color: 'bg-blue-100 text-blue-600', label: '✅ Accepted' },
    PICKED_UP: { color: 'bg-purple-100 text-purple-600', label: '📦 Picked Up' },
    DELIVERED: { color: 'bg-green-100 text-green-600', label: '🎉 Delivered' },
    CANCELLED: { color: 'bg-red-100 text-red-600', label: '❌ Cancelled' },
    APPROVED: { color: 'bg-green-100 text-green-600', label: '✅ Approved' },
    REJECTED: { color: 'bg-red-100 text-red-600', label: '❌ Rejected' },
    RATED: { color: 'bg-orange-100 text-orange-600', label: '⭐ Rated' },
};

export default function StatusBadge({ status }) {
    const { color, label } = config[status] || { color: 'bg-gray-100 text-gray-600', label: status };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
            {label}
        </span>
    );
}