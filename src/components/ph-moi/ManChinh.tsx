// APP PHỤ HUYNH — MÀN CHÍNH KIỂU APPLE, PHƯƠNG ÁN B "Widget" (thầy chốt 21/09 15:49; mẫu docs/ban-ve-ph-apple-2109/ph-b-man-chinh.html; đề bài cuối prompt-ph-moi-thu-ve-con-2109.md). Không menu, không tab:
// tiêu đề lớn "Chào anh/chị" + tên con · lớp + nút tròn chữ cái (mở menu nổi có ĐÚNG MỘT mục "Đổi số báo danh") · dải cảnh báo của thầy (thụ động) · widget lớn "Hôm nay của con" · hai widget vuông
// "Ca kiểm tra gần nhất" (LUÔN hiện, có trạng thái trống) + "Học đều" · thẻ rời "Xem mọi thứ về con ›" (MỘT đích chạm ⇒ bảng) · thanh nền mờ dính đáy với MỘT nút "Giao thêm bài cho con".
// NÓI THẬT THEO DỮ LIỆU: khối/số máy chủ không trả ⇒ ẨN ô (không bịa số 0); "N/M việc" chỉ vẽ khi máy chủ trả homNay.tongQuan.viecXong/viecTong; con số nào cũng có nhãn.
import { useEffect, useRef, useState } from 'react'
import '../m3'
import './ph-apple.css'
import TheCanhBaoThay from '../bang-nhiem-vu/TheCanhBaoThay'
import { chuBanApp } from '../../lib/cap-nhat-app'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import type { ViewGiaoThem } from '../../lib/use-giao-them'
import { chuCaiTen, gioVn, ngayChuoiNgan, soVn, thuNgayVn } from '../../lib/ph-moi/dinh-dang'
import { mauSoTiLeDung, type PhMoi } from '../../lib/ph-moi/du-lieu'
import { ChuoiMuoiBonNgay } from '../../lib/ph-moi/nhip-ngay'
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import { chuCongBoCa } from './nhan'
import { BtChamThan, BtDoi, BtDongHo, BtMui, BtNguoi, BtTich, BtXoay } from './BieuTuongAp'
import ThanhDayAp from './ThanhDayAp'

export interface ManChinhProps {
  v: ViewPhMoi
  tenCon: string
  lop: string
  /** Số báo danh con đang xem (chỉ để nói rõ trong menu tài khoản). */
  sbd?: string
  now: number
  canhBao: CanhBaoThay[]
  onCanhBaoDaXem: (cb: CanhBaoThay) => void
  giaoThem: ViewGiaoThem
  onMoBang: (muc?: 'ca-kiem-tra') => void
  onDoiSbd: () => void
}

/** Giờ học gần nhất hôm nay = mốc cuối của dòng thời gian (bắt đầu + số phút). Không có dòng thời gian ⇒ ''. */
export function gioHocGanNhat(pm: PhMoi): string {
  const m = pm.dongThoiGian?.[pm.dongThoiGian.length - 1]
  return m ? gioVn(Date.parse(m.batDau) + m.phut * 60_000) : ''
}

/** Vòng tiến độ kiểu Activity ring. `viec` có ⇒ cung theo N/M và chữ "N/M việc đã xong"; không có ⇒ vòng chỉ nói trạng thái đạt (đầy + dấu tích) / chưa đạt (rỗng + kim đồng hồ). */
function Vong({ dat, viec }: { dat: boolean | null; viec: { xong: number; tong: number } | null }) {
  const C = 2 * Math.PI * 43.5
  const xong = viec ? viec.xong >= viec.tong : dat === true
  const tiLe = viec ? viec.xong / viec.tong : dat === true ? 1 : 0
  const nhan = viec ? `Nhiệm vụ hôm nay: xong ${viec.xong} trong ${viec.tong} việc` : xong ? 'Nhiệm vụ hôm nay: đã đạt' : 'Nhiệm vụ hôm nay: chưa đạt'
  return (
    <div className="phm-ap-vong" data-dat={xong ? '' : undefined} role="img" aria-label={nhan}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="phm-ap-vong__nen" cx="50" cy="50" r="43.5" />
        {tiLe > 0 && <circle className="phm-ap-vong__tien" cx="50" cy="50" r="43.5" strokeDasharray={`${(C * tiLe).toFixed(1)} ${C.toFixed(1)}`} />}
      </svg>
      <div className="phm-ap-vong__giua">
        {viec ? (
          <>
            {viec.xong}/{viec.tong}
            <small>việc đã xong</small>
          </>
        ) : xong ? (
          <BtTich />
        ) : (
          <BtDongHo />
        )}
      </div>
    </div>
  )
}

