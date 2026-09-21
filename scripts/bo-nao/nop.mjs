#!/usr/bin/env node
// BỘ NÃO — MÃ LỆNH 2/2: KIỂM KHUÔN + ĐỔI BÍ DANH + NỘP (Code 1, 21/09/2026).   Dùng: node scripts/bo-nao/nop.mjs <YYYY-MM-DD>
//
// Đọc `bo-nao/<ngày>/ra/*.json` (mỗi tệp là MẢNG các phần tử đúng KHUÔN `DauRaEm`; `ra/lop.json` = bản tin sáng `{cacDong:[…]}`), kiểm khuôn TẠI MÁY THẦY bằng đúng `kiemKhuon`/`kiemBanTin`
// mà máy chủ sẽ chạy LẦN NỮA, đổi bí danh → SBD (bảng `.bi-danh.json`), rồi nộp `/ai/dieu-chinh/nop` theo lô ≤ 100 em.
// Phần tử sai khuôn bị BỎ (không sửa hộ) và báo lý do bằng bí danh. In CHỈ số đếm + lý do ngắn; không in SBD, không in lời nhắn, không in dữ liệu thẻ.
// Nộp lại nhiều lần vô hại (máy chủ ghi đè theo (em, ngày)).
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { HAN_MUC_BO_NAO, kiemBanTin, kiemKhuon } from '../../src/lib/bo-nao-khuon.ts'
import {
  GOC_DU_LIEU,
  LoiBoNao,
  SO_DONG_LOI_IN_TOI_DA,
  TOI_DA_MOI_LUOT_NOP,
  chiaTep,
  docJsonNeuCo,
  docMaBiMat,
  ghiJson,
  giauSbd,
  homNayVn,
  laNgay,
  taoGoiMayChu,
  tepLanCuoi,
} from './chung.mjs'

const laDoiTuong = (x) => x !== null && typeof x === 'object' && !Array.isArray(x)

/** Đọc mọi `ra/*.json` trừ `lop.json` ⇒ `{ phanTu: [{tep, x}], loiTep: [chuỗi] }`. */
export function docThuMucRa(thuMucRa) {
  const phanTu = []
  const loiTep = []
  if (!existsSync(thuMucRa)) return { phanTu, loiTep: ['chưa có thư mục ra/'] }
  for (const f of readdirSync(thuMucRa).sort()) {
    if (!f.endsWith('.json') || f === 'lop.json') continue
    let j
    try {
      j = JSON.parse(readFileSync(join(thuMucRa, f), 'utf8'))
    } catch (e) {
      loiTep.push(`${f}: không phải JSON hợp lệ (${String(e && e.message ? e.message : e).slice(0, 80)})`)
      continue
    }
    const mang = Array.isArray(j) ? j : laDoiTuong(j) && Array.isArray(j.cacEm) ? j.cacEm : null
    if (!mang) {
      loiTep.push(`${f}: cần MẢNG các phần tử (hoặc {"cacEm":[…]})`)
      continue
    }
    for (const x of mang) phanTu.push({ tep: f, x })
  }
  return { phanTu, loiTep }
}

/** Phần tử do THUẬT TOÁN soạn cho em vắng 2–4 ngày (`lay.mjs` ghi `tu-dong/vang.json`; AI không đọc) ⇒ `[{tep, x}]`. */
export function docTuDong(thuMucNgay) {
  const mang = docJsonNeuCo(join(thuMucNgay, 'tu-dong', 'vang.json'), [])
  return Array.isArray(mang) ? mang.filter(laDoiTuong).map((x) => ({ tep: 'tu-dong/vang.json', x })) : []
}

/**
 * Thẻ ĐẦY ĐỦ đã lấy ⇒ Map(biDanh → {the}). Nguồn chính: `.the-day-du.json` (thẻ đầy đủ mã lệnh giữ riêng — tệp AI đọc `vao/*.json` đã NÉN, thiếu trường). Không có (lượt lấy cũ) thì dùng `vao/*.json`.
 */
