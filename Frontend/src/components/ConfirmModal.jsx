import { useEffect, useState } from "react";

function ConfirmModal({ isOpen, title, message, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm, onCancel }) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      return;
    }
    if (isRendered) {
      setIsClosing(true);
      const t = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 180);
      return () => clearTimeout(t);
    }
  }, [isOpen, isRendered]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-end">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className={`relative w-full rounded-t-3xl bg-white p-5 shadow-2xl ${isClosing ? "animate-[sheetOut_180ms_ease-in]" : "animate-[sheetIn_220ms_ease-out]"}`}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-300" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>
        {`
          @keyframes sheetIn {
            from { transform: translateY(16px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes sheetOut {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(16px); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}

export default ConfirmModal;
