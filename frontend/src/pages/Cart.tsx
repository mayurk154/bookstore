import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Gift,
  Truck,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import BookGrid from '@/components/books/BookGrid';
import EmptyState from '@/components/common/EmptyState';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, maxRedeemablePoints } from '@/utils';
import { mockBooks } from '@/utils/mockData';

// ─── Cart Item Row ─────────────────────────────────────────────────────────────
function CartItemRow({ item }: { item: ReturnType<typeof useCartStore.getState>['items'][number] }) {
  const { updateQuantity, removeItem } = useCartStore();
  const { book, quantity } = item;
  const { discountPct, price } = book;
  const finalPrice = Math.round(price * (1 - discountPct / 100));

  return (
    <div className="flex gap-4 py-4">
      {/* Cover */}
      <Link to={`/books/${book.id}`} className="flex-shrink-0">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-16 h-[85px] sm:w-20 sm:h-[106px] object-cover rounded-lg"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://placehold.co/80x107/e5e7eb/94a3b8?text=Book`;
          }}
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/books/${book.id}`}
          className="font-semibold text-sm leading-snug hover:text-primary line-clamp-2"
        >
          {book.title}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
        {book.discountPct > 0 && (
          <Badge variant="secondary" className="text-[10px] mt-1">-{book.discountPct}% off</Badge>
        )}

        {/* Quantity controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.id, quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.id, quantity + 1)}
              disabled={quantity >= book.stock}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors ml-2"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold">{formatPrice(finalPrice * quantity)}</p>
        {quantity > 1 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatPrice(finalPrice)} ea.
          </p>
        )}
        {book.discountPct > 0 && (
          <p className="text-xs text-muted-foreground line-through">
            {formatPrice(price * quantity)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Order Summary ─────────────────────────────────────────────────────────────
function OrderSummary({
  onProceed,
}: {
  onProceed: () => void;
}) {
  const { items, subtotal, discount, total, giftPointsApplied, applyGiftPoints, removeGiftPoints } =
    useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [gpInput, setGpInput] = useState('');
  const [gpError, setGpError] = useState('');

  const sub = subtotal();
  const disc = discount();
  const gpApplied = giftPointsApplied;
  const finalTotal = total();
  const availablePoints = user?.giftPoints ?? 0;
  const maxRedeemable = maxRedeemablePoints(sub, availablePoints);
  const deliveryFee = sub - gpApplied >= 499 ? 0 : 99;
  const grandTotal = finalTotal + deliveryFee;

  const handleApplyGiftPoints = () => {
    const pts = parseInt(gpInput, 10);
    if (!pts || pts <= 0) {
      setGpError('Enter a valid number of points.');
      return;
    }
    if (pts > availablePoints) {
      setGpError(`You only have ${availablePoints} points.`);
      return;
    }
    if (pts > maxRedeemable) {
      setGpError(`Max redeemable: ${maxRedeemable} pts (20% of order total).`);
      return;
    }
    applyGiftPoints(pts);
    setGpInput('');
    setGpError('');
  };

  return (
    <div className="rounded-xl border p-5 space-y-4 sticky top-20">
      <h2 className="font-bold text-lg">Order Summary</h2>
      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
          <span>{formatPrice(sub)}</span>
        </div>
        {disc > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(disc)}</span>
          </div>
        )}
        {gpApplied > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <Gift className="h-3.5 w-3.5" /> Gift Points
            </span>
            <span>-{formatPrice(gpApplied)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" /> Delivery
          </span>
          <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
            {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-base">
        <span>Total</span>
        <span>{formatPrice(grandTotal)}</span>
      </div>

      {/* Gift Points */}
      {isAuthenticated && availablePoints > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-medium flex items-center gap-1">
            <Gift className="h-3.5 w-3.5 text-primary" />
            You have <strong>{availablePoints}</strong> gift points (max {maxRedeemable} redeemable)
          </p>
          {gpApplied > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600">{gpApplied} pts applied</span>
              <button
                onClick={() => { removeGiftPoints(); setGpInput(''); }}
                className="text-xs text-muted-foreground hover:text-destructive underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Up to ${maxRedeemable}`}
                value={gpInput}
                onChange={(e) => { setGpInput(e.target.value); setGpError(''); }}
                className="h-8 text-xs flex-1"
                min={1}
                max={maxRedeemable}
              />
              <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={handleApplyGiftPoints}>
                Apply
              </Button>
            </div>
          )}
          {gpError && <p className="text-xs text-destructive">{gpError}</p>}
        </div>
      )}

      {deliveryFee > 0 && (
        <p className="text-xs text-muted-foreground">
          Add {formatPrice(499 - (sub - gpApplied))} more for free delivery.
        </p>
      )}

      <Button className="w-full gap-2" size="lg" onClick={onProceed}>
        Proceed to Checkout <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Recommendations ──────────────────────────────────────────────────────────
function Recommendations({ excludeIds }: { excludeIds: string[] }) {
  const recs = mockBooks.filter((b) => !excludeIds.includes(b.id)).slice(0, 4);
  if (recs.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-6">You Might Also Like</h2>
      <BookGrid books={recs} columns={4} />
    </section>
  );
}

// ─── Cart Page ─────────────────────────────────────────────────────────────────
export default function Cart() {
  const { items, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleProceed = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-12">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Your cart is empty"
          description="Browse our catalogue and add some books to your cart."
          action={
            <Button asChild>
              <Link to="/catalogue">Browse Books</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Cart ({items.length})</h1>
        <button
          onClick={clearCart}
          className="text-sm text-muted-foreground hover:text-destructive underline transition-colors"
        >
          Clear cart
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Item list */}
        <div className="rounded-xl border divide-y">
          {items.map((item) => (
            <div key={item.id} className="px-4">
              <CartItemRow item={item} />
            </div>
          ))}
        </div>

        {/* Summary */}
        <OrderSummary onProceed={handleProceed} />
      </div>

      {/* Recommendations */}
      <Recommendations excludeIds={items.map((i) => i.book.id)} />
    </div>
  );
}
