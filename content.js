// Content script - Se ejecuta en el contexto de la página de TikTok

// --- VERSIÓN DEL SCRAPER (definida una sola vez) ---
const SCRAPER_VERSION = '2.0.1';

console.log('[TikTok Scraper] Content script cargado - Versión:', SCRAPER_VERSION);

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
      scraper_version: SCRAPER_VERSION,
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

// --- FUNCIÓN AUXILIAR: Extrae descripción refinada con búsqueda de ancestros ---
function getUniversalDescription() {
  try {
    console.log('[TikTok Scraper] Iniciando extracción refinada de descripción...');

    const points = [];

    // 1. BUSCAR TODOS LOS ELEMENTOS DE LA PÁGINA
    const elements = Array.from(document.querySelectorAll('*'));

    // 2. ENCONTRAR EL NODO QUE CONTIENE EL ENCABEZADO
    const descHeader = elements.find(el => {
      if (!el.innerText) return false; // Proteger contra innerText undefined
      const text = el.innerText.trim();
      return text === 'About this product' ||
             text === 'Product description' ||
             text === '商品説明' ||
             text === 'About this product';
    });

    if (descHeader) {
      console.log('[TikTok Scraper] Encabezado de descripción encontrado:', descHeader.innerText.trim());

      // 3. SUBIR DOS NIVELES EN EL DOM PARA ASEGURAR CONTENEDOR RAÍZ
      // TikTok mete el encabezado y contenido dentro de un contenedor padre común
      let sectionContainer = descHeader.parentElement;
      if (sectionContainer) {
        sectionContainer = sectionContainer.parentElement;
      }

      if (sectionContainer) {
        console.log('[TikTok Scraper] Contenedor de sección encontrado');

        // 4. EXTRAER TODO EL TEXTO PLANO ACUMULADO EN ESA SECCIÓN
        const rawText = sectionContainer.innerText || '';
        console.log('[TikTok Scraper] Longitud del texto extraído:', rawText.length, 'caracteres');

        const lines = rawText.split('\n');
        console.log('[TikTok Scraper] Total de líneas encontradas:', lines.length);

        lines.forEach((line, index) => {
          const cleaned = line.trim()
            // Limpia viñetas de punto medio (·), asteriscos, guiones, emojis y espacios
            .replace(/^[・\*\-\•\·\s📌✅🔹▪️【】\[\]]+/, '')
            .trim();

          // FILTROS DE EXCLUSIÓN ESTRICTOS
          const isValid = cleaned &&
                         cleaned !== 'About this product' &&
                         cleaned !== 'Product description' &&
                         cleaned !== '商品説明' &&
                         !cleaned.toLowerCase().includes('view more') && // Ignora botón expansor
                         cleaned.length > 8 && // Evita fragmentos o títulos sueltos
                         !cleaned.toLowerCase().includes('もっと見る'); // "Ver más" en japonés

          if (isValid) {
            points.push(cleaned);
            console.log(`[TikTok Scraper] Punto ${index}:`, cleaned.substring(0, 60) + (cleaned.length > 60 ? '...' : ''));
          }
        });
      }
    }

    // ELIMINAR DUPLICADOS
    const uniquePoints = [...new Set(points)];
    console.log('[TikTok Scraper] Puntos de descripción extraídos (únicos):', uniquePoints.length);
    return uniquePoints;

  } catch (error) {
    console.error('[TikTok Scraper] Error extrayendo descripción:', error);
    return [];
  }
}

