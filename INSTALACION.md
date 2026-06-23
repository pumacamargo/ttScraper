# 🚀 Guía Rápida de Instalación

## Paso 1: Instalar la extensión en Chrome

1. Abre Chrome
2. Ve a esta URL: `chrome://extensions/`
3. En la esquina superior derecha, activa **"Modo de desarrollador"**

   ![modo desarrollador](https://i.imgur.com/example.png)

4. Haz clic en **"Cargar extensión sin empaquetar"**
5. Navega hasta esta carpeta: `D:\Puma\codeDevelopment\ttScraper`
6. Selecciona la carpeta y abre

✅ ¡La extensión debería aparecer en tu lista de extensiones!

## Paso 2: Crear webhook en n8n

1. Ve a tu n8n workspace (https://n8n.cloud o tu instancia local)
2. Crea un nuevo flujo o abre uno existente
3. Haz clic en "+" para agregar un nodo
4. Busca y selecciona **"Webhook"**
5. Haz clic en "Listen"
6. Se generará una URL como:
   ```
   https://tu-instancia.n8n.cloud/webhook/abc123def456
   ```
7. **Copia esa URL** (la usarás en la extensión)

## Paso 3: Usar la extensión

1. Ve a TikTok Studio: https://www.tiktok.com/creator/analytics
2. Haz clic en un video para ver sus analytics
3. Busca el icono de la extensión en Chrome (esquina superior derecha)
4. Haz clic en él
5. En el popup:
   - **Pega la URL del webhook** que copiaste de n8n
   - Haz clic en **"🔍 Scrapear Datos"**
   - Los datos aparecerán en el textarea
   - Haz clic en **"📤 Enviar a n8n"**

✅ ¡Los datos llegarán a tu webhook en n8n!

## Paso 4: Ver los datos en n8n

Los datos llegarán como JSON en el webhook:

```json
{
  "timestamp": "2025-06-18T10:30:45.123Z",
  "videoViews": 313,
  "totalPlayTime": "0h 19m 49s",
  "averageWatchTime": "3.86s",
  "watchedFullVideo": 4.6,
  "newFollowers": 0,
  "trafficSources": [{"source": "For You", "percentage": 98.5}],
  "pageUrl": "https://www.tiktok.com/creator/analytics/..."
}
```

Desde ahí puedes:
- Guardarlos en una base de datos
- Enviarlos a Google Sheets
- Hacer análisis
- Crear reportes

## 🎯 Archivos de la extensión

```
ttScraper/
├── manifest.json          ← Configuración de la extensión
├── popup.html            ← Interfaz visual
├── popup.js              ← Lógica del botón
├── content.js            ← Script que extrae datos
├── README.md             ← Documentación
├── INSTALACION.md        ← Este archivo
├── TikTok Studio.html    ← Página guardada (referencia)
└── TikTok Studio_files/  ← Archivos de la página
```

## ⚠️ Importante

- La extensión funciona **solo en páginas de TikTok Studio**
- Debes tener **sesión iniciada** en TikTok
- La URL del webhook se guarda automáticamente
- Los datos se envían **tal como están** sin procesar

## 🔍 ¿Cómo verificar que funciona?

1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Cuando hagas clic en "Scrapear", deberías ver en la consola:
   ```
   Analytics scraped: {...}
   ```

4. En n8n, deberías ver el webhook "encendido" (en verde)

## ❌ Si no funciona

### La extensión no aparece
- Asegúrate de activar "Modo de desarrollador"
- Intenta refrescar `chrome://extensions/`

### No se scrapeaa los datos
- Asegúrate de estar en la página de analytics de un video
- Intenta recargar la página
- Los selectores pueden haber cambiado si TikTok actualizó su sitio

### No llega a n8n
- Verifica que la URL del webhook sea correcta
- Prueba con https://webhook.site/ para verificar
- Revisa los logs en n8n

---

**¿Necesitas ayuda? Revisa el README.md para más detalles.**
