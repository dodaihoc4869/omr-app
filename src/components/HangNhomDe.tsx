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
import type { CSSProperties } from 'react'

/** Cắt nhãn cho vừa một chip. Cắt ở khoảng trắng gần nhất để không đứt giữa
 * chữ, và chỉ thêm dấu ba chấm khi thật sự có cắt. */
export function nhanNgan(chu: string, tran = 26): string {
  const s = String(chu ?? '').trim()
  if (s.length <= tran) return s
  const cat = s.slice(0, tran)
  const khoang = cat.lastIndexOf(' ')
  return `${(khoang > tran * 0.6 ? cat.slice(0, khoang) : cat).trimEnd()}…`
}

const CHIP: CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-1)',
  minHeight: 34,
  padding: '0 var(--k3)',
  borderRadius: 'var(--bo-tron)',
  whiteSpace: 'nowrap',
  flex: '0 0 auto',
  transitionProperty: 'background-color, color, border-color',
  transitionDuration: 'var(--nhanh)',
}

export default function HangNhomDe({ ds, chon, onChon }: { ds: string[]; chon: string; onChon: (n: string) => void }) {
  if (ds.length === 0) return null
  return (
    <div
      className="flex items-center"
      style={{ gap: 'var(--k2)', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', paddingBottom: 2 }}
      role="group"
      aria-label="Lọc theo nhóm đề"
    >
      {['', ...ds].map((n) => {
        const dang = chon === n
        return (
          <button
            key={n || '__tat_ca'}
            type="button"
            onClick={() => onChon(n)}
            className="tap-target font-bold"
            title={n || 'Tất cả nhóm đề'}
            style={{
              ...CHIP,
              background: dang ? 'var(--tim-nen)' : 'var(--the-2)',
              color: dang ? 'var(--tim)' : 'var(--nhat)',
              border: `1.5px solid ${dang ? 'var(--tim)' : 'transparent'}`,
            }}
          >
            {n ? nhanNgan(n) : 'Tất cả'}
          </button>
        )
      })}
    </div>
  )
}
