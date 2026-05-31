/**
 * E2E: Request Revisions Flow
 *
 * Tests the reviewer-side "Request Revisions" action on a MILESTONE_BASED bounty
 * in UNDER_REVIEW status, and the contributor-side feedback banner.
 *
 * Stability strategy:
 *   - GraphQL intercepted via page.route() - hermetic, no live backend.
 *   - Selectors use visible text / roles only (no data-testid added to new UI yet).
 *   - Timing via await expect(...) - no arbitrary sleeps.
 */

import { test, expect, type Page } from "@playwright/test";

const BOUNTY_ID = "e2ec0bcd-dead-beef-cafe-ab01cd02ef05";
const SUBMISSION_ID = "sub-0001";
const CREATOR_ID = "user-creator-001";
const CONTRIBUTOR_ID = "user-contributor-001";
const WALLET_ADDRESS =
  "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGYWDOUALPIF5JD4PI21JQ";

const MOCK_BOUNTY_UNDER_REVIEW = {
  __typename: "Bounty",
  id: BOUNTY_ID,
  title: "Implement ZKP primitives",
  description: "Build zero-knowledge proof primitives.",
  status: "UNDER_REVIEW",
  type: "MILESTONE_BASED",
  rewardAmount: 1000,
  rewardCurrency: "XLM",
  createdAt: "2025-01-10T09:00:00Z",
  updatedAt: "2025-01-24T14:20:00Z",
  organizationId: "org-test",
  projectId: null,
  bountyWindowId: null,
  githubIssueUrl: "https://github.com/test/repo/issues/1",
  githubIssueNumber: 1,
  createdBy: CREATOR_ID,
  organization: {
    __typename: "BountyOrganization",
    id: "org-test",
    name: "Test Org",
    logo: null,
    slug: "test-org",
  },
  project: null,
  bountyWindow: null,
  _count: { __typename: "BountyCount", submissions: 1 },
  submissions: [
    {
      __typename: "BountySubmissionType",
      id: SUBMISSION_ID,
      bountyId: BOUNTY_ID,
      submittedBy: CONTRIBUTOR_ID,
      githubPullRequestUrl: "QmFakeIpfsCid1234",
      status: "PENDING",
      reviewComments: null as string | null,
      reviewedAt: null,
      reviewedBy: null,
      paidAt: null,
      rewardTransactionHash: null,
      createdAt: "2025-01-20T10:00:00Z",
      updatedAt: "2025-01-20T10:00:00Z",
      submittedByUser: {
        __typename: "BountySubmissionUser",
        id: CONTRIBUTOR_ID,
        name: "Test Contributor",
        image: null,
      },
      reviewedByUser: null,
    },
  ],
  milestones: [{ id: "m1", title: "Milestone 1", isCompleted: false }],
  contributorProgress: null,
  maxSlots: null,
  totalSlotsOccupied: null,
};

const MOCK_BOUNTY_WITH_REVISION = {
  ...MOCK_BOUNTY_UNDER_REVIEW,
  submissions: [
    {
      ...MOCK_BOUNTY_UNDER_REVIEW.submissions[0],
      status: "REVISION_REQUESTED",
      reviewComments: "Please add unit tests for the auth flow.",
    },
  ],
};

function makeSession(userId: string) {
  return {
    user: {
      id: userId,
      name: userId === CREATOR_ID ? "Test Creator" : "Test Contributor",
      email: `${userId}@test.com`,
      image: null,
      walletAddress: WALLET_ADDRESS,
    },
    session: { token: "fake-e2e-token" },
  };
}

