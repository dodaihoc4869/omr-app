// BI-A · BỘ ĐIỀU KHIỂN CHẠM + THANH LỰC + BÁNH XE + HÀNG CHẤM (thầy chốt bản vẽ "Bàn Bi-a mới" 30/09).
// Máy yếu: mọi xử lý chạm chạy NGOÀI React state — sự kiện con trỏ chỉ ghi vị trí mới nhất vào đối tượng dùng lại (không cấp phát mỗi
// pointermove); vòng khung hình của màn chơi gọi `khung()` MỘT lần mỗi khung để áp vào ván và ghi DOM (biến CSS, transform) khi số đổi.
// Có pointer capture; `touch-action: none` trên bàn / thanh lực / bánh xe (bi-a.css).
import { useEffect, useState } from 'react'
import { toaDoBan, type KhungBan } from './bo-cuc'
import { DO_MOI_PX, KeoXoay, LUC_HUY, doChamBanhXe, doLanChuot, gocCua, lucThat, vachDuToi, viTriTrenThanh } from './dieu-khien-cham'
import type { VanBia } from './dieu-khien'
import { banKinhBatBiCai } from './gay'
import { KHO_BIET_VACH, KHO_DO_NHAY, KHO_HUONG_DAN, KHO_TAY } from './cai-dat-bia'
import { HE_NHAY } from './dieu-khien-cham'
import { NHOM, type KiHieu } from './nguyen-to'
import { R } from './vat-ly'

/** Sự kiện con trỏ tối thiểu (React hoặc gốc). */
export interface SuKienTro { clientX: number; clientY: number; pointerId: number; pointerType?: string; currentTarget: EventTarget | null; preventDefault(): void }
export interface MoiTruongDk {
  v: VanBia
  khung(): KhungBan | null
  canvas(): HTMLCanvasElement | null
  mo(): void
  datKeo(co: boolean): void
  chiDich(): void
  chiBi(id: KiHieu, ms: number): void
  giaiTruoc(id: KiHieu): void
  datBiXong(): void
}
const bay = (e: SuKienTro) => { try { (e.currentTarget as Element | null)?.setPointerCapture?.(e.pointerId) } catch { /* trình duyệt cũ */ } }
const gio = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** Bi (không phải bi cái) dưới điểm bàn `p`, vùng bắt R + 6. */
export function biTai(v: VanBia, x: number, y: number): KiHieu | null {
  let best: KiHieu | null = null, bd = (R + 6) * (R + 6)
  for (const b of v.st.balls) { if (!b.on || b.id === 'cue') continue; const d = (b.x - x) ** 2 + (b.y - y) ** 2; if (d < bd) { bd = d; best = b.id } }
  return best
}

export class BoDieuKhien {
  private readonly m: MoiTruongDk
  private readonly xoay = new KeoXoay()
  /** Lần chạm bàn đang giữ: xoay gậy, kéo bi cái, hay chạm bi của em trong lượt người khác (giải trước). */
  private ban: { id: number; loai: 'xoay' | 'bi' | 'cham'; left: number; top: number; f: number; bi: KiHieu | null; t0: number; x0: number; y0: number; xa: number } | null = null
  private readonly choBan = { co: false, x: 0, y: 0, t: 0 }
  private luc: { id: number; y0: number; L: number } | null = null
  private readonly choLuc = { co: false, y: 0 }
  private space: number | null = null
  /** Vị trí ngón trên thanh lực (0 đầu thanh … 1 cuối); < LUC_HUY là vùng Huỷ. */
  p = 0
  private xe: { id: number; doc: boolean; v0: number; last: number; t0: number; xa: number; r0: number; dai: number; tong: number } | null = null
  private readonly choXe = { co: false, v: 0 }
  private lechXe = 0
  /** Vạch "đủ tới bi" (vị trí trên thanh) hoặc null. */
  vach: number | null = null
  private vachKhoa = { ax: NaN, ay: NaN, cx: NaN, cy: NaN, pb: -1, dang: false }
  // DOM (gắn qua ref của ThanhLuc / BanhXe)
  elLuc: HTMLDivElement | null = null
  elSo: HTMLSpanElement | null = null
  elVan: HTMLDivElement | null = null
  private ghi = { p: -1, dang: false, huy: false, qua: false, vach: -2, so: -1, lech: NaN }
  constructor(m: MoiTruongDk) { this.m = m }

