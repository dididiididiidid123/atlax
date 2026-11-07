import { REGULASI } from '../config/regulasi';
import { 
  ComprehensiveTaxState, 
  UniversalTaxResult, 
  TaxReportingType 
} from '../types/tax';
import { PTKP_RATES, calculateProgressiveTax, formatRupiah } from './taxCalculator';
import type { PPh24Data } from '../types/tax';

// Baris rincian untuk tarif progresif Pasal 17: tiap lapisan dengan jumlah dan pajaknya.
function progressiveLines(pkp: number): string[] {
  const { totalTax, breakdown } = calculateProgressiveTax(pkp);
  if (breakdown.length === 0) return ['PKP nol, sehingga PPh terutang nol'];
  return [
    ...breakdown.map((row) => `${row.bracket}: ${formatRupiah(row.amount)} × ${Math.round(row.rate * 100)}% = ${formatRupiah(row.tax)}`),
    `Total PPh setahun = ${formatRupiah(totalTax)}`
  ];
}

// Baris penutup: pajak terutang dikurangi yang sudah dibayar, lalu statusnya.
function settlementLines(terutang: number, sudahDibayar: number, balance: number, sudahLabel: string): string[] {
  return [
    `${formatRupiah(terutang)} − ${sudahLabel} ${formatRupiah(sudahDibayar)} = ${formatRupiah(balance)}`,
    balance > 0 ? 'Hasilnya kurang bayar' : balance < 0 ? 'Hasilnya lebih bayar' : 'Hasilnya nihil'
  ];
}

// PPh 24: batas kredit dihitung per negara, lalu dibandingkan dengan pajak yang dibayar di negara itu.
// Batas per negara = (neto luar negeri negara itu / total PKP) x PPh terutang Indonesia.
// Kredit yang boleh dikurangkan per negara = nilai yang lebih kecil antara pajak yang dibayar dan batas.
export function pph24Breakdown(d: PPh24Data) {
  const domesticNet = Math.max(0, d.domesticNetIncome || 0);
  const totalPkp = Math.max(0, d.totalPkp || 0);
  const pphTerutang = Math.max(0, d.pphTerutangSebelumKredit || 0);

  const rows = (d.countries || []).map((c) => {
    const netoIdr = Math.round(Math.max(0, c.netoFx || 0) * Math.max(0, c.kurs || 0));
    const pajakIdr = Math.round(Math.max(0, c.pajakFx || 0) * Math.max(0, c.kurs || 0));
    const batas = totalPkp > 0 ? Math.floor((netoIdr / totalPkp) * pphTerutang) : 0;
    const kredit = Math.min(pajakIdr, batas);
    return { id: c.id, negara: c.negara, mataUang: c.mataUang, kurs: c.kurs, netoFx: c.netoFx, pajakFx: c.pajakFx, netoIdr, pajakIdr, batas, kredit };
  });

  const totalForeignNet = rows.reduce((s, r) => s + r.netoIdr, 0);
  const totalNeto = domesticNet + totalForeignNet;
  const kreditSebelumBatasTotal = rows.reduce((s, r) => s + r.kredit, 0);
  // Kredit total tidak boleh melebihi PPh terutang
  const totalKredit = Math.min(kreditSebelumBatasTotal, pphTerutang);
  const sisa = pphTerutang - totalKredit;

  const warnings: string[] = [];
  if (totalPkp === 0) warnings.push('Total PKP belum diisi. Batas kredit dihitung nol.');
  if (totalPkp > 0 && totalForeignNet > totalPkp) warnings.push('Neto luar negeri lebih besar dari total PKP. Periksa angka yang diisi.');
  if (rows.some((r) => r.netoFx > 0 && r.kurs <= 0)) warnings.push('Ada negara yang kursnya belum diisi.');
  if (kreditSebelumBatasTotal > pphTerutang && pphTerutang > 0) warnings.push('Total kredit dibatasi sebesar PPh terutang sebelum kredit.');

  return { domesticNet, totalForeignNet, totalNeto, totalPkp, pphTerutang, rows, totalKredit, sisa, warnings };
}