async function setupMocks(
  page: Page,
  options: {
    userId: string;
    bountyData?: typeof MOCK_BOUNTY_UNDER_REVIEW;
    revisionMutationResult?: object;
  },
) {
  const {
    userId,
    bountyData = MOCK_BOUNTY_UNDER_REVIEW,
    revisionMutationResult,
  } = options;

  await page.route("**/api/auth/**", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.endsWith("/get-session") ||
      url.pathname.endsWith("/session")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeSession(userId)),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    }
  });

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
      case "Bounty":
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { bounty: bountyData } }),
        });
        return;
      case "ReviewSubmission":
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              reviewSubmission:
                revisionMutationResult ??
                MOCK_BOUNTY_WITH_REVISION.submissions[0],
            },
          }),
        });
        return;
      case "TopContributors":
      case "Leaderboard":
      case "GetLeaderboardUser":
      case "LeaderboardUser":
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: {} }),
        });
        return;
      default:
        await route.abort("failed");
    }
  });

  await page.context().addCookies([
    {
      name: "boundless_auth.session_token",
      value: "fake-e2e-token",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

// ── Reviewer side ──────────────────────────────────────────────────────────

test.describe("Request Revisions — reviewer side", () => {
  // CardTitle renders as <div>, not <h*>, so we use getByText instead of getByRole("heading")
  test("approval panel is visible when bounty is UNDER_REVIEW and user is creator", async ({
    page,
  }) => {
    await setupMocks(page, { userId: CREATOR_ID });
    await page.goto(`/bounty/${BOUNTY_ID}`);
    await expect(page.getByText("Review Submission").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("clicking Request Revisions reveals feedback textarea", async ({
    page,
  }) => {
    await setupMocks(page, { userId: CREATOR_ID });
    await page.goto(`/bounty/${BOUNTY_ID}`);
    await expect(page.getByText("Review Submission").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Request Revisions/i }).click();
    await expect(page.getByLabel(/Revision Feedback/i)).toBeVisible();
  });

  test("Send Request is disabled when textarea is empty", async ({ page }) => {
    await setupMocks(page, { userId: CREATOR_ID });
    await page.goto(`/bounty/${BOUNTY_ID}`);
    await expect(page.getByText("Review Submission").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Request Revisions/i }).click();
    await expect(
      page.getByRole("button", { name: /Send Request/i }),
    ).toBeDisabled();
  });

  test("submitting feedback shows success toast and resets panel", async ({
    page,
  }) => {
    await setupMocks(page, { userId: CREATOR_ID });
    await page.goto(`/bounty/${BOUNTY_ID}`);
    await expect(page.getByText("Review Submission").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Request Revisions/i }).click();
    await page
      .getByLabel(/Revision Feedback/i)
      .fill("Please add unit tests for the auth flow.");
    await page.getByRole("button", { name: /Send Request/i }).click();

    await expect(page.getByText(/Revision request sent/i)).toBeVisible({
      timeout: 10_000,
    });

    // Panel resets — textarea gone, button visible again
    await expect(page.getByLabel(/Revision Feedback/i)).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /Request Revisions/i }),
    ).toBeVisible();
  });

  test("Cancel button hides textarea without submitting", async ({ page }) => {
    await setupMocks(page, { userId: CREATOR_ID });
    await page.goto(`/bounty/${BOUNTY_ID}`);
    await expect(page.getByText("Review Submission").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Request Revisions/i }).click();
    await page.getByLabel(/Revision Feedback/i).fill("Some feedback");
    await page.getByRole("button", { name: /Cancel/i }).click();

    await expect(page.getByLabel(/Revision Feedback/i)).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /Request Revisions/i }),
    ).toBeVisible();
  });
});

// ── Contributor side ───────────────────────────────────────────────────────

test.describe("Request Revisions — contributor side", () => {
  test("revision feedback banner is visible when submission has REVISION_REQUESTED status", async ({
    page,
  }) => {
    await setupMocks(page, {
      userId: CONTRIBUTOR_ID,
      bountyData: {
        ...MOCK_BOUNTY_WITH_REVISION,
        status: "UNDER_REVIEW",
      },
    });
    await page.goto(`/bounty/${BOUNTY_ID}`);

    await expect(page.getByText(/Revision Requested/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText(/Please add unit tests for the auth flow\./i),
    ).toBeVisible();
  });

  test("submit work form is still visible so contributor can resubmit", async ({
    page,
  }) => {
    await setupMocks(page, {
      userId: CONTRIBUTOR_ID,
      bountyData: {
        ...MOCK_BOUNTY_WITH_REVISION,
        status: "UNDER_REVIEW",
      },
    });
    await page.goto(`/bounty/${BOUNTY_ID}`);

    await expect(page.getByText("Submit Your Work").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
