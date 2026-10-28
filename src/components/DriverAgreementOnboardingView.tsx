import React, { useState } from 'react';
import {
  Lock,
  ArrowLeft,
  CheckCircle2,
  Download,
  Printer,
  ShieldCheck,
  Truck,
  FileText,
  Bike,
  Car,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Clock,
  DollarSign,
  MapPin,
  Flame,
} from 'lucide-react';
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

  // Accordion Expand/Collapse State for the 10 Contract Points (all open by default)
  const [expandedPoints, setExpandedPoints] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
  });


  const togglePoint = (num: number) => {
    setExpandedPoints((prev) => ({
      ...prev,
      [num]: !prev[num],
    }));
  };

  const expandAllPoints = () => {
    setExpandedPoints({
      1: true, 2: true, 3: true, 4: true, 5: true,
      6: true, 7: true, 8: true, 9: true, 10: true,
    });
  };

  const collapseAllPoints = () => {
    setExpandedPoints({});
  };

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

          {/* Section 5: Official Agreement Terms & Conditions (10 Expandable Points) */}
          <div className="bg-[#13131b] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>5. Official Agreement Terms &amp; Conditions (Points 1 to 10)</span>
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Click any point card below to expand and review the complete legal clauses from the original contract agreement.
                </p>
              </div>

              {/* Expand / Collapse All Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={expandAllPoints}
                  className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAllPoints}
                  className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Accordion Points List */}
            <div className="space-y-3">

              {/* Point 1: Purpose & Appointment */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(1)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 1: Purpose &amp; Appointment
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        On-demand delivery services from Shop 1, Uniland Centre, 24 Anderson Road, Pinetown
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[1] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[1] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      Wrap &amp; Wing Co. engages the Driver, and the Driver agrees, to provide on-demand food delivery services from the Wrap &amp; Wing Co. Pinetown store (<strong className="text-white">Shop 1, Uniland Centre, 24 Anderson Road, Pinetown, 3610, KwaZulu-Natal</strong>) to customers ordering via the official restaurant ordering platform, in accordance with the terms and conditions outlined in this Agreement.
                    </p>
                  </div>
                )}
              </div>

              {/* Point 2: Independent Contractor Status */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(2)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 2: Independent Contractor Status
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Strictly independent contractor • Not an employee • Full autonomy
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[2] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[2] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2.5 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      <strong>2.1.</strong> The Driver is engaged strictly as an <strong className="text-white">Independent Contractor</strong> and not as an employee, agent, partner, or joint venturer of Wrap &amp; Wing Co.
                    </p>
                    <p className="leading-relaxed">
                      <strong>2.2.</strong> The Driver acknowledges and agrees that:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 pl-1 text-zinc-300">
                      <li>There is no expectation of fixed employment, minimum guaranteed hourly wage, overtime, sick leave, annual leave, or severance pay.</li>
                      <li>The Driver has full autonomy to accept or decline individual delivery requests based on availability.</li>
                      <li>The Driver is solely responsible for declaring and paying their own income taxes (SARS) and statutory contributions as an independent earner.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Point 3: Vehicle, Fuel, Smartphone & Operational Costs */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(3)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 3: Vehicle, Fuel, Smartphone &amp; Operational Costs
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Driver-provided vehicle &amp; fuel • Cellular data &amp; GPS • Thermal delivery bag
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[3] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[3] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      <strong className="text-white">3.1. Vehicle &amp; Fuel:</strong> The Driver provides their own motorcycle, scooter, or vehicle at their own expense. All costs related to fuel, maintenance, servicing, tyre repairs, licence renewals, and roadworthiness are the sole responsibility of the Driver.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">3.2. Smartphone &amp; Data:</strong> The Driver must maintain a working smartphone with active cellular data capable of running WhatsApp, receiving digital order tickets, and using GPS navigation (Google Maps or Waze).
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">3.3. Delivery Equipment:</strong> All food orders must be transported in a clean, insulated, thermal delivery bag/box to preserve food temperature, hygiene, and presentation.
                    </p>
                  </div>
                )}
              </div>

              {/* Point 4: Remuneration, Distance Tiers & Tips */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(4)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 4: Remuneration, Distance Tiers &amp; Tips
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Zoned base payouts (R28.00 to R75.00) + 100% of customer tips to Driver
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[4] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[4] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-3 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      <strong className="text-white">4.1. Variable Delivery Fee per Trip (Radius from Shop 1, Uniland Centre):</strong><br />
                      For each successfully completed delivery order, Wrap &amp; Wing Co. will pay the Driver a base trip fee determined by the delivery distance zone:
                    </p>

                    {/* Zone Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="bg-black/60 border border-white/10 p-3 rounded-2xl">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 1 (0–3 km)</div>
                        <div className="text-base font-black text-rose-400">R28.00</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Pinetown CBD, Hatton Estate, Ashley, Surprise Farm</div>
                      </div>
                      <div className="bg-black/60 border border-white/10 p-3 rounded-2xl">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 2 (3.1–6 km)</div>
                        <div className="text-base font-black text-rose-400">R40.00</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">New Germany, Cowies Hill, Sarnia, Moseley</div>
                      </div>
                      <div className="bg-black/60 border border-white/10 p-3 rounded-2xl">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 3 (6.1–10 km)</div>
                        <div className="text-base font-black text-rose-400">R58.00</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Westville, Kloof, Chiltern Hills</div>
                      </div>
                      <div className="bg-black/60 border border-white/10 p-3 rounded-2xl">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Zone 4 (10.1–14 km)</div>
                        <div className="text-base font-black text-rose-400">R75.00</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Hillcrest, Waterfall, Pinetown South</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-300 italic">
                      *Deliveries exceeding 14.0 km must be pre-approved by the restaurant manager on duty and will be remunerated at a mutually agreed custom rate (minimum R85.00).
                    </p>

                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <p className="font-bold text-white">4.2. Customer Tips (100% Pass-Through):</p>
                      <p className="leading-relaxed">
                        The Driver retains <strong className="text-emerald-400">100% of all customer tips</strong>:
                      </p>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-300">
                        <li><strong className="text-white">Digital Tips:</strong> Tips paid by card, PayFast, or digital checkout through the website are recorded directly in the order ledger and remitted in full to the Driver in the weekly payout.</li>
                        <li><strong className="text-white">Cash Tips:</strong> Tips handed directly in cash by the customer belong entirely to the Driver immediately.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Point 5: Payment Schedule & Settlement Cycle */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(5)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 5: Payment Schedule &amp; Settlement Cycle
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Weekly cycle Mon 00:00 to Sat 23:59 • EFT Payout every Monday by 12:00 PM
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[5] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[5] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      <strong className="text-white">5.1. Billing Cycle:</strong> The delivery week runs from <strong className="text-amber-400">Monday 00:00 to Saturday 23:59</strong>.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">5.2. Weekly Reconciliation:</strong> Every Monday morning, restaurant management reconciles completed deliveries, trip fees, and tips using the Wrap &amp; Wing Co. Admin Portal order logs.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">5.3. Payment Day:</strong> Payouts are transferred via Electronic Funds Transfer (EFT) directly into the Driver&apos;s linked South African bank account (e.g., Capitec, FNB, Standard Bank, Nedbank) by <strong className="text-emerald-400">Monday 12:00 PM</strong> for the preceding week&apos;s completed trips.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">5.4. Weekly Earnings Statement:</strong> A digital trip breakdown (showing total trips, distance fees, tips, and net payout) will be sent to the Driver via WhatsApp or email alongside the payment confirmation.
                    </p>
                  </div>
                )}
              </div>

              {/* Point 6: Cash-on-Delivery (COD) Procedures */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(6)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      6
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 6: Cash-on-Delivery (COD) Procedures
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Exact cash collection • 100% remittance to kitchen cashier immediately upon return
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[6] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[6] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="text-zinc-400">If the Driver accepts an order where the customer selected Cash on Delivery:</p>
                    <p className="leading-relaxed">
                      <strong className="text-white">6.1.</strong> The Driver must collect the exact food amount plus delivery fee from the customer before handing over the food order.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">6.2.</strong> The Driver must return and remit <strong className="text-rose-400">100% of the food collection cash</strong> to the kitchen cashier immediately upon returning to the store.
                    </p>
                    <p className="leading-relaxed text-rose-300">
                      <strong className="text-rose-400">6.3.</strong> Withholding, short-paying, or delaying cash remittances constitutes gross misconduct and grounds for immediate contract termination and legal recovery.
                    </p>
                  </div>
                )}
              </div>

              {/* Point 7: Driver Standards, Hygiene & Conduct */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(7)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      7
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 7: Driver Standards, Hygiene &amp; Conduct
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Thermal bag care • Professional courtesy • Zero tolerance policy
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[7] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[7] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      <strong className="text-white">7.1. Food Quality &amp; Handling:</strong> Food must remain upright, unopened, and sealed inside the thermal bag until handed directly to the customer.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">7.2. Customer Service:</strong> The Driver will represent Wrap &amp; Wing Co. professionally, courteously, and respectfully at all times.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">7.3. Communication:</strong> In the event of traffic delays, complex access issues, or difficulty locating a customer, the Driver must promptly message or call the customer or restaurant manager.
                    </p>
                    <p className="leading-relaxed text-rose-300">
                      <strong className="text-rose-400">7.4. Zero Tolerance:</strong> Drinking alcohol, substance use, reckless driving, food tampering, or aggressive behaviour will result in immediate termination of this Agreement.
                    </p>
                  </div>
                )}
              </div>

              {/* Point 8: Safety, Licencing & Liability */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(8)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      8
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 8: Safety, Licencing &amp; Liability
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Light Vehicle Code 8 / Code B &amp; Motorcycle Code A / A1 • Driver operates at own risk
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[8] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[8] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      <strong className="text-white">8.1. Licence &amp; Compliance:</strong> The Driver warrants that they hold a valid South African Driver&apos;s Licence (<strong className="text-amber-300">Light Vehicle Code 8 / Code B, or Motorcycle Code A / A1</strong>) and that their vehicle is legally licensed, roadworthy, and equipped with a helmet and required safety gear.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">8.2. Insurance &amp; Accidents:</strong> The Driver acknowledges that Wrap &amp; Wing Co. does not provide vehicle insurance, third-party liability insurance, medical aid, or personal injury cover. The Driver operates their vehicle at their own risk.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">8.3. Traffic Violations:</strong> All traffic fines, speeding citations, parking tickets, or towing costs incurred during deliveries are the sole responsibility of the Driver.
                    </p>
                  </div>
                )}
              </div>

              {/* Point 9: Duration & Termination */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(9)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      9
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 9: Duration &amp; Termination
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Month-to-month basis • 7 calendar days notice • Immediate termination for misconduct
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[9] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[9] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      <strong className="text-white">9.1.</strong> This Agreement commences on the date of signature and continues on a month-to-month basis.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">9.2.</strong> Either party may terminate this Agreement at any time by providing <strong className="text-amber-300">seven (7) calendar days&apos; written notice</strong> (including via WhatsApp).
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-white">9.3.</strong> Wrap &amp; Wing Co. reserves the right to terminate this Agreement immediately without notice in the event of theft, fraud, violence, food safety violations, driving under the influence, or failure to remit cash collections.
                    </p>
                  </div>
                )}
              </div>

              {/* Point 10: Signatures & Digital Acceptance */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePoint(10)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      10
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white">
                        Point 10: Signatures &amp; Acceptance
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400">
                        Legally binding electronic signature under the South African ECT Act
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                    {expandedPoints[10] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedPoints[10] && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 space-y-2 bg-zinc-950/40">
                    <p className="leading-relaxed">
                      By digitally signing and submitting Section 6 below, both parties acknowledge and accept all the terms, conditions, distance rate tiers, and remittance obligations set out in this Agreement.
                    </p>
                  </div>
                )}
              </div>

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
