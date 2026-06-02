# Instalación de FuelFinder

## 1. Instalación local

Descomprime el proyecto y entra en la carpeta principal:

```bash
cd fuelfinder-webapp
```

Ejecuta un servidor local:

```bash
python3 -m http.server 8080
```

Abre la aplicación desde:

```text
http://localhost:8080
```

## 2. Instalación en servidor web

Sube todos los archivos de la carpeta `fuelfinder-webapp` al directorio público donde quieras publicar la aplicación.

Ejemplo:

```text
/var/www/vhosts/fransaiz.com/httpdocs/fuelfinder/
```

La URL quedaría así:

```text
https://fransaiz.com/fuelfinder/
```

## 3. PWA e instalación móvil

La aplicación incluye:

- `manifest.webmanifest`
- `service-worker.js`
- Iconos en `assets/icons/`
- Botón de instalación visible solo en móvil cuando el navegador lo permite

Para que la instalación PWA funcione correctamente, la aplicación debe servirse mediante HTTPS.

## 4. SEO y privacidad

Se incluyen:

- Metadatos SEO en `index.html`
- Open Graph y Twitter Card
- Imagen social en `assets/social/og-fuelfinder.png`
- `robots.txt`
- `sitemap.xml`
- Página `legal.html` con aviso legal y privacidad básica

## 5. Pruebas recomendadas

1. Abrir la app en escritorio.
2. Abrir la app en móvil real.
3. Probar modo claro/oscuro.
4. Probar botón de instalación móvil.
5. Validar que se cargan las tres consultas.
6. Comprobar en consola que no hay errores JavaScript.
7. Verificar en Lighthouse: SEO, Best Practices y PWA.