  /** Ngón đang ở vùng Huỷ của thanh lực (gậy trên bàn mờ đi). */
  trongHuy(): boolean { return (this.luc !== null || this.space !== null) && this.p < LUC_HUY }
  dangKeoBi(): boolean { return this.ban?.loai === 'bi' }

  // ───────────── trên bàn ─────────────
  banDown(e: SuKienTro): void {
    const m = this.m, v = m.v, k = m.khung(), cv = m.canvas()
    m.mo()
    if (!k || !cv || this.ban) return
    const r = cv.getBoundingClientRect(), f = r.width ? cv.clientWidth / r.width : 1
    const lx = (e.clientX - r.left) * f, ly = (e.clientY - r.top) * f, p = toaDoBan(k, lx, ly), b = biTai(v, p.x, p.y), t = gio()
    if (b) m.chiBi(b, 1800)
    let loai: 'xoay' | 'bi' | 'cham'
    if (!v.nguoiDuocDanh()) {
      // Lượt người khác: chạm bi CỦA EM trên bàn ⇒ giải trước (thay ô "Bi của em" cũ).
      if (!b || !v.coTheGiaiTruoc() || v.bi[b].chu !== v.em) return
      loai = 'cham'
    } else {
      const c = v.bi_('cue')
      if (v.ballInHand && Math.hypot(p.x - c.x, p.y - c.y) < banKinhBatBiCai(k.S)) loai = 'bi'
      else { loai = 'xoay'; this.xoay.bat(t, lx, ly, p, c, gocCua(v.aim)) }
    }
    this.ban = { id: e.pointerId, loai, left: r.left, top: r.top, f, bi: b, t0: t, x0: lx, y0: ly, xa: 0 }
    this.choBan.co = false
    if (loai !== 'cham') m.datKeo(true)
    bay(e); e.preventDefault()
  }
  /** Trả true nếu sự kiện thuộc lần kéo đang giữ (màn chơi bỏ phần "di chuột chỉ bi"). */
  banMove(e: SuKienTro): boolean {
    const b = this.ban
    if (!b || e.pointerId !== b.id) return false
    const x = (e.clientX - b.left) * b.f, y = (e.clientY - b.top) * b.f
    const d = Math.hypot(x - b.x0, y - b.y0); if (d > b.xa) b.xa = d
    this.choBan.co = true; this.choBan.x = x; this.choBan.y = y; this.choBan.t = gio()
    return true
  }
  private apBan(): void {
    const c0 = this.choBan, b = this.ban
    if (!c0.co || !b) return
    c0.co = false
    const m = this.m, v = m.v, k = m.khung()
    if (!k || !v.nguoiDuocDanh()) return
    const p = toaDoBan(k, c0.x, c0.y)
    if (b.loai === 'bi') { v.keoBiCai(p.x, p.y); return }
    if (b.loai !== 'xoay') return
    const g = this.xoay.keo(c0.t, c0.x, c0.y, p, v.bi_('cue'), gocCua(v.aim), HE_NHAY[KHO_DO_NHAY.doc()])
    if (g !== null) { v.datHuong({ x: Math.cos(g), y: Math.sin(g) }); m.chiDich() }
  }
  banUp(e: SuKienTro | null, huy = false): void {
    const b = this.ban
    if (!b || (e && e.pointerId !== b.id)) return
    this.apBan()
    const m = this.m, v = m.v, t = gio()
    this.ban = null
    if (b.loai === 'xoay') {
      const kq = this.xoay.nha(t)
      if (v.nguoiDuocDanh()) {
        v.datHuong({ x: Math.cos(kq.goc), y: Math.sin(kq.goc) })
        if (kq.chamNhanh && b.bi && !huy) { const o = v.bi_(b.bi); v.nhamToi({ x: o.x, y: o.y }); m.chiDich() } // chạm nhanh vào bi ⇒ gậy chĩa TÂM bi đó
      }
    } else if (b.loai === 'bi') m.datBiXong()
    else if (b.loai === 'cham' && !huy && b.bi && t - b.t0 <= 600 && b.xa <= 8) m.giaiTruoc(b.bi)
    if (b.loai !== 'cham') m.datKeo(false)
  }
  /** Lăn chuột trên bàn (máy tính): tinh chỉnh 0,1° mỗi nấc, Shift 0,02°. */
  banLan(e: WheelEvent): void {
    const v = this.m.v
    if (!v.nguoiDuocDanh()) return
    e.preventDefault()
    const d = e.deltaY || e.deltaX
    if (!d) return
    const nac = e.deltaMode === 1 ? d / 3 : e.deltaMode === 2 ? d : d / 100
    v.xoayNham(doLanChuot(Math.max(-5, Math.min(5, nac)), e.shiftKey)); this.m.chiDich()
  }

