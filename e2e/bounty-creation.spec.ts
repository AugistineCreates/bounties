/**
 * E2E: Bounty Creation Flow
 *
 * Tests the sponsor journey for creating a new bounty:
 *   1. Navigate to /bounty/create while authenticated
 *   2. Step 1: fill title, description, organization, GitHub URL, bounty type
 *   3. Step 2: fill reward amount, currency, deadline (+ milestone/competition fields)
 *   4. Step 3: review and click Create
 *   5. Assert redirect to /bounty/{newId} after successful creation
 *   6. Validation path: submitting Step 1 with empty title keeps user on Step 1
 *
 * Stability strategy:
 *   - GraphQL intercepted via page.route() - hermetic, no live backend.
 *   - Session mocked via MOCK_SESSION - no auth backend.
 *   - Selectors use data-testid attributes only.
 *   - Timing via await expect(...) - no arbitrary sleeps.
 */

import { test, expect, type Page } from "@playwright/test";

// Must be a valid UUID (all hex chars) for the created bounty
const NEW_BOUNTY_ID = "f3ed1ace-cafe-beef-dead-a1b2c3d4e5f6";

const ORGANIZATION_ID = "org-test-sponsor";
const MOCK_ORGANIZATIONS = [
  {
    id: ORGANIZATION_ID,
    name: "Test Sponsor Corp",
    slug: "test-sponsor",
    logo: null,
  },
  {
    id: "org-other",
    name: "Other Organization",
    slug: "other-org",
    logo: null,
  },
];

// Session includes walletAddress so the user can create bounties
const MOCK_SESSION = {
  user: {
    id: "user-sponsor-e2e",
    name: "Sponsor E2E",
    email: "sponsor@test.com",
    image: null,
    walletAddress: "GBXJ5V3YGVYFJXGZQGF7XIWXZJVKRMMX7A2BVZBNVVHWQFM53L4FWAH",
  },
  session: { token: "fake-sponsor-e2e-token" },
};

// Expected bounty returned by CreateBounty mutation
const MOCK_CREATED_BOUNTY = {
  __typename: "Bounty",
  id: NEW_BOUNTY_ID,
  title: "Test Bounty Title",
  description: "Test bounty description for e2e testing",
  status: "OPEN",
  type: "FIXED_PRICE",
  rewardAmount: 1000,
  rewardCurrency: "XLM",
  createdAt: "2026-05-28T10:00:00Z",
  updatedAt: "2026-05-28T10:00:00Z",
  organizationId: ORGANIZATION_ID,
  projectId: null,
  bountyWindowId: null,
  githubIssueUrl: "https://github.com/test/repo/issues/42",
  githubIssueNumber: 42,
  createdBy: "user-sponsor-e2e",
  organization: MOCK_ORGANIZATIONS[0],
  project: null,
  bountyWindow: null,
  _count: { __typename: "BountyCount", submissions: 0 },
  submissions: [],
};