export function docTheDaLay(thuMucNgay) {
  const the = new Map()
  const dayDu = docJsonNeuCo(join(thuMucNgay, '.the-day-du.json'), null)
  if (dayDu && laDoiTuong(dayDu.the)) {
    for (const [b, t] of Object.entries(dayDu.the)) the.set(b, { biDanh: b, the: t })
    return the
  }
  const thuMucVao = join(thuMucNgay, 'vao')
  if (!existsSync(thuMucVao)) return the
  for (const f of readdirSync(thuMucVao)) {
    if (!f.endsWith('.json')) continue
    const mang = docJsonNeuCo(join(thuMucVao, f), [])
    if (Array.isArray(mang)) for (const e of mang) if (e && typeof e.biDanh === 'string' && e.the) the.set(e.biDanh, e)
  }
  return the
}

/**
 * Kiểm khuôn cục bộ từng phần tử `ra`: bí danh phải có trong bảng đêm, mỗi em MỘT phần tử, có thẻ, `kiemKhuon` hợp lệ.
 * Trả `{ hopLe: [{biDanh, sbd, dauRa, canhBao}], loai: [{biDanh, tep, lyDo:[…]}] }`. Thứ tự giữ nguyên.
 */
export function kiemCacEm(phanTu, bang, the) {
  const hopLe = []
  const loai = []
  const daCo = new Set()
  for (const { tep, x } of phanTu) {
    const b = laDoiTuong(x) && typeof x.biDanh === 'string' ? x.biDanh : null
    const ten = b ?? '?'
    if (!b || !Object.prototype.hasOwnProperty.call(bang, b)) {
      loai.push({ biDanh: ten.slice(0, 20), tep, lyDo: ['bí danh không có trong dữ liệu đêm này'] })
      continue
    }
    if (daCo.has(b)) {
      loai.push({ biDanh: b, tep, lyDo: ['trùng em: mỗi em chỉ MỘT phần tử mỗi ngày (giữ phần tử đầu)'] })
      continue
    }
    daCo.add(b)
    const t = the.get(b)
    if (!t) {
      loai.push({ biDanh: b, tep, lyDo: ['không có thẻ của em ngày này trong vao/ — chạy lại lay.mjs'] })
      continue
    }
    const k = kiemKhuon(x, { ...t.the, biDanh: b })
    if (!k.hopLe) {
      loai.push({ biDanh: b, tep, lyDo: k.lyDo })
      continue
    }
    hopLe.push({ biDanh: b, sbd: bang[b], dauRa: x, canhBao: k.canhBao ?? [], tep })
  }
  return { hopLe, loai }
}

/**
 * Bản tin `ra/lop.json`: kiểm TỪNG dòng (dòng sai chỉ bỏ dòng đó), tối đa 6 dòng; đổi bí danh → SBD cho máy chủ ghép tên.
 * Trả `{ banTin: {cacDong}|null, loi: [lỗi từng dòng], ghiChu: '' | lý do không có bản tin }`. Thiếu/hỏng tệp ⇒ `banTin: null` và `ghiChu`.
 */
export function kiemBanTinCucBo(tepLop, lop, bang) {
  if (!existsSync(tepLop)) return { banTin: null, loi: [], ghiChu: 'chưa có ra/lop.json (bản tin sáng) — không nộp bản tin' }
  const HONG = Symbol('json-hong')
  const raw = docJsonNeuCo(tepLop, HONG) // `undefined` sẽ rơi về giá trị mặc định của hàm ⇒ dùng biểu tượng riêng
  if (raw === HONG) return { banTin: null, loi: [], ghiChu: 'ra/lop.json không phải JSON hợp lệ — không nộp bản tin' }
  const dongs = laDoiTuong(raw) && Array.isArray(raw.cacDong) ? raw.cacDong : null
  if (!dongs) return { banTin: null, loi: [], ghiChu: 'ra/lop.json cần dạng {"cacDong":[…]} — không nộp bản tin' }
  const bienDanhHopLe = new Set(Object.keys(bang))
  const loi = []
  const canhBao = []
  const tot = []
  dongs.forEach((d, i) => {
    const k = kiemBanTin({ cacDong: [d] }, lop, bienDanhHopLe)
    if (k.hopLe) tot.push(d)
    else loi.push(`bản tin dòng ${i + 1}: ${k.lyDo.map((s) => s.replace(/^dòng 1: /, '')).join('; ')}`)
    // số lạ trong dòng hợp lệ chỉ là CẢNH BÁO (dòng vẫn nộp)
    for (const c of k.canhBao ?? []) canhBao.push(`bản tin dòng ${i + 1}: ${c.replace(/^dòng 1: /, '')}`)
  })
  if (tot.length > HAN_MUC_BO_NAO.BAN_TIN_SO_DONG_TOI_DA) loi.push(`bản tin có ${tot.length} dòng hợp lệ, chỉ nhận ${HAN_MUC_BO_NAO.BAN_TIN_SO_DONG_TOI_DA} dòng đầu`)
  const nhan = tot.slice(0, HAN_MUC_BO_NAO.BAN_TIN_SO_DONG_TOI_DA)
  return {
    banTin: nhan.length ? { cacDong: nhan.map((d) => ({ loai: d.loai, chu: d.chu, hanhDong: d.hanhDong, dang: d.dang ?? '', sbd: d.biDanh ? (bang[d.biDanh] ?? '') : '' })) } : null,
    loi,
    canhBao,
    ghiChu: '',
  }
}

