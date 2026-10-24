// PHẦN DƯỚI của trang "Hôm nay của con" (đợt 19 · làn R, bản vẽ docs/ban-ve-dot19/app-phu-huynh.html) — KHỐI NẠP KHI SẮP CUỘN TỚI (TrangVeCon.tsx):
//   Thái độ làm bài (6 tín hiệu: số đo · thước có vạch ngưỡng · dòng "Nghĩa là" · ngưỡng · độ tin cậy) · Câu sai và tự sửa (+ lịch ôn lại) · Thời gian làm
//   bài (trung bình, trung vị, giờ học quen, số giây theo mức độ câu, phân bố 7 ngày) · Kiểm tra và tiến bộ · Bài tập về nhà · Buổi học trên lớp · Lịch sử.
// Số: `/ph/ho-so-thai-do` + `/ph/lich-su-lam-cau` (AppPhuHuynh nạp SONG SONG khi phần này sắp hiện) và các lệnh đã tải lúc mở (`/ph/tat-ca-ve-con`,
// `/ph/con-tong-quan`, `/ph/hoc-2`). Khối nào chưa có số thật ⇒ khung chờ (đang tải) / câu nói vì sao trống / lý do lỗi + tải lại — không bịa số.
// "Nghĩa là" do app viết từ mức của tín hiệu + số đo (máy chủ không phải gửi thêm). Tin xấu nói thẳng, có số, giọng bình tĩnh. Không mục tính cách.
// "Xem đủ …" / "Xem tất cả … lượt" mở CÙNG tấm "Hồ sơ làm bài" như thầy và con thấy (HoSoCuaConPh, nạp khi bấm). MÀU: trang-con-duoi.css (biến --ph3-*).
import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import type { PhMoi, DiemTienBo } from '../../lib/ph-moi/du-lieu'
import type { Hoc2 } from '../../lib/ph-v3/du-lieu'
import type { ConTongQuan } from '../../lib/ph-v3/con-tong-quan'
import { chuGiay, nhanKhoangGiay } from '../../lib/ph-v3/con-tong-quan'
import { NGUONG_THAI_DO, type KetQuaHoSoThaiDo, type MaTinHieu, type TinHieuThaiDo } from '../../lib/bai-hang-ngay-api'
import type { LanLamCau } from '../../lib/lich-su-lam-cau-api'
import { TEN_NHOM_NHIP, type KetQuaNhipHocEm } from '../../lib/nhip-hoc-em'
import { gioVn, ngayChuoiNgan, ngayNganVn, soVn, thuNgayVn } from '../../lib/ph-moi/dinh-dang'
import { chuCongBoCa, TEN_BAC_SO } from '../ph-moi/nhan'
import { chuPhKhoangCach, diemChu, doTinChu, phanTram } from '../../lib/omni-chu'
import { BtBang, BtBut, BtChuY, BtDiLen, BtDiXuong, BtDongHo, BtLichSu, BtLop, BtNhan, BtNhipTim, BtPhai, BtSach, BtTich } from './BieuTuong'
import type { Mau } from './dung-chung'
import { diemCacCa, lienKetCa, TEN_PHAN } from './tien-ich'
import { DamSo, DauThe, idPhan, LoiThe, type IdPhan, type TaiHoSo } from './TrangVeCon'
import { layBaoCaoTuanCon, type BaoCaoTuanCon } from '../../lib/bao-cao-tuan-ph-api'
import './trang-con-duoi.css'

const HoSoCuaConPh = lazy(() => import('./HoSoCuaConPh'))
const NG = NGUONG_THAI_DO
const coSo = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n)

