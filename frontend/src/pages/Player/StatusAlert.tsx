export default function StatusAlert({ text, onClose }: { text: string; onClose?: () => void }) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <span className="flex-1">{text}</span>
        {onClose && (
          <button className="text-amber-900/70 hover:text-amber-900" onClick={onClose} aria-label="Close">✕</button>
        )}
      </div>
    );
  }
  