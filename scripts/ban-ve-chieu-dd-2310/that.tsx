// TRANG CHỤP MÀN CHIẾU THẬT (component `BanChieuDiemDanh` ĐANG PHÁT HÀNH, dữ liệu giả) — nghiệm thu bằng máy cho build 23/10.
//   npx vite build --config scripts/ban-ve-chieu-dd-2310/vite.config.mjs --outDir <tạm> && node scripts/ban-ve-chieu-dd-2310/chup.mjs <tạm> <ra> that
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-800.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/latin-800.css'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/styles/gv-mau.css'
import '../../src/components/bac-cham-chi/bac-cham-chi.css'
import BanChieuDiemDanh from '../../src/components/day-hoc/BanChieuDiemDanh'
import { khoaNhom, nhipTheoSbd, thongKeBuoi, type CheDoChieu, type EmBuoi } from '../../src/lib/diem-danh-nhip'
import type { TrangThaiBuoi } from '../../src/lib/buoi-hoc-api'
import type { MucLamEm } from '../../src/lib/muc-lam-lo-api'
import { bacChamChi } from '../../server/src/bac-cham-chi'
import { tomTatNhip } from '../../server/src/nhip-hoc-luat'
import type { EmNhipHoc, KetQuaNhipHoc } from '../../server/src/nhip-hoc-kieu'
import { nhipHocGia } from '../chup-v2/gia/nhip-hoc'

const k = new URLSearchParams(location.search).get('k') ?? 'A1'

// ───────────── DỮ LIỆU GIẢ (một bảng, mọi số tính ra)
const TEN_DAI = 'Nguyễn Hoàng Phương Thảo Nguyên' // 31 ký tự — kiểm không cắt tên
function lopGia(): KetQuaNhipHoc {
  const r = nhipHocGia()
  const kq = (r.ok ? r.du : {}) as unknown as KetQuaNhipHoc
  return {
    ...kq,
    em: kq.em.map((e: EmNhipHoc) => {
      const dai = kq.ngay.map((ngay, i) => ({ ngay, muc: e.muc[i]!, lam: e.lam[i]! })).filter((x) => x.ngay >= e.ngayVao)
      const b = k === 'A5' ? null : bacChamChi(dai, kq.homNay, tomTatNhip(dai, kq.homNay))
      return b ? { ...e, bacCham: b } : e
    }),
  }
}
const KQ = lopGia()
const LOP = k === 'A3' ? '12 Lớp Thường' : '12 Nhóm 10 điểm'
const MO_LUC = '2026-10-12T10:52:00Z'
const dsLop = KQ.em.filter((e) => e.lop === LOP)
// đổi tên một em có mặt thành tên dài nhất lớp
const emDai = dsLop[4]!
emDai.hoTen = TEN_DAI
const vangSbd = new Set(dsLop.filter((_, i) => (k === 'A3' ? i % 11 === 3 : i % 5 === 2)).map((e) => e.sbd))
const coMatThu = k === 'A2' ? [] : dsLop.filter((e) => !vangSbd.has(e.sbd))
const TT: TrangThaiBuoi = {
  buoi: { id: 'BH-V', ten: `Buổi học 12/10 · ${LOP}`, lop: LOP, moLuc: MO_LUC, hetHan: '2026-10-13T10:52:00Z', dongLuc: null, dangMo: true },
  ma: '482915', doiMaLuc: 1,
  coMat: coMatThu.map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: new Date(Date.parse(MO_LUC) + 60_000 + i * 21_000).toISOString(), cach: (i === 3 ? 'thay' : 'ma') as 'thay' | 'ma' })),
  siSo: dsLop.length,
  lopEm: dsLop.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: LOP })),
}
const TK = thongKeBuoi(TT, nhipTheoSbd(KQ))
const coBac = TK.ds.some((e) => !!e.bacCham)

