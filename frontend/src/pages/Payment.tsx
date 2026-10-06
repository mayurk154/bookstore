import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreditCard,
  Smartphone,
  Building2,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, generateRef } from '@/utils';
import { processPayment, formatCardNumber, formatExpiry } from '@/services/paymentService';
import type { PaymentMethod, PaymentStatus } from '@/types';

// ─── Form schemas ─────────────────────────────────────────────────────────────
const cardSchema = z.object({
  cardName: z.string().min(2, 'Name on card required'),
  cardNumber: z
    .string()
    .regex(/^(\d{4}\s){3}\d{4}$/, 'Enter a valid 16-digit card number'),
  cardExpiry: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cardCvv: z
    .string()
    .regex(/^\d{3,4}$/, '3 or 4 digits'),
});

const upiSchema = z.object({
  upiId: z
    .string()
    .regex(/^[\w.-]+@[\w]+$/, 'Enter a valid UPI ID (e.g. user@upi)'),
});

type CardForm = z.infer<typeof cardSchema>;
type UpiForm = z.infer<typeof upiSchema>;

// ─── Payment method icons ─────────────────────────────────────────────────────
const methodIcons: Record<PaymentMethod, React.ElementType> = {
  card: CreditCard,
  upi: Smartphone,
  netbanking: Building2,
  cod: Truck,
};

const methodLabels: Record<PaymentMethod, string> = {
  card: 'Credit / Debit Card',
  upi: 'UPI',
  netbanking: 'Net Banking',
  cod: 'Cash on Delivery',
};

