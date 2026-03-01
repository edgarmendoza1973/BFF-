'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Heart, Shield, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];
const FUNDS = [
  { value: 'general',     label: 'General Fund' },
  { value: 'missions',    label: 'Missions' },
  { value: 'building',    label: 'Building Fund' },
  { value: 'benevolence', label: 'Benevolence' },
];

interface DonationFormProps {
  onSuccess?: (donationId: number) => void;
}

export function DonationForm({ onSuccess }: DonationFormProps) {
  const [amount, setAmount]         = useState<number | ''>('');
  const [customAmount, setCustom]   = useState('');
  const [frequency, setFrequency]   = useState('one_time');
  const [fund, setFund]             = useState('general');
  const [anonymous, setAnonymous]   = useState(false);
  const [message, setMessage]       = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep]             = useState<'amount' | 'success'>('amount');
  const [clientSecret, setClientSecret] = useState('');

  const finalAmount = amount || parseFloat(customAmount) || 0;

  const handleSubmit = async () => {
    if (!finalAmount || finalAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/donations/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          frequency,
          fund_designation: fund,
          is_anonymous: anonymous,
          donor_message: message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process donation');

      // Confirm the donation
      await fetch('/api/donations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_intent_id: data.payment_intent_id,
          donation_id: data.donation_id,
        }),
      });

      toast.success('Thank you for your generous gift! 🙏');
      setStep('success');
      onSuccess?.(data.donation_id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process donation');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center py-8 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Thank you!</h3>
          <p className="text-gray-500 mt-1">Your gift of <span className="font-semibold text-indigo-600">${finalAmount.toFixed(2)}</span> has been received.</p>
        </div>
        <Button onClick={() => setStep('amount')} variant="outline">Make Another Gift</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Preset amounts */}
      <div>
        <Label className="text-sm font-semibold">Select Amount</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {PRESET_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => { setAmount(a); setCustom(''); }}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                amount === a ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-indigo-300'
              }`}
            >
              ${a}
            </button>
          ))}
        </div>
        <div className="mt-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <Input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={e => { setCustom(e.target.value); setAmount(''); }}
            className="pl-7"
            min="1"
          />
        </div>
      </div>

      {/* Frequency */}
      <div>
        <Label className="text-sm font-semibold">Frequency</Label>
        <RadioGroup value={frequency} onValueChange={setFrequency} className="flex gap-3 mt-2">
          {['one_time', 'weekly', 'monthly'].map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <RadioGroupItem value={f} id={`freq-${f}`} />
              <Label htmlFor={`freq-${f}`} className="text-sm capitalize cursor-pointer">{f.replace('_', ' ')}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Fund designation */}
      <div>
        <Label className="text-sm font-semibold">Designate To</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {FUNDS.map(f => (
            <button
              key={f.value}
              onClick={() => setFund(f.value)}
              className={`py-2 px-3 rounded-lg text-sm border-2 transition-all text-left ${
                fund === f.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-indigo-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <Label className="text-sm font-semibold">Encouragement Message (Optional)</Label>
        <textarea
          rows={2}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Leave an encouragement for the congregation..."
          className="mt-1.5 w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={e => setAnonymous(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-600">Give anonymously</span>
      </label>

      <Separator />

      {/* Summary & Submit */}
      <div className="space-y-3">
        {finalAmount > 0 && (
          <div className="p-3 bg-indigo-50 rounded-xl text-center">
            <span className="text-lg font-bold text-indigo-700">${finalAmount.toFixed(2)}</span>
            <span className="text-sm text-indigo-500 ml-2">{frequency.replace('_', ' ')} to {FUNDS.find(f => f.value === fund)?.label}</span>
          </div>
        )}
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
          onClick={handleSubmit}
          disabled={processing || !finalAmount}
        >
          {processing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><Heart className="h-4 w-4 mr-2" />Give {finalAmount ? `$${finalAmount.toFixed(2)}` : 'Now'}</>
          )}
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Shield className="h-3 w-3" />
          <span>Secured by Stripe · We never store card details</span>
        </div>
      </div>
    </div>
  );
}
