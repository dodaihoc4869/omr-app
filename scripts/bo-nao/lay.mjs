#!/usr/bin/env node
// BỘ NÃO — MÃ LỆNH 1/2: LẤY DỮ LIỆU ĐÊM (Code 1, 21/09/2026).   Dùng: node scripts/bo-nao/lay.mjs [YYYY-MM-DD]
//
// Gọi máy chủ `/ai/*` (mã bí mật đọc từ ~/.omr-bo-nao/ma-bi-mat — KHÔNG in), lấy thẻ + hồ sơ MỌI em có hoạt động theo từng trang, ẩn danh (bí danh E001…) và ghi vào `bo-nao/<ngày>/`:
//   lop.json               bức tranh cả lớp + kết quả các điều chỉnh hôm qua (emNoiLen đã đổi sang bí danh)
//   vao/nhanh-01.json …    mỗi tệp ≤ 40 thẻ NGẮN (nén: ≤ ~1,2 KB/thẻ)
//   vao/sau-01.json …      mỗi tệp ≤ 12 hồ sơ ĐẦY ĐỦ (thẻ nén + phần thêm, ≤ ~3 KB/em): luồng sâu ≤ 25 % số em có thẻ, chọn theo điểm ưu tiên
//   vao/vang.json          em vắng ≥ 5 ngày (thẻ vắng ≤ ~0,4 KB; quá 40 em thì vang-01.json, vang-02.json …). Em vắng 2–4 ngày: lời mời quay lại do THUẬT TOÁN soạn (`tu-dong/vang.json`, AI không đọc)
//   LUAT-RUT-GON.md        luật rút gọn (≤ 1.200 chữ) cho trợ lý con đọc THAY cẩm nang dài
//   ra/                    thư mục trống cho phiên AI ghi kết quả
//   .bi-danh.json          bảng bí danh → SBD (quyền 600; AI KHÔNG được mở)
//   .the-day-du.json       thẻ ĐẦY ĐỦ theo bí danh, để `nop.mjs` kiểm khuôn (quyền 600; AI KHÔNG được mở)
// Luồng: các trang chỉ dựng THẺ TẠM; `phan:'lop'` (gọi SAU CÙNG) CHỐT luồng cả lớp — dạng cả lớp cùng sai ghi MỘT lần vào `lop.json` (`dangCaLopYeu`), không đẩy từng em vào sâu — rồi trả `doiLuong`.
// In ra CHỈ đường dẫn và số đếm. Chạy lại cùng ngày: em cũ giữ nguyên bí danh. Lỡ đêm: gọi `lay.mjs <ngày>` cho ngày bị lỡ (máy chủ dựng hồ sơ THEO YÊU CẦU cho bất kỳ ngày nào).
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { nenHoSo, nenThe, nenTheVang } from '../../src/lib/bo-nao-nen.ts'
import { laVangTuDong, soanLoiMoiVang } from '../../src/lib/bo-nao-vang.ts'
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import {
  CO_TRANG,
  GOC_DU_LIEU,
  LoiBoNao,
  SO_TRANG_TOI_DA,
  THU_MUC_CAM_NANG,
  TOI_DA_HO_SO_MOI_TEP,
  TOI_DA_THE_MOI_TEP,
  capBiDanh,
  chiaTep,
  docJsonNeuCo,
  docMaBiMat,
  donVao,
  ghiJson,
  homNayVn,
  laNgay,
  ngayChayBu,
  soTep,
  taoGoiMayChu,
  tepLanCuoi,
  TOI_DA_EM_CHIEU,
  TOI_DA_THE_MOI_TEP_CHIEU,
} from './chung.mjs'

/**
 * Lõi của mã lệnh (tách ra để test): `goi(duong, than)` là hàm gọi máy chủ; trả `{ ngay, thuMuc, dem, chayBu }`. Không in gì — `main` in.
 */