// ---------------------------------------------------------------- phép thuần (test gọi thẳng) ----------------------------------------------------------------
type MauMuc = Mau | 'xam'
export const CHIP_MUC: Record<TinHieuThaiDo['muc'], { mau: MauMuc; chu: string }> = {
  tot: { mau: 'xl', chu: 'Trong ngưỡng' },
  'chu-y': { mau: 'hp', chu: 'Cần để mắt' },
  xau: { mau: 'ho', chu: 'Vượt ngưỡng' },
  'chua-du': { mau: 'xam', chu: 'Chưa đủ số liệu' },
}
/** Thước của 5 tín hiệu tỉ lệ: thang tối đa, hai vạch ngưỡng (đúng NGUONG_THAI_DO của máy chủ), màu ba vùng. "Độ đúng theo thời gian" vẽ hai thanh so sánh. */
export const THUOC: Record<Exclude<MaTinHieu, 'xu-huong'>, { max: number; moc: [number, number]; vung: [Mau, Mau, Mau] }> = {
  'ngay-du-muc': { max: 100, moc: [NG.ngayDuLuoi, NG.ngayDuTot], vung: ['ho', 'hp', 'xl'] },
  'qua-nhanh': { max: 60, moc: [NG.nhanChuY, NG.nhanXau], vung: ['xl', 'hp', 'ho'] },
  'don-bai': { max: 100, moc: [NG.donChuY, NG.donXau], vung: ['xl', 'hp', 'ho'] },
  'goi-y': { max: 100, moc: [NG.goiYChuY, NG.goiYXau], vung: ['xl', 'hp', 'ho'] },
  'chon-lap': { max: 20, moc: [NG.lapChuY, NG.lapXau], vung: ['xl', 'hp', 'ho'] },
}
export const NGUONG_CHU: Record<MaTinHieu, string> = {
  'ngay-du-muc': `Chăm từ ${NG.ngayDuTot}% · Lười từ ${NG.ngayDuLuoi}% trở xuống`,
  'qua-nhanh': `Quá nhanh là dưới ${NG.giayNhanhTracNghiem} giây (câu tự tính dưới ${NG.giayNhanhTuTinh} giây) · chú ý từ ${NG.nhanChuY}% · vượt ngưỡng từ ${NG.nhanXau}% khi nhóm nhanh đúng dưới ${NG.nhanDungThap}%`,
  'don-bai': `Chú ý từ ${NG.donChuY}% · vượt ngưỡng từ ${NG.donXau}%`,
  'goi-y': `Chú ý từ ${NG.goiYChuY}% · vượt ngưỡng từ ${NG.goiYXau}%`,
  'chon-lap': `Chú ý từ ${NG.lapChuY}% · vượt ngưỡng từ ${NG.lapXau}%`,
  'xu-huong': `Chú ý khi giảm từ ${NG.giamChuY} điểm % · vượt ngưỡng khi giảm từ ${NG.giamXau}`,
}
/** "Quá nhanh 131/409 lượt (32%) · nhóm quá nhanh đúng 29% · lượt thường đúng 77%" ⇒ { dn: 29, dt: 77 }. */
export function dungNhanh(chu: string): { dn: number | null; dt: number | null } {
  const a = /nhóm quá nhanh đúng (\d+)%/.exec(chu)
  const b = /lượt thường đúng (\d+)%/.exec(chu)
  return { dn: a ? Number(a[1]) : null, dt: b ? Number(b[1]) : null }
}
/** "7 ngày gần nhất đúng 66% (190 lượt) · trước đó 74% (222 lượt) …" ⇒ hai tỉ lệ để vẽ hai thanh. */
export function haiTuan(chu: string): { gan: number; truoc: number } | null {
  const m = /đúng (\d+)% \((\d+) lượt\) · trước đó (\d+)% \((\d+) lượt\)/.exec(chu)
  return m ? { gan: Number(m[1]), truoc: Number(m[3]) } : null
}
/** Dòng số liệu dưới số lớn của một tín hiệu. */
export function soLieu(t: TinHieuThaiDo): string {
  if (t.muc === 'chua-du' && t.mau === 0) return t.chu
  switch (t.ma) {
    case 'ngay-du-muc': return `Đủ mức ${t.tu}/${t.mau} ngày`
    case 'qua-nhanh': {
      const { dn, dt } = dungNhanh(t.chu)
      return `${t.tu}/${t.mau} lượt dưới ${NG.giayNhanhTracNghiem} giây${dn !== null ? ` · nhóm này đúng ${dn}%` : ''}${dt !== null ? ` (lượt thường ${dt}%)` : ''}`
    }
    case 'don-bai': return `${t.tu}/${t.mau} lượt làm trong 23:00–04:59`
    case 'goi-y': return `${t.tu}/${t.mau} câu có dùng gợi ý hoặc đọc lời giải`
    case 'chon-lap': return `${t.tu}/${t.mau} lượt nằm trong chuỗi từ ${NG.chuoiLap} lượt liền cùng một chữ`
    case 'xu-huong': return t.chu.replace(/ · (tăng|giảm) \d+ điểm %$/, '')
  }
}
/** Dòng "Nghĩa là" — app viết từ mức + số đo (lời thẳng, có số, giọng bình tĩnh; không nhãn tính cách). */
export function nghiaLa(t: TinHieuThaiDo): string {
  const p = t.giaTri ?? 0
  const moi = (x: number) => Math.max(2, Math.round(100 / Math.max(1, x)))
  if (t.muc === 'chua-du') {
    if (t.ma === 'ngay-du-muc') return `Cần ít nhất ${NG.soNgayToiThieu} ngày đã qua để tính, con đang có ${t.mau} ngày.`
    if (t.ma === 'xu-huong') return `Cần ít nhất ${NG.soLuotXuHuongToiThieu} lượt có kết quả ở mỗi bên để so hai tuần.`
    return 'Chưa đủ số liệu để đo tín hiệu này.'
  }
  switch (t.ma) {
    case 'ngay-du-muc':
      return t.muc === 'tot' ? `Trong ${t.mau} ngày đã qua, con làm đủ số câu tối thiểu ở ${t.tu} ngày.` : `Trong ${t.mau} ngày đã qua, con làm đủ số câu tối thiểu ở ${t.tu} ngày; ${t.mau - t.tu} ngày còn lại con làm thiếu hoặc không làm.`
    case 'qua-nhanh': {
      const { dn } = dungNhanh(t.chu)
      if (t.muc === 'xau') return `Cứ ${moi(p)} lượt có 1 lượt con trả lời rất nhanh${dn !== null ? `, và nhóm lượt này chỉ đúng ${dn}%` : ''}: ở những câu này con có thể đã chọn cho xong.`
      if (t.muc === 'chu-y') return `${p}% số lượt con trả lời dưới ${NG.giayNhanhTracNghiem} giây, nhiều hơn mức thường (dưới ${NG.nhanChuY}%)${dn !== null ? `; nhóm lượt này đúng ${dn}%` : ''}.`
      return `Con ít khi trả lời vội: ${p}% số lượt dưới ${NG.giayNhanhTracNghiem} giây.`
    }
    case 'don-bai':
      if (t.muc === 'tot') return 'Con ít khi để dồn bài tới khuya.'
      return t.muc === 'xau' ? `Phần lớn bài con làm vào khuya: ${p}% số lượt trong 23:00–04:59.` : `Cứ khoảng ${moi(p)} lượt có 1 lượt con làm sau 23 giờ.`
    case 'goi-y':
      if (t.muc === 'tot') return `Con xem gợi ý ở ${p}% số câu, trong mức bình thường.`
      return t.muc === 'xau' ? `Con dựa nhiều vào gợi ý và lời giải: ${p}% số câu có xem.` : `Con xem gợi ý hoặc lời giải ở ${p}% số câu, nhiều hơn mức thường (dưới ${NG.goiYChuY}%).`
    case 'chon-lap':
      return t.muc === 'tot' ? 'Con không có kiểu chọn cùng một đáp án cho nhiều câu liền.' : `${p}% số lượt trắc nghiệm nằm trong chuỗi từ ${NG.chuoiLap} câu liền chọn cùng một chữ — dấu hiệu chọn cho xong.`
    case 'xu-huong':
      if (t.giaTri === null) return 'Chưa đủ số liệu để so hai tuần.'
      return t.giaTri < 0 ? `Tuần này con làm đúng ít hơn tuần trước ${Math.abs(t.giaTri)} điểm %.` : t.giaTri > 0 ? `Tuần này con làm đúng nhiều hơn tuần trước ${t.giaTri} điểm %.` : 'Độ đúng tuần này bằng tuần trước.'
  }
}
/** Câu kết luận thái độ: có dấu hiệu đối phó ⇒ nói thẳng vì sao (bằng số); không ⇒ đếm tín hiệu theo ba mức. */
export function chuKetLuan(td: KetQuaHoSoThaiDo): { doiPho: boolean; chu: string } {
  const doiPho = td.coDoiPho ?? td.ketLuan.nhan === 'doi-pho'
  const m = (ma: MaTinHieu) => td.tinHieu.find((t) => t.ma === ma)
  if (doiPho) {
    const ly: string[] = []
    const b = m('qua-nhanh'), e = m('chon-lap'), d = m('goi-y')
    if (b?.muc === 'xau') { const { dn } = dungNhanh(b.chu); ly.push(`con trả lời rất nhanh ở ${b.giaTri}% số lượt${dn !== null ? ` mà nhóm này chỉ đúng ${dn}%` : ''}`) }
    if (e?.muc === 'xau') ly.push(`${e.giaTri}% số lượt trắc nghiệm nằm trong chuỗi chọn cùng một chữ`)
    if (d?.muc === 'xau') ly.push(`con xem gợi ý hoặc lời giải ở ${d.giaTri}% số câu trong khi độ đúng đang giảm`)
    return { doiPho, chu: `vì ${ly.length ? ly.join('; ') : 'có tín hiệu vượt ngưỡng'}. Nghĩa là: ở nhiều câu, con có thể đã chọn đại cho xong.` }
  }
  const dem = (muc: TinHieuThaiDo['muc']) => td.tinHieu.filter((t) => t.muc === muc).length
  const xau = dem('xau'), chuY = dem('chu-y'), tot = dem('tot'), chua = dem('chua-du')
  if (xau === 0 && chuY === 0 && chua === 0) return { doiPho, chu: `Chưa thấy dấu hiệu đối phó. Cả ${tot} tín hiệu đều trong ngưỡng.` }
  return { doiPho, chu: `Chưa thấy dấu hiệu đối phó. ${xau} tín hiệu vượt ngưỡng · ${chuY} cần để mắt · ${tot} trong ngưỡng${chua ? ` · ${chua} chưa đủ số liệu` : ''}.` }
}

