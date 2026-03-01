"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Heart, DollarSign, History, Users, Shield, Check, Loader2, RefreshCw, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PayPalButton } from '@/components/features/PayPalButton';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];
const FUNDS = [
  { value: 'general',     label: 'General Fund' },
  { value: 'missions',    label: 'Missions' },
  { value: 'building',    label: 'Building Fund' },
  { value: 'benevolence', label: 'Benevolence' },
];

interface DonationHistory {
  id: number; amount: number; currency: string; frequency: string;
  status: string; fund_designation: string; created_at: string; payment_method?: string;
}
interface DonorWallEntry { display_name: string; amount: number; message: string; }

// Stripe Elements — lazy-loaded only when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
let StripeElements: any = null;
let PaymentElement: any = null;
let useStripe: any = null;
let useElements: any = null;
let loadStripe: any = null;

function StripePaymentForm({ clientSecret, amount, onSuccess }: {
  clientSecret: string; amount: number; onSuccess: () => void;
}) {
  const stripe   = useStripe?.();
  const elements = useElements?.();
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/giving?success=1` },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message || 'Payment failed');
      } else {
        toast.success('Thank you for your generous gift! 🙏');
        onSuccess();
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700 font-medium text-center">
        Confirming gift of ${amount.toFixed(2)}
      </div>
      {PaymentElement && <PaymentElement />}
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        onClick={handleConfirm}
        disabled={confirming}
      >
        {confirming ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : `Give $${amount.toFixed(2)}`}
      </Button>
    </div>
  );
}

export default function GivingPage() {
  const [amount, setAmount]               = useState('');
  const [frequency, setFrequency]         = useState('one_time');
  const [fund, setFund]                   = useState('general');
  const [isAnonymous, setIsAnonymous]     = useState(false);
  const [donorMessage, setDonorMessage]   = useState('');
  const [step, setStep]                   = useState<'amount' | 'payment' | 'success'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [history, setHistory]             = useState<DonationHistory[]>([]);
  const [donorWall, setDonorWall]         = useState<DonorWallEntry[]>([]);
  const [processing, setProcessing]       = useState(false);
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [stripeLoaded, setStripeLoaded]   = useState(false);
  const [searchParams, setSearchParams]   = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
    fetchHistory();
    fetchDonorWall();

    // Dynamically load Stripe only if key is configured
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (pk && pk.startsWith('pk_')) {
      import('@stripe/stripe-js').then(mod => {
        loadStripe = mod.loadStripe;
        setStripePromise(loadStripe(pk));
      });
      import('@stripe/react-stripe-js').then(mod => {
        StripeElements = mod.Elements;
        PaymentElement = mod.PaymentElement;
        useStripe      = mod.useStripe;
        useElements    = mod.useElements;
        setStripeLoaded(true);
      });
    }
  }, []);

  // Handle Stripe return redirect
  useEffect(() => {
    if (searchParams?.get('success') === '1' || searchParams?.get('paypal') === 'success') {
      setStep('success');
      fetchHistory();
      fetchDonorWall();
    }
  }, [searchParams]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/donations/history');
      if (res.ok) { const d = await res.json(); setHistory(d.donations || []); }
    } catch {}
  };

  const fetchDonorWall = async () => {
    try {
      const res = await fetch('/api/donations/donor-wall');
      if (res.ok) { const d = await res.json(); setDonorWall(d.donors || []); }
    } catch {}
  };

  const handleProceedToPayment = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { toast.error('Please enter a valid amount (minimum $1)'); return; }
    setStep('payment');
  };

  const handleStripeCheckout = async () => {
    const amt = parseFloat(amount);
    setProcessing(true);
    try {
      const res = await fetch('/api/donations/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, frequency, fund_designation: fund, is_anonymous: isAnonymous, message: donorMessage }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create payment'); return; }

      if (data.client_secret && stripeLoaded && stripePromise) {
        setClientSecret(data.client_secret);
        // Stay on payment step with Stripe form
      } else {
        // Demo mode
        await fetch('/api/donations/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent_id: data.payment_intent_id, donation_id: data.donation_id }),
        });
        toast.success('Thank you for your generous gift! 🙏');
        handleSuccess();
      }
    } catch {
      toast.error('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuccess = () => {
    setStep('success');
    setClientSecret(null);
    fetchHistory();
    fetchDonorWall();
  };

  const handleReset = () => {
    setStep('amount');
    setAmount('');
    setClientSecret(null);
    setPaymentMethod('stripe');
  };

  const StatusBadge = ({ status, method }: { status: string; method?: string }) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      pending:   'bg-yellow-100 text-yellow-700',
      failed:    'bg-red-100 text-red-700',
    };
    const methodIcon = method === 'paypal' ? '𝙿' : '💳';
    return (
      <div className="flex items-center gap-1">
        <Badge className={`text-xs ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</Badge>
        <span className="text-xs text-gray-400" title={method}>{methodIcon}</span>
      </div>
    );
  };

  const parsedAmount = parseFloat(amount) || 0;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-7 w-7 text-pink-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Giving</h1>
          <p className="text-sm text-gray-500">Support BFF+ ministries with your generous gift</p>
        </div>
      </div>

      <Tabs defaultValue="give">
        <TabsList className="w-full">
          <TabsTrigger value="give" className="flex-1">Give</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            <History className="h-3.5 w-3.5 mr-1.5" />History
          </TabsTrigger>
          <TabsTrigger value="wall" className="flex-1">
            <Users className="h-3.5 w-3.5 mr-1.5" />Donor Wall
          </TabsTrigger>
        </TabsList>

        {/* ── Give Tab ─────────────────────────────── */}
        <TabsContent value="give" className="mt-4">
          {step === 'success' ? (
            <Card>
              <CardContent className="py-14 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Thank You! 🙏</h2>
                <p className="text-gray-500 text-sm">Your gift has been received. God bless you!</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleReset}>Give Again</Button>
                  <Button variant="outline" onClick={fetchHistory}>
                    <RefreshCw className="h-4 w-4 mr-2" />View History
                  </Button>
                </div>
              </CardContent>
            </Card>

          ) : step === 'payment' ? (
            // ── Payment Step ──────────────────────────────
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Complete Your Gift — ${parsedAmount.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Selector */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setPaymentMethod('stripe'); setClientSecret(null); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                        ${paymentMethod === 'stripe' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <CreditCard className="h-6 w-6 text-indigo-600" />
                      <span className="text-sm font-semibold">Credit / Debit</span>
                      <span className="text-xs text-gray-400">Powered by Stripe</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMethod('paypal'); setClientSecret(null); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                        ${paymentMethod === 'paypal' ? 'border-[#003087] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="text-2xl font-bold text-[#003087]">P</span>
                      <span className="text-sm font-semibold">PayPal</span>
                      <span className="text-xs text-gray-400">Pay securely</span>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Stripe flow */}
                {paymentMethod === 'stripe' && (
                  clientSecret && stripeLoaded && stripePromise && StripeElements ? (
                    <StripeElements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                      <StripePaymentForm
                        clientSecret={clientSecret}
                        amount={parsedAmount}
                        onSuccess={handleSuccess}
                      />
                    </StripeElements>
                  ) : (
                    <div className="space-y-3">
                      {!stripeLoaded && (
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>Stripe demo mode — add <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> for real payments.</span>
                        </div>
                      )}
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold"
                        onClick={handleStripeCheckout}
                        disabled={processing}
                      >
                        {processing
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
                          : <><CreditCard className="h-4 w-4 mr-2" />Pay ${parsedAmount.toFixed(2)} with Card</>
                        }
                      </Button>
                    </div>
                  )
                )}

                {/* PayPal flow */}
                {paymentMethod === 'paypal' && (
                  <PayPalButton
                    amount={parsedAmount}
                    frequency={frequency}
                    fundDesignation={fund}
                    isAnonymous={isAnonymous}
                    message={donorMessage}
                    onSuccess={handleSuccess}
                  />
                )}

                <Button variant="ghost" className="w-full text-gray-500" onClick={() => { setStep('amount'); setClientSecret(null); }}>
                  ← Back
                </Button>
              </CardContent>
            </Card>

          ) : (
            // ── Amount / Details Step ──────────────────────────────
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Preset amounts */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Select Amount</Label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {PRESET_AMOUNTS.map(a => (
                      <Button
                        key={a}
                        variant={amount === String(a) ? 'default' : 'outline'}
                        className={amount === String(a) ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                        onClick={() => setAmount(String(a))}
                      >
                        ${a}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <Input
                      type="number"
                      placeholder="Custom amount"
                      className="pl-7"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <Separator />

                {/* Frequency */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Frequency</Label>
                  <RadioGroup value={frequency} onValueChange={setFrequency} className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'one_time', label: 'One-time' },
                      { value: 'monthly',  label: 'Monthly' },
                      { value: 'weekly',   label: 'Weekly' },
                    ].map(opt => (
                      <div key={opt.value}
                        className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${frequency === opt.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                        onClick={() => setFrequency(opt.value)}>
                        <RadioGroupItem value={opt.value} className="sr-only" />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Fund */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Designate to</Label>
                  <RadioGroup value={fund} onValueChange={setFund} className="grid grid-cols-2 gap-2">
                    {FUNDS.map(f => (
                      <div key={f.value}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${fund === f.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                        onClick={() => setFund(f.value)}>
                        <RadioGroupItem value={f.value} className="sr-only" />
                        <span className="text-sm font-medium">{f.label}</span>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Message + Anonymous */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="msg" className="text-sm font-semibold">Leave a message (optional)</Label>
                    <textarea
                      id="msg"
                      rows={2}
                      value={donorMessage}
                      onChange={e => setDonorMessage(e.target.value)}
                      placeholder="Encouragement for the donor wall..."
                      className="mt-1.5 w-full rounded-lg border border-gray-200 p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-sm text-gray-600">Give anonymously</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Payments secured by Stripe &amp; PayPal. Your card details are never stored on our servers.</span>
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold"
                  disabled={!amount || parseFloat(amount) < 1}
                  onClick={handleProceedToPayment}
                >
                  {amount && parseFloat(amount) >= 1
                    ? `Continue to Pay $${parseFloat(amount).toFixed(2)}`
                    : 'Enter an Amount to Give'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── History Tab ──────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Giving History</CardTitle>
              <Button size="sm" variant="ghost" onClick={fetchHistory}><RefreshCw className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>No giving history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-semibold text-gray-900">${d.amount.toFixed(2)} <span className="text-xs text-gray-400 uppercase">{d.currency}</span></p>
                        <p className="text-xs text-gray-500 capitalize">{d.fund_designation?.replace('_', ' ')} · {d.frequency?.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-400">{d.created_at ? format(new Date(d.created_at), 'MMM d, yyyy') : ''}</p>
                      </div>
                      <StatusBadge status={d.status} method={d.payment_method} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Donor Wall Tab ────────────────────────── */}
        <TabsContent value="wall" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Donor Wall</CardTitle>
              <p className="text-sm text-gray-500">Celebrating our generous community</p>
            </CardHeader>
            <CardContent>
              {donorWall.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Heart className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>Be the first to give!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {donorWall.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b last:border-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
                        {(d.display_name || 'A')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{d.display_name}</p>
                        {d.message && <p className="text-xs text-gray-500 italic mt-0.5">"{d.message}"</p>}
                      </div>
                      <span className="text-sm font-semibold text-green-600">${d.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
