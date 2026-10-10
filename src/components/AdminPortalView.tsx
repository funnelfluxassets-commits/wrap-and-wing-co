import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Trophy,
  Download,
  Shuffle,
  Search,
  ExternalLink,
  MessageCircle,
  ChefHat,
  LogOut,
  Calendar,
  CheckCircle2,
  X,
  Star,
  Users,
  Flame,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { ReviewDrawEntry } from '../types';
import { GOOGLE_REVIEW_URL } from '../data/stores';
import {
  subscribeToReviewEntries,
  updateReviewEntryStatus,
  exportEntriesToCsv
} from '../services/reviewService';

interface AdminPortalViewProps {
  onBackToMenu: () => void;
  onLogout: () => void;
  onNavigateRole: (role: 'kitchen' | 'driver') => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onBackToMenu,
  onLogout,
  onNavigateRole,
}) => {
  const [entries, setEntries] = useState<ReviewDrawEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'winner'>('all');

  // Random Winner Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<ReviewDrawEntry | null>(null);

  // Subscribe to entries in real-time
  useEffect(() => {
    const unsub = subscribeToReviewEntries((list) => {
      setEntries(list);
    });
    return () => unsub();
  }, []);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        !searchQuery ||
        e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.phone.includes(searchQuery) ||
        e.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.googleReviewName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'winner'
          ? e.status === 'winner'
          : e.status !== 'winner';

      return matchSearch && matchStatus;
    });
  }, [entries, searchQuery, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeek = entries.filter((e) => new Date(e.createdAt) >= oneWeekAgo);
    const winners = entries.filter((e) => e.status === 'winner');

    const totalRatings = entries.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    const avgRating = entries.length > 0 ? (totalRatings / entries.length).toFixed(1) : '5.0';

    return {
      total: entries.length,
      thisWeek: thisWeek.length,
      winners: winners.length,
      avgRating,
    };
  }, [entries]);

  // Pick Random Winner Function
  const handleDrawRandomWinner = () => {
    if (entries.length === 0) {
      alert('No entries available to draw from yet.');
      return;
    }

    setIsDrawing(true);
    setWinnerModalOpen(true);

    // Shuffle excitement loop
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * entries.length);
      setSelectedWinner(entries[randomIndex]);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        // Final pick
        const finalWinner = entries[Math.floor(Math.random() * entries.length)];
        setSelectedWinner(finalWinner);
        setIsDrawing(false);
      }
    }, 100);
  };

  const handleMarkAsWinner = async (entry: ReviewDrawEntry) => {
    await updateReviewEntryStatus(entry.id, 'winner');
    setSelectedWinner((prev) => (prev?.id === entry.id ? { ...prev, status: 'winner' } : prev));
  };

  const getCleanWhatsAppPhone = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '27' + clean.slice(1);
    }
    return clean;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* ── Top Admin Bar ── */}
      <header className="sticky top-0 z-40 bg-[#121218]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Admin Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-950/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Manager Portal
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                  Protected
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white">
                Wrap & Wings Co Admin Center
              </h1>
            </div>
          </div>

          {/* Quick Department Jump & Logout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateRole('kitchen')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Kitchen Display"
            >
              <ChefHat className="w-3.5 h-3.5 text-rose-500" />
              <span>Kitchen Display</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateRole('driver')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Driver Dispatch"
            >
              <DeliveryMotorbikeIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Driver Portal</span>
            </button>

            <button
              type="button"
              onClick={onBackToMenu}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Customer Food Menu"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer Menu</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white transition-colors cursor-pointer"
              title="Logout from Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Body ── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Entries</span>
              <Users className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{metrics.total}</div>
            <p className="text-[11px] text-zinc-400">All-time review entries</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">This Week</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{metrics.thisWeek}</div>
            <p className="text-[11px] text-zinc-400">Eligible for Sunday draw</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg Satisfaction</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{metrics.avgRating} ★</div>
            <p className="text-[11px] text-zinc-400">Customer feedback score</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Winners Drawn</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{metrics.winners}</div>
            <p className="text-[11px] text-zinc-400">Weekly R500 cash awarded</p>
          </div>
        </div>

        {/* Action Controls & Toolbar */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#13131a] border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Draw Winner Button */}
            <button
              type="button"
              onClick={handleDrawRandomWinner}
              disabled={entries.length === 0}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              <span>🎲 Draw Sunday Winner</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={() => exportEntriesToCsv(entries)}
              disabled={entries.length === 0}
              className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              title="Download all entries into Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Status Filter Buttons */}
            <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-rose-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({entries.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('winner')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'winner'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Winners ({metrics.winners})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, slip #..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* ── Entries Table ── */}
        <div className="rounded-3xl bg-[#13131a] border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Customer Draw Entries ({filteredEntries.length})</span>
            </h2>
            <span className="text-xs text-zinc-400">Live Firebase & Storage Sync</span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <Trophy className="w-12 h-12 mx-auto text-zinc-600" />
              <h3 className="text-base font-bold text-white">No Entries Found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'No entries match your search query.'
                  : 'Customer entries will appear here the moment someone scans the QR code and submits their details.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 text-[11px] font-black uppercase text-zinc-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">WhatsApp / Cell</th>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Google Account</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Comments</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEntries.map((e) => (
                    <tr
                      key={e.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        e.status === 'winner' ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        {e.fullName}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                        <a
                          href={`https://wa.me/${getCleanWhatsAppPhone(e.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{e.phone}</span>
                        </a>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                        {e.receiptNumber}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-800 border border-white/5 text-zinc-200">
                          {e.googleReviewName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-amber-400 font-bold whitespace-nowrap">
                        {e.rating || 5} ★
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate" title={e.comments}>
                        {e.comments || '—'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {e.status === 'winner' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-[10px] uppercase flex items-center gap-1 w-max">
                            <Trophy className="w-3 h-3" />
                            <span>Winner</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {e.status !== 'winner' ? (
                          <button
                            type="button"
                            onClick={() => handleMarkAsWinner(e)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-amber-600 hover:text-zinc-950 text-zinc-300 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Mark Winner
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-bold">Awarded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Random Winner Drawn Spotlight Modal ── */}
      {winnerModalOpen && selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#14141c] border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/50 space-y-6 text-center">
            <button
              type="button"
              onClick={() => setWinnerModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-amber-950/60 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                {isDrawing ? 'Shuffling Entries...' : '🏆 Sunday Draw Winner Selected!'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {selectedWinner.fullName}
              </h3>
            </div>

            {/* Winner Details Card */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-left text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-zinc-400">Order / Receipt Slip:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {selectedWinner.receiptNumber}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-zinc-400">Google Username to Check:</span>
                <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                  {selectedWinner.googleReviewName}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-zinc-400">WhatsApp / Cell:</span>
                <span className="font-bold text-white">{selectedWinner.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Internal Rating:</span>
                <span className="font-bold text-amber-400">{selectedWinner.rating || 5} ★</span>
              </div>

              {selectedWinner.comments && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-zinc-400 block text-[11px] mb-0.5">Feedback Note:</span>
                  <p className="text-zinc-200 italic">"{selectedWinner.comments}"</p>
                </div>
              )}
            </div>

            {/* Verification Checklist */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 text-left text-xs space-y-2 text-zinc-300">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                3-Step Verification Checklist:
              </div>
              <ol className="space-y-1.5 pl-5 list-decimal text-zinc-300">
                <li>
                  Check Google Review under <strong>"{selectedWinner.googleReviewName}"</strong>:{' '}
                  <a
                    href={GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline inline-flex items-center gap-1 font-bold ml-1"
                  >
                    <span>Open Google Reviews</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Match Receipt Number <strong>"{selectedWinner.receiptNumber}"</strong> in your POS.</li>
                <li>Notify customer via WhatsApp to send R500 eWallet or arrange cash pickup.</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <a
                href={`https://wa.me/${getCleanWhatsAppPhone(
                  selectedWinner.phone
                )}?text=${encodeURIComponent(
                  `Hi ${selectedWinner.fullName}! 🎉 Congratulations from Wrap & Wings Co! You have won our Weekly R500 Cash Draw with receipt #${selectedWinner.receiptNumber}. Please reply to confirm your details!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message Winner on WhatsApp</span>
              </a>

              {selectedWinner.status !== 'winner' ? (
                <button
                  type="button"
                  onClick={() => handleMarkAsWinner(selectedWinner)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors cursor-pointer"
                >
                  Confirm as Winner
                </button>
              ) : (
                <span className="text-xs text-emerald-400 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recorded as Winner</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
