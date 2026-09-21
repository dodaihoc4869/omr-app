// BỘ NÃO — PHẦN DÙNG CHUNG của hai mã lệnh `lay.mjs` và `nop.mjs` (Code 1, 21/09/2026). Node thuần (≥ 24), không gói ngoài.
// Hợp đồng: docs/hop-dong-bo-nao-2109.md · cẩm nang cho phiên AI: bo-nao/HUONG-DAN-BO-NAO.md.
//
// LUẬT AN TOÀN (khoá bằng test `tests/bo-nao-ma-lenh-2109.test.ts`):
//   • MÃ BÍ MẬT chỉ đọc từ tệp `~/.omr-bo-nao/ma-bi-mat` (thầy tự đặt một lần), gửi bằng header `x-ma-bi-mat` tới địa chỉ https; KHÔNG bao giờ in, ghi tệp, hay đưa vào thông báo lỗi.
//   • AI chỉ thấy BÍ DANH (E001…). Bảng bí danh → SBD nằm ở `bo-nao/<ngày>/.bi-danh.json` (quyền 600); mã lệnh không in SBD, không in dữ liệu thẻ — chỉ in ĐƯỜNG DẪN và SỐ ĐẾM.
//   • Mọi thông báo lỗi bằng lời tiếng Việt, ngắn.
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { randomInt } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DIA_CHI_MAC_DINH = 'https://omr.ttadodaihoc.workers.dev'
/** `bo-nao/` ở gốc kho mã (tính từ vị trí tệp này, chạy ở thư mục nào cũng được). `OMR_BO_NAO_GOC` chỉ để test trỏ sang thư mục tạm. */
export const GOC_DU_LIEU = process.env.OMR_BO_NAO_GOC || resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'bo-nao')
/** Nơi có `HUONG-DAN-BO-NAO.md` / `LUAT-RUT-GON.md` (tính từ vị trí tệp này, KHÔNG đổi theo `OMR_BO_NAO_GOC`: cả kho mã lẫn gói ở ổ trong đều có `bo-nao/` cạnh `scripts/`). */
export const THU_MUC_CAM_NANG = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'bo-nao')
export const CO_TRANG = 40
export const TOI_DA_THE_MOI_TEP = 40
export const TOI_DA_HO_SO_MOI_TEP = 12
export const TOI_DA_MOI_LUOT_NOP = 100
export const SO_TRANG_TOI_DA = 80
export const SO_DONG_LOI_IN_TOI_DA = 10
/** Lượt CHIỀU: tối đa bấy nhiêu em mỗi lượt (chi phí token) và bấy nhiêu thẻ mỗi tệp vào. */
export const TOI_DA_EM_CHIEU = 60
export const TOI_DA_THE_MOI_TEP_CHIEU = 20

/** Lỗi có thể nói thẳng với người chạy: `.message` là lời tiếng Việt không chứa bí mật. */
export class LoiBoNao extends Error {
  constructor(loiNhan, maThoat = 1) {
    super(loiNhan)
    this.name = 'LoiBoNao'
    this.maThoat = maThoat
  }
}

// ══════════════════════════════ NGÀY ══════════════════════════════

export const laNgay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s
/** Ngày hiện tại theo giờ Việt Nam (UTC+7) bằng số học. */
export const homNayVn = (nowMs = Date.now()) => new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10)
export const themNgay = (ngay, n) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

// ══════════════════════════════ MÃ BÍ MẬT + GỌI MÁY CHỦ ══════════════════════════════

export function thuMucMa() {
  return process.env.OMR_BO_NAO_THU_MUC || join(homedir(), '.omr-bo-nao')
}

