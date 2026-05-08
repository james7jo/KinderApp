/**
 * Bolivia = UTC-4 (no cambia por horario de verano)
 * Usamos esto en TODOS los lugares donde necesitamos "hoy" en Bolivia.
 */
export function hoyBolivia(): string {
  const now = new Date();
  // Restamos 4 horas a UTC para obtener hora boliviana
  const bolivia = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  return bolivia.toISOString().split("T")[0];
}

export function fechaLabelBolivia(): string {
  // Usamos el timezone de La Paz para el label visual
  return new Date().toLocaleDateString("es-BO", {
    timeZone: "America/La_Paz",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}