export async function chayLay({ ngay, goc = GOC_DU_LIEU, goi, bayGio = Date.now(), rng }) {
  const cauHinh = (await goi('/ai/cau-hinh', {})).cauHinh
  if (cauHinh && cauHinh.bat === false) throw new LoiBoNao('Bộ não đang TẮT ở Cài đặt (bat = false) — không lấy dữ liệu. Dừng.', 4)

  const cacEm = []
  let soTrang = 1
  for (let trang = 1; trang <= soTrang && trang <= SO_TRANG_TOI_DA; trang++) {
    const r = await goi('/ai/ho-so-ngay', { ngay, trang, coTrang: CO_TRANG })
    if (!Array.isArray(r.cacEm)) throw new LoiBoNao('Máy chủ trả hồ sơ ngày sai dạng (thiếu cacEm).', 3)
    soTrang = Number.isInteger(r.soTrang) && r.soTrang > 0 ? r.soTrang : 1
    cacEm.push(...r.cacEm)
  }
  const lopR = await goi('/ai/ho-so-ngay', { ngay, phan: 'lop' })
  if (!lopR.lop || typeof lopR.lop !== 'object') throw new LoiBoNao('Máy chủ trả bức tranh lớp sai dạng.', 3)

  // CHỐT LUỒNG CẢ LỚP: máy chủ trả các em đổi luồng / lý do so với lúc dựng từng trang (sâu → nhanh vì trần 25 %, hoặc bỏ lý do "cả lớp cùng sai")
  const doi = new Map((Array.isArray(lopR.doiLuong) ? lopR.doiLuong : []).map((x) => [String(x.sbd), x]))
  for (const e of cacEm) {
    const d = e && doi.get(String(e.sbd))
    if (d && (d.luong === 'nhanh' || d.luong === 'sau')) {
      e.luong = d.luong
      e.lyDoLuong = Array.isArray(d.lyDoLuong) ? d.lyDoLuong : []
    }
  }

  const thuMuc = join(goc, ngay)
  const tepBiDanh = join(thuMuc, '.bi-danh.json')
  const cu = docJsonNeuCo(tepBiDanh, null)
  const coThe = cacEm.filter((e) => e && e.the && e.luong !== 'bo_qua')
  const { bang, dao } = capBiDanh(coThe.map((e) => String(e.sbd)), cu && cu.ngay === ngay && cu.bang && typeof cu.bang === 'object' ? cu.bang : {}, rng)

  const nhom = { nhanh: [], sau: [], vang: [] }
  const the = {} // bí danh → thẻ ĐẦY ĐỦ (tệp riêng cho nop.mjs)
  const tuDongVang = [] // phần tử đầu ra do thuật toán soạn cho em vắng 2–4 ngày
  for (const e of coThe) {
    const b = dao.get(String(e.sbd))
    the[b] = e.the
    if (e.luong === 'sau') {
      const them = nenHoSo(e.the, e.hoSo)
      nhom.sau.push({ biDanh: b, luong: 'sau', lyDoLuong: e.lyDoLuong ?? [], the: nenThe(e.the), ...(them ? { hoSo: them } : {}) })
    } else if (e.luong === 'vang') {
      // vắng 2–4 ngày: thuật toán soạn lời mời (không đưa vào tệp cho AI ⇒ tiết kiệm token); vắng ≥ 5 ngày AI xem (có gợi ý nhắn phụ huynh)
      const tuDong = laVangTuDong(e.the) ? soanLoiMoiVang(e.the, b, ngay) : null
      if (tuDong) tuDongVang.push(tuDong)
      else nhom.vang.push({ biDanh: b, luong: 'vang', the: nenTheVang(e.the) })
    }
    else nhom.nhanh.push({ biDanh: b, luong: 'nhanh', the: nenThe(e.the) })
  }
  for (const k of Object.keys(nhom)) nhom[k].sort((a, b) => (a.biDanh < b.biDanh ? -1 : 1))
  tuDongVang.sort((a, b) => (a.biDanh < b.biDanh ? -1 : 1))

  mkdirSync(join(thuMuc, 'vao'), { recursive: true })
  mkdirSync(join(thuMuc, 'ra'), { recursive: true })
  donVao(join(thuMuc, 'vao'))
  const tep = { nhanh: 0, sau: 0, vang: 0 }
  chiaTep(nhom.nhanh, TOI_DA_THE_MOI_TEP).forEach((c, i) => (ghiJson(join(thuMuc, 'vao', `nhanh-${soTep(i)}.json`), c), tep.nhanh++))
  chiaTep(nhom.sau, TOI_DA_HO_SO_MOI_TEP).forEach((c, i) => (ghiJson(join(thuMuc, 'vao', `sau-${soTep(i)}.json`), c), tep.sau++))
  const vangChia = chiaTep(nhom.vang, TOI_DA_THE_MOI_TEP)
  vangChia.forEach((c, i) => (ghiJson(join(thuMuc, 'vao', vangChia.length === 1 ? 'vang.json' : `vang-${soTep(i)}.json`), c), tep.vang++))

  // bức tranh lớp: SBD của em nổi lên ⇒ bí danh (em nào không có thẻ thì bỏ, không lộ SBD)
  const lop = { ...lopR.lop, emNoiLen: (lopR.lop.emNoiLen ?? []).map((s) => dao.get(String(s))).filter(Boolean) }
  ghiJson(join(thuMuc, 'lop.json'), { ngay, lop }, { dep: true })
  ghiJson(tepBiDanh, { ngay, bang }, { rieng: true })
  ghiJson(join(thuMuc, '.the-day-du.json'), { ngay, the }, { rieng: true })

  // tu-dong/: dọn rồi ghi lại (lượt lấy mới); ra/ KHÔNG bị đụng
  const thuMucTuDong = join(thuMuc, 'tu-dong')
  rmSync(join(thuMucTuDong, 'vang.json'), { force: true })
  if (tuDongVang.length) ghiJson(join(thuMucTuDong, 'vang.json'), tuDongVang)
  // luật rút gọn cho trợ lý con (bản chép của cẩm nang gọn, cùng phiên bản với mã lệnh)
  const nguonLuat = join(THU_MUC_CAM_NANG, 'LUAT-RUT-GON.md')
  const coLuat = existsSync(nguonLuat)
  if (coLuat) copyFileSync(nguonLuat, join(thuMuc, 'LUAT-RUT-GON.md'))

  const dem = {
    soEmCoThe: coThe.length,
    nhanh: nhom.nhanh.length,
    sau: nhom.sau.length,
    vang: nhom.vang.length,
    vangTuDong: tuDongVang.length,
    coLuatRutGon: coLuat,
    boQua: cacEm.length - coThe.length,
    tep,
  }
  ghiJson(join(thuMuc, 'tom-tat.json'), { ngay, layLuc: new Date(bayGio).toISOString(), ...dem }, { dep: true })

  const lanCuoi = docJsonNeuCo(tepLanCuoi(goc), {}) ?? {}
  const chayBu = ngayChayBu(lanCuoi, ngay)
  ghiJson(tepLanCuoi(goc), { ...lanCuoi, layNgay: ngay, layLuc: new Date(bayGio).toISOString() }, { dep: true })
  return { ngay, thuMuc, dem, chayBu, cheDo: cauHinh?.cheDo ?? 'bong' }
}

