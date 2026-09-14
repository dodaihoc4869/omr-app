// CHUẨN HOÁ LỜI GIẢI HOÁ HỌC — MỘT KHUÔN CHO MỌI BÁO CÁO, MỌI CA, MỌI APP.
//
// Khuôn cố định, đúng thứ tự:
//   1. Đáp án
//   2. KIẾN THỨC CỐT LÕI        (kho: `chot`)
//   3. VÌ SAO CHỌN / KHÔNG CHỌN (kho: `tung_pa` phần I · `tung_y` phần II)
//   4. LÀM TỪNG BƯỚC            (kho: `buoc` — phần III LUÔN có)
//
// ───────────────────────────────────────────────────────────────────────────
// CẤM BỊA LỜI GIẢI. Thầy bắt được 14/09: câu phần III về cân bằng 2SO₂ + O₂
// hiện đúng một dòng "Bản chất kiến thức cốt lõi chuyên đề Cân bằng hoá học:
// Đáp án đúng của câu này là 3. Cần chú ý định luật bảo toàn và khái niệm bản
// chất hoá học." — không một bước tính nào.
//
// Dòng ấy do CHÍNH FILE NÀY dựng ra khi không đọc được lời giải: bản cũ thiếu
// `chot` thì ghép một câu khuôn từ tên chuyên đề + đáp án; thiếu `tung_pa` thì
// chép lại chữ bốn phương án rồi dán "— Đây là khẳng định chính xác theo bản
// chất hoá học." vào sau. Em đọc tưởng là lời giải của thầy. Đó là bịa, và nó
// CHE MẤT lỗi thật: đường dẫn dữ liệu đứt, chứ kho không hề thiếu.
//
// Đếm thật trên kho ngày 14/09 (157 tờ đề):
//   phần I   4.841 câu — 100% có `chot` + `tung_pa` đủ bốn phương án
//   phần II  1.293 câu — 100% có `chot` + `tung_y` đủ bốn ý
//   phần III 1.800 câu — 100% có `chot` + `buoc`, tức GIẢI TỪNG BƯỚC
//
// Nay: đọc được gì hiện nấy; không đọc được thì `thieu = true` và màn hình nói
// thẳng "chưa có lời giải" để thầy biết mà nạp lại — cấm dựng chữ thay vào.

export interface LyDoPhuongAn {
  khoa: string
  dung: boolean
  ly: string
}

export interface LoiGiaiCauTrucChuan {
  chot: string
  lyDo: LyDoPhuongAn[] | null
  buoc: string[] | null
  ketQua: string
  /** KHO KHÔNG CÓ lời giải cho câu này: không `chot`, không lý do từng phương
   * án, không bước nào. Màn hình phải nói thẳng, cấm dựng chữ thay. */
  thieu: boolean
}

/** Đọc một mục lý do (`{dung, vi_sao}`) theo mọi cách viết khoá kho đã dùng. */
function docLyDo(khoa: string, v: unknown, ketQua: string): LyDoPhuongAn {
  const o = (v ?? {}) as Record<string, unknown>
  const ly = String(o.vi_sao ?? o.viSao ?? o.ly ?? o.text ?? o.noiDung ?? o.noi_dung ?? '').trim()
  const dung = o.dung !== undefined ? Boolean(o.dung) : khoa.toUpperCase() === ketQua.toUpperCase()
  return { khoa, dung, ly }
}

/** Chữ hiện khi kho chưa có lời giải. MỘT câu duy nhất dùng chung mọi nơi — để
 * không chỗ nào tự nghĩ ra một câu tử tế hơn rồi lại thành bịa. */
export const CHUA_CO_LOI_GIAI = 'Câu này trong kho chưa có lời giải. Thầy bổ sung rồi em xem lại.'

