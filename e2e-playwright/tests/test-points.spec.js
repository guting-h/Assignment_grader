const { test, expect } = require("@playwright/test");


test.describe("Assignment Points Tests", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });
  
    test("Test submitting a correct solution increases the points by 100", async ({ page }) => {

        await page.waitForSelector("[data-testid='assignment-title']:not(:has-text('Loading...'))", {
            timeout: 5000,
        });

        // initial points should be 0
        const initialPoints = await page.locator("[data-testid='points']").innerText();
        await expect(initialPoints).toContain("0");
          
        // submit correct solution
        await page.fill("textarea", "def hello(): return 'Hello'");
        await page.click("button:text('Submit for grading')")
        await page.waitForSelector("pre:text('✅ All tests passed!')");

        // points should increase to 100
        const updatedPoints = await page.locator("[data-testid='points']").innerText();
        await expect(updatedPoints).toContain("100");

    });
   
});