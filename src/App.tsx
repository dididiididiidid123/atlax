import { ModeKey, MODULES, getModule } from './config/modules';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TaxFormData, 
  ComprehensiveTaxState, 
  TaxReportingType 
} from './types/tax';
import { initialTaxData, loadDraft, saveDraft, clearDraft } from './utils/storage';
import { calculateTax } from './utils/taxCalculator';
import { calculateComprehensiveTax } from './utils/taxCalculationEngine';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { StepIdentity } from './components/StepIdentity';
import { StepIncome } from './components/StepIncome';
import { StepCalculation } from './components/StepCalculation';
import { StepSummary } from './components/StepSummary';
import { TaxTypeSelector } from './components/TaxTypeSelector';
import { MultiTaxForm } from './components/MultiTaxForm';
import { TaxReminderModal } from './components/TaxReminderModal';
import { HelpCenterModal } from './components/HelpCenterModal';
import { SystemRecoveryBanner } from './components/SystemRecoveryBanner';
import { DocumentsModule } from './components/DocumentsModule';
import { SettingsModule } from './components/SettingsModule';
import { PelajariPajak } from './components/PelajariPajak';
import { ToastHost } from './components/ToastHost';
import { SideNav } from './components/SideNav';
import { HomeInfo } from './components/HomeInfo';
import { ProgressCard } from './components/ProgressCard';
import { ProblemGuide, GuideTarget } from './components/ProblemGuide';
import { LateScheduleTable } from './components/LateScheduleTable';
import { AccountingModule } from './components/AccountingModule';
import { TaxAdminModule } from './components/TaxAdminModule';
import { KepatuhanPanel } from './components/KepatuhanPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PkpModule } from './components/PkpModule';
import { BackupPanel } from './components/BackupPanel';
import { ArrowRight, FileSpreadsheet, FileText, Layers } from 'lucide-react';
import { ModuleHero } from './components/ModuleIntro';

const initialComprehensiveState: ComprehensiveTaxState = {
  profile: {
    fullName: '',
    nik: '',
    npwp: '',
    email: '',
    phone: '',
    ptkpStatus: 'TK/0',
    taxYear: new Date().getFullYear(),
    userType: 'OP',
  },
  selectedReportingType: 'PPH_21',
  reportingPeriod: 'MONTHLY',
  selectedMonth: new Date().getMonth() + 1,
  pph15: {
    category: 'PELAYARAN_DN',
    grossAmount: 0,
    dpp: 0,
    ratePercent: 0,
    taxAlreadyPaid: 0,
    legalReference: '',
    buktiNomor: '',
    buktiTanggal: '',
  },
  pph42: {
    objectCategory: 'SEWA_TANAH_BANGUNAN',
    grossAmount: 0,
    dpp: 0,
    ratePercent: 0,
    taxAlreadyPaid: 0,
    legalReference: '',
    buktiNomor: '',
    buktiTanggal: '',
  },
  pph21: {
    mode: 'KARYAWAN',
    noNpwp: false,
    nikGiven: false,
    grossSalaryMonthly: 0,
    bonusThr: 0,
    pensionContributionMonthly: 0,
    withholdingTaxPaid: 0,
    withholdingTaxJanToNov: 0,
    freelanceRevenueAnnual: 0,
    freelanceNppnPercent: 50,
    freelancePrepaid: 0,
  },
  umkm: {
    kategori: 'OP',
    tahunTerdaftar: new Date().getFullYear(),
    omzetBulanan: Array(12).fill(0),
    biayaBulanan: Array(12).fill(0),
  },
  pph22: {
    transactionType: 'PEMERINTAH',
    transactionValue: 0,
    hasNpwp: true,
    taxAlreadyPaid: 0,
  },
  pph23: {
    incomeType: 'JASA',
    grossAmount: 0,
    hasNpwp: true,
    taxAlreadyPaid: 0,
  },
  pph24: {
    domesticNetIncome: 0,
    totalPkp: 0,
    pphTerutangSebelumKredit: 0,
    countries: [],
  },
  pph25: {
    priorYearTaxDue: 0,
    priorYearTaxCredits: 0,
    unabsorbedLoss: 0,
    taxAlreadyPaid: 0,
  },
  pph26: {
    incomeType: 'JASA',
    grossAmount: 0,
    taxTreatyRate: 10,
    hasDGTForm: true,
    taxAlreadyPaid: 0,
  },
  pph28: {
    totalTaxDue: 0,
    creditPPh21: 0,
    creditPPh22: 0,
    creditPPh23: 0,
    creditPPh24: 0,
    creditPPh25Paid: 0,
  },
  pph29: {
    annualGrossIncome: 0,
    annualNetIncome: 0,
    ptkpStatus: 'TK/0',
    totalTaxCredits: 0,
  },
  ppn: {
    outputTaxTaxableSales: 0,
    exportSales: 0,
    nonTaxableSales: 0,
    inputTaxCreditable: 0,
    priorMonthCompensation: 0,
    ppnbmTaxableSales: 0,
    ppnbmRate: 0,
  },
  lastUpdated: new Date().toISOString(),
};

