import { FUENTES } from "../lib/fuentes.js";
import { leerFuente } from "../lib/leer-feed.js";

export default async function handler(req, res) {
  try {
    await responder(res);
  } catch (e) {
    res.status(500).json({ error: String(e && e.stack || e), fuentes: [], noticias: [] });
  }
}

async function responder(res) {
  const resultados = await Promise.all(
    FUENTES.map((f) => leerFuente(f).catch((e) => ({ ok: false, via: null, error: String(e.message || e), items: [] })))
  );

  const noticias = [];
  const estado = FUENTES.map((f, i) => {
    const r = resultados[i];
    noticias.push(...r.items);
    return { id: f.id, nombre: f.nombre, color: f.color, ok: r.ok, via: r.via, cantidad: r.items.length, error: r.error || null };
  });

  noticias.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
  res.status(200).json({ actualizado: new Date().toISOString(), fuentes: estado, noticias });
}
