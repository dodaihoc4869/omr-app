#!/usr/bin/env node
// BỘ NÃO — MÃ LỆNH 2/2: KIỂM KHUÔN + ĐỔI BÍ DANH + NỘP (Code 1, 21/09/2026).   Dùng: node scripts/bo-nao/nop.mjs <YYYY-MM-DD>
//
// Đọc `bo-nao/<ngày>/ra/*.json` (mỗi tệp là MẢNG các phần tử đúng KHUÔN `DauRaEm`; `ra/lop.json` = bản tin sáng `{cacDong:[…]}`), kiểm khuôn TẠI MÁY THẦY bằng đúng `kiemKhuon`/`kiemBanTin`
// mà máy chủ sẽ chạy LẦN NỮA, đổi bí danh → SBD (bảng `.bi-danh.json`), rồi nộp `/ai/dieu-chinh/nop` theo lô ≤ 100 em.
// Phần tử sai khuôn bị BỎ (không sửa hộ) và báo lý do bằng bí danh. In CHỈ số đếm + lý do ngắn; không in SBD, không in lời nhắn, không in dữ liệu thẻ.
// Nộp lại nhiều lần vô hại (máy chủ ghi đè theo (em, ngày)).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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
  ghiChu,
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
    hopLe.push({ biDanh: b, sbd: bang[b], dauRa: x, canhBao: k.canhBao ?? [], boLoi: k.boLoi ?? [], tep })
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

// ══════════════════════════════ LƯỢT CHIỀU: THỬ THÁCH RIÊNG ══════════════════════════════

/** Phần tử chiều của AI (`{biDanh, doTinCay, thuThach, loiMoi}`) → phần tử ĐẦY ĐỦ khuôn `DauRaEm`: núm RỖNG, không lời nhắn — chỉ mang thử thách. Khoá thừa của AI bị bỏ. */
export function moRongPhanTuChieu(x) {
  if (!laDoiTuong(x)) return x
  return {
    biDanh: x.biDanh,
    doTinCay: x.doTinCay,
    nhip: { lech: 0, khoiDong: 2 },
    dang: [],
    khacPhuc: [],
    co: 'khong',
    loiNhanChoEm: '',
    loiNhanChoPhuHuynh: '',
    thuTuan: '',
    goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' },
    ghiChuHlv: 'Lượt chiều: chỉ thử thách riêng hôm nay',
    canSau: false,
    thuThach: x.thuThach,
    loiMoi: x.loiMoi,
  }
}

const thuMucChieu = (goc, ngay) => join(goc, ngay, 'chieu')
const soTrongLoi = (chu) => [...new Set(String(chu).match(/\d+(?:[.,]\d+)?/g) ?? [])].join(', ') || 'không có'

/** Bản XEM TRƯỚC dạng chữ để người chạy đọc (KHÔNG có SBD, KHÔNG có tên — chỉ bí danh). */
export function soanXemTruoc({ ngay, hopLe, loai, tao }) {
  const d = [
    `# XEM TRƯỚC — LƯỢT CHIỀU ${ngay} (CHƯA NỘP)`,
    '',
    `Tạo lúc ${tao} · ${hopLe.length} em hợp lệ · ${loai.length} em bị loại. Đọc từng lời; ưng thì nộp bằng: \`bash scripts/bo-nao/chay-chieu.sh --nop ${ngay}\`. Chưa ưng: sửa/xoá phần tử trong \`bo-nao/${ngay}/chieu/ra/\` rồi chạy lại \`--xem-truoc\`.`,
    '',
    '## Hợp lệ',
  ]
  hopLe.forEach((h, i) => {
    const t = h.dauRa.thuThach
    d.push(`${i + 1}. **${h.biDanh}** · dạng ${t.dang.join(' + ')} · ${t.bac === 'dung_bac' ? 'đúng bậc' : t.bac === 'thap_hon_mot_bac' ? 'thấp hơn một bậc' : 'cao hơn một bậc'} · muốn ${t.soCau} câu · tin cậy ${h.dauRa.doTinCay}`)
    d.push(`   > ${h.dauRa.loiMoi}`)
    d.push(`   (số trong lời: ${soTrongLoi(h.dauRa.loiMoi)}; máy đã kiểm đều có trong thẻ)`)
  })
  if (!hopLe.length) d.push('(không có em nào hợp lệ)')
  d.push('', '## Bị loại')
  for (const l of loai) d.push(`- **${l.biDanh}**: ${l.lyDo.join('; ').slice(0, 300)}`)
  if (!loai.length) d.push('(không có)')
  return d.join('\n') + '\n'
}

