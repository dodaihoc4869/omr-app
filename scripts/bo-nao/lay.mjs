#!/usr/bin/env node
// BỘ NÃO — MÃ LỆNH 1/2: LẤY DỮ LIỆU ĐÊM (Code 1, 21/09/2026).   Dùng: node scripts/bo-nao/lay.mjs [YYYY-MM-DD]
//
// Gọi máy chủ `/ai/*` (mã bí mật đọc từ ~/.omr-bo-nao/ma-bi-mat — KHÔNG in), lấy thẻ + hồ sơ MỌI em có hoạt động theo từng trang, ẩn danh (bí danh E001…) và ghi vào `bo-nao/<ngày>/`:
//   lop.json               bức tranh cả lớp + kết quả các điều chỉnh hôm qua (emNoiLen đã đổi sang bí danh)
//   vao/nhanh-01.json …    mỗi tệp ≤ 40 thẻ NGẮN (nén: ≤ ~1,2 KB/thẻ)
//   vao/sau-01.json …      mỗi tệp ≤ 12 hồ sơ ĐẦY ĐỦ (thẻ nén + phần thêm, ≤ ~3 KB/em): luồng sâu ≤ 25 % số em có thẻ, chọn theo điểm ưu tiên
//   vao/vang.json          em vắng ≥ 2 ngày (thẻ vắng ≤ ~0,4 KB; quá 40 em thì vang-01.json, vang-02.json …)
//   ra/                    thư mục trống cho phiên AI ghi kết quả
//   .bi-danh.json          bảng bí danh → SBD (quyền 600; AI KHÔNG được mở)
//   .the-day-du.json       thẻ ĐẦY ĐỦ theo bí danh, để `nop.mjs` kiểm khuôn (quyền 600; AI KHÔNG được mở)
// Luồng: các trang chỉ dựng THẺ TẠM; `phan:'lop'` (gọi SAU CÙNG) CHỐT luồng cả lớp — dạng cả lớp cùng sai ghi MỘT lần vào `lop.json` (`dangCaLopYeu`), không đẩy từng em vào sâu — rồi trả `doiLuong`.
// In ra CHỈ đường dẫn và số đếm. Chạy lại cùng ngày: em cũ giữ nguyên bí danh. Lỡ đêm: gọi `lay.mjs <ngày>` cho ngày bị lỡ (máy chủ dựng hồ sơ THEO YÊU CẦU cho bất kỳ ngày nào).
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { nenHoSo, nenThe, nenTheVang } from '../../src/lib/bo-nao-nen.ts'
import {
  CO_TRANG,
  GOC_DU_LIEU,
  LoiBoNao,
  SO_TRANG_TOI_DA,
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
  for (const e of coThe) {
    const b = dao.get(String(e.sbd))
    the[b] = e.the
    if (e.luong === 'sau') {
      const them = nenHoSo(e.the, e.hoSo)
      nhom.sau.push({ biDanh: b, luong: 'sau', lyDoLuong: e.lyDoLuong ?? [], the: nenThe(e.the), ...(them ? { hoSo: them } : {}) })
    } else if (e.luong === 'vang') nhom.vang.push({ biDanh: b, luong: 'vang', the: nenTheVang(e.the) })
    else nhom.nhanh.push({ biDanh: b, luong: 'nhanh', the: nenThe(e.the) })
  }
  for (const k of Object.keys(nhom)) nhom[k].sort((a, b) => (a.biDanh < b.biDanh ? -1 : 1))

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

  const dem = {
    soEmCoThe: coThe.length,
    nhanh: nhom.nhanh.length,
    sau: nhom.sau.length,
    vang: nhom.vang.length,
    boQua: cacEm.length - coThe.length,
    tep,
  }
  ghiJson(join(thuMuc, 'tom-tat.json'), { ngay, layLuc: new Date(bayGio).toISOString(), ...dem }, { dep: true })

  const lanCuoi = docJsonNeuCo(tepLanCuoi(goc), {}) ?? {}
  const chayBu = ngayChayBu(lanCuoi, ngay)
  ghiJson(tepLanCuoi(goc), { ...lanCuoi, layNgay: ngay, layLuc: new Date(bayGio).toISOString() }, { dep: true })
  return { ngay, thuMuc, dem, chayBu, cheDo: cauHinh?.cheDo ?? 'bong' }
}

export function dongTomTat(kq) {
  const { dem } = kq
  const d = [
    `Đã lấy dữ liệu ngày ${kq.ngay} → bo-nao/${kq.ngay}/   (chế độ: ${kq.cheDo === 'that' ? 'thật' : 'chạy thử'})`,
    `  Có thẻ ${dem.soEmCoThe} em: nhanh ${dem.nhanh} (${dem.tep.nhanh} tệp) · sâu ${dem.sau} (${dem.tep.sau} tệp) · vắng ${dem.vang} (${dem.tep.vang} tệp) · bỏ qua ${dem.boQua} em (không lưu).`,
    '  Đọc: lop.json và vao/*.json. Ghi kết quả vào ra/ (mỗi tệp vào một tệp ra cùng tên; lop.json là bản tin). Xong chạy: node scripts/bo-nao/nop.mjs ' + kq.ngay,
  ]
  if (dem.soEmCoThe === 0) d.push('  Không có em nào có hoạt động → ghi bao-cao.md một dòng rồi dừng.')
  if (kq.chayBu.length) d.push(`  Lưu ý: chưa nộp các ngày ${kq.chayBu.join(', ')} — muốn chạy bù: node scripts/bo-nao/lay.mjs <ngày> rồi nop.mjs <ngày> tương ứng.`)
  return d
}

async function main() {
  const doi = process.argv[2]
  if (doi && !laNgay(doi)) throw new LoiBoNao(`Ngày phải có dạng YYYY-MM-DD (nhận "${String(doi).slice(0, 20)}").`, 1)
  const ngay = doi || homNayVn()
  const { ma, canhBao } = docMaBiMat()
  if (canhBao) console.log(canhBao)
  const kq = await chayLay({ ngay, goi: taoGoiMayChu({ ma }) })
  for (const d of dongTomTat(kq)) console.log(d)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e instanceof LoiBoNao ? e.message : `Lỗi không lường trước: ${String(e && e.message ? e.message : e).slice(0, 200)}`)
    process.exit(e instanceof LoiBoNao ? e.maThoat : 9)
  })
}