// ─── Card Form ────────────────────────────────────────────────────────────────
function CardPaymentForm({ onSubmit }: { onSubmit: (data: CardForm) => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CardForm>({ resolver: zodResolver(cardSchema) });

  const cardNumber = watch('cardNumber') ?? '';
  const cardExpiry = watch('cardExpiry') ?? '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cardName">Name on Card</Label>
        <Input id="cardName" placeholder="Jane Doe" {...register('cardName')} />
        {errors.cardName && <p className="text-xs text-destructive">{errors.cardName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          value={cardNumber}
          onChange={(e) => setValue('cardNumber', formatCardNumber(e.target.value))}
        />
        {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cardExpiry">Expiry</Label>
          <Input
            id="cardExpiry"
            placeholder="MM/YY"
            maxLength={5}
            value={cardExpiry}
            onChange={(e) => setValue('cardExpiry', formatExpiry(e.target.value))}
          />
          {errors.cardExpiry && <p className="text-xs text-destructive">{errors.cardExpiry.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cardCvv">CVV</Label>
          <Input
            id="cardCvv"
            type="password"
            placeholder="•••"
            maxLength={4}
            {...register('cardCvv')}
          />
          {errors.cardCvv && <p className="text-xs text-destructive">{errors.cardCvv.message}</p>}
        </div>
      </div>
      <Button type="submit" className="w-full gap-2">
        <CreditCard className="h-4 w-4" /> Pay Now
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Test failure: use a card number ending in 0000
      </p>
    </form>
  );
}

// ─── UPI Form ─────────────────────────────────────────────────────────────────
function UpiPaymentForm({ onSubmit }: { onSubmit: (data: UpiForm) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<UpiForm>({ resolver: zodResolver(upiSchema) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="upiId">UPI ID</Label>
        <Input id="upiId" placeholder="yourname@upi" {...register('upiId')} />
        {errors.upiId && <p className="text-xs text-destructive">{errors.upiId.message}</p>}
      </div>
      <Button type="submit" className="w-full gap-2">
        <Smartphone className="h-4 w-4" /> Pay via UPI
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Test failure: use <code>fail@upi</code>
      </p>
    </form>
  );
}

// ─── Net Banking Form ─────────────────────────────────────────────────────────
const banks = [
  { code: 'SBI', name: 'State Bank of India' },
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'ICICI', name: 'ICICI Bank' },
  { code: 'AXIS', name: 'Axis Bank' },
  { code: 'KOTAK', name: 'Kotak Mahindra' },
];

function NetBankingForm({ onPay }: { onPay: () => void }) {
  const [selectedBank, setSelectedBank] = useState('');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {banks.map((bank) => (
          <button
            key={bank.code}
            type="button"
            onClick={() => setSelectedBank(bank.code)}
            className={`rounded-lg border p-3 text-sm text-left transition-colors hover:bg-muted ${
              selectedBank === bank.code ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <p className="font-medium">{bank.code}</p>
            <p className="text-xs text-muted-foreground">{bank.name}</p>
          </button>
        ))}
      </div>
      <Button className="w-full gap-2" onClick={onPay} disabled={!selectedBank}>
        <Building2 className="h-4 w-4" /> Proceed to Bank
      </Button>
    </div>
  );
}

// ─── Payment Status Screen ────────────────────────────────────────────────────
function PaymentStatusScreen({
  status,
  message,
  orderId,
  onRetry,
}: {
  status: PaymentStatus;
  message: string;
  orderId: string;
  onRetry: () => void;
}) {
  const navigate = useNavigate();

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="rounded-full bg-green-100 p-4 text-green-600">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">Payment Successful!</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={() => navigate(`/order-confirmation/${orderId}`)}>
          View Order Confirmation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive">
        <XCircle className="h-10 w-10" />
      </div>
      <h2 className="text-xl font-bold">Payment Failed</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" /> Try Again
      </Button>
    </div>
  );
}

// ─── Payment Page ─────────────────────────────────────────────────────────────
export default function Payment() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [orderId] = useState(generateRef('ORD'));
  const [isProcessing, setIsProcessing] = useState(false);

  const grandTotal = total() + (total() >= 499 ? 0 : 99);

  const handlePay = async (req: Parameters<typeof processPayment>[0]) => {
    setIsProcessing(true);
    try {
      const result = await processPayment({ ...req, amount: grandTotal });
      setPaymentStatus(result.status);
      setStatusMessage(result.message);
      if (result.status === 'success') {
        clearCart();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !paymentStatus) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payment</h1>

      {isProcessing ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing your payment…</p>
        </div>
      ) : paymentStatus ? (
        <div className="rounded-xl border p-6">
          <PaymentStatusScreen
            status={paymentStatus}
            message={statusMessage}
            orderId={orderId}
            onRetry={() => setPaymentStatus(null)}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Amount due */}
          <div className="rounded-xl border p-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Amount Due</span>
            <span className="text-xl font-bold">{formatPrice(grandTotal)}</span>
          </div>

          {/* Method tabs */}
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(methodLabels) as PaymentMethod[]).map((m) => {
              const Icon = methodIcons[m];
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors hover:bg-muted ${
                    method === m ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {m === 'netbanking' ? 'Net\nBanking' : methodLabels[m].split(' / ')[0]}
                </button>
              );
            })}
          </div>

          <Separator />

          {/* Method-specific form */}
          <div className="rounded-xl border p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              {(() => { const Icon = methodIcons[method]; return <Icon className="h-4 w-4" />; })()}
              {methodLabels[method]}
            </h2>

            {method === 'card' && (
              <CardPaymentForm
                onSubmit={(d) => handlePay({ ...d, method: 'card', amount: grandTotal })}
              />
            )}
            {method === 'upi' && (
              <UpiPaymentForm
                onSubmit={(d) => handlePay({ ...d, method: 'upi', amount: grandTotal })}
              />
            )}
            {method === 'netbanking' && (
              <NetBankingForm
                onPay={() => handlePay({ method: 'netbanking', amount: grandTotal })}
              />
            )}
            {method === 'cod' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pay <strong>{formatPrice(grandTotal)}</strong> in cash when your order is delivered.
                </p>
                <Button
                  className="w-full gap-2"
                  onClick={() => handlePay({ method: 'cod', amount: grandTotal })}
                >
                  <Truck className="h-4 w-4" /> Confirm Cash on Delivery
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
