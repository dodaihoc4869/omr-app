// LÀN HÔM NAY 12/10B — DỮ LIỆU GIẢ cho ảnh chụp "Hôm nay của thầy" bản vẽ thầy duyệt 12/10 (khối Nhịp học). Tên em là tên giả, số do hàm tất
// định sinh ra, không một yêu cầu nào tới máy chủ thật. Hình dạng đúng hợp đồng `server/src/nhip-hoc-kieu.ts`: 262 em × 12 ngày (01/10 → 12/10,
// hôm nay 12/10 lúc buổi sáng), 8 lớp như bản vẽ (Khối 10 · 46 · Khối 11 · 89 · Khối 12 · 127); vài em vào học muộn (chưa đủ dữ liệu), 11 em có
// dấu hiệu đối phó (câu lý do đúng kiểu máy chủ). Cùng bộ em cho bảng từng ngày (`/gv/bai-hang-ngay`) và tấm hồ sơ (`/gv/ho-so-thai-do`).
// Cảnh `?man=gv-hom-nay&nh=1`; `&nh=loi` = máy chủ lỗi · `&nh=trong` = chưa có em nào.
import type { EmBaiHangNgay, KetQuaBaiHangNgay, KetQuaHoSoThaiDo, NgayBaiEm, NgayHoatDong, NhanThaiDo } from '../../../server/src/bai-hang-ngay-kieu'
import { TEN_NHAN_THAI_DO } from '../../../server/src/bai-hang-ngay-kieu'
import type { DoiPhoEm, EmNhipHoc, KetQuaNhipHoc } from '../../../server/src/nhip-hoc-kieu'
import { hoSoThaiDoGia, tenEmBhn } from './bai-hang-ngay'
import { tomTatNhip } from '../../../server/src/nhip-hoc-luat' // LÀN NHỊP EM 12/10C

const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const HOM_NAY = NGAY[NGAY.length - 1]!
const LOP: [string, string, number][] = [
  ['12', '12 Lớp Thường', 52], ['12', '12 Nhóm 10 điểm', 38], ['12', '12 Tinh Hoa', 37],
  ['11', '11B', 28], ['11', '11A2', 30], ['11', '11A1', 31],
  ['10', '10A2', 22], ['10', '10A1', 24],
]
/** Tỉ lệ thói quen mỗi lớp [đều, thất thường] — còn lại là bỏ nhiều (lớp Thường bỏ nhiều nhất, Tinh Hoa chăm nhất). */
const THOI_QUEN: Record<string, [number, number]> = {
  '12 Lớp Thường': [0.18, 0.3], '11B': [0.16, 0.3], '10A2': [0.24, 0.32], '11A2': [0.24, 0.32], '11A1': [0.3, 0.34], '10A1': [0.3, 0.34],
  '12 Nhóm 10 điểm': [0.42, 0.36], '12 Tinh Hoa': [0.46, 0.34],
}
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Phan', 'Lý', 'Trịnh', 'Mai', 'Chu', 'Đinh']
const DEM = ['Minh', 'Đức', 'Phương', 'Quang', 'Thu', 'Khánh', 'Gia', 'Hải', 'Quốc', 'Mai', 'Thanh', 'Ngọc', 'Tuấn', 'Hương', 'Bảo', 'Thị']
const TEN = ['Anh', 'Huy', 'Linh', 'Minh', 'Trang', 'Vy', 'Bảo', 'Yến', 'Việt', 'Chi', 'Tâm', 'Ánh', 'Kiệt', 'Cúc', 'Ngọc', 'Hân', 'Long', 'Khôi', 'Hà', 'Phúc']
const MUC = [24, 30, 36] as const

/** Số giả tất định 0..1 theo hai khoá. */
const gia = (a: number, b: number) => {
  const x = Math.sin(a * 12.9898 + b * 78.233 + 0.5) * 43758.5453
  return x - Math.floor(x)
}

