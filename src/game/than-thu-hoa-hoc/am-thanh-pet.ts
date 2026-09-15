/**
 * ÂM THANH THẦN THÚ — DỰNG BẰNG WEB AUDIO, KHÔNG MỘT TỆP MP3 NÀO.
 *
 * Thầy chốt 15-09: *"sửa lại âm thanh tiếng kêu dễ thương của từng con thú, âm
 * thanh hiện tại quá đơn điệu và nhàm chán. Âm thanh phải xịn nghe chân thật
 * dễ thương, âm thanh của chưởng phải mãnh liệt đẳng cấp."*
 *
 * ───────────────────────────────────────────────────────────────────────────
 * BẢN TRƯỚC SAI Ở ĐÂU. Mọi tiếng đều là MỘT bộ dao động trần nối thẳng ra loa,
 * biên độ lên rồi xuống. Tai người nghe ra "bíp", không ra "con vật kêu". Ba
 * thứ quyết định một tiếng nghe thật thì đều thiếu:
 *   · KHÔNG CÓ RUNG GIỌNG. Giọng sống nào cũng rung nhẹ 5–7 lần/giây; thiếu
 *     nó thì âm đứng chết một cao độ, nghe ra máy móc.
 *   · KHÔNG CÓ HỐC CỘNG HƯỞNG. Tiếng kêu đi qua khoang miệng nên có đỉnh
 *     formant. Thiếu bộ lọc cộng hưởng thì chỉ còn sóng thô.
 *   · KHÔNG CÓ KHÔNG GIAN. Âm khô khốc dán sát màng loa. Một đuôi vang ngắn
 *     là thứ rẻ nhất biến "bíp" thành "tiếng vang trong hang".
 *
 * BẢN NÀY dựng một bộ đồ nghề nhỏ rồi ghép:
 *   nguồn → lọc cộng hưởng → bao biên độ ─┬→ nén → âm lượng chung → loa
 *                                          └→ gửi vang → hộp vang → nén
 *
 * Hộp vang là đáp ứng xung TỰ SINH bằng nhiễu tắt dần — không tải tệp.
 * Bộ nén đứng chốt cuối để các lớp chồng lên nhau không vỡ tiếng.
 *
 * SÁU HỆ SÁU GIỌNG, mỗi giọng dựng từ chất của hệ, không giọng nào lẫn giọng nào:
 *   Hoả      gừ ấm dâng lên kèm lách tách than nổ
 *   Acid     ục ục sủi bọt, ba tiếng "blop" tụt dần kèm xèo ăn mòn
 *   Base     chuông tinh thể, điều biến tần số, đuôi ngân dài lấp lánh
 *   Khí      huýt hơi, luồng khí thoát qua khe hẹp rồi vút lên
 *   Điện hoá tách tách tia lửa rồi tiếng chíp giật
 *   Hữu cơ   ba nốt tròn nảy như chuỗi carbon bật lò xo
 *
 * CHƯỞNG. Chưởng thường là một tiếng vút gọn. Chưởng cuồng nộ dựng ba tầng:
 * tiếng RÍT DÂNG suốt lúc dồn lực → CÚ GIÁNG trầm sâu kèm vỡ → ĐUÔI VANG.
 */

interface TuyGiong {
  /** Lùi bao nhiêu giây so với bây giờ. */
  tre?: number
  dang?: OscillatorType
  /** Cao độ đầu, cuối, và điểm uốn giữa chừng (Hz). */
  f0: number
  f1?: number
  fGiua?: number
  to: number
  /** Thời gian lên, giữ, tắt (giây). */
  len?: number
  giu: number
  tat: number
  /** Biên rung giọng tính theo phần trăm cao độ, và nhịp rung (Hz). */
  rung?: number
  nhipRung?: number
  /** Bộ lọc cộng hưởng: kiểu, tần số đầu–cuối, độ nhọn. */
  loc?: BiquadFilterType
  fLoc?: number
  fLoc1?: number
  qLoc?: number
  /** Bộ dao động thứ hai lệch cents — dày tiếng, bớt mỏng. */
  lech?: number
  /** Lượng gửi sang hộp vang, 0 đến 1. */
  vang?: number
}

interface TuyOn {
  tre?: number
  to: number
  len?: number
  giu: number
  tat: number
  loc?: BiquadFilterType
  f0: number
  f1?: number
  q?: number
  vang?: number
}

