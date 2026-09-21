#!/usr/bin/env node
// BỘ MÔ PHỎNG TỰ KIỂM · BÀI TẬP VỀ NHÀ "NÂNG ĐỠ" (Code 1, 21/09/2026; Boss giao).
// Mục đích: mỗi lần đổi LÕI (`src/lib/btvn-nang-do.ts`) hoặc LỊCH (`src/lib/btvn-nang-do-lich.ts`) thì chạy lại MỘT lệnh này và thấy ngay
// em nào bị thiệt — không cần dựng D1, không đọc máy chủ, không đồng hồ, không mạng: THUẦN, cùng tham số ⇒ cùng bảng (có dấu vân tay để so hai lần chạy).
//
//   npm run mo-phong:btvn                 (hoặc: node scripts/mo-phong-btvn.mjs)
//   node scripts/mo-phong-btvn.mjs --bai 113x29 --em 300 --han 12:00 --luoi 30
//
// Đường ống mô phỏng Y HỆT máy chủ (`nganSachVaSucChua` + `dungBoChoEm` + `xepLichChoBo` ở server/src/btvn-nang-do-d1.ts):
//   sucChua → nganSachHanNgan(…, soLoi) → chonBoCuaEm → xepLichChang (soCauTungChang từ bộ) → cheDoLich.
// Em giả: tốc độ 8–16 câu/ngày, 60–150 giây/câu, ôn lại ≤ 40 %; hồ sơ 3 kiểu (mới · trung bình · nhiều dạng yếu). MỖI EM giữ nguyên hồ sơ ở mọi thời điểm mở
// (nên so "mở sớm" với "mở muộn" là so CÙNG MỘT EM). Bài giả dựng theo dải bài thật sáng 21/09 (78–174 câu, 16–51 dạng) — chưa có số thật từng bài
// thì sửa BAI_MAU hoặc truyền `--bai <số câu>x<số dạng>,…`.
//
// Cột của bảng (mỗi dòng = một thời điểm mở, tính trên tất cả em giả):
//   chế độ      số em rơi vào hạn DÀI (một chặng mỗi buổi tối) / hạn NGẮN (chia theo giờ trong cửa sổ 20:00–23:59)
//   bắt buộc    số câu BẮT BUỘC của em: nhỏ nhất / giữa / lớn nhất (không gồm "thử sức thêm")
//   thử sức     số câu "thử sức thêm — không bắt buộc": giữa / lớn nhất
//   chặng       số chặng: nhỏ nhất–lớn nhất · chặng lớn nhất (số câu; số phút ước tính theo giây/câu của em ấy)
//   chặng nặng  số em có ≥ 1 chặng > 20 câu hoặc > 40 phút (`laChangNang` ở btvn-nang-do-lich.ts — cùng ngưỡng máy em và Xem trước; cảnh báo)
//   yếu thiếu   số em có dạng YẾU mà bộ ít hơn 2 câu ở dạng ấy (bị thiệt — cảnh báo, không phải lỗi: hạn ngắn cắt phần riêng là theo thiết kế)
//   tối nặng    số em có buổi tối phải làm > 1,5 × ngân sách/ngày (lõi ép; `canhBaoHanNgan` báo thầy — cảnh báo)
// Sau bảng là các phép KIỂM (lỗi ⇒ in ví dụ + thoát mã 1): bộ không rỗng · không trùng câu · lõi bắt buộc đủ · số đếm khớp · lịch hợp lệ · chặng cuối không
// mở ngày hạn (khi hạn trước cửa sổ học) · ĐƠN ĐIỆU (mở muộn không nhận nhiều câu hơn mở sớm, cùng một em) · tất định · thích nghi sau chặng giữ lõi.
import { registerHooks } from 'node:module'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { parseArgs } from 'node:util'

// Node ≥ 22.15 chạy được .ts (bỏ kiểu) nhưng đòi đuôi tệp; lõi import './exam-shuffle' không đuôi ⇒ móc thêm ".ts" khi không tìm thấy.
registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx)
    } catch (e) {
      if (/^\.\.?\//.test(spec) && !/\.[cm]?[jt]sx?$/.test(spec)) return next(`${spec}.ts`, ctx)
      throw e
    }
  },
})
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const nap = (t) => import(pathToFileURL(join(GOC, 'src', 'lib', t)).href)
const { chonLoi, chonBoCuaEm, thichNghiChangSau, maDangCua, BTVN_NANG_DO } = await nap('btvn-nang-do.ts')
const { sucChua, nganSachHanNgan, xepLichChang, cheDoLich, laChangNang, LICH_CHANG } = await nap('btvn-nang-do-lich.ts')
const { mulberry32 } = await nap('exam-shuffle.ts')

