// Panorama: lee los RSS de los portales, clasifica por tema y agrupa la misma noticia entre medios.
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

const HORAS = 24;          // ventana de noticias
const POR_FUENTE = 80;     // máximo de notas por medio

// ───────────────────────── Temas ─────────────────────────
// secciones: palabras que aparecen en la URL o en la categoría del diario (más confiable)
// claves: palabras del título/resumen (se comparan por raíz, sin tildes)
const TEMAS = {
  politica: {
    secciones: ["politica", "el-pais", "elpais", "nacional", "gobierno", "congreso", "elecciones"],
    claves: ["milei", "kirchner", "cristina", "kicillof", "macri", "bullrich", "villarruel", "karina", "francos", "adorni", "massa", "peronismo", "peronista", "kirchnerismo", "libertario", "libertad avanza", "pro", "ucr", "radical", "diputados", "senado", "senador", "diputado", "congreso", "legislatura", "gobernador", "intendente", "casa rosada", "gabinete", "ministro", "ministra", "elecciones", "electoral", "candidato", "candidata", "boleta", "dnu", "veto", "decreto", "oposicion", "oficialismo", "sesion", "proyecto de ley", "corte suprema", "justicia federal"],
  },
  economia: {
    secciones: ["economia", "finanzas", "mercados", "dolar", "negocios", "empresas", "campo", "agro", "impuestos"],
    claves: ["dolar", "inflacion", "ipc", "indec", "bcra", "banco central", "caputo", "fmi", "reservas", "tasas", "tasa", "bonos", "riesgo pais", "merval", "acciones", "cepo", "devaluacion", "salario", "salarios", "jubilacion", "jubilados", "jubilaciones", "tarifas", "aumento", "aumentos", "precios", "exportaciones", "importaciones", "afip", "arca", "impuesto", "ganancias", "monotributo", "recaudacion", "deficit", "superavit", "deuda", "paritaria", "paritarias", "plazo fijo", "billetera", "cripto", "bitcoin", "ypf", "vaca muerta", "petroleo", "inversiones", "industria", "pbi", "actividad economica", "consumo", "ventas"],
  },
  sociedad: {
    secciones: ["sociedad", "salud", "educacion", "ciencia", "clima", "medio-ambiente", "ambiente", "ciudad", "ciudades", "buenos-aires", "conurbano", "transito", "servicios", "religion", "universidad", "trabajo", "turismo"],
    claves: ["salud", "hospital", "medico", "medicos", "pami", "obra social", "prepaga", "prepagas", "vacuna", "dengue", "covid", "virus", "brote", "escuela", "escuelas", "docentes", "clases", "universidad", "universidades", "estudiantes", "colectivo", "colectivos", "subte", "tren", "trenes", "transporte", "paro", "huelga", "marcha", "protesta", "clima", "tormenta", "alerta", "lluvias", "calor", "frio", "temperatura", "smn", "papa", "francisco", "leon xiv", "iglesia", "feriado", "fin de semana largo", "vacaciones", "turismo", "cortes de luz", "agua"],
  },
  policiales: {
    secciones: ["policiales", "policial", "seguridad", "judiciales", "judicial", "sucesos", "crimen", "inseguridad"],
    claves: ["crimen", "asesinato", "asesinado", "asesinada", "homicidio", "femicidio", "robo", "robaron", "ladron", "ladrones", "detenido", "detenida", "detenidos", "preso", "presos", "carcel", "policia", "policias", "fiscalia", "juicio", "condena", "condenado", "imputado", "allanamiento", "narco", "narcotrafico", "droga", "drogas", "secuestro", "tiroteo", "balazo", "baleado", "disparo", "victima", "choque", "accidente", "muerto", "muertos", "murio", "cadaver", "estafa", "estafas", "abuso"],
  },
  internacional: {
    secciones: ["mundo", "el-mundo", "elmundo", "internacional", "internacionales", "america", "america-latina", "latinoamerica", "estados-unidos", "eeuu", "europa", "world"],
    claves: ["trump", "estados unidos", "eeuu", "ee.uu", "washington", "casa blanca", "brasil", "lula", "bolsonaro", "chile", "boric", "uruguay", "paraguay", "bolivia", "peru", "venezuela", "maduro", "colombia", "petro", "mexico", "sheinbaum", "cuba", "china", "xi jinping", "rusia", "putin", "ucrania", "zelensky", "israel", "gaza", "hamas", "iran", "netanyahu", "europa", "union europea", "espana", "sanchez", "francia", "macron", "alemania", "reino unido", "londres", "italia", "meloni", "onu", "otan", "vaticano", "guerra"],
  },
  deportes: {
    secciones: ["deportes", "deporte", "futbol", "tenis", "rugby", "basquet", "automovilismo", "formula-1", "f1", "ole", "seleccion"],
    claves: ["futbol", "boca", "river", "racing", "independiente", "san lorenzo", "estudiantes de la plata", "velez", "huracan", "talleres", "rosario central", "newells", "seleccion", "scaloni", "messi", "afa", "tapia", "liga profesional", "copa libertadores", "libertadores", "sudamericana", "mundial", "gol", "goles", "torneo", "campeon", "tenis", "atp", "wta", "rugby", "pumas", "basquet", "nba", "formula 1", "colapinto", "f1", "gran premio", "boxeo", "olimpicos", "dt", "entrenador", "hinchas", "superclasico"],
  },
  espectaculos: {
    secciones: ["espectaculos", "espectaculo", "show", "teleshow", "famosos", "cultura", "gente", "tv", "television", "cine", "musica", "series", "entretenimiento", "lifestyle", "estilo"],
    claves: ["famoso", "famosa", "famosos", "actor", "actriz", "cantante", "pelicula", "serie", "netflix", "disney", "hbo", "streaming", "cine", "teatro", "recital", "concierto", "show", "album", "disco", "tinelli", "susana", "mirtha", "wanda", "nara", "icardi", "china suarez", "tini", "lali", "gran hermano", "telefe", "eltrece", "el trece", "premios", "oscar", "grammy", "martin fierro", "festival", "libro", "escritor", "muestra", "museo"],
  },
  tecnologia: {
    secciones: ["tecnologia", "tecno", "tech", "innovacion", "ciencia-y-tecnologia", "gaming", "videojuegos"],
    claves: ["inteligencia artificial", "ia", "chatgpt", "openai", "claude", "anthropic", "gemini", "google", "apple", "iphone", "android", "samsung", "whatsapp", "instagram", "tiktok", "facebook", "microsoft", "elon musk", "tesla", "spacex", "x", "twitter", "app", "aplicacion", "celular", "celulares", "ciberseguridad", "hackeo", "hackers", "estafa virtual", "videojuego", "videojuegos", "playstation", "nintendo", "robot", "chip", "chips", "nvidia", "satelite"],
  },
};

