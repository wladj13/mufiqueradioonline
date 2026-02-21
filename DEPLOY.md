# Guía de Despliegue - Mufique Radio (Vercel)

Esta guía te ayudará a desplegar "Mufique Radio" en Vercel para que todo el mundo pueda escucharla.

## Opción 1: Usando GitHub (Recomendado)

1.  **Sube tu código a GitHub**:
    - Crea un nuevo repositorio en GitHub.
    - Sube todos los archivos de esta carpeta (`index.html`, `style.css`, etc.) a ese repositorio.

2.  **Conecta con Vercel**:
    - Ve a [vercel.com](https://vercel.com) e inicia sesión.
    - Haz clic en **"Add New..."** -> **"Project"**.
    - Selecciona tu repositorio de GitHub "Mufique Radio" y haz clic en **Import**.

3.  **Configuración**:
    - Vercel detectará automáticamente que es un sitio estático.
    - **No necesitas cambiar nada**.
    - Haz clic en **Deploy**.

## Opción 2: Arrastrar y Soltar (Vercel CLI)

Si tienes instalada la Vercel CLI (`npm i -g vercel`), simplemente abre la terminal en esta carpeta y escribe:

```bash
vercel
```

Sigue las instrucciones en pantalla (dale Enter a todo para aceptar los valores predeterminados).

## Opción 3: Despliegue Manual (Dashboard)

Si no usas GitHub, puedes usar Vercel CLI como en la opción 2, o buscar opciones de "Drag & Drop" si Vercel las tiene habilitadas actualmente (aunque GitHub es la ruta estándar).

---

## Verificación Post-Despliegue

1.  Abre la URL que te da Vercel (ej. `mufique-radio.vercel.app`).
2.  Verifica que aparezca el candado de **HTTPS**.
3.  Dale Play a la radio y confirma que se escucha.
4.  Prueba instalar la App en tu celular (PWA).

¡Éxito con el lanzamiento! 🚀
