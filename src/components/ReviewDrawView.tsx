import React, { useState } from 'react';
import {
  Trophy,
  Star,
  ExternalLink,
  Copy,
  CheckCircle2,
  Gift,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  Check,
  Flame,
} from 'lucide-react';
import { PageView } from '../types';
import { GOOGLE_REVIEW_URL } from '../data/stores';
import { saveReviewDrawEntry, updateReviewEntryStatus } from '../services/reviewService';

interface ReviewDrawViewProps {
  onNavigate: (view: PageView) => void;
  onOpenStoreModal?: () => void;
}

export const ReviewDrawView: React.FC<ReviewDrawViewProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [googleReviewName, setGoogleReviewName] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEntryId, setSubmittedEntryId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [hasClickedGoogle, setHasClickedGoogle] = useState(false);
  const [hasConfirmedPost, setHasConfirmedPost] = useState(false);
  const [confirmingPost, setConfirmingPost] = useState(false);

  const handleConfirmGooglePost = async () => {
    if (!submittedEntryId) return;
    setConfirmingPost(true);
    try {
      await updateReviewEntryStatus(submittedEntryId, 'verified');
    } catch (err) {
      console.warn('Could not update status to verified in cloud:', err);
    }
    setHasConfirmedPost(true);
    setConfirmingPost(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage('Please enter a valid WhatsApp or cellphone number so we can contact you.');
      return;
    }
    if (!receiptNumber.trim()) {
      setErrorMessage('Please enter your Order or Receipt / Till Slip number.');
      return;
    }
    if (!googleReviewName.trim()) {
      setErrorMessage('Please enter the name that appears on your Google account so we can match your review.');
      return;
    }
    if (rating === 0) {
      setErrorMessage('Please select a star rating for your experience (1 to 5 stars).');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const entry = await saveReviewDrawEntry({
        fullName,
        phone,
        receiptNumber,
        googleReviewName,
        rating,
        comments,
      });

      setSubmittedEntryId(entry.id);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting review draw entry:', err);
      setErrorMessage('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyComments = () => {
    if (!comments.trim()) return;
    navigator.clipboard.writeText(comments.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-zinc-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* ── Header Design with African Art Design & Black Center Block ── */}
      <section className="relative overflow-hidden border-b border-white/10 bg-black min-h-[250px] sm:min-h-[290px] md:min-h-[330px] flex items-center justify-center py-10 sm:py-14">
        {/* Full-width background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/brand/African-Art-Design.webp')",
          }}
          aria-hidden="true"
        />

        {/* 50% black overlay */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden="true" />

        {/* Black center box */}
        <div className="relative z-10 max-w-xl md:max-w-2xl w-[92%] sm:w-auto mx-auto px-6 sm:px-12 py-7 sm:py-9 rounded-2xl bg-black/85 border border-white/10 shadow-2xl text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Weekly Customer Meal Draw</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight font-sans drop-shadow">
            WIN A WINGS MEAL
          </h1>

          <div className="text-xs sm:text-sm text-zinc-200 max-w-lg mx-auto font-medium space-y-1">
            <p className="text-amber-400 font-bold">
              Thank you for supporting our brand-new local spot!
            </p>
            <p className="text-zinc-300">
              Complete this quick 30-second form to enter our weekly draw to win this week's featured prize: <strong className="text-white">3 Flame-Grilled Wings + A Regular Side Combo</strong>! Winners drawn randomly every Sunday evening!
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1">
        {!isSubmitted ? (
          /* ── STEP 1: The Digital Entry Form ── */
          <div className="p-5 sm:p-10 rounded-3xl bg-[#121217] border border-white/10 shadow-2xl space-y-8 animate-fadeIn">
            
            {/* Featured Weekly Prize Spotlight Card with Wings Image */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0 pt-2.5">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-amber-500/40 shadow-lg bg-zinc-900">
                  <img
                    src="/images/menu/wings-3.webp"
                    alt="This Week's Featured Prize: 3 Flame-Grilled Chicken Wings + Side"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-md whitespace-nowrap z-10 border border-amber-600/30">
                  This Week
                </span>
              </div>
              <div className="text-center sm:text-left space-y-1 flex-1">
                <div className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Featured Weekly Prize</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  3 Flame-Grilled Chicken Wings + A Regular Side
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  3 plump, juicy flame-grilled chicken wings tossed in your choice of signature baste, paired with hot golden chips, savoury spicy rice, or fresh creamy slaw!
                </p>
                <div className="text-[11px] text-amber-300/90 font-medium pt-0.5">
                  🎁 Prizes change weekly — order &amp; enter every week to win!
                </div>
              </div>
            </div>

            {/* ── 2-Step Roadmap Banner ── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-zinc-900 border-2 border-amber-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs sm:text-sm font-black uppercase text-amber-300 tracking-wider">
                    2 Quick Steps Required To Qualify
                  </span>
                </div>
                <span className="text-[11px] font-bold text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-white/10">
                  ~45 Seconds Total
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Step 1 Pill */}
                <div className="p-3 rounded-xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0 shadow">
                    1
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Fill Web Form</span>
                      <span className="text-[10px] text-amber-300 bg-amber-500/30 px-1.5 py-0.5 rounded font-bold">You are here</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 truncate">Name, cell &amp; receipt number</p>
                  </div>
                </div>

                {/* Step 2 Pill */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/15 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 font-black text-xs flex items-center justify-center shrink-0 border border-white/10">
                    2
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
                      <span>Post on Google</span>
                      <span className="text-[10px] text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded font-bold">Mandatory</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">1-click to qualify your entry</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-300 leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300">Important:</strong> Filling this form is <strong className="text-white">Step 1</strong>. You will be guided immediately to <strong className="text-white">Step 2</strong> to post on Google. Both steps are needed so your ticket is qualified!
                </span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left border-b border-white/10 pb-6">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 text-rose-400 font-black text-xs uppercase tracking-wider">
                <Gift className="w-4 h-4 text-rose-500" />
                <span>Step 1 of 2: Entry Details</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                Enter Your Details &amp; Order Receipt
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                Entries are open to all customers who ordered this week. Complete this step, then finish Step 2 on Google to activate your ticket!
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Field 1: Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                  <span>Full Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sipho Mthembu"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Field 2: WhatsApp / Cellphone Number */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                    <span>WhatsApp / Cellphone Number</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-amber-400 font-bold whitespace-nowrap">To Receive Digital Meal Voucher</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 082 123 4567"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
                <p className="text-[11px] text-zinc-400">
                  Crucial so we can instantly contact you if your ticket is drawn on Sunday!
                </p>
              </div>

              {/* Field 3: Order / Receipt Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                  <span>Order / Receipt Number</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g. #1042 or POS Slip Number"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
                <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>Found at the top of your till slip or online order receipt. Ensures entries are limited to real orders.</span>
                </p>
              </div>

              {/* Field 4: Google Review Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                  <span>Google Account Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={googleReviewName}
                  onChange={(e) => setGoogleReviewName(e.target.value)}
                  placeholder="e.g. John Smith or JS Marketing"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
                <p className="text-[11px] text-zinc-400">
                  This helps our team find your review on our Google Business page to confirm your entry.
                </p>
              </div>

              {/* Field 5: Overall Experience Rating */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center justify-between">
                  <span className="whitespace-nowrap">Rate Experience</span>
                  <span className="text-amber-400 font-bold whitespace-nowrap">
                    {rating > 0 ? `${rating}/5 Stars` : 'Tap to Rate'}
                  </span>
                </label>
                <div className="flex items-center gap-1.5 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = rating === star;
                    const isFilled = rating > 0 && rating >= star;

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`flex-1 py-3 px-1.5 sm:px-2 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/35 border-amber-400 text-white ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/25 scale-[1.03]'
                            : isFilled
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                            : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${
                            isSelected
                              ? 'fill-amber-400 text-amber-400 scale-110'
                              : isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-600'
                          }`}
                        />
                        <span>{star}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 6: Optional Comments / Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center justify-between">
                  <span className="whitespace-nowrap">Your Feedback</span>
                  <span className="text-zinc-500 text-[11px] font-bold whitespace-nowrap">Optional</span>
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us about your meal, favorite basted flavour, or counter service..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
                <p className="text-[11px] text-zinc-400">
                  Tip: Anything you type here can be copied with 1-click on the next screen to paste into Google!
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 space-y-2.5">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Next up: Step 2 of 2!</strong> After clicking below, you'll be guided to Google to post your review and lock in your entry ticket.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-98 text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-orange-950/60 transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="whitespace-nowrap">Saving Step 1 Details...</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span>Proceed to Step 2: Post on Google</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="text-[11px] font-normal text-amber-100/90 sm:ml-1">
                        (Takes 10s • Required to Qualify)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : hasConfirmedPost ? (
          /* ── CELEBRATION SCREEN: Entry Verified & Confirmed ── */
          <div className="p-6 sm:p-10 rounded-3xl bg-[#121217] border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 space-y-8 animate-fadeIn text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-950/80">
                <Trophy className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entry Officially Qualified &amp; Locked In</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                🎉 YOU'RE IN THE DRAW!
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed">
                Thank you for posting your Google review! Your entry ticket is officially active for this Sunday's <strong className="text-amber-400">Wings Meal Draw</strong>.
              </p>
            </div>

            {/* Ticket Summary Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-left space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Your Ticket Reference</span>
                <span className="font-mono text-sm sm:text-base font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                  #{submittedEntryId.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Name:</span>
                  <span className="font-bold text-white">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">WhatsApp Cell:</span>
                  <span className="font-bold text-white">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order Slip #:</span>
                  <span className="font-bold text-white">{receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Google Account:</span>
                  <span className="font-bold text-white">{googleReviewName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rating:</span>
                  <span className="font-bold text-amber-400">{'★'.repeat(rating)} ({rating}/5 Stars)</span>
                </div>
              </div>
            </div>

            {/* Winner Draw Reassurance */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 max-w-md mx-auto text-left space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>What Happens Next:</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-zinc-300">
                <li>Entries close Sunday midnight.</li>
                <li>One lucky ticket is selected at random.</li>
                <li>The winner is messaged directly on WhatsApp (<strong className="text-white">{phone}</strong>) with a digital coupon for a free <strong className="text-amber-400">3 Wings + Regular Side combo</strong>!</li>
              </ul>
            </div>

            {/* Back to Menu */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('menu')}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-sm font-black transition-all shadow-lg cursor-pointer"
              >
                Back to Food Menu
              </button>
            </div>
          </div>
        ) : (
          /* ── STEP 2: The Mandatory Google Review Conversion Screen ── */
          <div className="p-5 sm:p-10 rounded-3xl bg-[#121217] border-2 border-amber-500/60 shadow-2xl shadow-orange-950/40 space-y-7 animate-fadeIn">
            
            {/* Top Visual Roadmap: Step 1 Done, Step 2 Action Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Step 1: Complete */}
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Step 1: Details Saved</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">Done ✓</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">Ticket #{submittedEntryId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {/* Step 2: Action Required */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500/25 to-amber-500/25 border-2 border-rose-500 flex items-center gap-3 animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow">
                  2
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Step 2: Post on Google</span>
                    <span className="text-[10px] text-rose-300 bg-rose-600 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">Action Required</span>
                  </div>
                  <p className="text-[11px] text-amber-200 truncate">Tap below to qualify entry</p>
                </div>
              </div>
            </div>

            {/* High-Urgency Status Box */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-950/60 via-amber-950/40 to-zinc-900 border-2 border-rose-500/50 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-black uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Your Entry Is Not Complete Yet!</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                🚨 1 Final Step to Qualify Your Ticket!
              </h2>

              <p className="text-xs sm:text-sm text-zinc-200 max-w-xl mx-auto leading-relaxed">
                Your entry ticket is currently <span className="text-amber-400 font-black underline uppercase">PENDING</span>. Under contest rules, only entries with a published review on our Google Business Page can be entered into the Sunday meal draw.
              </p>
            </div>

            {/* Quick-Copy Review Draft (If Customer Typed Comments) */}
            {comments.trim() ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                      Your Review Draft (Copy to Paste on Google):
                    </span>
                    <span className="text-xs text-amber-300 font-bold">{'★'.repeat(rating)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyComments}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>📋 1-Click Copy Review Text</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-200 italic">
                  "{comments.trim()}"
                </div>
                <p className="text-[11px] text-zinc-400">
                  💡 Tip: Click copy above so you won't have to retype your review on Google!
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-between text-left text-xs">
                <div>
                  <span className="text-zinc-400">Your Chosen Star Rating:</span>
                  <div className="text-amber-400 font-bold text-sm">{'★'.repeat(rating)} ({rating}/5 Stars)</div>
                </div>
                <span className="text-[11px] text-zinc-400">Rate 5 stars on Google to qualify!</span>
              </div>
            )}

            {/* ── GIANT PRIMARY ACTION: GOOGLE REVIEW BUTTON ── */}
            <div className="space-y-4 text-center max-w-xl mx-auto">
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasClickedGoogle(true)}
                className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-98 text-white font-black text-base sm:text-lg tracking-wide shadow-2xl shadow-orange-950/80 transition-all flex items-center justify-center gap-3 cursor-pointer ring-4 ring-amber-500/30 animate-bounce"
              >
                <span>👉 STEP 2: OPEN GOOGLE &amp; POST REVIEW</span>
                <ExternalLink className="w-5 h-5 shrink-0" />
              </a>

              <p className="text-xs text-zinc-400">
                Opens directly to Wrap and Wing Co on Google Maps
              </p>

              {/* Visual Guidance on Google Reviews Tab */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-left space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>How to post once Google opens:</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 py-1 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">Overview</span>
                  <span className="text-zinc-600">•</span>
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">Menu</span>
                  <span className="text-zinc-600">•</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/25 border-2 border-amber-400 text-amber-300 font-black">
                    👉 Tap "Reviews"
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">Photos</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  1. Tap the <strong className="text-white">"Reviews"</strong> tab.<br />
                  2. Select your <strong className="text-amber-400">5-Star rating</strong>.<br />
                  3. Paste your feedback (if copied) and tap <strong className="text-white">"Post"</strong>!
                </p>
              </div>
            </div>

            {/* ── CONFIRMATION / LOCK IN BUTTON ── */}
            <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-emerald-500/40 text-center space-y-3 max-w-xl mx-auto">
              <div className="text-xs font-bold text-zinc-300">
                Already posted your review on Google?
              </div>
              <button
                type="button"
                onClick={handleConfirmGooglePost}
                disabled={confirmingPost}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-sm sm:text-base tracking-wide shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {confirmingPost ? (
                  <span>Verifying Ticket...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>✅ I've Posted My Google Review — Lock In My Ticket!</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-zinc-400">
                Locks in your entry ticket so our team can verify it for the Sunday meal draw.
              </p>
            </div>

            {/* WhatsApp Fallback */}
            <div className="text-center pt-1">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Wrap & Wing Co Customer Meal Draw:\nPost your Google review here to qualify for the weekly draw:\n${GOOGLE_REVIEW_URL}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-amber-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>On desktop or need to post later? Share review link to WhatsApp</span>
              </a>
            </div>

            {/* Back to Menu */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('menu')}
                className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Food Menu
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