function WidgetHomNay({ pm, now }: { pm: PhMoi; now: number }) {
  const t = pm.tongQuan
  const ngay = thuNgayVn(pm.serverNow ?? now)
  const dat = t?.datNhiemVu ?? null
  const coHoc = (t?.soCau ?? 0) > 0 || dat === true
  const gan = gioHocGanNhat(pm)
  // Tỉ lệ đúng trên câu ĐÃ CÓ KẾT QUẢ (không che) — Boss 21/09; máy chủ cũ chưa gửi mẫu số ⇒ soCau như trước.
  const mau = t ? mauSoTiLeDung(t) : null
  const pct = t && mau !== null && mau > 0 && t.soDung !== null ? Math.round((Math.min(t.soDung, mau) / mau) * 100) : null
  const viec = t && t.viecTong !== null && t.viecXong !== null ? { xong: t.viecXong, tong: t.viecTong } : null
  const ba = [
    t?.soCau != null ? { b: String(t.soCau), n: 'câu đã làm' } : null,
    pct !== null ? { b: String(pct), don: '%', n: 'câu đúng' } : null,
    t?.phutHoc != null ? { b: String(Math.round(t.phutHoc)), n: 'phút học' } : null,
  ].filter((x): x is { b: string; don?: string; n: string } => x !== null)
  const tieuDe = dat === true ? 'Con đã đạt nhiệm vụ hôm nay' : dat === false ? 'Con chưa đạt nhiệm vụ hôm nay' : 'Con đã học hôm nay'
  const coVong = viec !== null || dat !== null
  return (
    <section className="phm-ap-the phm-ap-w phm-ap-w-lon" data-vung="hom-nay" aria-labelledby="phm-ap-h-hn">
      <div className="phm-ap-w__dau">
        <h2 className="phm-ap-w__ten phm-ap-w__ten--nhan" id="phm-ap-h-hn">
          Hôm nay của con
        </h2>
        {ngay && <span className="phm-ap-w__ngay">{ngay}</span>}
      </div>
      <div className="phm-ap-w-lon__than">
        {coVong && <Vong dat={dat} viec={viec} />}
        {coHoc && ba.length > 0 ? (
          <ul className="phm-ap-ba" aria-label="Con số hôm nay">
            {ba.map((x) => (
              <li key={x.n}>
                <b>
                  {x.b}
                  {x.don && <small>{x.don}</small>}
                </b>
                <span>{x.n}</span>
              </li>
            ))}
          </ul>
        ) : (
          !coHoc && (
            <p className="phm-ap-chua" data-vung="chua-hoc">
              <b>Hôm nay con chưa học</b>
              <small>Anh/chị có thể giao thêm bài cho con.</small>
            </p>
          )
        )}
      </div>
      {coHoc && (
        <div className="phm-ap-w-lon__dat" data-dat={dat === false ? 'chua' : undefined} data-vung="trang-thai-nhiem-vu">
          {dat === false ? <BtDongHo /> : <BtTich />}
          <p>
            {tieuDe}
            {gan && <small>Học gần nhất lúc {gan}</small>}
          </p>
        </div>
      )}
    </section>
  )
}

