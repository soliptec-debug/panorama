import Parser from "rss-parser";

const parser = new Parser();
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
    const buf = Buffer.from(await r.arrayBuffer());
    return decodificar(buf, r.headers.get("content-type") || "");
  } finally {
    clearTimeout(t);
  }
}

export function decodificar(buf, contentType = "") {
  let charset = (contentType.match(/charset=([^;\s]+)/i) || [])[1];
  if (!charset) {
    const cabecera = buf.subarray(0, 200).toString("latin1");
    charset = (cabecera.match(/encoding=["']([^"']+)["']/i) || [])[1];
  }
  charset = (charset || "utf-8").toLowerCase().replace(/["']/g, "");
  try { return new TextDecoder(charset).decode(buf); } catch { return buf.toString("utf8"); }
}

function limpiarTexto(html = "", max = 220) {
  const txt = String(html)
    .replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
  return txt.length > max ? txt.slice(0, max).replace(/\s\S*$/, "") + "…" : txt;
}

export async function parsearXML(xml, fuente, viaGoogle = false) {
  const feed = await parser.parseString(xml);
  return (feed.items || [])
    .map((it) => {
      let titulo = (it.title || "").trim();
      if (viaGoogle) titulo = titulo.replace(/\s+-\s+[^-]+$/, "");
      const fecha = it.isoDate || it.pubDate || null;
      return {
        fuente: fuente.id,
        titulo,
        link: it.link,
        resumen: viaGoogle ? "" : limpiarTexto(it.contentSnippet || it.content || it.summary || ""),
        fecha: fecha ? new Date(fecha).toISOString() : null,
      };
    })
    .filter((n) => n.titulo && n.link);
}

export async function leerFuente(fuente, limite = 25) {
  try {
    const xml = await descargar(fuente.rss);
    const items = await parsearXML(xml, fuente);
    if (items.length) return { ok: true, via: "rss", items: items.slice(0, limite) };
    throw new Error("feed vacío");
  } catch (e1) {
    try {
      const g = `https://news.google.com/rss/search?q=site:${fuente.dominio}+when:2d&hl=es-419&gl=AR&ceid=AR:es-419`;
      const xml = await descargar(g);
      const items = await parsearXML(xml, fuente, true);
      if (!items.length) throw new Error("sin resultados");
      return { ok: true, via: "google", error: String(e1.message || e1), items: items.slice(0, limite) };
    } catch (e2) {
      return { ok: false, via: null, error: `${e1.message || e1} / respaldo: ${e2.message || e2}`, items: [] };
    }
  }
}
