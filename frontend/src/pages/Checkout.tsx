import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, CreditCard, Gift, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, maxRedeemablePoints } from '@/utils';
import { orderService } from '@/services/orderService';
import type { PaymentMethod } from '@/types';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const addressSchema = z.object({
  label: z.string().min(1, 'Required'),
  street: z.string().min(5, 'Enter full street address'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
});
type AddressForm = z.infer<typeof addressSchema>;

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: 'Address' },
    { num: 2, label: 'Gift Points' },
    { num: 3, label: 'Review' },
  ];
  return (
    <ol className="flex items-center gap-2 text-sm mb-8">
      {steps.map(({ num, label }, i) => (
        <li key={num} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <div className="flex items-center gap-1.5">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === num
                  ? 'bg-primary text-primary-foreground'
                  : step > num
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > num ? '✓' : num}
            </span>
            <span className={step === num ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ─── Order Summary Panel ──────────────────────────────────────────────────────
function OrderSummaryPanel({
  gpApplied,
  paymentMethod,
}: {
  gpApplied: number;
  paymentMethod: PaymentMethod;
}) {
  const { items, subtotal, discount, total } = useCartStore();
  const sub = subtotal();
  const disc = discount();
  const deliveryFee = sub - gpApplied >= 499 ? 0 : 99;
  const grandTotal = total() - gpApplied + deliveryFee;

  return (
    <div className="rounded-xl border p-5 space-y-4">
      <h2 className="font-bold">Order Summary</h2>
      <Separator />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            <img
              src={item.book.coverUrl}
              alt={item.book.title}
              className="w-10 h-[53px] object-cover rounded flex-shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/40x53/e5e7eb/94a3b8?text=Book'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-1">{item.book.title}</p>
              <p className="text-xs text-muted-foreground">x{item.quantity}</p>
            </div>
            <span className="font-medium flex-shrink-0">
              {formatPrice(Math.round(item.book.price * (1 - item.book.discountPct / 100)) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(sub)}</span></div>
        {disc > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(disc)}</span></div>}
        {gpApplied > 0 && <div className="flex justify-between text-green-600"><span>Gift Points</span><span>-{formatPrice(gpApplied)}</span></div>}
        <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span></div>
        <Separator />
        <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
        <p className="text-xs text-muted-foreground">Payment: <span className="capitalize font-medium">{paymentMethod}</span></p>
      </div>
    </div>
  );
}

// ─── Checkout Page ─────────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, subtotal, applyGiftPoints, removeGiftPoints, clearCart } = useCartStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [gpInput, setGpInput] = useState('');
  const [gpApplied, setGpApplied] = useState(0);
  const [gpError, setGpError] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const availablePoints = user?.giftPoints ?? 0;
  const sub = subtotal();
  const maxRedeemable = maxRedeemablePoints(sub, availablePoints);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: 'Home', state: 'Karnataka' },
  });

  const handleApplyGP = () => {
    const pts = parseInt(gpInput, 10);
    if (!pts || pts <= 0) { setGpError('Enter a valid number'); return; }
    if (pts > availablePoints) { setGpError(`You only have ${availablePoints} points`); return; }
    if (pts > maxRedeemable) { setGpError(`Max redeemable: ${maxRedeemable} pts`); return; }
    setGpApplied(pts);
    applyGiftPoints(pts);
    setGpInput('');
    setGpError('');
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      const addr = getValues();
      // 1. Save the address first
      const savedAddress = await orderService.addAddress({
        label: addr.label,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        isDefault: false,
      });
      // 2. Place the order
      const order = await orderService.createOrder({
        addressId: savedAddress.id,
        paymentMethod,
        giftPointsToUse: gpApplied,
      });
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">Checkout</h1>
      <StepIndicator step={step} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          {/* ── Step 1: Address ─────────────────────────────────────────── */}
          {step === 1 && (
            <form
              onSubmit={handleSubmit(() => setStep(2))}
              className="rounded-xl border p-6 space-y-4"
            >
              <h2 className="font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Delivery Address
              </h2>
              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Label */}
                <div className="space-y-1.5">
                  <Label htmlFor="label">Address Label</Label>
                  <Input id="label" placeholder="Home / Office" {...register('label')} />
                  {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
                </div>
                {/* Pincode */}
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" placeholder="560001" {...register('pincode')} />
                  {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
                </div>
                {/* Street */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" placeholder="42, MG Road, Apartment 5B" {...register('street')} />
                  {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
                </div>
                {/* City */}
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Bengaluru" {...register('city')} />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
                {/* State */}
                <div className="space-y-1.5">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="Karnataka" {...register('state')} />
                  {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-1.5 pt-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit / Debit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">Continue to Gift Points</Button>
            </form>
          )}

          {/* ── Step 2: Gift Points ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="rounded-xl border p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" /> Gift Points
              </h2>
              <Separator />
              {availablePoints > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You have <strong>{availablePoints}</strong> gift points.
                    Max redeemable: <strong>{maxRedeemable}</strong> (20% of order total).
                  </p>
                  {gpApplied > 0 ? (
                    <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3">
                      <span className="text-sm text-green-700 font-medium">{gpApplied} pts applied (-{formatPrice(gpApplied)})</span>
                      <button
                        className="text-xs text-muted-foreground hover:text-destructive underline"
                        onClick={() => { setGpApplied(0); removeGiftPoints(); }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={`Up to ${maxRedeemable} pts`}
                        value={gpInput}
                        onChange={(e) => { setGpInput(e.target.value); setGpError(''); }}
                        className="h-9 text-sm"
                      />
                      <Button variant="secondary" className="h-9 text-sm" onClick={handleApplyGP}>Apply</Button>
                    </div>
                  )}
                  {gpError && <p className="text-xs text-destructive">{gpError}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You have no gift points to redeem.</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Review Order</Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ──────────────────────────────────────────── */}
          {step === 3 && (
            <div className="rounded-xl border p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Review & Place Order
              </h2>
              <Separator />

              {/* Address review */}
              {(() => {
                const addr = getValues();
                return (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-0.5">
                    <p className="font-semibold">{addr.label}</p>
                    <p className="text-muted-foreground">{addr.street}, {addr.city}</p>
                    <p className="text-muted-foreground">{addr.state} – {addr.pincode}</p>
                  </div>
                );
              })()}

              <p className="text-sm">
                Payment: <span className="font-medium capitalize">{paymentMethod}</span>
              </p>
              {gpApplied > 0 && (
                <p className="text-sm text-green-600">
                  Gift Points: -{formatPrice(gpApplied)}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handlePlaceOrder}
                  disabled={isPlacing}
                >
                  {isPlacing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPlacing ? 'Placing Order…' : 'Place Order'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <OrderSummaryPanel gpApplied={gpApplied} paymentMethod={paymentMethod} />
      </div>
    </div>
  );
}
