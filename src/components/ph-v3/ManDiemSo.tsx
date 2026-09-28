// Mục "Điểm số" (bản vẽ khổ 2): khối anh hùng = điểm ca gần nhất + trung bình + đường điểm các ca đã công bố (tối đa 8, máy chủ gửi `tienBo.diem`),
// danh sách ca (mới trước, mỗi ca mở màn chi tiết), cách tính điểm một ca. Chỉ ca ĐÃ công bố có điểm; ca gần nhất chưa công bố hiện dòng "chờ thầy công bố".
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { DiemTienBo } from '../../lib/ph-moi/du-lieu'
import { ngayChuoiNgan, ngayDayDuVn, soVn, tachVn } from '../../lib/ph-moi/dinh-dang'
import { chuCongBoCa } from '../ph-moi/nhan'
import { BtKhoa, BtTienBo } from './BieuTuong'
import { DangTai, DoiDiem, TheLoi, TheTrong } from './dung-chung'
import { lienKetCa } from './tien-ich'

const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const
export function thuNgan(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  return m ? THU_NGAN[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()]! : ''
}

/** Toạ độ đường điểm trong khung 320 × 160 (trục số bên trái, nhãn ngày dưới). Thuần, test được. */
export function dungBieuDo(ds: readonly { diem: number }[]): { x: number[]; y: number[]; luoi: { gia: number; y: number }[] } {
  const n = ds.length
  const min = Math.min(...ds.map((d) => d.diem))
  const max = Math.max(...ds.map((d) => d.diem))
  let lo = Math.max(0, Math.floor(min - 0.5))
  let hi = Math.min(10, Math.ceil(max + 0.5))
  if (hi - lo < 2) { if (hi < 10) hi = Math.min(10, lo + 2); if (hi - lo < 2) lo = Math.max(0, hi - 2) }
  const yCua = (g: number) => 130 - ((g - lo) / (hi - lo)) * 110
  const buoc = hi - lo > 5 ? 2 : 1
  const luoi: { gia: number; y: number }[] = []
  for (let g = Math.ceil(lo); g <= hi; g += buoc) if (g > lo) luoi.push({ gia: g, y: yCua(g) })
  const x = ds.map((_, i) => (n === 1 ? 165 : 28 + (i * 274) / (n - 1)))
  return { x, y: ds.map((d) => yCua(d.diem)), luoi }
}