const NOMBRE_TEMA = { politica: "Política", economia: "Economía", sociedad: "Sociedad", policiales: "Policiales", internacional: "Internacional", deportes: "Deportes", espectaculos: "Espectáculos", tecnologia: "Tecnología", otros: "Otros" };

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function clasificar(n, categorias) {
  // 1) sección de la URL o categoría del diario
  let ruta = "";
  try { ruta = norm(new URL(n.link).pathname); } catch {}
  const segmentos = ruta.split("/").filter(Boolean).slice(0, 3);
  const cats = categorias.map(norm).map((c) => c.replace(/\s+/g, "-"));
  // la sección más específica gana (ej: /sociedad/policiales/ → policiales)
  for (const s of [...segmentos].reverse().concat(cats)) {
    for (const [tema, def] of Object.entries(TEMAS)) if (def.secciones.includes(s)) return tema;
  }
  // 2) palabras clave en título (pesa doble) y resumen
  const titulo = " " + norm(n.titulo).replace(/[^a-z0-9ñ.]+/g, " ") + " ";
  const resumen = " " + norm(n.resumen).replace(/[^a-z0-9ñ.]+/g, " ") + " ";
  let mejor = "otros", max = 0;
  for (const [tema, def] of Object.entries(TEMAS)) {
    let p = 0;
    for (const k of def.claves) {
      if (titulo.includes(` ${k} `)) p += 2;
      if (resumen.includes(` ${k} `)) p += 1;
    }
    if (p > max) { max = p; mejor = tema; }
  }
  return max >= 2 ? mejor : "otros";
}

// ───────────────────────── Agrupar la misma noticia ─────────────────────────
const VACIAS = new Set(("a al algo ante antes aqui asi aun bajo bien cada como con contra cual cuales cuando de del desde donde dos durante el ella ellos en entre era es esa ese eso esta estan este esto fue fueron ha han hace hacia hasta hay la las le les lo los mas me mientras muy mismo ni no nos nueva nuevo o otra otro para pero poco por porque que quien se sea segun ser si sin sobre su sus tal tambien tan tanto te tiene tienen todo todos tras tu un una uno unos unas usted ya y yo " +
  "dijo dice afirmo aseguro revelo explico anuncio confirmo advirtio hoy ayer manana video videos foto fotos ultimo ultima minuto vivo directo cuanto cuanta cuantos cual cuales donde quienes que como esto asi años ano dia dias semana mes meses hora horas vez veces gran grandes mejor peor primer primera tres cuatro cinco mil millones argentina argentino argentinos argentinas pais nacional quiere puede pueden podria sera seran ahora todo nada").split(/\s+/));

