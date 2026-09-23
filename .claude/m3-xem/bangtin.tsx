// TẠM, KHÔNG commit: dựng BẢN MẪU Bảng tin bản 3 trong vỏ app thầy với dữ liệu giả (tests/fixtures/bang-tin-mau.ts). ?mau=day|that|rong  ?trang=0..5  ?tam=bai|em|dang|may  ?xuong=1  ?loi=1
import { createRoot } from 'react-dom/client'
import '/src/index.css'
import '/src/styles/tokens.css'
import '/src/styles/teacher-layout.css'
import '/src/styles/vo-thay.css'
import '/src/components/m3'
import { apDungGiaoDien, docGiaoDien } from '/src/lib/giao-dien-thay'
import BottomNav from '/src/components/BottomNav'
import ThanhBenTrai from '/src/components/ThanhBenTrai'
import { useAppStore } from '/src/store/appStore'
import BangTinV3, { BangTinLoi, BangTinXuong } from '/src/components/bang-tin/BangTin'
import { docBangTin } from '/src/lib/bang-tin-thay'
import { MAU_DAY, MAU_RONG, MAU_THAT_SANG_21 } from '/tests/fixtures/bang-tin-mau'
import { useEffect } from 'react'

const q = new URLSearchParams(location.search)
history.replaceState(null, '', '/gv')
apDungGiaoDien(docGiaoDien())
useAppStore.getState().setScreen('examhub')
const nguon = q.get('mau') === 'that' ? MAU_THAT_SANG_21 : q.get('mau') === 'rong' ? MAU_RONG : MAU_DAY
const CHUA_HOC = { ngay: '2026-09-21', theoLop: [
  { lop: '12 - Tinh Hoa', siSo: 30, chuaHoc: 4, em: [{ sbd: '12012', hoTen: 'Trần Minh Anh' }, { sbd: '12020', hoTen: 'Vũ Quang Huy' }, { sbd: '12021', hoTen: 'Đỗ Khánh Linh' }, { sbd: '12022', hoTen: 'Bùi Gia Bảo' }] },
  { lop: '12 - Lớp Thường', siSo: 28, chuaHoc: 2, em: [{ sbd: '12007', hoTen: 'Nguyễn Hoàng Long' }, { sbd: '12026', hoTen: 'Lê Thu Hà' }] },
  { lop: '11 - Tinh Hoa', siSo: 25, chuaHoc: 1, em: [{ sbd: '11003', hoTen: 'Phan Nhật Nam' }] },
] }
const SAI_NHANH = { ds: [
  { sbd: '12012', hoTen: 'Trần Minh Anh', tenLop: '12 - Tinh Hoa', soCau: 12, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-15', co: true },
  { sbd: '12007', hoTen: 'Nguyễn Hoàng Long', tenLop: '12 - Lớp Thường', soCau: 9, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-15', co: true },
  { sbd: '12026', hoTen: 'Lê Thu Hà', tenLop: '12 - Lớp Thường', soCau: 8, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-15', co: true },
] }
const NO = [{ lop: '12 - Tinh Hoa', siSo: 30, soEmNo: 5 }, { lop: '12 - Lớp Thường', siSo: 28, soEmNo: 3 }, { lop: '11 - Tinh Hoa', siSo: 25, soEmNo: 1 }]
let mo: any = q.get('chuahoc') ? { ...(nguon as any), chuaHocHomNay: CHUA_HOC } : nguon
if (q.get('sainhanh')) mo = { ...mo, saiNhanh: SAI_NHANH }
if (q.get('no')) mo = { ...mo, nhip: { ...mo.nhip, noTheoLop: NO } }
const du = docBangTin(mo as any)!
const NAY = Date.parse('2026-09-21T06:14:00.000Z') // 13:14 giờ VN
const DS = [['12007', 'Nguyễn Hoàng Long', '12 - Lớp Thường'], ['12012', 'Trần Minh Anh', '12 - Tinh Hoa'], ['12026', 'Lê Thu Hà', '12 - Lớp Thường']].map(([sbd, hoTen, lop]) => ({ sbd, hoTen, lop }))

function Vo() {
  useEffect(() => {
    const t = q.get('tam')
    if (t) setTimeout(() => (document.querySelector(t === 'nolop' ? '[data-khoi="no-chang"]' : t === 'sainhanh' ? '[data-khoi="sai-nhanh"]' : t === 'chuahoc' ? '[data-khoi="chua-hoc-hom-nay"]' : `[data-khoi="${t === 'bai' ? 'bai-tap' : t === 'em' ? 'can-de-y' : t === 'dang' ? 'dang-vap' : 'may-da-lam'}"] .bt3-nua`) as HTMLElement | null)?.click(), 400)
    const tr = Number(q.get('trang') || 0)
    if (tr) setTimeout(() => { const el = document.querySelector('.bt3-luot') as HTMLElement | null; el?.scrollTo({ left: tr * el.clientWidth }) }, 300)
  }, [])
  return (
    <div className="min-h-screen m3 m3-thay vo-thay">
      <ThanhBenTrai />
      <div className="khung-noi-dung">
        <div className="giua-noi-dung" data-teacher-screen="examhub">
          {q.get('xuong') ? <BangTinXuong /> : q.get('loi') ? <BangTinLoi chu="Máy chủ trả lời chậm — chưa lấy được số liệu hôm nay." /> : <BangTinV3 du={du} nayMs={NAY} dsTraCuu={DS} onMoEm={() => {}} onMoCa={() => {}} dungNhip={q.get('dn') === '0' ? null : { soEm: 97, soCoLo: 148 }} />}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<Vo />)