const tenMucDo = (m: string): string => {
  const k = m.trim().toLowerCase()
  return k === 'biet' || k === 'nb' ? 'Nhận biết' : k === 'hieu' || k === 'th' ? 'Thông hiểu' : k === 'vd' || k === 'van_dung' ? 'Vận dụng' : k === 'vdc' || k === 'van_dung_cao' ? 'Vận dụng cao' : ''
}
export interface DongGiayMuc { ten: string; soLuot: number; giayTb: number | null; tiLeDung: number | null; coUoc: boolean }
/** Gom lượt theo mức độ câu (dễ → khó): trung bình số giây (lượt có số giây), số lượt, % đúng. Mức không có lượt ⇒ bỏ. Thuần. */
export function giayTheoMucDo(lan: readonly LanLamCau[]): DongGiayMuc[] {
  const m = new Map<string, { soLuot: number; coGiay: number; tong: number; dung: number; coKq: number; coUoc: boolean }>()
  for (const l of lan) {
    const ten = tenMucDo(l.mucDo) || 'Chưa ghi mức độ'
    const d = m.get(ten) ?? { soLuot: 0, coGiay: 0, tong: 0, dung: 0, coKq: 0, coUoc: false }
    d.soLuot++
    if (l.dung !== null) { d.coKq++; if (l.dung) d.dung++ }
    if (l.giay !== null) { d.coGiay++; d.tong += l.giay; if (l.nguonGiay === 'uoc') d.coUoc = true }
    m.set(ten, d)
  }
  return ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao', 'Chưa ghi mức độ'].filter((t) => m.has(t)).map((t) => {
    const d = m.get(t)!
    return { ten: t, soLuot: d.soLuot, giayTb: d.coGiay ? Math.round(d.tong / d.coGiay) : null, tiLeDung: d.coKq ? Math.round((100 * d.dung) / d.coKq) : null, coUoc: d.coUoc }
  })
}
/** "còn 1 ngày 3 giờ" tới hạn nộp; đã quá ⇒ ''. */
export function chuConLai(hanMs: number, nowMs: number): string {
  const p = Math.floor((hanMs - nowMs) / 60_000)
  if (p <= 0) return ''
  const ngay = Math.floor(p / 1440), gio = Math.floor((p % 1440) / 60)
  return ngay > 0 ? `còn ${ngay} ngày${gio ? ` ${gio} giờ` : ''}` : gio > 0 ? `còn ${gio} giờ` : `còn ${p} phút`
}
const ngayGioVn = (x: string | number): string => `${gioVn(x)} ${thuNgayVn(x)}`

// ---------------------------------------------------------------- khối ----------------------------------------------------------------
export interface PhanDuoiProps {
  pm: PhMoi
  tq: ConTongQuan | null
  hoc2: Hoc2 | null
  k: KetQuaNhipHocEm | null
  hoSo: TaiHoSo
  napHoSo: () => void
  sbd: string
  tenCon: string
  lop: string
  coPhan: IdPhan[]
  onDaVe: (x: boolean) => void
}

export default function PhanDuoi(p: PhanDuoiProps) {
  const [moHoSo, setMoHoSo] = useState(false)
  const { onDaVe } = p
  useEffect(() => { onDaVe(true) }, [onDaVe])
  const co = (id: IdPhan) => p.coPhan.includes(id)
  const moc = p.tq?.moc ?? p.k?.tu ?? null
  const nowMs = p.tq?.serverNow ?? p.pm.serverNow ?? Date.now()
  return (
    <>
      <BaoCaoTuan sbd={p.sbd} />
      <ThaiDo hoSo={p.hoSo} napHoSo={p.napHoSo} />
      <CauSai hoSo={p.hoSo} tq={p.tq} pm={p.pm} moc={moc} napHoSo={p.napHoSo} moHoSo={() => setMoHoSo(true)} />
      <ThoiGian hoSo={p.hoSo} tq={p.tq} pm={p.pm} hoc2={p.hoc2} moc={moc} />
      <KiemTra pm={p.pm} hoc2={p.hoc2} cot={co('btvn') ? '7' : '12'} />
      {co('btvn') && <Btvn pm={p.pm} moc={moc} nowMs={nowMs} />}
      {co('buoi-hoc') && <BuoiHoc pm={p.pm} cot={co('lich-su') ? '5' : '12'} />}
      {co('lich-su') && p.tq && <LichSu tq={p.tq} hoSo={p.hoSo} cot={co('buoi-hoc') ? '7' : '12'} moHoSo={() => setMoHoSo(true)} />}
      {moHoSo && (
        <Suspense fallback={null}>
          <HoSoCuaConPh sbd={p.sbd} tenCon={p.tenCon} lop={p.lop} onDong={() => setMoHoSo(false)} />
        </Suspense>
      )}
    </>
  )
}

function The({ id, cot, children, vung }: { id: IdPhan; cot: string; children: ReactNode; vung: string }) {
  return (
    <section id={idPhan(id)} data-phan={id} className="tvc-the" data-cot={cot} aria-labelledby={`tvc-${id}`} data-vung={vung}>
      {children}
    </section>
  )
}
const Cho = ({ dong = 3 }: { dong?: number }) => (
  <div className="tvc-cho-dong" aria-hidden="true">{Array.from({ length: dong }, (_, i) => <span key={i} className="tt-xuong" />)}</div>
)