function BieuDo({ ds }: { ds: DiemTienBo[] }) {
  const { x, y, luoi } = dungBieuDo(ds)
  const cuoi = ds.length - 1
  const duong = x.map((xi, i) => `${xi.toFixed(1)},${y[i]!.toFixed(1)}`).join(' ')
  return (
    <svg className="ph3-bieu-do" viewBox="0 0 320 160" role="img" aria-label={`Điểm các ca: ${ds.map((d) => `${ngayChuoiNgan(d.ngay)} ${soVn(d.diem)}`).join('; ')}`}>
      {luoi.map((l) => (
        <g key={l.gia}>
          <line x1="20" y1={l.y} x2="320" y2={l.y} stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" style={{ color: 'var(--ph3-ah-vach)' }} />
          <text x="0" y={l.y + 4} fontSize="11" style={{ fill: 'var(--ph3-ah-truc)' }}>{l.gia}</text>
        </g>
      ))}
      {ds.length > 1 && (
        <>
          <polygon points={`${duong} ${x[cuoi]!.toFixed(1)},130 ${x[0]!.toFixed(1)},130`} style={{ fill: 'var(--ph3-vong-xd)' }} fillOpacity="0.14" />
          <polyline points={duong} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ph3-vong-xd)' }} />
        </>
      )}
      {ds.map((d, i) => (
        <g key={d.maCa}>
          {i === cuoi ? (
            <circle cx={x[i]} cy={y[i]} r="7" strokeWidth="3" style={{ fill: 'var(--ph3-vong-hp)', stroke: 'var(--ph3-ah-nen)' }} />
          ) : (
            <circle cx={x[i]} cy={y[i]} r="4" style={{ fill: 'var(--ph3-vong-xd)' }} />
          )}
          <text x={Math.min(x[i]!, 306)} y={y[i]! - (i === cuoi ? 16 : 12)} fontSize={i === cuoi ? 14 : 12} fontWeight={i === cuoi ? 800 : 600} textAnchor="middle" style={{ fill: i === cuoi ? 'var(--ph3-vong-hp)' : 'var(--ph3-xd-nen)' }}>
            {soVn(d.diem)}
          </text>
          <text x={Math.min(x[i]!, 306)} y="152" fontSize="11" fontWeight={i === cuoi ? 700 : 400} textAnchor="middle" style={{ fill: i === cuoi ? 'var(--ph3-ah-chu)' : 'var(--ph3-ah-truc)' }}>
            {ngayChuoiNgan(d.ngay)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function ManDiemSo({ v, coNhanXet }: { v: ViewPhMoi; coNhanXet: ReadonlySet<string> }) {
  const pm = v.pm
  if (!pm) return (
    <div>
      <div className="ph3-tieu-de"><h1>Điểm số</h1></div>
      {v.trangThai === 'loi' ? <div className="ph3-luoi"><TheLoi chu={v.chuLoi} thuLai={v.thuLai} /></div> : <DangTai />}
    </div>
  )
  const ca = pm.caGanNhat
  // cũ → mới, chỉ ca đã công bố. Ca gần nhất ĐÃ công bố mà máy chủ chưa đưa vào `tienBo.diem` (máy chủ cũ / ca vừa công bố) ⇒ thêm vào cuối, không để màn nói "chưa có ca".
  const ds: DiemTienBo[] = [...(pm.tienBo?.diem ?? [])]
  const tGan = ca ? tachVn(ca.nopLuc) : null
  if (ca?.ketQua && ca.ketQua.tong !== null && tGan && !ds.some((d) => d.maCa === ca.maCa))
    ds.push({ ngay: `${tGan.y}-${String(tGan.m).padStart(2, '0')}-${String(tGan.d).padStart(2, '0')}`, diem: ca.ketQua.tong, maCa: ca.maCa, tenCa: ca.tenCa })
  const choCongBo = ca && !ca.ketQua && !ds.some((d) => d.maCa === ca.maCa) ? ca : null
  const cuoi = ds[ds.length - 1]
  const tb = ds.length > 0 ? ds.reduce((t, d) => t + d.diem, 0) / ds.length : null
  const doiTuDau = ds.length > 1 ? cuoi!.diem - ds[0]!.diem : null
  return (
    <div data-vung="man-diem-so">
      <div className="ph3-tieu-de"><h1>Điểm số</h1></div>
      <div className="ph3-luoi">
        {cuoi ? (
          <section className="ph3-ah ph3-o-rong" aria-label="Xu hướng điểm của con" data-vung="xu-huong-diem">
            <div className="ph3-ah__cap">
              <div><span>Ca gần nhất · {ngayChuoiNgan(cuoi.ngay)}</span><b data-mau="vong-hp">{soVn(cuoi.diem)}<small> /10</small></b></div>
              {ds.length > 1 && <div><span>Trung bình {ds.length} ca</span><b>{soVn(tb!)}<small> /10</small></b></div>}
            </div>
            {doiTuDau !== null && (
              <span className="ph3-ah__chip" data-mau="xl" style={{ alignSelf: 'flex-start' }}>
                <BtTienBo co={16} day={2.5} />
                {doiTuDau > 0.004 ? `Tăng ${soVn(doiTuDau)} điểm` : doiTuDau < -0.004 ? `Giảm ${soVn(-doiTuDau)} điểm` : 'Giữ nguyên điểm'} từ ca {ngayChuoiNgan(ds[0]!.ngay)}
              </span>
            )}
            <BieuDo ds={ds} />
          </section>
        ) : null}

        {ds.length === 0 && !choCongBo ? (
          <TheTrong id="ph3-ds-trong" tieuDe="Các ca kiểm tra" chu="Con chưa có ca kiểm tra nào được công bố điểm. Khi thầy công bố, điểm và từng câu của con hiện ở đây." />
        ) : (
          <section className="ph3-the ph3-the--sat ph3-o-hep" aria-labelledby="ph3-ds-ca" data-vung="ds-ca">
            <div className="ph3-the__dau"><div><h2 id="ph3-ds-ca">Các ca kiểm tra</h2></div><span className="ph3-ghi" style={{ fontSize: 13 }}>Điểm trên thang 10</span></div>
            <ul className="ph3-ds-ca">
              {choCongBo && (
                <li>
                  <a href={lienKetCa(choCongBo.maCa)}>
                    <span className="ph3-ngay" data-moi=""><span>Mới</span><BtKhoa co={18} /></span>
                    <span className="ph3-ds-ca__giua"><b>{choCongBo.tenCa}</b><span>{chuCongBoCa(choCongBo)}</span></span>
                    <span className="ph3-ds-ca__phai"><span className="ph3-ghi" style={{ fontSize: 13 }}>{ngayDayDuVn(choCongBo.nopLuc).replace(/\/\d{4}$/, '')}</span></span>
                  </a>
                </li>
              )}
              {[...ds].reverse().map((d, i, dao) => {
                const truoc = dao[i + 1]
                return (
                  <li key={d.maCa}>
                    <a href={lienKetCa(d.maCa)}>
                      <span className="ph3-ngay" data-moi={i === 0 && !choCongBo ? '' : undefined}><span>{thuNgan(d.ngay)}</span><b>{ngayChuoiNgan(d.ngay)}</b></span>
                      <span className="ph3-ds-ca__giua">
                        <b>{d.tenCa}</b>
                        {coNhanXet.has(d.maCa) ? <span>Có nhận xét của thầy</span> : !truoc ? <span>Ca đầu tiên trong danh sách</span> : null}
                      </span>
                      <span className="ph3-ds-ca__phai">
                        <b>{soVn(d.diem)}</b>
                        {truoc && <DoiDiem doi={d.diem - truoc.diem} />}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="ph3-the ph3-o-du" aria-labelledby="ph3-cach-tinh">
          <div className="ph3-the__dau"><div><h2 id="ph3-cach-tinh" style={{ fontSize: 15 }}>Cách tính điểm một ca kiểm tra (đề đủ ba phần)</h2></div></div>
          <div className="ph3-cach-tinh">
            <div><b>4,5</b><span>Trắc nghiệm · 18 câu × 0,25 điểm</span></div>
            <div><b>4,0</b><span>Đúng–sai · 4 câu, điểm theo số ý đúng</span></div>
            <div><b>1,5</b><span>Trả lời ngắn · 6 câu × 0,25 điểm</span></div>
          </div>
        </section>
      </div>
    </div>
  )
}
