// Panorama: lee los RSS de los portales y devuelve todo junto en JSON.
// Archivo autosuficiente: no usa librerías externas ni otros archivos.

const FUENTES = [
  { id: "clarin",    nombre: "Clarín",              dominio: "clarin.com",            rss: "https://www.clarin.com/rss/lo-ultimo/",                            color: "#d6001c" },
  { id: "lanacion",  nombre: "La Nación",           dominio: "lanacion.com.ar",       rss: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml", color: "#1d3b6e" },
  { id: "infobae",   nombre: "Infobae",             dominio: "infobae.com",           rss: "https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml",     color: "#f28c00" },
  { id: "pagina12",  nombre: "Página/12",           dominio: "pagina12.com.ar",       rss: "https://www.pagina12.com.ar/rss/portada",                           color: "#2a2a2a" },
  { id: "perfil",    nombre: "Perfil",              dominio: "perfil.com",            rss: "https://www.perfil.com/feed",                                       color: "#c8102e" },
  { id: "ambito",    nombre: "Ámbito",              dominio: "ambito.com",            rss: "https://www.ambito.com/rss/pages/home.xml",                         color: "#00804a" },
  { id: "cronista",  nombre: "El Cronista",         dominio: "cronista.com",          rss: "https://www.cronista.com/files/rss/news.xml",                       color: "#7a1f2b" },
  { id: "eldestape", nombre: "El Destape",          dominio: "eldestapeweb.com",      rss: "https://www.eldestapeweb.com/rss/home.xml",                         color: "#5b2a86" },
  { id: "tiempoar",  nombre: "Tiempo Argentino",    dominio: "tiempoar.com.ar",       rss: "https://www.tiempoar.com.ar/feed/",                                 color: "#0072bc" },
  { id: "izquierda", nombre: "La Izquierda Diario", dominio: "laizquierdadiario.com", rss: "https://www.laizquierdadiario.com/spip.php?page=backend",           color: "#b3001b" },
  { id: "derecha",   nombre: "La Derecha Diario",   dominio: "derechadiario.com.ar",  rss: "https://derechadiario.com.ar/feed",                                 color: "#5e4a1f" },
  { id: "laprensa",  nombre: "La Prensa",           dominio: "laprensa.com.ar",       rss: "https://www.laprensa.com.ar/rss/",                                  color: "#3c3c3c" },
];

const UA = "Mozilla/5.0 (compatible; PanoramaNoticias/1.0; lector RSS personal)";

async function descargar(url, ms = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    let charset = ((r.headers.get("content-type") || "").match(/charset=([^;\s]+)/i) || [])[1];
    if (!charset) {
      const cab = new TextDecoder("latin1").decode(bytes.subarray(0, 200));
      charset = (cab.match(/encoding=["']([^"']+)["']/i) || [])[1];
    }
    charset = (charset || "utf-8").toLowerCase().replace(/["']/g, "");
    try { return new TextDecoder(charset).decode(bytes); } catch { return new TextDecoder("utf-8").decode(bytes); }
  } finally {
    clearTimeout(t);
  }
}

function entidades(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function etiqueta(bloque, ...nombres) {
  for (const n of nombres) {
    const m = bloque.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
    if (m) return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
  }
  return "";
}

function textoPlano(html, max = 220) {
  const t = entidades(entidades(html).replace(/<[^>]*>/g, " ")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max).replace(/\s\S*$/, "") + "…" : t;
}

function parsear(xml, fuente, viaGoogle = false) {
  const bloques = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return bloques.map((b) => {
    let titulo = textoPlano(etiqueta(b, "title"), 400);
    if (viaGoogle) titulo = titulo.replace(/\s+-\s+[^-]+$/, "");
    let link = entidades(etiqueta(b, "link"));
    if (!link) link = entidades((b.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || "");
    const f = etiqueta(b, "pubDate", "dc:date", "published", "updated");
    const fecha = f && !isNaN(new Date(f)) ? new Date(f).toISOString() : null;
    const resumen = viaGoogle ? "" : textoPlano(etiqueta(b, "description", "summary", "content:encoded", "content"));
    return { fuente: fuente.id, titulo, link: link.trim(), resumen, fecha };
  }).filter((n) => n.titulo && /^https?:\/\//.test(n.link));
}

async function leerFuente(fuente, limite = 25) {
  try {
    const items = parsear(await descargar(fuente.rss), fuente);
    if (items.length) return { ok: true, via: "rss", items: items.slice(0, limite) };
    throw new Error("feed vacío");
  } catch (e1) {
    try {
      const g = `https://news.google.com/rss/search?q=site:${fuente.dominio}+when:2d&hl=es-419&gl=AR&ceid=AR:es-419`;
      const items = parsear(await descargar(g), fuente, true);
      if (!items.length) throw new Error("sin resultados");
      return { ok: true, via: "google", error: String(e1.message || e1), items: items.slice(0, limite) };
    } catch (e2) {
      return { ok: false, via: null, error: `${e1.message || e1} / respaldo: ${e2.message || e2}`, items: [] };
    }
  }
}

export default async function handler(req, res) {
  try {
    const resultados = await Promise.all(
      FUENTES.map((f) => leerFuente(f).catch((e) => ({ ok: false, via: null, error: String(e.message || e), items: [] })))
    );
    const noticias = [];
    const fuentes = FUENTES.map((f, i) => {
      const r = resultados[i];
      noticias.push(...r.items);
      return { id: f.id, nombre: f.nombre, color: f.color, ok: r.ok, via: r.via, cantidad: r.items.length, error: r.error || null };
    });
    noticias.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json({ actualizado: new Date().toISOString(), fuentes, noticias });
  } catch (e) {
    res.status(500).json({ error: String((e && e.stack) || e), fuentes: [], noticias: [] });
  }
}