function WidgetCa({ pm }: { pm: PhMoi }) {
  const ca = pm.caGanNhat
  // Ô này LUÔN hiện (thầy 21/09: "chưa có điểm gần nhất" không được biến mất). Máy chủ không gửi ca (con chưa có ca nào, hoặc mọi ca đã xoá) ⇒ trạng thái trống nói thật, KHÔNG số bịa.
  if (!ca)
    return (
      <section className="phm-ap-the phm-ap-w phm-ap-w-nho" data-vung="ca-gan-nhat" data-trong="" aria-labelledby="phm-ap-h-ca">
        <h2 className="phm-ap-w__ten" id="phm-ap-h-ca">
          Ca kiểm tra gần nhất
        </h2>
        <p className="phm-ap-w-nho__so phm-ap-w-nho__so--rong" role="img" aria-label="Chưa có ca kiểm tra nào">
          —
        </p>
        <p className="phm-ap-w-nho__phu">
          <b>Chưa có ca kiểm tra nào</b>
          Điểm sẽ hiện ở đây sau khi thầy công bố
        </p>
      </section>
    )
  const ngay = thuNgayVn(ca.nopLuc)
  const tong = ca.congBo.daCongBo ? (ca.ketQua?.tong ?? null) : null
  const doi = ca.truoc?.tong != null ? ca.truoc.doi : null
  const soSanh = doi === null ? '' : doi > 0 ? `Hơn ${soVn(doi)} điểm so với lần trước của chính con` : doi < 0 ? `Kém ${soVn(-doi)} điểm so với lần trước của chính con` : 'Bằng lần trước của chính con'
  return (
    <section className="phm-ap-the phm-ap-w phm-ap-w-nho" data-vung="ca-gan-nhat" aria-labelledby="phm-ap-h-ca">
      <h2 className="phm-ap-w__ten" id="phm-ap-h-ca">
        Ca kiểm tra gần nhất
      </h2>
      <span className="phm-ap-sr">{ca.tenCa}</span>
      {tong !== null ? (
        <p className="phm-ap-w-nho__so" role="img" aria-label={`${soVn(tong)} trên 10 điểm`}>
          {soVn(tong)}
          <small>/10 điểm</small>
        </p>
      ) : (
        <p className="phm-ap-w-nho__so phm-ap-w-nho__so--rong" role="img" aria-label="Chưa có điểm">
          —
        </p>
      )}
      <p className="phm-ap-w-nho__phu">
        {ngay && <b>{ngay}</b>}
        {tong !== null ? (
          soSanh
        ) : (
          <>
            <span data-vung="chua-cong-bo">Thầy chưa công bố điểm</span>
            <span className="phm-ap-sr"> {chuCongBoCa(ca)}</span>
          </>
        )}
      </p>
    </section>
  )
}

/** "Học đều": chuỗi ngày liên tục do máy chủ tính (không tự tính lại) + 7 ngày gần nhất của nhịp học. Cả hai đều vắng ⇒ null ⇒ không dựng ô. */
function duLieuHocDeu(pm: PhMoi): { chuoi: number | null; bay: { ngay: string; soCau: number | null }[] } | null {
  const chuoi = pm.tongQuan?.chuoiNgayHoc ?? null
  const bay = ChuoiMuoiBonNgay(pm).slice(7)
  return chuoi === null && bay.length === 0 ? null : { chuoi, bay }
}

function WidgetHocDeu({ d }: { d: NonNullable<ReturnType<typeof duLieuHocDeu>> }) {
  const { chuoi, bay } = d
  const hoc = bay.filter((x) => x.soCau !== null && x.soCau > 0).length
  return (
    <section className="phm-ap-the phm-ap-w phm-ap-w-nho" data-vung="hoc-deu" aria-labelledby="phm-ap-h-deu">
      <h2 className="phm-ap-w__ten" id="phm-ap-h-deu">
        Học đều
      </h2>
      <p className="phm-ap-w-nho__so">
        {chuoi !== null ? chuoi : hoc}
        <small>{chuoi !== null ? 'ngày liên tục' : '/7 ngày gần đây'}</small>
      </p>
      {bay.length === 7 && (
        <>
          <div className="phm-ap-7" role="img" aria-label={`7 ngày gần đây: con học ${hoc} ngày, nghỉ ${7 - hoc} ngày`}>
            {bay.map((x) => (
              <i key={x.ngay} data-nghi={x.soCau === null || x.soCau === 0 ? '' : undefined} />
            ))}
          </div>
          <p className="phm-ap-w-nho__phu">
            <b>Từ {ngayChuoiNgan(bay[0]!.ngay)} đến hôm nay</b>7 ngày gần đây: học {hoc} ngày, nghỉ {7 - hoc} ngày
          </p>
        </>
      )}
    </section>
  )
}