/**
 * Trích lời giải từ mọi định dạng kho đã dùng (object, chuỗi JSON, chữ thô).
 * KHÔNG tự sinh nội dung: thiếu thì trả `thieu = true`.
 *
 * @param phan 'I' | 'II' | 'III' — quyết định khoá in hoa (A–D, phương án) hay
 *   in thường (a–d, ý). Ý phần II trong đề là a, b, c, d; in hoa lên thành
 *   A, B, C, D là lệch với tờ đề em cầm.
 */
export function chuanHoaLoiGiaiCau(
  rawLg: unknown,
  phan: string = 'I',
  dapAnDung: string = '',
): LoiGiaiCauTrucChuan {
  let lg: unknown = rawLg

  if (typeof lg === 'string') {
    const s = lg.trim()
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        lg = JSON.parse(s)
      } catch {
        lg = s
      }
    }
  }

  let chot = ''
  let lyDo: LyDoPhuongAn[] | null = null
  let buoc: string[] | null = null
  const ketQua = dapAnDung ? dapAnDung.trim() : ''

  if (lg && typeof lg === 'object') {
    const o = lg as Record<string, any>

    // 1. KIẾN THỨC CỐT LÕI
    const rawChot = o.chot ?? o.noi_dung ?? o.noiDung ?? o.kien_thuc ?? o.kienThuc ?? ''
    chot = String(rawChot).trim()
    if (chot === '[object Object]') chot = ''
    for (const k of ['text', 'loiGiai', 'explanation', 'giaiThich'] as const) {
      if (chot) break
      const v = o[k]
      if (typeof v === 'string' && v.trim() && v !== '[object Object]') chot = v.trim()
    }

    // 2. VÌ SAO CHỌN / KHÔNG CHỌN — phương án (I) và ý (II) là hai khoá khác nhau
    const rawPa = o.tung_pa ?? o.tungPa
    const rawY = o.tung_y ?? o.tungY
    const coPa = !!rawPa && typeof rawPa === 'object'
    const nguon = coPa ? rawPa : rawY && typeof rawY === 'object' ? rawY : null
    if (nguon) {
      const entries = Object.entries(nguon as Record<string, unknown>)
      if (entries.length > 0) {
        lyDo = entries.map(([k, v]) => docLyDo(coPa ? k.toUpperCase() : k.toLowerCase(), v, ketQua))
        // Kho ghi đủ khoá nhưng rỗng lý do thì coi như KHÔNG CÓ, đừng in ra bốn
        // dòng trống cho em nhìn.
        if (lyDo.every((p) => !p.ly)) lyDo = null
      }
    }

    // 3. LÀM TỪNG BƯỚC
    if (Array.isArray(o.buoc)) {
      const ds = o.buoc.map((b: unknown) => String(b).trim()).filter(Boolean)
      if (ds.length > 0) buoc = ds
    }
  } else if (typeof lg === 'string' && lg.trim() && lg !== '[object Object]') {
    // Kho cũ ghi lời giải bằng chữ thô. Chuỗi có các dòng "A. ..." thì tách
    // thành lý do từng phương án; phần còn lại là kiến thức cốt lõi.
    const s = lg.trim()
    const lines = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const paLines = lines.filter((l) => /^[A-Da-d][.)]\s*/.test(l))
    if (paLines.length >= 2) {
      lyDo = paLines.map((l) => {
        const m = l.match(/^([A-Da-d])[.)]\s*(.*)$/)
        const khoa = m ? (phan === 'II' ? m[1].toLowerCase() : m[1].toUpperCase()) : ''
        const noiDung = m ? m[2] : l
        return {
          khoa,
          dung: khoa.toUpperCase() === ketQua.toUpperCase() || noiDung.includes('✓'),
          ly: noiDung.replace(/^[✓✗\s]+/, '').trim(),
        }
      })
      chot = lines.filter((l) => !/^[A-Da-d][.)]\s*/.test(l)).join(' ').trim()
    } else {
      chot = s
    }
  }

  return {
    chot,
    lyDo,
    buoc,
    ketQua,
    thieu: !chot && !(lyDo && lyDo.length > 0) && !(buoc && buoc.length > 0),
  }
}

