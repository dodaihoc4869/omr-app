// Mục "Ca kiểm tra" — TRUNG TU THẦY DUYỆT 09/10 (bản vẽ PH-CaKiemTra; trước là "Lịch sử" ở thanh mục và "Điểm số" ở tiêu đề màn: MỘT khái niệm MỘT tên).
// Bỏ ba nút lọc. Thẻ trên: ca mới nhất (tên, ngày · số câu, số lớn a/10, ba thanh phần, nhận xét của thầy cho ca ấy nếu có, MỘT nút chính màu đặc
// "Xem bài làm của con ›"); ca chưa công bố ⇒ nhãn "Chờ công bố" + câu nói khi nào có điểm (không lộ điểm). Dưới: "Các ca trước" (mới trước, mỗi ca mở
// màn chi tiết); trống ⇒ một câu báo. Đường điểm các ca ở Tiến bộ (`BieuDo` vẫn ở tệp này, Tiến bộ dùng lại).
// (Tên tệp giữ "ManDiemSo" để không xoá khai báo màu của đồ thị — cổng `npm run kiem:mau-giu` so theo từng tệp.)
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { CaGanNhat, DiemTienBo } from '../../lib/ph-moi/du-lieu'
import type { NhanXetCa } from '../../lib/ph-v3/du-lieu'
import { ngayChuoiNgan, ngayDayDuVn, soVn } from '../../lib/ph-moi/dinh-dang'
import { chuCongBoCa } from '../ph-moi/nhan'
import { BtKhoa, BtPhai } from './BieuTuong'
import { DangTai, The, TheLoi, TheTrong } from './dung-chung'
import { TEN_PHAN, chuThay, diemCacCa, lienKetCa } from './tien-ich'

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

/** Đường điểm các ca (dùng ở Tiến bộ khi có từ 2 ca, trên nền khối anh hùng). Nhãn "Điểm /10" ở đầu trục: thang luôn là 10.
 *  Nhãn số của ca cũ đọc màu qua biến --ph3-xd-nen; trong `.ph3-bieu-do` biến ấy được gán lại sang --ph3-ah-truc (ph-v3.css) để đủ tương phản ở nền tối. */