  // ───────────── thanh lực ─────────────
  lucDown(e: SuKienTro): void {
    const m = this.m, v = m.v
    m.mo()
    if (!v.nguoiDuocDanh() || this.luc || this.ban?.loai === 'bi') return // đang kéo bi cái ⇒ thanh lực không nhận
    const el = e.currentTarget as HTMLElement | null, h = el?.getBoundingClientRect().height || 200
    this.luc = { id: e.pointerId, y0: e.clientY, L: Math.max(40, h * 0.9) }
    this.p = 0; this.choLuc.co = false
    m.datKeo(true); bay(e); e.preventDefault()
  }
  lucMove(e: SuKienTro): void { if (this.luc && e.pointerId === this.luc.id) { this.choLuc.co = true; this.choLuc.y = e.clientY } }
  private apLuc(): void {
    if (!this.luc || !this.choLuc.co) return
    this.choLuc.co = false
    this.p = Math.max(0, Math.min(1, (this.choLuc.y - this.luc.y0) / this.luc.L))
    this.m.v.datLuc(lucThat(this.p))
  }
  /** Thả thanh lực: ngoài vùng Huỷ ⇒ đánh; trong vùng Huỷ (hoặc huỷ con trỏ) ⇒ không đánh, góc giữ nguyên. */
  lucUp(e: SuKienTro | null, huy = false): void {
    if (!this.luc || (e && e.pointerId !== this.luc.id)) return
    this.apLuc()
    const p = this.p, v = this.m.v
    this.luc = null; this.p = 0
    this.m.datKeo(false)
    this.tha(p, huy)
    v.datLuc(0)
  }
  private tha(p: number, huy: boolean): void {
    const v = this.m.v
    if (huy || p < LUC_HUY || !v.nguoiDuocDanh()) return
    v.datLuc(lucThat(p))
    if (v.ban() && this.vach !== null) KHO_BIET_VACH.dat('1')
  }
  /** Giữ Space (máy tính): lực tăng dần 1,4 giây; thả ⇒ như thả thanh lực. */
  spaceDown(): void { if (this.space === null && this.m.v.nguoiDuocDanh()) { this.space = gio(); this.p = 0 } }
  spaceUp(): void { if (this.space === null) return; const p = this.p; this.space = null; this.p = 0; this.tha(p, false); this.m.v.datLuc(0) }

  // ───────────── bánh xe tinh chỉnh ─────────────
  xeDown(e: SuKienTro, doc: boolean): void {
    const m = this.m
    m.mo()
    if (!m.v.nguoiDuocDanh() || this.xe) return
    const el = e.currentTarget as HTMLElement | null, r = el?.getBoundingClientRect()
    const v0 = doc ? e.clientX : e.clientY
    this.xe = { id: e.pointerId, doc, v0, last: v0, t0: gio(), xa: 0, r0: r ? (doc ? r.left : r.top) : 0, dai: r ? (doc ? r.width : r.height) : 1, tong: 0 }
    this.choXe.co = false
    bay(e); e.preventDefault()
  }
  xeMove(e: SuKienTro): void { const x = this.xe; if (x && e.pointerId === x.id) { this.choXe.co = true; this.choXe.v = x.doc ? e.clientX : e.clientY } }
  private apXe(): void {
    const x = this.xe
    if (!x || !this.choXe.co) return
    this.choXe.co = false
    const val = this.choXe.v, d = val - x.last
    x.last = val; x.xa = Math.max(x.xa, Math.abs(val - x.v0))
    if (!d || !this.m.v.nguoiDuocDanh()) return
    const deg = d * DO_MOI_PX
    this.m.v.xoayNham(deg); x.tong += deg; this.lechXe += d; this.m.chiDich()
  }
  xeUp(e: SuKienTro | null): void {
    const x = this.xe
    if (!x || (e && e.pointerId !== x.id)) return
    this.apXe()
    this.xe = null
    const v = this.m.v
    if (e && gio() - x.t0 <= 200 && x.xa <= 6 && v.nguoiDuocDanh()) {
      const deg = doChamBanhXe(x.dai ? (x.v0 - x.r0) / x.dai : 0.5)
      if (deg) { v.xoayNham(deg - x.tong); this.m.chiDich() } // chạm nhanh: đúng ± 0,1° (bỏ phần nhích lỡ tay)
    }
  }

