import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedDeal {
  id: string; // This is the external ID (ASIN or ML ID)
  title: string;
  price: number;
  original_price: number | null;
  image_url: string;
  image_urls: string[]; // Added array for multiple images
  url: string;
  source: 'mercadolibre' | 'amazon';
  description: string;
  currency: string;
  availability: 'online' | 'out_of_stock';
  expires_at?: string; // Add expiration date
  suggested_category?: string; // Add suggested category from breadcrumbs
  raw_data?: any;
  shipping_info?: {
    // Amazon
    has_prime?: boolean;
    free_shipping_label?: boolean; // "Envío GRATIS"
    // Mercado Libre
    has_meli_plus?: boolean;
    is_full?: boolean;
    // Common
    shipping_cost?: number;
    shipping_text?: string;
  };
  payment_info?: {
      has_msi?: boolean; // Meses sin intereses
  };
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Helper to extract ASIN from Amazon URL
function extractASIN(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/) || url.match(/\/gp\/product\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

// Helper to extract ML ID from URL
function extractMLID(url: string): string | null {
  const match = url.match(/(MLM-?\d+)/);
  return match ? match[1].replace('-', '') : null;
}

// Helper to extract Amazon Image ID for deduplication
function extractAmazonImageId(url: string): string | null {
  // Matches IDs like: 71sKzRj+LJL, 61+7J8x9wLL
  const match = url.match(/\/images\/I\/([^.]+)\./);
  return match ? match[1] : null;
}

// Helper to normalize Amazon image URL to high-res
function normalizeAmazonImageUrl(url: string): string {
  // Amazon images often have size modifiers like ._AC_SX679_.jpg
  // We want to remove them to get the original high-res image
  return url.replace(/\._AC_.*?\./, '.').replace(/\._SY_.*?\./, '.').replace(/\._SX_.*?\./, '.');
}

export async function scrapeAmazonUrl(url: string): Promise<ScrapedDeal | null> {
  const asin = extractASIN(url);
  if (!asin) return null; // Invalid Amazon URL

  try {
    const userAgent = getRandomUserAgent();
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'es-MX,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    const title = $('#productTitle').text().trim();
    
    // Price extraction logic
    let priceWhole = $('.a-price.a-text-price.a-size-medium .a-offscreen').first().text().replace('$', '').replace(/,/g, '');
    if (!priceWhole) {
        priceWhole = $('.a-price .a-offscreen').first().text().replace('$', '').replace(/,/g, '');
    }
    // Fallback for some layouts
    if (!priceWhole) {
        priceWhole = $('#corePriceDisplay_desktop_feature_div .a-price-whole').first().text().replace(/,/g, '').replace(/\./g, '');
        const priceFraction = $('#corePriceDisplay_desktop_feature_div .a-price-fraction').first().text();
        if (priceWhole && priceFraction) priceWhole = `${priceWhole}.${priceFraction}`;
    }

    const price = parseFloat(priceWhole);

    // Original Price
    let originalPriceText = $('.a-price.a-text-price[data-a-strike="true"] .a-offscreen').first().text().replace('$', '').replace(/,/g, '');
    const original_price = originalPriceText ? parseFloat(originalPriceText) : null;

    // Extract multiple images
    const image_urls: string[] = [];
    const seenImageIds = new Set<string>();

    const addImage = (url: string) => {
        if (!url) return;
        
        let id = extractAmazonImageId(url);
        let finalUrl = url;
        let uniqueId = url;

        if (id) {
            // Reconstruct high-res URL
            finalUrl = `https://m.media-amazon.com/images/I/${id}.jpg`;
            uniqueId = id;
        } else {
             // Fallback normalization
             finalUrl = normalizeAmazonImageUrl(url);
             // Try to extract ID again after normalization
             id = extractAmazonImageId(finalUrl);
             if (id) {
                 finalUrl = `https://m.media-amazon.com/images/I/${id}.jpg`;
                 uniqueId = id;
             } else {
                 uniqueId = finalUrl;
             }
        }
        
        // Remove size modifiers just in case, for non-standard URLs
        uniqueId = uniqueId.replace(/\._AC_.*?\./, '.').replace(/\._SY_.*?\./, '.').replace(/\._SX_.*?\./, '.');

        if (!seenImageIds.has(uniqueId)) {
            image_urls.push(finalUrl);
            seenImageIds.add(uniqueId);
        }
    };

    // Try to find more images in the script tags or gallery
    try {
        // Strategy 1: Look for 'colorImages' or 'ImageBlockATF' in script tags
        $('script').each((_, el) => {
            const content = $(el).html();
            if (content) {
                // Pattern 1: 'colorImages': { ... }
                if (content.includes('colorImages')) {
                    const match = content.match(/'colorImages':\s*({[\s\S]*?}),\s*'/) || content.match(/"colorImages":\s*({[\s\S]*?}),/);
                    if (match) {
                        try {
                            const data = JSON.parse(match[1]);
                            if (data && data.initial) {
                                data.initial.forEach((img: any) => {
                                    if (img.hiRes) addImage(img.hiRes);
                                    else if (img.large) addImage(img.large);
                                });
                            }
                            // Strategy 3: Look for imageBlock_feature_div (often contains JSON in data-a-dynamic-image)
        const imageBlockDynamic = $('#imageBlock_feature_div').find('img').attr('data-a-dynamic-image');
        if (imageBlockDynamic) {
             try {
                const dynamicImages = JSON.parse(imageBlockDynamic);
                Object.keys(dynamicImages).forEach(url => {
                    addImage(url);
                });
            } catch (e) {
                // ignore
            }
        }

        // Strategy 4: Look for data-csa-c-image-id or similar in alt images
        $('.a-button-text img').each((_, el) => {
             const src = $(el).attr('src');
             if (src) addImage(src);
        });

    } catch (e) {
                            // ignore parse error
                        }
                    }
                }
                
                // Pattern 2: ImageBlockATF
                if (content.includes('ImageBlockATF')) {
                    const match = content.match(/P\.when\('A'\)\.register\("ImageBlockATF",\s*function\(A\)\{\s*var\s+data\s*=\s*({[\s\S]*?});/);
                    if (match) {
                        try {
                             const data = JSON.parse(match[1]);
                             if (data && data.colorImages && data.colorImages.initial) {
                                data.colorImages.initial.forEach((img: any) => {
                                    if (img.hiRes) addImage(img.hiRes);
                                    else if (img.large) addImage(img.large);
                                });
                             }
                        } catch (e) {
                            // ignore
                        }
                    }
                }

                // Pattern 3: jQuery.parseJSON pattern often used for galleries
                if (content.includes('jQuery.parseJSON') && content.includes('colorImages')) {
                     const match = content.match(/jQuery\.parseJSON\('({.*colorImages.*})'\)/);
                     if (match) {
                         try {
                             const data = JSON.parse(match[1].replace(/\\'/g, "'"));
                             if (data && data.colorImages && data.colorImages.initial) {
                                data.colorImages.initial.forEach((img: any) => {
                                    if (img.hiRes) addImage(img.hiRes);
                                    else if (img.large) addImage(img.large);
                                });
                             }
                         } catch (e) {
                             // ignore
                         }
                     }
                }
            }
        });

        // Strategy 2: Look for data-a-dynamic-image on the main image
        const dynamicImageAttr = $('#landingImage, #imgBlkFront').attr('data-a-dynamic-image');
        if (dynamicImageAttr) {
            try {
                const dynamicImages = JSON.parse(dynamicImageAttr);
                // keys are URLs
                Object.keys(dynamicImages).forEach(url => {
                    addImage(url);
                });
            } catch (e) {
                // ignore
            }
        }

    } catch (e) {
        console.warn('Error extracting extra Amazon images', e);
    }
    
    // Add main image if not already present (deduplication handled by addImage)
    const mainImage = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
    if (mainImage) addImage(mainImage);

    const image_url = image_urls[0] || '';

    // Description
    const description = $('#feature-bullets ul li span').map((_, el) => $(el).text().trim()).get().join('\n');
    
    // Category Breadcrumbs
    let suggested_category = '';
    try {
        const breadcrumbs: string[] = [];
        $('#wayfinding-breadcrumbs_feature_div ul li, .a-breadcrumb ul li').each((_, el) => {
            const text = $(el).find('a').text().trim();
            if (text) breadcrumbs.push(text);
        });
        if (breadcrumbs.length > 0) {
            suggested_category = breadcrumbs.join(' > ');
        }
    } catch (e) {
        // ignore
    }

    // Availability
    const availabilityText = $('#availability').text().trim().toLowerCase();
    const availability = availabilityText.includes('no disponible') || availabilityText.includes('currently unavailable') ? 'out_of_stock' : 'online';

    // Shipping Logic for Amazon URL Scrape
    const has_prime = $('#prime-header, .icon-prime, #primeSavingsUpsellPopover, #prime-detail-popover-trigger, .a-icon-prime').length > 0;
    
    const deliveryBlock = $('#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE, #mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_SMALL, #price-shipping-message, #deliveryBlockMessage');
    const shipping_text = deliveryBlock.text().trim().replace(/\s+/g, ' ');
    const free_shipping_label = shipping_text.toLowerCase().includes('envío gratis') || shipping_text.toLowerCase().includes('envío gratis en tu primer pedido');
    
    let shipping_cost: number | undefined = undefined;
    const shippingCostMatch = shipping_text.match(/\$(\d+(?:[.,]\d{2})?)\s+de\s+envío/i);
    if (shippingCostMatch) {
        shipping_cost = parseFloat(shippingCostMatch[1].replace(',', ''));
    }

    // Months Without Interest (MSI)
    // Amazon
    const msiBlock = $('#installmentCalculator_feature_div, #payment-plan-badge-container, #sopp-installment-breakdown-link');
    const msiText = msiBlock.text().trim();
    const has_msi = msiText.toLowerCase().includes('meses sin intereses') || msiText.toLowerCase().includes('msi');
    
    // Expiration Timer (Lightning Deals)
    let expires_at = undefined;
    const scriptContent = $('script[type="text/javascript"]').text();
    // Look for dealExpiration in timestamps
    const expiryMatch = scriptContent.match(/"dealExpiration":(\d+)/) || scriptContent.match(/dealExpiration\s*:\s*(\d+)/);
    if (expiryMatch) {
        const expiry = parseInt(expiryMatch[1]);
        if (expiry > Date.now()) { // Ensure it's in the future
            expires_at = new Date(expiry).toISOString();
        }
    } else {
        // Try to find "Termina en" text
        const dealBadge = $('#dealBadge_feature_div, #lightning-deal-timer').text().trim();
        // Regex for "Termina en 10h 30m" or similar
        // This is tricky as it's relative time. We can estimate.
        // But for now, if we don't have absolute timestamp, we skip to avoid "lying".
    }

    if (!title || isNaN(price)) {
        console.warn('Incomplete data for Amazon URL:', url);
        return null;
    }

    return {
      id: asin,
      title,
      price,
      original_price: original_price && original_price > price ? original_price : null,
      image_url,
      image_urls,
      url: `https://www.amazon.com.mx/dp/${asin}`,
      source: 'amazon',
      description: description.slice(0, 1000) || 'Sin descripción disponible.',
      currency: 'MXN',
      availability,
      expires_at,
      suggested_category,
      raw_data: { asin, title, price, original_price },
      shipping_info: {
        has_prime,
        free_shipping_label,
        shipping_text,
        shipping_cost
      },
      payment_info: {
          has_msi
      }
    };

  } catch (error) {
    console.error('Error scraping Amazon URL:', error);
    return null;
  }
}

export async function scrapeMercadoLibreUrl(url: string): Promise<ScrapedDeal | null> {
  const mlId = extractMLID(url);
  if (!mlId) return null;

  try {
    // Use API for details
    const response = await axios.get(`https://api.mercadolibre.com/items/${mlId}`);
    const item = response.data;

    if (!item) return null;

    // Shipping logic for Mercado Libre API
    const is_full = item.shipping?.logistic_type === 'fulfillment';
    const has_meli_plus = item.shipping?.tags?.includes('meli_plus') || false; // Note: API might not expose meli_plus tag directly on public item endpoint sometimes, but checking tags is good.
    const free_shipping_label = item.shipping?.free_shipping || false;
    
    // Sometimes shipping cost is not in item endpoint directly if it depends on buyer location, but free_shipping boolean is usually accurate for "generic" free shipping.
    
    const shipping_text = `Envío ${item.shipping?.free_shipping ? 'Gratis' : 'con costo'}. ${item.shipping?.logistic_type === 'fulfillment' ? 'Full' : ''}`;

    // Extract multiple images
    const image_urls: string[] = [];
    const seen_urls = new Set<string>();

    const addMlImage = (url: string) => {
        if (!url) return;
        // Normalize to high-res (O.jpg usually, sometimes D_NQ_NP_...-O.jpg)
        // ML images are usually .../id-I.jpg or .../id-O.jpg or .../id-F.jpg
        // We replace the suffix with O.jpg for highest quality if possible
        const normalized = url.replace(/-(I|F|V|O)\.jpg$/, '-O.jpg');
        
        if (!seen_urls.has(normalized)) {
            image_urls.push(normalized);
            seen_urls.add(normalized);
        }
    };

    if (item.pictures && Array.isArray(item.pictures)) {
        item.pictures.forEach((p: any) => {
            if (p.url) {
                addMlImage(p.url);
            }
        });
    } else {
        const thumb = item.thumbnail.replace('I.jpg', 'O.jpg');
        addMlImage(thumb);
    }

    // MSI Logic for Mercado Libre
    const has_msi = item.installments?.quantity > 0 && item.installments?.rate === 0;

    // Expiration for ML (Offer of the day)
    let expires_at = undefined;
    if (item.stop_time) {
        expires_at = item.stop_time;
    }

    return {
      id: item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || null,
      image_url: image_urls[0],
      image_urls,
      url: item.permalink,
      source: 'mercadolibre',
      description: `Condición: ${item.condition === 'new' ? 'Nuevo' : 'Usado'}.`,
      currency: item.currency_id,
      availability: item.status === 'active' ? 'online' : 'out_of_stock',
      expires_at,
      raw_data: item,
      shipping_info: {
        has_meli_plus,
        is_full,
        free_shipping_label,
        shipping_text
      },
      payment_info: {
          has_msi
      }
    };

  } catch (error) {
    console.error('Error scraping Mercado Libre URL:', error);
    return null;
  }
}

export async function searchMercadoLibre(query: string): Promise<ScrapedDeal[]> {
  try {
    const response = await axios.get(`https://api.mercadolibre.com/sites/MLM/search`, {
      params: {
        q: query,
        limit: 20,
        sort: 'price_asc'
      }
    });

    const items = response.data.results;

    return items.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || null,
      image_url: item.thumbnail.replace('I.jpg', 'O.jpg'),
      image_urls: [item.thumbnail.replace('I.jpg', 'O.jpg')], // Search results typically only give one image
      url: item.permalink,
      source: 'mercadolibre',
      description: `Oferta encontrada en Mercado Libre. Condición: ${item.condition === 'new' ? 'Nuevo' : 'Usado'}.`,
      currency: item.currency_id,
      availability: 'online', // Search results are usually active
      raw_data: item,
      shipping_info: {
        has_meli_plus: item.shipping?.tags?.includes('meli_plus') || false,
        is_full: item.shipping?.logistic_type === 'fulfillment',
        free_shipping_label: item.shipping?.free_shipping || false,
        shipping_text: `Envío ${item.shipping?.free_shipping ? 'Gratis' : 'con costo'}`
      },
      payment_info: {
        has_msi: item.installments?.quantity > 0 && item.installments?.rate === 0
      }
    }));

  } catch (error) {
    console.error('Error searching Mercado Libre:', error);
    return [];
  }
}

export async function searchAmazon(query: string): Promise<ScrapedDeal[]> {
  try {
    const url = `https://www.amazon.com.mx/s?k=${encodeURIComponent(query)}`;
    const userAgent = getRandomUserAgent();

    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'es-MX,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const deals: ScrapedDeal[] = [];

    $('.s-result-item[data-component-type="s-search-result"]').each((_, el) => {
      try {
        const titleElement = $(el).find('h2 a span');
        const title = titleElement.text().trim();
        
        const linkElement = $(el).find('h2 a');
        let urlSuffix = linkElement.attr('href');
        
        const image_url = $(el).find('img.s-image').attr('src');
        
        const priceWhole = $(el).find('.a-price-whole').first().text().replace(/,/g, '').replace(/\./g, '');
        const priceFraction = $(el).find('.a-price-fraction').first().text();
        
        const originalPriceElement = $(el).find('.a-text-price .a-offscreen').first();
        let originalPriceText = originalPriceElement.text().replace('$', '').replace(/,/g, '');
        
        if (!originalPriceText) {
             const textPrice = $(el).find('.a-text-price span').first().text().replace('$', '').replace(/,/g, '');
             if (textPrice) originalPriceText = textPrice;
        }

        // Shipping logic for Search Results
        const has_prime = $(el).find('.a-icon-prime').length > 0;
        // In search results, shipping text is usually in a row below price
        const shippingRow = $(el).find('.a-row[aria-label], .a-row .a-size-small').filter((_, e) => $(e).text().includes('Envío') || $(e).text().includes('entrega')).first();
        const shipping_text = shippingRow.text().trim().replace(/\s+/g, ' ');
        const free_shipping_label = shipping_text.toLowerCase().includes('envío gratis') || shipping_text.toLowerCase().includes('envío gratis en tu primer pedido');
        
        let shipping_cost: number | undefined = undefined;
        const shippingCostMatch = shipping_text.match(/\$(\d+(?:[.,]\d{2})?)\s+de\s+envío/i);
        if (shippingCostMatch) {
             shipping_cost = parseFloat(shippingCostMatch[1].replace(',', ''));
        }

        // MSI for Amazon Search
        const has_msi = $(el).text().toLowerCase().includes('meses sin intereses');

        if (title && priceWhole && urlSuffix && image_url) {
          const price = parseFloat(`${priceWhole}.${priceFraction || '00'}`);
          const original_price = originalPriceText ? parseFloat(originalPriceText) : null;
          const asin = $(el).attr('data-asin') || Math.random().toString(36).substring(7);

          if (isNaN(price)) return;

          deals.push({
            id: asin,
            title,
            price,
            original_price: original_price && original_price > price ? original_price : null,
            image_url,
            image_urls: [image_url], // Search results only give one image
            url: urlSuffix.startsWith('http') ? urlSuffix : `https://www.amazon.com.mx${urlSuffix}`,
            source: 'amazon',
            description: 'Oferta encontrada en Amazon México. Ver detalles en la página oficial.',
            currency: 'MXN',
            availability: 'online',
            raw_data: { asin, title, price },
            shipping_info: {
                has_prime,
                free_shipping_label,
                shipping_text,
                shipping_cost
            },
            payment_info: {
                has_msi
            }
          });
        }
      } catch (e) {
        // Skip
      }
    });

    return deals.slice(0, 20);

  } catch (error) {
    console.error('Error scraping Amazon:', error);
    return []; 
  }
}
