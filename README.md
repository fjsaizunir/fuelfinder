# FuelFinder

Webapp responsive desarrollada con HTML, CSS y JavaScript puro para consultar datos de carburantes mediante la API REST oficial del Ministerio.

## Funcionalidades

1. Consulta de estaciones terrestres por comunidad autónoma y carburante.
2. Consulta de postes marítimos por provincia y producto.
3. Consulta histórica de precios por fecha, provincia y carburante.
4. Filtro rápido sobre resultados.
5. Ordenación por precio.
6. Visualización de la URL REST utilizada en cada consulta.
7. Modo claro/oscuro.
8. Navegación inferior fija en móvil.
9. Interfaz tipo Liquid Glass.
10. Instalación como PWA en terminal móvil.
11. Metadatos SEO, Open Graph, manifest PWA, robots.txt y sitemap.xml.
12. Página básica de aviso legal y privacidad.

## Estructura

```text
fuelfinder-webapp/
├── index.html
├── legal.html
├── manifest.webmanifest
├── service-worker.js
├── robots.txt
├── sitemap.xml
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── app.js
│   ├── render.js
│   └── utils.js
└── assets/
    ├── icons/
    └── social/
```

## Ejecución local

No abras el archivo `index.html` directamente con doble clic si el navegador bloquea las llamadas `fetch`.

Opción recomendada con Python:

```bash
cd fuelfinder-webapp
python3 -m http.server 8080
```

Después abre:

```text
http://localhost:8080
```

Opción con Node.js:

```bash
npx serve .
```

## Instalación en servidor web

Sube todo el contenido de la carpeta `fuelfinder-webapp` al directorio público del hosting, por ejemplo:

```text
/var/www/vhosts/tudominio.com/httpdocs/fuelfinder/
```

Después accede desde:

```text
https://tudominio.com/fuelfinder/
```

## Instalación como webapp móvil

La app incluye `manifest.webmanifest` y `service-worker.js`. En móviles compatibles, aparecerá un botón de instalación en la cabecera. En iOS se muestra una ayuda para añadir la app a la pantalla de inicio desde el menú de compartir del navegador.

## SEO y Open Graph

La página incluye:

- `title` y `description` optimizados.
- URL canónica.
- Open Graph y Twitter Card.
- Imagen social `assets/social/og-fuelfinder.png`.
- `robots.txt`.
- `sitemap.xml`.
- JSON-LD de tipo `WebApplication`.

## Privacidad y LOPD/RGPD

Se incluye `legal.html` con una política básica. La aplicación no solicita datos personales, no incorpora analítica y no utiliza cookies de seguimiento. Solo puede guardar preferencias locales, como el modo claro/oscuro, en el navegador del usuario.

## Endpoints utilizados

Base:

```text
https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes
```

Listados:

```text
/Listados/ComunidadesAutonomas/
/Listados/Provincias/
/Listados/ProductosPetroliferos/
/Listados/MunicipiosPorProvincia/{IDProvincia}
```

Consultas principales:

```text
/EstacionesTerrestres/FiltroCCAA/{IDCCAA}
/PostesMaritimos/FiltroProvinciaProducto/{IDProvincia}/{IDProducto}
/EstacionesTerrestresHist/FiltroProvinciaProducto/{FECHA}/{IDProvincia}/{IDProducto}
/EstacionesTerrestresHist/FiltroMunicipioProducto/{FECHA}/{IDMunicipio}/{IDProducto}
```

## Notas

- La fecha se introduce en formato HTML `yyyy-mm-dd`, pero la aplicación la convierte automáticamente a `dd-mm-yyyy` para llamar a la API.
- La app muestra la URL final utilizada en cada consulta para facilitar la documentación de la actividad.
- Si la API bloquea las peticiones desde el navegador por CORS, será necesario usar un pequeño proxy backend o servir la aplicación desde un entorno permitido.


## Cambios de esta versión

- Se elimina el dato técnico “Margen” de las tarjetas de resultados.
- La consulta de estaciones por comunidad incluye filtro de carburante.
- Se actualiza la URL base oficial a `https://energia.serviciosmin.gob.es/ServiciosRestCarburantes/PreciosCarburantes`.
- Se actualiza el service worker a estrategia network-first para evitar que se queden cacheados archivos antiguos tras publicar.
- El municipio de la consulta histórica queda como filtro opcional real.