export class AmThanhPet {
  private ctx: BaseAudioContext | null = null
  private bat = true
  private chung: GainNode | null = null
  private nen: DynamicsCompressorNode | null = null
  private guiVang: GainNode | null = null
  private onTrang: AudioBuffer | null = null

  moKhoa(): void {
    if (this.ctx !== null) {
      // iOS treo ngữ cảnh mỗi lần rời tab; không đánh thức thì im lặng hoàn toàn.
      const c = this.ctx as AudioContext
      // Ngữ cảnh ngoại tuyến cũng có resume() nhưng gọi là hỏng — bọc lại cho im.
      if (c.state === 'suspended' && typeof c.resume === 'function') {
        try { c.resume().catch(() => {}) } catch { /* bỏ qua */ }
      }
      return
    }
    type Cua = typeof AudioContext
    const W = window as unknown as { AudioContext?: Cua; webkitAudioContext?: Cua }
    const C = W.AudioContext ?? W.webkitAudioContext
    if (C === undefined) return
    try {
      this.dungDayChuyen(new C())
    } catch {
      this.ctx = null
    }
  }

  /**
   * Dựng dây chuyền trên một ngữ cảnh CHO SẴN.
   *
   * Tách ra để phép kiểm hiển thị dựng được cùng bộ tiếng trên
   * `OfflineAudioContext` rồi ĐO sóng ra — không nghe được thì phải đo, chứ
   * không được đoán là "chắc kêu".
   */
  dungDayChuyen(ctx: BaseAudioContext): void {
    try {
      this.ctx = ctx

      // Nén đứng chốt cuối: chồng bốn năm lớp mà không vỡ tiếng.
      const nen = ctx.createDynamicsCompressor()
      nen.threshold.setValueAtTime(-19, ctx.currentTime)
      nen.knee.setValueAtTime(22, ctx.currentTime)
      nen.ratio.setValueAtTime(9, ctx.currentTime)
      nen.attack.setValueAtTime(0.004, ctx.currentTime)
      nen.release.setValueAtTime(0.16, ctx.currentTime)

      const chung = ctx.createGain()
      chung.gain.setValueAtTime(0.85, ctx.currentTime)

      nen.connect(chung)
      chung.connect(ctx.destination)
      this.nen = nen
      this.chung = chung

      // HỘP VANG tự sinh: nhiễu tắt dần theo hàm mũ, hai kênh lệch nhau cho rộng.
      const hop = ctx.createConvolver()
      const dai = Math.floor(ctx.sampleRate * 1.15)
      const ir = ctx.createBuffer(2, dai, ctx.sampleRate)
      for (let k = 0; k < 2; k++) {
        const d = ir.getChannelData(k)
        for (let i = 0; i < dai; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / dai, 2.8)
        }
      }
      hop.buffer = ir
      const gui = ctx.createGain()
      gui.gain.setValueAtTime(1, ctx.currentTime)
      gui.connect(hop)
      hop.connect(nen)
      this.guiVang = gui

      // Một đệm nhiễu trắng dùng chung cho mọi tiếng hơi, xèo, nổ.
      const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate)
      const d0 = n.getChannelData(0)
      for (let i = 0; i < d0.length; i++) d0[i] = Math.random() * 2 - 1
      this.onTrang = n
    } catch {
      this.ctx = null
    }
  }

  datBat(b: boolean): void {
    this.bat = b
    // Hạ âm lượng chung ngay: tắt tiếng giữa chừng phải im luôn, không đợi
    // những lớp đang ngân tự tắt.
    if (this.chung !== null && this.ctx !== null) {
      this.chung.gain.setTargetAtTime(b ? 0.85 : 0, this.ctx.currentTime, 0.02)
    }
  }
  dangBat(): boolean { return this.bat }

  /** Điểm vào chung: trả về ngữ cảnh nếu đang bật và sẵn sàng. */
  private san(): BaseAudioContext | null {
    if (!this.bat || this.ctx === null || this.nen === null) return null
    return this.ctx
  }

  /** Bao biên độ ba đoạn. Dùng ramp mũ nên giá trị không bao giờ chạm 0. */
  private bao(g: GainNode, t0: number, to: number, len: number, giu: number, tat: number): void {
    const dinh = Math.max(0.0005, to)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(dinh, t0 + len)
    g.gain.setValueAtTime(dinh, t0 + len + giu)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + len + giu + tat)
  }

  /** Một giọng có cao độ: dao động + rung giọng + hốc cộng hưởng + đuôi vang. */
  private giong(o: TuyGiong): void {
    const ctx = this.san()
    if (ctx === null) return
    try {
      const t = ctx.currentTime + (o.tre ?? 0)
      const len = o.len ?? 0.012
      const het = t + len + o.giu + o.tat

      const g = ctx.createGain()
      this.bao(g, t, o.to, len, o.giu, o.tat)

      let ra: AudioNode = g
      if (o.loc !== undefined) {
        const f = ctx.createBiquadFilter()
        f.type = o.loc
        f.frequency.setValueAtTime(Math.max(30, o.fLoc ?? 900), t)
        if (o.fLoc1 !== undefined) {
          f.frequency.exponentialRampToValueAtTime(Math.max(30, o.fLoc1), het)
        }
        f.Q.setValueAtTime(o.qLoc ?? 1, t)
        g.connect(f)
        ra = f
      }
      ra.connect(this.nen!)
      if ((o.vang ?? 0) > 0 && this.guiVang !== null) {
        const gv = ctx.createGain()
        gv.gain.setValueAtTime(o.vang ?? 0, t)
        ra.connect(gv)
        gv.connect(this.guiVang)
      }

      // Rung giọng: một dao động chậm lái thẳng vào cao độ.
      let lfo: OscillatorNode | null = null
      let sauLfo: GainNode | null = null
      if ((o.rung ?? 0) > 0) {
        lfo = ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.setValueAtTime(o.nhipRung ?? 6, t)
        sauLfo = ctx.createGain()
        sauLfo.gain.setValueAtTime(o.f0 * (o.rung ?? 0), t)
        lfo.connect(sauLfo)
        lfo.start(t)
        lfo.stop(het + 0.02)
      }

      const soBo = o.lech !== undefined ? 2 : 1
      for (let i = 0; i < soBo; i++) {
        const osc = ctx.createOscillator()
        osc.type = o.dang ?? 'sine'
        if (i === 1) osc.detune.setValueAtTime(o.lech ?? 0, t)
        osc.frequency.setValueAtTime(Math.max(20, o.f0), t)
        if (o.fGiua !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.fGiua), t + (len + o.giu) * 0.6)
        }
        if (o.f1 !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), het)
        }
        if (sauLfo !== null) sauLfo.connect(osc.frequency)
        osc.connect(g)
        osc.start(t)
        osc.stop(het + 0.02)
      }
    } catch { /* thiết bị không cho phát thì im, không làm vỡ màn hình */ }
  }

  /** Một lớp hơi/nhiễu qua bộ lọc quét — tiếng thở, xèo, vút, vỡ. */
  private on(o: TuyOn): void {
    const ctx = this.san()
    if (ctx === null || this.onTrang === null) return
    try {
      const t = ctx.currentTime + (o.tre ?? 0)
      const len = o.len ?? 0.008
      const het = t + len + o.giu + o.tat

      const n = ctx.createBufferSource()
      n.buffer = this.onTrang
      n.loop = true

      const f = ctx.createBiquadFilter()
      f.type = o.loc ?? 'bandpass'
      f.frequency.setValueAtTime(Math.max(30, o.f0), t)
      if (o.f1 !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.f1), het)
      f.Q.setValueAtTime(o.q ?? 1, t)

      const g = ctx.createGain()
      this.bao(g, t, o.to, len, o.giu, o.tat)

      n.connect(f)
      f.connect(g)
      g.connect(this.nen!)
      if ((o.vang ?? 0) > 0 && this.guiVang !== null) {
        const gv = ctx.createGain()
        gv.gain.setValueAtTime(o.vang ?? 0, t)
        g.connect(gv)
        gv.connect(this.guiVang)
      }
      n.start(t)
      n.stop(het + 0.02)
    } catch { /* như trên */ }
  }

  // ── CHƯỞNG ───────────────────────────────────────────────────────────────

  /** Chưởng thường: một tiếng vút gọn rồi chạm nhẹ. Không lấn chưởng nộ. */
  tanCong(): void {
    this.moKhoa()
    // Vút: nhiễu qua lọc dải quét lên rồi tụt.
    this.on({ to: 0.16, len: 0.03, giu: 0.05, tat: 0.14, loc: 'bandpass', f0: 620, f1: 2600, q: 1.5, vang: 0.1 })
    // Chạm: một cú gõ trầm ngắn cho có trọng lượng.
    this.giong({ tre: 0.1, dang: 'triangle', f0: 260, f1: 90, to: 0.2, giu: 0.02, tat: 0.14, vang: 0.12 })
  }

  /** Bị đánh: cú thụi đục, không chói. */
  trungDon(): void {
    this.moKhoa()
    this.giong({ dang: 'sine', f0: 190, f1: 62, to: 0.26, giu: 0.03, tat: 0.2, loc: 'lowpass', fLoc: 900, fLoc1: 220 })
    this.on({ to: 0.12, giu: 0.02, tat: 0.12, loc: 'lowpass', f0: 1800, f1: 260, q: 0.7, vang: 0.1 })
  }

  /**
   * CHƯỞNG CUỒNG NỘ — ba tầng, khớp đúng nhịp hình:
   *   0,00–0,45s  RÍT DÂNG, chạy song song lúc thần thú dồn lực
   *   0,45–0,95s  CÚ GIÁNG: hạ âm tụt sâu + vỡ dải rộng + chuông kim loại
   *   0,95–1,7s   ĐUÔI VANG rút dần
   */
  /**
   * SÁU TIẾNG CHƯỞNG TỐI THƯỢNG — mỗi hệ một tiếng, đúng sáu chiêu thầy chốt.
   *
   * Gọi kèm `kichNo()`: `kichNo` lo phần SỨC NẶNG chung (rít dâng, cú giáng hạ
   * âm, đuôi vang), còn hàm này lo phần CHẤT RIÊNG của từng chiêu. Tách hai
   * tầng vì nếu nhét hết vào một hàm thì sáu tiếng lại ra sáu biến thể của
   * cùng một tiếng nổ — đúng lỗi bản âm thanh đầu tiên.
   */
  chuongToiThuong(he: string): void {
    this.moKhoa()
    if (!this.bat) return
    const T = 0.45
    switch (he) {
      case 'khi':
        // ULTIMATE JADE BLAST — chùm tia bích ngọc: tiếng nạp rồi RÍT DÀI,
        // cao độ trượt lên như tia laze xuyên qua không khí.
        this.giong({ tre: T, dang: 'sawtooth', f0: 220, fGiua: 1650, f1: 1180, to: 0.3,
          len: 0.04, giu: 0.5, tat: 0.5, rung: 0.02, nhipRung: 30,
          loc: 'bandpass', fLoc: 1400, fLoc1: 3200, qLoc: 6, lech: 9, vang: 0.4 })
        this.on({ tre: T, to: 0.16, len: 0.05, giu: 0.42, tat: 0.4,
          loc: 'highpass', f0: 2000, f1: 8000, q: 0.8, vang: 0.5 })
        break
      case 'axit':
        // GALAXY CROWN LASER — tia từ sừng: một nốt cao TINH KHIẾT, gần như
        // sạch hẳn nhiễu, cộng hào quang ngân dài. Chất "ngân hà" nằm ở đuôi vang.
        this.giong({ tre: T, dang: 'sine', f0: 1320, f1: 1760, to: 0.26, len: 0.03,
          giu: 0.46, tat: 0.7, loc: 'bandpass', fLoc: 2400, qLoc: 9, lech: 5, vang: 0.75 })
        this.giong({ tre: T + 0.04, dang: 'sine', f0: 2640, to: 0.11, len: 0.02,
          giu: 0.3, tat: 0.62, vang: 0.8 })
        break
      case 'kiem':
        // CHRONO-CORE CANON ARRAY — SÁU phát pháo lệch nhịp, mỗi phát một cú
        // thụi trầm cộng tiếng kim loại. Đây là chỗ "dàn pháo" phải nghe ra.
        for (let i = 0; i < 6; i++) {
          const tre = T + i * 0.075
          this.giong({ tre, dang: 'sine', f0: 190 - i * 8, f1: 46, to: 0.34,
            len: 0.004, giu: 0.03, tat: 0.24 })
          this.on({ tre, to: 0.2, len: 0.003, giu: 0.015, tat: 0.2,
            loc: 'lowpass', f0: 5200, f1: 400, q: 0.9, vang: 0.4 })
          this.giong({ tre: tre + 0.01, dang: 'square', f0: 520 + i * 40, f1: 300, to: 0.07,
            giu: 0.02, tat: 0.2, loc: 'bandpass', fLoc: 2400, qLoc: 8, vang: 0.5 })
        }
        break
      case 'hoa':
        // SOLAR FLARE ERUPTION — bùng nổ hào quang: gầm trầm dày cộng lửa réo
        // dải rộng, không có cao độ rõ — đúng chất "một mảng lửa khổng lồ".
        this.giong({ tre: T, dang: 'sawtooth', f0: 88, fGiua: 140, f1: 62, to: 0.42,
          len: 0.05, giu: 0.5, tat: 0.6, rung: 0.06, nhipRung: 11,
          loc: 'lowpass', fLoc: 900, fLoc1: 260, qLoc: 3, lech: 16, vang: 0.45 })
        this.on({ tre: T, to: 0.34, len: 0.06, giu: 0.44, tat: 0.66,
          loc: 'bandpass', f0: 1500, f1: 400, q: 0.7, vang: 0.55 })
        for (let i = 0; i < 9; i++) {
          this.on({ tre: T + 0.05 + i * 0.07 + Math.random() * 0.03, to: 0.12,
            giu: 0.004, tat: 0.09, loc: 'bandpass', f0: 900 + Math.random() * 3200, q: 4, vang: 0.4 })
        }
        break
      case 'dien':
        // CHILLING FROST ROAR — TIẾNG GẦM trước, băng vỡ sau. Gầm dựng bằng
        // răng cưa trầm có rung mạnh; băng là chuỗi tiếng lách tách cao và khô.
        this.giong({ tre: T, dang: 'sawtooth', f0: 104, fGiua: 168, f1: 96, to: 0.44,
          len: 0.06, giu: 0.42, tat: 0.55, rung: 0.09, nhipRung: 17,
          loc: 'lowpass', fLoc: 780, fLoc1: 380, qLoc: 4, lech: 14, vang: 0.4 })
        this.giong({ tre: T + 0.02, dang: 'triangle', f0: 320, fGiua: 480, f1: 300, to: 0.16,
          len: 0.05, giu: 0.36, tat: 0.4, rung: 0.05, nhipRung: 9,
          loc: 'bandpass', fLoc: 1100, qLoc: 3, vang: 0.42 })
        for (let i = 0; i < 14; i++) {
          this.on({ tre: T + 0.12 + i * 0.045 + Math.random() * 0.02, to: 0.14,
            len: 0.001, giu: 0.001, tat: 0.05,
            loc: 'highpass', f0: 4200 + Math.random() * 5000, q: 2, vang: 0.5 })
        }
        break
      default:
        // BIOLUMINESCENT VORTEX BLAST — xoáy nước phát quang: tiếng ù trầm
        // quay tròn cộng ba lớp sủi. Rung nhịp chậm là cái tạo cảm giác XOÁY.
        this.giong({ tre: T, dang: 'sine', f0: 132, fGiua: 96, f1: 150, to: 0.4,
          len: 0.08, giu: 0.5, tat: 0.6, rung: 0.16, nhipRung: 5.5,
          loc: 'lowpass', fLoc: 620, qLoc: 2.4, lech: 12, vang: 0.5 })
        this.on({ tre: T, to: 0.24, len: 0.1, giu: 0.42, tat: 0.6,
          loc: 'bandpass', f0: 700, f1: 2600, q: 1.6, vang: 0.6 })
        for (let i = 0; i < 6; i++) {
          this.giong({ tre: T + 0.06 + i * 0.09, dang: 'sine', f0: 300 + i * 90,
            f1: (300 + i * 90) * 2.2, to: 0.14, len: 0.006, giu: 0.02, tat: 0.14,
            loc: 'bandpass', fLoc: 900 + i * 220, qLoc: 8, vang: 0.5 })
        }
        break
    }
  }

  kichNo(): void {
    this.moKhoa()
    const T = 0.45

    // ── Tầng 1: rít dâng ──
    this.giong({ dang: 'sawtooth', f0: 70, f1: 760, to: 0.1, len: 0.12, giu: 0.24, tat: 0.08,
      loc: 'lowpass', fLoc: 400, fLoc1: 4200, qLoc: 6, lech: 11, vang: 0.16 })
    this.on({ to: 0.075, len: 0.2, giu: 0.16, tat: 0.06, loc: 'highpass', f0: 300, f1: 5200, q: 0.8, vang: 0.2 })

    // ── Tầng 2: cú giáng ──
    // Hạ âm: đây là thứ làm cú nổ có "sức", nghe bằng lồng ngực chứ không bằng tai.
    this.giong({ tre: T, dang: 'sine', f0: 155, f1: 34, to: 0.62, len: 0.006, giu: 0.06, tat: 0.42 })
    // Vỡ: nhiễu dải rộng đóng nhanh từ sáng xuống tối.
    this.on({ tre: T, to: 0.4, len: 0.004, giu: 0.03, tat: 0.4, loc: 'lowpass', f0: 8200, f1: 260, q: 0.9, vang: 0.4 })
    // Kim loại: hai cao độ lệch quãng không chỉnh, nghe ra "va vào thứ cứng".
    this.giong({ tre: T + 0.008, dang: 'square', f0: 412, f1: 302, to: 0.14, giu: 0.03, tat: 0.3,
      loc: 'bandpass', fLoc: 2100, fLoc1: 780, qLoc: 7, vang: 0.45 })
    this.giong({ tre: T + 0.02, dang: 'square', f0: 631, f1: 466, to: 0.1, giu: 0.02, tat: 0.34,
      loc: 'bandpass', fLoc: 3000, fLoc1: 1100, qLoc: 9, vang: 0.5 })

    // ── Tầng 3: đuôi vang rút dần ──
    this.on({ tre: T + 0.09, to: 0.11, len: 0.05, giu: 0.1, tat: 0.72, loc: 'lowpass', f0: 1500, f1: 180, q: 0.6, vang: 0.75 })
  }

  // ── PHẢN HỒI HỌC TẬP ─────────────────────────────────────────────────────

  dungCauHoi(): void {
    this.moKhoa()
    // Ba nốt đi lên trong hợp âm trưởng, tiếng chuông mềm, có đuôi vang.
    const n = [659.26, 830.61, 987.77, 1318.5]
    n.forEach((f, i) => {
      this.giong({ tre: i * 0.075, dang: 'sine', f0: f, to: 0.15, giu: 0.04, tat: 0.42,
        loc: 'lowpass', fLoc: f * 3.2, qLoc: 0.8, lech: 6, vang: 0.34 })
    })
  }

  saiCauHoi(): void {
    this.moKhoa()
    // Hai nốt trượt xuống, giọng tròn có rung — nghe như "tiếc quá", không gắt.
    this.giong({ dang: 'triangle', f0: 392, fGiua: 330, f1: 262, to: 0.17, len: 0.03, giu: 0.1, tat: 0.34,
      rung: 0.012, nhipRung: 5.5, loc: 'lowpass', fLoc: 1500, fLoc1: 700, qLoc: 1.2, vang: 0.22 })
  }

  thangTran(): void {
    this.moKhoa()
    const n = [523.25, 659.26, 783.99, 1046.5, 1318.5]
    n.forEach((f, i) => {
      this.giong({ tre: i * 0.085, dang: 'triangle', f0: f, to: 0.17, giu: 0.06, tat: 0.4,
        loc: 'lowpass', fLoc: f * 3, qLoc: 1, lech: 8, vang: 0.4 })
    })
    this.giong({ tre: 0.34, dang: 'sine', f0: 130.8, to: 0.22, giu: 0.14, tat: 0.5, vang: 0.2 })
  }

  tienHoa(): void {
    this.moKhoa()
    // Thang lấp lánh dâng lên, mỗi nốt thêm một tầng bồi cao — cảm giác "lên đời".
    const n = [392, 440, 493.9, 523.3, 587.3, 659.3, 784, 880, 1046.5]
    n.forEach((f, i) => {
      this.giong({ tre: i * 0.055, dang: 'sine', f0: f, to: 0.12, giu: 0.03, tat: 0.34,
        loc: 'bandpass', fLoc: f * 1.6, qLoc: 2.4, vang: 0.4 })
      this.giong({ tre: i * 0.055 + 0.01, dang: 'sine', f0: f * 2, to: 0.05, giu: 0.02, tat: 0.24, vang: 0.5 })
    })
    this.on({ tre: 0.1, to: 0.05, len: 0.3, giu: 0.05, tat: 0.4, loc: 'highpass', f0: 2200, f1: 9000, q: 0.7, vang: 0.6 })
  }

  // ── TIẾNG KÊU: SÁU HỆ SÁU GIỌNG ──────────────────────────────────────────

  /**
   * Chạm vào thú là nó kêu. Mỗi tiếng là ba đến bốn lớp chồng nhau, vì một
   * lớp đơn thì dù chỉnh kiểu sóng gì cũng vẫn ra tiếng máy.
   */
  keu(he: string): void {
    this.moKhoa()
    if (!this.bat) return
    switch (he) {
      case 'hoa': return this.keuHoa()
      case 'axit': return this.keuAcid()
      case 'kiem': return this.keuBase()
      case 'khi': return this.keuKhi()
      case 'dien': return this.keuDien()
      case 'huuco': return this.keuHuuCo()
      default: return this.keuHuuCo()
    }
  }

  /** HOẢ — gừ ấm dâng lên, kèm than lách tách. */
  private keuHoa(): void {
    this.giong({ dang: 'sawtooth', f0: 116, fGiua: 205, f1: 168, to: 0.2, len: 0.05, giu: 0.12, tat: 0.3,
      rung: 0.05, nhipRung: 15, loc: 'lowpass', fLoc: 620, fLoc1: 1500, qLoc: 4.5, lech: 14, vang: 0.22 })
    // Lớp giọng trên cho ra chất "thú con" chứ không thành tiếng máy nổ.
    this.giong({ tre: 0.05, dang: 'triangle', f0: 350, fGiua: 520, f1: 400, to: 0.1, len: 0.04, giu: 0.09, tat: 0.24,
      rung: 0.03, nhipRung: 7, loc: 'bandpass', fLoc: 900, fLoc1: 1400, qLoc: 3, vang: 0.26 })
    // Than nổ lách tách.
    for (let i = 0; i < 5; i++) {
      this.on({ tre: 0.04 + i * 0.062 + Math.random() * 0.02, to: 0.05 + Math.random() * 0.04,
        giu: 0.002, tat: 0.05, loc: 'bandpass', f0: 1800 + Math.random() * 2600, q: 5, vang: 0.3 })
    }
  }

  /** ACID — ba tiếng sủi "blop" tụt dần, nền xèo ăn mòn. */
  private keuAcid(): void {
    const cao = [520, 400, 300]
    cao.forEach((f, i) => {
      // "Blop" là một cú trượt cao độ rất nhanh trong hốc cộng hưởng nhọn.
      this.giong({ tre: i * 0.115, dang: 'sine', f0: f * 0.55, f1: f * 1.9, to: 0.34, len: 0.008, giu: 0.03, tat: 0.16,
        loc: 'bandpass', fLoc: f * 1.5, qLoc: 8, vang: 0.28 })
    })
    this.on({ to: 0.055, len: 0.05, giu: 0.16, tat: 0.26, loc: 'bandpass', f0: 3400, f1: 1500, q: 1.1, vang: 0.3 })
    this.giong({ tre: 0.3, dang: 'triangle', f0: 250, f1: 175, to: 0.2, len: 0.03, giu: 0.08, tat: 0.28,
      rung: 0.03, nhipRung: 6, loc: 'lowpass', fLoc: 900, qLoc: 1.4, lech: 8, vang: 0.24 })
  }

  /** BASE — chuông tinh thể điều biến tần số, đuôi ngân dài lấp lánh. */
  private keuBase(): void {
    // Chuông thật = một sóng mang bị một sóng khác lái cao độ theo tỉ lệ không nguyên.
    const goc = 880
    this.giong({ dang: 'sine', f0: goc, to: 0.2, len: 0.004, giu: 0.02, tat: 0.85,
      loc: 'bandpass', fLoc: goc * 1.2, qLoc: 1.6, vang: 0.5 })
    this.giong({ dang: 'sine', f0: goc * 2.76, to: 0.075, len: 0.003, giu: 0.01, tat: 0.55, vang: 0.55 })
    this.giong({ dang: 'sine', f0: goc * 5.4, to: 0.03, len: 0.003, giu: 0.006, tat: 0.34, vang: 0.6 })
    // Nốt thứ hai cao hơn một quãng năm: hai tinh thể chạm nhau.
    this.giong({ tre: 0.14, dang: 'sine', f0: goc * 1.5, to: 0.15, len: 0.004, giu: 0.02, tat: 0.75,
      loc: 'bandpass', fLoc: goc * 1.8, qLoc: 1.6, vang: 0.55 })
    this.giong({ tre: 0.14, dang: 'sine', f0: goc * 1.5 * 2.76, to: 0.055, len: 0.003, giu: 0.01, tat: 0.5, vang: 0.6 })
  }

  /** KHÍ — luồng hơi thoát qua khe hẹp rồi vút lên, tiếng huýt dễ thương. */
  private keuKhi(): void {
    this.on({ to: 0.24, len: 0.07, giu: 0.06, tat: 0.22, loc: 'bandpass', f0: 900, f1: 4200, q: 2.4, vang: 0.34 })
    // Tiếng huýt: sóng sin nhọn, trượt lên rồi hạ, rung nhẹ cho ra hơi người thổi.
    this.giong({ tre: 0.03, dang: 'sine', f0: 900, fGiua: 1750, f1: 1380, to: 0.24, len: 0.05, giu: 0.1, tat: 0.26,
      rung: 0.02, nhipRung: 9, loc: 'bandpass', fLoc: 1700, fLoc1: 2400, qLoc: 5, vang: 0.4 })
    this.on({ tre: 0.22, to: 0.06, len: 0.04, giu: 0.04, tat: 0.24, loc: 'highpass', f0: 2600, f1: 7000, q: 0.8, vang: 0.4 })
  }

  /** ĐIỆN HOÁ — tách tách tia lửa rồi một tiếng chíp giật. */
  private keuDien(): void {
    for (let i = 0; i < 10; i++) {
      this.on({ tre: i * 0.024 + Math.random() * 0.012, to: 0.16 + Math.random() * 0.1,
        len: 0.001, giu: 0.0015, tat: 0.032, loc: 'highpass', f0: 3200 + Math.random() * 4200, q: 1.2, vang: 0.26 })
    }
    // Chíp giật: trượt lên rất nhanh, hốc cộng hưởng nhọn.
    this.giong({ tre: 0.13, dang: 'square', f0: 620, f1: 1560, to: 0.19, len: 0.006, giu: 0.05, tat: 0.16,
      loc: 'bandpass', fLoc: 1500, fLoc1: 2600, qLoc: 9, vang: 0.28 })
    this.giong({ tre: 0.22, dang: 'triangle', f0: 1180, f1: 700, to: 0.22, len: 0.01, giu: 0.07, tat: 0.3,
      rung: 0.05, nhipRung: 22, loc: 'bandpass', fLoc: 1900, qLoc: 4, vang: 0.34 })
    // Thân giọng trầm: thiếu lớp này thì tiếng điện chỉ còn lạo xạo, không ra
    // tiếng CON gì cả — đo được rms 0,008, mỏng hơn năm hệ kia ba bốn lần.
    this.giong({ tre: 0.14, dang: 'triangle', f0: 330, fGiua: 470, f1: 380, to: 0.085, len: 0.02, giu: 0.07, tat: 0.24,
      rung: 0.025, nhipRung: 7, loc: 'lowpass', fLoc: 1300, qLoc: 2, lech: 10, vang: 0.24 })
  }

  /** HỮU CƠ — ba nốt tròn nảy như chuỗi carbon bật lò xo. */
  private keuHuuCo(): void {
    const n = [466.2, 587.3, 698.5]
    n.forEach((f, i) => {
      this.giong({ tre: i * 0.085, dang: 'triangle', f0: f * 0.9, f1: f, to: 0.15, len: 0.012, giu: 0.04, tat: 0.24,
        rung: 0.018, nhipRung: 8, loc: 'lowpass', fLoc: f * 3.4, qLoc: 2.2, lech: 9, vang: 0.3 })
    })
    // Cái nảy cuối: cao độ vồng lên rồi rơi, nghe như lò xo bật.
    this.giong({ tre: 0.25, dang: 'sine', f0: 698.5, fGiua: 1050, f1: 620, to: 0.1, len: 0.02, giu: 0.05, tat: 0.3,
      rung: 0.03, nhipRung: 6.5, loc: 'bandpass', fLoc: 1200, qLoc: 3, vang: 0.4 })
  }
}
