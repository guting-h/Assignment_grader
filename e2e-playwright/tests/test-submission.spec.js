const { test, expect } = require("@playwright/test");

test("Server responds with a page with the title 'Programming assignments'", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");
});


test.describe("Programming submission tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // wait for the assignment to load
    await page.waitForSelector("[data-testid='assignment-title']:not(:has-text('Loading...'))", {
      timeout: 5000,
    });
  });

  test("Test submit wrong solution and verify failure message", async ({ page }) => {

    await page.fill("textarea", "def hello(): return 'helloolol'");
  
    await page.click("button:text('Submit for grading')")
  
    // check that tests fail and have some feedback
    await page.waitForSelector("pre:text('❌ Some tests failed.')");
    const feedback = await page.locator("pre").innerText();
    expect(feedback).toContain("❌ Some tests failed.");
    expect(feedback).toContain("Function should return");
  })
  
  test("Test submit correct solution and verify success message", async ({ page }) => {
    await page.fill("textarea", "def hello(): return 'Hello'");
  
    await page.click("button:text('Submit for grading')")
  
    // check that tests fail and have some feedback
    await page.waitForSelector("pre:text('✅ All tests passed!')");
    const feedback = await page.locator("pre").innerText();
    expect(feedback).toContain("✅ All tests passed!");
  })
  
  test("Test submitting correct solution can move on to new assignment", async ({ page }) => {
    
    await page.fill("textarea", "def hello(): return 'Hello'");
  
    await page.click("button:text('Submit for grading')")
  
    await page.waitForSelector("pre:text('✅ All tests passed!')");
    
    // button should be visible once a correct solution is submitted
    const nextAssignmentButton = page.locator("button:text('Next Assignment')");
    await expect(nextAssignmentButton).toBeVisible();
  
    // store the initial assignment dislayed
    const assignmentTitle = await page.locator("[data-testid='assignment-title']").innerText();
    const assignmentHandout = await page.locator("[data-testid='assignment-handout']").innerText();
    await expect(assignmentTitle).toContain("Hello");
  
    // move on to next assignment
    await page.click("button:text('Next Assignment')");
    await page.waitForTimeout(1000); // wait for load
  
    const newAssignmentTitle = await page.locator("[data-testid='assignment-title']").innerText();
    const newAssignmentHandout = await page.locator("[data-testid='assignment-handout']").innerText();
    expect(newAssignmentTitle).not.toEqual(assignmentTitle);
    expect(newAssignmentHandout).not.toEqual(assignmentHandout);
  })  

});