function tokens(titulo) {
  return [...new Set(norm(titulo).replace(/[^a-z0-9ñ]+/g, " ").split(" ")
    .filter((w) => w.length >= 3 && !VACIAS.has(w))
    .map((w) => (/^\d+$/.test(w) ? w : w.slice(0, 6))))];
}

function agrupar(noticias) {
  const tk = noticias.map((n) => tokens(n.titulo));
  const df = new Map();
  tk.forEach((ts) => ts.forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  const N = noticias.length || 1;
  const idf = (t) => Math.log(1 + N / (df.get(t) || 1));
  const peso = (ts) => ts.reduce((s, t) => s + idf(t), 0);

  function similitud(a, b) {
    const sb = new Set(b);
    const comunes = a.filter((t) => sb.has(t));
    if (comunes.length < 2) return 0;
    return peso(comunes) / Math.min(peso(a), peso(b) || 1);
  }

  const grupos = [];
  const orden = noticias.map((_, i) => i).sort((i, j) => (noticias[j].fecha || "").localeCompare(noticias[i].fecha || ""));
  for (const i of orden) {
    if (tk[i].length < 2) continue;
    let mejor = null, max = 0;
    for (const g of grupos) {
      // compara contra cada nota del grupo y toma el mejor parecido
      let s = 0;
      for (const j of g.miembros) s = Math.max(s, similitud(tk[i], tk[j]));
      if (s > max) { max = s; mejor = g; }
    }
    if (mejor && max >= 0.36) mejor.miembros.push(i);
    else grupos.push({ miembros: [i] });
  }

  return grupos
    .map((g) => {
      const medios = new Set(g.miembros.map((i) => noticias[i].fuente));
      const temas = {};
      g.miembros.forEach((i) => (temas[noticias[i].tema] = (temas[noticias[i].tema] || 0) + 1));
      delete temas.otros;
      const tema = Object.entries(temas).sort((a, b) => b[1] - a[1])[0]?.[0] || "otros";
      const fecha = g.miembros.map((i) => noticias[i].fecha).filter(Boolean).sort().pop() || null;
      return { tema, fecha, medios: medios.size, items: g.miembros.map((i) => noticias[i].id) };
    })
    .filter((g) => g.medios >= 2)
    .sort((a, b) => b.medios - a.medios || (b.fecha || "").localeCompare(a.fecha || ""));
}

// ───────────────────────── Lectura de feeds ─────────────────────────
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

const sinCdata = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();

function etiqueta(bloque, ...nombres) {
  for (const n of nombres) {
    const m = bloque.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
    if (m) return sinCdata(m[1]);
  }
  return "";
}

function categorias(bloque) {
  const out = [];
  for (const m of bloque.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)) out.push(entidades(sinCdata(m[1])));
  for (const m of bloque.matchAll(/<category[^>]*term=["']([^"']+)["']/gi)) out.push(entidades(m[1]));
  return out;
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
    const n = { fuente: fuente.id, titulo, link: link.trim(), resumen, fecha };
    n.tema = clasificar(n, viaGoogle ? [] : categorias(b));
    return n;
  }).filter((n) => n.titulo && /^https?:\/\//.test(n.link));
}

async function leerFuente(fuente) {
  try {
    const items = parsear(await descargar(fuente.rss), fuente);
    if (items.length) return { ok: true, via: "rss", items };
    throw new Error("feed vacío");
  } catch (e1) {
    try {
      const g = `https://news.google.com/rss/search?q=site:${fuente.dominio}+when:1d&hl=es-419&gl=AR&ceid=AR:es-419`;
      const items = parsear(await descargar(g), fuente, true);
      if (!items.length) throw new Error("sin resultados");
      return { ok: true, via: "google", error: String(e1.message || e1), items };
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
    const desde = new Date(Date.now() - HORAS * 3600 * 1000).toISOString();
    const noticias = [];
    const fuentes = FUENTES.map((f, i) => {
      const r = resultados[i];
      const vistos = new Set();
      const items = r.items
        .filter((n) => !n.fecha || n.fecha >= desde)
        .filter((n) => !vistos.has(n.link) && vistos.add(n.link))
        .slice(0, POR_FUENTE);
      noticias.push(...items);
      return { id: f.id, nombre: f.nombre, color: f.color, ok: r.ok, via: r.via, cantidad: items.length, error: r.error || null };
    });
    noticias.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    noticias.forEach((n, i) => (n.id = i));
    const grupos = agrupar(noticias);

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json({ actualizado: new Date().toISOString(), horas: HORAS, temas: NOMBRE_TEMA, fuentes, noticias, grupos });
  } catch (e) {
    res.status(500).json({ error: String((e && e.stack) || e), fuentes: [], noticias: [], grupos: [] });
  }
}
