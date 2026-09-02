# Reviews Moderation, Helpful Votes & Reviewer Badges

Give the admin control over which reviews go public, let readers mark reviews as helpful, and reward frequent reviewers with badges.

## 1. Moderation

- Every new review is submitted as **Pending** and is not shown in the Catalogue or book page until the admin approves it.
- After submitting, the reader sees a short notice: "Your review was sent for approval."
- Admin Reviews page gets tabs: **Pending**, **Approved**, **Hidden**, plus the existing search.
- Each row gets **Approve**, **Hide** and **Delete** actions, with a count badge on the Pending tab so new reviews are easy to spot.
- Hiding an approved review removes it from public view without deleting it; it can be approved again later.
- Book star rating and review count are calculated from approved reviews only, so pending or hidden reviews never affect a book's rating.
- Bulk select with "Approve selected" / "Hide selected" for fast clearing of the queue.

## 2. Helpful votes

- Each public review card gets a "Helpful" button with a count.
- One vote per reader per review, remembered on that device so the button switches to a voted state and can be un-voted.
- Reviews on a book page are ordered by helpful votes first, then newest.
- Admin review rows show the helpful count too.

## 3. Reviewer badges

Badges are earned from the number of approved reviews a reader has written and appear next to the reader's name on review cards and on the leaderboard detail view:

- 1-2 approved reviews: **New Reviewer**
- 3-9: **Active Reviewer**
- 10-24: **Star Reviewer**
- 25+: **Top Reviewer**

An extra **Helpful Voice** badge appears when a reader's reviews have collected 10 or more helpful votes in total.

## Technical notes

Database (one migration):

- `reviews`: add `status text not null default 'pending'` (`pending` | `approved` | `hidden`), `helpful_count integer not null default 0`, and an index on `status`. Existing rows are set to `approved` so nothing currently visible disappears.
- New table `review_votes` (`review_id` referencing `reviews` with cascade delete, `voter_key text`, unique on the pair) with public grants and permissive policies matching the app's existing anon-access pattern; `helpful_count` maintained by a trigger on insert/delete.
- Update `update_book_rating()` so the average and total count only aggregate rows where `status = 'approved'`, and make it fire on status changes as well.

Frontend:

- `src/lib/store.ts`: `getReviews` accepts a status filter (public reads default to approved); add `updateReviewStatus`, `voteReviewHelpful`, `removeReviewVote`, and a reviewer-stats helper for badge computation.
- `src/pages/admin/ReviewsManagement.tsx`: tabs, bulk selection, approve/hide actions, helpful column.
- `src/components/ReviewCard.tsx`: helpful button, vote state via `localStorage` key, badge chip next to the name.
- `src/components/ReviewForm.tsx`: pending-approval notice after submit.
- `src/pages/BookDetail.tsx`: fetch approved reviews only, sort by helpfulness, pass badge data.
- Badge chip rendered with existing semantic tokens (no hardcoded colours) so it matches the strawberry-red theme in light and dark mode.