/**
 * Lõi của mã lệnh (tách ra để test). Trả bản tóm tắt KHÔNG có SBD:
 * `{ ngay, soPhanTu, tuDong, nhan, chiGhiSo, soApDung, biLoaiCucBo, biLoaiMayChu, loai:[{biDanh, lyDo}], canhBao:[{biDanh, canhBao}], banTin:{nhan, loi}, loiTep }`.
 */
export async function chayNop({ ngay, goc = GOC_DU_LIEU, goi, bayGio = Date.now() }) {
  const thuMuc = join(goc, ngay)
  const tepBiDanh = join(thuMuc, '.bi-danh.json')
  const bd = docJsonNeuCo(tepBiDanh, null)
  if (!bd || bd.ngay !== ngay || !laDoiTuong(bd.bang)) throw new LoiBoNao(`Chưa có dữ liệu ngày ${ngay} (thiếu bảng bí danh) — chạy trước: node scripts/bo-nao/lay.mjs ${ngay}`, 5)
  const bang = bd.bang
  const dao = new Map(Object.entries(bang).map(([b, s]) => [String(s), b]))
  const the = docTheDaLay(thuMuc)
  const { phanTu: phanTuAi, loiTep } = docThuMucRa(join(thuMuc, 'ra'))
  // lời mời quay lại do THUẬT TOÁN soạn (em vắng 2–4 ngày): nộp cùng kết quả của AI; AI có phần tử cho em nào thì phần tử AI thắng
  const coAi = new Set(phanTuAi.map((p) => (laDoiTuong(p.x) && typeof p.x.biDanh === 'string' ? p.x.biDanh : null)))
  const phanTu = [...phanTuAi, ...docTuDong(thuMuc).filter((p) => !coAi.has(typeof p.x.biDanh === 'string' ? p.x.biDanh : null))]
  const lopTep = docJsonNeuCo(join(thuMuc, 'lop.json'), null)
  const lop = lopTep && laDoiTuong(lopTep.lop) ? lopTep.lop : {}

  const { hopLe, loai } = kiemCacEm(phanTu, bang, the)
  const bt = kiemBanTinCucBo(join(thuMuc, 'ra', 'lop.json'), lop, bang)

  if (phanTu.length === 0 && !bt.banTin) {
    throw new LoiBoNao(`Không có gì để nộp: thư mục bo-nao/${ngay}/ra/ chưa có tệp kết quả hợp lệ${loiTep.length ? ` (${loiTep[0]})` : ''}.`, 6)
  }
  if (bt.ghiChu) loiTep.push(bt.ghiChu)

  const lo = chiaTep(hopLe, TOI_DA_MOI_LUOT_NOP)
  if (lo.length === 0 && bt.banTin) lo.push([]) // chỉ có bản tin
  // (không còn phần tử hợp lệ và không có bản tin ⇒ không gọi máy chủ: lo rỗng)
  let nhan = 0
  let chiGhiSo = 0
  let soApDung = 0
  let biLoaiMayChu = 0
  const loaiMayChu = []
  const canhBao = hopLe.filter((h) => h.canhBao.length).map((h) => ({ biDanh: h.biDanh, canhBao: h.canhBao }))
  let banTinKq = { nhan: 0, loi: [...bt.loi], canhBao: [...(bt.canhBao ?? [])] }
  for (let i = 0; i < lo.length; i++) {
    const cuoi = i === lo.length - 1
    const than = { ngay, cacEm: lo[i].map(({ sbd, dauRa }) => {
      const { biDanh: _b, ...con } = dauRa
      void _b
      return { sbd, ...con }
    }) }
    if (cuoi && bt.banTin) than.banTin = bt.banTin // bản tin đi cùng lô CUỐI: số đếm ở máy chủ tính lại từ bảng nên đúng cả khi nộp nhiều lô
    const r = await goi('/ai/dieu-chinh/nop', than)
    nhan += Number(r.nhan) || 0
    chiGhiSo += Number(r.chiGhiSo) || 0
    soApDung += Number(r.soApDung) || 0
    biLoaiMayChu += Number(r.biLoai) || 0
    for (const l of r.loai ?? []) loaiMayChu.push({ biDanh: dao.get(String(l.sbd)) ?? '?', lyDo: (l.lyDo ?? []).map((s) => giauSbd(s, dao)) })
    if (cuoi && r.banTin) banTinKq = { nhan: Number(r.banTin.nhan) || 0, loi: [...banTinKq.loi, ...(r.banTin.loi ?? []).map((s) => giauSbd(s, dao))], canhBao: [...banTinKq.canhBao, ...(r.banTin.canhBao ?? []).map((s) => giauSbd(s, dao))] }
  }

  const tomTat = {
    ngay,
    nopLuc: new Date(bayGio).toISOString(),
    soPhanTu: phanTu.length,
    tuDong: hopLe.filter((h) => h.tep === 'tu-dong/vang.json').length,
    nhan,
    chiGhiSo,
    soApDung,
    biLoaiCucBo: loai.length,
    biLoaiMayChu,
    loai: [...loai.map((l) => ({ biDanh: l.biDanh, lyDo: l.lyDo })), ...loaiMayChu],
    canhBao,
    banTin: banTinKq,
    loiTep,
  }
  ghiJson(join(thuMuc, 'nop-ket-qua.json'), tomTat, { dep: true })
  const lanCuoi = docJsonNeuCo(tepLanCuoi(goc), {}) ?? {}
  ghiJson(tepLanCuoi(goc), { ...lanCuoi, nopNgay: ngay, nopLuc: tomTat.nopLuc }, { dep: true })
  return tomTat
}

