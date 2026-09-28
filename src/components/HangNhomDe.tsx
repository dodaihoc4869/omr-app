// HÀNG CHIP LỌC NHÓM ĐỀ — MỘT DÒNG, VUỐT NGANG.
//
// Thầy chốt 12/09 lúc 0:33, kèm ảnh màn: 28 nhóm đề xuống dòng thành mười hàng
// chip, đẩy hộp chọn đề rơi khỏi màn. Thầy phải cuộn qua cả rừng chữ mới tới
// chỗ tick đề.
//
// BA QUYẾT ĐỊNH:
//   · MỘT DÒNG, vuốt ngang. Chiều cao của khối lọc từ đó là hằng số, không phụ
//     thuộc kho có bao nhiêu nhóm — thêm 50 nhóm nữa màn vẫn y nguyên.
//   · Nhãn CẮT NGẮN, giữ nguyên tên đầy đủ trong `title`. Tên nhóm dài nhất của
//     thầy là "11 · C5 - Dẫn xuất halogen – Alcohol – Phenol"; để nguyên thì
//     một chip chiếm gần trọn bề ngang điện thoại.
//   · Chip "Tất cả" LUÔN đứng đầu và không cuộn mất: nó là đường về, và đường
//     về thì không được đi tìm.

/** Cắt nhãn cho vừa một chip. Cắt ở khoảng trắng gần nhất để không đứt giữa
 * chữ, và chỉ thêm dấu ba chấm khi thật sự có cắt. */
export function nhanNgan(chu: string, tran = 26): string {
  const s = String(chu ?? '').trim()
  if (s.length <= tran) return s
  const cat = s.slice(0, tran)
  const khoang = cat.lastIndexOf(' ')
  return `${(khoang > tran * 0.6 ? cat.slice(0, khoang) : cat).trimEnd()}…`
}

// Hình thẻ: kiểu chung src/styles/the-loc.css (.tl-hang--mot-dong = luôn một hàng, overflowX: 'auto', whiteSpace: 'nowrap';
// viên 32 px, vùng chạm 44 px nhờ ::after).
export default function HangNhomDe({ ds, chon, onChon }: { ds: string[]; chon: string; onChon: (n: string) => void }) {
  if (ds.length === 0) return null
  return (
    <div className="tl-hang tl-hang--mot-dong" role="group" aria-label="Lọc theo nhóm đề">
      {['', ...ds].map((n) => (
        <button key={n || '__tat_ca'} type="button" onClick={() => onChon(n)} aria-pressed={chon === n} className="tl-the" title={n || 'Tất cả nhóm đề'}>
          {n ? nhanNgan(n) : 'Tất cả'}
        </button>
      ))}
    </div>
  )
}