  // ───────────── mỗi khung hình ─────────────
  /** Áp mọi thao tác đang chờ vào ván và ghi DOM thanh lực / bánh xe (chỉ khi số đổi). */
  khung(now: number): void {
    const v = this.m.v
    this.apBan(); this.apXe()
    if (this.space !== null) { if (v.pha === 'aim') { this.p = Math.min(1, (now - this.space) / 1400); v.datLuc(lucThat(this.p)) } }
    else this.apLuc()
    // vạch vàng: chỉ tính lại khi hướng / bi cái / trạng thái ván đổi
    const nguoi = v.nguoiDuocDanh(), c = v.bi_('cue'), kh = this.vachKhoa
    if (nguoi !== kh.dang || v.aim.x !== kh.ax || v.aim.y !== kh.ay || c.x !== kh.cx || c.y !== kh.cy || v.phienBan !== kh.pb) {
      kh.dang = nguoi; kh.ax = v.aim.x; kh.ay = v.aim.y; kh.cx = c.x; kh.cy = c.y; kh.pb = v.phienBan
      const l = nguoi && c.on ? vachDuToi(v.st, v.aim, (id) => v.hopLe(id as KiHieu)) : null
      this.vach = l === null ? null : viTriTrenThanh(l)
    }
    this.veDom()
  }
  private veDom(): void {
    const el = this.elLuc, g = this.ghi
    if (el) {
      const dang = this.luc !== null || this.space !== null, p = dang ? Math.round(this.p * 1000) / 1000 : 0
      if (p !== g.p) { g.p = p; el.style.setProperty('--p', String(p)) }
      if (dang !== g.dang) { g.dang = dang; el.toggleAttribute('data-dang', dang) }
      const huy = dang && p < LUC_HUY
      if (huy !== g.huy) { g.huy = huy; el.toggleAttribute('data-huy', huy) }
      const vach = this.vach === null ? -1 : Math.round(this.vach * 1000) / 1000
      if (vach !== g.vach) { g.vach = vach; if (vach < 0) el.removeAttribute('data-vach'); else { el.setAttribute('data-vach', ''); el.style.setProperty('--vach', String(vach)) } }
      const qua = dang && vach >= 0 && p >= vach
      if (qua !== g.qua) { g.qua = qua; el.toggleAttribute('data-qua', qua) }
      const so = huy ? -2 : Math.round(lucThat(p) * 100)
      if (so !== g.so) {
        g.so = so
        if (this.elSo) this.elSo.textContent = huy ? 'Huỷ' : `${so}%`
        el.setAttribute('aria-valuenow', String(Math.max(0, so)))
      }
    }
    const van = this.elVan
    if (van && this.lechXe !== g.lech) { g.lech = this.lechXe; const d = ((this.lechXe % 13) + 13) % 13; van.style.transform = van.dataset.doc ? `translate3d(${d}px,0,0)` : `translate3d(0,${d}px,0)` }
  }
}

// ───────────── thanh lực (dọc ở mọi bố cục) ─────────────
export function ThanhLuc({ dk, tat }: { dk: BoDieuKhien; tat: boolean }) {
  const biet = KHO_BIET_VACH.use() === '1'
  return (
    <div className="bia-luc" ref={(el) => { dk.elLuc = el }} role="slider" tabIndex={-1} aria-orientation="vertical" aria-label="Lực đánh: kéo xuống rồi thả tay để đánh, kéo về Huỷ rồi thả để thôi"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-disabled={tat || undefined} data-tat={tat ? '' : undefined}
      onPointerDown={(e) => dk.lucDown(e)} onPointerMove={(e) => dk.lucMove(e)} onPointerUp={(e) => dk.lucUp(e)} onPointerCancel={(e) => dk.lucUp(e, true)} onLostPointerCapture={(e) => dk.lucUp(e, true)}>
      <div className="huy" aria-hidden="true">Huỷ</div>
      <div className="day" aria-hidden="true" />
      <div className="vach" aria-hidden="true">{!biet && <span>đủ tới bi</span>}</div>
      <div className="truot" aria-hidden="true"><div className="num-luc"><span ref={(el) => { dk.elSo = el }}>0%</span></div><div className="nut-keo" /></div>
    </div>
  )
}