/**
 * LƯỢT CHIỀU (thầy chốt 21/09 — "Thử thách riêng hôm nay"): lấy thẻ của em CÓ TÍN HIỆU trong ngày (`mocDangKhen`, làm bài hôm qua / 3 ngày), không vắng, có mã dạng — tối đa `toiDa` em, ưu tiên nhiều tín hiệu.
 * Ghi ở `bo-nao/<ngày>/chieu/` (KHÔNG đụng lượt đêm): `vao/chieu-NN.json` (thẻ NÉN, ≤ ${TOI_DA_THE_MOI_TEP_CHIEU} em/tệp; đã có `thanThu` nếu máy chủ trả), `ra/` trống, `LUAT-CHIEU.md`, `tom-tat.json`,
 * `.bi-danh.json` + `.the-day-du.json` (quyền 600, AI không mở). Lấy lại = trang trắng (xoá `ra/`, `xem-truoc.*`, `nop-ket-qua.json` cũ). Không cập nhật `lan-cuoi.json` (không lẫn chạy bù của lượt đêm). Cờ `bo_nao.thuThach` tắt ⇒ dừng.
 */
export function diemTinHieuChieu(the) {
  const t = the && typeof the === 'object' ? the : {}
  const moc = Array.isArray(t.mocDangKhen) ? t.mocDangKhen.length : 0
  const cau = t.cau && typeof t.cau === 'object' ? t.cau : {}
  return 2 * moc + (Number(cau.lamHomQua) > 0 ? 1 : 0) + (Number(cau.lam3) > 0 ? 1 : 0) + (t.thanThu && typeof t.thanThu === 'object' ? 1 : 0)
}

