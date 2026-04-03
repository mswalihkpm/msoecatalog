

## Plan: Support Embedded Cover Images in Bulk Upload

### What changes
Update the bulk upload logic in `src/pages/admin/BooksManagement.tsx` to extract embedded images from Excel files and upload them to storage, while keeping the "Bulk Upload Format" info box exactly as it is now.

### How it works
1. **Switch from `xlsx` to `exceljs`** for parsing bulk uploads — `exceljs` can read embedded images from Excel files, while `xlsx` (SheetJS) cannot.
2. **Extract embedded images** from the uploaded workbook using `workbook.getImages()` or the worksheet's image collection.
3. **Match images to rows** by their anchor position (the row the image is placed in).
4. **Upload each image** to the `book-covers` storage bucket using the existing `uploadCoverToStorage` pattern.
5. **Assign the resulting public URL** to the corresponding book's `coverImage` field.
6. **No changes to the Bulk Upload Format info box** — it stays exactly as shown.

### File modified
- `src/pages/admin/BooksManagement.tsx` — update `handleBulkUpload` to use `exceljs` for parsing, extract embedded images, and upload them.

### Technical details

The `exceljs` library (already installed) provides access to worksheet images via `worksheet.getImages()`, which returns objects with `imageId` and `range` (anchor row/col). The image buffer is retrieved via `workbook.getImage(imageId)`. Each image is converted to a `File`, uploaded to Supabase storage, and the public URL is set as the book's `coverImage`.

```text
Excel file with embedded images
  ↓ parse with exceljs
  ↓ extract rows → book data
  ↓ extract images → match to rows by anchor position
  ↓ upload each image to storage
  ↓ assign URL to book.coverImage
  ↓ bulkAddBooks(books)
```