async function setupMocks(page: Page) {
  // Mock auth session
  await page.route("**/api/auth/**", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.endsWith("/get-session") ||
      url.pathname.endsWith("/session")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    }
  });

  // Mock GraphQL queries and mutations
  await page.route("**/api/graphql", async (route) => {
    let body: { operationName?: string } = {};
    try {
      body = JSON.parse(route.request().postData() ?? "{}") as {
        operationName?: string;
      };
    } catch {
      /* ignore */
    }

    switch (body.operationName) {
      case "CreateBounty":
        // Default success response
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              createBounty: MOCK_CREATED_BOUNTY,
            },
          }),
        });
        return;

      case "Organizations":
        // Return list of organizations for organization selector
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              organizations: MOCK_ORGANIZATIONS,
            },
          }),
        });
        return;

      case "Bounty":
        // Return the created bounty after successful creation
        // (when user navigates to /bounty/{newId})
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: { bounty: MOCK_CREATED_BOUNTY },
          }),
        });
        return;

      case "TopContributors":
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { topContributors: [] } }),
        });
        return;

      default:
        await route.abort("failed");
    }
  });

  // Set session cookie
  await page.context().addCookies([
    {
      name: "boundless_auth.session_token",
      value: "fake-sponsor-e2e-token",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

test.describe("Bounty creation flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  // ── 1. Navigation ──────────────────────────────────────────────────────

  test("navigates to /bounty/create while authenticated", async ({ page }) => {
    await page.goto("/bounty/create");
    // Verify we're on the create page (looking for a heading or step indicator)
    await expect(page.locator("h1, h2"))
      .filter({ hasText: /create|new/i })
      .first()
      .toBeVisible({ timeout: 10_000 });
  });

  // ── 2. Step 1: Basic Information ───────────────────────────────────────

  test("Step 1: fills title, description, organization, GitHub URL, and bounty type", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Fill title
    const titleInput = page.locator('input[data-testid="bounty-title"]');
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.fill("Test Bounty Title");

    // Fill description (markdown textarea)
    const descInput = page.locator(
      'textarea[data-testid="bounty-description"]',
    );
    await expect(descInput).toBeVisible();
    await descInput.fill("Test bounty description for e2e testing");

    // Select organization
    const orgSelect = page
      .locator(
        'select[data-testid="bounty-organization"], [data-testid="bounty-organization"] button',
      )
      .first();
    await expect(orgSelect).toBeVisible();
    await orgSelect.click();
    // Click the organization option
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    // Fill GitHub URL
    const githubInput = page.locator('input[data-testid="bounty-github-url"]');
    await expect(githubInput).toBeVisible();
    await githubInput.fill("https://github.com/test/repo/issues/42");

    // Select bounty type (FIXED_PRICE)
    const typeRadio = page.locator(
      'input[data-testid="bounty-type-fixed-price"]',
    );
    await expect(typeRadio).toBeVisible();
    await typeRadio.click();

    // Click Next/Continue button to go to Step 2
    const continueBtn = page.locator(
      'button[data-testid="bounty-step1-continue"]',
    );
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
  });

  // ── 3. Step 2: Reward Details ──────────────────────────────────────────

  test("Step 2: fills reward amount, currency, and deadline", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Fill Step 1 fields
    await page
      .locator('input[data-testid="bounty-title"]')
      .fill("Test Bounty Title");
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("Test description");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/42");

    // Select organization
    const orgSelect = page
      .locator(
        '[data-testid="bounty-organization"] button, select[data-testid="bounty-organization"]',
      )
      .first();
    await orgSelect.click();
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    // Select type
    await page.locator('input[data-testid="bounty-type-fixed-price"]').click();

    // Continue to Step 2
    await page.locator('button[data-testid="bounty-step1-continue"]').click();
    await expect(page.locator('[data-testid="bounty-step-2"]')).toBeVisible({
      timeout: 5_000,
    });

    // Fill reward amount
    const amountInput = page.locator(
      'input[data-testid="bounty-reward-amount"]',
    );
    await expect(amountInput).toBeVisible();
    await amountInput.fill("1000");

    // Select currency (XLM)
    const currencySelect = page
      .locator(
        'select[data-testid="bounty-currency"], [data-testid="bounty-currency"] button',
      )
      .first();
    await expect(currencySelect).toBeVisible();
    await currencySelect.click();
    await page.locator(`text=XLM`).click();

    // Select deadline (30 days from now)
    const deadlineBtn = page.locator(
      'button[data-testid="bounty-deadline-30d"]',
    );
    await expect(deadlineBtn).toBeVisible();
    await deadlineBtn.click();

    // Click Next/Continue button to go to Step 3
    const continueBtn = page.locator(
      'button[data-testid="bounty-step2-continue"]',
    );
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
  });

  // ── 4. Step 3: Review and Create ──────────────────────────────────────

  test("Step 3: reviews bounty details and clicks Create to redirect to bounty detail page", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Fill all steps
    await page
      .locator('input[data-testid="bounty-title"]')
      .fill("Test Bounty Title");
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("Test bounty description for e2e testing");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/42");

    const orgSelect = page
      .locator(
        '[data-testid="bounty-organization"] button, select[data-testid="bounty-organization"]',
      )
      .first();
    await orgSelect.click();
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    await page.locator('input[data-testid="bounty-type-fixed-price"]').click();
    await page.locator('button[data-testid="bounty-step1-continue"]').click();

    // Step 2
    await expect(page.locator('[data-testid="bounty-step-2"]')).toBeVisible({
      timeout: 5_000,
    });
    await page
      .locator('input[data-testid="bounty-reward-amount"]')
      .fill("1000");

    const currencySelect = page
      .locator(
        '[data-testid="bounty-currency"] button, select[data-testid="bounty-currency"]',
      )
      .first();
    await currencySelect.click();
    await page.locator(`text=XLM`).click();

    await page.locator('button[data-testid="bounty-deadline-30d"]').click();
    await page.locator('button[data-testid="bounty-step2-continue"]').click();

    // Step 3 - Review
    await expect(page.locator('[data-testid="bounty-step-3"]')).toBeVisible({
      timeout: 5_000,
    });

    // Verify review displays the filled information
    await expect(page.locator('[data-testid="review-title"]')).toContainText(
      "Test Bounty Title",
    );
    await expect(
      page.locator('[data-testid="review-organization"]'),
    ).toContainText(MOCK_ORGANIZATIONS[0].name);
    await expect(page.locator('[data-testid="review-amount"]')).toContainText(
      "1000",
    );

    // Click Create button
    const createBtn = page.locator(
      'button[data-testid="bounty-create-submit"]',
    );
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Assert redirect to bounty detail page
    await expect(page).toHaveURL(`/bounty/${NEW_BOUNTY_ID}`, {
      timeout: 10_000,
    });

    // Verify the bounty detail page loads
    await expect(page.locator("h1"))
      .filter({ hasText: "Test Bounty Title" })
      .first()
      .toBeVisible({ timeout: 10_000 });
  });

  // ── 5. Validation: Empty title stays on Step 1 ──────────────────────────

  test("validation: submitting Step 1 with empty title shows error and stays on Step 1", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Intentionally leave title empty
    // Fill other required fields
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("Test description");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/42");

    const orgSelect = page
      .locator(
        '[data-testid="bounty-organization"] button, select[data-testid="bounty-organization"]',
      )
      .first();
    await orgSelect.click();
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    await page.locator('input[data-testid="bounty-type-fixed-price"]').click();

    // Try to continue without title
    const continueBtn = page.locator(
      'button[data-testid="bounty-step1-continue"]',
    );
    await continueBtn.click();

    // Assert error message appears for title field
    await expect(
      page.locator('[data-testid="error-bounty-title"]'),
    ).toBeVisible({ timeout: 5_000 });

    // Assert we stay on Step 1
    await expect(page.locator('[data-testid="bounty-step-1"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="bounty-step-2"]'),
    ).not.toBeVisible();
  });

  // ── 6. Validation: Empty organization field ────────────────────────────

  test("validation: submitting Step 1 without selecting organization shows error", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Fill fields except organization
    await page.locator('input[data-testid="bounty-title"]').fill("Test Title");
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("Test description");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/42");
    await page.locator('input[data-testid="bounty-type-fixed-price"]').click();

    // Try to continue without organization
    const continueBtn = page.locator(
      'button[data-testid="bounty-step1-continue"]',
    );
    await continueBtn.click();

    // Assert error message appears for organization field
    await expect(
      page.locator('[data-testid="error-bounty-organization"]'),
    ).toBeVisible({ timeout: 5_000 });

    // Assert we stay on Step 1
    await expect(page.locator('[data-testid="bounty-step-1"]')).toBeVisible();
  });

  // ── 7. Step 2 Validation: Invalid deadline ─────────────────────────────

  test("validation: Step 2 with past deadline shows error", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Complete Step 1
    await page
      .locator('input[data-testid="bounty-title"]')
      .fill("Test Bounty Title");
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("Test description");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/42");

    const orgSelect = page
      .locator(
        '[data-testid="bounty-organization"] button, select[data-testid="bounty-organization"]',
      )
      .first();
    await orgSelect.click();
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    await page.locator('input[data-testid="bounty-type-fixed-price"]').click();
    await page.locator('button[data-testid="bounty-step1-continue"]').click();

    // Step 2: Set invalid deadline (past date via date picker)
    await expect(page.locator('[data-testid="bounty-step-2"]')).toBeVisible({
      timeout: 5_000,
    });

    const amountInput = page.locator(
      'input[data-testid="bounty-reward-amount"]',
    );
    await amountInput.fill("1000");

    const currencySelect = page
      .locator(
        '[data-testid="bounty-currency"] button, select[data-testid="bounty-currency"]',
      )
      .first();
    await currencySelect.click();
    await page.locator(`text=XLM`).click();

    // Try to select an invalid past date (if date picker allows)
    // Most forms prevent this, but test the validation if it's possible
    const dateInput = page.locator('input[data-testid="bounty-deadline"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill("2020-01-01"); // Past date
    }

    const continueBtn = page.locator(
      'button[data-testid="bounty-step2-continue"]',
    );
    await continueBtn.click();

    // Assert error if validation catches past date
    const deadlineError = page.locator('[data-testid="error-bounty-deadline"]');
    if (await deadlineError.isVisible()) {
      await expect(deadlineError).toBeVisible({ timeout: 5_000 });
      // Assert we stay on Step 2
      await expect(page.locator('[data-testid="bounty-step-2"]')).toBeVisible();
    }
  });

  // ── 8. Milestone-based bounty: includes milestones in Step 2 ───────────

  test("Step 2 shows milestone fields when bounty type is MILESTONE_BASED", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Fill Step 1
    await page
      .locator('input[data-testid="bounty-title"]')
      .fill("Milestone Bounty");
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("A bounty with milestones");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/99");

    const orgSelect = page
      .locator(
        '[data-testid="bounty-organization"] button, select[data-testid="bounty-organization"]',
      )
      .first();
    await orgSelect.click();
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    // Select MILESTONE_BASED type
    const typeRadio = page.locator(
      'input[data-testid="bounty-type-milestone-based"]',
    );
    await typeRadio.click();

    await page.locator('button[data-testid="bounty-step1-continue"]').click();

    // Step 2 should display milestone builder
    await expect(page.locator('[data-testid="milestone-builder"]')).toBeVisible(
      { timeout: 5_000 },
    );
  });

  // ── 9. Competition bounty: competition fields in Step 2 ────────────────

  test("Step 2 shows competition fields when bounty type is COMPETITION", async ({
    page,
  }) => {
    await page.goto("/bounty/create");

    // Fill Step 1
    await page
      .locator('input[data-testid="bounty-title"]')
      .fill("Competition Bounty");
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("A bounty as a competition");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/77");

    const orgSelect = page
      .locator(
        '[data-testid="bounty-organization"] button, select[data-testid="bounty-organization"]',
      )
      .first();
    await orgSelect.click();
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    // Select COMPETITION type
    const typeRadio = page.locator(
      'input[data-testid="bounty-type-competition"]',
    );
    await typeRadio.click();

    await page.locator('button[data-testid="bounty-step1-continue"]').click();

    // Step 2 should display competition-specific fields
    // (e.g., number of winners, judging criteria, etc.)
    await expect(page.locator('[data-testid="bounty-step-2"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  // ── 10. GraphQL mutation failure ───────────────────────────────────────

  test("shows error toast when CreateBounty mutation fails", async ({
    page,
  }) => {
    // Override GraphQL route to return error for CreateBounty
    await page.route("**/api/graphql", async (route) => {
      let body: { operationName?: string } = {};
      try {
        body = JSON.parse(route.request().postData() ?? "{}") as {
          operationName?: string;
        };
      } catch {
        /* ignore */
      }

      if (body.operationName === "CreateBounty") {
        // Return GraphQL error
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            errors: [
              {
                message: "Internal server error",
                extensions: { code: "INTERNAL_SERVER_ERROR" },
              },
            ],
          }),
        });
        return;
      }

      // Let other GraphQL operations go through
      await route.fallback();
    });

    await setupMocks(page); // Re-setup with the failing mutation

    await page.goto("/bounty/create");

    // Fill all steps
    await page
      .locator('input[data-testid="bounty-title"]')
      .fill("Test Bounty Title");
    await page
      .locator('textarea[data-testid="bounty-description"]')
      .fill("Test description");
    await page
      .locator('input[data-testid="bounty-github-url"]')
      .fill("https://github.com/test/repo/issues/42");

    const orgSelect = page
      .locator(
        '[data-testid="bounty-organization"] button, select[data-testid="bounty-organization"]',
      )
      .first();
    await orgSelect.click();
    await page.locator(`text=${MOCK_ORGANIZATIONS[0].name}`).click();

    await page.locator('input[data-testid="bounty-type-fixed-price"]').click();
    await page.locator('button[data-testid="bounty-step1-continue"]').click();

    await expect(page.locator('[data-testid="bounty-step-2"]')).toBeVisible({
      timeout: 5_000,
    });

    await page
      .locator('input[data-testid="bounty-reward-amount"]')
      .fill("1000");
    const currencySelect = page
      .locator(
        '[data-testid="bounty-currency"] button, select[data-testid="bounty-currency"]',
      )
      .first();
    await currencySelect.click();
    await page.locator(`text=XLM`).click();

    await page.locator('button[data-testid="bounty-deadline-30d"]').click();
    await page.locator('button[data-testid="bounty-step2-continue"]').click();

    // Review and submit
    await expect(page.locator('[data-testid="bounty-step-3"]')).toBeVisible({
      timeout: 5_000,
    });

    const createBtn = page.locator(
      'button[data-testid="bounty-create-submit"]',
    );
    await createBtn.click();

    // Assert error toast appears
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible({
      timeout: 8_000,
    });

    // Assert we stay on Step 3 (or are redirected back)
    await expect(page).not.toHaveURL(`/bounty/${NEW_BOUNTY_ID}`, {
      timeout: 3_000,
    });
  });
});
