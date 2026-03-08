import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium';
import { chromium as playwright } from 'playwright-core';

export const maxDuration = 60; // 60s for Hobby tier

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { jobUrl, firstName, lastName, email, resumeText } = request.body;

  if (!jobUrl) {
    return response.status(400).json({ error: 'Missing jobUrl' });
  }

  let browser = null;
  try {
    // 1. Initialize Headless Browser (optimized for Vercel/Lambda)
    const executablePath = await chromium.executablePath();
    
    // Sometimes chromium is busy being extracted/prepared
    await new Promise(resolve => setTimeout(resolve, 500));

    browser = await playwright.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // 2. Navigate to Job URL (No-Wait Strategy)
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 3. Automation: Find and fill common fields (Example logic)
    // In a real scenario, this would be customized for major platforms (Workday, Greenhouse, etc.)
    try {
      if (firstName) {
        await page.fill('input[name*="first"], input[name*="given"]', firstName).catch(() => null);
      }
      if (lastName) {
        await page.fill('input[name*="last"], input[name*="family"]', lastName).catch(() => null);
      }
      if (email) {
        await page.fill('input[type="email"], input[name*="email"]', email).catch(() => null);
      }
      
      // Resume Upload Field Logic
      // Usually <input type="file">. We can't easily upload a Uint8Array from serverless 
      // unless we write it to a temp file or the site accepts drag-and-drop.
      // For now, we simulate finding the field.
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
         // Logic to handle actual upload would go here
      }

    } catch (err) {
      console.warn('Filling failed, site might be non-standard:', err);
    }

    // 4. Capture Progress Screenshot
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
    const base64Screenshot = screenshot.toString('base64');

    // 5. Return success with the screenshot
    return response.status(200).json({ 
      status: 'success', 
      message: 'Automation initiated. Data prepared on portal.',
      jobUrl,
      screenshot: base64Screenshot
    });

  } catch (error: any) {
    console.error('Automation error:', error);
    return response.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
