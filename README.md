# FuelFinder

Webapp responsive desarrollada con HTML, CSS y JavaScript puro para consultar datos de carburantes mediante la API REST oficial del Ministerio.

## Funcionalidades

1. Consulta de estaciones terrestres por comunidad autónoma.
2. Consulta de postes marítimos por provincia y producto.
3. Consulta histórica de precios por fecha, provincia y carburante.
4. Filtro rápido sobre resultados.
5. Ordenación por precio.
6. Visualización de la URL REST utilizada en cada consulta.
7. Modo claro/oscuro.
8. Navegación tipo app con barra inferior fija en móvil.

## Estructura

```txt
fuel-finder/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── api.js
    ├── app.js
    ├── render.js
    └── utils.js
```

## Ejecución local

No abras el archivo `index.html` directamente con doble clic si el navegador bloquea las llamadas `fetch`.

Opción recomendada con Python:

```bash
cd fuelfinder-webapp
python3 -m http.server 8080
```

Después abre:

```txt
http://localhost:8080
```

Opción con Node.js:

```bash
npx serve .
```

## Instalación en servidor web

Sube todo el contenido de la carpeta `fuelfinder-webapp` al directorio público del hosting, por ejemplo:

```txt
/var/www/vhosts/tudominio.com/httpdocs/fuelfinder/
```

Después accede desde:

```txt
https://tudominio.com/fuelfinder/
```

## Endpoints utilizados

Base:

```txt
https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes
```

Listados:

```txt
/Listados/ComunidadesAutonomas/
/Listados/Provincias/
/Listados/ProductosPetroliferos/
/Listados/MunicipiosPorProvincia/{IDProvincia}
```

Consultas principales:

```txt
/EstacionesTerrestres/FiltroCCAA/{IDCCAA}
/PostesMaritimos/FiltroProvinciaProducto/{IDProvincia}/{IDProducto}
/EstacionesTerrestresHist/FiltroProvinciaProducto/{FECHA}/{IDProvincia}/{IDProducto}
/EstacionesTerrestresHist/FiltroMunicipioProducto/{FECHA}/{IDMunicipio}/{IDProducto}
```

## Notas

- La fecha se introduce en formato HTML `yyyy-mm-dd`, pero la aplicación la convierte automáticamente a `dd-mm-yyyy` para llamar a la API.
- La app muestra la URL final utilizada en cada consulta para facilitar la documentación de la actividad.
- Si la API bloquea las peticiones desde el navegador por CORS, será necesario usar un pequeño proxy backend o servir la aplicación desde un entorno permitido.
