export type UserRole = 'director' | 'maestra' | 'padre'
export type EstadoAnimo = 'feliz' | 'triste' | 'travieso' | 'cansado' | 'enfermo' | 'normal'
export type AvisoTipo = 'global' | 'privado'
export type MesaRol = 'presidente' | 'vicepresidente' | 'secretario'

export interface Colegio {
  id: string
  nombre: string
  direccion?: string
  telefono?: string
  logo_url?: string
  codigo_director: string
  codigo_maestra: string
  codigo_padre: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  telefono?: string
  foto_url?: string
  colegio_id?: string
  created_at: string
}

export interface Curso {
  id: string
  nombre: string
  colegio_id: string
  codigo: string
  created_at: string
}

export interface Alumno {
  id: string
  nombre: string
  apellido: string
  fecha_nacimiento?: string
  genero?: 'masculino' | 'femenino' | 'otro'
  foto_url?: string
  curso_id?: string
  colegio_id?: string
  tipo_sangre?: string
  alergias?: string
  enfermedades_cronicas?: string
  capacidades_diferentes?: string
  medicamentos?: string
  medico_cabecera?: string
  telefono_medico?: string
  tiene_seguro?: boolean
  nombre_seguro?: string
  numero_seguro?: string
  notas_especiales?: string
  created_at: string
}

export interface Tutor {
  id: string
  user_id?: string
  alumno_id: string
  full_name: string
  relacion: string
  telefono?: string
  email?: string
  foto_url?: string
  es_principal: boolean
  created_at: string
}

export interface TerceroAutorizado {
  id: string
  alumno_id: string
  full_name: string
  relacion: string
  telefono?: string
  foto_url?: string
  documento_identidad?: string
  notas?: string
  created_at: string
}

export interface PlanRecogida {
  id: string
  alumno_id: string
  responsable_nombre: string
  responsable_foto_url?: string
  responsable_relacion?: string
  fecha_inicio: string
  fecha_fin?: string
  notas?: string
  created_by?: string
  created_at: string
}

export interface Bitacora {
  id: string
  alumno_id: string
  maestra_id?: string
  fecha: string
  comio?: boolean
  estado_animo?: EstadoAnimo
  actividades?: string
  observaciones?: string
  foto_url?: string
  created_at: string
}

export interface Aviso {
  id: string
  curso_id: string
  maestra_id?: string
  titulo: string
  contenido: string
  tipo: AvisoTipo
  destinatario_id?: string
  created_at: string
}

export interface Actividad {
  id: string
  curso_id: string
  creado_por?: string
  titulo: string
  descripcion?: string
  fecha?: string
  hora?: string
  lugar?: string
  tiene_cuota: boolean
  monto_cuota?: number
  descripcion_cuota?: string
  material_requerido?: string
  created_at: string
}

export interface Camara {
  id: string
  colegio_id: string
  nombre: string
  ubicacion?: string
  stream_url: string
  activa: boolean
  created_at: string
}

export interface Ubicacion {
  id: string
  alumno_id: string
  lat: number
  lng: number
  updated_at: string
}