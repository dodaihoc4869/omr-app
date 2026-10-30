// ĐÈN PHA CỦA GIÁM THỊ ở màn kiểm tra kiểu Duo (thầy 30/10: «giám thị soi đèn pha vào đáp án học sinh bấm với hiệu ứng mịn đẹp xịn»; đặc tả
// docs/dac-ta-kiem-tra-duo-3010.md mục 2–5). THUẦN TRÌNH BÀY: chỉ soi ô em VỪA CHẠM trên máy em — không biết, không cần đáp án nào.
//
// Ba phần tử trong MỘT lớp phủ (`.kt-den`, absolute phủ khối câu, `contain: strict`, không nhận chạm):
//   · `.kt-den-tia`  — tia sáng hình nêm (conic-gradient vẽ MỘT lần thành ảnh lớp) — đặt bằng transform: dời tới kính đèn, xoay về ô, kéo dài đúng tầm;
//   · `.kt-den-vung` — vũng sáng bầu dục phủ ô được soi (radial-gradient 100×100, phóng theo cỡ ô bằng transform);
//   · `.kt-den-goc`  — quầng sáng ở kính đèn.
// CHỈ transform + opacity (Web Animations ⇒ chạy trên luồng vẽ, không tính lại bố cục / không vẽ lại). Toạ độ do người gọi đo SAU khung đầu của cú chạm.
// Bản ĐẦY ĐỦ: tia vươn từ đèn tới ô (260 ms), vũng sáng nở trên ô; chạm ô khác khi đèn còn sáng ⇒ tia QUÉT sang ô mới, vũng sáng trượt theo.
// Bản GỌN (máy yếu `html.may-yeu` / em xin giảm chuyển động): KHÔNG bỏ hiệu ứng (thầy 30/10 «Không được bỏ hiệu ứng») — tia + vũng + quầng hiện tại chỗ
// bằng opacity (120 ms), không vươn / không quét. Sáng ~1,1 s sau lần chạm cuối rồi tắt dần; `will-change` chỉ bật trong lúc sáng (lúc nghỉ 0 lớp GPU thêm).

export interface Diem { x: number; y: number }
export interface Khung { x: number; y: number; w: number; h: number }

/** Thời gian đèn còn sáng sau lần chạm cuối (ms). */
export const MS_GIU_DEN = 1100
const MS_VUON = 260, MS_QUET = 240, MS_TAT = 420, MS_TAT_GON = 300, MS_HIEN_GON = 120
const DE_RA = 'cubic-bezier(.2,.85,.25,1)'