// ══════════════════════════════ THAM SỐ ══════════════════════════════

/** Dải bài thật sáng 21/09 (Boss): 7 bài, 78–174 câu, 16–51 dạng. Số cụ thể là GIẢ LẬP trong dải ấy (113×29 là bài ví dụ của Boss). */
const BAI_MAU = [[78, 16], [92, 24], [104, 27], [113, 29], [131, 36], [152, 44], [174, 51]]
/** Bốn thời điểm mở mặc định (so với ngày giao): `[+ngày@]HH:MM` giờ Việt Nam. Sớm nhất → muộn nhất. */
const MO_MAC_DINH = ['20:30', '+1@21:00', '+2@20:30', '+2@23:00']

const { values: v } = parseArgs({
  options: {
    bai: { type: 'string' },
    em: { type: 'string', default: '200' },
    seed: { type: 'string', default: '21092026' },
    giao: { type: 'string', default: '2026-09-21' },
    'so-ngay': { type: 'string', default: '3' },
    han: { type: 'string', default: '12:00,23:59' },
    mo: { type: 'string', default: MO_MAC_DINH.join(',') },
    luoi: { type: 'string', default: '0' },
    ghim: { type: 'string', default: '0' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})
if (v.help) {
  console.log(`Cách dùng: node scripts/mo-phong-btvn.mjs [--bai 113x29,174x51] [--em 200] [--seed 21092026] [--giao 2026-09-21] [--so-ngay 3]
                                [--han 12:00,23:59] [--mo "20:30,+1@21:00,+2@20:30,+2@23:00"] [--luoi 30] [--ghim 0] [--json]
  --luoi <phút>  thêm quét MỊN: mỗi em mở ở mọi mốc cách nhau chừng này phút từ lúc giao tới trước hạn 1 giờ, kiểm đơn điệu (chậm hơn)
  --ghim <n>     thầy ghim n câu ngẫu nhiên (câu ghim luôn bắt buộc với mọi em)
  --json         in kết quả dạng JSON (không in bảng)`)
  process.exit(0)
}
const SO_EM = Math.max(1, Math.floor(Number(v.em)) || 200)
const SEED = Math.floor(Number(v.seed)) || 21092026
const SO_NGAY_HAN = Math.max(1, Math.floor(Number(v['so-ngay'])) || 3)
const LUOI_PHUT = Math.max(0, Math.floor(Number(v.luoi)) || 0)
const SO_GHIM = Math.max(0, Math.floor(Number(v.ghim)) || 0)
if (!/^\d{4}-\d{2}-\d{2}$/.test(v.giao) || !Number.isFinite(Date.parse(`${v.giao}T00:00:00+07:00`))) throw new Error(`--giao phải có dạng YYYY-MM-DD: ${v.giao}`)
const BAI = v.bai
  ? v.bai.split(',').map((s) => {
      const m = /^(\d+)x(\d+)$/.exec(s.trim())
      if (!m || Number(m[1]) < 1 || Number(m[2]) < 1 || Number(m[2]) > Number(m[1])) throw new Error(`--bai sai dạng "<số câu>x<số dạng>" (số dạng ≤ số câu): ${s}`)
      return [Number(m[1]), Number(m[2])]
    })
  : BAI_MAU

const MS_NGAY = 86_400_000
const vn = (ngay, gio) => Date.parse(`${ngay}T${gio}:00+07:00`)
const themNgay = (ngay, k) => new Date(Date.parse(`${ngay}T12:00:00+07:00`) + k * MS_NGAY).toISOString().slice(0, 10) // 12:00 VN ⇒ không lệch múi
const ngayVn = (ms) => Math.floor((ms + 7 * 3_600_000) / MS_NGAY)
const HANS = v.han.split(',').map((g) => {
  if (!/^\d{1,2}:\d{2}$/.test(g.trim())) throw new Error(`--han phải là danh sách HH:MM: ${g}`)
  return g.trim().padStart(5, '0')
})
const MOS = v.mo.split(',').map((s) => {
  const m = /^(?:\+(\d+)@)?(\d{1,2}:\d{2})$/.exec(s.trim())
  if (!m) throw new Error(`--mo phải là danh sách [+ngày@]HH:MM: ${s}`)
  return { nhan: s.trim(), ms: vn(themNgay(v.giao, Number(m[1] ?? 0)), m[2].padStart(5, '0')) }
})
MOS.sort((a, b) => a.ms - b.ms)

// ══════════════════════════════ DỰNG BÀI VÀ EM GIẢ ══════════════════════════════

const chon = (rnd, ds) => {
  let r = rnd() * ds.reduce((s, x) => s + x[1], 0)
  for (const [gt, w] of ds) if ((r -= w) < 0) return gt
  return ds[ds.length - 1][0]
}
const rndInt = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1))