/** Nút tròn chữ cái đầu tên con (góc phải tiêu đề) ⇒ menu nổi. ĐÚNG MỘT mục "Đổi số báo danh"; dưới là chữ xám nhỏ nói đang xem số báo danh nào + số bản app (để hỗ trợ khi cần). */
function TaiKhoan({ ten, sbd, onDoiSbd }: { ten: string; sbd: string; onDoiSbd: () => void }) {
  const [mo, setMo] = useState(false)
  const nut = useRef<HTMLButtonElement>(null)
  const muc = useRef<HTMLButtonElement>(null)
  const daMo = useRef(false)
  useEffect(() => {
    if (!mo) {
      if (daMo.current) nut.current?.focus()
      return
    }
    daMo.current = true
    muc.current?.focus()
    const dong = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMo(false)
    }
    window.addEventListener('keydown', dong)
    return () => window.removeEventListener('keydown', dong)
  }, [mo])
  const chu = chuCaiTen(ten)
  return (
    <div className="phm-ap-tk">
      <button ref={nut} className="phm-ap-anh" type="button" aria-haspopup="menu" aria-expanded={mo} aria-controls="phm-ap-menu-tk" aria-label="Tài khoản: mở để đổi số báo danh" onClick={() => setMo((x) => !x)}>
        {chu ? <span>{chu}</span> : <BtNguoi />}
      </button>
      {mo && (
        <>
          <button className="phm-ap-phu" type="button" tabIndex={-1} aria-label="Đóng menu" onClick={() => setMo(false)} />
          <div className="phm-ap-menu" id="phm-ap-menu-tk" role="menu" aria-label="Tài khoản">
            <button
              ref={muc}
              className="phm-ap-menu__muc"
              type="button"
              role="menuitem"
              onClick={() => {
                setMo(false)
                onDoiSbd()
              }}
            >
              <span>Đổi số báo danh</span>
              <BtDoi />
            </button>
            {sbd && <p className="phm-ap-menu__chu">Đang xem: số báo danh {sbd} của con</p>}
            <p className="phm-ap-menu__chu phm-ap-menu__ban" data-vung="ban-app">
              {chuBanApp()}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default function ManChinh({ v, tenCon, lop, sbd = '', now, canhBao, onCanhBaoDaXem, giaoThem, onMoBang, onDoiSbd }: ManChinhProps) {
  const pm = v.pm
  const ten = pm?.hoTen || tenCon
  const ok = v.trangThai === 'ok' && pm ? pm : null
  const deu = ok ? duLieuHocDeu(ok) : null
  return (
    <div className="m3 phm-ap" data-vung="man-chinh-ph">
      <main className="phm-ap-man phm-ap-man--b">
        <header className="phm-ap-dau">
          <div>
            <p className="phm-ap-dau__nho">Thầy Đỗ Đại Học</p>
            <h1>Chào anh/chị</h1>
          </div>
          <TaiKhoan ten={ten} sbd={sbd} onDoiSbd={onDoiSbd} />
          {(ten || lop) && (
            <p className="phm-ap-dau__con">
              {ten && <b>{ten}</b>}
              {ten && lop && ' · '}
              {lop && `Lớp ${lop}`}
            </p>
          )}
        </header>

        {/* Dải cảnh báo của thầy: THỤ ĐỘNG (chỉ đọc + "Đã xem"); không có ⇒ không dựng. */}
        <TheCanhBaoThay vaiTro="phuhuynh" now={now} canhBao={canhBao} coTheLam={() => false} onLam={() => {}} onDaXem={onCanhBaoDaXem} />

        {v.trangThai === 'tai' && (
          <div className="phm-ap-xuong" role="status" aria-label="Đang tải dữ liệu của con" data-vung="dang-tai">
            <i />
            <i />
            <span className="phm-ap-sr">Đang tải dữ liệu của con…</span>
          </div>
        )}
        {v.trangThai === 'loi' && (
          <div className="phm-ap-loi" role="alert" data-vung="loi-tai">
            <BtChamThan />
            <p>{v.chuLoi}</p>
            <button type="button" className="phm-ap-loi__nut" onClick={v.thuLai} data-vung="thu-lai">
              <BtXoay />
              Thử lại
            </button>
          </div>
        )}
        {ok && (
          <>
            <WidgetHomNay pm={ok} now={now} />
            <div className="phm-ap-hai" data-mot={deu ? undefined : ''}>
              <WidgetCa pm={ok} />
              {deu && <WidgetHocDeu d={deu} />}
            </div>
            <button type="button" className="phm-ap-hang phm-ap-the phm-ap-hang--the" data-vung="xem-tat-ca" onClick={() => onMoBang()}>
              <span>
                Xem mọi thứ về con<small>Từng câu, điểm mạnh, dạng còn vấp</small>
              </span>
              <BtMui />
            </button>
          </>
        )}
      </main>

      <ThanhDayAp giaoThem={giaoThem} />
    </div>
  )
}
