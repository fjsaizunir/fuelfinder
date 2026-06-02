# Guía rápida de instalación

## 1. Ejecutar en local

Abre una terminal dentro de la carpeta del proyecto y ejecuta:

```bash
python3 -m http.server 8080
```

Después abre en el navegador:

```txt
http://localhost:8080
```

## 2. Subir a un servidor web

Copia estos archivos y carpetas al servidor:

```txt
index.html
css/
js/
README.md
INSTALACION.md
```

No requiere base de datos ni instalación de dependencias.

## 3. Uso básico

### Estaciones por CCAA

1. Selecciona una comunidad autónoma.
2. Pulsa `Buscar estaciones`.
3. Revisa los resultados y la URL REST utilizada.

### Postes marítimos

1. Selecciona provincia.
2. Selecciona carburante.
3. Pulsa `Buscar postes`.

### Precios por fecha

1. Selecciona provincia.
2. Selecciona fecha.
3. Selecciona carburante.
4. Opcionalmente selecciona municipio.
5. Pulsa `Consultar precios`.

## 4. Capturas para la memoria

Para documentar la práctica se recomienda capturar:

1. Pantalla principal de la aplicación.
2. Consulta de estaciones por comunidad autónoma.
3. Consulta de postes marítimos por provincia y producto.
4. Consulta histórica por fecha, provincia y carburante.
5. Bloque donde aparece la URL REST utilizada.
