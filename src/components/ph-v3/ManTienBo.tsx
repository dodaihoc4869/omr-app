// Mục "Tiến bộ" — BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10: khối anh hùng = điểm các ca kiểm tra (đường điểm, chuyển từ màn "Điểm số" cũ) + khoảng cách tới 8 và
// chứng chỉ Sẵn sàng 8+ (OMNI, chỉ khi máy chủ gửi; độ tin không bao giờ 100%) → MỘT danh sách dạng (bậc Biết · Hiểu · Vận dụng, nhãn "Đang luyện thêm")
// → Sơ ý của con (mục tiêu dưới 7%, OMNI) → nhịp học 14 ngày. Không thêm số mới; khối nào không có số thật ⇒ vắng; cả màn không có gì ⇒ một thẻ trống nói vì sao.
// Đã bỏ: khối "câu từng sai đã thành thạo lại" (bản vẽ không có; "câu chờ thầy dạy lại" gộp vào "Cần thầy chữa" ở Hôm nay).
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { PhMoi } from '../../lib/ph-moi/du-lieu'
import type { Hoc2 } from '../../lib/ph-v3/du-lieu'
import type { PhOmni } from '../../../server/src/omni-kieu'
import { ngayChuoiNgan, soVn, tachVn } from '../../lib/ph-moi/dinh-dang'
import { chuPhKhoangCach, chuSoY, diemChu, doTinChu } from '../../lib/omni-chu'
import { TEN_BAC_SO } from '../ph-moi/nhan'
import { BtTienBo } from './BieuTuong'
import { BieuDo } from './ManDiemSo'
import { Chip, DangTai, The, TheLoi, TheTrong } from './dung-chung'
import { diemCacCa } from './tien-ich'

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

/** Mục tiêu sơ ý của chứng chỉ (điều kiện C = `THAM_SO_OMNI.C_SO_Y` ở server/src/omni-kieu.ts; app chỉ import KIỂU từ máy chủ nên ghi lại số — test khoá hai số bằng nhau). */
export const SO_Y_MUC_TIEU = 0.07

/** "Sơ ý của con: 6% (mục tiêu dưới 7%)" — chữ chung `chuSoY` đổi sang giọng phụ huynh. */
export function chuPhSoY(s: number | null): string | null {
  const c = chuSoY(s, SO_Y_MUC_TIEU)
  return c && c.replace(/^Sơ ý /, 'Sơ ý của con: ')
}

/** Dòng OMNI dưới đường điểm: khoảng cách tới 8 (chỉ khi đã hiệu chuẩn — lớp đọc đã lọc) → chứng chỉ gần nhất. Không có số thật ⇒ không dòng. */
export function dongDiemOmni(o: PhOmni | undefined): { khoa: string; chu: string; dam?: true }[] {
  if (!o) return []
  const ra: { khoa: string; chu: string; dam?: true }[] = []
  const kc = chuPhKhoangCach(o.khoangCach8)
  if (kc) ra.push({ khoa: 'khoang-cach-8', chu: kc, dam: true })
  const cc = o.chungChi[0]
  if (cc) ra.push({ khoa: 'chung-chi', chu: `Chứng chỉ gần nhất: ${cc.ten} · Sẵn sàng 8+ · độ tin ${doTinChu(cc.doTin)}${cc.diem !== null ? ` · điểm ca chốt ${diemChu(cc.diem)}` : ''}` })
  return ra
}

