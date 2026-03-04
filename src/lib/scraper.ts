import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedDeal {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  image_url: string;
  url: string;
  source: 'mercadolibre' | 'amazon';
  description: string;
}

export async function searchMercadoLibre(query: string): Promise<ScrapedDeal[]> {
  try {
    // API oficial de búsqueda de Mercado Libre México
    const response = await axios.get(`https://api.mercadolibre.com/sites/MLM/search`, {
      params: {
        q: query,
        limit: 20,
        sort: 'price_asc' // Opcional, pero útil para ofertas
      }
    });

    const items = response.data.results;

    return items.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || null,
      image_url: item.thumbnail.replace('I.jpg', 'O.jpg'), // Intentar obtener mejor resolución
      url: item.permalink,
      source: 'mercadolibre',
      description: `Oferta encontrada en Mercado Libre. Condición: ${item.condition === 'new' ? 'Nuevo' : 'Usado'}. Envío gratis: ${item.shipping?.free_shipping ? 'Sí' : 'No'}.`
    }));

  } catch (error) {
    console.error('Error searching Mercado Libre:', error);
    return [];
  }
}

export async function searchAmazon(query: string): Promise<ScrapedDeal[]> {
  try {
    const url = `https://www.amazon.com.mx/s?k=${encodeURIComponent(query)}`;
    
    // User-Agent rotativo simple para evitar bloqueos inmediatos
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const response = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent,
        'Accept-Language': 'es-MX,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      },
      timeout: 5000 // Timeout corto para no colgar el proceso
    });

    const $ = cheerio.load(response.data);
    const deals: ScrapedDeal[] = [];

    // Selectores actualizados (Amazon cambia frecuentemente)
    $('.s-result-item[data-component-type="s-search-result"]').each((_, el) => {
      try {
        const titleElement = $(el).find('h2 a span');
        const title = titleElement.text().trim();
        
        // Enlace
        const linkElement = $(el).find('h2 a');
        let urlSuffix = linkElement.attr('href');
        
        // Imagen
        const image_url = $(el).find('img.s-image').attr('src');
        
        // Precio Actual
        const priceWhole = $(el).find('.a-price-whole').first().text().replace(/,/g, '').replace(/\./g, '');
        const priceFraction = $(el).find('.a-price-fraction').first().text();
        
        // Precio Original (Tachado)
        const originalPriceElement = $(el).find('.a-text-price .a-offscreen').first();
        let originalPriceText = originalPriceElement.text().replace('$', '').replace(/,/g, '');
        
        if (!originalPriceText) {
             // Fallback para precio original
             const textPrice = $(el).find('.a-text-price span').first().text().replace('$', '').replace(/,/g, '');
             if (textPrice) originalPriceText = textPrice;
        }

        if (title && priceWhole && urlSuffix && image_url) {
          const price = parseFloat(`${priceWhole}.${priceFraction || '00'}`);
          const original_price = originalPriceText ? parseFloat(originalPriceText) : null;
          const asin = $(el).attr('data-asin') || Math.random().toString(36).substring(7);

          // Filtrar productos sin precio o irrelevantes
          if (isNaN(price)) return;

          deals.push({
            id: asin,
            title,
            price,
            original_price: original_price && original_price > price ? original_price : null,
            image_url,
            url: urlSuffix.startsWith('http') ? urlSuffix : `https://www.amazon.com.mx${urlSuffix}`,
            source: 'amazon',
            description: 'Oferta encontrada en Amazon México. Ver detalles en la página oficial.'
          });
        }
      } catch (e) {
        // Skip individual item errors
      }
    });

    return deals.slice(0, 20);

  } catch (error) {
    console.error('Error scraping Amazon (likely blocked or changed layout):', error);
    // Retornar array vacío en lugar de romper la app
    return []; 
  }
}
