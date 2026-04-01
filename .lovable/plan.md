

## Plan: Update Catalog Book Sorting Order

**File to modify:** `src/pages/Catalog.tsx`

**Change:** Update the sort function in the `filteredBooks` `useMemo` to use a three-level sort:

1. **Rating descending** — higher-rated books appear first
2. **Has cover image** — books with an uploaded cover photo come before those without
3. **Alphabetical by title** — within the same rating and cover-photo status, sort A→Z

**Implementation:**
Replace the current `.sort((a, b) => b.averageRating - a.averageRating)` with:

```ts
return filtered.sort((a, b) => {
  // 1. Higher rating first
  if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
  // 2. Books with cover photo first
  const aCover = a.coverImage ? 1 : 0;
  const bCover = b.coverImage ? 1 : 0;
  if (bCover !== aCover) return bCover - aCover;
  // 3. Alphabetical by title
  return a.title.localeCompare(b.title);
});
```

Single file, ~5 lines changed.

