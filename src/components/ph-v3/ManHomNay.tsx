// Mục "Hôm nay" — BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 (thay thứ tự thẻ 01/10): Cảnh báo của thầy (CHỈ khi có cảnh báo thật, đứng đầu) → BỐN khối:
//   (a) khối chính: con đã làm a/b câu hôm nay + thanh + một câu tình trạng (+ giờ học quen nếu có);
//   (b) Tuần này học đều n/7 ngày (khi máy chủ có ngày học);
//   (c) Dạng con đang luyện thêm (chỉ tên dạng, ngắn) + Cần thầy chữa (nếu có) + điểm ca kiểm tra gần nhất;
//   (d) Lời thầy mới nhất (tác giả "Thầy Đỗ Đại Học"; mục "Lời thầy" riêng đã bỏ).
// Đã bỏ theo bản vẽ: số câu nói ba lần từ hai nguồn (giữ MỘT nguồn), phút học lặp, "câu cần thầy dạy lại" cạnh "Cần thầy chữa", thẻ "Hành trình của con"
// chỉ có chữ, thẻ chiến dịch, Bài tập về nhà / Bài gia đình giao (thầy chốt bỏ hẳn), điều đáng mừng, "Thầy đã lo cho con", "Con học lúc nào", danh sách dạng
// (MỘT danh sách dạng, ở Tiến bộ). Mỗi khối chỉ hiện khi có SỐ THẬT; không có gì ⇒ vắng (không số 0 giả).
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { CaGanNhat, PhMoi } from '../../lib/ph-moi/du-lieu'
import type { Hoc2, NhanXetCa } from '../../lib/ph-v3/du-lieu'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { chuHanNop, chuGuiLuc, tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import { gioVn, ngayDayDuVn, ngayNganVn, soVn, thuNgayVn } from '../../lib/ph-moi/dinh-dang'
import { chuCongBoCa } from '../ph-moi/nhan'
import { BtChuong, BtPhai, BtTich } from './BieuTuong'
import { DangTai, The, TheLoi } from './dung-chung'
import { chuThay, lienKetCa, tuanNay } from './tien-ich'

/** Tối đa số tên dạng ghi ở khối (c) (còn lại gộp "và N dạng khác") — dòng ngắn trên điện thoại; danh sách đủ ở Tiến bộ. */
const DANG_TOI_DA = 3
const THU_NGAN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const
const THU_DAY = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'] as const

export default function ManHomNay({ v, hoc2, loiThay, thuLaiLoiThay, canhBao, onDaXem }: {
  v: ViewPhMoi
  hoc2: Hoc2 | null
  loiThay: { ds: NhanXetCa[] | null; chuLoi: string }
  thuLaiLoiThay: () => void
  canhBao: CanhBaoThay[]
  onDaXem: (id: string) => void
}) {
  const pm = v.pm
  return (
    <div data-vung="man-chinh-ph">
      <div className="ph3-tieu-de">
        <h1>Hôm nay</h1>
        {pm?.serverNow ? <span>Cập nhật {gioVn(pm.serverNow)}</span> : null}
      </div>
      {!pm ? (
        v.trangThai === 'loi' ? <div className="ph3-luoi"><TheLoi chu={v.chuLoi} thuLai={v.thuLai} /></div> : <DangTai />
      ) : (
        <div className="ph3-luoi">
          {canhBao.map((cb) => <CanhBao key={cb.id} cb={cb} nay={pm.serverNow ?? Date.now()} onDaXem={onDaXem} />)}
          <KhoiChinh pm={pm} hoc2={hoc2} />
          <TuanNay pm={pm} />
          <DangVaCa pm={pm} hoc2={hoc2} />
          <LoiThayMoi loiThay={loiThay} thuLai={thuLaiLoiThay} />
        </div>
      )}
    </div>
  )
}

function CanhBao({ cb, nay, onDaXem }: { cb: CanhBaoThay; nay: number; onDaXem: (id: string) => void }) {
  return (
    <section className="ph3-canh-bao ph3-o-du" aria-label="Cảnh báo của thầy" data-vung="canh-bao-thay">
      <div className="ph3-canh-bao__dau"><BtChuong co={18} />Cảnh báo của thầy · {chuGuiLuc(cb)}</div>
      <p><b>{tieuDeCanhBao(cb, 'phuhuynh')}</b></p>
      {cb.loi && <p>{chuThay(cb.loi)}</p>}
      <p>{chuHanNop(cb, nay)}</p>
      <button type="button" className="ph3-nut-vien" style={{ alignSelf: 'flex-start' }} onClick={() => onDaXem(cb.id)}>Đã xem cảnh báo</button>
    </section>
  )
}

/**
 * Số câu hôm nay từ MỘT nguồn: có kế hoạch đã chốt của Game Hoá 2.0 (`/ph/hoc-2` homNay) ⇒ CHỈ dùng kế hoạch (đã làm / tổng);
 * không có kế hoạch ⇒ "câu đã làm hôm nay" của `/ph/tat-ca-ve-con` + mục tiêu ngày nếu máy chủ trả. Hai nguồn không bao giờ cùng hiện (trước đây vênh nhau).
 */
export function soCauHomNay(pm: PhMoi, hoc2: Hoc2 | null): { daLam: number; tong: number | null; keHoach: boolean } {
  const kh = hoc2?.homNay ?? null
  if (kh) return { daLam: kh.daLam, tong: kh.tong, keHoach: true }
  const muc = pm.tongQuan?.mucTieu?.soCau ?? null
  return { daLam: pm.tongQuan?.soCau ?? 0, tong: muc && muc > 0 ? muc : null, keHoach: false }
}

/** Một câu tình trạng dưới số câu (không nhắc lại số đã ghi to). */
export function chuTinhTrang({ daLam, tong, keHoach }: { daLam: number; tong: number | null; keHoach: boolean }): string {
  const dich = keHoach ? 'xong kế hoạch hôm nay' : 'đủ mục tiêu của ngày'
  if (tong === null) return daLam > 0 ? '' : 'Kết quả hiện ở đây ngay khi con bắt đầu học.'
  if (daLam >= tong) return keHoach ? 'Con đã xong kế hoạch hôm nay.' : 'Con đã đủ mục tiêu của ngày.'
  if (daLam === 0) return keHoach ? 'Con chưa bắt đầu kế hoạch hôm nay.' : 'Con chưa bắt đầu học hôm nay.'
  return `Con đang làm, còn ${tong - daLam} câu nữa là ${dich}.`
}

function KhoiChinh({ pm, hoc2 }: { pm: PhMoi; hoc2: Hoc2 | null }) {
  const so = soCauHomNay(pm, hoc2)
  const ngay = thuNgayVn(pm.serverNow ?? Date.now())
  const tinhTrang = chuTinhTrang(so)
  const gioQuen = pm.nhipHoc?.gioThuongHoc ? `Giờ học quen của con: ${pm.nhipHoc.gioThuongHoc}.` : hoc2?.omni?.gioHoc ? `Giờ học con chọn: ${hoc2.omni.gioHoc}.` : ''
  const coSo = so.tong !== null || so.daLam > 0
  const ti = so.tong ? Math.max(0, Math.min(1, so.daLam / so.tong)) : null
  const cau = [tinhTrang, gioQuen].filter(Boolean).join(' ')
  return (
    <section className="ph3-ah ph3-o-rong" aria-labelledby="ph3-hn" data-vung="anh-hung">
      {coSo ? (
        <>
          <p id="ph3-hn" className="ph3-ah__nhan">Con đã làm hôm nay · {ngay}</p>
          <p className="ph3-ah__cau" data-vung="so-cau-hom-nay"><b>{so.daLam}</b><small>{so.tong !== null ? `/${so.tong} câu` : ' câu'}</small></p>
          {ti !== null && <span className="ph3-ah__thanh" aria-hidden="true"><span style={{ width: `${ti * 100}%` }} /></span>}
        </>
      ) : (
        <>
          <span className="ph3-ah__tren">{ngay}</span>
          <h2 id="ph3-hn">Hôm nay con chưa làm câu nào</h2>
        </>
      )}
      {cau && <p className="ph3-ah__phu">{cau}</p>}
    </section>
  )
}

/** Tuần này (Thứ Hai → Chủ nhật, giờ VN): ngày có ít nhất một câu theo nhịp học của máy chủ. Không có ngày học nào trong dữ liệu ⇒ vắng. */
function TuanNay({ pm }: { pm: PhMoi }) {
  const nh = pm.nhipHoc
  if (!nh || nh.ngay.length === 0 || !pm.serverNow) return null
  const { ngay, homNay } = tuanNay(pm.serverNow)
  if (ngay.length !== 7) return null
  const theo = new Map(nh.ngay.map((x) => [x.ngay, x.soCau]))
  const hoc = ngay.map((n, i) => i <= homNay && (theo.get(n) ?? 0) > 0)
  const soNgay = hoc.filter(Boolean).length
  return (
    <The id="ph3-tuan" className="ph3-o-hep" vung="tuan-nay" tieuDe="Tuần này học đều" chip={<b className="ph3-the__so">{soNgay}/7 ngày</b>}>
      <ol className="ph3-tuan">
        {ngay.map((n, i) => {
          const trangThai = i > homNay ? 'chưa tới' : hoc[i] ? 'có học' : 'không học'
          return (
            <li key={n} data-hoc={hoc[i] ? '' : undefined} data-sau={i > homNay ? '' : undefined} data-nay={i === homNay ? '' : undefined}>
              <i aria-hidden="true">{hoc[i] && <BtTich co={16} day={3} />}</i>
              <span aria-hidden="true">{THU_NGAN[i]}</span>
              <span className="ph3-an">{THU_DAY[i]}: {trangThai}</span>
            </li>
          )
        })}
      </ol>
    </The>
  )
}

/** Tên dạng ngắn cho khối (c): dạng con đang luyện thêm (máy chủ: `manhYeu.conVap`, rồi `dangVap`); không có ⇒ dạng cần vững của OMNI (tên chuẩn riêng). */
export function tenDangHomNay(pm: PhMoi, hoc2: Hoc2 | null): { tieuDe: string; ten: string[] } {
  const luyenThem = (pm.manhYeu?.conVap ?? []).filter((d) => d.tong > 0).map((d) => d.tenDang)
  const ds = luyenThem.length > 0 ? luyenThem : (pm.dangVap ?? []).filter((d) => d.tong > 0).map((d) => d.ten)
  if (ds.length > 0) return { tieuDe: 'Dạng con đang luyện thêm', ten: [...new Set(ds)] }
  return { tieuDe: 'Dạng cần vững', ten: hoc2?.omni?.dangCanVung ?? [] }
}

function DangVaCa({ pm, hoc2 }: { pm: PhMoi; hoc2: Hoc2 | null }) {
  const { tieuDe, ten } = tenDangHomNay(pm, hoc2)
  const canChua = hoc2?.omni?.canThayChua ?? 0
  const ca = pm.caGanNhat
  if (ten.length === 0 && canChua === 0 && !ca) return null
  const them = ten.length - DANG_TOI_DA
  // Không có tên dạng ⇒ không tiêu đề dạng: các dòng còn lại tự mang nhãn ("Cần thầy chữa: …", "Ca kiểm tra gần nhất: …").
  return (
    <section className="ph3-the ph3-o-hep" {...(ten.length > 0 ? { 'aria-labelledby': 'ph3-vap' } : { 'aria-label': [canChua > 0 ? 'Cần thầy chữa' : '', ca ? 'Ca kiểm tra gần nhất' : ''].filter(Boolean).join(' · ') })} data-vung="dang-luyen-them">
      {ten.length > 0 && (
        <>
          <div className="ph3-the__dau"><div><h2 id="ph3-vap">{tieuDe}</h2></div></div>
          <p className="ph3-ten-dang">{ten.slice(0, DANG_TOI_DA).join(' · ')}{them > 0 ? ` và ${them} dạng khác` : ''}</p>
        </>
      )}
      {canChua > 0 && <p className="ph3-ghi" data-vung="can-thay-chua">Cần thầy chữa: {canChua} chỗ</p>}
      {ca && <DongCa ca={ca} />}
    </section>
  )
}

function DongCa({ ca }: { ca: CaGanNhat }) {
  const ngay = ngayNganVn(ca.nopLuc)
  const tong = ca.ketQua?.tong ?? null
  return (
    <a className="ph3-dong-lk" href={lienKetCa(ca.maCa)} data-vung="ca-gan-nhat">
      {tong !== null ? (
        <span>Ca kiểm tra gần nhất: <b>{soVn(tong)} điểm</b>{ngay ? ` (${ngay})` : ''}</span>
      ) : (
        <span>Ca kiểm tra gần nhất{ngay ? ` (${ngay})` : ''}: {chuCongBoCa(ca)}</span>
      )}
      <BtPhai co={18} day={2.5} />
    </a>
  )
}

function LoiThayMoi({ loiThay, thuLai }: { loiThay: { ds: NhanXetCa[] | null; chuLoi: string }; thuLai: () => void }) {
  if (loiThay.chuLoi && !loiThay.ds) return <TheLoi chu={loiThay.chuLoi} thuLai={thuLai} />
  const moi = loiThay.ds?.[0]
  if (!moi) return null
  const ngay = moi.nopLuc || moi.capNhatLuc
  return (
    <The id="ph3-loi-thay" className="ph3-the--thay ph3-o-rong" vung="loi-thay-moi" tieuDe="Thầy Đỗ Đại Học nhắn" bieuTuong="ĐH" mau="thay">
      <p className="ph3-the__loi">{chuThay(moi.noiDung)}</p>
      <a className="ph3-dong-lk" href={lienKetCa(moi.maCa)}>
        <span>Sau {moi.tenCa}{ngay ? ` · ${ngayDayDuVn(ngay)}` : ''}</span>
        <BtPhai co={18} day={2.5} />
      </a>
    </The>
  )
}
