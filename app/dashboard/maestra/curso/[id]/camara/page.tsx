import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  WifiOff,
  RefreshCw,
  MapPin,
  Shield,
} from "lucide-react";
import CamaraStreamMaestra from "./CamaraStreamMaestra";

export default async function CamaraMaestraPage({
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

  const { data: curso } = await supabase
    .from("cursos")
    .select("nombre, colegio_id")
    .eq("id", id)
    .single();

  // Solo cámaras asignadas a ESTE curso
  const { data: camaras } = await supabase
    .from("camaras")
    .select("*")
    .eq("colegio_id", curso?.colegio_id)
    .eq("curso_id", id)
    .eq("activa", true)
    .order("created_at");

  return (
    <main className="min-w-0">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/maestra/curso/${id}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
            {curso?.nombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Cámaras en vivo
          </h1>
        </div>
        {camaras && camaras.length > 0 && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full shrink-0">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-600 text-[10px] font-black">
              {camaras.length} activa{camaras.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {camaras && camaras.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {camaras.map((camara) => (
              <CamaraStreamMaestra key={camara.id} camara={camara} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <Video size={36} className="text-gray-300" />
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              Sin cámaras asignadas
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              El director debe asignar cámaras a este curso desde el panel de
              cámaras
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