/** Bài giả `n` câu, `d` dạng: cỡ dạng ngẫu nhiên (≥ 1 câu), mức Biết/Hiểu/Vận dụng ≈ 45/35/20, sao 0/1/2 ≈ 30/40/30, Phần I/II/III ≈ 75/15/10, ~2 % câu thiếu mã dạng. */
function dungBai(n, d, hat) {
  const rnd = mulberry32(hat)
  const co = Array.from({ length: d }, () => 1)
  for (let i = d; i < n; i++) co[Math.floor(rnd() * d)]++
  const cau = []
  let dem = 0
  co.forEach((soCau, di) => {
    for (let k = 0; k < soCau; k++) {
      dem++
      cau.push({
        qid: `Q${String(dem).padStart(3, '0')}`,
        dang: rnd() < 0.02 ? null : `D${di}`,
        chuyenDe: `CD${di % 7}`,
        mucDo: chon(rnd, [[0, 45], [1, 35], [2, 20]]),
        sao: chon(rnd, [[0, 30], [1, 40], [2, 30]]),
        phan: chon(rnd, [['I', 75], ['II', 15], ['III', 10]]),
      })
    }
  })
  return cau
}

/** Em giả: hồ sơ (3 kiểu) + tốc độ. Cố định theo (seed, bài, số thứ tự) ⇒ mọi thời điểm mở/hạn dùng cùng một em. */
function dungEm(cau, hat, i) {
  const rnd = mulberry32(hat ^ Math.imul(i + 1, 0x9e3779b1))
  const kieu = chon(rnd, [['moi', 25], ['tb', 40], ['yeu', 35]])
  const dang = {}
  for (const c of cau) {
    const ma = maDangCua(c)
    if (dang[ma] || (ma in dang)) continue
    const pCo = kieu === 'moi' ? 0 : kieu === 'tb' ? 0.6 : 0.9
    if (rnd() >= pCo) continue
    const soGap = rndInt(rnd, 1, 9)
    const pSai = kieu === 'yeu' ? 0.2 + rnd() * 0.6 : rnd() * 0.4
    const soSai = Math.min(soGap, Math.round(soGap * pSai))
    dang[ma] = { bac: chon(rnd, [[0, 45], [1, 35], [2, 20]]), soGap, soSai, tiLeKhacPhuc: soGap >= BTVN_NANG_DO.SO_CAU_DU_TIN_DANG ? Math.max(0, Math.min(1, 1 - soSai / soGap + rnd() * 0.15)) : null }
  }
  const cauHs = {}
  const tiLeCau = kieu === 'moi' ? 0 : kieu === 'tb' ? 0.15 : 0.3
  for (const c of cau) {
    if (rnd() >= tiLeCau) continue
    cauHs[c.qid] = { trangThai: chon(rnd, [['chua_thay_sai', 30], ['moi_sai', 25], ['dang_on', 20], ['da_khac_phuc', 25]]), ngayDungKhacNhau: rndInt(rnd, 0, 3), lanSai: rndInt(rnd, 0, 2) }
  }
  const cauMoiNgay = rndInt(rnd, 8, 16)
  const toiHan = rndInt(rnd, 0, 8)
  return {
    sbd: `S${String(i + 1).padStart(3, '0')}`, kieu, hoSo: { dang, cau: cauHs }, cauMoiNgay,
    onLaiMoiNgay: Math.max(0, Math.min(toiHan, Math.floor(0.4 * cauMoiNgay))),
    giayMoiCau: chon(rnd, [[60, 15], [75, 25], [90, 30], [120, 20], [150, 10]]),
  }
}