/**
 * Sinh HTML hiển thị khối lời giải chuẩn phong cách Google (khung màu kem, font rõ ràng, biểu tượng đẹp)
 */
export function taoHtmlKhungLoiGiaiGoogle(lg: LoiGiaiCauTrucChuan): string {
  const khoi: string[] = []

  // 1. Đáp án
  khoi.push(`
    <div style="font-size: 14.5px; color: var(--cam-dam, rgb(146, 64, 14)); font-weight: 600; margin-bottom: 8px;">
      Đáp án: <b style="font-size: 16px; font-weight: 900; color: var(--cam-toi, rgb(120, 53, 15)); letter-spacing: 0.04em;">${lg.ketQua || '—'}</b>
    </div>
  `)

  // Kho chưa có lời giải: nói thẳng một câu rồi dừng. Cấm in mục rỗng.
  if (lg.thieu) {
    return `
    <div style="margin-top: 12px; padding: 14px 18px; background: var(--kem-nen, rgb(255, 251, 235)); border: 1px solid var(--kem-vien, rgb(253, 230, 138)); border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      ${khoi.join('')}
      <div style="font-size: 13.5px; font-style: italic; line-height: 1.6; color: var(--cam-toi, rgb(120, 53, 15));">${CHUA_CO_LOI_GIAI}</div>
    </div>
  `
  }

  // 2. Kiến thức cốt lõi
  if (lg.chot) {
    khoi.push(`
      <div style="margin-top: 10px; margin-bottom: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--cam-dam, rgb(146, 64, 14));">
        KIẾN THỨC CỐT LÕI
      </div>
      <div style="font-size: 15px; font-weight: 800; line-height: 1.6; color: var(--cam-chu, rgb(59, 29, 5)); margin-bottom: 12px;">
        ${lg.chot}
      </div>
    `)
  }

  // 3. Vì sao chọn / không chọn từng phương án
  if (lg.lyDo && lg.lyDo.length > 0) {
    khoi.push(`
      <div style="margin-top: 10px; margin-bottom: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--cam-dam, rgb(146, 64, 14));">
        VÌ SAO CHỌN / KHÔNG CHỌN TỪNG PHƯƠNG ÁN
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: var(--cam-toi, rgb(120, 53, 15));">
        ${lg.lyDo
          .map(
            (p) => `
          <div style="padding: 4px 0; border-top: 1px dashed rgba(146, 64, 14, 0.2);">
            <strong style="color: var(--cam-chu-dam, rgb(91, 42, 6));">${p.khoa}.</strong>
            <span style="font-weight: 700; color: ${p.dung ? 'var(--gg-luc, rgb(21, 128, 61))' : 'var(--gg-do, rgb(185, 28, 28))'}; margin: 0 4px;">
              ${p.dung ? '✓' : '✗'}
            </span>
            <span>${p.ly}</span>
          </div>
        `,
          )
          .join('')}
      </div>
    `)
  }

  // 4. Làm từng bước (nếu có)
  if (lg.buoc && lg.buoc.length > 0) {
    khoi.push(`
      <div style="margin-top: 12px; margin-bottom: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--cam-dam, rgb(146, 64, 14));">
        LÀM TỪNG BƯỚC
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: var(--cam-toi, rgb(120, 53, 15));">
        ${lg.buoc.map((b, i) => `<div style="margin-bottom: 4px;">${i + 1}. ${b}</div>`).join('')}
      </div>
    `)
  }

  return `
    <div style="margin-top: 12px; padding: 14px 18px; background: var(--kem-nen, rgb(255, 251, 235)); border: 1px solid var(--kem-vien, rgb(253, 230, 138)); border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      ${khoi.join('')}
    </div>
  `
}
