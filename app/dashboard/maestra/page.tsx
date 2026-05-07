import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MaestraDashboardClient from "./MaestraDashboardClient";

export default async function MaestraPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, colegio_id")
    .eq("id", user.id)
    .single();

  const { data: colegio } = await supabase
    .from("colegios")
    .select("nombre")
    .eq("id", profile?.colegio_id)
    .single();

  const { data: misCursos } = await supabase
    .from("maestra_curso")
    .select(`cursos ( id, nombre, codigo, alumnos ( id ) )`)
    .eq("maestra_id", user.id);

  const cursos = misCursos?.map((mc: any) => mc.cursos).filter(Boolean) ?? [];
  const cursosIds = cursos.map((c: any) => c.id);
  const totalAlumnos = cursos.reduce(
    (acc: number, c: any) => acc + (c?.alumnos?.length ?? 0),
    0,
  );
  const alumnosIds: string[] = cursos.flatMap(
    (c: any) => c.alumnos?.map((a: any) => a.id) ?? [],
  );

  const today = new Date().toISOString().split("T")[0];
  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const primerNombre = profile?.full_name?.split(" ")[0] ?? "Maestra";
  const todayLabel = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Bitácoras de hoy
  const { data: bitacorasHoy } =
    alumnosIds.length > 0
      ? await supabase
          .from("bitacoras")
          .select("id, alumno_id, estado_animo, comio")
          .in("alumno_id", alumnosIds)
          .eq("fecha", today)
      : { data: [] };

  const bitacorasCompletadas = bitacorasHoy?.length ?? 0;
  const bitacorasPendientes = totalAlumnos - bitacorasCompletadas;

  // Últimos 30 días hábiles
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const fechas30: string[] = [];
  const dRef = new Date();
  while (fechas30.length < 30) {
    if (dRef.getDay() !== 0 && dRef.getDay() !== 6)
      fechas30.unshift(dRef.toISOString().split("T")[0]);
    dRef.setDate(dRef.getDate() - 1);
  }
  const fechasChart = fechas30.slice(-10);

  const { data: bitacorasHistorial } =
    alumnosIds.length > 0
      ? await supabase
          .from("bitacoras")
          .select("fecha, alumno_id")
          .in("alumno_id", alumnosIds)
          .in("fecha", fechas30)
      : { data: [] };

  const chartData = fechasChart.map((fecha) => {
    const presentes = (bitacorasHistorial ?? []).filter(
      (b: any) => b.fecha === fecha,
    ).length;
    return {
      day: dias[new Date(fecha + "T12:00:00").getDay()],
      fecha,
      presentes,
      ausentes: Math.max(totalAlumnos - presentes, 0),
      pct: totalAlumnos > 0 ? Math.round((presentes / totalAlumnos) * 100) : 0,
    };
  });

  // Regresión lineal simple
  const puntos = fechas30
    .map((fecha, i) => {
      const presentes = (bitacorasHistorial ?? []).filter(
        (b: any) => b.fecha === fecha,
      ).length;
      return {
        x: i,
        y: totalAlumnos > 0 ? (presentes / totalAlumnos) * 100 : 0,
      };
    })
    .filter((p) => p.y > 0);

  let prediccion: number | null = null;
  let tendencia: "sube" | "baja" | "estable" | null = null;

  if (puntos.length >= 5) {
    const n = puntos.length;
    const sumX = puntos.reduce((a, p) => a + p.x, 0);
    const sumY = puntos.reduce((a, p) => a + p.y, 0);
    const sumXY = puntos.reduce((a, p) => a + p.x * p.y, 0);
    const sumX2 = puntos.reduce((a, p) => a + p.x * p.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    prediccion = Math.min(100, Math.max(0, Math.round(slope * 35 + intercept)));
    tendencia = slope > 1 ? "sube" : slope < -1 ? "baja" : "estable";
  }

  const diasConDatos = chartData.filter((d) => d.presentes > 0);
  const promedioAsistencia =
    diasConDatos.length > 0
      ? Math.round(
          diasConDatos.reduce((a, d) => a + d.pct, 0) / diasConDatos.length,
        )
      : 0;

  // Avisos y actividades
  const { data: avisosProximos } =
    cursosIds.length > 0
      ? await supabase
          .from("avisos")
          .select("id, titulo, tipo, fecha, hora, curso_id")
          .in("curso_id", cursosIds)
          .gte("fecha", today)
          .order("fecha", { ascending: true })
          .limit(4)
      : { data: [] };

  const { data: actividadesProximas } =
    cursosIds.length > 0
      ? await supabase
          .from("actividades")
          .select("id, titulo, fecha, curso_id")
          .in("curso_id", cursosIds)
          .gte("fecha", today)
          .order("fecha", { ascending: true })
          .limit(4)
      : { data: [] };

  const emociones = (bitacorasHoy ?? []).reduce(
    (acc: Record<string, number>, b: any) => {
      if (b.estado_animo) acc[b.estado_animo] = (acc[b.estado_animo] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const comieronHoy = (bitacorasHoy ?? []).filter(
    (b: any) => b.comio === true,
  ).length;

  return (
    <MaestraDashboardClient
      saludo={saludo}
      primerNombre={primerNombre}
      todayLabel={todayLabel}
      cursos={cursos}
      totalAlumnos={totalAlumnos}
      bitacorasCompletadas={bitacorasCompletadas}
      bitacorasPendientes={bitacorasPendientes}
      chartData={chartData}
      prediccion={prediccion}
      tendencia={tendencia}
      promedioAsistencia={promedioAsistencia}
      puntosRegresion={puntos.length}
      avisosProximos={avisosProximos ?? []}
      actividadesProximas={actividadesProximas ?? []}
      emociones={emociones}
      comieronHoy={comieronHoy}
    />
  );
}
