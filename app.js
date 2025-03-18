// server.js (Backend)
const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Route to generate sitemap
app.post('/generate', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href.startsWith(window.location.origin));
        });

        await browser.close();

        const sitemapStream = new SitemapStream({ hostname: url });
        links.forEach(link => sitemapStream.write({ url: link, changefreq: 'daily', priority: 0.8 }));
        sitemapStream.end();
        
        const sitemap = await streamToPromise(sitemapStream);
        const filePath = path.join(__dirname, 'sitemap.xml');
        fs.writeFileSync(filePath, sitemap);

        res.download(filePath, 'sitemap.xml', () => {
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate sitemap', details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
