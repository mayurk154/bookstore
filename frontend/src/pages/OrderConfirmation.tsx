import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="container py-16 flex flex-col items-center text-center max-w-md mx-auto">
      {/* Success icon */}
      <div className="rounded-full bg-green-100 p-5 text-green-600 mb-6">
        <CheckCircle className="h-12 w-12" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
      <p className="text-muted-foreground mb-1">
        Your order has been confirmed and will be delivered in 3–5 business days.
      </p>
      <p className="text-sm font-medium text-primary mb-6">
        Order ID: <span className="font-bold">{orderId}</span>
      </p>

      <div className="w-full rounded-xl border p-5 space-y-3 text-left mb-8">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4 text-primary" />
          What happens next?
        </div>
        <Separator />
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">1</span>
            <p>Order confirmation email sent to your registered email.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">2</span>
            <p>Your books will be packed and dispatched within 24 hours.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">3</span>
            <p>Track your shipment in My Orders. Cancel within 48 hours if needed.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button asChild className="flex-1 gap-2">
          <Link to="/orders">
            <Package className="h-4 w-4" />
            View My Orders
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1 gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
