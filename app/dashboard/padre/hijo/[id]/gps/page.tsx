import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MapaGPS from "@/components/gps/MapaGPS";

export default async function GPSPadrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: alumno } = await supabase
    .from("alumnos")
    .select("nombre, apellido")
    .eq("id", id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-3">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">
            {alumno?.nombre} {alumno?.apellido}
          </p>
          <h1 className="text-lg font-black text-gray-900">
            GPS en tiempo real
          </h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        <MapaGPS
          alumnoId={id}
          alumnoNombre={`${alumno?.nombre} ${alumno?.apellido}`}
        />
      </div>
    </div>
  );
}
