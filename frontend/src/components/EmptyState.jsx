export default function EmptyState({ icon, title, description, action, actionLabel }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center animate-fade-in">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
            {description && (
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">{description}</p>
            )}
            {action && (
                <button
                    onClick={action}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}