/** Nhóm LÝ DO bị loại (mỗi em tính MỘT lần theo lý do đầu tiên khớp) — để báo cáo gọn cho thầy. */
const NHOM_LY_DO = [
  [/số không có trong thẻ/, 'số không có trong thẻ'],
  [/ít nhất một con số/, 'thiếu số thật'],
  [/nêu số câu/, 'nêu số câu sẽ làm'],
  [/từ cấm/, 'từ cấm (nhãn năng lực, so với bạn…)'],
  [/hứa điều|gọi tên/, 'hứa điều không chắc / gọi tên'],
  [/nói ra điều/, 'nói điều "biết" về em'],
  [/tên riêng|nhắc thú/, 'tên thú / tên riêng lạ'],
  [/thiếu thuThach|đi cùng nhau/, 'thiếu thuThach hoặc loiMoi'],
  [/cao_hon_mot_bac|tran_an|nhãn ngan/, 'bậc / số câu không hợp nhãn'],
  [/thuThach|soCau|dạng|khoá lạ/, 'sai khuôn thử thách'],
  [/bí danh|trùng em|thẻ của em/, 'phần tử lạ / trùng'],
]
export const nhomLyDo = (lyDo) => {
  const chu = (Array.isArray(lyDo) ? lyDo : [String(lyDo)]).join(' | ')
  for (const [re, ten] of NHOM_LY_DO) if (re.test(chu)) return ten
  return 'lý do khác'
}

/**
 * BÁO CÁO LƯỢT CHIỀU cho thầy đọc trên bảng tin — ĐÚNG 6 DÒNG, ẩn danh: (1) số em được mời · (2) số lời bị loại và vì sao · (3) bậc / số câu · (4–6) ba lời mẫu (chọn rải đều, không có bí danh).
 * `daNop` false ⇒ bản DỰ KIẾN (xem trước). `soChuaChonThu` = số em được mời mà chưa có thần thú. Không SBD, không tên, không bí danh.
 */
