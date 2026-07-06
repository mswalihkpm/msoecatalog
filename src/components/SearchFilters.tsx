import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/lib/types";

const categories: Category[] = [
  "Islamic",
  "Novel",
  "English Novel",
  "Story",
  "Biography",
  "Science",
  "English",
  "Arabic",
  "Language",
  "History",
  "General",
  "Travelogue",
  "Poem",
  "Others",
];


interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  availabilityFilter: string;
  onAvailabilityChange: (availability: string) => void;
  onClearFilters: () => void;
}

export const SearchFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availabilityFilter,
  onAvailabilityChange,
  onClearFilters,
}: SearchFiltersProps) => {
  const hasActiveFilters = searchQuery || selectedCategory !== "all" || availabilityFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, code, or publication..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={availabilityFilter} onValueChange={onAvailabilityChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="borrowed">Borrowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {selectedCategory && selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {selectedCategory}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onCategoryChange("all")}
              />
            </Badge>
          )}
          {availabilityFilter && availabilityFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {availabilityFilter === "available" ? "Available" : "Borrowed"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onAvailabilityChange("all")}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export { categories };
