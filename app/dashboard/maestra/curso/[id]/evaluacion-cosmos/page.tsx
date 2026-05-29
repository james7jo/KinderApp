import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hoyBolivia } from "@/lib/fecha-bolivia";
import EvaluacionCosmosClient from "./EvaluacionCosmosClient";

export default async function EvaluacionCosmosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: cursoId } = await params;
  const supabase = await createClient();

  // 1. Validar autenticación de la maestra
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 2. Traer información del curso
  const { data: curso } = await supabase
    .from("cursos")
    .select("nombre, anio_escolaridad, colegio_id")
    .eq("id", cursoId)
    .single();

  if (!curso) redirect("/dashboard/maestra");

  // 3. Traer alumnos asignados a este curso específico
  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, foto_url")
    .eq("curso_id", cursoId)
    .order("nombre");

  // 4. Leer el JSONB de planificación
  const { data: planAnual } = await supabase
    .from("planificacion_anual")
    .select("contenido_estructurado")
    .eq("curso_id", cursoId)
    .maybeSingle();

  // ✅ CORRECCIÓN DEFINITIVA: Eliminamos por completo la propiedad en inglés que causaba el error
  const planItems = (planAnual?.contenido_estructurado as any[]) || [];
  let contenidosPDF: any[] = [];

  if (planItems && planItems.length > 0) {
    // Protección por si algún item del array viene corrupto
    const idsPlanificados = planItems
      .filter((item) => item && item.contenido_id)
      .map((item: any) => item.contenido_id);

    if (idsPlanificados.length > 0) {
      // Jalamos los registros de contenidos_trimestre
      const { data: registrosTematicos } = await supabase
        .from("contenidos_trimestre")
        .select("id, campo_id, titulo_tematico, contenidos_detalle")
        .in("id", idsPlanificados);

      if (registrosTematicos && registrosTematicos.length > 0) {
        registrosTematicos.forEach((tema) => {
          if (!tema) return;

          const detallesRaw = tema.contenidos_detalle;
          const listaDetalles = Array.isArray(detallesRaw)
            ? detallesRaw
            : typeof detallesRaw === "string"
              ? JSON.parse(detallesRaw)
              : [];

          listaDetalles.forEach((det: any, index: number) => {
            if (!det) return;

            // 🛡️ CONTROL DE INFECCIÓN DE NULOS: Validamos el texto del criterio de forma ultra estricta
            let textoCriterio = "";
            if (typeof det === "string") {
              textoCriterio = det;
            } else if (det && typeof det === "object") {
              textoCriterio =
                det.criterio || det.indicador || det.detalle || det.texto || "";
            }

            // Si el criterio sigue vacío, le ponemos un texto genérico para que no rompa el toLowerCase()
            if (!textoCriterio || typeof textoCriterio !== "string") {
              textoCriterio = "Criterio de evaluación general";
            }

            const textoLimpio = textoCriterio.toLowerCase().trim();
            let dimensionDetectada = "";

            // 🛡️ Validamos de forma segura la dimensión nativa si es que existe
            if (det && det.dimension) {
              dimensionDetectada = String(det.dimension).toLowerCase().trim();
            }

            // Si no hay dimensión válida, ejecutamos el analizador semántico con salvavidas
            if (
              !dimensionDetectada ||
              dimensionDetectada === "undefined" ||
              dimensionDetectada === "null"
            ) {
              const verbosSer = [
                "demuestra",
                "respeta",
                "valora",
                "ayuda",
                "comparte",
                "asume",
                "manifiesta",
                "expresa afecto",
                "solidaridad",
                "compañerismo",
                "autoestima",
                "autonomía",
                "convivencia",
                "cuidado de",
                "identidad",
                "hábitos de higiene",
                "alimentación saludable",
              ];

              const verbosSaber = [
                "identifica",
                "reconoce",
                "comprende",
                "describe",
                "clasifica",
                "diferencia",
                "asocia",
                "nombra",
                "observa",
                "entiende",
                "noción",
                "cuenta",
                "símbolos",
                "colores",
                "formas",
                "números",
              ];

              const verbosHacer = [
                "manipula",
                "dibuja",
                "crea",
                "realiza",
                "produce",
                "aplica",
                "construye",
                "expresa corporalmente",
                "canta",
                "baila",
                "utiliza",
                "maneja",
                "traza",
                "rasga",
                "pinta",
                "modela",
                "coordinación",
              ];

              const matchSer = verbosSer.some(
                (v) => v && textoLimpio.includes(v),
              );
              const matchHacer = verbosHacer.some(
                (v) => v && textoLimpio.includes(v),
              );
              const matchSaber = verbosSaber.some(
                (v) => v && textoLimpio.includes(v),
              );

              if (matchSer) {
                dimensionDetectada = "ser";
              } else if (matchHacer) {
                dimensionDetectada = "hacer";
              } else if (matchSaber) {
                dimensionDetectada = "saber";
              } else {
                const respaldo = index % 3;
                if (respaldo === 0) dimensionDetectada = "ser";
                if (respaldo === 1) dimensionDetectada = "saber";
                if (respaldo === 2) dimensionDetectada = "hacer";
              }
            }

            // 🛡️ Aseguramos que el título temático jamás sea null
            const tituloFinal =
              tema.titulo_tematico || "Contenido Curricular Trimestral";

            contenidosPDF.push({
              id: `${tema.id}_${index}`,
              campo_id: tema.campo_id || 1,
              tematica: tituloFinal,
              dimension: dimensionDetectada || "saber",
              criterio: textoCriterio,
            });
          });
        });
      }
    }
  }

  // 5. Cargar historial de evaluaciones semanales
  const { data: evaluacionesExistentes } = await supabase
    .from("observacion_semanal")
    .select("*")
    .eq("curso_id", cursoId);

  const today = hoyBolivia();
  const gestionActual = new Date(today).getFullYear();

  return (
    <EvaluacionCosmosClient
      cursoId={cursoId}
      cursoNombre={curso.nombre || "Curso General"}
      colegioId={curso.colegio_id || ""}
      maestraId={user.id}
      alumnos={alumnos ?? []}
      contenidosPDF={contenidosPDF}
      evaluacionesExistentes={evaluacionesExistentes ?? []}
      gestion={gestionActual}
    />
  );
}
