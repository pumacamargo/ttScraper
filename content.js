// Content script - Se ejecuta en el contexto de la página de TikTok

console.log('[TikTok Scraper] Content script cargado');

function scrapeTikTokAnalytics() {
  try {
    console.log('[TikTok Scraper] Iniciando scrapeado...');

    // Extraer VIDEO_ID de la URL
    const urlMatch = window.location.href.match(/\/analytics\/(\d+)/);
    const videoId = urlMatch ? urlMatch[1] : '';

    // Extraer username del JSON de contexto
    let username = '';
    const contextScriptTag = document.getElementById('__Creator_Center_Context__');
    if (contextScriptTag) {
      try {
        let contextText = contextScriptTag.textContent;
        // Decodificar entidades HTML si es necesario
        contextText = contextText.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const contextData = JSON.parse(contextText);
        username = contextData.commonAppContext?.user?.uniqueId || '';
        console.log('[TikTok Scraper] Username extraído:', username);
      } catch (e) {
        console.error('[TikTok Scraper] Error al parsear contexto:', e);
        console.log('[TikTok Scraper] Intentando búsqueda alternativa de username...');

        // Búsqueda alternativa en el HTML
        const uniqueIdMatch = document.body.textContent.match(/"uniqueId":"([^"]+)"/);
        if (uniqueIdMatch) {
          username = uniqueIdMatch[1];
          console.log('[TikTok Scraper] Username encontrado (alternativo):', username);
        }
      }
    }

    // Construir URL pública del video
    const publicUrl = username && videoId ? `https://www.tiktok.com/@${username}/video/${videoId}` : '';

    const data = {
      timestamp: new Date().toISOString(),
      videoId: videoId,
      username: username,
      publicUrl: publicUrl,
      videoViews: '',
      estimatedEarnings: '',
      totalPlayTime: '',
      averageWatchTime: '',
      watchedFullVideo: 0,
      newFollowers: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saved: 0,
      retentionInfo: '',
      postedOn: '',
      updatedOn: '',
      pageUrl: window.location.href
    };

    // Función para extraer números
    const extractNumber = (text) => {
      if (!text) return 0;
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    // Estrategia 1: Buscar elementos por clase específica
    const absoluteValues = document.querySelectorAll('.absolute-value');
    console.log('[TikTok Scraper] Elementos .absolute-value encontrados:', absoluteValues.length);

    absoluteValues.forEach((el, index) => {
      const text = el.textContent.trim();
      console.log(`[TikTok Scraper] absolute-value[${index}]:`, text);

      // Capturar Video views (con K, M, etc)
      if (text.match(/\d+[KMB]$/i)) {
        data.videoViews = text; // "69K"
        console.log('[TikTok Scraper] Video views encontradas:', data.videoViews);
      }

      // Capturar estimated earnings ($)
      if (text.match(/^\$/)) {
        data.estimatedEarnings = text; // "$0.5"
        console.log('[TikTok Scraper] Estimated earnings encontrados:', data.estimatedEarnings);
      }
    });

    // Estrategia 2: Buscar en todo el contenido de texto como fallback
    const bodyText = document.body.innerText;
    console.log('[TikTok Scraper] Body text length:', bodyText.length);

    // Si no encontramos con los elementos, buscar en el texto
    if (!data.videoViews) {
      const viewsMatch = bodyText.match(/Video views[\s\n]+([\d.]+[KMB]?)/i);
      if (viewsMatch) {
        data.videoViews = viewsMatch[1];
        console.log('[TikTok Scraper] Video views encontradas (fallback):', data.videoViews);
      }
    }

    const playTimeMatch = bodyText.match(/Total play time[\s\n]+([\d]+h:[\d]+m:[\d]+s)/i);
    if (playTimeMatch) {
      data.totalPlayTime = playTimeMatch[1];
      console.log('[TikTok Scraper] Total play time encontrado:', data.totalPlayTime);
    }

    const watchTimeMatch = bodyText.match(/Average watch time[\s\n]+([\d.]+\s*s)/i);
    if (watchTimeMatch) {
      data.averageWatchTime = watchTimeMatch[1];
      console.log('[TikTok Scraper] Average watch time encontrado:', data.averageWatchTime);
    }

    const fullVideoMatch = bodyText.match(/Watched full video[\s\n]+([\d.]+)%/i);
    if (fullVideoMatch) {
      data.watchedFullVideo = parseFloat(fullVideoMatch[1]);
      console.log('[TikTok Scraper] Watched full video encontrado:', data.watchedFullVideo);
    }

    const followersMatch = bodyText.match(/New followers[\s\n]+(\d+)/i);
    if (followersMatch) {
      data.newFollowers = parseInt(followersMatch[1]);
      console.log('[TikTok Scraper] New followers encontrados:', data.newFollowers);
    }

    // Buscar likes, comments, shares, saved usando los elementos TUXText
    const tuxTexts = document.querySelectorAll('span.TUXText--weight-medium');
    console.log('[TikTok Scraper] TUXText elements encontrados:', tuxTexts.length);

    // Los elementos vienen en orden: likes, comments, shares, saved
    const values = [];
    tuxTexts.forEach((el, index) => {
      const text = el.textContent.trim();
      if (/^\d+$/.test(text)) {
        values.push(parseInt(text));
        console.log(`[TikTok Scraper] Valor ${index}:`, text);
      }
    });

    // Asignar los valores en orden
    if (values.length >= 4) {
      data.likes = values[0];
      data.comments = values[1];
      data.shares = values[2];
      data.saved = values[3];
      console.log('[TikTok Scraper] Likes, comments, shares, saved encontrados:', data.likes, data.comments, data.shares, data.saved);
    }

    // Buscar información de retención
    const retentionElements = document.querySelectorAll('span[data-tt="VideoOverviewPage_RetentionCard_TUXText"]');
    if (retentionElements.length > 0) {
      data.retentionInfo = retentionElements[0].textContent.trim();
      console.log('[TikTok Scraper] Retention info encontrada:', data.retentionInfo);
    }

    // Buscar fecha de publicación
    const postedElements = document.querySelectorAll('span[data-tt="VideoOverviewPage_VideoInfoCard_TUXText_12"]');
    if (postedElements.length > 0) {
      data.postedOn = postedElements[0].textContent.trim();
      console.log('[TikTok Scraper] Posted on encontrado:', data.postedOn);
    }

    // Buscar fecha de actualización
    const updatedElements = document.querySelectorAll('span[data-tt="components_VideoUpdatedTime_TUXText"]');
    if (updatedElements.length > 0) {
      data.updatedOn = updatedElements[0].textContent.trim();
      console.log('[TikTok Scraper] Updated on encontrado:', data.updatedOn);
    }

    console.log('[TikTok Scraper] Datos completamente scrapeados:', data);
    return data;

  } catch (error) {
    console.error('[TikTok Scraper] Error:', error);
    return {
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Escuchar mensajes desde el popup o background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TikTok Scraper] Mensaje recibido:', request);

  if (request.action === 'scrapeTikTokAnalytics') {
    const data = scrapeTikTokAnalytics();
    console.log('[TikTok Scraper] Enviando respuesta:', data);

    // Mostrar notificación
    if (window.showToastNotification) {
      window.showToastNotification('✅ Datos scrapeados y enviados correctamente', 'success');
    }

    sendResponse({ success: true, data: data });
  }
});

console.log('[TikTok Scraper] Listeners configurados');