const HOME_KEYS: ModeKey[] = ['WIZARD', 'MULTI_TAX', 'ACCOUNTING'];
const HOME_MODULES = MODULES.filter((m) => HOME_KEYS.includes(m.key));

export function App() {
  const [activeTabMode, setActiveTabMode] = useState<ModeKey | null>(null);
  
  // State Mode 1: SPT Tahunan Wizard
  const [data, setData] = useState<TaxFormData>(initialTaxData);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [recoveryData, setRecoveryData] = useState<TaxFormData | null>(null);

  // State Mode 2: Multi-Tax Reporting (PPh 21, 22, 23, 24, 25, 26, 28, 29, PPN)
  const [multiTaxState, setMultiTaxState] = useState<ComprehensiveTaxState>(initialComprehensiveState);

  // Modals & Timers
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toISOString());
  const [showWelcome, setShowWelcome] = useState<boolean>(() => !sessionStorage.getItem('atlax_welcome_seen'));

  // Setiap kali modul dibuka atau kembali ke daftar, halaman langsung ke bagian paling atas
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTabMode]);

  // Inisialisasi: Cek draf pemulihan sistem (System Recovery)
  useEffect(() => {
    const { hasDraft, data: savedData } = loadDraft();
    if (hasDraft && savedData && savedData.lastUpdated) {
      setRecoveryData(savedData);
      setShowRecoveryBanner(true);
    }
  }, []);

  // Autosave
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveDraft(data);
      setLastSaved(new Date().toISOString());
    }, 600);
    return () => clearTimeout(timer);
  }, [data]);

  // Kalkulasi Wizard SPT Tahunan
  const calculation = useMemo(() => calculateTax(data), [data]);

  // Kalkulasi Multi-Tax Engine
  // Identitas (NPWP, NIK, nama) tidak wajib untuk menghitung; hanya dipakai saat menyalin atau mencetak laporan
  const multiTaxCalculation = useMemo(() => calculateComprehensiveTax(multiTaxState), [multiTaxState]);

  // Handler Pemulihan Sistem
  const handleRestoreDraft = () => {
    if (recoveryData) {
      setData({ ...recoveryData });
      setShowRecoveryBanner(false);
    }
  };

  const handleDismissRecovery = () => {
    setShowRecoveryBanner(false);
  };

  // Reset Formulir
  const handleReset = () => {
    if (window.confirm('Mulai ulang dari awal? Seluruh isian formulir akan dibersihkan.')) {
      // Hapus draf tersimpan lalu muat ulang halaman, supaya seluruh tampilan kembali ke kondisi awal.
      clearDraft();
      setShowRecoveryBanner(false);
      window.location.reload();
    }
  };

  // Navigasi Langkah Wizard
  const handleSelectStep = (step: number) => {
    setData((prev) => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep = () => {
    setData((prev) => ({ ...prev, step: Math.min(prev.step + 1, 4) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setData((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tujuan dari pemandu masalah: membuka modul, pengingat, atau bantuan
  const handleGuideNavigate = (target: GuideTarget) => {
    if (target === 'REMINDER') return setIsReminderOpen(true);
    if (target === 'HELP') return setIsHelpOpen(true);
    if (target === 'LEARN') return setActiveTabMode('DRAFT');
    setActiveTabMode(target as ModeKey);
  };

  if (showWelcome) {
    return (
      <WelcomeScreen
        onStart={() => {
          sessionStorage.setItem('atlax_welcome_seen', '1');
          setShowWelcome(false);
        }}
      />
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 lg:flex-row">
      <SideNav
        activeMode={activeTabMode}
        onHome={() => setActiveTabMode(null)}
        onSelect={(key) => setActiveTabMode(key)}
      />
      <div className="relative flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {/* Garis progres singkat setiap kali modul berpindah, sebagai umpan balik saat menekan menu */}
        <div key={activeTabMode ?? 'home'} className="nav-progress" aria-hidden="true" />

      {/* Banner System Recovery */}
      <SystemRecoveryBanner
        isVisible={showRecoveryBanner}
        lastUpdated={recoveryData?.lastUpdated || ''}
        onRestore={handleRestoreDraft}
        onDismiss={handleDismissRecovery}
      />

      {/* Header Utama */}
      <Header
        lastSaved={lastSaved}
        namaFormulir={multiTaxState.profile.fullName}
        onOpenReminder={() => setIsReminderOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onReset={handleReset}
        onNavigate={handleGuideNavigate}
      />

      {activeTabMode === null ? (
        /* Beranda: tiga tugas utama. Modul lain ada di menu kiri. */
        <section className="px-4 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-[1600px]">
            <HomeInfo
              onOpen={(key) => setActiveTabMode(key)}
              onOpenHelp={() => setIsHelpOpen(true)}
              namaFormulir={multiTaxState.profile.fullName}
            />

            <div className="mt-8 print:hidden">
              <ProgressCard />
            </div>
          </div>
        </section>
      ) : null}
      <div key={activeTabMode ?? 'home'} className="module-enter flex-1 flex flex-col">
      {/* Pembuka modul: tombol kembali, nama modul, dan langkah-langkahnya */}
      {activeTabMode && (() => {
        const mode = getModule(activeTabMode);
        if (!mode) return null;
        const style = mode.style;
        return (
          <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-6">
            <ModuleHero
              icon={mode.icon}
              title={mode.title}
              what={mode.sub}
              steps={mode.steps}
              grad={style.grad}
              soft={style.soft}
              index={MODULES.indexOf(mode)}
              total={MODULES.length}
              onBack={() => setActiveTabMode(null)}
            />
          </div>
        );
      })()}
      {activeTabMode === 'WIZARD' && (
        <>
          <div className="print:hidden">
            <StepIndicator
              currentStep={data.step}
              onSelectStep={handleSelectStep}
            />
          </div>

          <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8">
            {data.step === 1 && (
              <StepIdentity
                profile={data.profile}
                onChange={(updated) =>
                  setData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, ...updated },
                  }))
                }
                onNext={handleNextStep}
              />
            )}

            {data.step === 2 && (
              <StepIncome
                data={data}
                onChangeCategory={(cat) => setData((prev) => ({ ...prev, category: cat }))}
                onChangeKaryawan={(k) =>
                  setData((prev) => ({
                    ...prev,
                    karyawan: { ...prev.karyawan, ...k },
                  }))
                }
                onChangeUMKM={(u) =>
                  setData((prev) => ({
                    ...prev,
                    umkm: { ...prev.umkm, ...u },
                  }))
                }
                onChangeFreelance={(f) =>
                  setData((prev) => ({
                    ...prev,
                    freelance: { ...prev.freelance, ...f },
                  }))
                }
                onBack={handlePrevStep}
                onNext={handleNextStep}
              />
            )}

            {data.step === 3 && (
              <StepCalculation
                calculation={calculation}
                onBack={handlePrevStep}
                onNext={handleNextStep}
              />
            )}

            {data.step === 4 && (
              <StepSummary
                data={data}
                calculation={calculation}
                onBack={handlePrevStep}
                onReset={handleReset}
              />
            )}
          </main>
        </>
      )}

      {/* MODE 2: MULTI-TAX SUITE (PPh 21, 22, 23, 24, 25, 26, 28, 29 & PPN) */}
      {activeTabMode === 'MULTI_TAX' && (
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          
          {/* Tax Type Selector */}
          <TaxTypeSelector
            selectedType={multiTaxState.selectedReportingType}
            onSelectType={(type) => setMultiTaxState((prev) => ({
              ...prev,
              selectedReportingType: type,
              reportingPeriod: ['PPH_24', 'PPH_28', 'PPH_29'].includes(type) ? 'ANNUAL' : prev.reportingPeriod,
            }))}
          />

          {/* Form & Calculation View */}
          <MultiTaxForm
            state={multiTaxState}
            calculation={multiTaxCalculation}
            onChangeState={(up) => setMultiTaxState((prev) => ({ ...prev, ...up }))}
            onUpdatePph21={(p) => setMultiTaxState((prev) => ({ ...prev, pph21: { ...prev.pph21, ...p } }))}
            onUpdatePph22={(p) => setMultiTaxState((prev) => ({ ...prev, pph22: { ...prev.pph22, ...p } }))}
            onUpdatePph23={(p) => setMultiTaxState((prev) => ({ ...prev, pph23: { ...prev.pph23, ...p } }))}
            onUpdatePph24={(p) => setMultiTaxState((prev) => ({ ...prev, pph24: { ...prev.pph24, ...p } }))}
            onUpdatePph25={(p) => setMultiTaxState((prev) => ({ ...prev, pph25: { ...prev.pph25, ...p } }))}
            onUpdatePph26={(p) => setMultiTaxState((prev) => ({ ...prev, pph26: { ...prev.pph26, ...p } }))}
            onUpdatePph28={(p) => setMultiTaxState((prev) => ({ ...prev, pph28: { ...prev.pph28, ...p } }))}
            onUpdatePph29={(p) => setMultiTaxState((prev) => ({ ...prev, pph29: { ...prev.pph29, ...p } }))}
            onUpdatePph15={(p) => setMultiTaxState((prev) => ({ ...prev, pph15: { ...prev.pph15, ...p } }))}
            onUpdatePph42={(p) => setMultiTaxState((prev) => ({ ...prev, pph42: { ...prev.pph42, ...p } }))}
            onUpdateUmkm={(p) => setMultiTaxState((prev) => ({ ...prev, umkm: { ...prev.umkm, ...p } }))}
            onUpdatePpn={(p) => setMultiTaxState((prev) => ({ ...prev, ppn: { ...prev.ppn, ...p } }))}
          />

        </main>
      )}

      {/* MODE 3: JADWAL BAYAR, PENJELASAN PAJAK, DAN KEPATUHAN (draf SPT ada di modul Dokumen) */}
      {activeTabMode === 'DRAFT' && (
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="print:hidden space-y-6">
            <PelajariPajak />
            <LateScheduleTable />
            <KepatuhanPanel />
            <BackupPanel />
          </div>
        </main>
      )}

      {/* MODE: DOKUMEN SSP, SKP, STP (otomatis dari hitungan) dan dokumen tersimpan */}
      {activeTabMode === 'DOKUMEN' && (
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <DocumentsModule
            wizardData={data}
            wizardCalc={calculation}
            multiState={multiTaxState}
            multiCalc={multiTaxCalculation}
          />
        </main>
      )}
      {/* MODE: PENGATURAN (tampilan, nama sapaan, akun, dan preferensi) */}
      {activeTabMode === 'SETTINGS' && (
        <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-8">
          <SettingsModule />
        </main>
      )}
      {/* MODE 4: PEMBUKUAN & AKUNTANSI */}
      {activeTabMode === 'ACCOUNTING' && (
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8">
          <AccountingModule multiState={multiTaxState} multiCalc={multiTaxCalculation} />
        </main>
      )}

      {/* MODE 5: ADMINISTRASI PAJAK (e-Bupot, faktur pajak, billing) */}
      {activeTabMode === 'ADMIN' && (
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8">
          <TaxAdminModule
            multiState={multiTaxState}
            multiCalc={multiTaxCalculation}
            onApplyPpn={(v) => setMultiTaxState((prev) => ({
              ...prev,
              selectedReportingType: 'PPN',
              ppn: {
                ...prev.ppn,
                outputTaxTaxableSales: v.outputDpp,
                inputTaxCreditable: v.inputPpn,
                ppnbmTaxableSales: v.ppnbmDpp,
                ppnbmRate: v.ppnbmRate,
              },
            }))}
          />
        </main>
      )}

      {/* MODE 6: PEMBUKUAN PKP & NON-PKP */}
      {activeTabMode === 'PKP' && (
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8">
          <PkpModule
            isPkp={multiTaxState.profile.isPkp ?? false}
            onSetPkp={(value) => setMultiTaxState((prev) => ({ ...prev, profile: { ...prev.profile, isPkp: value } }))}
          />
        </main>
      )}

      </div>

      {/* Pesan singkat setelah tindakan (toast) */}
      <ToastHost />

      {/* Modals */}
      <TaxReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />

      <HelpCenterModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Footer & Legal Disclaimer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-[1600px] mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm">ATLAX</span>
            <span>—</span>
            <span className="italic">Make Tax Reporting Simpler</span>
          </div>
          <p className="max-w-[1600px] mx-auto text-slate-600 text-sm leading-relaxed">
            Catatan: ATLAX merupakan konsep aplikasi digital pelaporan pajak mandiri (sesuai dokumen PRD), bukan aplikasi resmi dari Direktorat Jenderal Pajak (DJP) dan bukan pengganti sistem inti resmi Coretax DJP. Fitur penghitungan pajak merujuk pada regulasi perpajakan Republik Indonesia yang berlaku (UU HPP No. 7/2021, PP 55/2022, UU KUP No. 28/2007).
          </p>
        </div>
      </footer>

      </div>
    </div>
  );
}

export default App;