// --- FUNCIÓN AUXILIAR: Extrae precios totalmente limpios (con o sin descuento) ---
function getUniversalPrice() {
  try {
    console.log('[TikTok Scraper] Iniciando extracción universal de precios...');

    const priceData = { current: null, original: null, discount: null };
    const allElements = Array.from(document.querySelectorAll('*'));

    // 1. BUSCAR PRECIO ACTUAL (Número antes de 円 o elemento con solo números)
    const priceContainer = allElements.find(el => {
      if (!el.innerText) return false; // Proteger contra innerText undefined
      const text = el.innerText.trim();
      // Patrón: número con comas (1,234) O elemento que contiene 円 en su padre
      const hasNumberFormat = /^\d{1,3}(,\d{3})+$/.test(text);
      const isPlainNumber = el.children.length === 0 && /^\d+$/.test(text.replace(/,/g, ''));
      const parentHasYen = el.parentElement && el.parentElement.innerText && el.parentElement.innerText.includes('円');

      return (hasNumberFormat && el.children.length === 0) ||
             (isPlainNumber && parentHasYen);
    });

    if (priceContainer) {
      priceData.current = priceContainer.innerText.trim().replace(/[,\s*]/g, '');
      console.log('[TikTok Scraper] Precio actual encontrado:', priceData.current);
    } else {
      // FALLBACK: Buscar "[Número] 円" en todo el texto de la página
      console.log('[TikTok Scraper] Usando fallback de búsqueda de patrón 円...');
      const bodyText = document.body.innerText;
      const match = bodyText.match(/([0-9,]+)\s*円/);
      if (match) {
        priceData.current = match[1].replace(/,/g, '');
        console.log('[TikTok Scraper] Precio actual (fallback):', priceData.current);
      }
    }

    // 2. EXTRACCIÓN DE DESCUENTO (Solo si contiene explícitamente '-' y '%')
    // Restringimos a elementos de texto plano pequeños (<= 5 caracteres)
    const discountEl = allElements.find(el => {
      if (!el.innerText || el.children.length > 0) return false;
      const text = el.innerText.trim();
      return /^-\d+%$/.test(text) && text.length <= 5;
    });

    if (discountEl) {
      priceData.discount = discountEl.innerText.trim();
      console.log('[TikTok Scraper] Descuento encontrado:', priceData.discount);
    }

    // 3. EXTRACCIÓN DEL PRECIO ORIGINAL (SOLO si existe descuento real y tiene line-through)
    // Condicional de dependencia: solo buscar si ya encontramos un descuento
    if (priceData.discount) {
      console.log('[TikTok Scraper] Buscando precio original (descuento confirmado)...');
      const struckPrice = allElements.find(el => {
        if (!el.innerText) return false;
        return el.children.length === 0 &&
               window.getComputedStyle(el).textDecoration.includes('line-through') &&
               /[\d,]+/.test(el.innerText);
      });

      if (struckPrice && struckPrice.innerText) {
        priceData.original = struckPrice.innerText.replace(/[^\d]/g, '');
        console.log('[TikTok Scraper] Precio original encontrado:', priceData.original);
      }
    } else {
      console.log('[TikTok Scraper] Sin descuento detectado, omitiendo búsqueda de precio original');
    }

    console.log('[TikTok Scraper] Datos de precio extraídos:', priceData);
    return priceData;

  } catch (error) {
    console.error('[TikTok Scraper] Error extrayendo precios:', error);
    return { current: null, original: null, discount: null };
  }
}

// --- FUNCIÓN AUXILIAR: Extrae social proof sin falsos positivos ---
function getSocialProofClean() {
  try {
    console.log('[TikTok Scraper] Iniciando extracción de social proof...');

    const social = { rating: null, reviews_count: null, sales_volume: null };
    const bodyText = document.body.innerText;

    // 1. BUSCAR VOLUMEN DE VENTAS (Patrón: "1.2K sold" o "500 sold")
    const salesMatch = bodyText.match(/([\d\.]+K?\s*sold)/i);
    if (salesMatch) {
      social.sales_volume = salesMatch[1];
      console.log('[TikTok Scraper] Volumen de ventas:', social.sales_volume);
    }

    // 2. BUSCAR RECUENTO DE RESEÑAS (Patrón: "74 global reviews" o "( 74 )")
    const reviewsMatch = bodyText.match(/(\d+)\s*(global reviews|reviews|\))/i);
    if (reviewsMatch) {
      social.reviews_count = reviewsMatch[1];
      console.log('[TikTok Scraper] Cantidad de reseñas:', social.reviews_count);
    }

    // 3. BUSCAR RATING REAL (Número decimal 1.0-5.0 cercano a reseñas, evitando porcentajes)
    // Patrón: Un decimal entre 1.0 y 5.0 cerca de ★, *, "global reviews" o paréntesis
    const ratingMatch = bodyText.match(/([1-5]\.[0-9])\s*(★|\*|global reviews|\()/);
    if (ratingMatch) {
      social.rating = ratingMatch[1];
      console.log('[TikTok Scraper] Rating encontrado (patrón regex):', social.rating);
    } else {
      // FALLBACK: Buscar elemento con decimal entre 1.0 y 5.0
      console.log('[TikTok Scraper] Usando fallback de búsqueda de rating...');
      const allElements = Array.from(document.querySelectorAll('*'));
      const ratingEl = allElements.find(el =>
        el.children.length === 0 && /^[1-5]\.[0-9]$/.test(el.innerText.trim())
      );
      if (ratingEl) {
        social.rating = ratingEl.innerText.trim();
        console.log('[TikTok Scraper] Rating encontrado (elemento):', social.rating);
      }
    }

    console.log('[TikTok Scraper] Social proof extraído:', social);
    return social;

  } catch (error) {
    console.error('[TikTok Scraper] Error extrayendo social proof:', error);
    return { rating: null, reviews_count: null, sales_volume: null };
  }
}

