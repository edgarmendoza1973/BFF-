'use client';
/**
 * PayPalButton — self-contained PayPal payment component.
 * Works in two modes:
 *   1. Real PayPal SDK   — when NEXT_PUBLIC_PAYPAL_CLIENT_ID is configured.
 *   2. Demo mode         — simulates the flow when no credentials are set.
 */
import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  frequency?: string;
  fundDesignation?: string;
  isAnonymous?: boolean;
  message?: string;
  onSuccess: () => void;
  onError?: (err: string) => void;
}

// PayPal SDK — lazy-loaded only when client ID is present
let PayPalButtons: any  = null;
let PayPalProvider: any = null;

export function PayPalButton({
  amount,
  currency = 'USD',
  frequency = 'one_time',
  fundDesignation = 'general',
  isAnonymous = false,
  message = '',
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const [sdkLoaded, setSdkLoaded]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const isDemo   = !clientId || clientId === 'PAYPAL_CLIENT_ID_HERE';
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load PayPal React SDK dynamically
  useEffect(() => {
    if (isDemo) return;
    import('@paypal/react-paypal-js' as any).then((mod: any) => {
      PayPalButtons  = mod.PayPalButtons;
      PayPalProvider = mod.PayPalScriptProvider;
      if (mountedRef.current) setSdkLoaded(true);
    }).catch(() => {
      if (mountedRef.current) setSdkLoaded(false);
    });
  }, [isDemo]);

  // ── create order (calls our API) ────────────────────────────────────
  const createOrder = async () => {
    const res = await fetch('/api/donations/create-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, frequency, fund_designation: fundDesignation, is_anonymous: isAnonymous, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create order');
    return data.orderId;
  };

  // ── capture order (calls our API) ───────────────────────────────────
  const captureOrder = async (orderId: string, donationId?: number) => {
    const res = await fetch('/api/donations/capture-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, donationId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Capture failed');
    return data;
  };

  // ── Demo flow (no real PayPal credentials) ──────────────────────────
  const handleDemo = async () => {
    setLoading(true);
    try {
      const createRes = await fetch('/api/donations/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, frequency, fund_designation: fundDesignation, is_anonymous: isAnonymous, message }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);

      // Simulate approval delay
      await new Promise(r => setTimeout(r, 1200));

      await captureOrder(createData.orderId, createData.donationId);
      setDemoSuccess(true);
      toast.success('Thank you for your generous gift! 🙏');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Demo PayPal failed');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ───────────────────────────────────────────────────
  if (demoSuccess) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-green-600 font-medium text-sm">
        <Check className="h-5 w-5" />
        PayPal payment confirmed!
      </div>
    );
  }

  // ── Demo mode button ────────────────────────────────────────────────
  if (isDemo) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>PayPal demo mode — add <code className="font-mono">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> to enable real payments.</span>
        </div>
        <Button
          className="w-full bg-[#FFC439] hover:bg-[#f0b429] text-[#003087] font-bold h-12 text-base"
          onClick={handleDemo}
          disabled={loading}
        >
          {loading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing Demo…</>
            : <><span className="text-lg mr-1">𝙿</span>Pay with PayPal (Demo)</>}
        </Button>
      </div>
    );
  }

  // ── Real PayPal SDK ─────────────────────────────────────────────────
  if (!sdkLoaded) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-400">Loading PayPal…</span>
      </div>
    );
  }

  return (
    <PayPalProvider options={{ clientId, currency }}>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate', height: 48 }}
        createOrder={async () => {
          const orderId = await createOrder();
          return orderId;
        }}
        onApprove={async (data: any) => {
          try {
            await captureOrder(data.orderID);
            toast.success('Thank you for your generous gift! 🙏');
            onSuccess();
          } catch (err: any) {
            toast.error(err.message || 'Payment capture failed');
            onError?.(err.message);
          }
        }}
        onError={(err: any) => {
          console.error('[PayPal]', err);
          toast.error('PayPal payment failed');
          onError?.(String(err));
        }}
        onCancel={() => toast('PayPal payment cancelled', { icon: 'ℹ️' })}
      />
    </PayPalProvider>
  );
}