// ══════════════════════════════ ĐƯỜNG ỐNG Y HỆT MÁY CHỦ ══════════════════════════════

/** Một em mở lúc `chotMs`, hạn `hanMs` ⇒ { bo, ns, sc, lich, cheDo, p }. Ném lỗi thời gian ra ngoài cho người gọi bắt. */
function chayEm(bai, em, chotMs, hanMs) {
  const chotLuc = new Date(chotMs).toISOString()
  const hanNop = new Date(hanMs).toISOString()
  const q = { chotLuc, hanNop, cauMoiNgay: em.cauMoiNgay, onLaiMoiNgay: em.onLaiMoiNgay, giayMoiCau: em.giayMoiCau }
  const sc = sucChua(q)
  const ns = nganSachHanNgan(sc, q, bai.loi.length)
  const bo = chonBoCuaEm(bai.cau, bai.loi, em.hoSo, ns, `${bai.hat}|${em.sbd}`, undefined, bai.ghim.length ? { ghim: bai.ghim } : {})
  const p = { ...q, soCauTungChang: bo.chang.map((c) => c.length) }
  return { bo, ns, sc, lich: xepLichChang(p), cheDo: cheDoLich(p), q }
}

/** Số dạng YẾU của em mà bộ ít hơn min(2, số câu KHẢ DỤNG của dạng) câu (khả dụng = chưa bị bỏ vì em đã đúng lại ≥ 2 ngày). Dạng bài chỉ có 1 câu không tính là thiệt. */
function dangYeuThieu(bai, em, bo) {
  const co = new Set(bo.chang.flat())
  let thieu = 0
  for (const [ma, ds] of bai.dangCau) {
    const d = em.hoSo.dang[ma]
    if (!(d && d.soGap >= BTVN_NANG_DO.SO_CAU_DU_TIN_DANG && d.tiLeKhacPhuc !== null && d.tiLeKhacPhuc < BTVN_NANG_DO.NGUONG_DANG_YEU)) continue
    const khaDung = ds.filter((c) => !((em.hoSo.cau[c.qid]?.ngayDungKhacNhau ?? 0) >= BTVN_NANG_DO.NGAY_DUNG_LAI_BO)).length
    if (ds.filter((c) => co.has(c.qid)).length < Math.min(BTVN_NANG_DO.DANG_YEU_TOI_THIEU_CAU, khaDung)) thieu++
  }
  return thieu
}

// ══════════════════════════════ KIỂM ══════════════════════════════

const KIEM = [
  ['bo-rong', 'bộ không rỗng (≥ 1 chặng, mọi chặng ≥ 1 câu)'],
  ['trung', 'không trùng câu (chặng + thử sức thêm), mọi câu thuộc bài'],
  ['loi', 'lõi bắt buộc nằm ĐỦ trong các chặng, và lõi chung của bộ = lõi của bài (mọi em cùng lõi)'],
  ['dem', 'số đếm khớp (tong = Σ chặng = lõi + riêng + thử thách; số chặng ≤ ngân sách chặng)'],
  ['lich', 'lịch hợp lệ (đủ chặng, chặng 0 mở lúc chốt, giờ mở không lùi, không mở sau hạn, đúng nhịp ≤ hạn)'],
  ['cuoi-han', 'chặng cuối không mở NGÀY HẠN khi giờ hạn trước cửa sổ học (hạn 12:00 ⇒ tối hôm trước là muộn nhất)'],
  ['don-dieu', 'ĐƠN ĐIỆU: cùng một em, mở muộn hơn KHÔNG nhận nhiều câu bắt buộc hơn mở sớm'],
  ['tat-dinh', 'tất định: chọn lại lần hai ra đúng bộ cũ'],
  ['thich-nghi', 'thích nghi sau chặng đầu: chặng đã mở nguyên, lõi ở lại, không trùng'],
]
const loi = Object.fromEntries(KIEM.map(([k]) => [k, { n: 0, vd: [] }]))
const baoLoi = (k, mo, chiTiet) => {
  loi[k].n++
  if (loi[k].vd.length < 3) loi[k].vd.push(`${mo} — ${chiTiet}`)
}
let soPhepKiem = 0

const trung = (a) => a.length - new Set(a).size
const trungNhau = (a, b) => a.some((x) => b.includes(x))

