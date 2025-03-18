const express = require('express');
const router = express.Router();

// POST route to generate a sitemap dynamically
router.post('/generate-sitemap', (req, res) => {
  const { urls } = req.body; // Expecting an array of URLs in the request body

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Invalid input. Please provide an array of URLs.' });
  }

  // Generate sitemap XML
  const sitemap = urls.map((url) => `<url><loc>${url}</loc></url>`).join('');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemap}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(sitemapXml);
});

module.exports = router;