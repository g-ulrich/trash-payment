const puppeteer = require('puppeteer');
const {Discord} = require('./discord');
require('dotenv').config(); 

const TARGET_URL = 'https://paylocalgov.com/BillPresentment/Home/AccountLookup?id=1006005355';
const SEARCH_INPUT_SELECTOR = '#search1';
const SEARCH_INPUT_VALUE = '01006035';
const SEARCH_BUTTON_SELECTOR = '#btnSearch';
const RESULTS_GRID_SELECTOR = '#resultsGrid';
const ADD_TO_CART_BUTTON_SELECTOR = 'a.addButtonCart.btn.btn-success#133';
const CHECKOUT_BUTTON_SELECTOR = 'button.btn.btn-primary[name="submit"][value="Checkout"]';
const CHECKOUT_PAGE_URL = 'https://paylocalgov.com/BillPresentment/Home/Checkout?refferer=ToCheckout';

const MAX_RETRIES = 5;

async function runAutomation() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt} starting...`);

      // Navigate to the target page
      await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

      // Input the search value
      await page.waitForSelector(SEARCH_INPUT_SELECTOR, { visible: true });
      await page.click(SEARCH_INPUT_SELECTOR, { clickCount: 3 }); // Select all text if any
      await page.type(SEARCH_INPUT_SELECTOR, SEARCH_INPUT_VALUE);

      // Click the search button
      await page.click(SEARCH_BUTTON_SELECTOR);

      // Wait for the results grid to load
      await page.waitForSelector(RESULTS_GRID_SELECTOR, { visible: true, timeout: 10000 });

      // Check number of rows in tbody
      const rowCount = await page.evaluate((selector) => {
        const grid = document.querySelector(selector);
        if (!grid) return 0;
        const tbody = grid.querySelector('tbody');
        if (!tbody) return 0;
        return tbody.querySelectorAll('tr').length;
      }, RESULTS_GRID_SELECTOR);

      if (rowCount !== 1) {
        console.log(`Expected 1 row in results grid, found ${rowCount}. Restarting...`);
        continue; // retry from beginning
      }

      // Click the add to cart button in the row
      await page.waitForSelector(ADD_TO_CART_BUTTON_SELECTOR, { visible: true, timeout: 5000 });
      await page.click(ADD_TO_CART_BUTTON_SELECTOR);

      // Wait for the checkout button to appear and click it
      await page.waitForSelector(CHECKOUT_BUTTON_SELECTOR, { visible: true, timeout: 10000 });
      await page.click(CHECKOUT_BUTTON_SELECTOR);

      // Wait for navigation to checkout page
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

      // Verify URL is the checkout page URL
      const currentURL = page.url();
      if (!currentURL.startsWith(CHECKOUT_PAGE_URL)) {
        console.log(`Did not reach checkout page, current URL: ${currentURL}. Restarting...`);
        continue; // retry from beginning
      }

      // Display page text in console
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('Checkout page text:');
      console.log(pageText);

      // Success, break out of retry loop
      break;

    } catch (error) {
      console.log(`Error on attempt ${attempt}:`, error);
      if (attempt === MAX_RETRIES) {
        console.log('Max retries reached. Exiting.');
      } else {
        console.log('Retrying...');
      }
    }
  }

  await browser.close();
}

runAutomation().catch(error => {
  console.error('Fatal error in automation script:', error);
});
