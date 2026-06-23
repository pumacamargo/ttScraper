// Background service worker
const WEBHOOK_URL = 'https://flows.lemonsushi.com/webhook/ttchop_ttAnalytics';

// Al hacer click en el icono de la extensión
chrome.action.onClicked.addListener((tab) => {
  console.log('[Background] Icono clickeado en:', tab.url);

  // Enviar mensaje al content script
  chrome.tabs.sendMessage(
    tab.id,
    { action: 'scrapeTikTokAnalytics' },
    async (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error:', chrome.runtime.lastError.message);
        showNotification('❌ Error', 'No se pudo scrapear los datos');
        return;
      }

      if (response && response.success && response.data) {
        const data = response.data;
        console.log('[Background] Datos recibidos:', data);

        // Enviar al webhook
        try {
          const fetchResponse = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          if (fetchResponse.ok) {
            console.log('[Background] Datos enviados correctamente');
            showNotification('✅ Éxito', 'Datos enviados correctamente al webhook');
          } else {
            console.error('[Background] Error en respuesta:', fetchResponse.status);
            showNotification('❌ Error', `Error del servidor: ${fetchResponse.status}`);
          }
        } catch (error) {
          console.error('[Background] Error al enviar:', error);
          showNotification('❌ Error', `Error: ${error.message}`);
        }
      } else {
        console.error('[Background] Respuesta inválida:', response);
        showNotification('❌ Error', 'No se pudieron obtener los datos');
      }
    }
  );
});

// Función para mostrar notificación
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" fill="%23000">📊</text></svg>',
    title: title,
    message: message,
    priority: 2
  });
}
