// Variables globales
let scrapedData = null;

// Elementos del DOM
const webhookInput = document.getElementById('webhookUrl');
const scrapedDataTextarea = document.getElementById('scrapedData');
const scrapearBtn = document.getElementById('scrapearBtn');
const enviarBtn = document.getElementById('enviarBtn');
const limpiarBtn = document.getElementById('limpiarBtn');
const statusDiv = document.getElementById('status');

// Cargar webhook URL guardada
try {
  chrome.storage.local.get('webhookUrl', (result) => {
    if (result && result.webhookUrl) {
      webhookInput.value = result.webhookUrl;
    }
  });
} catch (e) {
  webhookInput.value = localStorage.getItem('webhookUrl') || '';
}

// Guardar webhook URL cuando cambia
webhookInput.addEventListener('change', () => {
  try {
    chrome.storage.local.set({ webhookUrl: webhookInput.value });
  } catch (e) {
    localStorage.setItem('webhookUrl', webhookInput.value);
  }
});

// Función para mostrar estado
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 5000);
  }
}

// Botón Scrapear
scrapearBtn.addEventListener('click', () => {
  scrapearBtn.disabled = true;
  scrapearBtn.textContent = '⏳ Scrapeando...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      showStatus('Error: No se encontró pestaña', 'error');
      scrapearBtn.disabled = false;
      scrapearBtn.textContent = '🔍 Scrapear Datos';
      return;
    }

    const tab = tabs[0];

    chrome.tabs.sendMessage(
      tab.id,
      { action: 'scrapeTikTokAnalytics' },
      async (response) => {
        // Verificar si hay error de Chrome
        if (chrome.runtime.lastError) {
          console.error('Chrome error:', chrome.runtime.lastError.message);
          showStatus('Error: No se pudo ejecutar en esta página. Asegúrate de estar en TikTok Studio.', 'error');
          scrapearBtn.disabled = false;
          scrapearBtn.textContent = '🔍 Scrapear Datos';
          return;
        }

        // Verificar si tenemos respuesta
        if (!response) {
          console.error('No response from content script');
          showStatus('Error: No respuesta del script de contenido', 'error');
          scrapearBtn.disabled = false;
          scrapearBtn.textContent = '🔍 Scrapear Datos';
          return;
        }

        // Procesar respuesta exitosa
        if (response.success && response.data) {
          scrapedData = response.data;
          scrapedDataTextarea.value = JSON.stringify(scrapedData, null, 2);

          const tipoData = scrapedData.type === 'product' ? 'producto' : 'video analytics';
          showStatus(`✅ ${tipoData} scrapeado. Enviando a webhook...`, 'info');
          console.log('Datos capturados:', scrapedData);

          // Enviar automáticamente al webhook
          try {
            const webhookUrl = 'https://flows.lemonsushi.com/webhook/ttchop_ttAnalytics';

            const fetchResponse = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(scrapedData)
            });

            if (fetchResponse.ok) {
              showStatus('✅ ¡Datos enviados correctamente a webhook!', 'success');
              console.log('Datos enviados exitosamente al webhook');
              // Limpiar después de enviar
              setTimeout(() => {
                scrapedData = null;
                scrapedDataTextarea.value = '';
                enviarBtn.disabled = true;
                statusDiv.className = 'status';
              }, 2000);
            } else {
              showStatus(`❌ Error: Respuesta ${fetchResponse.status} del servidor`, 'error');
              console.error('Error response:', fetchResponse.status);
            }
          } catch (error) {
            console.error('Error al enviar:', error);
            showStatus(`❌ Error al enviar: ${error.message}`, 'error');
          }
        } else {
          console.error('Response error:', response);
          showStatus('Error al scrapear los datos', 'error');
        }

        scrapearBtn.disabled = false;
        scrapearBtn.textContent = '🔍 Scrapear Datos';
      }
    );
  });
});

// Botón Enviar
enviarBtn.addEventListener('click', async () => {
  if (!webhookInput.value) {
    showStatus('Error: Ingresa la URL del webhook', 'error');
    return;
  }

  if (!scrapedData) {
    showStatus('Error: Primero debes scrapear los datos', 'error');
    return;
  }

  enviarBtn.disabled = true;
  enviarBtn.textContent = '⏳ Enviando...';

  try {
    const response = await fetch(webhookInput.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scrapedData)
    });

    if (response.ok) {
      showStatus('✅ Datos enviados a n8n correctamente', 'success');
      console.log('Datos enviados exitosamente');
    } else {
      showStatus(`Error: Respuesta ${response.status} del servidor`, 'error');
    }
  } catch (error) {
    console.error('Error al enviar:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    enviarBtn.disabled = false;
    enviarBtn.textContent = '📤 Enviar a n8n';
  }
});

// Botón Limpiar
limpiarBtn.addEventListener('click', () => {
  scrapedData = null;
  scrapedDataTextarea.value = '';
  enviarBtn.disabled = true;
  statusDiv.className = 'status';
  showStatus('Datos limpiados', 'info');
});
