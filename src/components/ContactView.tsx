import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PageView } from '../types';

interface ContactViewProps {
  onNavigate: (view: PageView) => void;
  onOpenStoreModal?: () => void;
}

interface FormState {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  message: string;
}

const INITIAL_FORM: FormState = {
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  telephone: '',
  message: '',
};

const FAQ_ITEMS = [
  {
    q: 'Where is your store located and what are your operating hours?',
    a: 'We are located at Shop 1 Uniland Centre (behind Hollywoodbets), 8 Kings Road, Pinetown. We are open 7 days a week from 9:00 AM to 6:00 PM for walk-ins, collections, and doorstep delivery.',
  },
  {
    q: 'How does delivery work and what areas do you serve?',
    a: 'We provide real-time GPS-tracked delivery across Pinetown and surrounding suburbs. You can order directly on our website, pay online or on handover, and track your driver turn-by-turn.',
  },
  {
    q: 'Do you cater for large groups, birthdays, or corporate functions?',
    a: 'Yes, absolutely! We prepare generous party platters, whole chicken feasts, and boxed meals for corporate meetings and events. Simply fill in this form or call our team directly at 068 886 3892 to arrange bulk orders.',
  },
  {
    q: 'What signature bastings do you offer for your wings and chicken?',
    a: 'We offer 5 handcrafted basting sauces: Lemon & Herb (zesty and mild), Mild Peri-Peri, Smokey BBQ Basting, Sweet Chilli Glaze, and Fiery Hot Peri-Peri.',
  },
  {
    q: 'What payment options do you support?',
    a: 'We accept PayFast Instant EFT, Yoco Card & Apple Pay, Cash, and mobile Speedpoint card machines upon collection or delivery.',
  },
];

