/* BizFinPro — i18n: Bahasa Melayu (default) + English */
(function (global) {
  'use strict';
  const MS = {
    app: { name: 'BizFinPro', tagline: 'Business Budget • ROI • NPV • IRR • Financial Projection' },
    on: 'Hidup', off: 'Mati', auto: 'Automatik', manual: 'Manual', active: 'Aktif', automatic_value: 'Nilai Automatik',
    manual_override: 'Override Manual', active_value: 'Nilai Aktif', reset_to_auto: 'Reset ke Automatik',
    save: 'Simpan', cancel: 'Batal',    total: 'Jumlah', add: 'Tambah', period: 'Tempoh',
    restore: 'Pulihkan', restore_note: 'Item yang dipadam (pulihkan untuk papar semula)',
 delete: 'Padam', edit: 'Edit', add: 'Tambah', close: 'Tutup', back: 'Kembali',
    confirm: 'Sahkan', proceed: 'Teruskan', yes: 'Ya', no: 'Tidak', optional: 'pilihan', required: 'wajib',
    name: 'Nama', amount: 'Jumlah', total: 'Jumlah', year: 'Tahun', month: 'Bulan', note: 'Nota',
    per_year: '/tahun', per_month: '/bulan', today: 'Hari ini', not_calculable: 'Tidak Boleh Dikira',
    requires_review: 'Perlu Semakan', not_recovered: 'Tidak Pulih Dalam Tempoh Unjuran', overview: 'Ringkasan', details: 'Perincian',
    formula: 'Formula', methodology: 'Metodologi', inputs: 'Input', calculation: 'Pengiraan', result: 'Hasil', explanation: 'Penerangan',
    /* nav */
    nav: {
      home: 'Utama', projects: 'Projek', business: 'Profil Perniagaan', budget: 'Belanjawan & Andaian',
      financials: 'Kewangan', capex: 'CAPEX', revenue: 'Unjuran Hasil', cogs: 'COGS', expenses: 'OPEX / Perbelanjaan',
      pl: 'Untung Rugi (P&L)', cashflow: 'Aliran Tunai', working_capital: 'Modal Kerja',
      analysis: 'Analisis', breakeven: 'Titik Pulang Modal', roi: 'ROI', npv: 'NPV', irr: 'IRR', payback: 'Tempoh Bayar Balik',
      ratios: 'Nisbah Kewangan', scenarios: 'Analisis Senario', sensitivity: 'Analisis Sensitiviti',
      financing: 'Pembiayaan', conventional: 'Pembiayaan Konvensional', islamic: 'Pembiayaan Islam',
      syariah: 'Syariah', screening: 'Saringan Syariah', review: 'Semakan Syariah',
      reports: 'Laporan', revenue_report: 'Laporan Hasil', settings: 'Tetapan', wizard: 'Panduan Setup'
    },
    mode: {
      label: 'Mod Kewangan', konvensional: 'KONVENSIONAL', syariah: 'SYARIAH',
      choose: 'Pilih Mod Kewangan', konv_sub: 'Pinjaman bank, faedah & pembiayaan konvensional.', syr_sub: 'Pembiayaan Islam (Murabahah, Ijarah, …) tanpa riba.',
      indicator: 'MOD KEWANGAN'
    },
    dashboard: {
      title: 'Papan Pemuka', total_investment: 'Jumlah Pelaburan', revenue: 'Hasil', gross_profit: 'Untung Kasar',
      net_profit: 'Untung Bersih', ebitda: 'EBITDA', closing_cash: 'Tunai Akhir', roi: 'ROI', npv: 'NPV', irr: 'IRR',
      payback: 'Tempoh Bayar Balik', breakeven: 'Titik Pulang Modal', debt: 'Hutang / Pembiayaan', key_ratios: 'Nisbah Utama',
      shariah_status: 'Status Saringan Syariah', financing_structure: 'Struktur Pembiayaan', potential_issues: 'Isu Berpotensi',
      dynamic: 'Dikemas kini secara automatik',
      review_status: 'Status Semakan', alerts: 'Amaran Kewangan', quick: 'Ringkasan Eksekutif'
    },
    profile: {
      title: 'Profil Perniagaan', business_name: 'Nama Perniagaan', reg_no: 'No. Pendaftaran', business_type: 'Jenis Perniagaan',
      industry: 'Industri', address: 'Alamat', contact: 'Maklumat Hubungan', owner: 'Pemilik / Pengarah',
      employees: 'Bil. Pekerja', description: 'Penerangan Perniagaan', objective: 'Objektif Perniagaan',
      project_objective: 'Objektif Projek', projection_period: 'Tempoh Unjuran', project_type_label: 'Jenis Projek'
    },
    assumptions: {
      title: 'Andaian Pusat', revenue_growth: 'Pertumbuhan Hasil', sales_volume: 'Jumlah Jualan', selling_price: 'Harga Jualan',
      inflation: 'Inflasi', cogs_pct: 'COGS %', opex_growth: 'Pertumbuhan OPEX', tax_rate: 'Kadar Cukai',
      discount_rate: 'Kadar Diskaun', financing_rate: 'Kadar Pembiayaan', working_capital_pct: 'Modal Kerja %',
      useful_life: 'Usia Guna (tahun)', residual_value: 'Nilai Sisa', collection_days: 'Tempoh Kutipan (hari)',
      payment_days: 'Tempoh Bayaran (hari)', inventory_days: 'Tempoh Inventori (hari)', rate_source: 'Sumber / Nota',
      last_updated: 'Kemas Kini Terakhir', auto_default: 'Kadar lalai automatik', manual_note: 'Kadar dimasukkan pengguna',
      active_rate: 'Kadar Aktif', auto_rate: 'Kadar Automatik', manual_rate: 'Kadar Manual', reset_note: 'Set semula ke kadar automatik.'
    },
    capex: {
      title: 'Perancangan CAPEX', asset_name: 'Nama Aset', category: 'Kategori', qty: 'Kuantiti', unit_cost: 'Kos Seunit',
      total_cost: 'Jumlah Kos', purchase_date: 'Tarikh Belian', useful_life: 'Usia Guna', residual: 'Nilai Sisa',
      dep_method: 'Kaedah Susut Nilai', total_capex: 'Jumlah CAPEX', categories: {
        property: 'Hartanah', renovation: 'Pengubahsuaian', machinery: 'Jentera', equipment: 'Peralatan',
        vehicle: 'Kenderaan', furniture: 'Perabot', it: 'Peralatan IT', software: 'Perisian', other: 'Lain-lain'
      },
      dep: { sl: 'Garis Lurus', rb: 'Baki Berkurangan' }, add_asset: 'Tiada aset lagi — klik ＋ Tambah'
    },
    investment: {
      title: 'Pelaburan Permulaan', initials: 'Pelaburan Awal', startup: 'Kos Permulaan', preop: 'Kos Pra-Operasi',
      capex: 'CAPEX', working_capital: 'Modal Kerja Permulaan', total_funding: 'Jumlah Keperluan Dana',
      startup_items: 'Butiran Kos Permulaan (Contoh: pendaftaran, lesen, deposit, pemasaran awal)'
    },
    revenue: {
      title: 'Unjuran Hasil', product: 'Produk', service: 'Perkhidmatan', qty: 'Kuantiti', unit_price: 'Harga Seunit',
      monthly_sales: 'Jualan Bulanan', annual_sales: 'Jualan Tahunan', growth: 'Pertumbuhan', seasonal: 'Pelarasan Musim',
      add_stream: 'Tambah Aliran Hasil', stream_name: 'Nama Aliran', type: 'Jenis', monthly_volume: 'Volum Bulanan',
      year1_annual: 'Hasil Tahunan (Tahun 1)', base_from_monthly: 'Jumlah tahunan asas = Volum bulanan × 12',
      season_adj: 'Berat Maksimum Bulanan (Tahun 1)',
      peak_month: 'Bulan Puncak', year1_base: 'Tahun 1 (asas)', yearly_title: 'Hasil Tahunan (Multi-Year)', mode_select: 'Mod Input', cash: 'Kemasukan Tunai'
    },

    cogs: {
      title: 'Kos Barangan Dijual (COGS)', material: 'Kos Bahan', product_cost: 'Kos Produk', direct_labour: 'Buruh Langsung',
      direct_production: 'Kos Pengeluaran Langsung', other_direct: 'Kos Langsung Lain', gross_profit: 'Untung Kasar', gross_margin: 'Margin Kasar',
      direct_flat_costs: 'Kos langsung tetap /tahun (di luar % hasil)', direct_cogs_pct_override: 'Override % COGS terus (pilihan)',
      as_pct_of_revenue: '% daripada hasil', auto_from_assumption: 'Automatik — gunakan andaian COGS %'
    },
    expenses: {
      title: 'OPEX / Perbelanjaan Diunjur', salaries: 'Gaji', rent: 'Sewa', utilities: 'Utiliti', marketing: 'Pemasaran',
      transport: 'Pengangkutan', insurance: 'Insurans', maintenance: 'Penyelenggaraan', software: 'Perisian',
      admin: 'Pentadbiran', professional: 'Yuran Profesional', telco: 'Telefon / Internet', other: 'Perbelanjaan Lain',
      monthly: 'Bulanan', annual: 'Tahunan', fixed: 'Tetap', variable: 'Berubah', growth: 'Pertumbuhan',
      salary_headcount: 'Bil. pekerja (gaji)', salary_avg: 'Purata gaji bulanan /pekerja', month1_amount: 'Jumlah bulanan',
      annual_amount: 'Jumlah tahunan', per_month_equivalent: 'bersamaan /bulan',
      employee_related: 'Gaji & berkaitan pekerja', salary_epf_pct: 'EPF/SOCSO/EIS majikan % (anggaran)',
      periodic: 'Kekerapan', growth_blank_note: 'Kosongkan kadar pertumbuhan untuk guna andaian pusat', yearly: 'Tahunan',
      contingency: 'Kontingensi / Pelbagai', torch: 'Lihat andaian OPEX (andaian pusat)',
      other_opex: 'OPEX lain', from_payroll: 'daripada model gaji (automatik)',
      payroll_title: 'Model Gaji & Statutori', payroll_note: 'Headcount × gaji bulanan + kos statutori majikan (KWSP/EPF + PERKESO/SOCSO). Apabila dihidupkan, ia menggantikan kategori Gaji rata.',
      salary_escalation: 'Kenaikan gaji', blank_central: 'kosong = guna andaian pusat', per_head: 'kos/pekerja',
      epf_low: 'EPF (KWSP) majikan — gaji ≤', epf_high: 'EPF (KWSP) majikan — gaji >', epf_ceiling: 'Had siling gaji EPF',
      socso_pct: 'SOCSO (PERKESO) majikan', socso_ceiling: 'Siling gaji SOCSO (RM)',
      payroll_projection: 'Unjuran Gaji', payroll_gross: 'Gaji kasar (asal)', employer_oncost: 'kos majikan',
      payroll_total_cost: 'Jumlah Kos Majikan', payroll_sensitivity: 'Sensitiviti Kos Gaji',
      sensitivity_note: 'Jumlah kos majikan penuh (gaji + EPF + SOCSO) di bawah setiap senario kenaikan gaji. Angka lain (P&L, NPV) guna senario asas.',
    },

    pl: {
      title: 'Penyata Untung Rugi', revenue: 'Hasil', cogs: 'COGS', gross_profit: 'Untung Kasar', opex: 'Perbelanjaan Operasi',
      ebitda: 'EBITDA', depreciation: 'Susut Nilai', ebit: 'EBIT', financing_cost: 'Kos Pembiayaan', pbt: 'Untung Sebelum Cukai',
      tax: 'Cukai', net_profit: 'Untung Bersih', gm: 'Margin Kasar', em: 'Margin EBITDA', nm: 'Margin Untung Bersih',
      profit_margin_note: 'Untung Bersih ÷ Hasil'
    },
    cashflow: {
      title: 'Unjuran Aliran Tunai', operating: 'Aliran Tunai Operasi', investing: 'Aliran Tunai Pelaburan',
      financing: 'Aliran Tunai Pembiayaan', net: 'Aliran Tunai Bersih', opening: 'Tunai Awal', closing: 'Tunai Akhir',
      dep_addback: 'Susut nilai: perbelanjaan perakaunan, bukan aliran keluar tunai', cash_movements: 'Pergerakan Tunai Sebenar',
      accounting: 'Perbelanjaan Perakaunan', note: 'Susut nilai mengurangkan untung perakaunan tetapi TIDAK dianggap aliran keluar tunai.'
    },
    wc: {
      title: 'Modal Kerja', ar: 'Akaun Belum Terima', inventory: 'Inventori', ap: 'Akaun Belum Bayar',
      cash_req: 'Keperluan Tunai', wc_req: 'Keperluan Modal Kerja', change: 'Perubahan Tahunan', collection_days: 'Hari Kutipan',
      inventory_days: 'Hari Inventori', payment_days: 'Hari Bayaran', receivable_days: 'Hari Belum Terima', payable_days: 'Hari Belum Bayar',
      days_hint: 'Keperluan modal kerja dikira daripada hari kutipan, inventori dan bayaran.'
    },

    financing: {
      title: 'Pembiayaan', conv_title: 'Pembiayaan Konvensional', structure: 'Struktur', bank_loan: 'Pinjaman Bank',
      business_loan: 'Pinjaman Perniagaan', term_loan: 'Pinjaman Berjangka', revolving: 'Kemudahan Pusingan', other_fin: 'Pembiayaan Lain',
      loan_amount: 'Jumlah Pinjaman', interest_rate: 'Kadar Faedah', tenure: 'Tempoh (tahun)', start_date: 'Tarikh Mula',
      payment_freq: 'Kekerapan Bayaran', grace_period: 'Tempoh Tangguh (bulan)', fees: 'Fi', principal: 'Prinsipal',
      interest: 'Faedah', installment: 'Ansuran', outstanding: 'Baki Tertunggak', amortization: 'Jadual Pelunasan',
      separator_note: 'Prinsipal pinjaman diasingkan daripada belanja faedah.',
      freq: { monthly: 'Bulanan', quarterly: 'Suku Tahun', annually: 'Tahunan' },
      total: 'Jumlah',
      islamic_title: 'Pembiayaan Islam',
      disclaimer_intro: 'Aplikasi ini TIDAK menganggap sesuatu produk patuh Syariah semata-mata kerana labelnya "Islam". Kontrak & dokumentasi sebenar mungkin memerlukan semakan oleh penasihat Syariah bertauliah.',
      structures: { murabahah: 'Murabahah', ijarah: 'Ijarah', musharakah: 'Musharakah', mudarabah: 'Mudarabah', istisna: "Istisna'", salam: 'Salam', other: 'Struktur Lain' }
    },
    murabahah: {
      asset_cost: 'Kos Aset', acquisition_cost: 'Kos Perolehan', selling_price: 'Harga Jualan', margin: 'Margin (%)',
      term_months: 'Tempoh (bulan)', deposit: 'Deposit / Bayaran Pendahuluan', financed_amount: 'Jumlah Pembiayaan',
      profit_paid: 'Jumlah Margin Dibayar', installment_pm: 'Ansuran /bulan', transparency: 'Pengiraan telus: harga jualan = kos + margin yang dipersetujui.'
    },
    ijarah: {
      asset_value: 'Nilai Aset', lease_years: 'Tempoh Sewaan (tahun)', rental_pm: 'Sewaan /bulan', maintenance: 'Penyelenggaraan /bulan',
      deposit: 'Deposit', own_arrangement: 'Susunan Pemilikan', end_arrangement: 'Susunan Akhir Tempoh',
      total_rental: 'Jumlah Sewaan', net_rental_cf: 'Aliran Tunai Sewaan Bersih'
    },
    musharakah: {
      capital: 'Modal Anda', partner: 'Modal Rakan Kongsi', ownership: 'Pemilikan / Penyertaan Anda (%)',
      profit_sharing: 'Nisbah Perkongsian Untung (%)', loss_allocation: 'Peruntukan Kerugian', adj_profit: 'Untung (selaras nisbah)',
      no_guarantee: 'Untung diunjur TIDAK dijamin. Kerugian lazimnya dikongsi mengikut nisbah modal.'
    },
    mudarabah: {
      capital_provider: 'Penyedia Modal', manager: 'Usahawan / Pengurus', capital_amount: 'Jumlah Modal',
      psr: 'Nisbah Perkongsian Untung (%)', s_profit: 'Untung Diunjurkan', distribution: 'Pengagihan',
      no_guarantee: 'Untung diunjur adalah anggaran, BUKAN pulangan terjamin.'
    },
    istisna: {
      contract_value: 'Nilai Kontrak', delivery: 'Jadual Penghantaran', payment: 'Jadual Bayaran',
      prod_cost: 'Kos Pengeluaran / Pembinaan', exp_rev: 'Hasil Dijangka', margin: 'Margin Diunjur', cf: 'Aliran Tunai'
    },
    screening: {
      title: 'Saringan Syariah', dashboard: 'Papan Pemuka Saringan', business_activity: 'Aktiviti Perniagaan',
      riba: 'RIBA', gharar: 'GHARAR', maysir: 'MAYSIR', halal: 'AKTIVITI HALAL', fin_structure: 'STRUKTUR KEWANGAN',
      status: 'Status', screened: 'DISARING', requires_review: 'PERLU SEMAKAN', potential_issue: 'ISU BERKEMUNGKINAN', not_screened: 'BELUM DISARING',
      q_activity: 'Adakah aktiviti perniagaan terbabit dengan elemen tidak patuh Syariah (arak, judi, riba konvensional, dsb.)?',
      q_riba: 'Adakah terdapat pendedahan faedah/riba (pinjaman konvensional, simpanan berfaedah)?',
      q_gharar: 'Adakah terdapat ketidakpastian melampau (gharar) dalam kontrak?',
      q_maysir: 'Adakah terdapat unsur perjudian/spekulatif (maysir)?',
      q_muslim: 'Untuk status HALAL: patuhi sens?', q_sens: 'Status aktiviti halal',
      yes: 'Ya', no: 'Tidak', unsure: 'Tidak Pasti', manufacturing: 'Pembuatan / Perdagangan Am',
      services: 'Perkhidmatan Profesional', food: 'Makanan & Minuman Halal', agriculture: 'Pertanian / Penternakan',
      retail: 'Peruncitan', education: 'Pendidikan', tech: 'Teknologi / Digital', other: 'Lain-lain',
      not_cert: 'Saringan automatik BUKAN pensijilan. Lihat penafian.',
      disclaimer: 'Penting: BizFinPro ialah alat saringan & analisis kewangan. Saringan Syariah automatik bukan fatwa, pensijilan Syariah atau keputusan perundangan/agama rasmi. Penentuan akhir pematuhan Syariah hendaklah diperoleh daripada penasihat Syariah bertauliah atau pihak berkuasa berkaitan berdasarkan aktiviti perniagaan sebenar, kontrak, dokumen pembiayaan dan piawaian Syariah yang terpakai.'
    },
    review: {
      title: 'Semakan Syariah', adviser: 'Nama Penasihat Syariah', review_date: 'Tarikh Semakan', status: 'Status Semakan',
      notes: 'Nota Semakan', ref_docs: 'Dokumen Rujukan', contract_docs: 'Dokumen Kontrak', evidence: 'Bukti Sokongan',
      approval: 'Rekod Kelulusan / Semakan', attachments: 'Lampiran (jika disokong)',
      pending: 'Belum Selesai', in_progress: 'Sedang Disemak', approved: 'Diluluskan (bersyarat)', referred: 'Dirujuk ke Penasihat',
      standards: 'Piawaian Syariah Luaran', std_name: 'Standard', issuing_body: 'Badan Pengeluar', version: 'Versi', std_date: 'Tarikh', std_ref: 'Rujukan'
    },
    analysis: {
      title: 'Analisis Kewangan', breakeven_title: 'Analisis Titik Pulang Modal', fixed_cost: 'Kos Tetap', variable_cost: 'Kos Berubah',
      selling_price: 'Harga Jualan', be_units: 'Titik Pulang Modal (Unit)', be_revenue: 'Titik Pulang Modal (Hasil)',
      contribution_margin: 'Margin Sumbangan', contribution_pct: 'Margin Sumbangan %',
      roi_title: 'Pulangan Atas Pelaburan (ROI)', investment: 'Pelaburan', return: 'Pulangan', net_return: 'Pulangan Bersih',
      roi_method: 'Metodologi ROI', method_total: 'ROI = (Pulangan Bersih ÷ Kos Pelaburan) × 100',
      method_annual: 'ROI tahunan = (Pulangan Bersih ÷ Kos Pelaburan) ÷ Tahun × 100',
      npv_title: 'Nilai Kini Bersih (NPV)', discount_rate_used: 'Kadar Diskaun Digunakan', pv_cashflows: 'Nilai Kini Aliran Tunai',
      initial_investment: 'Pelaburan Awal', pv_sum: 'Jumlah Nilai Kini', npv_val: 'NPV',
      irr_title: 'Kadar Pulangan Dalaman (IRR)', discount_note: 'Kadar Diskaun TIDAK mengubah IRR secara langsung.',
      payback_title: 'Tempoh Bayar Balik', annual_cf: 'Aliran Tunai Tahunan', cumulative_cf: 'Aliran Tunai Kumulatif',
      payback_year: 'Tahun Bayar Balik', payback_period: 'Tempoh Bayar Balik', recovered_in_year: 'Pulih dalam Tahun',
      ratios_title: 'Nisbah Kewangan', profitability: 'Keberuntungan', liquidity: 'Kecairan', leverage: 'Hutang (Leverage)', efficiency: 'Kecekapan',
      scenario_title: 'Analisis Senario', base: 'KES ASAS', optimistic: 'KES OPTIMIS', pessimistic: 'KES PESIMIS',
      sensitivity_title: 'Analisis Sensitiviti', scn_revenue: 'Hasil', scn_growth: 'Pertumbuhan', scn_cogs: 'COGS', scn_opex: 'OPEX',
      scn_capex: 'CAPEX', scn_financing: 'Pembiayaan', scn_wc: 'Modal Kerja'
    },

    ratios: {
      gross_margin: 'Margin Kasar', ebitda_margin: 'Margin EBITDA', net_margin: 'Margin Untung Bersih', roa: 'ROA', roe: 'ROE',
      current_ratio: 'Nisbah Semasa', quick_ratio: 'Nisbah Segera', dte: 'Hutang ke Ekuiti', debt_ratio: 'Nisbah Hutang',
      asset_turnover: 'Pusing Ganti Aset', recv_days: 'Hari Terimaan', inv_days: 'Hari Inventori', pay_days: 'Hari Bayaran',
      total_assets: 'Jumlah Aset', current_assets: 'Aset Semasa', current_liab: 'Liabiliti Semasa', equity: 'Ekuiti',
      take: 'Ukuran'
    },
    scenarios: {
      title: 'Senario', base: 'ASAS',
      revenue: 'Hasil', growth_pct: 'Pertumbuhan (%)', cogs_pct: 'COGS (%)', opex_pct: 'OPEX (%)', capex: 'CAPEX', financing: 'Pembiayaan',
      npv: 'NPV', irr: 'IRR', roi: 'ROI', net_profit: 'Untung Bersih (Thn 5)', be_units: 'BE Unit (Thn 1)',
      param: 'Parameter', multipler: 'Pengganda Ujian', impact: 'Kesan'
    },

    budget: {
      title: 'Belanjawan vs Sebenar', budget: 'Belanjawan', actual: 'Sebenar', variance: 'Varian', rev_variance: 'Varian Hasil',
      exp_variance: 'Varian Perbelanjaan', profit_variance: 'Varian Untung', cf_variance: 'Varian Aliran Tunai', capex_variance: 'Varian CAPEX',
      actual_revenue: 'Hasil Sebenar (Thn 1)', actual_cogs: 'COGS Sebenar (Thn 1)', actual_opex: 'OPEX Sebenar (Thn 1)',
      actual_capex: 'CAPEX Sebenar (Thn 1)', favorable: 'Memberangsangkan (A)', unfavorable: 'Tidak Memberangsangkan (T)', label_year: 'Tahun',
      central_note: 'Andaian pusat: semua modul kewangan membaca nilai dari sini. Tukar satu nilai dan semua pengiraan bergantung dikemas kini secara automatik.',
      yearly: 'Tahunan'
    },

    reports: {
      title: 'Laporan & Eksport', preview: 'PRATONTON LAPORAN', generate_pdf: 'Jana PDF', generate_word: 'Jana Word',
      generate_excel: 'Jana Excel', export_all: 'Eksport Semua', include_exclude: 'Sertakan / Kecualikan Seksyen',
      sections: 'Seksyen Laporan', cover: 'Kulit', exec_summary: 'Ringkasan Eksekutif', profile: 'Profil Perniagaan',
      mode: 'Mod Kewangan', assumptions: 'Andaian', investment: 'Pelaburan Permulaan', capex: 'CAPEX', revenue: 'Hasil',
      cogs: 'COGS', expenses: 'Perbelanjaan', pl: 'P&L', cashflow: 'Aliran Tunai', wc: 'Modal Kerja', financing: 'Pembiayaan',
      depreciation: 'Susut Nilai', breakeven: 'Titik Pulang Modal', roi: 'ROI', npv: 'NPV', irr: 'IRR', payback: 'Bayar Balik',
      scenarios: 'Senario', sensitivity: 'Sensitiviti', ratios: 'Nisbah', budget: 'Belanjawan vs Sebenar', summary: 'Ringkasan Kewangan',
      islamic: 'Pembiayaan Islam', screening: 'Saringan Syariah', review: 'Semakan Syariah', status: 'Status Syariah', disclaimer: 'Penafian Syariah',
      filename_note: 'Nama fail: BizFinPro_ProjectName_2026.xlsx / .pdf / .docx',
      date_label: 'Tarikh Laporan', initial_investment: 'Pelaburan Permulaan'
    },

    alerts: {
      neg_cashflow: 'Aliran tunai negatif pada', cash_shortfall: 'Kekurangan tunai (tunai akhir negatif) pada', high_debt: 'Nisbah hutang melebihi 70%',
      low_margin: 'Margin bersih di bawah 5%', neg_npv: 'NPV negatif — pulangan di bawah kadar diperlukan',
      irr_nc: 'IRR tidak boleh dikira daripada siri aliran tunai', long_payback: 'Bayar balik melebihi tempoh unjuran',
      revenue_decline: 'Hasil menurun tahun ke tahun', excessive_expenses: 'OPEX melebihi 90% hasil', wc_shortage: 'Keperluan modal kerja melebihi tunai awal',
      missing_assumptions: 'Andaian kosong / tidak sah', riba: 'Kemungkinan pendedahan riba', gharar: 'Kemungkinan gharar',
      maysir: 'Kemungkinan maysir', unscreened: 'Aktiviti perniagaan belum disaring', no_review: 'Semakan Syariah belum direkod',
      no_contract: 'Maklumat kontrak tidak lengkap',
      none: 'Tiada amaran dikesan'
    },

    settings: {
      title: 'Tetapan', language: 'Bahasa', currency: 'Mata Wang', fin_mode: 'Mod Kewangan',
      default_period: 'Tempoh Unjuran Lalai', default_discount: 'Kadar Diskaun Lalai', rate_mode: 'Mod Kadar',
      tax_assumption: 'Andaian Cukai', number_format: 'Format Nombor', theme: 'Tema', backup_restore: 'Sandaran / Pulih',
      data_management: 'Pengurusan Data', report_settings: 'Tetapan Laporan', shariah_settings: 'Tetapan Syariah',
      backup_project: 'Sandarkan Projek', restore_project: 'Pulihkan Projek', export_json: 'Eksport Semua (JSON)',
      import_json: 'Import (JSON)', clear_all: 'Padam Semua Data', language_label: 'Bahasa Antara Muka',
      mode_switch_warn: 'Menukar Mod Kewangan mungkin mengubah struktur pembiayaan & andaian berkaitan. Tiada data akan dipadam; anda boleh tukar semula bila-bila masa.'
    },
    wizard: {
      title: 'Panduan Persediaan Projek', step: 'Langkah', step_basics: 'Asas', step_profile: 'Profil', step_assumptions: 'Andaian',
      step_capex: 'CAPEX', step_initial: 'Pelaburan & Kos Permulaan', step_revenue: 'Hasil', step_cogs: 'COGS',
      step_opex: 'OPEX', step_financing: 'Pembiayaan', step_done: 'Selesai', next: 'Seterusnya',
      done_txt: 'Projek sedia! Anda boleh mengubah apa-apa pada bila-bila masa.'
    },
    common: {
      demo_k: 'Demo — Konvensional', demo_s: 'Demo — Syariah', new_project: 'Projek Baharu', no_project: 'Tiada projek dipilih',
      select_project: 'Pilih projek untuk bermula, atau cipta projek baharu.', create_first: 'Cipta Projek Baharu',
      delete: 'Padam', edit: 'Edit', name: 'Nama', per_project_note: 'Tetapan ini terpakai bagi projek semasa',
      last_saved: 'Disimpan terakhir', currency: 'Mata Wang', period: 'Tempoh', mode: 'Mod',
      copy: 'Salin', open: 'Buka', duplicate: 'Duplikat', rename: 'Nama Semula', export: 'Eksport'
    }
  };

  const EN = {
    app: { name: 'BizFinPro', tagline: 'Business Budget • ROI • NPV • IRR • Financial Projection' },
    on: 'On', off: 'Off', auto: 'Automatic', manual: 'Manual', active: 'Active', automatic_value: 'Automatic Value',
    manual_override: 'Manual Override', active_value: 'Active Value', reset_to_auto: 'Reset to Automatic',
    save: 'Save', cancel: 'Cancel',    total: 'Total', add: 'Add', period: 'Period',
    restore: 'Restore', restore_note: 'Deleted items (restore to show again)',
 delete: 'Delete', edit: 'Edit', add: 'Add', close: 'Close', back: 'Back',
    confirm: 'Confirm', proceed: 'Proceed', yes: 'Yes', no: 'No', optional: 'optional', required: 'required',
    name: 'Name', amount: 'Amount', total: 'Total', year: 'Year', month: 'Month', note: 'Note',
    per_year: '/yr', per_month: '/mo', today: 'Today', not_calculable: 'Not Calculable',
    requires_review: 'Requires Review', not_recovered: 'Not Recovered Within Projection Period', overview: 'Overview', details: 'Details',
    formula: 'Formula', methodology: 'Methodology', inputs: 'Inputs', calculation: 'Calculation', result: 'Result', explanation: 'Explanation',
    nav: {
      home: 'Home', projects: 'Projects', business: 'Business Profile', budget: 'Budget & Assumptions',
      financials: 'Financials', capex: 'CAPEX', revenue: 'Revenue Projection', cogs: 'COGS', expenses: 'OPEX / Expenses',
      pl: 'Profit & Loss', cashflow: 'Cash Flow', working_capital: 'Working Capital',
      analysis: 'Analysis', breakeven: 'Break-Even', roi: 'ROI', npv: 'NPV', irr: 'IRR', payback: 'Payback Period',
      ratios: 'Financial Ratios', scenarios: 'Scenario Analysis', sensitivity: 'Sensitivity Analysis',
      financing: 'Financing', conventional: 'Conventional Financing', islamic: 'Islamic Financing',
      syariah: 'Syariah', screening: 'Shariah Screening', review: 'Shariah Review',
      reports: 'Reports', revenue_report: 'Revenue Report', settings: 'Settings', wizard: 'Setup Wizard'
    },
    mode: {
      label: 'Financial Mode', konvensional: 'KONVENSIONAL', syariah: 'SYARIAH',
      choose: 'Choose Financial Mode', konv_sub: 'Bank loans, interest & conventional financing.', syr_sub: 'Islamic financing (Murabahah, Ijarah, …) without riba.',
      indicator: 'FINANCIAL MODE'
    },
    dashboard: {
      title: 'Dashboard', total_investment: 'Total Investment', revenue: 'Revenue', gross_profit: 'Gross Profit',
      net_profit: 'Net Profit', ebitda: 'EBITDA', closing_cash: 'Closing Cash', roi: 'ROI', npv: 'NPV', irr: 'IRR',
      payback: 'Payback Period', breakeven: 'Break-Even', debt: 'Debt / Financing', key_ratios: 'Key Ratios',
      shariah_status: 'Shariah Screening Status', financing_structure: 'Financing Structure', potential_issues: 'Potential Issues',
      dynamic: 'Updated automatically',
      review_status: 'Review Status', alerts: 'Financial Alerts', quick: 'Executive Summary'
    },
    profile: {
      title: 'Business Profile', business_name: 'Business Name', reg_no: 'Registration No.', business_type: 'Business Type',
      industry: 'Industry', address: 'Address', contact: 'Contact Information', owner: 'Owner / Director',
      employees: 'No. of Employees', description: 'Business Description', objective: 'Business Objective',
      project_objective: 'Project Objective', projection_period: 'Projection Period', project_type_label: 'Project Type'
    },
    assumptions: {
      title: 'Central Assumptions', revenue_growth: 'Revenue Growth', sales_volume: 'Sales Volume', selling_price: 'Selling Price',
      inflation: 'Inflation', cogs_pct: 'COGS %', opex_growth: 'OPEX Growth', tax_rate: 'Tax Rate',
      discount_rate: 'Discount Rate', financing_rate: 'Financing Rate', working_capital_pct: 'Working Capital %',
      useful_life: 'Useful Life (years)', residual_value: 'Residual Value', collection_days: 'Collection Days',
      payment_days: 'Payment Days', inventory_days: 'Inventory Days', rate_source: 'Source / Note',
      last_updated: 'Last Updated', auto_default: 'Automatic default rate', manual_note: 'User-entered rate',
      active_rate: 'Active Rate', auto_rate: 'Automatic Rate', manual_rate: 'Manual Rate', reset_note: 'Reset to the automatic rate.'
    },
    capex: {
      title: 'CAPEX Planning', asset_name: 'Asset Name', category: 'Category', qty: 'Qty', unit_cost: 'Unit Cost',
      total_cost: 'Total Cost', purchase_date: 'Purchase Date', useful_life: 'Useful Life', residual: 'Residual Value',
      dep_method: 'Depreciation Method', total_capex: 'Total CAPEX', categories: {
        property: 'Property', renovation: 'Renovation', machinery: 'Machinery', equipment: 'Equipment',
        vehicle: 'Vehicle', furniture: 'Furniture', it: 'IT Equipment', software: 'Software', other: 'Other'
      },
      dep: { sl: 'Straight Line', rb: 'Reducing Balance' }, add_asset: 'No assets yet — click ＋ Add'
    },
    investment: {
      title: 'Initial Investment', initials: 'Initial Investment', startup: 'Startup Cost', preop: 'Pre-Operating Cost',
      capex: 'CAPEX', working_capital: 'Initial Working Capital', total_funding: 'Total Funding Requirement',
      startup_items: 'Startup cost items (e.g. registration, licences, deposits, initial marketing)'
    },
    revenue: {
      title: 'Revenue Projection', product: 'Product', service: 'Service', qty: 'Quantity', unit_price: 'Unit Price',
      monthly_sales: 'Monthly Sales', annual_sales: 'Annual Sales', growth: 'Growth', seasonal: 'Seasonal Adjustment',
      add_stream: 'Add Revenue Stream', stream_name: 'Stream Name', type: 'Type', monthly_volume: 'Monthly Volume',
      year1_annual: 'Annual Revenue (Year 1)', base_from_monthly: 'Base annual total = Monthly volume × 12',
      season_adj: 'Peak Month Weight (Year 1)',
      peak_month: 'Peak Month', year1_base: 'Year 1 (base)', yearly_title: 'Annual Revenue (Multi-Year)', mode_select: 'Input Mode', cash: 'Cash In'
    },

    cogs: {
      title: 'Cost of Goods Sold (COGS)', material: 'Material Cost', product_cost: 'Product Cost', direct_labour: 'Direct Labour',
      direct_production: 'Direct Production Cost', other_direct: 'Other Direct Costs', gross_profit: 'Gross Profit', gross_margin: 'Gross Margin',
      direct_flat_costs: 'Fixed direct costs /yr (outside revenue %)', direct_cogs_pct_override: 'Direct COGS % override (optional)',
      as_pct_of_revenue: '% of revenue', auto_from_assumption: 'Automatic — use COGS % assumption'
    },
    expenses: {
      title: 'OPEX / Projected Expenses', salaries: 'Salaries', rent: 'Rent', utilities: 'Utilities', marketing: 'Marketing',
      transport: 'Transportation', insurance: 'Insurance', maintenance: 'Maintenance', software: 'Software',
      admin: 'Administration', professional: 'Professional Fees', telco: 'Telephone / Internet', other: 'Other Expenses',
      monthly: 'Monthly', annual: 'Annual', fixed: 'Fixed', variable: 'Variable', growth: 'Growth',
      salary_headcount: 'Salaried headcount', salary_avg: 'Average monthly salary /employee', month1_amount: 'Monthly amount',
      annual_amount: 'Annual amount', per_month_equivalent: 'equiv. per month',
      employee_related: 'Salaries & employee-related', salary_epf_pct: 'Employer EPF/SOCSO/EIS % (estimate)',
      periodic: 'Frequency', growth_blank_note: 'Leave growth blank to use the central assumption', yearly: 'Annual',
      contingency: 'Contingency / Miscellaneous', torch: 'View OPEX assumptions (central assumptions)',
      other_opex: 'other OPEX', from_payroll: 'from payroll model (automatic)',
      payroll_title: 'Salary & Statutory Model', payroll_note: 'Headcount × monthly salary + employer statutory on-cost (EPF/KWSP + SOCSO/PERKESO). When enabled it replaces the flat Salaries category.',
      salary_escalation: 'Salary escalation', blank_central: 'blank = use central assumption', per_head: 'cost/employee',
      epf_low: 'EPF (KWSP) employer — wage ≤', epf_high: 'EPF (KWSP) employer — wage >', epf_ceiling: 'EPF wage ceiling (RM)',
      socso_pct: 'SOCSO (PERKESO) employer', socso_ceiling: 'SOCSO wage ceiling (RM)',
      payroll_projection: 'Payroll Projection', payroll_gross: 'Gross salary', employer_oncost: 'employer on-cost',
      payroll_total_cost: 'Total Employer Cost', payroll_sensitivity: 'Payroll Cost Sensitivity',
      sensitivity_note: 'Full employer cost (salary + EPF + SOCSO) under each salary-escalation scenario. Other figures (P&L, NPV) use the base case.',
    },

    pl: {
      title: 'Profit & Loss', revenue: 'Revenue', cogs: 'COGS', gross_profit: 'Gross Profit', opex: 'Operating Expenses',
      ebitda: 'EBITDA', depreciation: 'Depreciation', ebit: 'EBIT', financing_cost: 'Financing Cost', pbt: 'Profit Before Tax',
      tax: 'Tax', net_profit: 'Net Profit', gm: 'Gross Margin', em: 'EBITDA Margin', nm: 'Net Profit Margin',
      profit_margin_note: 'Net Profit ÷ Revenue'
    },
    cashflow: {
      title: 'Cash Flow Projection', operating: 'Operating Cash Flow', investing: 'Investing Cash Flow',
      financing: 'Financing Cash Flow', net: 'Net Cash Flow', opening: 'Opening Cash', closing: 'Closing Cash',
      dep_addback: 'Depreciation: accounting expense, not a cash outflow', cash_movements: 'Actual Cash Movements',
      accounting: 'Accounting Expenses', note: 'Depreciation reduces accounting profit but is NOT treated as a cash outflow.'
    },
    wc: {
      title: 'Working Capital', ar: 'Accounts Receivable', inventory: 'Inventory', ap: 'Accounts Payable',
      cash_req: 'Cash Requirement', wc_req: 'Working Capital Requirement', change: 'Annual Change', collection_days: 'Collection Days',
      inventory_days: 'Inventory Days', payment_days: 'Payment Days', receivable_days: 'Receivable Days', payable_days: 'Payable Days',
      days_hint: 'Working capital needs are derived from collection, inventory and payment days.'
    },

    financing: {
      title: 'Financing', conv_title: 'Conventional Financing', structure: 'Structure', bank_loan: 'Bank Loan',
      business_loan: 'Business Loan', term_loan: 'Term Loan', revolving: 'Revolving Facility', other_fin: 'Other Financing',
      loan_amount: 'Loan Amount', interest_rate: 'Interest Rate', tenure: 'Tenure (years)', start_date: 'Start Date',
      payment_freq: 'Payment Frequency', grace_period: 'Grace Period (months)', fees: 'Fees', principal: 'Principal',
      interest: 'Interest', installment: 'Installment', outstanding: 'Outstanding Balance', amortization: 'Amortization Schedule',
      separator_note: 'Loan principal is separated from interest expense.',
      freq: { monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' },
      total: 'Total',
      islamic_title: 'Islamic Financing',
      disclaimer_intro: 'The app does NOT assume a product is Shariah-compliant merely because it is labelled "Islamic". Actual contracts & documentation may require review by a qualified Shariah adviser.',
      structures: { murabahah: 'Murabahah', ijarah: 'Ijarah', musharakah: 'Musharakah', mudarabah: 'Mudarabah', istisna: "Istisna'", salam: 'Salam', other: 'Other Structures' }
    },
    murabahah: {
      asset_cost: 'Asset Cost', acquisition_cost: 'Acquisition Cost', selling_price: 'Selling Price', margin: 'Mark-up (%)',
      term_months: 'Term (months)', deposit: 'Deposit / Down Payment', financed_amount: 'Financed Amount',
      profit_paid: 'Total Mark-up Paid', installment_pm: 'Installment /mo', transparency: 'Transparent calculation: selling price = cost + agreed mark-up.'
    },
    ijarah: {
      asset_value: 'Asset Value', lease_years: 'Lease Period (years)', rental_pm: 'Rental /mo', maintenance: 'Maintenance /mo',
      deposit: 'Deposit', own_arrangement: 'Ownership Arrangement', end_arrangement: 'End-of-Term Arrangement',
      total_rental: 'Total Rental', net_rental_cf: 'Net Rental Cash Flow'
    },
    musharakah: {
      capital: 'Your Capital', partner: 'Partner Capital', ownership: 'Your Ownership / Participation (%)',
      profit_sharing: 'Profit-Sharing Ratio (%)', loss_allocation: 'Loss Allocation', adj_profit: 'Adjusted Profit',
      no_guarantee: 'Projected profit is NOT guaranteed. Losses are typically shared per capital ratio.'
    },
    mudarabah: {
      capital_provider: 'Capital Provider', manager: 'Entrepreneur / Manager', capital_amount: 'Capital Amount',
      psr: 'Profit-Sharing Ratio (%)', s_profit: 'Projected Profit', distribution: 'Distribution',
      no_guarantee: 'Projected profit is an estimate, NOT a guaranteed return.'
    },
    istisna: {
      contract_value: 'Contract Value', delivery: 'Delivery Schedule', payment: 'Payment Schedule',
      prod_cost: 'Production / Construction Cost', exp_rev: 'Expected Revenue', margin: 'Projected Margin', cf: 'Cash Flow'
    },
    screening: {
      title: 'Shariah Screening', dashboard: 'Screening Dashboard', business_activity: 'Business Activity',
      riba: 'RIBA', gharar: 'GHARAR', maysir: 'MAYSIR', halal: 'HALAL BUSINESS ACTIVITY', fin_structure: 'FINANCIAL STRUCTURE',
      status: 'Status', screened: 'SCREENED', requires_review: 'REQUIRES REVIEW', potential_issue: 'POTENTIAL ISSUE', not_screened: 'NOT SCREENED',
      q_activity: 'Does the business activity involve non-compliant elements (alcohol, gambling, conventional riba, etc.)?',
      q_riba: 'Is there interest/riba exposure (conventional loans, interest-bearing deposits)?',
      q_gharar: 'Is there excessive uncertainty (gharar) in the contracts?',
      q_maysir: 'Are there gambling/speculative elements (maysir)?',
      q_sens: 'Halal activity status',
      yes: 'Yes', no: 'No', unsure: 'Unsure', manufacturing: 'Manufacturing / General Trading',
      services: 'Professional Services', food: 'Halal Food & Beverage', agriculture: 'Agriculture / Livestock',
      retail: 'Retail', education: 'Education', tech: 'Technology / Digital', other: 'Other',
      not_cert: 'Automated screening is NOT a certification. See disclaimer.',
      disclaimer: 'Important: BizFinPro provides a financial screening and analysis tool. Automated Shariah screening does not constitute a fatwa, Shariah certification or formal legal/religious ruling. Final determination of Shariah compliance should be obtained from a qualified Shariah adviser or relevant authority based on the actual business activities, contracts, financing documents and applicable Shariah standards.'
    },
    review: {
      title: 'Shariah Review', adviser: 'Shariah Adviser Name', review_date: 'Review Date', status: 'Review Status',
      notes: 'Review Notes', ref_docs: 'Reference Documents', contract_docs: 'Contract Documents', evidence: 'Supporting Evidence',
      approval: 'Approval / Review Record', attachments: 'Attachments (where supported)',
      pending: 'Pending', in_progress: 'In Progress', approved: 'Approved (Conditional)', referred: 'Referred to Adviser',
      standards: 'External Shariah Standards', std_name: 'Standard', issuing_body: 'Issuing Body', version: 'Version', std_date: 'Date', std_ref: 'Reference'
    },
    analysis: {
      title: 'Financial Analysis', breakeven_title: 'Break-Even Analysis', fixed_cost: 'Fixed Cost', variable_cost: 'Variable Cost',
      selling_price: 'Selling Price', be_units: 'Break-Even Units', be_revenue: 'Break-Even Revenue',
      contribution_margin: 'Contribution Margin', contribution_pct: 'Contribution Margin %',
      roi_title: 'Return on Investment (ROI)', investment: 'Investment', return: 'Return', net_return: 'Net Return',
      roi_method: 'ROI Methodology', method_total: 'ROI = (Net Return ÷ Investment Cost) × 100',
      method_annual: 'Annualised ROI = (Net Return ÷ Investment Cost) ÷ Years × 100',
      npv_title: 'Net Present Value (NPV)', discount_rate_used: 'Discount Rate Used', pv_cashflows: 'PV of Cash Flows',
      initial_investment: 'Initial Investment', pv_sum: 'Sum of PVs', npv_val: 'NPV',
      irr_title: 'Internal Rate of Return (IRR)', discount_note: 'Discount Rate does NOT directly change IRR.',
      payback_title: 'Payback Period', annual_cf: 'Annual Cash Flow', cumulative_cf: 'Cumulative Cash Flow',
      payback_year: 'Payback Year', payback_period: 'Payback Period', recovered_in_year: 'Recovered in Year',
      ratios_title: 'Financial Ratios', profitability: 'Profitability', liquidity: 'Liquidity', leverage: 'Leverage', efficiency: 'Efficiency',
      scenario_title: 'Scenario Analysis', base: 'BASE CASE', optimistic: 'OPTIMISTIC CASE', pessimistic: 'PESSIMISTIC CASE',
      sensitivity_title: 'Sensitivity Analysis', scn_revenue: 'Revenue', scn_growth: 'Growth', scn_cogs: 'COGS', scn_opex: 'OPEX',
      scn_capex: 'CAPEX', scn_financing: 'Financing', scn_wc: 'Working Capital'
    },

    ratios: {
      gross_margin: 'Gross Margin', ebitda_margin: 'EBITDA Margin', net_margin: 'Net Profit Margin', roa: 'ROA', roe: 'ROE',
      current_ratio: 'Current Ratio', quick_ratio: 'Quick Ratio', dte: 'Debt-to-Equity', debt_ratio: 'Debt Ratio',
      asset_turnover: 'Asset Turnover', recv_days: 'Receivable Days', inv_days: 'Inventory Days', pay_days: 'Payable Days',
      total_assets: 'Total Assets', current_assets: 'Current Assets', current_liab: 'Current Liabilities', equity: 'Equity', take: 'Measure'
    },total_assets: 'Total Assets', current_assets: 'Current Assets', current_liab: 'Current Liabilities', equity: 'Equity',

    scenarios: {
      title: 'Scenario', base: 'BASE',
      revenue: 'Revenue', growth_pct: 'Growth (%)', cogs_pct: 'COGS (%)', opex_pct: 'OPEX (%)', capex: 'CAPEX', financing: 'Financing',
      npv: 'NPV', irr: 'IRR', roi: 'ROI', net_profit: 'Net Profit (Yr 5)', be_units: 'BE Units (Yr 1)',
      param: 'Parameter', multipler: 'Test Multiplier', impact: 'Impact'
    },

    budget: {
      title: 'Budget vs Actual', budget: 'Budget', actual: 'Actual', variance: 'Variance', rev_variance: 'Revenue Variance',
      exp_variance: 'Expense Variance', profit_variance: 'Profit Variance', cf_variance: 'Cash Flow Variance', capex_variance: 'CAPEX Variance',
      actual_revenue: 'Actual Revenue (Yr 1)', actual_cogs: 'Actual COGS (Yr 1)', actual_opex: 'Actual OPEX (Yr 1)',
      actual_capex: 'Actual CAPEX (Yr 1)', favorable: 'Favourable (F)', unfavorable: 'Unfavourable (U)', label_year: 'Year',
      central_note: 'Central assumptions: all financial modules read values from here. Change one value and dependent calculations update automatically.',
      yearly: 'Annual'
    },

    reports: {
      title: 'Reports & Export', preview: 'REPORT PREVIEW', generate_pdf: 'Generate PDF', generate_word: 'Generate Word',
      generate_excel: 'Generate Excel', export_all: 'Export All', include_exclude: 'Include / Exclude Sections',
      sections: 'Report Sections', cover: 'Cover', exec_summary: 'Executive Summary', profile: 'Business Profile',
      mode: 'Financial Mode', assumptions: 'Assumptions', investment: 'Initial Investment', capex: 'CAPEX', revenue: 'Revenue',
      cogs: 'COGS', expenses: 'Expenses', pl: 'P&L', cashflow: 'Cash Flow', wc: 'Working Capital', financing: 'Financing',
      depreciation: 'Depreciation', breakeven: 'Break-Even', roi: 'ROI', npv: 'NPV', irr: 'IRR', payback: 'Payback',
      scenarios: 'Scenarios', sensitivity: 'Sensitivity', ratios: 'Ratios', budget: 'Budget vs Actual', summary: 'Financial Summary',
      islamic: 'Islamic Financing', screening: 'Shariah Screening', review: 'Shariah Review', status: 'Shariah Status', disclaimer: 'Shariah Disclaimer',
      filename_note: 'Filenames: BizFinPro_ProjectName_2026.xlsx / .pdf / .docx',
      date_label: 'Report Date', initial_investment: 'Initial Investment'
    },

    alerts: {
      neg_cashflow: 'Negative cash flow in', cash_shortfall: 'Cash shortfall (negative closing cash) in', high_debt: 'Debt ratio exceeds 70%',
      low_margin: 'Net margin below 5%', neg_npv: 'Negative NPV — return below required rate',
      irr_nc: 'IRR is not calculable from the cash-flow series', long_payback: 'Payback exceeds projection period',
      revenue_decline: 'Revenue declining year-over-year', excessive_expenses: 'OPEX exceeds 90% of revenue', wc_shortage: 'Working capital needs exceed opening cash',
      missing_assumptions: 'Blank / invalid assumptions', riba: 'Potential riba exposure', gharar: 'Potential gharar',
      maysir: 'Potential maysir', unscreened: 'Business activity not screened', no_review: 'Shariah review not recorded',
      no_contract: 'Missing contract information',
      none: 'No alerts detected'
    },

    settings: {
      title: 'Settings', language: 'Language', currency: 'Currency', fin_mode: 'Financial Mode',
      default_period: 'Default Projection Period', default_discount: 'Default Discount Rate', rate_mode: 'Rate Mode',
      tax_assumption: 'Tax Assumption', number_format: 'Number Formatting', theme: 'Theme', backup_restore: 'Backup / Restore',
      data_management: 'Data Management', report_settings: 'Report Settings', shariah_settings: 'Shariah Settings',
      backup_project: 'Backup Project', restore_project: 'Restore Project', export_json: 'Export All (JSON)',
      import_json: 'Import (JSON)', clear_all: 'Delete All Data', language_label: 'Interface Language',
      mode_switch_warn: 'Changing Financial Mode may change financing structures & related assumptions. No data is deleted; you can switch back anytime.'
    },
    wizard: {
      title: 'Project Setup Wizard', step: 'Step', step_basics: 'Basics', step_profile: 'Profile', step_assumptions: 'Assumptions',
      step_capex: 'CAPEX', step_initial: 'Investment & Startup Costs', step_revenue: 'Revenue', step_cogs: 'COGS',
      step_opex: 'OPEX', step_financing: 'Financing', step_done: 'Done', next: 'Next',
      done_txt: 'Project ready! You can change anything anytime.'
    },
    common: {
      demo_k: 'Demo — Konvensional', demo_s: 'Demo — Syariah', new_project: 'New Project', no_project: 'No project selected',
      select_project: 'Select a project to get started, or create a new one.', create_first: 'Create New Project',
      delete: 'Delete', edit: 'Edit', name: 'Name', per_project_note: 'This setting applies to the current project',
      last_saved: 'Last saved', currency: 'Currency', period: 'Period', mode: 'Mode',
      copy: 'Copy', open: 'Open', duplicate: 'Duplicate', rename: 'Rename', export: 'Export'
    }
  };

  const dicts = { ms: MS, en: EN };
  let lang = 'ms';
  function setLang(l) { lang = dicts[l] ? l : 'ms'; }
  function t(path) {
    const parts = path.split('.');
    let cur = dicts[lang];
    for (const p of parts) { if (cur == null) return path; cur = cur[p]; }
    return (typeof cur === 'string') ? cur : path;
  }
  global.I18N = { setLang, t, lang: () => lang, dicts };
})(typeof window !== 'undefined' ? window : globalThis);