export default function ManTienBo({ v, hoc2 }: { v: ViewPhMoi; hoc2: Hoc2 | null }) {
  const pm = v.pm
  if (!pm) return (
    <div>
      <div className="ph3-tieu-de"><h1>Tiến bộ</h1></div>
      {v.trangThai === 'loi' ? <div className="ph3-luoi"><TheLoi chu={v.chuLoi} thuLai={v.thuLai} /></div> : <DangTai />}
    </div>
  )
  const omni = hoc2?.omni
  const coGi = diemCacCa(pm).length > 0 || dongDiemOmni(omni).length > 0 || (pm.bacTheoDang ?? []).length > 0 || omni?.sEm != null || (pm.nhipHoc?.ngay ?? []).length > 0
  return (
    <div data-vung="man-tien-bo">
      <div className="ph3-tieu-de"><h1>Tiến bộ</h1></div>
      <div className="ph3-luoi">
        <DiemCacCa pm={pm} omni={omni} />
        <BacTheoDang pm={pm} />
        <SoY omni={omni} />
        <Nhip pm={pm} />
        {!coGi && <TheTrong id="ph3-tb-trong" tieuDe="Chưa đủ dữ liệu" chu="Con học thêm vài ngày và có ca kiểm tra được công bố thì điểm, bậc từng dạng và nhịp học hiện ở đây." />}
      </div>
    </div>
  )
}

function DiemCacCa({ pm, omni }: { pm: PhMoi; omni?: PhOmni }) {
  const ds = diemCacCa(pm)
  const dong = dongDiemOmni(omni)
  if (ds.length === 0 && dong.length === 0) return null
  const doiTuDau = ds.length > 1 ? ds[ds.length - 1]!.diem - ds[0]!.diem : null
  return (
    <section className="ph3-ah ph3-o-rong" aria-labelledby="ph3-diem-ca" data-vung="xu-huong-diem">
      <div className="ph3-ah__tren">
        <p id="ph3-diem-ca" className="ph3-ah__nhan">Điểm các ca kiểm tra</p>
        {doiTuDau !== null && (
          <span className="ph3-ah__chip" data-mau="xl">
            <BtTienBo co={16} day={2.5} />
            {doiTuDau > 0.004 ? `Tăng ${soVn(doiTuDau)} điểm` : doiTuDau < -0.004 ? `Giảm ${soVn(-doiTuDau)} điểm` : 'Giữ nguyên điểm'} từ ca {ngayChuoiNgan(ds[0]!.ngay)}
          </span>
        )}
      </div>
      {ds.length > 0 && <BieuDo ds={ds} />}
      {dong.length > 0 && (
        <div className="ph3-ah__dong" data-vung="diem-omni">
          {dong.map((d) => (d.dam ? <b key={d.khoa}>{d.chu}</b> : <span key={d.khoa}>{d.chu}</span>))}
        </div>
      )}
    </section>
  )
}

function SoY({ omni }: { omni?: PhOmni }) {
  const c = chuSoY(omni?.sEm ?? null, SO_Y_MUC_TIEU)
  if (!c) return null
  const [so, muc] = c.replace(/^Sơ ý /, '').split(' (')
  return (
    <The id="ph3-so-y" className="ph3-o-du" vung="so-y" tieuDe="Sơ ý của con" chip={<b className="ph3-the__so">{so} <small>({muc}</small></b>} />
  )
}

function BacTheoDang({ pm }: { pm: PhMoi }) {
  const ds = pm.bacTheoDang ?? []
  if (ds.length === 0) return null
  const vuaLen = new Set([...(pm.vuaLenBac ?? []).map((x) => x.ma), ...(pm.tienBo?.dangTienBoNhat ?? []).map((x) => x.ma)])
  // "Đang luyện thêm": cùng nguồn với tên dạng ở khối (c) của Hôm nay (máy chủ: `dangVap` theo mã, `manhYeu.conVap` theo tên).
  const dangVap = new Set((pm.dangVap ?? []).map((x) => x.ma))
  const conVap = new Set((pm.manhYeu?.conVap ?? []).map((x) => x.tenDang))
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
              {vuaLen.has(d.ma) ? <Chip mau="xl" nho>Vừa lên bậc</Chip> : dangVap.has(d.ma) || conVap.has(d.ten) ? <Chip mau="hp" nho>Đang luyện thêm</Chip> : null}
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
