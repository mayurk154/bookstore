import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import BookGrid from '@/components/books/BookGrid';
import EmptyState from '@/components/common/EmptyState';
import { mockBooks, mockCategories, mockPublishers } from '@/utils/mockData';
import { discountedPrice } from '@/utils';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'bestseller';

const sortOptions: { label: string; value: SortKey }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Sellers', value: 'bestseller' },
];

// ─── Filter Sidebar ────────────────────────────────────────────────────────────
interface FilterSidebarProps {
  selectedCategory: string;
  selectedBrand: string;
  minPrice: string;
  maxPrice: string;
  onCategoryChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  onClear: () => void;
}

function FilterSidebar({
  selectedCategory,
  selectedBrand,
  minPrice,
  maxPrice,
  onCategoryChange,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
}: FilterSidebarProps) {
  const hasFilters = selectedCategory || selectedBrand || minPrice || maxPrice;

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <Separator />

      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Category</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onCategoryChange('')}
            className={`block w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors ${!selectedCategory ? 'bg-muted font-medium' : ''}`}
          >
            All Categories
          </button>
          {mockCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`block w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors ${selectedCategory === cat.slug ? 'bg-muted font-medium' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Brand / Publisher */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Publisher</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onBrandChange('')}
            className={`block w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors ${!selectedBrand ? 'bg-muted font-medium' : ''}`}
          >
            All Publishers
          </button>
          {mockPublishers.map((pub) => (
            <button
              key={pub.id}
              onClick={() => onBrandChange(pub.id)}
              className={`block w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors ${selectedBrand === pub.id ? 'bg-muted font-medium' : ''}`}
            >
              {pub.name}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Price Range (₹)</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="h-8 text-sm"
            min={0}
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="h-8 text-sm"
            min={0}
          />
        </div>
      </div>

      {/* Delivery info */}
      <Separator />
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-sm">📦 Delivery Info</p>
        <p>Free delivery on orders above ₹499</p>
        <p>Standard: 3–5 business days</p>
        <p>Express: 1–2 business days (₹99)</p>
      </div>
    </aside>
  );
}

// ─── Catalogue Page ────────────────────────────────────────────────────────────
export default function Catalogue() {
  const { category: categoryParam } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam ?? searchParams.get('category') ?? ''
  );
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get('sort') as SortKey) ?? 'relevance'
  );
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
  };

  const activeFilterCount = [selectedCategory, selectedBrand, minPrice, maxPrice].filter(Boolean).length;

  // Filter + sort books (client-side using mock data)
  const filteredBooks = useMemo(() => {
    let books = [...mockBooks];

    if (search) {
      const q = search.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.includes(q)
      );
    }

    if (selectedCategory) {
      books = books.filter((b) =>
        b.categories.some((c) => c.slug === selectedCategory)
      );
    }

    if (selectedBrand) {
      books = books.filter((b) => b.publisher.id === selectedBrand);
    }

    if (minPrice) {
      books = books.filter(
        (b) => discountedPrice(b.price, b.discountPct) >= Number(minPrice)
      );
    }

    if (maxPrice) {
      books = books.filter(
        (b) => discountedPrice(b.price, b.discountPct) <= Number(maxPrice)
      );
    }

    switch (sort) {
      case 'price-asc':
        books.sort((a, b) => discountedPrice(a.price, a.discountPct) - discountedPrice(b.price, b.discountPct));
        break;
      case 'price-desc':
        books.sort((a, b) => discountedPrice(b.price, b.discountPct) - discountedPrice(a.price, a.discountPct));
        break;
      case 'rating':
        books.sort((a, b) => b.rating - a.rating);
        break;
      case 'bestseller':
        books.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }

    return books;
  }, [search, selectedCategory, selectedBrand, minPrice, maxPrice, sort]);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {selectedCategory
            ? mockCategories.find((c) => c.slug === selectedCategory)?.name ?? 'Catalogue'
            : search
            ? `Results for "${search}"`
            : 'All Books'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Category quick links */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Link to="/catalogue">
          <Badge variant={!selectedCategory ? 'default' : 'outline'} className="cursor-pointer">
            All
          </Badge>
        </Link>
        {mockCategories.map((cat) => (
          <Link key={cat.id} to={`/catalogue/${cat.slug}`}>
            <Badge
              variant={selectedCategory === cat.slug ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <FilterSidebar
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onCategoryChange={setSelectedCategory}
            onBrandChange={setSelectedBrand}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onClear={clearFilters}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sort + filter toggle bar */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden flex items-center gap-2"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="h-4 px-1 text-[10px]">{activeFilterCount}</Badge>
              )}
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile filter panel */}
          {sidebarOpen && (
            <div className="lg:hidden mb-6 rounded-lg border p-4">
              <FilterSidebar
                selectedCategory={selectedCategory}
                selectedBrand={selectedBrand}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onCategoryChange={setSelectedCategory}
                onBrandChange={setSelectedBrand}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                onClear={clearFilters}
              />
            </div>
          )}

          {/* Books */}
          {filteredBooks.length === 0 ? (
            <EmptyState
              title="No books found"
              description="Try adjusting your filters or search query."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <BookGrid books={filteredBooks} columns={4} />
          )}
        </div>
      </div>
    </div>
  );
}
