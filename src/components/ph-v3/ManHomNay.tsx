// Mục "Hôm nay" — TRUNG TU THẦY DUYỆT 09/10 (bản vẽ PH-HomNay). Thứ tự: khối chính (a/b câu · thanh · câu tình trạng · giờ học quen)
// → cảnh báo của thầy (nếu có) → Nhận xét của thầy (lời mới nhất + "Xem tất cả nhận xét của thầy ›") → Tuần này học đều (7 chấm)
// → danh sách cần chú ý (dạng con đang luyện thêm / dạng cần vững · Cần thầy chữa · ca gần nhất dẫn sang Ca kiểm tra) → "Gia đình hỗ trợ" một đoạn chữ nhỏ cuối màn.
// Nguồn đọc và quyền công bố giữ nguyên; khối vắng dữ liệu không dựng số minh hoạ; số câu hôm nay MỘT nguồn, nói MỘT lần.
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import type { CaGanNhat, PhMoi } from '../../lib/ph-moi/du-lieu'
import type { Hoc2, NhanXetCa } from '../../lib/ph-v3/du-lieu'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { chuHanNop, chuGuiLuc, tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import { gioVn, ngayDayDuVn, ngayNganVn, soVn, thuNgayVn } from '../../lib/ph-moi/dinh-dang'
import { chuCongBoCa } from '../ph-moi/nhan'
import { BtBut, BtChuY, BtChuong, BtKep, BtPhai, BtTich } from './BieuTuong'
import { DangTai, The, TheLoi } from './dung-chung'
import { chuThay, lienKetCa, tuanNay } from './tien-ich'

/** Tối đa số tên dạng ghi ở dòng dạng (còn lại gộp "và N dạng khác") — dòng ngắn trên điện thoại; danh sách đủ ở Tiến bộ. */
const DANG_TOI_DA = 3
const THU_NGAN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const
const THU_DAY = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'] as const
const TEN_TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'] as const

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
        v.trangThai === 'loi' ? <div className="ph3-luoi"><TheLoi chu={v.chuLoi} thuLai={v.thuLai} /></div> : <DangTai hinh="hom-nay" />
      ) : (
        <div className="ph3-luoi">
          <KhoiChinh pm={pm} hoc2={hoc2} />
          {canhBao.map((cb) => <CanhBao key={cb.id} cb={cb} nay={pm.serverNow ?? Date.now()} onDaXem={onDaXem} />)}
          <LoiThayMoi loiThay={loiThay} thuLai={thuLaiLoiThay} />
          <TuanNay pm={pm} />
          <CanChuY pm={pm} hoc2={hoc2} />
          <p className="ph3-gia-dinh ph3-o-hep" data-vung="gia-dinh"><b>Gia đình hỗ trợ:</b> dành cho con một khoảng yên tĩnh để học từng chặng ngắn; hỏi con điều đã hiểu và điều muốn thầy chữa.</p>
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
      <button type="button" className="ph3-nut-vien ph3-canh-bao__nut tt-nhan" onClick={() => onDaXem(cb.id)}>Đã xem cảnh báo</button>
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

/**
 * Dòng Hành trình dưới khối chính (chỉ khi máy chủ đã chốt tầng): tầng đang học; mức tối thiểu CHỈ ghi khi khác số câu đã ghi to
 * (trùng ⇒ bỏ, không nói một số hai lần); kế hoạch ít hơn mức tối thiểu ⇒ nói lý do bằng chữ đời thường (không chữ nội bộ).
 */
export function dongHanhTrinh(ht: Hoc2['hanhTrinh'], tong: number | null): string {
  if (!ht) return ''
  const tang = `Hành trình của con: tầng ${TEN_TANG[ht.tang - 1]}`
  if (tong === null || ht.toiThieu === tong) return `${tang}.`
  if (tong < ht.toiThieu) return `${tang} · mức tối thiểu ${ht.toiThieu} câu. Kế hoạch hôm nay ít hơn vì chưa đủ câu phù hợp hoặc có câu đang để dành cho ca kiểm tra.`
  return `${tang} · mức tối thiểu ${ht.toiThieu} câu.`
}

function KhoiChinh({ pm, hoc2 }: { pm: PhMoi; hoc2: Hoc2 | null }) {
  const so = soCauHomNay(pm, hoc2)
  const ngay = thuNgayVn(hoc2?.homNay && hoc2.serverNow ? hoc2.serverNow : pm.serverNow ?? Date.now())
  const tinhTrang = chuTinhTrang(so)
  const gioQuen = pm.nhipHoc?.gioThuongHoc ? `Giờ học quen của con: ${pm.nhipHoc.gioThuongHoc}.` : hoc2?.omni?.gioHoc ? `Giờ học con chọn: ${hoc2.omni.gioHoc}.` : ''
  const hanhTrinh = dongHanhTrinh(hoc2?.hanhTrinh, so.tong)
  const coSo = so.tong !== null || so.daLam > 0
  const ti = so.tong ? Math.max(0, Math.min(1, so.daLam / so.tong)) : null
  return (
    <section className="ph3-ah ph3-o-du" aria-labelledby="ph3-hn" data-vung="anh-hung">
      {coSo ? (
        <>
          <p id="ph3-hn" className="ph3-ah__nhan">{hoc2?.goi7?'Câu mới con đã gặp hôm nay':'Con đã làm hôm nay'} · {ngay}</p>
          <p className="ph3-ah__cau" data-vung="so-cau-hom-nay"><b>{so.daLam}</b><small>{so.tong !== null ? `/${so.tong} câu` : ' câu'}</small></p>
          {ti !== null && <span className="ph3-ah__thanh" aria-hidden="true"><span className="tt-thanh" style={{ width: `${ti * 100}%` }} /></span>}
        </>
      ) : (
        <>
          <span className="ph3-ah__nhan">{ngay}</span>
          <h2 id="ph3-hn">Hôm nay con chưa làm câu nào</h2>
        </>
      )}
      {hoc2?.goi7 ? <div className="ph3-ah__ghi">{hoc2.goi7.map(g=><p key={g.ten}>{g.nguonDayDu===false?`${g.ten}: đang chờ đủ nguồn các tờ; chưa xác nhận hoàn thành toàn bộ bài.`:`${g.ten}: đã gặp ${g.daGap}/${g.tong} câu gốc · còn ${g.con} câu · hạn ${g.han.slice(8,10)}/${g.han.slice(5,7)}.`}</p>)}<p>Gặp câu với hỗ trợ chưa có nghĩa con đã tự làm được hoặc thành thạo.</p></div> : tinhTrang && <p className="ph3-ah__phu">{tinhTrang}</p>}
      {(gioQuen || hanhTrinh) && (
        <div className="ph3-ah__ghi">
          {gioQuen && <p>{gioQuen}</p>}
          {hanhTrinh && <p data-vung="hanh-trinh">{hanhTrinh}</p>}
        </div>
      )}
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

/** Tên dạng ngắn cho dòng dạng: dạng con đang luyện thêm (máy chủ: `manhYeu.conVap`, rồi `dangVap`); không có ⇒ dạng cần vững của OMNI (tên chuẩn riêng). */
export function tenDangHomNay(pm: PhMoi, hoc2: Hoc2 | null): { tieuDe: string; ten: string[] } {
  const luyenThem = (pm.manhYeu?.conVap ?? []).filter((d) => d.tong > 0).map((d) => d.tenDang)
  const ds = luyenThem.length > 0 ? luyenThem : (pm.dangVap ?? []).filter((d) => d.tong > 0).map((d) => d.ten)
  if (ds.length > 0) return { tieuDe: 'Dạng con đang luyện thêm', ten: [...new Set(ds)] }
  return { tieuDe: 'Dạng cần vững', ten: hoc2?.omni?.dangCanVung ?? [] }
}

/** Danh sách cần chú ý: mỗi dòng một biểu tượng + nhãn nhỏ + chữ đậm; dòng ca gần nhất là liên kết sang báo cáo ca. Không có dòng nào ⇒ vắng. */
function CanChuY({ pm, hoc2 }: { pm: PhMoi; hoc2: Hoc2 | null }) {
  const { tieuDe, ten } = tenDangHomNay(pm, hoc2)
  const canChua = hoc2?.omni?.canThayChua ?? 0
  const ca = pm.caGanNhat
  if (ten.length === 0 && canChua === 0 && !ca) return null
  const them = ten.length - DANG_TOI_DA
  return (
    <section className="ph3-the ph3-the--ds ph3-o-rong" aria-label="Điều cần chú ý" data-vung="dang-luyen-them">
      <ul className="ph3-ds-dong">
        {ten.length > 0 && (
          <li className="ph3-dong">
            <span className="ph3-o-bt" data-mau="hp" aria-hidden="true"><BtChuY co={20} day={2.2} /></span>
            <div className="ph3-dong__chu">
              <h2 className="ph3-dong__nhan">{tieuDe}</h2>
              <b className="ph3-ten-dang">{ten.slice(0, DANG_TOI_DA).join(' · ')}{them > 0 ? ` và ${them} dạng khác` : ''}</b>
            </div>
          </li>
        )}
        {canChua > 0 && (
          <li className="ph3-dong">
            <span className="ph3-o-bt" data-mau="tim" aria-hidden="true"><BtBut co={20} /></span>
            <div className="ph3-dong__chu"><b data-vung="can-thay-chua">Cần thầy chữa: {canChua} chỗ</b></div>
          </li>
        )}
        {ca && <li><DongCa ca={ca} /></li>}
      </ul>
    </section>
  )
}

function DongCa({ ca }: { ca: CaGanNhat }) {
  const ngay = ngayNganVn(ca.nopLuc)
  const tong = ca.ketQua?.tong ?? null
  return (
    <a className="ph3-dong ph3-dong--lk tt-nhan" href={lienKetCa(ca.maCa)} data-vung="ca-gan-nhat">
      <span className="ph3-o-bt" data-mau="xd" aria-hidden="true"><BtKep co={20} /></span>
      <span className="ph3-dong__chu">
        <span className="ph3-dong__nhan">Ca kiểm tra gần nhất{ngay ? ` · ${ngay}` : ''}</span>
        {tong !== null ? <b>{soVn(tong)}/10 điểm</b> : <b>{chuCongBoCa(ca)}</b>}
      </span>
      <BtPhai co={18} day={2.4} />
    </a>
  )
}

/** Thẻ "Nhận xét của thầy": lời mới nhất (đã công bố) + liên kết sang màn con xem tất cả. Lỗi tải ⇒ lời thật + Thử lại ngay chỗ thẻ. */
function LoiThayMoi({ loiThay, thuLai }: { loiThay: { ds: NhanXetCa[] | null; chuLoi: string }; thuLai: () => void }) {
  if (loiThay.chuLoi && !loiThay.ds) return <TheLoi chu={loiThay.chuLoi} thuLai={thuLai} />
  const moi = loiThay.ds?.[0]
  if (!moi) return null
  const ngay = moi.nopLuc || moi.capNhatLuc
  return (
    <The id="ph3-loi-thay" className="ph3-the--thay ph3-o-rong" vung="loi-thay-moi" tieuDe="Nhận xét của thầy" phu={`Sau ${moi.tenCa}${ngay ? ` · ${ngayDayDuVn(ngay)}` : ''}`}>
      {loiThay.chuLoi && <div className="ph3-lam-moi-loi" role="status"><span>Nhận xét của thầy đang hiển thị bản đã tải. {loiThay.chuLoi}</span><button type="button" className="tt-nhan" onClick={thuLai}>Thử lại nhận xét</button></div>}
      <p className="ph3-the__loi">{chuThay(moi.noiDung)}</p>
      <a className="ph3-dong-lk tt-nhan" href="#loi-thay">
        <span>Xem tất cả nhận xét của thầy</span>
        <BtPhai co={18} day={2.5} />
      </a>
    </The>
  )
}