function taoEm(): EmNhipHoc[] {
  const ra: EmNhipHoc[] = []
  let i = 0
  for (const [khoi, lop, si] of LOP) {
    const [deu, thatThuong] = THOI_QUEN[lop]!
    for (let k = 0; k < si; k++, i++) {
      const r0 = gia(i, 99)
      const kieu = r0 < deu ? 'deu' : r0 < deu + thatThuong ? 'that' : 'bo'
      const muc = MUC[i % 3]!
      // em vào học muộn (≈ 5%): ngày vào 10/10 hoặc 11/10 ⇒ chưa đủ 3 ngày đã qua
      const vaoMuon = gia(i, 7) < 0.046
      const ngayVao = vaoMuon ? NGAY[9 + (i % 2)]! : NGAY[0]!
      const lam = NGAY.map((d, j) => {
        if (d < ngayVao) return 0
        const r = gia(i, j)
        if (d === HOM_NAY) {
          // buổi sáng: phần lớn chưa làm; vài em đã đủ, vài em đang làm
          const h = gia(i, 77)
          return h < 0.03 ? muc + Math.floor(r * 4) : h < 0.085 ? Math.floor(muc * (0.3 + 0.5 * r)) : 0
        }
        if (vaoMuon) return r < 0.7 ? muc : Math.floor(muc * 0.5)
        if (kieu === 'deu') return r < 0.94 ? muc + Math.floor(r * 5) : Math.floor(muc * 0.7)
        if (kieu === 'that') return r < 0.62 ? muc : r < 0.8 ? Math.floor(muc * 0.6) : r < 0.9 ? Math.floor(muc * 0.25) : 0
        return r < 0.16 ? muc : r < 0.4 ? Math.floor(muc * (0.15 + 0.4 * r)) : 0
      })
      const hoTen = `${HO[(i * 7) % HO.length]} ${DEM[(i * 3 + 1) % DEM.length]} ${TEN[(i * 11 + 3) % TEN.length]}`
      ra.push({ sbd: String(70001 + i), hoTen, lop, khoi, ngayVao, muc: NGAY.map(() => muc), lam, doiPho: null })
    }
  }
  // 11 em có dấu hiệu đối phó (đúng kiểu câu lý do của máy chủ): rải trên các lớp, đa số là em làm đủ số câu mà nhanh / chọn lặp
  const LY_DO: DoiPhoEm[] = [
    { quaNhanh: { nhanh: 23, coGiay: 54, dungNhanh: 28, dungThuong: 78, coTuTinh: false }, chonLap: null, lyDo: ['23/54 lượt trả lời dưới 8 giây, nhóm này đúng 28% (lượt thường đúng 78%)'] },
    { quaNhanh: null, chonLap: { trongChuoi: 9, tong: 64, dai: 9, chu: 'C' }, lyDo: ['Chọn C 9 lượt liền · 9/64 lượt trắc nghiệm nằm trong chuỗi chọn lặp (14%)'] },
    { quaNhanh: { nhanh: 41, coGiay: 96, dungNhanh: 34, dungThuong: 81, coTuTinh: false }, chonLap: null, lyDo: ['41/96 lượt trả lời dưới 8 giây, nhóm này đúng 34% (lượt thường đúng 81%)'] },
    { quaNhanh: { nhanh: 30, coGiay: 72, dungNhanh: 30, dungThuong: 74, coTuTinh: true }, chonLap: null, lyDo: ['30/72 lượt trả lời quá nhanh (dưới 8 giây, câu tự tính dưới 15 giây), nhóm này đúng 30% (lượt thường đúng 74%)'] },
    { quaNhanh: { nhanh: 19, coGiay: 48, dungNhanh: 21, dungThuong: 69, coTuTinh: false }, chonLap: { trongChuoi: 8, tong: 40, dai: 8, chu: 'A' }, lyDo: ['Chọn A 8 lượt liền · 8/40 lượt trắc nghiệm nằm trong chuỗi chọn lặp (20%)', '19/48 lượt trả lời dưới 8 giây, nhóm này đúng 21% (lượt thường đúng 69%)'] },
    { quaNhanh: { nhanh: 27, coGiay: 80, dungNhanh: 37, dungThuong: 80, coTuTinh: false }, chonLap: null, lyDo: ['27/80 lượt trả lời dưới 8 giây, nhóm này đúng 37% (lượt thường đúng 80%)'] },
    { quaNhanh: null, chonLap: { trongChuoi: 7, tong: 58, dai: 7, chu: 'B' }, lyDo: ['Chọn B 7 lượt liền · 7/58 lượt trắc nghiệm nằm trong chuỗi chọn lặp (12%)'] },
    { quaNhanh: { nhanh: 22, coGiay: 66, dungNhanh: 41, dungThuong: 77, coTuTinh: false }, chonLap: null, lyDo: ['22/66 lượt trả lời dưới 8 giây, nhóm này đúng 41% (lượt thường đúng 77%)'] },
    { quaNhanh: { nhanh: 35, coGiay: 90, dungNhanh: 26, dungThuong: 72, coTuTinh: false }, chonLap: null, lyDo: ['35/90 lượt trả lời dưới 8 giây, nhóm này đúng 26% (lượt thường đúng 72%)'] },
    { quaNhanh: null, chonLap: { trongChuoi: 12, tong: 70, dai: 6, chu: 'D' }, lyDo: ['Chọn D 6 lượt liền · 12/70 lượt trắc nghiệm nằm trong chuỗi chọn lặp (17%)'] },
    { quaNhanh: { nhanh: 18, coGiay: 52, dungNhanh: 39, dungThuong: 83, coTuTinh: false }, chonLap: null, lyDo: ['18/52 lượt trả lời dưới 8 giây, nhóm này đúng 39% (lượt thường đúng 83%)'] },
  ]
  LY_DO.forEach((dp, k) => {
    const e = ra[(k * 23 + 5) % ra.length]!
    e.doiPho = dp
  })
  return ra
}

