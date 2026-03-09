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
  shipping_type?: 'none' | 'free' | 'prime' | 'meliplus' | 'full'; // Add detected shipping type
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
  // Pattern 1: /MLM-12345678-title...
  let match = url.match(/MLM[-_]?(\d+)/);
  if (match) return `MLM${match[1]}`;

  // Pattern 2: /p/MLM12345678 (Catalog product)
  match = url.match(/\/p\/(MLM\d+)/);
  if (match) return match[1];

  // Pattern 3: query param id=MLM12345678
  match = url.match(/[?&]id=(MLM\d+)/);
  if (match) return match[1];
  
  // Pattern 4: /MLM-12345678 (without title suffix, sometimes happens)
  match = url.match(/MLM-(\d+)/);
  if (match) return `MLM${match[1]}`;

  return null;
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
    
    // Price extraction logic - Improved for accuracy
    let priceText = '';
    
    // Priority 1: "Price To Pay" (Standard Amazon selling price class)
    // We look for the visible price block that is NOT a label/text price
    const priceToPay = $('.priceToPay .a-offscreen, #corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen').first();
    if (priceToPay.length > 0) {
        priceText = priceToPay.text().trim();
    }
    
    // Priority 2: Apex Price (often used in deals/lightning deals)
    if (!priceText) {
        const apexPrice = $('.apexPriceToPay .a-offscreen').first();
        if (apexPrice.length > 0) {
            priceText = apexPrice.text().trim();
        }
    }

    // Priority 3: Legacy ID selectors
    if (!priceText) {
        const dealPrice = $('#priceblock_dealprice, #priceblock_ourprice, #priceblock_saleprice').first();
        if (dealPrice.length > 0) {
            priceText = dealPrice.text().trim();
        }
    }

    // Priority 4: Center column fallback (safest area)
    if (!priceText) {
         const centerColPrice = $('#centerCol .a-price:not(.a-text-price) .a-offscreen').first();
         if (centerColPrice.length > 0) {
             priceText = centerColPrice.text().trim();
         }
    }

    // Fallback: Whole/Fraction method (sometimes offscreen is missing or weird)
    if (!priceText) {
        const priceWhole = $('.a-price-whole').first().text().replace(/,/g, '').replace(/\./g, '').trim();
        const priceFraction = $('.a-price-fraction').first().text().trim();
        if (priceWhole) {
            priceText = `${priceWhole}.${priceFraction || '00'}`;
        }
    }

    // Clean and parse price
    // Remove currency symbol, commas, and any non-numeric chars except dot
    const priceClean = priceText.replace(/[^\d.]/g, ''); 
    const price = parseFloat(priceClean);

    // Original Price (List Price / Previous Price)
    // This usually HAS the .a-text-price class
    let originalPriceText = $('.a-price.a-text-price[data-a-strike="true"] .a-offscreen').first().text().trim();
    if (!originalPriceText) {
        // Try finding "List Price" label
        originalPriceText = $('#basis-price .a-offscreen, .basisPrice .a-offscreen').first().text().trim();
    }
    const originalPriceClean = originalPriceText.replace(/[^\d.]/g, '');
    const original_price = originalPriceClean ? parseFloat(originalPriceClean) : null;

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

    // Determine shipping_type
    let shipping_type: 'none' | 'free' | 'prime' | 'meliplus' | 'full' = 'none';
    if (has_prime) {
        shipping_type = 'prime';
    } else if (free_shipping_label) {
        shipping_type = 'free';
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
      shipping_type,
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
  let mlId = extractMLID(url);
  
  if (!mlId) {
      console.error('Could not extract ML ID from URL:', url);
      return null;
  }
  
  // Clean ID just in case
  mlId = mlId.replace('-', '');

  try {
    // Try to get item details from API
    let item;
    try {
        const response = await axios.get(`https://api.mercadolibre.com/items/${mlId}`);
        item = response.data;
    } catch (e) {
        // If it's a catalog product (MLM123...), the items endpoint might fail or return a parent.
        // Sometimes we need to search for it.
        // Or if it fails, maybe it's a variation.
        console.warn(`Direct item fetch failed for ${mlId}, trying catalog fallback...`);
    }

    // If direct fetch failed or returned partial data, and it looks like a catalog ID
    if (!item) {
         // Fallback: This might be a catalog product ID, which is different from an Item ID.
         // We can try to "search" for it or get product details.
         try {
             const productResponse = await axios.get(`https://api.mercadolibre.com/products/${mlId}`);
             const product = productResponse.data;
             
             // Map product to deal format (limited info compared to item)
             // We need to find an active item for this product to get the price
             const searchResponse = await axios.get(`https://api.mercadolibre.com/sites/MLM/search`, {
                 params: { q: product.name, limit: 1 }
             });
             
             if (searchResponse.data.results.length > 0) {
                 item = searchResponse.data.results[0];
             } else {
                 // Return minimal info from product
                 return {
                     id: product.id,
                     title: product.name,
                     price: 0, // Unknown
                     original_price: null,
                     image_url: product.pictures[0]?.url || '',
                     image_urls: product.pictures.map((p:any) => p.url),
                     url: product.permalink,
                     source: 'mercadolibre',
                     description: 'Producto de catálogo',
                     currency: 'MXN',
                     availability: 'online',
                     shipping_type: 'none'
                 };
             }
         } catch (e2) {
             throw new Error(`Failed to fetch ML item/product: ${mlId}`);
         }
    }

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

    // Determine shipping_type
    let shipping_type: 'none' | 'free' | 'prime' | 'meliplus' | 'full' = 'none';
    if (has_meli_plus) {
        shipping_type = 'meliplus';
    } else if (is_full) {
        shipping_type = 'full';
    } else if (free_shipping_label) {
        shipping_type = 'free';
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
      shipping_type,
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
      shipping_type: item.shipping?.tags?.includes('meli_plus') ? 'meliplus' : (item.shipping?.logistic_type === 'fulfillment' ? 'full' : (item.shipping?.free_shipping ? 'free' : 'none')),
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

export async function scrapeMercadoLibreDeals(): Promise<ScrapedDeal[]> {
  try {
    // 1. Try fetching the main deals page directly
    try {
        const userAgent = getRandomUserAgent();
        const htmlResponse = await axios.get('https://www.mercadolibre.com.mx/ofertas', {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://www.google.com/'
            },
            timeout: 8000
        });
        
        if (htmlResponse.data) {
            const dealsFromHtml = parseMercadoLibreHtml(htmlResponse.data);
            if (dealsFromHtml.length > 0) {
                console.log(`Scraped ${dealsFromHtml.length} deals from ML HTML page`);
                return dealsFromHtml;
            }
        }
    } catch (htmlError) {
        console.warn('ML HTML scrape failed, falling back to API:', htmlError instanceof Error ? htmlError.message : String(htmlError));
    }

    // 2. Fallback to API (if not blocked)
    const response = await axios.get(`https://api.mercadolibre.com/sites/MLM/search`, {
      params: {
        q: 'ofertas',
        sort: 'relevance',
        limit: 50
      },
      headers: {
        'User-Agent': getRandomUserAgent()
      }
    });

    const items = response.data.results;
    return mapMercadoLibreItems(items);
  } catch (error) {
    console.error('Error scraping Mercado Libre deals (HTML & API):', error);
    return [];
  }
}

function mapMercadoLibreItems(items: any[]): ScrapedDeal[] {
    return items.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || null,
      image_url: item.thumbnail ? item.thumbnail.replace('I.jpg', 'O.jpg') : '',
      image_urls: item.thumbnail ? [item.thumbnail.replace('I.jpg', 'O.jpg')] : [],
      url: item.permalink,
      source: 'mercadolibre',
      description: `Oferta encontrada en Mercado Libre. Condición: ${item.condition === 'new' ? 'Nuevo' : 'Usado'}.`,
      currency: item.currency_id,
      availability: 'online',
      shipping_type: item.shipping?.tags?.includes('meli_plus') ? 'meliplus' : (item.shipping?.logistic_type === 'fulfillment' ? 'full' : (item.shipping?.free_shipping ? 'free' : 'none')),
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
}

export function parseMercadoLibreHtml(html: string): ScrapedDeal[] {
    const $ = cheerio.load(html);
    const deals: ScrapedDeal[] = [];

    // Strategy 1: Search Results (.ui-search-layout__item)
    $('.ui-search-layout__item').each((_, el) => {
        try {
            const title = $(el).find('.ui-search-item__title').text().trim();
            const url = $(el).find('a.ui-search-link').attr('href');
            const priceText = $(el).find('.ui-search-price__part--medium .andes-money-amount__fraction').first().text().replace(/\./g, '');
            const price = parseFloat(priceText);
            const originalPriceText = $(el).find('.ui-search-price__part--medium .ui-search-price__original-value .andes-money-amount__fraction').text().replace(/\./g, '');
            const original_price = originalPriceText ? parseFloat(originalPriceText) : null;
            const image_url = $(el).find('img.ui-search-result-image__element').attr('data-src') || $(el).find('img.ui-search-result-image__element').attr('src');
            
            // Shipping
            const is_full = $(el).find('.ui-search-item__fulfillment-label').length > 0;
            const free_shipping = $(el).find('.ui-search-item__shipping--free').length > 0;
            const has_meli_plus = $(el).find('.ui-search-item__meli-plus-label').length > 0;

            if (title && !isNaN(price) && url) {
                deals.push({
                    id: extractMLID(url) || Math.random().toString(36).substring(7),
                    title,
                    price,
                    original_price: original_price && original_price > price ? original_price : null,
                    image_url: image_url || '',
                    image_urls: image_url ? [image_url] : [],
                    url,
                    source: 'mercadolibre',
                    description: 'Oferta importada desde HTML.',
                    currency: 'MXN',
                    availability: 'online',
                    shipping_type: has_meli_plus ? 'meliplus' : (is_full ? 'full' : (free_shipping ? 'free' : 'none')),
                    shipping_info: {
                        has_meli_plus,
                        is_full,
                        free_shipping_label: free_shipping,
                        shipping_text: free_shipping ? 'Envío Gratis' : ''
                    }
                });
            }
        } catch (e) { console.error('Error parsing ML item', e); }
    });

    // Strategy 2: Deals Page Cards (.promotion-item)
    $('.promotion-item').each((_, el) => {
        try {
            const title = $(el).find('.promotion-item__title').text().trim();
            const url = $(el).find('.promotion-item__link-container').attr('href');
            const priceContainer = $(el).find('.promotion-item__price');
            const priceText = priceContainer.find('.andes-money-amount__fraction').first().text().replace(/\./g, '');
            const price = parseFloat(priceText);
            
            // Original price might be hidden or different structure
            // Sometimes it's in a separate element
            
            const image_url = $(el).find('img.promotion-item__img').attr('src') || $(el).find('img.promotion-item__img').attr('data-src');

             if (title && !isNaN(price) && url) {
                deals.push({
                    id: extractMLID(url) || Math.random().toString(36).substring(7),
                    title,
                    price,
                    original_price: null, // Hard to extract reliably from this view sometimes
                    image_url: image_url || '',
                    image_urls: image_url ? [image_url] : [],
                    url,
                    source: 'mercadolibre',
                    description: 'Oferta del día importada.',
                    currency: 'MXN',
                    availability: 'online',
                    shipping_type: 'none', // Badges often missing in this view
                });
            }
        } catch (e) { console.error('Error parsing ML deal item', e); }
    });

    return deals;
}

export function parseAmazonHtml(html: string): ScrapedDeal[] {
    const $ = cheerio.load(html);
    const deals: ScrapedDeal[] = [];

    // Strategy 1: Search Results
    $('.s-result-item[data-component-type="s-search-result"]').each((_, el) => {
         try {
            const title = $(el).find('h2 a span').text().trim();
            const urlSuffix = $(el).find('h2 a').attr('href');
            const image_url = $(el).find('img.s-image').attr('src');
            
            // Improve price extraction to avoid List Price
            const priceElement = $(el).find('.a-price:not(.a-text-price)').first();
            const priceWhole = priceElement.find('.a-price-whole').first().text().replace(/,/g, '').replace(/\./g, '');
            const priceFraction = priceElement.find('.a-price-fraction').first().text();
            
            const price = parseFloat(`${priceWhole}.${priceFraction || '00'}`);
            
            const originalPriceText = $(el).find('.a-text-price .a-offscreen').first().text().replace('$', '').replace(/,/g, '');
            const original_price = originalPriceText ? parseFloat(originalPriceText) : null;
            const asin = $(el).attr('data-asin');

            if (title && !isNaN(price) && urlSuffix) {
                deals.push({
                    id: asin || Math.random().toString(36).substring(7),
                    title,
                    price,
                    original_price: original_price && original_price > price ? original_price : null,
                    image_url: image_url || '',
                    image_urls: image_url ? [image_url] : [],
                    url: urlSuffix.startsWith('http') ? urlSuffix : `https://www.amazon.com.mx${urlSuffix}`,
                    source: 'amazon',
                    description: 'Oferta importada desde HTML.',
                    currency: 'MXN',
                    availability: 'online',
                    shipping_type: $(el).find('.a-icon-prime').length > 0 ? 'prime' : 'none'
                });
            }
         } catch(e) {}
    });

    // Strategy 2: Carousel/Grid Cards (Deals Page)
    // Look for cards with "Deal" badge or similar
    $('div[class*="DealGridItem-module__dealItemContent"]').each((_, el) => {
        try {
            const title = $(el).find('a[class*="DealContent-module__truncate"]').text().trim() || 
                          $(el).find('div[class*="DealContent-module__truncate"]').text().trim();
            const urlSuffix = $(el).find('a.a-link-normal').attr('href');
            const image_url = $(el).find('img').attr('src');
            
            // Price is tricky here, often dynamic.
            // But sometimes rendered.
            // If not found, skip.
        } catch(e) {}
    });

    // If no deals found, try generic card search
    if (deals.length === 0) {
        // Fallback for generic grid
        $('.a-cardui').each((_, el) => {
            // Implementation depends on specific layout
        });
    }

    return deals;
}

export async function scrapeAmazonDeals(): Promise<ScrapedDeal[]> {
  try {
    // 1. Try fetching the main deals page directly
    try {
        const userAgent = getRandomUserAgent();
        const htmlResponse = await axios.get('https://www.amazon.com.mx/deals?ref_=nav_cs_gb', {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://www.google.com/'
            },
            timeout: 8000
        });
        
        if (htmlResponse.data) {
            const dealsFromHtml = parseAmazonHtml(htmlResponse.data);
            if (dealsFromHtml.length > 0) {
                console.log(`Scraped ${dealsFromHtml.length} deals from Amazon HTML page`);
                return dealsFromHtml;
            }
        }
    } catch (htmlError) {
        console.warn('Amazon HTML scrape failed, falling back to Search:', htmlError instanceof Error ? htmlError.message : String(htmlError));
    }

    // 2. Fallback to Search simulation
    const queries = ['ofertas', 'descuentos', 'remates', 'promociones'];
    const promises = queries.map(q => searchAmazon(q));
    const results = await Promise.all(promises);
    
    // Flatten and deduplicate by ID
    const allDeals = results.flat();
    const uniqueDeals = Array.from(new Map(allDeals.map(item => [item.id, item])).values());
    
    // Sort by discount percentage (if available) or price
    return uniqueDeals.sort((a, b) => {
        const discountA = a.original_price ? (a.original_price - a.price) / a.original_price : 0;
        const discountB = b.original_price ? (b.original_price - b.price) / b.original_price : 0;
        return discountB - discountA;
    }).slice(0, 50); // Limit to 50 top deals

  } catch (error) {
    console.error('Error scraping Amazon deals:', error);
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

          // Determine shipping_type
          let shipping_type: 'none' | 'free' | 'prime' | 'meliplus' | 'full' = 'none';
          if (has_prime) {
              shipping_type = 'prime';
          } else if (free_shipping_label) {
              shipping_type = 'free';
          }

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
            shipping_type,
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
