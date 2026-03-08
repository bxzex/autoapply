import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium-min';
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
    // 1. Setup Robust Browser Bridge
    const executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v132.0.0/chromium-v132.0.0-pack.tar'
    );

    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 2. Navigation Protocol
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 3. Automated Form Preparation
    try {
      if (firstName) await page.type('input[name*="first"], input[name*="given"]', firstName).catch(() => null);
      if (lastName) await page.type('input[name*="last"], input[name*="family"]', lastName).catch(() => null);
      if (email) await page.type('input[type="email"], input[name*="email"]', email).catch(() => null);
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
