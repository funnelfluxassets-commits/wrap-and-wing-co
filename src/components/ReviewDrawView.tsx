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
  AlertCircle
} from 'lucide-react';
import { PageView } from '../types';
import { GOOGLE_REVIEW_URL } from '../data/stores';
import { saveReviewDrawEntry } from '../services/reviewService';

interface ReviewDrawViewProps {
  onNavigate: (view: PageView) => void;
  onOpenStoreModal?: () => void;
}

export const ReviewDrawView: React.FC<ReviewDrawViewProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [googleReviewName, setGoogleReviewName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEntryId, setSubmittedEntryId] = useState<string>('');
  const [copied, setCopied] = useState(false);

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
            WIN A WRAP MEAL
          </h1>

          <div className="text-xs sm:text-sm text-zinc-200 max-w-lg mx-auto font-medium space-y-1">
            <p className="text-amber-400 font-bold">
              Thank you for supporting our brand-new local spot!
            </p>
            <p className="text-zinc-300">
              Complete this quick 30-second form to enter our weekly draw to win this week's featured prize: a <strong className="text-white">Full Chicken Shwarma Wrap Meal + Crispy Side</strong>! Winners drawn randomly every Sunday evening!
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1">
        {!isSubmitted ? (
          /* ── STEP 1: The Digital Entry Form ── */
          <div className="p-6 sm:p-10 rounded-3xl bg-[#121217] border border-white/10 shadow-2xl space-y-8 animate-fadeIn">
            
            {/* Featured Weekly Prize Spotlight Card with Wrap Meal Image */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-amber-500/40 shrink-0 shadow-lg">
                <img
                  src="/images/menu/wrap-and-side-1.webp"
                  alt="This Week's Featured Prize: Chicken Shwarma Wrap Meal + Side"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider shadow">
                  This Week
                </span>
              </div>
              <div className="text-center sm:text-left space-y-1 flex-1">
                <div className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Featured Weekly Prize</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Flame-Grilled Chicken Shwarma Wrap + Crispy Side
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Warm toasted tortilla wrapped with succulent flame-grilled chicken strips, fresh crisp salad, signature basting, and your choice of hot golden chips or spicy rice!
                </p>
                <div className="text-[11px] text-amber-300/90 font-medium pt-0.5">
                  🎁 Prizes change weekly — order &amp; enter every week to win!
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left border-b border-white/10 pb-6">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 text-rose-400 font-black text-xs uppercase tracking-wider">
                <Gift className="w-4 h-4 text-rose-500" />
                <span>Step 1 of 2: Entry Details</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Enter Your Details &amp; Order Receipt
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                Entries are open to all customers who ordered this week. Please ensure you complete the final step after submitting to officially lock in your entry on Google!
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
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5">
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5">
                    <span>WhatsApp / Cellphone Number</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-amber-400 font-bold">To Receive Digital Meal Voucher</span>
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
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5">
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
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5">
                  <span>What name displays on your Google account?</span>
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
                  <span>How would you rate your experience today?</span>
                  <span className="text-amber-400 font-bold">{rating} / 5 Stars</span>
                </label>
                <div className="flex items-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`flex-1 py-3 px-2 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        rating >= star
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                          : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-white'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          rating >= star ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                        }`}
                      />
                      <span>{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 6: Optional Comments / Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-zinc-200 tracking-wider flex items-center justify-between">
                  <span>What did you love or how can we improve? (Optional)</span>
                  <span className="text-zinc-500 text-[11px]">Optional</span>
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
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-98 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Entry...</span>
                  ) : (
                    <>
                      <span>Submit Details & Continue to Final Step</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── STEP 2: The Final Nudge Confirmation Screen ── */
          <div className="p-6 sm:p-10 rounded-3xl bg-[#121217] border border-orange-500/50 shadow-2xl shadow-orange-950/30 space-y-8 animate-fadeIn text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-950/60">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider">
                ✓ Entry Details Received ({submittedEntryId})
              </span>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                🎉 NOW FOR THE FINAL STEP!
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed">
                To officially publish your review and lock in your entry for the <strong className="text-amber-400">Weekly Wrap Meal Draw</strong>, please click the button below to open our official Google Business Page and post your feedback:
              </p>
            </div>

            {/* Direct Google Review Action Button */}
            <div className="pt-2 max-w-md mx-auto space-y-3">
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-98 text-white font-black text-base tracking-wide shadow-2xl shadow-amber-950/70 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>👉 Click Here to Publish Review on Google</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-[11px] text-zinc-400">
                Opens directly to Wrap & Wings Co on Google Maps
              </p>
            </div>

            {/* Quick-Copy Helper if user typed comments */}
            {comments.trim() && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 max-w-md mx-auto space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                    Your Review Draft:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyComments}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-zinc-200 italic line-clamp-3">"{comments.trim()}"</p>
              </div>
            )}

            {/* Reassurance & Draw Timeline */}
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 max-w-md mx-auto text-left space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>How the Draw Works:</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-zinc-300">
                <li>Entries close every Sunday at midnight.</li>
                <li>One lucky winner is drawn at random every Sunday night.</li>
                <li>The winner is contacted directly via WhatsApp with their digital voucher to redeem their free Wrap Meal combo!</li>
              </ul>
            </div>

            {/* Back to Menu */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('menu')}
                className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
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
