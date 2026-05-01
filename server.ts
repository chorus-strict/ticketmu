import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import app from './backend/src/app';
import { backfillPayments } from './backend/src/lib/backfill';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getMetaTags(url: string, req: express.Request) {
  const eventMatch = url.match(/\/event\/([a-zA-Z0-9-]+)/);
  let title = "Tiketmu - Event Booking Application";
  let description = "Find and book tickets for the best events near you.";
  let image = "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1200&h=630"; // Default image

  if (eventMatch) {
    const eventId = eventMatch[1];
    try {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (event) {
        const host = req.get('host');
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const absoluteBase = `${protocol}://${host}`;
        
        title = `${event.title} | Tiketmu`;
        description = `${event.category} event in ${event.location}. Happening on ${new Date(event.date).toLocaleDateString()}.`;
        image = `${absoluteBase}/api/og/event/${event.id}`;
      }
    } catch (e) {
      console.error("Meta tags generation error:", e);
    }
  }

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  `;
}

async function startServer() {
  const PORT = 3000;

  // Run backfill
  await backfillPayments();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom', // Switched to custom for index.html transformation
    });
    
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API and assets
      if (url.startsWith('/api') || url.includes('.')) return next();

      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const metaTags = await getMetaTags(url, req);
        // Replace the default title and inject new meta tags
        const html = template
          .replace(/<title>.*?<\/title>/, '')
          .replace('</head>', `${metaTags}</head>`);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();

      try {
        let template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        const metaTags = await getMetaTags(url, req);
        const html = template
          .replace(/<title>.*?<\/title>/, '')
          .replace('</head>', `${metaTags}</head>`);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
