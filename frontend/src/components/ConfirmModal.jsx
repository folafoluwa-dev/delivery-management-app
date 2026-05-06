export default function ConfirmModal({ isOpen, title, message, confirmLabel, confirmColor = 'red', onConfirm, onCancel }) {
    if (!isOpen) return null;

    const colors = {
        red: 'bg-red-500 hover:bg-red-600',
        green: 'bg-green-500 hover:bg-green-600',
        orange: 'bg-orange-500 hover:bg-orange-600',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="font-bold text-gray-800 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 ${colors[confirmColor]} text-white py-2.5 rounded-xl text-sm font-semibold`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}