// Content script - Se ejecuta en el contexto de la página de TikTok

console.log('[TikTok Scraper] Content script cargado');

// Función para detectar el tipo de página
function detectPageType() {
  const currentUrl = window.location.href;

  if (currentUrl.includes('tiktokstudio/analytics')) {
    return 'video_analytics';
  } else if (currentUrl.includes('shop.tiktok.com')) {
    return 'product';
  } else {
    return 'unknown';
  }
}

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

function scrapeTikTokShopProduct() {
  try {
    console.log('[TikTok Scraper] Iniciando scrapeado dinámico de producto...');

    // --- FUNCIÓN AUXILIAR: Extrae números de un string ---
    function extractNumber(text) {
      const match = text.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : null;
    }

    // --- 1. TÍTULO DEL PRODUCTO ---
    let title = '';
    // Buscar h2 o h1 principal
    const headerElements = document.querySelectorAll('h1, h2');
    for (let el of headerElements) {
      const text = el.textContent.trim();
      if (text && text.length > 5 && text.length < 200) {
        title = text;
        console.log('[TikTok Scraper] Título encontrado:', title);
        break;
      }
    }

    // Fallback: usar document.title
    if (!title) {
      title = document.title.split('|')[0].trim() || 'Unknown Product';
      console.log('[TikTok Scraper] Título (fallback):', title);
    }

    // --- 2. PRECIOS (Dinámico por patrón) ---
    const priceData = { current: null, original: null, discount: null };
    const priceSymbols = /[¥$€£₹]/;
    const allText = document.body.innerText;

    // Buscar todos los elementos con números y símbolos de moneda
    const textElements = document.querySelectorAll('span, div, p');
    const priceElements = [];

    textElements.forEach(el => {
      const text = el.textContent.trim();
      if (priceSymbols.test(text) && /[\d.]+/.test(text)) {
        priceElements.push(text);
      }
    });

    // El primer precio suele ser el actual, el segundo el original
    if (priceElements.length > 0) {
      priceData.current = priceElements[0];
      console.log('[TikTok Scraper] Precio actual:', priceData.current);
    }
    if (priceElements.length > 1) {
      priceData.original = priceElements[1];
      console.log('[TikTok Scraper] Precio original:', priceData.original);
    }

    // Buscar descuento (usualmente en porcentaje)
    const discountMatch = allText.match(/(\d+)%\s*off/i) || allText.match(/save\s+(\d+)%/i);
    if (discountMatch) {
      priceData.discount = discountMatch[1] + '%';
      console.log('[TikTok Scraper] Descuento:', priceData.discount);
    }

    // --- 3. SOCIAL PROOF (Rating, Reviews, Sales) ---
    const socialProof = {
      rating: null,
      reviews_count: null,
      sales_volume: null
    };

    // Buscar rating (patrón: número.número)
    const ratingMatch = allText.match(/(\d+\.\d+)\s*(stars?|rating)?/);
    if (ratingMatch) {
      socialProof.rating = ratingMatch[1];
      console.log('[TikTok Scraper] Rating:', socialProof.rating);
    }

    // Buscar cantidad de reviews
    const reviewsMatch = allText.match(/(\d+(?:,\d+)?)\s*(reviews?|feedbacks?)/i);
    if (reviewsMatch) {
      socialProof.reviews_count = reviewsMatch[1];
      console.log('[TikTok Scraper] Reviews:', socialProof.reviews_count);
    }

    // Buscar volumen de ventas
    const soldMatch = allText.match(/(\d+(?:\.\d+)?[KM]?)\s*sold/i);
    if (soldMatch) {
      socialProof.sales_volume = soldMatch[0];
      console.log('[TikTok Scraper] Volumen de ventas:', socialProof.sales_volume);
    }

    // --- 4. INFORMACIÓN DEL VENDEDOR ---
    const sellerInfo = { name: null };
    const soldByMatch = allText.match(/Sold\s+by\s+([^\n]+)/i) || allText.match(/Seller:\s*([^\n]+)/i);
    if (soldByMatch) {
      sellerInfo.name = soldByMatch[1].trim().split('\n')[0];
      console.log('[TikTok Scraper] Vendedor:', sellerInfo.name);
    }

    // --- 5. VARIANTES DINÁMICAS (Colores, Tamaños, etc) ---
    const variants = {};

    // Detectar bloques de variantes iterativamente
    const variantContainers = document.querySelectorAll('[class*="variant"], [class*="option"], [class*="select"]');

    variantContainers.forEach(container => {
      // Buscar el título de la variante (suele ser un label o texto fuerte)
      const titleEl = container.querySelector('label, strong, [class*="label"], [class*="title"]');
      if (!titleEl) return;

      const variantName = titleEl.textContent.trim();
      if (!variantName) return;

      // Buscar todas las opciones interactivas (botones, spans, etc)
      const options = [];
      const optionElements = container.querySelectorAll('button, [role="button"], [class*="option"], [class*="choice"]');

      optionElements.forEach(optionEl => {
        const optionText = optionEl.textContent.trim();
        if (optionText && !options.includes(optionText)) {
          options.push(optionText);
        }
      });

      if (options.length > 0) {
        variants[variantName] = options;
        console.log(`[TikTok Scraper] Variante ${variantName}:`, options);
      }
    });

    // Fallback: Si no se encontraron variantes, buscar colores y tamaños genéricamente
    if (Object.keys(variants).length === 0) {
      console.log('[TikTok Scraper] Buscando variantes por patrones genéricos...');

      // Buscar colores
      const allButtons = document.querySelectorAll('button, [role="button"]');
      const colorPattern = /^(red|blue|black|white|green|yellow|pink|purple|orange|gray|navy|beige|brown|gold|silver|rose|cream)/i;
      const colors = [];
      const sizes = [];

      allButtons.forEach(btn => {
        const text = btn.textContent.trim();
        if (colorPattern.test(text) && !colors.includes(text)) {
          colors.push(text);
        } else if (/^(XS|S|M|L|XL|XXL|\d+\s*(cm|inch|mm))$/i.test(text) && !sizes.includes(text)) {
          sizes.push(text);
        }
      });

      if (colors.length > 0) variants['Color'] = colors;
      if (sizes.length > 0) variants['Size'] = sizes;
    }

    // --- 6. PUNTOS DE MARKETING (Features/Descripción) ---
    const marketingPoints = [];

    // Buscar sección de descripción o features
    const descContainers = document.querySelectorAll('[class*="description"], [class*="features"], [class*="about"]');

    descContainers.forEach(container => {
      const listItems = container.querySelectorAll('li, [class*="point"], [class*="feature"]');
      listItems.forEach(item => {
        const text = item.textContent.trim();
        // Limpiar viñetas y caracteres especiales
        const cleanText = text.replace(/^[\s・*\-•]+/, '').trim();
        if (cleanText && !marketingPoints.includes(cleanText)) {
          marketingPoints.push(cleanText);
        }
      });
    });

    console.log('[TikTok Scraper] Puntos de marketing encontrados:', marketingPoints.length);

    // --- 7. IMÁGENES DINÁMICAS ---
    const mediaUrls = [];

    // Buscar imágenes cuyo alt contenga el título del producto
    const productImages = document.querySelectorAll('img');
    productImages.forEach(img => {
      const src = img.src || img.getAttribute('data-src');
      const alt = img.getAttribute('alt') || '';

      if (src && (alt.toLowerCase().includes(title.toLowerCase().split(' ')[0]) || src.includes('tos-') || src.includes('pdp'))) {
        // Filtrar avatares pequeños (suelen ser muy pequeños)
        if (img.width > 50 && img.height > 50) {
          if (!mediaUrls.includes(src)) {
            mediaUrls.push(src);
          }
        }
      }
    });

    // Fallback: Si no hay imágenes específicas, tomar las primeras N imágenes grandes
    if (mediaUrls.length === 0) {
      productImages.forEach(img => {
        const src = img.src || img.getAttribute('data-src');
        if (src && img.width > 100 && img.height > 100 && !mediaUrls.includes(src)) {
          mediaUrls.push(src);
        }
      });
    }

    console.log('[TikTok Scraper] Imágenes encontradas:', mediaUrls.length);

    // --- ESTRUCTURA FINAL ---
    const data = {
      title: title,
      timestamp: new Date().toISOString(),
      type: 'product',
      price: priceData,
      social_proof: socialProof,
      seller_info: sellerInfo,
      variants: variants,
      marketing_points: marketingPoints,
      media: mediaUrls,
      source_url: window.location.href
    };

    console.log('[TikTok Scraper] Datos del producto completamente scrapeados:', data);
    return data;

  } catch (error) {
    console.error('[TikTok Scraper] Error scrapeando producto:', error);
    return {
      error: true,
      message: error.message,
      timestamp: new Date().toISOString(),
      source_url: window.location.href
    };
  }
}

