// Mục "Tiến bộ" (bản vẽ khổ 3): khối anh hùng = câu từng sai đã thành thạo lại (Game Hoá 2.0: /ph/hoc-2; hệ cũ: lịch ôn), bậc của con ở từng dạng (Biết · Hiểu · Vận dụng),
// nhịp học 14 ngày (số câu mỗi ngày). Khối nào không có số thật ⇒ vắng; cả màn không có gì ⇒ một thẻ trống nói vì sao.
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { PhMoi } from '../../lib/ph-moi/du-lieu'
import type { Hoc2 } from '../../lib/ph-v3/du-lieu'
import { tachVn } from '../../lib/ph-moi/dinh-dang'
import { TEN_BAC_SO } from '../ph-moi/nhan'
import { Chip, DangTai, The, TheLoi, TheTrong } from './dung-chung'

const hai = (n: number) => String(n).padStart(2, '0')
/** 14 ngày (cũ → mới) kết thúc ở hôm nay theo giờ VN. */
export function muoiBonNgay(nowMs: number): string[] {
  const t = tachVn(nowMs)
  if (!t) return []
  const goc = Date.UTC(t.y, t.m - 1, t.d)
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(goc - (13 - i) * 86_400_000)
    return `${d.getUTCFullYear()}-${hai(d.getUTCMonth() + 1)}-${hai(d.getUTCDate())}`
  })
}

export default function ManTienBo({ v, hoc2 }: { v: ViewPhMoi; hoc2: Hoc2 | null }) {
  const pm = v.pm
  if (!pm) return (
    <div>
      <div className="ph3-tieu-de"><h1>Tiến bộ</h1></div>
      {v.trangThai === 'loi' ? <div className="ph3-luoi"><TheLoi chu={v.chuLoi} thuLai={v.thuLai} /></div> : <DangTai />}
    </div>
  )
  const coGi = !!(hoc2?.cauTungSai || pm.lichOn || (pm.bacTheoDang ?? []).length || (pm.nhipHoc?.ngay ?? []).length)
  return (
    <div data-vung="man-tien-bo">
      <div className="ph3-tieu-de"><h1>Tiến bộ</h1></div>
      <div className="ph3-luoi">
        <KhacPhuc pm={pm} hoc2={hoc2} />
        <BacTheoDang pm={pm} />
        <Nhip pm={pm} />
        {!coGi && <TheTrong id="ph3-tb-trong" tieuDe="Chưa đủ dữ liệu" chu="Con học thêm vài ngày thì tiến bộ theo từng dạng và nhịp học hiện ở đây." />}
      </div>
    </div>
  )
}

