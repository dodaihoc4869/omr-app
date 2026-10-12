// LÀN GIÁO VIÊN 12/10 — DỮ LIỆU GIẢ cho ảnh chụp Hành trình › Bài hằng ngày + tấm Hồ sơ làm bài (tên em là tên giả, số do hàm tất định sinh ra,
// không một yêu cầu nào tới máy chủ thật). Hình dạng đúng hợp đồng `server/src/bai-hang-ngay-kieu.ts`; thứ tự em đúng luật máy chủ.
// Thầy 12/10 dời mốc về 01/10 ⇒ khoảng giả 01/10 → 17/10 (17 cột, hôm nay 17/10): ngày trước 10/10 (chưa có Gói bài 7 ngày) đều là chế độ Hành trình.
import type { EmBaiHangNgay, KetQuaBaiHangNgay, KetQuaHoSoThaiDo, NgayBaiEm, NhanThaiDo, TinHieuThaiDo } from '../../../server/src/bai-hang-ngay-kieu'
import { TEN_NHAN_THAI_DO } from '../../../server/src/bai-hang-ngay-kieu'

const NGAY = Array.from({ length: 17 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
/** Gói bài 7 ngày bật từ 10/10 — trước đó mọi ngày tính theo kế hoạch Hành trình (đúng luật máy chủ). */
const GOI7_TU = '2026-10-10'
const HOM_NAY = NGAY[NGAY.length - 1]!
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Phan', 'Lý']
const TEN = ['Minh Anh', 'Đức Huy', 'Phương Linh', 'Quang Minh', 'Thu Trang', 'Khánh Vy', 'Gia Bảo', 'Hải Yến', 'Quốc Việt', 'Mai Chi', 'Thanh Tâm', 'Ngọc Ánh', 'Tuấn Kiệt']
const LOP: [string, string][] = [['12', '12 - Tinh Hoa'], ['12', '12 - Chuyên'], ['11', '11 - Tăng tốc'], ['10', '10 - Nền tảng']]
const MUC = [24, 30, 36, 36] as const

/** Số giả tất định 0..1 theo hai khoá. */
const gia = (a: number, b: number) => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function ngayEm(i: number): NgayBaiEm[] {
  const tang = (1 + (i % 3)) as 1 | 2 | 3
  const muc = MUC[tang - 1]!
  // ba nhóm thói quen: đều (i % 4 = 0, 1) · thất thường (2) · bỏ nhiều (3)
  const kieu = i % 4
  return NGAY.map((ngay, j) => {
    const r = gia(i, j)
    const homNay = ngay === HOM_NAY
    let daLam =
      kieu <= 1 ? (r < 0.85 ? muc + Math.floor(r * 6) : Math.floor(muc * 0.7)) : kieu === 2 ? (r < 0.5 ? muc : r < 0.75 ? Math.floor(muc * 0.6) : Math.floor(muc * 0.2)) : r < 0.35 ? Math.floor(muc * 0.4) : 0
    if (homNay) daLam = Math.floor(daLam * 0.55)
    const daChot = j % 3 === 1 && ngay >= '2026-10-09' // mức chốt theo ngày có từ 09/10 (Hành trình v3)
    const cheDo = ngay < GOI7_TU || daChot ? 'hanh-trinh' : 'goi7'
    return { ngay, mucToiThieu: muc, daLam, thieu: Math.max(0, muc - daLam), datMuc: daLam >= muc, mucUocTinh: !daChot, nguonMuc: daChot ? 'da-chot' : 'tang-gan-nhat', tang, cheDo, homNay }
  })
}

function emGia(i: number): EmBaiHangNgay {
  const [khoi, lop] = LOP[i % LOP.length]!
  const ngay = ngayEm(i)
  // đúng luật máy chủ: hôm nay chưa hết ngày ⇒ không cộng vào tổng
  const qua = ngay.filter((n) => !n.homNay)
  let lon: { ngay: string; thieu: number } | null = null
  for (const n of qua) if (n.thieu > 0 && (!lon || n.thieu >= lon.thieu)) lon = { ngay: n.ngay, thieu: n.thieu }
  return {
    sbd: String(12010 + i), hoTen: `${HO[i % HO.length]} ${TEN[(i * 5) % TEN.length]}`, lop, khoi, ngay,
    soNgayThieu: qua.filter((n) => !n.datMuc).length, tongCauThieu: qua.reduce((t, n) => t + n.thieu, 0), ngayThieuNhieuNhat: lon,
    soNgayDu: ngay.filter((n) => n.datMuc).length, soNgayKhongLam: qua.filter((n) => n.daLam === 0).length, tongDaLam: ngay.reduce((t, n) => t + n.daLam, 0),
    thieuHomNay: ngay.find((n) => n.homNay)?.thieu ?? 0,
  }
}

const EM = Array.from({ length: 44 }, (_, i) => emGia(i)).sort(
  (a, b) => b.soNgayThieu - a.soNgayThieu || b.tongCauThieu - a.tongCauThieu || b.thieuHomNay - a.thieuHomNay || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd),
)

export function baiHangNgayGia(): KetQuaBaiHangNgay {
  const dem = new Map<string, { tenLop: string; khoi: string; soEm: number }>()
  for (const e of EM) dem.set(e.lop, { tenLop: e.lop, khoi: e.khoi, soEm: (dem.get(e.lop)?.soEm ?? 0) + 1 })
  const o = EM.flatMap((e) => e.ngay)
  return {
    ok: true, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY, ngay: NGAY, em: EM,
    lop: [...dem.values()].sort((a, b) => b.khoi.localeCompare(a.khoi) || a.tenLop.localeCompare(b.tenLop, 'vi')),
    soOUocTinh: o.filter((n) => n.mucUocTinh).length, soO: o.length, canhBao: [],
  }
}

/** Hàng của em "Có dấu hiệu đối phó" trên bảng giả (1 = hàng đầu): em đầu tiên trong nhóm thiếu nhiều mà vẫn có làm bài. */
export const HANG_DOI_PHO = 1 + Math.max(0, EM.findIndex((e) => e.tongDaLam >= 40))
// trang chụp đọc hàng này để bấm đúng em (chup.mjs `bhn:doi-pho`)
;(globalThis as { __HANG_DOI_PHO?: number }).__HANG_DOI_PHO = HANG_DOI_PHO

/** Hồ sơ thái độ giả: em ở `HANG_DOI_PHO` ⇒ "Có dấu hiệu đối phó"; các em khác theo tỉ lệ ngày đủ mức (số khớp dòng bảng). */
export function hoSoThaiDoGia(sbd: string): KetQuaHoSoThaiDo {
  const e = EM.find((x) => x.sbd === sbd) ?? EM[0]!
  const viTri = EM.indexOf(e)
  const tinh = e.ngay.filter((n) => !n.homNay || n.datMuc)
  const du = tinh.filter((n) => n.datMuc).length
  const pA = Math.round((100 * du) / Math.max(1, tinh.length))
  const doiPho = viTri === HANG_DOI_PHO - 1
  const nhan: NhanThaiDo = doiPho ? 'doi-pho' : tinh.length < 3 ? 'chua-du-du-lieu' : pA >= 80 ? 'cham-chi' : 'chua-deu'
  const soLuot = e.tongDaLam
  const nhanh = doiPho ? Math.round(soLuot * 0.42) : Math.round(soLuot * 0.06)
  const ngay = e.ngay.map((n, j) => {
    const dung = Math.round(n.daLam * (doiPho ? 0.45 + 0.1 * gia(viTri, j) : 0.7 + 0.2 * gia(viTri, j)))
    return { ...n, soLuot: n.daLam, soDung: dung, soSai: n.daLam - dung, tiLeDung: n.daLam ? Math.round((100 * dung) / n.daLam) : null }
  })
  // (f) 7 ngày gần nhất so với trước đó — đúng phép máy chủ trên chính các ngày giả
  const mocGan = NGAY[NGAY.length - 7]!
  const cong = (ds: typeof ngay) => ({ d: ds.reduce((t, n) => t + n.soDung, 0), m: ds.reduce((t, n) => t + n.soDung + n.soSai, 0) })
  const gan = cong(ngay.filter((n) => n.ngay >= mocGan)), truoc = cong(ngay.filter((n) => n.ngay < mocGan))
  const dGan = gan.m ? Math.round((100 * gan.d) / gan.m) : null, dTruoc = truoc.m ? Math.round((100 * truoc.d) / truoc.m) : null
  const chenh = gan.m >= 20 && truoc.m >= 20 ? dGan! - dTruoc! : null
  const mucF: TinHieuThaiDo['muc'] = chenh === null ? 'chua-du' : chenh <= -15 ? 'xau' : chenh <= -5 ? 'chu-y' : 'tot'
  const pt = (x: number | null) => (x === null ? '—' : `${x}%`)
  const tin: TinHieuThaiDo[] = [
    { ma: 'ngay-du-muc', ten: 'Ngày đủ mức', muc: pA >= 80 ? 'tot' : pA >= 50 ? 'chu-y' : 'xau', giaTri: pA, tu: du, mau: tinh.length, chu: `Đủ mức ${du}/${tinh.length} ngày (${pA}%)`, nguong: 'Tốt từ 80% · chú ý 50–79% · dưới 50% là chưa đều; cần ít nhất 3 ngày' },
    { ma: 'qua-nhanh', ten: 'Trả lời quá nhanh', muc: doiPho ? 'xau' : 'tot', giaTri: Math.round((100 * nhanh) / soLuot), tu: nhanh, mau: soLuot, chu: `Quá nhanh ${nhanh}/${soLuot} lượt (${Math.round((100 * nhanh) / soLuot)}%) · nhóm quá nhanh đúng ${doiPho ? 28 : 71}% · lượt thường đúng 78%`, nguong: 'Quá nhanh: dưới 8 giây (trắc nghiệm), dưới 15 giây (tự tính). Đáng lo khi từ 30% lượt mà nhóm ấy đúng dưới 50% (đoán bừa) · chú ý từ 15%; cần ít nhất 20 lượt có số giây' },
    { ma: 'don-bai', ten: 'Dồn bài cuối ngày', muc: doiPho ? 'chu-y' : 'tot', giaTri: doiPho ? 31 : 8, tu: Math.round(soLuot * (doiPho ? 0.31 : 0.08)), mau: soLuot, chu: `${Math.round(soLuot * (doiPho ? 0.31 : 0.08))}/${soLuot} lượt làm trong 23:00–04:59 (${doiPho ? 31 : 8}%)`, nguong: 'Đáng lo từ 50% lượt làm 23:00–04:59 · chú ý từ 25%; cần ít nhất 20 lượt' },
    { ma: 'goi-y', ten: 'Dùng gợi ý, đọc lời giải', muc: 'tot', giaTri: 12, tu: 5, mau: 42, chu: '5/42 câu có dùng gợi ý hoặc đọc lời giải (12%)', nguong: 'Đáng lo từ 50% số câu · chú ý từ 25%; cần ít nhất 10 câu' },
    { ma: 'chon-lap', ten: 'Chọn lặp một phương án', muc: doiPho ? 'xau' : 'tot', giaTri: doiPho ? 14 : 0, tu: doiPho ? 9 : 0, mau: 64, chu: doiPho ? '9/64 lượt trắc nghiệm nằm trong chuỗi chọn lặp (14%) · chuỗi dài nhất 9 lượt chọn C' : '0/64 lượt trắc nghiệm nằm trong chuỗi chọn lặp (0%) · chuỗi dài nhất 3 lượt chọn A', nguong: 'Chuỗi lặp: từ 6 lượt liên tiếp cùng một chữ. Đáng lo khi từ 10% lượt nằm trong chuỗi · chú ý từ 5%; cần ít nhất 15 lượt' },
    { ma: 'xu-huong', ten: 'Độ đúng theo thời gian', muc: mucF, giaTri: chenh, tu: gan.m, mau: truoc.m, chu: `7 ngày gần nhất đúng ${pt(dGan)} (${gan.m} lượt) · trước đó ${pt(dTruoc)} (${truoc.m} lượt)${chenh !== null ? ` · ${chenh >= 0 ? 'tăng' : 'giảm'} ${Math.abs(chenh)} điểm %` : ''}`, nguong: 'Đáng lo khi giảm từ 15 điểm % · chú ý khi giảm từ 5; mỗi bên cần ít nhất 20 lượt' },
  ]
  const lyDo = doiPho
    ? [`Trả lời quá nhanh: ${tin[1]!.chu}.`, `Chọn lặp một phương án: ${tin[4]!.chu}.`, `Ngày đủ mức: ${tin[0]!.chu}.`]
    : nhan === 'cham-chi'
      ? [`Ngày đủ mức: ${tin[0]!.chu}.`, 'Không có dấu hiệu đối phó (trả lời quá nhanh, chọn lặp một phương án, dùng gợi ý, đọc lời giải trong ngưỡng).']
      : [`Ngày đủ mức: ${tin[0]!.chu}.`]
  const soDung = ngay.reduce((t, n) => t + n.soDung, 0)
  return {
    ok: true, em: { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, khoi: e.khoi }, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY,
    ketLuan: { nhan, chu: TEN_NHAN_THAI_DO[nhan], lyDo },
    tinHieu: tin,
    dem: {
      soLuot, soCau: Math.round(soLuot * 0.8), soDung, soSai: soLuot - soDung, soBoTrong: 0, soCauOn: soLuot ? 7 : 0, soLuotOn: soLuot ? 11 : 0,
      giayTb: soLuot ? (doiPho ? 14 : 41) : null, giayTrungVi: soLuot ? (doiPho ? 6 : 35) : null, soLuotCoGiay: soLuot,
    },
    ngay,
    phanBoGiay: ((): KetQuaHoSoThaiDo['phanBoGiay'] => {
      const con = Math.max(0, soLuot - nhanh)
      const chia = [0.18, 0.3, 0.32, 0.14, 0.05].map((x) => Math.floor(con * x))
      chia[2]! += con - chia.reduce((t, x) => t + x, 0)
      const nhom: [string, number, number | null][] = [['8–14 giây', 8, 15], ['15–29 giây', 15, 30], ['30–59 giây', 30, 60], ['1–2 phút', 60, 120], ['2–5 phút', 120, 300]]
      return [
        { nhan: 'Dưới 8 giây', tu: 0, den: 8, soLuot: nhanh, soDung: Math.round(nhanh * (doiPho ? 0.28 : 0.7)), soNhanh: nhanh },
        ...nhom.map(([nhan, tu, den], k) => ({ nhan, tu, den, soLuot: chia[k]!, soDung: Math.round(chia[k]! * 0.75), soNhanh: 0 })),
        { nhan: 'Từ 5 phút', tu: 300, den: null, soLuot: 0, soDung: 0, soNhanh: 0 },
      ]
    })(),
    cauDung: [
      { qid: 'DH-12-C1-B2-I-7', tieuDe: 'Câu 7 · Thuỷ phân ester', mucDo: 'hieu', soLan: 3, soDung: 1, soSai: 2, dungLanDau: false, lanCuoiDung: true, lanCuoi: '2026-10-16T03:10:00Z', soLanOn: 2 },
      { qid: 'DH-12-C1-B3-I-12', tieuDe: 'Câu 12 · Chất béo', mucDo: 'biet', soLan: 1, soDung: 1, soSai: 0, dungLanDau: true, lanCuoiDung: true, lanCuoi: '2026-10-15T02:40:00Z', soLanOn: 0 },
    ],
    cauDaOn: [
      { qid: 'DH-12-C1-B4-III-3', tieuDe: 'Câu 3 · Chỉ số xà phòng hoá', mucDo: 'VD', soLan: 3, soDung: 0, soSai: 3, dungLanDau: false, lanCuoiDung: false, lanCuoi: '2026-10-16T13:20:00Z', soLanOn: 2 },
      { qid: 'DH-12-C1-B2-I-7', tieuDe: 'Câu 7 · Thuỷ phân ester', mucDo: 'hieu', soLan: 3, soDung: 1, soSai: 2, dungLanDau: false, lanCuoiDung: true, lanCuoi: '2026-10-16T03:10:00Z', soLanOn: 2 },
    ],
    catBot: false, canhBao: [],
  }
}

/** Tên em đứng đầu bảng giả (ảnh bấm em này ⇒ tấm hồ sơ "Có dấu hiệu đối phó"). */
export const TEN_EM_DAU = EM[0]!.hoTen
export const TEN_EM_CHAM = EM[EM.length - 1]!.hoTen
/** Tên giả theo SBD của bảng Bài hằng ngày (tấm lịch sử làm câu dùng đúng tên) — SBD khác ⇒ null. */
export const tenEmBhn = (sbd: string): string | null => EM.find((e) => e.sbd === sbd)?.hoTen ?? null