function kiemMotBo(mo, bai, em, r, hanMs, chotMs) {
  const { bo, ns, lich } = r
  const batBuoc = bo.chang.flat()
  const tatCa = [...batBuoc, ...bo.thuSucThem]
  const thuocBai = new Set(bai.cau.map((c) => c.qid))
  soPhepKiem++
  if (bo.chang.length < 1 || bo.chang.some((c) => c.length < 1) || bo.tomTat.tong < 1) baoLoi('bo-rong', mo, `${em.sbd}: ${bo.chang.length} chặng, cỡ [${bo.chang.map((c) => c.length).join(',')}]`)
  if (trung(tatCa) > 0 || tatCa.some((q) => !thuocBai.has(q))) baoLoi('trung', mo, `${em.sbd}: trùng ${trung(tatCa)} câu / có câu lạ`)
  const thieuLoi = bai.loi.filter((q) => !bo.thuSucThem.includes(q) && !batBuoc.includes(q))
  if (thieuLoi.length) baoLoi('loi', mo, `${em.sbd}: thiếu lõi ${thieuLoi.slice(0, 3).join(',')}`)
  if (JSON.stringify(bo.loi) !== JSON.stringify(bai.loi)) baoLoi('loi', mo, `${em.sbd}: lõi chung của bộ khác lõi của bài (${bo.loi.length} ≠ ${bai.loi.length} câu)`)
  const t = bo.tomTat
  if (t.tong !== batBuoc.length || t.soChang !== bo.chang.length || t.soLoi + t.soRieng + t.soThuThach !== t.tong || bo.chang.length > Math.max(1, ns.soNgay))
    baoLoi('dem', mo, `${em.sbd}: tong ${t.tong}/${batBuoc.length} · chặng ${t.soChang}/${bo.chang.length} (ngân sách ${ns.soNgay}) · ${t.soLoi}+${t.soRieng}+${t.soThuThach}`)
  // lịch
  const moLuc = lich.map((l) => Date.parse(l.moLuc))
  const hong = []
  if (lich.length !== bo.chang.length) hong.push(`${lich.length} mốc cho ${bo.chang.length} chặng`)
  else {
    if (moLuc[0] !== chotMs) hong.push('chặng 0 không mở lúc chốt')
    for (let k = 1; k < moLuc.length; k++) if (moLuc[k] < moLuc[k - 1]) hong.push(`mở lùi ở chặng ${k}`)
    for (let k = 1; k < moLuc.length; k++) if (moLuc[k] >= hanMs) hong.push(`chặng ${k} mở sau hạn`)
    for (const l of lich) if (Date.parse(l.dungNhipTruoc) > hanMs) hong.push(`đúng nhịp ${l.chiSo} quá hạn`)
  }
  if (hong.length) baoLoi('lich', mo, `${em.sbd}: ${hong.slice(0, 2).join('; ')}`)
  const gioHan = (((hanMs + 7 * 3_600_000) % MS_NGAY) + MS_NGAY) % MS_NGAY / 60_000
  const dauCuaSo = Number(LICH_CHANG.CUA_SO_TU.slice(0, 2)) * 60 + Number(LICH_CHANG.CUA_SO_TU.slice(3))
  if (lich.length >= 2 && gioHan < dauCuaSo) {
    const cuoi = moLuc[lich.length - 1]
    if (ngayVn(cuoi) >= ngayVn(hanMs)) baoLoi('cuoi-han', mo, `${em.sbd}: chặng cuối mở ${new Date(cuoi).toISOString()} cùng ngày hạn`)
  }
}

// ══════════════════════════════ CHẠY ══════════════════════════════

const trungVi = (a) => {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  return s[Math.floor((s.length - 1) / 2)]
}
const hoNhan = createHash('sha1')
const bang = []
const canhBaoTong = { yeuThieu: 0, toiNang: 0, changNang: 0 }
const thiet = []
const t0 = Date.now()

