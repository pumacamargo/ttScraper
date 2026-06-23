# 🧪 Prueba Rápida con webhook.site

## ¿Qué es webhook.site?

Es un servicio gratuito para probar webhooks sin necesidad de configurar n8n. Perfecto para verificar que tu extensión funciona correctamente.

## 📋 Pasos

### 1. Crear un webhook temporal

1. Ve a https://webhook.site/
2. Se generará automáticamente una URL única como:
   ```
   https://webhook.site/abc123def456-xyz789
   ```
3. **Copia esa URL completa**

### 2. Usar la extensión

1. Abre la extensión (click en el icono)
2. Pega la URL en el campo "URL del Webhook"
3. Abre una página de analytics en TikTok Studio
4. Haz clic en "🔍 Scrapear Datos"
5. Haz clic en "📤 Enviar a n8n"

### 3. Ver los datos

Los datos aparecerán en tiempo real en webhook.site:

- **En verde**: Los datos que tu extensión envió
- **JSON enviado**: El formato exacto de los datos
- **Timestamp**: Cuándo llegó

## ✅ Qué verificar

Si ves los datos en webhook.site:
- ✅ La extensión está scrapeando correctamente
- ✅ La URL del webhook es válida
- ✅ Los datos se están enviando correctamente

Entonces tu extension funcionará perfecto con n8n.

## 🔄 Si no ves los datos

1. Recarga webhook.site
2. Revisa que:
   - La URL esté pegada correctamente (sin espacios)
   - Estés en una página de analytics de TikTok
   - No haya errores en la consola (F12 → Console)

3. En la consola, deberías ver:
   ```
   Analytics scraped: {...}
   ```

## 💡 Una vez que funcione

1. Prueba con tu URL de n8n real
2. En n8n, agrega un segundo nodo para procesar los datos
3. Guárdalos en tu base de datos o Google Sheets

---

**webhook.site es solo para pruebas. Para producción usa n8n.**
