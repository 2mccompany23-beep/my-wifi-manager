import React, { useState, useEffect } from 'react';
import { Printer, ShieldCheck, QrCode, RefreshCw, Layers, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { VoucherItem } from '../types';
import { ToastContainer, useToast } from './Toast';

interface VoucherGeneratorProps {
  vouchers: VoucherItem[];
  onRefresh: () => void;
}

export const VoucherGenerator: React.FC<VoucherGeneratorProps> = ({ vouchers, onRefresh }) => {
  const { toasts, dismiss, success, error } = useToast();
  const [prefix, setPrefix] = useState('2MC-');
  const [length, setLength] = useState(5);
  const [selectedProfile, setSelectedProfile] = useState('300-F-24h');
  const [price, setPrice] = useState(300);
  const [quantity, setQuantity] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [printMode, setPrintMode] = useState<'thermal' | 'a4'>('thermal');
  const [generatedVouchers, setGeneratedVouchers] = useState<VoucherItem[]>([]);
  const [qrMap, setQrMap] = useState<{ [code: string]: string }>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Update default price when profile changes
  const handleProfileChange = (profile: string) => {
    setSelectedProfile(profile);
    const priceMap: { [key: string]: number } = {
      '100-F-4h': 100,
      '200---12h': 200,
      '300-F-24h': 300,
      '500---4j': 500,
      '1200---7j': 1200,
      '4000--30j': 4000
    };
    setPrice(priceMap[profile] || 100);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('mikhmon_token')}`
        },
        body: JSON.stringify({
          prefix,
          length,
          profile: selectedProfile,
          quantity: parseInt(String(quantity)),
          price: parseInt(String(price))
        })
      });
      const data = await res.json();
      if (data.vouchers) {
        setGeneratedVouchers(data.vouchers);
        generateQrCodes(data.vouchers);
        success(`${data.vouchers.length} ticket(s) généré(s) avec succès !`);
      }
      onRefresh();
    } catch {
      error('Erreur lors de la génération des vouchers.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQrCodes = async (items: VoucherItem[]) => {
    const map: { [code: string]: string } = {};
    for (const v of items) {
      try {
        const loginUrl = `http://mcwifi.net/login?username=${encodeURIComponent(v.code)}&password=${encodeURIComponent(v.code)}`;
        const qrDataUrl = await QRCode.toDataURL(loginUrl, { margin: 1, width: 120 });
        map[v.code] = qrDataUrl;
      } catch (e) {
        console.error('QR Error:', e);
      }
    }
    setQrMap(map);
  };

  useEffect(() => {
    if (vouchers.length > 0 && generatedVouchers.length === 0) {
      setGeneratedVouchers(vouchers.slice(0, 10));
      generateQrCodes(vouchers.slice(0, 10));
    }
  }, [vouchers]);

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="space-y-6">
      
      {/* Generator Control Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Générateur de Tickets & Vouchers Mikhmon</h3>
              <p className="text-xs text-slate-400">
                Imprimez ou enregistrez des lots de codes d'accès WiFi avec QR Codes intégrés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintMode('thermal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                printMode === 'thermal'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Format Thermique (58mm)
            </button>
            <button
              onClick={() => setPrintMode('a4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                printMode === 'a4'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Format Grille A4
            </button>
            <button
              onClick={handlePrint}
              disabled={generatedVouchers.length === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Préfixe du code</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Profil Forfait</label>
            <select
              value={selectedProfile}
              onChange={(e) => handleProfileChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="100-F-4h">100-F-4h (4h - 100 FCFA)</option>
              <option value="200---12h">200---12h (12h - 200 FCFA)</option>
              <option value="300-F-24h">300-F-24h (24h - 300 FCFA)</option>
              <option value="500---4j">500---4j (4j - 500 FCFA)</option>
              <option value="1200---7j">1200---7j (7j - 1 200 FCFA)</option>
              <option value="4000--30j">4000--30j (30j - 4 000 FCFA)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Prix (FCFA)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Quantité à générer</label>
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>Générer</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tickets Preview Area & Print Template Target */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Aperçu des tickets générés ({generatedVouchers.length})</span>
          <span className="text-xs font-normal text-slate-400">Prêt pour impression physique</span>
        </h4>

        {/* Printable target container */}
        <div id="print-section" className="bg-slate-950 p-4 rounded-xl">
          
          {printMode === 'thermal' ? (
            /* Thermal Ticket Layout (Single Column 58mm Receipt) */
            <div className="flex flex-col items-center gap-6 max-w-xs mx-auto">
              {generatedVouchers.map((v) => (
                <div
                  key={v.id}
                  className="bg-white text-black p-4 rounded-xl shadow-lg border border-slate-300 w-full font-sans text-center text-xs relative overflow-hidden"
                >
                  <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                    <div className="font-extrabold text-sm tracking-tight text-indigo-950">2MC WIFI ZONE</div>
                    <div className="text-[10px] text-slate-600 font-semibold">mcwifi.net</div>
                  </div>

                  <div className="my-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Code d'accès unique</div>
                    <div className="text-lg font-black text-indigo-700 tracking-wider font-mono my-0.5">{v.code}</div>
                    <div className="text-[10px] text-slate-600">Password: <span className="font-bold">{v.code}</span></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] my-2 font-semibold text-slate-700">
                    <span>Forfait: {v.profile}</span>
                    <span className="font-bold text-indigo-900">{v.price} FCFA</span>
                  </div>

                  {qrMap[v.code] && (
                    <div className="my-2 flex flex-col items-center">
                      <img src={qrMap[v.code]} alt="QR Code Login" className="w-24 h-24 rounded border border-slate-200" />
                      <span className="text-[9px] text-slate-500 mt-1">Scannez pour connexion automatique</span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-slate-300 pt-2 text-[9px] text-slate-500">
                    Merci pour votre confiance ! | Support: +229 44
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* A4 Sheet Grid Layout (3 Columns Grid) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {generatedVouchers.map((v) => (
                <div
                  key={v.id}
                  className="bg-white text-black p-3.5 rounded-xl border border-slate-300 font-sans text-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
                    <span className="font-extrabold text-indigo-950 text-xs">2MC WIFI ZONE</span>
                    <span className="font-bold text-indigo-700 text-xs">{v.price} FCFA</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-bold">CODE ACCÈS</div>
                      <div className="text-base font-black text-indigo-900 font-mono tracking-wider">{v.code}</div>
                      <div className="text-[9px] text-slate-600 font-medium">Validité: {v.profile}</div>
                    </div>
                    {qrMap[v.code] && (
                      <img src={qrMap[v.code]} alt="QR" className="w-16 h-16 rounded border border-slate-200" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
    </>
  );
};
