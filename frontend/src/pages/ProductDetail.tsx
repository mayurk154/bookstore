import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BookGrid from '@/components/books/BookGrid';
import EmptyState from '@/components/common/EmptyState';
import { mockBooks } from '@/utils/mockData';
import { formatPrice, discountedPrice } from '@/utils';
import { useCartStore } from '@/store/cartStore';

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{rating}</span>
      <span className="text-sm text-muted-foreground">({count.toLocaleString()} reviews)</span>
    </div>
  );
}

// ─── Mock reviews ─────────────────────────────────────────────────────────────
const mockReviews = [
  { id: 'r1', user: 'Priya S.', rating: 5, comment: 'An absolute masterpiece. Couldn\'t put it down.', date: '2024-02-10' },
  { id: 'r2', user: 'Rajan K.', rating: 4, comment: 'Very well written. Highly recommend to everyone.', date: '2024-01-25' },
  { id: 'r3', user: 'Meera T.', rating: 5, comment: 'Changed my perspective completely. A must-read!', date: '2024-01-18' },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const book = mockBooks.find((b) => b.id === id);

  if (!book) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Book not found"
          description="This book doesn't exist or has been removed."
          action={
            <Button asChild>
              <Link to="/catalogue">Browse catalogue</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const finalPrice = discountedPrice(book.price, book.discountPct);
  const savings = book.price - finalPrice;
  const relatedBooks = mockBooks.filter(
    (b) =>
      b.id !== book.id &&
      b.categories.some((c) => book.categories.some((bc) => bc.id === c.id))
  );

  const handleAddToCart = () => {
    addItem(book, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(book, quantity);
    navigate('/cart');
  };

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/catalogue" className="hover:text-foreground">Catalogue</Link>
        {book.categories[0] && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/catalogue/${book.categories[0].slug}`} className="hover:text-foreground">
              {book.categories[0].name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[200px]">{book.title}</span>
      </nav>

      {/* Main product section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-[auto_1fr_360px] gap-8 mb-12">
        {/* Cover */}
        <div className="flex justify-center md:justify-start">
          <div className="relative w-52 md:w-60 lg:w-64 flex-shrink-0">
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              className="w-full aspect-[3/4] object-cover rounded-xl shadow-xl"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  `https://placehold.co/240x320/e5e7eb/94a3b8?text=${encodeURIComponent(book.title.slice(0, 10))}`;
              }}
            />
            {book.discountPct > 0 && (
              <Badge className="absolute top-3 left-3">-{book.discountPct}%</Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            {book.categories.map((c) => (
              <Badge key={c.id} variant="secondary" className="mr-1 mb-1 text-xs">
                {c.name}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{book.title}</h1>
          <p className="text-lg text-muted-foreground">by <span className="text-foreground font-medium">{book.author}</span></p>
          <p className="text-sm text-muted-foreground">Published by {book.publisher.name}</p>

          <StarRating rating={book.rating} count={book.reviewCount} />

          <p className="text-sm leading-relaxed text-muted-foreground">{book.description}</p>

          {/* Book metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'ISBN', value: book.isbn },
              { label: 'Pages', value: book.pages },
              { label: 'Language', value: book.language },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Price box */}
        <div className="rounded-xl border p-5 space-y-4 h-fit sticky top-20">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatPrice(finalPrice)}</span>
              {book.discountPct > 0 && (
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(book.price)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-sm text-green-600 font-medium mt-1">
                You save {formatPrice(savings)} ({book.discountPct}% off)
              </p>
            )}
          </div>

          <Separator />

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${book.stock > 5 ? 'bg-green-500' : book.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
            />
            <span>
              {book.stock > 5
                ? 'In stock'
                : book.stock > 0
                ? `Only ${book.stock} left`
                : 'Out of stock'}
            </span>
          </div>

          {/* Quantity selector */}
          {book.stock > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))}
                  disabled={quantity >= book.stock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full gap-2"
              onClick={handleAddToCart}
              disabled={book.stock === 0 || addedToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              {addedToCart ? '✓ Added to cart!' : 'Add to Cart'}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleBuyNow}
              disabled={book.stock === 0}
            >
              <Zap className="h-4 w-4" />
              Buy Now
            </Button>
          </div>

          <Separator />

          {/* Delivery trust */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 flex-shrink-0" />
              Free delivery on orders above ₹499
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 flex-shrink-0" />
              100% secure payment
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 flex-shrink-0" />
              Easy 30-day returns
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>
        <div className="space-y-4">
          {mockReviews.map((review) => (
            <div key={review.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{review.user}</p>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-none text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-6">You Might Also Like</h2>
          <BookGrid books={relatedBooks.slice(0, 4)} columns={4} />
        </section>
      )}
    </div>
  );
}