BAI.forEach(([n, d], bi) => {
  const hat = (SEED ^ Math.imul(bi + 1, 0x85ebca6b)) >>> 0
  const cau = dungBai(n, d, hat)
  const soDangThat = new Set(cau.map((c) => maDangCua(c))).size
  const rndGhim = mulberry32(hat ^ 0x51ed)
  const ghim = []
  while (ghim.length < Math.min(SO_GHIM, n)) {
    const q = cau[Math.floor(rndGhim() * n)].qid
    if (!ghim.includes(q)) ghim.push(q)
  }
  const dangCau = new Map()
  for (const c of cau) dangCau.set(maDangCua(c), [...(dangCau.get(maDangCua(c)) ?? []), c])
  const bai = { n, d: soDangThat, cau, ghim, dangCau, hat: `hg-${hat}`, loi: chonLoi(cau, ghim) }
  const dsEm = Array.from({ length: SO_EM }, (_, i) => dungEm(cau, hat, i))
  for (const gioHan of HANS) {
    const hanMs = vn(themNgay(v.giao, SO_NGAY_HAN), gioHan)
    const moHopLe = MOS.filter((m) => m.ms < hanMs - 3_600_000)
    /** tongTheoEm[i] = mảng tổng bắt buộc theo từng thời điểm mở (sớm → muộn) để kiểm đơn điệu. */
    const tongTheoEm = dsEm.map(() => [])
    moHopLe.forEach((m, mi) => {
      const nhan = `bài ${n}×${soDangThat} · hạn ${gioHan} · mở ${m.nhan}`
      const tong = [], batBuocTheoEm = [], thuSuc = [], soChang = [], changLon = [], phutLon = []
      let dai = 0, yeuThieu = 0, toiNang = 0, chiLoi = 0, changNang = 0, loiChay = 0
      dsEm.forEach((em, ei) => {
        let r
        try {
          r = chayEm(bai, em, m.ms, hanMs)
        } catch (e) {
          loiChay++
          if (loiChay <= 3) baoLoi('lich', nhan, `${em.sbd}: ném lỗi ${String(e?.message ?? e).slice(0, 80)}`)
          return
        }
        kiemMotBo(nhan, bai, em, r, hanMs, m.ms)
        hoNhan.update(JSON.stringify([bi, gioHan, mi, ei, r.bo.chang, r.bo.thuSucThem, r.lich.map((l) => l.moLuc)]))
        const { bo } = r
        tongTheoEm[ei][mi] = bo.tomTat.tong
        tong.push(bo.tomTat.tong)
        batBuocTheoEm.push(bo.tomTat.tong)
        thuSuc.push(bo.thuSucThem.length)
        soChang.push(bo.chang.length)
        const lon = Math.max(...bo.chang.map((c) => c.length))
        changLon.push(lon)
        if (bo.chang.some((c) => laChangNang(c.length, em.giayMoiCau))) changNang++
        phutLon.push(Math.ceil((lon * em.giayMoiCau) / 60))
        if (r.cheDo === 'dai') dai++
        const soThieu = dangYeuThieu(bai, em, bo)
        if (soThieu > 0) yeuThieu++
        if (bo.tomTat.soRieng + bo.tomTat.soThuThach === 0) chiLoi++
        thiet.push({ nhan, sbd: em.sbd, kieu: em.kieu, cauMoiNgay: em.cauMoiNgay, thieu: soThieu, phut: phutLon[phutLon.length - 1], lon, tong: bo.tomTat.tong, loi: bai.loi.length })
        // tối nặng: tổng câu các chặng CÙNG BUỔI TỐI (ngày VN của giờ mở) > 1,5 × ngân sách/ngày
        const theoNgay = new Map()
        r.lich.forEach((l, k) => theoNgay.set(ngayVn(Date.parse(l.moLuc)), (theoNgay.get(ngayVn(Date.parse(l.moLuc))) ?? 0) + (bo.chang[k]?.length ?? 0)))
        if (Math.max(...theoNgay.values()) > LICH_CHANG.HE_SO_QUA_TAI_LANH_MANH * em.cauMoiNgay) toiNang++
        // tất định (1/8 số em) + thích nghi (1/5 số em) — chỉ ở thời điểm mở ĐẦU của mỗi hạn cho gọn
        if (mi === 0 && ei % 8 === 0) {
          const lai = chonBoCuaEm(bai.cau, bai.loi, em.hoSo, r.ns, `${bai.hat}|${em.sbd}`, undefined, bai.ghim.length ? { ghim: bai.ghim } : {})
          soPhepKiem++
          if (JSON.stringify(lai) !== JSON.stringify(bo)) baoLoi('tat-dinh', nhan, `${em.sbd}: hai lần chọn ra hai bộ khác nhau`)
        }
        if (mi === 0 && ei % 5 === 0 && bo.chang.length >= 2) {
          const rnd = mulberry32(hat ^ Math.imul(ei + 7, 0x27d4eb2f))
          const dung = Object.fromEntries(bo.chang[0].map((q) => [q, rnd() < 0.6]))
          const k = thichNghiChangSau(bo, bai.cau, em.hoSo, 0, { dung }, { soChangDaMo: 1 })
          soPhepKiem++
          const moi = [...k.bo.chang.flat(), ...k.bo.thuSucThem]
          const hongTn = []
          if (JSON.stringify(k.bo.chang[0]) !== JSON.stringify(bo.chang[0])) hongTn.push('chặng đã mở bị đổi')
          if (trung(moi) > 0) hongTn.push(`trùng ${trung(moi)} câu`)
          const thieuLoiTn = bai.loi.filter((q) => !bo.thuSucThem.includes(q) && !k.bo.chang.flat().includes(q))
          if (thieuLoiTn.length) hongTn.push(`mất lõi ${thieuLoiTn.slice(0, 2).join(',')}`)
          if (k.bo.chang.length !== bo.chang.length) hongTn.push('đổi số chặng')
          if (hongTn.length) baoLoi('thich-nghi', nhan, `${em.sbd}: ${hongTn.join('; ')}`)
        }
      })
      canhBaoTong.yeuThieu += yeuThieu
      canhBaoTong.toiNang += toiNang
      canhBaoTong.changNang += changNang
      const daChay = tong.length
      const iLon = changLon.indexOf(Math.max(...changLon))
      bang.push({
        bai: `${n}×${soDangThat}`, loi: bai.loi.length, han: gioHan, mo: m.nhan, em: daChay, dai, ngan: daChay - dai,
        batBuoc: [Math.min(...tong), trungVi(tong), Math.max(...tong)],
        thuSuc: [trungVi(thuSuc), Math.max(...thuSuc)],
        soChang: [Math.min(...soChang), Math.max(...soChang)],
        changLon: [Math.max(...changLon), phutLon[iLon]],
        chiLoi, changNang, yeuThieu, toiNang,
      })
    })
    // ĐƠN ĐIỆU theo các thời điểm mở của bảng
    dsEm.forEach((em, ei) => {
      const a = tongTheoEm[ei]
      for (let k = 1; k < a.length; k++) {
        soPhepKiem++
        if (a[k] !== undefined && a[k - 1] !== undefined && a[k] > a[k - 1]) baoLoi('don-dieu', `bài ${n}×${soDangThat} · hạn ${gioHan}`, `${em.sbd} (${em.kieu}, ${em.cauMoiNgay} câu/ngày): mở ${moHopLe[k - 1].nhan} nhận ${a[k - 1]} câu, mở ${moHopLe[k].nhan} nhận ${a[k]} câu`)
      }
    })
    // Quét MỊN (tuỳ chọn): mỗi em, mọi mốc cách nhau `luoi` phút
    if (LUOI_PHUT > 0) {
      const t1 = hanMs - 3_600_000
      for (const em of dsEm) {
        let truoc = Infinity
        let moTruoc = 0
        for (let t = vn(v.giao, '08:00'); t <= t1; t += LUOI_PHUT * 60_000) {
          let r
          try {
            r = chayEm(bai, em, t, hanMs)
          } catch {
            continue
          }
          soPhepKiem++
          const tg = r.bo.tomTat.tong
          if (tg > truoc) baoLoi('don-dieu', `bài ${n}×${soDangThat} · hạn ${gioHan} · lưới ${LUOI_PHUT} phút`, `${em.sbd}: mở ${new Date(moTruoc).toISOString()} nhận ${truoc}, mở ${new Date(t).toISOString()} nhận ${tg}`)
          truoc = tg
          moTruoc = t
        }
      }
    }
  }
})

