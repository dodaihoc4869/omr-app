// SOÁT APP GIÁO VIÊN Ở TRẠNG THÁI DỮ LIỆU TRỐNG (tạm, KHÔNG commit): dựng vỏ app thầy + MỘT màn, nói chuyện với máy chủ cục bộ trống (:8787).
import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '/src/index.css'
import '/src/styles/tokens.css'
import '/src/styles/teacher-layout.css'
import '/src/styles/vo-thay.css'
import '/src/components/m3'
import { apDungGiaoDien, docGiaoDien } from '/src/lib/giao-dien-thay'
import BottomNav from '/src/components/BottomNav'
import ThanhBenTrai from '/src/components/ThanhBenTrai'
import Toast from '/src/components/Toast'
import ChanLoi from '/src/components/ChanLoi'
import { useAppStore } from '/src/store/appStore'
import { luuSoCauCa, saveTeacherSecret, saveScriptUrl, saveCauHinhMayChu, datMaBiMatPhien } from '/src/lib/exam-db'
import { datDangMoKhoa } from '/src/lib/cap-nhat-app'
import { saveClassList } from '/src/lib/classlist-db'

const q = new URLSearchParams(location.search)
const man = (q.get('man') || 'examhub') as any
const coLop = q.get('lop') !== '0'
history.replaceState(null, '', '/gv')

const MAY_CHU = 'https://omr.ttadodaihoc.workers.dev' // Playwright chuyển hướng sang :8787
await saveTeacherSecret('bi-mat-thu')
datMaBiMatPhien('bi-mat-thu')
datDangMoKhoa(true)
await saveScriptUrl(MAY_CHU)
await saveCauHinhMayChu({ BAT: true, URL: MAY_CHU })
const HANG = [['12001', 'Nguyễn Văn Minh', '12A1'], ['12002', 'Trần Thị Lan', '12A1'], ['12003', 'Lê Hoàng Nam', '12A2']].map(([sbd, hoTen, lop]) => ({ sbd, hoTen, sdt: '', lop, namSinh: '2008', raw: {} }))
await saveClassList(coLop ? HANG : [], { sheetUrl: 'https://may.test/lop', mapping: { sbd: 'SBD', hoTen: 'Họ tên' }, syncedAt: new Date().toISOString(), mode: 'tsv' } as any)
useAppStore.getState().setClassList(coLop ? HANG : [])
if (q.get('socau') && q.get('ma')) await luuSoCauCa(q.get('ma')!, { I: 18, II: 4, III: 6 })
if (q.get('em')) useAppStore.getState().moHoSoEm(q.get('em')!)
if (q.get('ma')) useAppStore.getState().moChiTietCa(q.get('ma')!)
apDungGiaoDien(docGiaoDien())
useAppStore.getState().setScreen('giaobtvn')


import { useState } from 'react'
import KhoiCaNhanHoa from '/src/components/KhoiCaNhanHoa'
import XemTruocPhanBo from '/src/components/XemTruocPhanBo'
import { taoHatGiong } from '/src/lib/btvn-nang-do-thay'

const CHUYEN_DE = ['Este – khái niệm', 'Thuỷ phân ester', 'Xà phòng hoá', 'Chất béo', 'Glucose tráng bạc', 'Oxi hoá ancol']
const CAU = Array.from({ length: 80 }, (_, i) => ({ qid: 'D-' + (i + 1), dang: i % 7 === 0 ? null : 'DANG_' + (i % 12), chuyenDe: CHUYEN_DE[i % 6], mucDo: (i % 3) as 0 | 1 | 2, sao: 1 as const, phan: (i < 48 ? 'I' : i < 68 ? 'II' : 'III') as 'I' | 'II' | 'III' }))
const SBD = ['12121007', '12121034', '12121019', '12121002', '12121015', '12121031', '12121011']
const hat = taoHatGiong()

function Trang() {
  const [bat, setBat] = useState(q.get('tat') !== '1')
  const [ghim, setGhim] = useState<string[]>(q.get('ghim') === '0' ? [] : ['D-12', 'D-47'])
  const [xem, setXem] = useState(q.get('xem') === '1')
  return (
    <div className="min-h-screen m3 m3-thay vo-thay">
      <ThanhBenTrai />
      <div className="khung-noi-dung">
        <div className="giua-noi-dung" data-teacher-screen="giaobtvn">
          <div className="gv-page" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Giao bài tập về nhà</h1>
            <KhoiCaNhanHoa bat={bat} doi={setBat} cau={CAU} ghim={ghim} doiGhim={setGhim} onXemTruoc={() => setXem(true)} />
          </div>
        </div>
      </div>
      <BottomNav />
      {xem && <XemTruocPhanBo dau={{ dsMaDe: ['D1'], cau: CAU, ghim, hanNop: new Date(Date.now() + 7 * 86400000).toISOString(), hatGiong: hat }} dsSbd={SBD} cau={CAU} dangGiao={false} onDong={() => setXem(false)} onGiao={() => {}} />}
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<Trang />)
