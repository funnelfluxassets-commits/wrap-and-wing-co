import React, { useState } from 'react';
import { Lock, ArrowLeft, CheckCircle2, Download, Printer, ShieldCheck, Truck, FileText, Bike, Car, AlertCircle, Sparkles } from 'lucide-react';
import {
  registerDriverOnboarding,
  verifyOnboardingPin,
  downloadCompletedAgreementPdf,
  getRegisteredDrivers,
  DEFAULT_ONBOARDING_PIN
} from '../services/driverService';
import { DriverProfile } from '../types';

interface DriverAgreementOnboardingViewProps {
  onBackToMenu: () => void;
  onLaunchDriverPortal: () => void;
}

export const DriverAgreementOnboardingView: React.FC<DriverAgreementOnboardingViewProps> = ({
  onBackToMenu,
  onLaunchDriverPortal,
}) => {
  // PIN gate state
  const [isPinAuthenticated, setIsPinAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wrap_wing_onboarding_unlocked') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Form state
  const [driverSlot, setDriverSlot] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [idOrPassport, setIdOrPassport] = useState('');
  const [phone, setPhone] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'light_vehicle' | 'car'>('motorcycle');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [licenceCode, setLicenceCode] = useState('Code A / A1 (Motorcycle)');
  const [licenceNumber, setLicenceNumber] = useState('');

  const [bankName, setBankName] = useState('Capitec Bank');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('470010');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToRemittance, setAgreedToRemittance] = useState(false);
  const [signedName, setSignedName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDriver, setSubmittedDriver] = useState<DriverProfile | null>(null);

  // Handle PIN unlock
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifyOnboardingPin(pinInput)) {
      setIsPinAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('wrap_wing_onboarding_unlocked', 'true');
      }
      setPinError(null);
    } else {
      setPinError('Incorrect 4-digit PIN. Please request the onboarding access code from store management.');
      setPinInput('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !idOrPassport.trim()) {
      alert('Please fill in your Full Legal Name, SA ID / Passport Number, and Mobile Phone.');
      return;
    }
    if (!accountNumber.trim()) {
      alert('Please enter your Bank Account Number for weekly Monday settlements.');
      return;
    }
    if (!agreedToTerms || !agreedToRemittance) {
      alert('Please agree to the Independent Contractor terms and Cash on Delivery remittance requirements.');
      return;
    }
    if (!signedName.trim()) {
      alert('Please type your full legal name as your digital signature.');
      return;
    }

    setIsSubmitting(true);

    try {
      const assignedPin = driverSlot === 1 ? '1001' : '1002';
      const registered = registerDriverOnboarding({
        name: fullName.trim(),
        phone: phone.trim(),
        pin: assignedPin,
        idOrPassportNumber: idOrPassport.trim(),
        residentialAddress: residentialAddress.trim(),
        vehicleType,
        vehicleDetails: vehicleDetails.trim() || (vehicleType === 'motorcycle' ? 'Motorcycle' : 'Light Vehicle'),
        vehicleReg: vehicleReg.trim().toUpperCase() || 'REGISTERED',
        licenceCode,
        licenceNumber: licenceNumber.trim() || 'VERIFIED',
        bankName,
        accountHolder: accountHolder.trim() || fullName.trim(),
        accountNumber: accountNumber.trim(),
        branchCode: branchCode.trim() || '470010',
        preferredDriverNumber: driverSlot,
      });

      setSubmittedDriver(registered);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      alert('Failed to submit onboarding form. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------------------------
  // VIEW: PIN PROTECTION MODAL
  // ----------------------------------------------------------------------
  if (!isPinAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-[#13131b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-950/40">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Driver Onboarding Portal
            </h1>
            <p className="text-xs text-zinc-400">
              Enter your 4-digit authorization PIN provided by Wrap & Wing Co. to access the independent driver agreement form.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                4-Digit Authorization PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                autoFocus
                className="w-full text-center tracking-[1em] text-2xl font-black py-3 rounded-2xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pinInput.length !== 4}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                pinInput.length === 4
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Agreement Form</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onBackToMenu}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Restaurant Menu</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: SUBMISSION SUCCESS SCREEN
  // ----------------------------------------------------------------------
  if (submittedDriver) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white py-10 px-4 sm:px-6 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-[#13131b] border border-emerald-500/30 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/40">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
              Agreement Successfully Signed & Recorded
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Welcome to the Fleet, {submittedDriver.name}!
            </h1>
            <p className="text-sm text-zinc-300">
              Your Independent Contractor Agreement has been submitted and registered with Wrap & Wing Co.
            </p>
          </div>

          {/* Credentials Card */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs text-zinc-400 font-bold uppercase">Assigned Driver Slot:</span>
              <span className="text-sm font-black text-rose-400">Driver #{submittedDriver.driverNumber}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs text-zinc-400 font-bold uppercase">Driver Portal Login PIN:</span>
              <span className="text-sm font-black text-amber-400 tracking-widest">{submittedDriver.pin}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs text-zinc-400 font-bold uppercase">Settlement Bank:</span>
              <span className="text-xs font-bold text-white">{submittedDriver.bankName} • {submittedDriver.accountNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase">Weekly Payout Day:</span>
              <span className="text-xs font-bold text-emerald-400">Every Monday by 12:00 PM (EFT)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadCompletedAgreementPdf(submittedDriver)}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed PDF Agreement</span>
            </button>
            <button
              type="button"
              onClick={onLaunchDriverPortal}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Open Driver Portal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: FULL ONBOARDING FORM
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToMenu}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 border border-white/5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Menu</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span>Official Fleet Onboarding Form</span>
          </div>
        </div>

        {/* Header Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-zinc-900 via-[#161622] to-zinc-900 border border-white/10 p-6 sm:p-8 space-y-2 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-block">
            Wrap & Wing Co. • Pinetown, KZN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            Independent Driver Agreement & Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Complete your particulars below to register for the Wrap & Wing delivery fleet. Once signed and submitted, your agreement will be recorded and a completed, print-ready PDF will be generated immediately for your records.
          </p>
        </div>

        {/* Main Onboarding Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Driver Slot Picker */}
          <div className="bg-[#13131b] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-500" />
                <span>1. Select Your Driver Slot</span>
              </h2>
              <span className="text-[11px] text-zinc-400 font-semibold">Starting with 2 active drivers</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDriverSlot(1)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  driverSlot === 1
                    ? 'bg-rose-600/20 border-rose-500 text-white ring-2 ring-rose-500/40 shadow-lg'
                    : 'bg-black/40 border-white/5 text-zinc-400 hover:border-white/15'
                }`}
              >
                <div>
                  <div className="font-black text-sm text-white">Driver #1</div>
                  <div className="text-[11px] text-zinc-400">Portal PIN: 1001</div>
                </div>
                {driverSlot === 1 && <CheckCircle2 className="w-5 h-5 text-rose-400" />}
              </button>

              <button
                type="button"
                onClick={() => setDriverSlot(2)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  driverSlot === 2
                    ? 'bg-rose-600/20 border-rose-500 text-white ring-2 ring-rose-500/40 shadow-lg'
                    : 'bg-black/40 border-white/5 text-zinc-400 hover:border-white/15'
                }`}
              >
                <div>
                  <div className="font-black text-sm text-white">Driver #2</div>
                  <div className="text-[11px] text-zinc-400">Portal PIN: 1002</div>
                </div>
                {driverSlot === 2 && <CheckCircle2 className="w-5 h-5 text-rose-400" />}
              </button>
            </div>
          </div>

          {/* Section 2: Personal Particulars */}
          <div className="bg-[#13131b] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-2.5">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>2. Contractor Particulars</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sipho Ndlovu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  SA ID / Passport / Work Permit No *
                </label>
                <input
                  type="text"
                  required
                  value={idOrPassport}
                  onChange={(e) => setIdOrPassport(e.target.value)}
                  placeholder="e.g. 9204155123089"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 082 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="e.g. 15 Anderson Rd, Pinetown"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Vehicle & Licencing */}
          <div className="bg-[#13131b] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Bike className="w-4 h-4 text-rose-500" />
              <span>3. Vehicle, Licence & Equipment</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="motorcycle">Motorcycle / Scooter</option>
                  <option value="light_vehicle">Light Motor Vehicle (Code 8 / B)</option>
                  <option value="car">Small Car / Bakkie</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Vehicle Make, Model & Colour
                </label>
                <input
                  type="text"
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  placeholder="e.g. Big Boy 150cc Red"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value)}
                  placeholder="e.g. ND 123-456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Driver Licence Code *
                </label>
                <select
                  value={licenceCode}
                  onChange={(e) => setLicenceCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Code A / A1 (Motorcycle)">Code A / A1 (Motorcycle)</option>
                  <option value="Code 8 / Code B (Light Vehicle)">Light Vehicle Code 8 / Code B</option>
                  <option value="Both Code 8 and Code A">Both (Code 8 & Code A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Bank Details for Monday Payouts */}
          <div className="bg-[#13131b] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <h2 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>4. Bank Account for Monday Settlements</span>
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Weekly Monday 12:00 PM EFT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Bank Name *
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Capitec Bank">Capitec Bank</option>
                  <option value="FNB (First National Bank)">FNB (First National Bank)</option>
                  <option value="Standard Bank">Standard Bank</option>
                  <option value="Nedbank">Nedbank</option>
                  <option value="Absa Bank">Absa Bank</option>
                  <option value="TymeBank">TymeBank</option>
                  <option value="African Bank">African Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="As registered at bank"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Bank account number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="e.g. 470010"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Rate Card & Summary */}
          <div className="bg-[#13131b] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-black uppercase text-white tracking-wide">
              5. Agreed Remuneration & Zone Distance Rates
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 1 (0–3 km)</div>
                <div className="text-base font-black text-rose-400">R28.00</div>
                <div className="text-[9px] text-zinc-500">Pinetown CBD</div>
              </div>
              <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 2 (3–6 km)</div>
                <div className="text-base font-black text-rose-400">R40.00</div>
                <div className="text-[9px] text-zinc-500">New Germany / Sarnia</div>
              </div>
              <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 3 (6–10 km)</div>
                <div className="text-base font-black text-rose-400">R58.00</div>
                <div className="text-[9px] text-zinc-500">Westville / Kloof</div>
              </div>
              <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 4 (10–14 km)</div>
                <div className="text-base font-black text-rose-400">R75.00</div>
                <div className="text-[9px] text-zinc-500">Hillcrest / Waterfall</div>
              </div>
            </div>
            <div className="text-[11px] text-zinc-300 pt-1 flex items-center justify-between">
              <span>• Drivers keep <strong>100% of customer tips</strong>.</span>
              <span>• Billing cycle: <strong>Mon 00:00 to Sat 23:59</strong>.</span>
            </div>
          </div>

          {/* Section 6: Digital Signature & Acceptance */}
          <div className="bg-[#13131b] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black uppercase text-white tracking-wide border-b border-white/5 pb-2.5">
              6. Digital Acceptance & Signature
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-xs text-zinc-300 leading-snug">
                  I agree that I am engaged strictly as an <strong>Independent Contractor</strong>. I am responsible for my own vehicle, fuel, safety gear, and SARS income taxes.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToRemittance}
                  onChange={(e) => setAgreedToRemittance(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-xs text-zinc-300 leading-snug">
                  I agree to remit <strong>100% of Cash-on-Delivery collections</strong> to the kitchen cashier immediately upon returning from a delivery run.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Type Your Full Legal Name to Sign *
              </label>
              <input
                type="text"
                required
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                placeholder="Digital signature (e.g. Sipho Ndlovu)"
                className="w-full px-3.5 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm font-bold focus:outline-none focus:border-rose-500"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                By typing your name and clicking Submit, you execute this Agreement electronically under South African law.
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-rose-950/50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Saving & Generating Agreement...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Agreement & Download Signed PDF</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