/** Đọc mã bí mật từ tệp; thiếu/rỗng ⇒ LoiBoNao bằng lời (KHÔNG hỏi, KHÔNG in mã). Trả `{ ma, canhBao }`. */
export function docMaBiMat(thuMuc = thuMucMa()) {
  const duong = join(thuMuc, 'ma-bi-mat')
  if (!existsSync(duong)) throw new LoiBoNao(`Chưa có tệp mã bí mật: ${duong}. Thầy tạo tệp này MỘT lần (chỉ chứa mã, một dòng) rồi chạy lại.`, 2)
  const ma = readFileSync(duong, 'utf8').trim()
  if (!ma) throw new LoiBoNao(`Tệp mã bí mật ${duong} đang rỗng.`, 2)
  let canhBao = ''
  try {
    if ((statSync(duong).mode & 0o077) !== 0) canhBao = `Tệp mã bí mật đang cho người khác đọc — nên chạy: chmod 600 ${duong}`
  } catch {
    /* không kiểm được quyền thì thôi */
  }
  return { ma, canhBao }
}

const laDiaChiAnToan = (d) => /^https:\/\/[^/\s]+/.test(d) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(d)
const nghiMs = (ms) => new Promise((xong) => setTimeout(xong, ms))

/**
 * Hàm gọi máy chủ: `goi('/ai/cau-hinh', {…}) → JSON` (đã kiểm `ok`). Thử lại tối đa 3 lần khi mạng lỗi / máy chủ 5xx / 429. 401·403 ⇒ nói thẳng mã bị từ chối.
 * `diaChi` chưa phải https (trừ localhost) ⇒ TỪ CHỐI gửi (không để mã bí mật đi trần).
 */
