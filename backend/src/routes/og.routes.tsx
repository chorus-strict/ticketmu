import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import axios from 'axios';
import { format } from 'date-fns';

const router = Router();

// Cache for font data to avoid re-fetching on every request
let fontData: ArrayBuffer | null = null;

async function getFontData() {
  if (fontData) return fontData;
  try {
    // Using a reliable source for Inter Bold
    const response = await axios.get(
      'https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf',
      { responseType: 'arraybuffer' }
    );
    fontData = response.data;
    return fontData;
  } catch (error) {
    console.error('Failed to fetch font:', error);
    return null;
  }
}

router.get('/:eventId', async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const font = await getFontData();
    if (!font) {
      throw new Error('Could not load font');
    }

    // Generate SVG
    const svg = await satori(
      <div
        style={{
          height: '630px',
          width: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '80px',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background Gradient Effect */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(to bottom right, #4f46e5, #0f172a)',
            opacity: 0.6,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 10 }}>
          <div 
            style={{ 
              fontSize: '24px', 
              fontWeight: 800, 
              color: '#818cf8', 
              textTransform: 'uppercase',
              letterSpacing: '0.2em'
            }}
          >
            Live Event • {event.category}
          </div>
          
          <div 
            style={{ 
              fontSize: '84px', 
              fontWeight: 800, 
              lineHeight: 1.1, 
              maxWidth: '1000px',
              fontStyle: 'italic',
              textTransform: 'uppercase',
            }}
          >
            {event.title.length > 60 ? event.title.substring(0, 57) + '...' : event.title}
          </div>
          
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '40px', 
              marginTop: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '32px', fontWeight: 600 }}>
               <span style={{ opacity: 0.7 }}>📅</span> {format(new Date(event.date), 'MMMM dd, yyyy')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '32px', fontWeight: 600 }}>
               <span style={{ opacity: 0.7 }}>📍</span> {event.location}
            </div>
          </div>
        </div>

        <div 
          style={{ 
            position: 'absolute', 
            bottom: '80px', 
            right: '80px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            zIndex: 10 
          }}
        >
           <div style={{ fontSize: '42px', fontWeight: 900, fontStyle: 'italic', color: 'white', letterSpacing: '-0.05em' }}>
              TIKETMU
           </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: font,
            weight: 800,
            style: 'normal',
          },
        ],
      }
    );

    // Convert SVG to PNG
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Cache the image for 1 hour
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(pngBuffer);

  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({ message: 'Error generating image' });
  }
});

export default router;
