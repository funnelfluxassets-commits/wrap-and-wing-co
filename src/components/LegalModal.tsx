import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { STORES } from '../data/stores';

export type LegalTab = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, initialTab = 'privacy', onClose }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const store = STORES[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#141419] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-zinc-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              {activeTab === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {activeTab === 'privacy' ? 'Privacy Policy (POPIA)' : 'Terms of Service'}
              </h2>
              <p className="text-xs text-zinc-400">Wrap and Wing Co • South Africa</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 bg-zinc-950/50 border-b border-white/5 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed text-zinc-300">
          
          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: PRIVACY POLICY                                              */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-1">
                <div className="text-xs font-black text-white uppercase tracking-wider">
                  POPIA Compliance Statement
                </div>
                <p className="text-xs text-zinc-400">
                  Wrap and Wing Co is fully committed to protecting your personal information in compliance with the
                  Protection of Personal Information Act No. 4 of 2013 (POPIA) of the Republic of South Africa.
                </p>
                <div className="text-[11px] text-zinc-500 pt-1">
                  Last Updated: October 2026 • Effective Date: Immediately
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">1. Responsible Party</h3>
                <p>
                  This Privacy Policy applies to personal information collected and processed by{' '}
                  <strong className="text-white">Wrap and Wing Co</strong> ("we", "us", or "our"), operating at Shop 1,
                  Uniland Centre, Pinetown, KwaZulu-Natal, South Africa.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">2. Information We Collect</h3>
                <p>When you browse our website or place an order for collection or delivery, we may collect:</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>
                    <strong className="text-zinc-200">Customer Identification:</strong> Full name, telephone/mobile
                    number, and email address.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Delivery Information:</strong> Physical delivery address, suburb,
                    complex/unit name, gate access codes, and driver delivery instructions.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Order Information:</strong> Items selected, flavour bastings, sides,
                    special instructions, and order history.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Payment Information:</strong> Transaction status and reference
                    numbers. All payments are securely processed via certified third-party payment gateways (PayFast and
                    Yoco). <em className="text-amber-300">We do not store your credit card numbers or banking passwords.</em>
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">3. Purpose of Processing</h3>
                <p>We process your personal information strictly for the following legitimate business purposes:</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>To prepare, package, and fulfill your takeaway or delivery food orders.</li>
                  <li>
                    To provide our delivery drivers with accurate turn-by-turn navigation (via Google Maps / Waze) to reach
                    your doorstep promptly.
                  </li>
                  <li>To communicate order confirmation and preparation updates via phone or WhatsApp.</li>
                  <li>To process refunds, resolve customer inquiries, and comply with statutory legal requirements.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">4. Sharing of Information</h3>
                <p>
                  We treat your information with the strictest confidentiality. We do{' '}
                  <strong className="text-rose-400">never sell, rent, or trade</strong> your personal information to third
                  parties. We only disclose information to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>
                    <strong className="text-zinc-200">Our In-House Delivery Personnel:</strong> Solely to locate and contact
                    you to complete your food handover.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Payment Gateways:</strong> PayFast and Yoco for encrypted payment
                    authorization.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Regulatory Authorities:</strong> Only when legally required by the laws
                    of the Republic of South Africa.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">5. Data Security</h3>
                <p>
                  We implement robust technical and organizational security measures to protect your personal information
                  against loss, unauthorized access, destruction, or disclosure. All web traffic is encrypted using Secure
                  Sockets Layer (SSL/HTTPS).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">6. Your Rights Under POPIA</h3>
                <p>As a data subject, you have the right to:</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>Request confirmation of whether we hold personal information about you.</li>
                  <li>Request the correction, updating, or deletion of your personal records.</li>
                  <li>Object to the processing of your personal information on reasonable grounds.</li>
                  <li>Lodge a complaint with the South African Information Regulator (inforeg.org.za).</li>
                </ul>
              </section>

              <section className="space-y-2 p-4 rounded-2xl bg-zinc-900 border border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">7. Contact Our Information Officer</h3>
                <p className="text-xs text-zinc-400">
                  If you have questions regarding this Privacy Policy or wish to exercise your POPIA rights, contact us at:
                </p>
                <div className="space-y-1 text-xs text-zinc-300 pt-1">
                  <div><strong>Wrap and Wing Co</strong> (Information Officer)</div>
                  <div>📍 Shop 1, Uniland Centre, Pinetown, Durban, KZN</div>
                  <div>📞 Telephone / WhatsApp: 068 886 3892</div>
                  <div>✉️ Email: funnelflux.assets@gmail.com</div>
                </div>
              </section>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: TERMS OF SERVICE                                            */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-1">
                <div className="text-xs font-black text-white uppercase tracking-wider">
                  Consumer Terms & Conditions
                </div>
                <p className="text-xs text-zinc-400">
                  These Terms govern your use of the Wrap and Wing Co website and ordering platform in accordance with the
                  Consumer Protection Act No. 68 of 2008 (CPA) and Electronic Communications and Transactions Act No. 25 of 2002.
                </p>
                <div className="text-[11px] text-zinc-500 pt-1">
                  Last Updated: October 2026 • Applicable to all Orders & Deliveries
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">1. Agreement to Terms</h3>
                <p>
                  By accessing our website (wrapandwings.funnelfluxassets.com) or placing an order with{' '}
                  <strong className="text-white">Wrap and Wing Co</strong>, you agree to be bound by these Terms of Service.
                  If you do not agree, please do not use our services.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">2. Order Placement & Acceptance</h3>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>
                    When you place an order, it constitutes an offer to purchase our food products. All orders are subject to
                    kitchen confirmation, stock availability, and delivery radius constraints.
                  </li>
                  <li>
                    Because our food is freshly flame-grilled to order, cancellations cannot be accepted once the kitchen has
                    commenced preparing your food.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">3. Pricing & Currency</h3>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>All prices displayed on this website are in South African Rands (ZAR).</li>
                  <li>Prices are inclusive of applicable Value Added Tax (VAT) unless otherwise indicated.</li>
                  <li>
                    We reserve the right to correct pricing typographical errors and update menu prices at any time prior to
                    order acceptance.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">4. Collection & Delivery Terms</h3>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>
                    <strong className="text-zinc-200">Store Collection:</strong> Orders must be collected from Shop 1, Uniland
                    Centre, Pinetown within reasonable time of your scheduled readiness notification.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Delivery:</strong> We deliver to designated areas in Pinetown and
                    surrounds. Estimated delivery windows (e.g., 30–45 mins) are estimates and may vary based on peak kitchen
                    demand, severe weather, or road traffic.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Customer Availability:</strong> Customers must ensure an authorized
                    person is available at the address, provide functioning gate access codes, and answer phone calls from the
                    driver to complete handover.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">5. Food Safety & Allergen Notice</h3>
                <p>
                  Our kitchen prepares chicken, spices, dairy (cheese, mayo), bread/gluten (wraps, rolls), and seafood. While we
                  exercise strict hygiene and preparation controls, cross-contact with allergens may occur. Customers with severe
                  allergies should inform our team prior to ordering.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">6. Quality Guarantee & Complaints</h3>
                <p>
                  In accordance with the Consumer Protection Act (CPA), we take pride in delivering hot, fresh, quality food. If
                  your order is incorrect, damaged, or unsatisfactory upon delivery:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>Notify us via telephone or WhatsApp within 2 hours of receiving your meal.</li>
                  <li>Provide your Order Reference Number and brief details of the issue.</li>
                  <li>We will promptly rectify the issue with a replacement or appropriate refund.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">7. Governing Law</h3>
                <p>
                  These Terms of Service are governed by and construed in accordance with the laws of the Republic of South
                  Africa. Any dispute arising out of or in connection with these terms shall be subject to the jurisdiction of the
                  South African courts.
                </p>
              </section>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500">Wrap and Wing Co • Shop 1 Uniland Centre, Pinetown</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>

      </div>
    </div>
  );
};