/** Cách làm bài 14 ngày GIẢ của một em (đúng hình dạng `/gv/muc-lam-lo` bản công khai: Mức 6 đã hạ về Treo). Tất định theo SBD. */
function mucGia(e: EmBuoi) {
  const s = Number(e.sbd) % 97
  const nhom = khoaNhom(e)
  const soDo = 6 + (s % 23)
  const voiTi = nhom === 'luoi' ? 0.5 : nhom === 'chua-deu' ? 0.32 : 0.14
  const voi = Math.round(soDo * Math.min(0.85, voiTi + ((s % 7) - 3) * 0.04))
  const treo = k === 'B4' ? 0 : nhom === 'luoi' ? s % 4 : s % 9 === 0 ? 1 : 0
  const nghi = Math.max(0, soDo - voi - treo)
  const sai = Math.round(voi * 0.7 + nghi * 0.2)
  const saiVoi = Math.min(sai, Math.round(voi * 0.7))
  // Treo máy đầy đủ (thầy 23/10): tổng giây treo + số ngày có treo + lượt chưa đo (máy chủ cần thêm `giayTreo`, `soNgayTreo` vào /gv/muc-lam-lo).
  const giayTreo = treo * (150 + (s % 7) * 55)
  const soNgayTreo = treo === 0 ? 0 : Math.min(treo, 1 + (s % 3))
  const chuaDo = k === 'B4' ? soDo : Math.round(soDo * 0.08)
  return { soDo, voi, nghi, treo, sai, saiVoi, giayTreo, soNgayTreo, chuaDo }
}



/** Một em ⇒ đúng hình dạng `MucLamEm` (Vội chia Mức 1/2, Có nghĩ chia Mức 3/4; Cố tình 0 — bản giả). */
function mucLamGia(e: EmBuoi): MucLamEm {
  const g = mucGia(e)
  const m1 = Math.floor(g.voi / 2), m3 = Math.floor(g.nghi / 2)
  return { soDo: g.voi + g.nghi + g.treo, chuaCoSoDo: 0, m: [m1, g.voi - m1, m3, g.nghi - m3], soUocTinh: 0, soTreo: g.treo, soCoTinh: 0, soChuaDoTreo: g.chuaDo, saiLamVoi: g.saiVoi, saiDuNghi: g.sai - g.saiVoi, giayTreo: g.giayTreo, soNgayTreo: g.soNgayTreo }
}

function Man() {
  const cheDo: CheDoChieu = k.startsWith('B') ? 'nhip-lop' : 'diem-danh'
  // A4: lần đầu thiếu em vào muộn nhất ⇒ 300 ms sau em ấy điểm danh ⇒ thẻ nổi "Vừa điểm danh" như lớp thật
  const [du, setDu] = useState(k !== 'A4')
  useEffect(() => {
    if (k !== 'A4') return
    const t = setTimeout(() => setDu(true), 300)
    return () => clearTimeout(t)
  }, [])
  const tt: TrangThaiBuoi = du ? TT : { ...TT, coMat: TT.coMat.slice(0, -1) }
  const tk = thongKeBuoi(tt, nhipTheoSbd(KQ))
  const ml = new Map(tk.coMat.map((e) => [e.sbd, mucLamGia(e)] as const))
  useEffect(() => {
    const phim = k === 'B2' ? 'h' : k === 'B3' ? 'm' : ''
    if (phim) window.dispatchEvent(new KeyboardEvent('keydown', { key: phim }))
  }, [])
  return (
    <BanChieuDiemDanh
      cheDo={cheDo}
      tt={{ ...tt, doiMaLuc: Date.now() + 38_000 }}
      tk={tk}
      nhip={k === 'B5' ? { kq: null, dangTai: false, loi: 'Máy chủ không trả lời sau 8 giây.' } : { kq: KQ, dangTai: false, loi: '' }}
      goc="https://omr-app-b3u.pages.dev"
      matKetNoi={k === 'A3'}
      hoSoMo={false}
      onDoiCheDo={() => {}}
      onDong={() => {}}
      onMoEm={() => {}}
      onThuLaiNhip={() => {}}
      onSangDauGio={() => {}}
      mucLam={ml}
      mucLamDang={false}
    />
  )
}
void khoaNhom
createRoot(document.getElementById('root')!).render(<div className="m3 m3-thay vo-thay"><Man /></div>)