export async function chayLayChieu({ ngay, goc = GOC_DU_LIEU, goi, bayGio = Date.now(), rng, toiDa = TOI_DA_EM_CHIEU }) {
  const cauHinh = (await goi('/ai/cau-hinh', {})).cauHinh
  if (cauHinh && cauHinh.bat === false) throw new LoiBoNao('Bộ não đang TẮT ở Cài đặt (bat = false) — không lấy dữ liệu. Dừng.', 4)
  if (cauHinh && cauHinh.thuThach === false) throw new LoiBoNao('Cờ "Thử thách riêng hôm nay" đang TẮT (thuThach = false) — không lấy dữ liệu lượt chiều. Dừng.', 4)

  const cacEm = []
  let soTrang = 1
  for (let trang = 1; trang <= soTrang && trang <= SO_TRANG_TOI_DA; trang++) {
    const r = await goi('/ai/ho-so-ngay', { ngay, trang, coTrang: CO_TRANG })
    if (!Array.isArray(r.cacEm)) throw new LoiBoNao('Máy chủ trả hồ sơ ngày sai dạng (thiếu cacEm).', 3)
    soTrang = Number.isInteger(r.soTrang) && r.soTrang > 0 ? r.soTrang : 1
    cacEm.push(...r.cacEm)
  }
  const thuMuc = join(goc, ngay, 'chieu')
  const coThe = cacEm.filter((e) => e && e.the && e.luong !== 'bo_qua' && e.luong !== 'vang' && Array.isArray(e.the.maDang) && e.the.maDang.length > 0)
  const chon = coThe
    .map((e) => ({ e, diem: diemTinHieuChieu(e.the) }))
    .filter((x) => x.diem > 0)
    .sort((a, b) => b.diem - a.diem || (String(a.e.sbd) < String(b.e.sbd) ? -1 : 1))
    .slice(0, Math.max(1, toiDa))
    .map((x) => x.e)
  const cu = docJsonNeuCo(join(thuMuc, '.bi-danh.json'), null)
  const { bang, dao } = capBiDanh(chon.map((e) => String(e.sbd)), cu && cu.ngay === ngay && cu.bang && typeof cu.bang === 'object' ? cu.bang : {}, rng)

  const the = {}
  const nhom = []
  for (const e of chon) {
    const b = dao.get(String(e.sbd))
    the[b] = e.the
    nhom.push({ biDanh: b, the: nenThe(e.the) })
  }
  nhom.sort((a, b) => (a.biDanh < b.biDanh ? -1 : 1))
  mkdirSync(join(thuMuc, 'vao'), { recursive: true })
  mkdirSync(join(thuMuc, 'ra'), { recursive: true })
  donVao(join(thuMuc, 'vao'))
  // LƯỢT CHIỀU LẤY MỚI = TRANG TRẮNG: kết quả / xem trước của lượt lấy trước KHÔNG được sống sót (lời cũ có thể lệch thẻ mới; không bao giờ nộp nhầm bản cũ). Khác lượt đêm (giữ `ra/`).
  donVao(join(thuMuc, 'ra'))
  for (const f of ['xem-truoc.md', 'xem-truoc.json', 'nop-ket-qua.json']) rmSync(join(thuMuc, f), { force: true })
  const tepChia = chiaTep(nhom, TOI_DA_THE_MOI_TEP_CHIEU)
  tepChia.forEach((c, i) => ghiJson(join(thuMuc, 'vao', `chieu-${soTep(i)}.json`), c))
  ghiJson(join(thuMuc, '.bi-danh.json'), { ngay, bang }, { rieng: true })
  ghiJson(join(thuMuc, '.the-day-du.json'), { ngay, the }, { rieng: true })
  const nguonLuat = join(THU_MUC_CAM_NANG, 'LUAT-CHIEU.md')
  const coLuat = existsSync(nguonLuat)
  if (coLuat) copyFileSync(nguonLuat, join(thuMuc, 'LUAT-CHIEU.md'))
  const dem = {
    soEmCoThe: cacEm.length,
    soEmDuDieuKien: coThe.length,
    soEmDuocLay: chon.length,
    coThanThu: chon.filter((e) => e.the.thanThu && typeof e.the.thanThu === 'object').length,
    coLuatChieu: coLuat,
    tep: tepChia.length,
  }
  ghiJson(join(thuMuc, 'tom-tat.json'), { ngay, layLuc: new Date(bayGio).toISOString(), ...dem }, { dep: true })
  return { ngay, thuMuc, dem, cheDo: cauHinh?.cheDo ?? 'bong' }
}

