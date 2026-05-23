const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Capture page errors
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });

  // Capture network requests that fail
  page.on('requestfailed', request => {
    console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to http://localhost:8082...');
  
  try {
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded.');
    
    // Check if the page is blank by seeing if there are any child elements in #root or body
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.trim() === '' || html.includes('<div id="root"></div>')) {
      console.log('BODY HTML is empty or only contains #root div!');
    }
    
    // Wait a couple more seconds to let errors fire
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.error('Navigation error:', err);
  } finally {
    await browser.close();
  }
})();