function KhacPhuc({ pm, hoc2 }: { pm: PhMoi; hoc2: Hoc2 | null }) {
  let so: number, tong: number, cau: string, phu: string, tieuDe: string
  const ts = hoc2?.cauTungSai
  if (ts) {
    tieuDe = 'Câu từng sai con đã thành thạo lại'
    so = ts.thanhThao
    tong = ts.tong
    cau = `Trong ${ts.tong} câu con từng làm sai, ${ts.thanhThao} câu con đã thành thạo lại.`
    phu = [ts.dangOn > 0 ? `${ts.dangOn} câu đang được ôn theo lịch` : '', ts.canDayLai > 0 ? `${ts.canDayLai} câu chờ thầy dạy lại trên lớp` : ''].filter(Boolean).join(' · ')
  } else if (pm.lichOn && (pm.lichOn.tongTungSai ?? pm.lichOn.daKhacPhuc14Ngay + pm.lichOn.conSaiChuaKhacPhuc) > 0) {
    const l = pm.lichOn
    tieuDe = 'Câu từng sai đã khắc phục'
    so = l.daKhacPhuc14Ngay
    tong = l.tongTungSai ?? l.daKhacPhuc14Ngay + l.conSaiChuaKhacPhuc
    cau = `14 ngày qua, con đã khắc phục ${l.daKhacPhuc14Ngay} câu từng sai.`
    phu = [l.conSaiChuaKhacPhuc > 0 ? `${l.conSaiChuaKhacPhuc} câu còn trong lịch ôn lại` : '', l.ngayMai > 0 ? `ngày mai đến lịch ${l.ngayMai} câu` : ''].filter(Boolean).join(' · ')
  } else return null
  const r = 52
  const cv = 2 * Math.PI * r
  const ti = tong > 0 ? Math.min(1, so / tong) : 0
  return (
    <section className="ph3-ah ph3-o-rong" aria-label={tieuDe} data-vung="khac-phuc">
      <h2 style={{ fontSize: 15, fontWeight: 600 }} className="ph3-ah__phu">{tieuDe}</h2>
      <div className="ph3-ah__vong">
        <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
          <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`${so} trên ${tong} câu`} data-mau="vong-xl">
            <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeOpacity={0.22} strokeWidth="14" />
            {ti > 0 && <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(ti * cv).toFixed(2)} ${cv.toFixed(2)}`} transform="rotate(-90 64 64)" />}
          </svg>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <b data-mau="vong-xl" style={{ fontSize: 34, lineHeight: 1, fontWeight: 800 }}>{so}</b>
            <span className="ph3-ah__phu" style={{ fontSize: 13 }}>/ {tong} câu</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 16, lineHeight: 1.45, fontWeight: 600 }}>{cau}</p>
          {phu && <p className="ph3-ah__phu" style={{ fontSize: 14 }}>{phu}.</p>}
        </div>
      </div>
    </section>
  )
}

function BacTheoDang({ pm }: { pm: PhMoi }) {
  const ds = pm.bacTheoDang ?? []
  if (ds.length === 0) return null
  const vuaLen = new Set([...(pm.vuaLenBac ?? []).map((x) => x.ma), ...(pm.tienBo?.dangTienBoNhat ?? []).map((x) => x.ma)])
  const dangVap = new Set((pm.dangVap ?? []).map((x) => x.ma))
  const dem = [0, 0, 0]
  for (const d of ds) dem[d.bac]!++
  return (
    <The id="ph3-bac" className="ph3-o-hep" vung="bac-theo-dang" tieuDe="Bậc của con ở từng dạng" phu="Mỗi dạng có ba bậc: Biết · Hiểu · Vận dụng">
      <div className="ph3-dem-bac">
        {[2, 1, 0].map((b) => (
          <div key={b} data-nhan={b === 2 ? '' : undefined}><b>{dem[b]}</b><span>dạng ở bậc {TEN_BAC_SO[b]}</span></div>
        ))}
      </div>
      <ul className="ph3-dang">
        {[...ds].sort((a, b) => b.bac - a.bac).map((d) => (
          <li key={d.ma}>
            <div className="ph3-dang__dong">
              <span>{d.ten}</span>
              {vuaLen.has(d.ma) ? <Chip mau="xl" nho>Vừa lên bậc</Chip> : dangVap.has(d.ma) ? <Chip mau="hp" nho>Đang luyện thêm</Chip> : null}
              <em data-bac={d.bac}>{TEN_BAC_SO[d.bac]}</em>
            </div>
            <div className="ph3-bac" aria-hidden="true">
              {[0, 1, 2].map((k) => <span key={k} data-co={k <= d.bac ? '' : undefined} />)}
            </div>
          </li>
        ))}
      </ul>
    </The>
  )
}

function Nhip({ pm }: { pm: PhMoi }) {
  const nh = pm.nhipHoc
  if (!nh || nh.ngay.length === 0 || !pm.serverNow) return null
  const ngay14 = muoiBonNgay(pm.serverNow)
  const theo = new Map(nh.ngay.map((x) => [x.ngay, x.soCau]))
  const max = Math.max(1, ...ngay14.map((n) => theo.get(n) ?? 0))
  const coHoc = ngay14.filter((n) => (theo.get(n) ?? 0) > 0).length
  const chuoi = pm.tongQuan?.chuoiNgayHoc ?? null
  return (
    <The id="ph3-nhip" className="ph3-o-du" vung="nhip-14" tieuDe="Nhịp học 14 ngày" phu={nh.gioThuongHoc ? `Con hay học khoảng ${nh.gioThuongHoc}` : undefined}>
      <div className="ph3-so3">
        <div><b>{coHoc}/14</b><span>ngày có học</span></div>
        {nh.trungBinhCauMoiNgay !== null && <div><b>{String(nh.trungBinhCauMoiNgay).replace('.', ',')} câu</b><span>trung bình mỗi ngày có học</span></div>}
        {chuoi !== null && <div><b data-mau="hp" style={{ color: 'var(--ph3-hp)' }}>{chuoi} ngày</b><span>chuỗi ngày học hiện tại</span></div>}
      </div>
      <div className="ph3-nhip">
        <div className="ph3-nhip__cot" role="img" aria-label={`Số câu mỗi ngày từ ${ngay14[0]} đến ${ngay14[13]}: ${ngay14.map((n) => theo.get(n) ?? 0).join(', ')}`}>
          {ngay14.map((n, i) => {
            const so = theo.get(n) ?? 0
            if (so === 0) return <span key={n} data-nghi="" />
            return <span key={n} data-tuan={i >= 7 ? '' : undefined} data-nay={i === 13 ? '' : undefined} style={{ height: `${Math.max(6, (so / max) * 110)}px` }} title={`${so} câu`} />
          })}
        </div>
        <div className="ph3-nhip__ngay" aria-hidden="true">
          {ngay14.map((n, i) => (i === 13 ? <b key={n}>{n.slice(8)}</b> : <span key={n}>{n.slice(8)}</span>))}
        </div>
      </div>
      <div className="ph3-chu-thich">
        <span><i style={{ background: 'var(--ph3-tim)' }} />7 ngày gần nhất</span>
        <span><i style={{ background: 'var(--ph3-tim-nhat)' }} />7 ngày trước đó</span>
        <span><i style={{ background: 'var(--ph3-vien)', height: 4 }} />Ngày không học</span>
        <span>Chiều cao cột = số câu con làm trong ngày</span>
      </div>
    </The>
  )
}