const EM = taoEm()
const LOP_DS = LOP.map(([khoi, tenLop, soEm]) => ({ tenLop, khoi, soEm })).sort((a, b) => b.khoi.localeCompare(a.khoi) || a.tenLop.localeCompare(b.tenLop, 'vi'))

const thamSo = () => (typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search))
/** Đang ở cảnh LÀN HÔM NAY 12/10B. */
export const laCanhNhipHoc = (): boolean => thamSo().has('nh')

/** `/gv/nhip-hoc` giả (hình dạng `goiLenh`). */
export function nhipHocGia(): { ok: true; du: Record<string, unknown> } | { ok: false; loai: 'mang'; chu: string } {
  const nh = thamSo().get('nh')
  if (nh === 'loi') return { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }
  const kq: KetQuaNhipHoc = {
    ok: true, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY, ngay: NGAY, em: nh === 'trong' ? [] : EM, lop: nh === 'trong' ? [] : LOP_DS,
    doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [],
  }
  return { ok: true, du: kq as unknown as Record<string, unknown> }
}

function ngayBai(e: EmNhipHoc): NgayBaiEm[] {
  return NGAY.map((ngay, j) => {
    const muc = e.muc[j]!, daLam = e.lam[j]!
    return { ngay, mucToiThieu: muc, daLam, thieu: Math.max(0, muc - daLam), datMuc: daLam >= muc, mucUocTinh: false, nguonMuc: 'da-chot', tang: (1 + MUC.indexOf(muc as 24 | 30 | 36)) as 1 | 2 | 3, cheDo: 'hanh-trinh', homNay: ngay === HOM_NAY }
  })
}

/** `/gv/bai-hang-ngay` giả cùng bộ em (bảng từng ngày mở từ Nhịp học). */
export function baiHangNgayTuNhip(): KetQuaBaiHangNgay {
  const em: EmBaiHangNgay[] = EM.map((e) => {
    const ngay = ngayBai(e)
    const qua = ngay.filter((n) => !n.homNay)
    let lon: { ngay: string; thieu: number } | null = null
    for (const n of qua) if (n.thieu > 0 && (!lon || n.thieu >= lon.thieu)) lon = { ngay: n.ngay, thieu: n.thieu }
    return {
      sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, khoi: e.khoi, ngay,
      soNgayThieu: qua.filter((n) => !n.datMuc).length, tongCauThieu: qua.reduce((t, n) => t + n.thieu, 0), ngayThieuNhieuNhat: lon,
      soNgayDu: ngay.filter((n) => n.datMuc).length, soNgayKhongLam: qua.filter((n) => n.daLam === 0).length, tongDaLam: ngay.reduce((t, n) => t + n.daLam, 0),
      thieuHomNay: ngay.find((n) => n.homNay)?.thieu ?? 0,
    }
  }).sort((a, b) => b.soNgayThieu - a.soNgayThieu || b.tongCauThieu - a.tongCauThieu || b.thieuHomNay - a.thieuHomNay || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd))
  return { ok: true, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY, ngay: NGAY, em, lop: LOP_DS, soOUocTinh: 0, soO: em.length * NGAY.length, canhBao: [] }
}