// Escuchar mensajes desde el popup o background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TikTok Scraper] Mensaje recibido:', request);

  if (request.action === 'scrapeTikTokAnalytics') {
    // Detectar automáticamente el tipo de página
    const pageType = detectPageType();
    console.log('[TikTok Scraper] Tipo de página detectado:', pageType);

    let data;

    if (pageType === 'video_analytics') {
      console.log('[TikTok Scraper] Scrapeando analytics de video...');
      data = scrapeTikTokAnalytics();
    } else if (pageType === 'product') {
      console.log('[TikTok Scraper] Scrapeando producto de TikTok Shop...');
      data = scrapeTikTokShopProduct();
    } else {
      console.error('[TikTok Scraper] Tipo de página no soportado:', window.location.href);
      data = {
        error: true,
        message: 'Página no soportada. Debe estar en TikTok Analytics o TikTok Shop.',
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
      };
    }

    console.log('[TikTok Scraper] Enviando respuesta:', data);

    // Mostrar notificación
    if (window.showToastNotification) {
      if (data.error) {
        window.showToastNotification('❌ Error al scrapear', 'error');
      } else {
        window.showToastNotification('✅ Datos scrapeados correctamente', 'success');
      }
    }

    sendResponse({ success: !data.error, data: data });
  }
});

console.log('[TikTok Scraper] Listeners configurados');
