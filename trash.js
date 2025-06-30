const puppeteer = require('puppeteer');
const {Discord} = require('./discord');
require('dotenv').config(); 

const TARGET_URL = "https://paylocalgov.com/BillPresentment/Home/AccountLookup?id=1006005355";
const SEARCH_INPUT_SELECTOR = '#search1';
const SEARCH_INPUT_VALUE = process.env.TARSH_ACCOUNT_VALUE;
const SEARCH_BUTTON_SELECTOR = '#btnSearch';
const RESULTS_GRID_SELECTOR = '#resultsGrid';
const ADD_TO_CART_BUTTON_SELECTOR = '.addButtonCart';
const CHECKOUT_BUTTON_SELECTOR = 'button.btn.btn-primary[name="submit"][value="Checkout"]';
const CHECKOUT_PAGE_URL = "https://paylocalgov.com/BillPresentment/Home/Checkout?refferer=ToCheckout";
const REVIEW_PAGE_URL = "https://paylocalgov.com/BillPresentment/Home/BpReviewPayment?SelectedPaymentMethod=BillMeLater&SignedUpforPaperlessBill=False&IsFuturePay=False"
const discord = new Discord();
const MAX_RETRIES = 5;

async function runAutomation() {
  discord.sendMessage("```bash\n[INFO] ${new Date()}\n     - Starting monthly trash bill script.\n```");
  const browser = await puppeteer.launch({
    headless: 'new', // or true
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      discord.sendMessage(`[INFO] Attempt number: *${attempt}/${MAX_RETRIES}* starting...`);
      // Navigate to the target page
      await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
      await page.click(SEARCH_INPUT_SELECTOR); // Select all text if any
      await page.type(SEARCH_INPUT_SELECTOR, SEARCH_INPUT_VALUE);
      discord.sendMessage(`[INFO] Searching for trash account & clicking button...`);
      // Click the search button
      await page.click(SEARCH_BUTTON_SELECTOR);
      // Wait for the results grid to load
       discord.sendMessage(`[INFO] Waiting for grid to show account...`);
      await page.waitForSelector(RESULTS_GRID_SELECTOR, { visible: true, timeout: 10000 });
     discord.sendMessage(`[INFO] Clicking add to cart button...`);
      // // Click the add to cart button in the row
      await page.click(ADD_TO_CART_BUTTON_SELECTOR);
      // Wait for the checkout button to appear and click it
      discord.sendMessage(`[INFO] Waiting fro checkout button to appear...`);
      await page.waitForSelector(CHECKOUT_BUTTON_SELECTOR, { visible: true, timeout: 10000 });
      discord.sendMessage(`[INFO] Clicking checkout button...`);
      await page.click(CHECKOUT_BUTTON_SELECTOR);
      discord.sendMessage(`[INFO] Waiting for checkout page to load...`);
      // Wait for navigation to checkout page
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      // Verify URL is the checkout page URL
      discord.sendMessage(`[INFO] Verifying checkout page URL...`);
      const currentURL = page.url();
      if (!currentURL.startsWith(CHECKOUT_PAGE_URL)) {
        discord.sendMessage(`[ERROR] Did not reach checkout page, current URL: ${currentURL}. Restarting...`);
        continue; // retry from beginning
      }
      discord.sendMessage(`[INFO] Inputing & selecting checkout data...`);
      await page.type("#Payer_FirstName", process.env.INPUT_FNAME);
      await page.type("#Payer_LastName", process.env.INPUT_UNAME);
      await page.type("#Payer_Address1", process.env.INPUT_ADDRESS);
      await page.type("#us-city", process.env.INPUT_CITY);
      await page.select("#UsStateValue", process.env.SELECT_STATE);
      await page.type("#Payer_UsZipcode", process.env.INPUT_ZIP);
      await page.type("#Payer_UsPhoneNumber", process.env.INPUT_PHONE);
      await page.type("#email-us", process.env.INPUT_EMAIL);
      await page.select("#payment-methods", process.env.SELECT_PAYMENT_METHOD);
      await page.type("#CardNumber", process.env.INPUT_CARD);
      await page.select("#exp-month", process.env.SELECT_EXP_MONTH);
      await page.select("#exp-year", process.env.SELECT_EXP_YR);
      await page.type("#Cvv", process.env.INPUT_CVV);
      discord.sendMessage(`[INFO] Finalizing payment...`);
      discord.sendMessage(`[INFO] Clicking continue button...`);
      page.click("#next")
      // Wait for navigation to checkout page
      discord.sendMessage(`[INFO] Waiting for 'review' page...`);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      // Verify URL is the checkout page URL
      discord.sendMessage(`[INFO] Verifying 'review' checkout page URL...`);
      const currentReviewURL = page.url();
      if (!currentReviewURL.startsWith(REVIEW_PAGE_URL)) {
        discord.sendMessage(`[ERROR] Did not reach 'review' checkout page, current URL: ${currentReviewURL}. Restarting...`);
        continue; // retry from beginning
      }
       discord.sendMessage(`[INFO] Clicking Submit button...`);
       page.click("#submitprocess");
      discord.sendMessage(`[INFO] Waiting for receipt page to load...`);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
      discord.sendMessage("```bash\n[SUCCESS] "+new Date()+"\n    - Trash bill paid! Check "+process.env.INPUT_EMAIL+" for payment info.```");
      break;

    } catch (error) {
      discord.sendMessage(`[ERROR] Attempt number *${attempt}* failed because:` + "\n```bash\n"+ error + "\n```");
      if (attempt === MAX_RETRIES) {
        discord.sendMessage(`[ERROR] Max retries reached. Exiting. Trying again next month.`);
      } else {
        discord.sendMessage(`[WARNING] Retrying script...`);
      }
    }
  }

  await browser.close();
}

runAutomation().catch(error => {
  discord.sendMessage(`[ERROR] Fatal error in automation script:` + "\n```bash\n"+ error + "\n```");
});