// ---------------------------------------------------------------- Báo cáo tuần (thầy 24/10) ----------------------------------------------------------------
// 7 ngày tới hôm nay, mọi số do máy chủ đếm (server/src/bao-cao-tuan.ts); số nào không có thì không hiện. Nhận định chỉ khi thầy đã bật và tuần đó đã báo phụ huynh.
export function BaoCaoTuan({ sbd }: { sbd: string }) {
  const [bc, setBc] = useState<BaoCaoTuanCon | null>(null)
  const [loi, setLoi] = useState('')
  const tai = () => { setLoi(''); void layBaoCaoTuanCon(sbd).then((r) => (r.ok ? setBc(r.du) : setLoi(r.chu))) }
  useEffect(tai, [sbd])
  const pt = (a: number, b: number) => `${Math.round((100 * a) / b)}%`
  const tongKt = bc ? bc.ktcn.nop + bc.ktcn.hetHan.length : 0
  const tbKt = bc?.ktcn.diem.length ? bc.ktcn.diem.reduce((s, x) => s + x, 0) / bc.ktcn.diem.length : null
  return (
    <section id="phan-bao-cao-tuan" data-phan="bao-cao-tuan" className="tvc-the" data-cot="12" aria-labelledby="tvc-bao-cao-tuan" data-vung="bao-cao-tuan">
      <DauThe id="tvc-bao-cao-tuan" bt={<BtLichSu co={20} />} mau="xd" tieuDe="Báo cáo tuần" phu={bc ? `${bc.tu} đến ${bc.den} · 7 ngày gần nhất` : 'Đang tổng hợp 7 ngày gần nhất…'} />
      {!bc ? (
        loi ? <LoiThe chu={`Chưa tải được báo cáo tuần. ${loi}`} thuLai={tai} nut="Tải lại báo cáo tuần" /> : <div role="status" aria-label="Đang tải báo cáo tuần"><Cho dong={3} /></div>
      ) : (
        <>
          {bc.nhan && <p className="tvc-ket-luan" data-nhan={bc.nhan === 'Đối phó' ? 'doi-pho' : 'hoc-that'}><b>{bc.nhan}</b>{bc.lyDo[0] ? `: ${bc.lyDo[0]}.` : ''}</p>}
          <dl className="tvc-luoi-so">
            {bc.buoi && bc.buoi.tong > 0 && <div><dt>Đi học</dt><dd>{bc.buoi.coMat}/{bc.buoi.tong} <small>buổi{bc.buoi.coPhep ? `, có phép ${bc.buoi.coPhep}` : ''}</small></dd></div>}
            <div><dt>Ngày có làm bài</dt><dd>{bc.ngayCoLam}/{bc.soNgay} <small>ngày</small></dd></div>
            <div><dt>Câu đã làm</dt><dd>{bc.soCau} <small>{bc.soCau ? `câu, đúng ${pt(bc.soDung, bc.soCau)}` : 'câu'}</small></dd></div>
            {tongKt > 0 && <div><dt>Kiểm tra cá nhân</dt><dd>{bc.ktcn.nop}/{tongKt} <small>bài nộp{tbKt !== null ? `, trung bình ${(Math.round(tbKt * 10) / 10).toString().replace('.', ',')}` : ''}</small></dd></div>}
            {bc.banKhac && bc.banKhac.lam >= 5 && <div><dt>Câu bản khác của câu đã làm</dt><dd>{pt(bc.banKhac.dung, bc.banKhac.lam)} <small>đúng{bc.banKhacTruoc && bc.banKhacTruoc.lam >= 5 ? `, tuần trước ${pt(bc.banKhacTruoc.dung, bc.banKhacTruoc.lam)}` : ''}</small></dd></div>}
          </dl>
          {bc.mucLam && bc.mucLam.doDuoc > 0 && (
            <>
              <h3 className="tvc-tieu-nho">Cách làm bài · {bc.mucLam.doDuoc} câu đo được giờ làm</h3>
              <dl className="tvc-luoi-so">
                <div><dt>Làm nhanh vì đã thuộc</dt><dd>{bc.mucLam.thuoc} <small>câu</small></dd></div>
                <div><dt>Bấm vội mà sai</dt><dd>{bc.mucLam.bamVoi} <small>câu</small></dd></div>
                <div><dt>Để máy treo</dt><dd>{bc.mucLam.treo} <small>lần</small></dd></div>
              </dl>
            </>
          )}
          {bc.ngayKhongLam.length > 0 && <p className="tvc-phu">Ngày không làm câu nào: {bc.ngayKhongLam.join(', ')}.</p>}
          {bc.ktcn.hetHan.length > 0 && <p className="tvc-phu">Kiểm tra cá nhân để hết hạn: {bc.ktcn.hetHan.join(', ')}.</p>}
          {bc.chuyenDeYeu.length > 0 && <p className="tvc-phu">Chuyên đề sai nhiều: {bc.chuyenDeYeu.map((c) => `${c.ten} (sai ${c.sai}/${c.lam})`).join(', ')}.</p>}
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- 5 · Thái độ làm bài ----------------------------------------------------------------
function ThaiDo({ hoSo, napHoSo }: { hoSo: TaiHoSo; napHoSo: () => void }) {
  const td = hoSo.td
  return (
    <The id="thai-do" cot="12" vung="thai-do">
      <DauThe id="tvc-thai-do" bt={<BtNhipTim co={20} />} mau="ho" tieuDe="Thái độ làm bài"
        phu={td ? `${td.tinHieu.length} tín hiệu đo từ ${td.dem.soLuot} lượt làm câu, ${ngayChuoiNgan(td.tu)} – ${ngayChuoiNgan(td.den)}` : 'Đang đo từ các lượt làm câu của con…'} />
      {!td ? (
        hoSo.loiTd ? <LoiThe chu={`Chưa tải được thái độ làm bài của con. ${hoSo.loiTd}`} thuLai={napHoSo} nut="Tải lại thái độ làm bài" /> : <div role="status" aria-label="Đang tải thái độ làm bài"><Cho dong={2} /><div className="tvc-tin-hieu">{Array.from({ length: 6 }, (_, i) => <div key={i} className="tvc-th tvc-th--cho tt-xuong" aria-hidden="true" />)}</div></div>
      ) : (
        <>
          <KetLuan td={td} />
          <div className="tvc-tin-hieu" data-vung="tin-hieu">
            {td.tinHieu.map((t) => <TinHieu key={t.ma} t={t} />)}
          </div>
        </>
      )}
    </The>
  )
}

function KetLuan({ td }: { td: KetQuaHoSoThaiDo }) {
  const { doiPho, chu } = chuKetLuan(td)
  const nhom = td.nhomNhip
  const xau = td.tinHieu.some((t) => t.muc === 'xau' || t.muc === 'chu-y')
  const tc = (td.ketLuan as { doTinCay?: number; canThem?: string })
  return (
    <div className="tvc-ket-luan" data-muc={doiPho ? 'xau' : xau ? 'chu-y' : 'tot'} data-vung="ket-luan-thai-do">
      <div className="tvc-hang-chip">
        {nhom && <span className="ph3-chip" data-mau={nhom === 'cham' ? 'xl' : nhom === 'luoi' ? 'ho' : nhom === 'chua-deu' ? 'hp' : 'xd'}>Nhóm: {TEN_NHOM_NHIP[nhom]}</span>}
        {doiPho && <span className="ph3-chip" data-mau="ho"><BtChuY co={15} day={2.5} />Có dấu hiệu đối phó</span>}
      </div>
      <p>{doiPho ? <><b>Có dấu hiệu đối phó</b> <DamSo chu={chu} /></> : <DamSo chu={chu} />}</p>
      {coSo(tc.doTinCay) && <p className="tvc-phu">Độ tin cậy của kết luận {Math.min(99, tc.doTinCay)}%{tc.canThem ? ` · ${tc.canThem}` : ''}</p>}
    </div>
  )
}

function Thuoc({ t }: { t: TinHieuThaiDo }) {
  if (t.ma === 'xu-huong') {
    const h = haiTuan(t.chu)
    if (!h) return null
    return (
      <div className="tvc-so-sanh" role="img" aria-label={`7 ngày gần đúng ${h.gan}%, trước đó ${h.truoc}%`}>
        <span>7 ngày gần</span><i style={{ width: `${h.gan}%` }} /><b>{h.gan}%</b>
        <span>Trước đó</span><i data-cu="" style={{ width: `${h.truoc}%` }} /><b>{h.truoc}%</b>
      </div>
    )
  }
  const c = THUOC[t.ma]
  const v = coSo(t.giaTri) ? Math.max(0, Math.min(c.max, t.giaTri)) : null
  const w = [c.moc[0], c.moc[1] - c.moc[0], c.max - c.moc[1]]
  return (
    <div className="tvc-thuoc-khoi" role="img" aria-label={`${t.ten}: ${v ?? 'chưa đo'}${v !== null ? '%' : ''}; vạch ngưỡng ${c.moc[0]}% và ${c.moc[1]}%`}>
      <div className="tvc-thuoc">
        <div className="tvc-thuoc-nen">{w.map((x, i) => <i key={i} data-mau={c.vung[i]} style={{ width: `${(x / c.max) * 100}%` }} />)}</div>
        {v !== null && <span className="tvc-thuoc-cham" style={{ left: `${(v / c.max) * 100}%` }} />}
      </div>
      <div className="tvc-thuoc-moc" aria-hidden="true">
        <span style={{ left: 0 }} data-dau="">0%</span>
        {c.moc.map((m) => <span key={m} style={{ left: `${(m / c.max) * 100}%` }}>{m}%</span>)}
        <span style={{ left: '100%' }} data-cuoi="">{c.max}%</span>
      </div>
    </div>
  )
}

function TinHieu({ t }: { t: TinHieuThaiDo }) {
  const chip = CHIP_MUC[t.muc]
  const tc = (t as { doTinCay?: number }).doTinCay
  const so = t.ma === 'xu-huong' ? (coSo(t.giaTri) ? `${t.giaTri > 0 ? '+' : t.giaTri < 0 ? '−' : ''}${Math.abs(t.giaTri)}` : '—') : coSo(t.giaTri) ? `${t.giaTri}%` : '—'
  return (
    <article className="tvc-th" data-muc={t.muc} data-ma={t.ma} aria-label={t.ten}>
      <div className="tvc-th-dau"><h3>{t.ten}</h3><span className="ph3-chip" data-mau={chip.mau}>{chip.chu}</span></div>
      <div className="tvc-th-so"><b>{so}{t.ma === 'xu-huong' && coSo(t.giaTri) && <small> điểm %</small>}</b><span>{soLieu(t)}</span></div>
      <Thuoc t={t} />
      <p className="tvc-th-nghia"><span className="ph3-an">Nghĩa là: </span>{nghiaLa(t)}</p>
      <div className="tvc-th-chan">
        <span>Ngưỡng: {NGUONG_CHU[t.ma]}</span>
        {coSo(tc) && <span>Độ tin cậy {Math.min(99, tc)}%</span>}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------- 6 · Câu sai và tự sửa ----------------------------------------------------------------
function CauSai({ hoSo, tq, pm, moc, napHoSo, moHoSo }: { hoSo: TaiHoSo; tq: ConTongQuan | null; pm: PhMoi; moc: string | null; napHoSo: () => void; moHoSo: () => void }) {
  const ts = hoSo.td?.tuSuaSai
  const sai = ts ? ts.soCauSai : tq?.cauSai.tong ?? null
  const sua = ts ? ts.soCauDaSua : tq?.cauSai.daSua ?? null
  const pt = sai ? Math.round((100 * (sua ?? 0)) / sai) : null
  const ls = hoSo.ls
  const chuaSua = ls ? ls.cauSai.filter((c) => !c.lanCuoiDung) : []
  const lo = pm.lichOn
  return (
    <The id="cau-sai" cot="6" vung="cau-sai">
      <DauThe id="tvc-cau-sai" bt={<BtBut co={20} />} mau="ho" tieuDe="Câu sai và tự sửa" phu={`${moc ? `Từ ${ngayChuoiNgan(moc)} · ` : ''}tính theo câu gốc`} />
      {sai !== null && sua !== null ? (
        sai > 0 ? (
          <div className="tvc-vong-hang">
            <div className="tvc-vong" style={{ ['--p' as string]: pt ?? 0 }} role="img" aria-label={`Đã làm đúng lại ${pt}% câu từng sai`}><b>{pt}%</b></div>
            <div className="tvc-vong-chu"><b>Con đã làm đúng lại {sua}/{sai} câu từng sai</b><span className="tvc-phu">{sai} câu từng sai · {sua} đã sửa · {sai - sua} chưa sửa</span></div>
          </div>
        ) : <p className="tvc-phu">Con chưa có câu nào làm sai từ {moc ? ngayChuoiNgan(moc) : 'đầu đợt'}.</p>
      ) : <Cho dong={2} />}
      {!ls ? (
        hoSo.loiLs ? <LoiThe chu={`Chưa tải được danh sách câu sai của con. ${hoSo.loiLs}`} thuLai={napHoSo} nut="Tải lại câu sai" /> : <Cho />
      ) : chuaSua.length > 0 ? (
        <>
          <h3 className="tvc-tieu-nho">Chưa sửa được · số giây từng lần sai (cũ → mới)</h3>
          <ul className="tvc-ds-cau" data-vung="cau-chua-sua">
            {chuaSua.slice(0, 4).map((c) => (
              <li key={c.qid}>
                <span className="tvc-dau-cham" data-mau="ho" aria-hidden="true"><BtNhan co={16} day={2.6} /></span>
                <div>
                  <b>{c.tieuDe || 'Câu chưa ghi tên'}</b>
                  <span className="tvc-phu">{[tenMucDo(c.mucDo), `sai ${c.soSai} lần`, `lần cuối ${ngayNganVn(c.lanCuoi)}`].filter(Boolean).join(' · ')}</span>
                  <span className="tvc-giay">
                    {c.giaySai.slice(-6).map((g, i) => <span key={i} data-nhanh={g !== null && g < NG.giayNhanhTracNghiem ? '' : undefined}>{g === null ? 'chưa đo' : chuGiay(g)}</span>)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="tvc-lien-ket tt-nhan" onClick={moHoSo}>Xem đủ {chuaSua.length} câu chưa sửa và {ls.cauSai.length - chuaSua.length} câu đã sửa<BtPhai co={18} day={2.4} /></button>
        </>
      ) : (
        ls.cauSai.length > 0 && <p className="tvc-phu">Con đã làm đúng lại mọi câu từng sai.</p>
      )}
      {lo && (
        <div className="tvc-lich-on" data-vung="lich-on">
          <b>Lịch ôn lại của con</b>
          <span>Hôm nay <b>{lo.homNay} câu</b> · ngày mai <b>{lo.ngayMai} câu</b>{lo.phutNgayMai ? ` (khoảng ${lo.phutNgayMai} phút)` : ''} · đã khắc phục trong 14 ngày: <b>{lo.daKhacPhuc14Ngay} câu</b></span>
          {lo.bayNgayToi && (
            <div className="tvc-lich-on-cot" role="img" aria-label={`Số câu đến lịch ôn lại 7 ngày tới: ${lo.bayNgayToi.map((x) => `${ngayChuoiNgan(x.ngay)} ${x.soCau} câu`).join(', ')}`}>
              {(() => {
                const max = Math.max(1, ...lo.bayNgayToi.map((x) => x.soCau))
                return lo.bayNgayToi.map((x) => (
                  <div key={x.ngay}><b>{x.soCau}</b><i style={{ height: `${x.soCau ? Math.max(4, (x.soCau / max) * 48) : 2}px` }} />{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(`${x.ngay}T00:00:00Z`).getUTCDay()]}</div>
                ))
              })()}
            </div>
          )}
        </div>
      )}
    </The>
  )
}

// ---------------------------------------------------------------- 7 · Thời gian làm bài ----------------------------------------------------------------
function ThoiGian({ hoSo, tq, pm, hoc2, moc }: { hoSo: TaiHoSo; tq: ConTongQuan | null; pm: PhMoi; hoc2: Hoc2 | null; moc: string | null }) {
  const dem = hoSo.td?.dem
  // Giờ học quen = khung giờ đo được từ sổ (máy chủ); giờ con CHỌN (OMNI) là số khác ⇒ nhãn khác, không trộn.
  const gio = pm.nhipHoc?.gioThuongHoc || ''
  const gioChon = hoc2?.omni?.gioHoc || ''
  const md = hoSo.ls ? giayTheoMucDo(hoSo.ls.lan) : null
  const maxMd = md ? Math.max(1, ...md.map((d) => d.giayTb ?? 0)) : 1
  const tg = tq?.thoiGian
  const maxPb = tg ? Math.max(1, ...tg.phanBo.map((k) => k.so)) : 1
  return (
    <The id="thoi-gian" cot="6" vung="thoi-gian">
      <DauThe id="tvc-thoi-gian" bt={<BtDongHo co={20} />} mau="tim" tieuDe="Thời gian làm bài" phu={dem ? `${moc ? `Từ ${ngayChuoiNgan(moc)} · ` : ''}${dem.soLuotCoGiay} lượt có số giây` : undefined} />
      {dem || gio || gioChon ? (
        <dl className="tvc-luoi-so">
          {dem && <div><dt>Trung bình</dt><dd>{coSo(dem.giayTb) ? (dem.giayTb < 60 ? <>{Math.round(dem.giayTb)} <small>giây/lượt</small></> : <>{chuGiay(dem.giayTb)}<small>/lượt</small></>) : <small>chưa đo giờ</small>}</dd></div>}
          {dem && <div><dt>Một nửa số lượt dưới</dt><dd>{coSo(dem.giayTrungVi) ? (dem.giayTrungVi < 60 ? <>{Math.round(dem.giayTrungVi)} <small>giây</small></> : chuGiay(dem.giayTrungVi)) : <small>chưa đo giờ</small>}</dd></div>}
          {gio ? <div><dt>Giờ học quen</dt><dd className="tvc-dd-nho">{gio}</dd></div> : gioChon ? <div><dt>Giờ học con chọn</dt><dd className="tvc-dd-nho">{gioChon}</dd></div> : null}
        </dl>
      ) : hoSo.loiTd ? null : <Cho dong={1} />}
      {gio && gioChon && gioChon !== gio && <p className="tvc-phu">Giờ học con chọn: {gioChon}.</p>}
      <h3 className="tvc-tieu-nho">Số giây theo mức độ câu (dễ → khó)</h3>
      {md ? (
        md.length > 0 ? (
          <ul className="tvc-muc-do" data-vung="giay-muc-do">
            {md.map((d) => (
              <li key={d.ten}>
                <span>{d.ten}</span>
                <span className="tvc-vach-gio" style={{ width: `${((d.giayTb ?? 0) / maxMd) * 100}%` }} aria-hidden="true" />
                <span className="tvc-gio-chu"><b>{d.giayTb !== null ? `${d.coUoc ? '≈' : ''}${chuGiay(d.giayTb)}` : 'chưa đo giờ'}</b> mỗi lượt · {d.soLuot} lượt{d.tiLeDung !== null ? ` · đúng ${d.tiLeDung}%` : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="tvc-phu">Chưa có lượt làm câu nào.</p>
      ) : hoSo.loiLs ? <p className="tvc-phu">Chưa tải được số giây theo mức độ câu. {hoSo.loiLs}</p> : <Cho />}
      {hoSo.ls?.conNua && <p className="tvc-phu">Tính trên {hoSo.ls.lan.length} lượt gần nhất.</p>}
      {tg && tg.phanBo.some((k) => k.so > 0) && (
        <>
          <h3 className="tvc-tieu-nho">7 ngày qua · số lượt theo thời gian làm (phần hồng là lượt sai)</h3>
          <ul className="tvc-phan-bo" data-vung="phan-bo-giay">
            {tg.phanBo.map((k) => (
              <li key={k.tu} data-nhanh={k.tu === 0 && k.den !== null && k.den <= NG.giayNhanhTracNghiem ? '' : undefined}>
                <span>{nhanKhoangGiay(k)}</span>
                <span className="tvc-cot" aria-hidden="true"><i style={{ width: `${((k.so - k.sai) / maxPb) * 100}%` }} /><i style={{ width: `${(k.sai / maxPb) * 100}%` }} /></span>
                <b>{k.so} lượt{k.sai ? <small> · sai {k.sai}</small> : null}</b>
              </li>
            ))}
          </ul>
        </>
      )}
      {tq && (
        <p className="tvc-phu">
          Làm bài 23:00–04:59 trong 7 ngày qua: {tq.khuya.soNgay} ngày, {tq.khuya.soLuot} lượt
          {tq.thoiGian.soUoc > 0 ? ` · ${tq.thoiGian.soUoc} lượt có số giây ước tính (≈)` : ''}{tq.thoiGian.soChuaDo > 0 ? ` · ${tq.thoiGian.soChuaDo} lượt chưa đo giờ` : ''}.
        </p>
      )}
    </The>
  )
}

// ---------------------------------------------------------------- 8 · Kiểm tra và tiến bộ ----------------------------------------------------------------
function BieuDoDiem({ ds }: { ds: DiemTienBo[] }) {
  const W = 600, H = 150, x0 = 30, x1 = W - 30
  const lo = Math.min(5, Math.floor(Math.min(...ds.map((d) => d.diem)))), hi = Math.max(9, Math.ceil(Math.max(...ds.map((d) => d.diem))))
  const y = (v: number) => 118 - ((v - lo) / Math.max(1, hi - lo)) * 92
  const x = (i: number) => (ds.length === 1 ? W / 2 : x0 + (i * (x1 - x0)) / (ds.length - 1))
  const luoi = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  return (
    <div className="tvc-bieu-do" role="img" aria-label={`Điểm ${ds.length} ca kiểm tra: ${ds.map((d) => soVn(d.diem)).join(' · ')}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {luoi.map((v) => <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} className={v === 8 ? 'tvc-bd-moc' : 'tvc-bd-luoi'} vectorEffect="non-scaling-stroke" />)}
        <polyline points={ds.map((d, i) => `${x(i)},${y(d.diem)}`).join(' ')} className="tvc-bd-duong" vectorEffect="non-scaling-stroke" />
      </svg>
      {ds.map((d, i) => (
        <span key={`${d.maCa}-${i}`} aria-hidden="true">
          <span className="tvc-bd-cham" style={{ left: `${(x(i) / W) * 100}%`, top: `${y(d.diem)}px` }} />
          <span className="tvc-bd-so" style={{ left: `${(x(i) / W) * 100}%`, top: `${y(d.diem) - 28}px` }}>{soVn(d.diem)}</span>
          <span className="tvc-bd-ngay" style={{ left: `${(x(i) / W) * 100}%` }}>{ngayChuoiNgan(d.ngay) || d.ngay}</span>
        </span>
      ))}
      {hi >= 8 && <span className="tvc-bd-nhan" style={{ top: `${y(8) - 18}px` }} aria-hidden="true">mốc 8 điểm</span>}
    </div>
  )
}

function KiemTra({ pm, hoc2, cot }: { pm: PhMoi; hoc2: Hoc2 | null; cot: string }) {
  const ds = diemCacCa(pm)
  const ca = pm.caGanNhat
  const omni = hoc2?.omni
  const lamTot = pm.manhYeu?.lamTot ?? []
  const luyen = pm.manhYeu?.conVap?.length ? pm.manhYeu.conVap : (pm.dangVap ?? []).map((d) => ({ tenDang: d.ten, dung: d.dung, tong: d.tong }))
  const len = pm.vuaLenBac ?? []
  const cc = omni?.chungChi[0]
  const coDang = lamTot.length + luyen.length + len.length > 0
  const tong = ca?.ketQua?.tong ?? null
  const nop = ca ? Date.parse(ca.nopLuc) : NaN
  return (
    <The id="kiem-tra" cot={cot} vung="kiem-tra">
      <DauThe id="tvc-kiem-tra" bt={<BtBang co={20} />} mau="xd" tieuDe="Kiểm tra và tiến bộ" phu={ds.length > 0 ? `${ds.length} ca kiểm tra đã công bố` : 'Chưa có ca kiểm tra nào được công bố điểm'} />
      {ca && (
        <div className="tvc-ca" data-vung="ca-gan-nhat">
          <span className="tvc-ca-ten">{ca.tenCa}</span>
          {tong !== null ? (
            <>
              <div className="tvc-ca-so">
                <b>{soVn(tong)}<small>/10</small></b>
                {ca.truoc && (
                  <span className="ph3-chip" data-mau={ca.truoc.doi >= 0 ? 'xl' : 'ho'}>
                    {ca.truoc.doi >= 0 ? <BtDiLen co={15} day={2.5} /> : <BtDiXuong co={15} day={2.5} />}
                    {ca.truoc.doi > 0 ? '+' : ca.truoc.doi < 0 ? '−' : ''}{soVn(Math.abs(ca.truoc.doi))} so với ca trước{ca.truoc.tong !== null ? ` (${soVn(ca.truoc.tong)})` : ''}
                  </span>
                )}
              </div>
              <span className="tvc-ca-phu">
                {[Number.isFinite(nop) ? `Nộp ${ngayGioVn(nop)}` : '', ca.thoiGianLamGiay ? `làm trong ${Math.round(ca.thoiGianLamGiay / 60)} phút` : '', ca.ketQua?.soCauDung !== null && ca.ketQua?.soCau ? `đúng ${ca.ketQua.soCauDung}/${ca.ketQua.soCau} câu` : ''].filter(Boolean).join(' · ')}
              </span>
              {ca.phan.length > 0 && (
                <ul className="tvc-ca-phan">
                  {ca.phan.map((ph) => {
                    const ti = ph.toiDa && ph.diem !== null ? ph.diem / ph.toiDa : ph.dung / ph.tong
                    return (
                      <li key={ph.ma}>
                        <span>Phần {ph.ma}<small> · {TEN_PHAN[ph.ma]}</small></span>
                        <span className="tvc-thanh tvc-thanh--xd" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(1, ti)) * 100}%` }} /></span>
                        <b>{ph.diem !== null && ph.toiDa ? `${soVn(ph.diem)}/${soVn(ph.toiDa)}` : `${ph.dung}/${ph.tong} câu`}</b>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          ) : (
            <span className="tvc-ca-phu">{Number.isFinite(nop) ? `Nộp ${ngayGioVn(nop)} · ` : ''}{chuCongBoCa(ca)}</span>
          )}
          <a className="tvc-lien-ket tt-nhan" href={lienKetCa(ca.maCa)}>Xem báo cáo ca này<BtPhai co={18} day={2.4} /></a>
        </div>
      )}
      {ds.length >= 2 && <BieuDoDiem ds={ds} />}
      {omni && (
        <dl className="tvc-luoi-so" data-vung="omni-ph">
          <div><dt>Sơ ý của con</dt><dd>{omni.sEm !== null ? <>{phanTram(omni.sEm)} <small>(mục tiêu dưới 7%)</small></> : <small>chưa đủ số liệu</small>}</dd></div>
          <div><dt>Dạng cần vững</dt><dd>{omni.dangCanVung.length} <small>dạng</small></dd></div>
          <div><dt>Khoảng cách tới 8</dt><dd className="tvc-dd-nho">{omni.hieuChuan.du && omni.khoangCach8 !== null ? chuPhKhoangCach(omni.khoangCach8) : <>Chưa tính <small>(cần 3 ca chốt, đã có {omni.hieuChuan.soCaChot})</small></>}</dd></div>
        </dl>
      )}
      {omni && omni.dangCanVung.length > 0 && <p className="tvc-phu" data-vung="dang-can-vung">Dạng cần vững: {omni.dangCanVung.join(' · ')}</p>}
      {cc && <p className="tvc-phu">Chứng chỉ gần nhất: {cc.ten} · Sẵn sàng 8+ · độ tin {doTinChu(cc.doTin)}{cc.diem !== null ? ` · điểm ca chốt ${diemChu(cc.diem)}` : ''}</p>}
      {coDang && (
        <ul className="tvc-dang" data-vung="dang-ph">
          {lamTot.map((d) => <li key={`t-${d.tenDang}`}><span>Dạng con làm tốt<small>{d.tenDang}</small></span><span className="ph3-chip" data-mau="xl">{d.dung}/{d.tong} đúng</span></li>)}
          {luyen.slice(0, 3).map((d) => <li key={`l-${d.tenDang}`}><span>Dạng con đang luyện thêm<small>{d.tenDang}</small></span><span className="ph3-chip" data-mau="hp">{d.dung}/{d.tong} đúng</span></li>)}
          {len.slice(0, 3).map((d) => (
            <li key={`b-${d.ten}`}>
              <span>Vừa lên bậc{d.ngay ? ` · ${ngayChuoiNgan(d.ngay)}` : ''}<small>{d.ten}: {TEN_BAC_SO[d.tu as 0 | 1 | 2] ?? d.tu} → {TEN_BAC_SO[d.den as 0 | 1 | 2] ?? d.den}</small></span>
              <span className="ph3-chip" data-mau="xd"><BtDiLen co={15} day={2.5} />Lên bậc</span>
            </li>
          ))}
        </ul>
      )}
      <div className="tvc-hang-lien-ket">
        {ds.length > 0 && <a className="tvc-lien-ket tt-nhan" href="#ca-kiem-tra">Xem tất cả {ds.length} ca kiểm tra<BtPhai co={18} day={2.4} /></a>}
        {pm.bacTheoDang && pm.bacTheoDang.length > 0 && <a className="tvc-lien-ket tt-nhan" href="#tien-bo">Xem bậc từng dạng<BtPhai co={18} day={2.4} /></a>}
      </div>
    </The>
  )
}

// ---------------------------------------------------------------- 9 · Bài tập về nhà ----------------------------------------------------------------
function Btvn({ pm, moc, nowMs }: { pm: PhMoi; moc: string | null; nowMs: number }) {
  const bt = pm.baiTapVeNha
  const chay = bt?.dangChay ?? []
  const gan = bt?.gan ?? []
  return (
    <The id="btvn" cot="5" vung="btvn">
      <DauThe id="tvc-btvn" bt={<BtSach co={20} />} mau="xl" tieuDe="Bài tập về nhà" phu={`Đang làm ${chay.length} bài · đã nộp ${gan.length} bài${moc ? ` từ ${ngayChuoiNgan(moc)}` : ''}`} />
      {chay.map((b) => {
        const han = Date.parse(b.hanNop)
        const con = Number.isFinite(han) ? chuConLai(han, nowMs) : ''
        return (
          <div key={b.maBtvn} className="tvc-hop" data-vung="btvn-dang-lam">
            <b>{b.ten}</b>
            {b.changTong !== null && b.changTong > 0 && (
              <div className="tvc-chang" role="img" aria-label={`Xong ${b.changXong ?? 0} trên ${b.changTong} chặng`} style={{ gridTemplateColumns: `repeat(${Math.min(b.changTong, 12)}, minmax(0, 1fr))` }}>
                {Array.from({ length: Math.min(b.changTong, 12) }, (_, i) => <i key={i} data-xong={i < (b.changXong ?? 0) ? '' : undefined} />)}
              </div>
            )}
            <span>{b.changTong !== null ? <>Xong <b>{b.changXong ?? 0}/{b.changTong} chặng</b> · </> : null}hạn nộp <b>{Number.isFinite(han) ? ngayGioVn(han) : ''}</b>{con ? ` (${con})` : ''}</span>
          </div>
        )
      })}
      {gan.length > 0 && (
        <ul className="tvc-dong-ds" data-vung="btvn-da-nop">
          {gan.map((b) => (
            <li key={b.maBtvn}>
              <span className="tvc-dau-cham" data-mau={b.dungHan === false ? 'ho' : b.dungHan ? 'xl' : 'xam'} aria-hidden="true">{b.dungHan === false ? <BtDongHo co={16} day={2.4} /> : <BtTich co={16} day={2.6} />}</span>
              <div><b>{b.ten}</b><span className="tvc-phu">Nộp {ngayGioVn(b.nopLuc)}{b.dungHan === true ? ' · đúng hạn' : b.dungHan === false ? ` · trễ ${b.nopTreGio !== null ? `${soVn(b.nopTreGio)} giờ` : 'hạn'}` : ''}</span></div>
              {b.diem !== null && <strong aria-label={`${soVn(b.diem)} điểm`}>{soVn(b.diem)}</strong>}
            </li>
          ))}
        </ul>
      )}
      {chay.length === 0 && gan.length === 0 && <p className="tvc-phu">Con chưa có bài tập về nhà nào{moc ? ` từ ${ngayChuoiNgan(moc)}` : ''}.</p>}
      <p className="tvc-phu">
        {gan.some((b) => b.diem !== null) ? 'Điểm thang 10' : ''}
        {pm.no ? <>{gan.some((b) => b.diem !== null) ? ' · ' : ''}Câu dồn từ các ngày trước: <b>{pm.no.tongCau} câu</b>{pm.no.tongPhut ? `, khoảng ${Math.round(pm.no.tongPhut)} phút` : ''}.</> : gan.some((b) => b.diem !== null) ? '.' : ''}
      </p>
    </The>
  )
}

// ---------------------------------------------------------------- 10 · Buổi học trên lớp ----------------------------------------------------------------
function BuoiHoc({ pm, cot }: { pm: PhMoi; cot: string }) {
  const ds = pm.buoiHoc ?? []
  const daXong = ds.filter((b) => b.coMat || !b.dangMo)
  const coMat = daXong.filter((b) => b.coMat).length
  return (
    <The id="buoi-hoc" cot={cot} vung="buoi-hoc">
      <DauThe id="tvc-buoi-hoc" bt={<BtLop co={20} />} mau="xd" tieuDe="Buổi học trên lớp" phu={`Điểm danh ${ds.length} buổi gần nhất`}
        chip={daXong.length > 0 ? <span className="ph3-chip" data-mau={coMat === daXong.length ? 'xl' : 'hp'} data-vung="co-mat-tong">Có mặt {coMat}/{daXong.length}</span> : undefined} />
      <ul className="tvc-dong-ds">
        {ds.map((b, i) => (
          <li key={`${b.moLuc}-${i}`} data-co-mat={b.coMat ? '' : undefined}>
            <span className="tvc-dau-cham" data-mau={b.coMat ? 'xl' : b.dangMo ? 'xd' : 'ho'} aria-hidden="true">{b.coMat ? <BtTich co={16} day={2.6} /> : b.dangMo ? <BtDongHo co={16} day={2.4} /> : <BtNhan co={16} day={2.6} />}</span>
            <div>
              <b>{thuNgayVn(b.moLuc)} · <span className="tvc-ten-buoi">{b.ten}</span></b>
              {b.coMat ? (
                <span className="tvc-phu">Có mặt {gioVn(b.luc)}{b.cach === 'ma' ? ' · tự điểm danh bằng mã' : b.cach === 'thay' ? ' · thầy điểm danh' : ''}</span>
              ) : b.dangMo ? (
                <span className="tvc-phu">Buổi đang diễn ra · con chưa điểm danh</span>
              ) : (
                <span className="tvc-vang">Vắng</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </The>
  )
}

// ---------------------------------------------------------------- 11 · Lịch sử ----------------------------------------------------------------
const NGAY_HIEN = 14
function LichSu({ tq, hoSo, cot, moHoSo }: { tq: ConTongQuan; hoSo: TaiHoSo; cot: string; moHoSo: () => void }) {
  const ngay = tq.ngay.filter((n) => n.ngay >= tq.moc).reverse()
  const dong = (n: (typeof ngay)[number]) => {
    const tt = n.homNay ? 'nay' : n.daLam >= n.canLam ? 'du' : n.trangThai === 'khong' ? 'khong' : 'thieu'
    return (
      <tr key={n.ngay} data-t={tt}>
        <td>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(`${n.ngay}T00:00:00Z`).getUTCDay()]} {ngayChuoiNgan(n.ngay)}{n.homNay ? ' · hôm nay' : ''}</td>
        <td>{tt === 'khong' ? 'Không làm' : <><b>{n.daLam}</b>/{n.mucUocTinh ? '≈' : ''}{n.canLam}</>}</td>
        <td>{n.dung}</td>
        <td>{n.sai}</td>
      </tr>
    )
  }
  const soLuot = hoSo.td?.dem.soLuot ?? hoSo.ls?.tong.soLuot ?? tq.dem.tuMoc.soLuot
  return (
    <The id="lich-su" cot={cot} vung="lich-su">
      <DauThe id="tvc-lich-su" bt={<BtLichSu co={20} />} mau="tim" tieuDe="Lịch sử từng ngày" phu="Số câu khác nhau con làm mỗi ngày" />
      {ngay.length > 0 ? (
        <table className="tvc-bang">
          <thead><tr><th scope="col">Ngày</th><th scope="col">Đã làm / mức</th><th scope="col">Đúng</th><th scope="col">Sai</th></tr></thead>
          <tbody>{ngay.slice(0, NGAY_HIEN).map(dong)}</tbody>
        </table>
      ) : <p className="tvc-phu">Chưa có ngày nào từ {ngayChuoiNgan(tq.moc)}.</p>}
      {ngay.length > NGAY_HIEN && (
        <details className="tvc-xem-them">
          <summary className="tt-nhan">Xem thêm {ngay.length - NGAY_HIEN} ngày trước đó</summary>
          <table className="tvc-bang"><tbody>{ngay.slice(NGAY_HIEN).map(dong)}</tbody></table>
        </details>
      )}
      {tq.ganDay.length > 0 && (
        <>
          <h3 className="tvc-tieu-nho">Câu con làm gần đây</h3>
          <ul className="tvc-dong-ds" data-vung="cau-gan-day">
            {tq.ganDay.slice(0, 5).map((l, i) => (
              <li key={`${l.luc}-${i}`}>
                <span className="tvc-dau-cham" data-mau={l.dung === true ? 'xl' : l.dung === false ? 'ho' : 'xam'} aria-hidden="true">{l.dung === false ? <BtNhan co={16} day={2.6} /> : <BtTich co={16} day={2.6} />}</span>
                <div><b>{l.tieuDe || 'Câu chưa ghi tên'}</b><span className="tvc-phu">{[l.noi, gioVn(l.luc), l.dung === null ? 'bỏ trống' : '', l.coGoiY ? 'có dùng gợi ý' : ''].filter(Boolean).join(' · ')}</span></div>
                <strong className="tvc-giay-lon">{chuGiay(l.giay, l.nguonGiay).replace(/^≈/, '≈ ')}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
      <button type="button" className="tvc-lien-ket tt-nhan" onClick={moHoSo}>Xem tất cả {soLuot} lượt<BtPhai co={18} day={2.4} /></button>
    </The>
  )
}