/** Gọn: máy yếu hoặc giảm chuyển động (đọc mỗi lần soi — em đổi cài đặt giữa ca vẫn đúng). */
export function denGon(): boolean {
  if (typeof document === 'undefined') return true
  if (document.documentElement.classList.contains('may-yeu')) return true
  try { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/** Hình học của tia: từ kính đèn `o` tới tâm khung `t`; bề rộng đầu tia ≈ bề ngang ô nhìn theo hướng tia (kẹp 36–150 px). Xuất chuỗi transform. */
export function hinhTia(o: Diem, t: Khung): { tia: string; thuGon: string; vung: string; vungNho: string; goc: string } {
  const cx = t.x + t.w / 2, cy = t.y + t.h / 2
  const dx = cx - o.x, dy = cy - o.y
  const d = Math.max(24, Math.hypot(dx, dy))
  const goc = Math.atan2(dy, dx)
  // bề ngang ô vuông góc với tia (chiếu khung lên pháp tuyến), thu 85 % để mép tia rơi trong ô
  const ngang = Math.abs(t.w * Math.sin(goc)) + Math.abs(t.h * Math.cos(goc))
  const mo = Math.max(36, Math.min(150, ngang * 0.85))
  const f = (v: number) => Math.round(v * 10) / 10
  const deg = f((goc * 180) / Math.PI)
  const coTia = (sx: number, sy: number) => `translate(${f(o.x)}px, ${f(o.y - 50)}px) rotate(${deg}deg) scale(${f(sx * 1000) / 1000}, ${f(sy * 1000) / 1000})`
  // vũng sáng tràn mép ô 12 px mỗi bên (ánh sáng loang ra viền)
  const vw = t.w + 24, vh = t.h + 24
  const coVung = (k: number) => `translate(${f(cx - (vw * k) / 2)}px, ${f(cy - (vh * k) / 2)}px) scale(${f((vw * k) / 100 * 1000) / 1000}, ${f((vh * k) / 100 * 1000) / 1000})`
  return {
    tia: coTia(d / 100, mo / 100),
    thuGon: coTia(0.06, 0.2),
    vung: coVung(1),
    vungNho: coVung(0.86),
    goc: `translate(${f(o.x - 24)}px, ${f(o.y - 24)}px)`,
  }
}

export interface DenSoi {
  /** Soi ô `t` từ kính đèn `o` (toạ độ trong lớp phủ). */
  soi(o: Diem, t: Khung): void
  /** Tắt ngay (đổi câu, tab ẩn, đổi khổ màn). */
  tat(ngay?: boolean): void
  dangSang(): boolean
  huy(): void
}

export function taoDenSoi(lop: HTMLElement, o: { onTat?: () => void } = {}): DenSoi {
  const tia = document.createElement('i'), vung = document.createElement('i'), goc = document.createElement('i')
  tia.className = 'kt-den-tia'; vung.className = 'kt-den-vung'; goc.className = 'kt-den-goc'
  lop.append(vung, tia, goc)
  let sang = false, cuTia = '', cuVung = '', henTat = 0, henNghi = 0
  // độ sáng hiện tại khi đang tắt dần (ước theo thời gian — không đọc kiểu tính toán của trình duyệt)
  let tatTu = 0, tatMs = 0
  const ca = [tia, vung, goc]
  const moHienTai = () => {
    if (sang) return 1
    if (!tatTu) return 0
    const p = Math.min(1, (performance.now() - tatTu) / tatMs)
    return Math.max(0, 1 - p)
  }
  const hoatAnh = (el: HTMLElement, kf: Keyframe[], ms: number, tre = 0, de = DE_RA) => {
    try { for (const a of el.getAnimations?.() ?? []) a.cancel() } catch { /* trình duyệt cũ */ }
    if (typeof el.animate !== 'function') return
    el.animate(kf, { duration: ms, delay: tre, easing: de, fill: 'backwards' })
  }
  const tat = (ngay = false) => {
    clearTimeout(henTat); clearTimeout(henNghi)
    if (!sang && !ngay) return
    const tu = moHienTai()
    sang = false
    for (const el of ca) el.style.opacity = '0'
    if (ngay || tu <= 0) {
      for (const el of ca) { try { for (const a of el.getAnimations?.() ?? []) a.cancel() } catch { /* */ } }
      tatTu = 0; lop.removeAttribute('data-bat'); cuTia = ''; o.onTat?.()
      return
    }
    const ms = denGon() ? MS_TAT_GON : MS_TAT
    tatTu = performance.now(); tatMs = ms
    for (const el of ca) hoatAnh(el, [{ opacity: tu }, { opacity: 0 }], ms, 0, 'ease-out')
    o.onTat?.()
    henNghi = window.setTimeout(() => { tatTu = 0; lop.removeAttribute('data-bat'); cuTia = '' }, ms + 40)
  }
  return {
    soi(od, t) {
      if (!t.w || !t.h) return
      clearTimeout(henNghi)
      const h = hinhTia(od, t), gon = denGon(), tu = moHienTai(), dangCo = tu > 0.05 && !!cuTia
      lop.setAttribute('data-bat', '')
      tia.style.transform = h.tia; vung.style.transform = h.vung; goc.style.transform = h.goc
      for (const el of ca) el.style.opacity = '1'
      if (gon) {
        // GỌN: hiện tại chỗ, chỉ opacity
        for (const el of ca) hoatAnh(el, [{ opacity: tu }, { opacity: 1 }], MS_HIEN_GON, 0, 'ease-out')
      } else if (dangCo) {
        // đèn đang sáng ⇒ QUÉT từ ô cũ sang ô mới, vũng sáng trượt theo
        hoatAnh(tia, [{ transform: cuTia, opacity: tu }, { transform: h.tia, opacity: 1 }], MS_QUET)
        hoatAnh(vung, [{ transform: cuVung, opacity: tu }, { transform: h.vung, opacity: 1 }], MS_QUET)
        hoatAnh(goc, [{ opacity: tu }, { opacity: 1 }], 120)
      } else {
        // bật đèn: quầng ở kính → tia vươn tới ô → vũng sáng nở trên ô
        hoatAnh(goc, [{ opacity: 0, transform: `${h.goc} scale(.5)` }, { opacity: 1, transform: `${h.goc} scale(1)` }], 140)
        hoatAnh(tia, [{ transform: h.thuGon, opacity: 0 }, { transform: h.thuGon, opacity: 0.9, offset: 0.12 }, { transform: h.tia, opacity: 1 }], MS_VUON, 40)
        hoatAnh(vung, [{ transform: h.vungNho, opacity: 0 }, { transform: h.vung, opacity: 1 }], 220, 170)
      }
      cuTia = h.tia; cuVung = h.vung; sang = true; tatTu = 0
      clearTimeout(henTat)
      henTat = window.setTimeout(() => tat(), MS_GIU_DEN)
    },
    tat,
    dangSang: () => sang,
    huy() { clearTimeout(henTat); clearTimeout(henNghi); for (const el of ca) el.remove(); lop.removeAttribute('data-bat') },
  }
}