export function calculateComprehensiveTax(state: ComprehensiveTaxState): UniversalTaxResult {
  const type = state.selectedReportingType;
  const ptkp = PTKP_RATES[state.profile.ptkpStatus] || PTKP_RATES['TK/0'];
  const isAnnual = state.reportingPeriod === 'ANNUAL';

  switch (type) {
    // 1. PPh Pasal 21 (Karyawan & Gaji)
    case 'PPH_21': {
      // Pilihan Freelancer: pekerja bebas dengan norma penghitungan (NPPN), tarif progresif setahun
      if (state.pph21.mode === 'FREELANCER') {
        const revenue = Math.max(0, state.pph21.freelanceRevenueAnnual || 0);
        const nppn = Math.min(100, Math.max(0, state.pph21.freelanceNppnPercent || 0)) / 100;
        const neto = Math.round(revenue * (1 - nppn));
        const rawPKP = Math.max(0, neto - ptkp.amount);
        const pkp = Math.floor(rawPKP / 1000) * 1000;
        const { totalTax } = calculateProgressiveTax(pkp);
        const prepaid = Math.max(0, state.pph21.freelancePrepaid || 0);
        const balance = totalTax - prepaid;

        return {
          taxType: 'PPH_21',
          taxTypeName: 'PPh Orang Pribadi Pekerja Bebas (NPPN, Tarif Progresif)',
          taxBase: pkp,
          applicableRateText: 'Tarif progresif Pasal 17 UU HPP atas PKP setelah NPPN',
          calculatedTax: totalTax,
          creditsOrPrepaid: prepaid,
          finalBalanceDue: balance,
          status: balance > 0 ? 'KURANG_BAYAR' : balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
          paymentDeadline: 'Sebelum penyampaian SPT Tahunan (31 Maret tahun berikutnya)',
          reportingDeadline: 'Batas SPT Tahunan OP 31 Maret tahun berikutnya',
          lateFilingFeeText: 'Denda Rp 100.000 per SPT Tahunan',
          latePaymentInterestRule: 'Bunga per bulan KMK (acuan BI + 5% / 12) maks 24 bulan',
          notes: [
            `Penghasilan bruto (jasa/fee) setahun: ${formatRupiah(revenue)}`,
            `NPPN ${state.pph21.freelanceNppnPercent}%: penghasilan neto ${formatRupiah(neto)}. Pastikan NPPN sesuai jenis usaha dan ketentuan yang berlaku.`,
            `PTKP digunakan: ${ptkp.label} (${formatRupiah(ptkp.amount)}). PKP: ${formatRupiah(pkp)}`,
            `Pajak yang sudah dipotong klien (bukti potong): ${formatRupiah(prepaid)}`,
          ]
        };
      }

      const annualSalary = Math.max(0, state.pph21.grossSalaryMonthly) * 12;
      const grossIncome = annualSalary + Math.max(0, state.pph21.bonusThr || 0);
      const biayaJabatan = Math.min(grossIncome * 0.05, 6_000_000);
      const deductions = Math.round(biayaJabatan + Math.max(0, state.pph21.pensionContributionMonthly) * 12);
      const netIncome = Math.max(0, grossIncome - deductions);
      const rawPKP = Math.max(0, netIncome - ptkp.amount);
      const pkp = Math.floor(rawPKP / 1000) * 1000;
      const { totalTax: baseTax, breakdown: bracketRows } = calculateProgressiveTax(pkp);
      // Tambahan 20% untuk penerima tanpa NPWP dan tanpa NIK (Pasal 21 ayat 5a UU PPh)
      const surcharge = state.pph21.noNpwp && !state.pph21.nikGiven ? 1.2 : 1;
      const totalTax = Math.round(baseTax * surcharge);
      const isDecember = state.reportingPeriod === 'MONTHLY' && state.selectedMonth === 12;
      const monthlyEstimate = Math.round(totalTax / 12);
      const prepaid = isDecember
        ? Math.max(0, state.pph21.withholdingTaxJanToNov || 0)
        : isAnnual
          ? Math.max(0, state.pph21.withholdingTaxPaid || 0)
          : 0;
      const calculatedTax = isAnnual ? totalTax : isDecember ? totalTax : monthlyEstimate;
      const balance = isDecember || isAnnual ? calculatedTax - prepaid : monthlyEstimate;

      return {
        taxType: 'PPH_21',
        steps: [
          {
            label: 'Penghasilan bruto setahun',
            lines: [
              `Gaji bulanan ${formatRupiah(Math.max(0, state.pph21.grossSalaryMonthly))} × 12 = ${formatRupiah(annualSalary)}`,
              ...(state.pph21.bonusThr > 0 ? [`Ditambah THR/bonus ${formatRupiah(state.pph21.bonusThr)}`] : []),
              `Total bruto = ${formatRupiah(grossIncome)}`
            ]
          },
          {
            label: 'Pengurangan: biaya jabatan dan iuran pensiun',
            lines: [
              `Biaya jabatan 5% × ${formatRupiah(grossIncome)} = ${formatRupiah(Math.round(grossIncome * 0.05))}, dibatasi Rp 6.000.000 setahun, jadi diakui ${formatRupiah(biayaJabatan)}`,
              `Iuran pensiun ${formatRupiah(Math.max(0, state.pph21.pensionContributionMonthly))} × 12 = ${formatRupiah(Math.max(0, state.pph21.pensionContributionMonthly) * 12)}`,
              `Total pengurangan = ${formatRupiah(deductions)}`
            ]
          },
          {
            label: 'Penghasilan neto',
            lines: [`${formatRupiah(grossIncome)} − ${formatRupiah(deductions)} = ${formatRupiah(netIncome)}`]
          },
          {
            label: 'Penghasilan kena pajak (PKP)',
            lines: [
              `PTKP status ${ptkp.label}: ${formatRupiah(ptkp.amount)}`,
              `Neto − PTKP = ${formatRupiah(rawPKP)}`,
              `Dibulatkan ke bawah per Rp 1.000 = ${formatRupiah(pkp)}`
            ]
          },
          {
            label: 'PPh terutang dengan tarif progresif',
            lines: bracketRows.length > 0
              ? [
                  ...bracketRows.map((row) => `${row.bracket}: ${formatRupiah(row.amount)} × ${Math.round(row.rate * 100)}% = ${formatRupiah(row.tax)}`),
                  `Total PPh setahun = ${formatRupiah(baseTax)}`
                ]
              : ['PKP nol, sehingga PPh terutang nol']
          },
          ...(surcharge > 1
            ? [{
                label: 'Tambahan 20% (tanpa NPWP dan tanpa NIK)',
                lines: [`${formatRupiah(baseTax)} × 120% = ${formatRupiah(totalTax)}`]
              }]
            : []),
          {
            label: 'Hasil',
            lines: isAnnual || isDecember
              ? [
                  `PPh terutang setahun ${formatRupiah(totalTax)} − sudah dipotong ${formatRupiah(prepaid)} = ${formatRupiah(balance)}`,
                  balance > 0 ? 'Hasilnya kurang bayar' : balance < 0 ? 'Hasilnya lebih bayar' : 'Hasilnya nihil'
                ]
              : [
                  `PPh setahun ${formatRupiah(totalTax)} ÷ 12 = ${formatRupiah(monthlyEstimate)} per bulan (estimasi, bukan pengganti TER)`
                ]
          }
        ],
        taxTypeName: isDecember
          ? 'PPh Pasal 21 (Rekonsiliasi Desember)'
          : isAnnual
            ? 'PPh Pasal 21 (Perhitungan Tahunan)'
            : 'PPh Pasal 21 (Estimasi Masa Bulanan)',
        taxBase: isAnnual || isDecember ? pkp : Math.max(0, state.pph21.grossSalaryMonthly + state.pph21.bonusThr),
        applicableRateText: isAnnual || isDecember
          ? 'Tarif Progresif Pasal 17 UU HPP (rekonsiliasi tahunan)'
          : 'Estimasi per bulan: pajak setahun dibagi 12 (tarif Pasal 17)',
        calculatedTax,
        creditsOrPrepaid: prepaid,
        finalBalanceDue: balance,
        status: balance > 0 ? 'KURANG_BAYAR' : balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: isAnnual
          ? `Sebelum penyampaian SPT Tahunan (${state.profile.userType === 'BADAN' ? '30 April' : '31 Maret'} tahun berikutnya)`
          : 'Tanggal 10 bulan berikutnya',
        reportingDeadline: isAnnual
          ? `Batas SPT Tahunan ${state.profile.userType === 'BADAN' ? 'Badan 30 April' : 'OP 31 Maret'} tahun berikutnya`
          : 'Tanggal 20 bulan berikutnya (SPT Masa PPh 21)',
        lateFilingFeeText: 'Denda Rp 100.000 per Masa Pajak',
        latePaymentInterestRule: 'Bunga per bulan KMK (acuan BI + 5% / 12) maks 24 bulan',
        notes: [
          `PTKP digunakan: ${ptkp.label} (${formatRupiah(ptkp.amount)})`,
          `Biaya jabatan diakui: ${formatRupiah(biayaJabatan)} (Maks. Rp 6.000.000/tahun)`,
          `PKP (Dasar Pengenaan Pajak): ${formatRupiah(pkp)}`,
          isDecember
            ? `PPh 21 yang sudah dipotong Januari-November: ${formatRupiah(prepaid)}. Selisih menjadi potongan Desember.`
            : isAnnual
              ? `PPh 21 yang telah dipotong/disetor setahun: ${formatRupiah(prepaid)}`
              : 'Estimasi ini bukan pengganti penghitungan TER pemberi kerja; gunakan bukti potong untuk rekonsiliasi.'
        ]
      };
    }

    // 2. PPh Pasal 22 (Impor & Pengadaan Barang)
    case 'PPH_22': {
      const dpp = Math.max(0, state.pph22.transactionValue || 0);
      let baseRate = 0.015; // default 1.5% instansi pemerintah
      let rateLabel = '1,5% (Pengadaan Pemerintah)';

      switch (state.pph22.transactionType) {
        case 'PEMERINTAH':
          baseRate = 0.015;
          rateLabel = '1,5% (Pengadaan Barang Instansi Pemerintah)';
          break;
        case 'IMPOR_API':
          baseRate = 0.025;
          rateLabel = '2,5% (Impor dengan Angka Pengenal Impor / API)';
          break;
        case 'IMPOR_NON_API':
          baseRate = 0.075;
          rateLabel = '7,5% (Impor tanpa API)';
          break;
        case 'INDUSTRI_SEMEN':
          baseRate = 0.0025;
          rateLabel = '0,25% (Penjualan Semen Dalam Negeri)';
          break;
        case 'INDUSTRI_KERTAS':
          baseRate = 0.001;
          rateLabel = '0,1% (Penjualan Kertas Dalam Negeri)';
          break;
        case 'INDUSTRI_OTOMOTIF':
          baseRate = 0.0045;
          rateLabel = '0,45% (Penjualan Kendaraan Bermotor)';
          break;
        case 'BARANG_MEWAH':
          baseRate = 0.05;
          rateLabel = '5,0% (Penjualan Barang Sangat Mewah)';
          break;
      }

      // Sanksi tanpa NPWP: tarif 100% lebih tinggi (2x)
      const multiplier = state.pph22.hasNpwp ? 1 : 2;
      const finalRate = baseRate * multiplier;
      const calculatedTax = Math.round(dpp * finalRate);
      const prepaid = Math.max(0, state.pph22.taxAlreadyPaid || 0);
      const balance = calculatedTax - prepaid;

      return {
        taxType: 'PPH_22',
        steps: [
          { label: 'Dasar pengenaan pajak (DPP)', lines: [`Nilai transaksi atau impor ${formatRupiah(dpp)}`] },
          { label: 'Tarif', lines: [`Tarif dasar ${rateLabel}`, state.pph22.hasNpwp ? 'Memiliki NPWP: tarif normal' : `Tanpa NPWP: tarif dikali 2, menjadi ${+(finalRate * 100).toFixed(2)}%`] },
          { label: 'PPh 22 terutang', lines: [`${formatRupiah(dpp)} × ${+(finalRate * 100).toFixed(2)}% = ${formatRupiah(calculatedTax)}`] },
          { label: 'Hasil', lines: settlementLines(calculatedTax, prepaid, balance, 'sudah disetor') }
        ],
        taxTypeName: `PPh Pasal 22 (Impor & Pengadaan Barang${isAnnual ? ' — Rekap Tahunan' : ' — Masa Bulanan'})`,
        taxBase: dpp,
        applicableRateText: state.pph22.hasNpwp ? rateLabel : `${rateLabel} + Kena Kenaikan 100% (Tanpa NPWP)`,
        calculatedTax,
        creditsOrPrepaid: prepaid,
        finalBalanceDue: balance,
        status: balance > 0 ? 'KURANG_BAYAR' : balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: isAnnual
          ? 'Mengikuti waktu pemungutan/setoran setiap transaksi; nominal ini rekap setahun'
          : 'Hari transaksi yang sama (Bendahara) / 1 hari kerja (Bea Cukai) / tgl 10 bulan berikutnya',
        reportingDeadline: isAnnual
          ? 'Rekap tahunan — SPT Masa Unifikasi tetap dilaporkan sesuai periode yang diwajibkan'
          : 'Tanggal 20 bulan berikutnya (SPT Masa Unifikasi)',
        lateFilingFeeText: 'Denda Rp 100.000 per Masa Pajak',
        latePaymentInterestRule: 'Bunga per bulan KMK dari nilai PPh 22 terutang',
        notes: [
          `Dasar Pengenaan Pajak (DPP): ${formatRupiah(dpp)}`,
          `PPh 22 yang sudah dibayar/disetor: ${formatRupiah(prepaid)}`,
          ...(isAnnual ? ['Masukkan total transaksi dan setoran sepanjang tahun; rekap ini tidak menggantikan SPT Masa.'] : []),
          state.pph22.hasNpwp 
            ? 'Memiliki NPWP: Dikenakan tarif normal.' 
            : 'Tidak Memiliki NPWP: Dikenakan tarif 100% lebih tinggi (Pasal 22 ayat 3 UU PPh).'
        ]
      };
    }

    // 3. PPh Pasal 23 (Dividen, Jasa, Royalti, Sewa)
    case 'PPH_23': {
      const gross = Math.max(0, state.pph23.grossAmount || 0);
      let baseRate = 0.02; // default 2% jasa & sewa non-tanah
      let rateLabel = '2% (Jasa Teknik/Manajemen/Konsultan/Sewa Harta)';

      if (['DIVIDEN', 'BUNGA', 'ROYALTI', 'HADIAH_PENGHARGAAN'].includes(state.pph23.incomeType)) {
        baseRate = 0.15;
        rateLabel = '15% (Dividen / Bunga / Royalti / Hadiah)';
      }

      const multiplier = state.pph23.hasNpwp ? 1 : 2;
      const finalRate = baseRate * multiplier;
      const calculatedTax = Math.round(gross * finalRate);
      const prepaid = Math.max(0, state.pph23.taxAlreadyPaid || 0);
      const balance = calculatedTax - prepaid;

      return {
        taxType: 'PPH_23',
        steps: [
          { label: 'Penghasilan bruto', lines: [`Jumlah yang dibayarkan sebelum pemotongan ${formatRupiah(gross)}`] },
          { label: 'Tarif', lines: [`Tarif dasar ${+(baseRate * 100).toFixed(2)}% (jenis penghasilan: ${state.pph23.incomeType})`, state.pph23.hasNpwp ? 'Memiliki NPWP: tarif normal' : `Tanpa NPWP: tarif dikali 2, menjadi ${+(finalRate * 100).toFixed(2)}%`] },
          { label: 'PPh 23 terutang', lines: [`${formatRupiah(gross)} × ${+(finalRate * 100).toFixed(2)}% = ${formatRupiah(calculatedTax)}`] },
          { label: 'Hasil', lines: settlementLines(calculatedTax, prepaid, balance, 'sudah disetor') }
        ],
        taxTypeName: `PPh Pasal 23 (Jasa, Dividen, Bunga, Royalti${isAnnual ? ' — Rekap Tahunan' : ' — Masa Bulanan'})`,
        taxBase: gross,
        applicableRateText: state.pph23.hasNpwp ? rateLabel : `${rateLabel} × 2 (Tanpa NPWP 100% Lebih Tinggi)`,
        calculatedTax,
        creditsOrPrepaid: prepaid,
        finalBalanceDue: balance,
        status: balance > 0 ? 'KURANG_BAYAR' : balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: isAnnual
          ? 'Mengikuti waktu pemotongan/setoran setiap transaksi; nominal ini rekap setahun'
          : 'Tanggal 10 bulan berikutnya',
        reportingDeadline: isAnnual
          ? 'Rekap tahunan — SPT Masa Unifikasi tetap dilaporkan sesuai periode yang diwajibkan'
          : 'Tanggal 20 bulan berikutnya (via e-Bupot Unifikasi)',
        lateFilingFeeText: 'Denda Rp 100.000 per Masa Pajak',
        latePaymentInterestRule: 'Bunga per bulan KMK dari nilai PPh 23 terutang',
        notes: [
          `Penghasilan Bruto: ${formatRupiah(gross)}`,
          `PPh 23 yang sudah dibayar/disetor: ${formatRupiah(prepaid)}`,
          ...(isAnnual ? ['Masukkan total transaksi dan setoran sepanjang tahun; rekap ini tidak menggantikan SPT Masa.'] : []),
          'Pemotong wajib menerbitkan Bukti Potong Elektronik (e-Bupot Unifikasi) kepada pihak penerima penghasilan.'
        ]
      };
    }

    // 4. PPh Pasal 24 (Kredit Pajak Luar Negeri)
    case 'PPH_24': {
      const b = pph24Breakdown(state.pph24);
      const remainingTaxToPay = b.sisa;
      const allowableCredit = b.totalKredit;
      const totalIndonesianTax = b.pphTerutang;

      return {
        taxType: 'PPH_24',
        steps: [
          { label: 'Penghasilan neto', lines: [`Dalam negeri ${formatRupiah(b.domesticNet)} + luar negeri ${formatRupiah(b.totalForeignNet)} = ${formatRupiah(b.totalNeto)}`] },
          { label: 'Total PKP', lines: [`Penghasilan kena pajak seluruh dunia ${formatRupiah(b.totalPkp)}`] },
          { label: 'PPh terutang di Indonesia sebelum kredit', lines: [formatRupiah(b.pphTerutang)] },
          {
            label: 'Batas kredit per negara',
            lines: b.rows.length === 0
              ? ['Belum ada negara yang diisi']
              : b.rows.map((r) => b.totalPkp > 0
                  ? `${r.negara || 'Negara'}: (${formatRupiah(r.netoIdr)} ÷ ${formatRupiah(b.totalPkp)}) × ${formatRupiah(b.pphTerutang)} = ${formatRupiah(r.batas)}`
                  : `${r.negara || 'Negara'}: total PKP belum diisi, batas kredit nol`)
          },
          {
            label: 'Kredit yang diperbolehkan',
            lines: [
              ...b.rows.map((r) => `${r.negara || 'Negara'}: ${formatRupiah(r.kredit)} (yang lebih kecil antara pajak dibayar ${formatRupiah(r.pajakIdr)} dan batas ${formatRupiah(r.batas)})`),
              `Total kredit = ${formatRupiah(b.totalKredit)}`
            ]
          },
          { label: 'Hasil', lines: [`PPh terutang ${formatRupiah(b.pphTerutang)} − kredit ${formatRupiah(b.totalKredit)} = ${formatRupiah(b.sisa)}`] }
        ],
        taxTypeName: 'PPh Pasal 24 (Kredit Pajak Luar Negeri — Tahunan)',
        taxBase: b.totalPkp,
        applicableRateText: 'Batas kredit per negara: (neto luar negeri negara / Total PKP) x PPh terutang',
        calculatedTax: totalIndonesianTax,
        creditsOrPrepaid: allowableCredit,
        finalBalanceDue: remainingTaxToPay,
        status: remainingTaxToPay > 0 ? 'KURANG_BAYAR' : 'NIHIL',
        paymentDeadline: `Sebelum penyampaian SPT Tahunan (${state.profile.userType === 'BADAN' ? '30 April' : '31 Maret'} tahun berikutnya)`,
        reportingDeadline: 'Bersamaan dengan Lampiran SPT Tahunan (Formulir 1770 / 1771)',
        lateFilingFeeText: 'Denda Rp 100.000 (OP) atau Rp 1.000.000 (Badan)',
        latePaymentInterestRule: 'Bunga per bulan KMK jika ada kekurangan setor',
        notes: [
          `Total penghasilan neto: ${formatRupiah(b.totalNeto)} (dalam negeri ${formatRupiah(b.domesticNet)} + luar negeri ${formatRupiah(b.totalForeignNet)})`,
          `Total PKP: ${formatRupiah(b.totalPkp)}`,
          `PPh terutang sebelum kredit: ${formatRupiah(b.pphTerutang)}`,
          ...b.rows.map((r) => `${r.negara || 'Negara'} (${r.mataUang}): neto ${formatRupiah(r.netoIdr)}, pajak dibayar ${formatRupiah(r.pajakIdr)}, batas ${formatRupiah(r.batas)}, kredit ${formatRupiah(r.kredit)}`),
          `Kredit PPh 24 yang diperbolehkan: ${formatRupiah(b.totalKredit)} (nilai terkecil antara pajak dibayar dan batas, per negara)`,
          `Sisa PPh setelah kredit: ${formatRupiah(b.sisa)}`,
          ...b.warnings,
        ]
      };
    }

    // 5. PPh Pasal 25 (Angsuran Pajak Bulanan)
    case 'PPH_25': {
      const priorTax = Math.max(0, state.pph25.priorYearTaxDue || 0);
      const priorCredits = Math.max(0, state.pph25.priorYearTaxCredits || 0);
      const netTaxBase = Math.max(0, priorTax - priorCredits);

      // Angsuran per bulan = Dasar Penghitungan / 12
      const monthlyInstallment = Math.round(netTaxBase / 12);
      const periodTax = state.reportingPeriod === 'ANNUAL' ? monthlyInstallment * 12 : monthlyInstallment;
      const prepaid = Math.max(0, state.pph25.taxAlreadyPaid || 0);
      // Angsuran adalah setoran, bukan kurang atau lebih bayar. Sisa yang belum disetor = angsuran dikurangi yang sudah disetor.
      const balance = Math.max(0, periodTax - prepaid);

      return {
        taxType: 'PPH_25',
        steps: [
          { label: 'Dasar penghitungan angsuran', lines: [`PPh terutang tahun lalu ${formatRupiah(priorTax)} − kredit pajak tahun lalu ${formatRupiah(priorCredits)} = ${formatRupiah(netTaxBase)}`] },
          { label: 'Angsuran per bulan', lines: [`${formatRupiah(netTaxBase)} ÷ 12 = ${formatRupiah(monthlyInstallment)} (dibulatkan)`] },
          { label: 'Yang disetor pada periode ini', lines: [isAnnual ? `Angsuran ${formatRupiah(monthlyInstallment)} × 12 = ${formatRupiah(periodTax)}` : `Angsuran bulan ini ${formatRupiah(periodTax)}`] },
          { label: 'Hasil', lines: [`${formatRupiah(periodTax)} − sudah disetor ${formatRupiah(prepaid)} = ${formatRupiah(periodTax - prepaid)}`, balance > 0 ? 'Sisa angsuran yang belum disetor' : 'Angsuran sudah terpenuhi'] }
        ],
        taxTypeName: `PPh Pasal 25 (Angsuran ${isAnnual ? 'Rekap Setahun' : 'Masa Bulanan'})`,
        taxBase: netTaxBase,
        applicableRateText: 'Angsuran = (PPh terutang SPT tahun lalu - kredit pajak tahun lalu) / 12',
        calculatedTax: periodTax,
        creditsOrPrepaid: prepaid,
        finalBalanceDue: balance,
        status: balance > 0 ? 'KURANG_BAYAR' : 'NIHIL',
        paymentDeadline: isAnnual
          ? 'Setor angsuran tiap masa sesuai jadwal; jumlah di atas rekap setahun'
          : 'Tanggal 15 bulan berikutnya',
        reportingDeadline: isAnnual
          ? 'Rekap tahunan — angsuran tetap disetor setiap masa'
          : 'Bebas lapor SPT Masa (Cukup setor dengan NTPN bank)',
        lateFilingFeeText: 'Rp 0 (Bebas denda lapor sesuai PMK 9/2018)',
        latePaymentInterestRule: 'Bunga per bulan KMK jika telat setor lewat tanggal 15',
        notes: [
          `PPh Terutang Tahun Lalu: ${formatRupiah(priorTax)}`,
          `Total Kredit Pajak Tahun Lalu: ${formatRupiah(priorCredits)}`,
          `Besar Angsuran yang Wajib Disetor Setiap Bulan: ${formatRupiah(monthlyInstallment)}`,
          `Angsuran yang sudah disetor pada periode ini: ${formatRupiah(prepaid)}`,
          ...(prepaid > periodTax ? ['Kelebihan setor angsuran diperhitungkan saat menyusun SPT Tahunan.'] : []),
          ...(netTaxBase === 0 ? ['Angsuran menjadi nihil karena sisa dasar penghitungan setelah kredit pajak adalah Rp 0.'] : [])
        ]
      };
    }

    // 6. PPh Pasal 26 (Wajib Pajak Luar Negeri)
    case 'PPH_26': {
      const gross = Math.max(0, state.pph26.grossAmount || 0);
      // Tarif standar 20% kecuali ada tax treaty (P3B) dan form DGT
      const treatyRate = Math.min(100, Math.max(0, state.pph26.taxTreatyRate || 0));
      const hasTreaty = state.pph26.hasDGTForm && treatyRate > 0;
      const rate = hasTreaty ? treatyRate / 100 : 0.20;
      const calculatedTax = Math.round(gross * rate);
      const prepaid = Math.max(0, state.pph26.taxAlreadyPaid || 0);
      const balance = calculatedTax - prepaid;

      return {
        taxType: 'PPH_26',
        steps: [
          { label: 'Bruto yang dibayarkan ke pihak luar negeri', lines: [formatRupiah(gross)] },
          { label: 'Tarif', lines: [hasTreaty ? `Tarif P3B ${+(rate * 100).toFixed(2)}% (form DGT valid)` : 'Tarif standar 20% (tanpa form DGT)'] },
          { label: 'PPh 26 terutang', lines: [`${formatRupiah(gross)} × ${+(rate * 100).toFixed(2)}% = ${formatRupiah(calculatedTax)}`] },
          { label: 'Hasil', lines: settlementLines(calculatedTax, prepaid, balance, 'sudah disetor') }
        ],
        taxTypeName: `PPh Pasal 26 (Wajib Pajak Luar Negeri${isAnnual ? ' — Rekap Tahunan' : ' — Masa Bulanan'})`,
        taxBase: gross,
        applicableRateText: hasTreaty ? `Tarif P3B / Tax Treaty: ${(rate * 100)}%` : 'Tarif Standar Pasal 26: 20%',
        calculatedTax,
        creditsOrPrepaid: prepaid,
        finalBalanceDue: balance,
        status: balance > 0 ? 'KURANG_BAYAR' : balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: isAnnual
          ? 'Mengikuti waktu pemotongan/setoran setiap transaksi; nominal ini rekap setahun'
          : 'Tanggal 10 bulan berikutnya',
        reportingDeadline: isAnnual
          ? 'Rekap tahunan — SPT Masa Unifikasi tetap dilaporkan sesuai periode yang diwajibkan'
          : 'Tanggal 20 bulan berikutnya (SPT Masa Unifikasi)',
        lateFilingFeeText: 'Denda Rp 100.000 per Masa Pajak',
        latePaymentInterestRule: 'Bunga per bulan KMK dari pemotongan PPh 26',
        notes: [
          `Dasar Pengenaan Pajak (Bruto Luar Negeri): ${formatRupiah(gross)}`,
          `PPh 26 yang sudah dibayar/disetor: ${formatRupiah(prepaid)}`,
          ...(isAnnual ? ['Masukkan total transaksi dan setoran sepanjang tahun; rekap ini tidak menggantikan SPT Masa.'] : []),
          hasTreaty 
            ? 'Form DGT / SKD Valid: Menggunakan tarif keringanan P3B (Tax Treaty).' 
            : 'Tidak ada Form DGT: Dikenakan tarif standar 20% (Pasal 26 UU PPh).'
        ]
      };
    }

    // 7. PPh Pasal 28 / 28A (Kredit Pajak & Restitusi Lebih Bayar)
    case 'PPH_28': {
      const taxDue = state.pph28.totalTaxDue || 0;
      const totalCredits = (state.pph28.creditPPh21 || 0) +
        (state.pph28.creditPPh22 || 0) +
        (state.pph28.creditPPh23 || 0) +
        (state.pph28.creditPPh24 || 0) +
        (state.pph28.creditPPh25Paid || 0);

      const balance = taxDue - totalCredits;

      return {
        taxType: 'PPH_28',
        steps: [
          { label: 'Total PPh terutang setahun', lines: [formatRupiah(taxDue)] },
          { label: 'Total kredit pajak', lines: [`PPh 21 ${formatRupiah(state.pph28.creditPPh21 || 0)} + PPh 22 ${formatRupiah(state.pph28.creditPPh22 || 0)} + PPh 23 ${formatRupiah(state.pph28.creditPPh23 || 0)} + PPh 24 ${formatRupiah(state.pph28.creditPPh24 || 0)} + PPh 25 ${formatRupiah(state.pph28.creditPPh25Paid || 0)} = ${formatRupiah(totalCredits)}`] },
          { label: 'Hasil', lines: [
              `${formatRupiah(taxDue)} − ${formatRupiah(totalCredits)} = ${formatRupiah(balance)}`,
              balance < 0 ? 'Lebih bayar, bisa direstitusi atau dikompensasi' : balance > 0 ? 'Kurang bayar, wajib dilunasi' : 'Nihil'
            ] }
        ],
        taxTypeName: 'PPh Pasal 28 & 28A (Kredit Pajak & Restitusi Lebih Bayar — Tahunan)',
        taxBase: taxDue,
        applicableRateText: 'Kompensasi Seluruh Kredit Pajak Sah',
        calculatedTax: taxDue,
        creditsOrPrepaid: totalCredits,
        finalBalanceDue: balance,
        status: balance < 0 ? 'LEBIH_BAYAR' : balance > 0 ? 'KURANG_BAYAR' : 'NIHIL',
        paymentDeadline: balance > 0 ? '31 Maret (OP) / 30 April (Badan)' : 'Tidak ada (Status Nihil / Lebih Bayar)',
        reportingDeadline: 'Terintegrasi dalam SPT Tahunan',
        lateFilingFeeText: 'Denda Rp 100.000 (OP) atau Rp 1.000.000 (Badan)',
        latePaymentInterestRule: 'Bunga per bulan KMK jika berstatus kurang bayar',
        notes: [
          `Total PPh Terutang Setahun: ${formatRupiah(taxDue)}`,
          `Total Akumulasi Kredit Pajak (21, 22, 23, 24, 25): ${formatRupiah(totalCredits)}`,
          balance < 0 
            ? `🎉 Status LEBIH BAYAR sebesar ${formatRupiah(Math.abs(balance))} (Pasal 28A). Wajib Pajak berhak mengajukan Pengembalian Kelebihan (Restitusi) atau Kompensasi ke tahun depan.`
            : `Status Kurang Bayar sebesar ${formatRupiah(balance)} (Pasal 29).`
        ]
      };
    }

    // 8. PPh Pasal 29 (Pelunasan Kurang Bayar Tahunan)
    case 'PPH_29': {
      const net = state.pph29.annualNetIncome || 0;
      const ptkpSelected = PTKP_RATES[state.pph29.ptkpStatus] || PTKP_RATES['TK/0'];
      const rawPKP = Math.max(0, net - ptkpSelected.amount);
      const pkp = Math.floor(rawPKP / 1000) * 1000;

      const { totalTax } = calculateProgressiveTax(pkp);
      const totalCredits = state.pph29.totalTaxCredits || 0;
      const pph29Balance = totalTax - totalCredits;

      return {
        taxType: 'PPH_29',
        steps: [
          { label: 'Penghasilan neto setahun', lines: [formatRupiah(net)] },
          { label: 'Penghasilan kena pajak (PKP)', lines: [
              `PTKP status ${ptkpSelected.label}: ${formatRupiah(ptkpSelected.amount)}`,
              `Neto − PTKP = ${formatRupiah(rawPKP)}`,
              `Dibulatkan ke bawah per Rp 1.000 = ${formatRupiah(pkp)}`
            ] },
          { label: 'PPh terutang dengan tarif progresif', lines: progressiveLines(pkp) },
          { label: 'Hasil', lines: [
              `PPh terutang ${formatRupiah(totalTax)} − kredit pajak ${formatRupiah(totalCredits)} = ${formatRupiah(pph29Balance)}`,
              pph29Balance > 0 ? 'Kurang bayar, wajib dilunasi' : pph29Balance < 0 ? 'Lebih bayar' : 'Nihil'
            ] }
        ],
        taxTypeName: 'PPh Pasal 29 (Pelunasan Kurang Bayar — Tahunan)',
        taxBase: pkp,
        applicableRateText: 'Tarif Progresif Pasal 17 UU HPP',
        calculatedTax: totalTax,
        creditsOrPrepaid: totalCredits,
        finalBalanceDue: pph29Balance,
        status: pph29Balance > 0 ? 'KURANG_BAYAR' : pph29Balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: 'Paling lambat 31 Maret (OP) atau 30 April (Badan) SEBELUM SPT disampaikan',
        reportingDeadline: '31 Maret (OP) / 30 April (Badan)',
        lateFilingFeeText: 'Denda Rp 100.000 (OP) atau Rp 1.000.000 (Badan)',
        latePaymentInterestRule: 'Bunga per bulan KMK dari nilai PPh 29 terutang',
        notes: [
          `Penghasilan Kena Pajak (PKP): ${formatRupiah(pkp)}`,
          `Total PPh Terutang: ${formatRupiah(totalTax)}`,
          `Total Seluruh Kredit Pajak: ${formatRupiah(totalCredits)}`,
          `Sisa Pelunasan PPh Pasal 29 yang Wajib Disetor: ${formatRupiah(Math.max(0, pph29Balance))}`
        ]
      };
    }

    // 12. UMKM: rekap omzet dan biaya setahun, sesuai kategori wajib pajak (tabel ketentuan PPh Final UMKM)
    case 'UMKM': {
      const umkm = state.umkm ?? { kategori: 'OP', tahunTerdaftar: state.profile.taxYear, omzetBulanan: Array(12).fill(0), biayaBulanan: Array(12).fill(0) };
      const kategori = umkm.kategori ?? 'OP';
      const omzet = umkm.omzetBulanan.reduce((sum, v) => sum + Math.max(0, v || 0), 0);
      const biaya = umkm.biayaBulanan.reduce((sum, v) => sum + Math.max(0, v || 0), 0);
      const labaKotor = omzet - biaya;
      const masaKoperasi = state.profile.taxYear - (umkm.tahunTerdaftar || state.profile.taxYear) + 1;
      const koperasiHabis = kategori === 'KOPERASI' && masaKoperasi > 4;
      const pakaiTarifBadan = kategori === 'BADAN_LAIN' || koperasiHabis;

      const KATEGORI_NAMA: Record<string, string> = {
        OP: 'Wajib pajak orang pribadi',
        PT_PERORANGAN: 'Perseroan perorangan (PT 1 orang)',
        KOPERASI: 'Koperasi',
        BADAN_LAIN: 'CV, firma, PT umum, BUMDes',
      };

      if (pakaiTarifBadan) {
        const dasar = Math.max(0, labaKotor);
        const pajak = Math.round(dasar * REGULASI.tarifBadan);
        return {
          taxType: 'UMKM',
          steps: [
            { label: 'Omzet dan biaya setahun', lines: [`Omzet ${formatRupiah(omzet)} − biaya ${formatRupiah(biaya)} = laba kotor ${formatRupiah(labaKotor)}`] },
            { label: 'Dasar pengenaan', lines: [`Laba kotor yang dipakai (jika negatif dianggap nol) = ${formatRupiah(dasar)}`] },
            { label: 'PPh Badan perkiraan', lines: [`${formatRupiah(dasar)} × 22% = ${formatRupiah(pajak)}`, 'Ini perkiraan, belum termasuk koreksi fiskal'] },
            { label: 'Hasil', lines: [`Pajak terutang ${formatRupiah(pajak)}, tanpa kredit pajak`] }
          ],
          taxTypeName: `PPh Badan tarif umum (${KATEGORI_NAMA[kategori]})`,
          taxBase: dasar,
          applicableRateText: 'Tarif umum PPh Badan 22% (perkiraan dari laba kotor)',
          calculatedTax: pajak,
          creditsOrPrepaid: 0,
          finalBalanceDue: pajak,
          status: pajak > 0 ? 'KURANG_BAYAR' : 'NIHIL',
          paymentDeadline: 'Sesuai SPT Tahunan Badan (30 April tahun berikutnya)',
          reportingDeadline: 'SPT Tahunan Badan (30 April tahun berikutnya)',
          lateFilingFeeText: 'Denda Rp 1.000.000 per SPT Tahunan Badan',
          latePaymentInterestRule: 'Bunga per bulan KMK jika telat bayar',
          notes: [
            `Omzet setahun: ${formatRupiah(omzet)}, biaya: ${formatRupiah(biaya)}, laba kotor: ${formatRupiah(labaKotor)}`,
            koperasiHabis
              ? `Koperasi sudah melewati 4 tahun sejak terdaftar (masa ke-${masaKoperasi}), sehingga kembali ke tarif umum PPh Badan.`
              : 'Tidak lagi berhak PPh Final UMKM, wajib tarif umum PPh Badan 22%.',
            'Ini perkiraan. Penghasilan kena pajak final dihitung di SPT Tahunan Badan setelah koreksi fiskal.',
          ]
        };
      }

      // PPh Final 0,5%. Orang pribadi: bebas Rp 500 juta pertama, 0,5% atas kelebihannya. Lainnya: 0,5% dari seluruh omzet.
      const dasar = kategori === 'OP' ? Math.max(0, omzet - REGULASI.umkmBatasOmzetBebas) : omzet;
      const overLimit = omzet > REGULASI.batasOmzetPengusahaKecilBadan;
      const pajak = overLimit ? 0 : Math.round(dasar * REGULASI.umkmTarifFinal);

      return {
        taxType: 'UMKM',
        steps: [
          { label: 'Omzet dan biaya setahun', lines: [`Omzet setahun ${formatRupiah(omzet)}`, `Biaya ${formatRupiah(biaya)} tidak mengurangi PPh Final UMKM`] },
          { label: 'Dasar pengenaan', lines: [kategori === 'OP'
              ? `Omzet ${formatRupiah(omzet)} dikurangi bebas Rp 500.000.000 (tidak sampai minus) = ${formatRupiah(dasar)}`
              : `Seluruh omzet dipakai sebagai dasar = ${formatRupiah(dasar)}`] },
          { label: 'PPh Final 0,5%', lines: overLimit
              ? ['Peredaran bruto di atas Rp 4,8 miliar, tarif tidak berlaku, pajak nol']
              : [`${formatRupiah(dasar)} × 0,5% = ${formatRupiah(pajak)}`] },
          { label: 'Hasil', lines: [`Pajak terutang ${formatRupiah(pajak)}`] }
        ],
        taxTypeName: `PPh Final UMKM 0,5% (${KATEGORI_NAMA[kategori]}, Rekap Tahunan)`,
        taxBase: dasar,
        applicableRateText: kategori === 'OP'
          ? '0,5% dari omzet di atas Rp 500 juta (Rp 500 juta pertama bebas pajak)'
          : '0,5% dari omzet',
        calculatedTax: pajak,
        creditsOrPrepaid: 0,
        finalBalanceDue: pajak,
        status: pajak > 0 ? 'KURANG_BAYAR' : 'NIHIL',
        paymentDeadline: 'Setor paling lambat tanggal 15 bulan berikutnya',
        reportingDeadline: 'Tidak wajib SPT Masa bulanan. Dilaporkan di SPT Tahunan 31 Maret (OP) atau 30 April (Badan)',
        lateFilingFeeText: 'Bebas denda lapor bulanan. Denda SPT Tahunan Rp 100.000 (OP) atau Rp 1.000.000 (Badan)',
        latePaymentInterestRule: 'Bunga per bulan KMK dari PPh Final yang telat disetor',
        notes: [
          `Omzet setahun: ${formatRupiah(omzet)}`,
          `Total biaya setahun: ${formatRupiah(biaya)} (tidak mengurangi PPh Final UMKM)`,
          `Kategori: ${KATEGORI_NAMA[kategori]}`,
          kategori === 'KOPERASI' ? `Koperasi masa ke-${masaKoperasi} dari maksimal 4 tahun sejak terdaftar.` : '',
          ...(overLimit ? ['Peredaran bruto di atas Rp 4,8 miliar: tarif PPh Final 0,5% tidak berlaku.'] : []),
          'Ketentuan kategori dan tarif ini perlu dicek ke peraturan terbaru sebelum dipakai untuk pelaporan.',
        ].filter((n) => n !== '')
      };
    }
    // 10. PPh Pasal 15 (kategori usaha tertentu). Tarif dari pengguna, tidak ditetapkan otomatis.
    case 'PPH_15': {
      const dpp = Math.max(0, state.pph15.dpp || 0);
      const rate = Math.min(100, Math.max(0, state.pph15.ratePercent || 0)) / 100;
      const calculatedTax = Math.round(dpp * rate);
      const prepaid = Math.max(0, state.pph15.taxAlreadyPaid || 0);
      const balance = calculatedTax - prepaid;
      const categoryLabels: Record<string, string> = {
        PELAYARAN_DN: 'Pelayaran dalam negeri',
        PELAYARAN_LN: 'Pelayaran luar negeri',
        PENERBANGAN_DN: 'Penerbangan dalam negeri',
        PENERBANGAN_LN: 'Penerbangan luar negeri',
        LAINNYA: 'Kategori usaha tertentu lainnya',
      };

      return {
        taxType: 'PPH_15',
        steps: [
          { label: 'Dasar pengenaan pajak (DPP)', lines: [`DPP yang diisi ${formatRupiah(dpp)}`, `Bruto ${formatRupiah(state.pph15.grossAmount || 0)}`] },
          { label: 'Tarif', lines: [`${state.pph15.ratePercent}% sesuai input pengguna, ATLAX tidak menetapkan tarif ini otomatis`] },
          { label: 'Pajak terutang', lines: [`${formatRupiah(dpp)} × ${state.pph15.ratePercent}% = ${formatRupiah(calculatedTax)}`] },
          { label: 'Hasil', lines: settlementLines(calculatedTax, prepaid, balance, 'sudah dibayar') }
        ],
        taxTypeName: `PPh Pasal 15 (${categoryLabels[state.pph15.category] || 'Kategori tertentu'}${isAnnual ? ' — Rekap Tahunan' : ' — Masa'})`,
        taxBase: dpp,
        applicableRateText: state.pph15.ratePercent > 0
          ? `${state.pph15.ratePercent}% (tarif dimasukkan pengguna; verifikasi terhadap peraturan)`
          : 'Tarif belum diisi',
        calculatedTax,
        creditsOrPrepaid: prepaid,
        finalBalanceDue: balance,
        status: balance > 0 ? 'KURANG_BAYAR' : balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: 'Belum ditetapkan otomatis: verifikasi tanggal setor sesuai ketentuan PPh Pasal 15 yang berlaku',
        reportingDeadline: 'Belum ditetapkan otomatis: verifikasi tanggal lapor sesuai ketentuan yang berlaku',
        lateFilingFeeText: 'Verifikasi sanksi pada ketentuan yang berlaku',
        latePaymentInterestRule: 'Verifikasi bunga keterlambatan pada ketentuan yang berlaku',
        notes: [
          `Penghasilan bruto: ${formatRupiah(state.pph15.grossAmount || 0)}`,
          `Dasar Pengenaan Pajak (DPP): ${formatRupiah(dpp)}`,
          `Referensi hukum: ${state.pph15.legalReference || 'belum diisi'}`,
          'Tarif, sifat final, dasar pengenaan, dan tenggat tidak ditentukan otomatis oleh ATLAX. Pastikan sesuai peraturan yang berlaku.',
        ]
      };
    }

    // 11. PPh Final Pasal 4 ayat (2). Tarif dari pengguna, tidak ditetapkan otomatis.
    case 'PPH_4_2': {
      const dpp = Math.max(0, state.pph42.dpp || 0);
      const rate = Math.min(100, Math.max(0, state.pph42.ratePercent || 0)) / 100;
      const calculatedTax = Math.round(dpp * rate);
      const prepaid = Math.max(0, state.pph42.taxAlreadyPaid || 0);
      const balance = calculatedTax - prepaid;
      const objectLabels: Record<string, string> = {
        SEWA_TANAH_BANGUNAN: 'Sewa tanah/bangunan',
        KONSTRUKSI: 'Jasa konstruksi',
        UMKM: 'Usaha UMKM',
        LAINNYA: 'Objek lainnya',
      };

      return {
        taxType: 'PPH_4_2',
        steps: [
          { label: 'Dasar pengenaan pajak (DPP)', lines: [`DPP yang diisi ${formatRupiah(dpp)}`, `Bruto ${formatRupiah(state.pph42.grossAmount || 0)}`] },
          { label: 'Tarif', lines: [`${state.pph42.ratePercent}% sesuai input pengguna, ATLAX tidak menetapkan tarif ini otomatis`] },
          { label: 'Pajak terutang', lines: [`${formatRupiah(dpp)} × ${state.pph42.ratePercent}% = ${formatRupiah(calculatedTax)}`] },
          { label: 'Hasil', lines: settlementLines(calculatedTax, prepaid, balance, 'sudah dibayar') }
        ],
        taxTypeName: `PPh Final Pasal 4 ayat (2) (${objectLabels[state.pph42.objectCategory] || 'Objek lainnya'}${isAnnual ? ' — Rekap Tahunan' : ' — Masa'})`,
        taxBase: dpp,
        applicableRateText: state.pph42.ratePercent > 0
          ? `${state.pph42.ratePercent}% (tarif dimasukkan pengguna; verifikasi terhadap peraturan)`
          : 'Tarif belum diisi',
        calculatedTax,
        creditsOrPrepaid: prepaid,
        finalBalanceDue: balance,
        status: balance > 0 ? 'KURANG_BAYAR' : balance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: 'Belum ditetapkan otomatis: verifikasi tanggal setor sesuai ketentuan PPh Final yang berlaku',
        reportingDeadline: 'Belum ditetapkan otomatis: verifikasi tanggal lapor sesuai ketentuan yang berlaku',
        lateFilingFeeText: 'Verifikasi sanksi pada ketentuan yang berlaku',
        latePaymentInterestRule: 'Verifikasi bunga keterlambatan pada ketentuan yang berlaku',
        notes: [
          `Bruto: ${formatRupiah(state.pph42.grossAmount || 0)}`,
          `Dasar Pengenaan Pajak (DPP): ${formatRupiah(dpp)}`,
          `Referensi hukum: ${state.pph42.legalReference || 'belum diisi'}`,
          'Sifat final, tarif, dan tenggat tidak ditentukan otomatis oleh ATLAX. Pastikan sesuai peraturan yang berlaku.',
        ]
      };
    }

    // 9. PPN & PPnBM (Pajak Pertambahan Nilai 11%)
    case 'PPN': {
      const taxableSales = state.ppn.outputTaxTaxableSales || 0;
      const exportSales = state.ppn.exportSales || 0;
      const nonTaxable = state.ppn.nonTaxableSales || 0;
      const inputTaxCreditable = state.ppn.inputTaxCreditable || 0;
      const priorCompensation = state.ppn.priorMonthCompensation || 0;
      const ppnbmBase = Math.max(0, state.ppn.ppnbmTaxableSales || 0);
      const ppnbmRate = Math.min(100, Math.max(0, state.ppn.ppnbmRate || 0));

      // Pajak Keluaran (PK) = 11% x Penjualan Kena PPN Dalam Negeri + 0% Ekspor
      const outputTax = Math.round(taxableSales * REGULASI.tarifPpn);
      const ppnbmTax = Math.round(ppnbmBase * ppnbmRate / 100);
      const totalInputTax = inputTaxCreditable + priorCompensation;
      const totalOutputTax = outputTax + ppnbmTax;
      const ppnBalance = totalOutputTax - totalInputTax;

      return {
        taxType: 'PPN',
        steps: [
          { label: 'Pajak keluaran', lines: [
              `Penjualan kena PPN ${formatRupiah(taxableSales)} × 11% = ${formatRupiah(outputTax)}`,
              `Ekspor (0%) ${formatRupiah(exportSales)} dan penyerahan tidak dipungut ${formatRupiah(nonTaxable)} tidak menambah pajak keluaran`
            ] },
          { label: 'PPnBM (barang mewah)', lines: [`${ppnbmRate}% × DPP ${formatRupiah(ppnbmBase)} = ${formatRupiah(ppnbmTax)}`] },
          { label: 'Pajak masukan dan kompensasi', lines: [`Pajak masukan ${formatRupiah(inputTaxCreditable)} + kompensasi ${formatRupiah(priorCompensation)} = ${formatRupiah(totalInputTax)}`] },
          { label: 'Hasil', lines: [
              `Pajak keluaran ${formatRupiah(totalOutputTax)} − pajak masukan ${formatRupiah(totalInputTax)} = ${formatRupiah(ppnBalance)}`,
              ppnBalance > 0 ? 'Kurang bayar, wajib disetor' : ppnBalance < 0 ? 'Lebih bayar, bisa dikompensasikan atau direstitusi' : 'Nihil'
            ] }
        ],
        taxTypeName: `PPN & PPnBM (${isAnnual ? 'Rekap Tahunan' : 'Masa Bulanan'})`,
        taxBase: taxableSales + ppnbmBase,
        applicableRateText: `PPN efektif 11% + PPnBM ${ppnbmRate}% atas DPP barang mewah`,
        calculatedTax: totalOutputTax,
        creditsOrPrepaid: totalInputTax, // Pajak Masukan (PM)
        finalBalanceDue: ppnBalance,
        status: ppnBalance > 0 ? 'KURANG_BAYAR' : ppnBalance < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
        paymentDeadline: isAnnual
          ? 'Mengikuti kewajiban setiap Masa Pajak; nominal ini rekap setahun'
          : 'Akhir bulan berikutnya SEBELUM SPT Masa PPN disampaikan',
        reportingDeadline: isAnnual
          ? 'Rekap tahunan — SPT Masa PPN tetap dilaporkan untuk setiap Masa Pajak'
          : 'Akhir bulan berikutnya (SPT Masa PPN 1111)',
        lateFilingFeeText: 'Denda Rp 500.000 per Masa Pajak PPN (Pasal 7 UU KUP)',
        latePaymentInterestRule: 'Bunga per bulan KMK dari nominal PPN Kurang Bayar',
        notes: [
          `Pajak Keluaran (PK) 11% dari Penjualan: ${formatRupiah(outputTax)}`,
          `PPnBM: ${formatRupiah(ppnbmTax)} (${ppnbmRate}% × DPP ${formatRupiah(ppnbmBase)})`,
          ...(isAnnual ? ['Masukkan total penyerahan, pajak masukan, dan kompensasi setahun; SPT Masa tetap dilaporkan tiap masa.'] : []),
          `Pajak Masukan (PM) Dapat Dikreditkan: ${formatRupiah(inputTaxCreditable)}`,
          priorCompensation > 0 ? `Kompensasi Kelebihan Masa Lalu: ${formatRupiah(priorCompensation)}` : 'Tidak ada kompensasi masa lalu.',
          ppnBalance > 0 
            ? `Status PPN KURANG BAYAR: ${formatRupiah(ppnBalance)}. Wajib disetor dengan Kode Akun 411211 KJS 100.` 
            : ppnBalance < 0 
            ? `Status PPN LEBIH BAYAR: ${formatRupiah(Math.abs(ppnBalance))}. Dapat dikompensasikan ke masa pajak berikutnya atau dimintakan restitusi.`
            : 'Status PPN NIHIL: Pajak Keluaran sama dengan Pajak Masukan.'
        ]
      };
    }
  }
}