export function soanBaoCaoChieu({ ngay, hopLe, loai, daNop = false, nhan = 0, soApDung = 0, soChuaChonThu = 0 }) {
  const n = hopLe.length
  const bac = { dung_bac: 0, thap_hon_mot_bac: 0, cao_hon_mot_bac: 0 }
  let tongCau = 0
  for (const h of hopLe) {
    const t = h.dauRa.thuThach
    bac[t.bac] = (bac[t.bac] ?? 0) + 1
    tongCau += t.soCau
  }
  const dem = new Map()
  for (const l of loai) dem.set(nhomLyDo(l.lyDo), (dem.get(nhomLyDo(l.lyDo)) ?? 0) + 1)
  const lyDo = [...dem.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${v} vì ${k}`).join(' · ')
  const chi = n === 0 ? [] : [...new Set([0, Math.floor(n / 2), n - 1])]
  const mau = chi.map((i) => hopLe[i].dauRa.loiMoi)
  const ngayHt = `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
  const d = [
    `${daNop ? `Lượt chiều ${ngayHt}: ${nhan} em nhận lời mời thử thách riêng (${soApDung} áp dụng ngay)` : `Lượt chiều ${ngayHt} (DỰ KIẾN, chưa nộp): ${n} em sẽ nhận lời mời thử thách riêng`}${soChuaChonThu ? `, trong đó ${soChuaChonThu} em chưa chọn thú được mời chọn` : ''}.`,
    loai.length ? `${loai.length} lời bị loại: ${lyDo}.` : 'Không có lời nào bị loại.',
    n ? `Bậc: đúng bậc ${bac.dung_bac} · thấp hơn ${bac.thap_hon_mot_bac} · cao hơn ${bac.cao_hon_mot_bac}; máy chủ chọn câu, mỗi em khoảng ${Math.round(tongCau / n)} câu.` : 'Chưa có em nào được mời.',
  ]
  for (let k = 0; k < 3; k++) d.push(k < mau.length ? `Mẫu ${k + 1}: "${mau[k]}"` : `Mẫu ${k + 1}: (chưa có)`)
  return d.join('\n') + '\n'
}

/**
 * LƯỢT CHIỀU — kiểm khuôn + XEM TRƯỚC hoặc NỘP. `xemTruoc: true` ⇒ chỉ GHI `chieu/xem-truoc.md` + `xem-truoc.json`, KHÔNG gọi máy chủ. Nộp thật chỉ khi đã có bản xem trước và `ra/` không đổi sau nó.
 * Phần tử phải có ĐỦ `thuThach` + `loiMoi` và qua `kiemKhuon` (sai thử thách ⇒ loại, vì lượt chiều chỉ có việc này). Trả bản tóm tắt KHÔNG có SBD.
 */
export async function chayNopChieu({ ngay, goc = GOC_DU_LIEU, goi, bayGio = Date.now(), xemTruoc = false }) {
  const thuMuc = thuMucChieu(goc, ngay)
  const bd = docJsonNeuCo(join(thuMuc, '.bi-danh.json'), null)
  if (!bd || bd.ngay !== ngay || !laDoiTuong(bd.bang)) throw new LoiBoNao(`Chưa có dữ liệu lượt chiều ngày ${ngay} — chạy trước: node scripts/bo-nao/lay.mjs --chieu ${ngay}`, 5)
  const bang = bd.bang
  const the = docTheDaLay(thuMuc)
  const thuMucRa = join(thuMuc, 'ra')
  const { phanTu: phanTuAi, loiTep } = docThuMucRa(thuMucRa)
  if (phanTuAi.length === 0) throw new LoiBoNao(`Không có gì để ${xemTruoc ? 'xem trước' : 'nộp'}: bo-nao/${ngay}/chieu/ra/ chưa có tệp kết quả hợp lệ${loiTep.length ? ` (${loiTep[0]})` : ''}.`, 6)
  const { hopLe: qua, loai: loaiKhuon } = kiemCacEm(phanTuAi.map(({ tep, x }) => ({ tep, x: moRongPhanTuChieu(x) })), bang, the)
  const loai = [...loaiKhuon]
  const hopLe = []
  for (const h of qua) {
    if (h.boLoi.includes('thuThach')) loai.push({ biDanh: h.biDanh, tep: h.tep, lyDo: h.canhBao.filter((c) => c.startsWith('thuThach')).map((c) => c.replace(/^thuThach bị bỏ \(giữ núm\): /, '')) })
    else if (!h.dauRa.thuThach || !h.dauRa.loiMoi) loai.push({ biDanh: h.biDanh, tep: h.tep, lyDo: ['thiếu thuThach hoặc loiMoi — lượt chiều chỉ có việc này'] })
    else hopLe.push(h)
  }
  const soChuaChonThu = hopLe.filter((h) => !(the.get(h.biDanh)?.the?.thanThu && typeof the.get(h.biDanh).the.thanThu === 'object')).length
  const tao = new Date(bayGio).toISOString()
  const tomTat = { ngay, luc: tao, soPhanTu: phanTuAi.length, hopLe: hopLe.length, biLoai: loai.length, loai: loai.map((l) => ({ biDanh: l.biDanh, lyDo: l.lyDo })), loiTep }
  if (xemTruoc) {
    const tepMd = join(thuMuc, 'xem-truoc.md')
    ghiChu(tepMd, soanXemTruoc({ ngay, hopLe, loai, tao }))
    ghiJson(join(thuMuc, 'xem-truoc.json'), { ...tomTat, cacEm: hopLe.map((h) => ({ biDanh: h.biDanh, doTinCay: h.dauRa.doTinCay, thuThach: h.dauRa.thuThach, loiMoi: h.dauRa.loiMoi })) }, { dep: true })
    ghiChu(join(thuMuc, 'bao-cao.md'), soanBaoCaoChieu({ ngay, hopLe, loai, daNop: false, soChuaChonThu }))
    return { ...tomTat, daNop: false, tepXemTruoc: `bo-nao/${ngay}/chieu/xem-truoc.md`, tepBaoCao: `bo-nao/${ngay}/chieu/bao-cao.md` }
  }
  const tepXem = join(thuMuc, 'xem-truoc.json')
  if (!existsSync(tepXem)) throw new LoiBoNao('Chưa có bản xem trước: chạy trước `node scripts/bo-nao/nop.mjs --chieu --xem-truoc` rồi ĐỌC xem-truoc.md trước khi nộp.', 7)
  const moiNhat = Math.max(0, ...readdirSync(thuMucRa).filter((f) => f.endsWith('.json')).map((f) => statSync(join(thuMucRa, f)).mtimeMs))
  if (moiNhat > statSync(tepXem).mtimeMs) throw new LoiBoNao('Tệp trong ra/ đã đổi SAU bản xem trước — chạy lại --xem-truoc và đọc lại trước khi nộp.', 7)
  if (hopLe.length === 0) throw new LoiBoNao('Không có em nào hợp lệ để nộp (xem lý do ở xem-truoc.md).', 6)
  const dao = new Map(Object.entries(bang).map(([b, sbd]) => [String(sbd), b]))
  let nhan = 0
  let chiGhiSo = 0
  let soApDung = 0
  let biLoaiMayChu = 0
  const loaiMayChu = []
  for (const lo of chiaTep(hopLe, TOI_DA_MOI_LUOT_NOP)) {
    const r = await goi('/ai/dieu-chinh/nop', { ngay, cacEm: lo.map(({ sbd, dauRa }) => { const { biDanh: _b, ...con } = dauRa; void _b; return { sbd, ...con } }) })
    nhan += Number(r.nhan) || 0
    chiGhiSo += Number(r.chiGhiSo) || 0
    soApDung += Number(r.soApDung) || 0
    biLoaiMayChu += Number(r.biLoai) || 0
    for (const l of r.loai ?? []) loaiMayChu.push({ biDanh: dao.get(String(l.sbd)) ?? '?', lyDo: (l.lyDo ?? []).map((x) => giauSbd(x, dao)) })
  }
  const ketQua = { ...tomTat, luc: tao, nhan, chiGhiSo, soApDung, biLoaiMayChu, loai: [...tomTat.loai, ...loaiMayChu] }
  ghiJson(join(thuMuc, 'nop-ket-qua.json'), ketQua, { dep: true })
  ghiChu(join(thuMuc, 'bao-cao.md'), soanBaoCaoChieu({ ngay, hopLe, loai: ketQua.loai.map((l) => ({ lyDo: l.lyDo })), daNop: true, nhan, soApDung, soChuaChonThu }))
  return { ...ketQua, daNop: true, tepBaoCao: `bo-nao/${ngay}/chieu/bao-cao.md` }
}

export function dongTomTatChieu(kq) {
  const d = kq.daNop
    ? [`Nộp xong LƯỢT CHIỀU ${kq.ngay}: nhận ${kq.nhan}/${kq.hopLe} em (áp dụng ngay ${kq.soApDung} · chỉ ghi sổ ${kq.chiGhiSo}) · loại ${kq.biLoai + kq.biLoaiMayChu} em.`]
    : [`Xem trước LƯỢT CHIỀU ${kq.ngay}: ${kq.hopLe} em hợp lệ · loại ${kq.biLoai} em — CHƯA NỘP. Đọc ${kq.tepXemTruoc} rồi nộp bằng: bash scripts/bo-nao/chay-chieu.sh --nop ${kq.ngay}`]
  for (const l of kq.loai.slice(0, SO_DONG_LOI_IN_TOI_DA)) d.push(`  Loại ${l.biDanh}: ${l.lyDo.join('; ').slice(0, 220)}`)
  if (kq.loai.length > SO_DONG_LOI_IN_TOI_DA) d.push(`  … và ${kq.loai.length - SO_DONG_LOI_IN_TOI_DA} em nữa (xem xem-truoc.md).`)
  for (const l of kq.loiTep) d.push(`  Tệp: ${l}`)
  if (kq.tepBaoCao) d.push(`  Báo cáo 6 dòng cho thầy (bảng tin): ${kq.tepBaoCao}`)
  return d
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
  const args = process.argv.slice(2)
  const chieu = args.includes('--chieu')
  const xemTruoc = args.includes('--xem-truoc')
  if (xemTruoc && !chieu) throw new LoiBoNao('--xem-truoc chỉ dùng cùng --chieu.', 1)
  const doi = args.find((a) => !a.startsWith('--'))
  if (doi && !laNgay(doi)) throw new LoiBoNao(`Ngày phải có dạng YYYY-MM-DD (nhận "${String(doi).slice(0, 20)}").`, 1)
  const ngay = doi || homNayVn()
  if (chieu && xemTruoc) {
    // xem trước KHÔNG gọi máy chủ ⇒ không cần (và không đọc) mã bí mật
    for (const d of dongTomTatChieu(await chayNopChieu({ ngay, xemTruoc: true }))) console.log(d)
    return
  }
  const { ma, canhBao } = docMaBiMat()
  if (canhBao) console.log(canhBao)
  if (chieu) {
    for (const d of dongTomTatChieu(await chayNopChieu({ ngay, goi: taoGoiMayChu({ ma }) }))) console.log(d)
    return
  }
  const kq = await chayNop({ ngay, goi: taoGoiMayChu({ ma }) })
  for (const d of dongTomTat(kq)) console.log(d)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e instanceof LoiBoNao ? e.message : `Lỗi không lường trước: ${String(e && e.message ? e.message : e).slice(0, 200)}`)
    process.exit(e instanceof LoiBoNao ? e.maThoat : 9)
  })
}
