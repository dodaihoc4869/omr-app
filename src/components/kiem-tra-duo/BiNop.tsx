// Bi đầu màn «Kết quả kiểm tra» sau khi nộp ca thi (thầy 27/10, kiểu Duolingo) — mảnh NẠP LƯỜI của KetQuaSauNop, chỉ khi <html data-trong="hs">.
// Chỉ lời động viên theo trạng thái công bố: chưa công bố ⇒ không nói gì về điểm. Thay dòng «Em đã nộp bài lúc …» (giữ chữ ấy làm dòng phụ, cùng lớp
// `xd-muc__mo-ta` ⇒ cùng ô lưới đầu màn).
import { BiKetQua, camTheoDiem } from './KhungKiemTra'

export default function BiNop({ diem, phu }: { diem?: number | null; phu: string }) {
  const coDiem = typeof diem === 'number' && Number.isFinite(diem)
  const tieuDe = !coDiem ? 'Em đã nộp bài!' : diem >= 8 ? 'Làm tốt lắm!' : diem < 5 ? 'Cùng Bi ôn lại nhé!' : 'Em đã nộp bài!'
  return <BiKetQua lop="xd-muc__mo-ta" cam={camTheoDiem(coDiem ? diem : null)} tieuDe={tieuDe} phu={phu} />
}
