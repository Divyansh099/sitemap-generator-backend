const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const xmlFormatter = require('xml-formatter');

// Home page route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Sitemap Generator API',
    endpoints: {
      generate: 'POST /generate - Generate a sitemap for a website'
    }
  });
});

// Generate sitemap route
router.post('/generate', async (req, res) => {
  const { url, maxPages, includeImages } = req.body;
  
  if (!url) {
    return res.status(400).json({ 
      error: 'Please enter a valid URL'
    });
  }

  try {
    // Normalize the URL
    let baseUrl = url;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }
    
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const domain = new URL(baseUrl).hostname;
    
    // Set for tracking visited URLs
    const visited = new Set();
    const limit = maxPages ? parseInt(maxPages) : 50;
    
    // Queue for BFS
    const queue = [baseUrl];
    visited.add(baseUrl);
    
    // Sitemap entries
    const sitemapEntries = [];
    
    while (queue.length > 0 && sitemapEntries.length < limit) {
      const currentUrl = queue.shift();
      
      try {
        const response = await axios.get(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SitemapGenerator/1.0)'
          },
          timeout: 10000
        });
        
        // Add to sitemap entries
        sitemapEntries.push({
          loc: currentUrl,
          lastmod: new Date().toISOString().split('T')[0],
          images: []
        });
        
        const $ = cheerio.load(response.data);
        
        // Find all links
        $('a').each((i, link) => {
          const href = $(link).attr('href');
          if (!href) return;
          
          let fullUrl;
          
          // Handle relative URLs
          if (href.startsWith('/')) {
            fullUrl = `${baseUrl}${href}`;
          } else if (href.startsWith('http')) {
            fullUrl = href;
          } else if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            fullUrl = `${baseUrl}/${href}`;
          } else {
            return;
          }
          
          // Normalize URL
          try {
            const urlObj = new URL(fullUrl);
            
            // Only process URLs from the same domain
            if (urlObj.hostname !== domain) return;
            
            // Remove hash and query parameters
            urlObj.hash = '';
            fullUrl = urlObj.toString();
            
            // Add to queue if not visited
            if (!visited.has(fullUrl) && sitemapEntries.length < limit) {
              visited.add(fullUrl);
              queue.push(fullUrl);
            }
          } catch (e) {
            // Invalid URL, skip
          }
        });
        
        // Find images if requested
        if (includeImages === 'on') {
          $('img').each((i, img) => {
            const src = $(img).attr('src');
            const alt = $(img).attr('alt') || '';
            
            if (src) {
              let imgUrl;
              if (src.startsWith('http')) {
                imgUrl = src;
              } else if (src.startsWith('/')) {
                imgUrl = `${baseUrl}${src}`;
              } else {
                imgUrl = `${baseUrl}/${src}`;
              }
              
              // Add image to the current page entry
              sitemapEntries[sitemapEntries.length - 1].images.push({
                loc: imgUrl,
                title: alt
              });
            }
          });
        }
        
      } catch (error) {
        console.error(`Error fetching ${currentUrl}:`, error.message);
        // Still add to visited to avoid retrying
        visited.add(currentUrl);
      }
    }
    
    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    
    if (includeImages === 'on') {
      xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
    }
    
    xml += '>\n';
    
    sitemapEntries.forEach(entry => {
      xml += '  <url>\n';
      xml += `    <loc>${entry.loc}</loc>\n`;
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      
      if (includeImages === 'on' && entry.images.length > 0) {
        entry.images.forEach(image => {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${image.loc}</image:loc>\n`;
          if (image.title) {
            xml += `      <image:title>${image.title}</image:title>\n`;
          }
          xml += '    </image:image>\n';
        });
      }
      
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    // Format XML for better readability
    const formattedXml = xmlFormatter(xml, {
      indentation: '  ',
      collapseContent: true
    });
    
    res.json({ 
      xml: formattedXml,
      count: sitemapEntries.length,
      domain: domain
    });
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ 
      error: `Error generating sitemap: ${error.message}`
    });
  }
});

module.exports = router; 