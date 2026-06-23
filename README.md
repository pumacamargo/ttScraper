# TikTok Analytics Scraper - Extensión de Chrome

Una extensión de Chrome que permite scrapear automáticamente los datos de analytics de TikTok Studio y enviarlos a un webhook en n8n.

## 📋 Características

- **Scrapeado automático** de métricas de TikTok Studio
- **Interfaz visual** intuitiva con botones
- **Envío a n8n** mediante webhooks
- **Almacenamiento** de URL del webhook
- **Estado en tiempo real** de operaciones

## 🚀 Instalación

### 1. Preparar la extensión
- Los archivos ya están en esta carpeta:
  - `manifest.json` - Configuración de la extensión
  - `popup.html` - Interfaz visual
  - `popup.js` - Lógica del popup
  - `content.js` - Script que scrapeaa los datos

### 2. Instalar en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el "Modo de desarrollador" (esquina superior derecha)
3. Haz clic en "Cargar extensión sin empaquetar"
4. Selecciona esta carpeta (`ttScraper`)
5. ¡Listo! La extensión debería aparecer en tu lista

## 📊 Cómo usar

### 1. Obtener URL del webhook en n8n
- Ve a tu n8n workspace
- Crea un nuevo flujo o abre uno existente
- Agrega un nodo "Webhook"
- Copia la URL del webhook
- Esa URL la usarás en la extensión

### 2. Usar la extensión

1. Abre los analytics de un video en TikTok Studio (https://www.tiktok.com/creator/analytics)
2. Haz clic en el icono de la extensión
3. Pega la URL del webhook en el campo (si no está guardada)
4. Haz clic en "🔍 Scrapear Datos"
5. Los datos aparecerán en el textarea
6. Haz clic en "📤 Enviar a n8n"

## 📤 Formato JSON que se envía

```json
{
  "timestamp": "2025-06-18T10:30:45.123Z",
  "videoViews": 313,
  "totalPlayTime": "0h 19m 49s",
  "averageWatchTime": "3.86s",
  "watchedFullVideo": 4.6,
  "newFollowers": 0,
  "trafficSources": [
    {
      "source": "For You",
      "percentage": 98.5
    }
  ],
  "retentionData": {},
  "pageUrl": "https://www.tiktok.com/creator/analytics/..."
}
```

## 🔧 Campos que se capturan

| Campo | Descripción |
|-------|-------------|
| `videoViews` | Total de vistas del video |
| `totalPlayTime` | Tiempo total que usuarios pasaron viendo |
| `averageWatchTime` | Tiempo promedio de visualización |
| `watchedFullVideo` | Porcentaje que vio el video completo |
| `newFollowers` | Nuevos seguidores generados |
| `trafficSources` | Fuentes de tráfico y porcentajes |
| `timestamp` | Fecha y hora del scrapeado |
| `pageUrl` | URL de la página |

## ⚙️ Configurar en n8n

En n8n, recibe los datos en el webhook y puedes:

1. **Guardarlos en una base de datos** (MongoDB, PostgreSQL, etc.)
2. **Enviarlos a Google Sheets**
3. **Hacer análisis** con otros nodos
4. **Crear reportes automáticos**
5. **Integrar con otras APIs**

### Ejemplo de flujo básico en n8n:
```
Webhook (recibe datos)
    ↓
Función (procesa datos si es necesario)
    ↓
Base de datos o Google Sheets
```

## 🐛 Solución de problemas

### "Error: No se pudo ejecutar en esta página"
- Asegúrate de estar en https://www.tiktok.com/creator/analytics
- Recarga la página
- Intenta de nuevo

### Los datos no se muestran correctamente
- Esto puede pasar si TikTok cambió su estructura HTML
- En ese caso, necesitamos actualizar los selectores en `content.js`
- Abre DevTools (F12) en la página de analytics
- Inspecciona los elementos
- Comparte los nuevos selectores para actualizar

### El webhook no recibe los datos
- Verifica que la URL sea correcta
- Asegúrate de que n8n esté corriendo
- Revisa los logs en n8n
- Intenta con una URL de prueba como https://webhook.site/

## 📝 Próximas mejoras (opcionales)

- [ ] Scrapeado de múltiples videos
- [ ] Exportar a CSV/Excel
- [ ] Historial de envíos
- [ ] Validación de datos más robusta
- [ ] Soporte para otros idiomas de TikTok

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola (F12 → Console)
2. Revisa los logs en n8n
3. Asegúrate de que todos los archivos estén en la carpeta
4. Intenta desinstalar y reinstalar la extensión

---

**Creado con ❤️ para automatizar tu flujo de datos de TikTok**