/** Tên em giả của cảnh này (lịch sử làm câu mở trong tấm hồ sơ). */
export const tenEmNhip = (sbd: string): string | null => EM.find((e) => e.sbd === sbd)?.hoTen ?? null

/** `/gv/ho-so-thai-do` giả: khung của bộ giả Bài hằng ngày, thay đúng em + lịch từng ngày của cảnh này. */
export function hoSoTuNhip(sbd: string): KetQuaHoSoThaiDo {
  const e = EM.find((x) => x.sbd === sbd) ?? EM[0]!
  const goc = hoSoThaiDoGia(tenEmBhn('12010') ? '12010' : sbd)
  const ngay: NgayHoatDong[] = ngayBai(e).map((n, j) => {
    const dung = Math.round(n.daLam * (0.6 + 0.3 * gia(Number(e.sbd), j)))
    return { ...n, soLuot: n.daLam, soDung: dung, soSai: n.daLam - dung, tiLeDung: n.daLam ? Math.round((100 * dung) / n.daLam) : null }
  })
  // nhãn + tín hiệu "Ngày đủ mức" theo ĐÚNG luật kết luận của máy chủ (`ketLuanThaiDo`) trên chính dãy ngày của em (ảnh không tự mâu thuẫn)
  const tinh = ngay.filter((n) => n.ngay >= e.ngayVao && (!n.homNay || n.datMuc))
  const du = tinh.filter((n) => n.datMuc).length
  const pA = Math.round((100 * du) / Math.max(1, tinh.length))
  const nhan: NhanThaiDo = e.doiPho ? 'doi-pho' : tinh.length < 3 ? 'chua-du-du-lieu' : pA >= 80 ? 'cham-chi' : 'chua-deu'
  const chuA = `Đủ mức ${du}/${tinh.length} ngày (${pA}%)`
  const tinHieu = goc.tinHieu.map((t) => (t.ma === 'ngay-du-muc' ? { ...t, tu: du, mau: tinh.length, giaTri: pA, chu: chuA, muc: tinh.length < 3 ? 'chua-du' as const : pA >= 80 ? 'tot' as const : pA >= 50 ? 'chu-y' as const : 'xau' as const } : t))
  const lyDo = [...(e.doiPho?.lyDo.map((x) => `${x}.`) ?? []), `Ngày đủ mức: ${chuA}.`]
  const soLuot = ngay.reduce((t, n) => t + n.soLuot, 0)
  const soDung = ngay.reduce((t, n) => t + n.soDung, 0)
  return {
    ...goc, em: { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, khoi: e.khoi }, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY, ngay, tinHieu,
    ketLuan: { nhan, chu: TEN_NHAN_THAI_DO[nhan], lyDo },
    dem: { ...goc.dem, soLuot, soCau: Math.round(soLuot * 0.85), soDung, soSai: soLuot - soDung, soLuotCoGiay: soLuot },
    // LÀN NHỊP EM 12/10C: ba trường CHỈ THÊM của máy chủ — nhóm tính bằng ĐÚNG phép thuần Nhịp học (từ ngày vào), cờ đối phó riêng.
    ...((t) => ({ nhomNhip: t.nhom, coDoiPho: !!e.doiPho, chuoiDuGanNhat: t.chuoiDuGanNhat }))(
      tomTatNhip(ngay.filter((n) => n.ngay >= e.ngayVao).map((n) => ({ ngay: n.ngay, muc: n.mucToiThieu, lam: n.daLam })), HOM_NAY),
    ),
  }
}
