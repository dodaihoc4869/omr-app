// CÂY CHỌN ĐỀ — tick nhiều tờ, gọn trên điện thoại.
//
// Thầy chốt 12/09: "cho chọn theo cây thư mục chuẩn theo kho đề nhé. Cho tick
// nhiều." Trước đó là một ô `<select>` phẳng 118 tờ: muốn tìm hai tờ cùng một
// bài phải cuộn qua cả kho, và mỗi lần chỉ chọn được một tờ.
//
// BA ĐIỀU CHỐT CỨNG:
//   · nút bấm cao ≥ 44px — ngón tay, không phải chuột;
//   · ô tick của NHÁNH có ba trạng thái (chưa · một phần · hết), vì tick nửa
//     nhánh mà hiện như đã tick hết là thầy giao thiếu đề mà không biết;
//   · mặc định ĐÓNG hết, mở đúng nhánh cần — mở sẵn cả cây thì vẫn là danh sách
//     phẳng, chỉ dài hơn.
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { trangThaiTick, type NutCay } from '../lib/cay-kho-de'

const CHU: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }
const PHU: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

interface Props {
  cay: NutCay[]
  daChon: Set<string>
  onDoi: (moi: Set<string>) => void
}

export default function CayChonDe({ cay, daChon, onDoi }: Props) {
  const [mo, setMo] = useState<Set<string>>(new Set())

  const doiMo = (khoa: string) => {
    const m = new Set(mo)
    if (m.has(khoa)) m.delete(khoa)
    else m.add(khoa)
    setMo(m)
  }

  const tick = (n: NutCay) => {
    const m = new Set(daChon)
    // Nhánh đã tick hết thì bỏ cả nhánh; còn lại thì tick cho đủ. Hai bước này
    // là toàn bộ luật, và nó khớp với ba trạng thái hiện trên ô tick.
    const het = trangThaiTick(n, daChon) === 'het'
    for (const x of n.moiMaDe) {
      if (het) m.delete(x)
      else m.add(x)
    }
    onDoi(m)
  }

  const ve = (n: NutCay, sau: number) => {
    const laLa = n.de !== null
    const tt = trangThaiTick(n, daChon)
    const dangMo = mo.has(n.khoa)
    return (
      <div key={n.khoa}>
        <div className="flex items-center" style={{ gap: 'var(--k2)', paddingLeft: sau * 14, minHeight: 44 }}>
          {laLa ? (
            <span style={{ width: 18 }} />
          ) : (
            <button
              type="button"
              className="tap-target"
              onClick={() => doiMo(n.khoa)}
              aria-label={dangMo ? 'Thu nhánh' : 'Mở nhánh'}
              style={{ display: 'flex', alignItems: 'center', color: 'var(--nhat)' }}
            >
              {dangMo ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
          <button
            type="button"
            className="tap-target"
            onClick={() => tick(n)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--k2)', flex: 1, textAlign: 'left', minHeight: 44 }}
          >
            <span
              aria-hidden
              style={{
                width: 20,
                height: 20,
                flex: '0 0 20px',
                borderRadius: 6,
                border: '2px solid var(--vien)',
                background: tt === 'het' ? 'var(--chinh)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--nen)',
                fontFamily: 'var(--sans)',
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              {tt === 'het' ? '✓' : tt === 'mot_phan' ? <span style={{ width: 10, height: 2, background: 'var(--chinh)' }} /> : ''}
            </span>
            <span style={laLa ? CHU : { ...CHU, fontWeight: 600 }}>{n.nhan}</span>
            {!laLa && <span style={PHU}>· {n.tongCau} câu</span>}
          </button>
        </div>
        {!laLa && dangMo && n.con.map((c) => ve(c, sau + 1))}
      </div>
    )
  }

  if (cay.length === 0) return <div style={PHU}>Kho đề trống — vào Cài đặt bấm "Chuyển KHO ĐỀ sang máy chủ mới".</div>
  return <div style={{ display: 'grid' }}>{cay.map((n) => ve(n, 0))}</div>
}
