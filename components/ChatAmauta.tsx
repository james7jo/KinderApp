"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatAmauta() {
  const [messages, setMessages] = useState<
    { role: "user" | "amauta"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje recibido
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, cargando]);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || cargando) return;

    const mensajeUsuario = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: mensajeUsuario }]);
    setCargando(true);

    try {
      const res = await fetch("/api/amauta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: mensajeUsuario }),
      });
      const data = await res.json();

      if (data.respuesta) {
        setMessages((prev) => [
          ...prev,
          { role: "amauta", text: data.respuesta },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "amauta",
            text: "Tuvimos un problema al consultar al Amauta. Intenta de nuevo.",
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "amauta", text: "Error de conexión con el servidor." },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header del Chatbot */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white p-4 flex items-center gap-3 shadow-sm">
        <div className="bg-white/20 p-2 rounded-lg text-xl">🇧🇴</div>
        <div>
          <h3 className="font-bold text-base leading-tight">
            Asistente Pedagógico
          </h3>
          <p className="text-xs text-teal-100">
            Asistente Curricular Nivel Inicial
          </p>
        </div>
      </div>

      {/* Caja de Mensajes */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-8 px-4 text-gray-400 text-sm">
            <p className="font-medium text-gray-500 mb-1">
              ¡Bienvenida al espacio didáctico, maestra!
            </p>
            <p>
              Pregúntame sobre los momentos metodológicos, ideas para el PSP, o
              pídeme ayuda para estructurar tus planes curriculares.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-br-none"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2 shadow-sm">
              <span
                className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de Entrada */}
      <form
        onSubmit={manejarEnvio}
        className="border-t border-gray-100 p-3 flex bg-white gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta sobre el plan del Ministerio aquí..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={cargando}
          className="bg-teal-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-teal-800 active:scale-95 transition-all disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
