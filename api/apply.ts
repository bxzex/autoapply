import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const maxDuration = 60; 

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { jobUrl, firstName, lastName, email } = request.body;

  if (!jobUrl) {
    return response.status(400).json({ error: 'Missing jobUrl' });
  }

  let browser = null;
  try {
    // 1. Configure Browser Bridge
    // Note: Version 123.0.1 is very stable for Vercel environments
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security", "--no-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // 2. Protocol Navigation
    // We use networkidle2 to ensure the page has somewhat loaded its forms
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 3. Automated Form Preparation
    try {
      // Find and fill common fields
      const inputs = await page.$$('input');
      for (const input of inputs) {
        const name = await (await input.getProperty('name')).jsonValue() as string;
        const type = await (await input.getProperty('type')).jsonValue() as string;
        
        const lowerName = name?.toLowerCase() || '';
        
        if (firstName && (lowerName.includes('first') || lowerName.includes('given'))) {
          await input.type(firstName).catch(() => null);
        } else if (lastName && (lowerName.includes('last') || lowerName.includes('family'))) {
          await input.type(lastName).catch(() => null);
        } else if (email && (type === 'email' || lowerName.includes('email'))) {
          await input.type(email).catch(() => null);
        }
      }
    } catch (err) {
      console.warn('Protocol Injection Error:', err);
    }

    // 4. Capture Visual Telemetry
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
    const base64Screenshot = (screenshot as Buffer).toString('base64');

    return response.status(200).json({ 
      status: 'success', 
      message: 'Protocol initialized.',
      jobUrl,
      screenshot: base64Screenshot
    });

  } catch (error: any) {
    console.error('Automation Bridge Critical Failure:', error);
    return response.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
