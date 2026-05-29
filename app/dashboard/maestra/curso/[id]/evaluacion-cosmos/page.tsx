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

  // 2. Traer información del curso (incluyendo año de escolaridad: 1 o 2)
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

  // 4. Traer el contenido oficial del Ministerio cargado para Cosmos y Pensamiento (campo_id = 1)
  const { data: contenidosPDF } = await supabase
    .from("contenidos_trimestre")
    .select("*")
    .eq("campo_id", 1) // 1 = Cosmos y Pensamiento
    .eq("anio_escolaridad", curso.anio_escolaridad);

  // 5. Cargar historial de evaluaciones semanales ya existentes de Cosmos para este curso
  const { data: evaluacionesExistentes } = await supabase
    .from("observacion_semanal")
    .select("*")
    .eq("curso_id", cursoId)
    .eq("campo_id", 1);

  const today = hoyBolivia();
  const gestionActual = new Date(today).getFullYear();

  return (
    <EvaluacionCosmosClient
      cursoId={cursoId}
      cursoNombre={curso.nombre}
      colegioId={curso.colegio_id}
      maestraId={user.id}
      alumnos={alumnos ?? []}
      contenidosPDF={contenidosPDF ?? []}
      evaluacionesExistentes={evaluacionesExistentes ?? []}
      gestion={gestionActual}
    />
  );
}
