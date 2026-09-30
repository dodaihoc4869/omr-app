// CỔNG KIỂM GÓI ĐỀ Ở MÁY CHỦ (rà thêm đề 30/09, lỗ hổng "máy chủ nhận đề mà không kiểm gì").
// Mọi đường ghi kho (`/kho/day`, `luuDe`, chuyển kho, công cụ tự sửa kho) đi qua `dayDeKho` ⇒ kiểm tại đây là đủ.
// Gói có LỖI ⇒ từ chối CẢ gói, chưa ghi gì (không ghi nửa chừng), trả danh sách lỗi từng câu.
// Gói hợp lệ ⇒ trả bản CHUẨN HOÁ: khoá phương án xếp A–D, khoá ý xếp a–d (chuỗi đáp án Đ/S luôn ghép theo a,b,c,d),
// đáp án Phần I/II viết hoa; câu Phần III có đáp án máy chấm không đọc được như một số (và không phải tự luận) ⇒ gắn cờ `can_xem`.
// Tờ kiểu cũ (phanI/phanII/phanIII, không có `cau[]`) giữ nguyên — đường game đã có bộ kiểm riêng (`normalizeBank`).
import { laCauTuLuan } from './cau-tu-luan'
import { khopPhanIII } from './cham-so'

type Obj = Record<string, unknown>
export interface KetQuaKiemGoi {
  /** Lỗi chặn: có ⇒ không ghi gói. */
  loi: string[]
  /** Cảnh báo: vẫn ghi, đã gắn cờ `can_xem` cho câu liên quan. */
  canhBao: string[]
  /** Gói sau chuẩn hoá (chỉ dùng khi `loi` rỗng). */
  goi: Obj
}

const PA = ['A', 'B', 'C', 'D'] as const
const Y = ['a', 'b', 'c', 'd'] as const
const VI_TRI = new Set(['sau_de', 'sau_pa_A', 'sau_pa_B', 'sau_pa_C', 'sau_pa_D', 'sau_y_a', 'sau_y_b', 'sau_y_c', 'sau_y_d', 'cuoi_cau', 'sau_loi_giai'])
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const chu = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')

/** Chuẩn hoá một chữ Đ/S: "Đ", "D", "đúng", true ⇒ "D"; "S", "sai", false ⇒ "S"; khác ⇒ "". */
function motDS(v: unknown): 'D' | 'S' | '' {
  if (v === true) return 'D'
  if (v === false) return 'S'
  const s = chu(v).toUpperCase()
  if (s === 'D' || s === 'Đ' || s === 'ĐÚNG' || s === 'DUNG') return 'D'
  if (s === 'S' || s === 'SAI') return 'S'
  return ''
}

