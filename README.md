# Panorama: noticias de todos lados

Junta los titulares de los principales portales argentinos en una sola página. Cada nota lleva al artículo original.

## Estructura
- `index.html`: la página
- `api/noticias.js`: función de Vercel que lee los RSS (con caché de 10 minutos)
- `lib/fuentes.js`: **la lista de medios**. Para agregar o sacar portales se edita este archivo
- `lib/leer-feed.js`: descarga y lee cada feed. Si el feed directo falla, usa Google Noticias como respaldo

## Publicar en Vercel (sin terminal)
1. Crear una cuenta en github.com.
2. Crear un repositorio nuevo (New repository → nombre `panorama` → Create).
3. En el repo: "uploading an existing file" → arrastrar **el contenido** de esta carpeta (no la carpeta entera ni `node_modules`) → Commit changes.
4. Entrar a vercel.com → Sign up with GitHub.
5. Add New → Project → Import `panorama` → Deploy (no hay que tocar nada de la configuración).
6. En ~1 minuto queda online en `panorama-xxxx.vercel.app`.

Cada vez que cambiás un archivo en GitHub, Vercel republica solo.

## Ver qué medios funcionan
Abrir `https://TU-SITIO.vercel.app/api/noticias`. En `fuentes` aparece cada medio con `ok`, `via` (`rss` = feed directo, `google` = respaldo) y el error si falló.
