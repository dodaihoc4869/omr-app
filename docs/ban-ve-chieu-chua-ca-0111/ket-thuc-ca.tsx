// BẢN VẼ — màn «Ca đã kết thúc» THẬT (`KetThucCa`, dữ liệu giả) + NGUYÊN MẪU nút mới «Chiếu chữa bài». Bundle bằng esbuild trong `chup.mjs`.
// Trạng thái chọn bằng hash: #tt=co (có câu sai) · #tt=dung-het (cả lớp đúng hết) · #tt=khong-de (máy này chưa có đề có đáp án) · #tt=con-em (còn em đang làm).
import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Presentation } from 'lucide-react'
import KetThucCa from '../../src/components/ca-thi/KetThucCa'
import type { BaoCaoCaLop } from '../../src/lib/bao-cao-ca-lop'

const tt = new URLSearchParams(location.hash.slice(1)).get('tt') ?? 'co'
const lop: BaoCaoCaLop = {
  nop: tt === 'con-em' ? 30 : 32, daVao: 32, chuaNop: tt === 'con-em' ? 2 : 0, tb: 6.4, cao: 9.5, thap: 2.8, phutTB: 13,
  pho: [{ nhan: '0–2', soEm: 0 }, { nhan: '2–4', soEm: 3 }, { nhan: '4–5', soEm: 4 }, { nhan: '5–6.5', soEm: 8 }, { nhan: '6.5–8', soEm: 11 }, { nhan: '8–10', soEm: 6 }],
  baPhan: [
    { ma: 'I', ten: 'Phần I', diemTB: 2.6, toiDa: 3, dungTB: 10.4, tong: 12 },
    { ma: 'II', ten: 'Phần II', diemTB: 2.1, toiDa: 4, dungTB: 2.3, tong: 4 },
    { ma: 'III', ten: 'Phần III', diemTB: 1.7, toiDa: 3, dungTB: 2.8, tong: 6 },
  ],
  dang: [],
  cauSai: tt === 'dung-het' ? [] : [
    { qid: 'q7', phan: 'I', soCau: 7, dang: 'Kim loại tác dụng với acid', soSai: 21, soLam: 32, tiLeSai: 0.66, dapAnDung: 'A', dapAnSaiNhieu: { dapAn: 'B', soEm: 14 } },
    { qid: 'q18', phan: 'III', soCau: 18, dang: 'pH dung dịch sau trộn', soSai: 17, soLam: 32, tiLeSai: 0.53, dapAnDung: '2', dapAnSaiNhieu: { dapAn: '1,7', soEm: 9 } },
    { qid: 'q13', phan: 'II', soCau: 13, dang: 'Chuyển dịch cân bằng', soSai: 14, soLam: 32, tiLeSai: 0.44, dapAnDung: 'SĐSĐ', dapAnSaiNhieu: null },
    { qid: 'q21', phan: 'III', soCau: 21, dang: 'Hiệu suất phản ứng', soSai: 11, soLam: 32, tiLeSai: 0.34, dapAnDung: '50', dapAnSaiNhieu: { dapAn: '78', soEm: 5 } },
  ],
  emCanYY: [
    { sbd: '1', hoTen: 'Kiều Anh Tú', lop: '11A2', lyDo: ['3,0 điểm', 'thấp hơn lần trước 2,5'] },
    { sbd: '2', hoTen: 'Phạm Quốc Dũng', lop: '11A2', lyDo: ['4,3 điểm'] },
  ],
  coBangCham: tt !== 'khong-de',
}

/** NÚT MỚI (nguyên mẫu): nút chính đứng TRƯỚC «Xem báo cáo chi tiết» ở đầu màn. */
function NutChieu() {
  const [cho, setCho] = useState<Element | null>(null)
  useLayoutEffect(() => setCho(document.querySelector('[data-vung="ket-thuc-ca"] .ct-hang-nut')), [])
  if (!cho) return null
  const tat = tt === 'dung-het' || tt === 'khong-de'
  const nhan = tt === 'dung-het' ? 'Cả lớp đúng hết · không có câu cần chữa' : tt === 'khong-de' ? 'Máy này chưa có đề có đáp án của ca' : tt === 'con-em' ? '2 em còn đang làm — chiếu lúc này các em ấy thấy đề và lời giải' : 'Xếp khó → dễ, cùng mức thì sai nhiều → ít'
  return createPortal(
    <div className="ve-chieu">
      <button type="button" className="ct-nut ct-nut-chinh" disabled={tat} aria-describedby="ve-chieu-ghi">
        <Presentation size={18} aria-hidden="true" />
        {tt === 'dung-het' || tt === 'khong-de' ? 'Chiếu chữa bài' : 'Chiếu chữa bài · 9 câu'}
      </button>
      <span id="ve-chieu-ghi" className="ct-ghi">{nhan}</span>
    </div>,
    cho,
  )
}

function Man() {
  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <KetThucCa
        tenCa="Kiểm tra 15 phút · 11A2"
        luc="14:05 · Chủ nhật 01/11/2026"
        siSo={32}
        phutDe={15}
        lop={lop}
        them={null}
        dangTai={false}
        loi=""
        canCongBo={false}
        dangCongBo={false}
        onCongBo={() => {}}
        onXemBaoCao={() => {}}
        onMoEm={() => {}}
        emChuaNop={tt === 'con-em' ? [{ sbd: '9', hoTen: 'Lý Hoàng Nam' }, { sbd: '10', hoTen: 'Mai Thuỳ Trang' }] : []}
      />
      {tt === 'con-em' && (
        <style>{`.ve-chieu .ct-ghi{color:var(--gvm-ho-dam)}`}</style>
      )}
      <NutChieu />
    </div>
  )
}

createRoot(document.getElementById('goc')!).render(<Man />)