export function dongTomTat(kq) {
  const d = [
    `Nộp xong ngày ${kq.ngay}: nhận ${kq.nhan}/${kq.soPhanTu} phần tử (áp dụng ngay ${kq.soApDung} · chỉ ghi sổ ${kq.chiGhiSo}; ${kq.tuDong ?? 0} lời mời vắng do thuật toán soạn) · loại ${kq.biLoaiCucBo + kq.biLoaiMayChu} · cảnh báo ${kq.canhBao.length} · bản tin ${kq.banTin.nhan} dòng.`,
  ]
  const lyDo = [
    ...kq.loai.map((l) => `  Loại ${l.biDanh}: ${l.lyDo.join('; ').slice(0, 220)}`),
    ...kq.canhBao.map((c) => `  Cảnh báo ${c.biDanh}: ${c.canhBao.join('; ').slice(0, 220)}`),
    ...kq.banTin.loi.map((l) => `  ${l.slice(0, 220)}`),
    ...(kq.banTin.canhBao ?? []).map((l) => `  Cảnh báo ${l.slice(0, 210)}`),
    ...kq.loiTep.map((l) => `  Tệp: ${l}`),
  ]
  for (const l of lyDo.slice(0, SO_DONG_LOI_IN_TOI_DA)) d.push(l)
  if (lyDo.length > SO_DONG_LOI_IN_TOI_DA) d.push(`  … và ${lyDo.length - SO_DONG_LOI_IN_TOI_DA} dòng nữa trong bo-nao/${kq.ngay}/nop-ket-qua.json`)
  return d
}

async function main() {
  const doi = process.argv[2]
  if (doi && !laNgay(doi)) throw new LoiBoNao(`Ngày phải có dạng YYYY-MM-DD (nhận "${String(doi).slice(0, 20)}").`, 1)
  const ngay = doi || homNayVn()
  const { ma, canhBao } = docMaBiMat()
  if (canhBao) console.log(canhBao)
  const kq = await chayNop({ ngay, goi: taoGoiMayChu({ ma }) })
  for (const d of dongTomTat(kq)) console.log(d)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e instanceof LoiBoNao ? e.message : `Lỗi không lường trước: ${String(e && e.message ? e.message : e).slice(0, 200)}`)
    process.exit(e instanceof LoiBoNao ? e.maThoat : 9)
  })
}