// ───────────── bánh xe tinh chỉnh ─────────────
export function BanhXe({ dk, doc, tat }: { dk: BoDieuKhien; doc: boolean; tat: boolean }) {
  return (
    <div className="bia-banh-xe" data-doc={doc ? '' : undefined} data-tat={tat ? '' : undefined} role="group" aria-label="Bánh xe chỉnh nhỏ hướng gậy: kéo để nhích từng chút, chạm hai đầu để nhích một nấc"
      onPointerDown={(e) => dk.xeDown(e, doc)} onPointerMove={(e) => dk.xeMove(e)} onPointerUp={(e) => dk.xeUp(e)} onPointerCancel={() => dk.xeUp(null)}>
      <div className="van" data-doc={doc ? '1' : undefined} ref={(el) => { dk.elVan = el }} aria-hidden="true" />
      <span className="bia-ten-banh" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M9.96,4.89 L10.32,2.45 L13.68,2.45 L14.04,4.89 L15.59,5.53 L17.56,4.05 L19.95,6.44 L18.47,8.41 L19.11,9.96 L21.55,10.32 L21.55,13.68 L19.11,14.04 L18.47,15.59 L19.95,17.56 L17.56,19.95 L15.59,18.47 L14.04,19.11 L13.68,21.55 L10.32,21.55 L9.96,19.11 L8.41,18.47 L6.44,19.95 L4.05,17.56 L5.53,15.59 L4.89,14.04 L2.45,13.68 L2.45,10.32 L4.89,9.96 L5.53,8.41 L4.05,6.44 L6.44,4.05 L8.41,5.53 Z" /><circle cx="12" cy="12" r="2.7" /></svg></span>
      <div className="mui" aria-hidden="true">{doc ? '‹' : '˄'}</div>
      <div className="mui sau" aria-hidden="true">{doc ? '›' : '˅'}</div>
    </div>
  )
}

// ───────────── hàng chấm: bi còn lại của em (trái) và đối thủ (phải) ─────────────
export function HangCham({ v, tenTrai, tenPhai }: { v: VanBia; tenTrai: string; tenPhai: string }) {
  const doiEm = v.ghe[v.em]!.doi, doiKia = (1 - doiEm) as 0 | 1
  const dang = v.pha !== 'over' ? v.ghe[v.cur]!.doi : -1
  const hang = (doi: 0 | 1, kieu: 'ta' | 'dich') => (
    <span className="bia-cham" aria-label={`${doi === doiEm ? 'Phe em' : 'Phe đối thủ'} còn ${v.conLai(doi)} bi`}>
      {NHOM[doi]!.map((id) => { const s = v.bi[id]; return <i key={id} data-kieu={kieu} data-an={s.an ? '' : undefined} data-vang={s.vang && !s.an ? '' : undefined} /> })}
    </span>
  )
  return (
    <section className="bia-thanh-tren" aria-label="Hai phe">
      <span className="bia-ben" data-dang={dang === doiEm ? '' : undefined}><span className="bia-ben-ten">{tenTrai}</span>{hang(doiEm, 'ta')}</span>
      <span className="bia-ti-so" aria-label={`Điểm ván: phe em ${v.diem[doiEm]}, phe đối thủ ${v.diem[doiKia]}`}><b>{v.diem[doiEm]} : {v.diem[doiKia]}</b><span className="bia-dong-ho" hidden /></span>
      <span className="bia-ben" data-phai="" data-dang={dang === doiKia ? '' : undefined}>{hang(doiKia, 'dich')}<span className="bia-ben-ten">{tenPhai}</span></span>
    </section>
  )
}

