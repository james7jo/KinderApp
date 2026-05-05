"use client";

export default function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1 active:scale-95 transition-all"
    >
      Copiar
    </button>
  );
}
