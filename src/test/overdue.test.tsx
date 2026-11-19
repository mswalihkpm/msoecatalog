import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OverdueManagement from "@/pages/admin/OverdueManagement";

vi.mock("@/lib/store", () => ({
  getBorrowRecords: vi.fn().mockResolvedValue([]),
  getBooks: vi.fn().mockResolvedValue([]),
  getReadingRateVersions: vi.fn().mockResolvedValue([]),
  updateBorrowRecord: vi.fn().mockResolvedValue(undefined),
}));

describe("OverdueManagement", () => {
  it("renders without crashing and shows empty overdue state once loaded", async () => {
    render(<OverdueManagement />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /overdue books/i })).toBeInTheDocument();
      expect(screen.getByText("No overdue books. Everything is on time.")).toBeInTheDocument();
    });
  });
});
