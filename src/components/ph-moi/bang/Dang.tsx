// Khối "Điểm mạnh · cần luyện" của bảng "Mọi thứ về con" kiểu Apple (mẫu ph-d-bang-day-du.html #muc-dang): thẻ "Dạng con làm tốt" + "Dạng con còn vấp", thanh đúng/tổng + ba bậc Biết · Hiểu · Vận dụng (bậc: manhYeu.bac ⇒ bacTheoDang ⇒ dangVap; không biết ⇒ không vẽ).
// "Mới lên bậc … hôm nay" CHỈ khi máy chủ liệt kê dạng ở manhYeu.lenBacHomNay. Máy chủ KHÔNG trả số câu ôn theo từng dạng ⇒ bỏ dòng ấy; chân thẻ nói đúng số câu lịch ôn ngày mai (không gán cho "3 dạng này").
import { ngayNganVn } from '../../../lib/ph-moi/dinh-dang'
import type { DangManhYeu, PhMoi } from '../../../lib/ph-moi/du-lieu'
import { TEN_BAC_SO } from '../nhan'
import { BtLichTich, BtMucTieu, BtMuiLen, BtTichVong } from './bieu-tuong'
import { Thanh } from './dung-chung'
import { mocMay } from './c-chung'
import './khoi-c.css'

export const coDang = (pm: PhMoi): boolean => !!pm.manhYeu && (pm.manhYeu.lamTot.length > 0 || pm.manhYeu.conVap.length > 0)

const CHI_SO_BAC = { biet: 0, hieu: 1, van_dung: 2 } as const

/** Bậc hiện tại 0|1|2 của một dạng: manhYeu.bac ⇒ bacTheoDang ⇒ dangVap (cùng tên dạng); không có ⇒ null. */
function bacCua(pm: PhMoi, d: DangManhYeu): 0 | 1 | 2 | null {
  if (d.bac) return CHI_SO_BAC[d.bac]
  const b = pm.bacTheoDang?.find((x) => x.ten === d.tenDang)
  if (b) return b.bac
  return pm.dangVap?.find((x) => x.ten === d.tenDang)?.bac ?? null
}

function BaBac({ bac }: { bac: 0 | 1 | 2 }) {
  return (
    <div className="phm-bac" role="img" aria-label={`Bậc hiện tại của con: ${TEN_BAC_SO[bac]}. Ba bậc: Biết, Hiểu, Vận dụng`}>
      {TEN_BAC_SO.map((t, i) => (
        <span key={t} data-nay={i === bac ? '' : undefined}>
          {t}
        </span>
      ))}
    </div>
  )
}

function TheDang({ pm, tieuDe, ds, vap }: { pm: PhMoi; tieuDe: string; ds: DangManhYeu[]; vap: boolean }) {
  const len = pm.manhYeu?.lenBacHomNay ?? []
  const mai = pm.lichOn?.ngayMai ?? 0
  return (
    <div className="phm-the phm-the--dem">
      <p className="phm-nhan-muc" data-mau={vap ? 'cam' : 'dat'}>
        {vap ? <BtMucTieu /> : <BtTichVong />}
        {tieuDe}
      </p>
      <ul className="phm-dang">
        {ds.map((d, i) => {
          const bac = bacCua(pm, d)
          const moiLen = len.includes(d.tenDang)
          return (
            <li key={`${d.tenDang}-${i}`}>
              <div className="phm-dang__dau">
                <h3>{d.tenDang}</h3>
                <span>
                  đúng <b>{d.dung}/{d.tong}</b> câu
                </span>
              </div>
              <Thanh manh mau={vap ? 'cam' : 'dat'} ti={d.tong > 0 ? d.dung / d.tong : 0} nhan={`đúng ${d.dung} trong ${d.tong} câu`} />
              {bac !== null && <BaBac bac={bac} />}
              {moiLen && (
                <p className="phm-dang__ghi" data-mau="dat">
                  <BtMuiLen />
                  {bac !== null ? `Mới lên bậc ${TEN_BAC_SO[bac]} hôm nay` : 'Mới lên bậc hôm nay'}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {vap && mai > 0 && (
        <p className="phm-the__cuoi">
          <BtLichTich />
          <span>
            A.I Đỗ Đại Học đã xếp <b>{mai} câu</b> vào lịch ôn ngày {ngayNganVn(mocMay(pm) + 86_400_000)}
          </span>
        </p>
      )}
    </div>
  )
}

export function Dang({ pm }: { pm: PhMoi }) {
  const m = pm.manhYeu
  if (!m || !coDang(pm)) return null
  return (
    <section className="phm-muc" id="muc-dang" aria-label="Điểm mạnh và cần luyện">
      <header className="phm-muc__dau">
        <h2>Điểm mạnh · cần luyện</h2>
        <p>tính trên 14 ngày gần đây</p>
      </header>
      <div className="phm-hai">
        {m.lamTot.length > 0 && <TheDang pm={pm} tieuDe="Dạng con làm tốt" ds={m.lamTot} vap={false} />}
        {m.conVap.length > 0 && <TheDang pm={pm} tieuDe="Dạng con còn vấp" ds={m.conVap} vap />}
      </div>
      <p className="phm-ghi-chu">Mỗi dạng bài con đi qua ba bậc: Biết, Hiểu, Vận dụng.</p>
    </section>
  )
}