// ───────────── tuỳ chỉnh (độ nhạy, tay cầm, âm thanh, toàn màn hình, hướng dẫn) ─────────────
export function NutChon<T extends string>({ nhan, gia, chon, dat }: { nhan: string; gia: T; chon: readonly (readonly [T, string])[]; dat: (x: T) => void }) {
  return (
    <div className="bia-chon" role="group" aria-label={nhan}>
      <span className="bia-chon-nhan">{nhan}</span>
      <span className="bia-chon-nut">{chon.map(([k, ten]) => <button key={k} type="button" aria-pressed={gia === k} onClick={() => dat(k)}>{ten}</button>)}</span>
    </div>
  )
}
export function CaiDatDieuKhien() {
  const doNhay = KHO_DO_NHAY.use(), tay = KHO_TAY.use()
  return <>
    <NutChon nhan="Xoay gậy" gia={doNhay} chon={[['thuong', 'Thường'], ['cham', 'Chậm']] as const} dat={KHO_DO_NHAY.dat} />
    <NutChon nhan="Tay cầm" gia={tay} chon={[['phai', 'Phải'], ['trai', 'Trái']] as const} dat={KHO_TAY.dat} />
  </>
}

// ───────────── hướng dẫn lần đầu: 3 bước, ngón minh hoạ bằng CSS ─────────────
const BUOC = [
  { t: 'Kéo trên bàn để xoay gậy', s: 'Ngón đặt đâu cũng được. Kéo xa bi cái thì xoay chậm, ngắm kỹ hơn.', sel: '.bia-ban canvas', lop: 'v' },
  { t: 'Kéo bánh xe để chỉnh nhỏ', s: 'Mỗi lần kéo nhích từng chút. Chạm hai đầu để nhích một nấc.', sel: '.bia-banh-xe', lop: 'x' },
  { t: 'Kéo thanh lực xuống rồi thả để đánh', s: 'Kéo quá vạch vàng là đủ lực tới bi. Kéo về chữ Huỷ rồi thả là thôi, góc giữ nguyên.', sel: '.bia-luc', lop: 'y' },
] as const
export function HuongDan({ goc, onXong }: { goc: HTMLElement | null; onXong: () => void }) {
  const [i, setI] = useState(0)
  const [vt, setVt] = useState<{ x: number; y: number; tren: boolean } | null>(null)
  const b = BUOC[i]!
  useEffect(() => {
    const el = goc?.querySelector<HTMLElement>(b.sel), r0 = goc?.getBoundingClientRect()
    if (el && r0) { const r = el.getBoundingClientRect(); const y = r.top + r.height / 2 - r0.top; setVt({ x: r.left + r.width / 2 - r0.left, y: b.lop === 'y' ? y - Math.min(60, r.height / 3) : y, tren: y > r0.height / 2 }) }
    else setVt(null)
    const h = setTimeout(() => { if (i < BUOC.length - 1) setI(i + 1); else onXong() }, 3500)
    return () => clearTimeout(h)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  const tiep = () => { if (i < BUOC.length - 1) setI(i + 1); else onXong() }
  const doc = b.lop === 'x' && !!goc?.querySelector('.bia-banh-xe[data-doc]')
  return (
    <div className="bia-huong-dan" role="dialog" aria-modal="true" aria-label="Hướng dẫn điều khiển" onClick={tiep}>
      {vt && <div className="ngon" data-lop={b.lop === 'x' && !doc ? 'y' : b.lop} style={{ left: vt.x, top: vt.y }} aria-hidden="true" />}
      <div className="the" data-tren={vt?.tren ? '' : undefined}>
        <span className="buoc">Bước {i + 1}/3 · chạm để qua</span>
        <b>{b.t}</b>
        <span>{b.s}</span>
        <span className="hang">
          <button type="button" className="bia-nut-xanh" onClick={(e) => { e.stopPropagation(); tiep() }}>{i < BUOC.length - 1 ? 'Tiếp' : 'Chơi thử'}</button>
          {i < BUOC.length - 1 && <button type="button" className="bia-nut-chu" onClick={(e) => { e.stopPropagation(); onXong() }}>Bỏ qua</button>}
        </span>
      </div>
    </div>
  )
}
export const daXemHuongDan = (): boolean => KHO_HUONG_DAN.doc() === '1'
export const ghiDaXemHuongDan = (): void => KHO_HUONG_DAN.dat('1')
