import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Forzamos a que Next.js no use caché en esta ruta de API
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { mensaje } = await req.json();

    if (!mensaje) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ ERROR: La variable GEMINI_API_KEY no está configurada en el .env.local");
      return NextResponse.json({ error: "Falta la configuración de la API Key en el servidor." }, { status: 500 });
    }

    // Inicialización limpia
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Llamada con manejo estricto de parámetros
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: mensaje,
      config: {
        // 🎯 CAMBIO DE NOMBRE Y ROL AQUÍ
        systemInstruction: `Eres "Yachay AI", un asistente técnico y pedagógico inteligente para maestras de nivel inicial en Bolivia. 
        Tu objetivo es responder de forma clara y directa basándote en el Modelo Educativo Sociocomunitario Productivo (MESCP), la Ley 070 y los lineamientos del Ministerio de Educación de Bolivia. 
        Formatea tus respuestas para un chat fluido y amigable. Si te piden un plan de clases, estructúralo bajo los 4 momentos metodológicos: Práctica, Teoría, Valoración y Producción.`,
        temperature: 0.6,
      }
    });

    // Validamos que la respuesta contenga texto real
    const textoRespuesta = response.text || "No pude procesar una respuesta adecuada.";

    return NextResponse.json({ respuesta: textoRespuesta });
  } catch (error: any) {
    // Esto te va a chismosear el error real exacto en tu consola de la terminal
    console.error("💥 ERROR DETALLADO EN API YACHAY:", error);
    return NextResponse.json({ error: error.message || "Error interno en el backend" }, { status: 500 });
  }
}