export function kiemGoiDe(maDe: string, de: unknown): KetQuaKiemGoi {
  const loi: string[] = []
  const canhBao: string[] = []
  if (!laObj(de)) return { loi: ['Gói đề không phải một đối tượng JSON.'], canhBao, goi: {} }
  const maTrongGoi = chu(de.ma_de ?? de.maDe)
  if (maTrongGoi && maTrongGoi !== maDe) loi.push(`Mã đề trong gói (${maTrongGoi}) khác mã đề gửi lên (${maDe}).`)
  if (!Array.isArray(de.cau)) {
    const kieuCu = ['phanI', 'phanII', 'phanIII'].some((k) => Array.isArray(de[k]))
    if (!kieuCu) loi.push('Gói đề không có danh sách câu ("cau").')
    return { loi, canhBao, goi: de }
  }
  if (!de.cau.length) loi.push('Gói đề không có câu nào.')
  const daCo = new Set<string>()
  const cauMoi: unknown[] = []
  de.cau.forEach((c0, i) => {
    if (!laObj(c0)) { loi.push(`Câu thứ ${i + 1}: không phải một đối tượng.`); cauMoi.push(c0); return }
    const c: Obj = { ...c0 }
    const phan = chu(c.phan).toUpperCase()
    const so = chu(c.so)
    const nhan = `Câu ${phan || '?'}.${so || i + 1}`
    if (!['I', 'II', 'III', 'IV'].includes(phan)) { loi.push(`${nhan}: phần "${chu(c.phan)}" không hợp lệ (chỉ I, II, III, IV).`); cauMoi.push(c); return }
    c.phan = phan
    if (!/^\d+$/.test(so)) loi.push(`${nhan}: thiếu số câu hoặc số câu không phải số nguyên.`)
    else if (daCo.has(`${phan}-${so}`)) loi.push(`${nhan}: trùng phần và số với một câu khác trong tờ.`)
    daCo.add(`${phan}-${so}`)
    if (phan === 'IV') { cauMoi.push(c); return } // tự luận: không chấm máy, không kiểm đáp án
    if (!chu(c.de) && !Array.isArray(c.bang)) loi.push(`${nhan}: đề trống.`)

    if (phan === 'I') {
      const pa = laObj(c.pa) ? c.pa : {}
      const thieu = PA.filter((k) => !chu(pa[k]) && !(Array.isArray(c.hinh) && (c.hinh as Obj[]).some((h) => laObj(h) && h.vi_tri === `sau_pa_${k}`)))
      const la = Object.keys(pa).filter((k) => !(PA as readonly string[]).includes(k))
      if (thieu.length) loi.push(`${nhan}: thiếu phương án ${thieu.join(', ')}.`)
      if (la.length) loi.push(`${nhan}: có phương án lạ (${la.join(', ')}).`)
      const da = chu(c.dap_an).toUpperCase()
      if (!/^[A-D]$/.test(da)) loi.push(`${nhan}: đáp án "${chu(c.dap_an)}" phải là một chữ A, B, C hoặc D.`)
      else c.dap_an = da
      if (!la.length) c.pa = Object.fromEntries(PA.map((k) => [k, pa[k] ?? '']))
    } else if (phan === 'II') {
      const y = laObj(c.y) ? c.y : {}
      const thieu = Y.filter((k) => !chu(y[k]) && !(Array.isArray(c.hinh) && (c.hinh as Obj[]).some((h) => laObj(h) && h.vi_tri === `sau_y_${k}`)))
      const la = Object.keys(y).filter((k) => !(Y as readonly string[]).includes(k))
      if (thieu.length) loi.push(`${nhan}: thiếu ý ${thieu.join(', ')} (cần đủ a, b, c, d).`)
      if (la.length) loi.push(`${nhan}: có ý lạ (${la.join(', ')}).`)
      let ds = ''
      if (typeof c.dap_an === 'string') ds = [...c.dap_an.trim()].map(motDS).join('')
      else if (laObj(c.dap_an)) ds = Y.map((k) => motDS((c.dap_an as Obj)[k])).join('')
      if (!/^[DS]{4}$/.test(ds)) loi.push(`${nhan}: đáp án phải đúng 4 chữ Đ/S theo thứ tự a, b, c, d.`)
      else if (typeof c.dap_an === 'string') c.dap_an = ds
      // Xếp khoá ý về a, b, c, d: chuỗi đáp án Đ/S ghép theo thứ tự này (màn thi, lời giải, dấu vân tay nội dung).
      if (!la.length) c.y = Object.fromEntries(Y.map((k) => [k, y[k] ?? '']))
    } else {
      const da = chu(c.dap_an)
      const tuLuan = laCauTuLuan(c, 'III')
      if (!da && !tuLuan) loi.push(`${nhan}: thiếu đáp án.`)
      else if (da && !tuLuan && !khopPhanIII(da, da)) {
        canhBao.push(`${nhan}: đáp án "${da.slice(0, 40)}" máy chấm không đọc được như một số — đã gắn cờ cần xem (không phát vào game, rút đề cho tới khi sửa).`)
        c.can_xem = true
      }
    }

    if (c.hinh !== undefined && c.hinh !== null) {
      if (!Array.isArray(c.hinh)) loi.push(`${nhan}: "hinh" phải là danh sách.`)
      else (c.hinh as unknown[]).forEach((h, j) => {
        if (!laObj(h)) { loi.push(`${nhan}: hình thứ ${j + 1} không hợp lệ.`); return }
        if (!/^data:image\/[a-z+.-]+;base64,./i.test(chu(h.du_lieu))) loi.push(`${nhan}: hình "${chu(h.tep) || j + 1}" thiếu dữ liệu ảnh.`)
        if (h.vi_tri !== undefined && !VI_TRI.has(chu(h.vi_tri))) loi.push(`${nhan}: hình "${chu(h.tep) || j + 1}" có vị trí "${chu(h.vi_tri)}" không hợp lệ.`)
      })
    }
    cauMoi.push(c)
  })
  return { loi, canhBao, goi: { ...de, cau: cauMoi } }
}