// --- FUNCIÓN AUXILIAR: Extrae imágenes del producto con 3 filtros secuenciales ---
function getProductImages(productTitle) {
  try {
    console.log('[TikTok Scraper] Iniciando extracción dinámica de imágenes...');

    // 1. FILTRO POR ALT TEXT (Coincidencia con el Título)
    const titleFragment = productTitle.substring(0, 12).toLowerCase().trim();
    console.log('[TikTok Scraper] Fragmento de título para búsqueda:', titleFragment);

    const allImages = Array.from(document.querySelectorAll('img'));
    console.log('[TikTok Scraper] Total de imágenes en la página:', allImages.length);

    // Imágenes que coinciden por ALT text
    const imagesByAlt = allImages
      .filter(img => img.alt && img.alt.toLowerCase().includes(titleFragment))
      .map(img => img.src || img.getAttribute('data-src'))
      .filter(src => src && src.length > 0);

    console.log('[TikTok Scraper] Imágenes con ALT coincidente:', imagesByAlt.length);

    // Si encontramos imágenes por ALT, usarlas
    if (imagesByAlt.length > 0) {
      console.log('[TikTok Scraper] Usando imágenes filtradas por ALT');
      return [...new Set(imagesByAlt)]; // Retorna array único
    }

    // 2. FILTRO POR CDN DE TIKTOK (Si ALT no funciona)
    const imagesByCDN = allImages
      .map(img => img.src || img.getAttribute('data-src'))
      .filter(src => {
        if (!src) return false;

        // Verificar que sea un CDN válido de TikTok
        const isTikTokCDN = src.includes('tiktokcdn') ||
                           src.includes('tos-') ||
                           src.includes('/obj/') ||
                           src.includes('p-') ||
                           src.includes('amazonaws');

        // Excluir iconos, avatares y SVGs
        const isNotIcon = !src.toLowerCase().includes('avatar') &&
                         !src.toLowerCase().includes('icon') &&
                         !src.endsWith('.svg');

        // Verificar formato de imagen válido
        const isValidFormat = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(src);

        return isTikTokCDN && isNotIcon && isValidFormat;
      });

    console.log('[TikTok Scraper] Imágenes de CDN válidas encontradas:', imagesByCDN.length);

    if (imagesByCDN.length > 0) {
      console.log('[TikTok Scraper] Usando imágenes filtradas por CDN');
      return [...new Set(imagesByCDN)]; // Retorna array único
    }

    // 3. FALLBACK: Imágenes grandes (>100x100)
    const largeImages = allImages
      .filter(img => (img.width || 0) > 100 && (img.height || 0) > 100)
      .map(img => img.src || img.getAttribute('data-src'))
      .filter(src => src && src.length > 0);

    console.log('[TikTok Scraper] Imágenes grandes encontradas:', largeImages.length);

    return [...new Set(largeImages)]; // Retorna array único

  } catch (error) {
    console.error('[TikTok Scraper] Error extrayendo imágenes:', error);
    return [];
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

    // --- DEFINIR ALLTEXT (Texto plano de toda la página) ---
    const allText = document.body.innerText || '';
    console.log('[TikTok Scraper] Longitud de texto plano:', allText.length);

    // --- 2. PRECIOS (Extracción universal limpia - con o sin descuento) ---
    const priceData = getUniversalPrice();

    // --- 3. SOCIAL PROOF (Rating, Reviews, Sales - Extracción limpia) ---
    const socialProof = getSocialProofClean();

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

    // --- 6. DESCRIPCIÓN DEL PRODUCTO (Extracción universal agnóstica) ---
    const marketingPoints = getUniversalDescription();

    // --- 7. IMÁGENES DINÁMICAS (Extracción robusta) ---
    const mediaUrls = getProductImages(title);
    console.log('[TikTok Scraper] Imágenes encontradas:', mediaUrls.length);

    // --- ESTRUCTURA FINAL ---
    const data = {
      scraper_version: SCRAPER_VERSION,
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