export function taoGoiMayChu({ ma, diaChi = process.env.OMR_MAY_CHU || DIA_CHI_MAC_DINH, fetchFn = fetch, soLanThu = 3, nghi = nghiMs } = {}) {
  if (!ma) throw new LoiBoNao('Thiếu mã bí mật.', 2)
  const goc = String(diaChi).replace(/\/+$/, '')
  if (!laDiaChiAnToan(goc)) throw new LoiBoNao(`Địa chỉ máy chủ phải là https (đang là "${goc.slice(0, 60)}") — không gửi mã bí mật qua đường không mã hoá.`, 2)
  return async function goi(duong, than = {}) {
    let loiCuoi = ''
    for (let lan = 1; lan <= soLanThu; lan++) {
      let ph
      try {
        ph = await fetchFn(`${goc}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': ma }, body: JSON.stringify(than) })
      } catch {
        loiCuoi = 'không nối được máy chủ (mạng?)'
        if (lan < soLanThu) await nghi(1500 * lan)
        continue
      }
      if (ph.status === 401 || ph.status === 403) throw new LoiBoNao('Máy chủ từ chối mã bí mật (403) — kiểm tệp ~/.omr-bo-nao/ma-bi-mat có đúng mã của thầy không.', 3)
      if (ph.status >= 500 || ph.status === 429) {
        loiCuoi = `máy chủ báo lỗi tạm thời (mã ${ph.status})`
        if (lan < soLanThu) await nghi(1500 * lan)
        continue
      }
      let j
      try {
        j = await ph.json()
      } catch {
        throw new LoiBoNao(`Máy chủ trả về không phải JSON (mã ${ph.status}) ở ${duong}.`, 3)
      }
      if (!j || typeof j !== 'object') throw new LoiBoNao(`Máy chủ trả về dữ liệu lạ ở ${duong}.`, 3)
      if (j.ok === false) throw new LoiBoNao(`Máy chủ báo lỗi ở ${duong}: ${String(j.error ?? 'không rõ').slice(0, 200)}`, 3)
      return j
    }
    throw new LoiBoNao(`Gọi ${duong} không được sau ${soLanThu} lần: ${loiCuoi}.`, 3)
  }
}

// ══════════════════════════════ BÍ DANH ══════════════════════════════

export const maBiDanh = (i) => `E${String(i).padStart(3, '0')}`

/**
 * Gán bí danh cho danh sách SBD. `bangCu` = `{ biDanh: sbd }` đã có trong ngày: em cũ GIỮ NGUYÊN bí danh (chạy lại `lay.mjs` không làm lệch tệp `ra/` đã viết);
 * em mới nhận số chưa dùng theo THỨ TỰ NGẪU NHIÊN (`rng(n)` ∈ [0, n)) để bí danh không lộ thứ tự SBD/sổ.
 * Trả `{ bang: {biDanh: sbd}, dao: Map(sbd → biDanh) }`.
 */
export function capBiDanh(sbds, bangCu = {}, rng = (n) => randomInt(n)) {
  const bang = { ...bangCu }
  const dao = new Map(Object.entries(bang).map(([b, s]) => [s, b]))
  const moi = [...new Set(sbds)].filter((s) => !dao.has(s)).sort()
  if (moi.length) {
    const tong = Object.keys(bang).length + moi.length
    const dung = new Set(Object.keys(bang))
    const chuaDung = []
    for (let i = 1; i <= tong; i++) if (!dung.has(maBiDanh(i))) chuaDung.push(i)
    for (let i = chuaDung.length - 1; i > 0; i--) {
      const j = rng(i + 1)
      ;[chuaDung[i], chuaDung[j]] = [chuaDung[j], chuaDung[i]]
    }
    moi.forEach((s, k) => {
      const b = maBiDanh(chuaDung[k])
      bang[b] = s
      dao.set(s, b)
    })
  }
  return { bang, dao }
}

/** Thay MỌI SBD xuất hiện trong chuỗi bằng bí danh (để không lộ SBD ra thông báo). */
export function giauSbd(chu, dao) {
  let ra = String(chu)
  for (const [sbd, b] of dao) if (sbd && ra.includes(sbd)) ra = ra.split(sbd).join(b)
  return ra
}

// ══════════════════════════════ TỆP ══════════════════════════════

export const chiaTep = (mang, toiDa) => {
  const ra = []
  for (let i = 0; i < mang.length; i += toiDa) ra.push(mang.slice(i, i + toiDa))
  return ra
}
export const soTep = (i) => String(i + 1).padStart(2, '0')

export function ghiJson(duong, obj, { rieng = false, dep = false } = {}) {
  mkdirSync(dirname(duong), { recursive: true })
  writeFileSync(duong, JSON.stringify(obj, null, dep ? 2 : 0), rieng ? { mode: 0o600 } : undefined)
  if (rieng) chmodSync(duong, 0o600)
}

/** Ghi một tệp CHỮ (bản xem trước, báo cáo). Không dùng cho mã bí mật. */
export function ghiChu(duong, chu) {
  mkdirSync(dirname(duong), { recursive: true })
  writeFileSync(duong, chu)
}

export function docJsonNeuCo(duong, macDinh = null) {
  try {
    return JSON.parse(readFileSync(duong, 'utf8'))
  } catch {
    return macDinh
  }
}

/** Xoá các tệp `.json` cũ trong `vao/` (lượt lấy mới ghi lại từ đầu); KHÔNG đụng `ra/`. */
export function donVao(thuMucVao) {
  if (!existsSync(thuMucVao)) return
  for (const f of readdirSync(thuMucVao)) if (f.endsWith('.json')) rmSync(join(thuMucVao, f))
}

// ══════════════════════════════ TRẠNG THÁI CHẠY BÙ ══════════════════════════════

/** `bo-nao/lan-cuoi.json` = `{ layNgay, layLuc, nopNgay, nopLuc }` — không có số liệu học sinh. */
export const tepLanCuoi = (goc) => join(goc, 'lan-cuoi.json')

/**
 * Các ngày (tối đa 3, gần nhất) đã bỏ lỡ giữa lần NỘP cuối và `ngay`: `nopNgay + 1 … ngay − 1`. Chưa từng nộp ⇒ không nhắc (đêm đầu tiên không có gì để bù).
 */
export function ngayChayBu(lanCuoi, ngay) {
  const nop = lanCuoi && laNgay(lanCuoi.nopNgay) ? lanCuoi.nopNgay : null
  if (!nop) return []
  const ds = []
  for (let d = themNgay(nop, 1); d < ngay; d = themNgay(d, 1)) ds.push(d)
  return ds.slice(-3)
}
