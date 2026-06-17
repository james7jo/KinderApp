'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

function mapearAnimo(animo: string): number {
  switch (animo?.toLowerCase()) {
    case 'triste': case 'mal': return 1;
    case 'normal': return 2;
    case 'feliz': case 'excelente': return 3;
    default: return 2;
  }
}

// Función auxiliar para calcular OLS (Mínimos Cuadrados)
function calcularOLS(puntos: { x: number; y: number }[]) {
  const n = puntos.length
  if (n < 2) return { m: 0, b: 0, r2: 0, error: 'Datos insuficientes' }

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (let i = 0; i < n; i++) {
    sumX += puntos[i].x
    sumY += puntos[i].y
    sumXY += puntos[i].x * puntos[i].y
    sumXX += puntos[i].x * puntos[i].x
  }

  const denominador = (n * sumXX - sumX * sumX)
  if (denominador === 0) return { m: 0, b: 0, r2: 0, error: 'X constante' }

  const m = (n * sumXY - sumX * sumY) / denominador
  const b = (sumY - m * sumX) / n

  // R²
  const yMedia = sumY / n
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    const yPred = m * puntos[i].x + b
    ssTot += Math.pow(puntos[i].y - yMedia, 2)
    ssRes += Math.pow(puntos[i].y - yPred, 2)
  }
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot)

  return { m, b, r2, success: true }
}

export async function analizarMultiplesRegresiones() {
  try {
    const { data, error } = await supabase
      .from('bitacoras')
      .select('fecha, estado_animo, comio')

    if (error) throw new Error(error.message)
    if (!data || data.length < 5) throw new Error('Registros insuficientes')

    // Formatear datos comunes
    const dataset = data.map(row => ({
      diaSemana: new Date(row.fecha).getDay(), // 1 a 5
      animoNum: mapearAnimo(row.estado_animo), // 1 a 3
      comioNum: row.comio === true ? 1 : 0    // 0 o 1
    })).filter(p => p.diaSemana >= 1 && p.diaSemana <= 5)

    // 1. Regresión: Día vs Ánimo
    const modeloDiaAnimo = calcularOLS(dataset.map(p => ({ x: p.diaSemana, y: p.animoNum })))

    // 2. Regresión: Comió vs Ánimo
    const modeloComioAnimo = calcularOLS(dataset.map(p => ({ x: p.comioNum, y: p.animoNum })))

    // 3. Regresión: Día vs Comió
    const modeloDiaComio = calcularOLS(dataset.map(p => ({ x: p.diaSemana, y: p.comioNum })))

    return {
      success: true,
      total: dataset.length,
      modelos: {
        diaAnimo: {
          titulo: "Impacto del Día de la Semana en el Ánimo",
          X_label: "Día de la semana (Lunes a Viernes)",
          Y_label: "Estado de Ánimo (1-3)",
          ...modeloDiaAnimo,
          interpretacion: modeloDiaAnimo.m! > 0 
            ? "El humor de los niños mejora paulatinamente conforme se acerca el fin de semana." 
            : "El nivel de energía o humor disminuye hacia el viernes."
        },
        comioAnimo: {
          titulo: "Relación entre Alimentación y Estado de Ánimo",
          X_label: "Comió todo (No=0, Sí=1)",
          Y_label: "Estado de Ánimo (1-3)",
          ...modeloComioAnimo,
          interpretacion: modeloComioAnimo.m! > 0 
            ? "Fuerte correlación: Los niños que terminan su comida registran mejor estado de ánimo." 
            : "La alimentación no parece alterar el indicador de humor directamente."
        },
        diaComio: {
          titulo: "Tendencia de Apetito durante la Semana",
          X_label: "Día de la semana (Lunes a Viernes)",
          Y_label: "Tasa de alimentación (0-1)",
          ...modeloDiaComio,
          interpretacion: modeloDiaComio.m! > 0 
            ? "El apetito de los niños aumenta hacia los últimos días de la semana." 
            : "Se registra una baja en el consumo de alimentos a medida que avanza la semana."
        }
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}