export function BieuDo({ ds }: { ds: DiemTienBo[] }) {
  const { x, y, luoi } = dungBieuDo(ds)
  const cuoi = ds.length - 1
  const duong = x.map((xi, i) => `${xi.toFixed(1)},${y[i]!.toFixed(1)}`).join(' ')
  return (
    <svg className="ph3-bieu-do" viewBox="0 -18 320 178" role="img" aria-label={`Điểm các ca (thang 10): ${ds.map((d) => `${ngayChuoiNgan(d.ngay)} ${soVn(d.diem)}`).join('; ')}`}>
      <text className="ph3-bieu-do__thang" x="0" y="-6" fontSize="12">Điểm /10</text>
      {luoi.map((l) => (
        <g key={l.gia}>
          <line x1="20" y1={l.y} x2="320" y2={l.y} stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" style={{ color: 'var(--ph3-ah-vach)' }} />
          <text x="0" y={l.y + 4} fontSize="12" style={{ fill: 'var(--ph3-ah-truc)' }}>{l.gia}</text>
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
          <text x={Math.min(x[i]!, 306)} y="152" fontSize="12" fontWeight={i === cuoi ? 700 : 400} textAnchor="middle" style={{ fill: i === cuoi ? 'var(--ph3-ah-chu)' : 'var(--ph3-ah-truc)' }}>
            {ngayChuoiNgan(d.ngay)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function ManDiemSo({ v, loiThay }: { v: ViewPhMoi; loiThay: NhanXetCa[] | null }) {
  const pm = v.pm
  if (!pm) return (
    <div>
      <div className="ph3-tieu-de"><h1>Ca kiểm tra</h1></div>
      {v.trangThai === 'loi' ? <div className="ph3-luoi"><TheLoi chu={v.chuLoi} thuLai={v.thuLai} /></div> : <DangTai hinh="ca-kiem-tra" />}
    </div>
  )
  const ca = pm.caGanNhat
  const ds = diemCacCa(pm)
  const nhanXet = new Map((loiThay ?? []).map((x) => [x.maCa, x]))
  const truoc = [...ds].reverse().filter((d) => d.maCa !== ca?.maCa)
  return (
    <div data-vung="man-ca-kiem-tra">
      <div className="ph3-tieu-de"><h1>Ca kiểm tra</h1></div>
      <div className="ph3-luoi">
        {ca && <CaMoiNhat ca={ca} loi={nhanXet.get(ca.maCa)?.noiDung ?? ''} />}
        {(ca || truoc.length > 0) && (
          <section className="ph3-ds-ca-khoi ph3-o-hep" aria-labelledby="ph3-ds-ca" data-vung="ds-ca">
            <h2 id="ph3-ds-ca" className="ph3-khoi__ten">{ca ? 'Các ca trước' : 'Các ca kiểm tra'}</h2>
            {truoc.length > 0 ? (
              <ul className="ph3-ds-ca ph3-the ph3-the--sat">
                {truoc.map((d) => (
                  <li key={d.maCa}>
                    <a className="tt-nhan" href={lienKetCa(d.maCa)}>
                      <span className="ph3-ngay"><span>{thuNgan(d.ngay)}</span><b>{ngayChuoiNgan(d.ngay)}</b></span>
                      <span className="ph3-ds-ca__giua">
                        <b>{d.tenCa}</b>
                        {nhanXet.has(d.maCa) && <span>Có nhận xét của thầy</span>}
                      </span>
                      <span className="ph3-ds-ca__phai"><b>{soVn(d.diem)}</b><small>/10</small></span>
                      <BtPhai co={18} day={2.4} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ph3-o-bao">Chưa có ca nào khác trước ca này. Mỗi ca thầy công bố sau sẽ thêm một dòng ở đây.</p>
            )}
          </section>
        )}
        {!ca && truoc.length === 0 && (
          <TheTrong id="ph3-ds-trong" tieuDe="Chưa có ca kiểm tra" chu="Con chưa có ca kiểm tra nào được công bố điểm. Khi thầy công bố, điểm và từng câu của con hiện ở đây." />
        )}
      </div>
    </div>
  )
}

/** Ca mới nhất: điểm + ba phần (đã công bố) hoặc nhãn "Chờ công bố" + câu nói khi nào có điểm; nhận xét của thầy cho ca ấy (nếu có); MỘT nút chính màu đặc. */
function CaMoiNhat({ ca, loi }: { ca: CaGanNhat; loi: string }) {
  const kq = ca.ketQua
  const phu = [ngayDayDuVn(ca.nopLuc), kq?.soCau ? `${kq.soCau} câu` : ''].filter(Boolean).join(' · ')
  const coDiem = !!kq && kq.tong !== null
  return (
    <The id="ph3-ca" className="ph3-o-rong" vung="ca-gan-nhat" tieuDe={ca.tenCa} phu={phu || undefined} chip={coDiem ? undefined : <span className="ph3-nhan-cho">Chờ công bố</span>}>
      {coDiem ? (
        <>
          <p className="ph3-so-lon"><b>{soVn(kq!.tong!)}</b><small>/10 điểm</small></p>
          {ca.phan.length > 0 && (
            <div className="ph3-phan">
              {ca.phan.map((p) => (
                <div key={p.ma}>
                  <span>{TEN_PHAN[p.ma]}</span>
                  <span className="ph3-thanh"><span className="tt-thanh" style={{ width: `${(p.dung / p.tong) * 100}%` }} /></span>
                  <b>{p.dung}/{p.tong} câu</b>
                </div>
              ))}
            </div>
          )}
          {loi && <div className="ph3-loi-thay" data-vung="loi-thay-ca"><span>Nhận xét của thầy</span><p>{chuThay(loi)}</p></div>}
          <a className="ph3-nut-tong ph3-nut-tong--dac tt-nhan" href={lienKetCa(ca.maCa)}>Xem bài làm của con<BtPhai co={20} day={2.5} /></a>
        </>
      ) : (
        <p className="ph3-cho-cong-bo"><BtKhoa co={20} /><span>{chuCongBoCa(ca)}</span></p>
      )}
    </The>
  )
}