export function dongTomTatChieu(kq) {
  const { dem } = kq
  return [
    `Đã lấy dữ liệu LƯỢT CHIỀU ngày ${kq.ngay} → bo-nao/${kq.ngay}/chieu/   (chế độ: ${kq.cheDo === 'that' ? 'thật' : 'chạy thử'})`,
    `  ${dem.soEmCoThe} em có thẻ · ${dem.soEmDuDieuKien} đủ điều kiện (không vắng, có mã dạng) · lấy ${dem.soEmDuocLay} em có tín hiệu (${dem.coThanThu} có số thật thần thú) · ${dem.tep} tệp vao/chieu-NN.json.`,
    '  Trợ lý con đọc LUAT-CHIEU.md; MỖI tệp vào → MỘT tệp ra cùng số ở ra/. Xong: node scripts/bo-nao/nop.mjs --chieu --xem-truoc (KHÔNG nộp; người chạy đọc xem-truoc.md rồi mới nộp).',
    ...(dem.soEmDuocLay === 0 ? ['  Không có em nào có tín hiệu hôm nay → dừng, không cần nộp.'] : []),
  ]
}

export function dongTomTat(kq) {
  const { dem } = kq
  const d = [
    `Đã lấy dữ liệu ngày ${kq.ngay} → bo-nao/${kq.ngay}/   (chế độ: ${kq.cheDo === 'that' ? 'thật' : 'chạy thử'})`,
    `  Có thẻ ${dem.soEmCoThe} em: nhanh ${dem.nhanh} (${dem.tep.nhanh} tệp) · sâu ${dem.sau} (${dem.tep.sau} tệp) · vắng ≥ 5 ngày ${dem.vang} (${dem.tep.vang} tệp) · vắng 2–4 ngày ${dem.vangTuDong} (thuật toán soạn, không cần AI) · bỏ qua ${dem.boQua} em (không lưu).`,
    '  Đọc: lop.json và vao/*.json (trợ lý con đọc LUAT-RUT-GON.md thay cẩm nang dài). Ghi kết quả vào ra/ (mỗi tệp vào một tệp ra cùng tên; lop.json là bản tin). Xong chạy: node scripts/bo-nao/nop.mjs ' + kq.ngay,
  ]
  if (dem.soEmCoThe === 0) d.push('  Không có em nào có hoạt động → ghi bao-cao.md một dòng rồi dừng.')
  if (kq.chayBu.length) d.push(`  Lưu ý: chưa nộp các ngày ${kq.chayBu.join(', ')} — muốn chạy bù: node scripts/bo-nao/lay.mjs <ngày> rồi nop.mjs <ngày> tương ứng.`)
  return d
}

async function main() {
  const args = process.argv.slice(2)
  const chieu = args.includes('--chieu')
  const iToiDa = args.indexOf('--toi-da')
  const toiDa = iToiDa >= 0 ? Number(args[iToiDa + 1]) : TOI_DA_EM_CHIEU
  const doi = args.find((a, i) => !a.startsWith('--') && !(iToiDa >= 0 && i === iToiDa + 1))
  if (doi && !laNgay(doi)) throw new LoiBoNao(`Ngày phải có dạng YYYY-MM-DD (nhận "${String(doi).slice(0, 20)}").`, 1)
  if (chieu && (!Number.isInteger(toiDa) || toiDa < 1 || toiDa > 400)) throw new LoiBoNao('--toi-da phải là số nguyên 1…400.', 1)
  const ngay = doi || homNayVn()
  const { ma, canhBao } = docMaBiMat()
  if (canhBao) console.log(canhBao)
  if (chieu) {
    const kq = await chayLayChieu({ ngay, goi: taoGoiMayChu({ ma }), toiDa })
    for (const d of dongTomTatChieu(kq)) console.log(d)
    return
  }
  const kq = await chayLay({ ngay, goi: taoGoiMayChu({ ma }) })
  for (const d of dongTomTat(kq)) console.log(d)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e instanceof LoiBoNao ? e.message : `Lỗi không lường trước: ${String(e && e.message ? e.message : e).slice(0, 200)}`)
    process.exit(e instanceof LoiBoNao ? e.maThoat : 9)
  })
}
