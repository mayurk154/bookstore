import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EmptyState from '@/components/common/EmptyState';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, formatDate, canCancelOrder } from '@/utils';
import { orderService } from '@/services/orderService';
import type { Order, OrderStatus } from '@/types';

// ─── Status badge ──────────────────────────────────────────────────────────────
const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  processing: { label: 'Processing', variant: 'default' },
  shipped: { label: 'Shipped', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const cancellable = canCancelOrder(order.createdAt) && order.status !== 'cancelled' && order.status !== 'delivered';

  const handleBuyAgain = () => {
    order.items.forEach((item) => addItem(item.book, item.quantity));
  };

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">Order #{order.id}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">{formatPrice(order.total)}</span>

          {/* Buy Again */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-8 text-xs"
            onClick={handleBuyAgain}
            asChild
          >
            <Link to="/cart" onClick={handleBuyAgain}>
              <ShoppingCart className="h-3.5 w-3.5" />
              Buy Again
            </Link>
          </Button>

          {/* Cancel */}
          {cancellable && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1 h-8 text-xs"
              onClick={() => onCancel(order.id)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}

          {/* Toggle details */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Items preview (always visible) */}
      <div className="p-4 flex flex-wrap gap-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <img
              src={item.book.coverUrl}
              alt={item.book.title}
              className="w-10 h-[53px] object-cover rounded"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/40x53/e5e7eb/94a3b8?text=Book'; }}
            />
            <div className="text-xs">
              <p className="font-medium line-clamp-1 max-w-[120px]">{item.book.title}</p>
              <p className="text-muted-foreground">x{item.quantity} · {formatPrice(item.unitPrice)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t p-4 space-y-3 text-sm">
          <Separator />
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Delivery */}
            <div>
              <p className="font-semibold mb-1 text-xs text-muted-foreground uppercase tracking-wide">Delivery Address</p>
              <p className="font-medium">{order.address.label}</p>
              <p className="text-muted-foreground">{order.address.street}, {order.address.city}</p>
              <p className="text-muted-foreground">{order.address.state} – {order.address.pincode}</p>
            </div>
            {/* Payment */}
            <div>
              <p className="font-semibold mb-1 text-xs text-muted-foreground uppercase tracking-wide">Payment</p>
              <p className="font-medium capitalize">{order.payment.method}</p>
              <p className="text-muted-foreground capitalize">{order.payment.status}</p>
              {order.payment.transactionRef && (
                <p className="text-xs text-muted-foreground">Ref: {order.payment.transactionRef}</p>
              )}
            </div>
          </div>
          {/* Price breakdown */}
          <Separator />
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
            {order.giftPointsUsed > 0 && <div className="flex justify-between text-green-600"><span>Gift Points</span><span>-{formatPrice(order.giftPointsUsed)}</span></div>}
            <div className="flex justify-between font-bold text-foreground"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
          {/* 48-hour cancellation notice */}
          {!cancellable && order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/50 p-2">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              Cancellation window has passed (48 hours after ordering).
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    orderService.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (orderId: string) => {
    try {
      const updated = await orderService.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Could not cancel order.');
    }
  };

  if (loading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">My Orders</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Track, review, and manage your orders. Cancel within 48 hours of placing.
      </p>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No orders yet"
          description="Once you place an order it will appear here."
          action={
            <Button asChild>
              <Link to="/catalogue">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