// ══════════════════════════════ IN KẾT QUẢ ══════════════════════════════

const soLoi = Object.values(loi).reduce((s, x) => s + x.n, 0)
const dauVanTay = hoNhan.digest('hex').slice(0, 10)
if (v.json) {
  console.log(JSON.stringify({ dauVanTay, soEm: SO_EM, seed: SEED, giao: v.giao, bang, loi: Object.fromEntries(KIEM.map(([k, ten]) => [k, { ten, n: loi[k].n, viDu: loi[k].vd }])), canhBao: canhBaoTong }, null, 1))
  process.exit(soLoi ? 1 : 0)
}
const ngayHienThi = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
console.log(`BỘ MÔ PHỎNG TỰ KIỂM · BTVN nâng đỡ — thuần, không đọc D1 · giao ${ngayHienThi(v.giao)} · hạn +${SO_NGAY_HAN} ngày · ${SO_EM} em giả/bài · seed ${SEED}`)
console.log(`Dấu vân tay bộ + lịch: ${dauVanTay} (đổi lõi mà số này KHÔNG đổi = mô phỏng không chạm tới chỗ vừa sửa; đổi ngoài ý muốn = so lại bảng)\n`)
let cuoi = ''
for (const b of bang) {
  const tieuDe = `BÀI ${b.bai} (${b.loi} câu lõi)  ·  hạn ${ngayHienThi(themNgay(v.giao, SO_NGAY_HAN))} ${b.han}`
  if (tieuDe !== cuoi) {
    if (cuoi) console.log('')
    console.log(tieuDe)
    console.log('  mở                dài/ngắn   bắt buộc nhỏ·giữa·lớn   thử sức giữa·lớn   chỉ lõi   chặng     chặng lớn nhất        chặng nặng  yếu thiếu   tối nặng')
    cuoi = tieuDe
  }
  const cot = (s, w) => String(s).padEnd(w)
  console.log(
    `  ${cot(b.mo, 17)}  ${cot(`${b.dai}/${b.ngan}`, 9)}  ${cot(b.batBuoc.join(' · '), 22)}  ${cot(b.thuSuc.join(' · '), 17)}  ${cot(`${b.chiLoi}/${b.em}`, 8)}  ${cot(b.soChang[0] === b.soChang[1] ? b.soChang[0] : b.soChang.join('–'), 8)}  ${cot(`${b.changLon[0]} câu · ${b.changLon[1]} phút`, 20)}  ${cot(`${b.changNang}/${b.em}`, 10)}  ${cot(`${b.yeuThieu}/${b.em}`, 10)}  ${b.toiNang}/${b.em}`,
  )
}
{
  const nhanEm = (x) => `${x.nhan} — ${x.sbd} (${x.kieu === 'yeu' ? 'nhiều dạng yếu' : x.kieu === 'tb' ? 'trung bình' : 'em mới'}, ${x.cauMoiNgay} câu/ngày): bắt buộc ${x.tong} câu (lõi ${x.loi}), chặng lớn nhất ${x.lon} câu ≈ ${x.phut} phút`
  const nang = [...thiet].sort((a, b) => b.phut - a.phut || b.lon - a.lon).slice(0, 3)
  const yeu = [...thiet].filter((x) => x.thieu > 0).sort((a, b) => b.thieu - a.thieu || a.tong - b.tong).slice(0, 3)
  console.log('\nEM BỊ THIỆT NHIỀU NHẤT (ví dụ để tra; số liệu, không phải lỗi):')
  for (const x of nang) console.log(`  · làm một mạch lâu nhất: ${nhanEm(x)}`)
  for (const x of yeu) console.log(`  · thiếu câu ở ${x.thieu} dạng yếu: ${nhanEm(x)}`)
}
console.log(`\nKIỂM (${soPhepKiem.toLocaleString('vi-VN')} phép, ${((Date.now() - t0) / 1000).toFixed(1)} giây):`)
for (const [k, ten] of KIEM) {
  console.log(`  ${loi[k].n === 0 ? '✓' : '✗'} ${ten}${loi[k].n ? ` — ${loi[k].n} vi phạm` : ''}`)
  for (const vd of loi[k].vd) console.log(`      ví dụ: ${vd}`)
}
console.log(`CẢNH BÁO (không tính lỗi — để thầy/Boss nhìn): ${canhBaoTong.yeuThieu} lượt em có dạng yếu bị thiếu câu · ${canhBaoTong.toiNang} lượt em có buổi tối nặng hơn 1,5 × ngân sách/ngày · ${canhBaoTong.changNang} lượt em có CHẶNG NẶNG (> ${LICH_CHANG.CHANG_NANG_CAU} câu hoặc > ${LICH_CHANG.CHANG_NANG_PHUT} phút — ngưỡng dùng chung với máy em và Xem trước)`)
console.log(soLoi === 0 ? '\nKẾT LUẬN: ĐẠT — mọi phép kiểm xanh.' : `\nKẾT LUẬN: TRƯỢT — ${soLoi} vi phạm ở ${KIEM.filter(([k]) => loi[k].n).length} phép kiểm (xem ví dụ ở trên).`)
process.exit(soLoi ? 1 : 0)
