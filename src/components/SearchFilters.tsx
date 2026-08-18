import { useState } from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
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
  "General",
  "Science",
  "History",
  "English",
  "Autobiography",
  "Biography",
  "Travelogue",
  "Arabic",
  "Poem",
  "English Novel",
  "Story",
  "Novel",
  "English Story",
  "Language",
  "Others",
];


export interface AdvancedFilters {
  title: string;
  author: string;
  numberCode: string;
  siNumber: string;
}

export const emptyAdvancedFilters: AdvancedFilters = {
  title: "",
  author: "",
  numberCode: "",
  siNumber: "",
};

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  availabilityFilter: string;
  onAvailabilityChange: (availability: string) => void;
  onClearFilters: () => void;
  advancedFilters?: AdvancedFilters;
  onAdvancedFiltersChange?: (filters: AdvancedFilters) => void;
}

export const SearchFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availabilityFilter,
  onAvailabilityChange,
  onClearFilters,
  advancedFilters = emptyAdvancedFilters,
  onAdvancedFiltersChange,
}: SearchFiltersProps) => {
  const advancedEntries: { key: keyof AdvancedFilters; label: string; placeholder: string }[] = [
    { key: "title", label: "Title", placeholder: "e.g. Riyad us Saliheen" },
    { key: "author", label: "Author", placeholder: "e.g. Imam Nawawi" },
    { key: "numberCode", label: "Number code", placeholder: "e.g. EN-102" },
    { key: "siNumber", label: "SI number", placeholder: "e.g. 245" },
  ];

  const activeAdvancedCount = advancedEntries.filter((f) => advancedFilters[f.key].trim()).length;
  const [advancedOpen, setAdvancedOpen] = useState(activeAdvancedCount > 0);

  const setAdvancedField = (key: keyof AdvancedFilters, value: string) => {
    onAdvancedFiltersChange?.({ ...advancedFilters, [key]: value });
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || availabilityFilter !== "all" || activeAdvancedCount > 0;

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

      {onAdvancedFiltersChange && (
        <div className="rounded-lg border border-border/60 bg-card/40">
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium"
            aria-expanded={advancedOpen}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Advanced search
              {activeAdvancedCount > 0 && (
                <Badge variant="secondary" className="ml-1">{activeAdvancedCount}</Badge>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </button>

          {advancedOpen && (
            <div className="grid grid-cols-1 gap-3 border-t border-border/60 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {advancedEntries.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`adv-${field.key}`} className="text-xs text-muted-foreground">
                    {field.label}
                  </Label>
                  <Input
                    id={`adv-${field.key}`}
                    placeholder={field.placeholder}
                    value={advancedFilters[field.key]}
                    onChange={(e) => setAdvancedField(field.key, e.target.value)}
                  />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger>
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
              </div>
              {activeAdvancedCount > 0 && (
                <div className="flex items-end sm:col-span-2 lg:col-span-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => onAdvancedFiltersChange(emptyAdvancedFilters)}
                  >
                    Clear advanced fields
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