export const ContactView: React.FC<ContactViewProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > 2000) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setStatus('error');
      setErrorMessage('Please provide your first and last name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!formData.telephone.trim()) {
      setStatus('error');
      setErrorMessage('Please provide your contact telephone number.');
      return;
    }

    if (!formData.message.trim()) {
      setStatus('error');
      setErrorMessage('Please enter your message.');
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      // Dispatch via FormSubmit AJAX service straight to funnelflux.assets@gmail.com
      const response = await fetch('https://formsubmit.co/ajax/funnelflux.assets@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          Title: formData.title || 'Not specified',
          'First Name': formData.firstName,
          'Last Name': formData.lastName,
          Email: formData.email,
          Telephone: formData.telephone,
          Message: formData.message,
          _subject: `Wrap & Wings Co. Contact: ${formData.firstName} ${formData.lastName}`,
          _template: 'table',
          _captcha: 'false',
        }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData(INITIAL_FORM);
      } else {
        throw new Error('Server returned an unexpected response');
      }
    } catch {
      // Fallback: If network or blocker stops AJAX, offer graceful direct mailto
      try {
        const mailtoUrl = `mailto:funnelflux.assets@gmail.com?subject=${encodeURIComponent(
          `Wrap & Wings Co Inquiry from ${formData.firstName} ${formData.lastName}`
        )}&body=${encodeURIComponent(
          `Title: ${formData.title}\nName: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nPhone: ${formData.telephone}\n\nMessage:\n${formData.message}`
        )}`;
        window.location.href = mailtoUrl;
        setStatus('success');
        setFormData(INITIAL_FORM);
      } catch {
        setStatus('error');
        setErrorMessage('Unable to send at this moment. Please call us at 068 886 3892 or WhatsApp us directly.');
      }
    }
  };

  const scrollToFaqs = () => {
    const faqElement = document.getElementById('faqs-section');
    if (faqElement) {
      faqElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-zinc-100 flex flex-col selection:bg-rose-500 selection:text-white">
      
      {/* ── Breadcrumb & Top Bar ────────────────────────────────────────────── */}
      <div className="bg-[#121217] border-b border-white/10 sticky top-[104px] sm:top-[108px] z-30 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('menu')}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Full Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('story')}
              className="text-xs font-bold text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Our Story</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-950/40 transition-colors cursor-pointer"
            >
              Order Online
            </button>
          </div>
        </div>
      </div>

      {/* ── Header Design with African Art Design as one background image ────── */}
      <section className="relative overflow-hidden border-b border-white/10 bg-black min-h-[240px] sm:min-h-[290px] md:min-h-[320px] flex items-center justify-center">
        {/* Full-width single background image using African Art Design */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/brand/African-Art-Design.webp')",
          }}
          aria-hidden="true"
        />

        {/* Framing dark overlay: transparent at top/bottom to reveal tribal patterns, darkened center band for text clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/85 to-black/25" />

        {/* Header Content matching reference layout */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center space-y-2.5">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-tight font-sans drop-shadow-lg">
            GET IN TOUCH
          </h1>

          <div className="text-xs sm:text-sm text-zinc-200 max-w-xl mx-auto font-medium space-y-1 drop-shadow">
            <p>
              We've got a full list of{' '}
              <button
                type="button"
                onClick={scrollToFaqs}
                className="text-white underline font-bold hover:text-amber-400 cursor-pointer transition-colors"
              >
                FAQs
              </button>
              .
            </p>
            <p className="text-zinc-300">
              Can't find what you are looking for? Get in touch with us below.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12 flex-1 w-full">

        {/* ── Customer Form (sitting directly under header) ────────────────── */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#121217] border border-white/10 shadow-2xl space-y-6">
          
          {/* Status Notifications */}
          {status === 'success' && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="space-y-1">
                <div className="font-bold text-sm">Thank you for reaching out!</div>
                <div className="text-xs text-emerald-200/90 leading-relaxed">
                  Your message has been sent directly to our team at <strong>funnelflux.assets@gmail.com</strong>. We will review your inquiry and get back to you shortly.
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1">
                <div className="font-bold text-sm">Please check your details</div>
                <div className="text-xs text-rose-200/90 leading-relaxed">{errorMessage}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Row 1: Title, First Name, Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              
              {/* Title */}
              <div className="sm:col-span-3 space-y-1.5">
                <label htmlFor="title" className="block text-xs font-bold text-zinc-300">
                  Title
                </label>
                <div className="relative">
                  <select
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-rose-500 appearance-none cursor-pointer transition-colors"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-400">
                      Title
                    </option>
                    <option value="Mr" className="bg-zinc-900 text-white">
                      Mr
                    </option>
                    <option value="Mrs" className="bg-zinc-900 text-white">
                      Mrs
                    </option>
                    <option value="Ms" className="bg-zinc-900 text-white">
                      Ms
                    </option>
                    <option value="Miss" className="bg-zinc-900 text-white">
                      Miss
                    </option>
                    <option value="Dr" className="bg-zinc-900 text-white">
                      Dr
                    </option>
                    <option value="Prof" className="bg-zinc-900 text-white">
                      Prof
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* First Name */}
              <div className="sm:col-span-4 space-y-1.5">
                <label htmlFor="firstName" className="block text-xs font-bold text-zinc-300">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Last Name */}
              <div className="sm:col-span-5 space-y-1.5">
                <label htmlFor="lastName" className="block text-xs font-bold text-zinc-300">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Email, Telephone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-zinc-300">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Telephone */}
              <div className="space-y-1.5">
                <label htmlFor="telephone" className="block text-xs font-bold text-zinc-300">
                  Telephone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  placeholder="Telephone"
                  required
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Row 3: Message */}
            <div className="space-y-1.5">
              <label htmlFor="message" className="block text-xs font-bold text-zinc-300">
                Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                maxLength={2000}
                placeholder="What do you want to say?"
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-3.5 py-3 rounded-2xl bg-black/60 border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-rose-500 transition-colors resize-y min-h-[120px]"
              />
              
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span>We respect your privacy and never share your contact details.</span>
                <span className="font-semibold text-zinc-400">
                  {formData.message.length > 0 ? `${formData.message.length} / 2000 characters` : 'Max 2000 characters'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="px-8 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-xl transition-all hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {status === 'sending' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── FAQ Section ─────────────────────────────────────────────────── */}
        <section id="faqs-section" className="space-y-6 pt-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Find quick answers to common questions about our food, store hours, catering, and delivery.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ_ITEMS.map((item, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-[#121217] border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/5 pt-3 animate-fadeIn">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
