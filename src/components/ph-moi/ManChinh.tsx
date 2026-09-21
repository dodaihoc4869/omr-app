// APP PHỤ HUYNH MỚI — MÀN CHÍNH (thầy chốt mẫu 21/09: docs/ban-ve-ph-moi-thu-ve-con-2109/ph-0-man-chinh.html; đề bài prompt-ph-moi-thu-ve-con-2109.md). Không menu, không tab:
// lời chào + tên con/lớp · thẻ lớn "Hôm nay của con" (cả thẻ MỘT đích chạm ⇒ mở bảng) · thẻ "Ca kiểm tra gần nhất của con" (⇒ bảng, khối Ca kiểm tra) · dải cảnh báo của thầy (thụ động)
// · MỘT nút "Giao thêm bài cho con" dính đáy + dòng lượt còn lại · dòng nhỏ "Đổi số báo danh" + số bản. NÓI THẬT THEO DỮ LIỆU: khối máy chủ không trả ⇒ ẩn; con số nào cũng có nhãn.
import { Check, ChevronRight, Clock, RefreshCw } from 'lucide-react'
import '../m3'
import './ph-moi.css'
import './ph-moi-them.css'
import TheCanhBaoThay from '../bang-nhiem-vu/TheCanhBaoThay'
import { chuBanApp } from '../../lib/cap-nhat-app'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import type { ViewGiaoThem } from '../../lib/use-giao-them'
import { chuCaiTen, gioVn, ngayDayDuVn, soVn, thuNgayVn } from '../../lib/ph-moi/dinh-dang'
import type { PhMoi } from '../../lib/ph-moi/du-lieu'
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import { chuCongBoCa } from './nhan'
import ThanhDay from './ThanhDay'

export interface ManChinhProps {
  v: ViewPhMoi
  tenCon: string
  lop: string
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

function VongDat({ dat }: { dat: boolean }) {
  const C = 2 * Math.PI * 52
  return (
    <div className="phm-vong" role="img" aria-label={dat ? 'Nhiệm vụ hôm nay: đã đạt' : 'Nhiệm vụ hôm nay: chưa đạt'}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="nen" cx="60" cy="60" r="52" />
        {dat && <circle className="dat" cx="60" cy="60" r="52" strokeDasharray={`${(C - 7).toFixed(1)} 7`} strokeDashoffset="-3.5" />}
      </svg>
      <div className="phm-vong__giua">{dat ? <Check className="phm-i" aria-hidden="true" /> : <Clock className="phm-i" aria-hidden="true" />}</div>
    </div>
  )
}

function TheHomNay({ pm, now, onMo }: { pm: PhMoi | null; now: number; onMo: () => void }) {
  const t = pm?.tongQuan ?? null
  const ngay = thuNgayVn(pm?.serverNow ?? now)
  const coHoc = !!t && (t.soCau ?? 0) > 0
  const gan = pm ? gioHocGanNhat(pm) : ''
  const pct = t && t.soCau && t.soCau > 0 && t.soDung !== null ? Math.round((t.soDung / t.soCau) * 100) : null
  const o = [
    t?.soCau != null ? { b: String(t.soCau), n: 'câu', n2: 'đã làm' } : null,
    pct !== null ? { b: String(pct), don: '%', n: 'câu', n2: 'đúng' } : null,
    t?.phutHoc != null ? { b: String(Math.round(t.phutHoc)), n: 'phút', n2: 'học' } : null,
    t?.chuoiNgayHoc != null && t.chuoiNgayHoc > 0 ? { b: String(t.chuoiNgayHoc), n: 'ngày', n2: 'học đều' } : null,
  ].filter((x): x is { b: string; don?: string; n: string; n2: string } => x !== null)
  const dat = t?.datNhiemVu ?? null
  const tieuDe = dat === true ? 'Con đã đạt nhiệm vụ hôm nay' : dat === false ? 'Con chưa đạt nhiệm vụ hôm nay' : coHoc ? 'Con đã học hôm nay' : 'Hôm nay con chưa học'
  const phu = coHoc ? (gan ? `Học gần nhất lúc ${gan}` : '') : 'Anh/chị có thể giao thêm bài cho con.'
  return (
    <button type="button" className="phm-hn" data-vung="hom-nay" onClick={onMo} aria-label={`Hôm nay của con: ${tieuDe}.${o.length ? ` ${o.map((x) => `${x.b}${x.don ? ' phần trăm' : ''} ${x.n} ${x.n2}`).join(', ')}.` : ''} Xem mọi thứ về con`}>
      <div className="phm-hn__dau">
        <h2>Hôm nay của con</h2>
        {ngay && <span>{ngay}</span>}
      </div>
      <div className="phm-hn__dat">
        {dat !== null && <VongDat dat={dat} />}
        <div>
          <h3>{tieuDe}</h3>
          {phu && <p className="phm-so">{phu}</p>}
        </div>
      </div>
      {coHoc && o.length > 0 && (
        <ul className="phm-hn__so" style={{ gridTemplateColumns: `repeat(${o.length}, minmax(0, 1fr))` }}>
          {o.map((x) => (
            <li key={x.n2}>
              <b>
                {x.b}
                {x.don && <small>{x.don}</small>}
              </b>
              <span>
                {x.n}
                <br />
                {x.n2}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="phm-hn__xem">
        <span>
          Xem mọi thứ về con<small>Từng câu, điểm mạnh, dạng còn vấp</small>
        </span>
        <ChevronRight className="phm-i phm-i--l" aria-hidden="true" />
      </div>
    </button>
  )
}

function TheCaNho({ pm, onMo }: { pm: PhMoi; onMo: () => void }) {
  const ca = pm.caGanNhat
  if (!ca) return null
  const nop = `Nộp lúc ${gioVn(ca.nopLuc)} · ${ngayDayDuVn(ca.nopLuc)}`
  const kq = ca.congBo.daCongBo ? ca.ketQua : null
  const tong = kq?.tong ?? null
  const doi = ca.truoc?.doi ?? null
  return (
    <button type="button" className="phm-the phm-ca-nho" data-vung="ca-gan-nhat" onClick={onMo} aria-label={`Ca kiểm tra gần nhất của con: ${ca.tenCa}. ${nop}. ${tong !== null ? `Điểm ${soVn(tong)} trên 10.` : chuCongBoCa(ca)} Xem trong bảng`}>
      <h2>Ca kiểm tra gần nhất của con</h2>
      <p className="phm-ca__ten">{ca.tenCa}</p>
      <p className="phm-ca__phu">{nop}</p>
      {tong !== null ? (
        <div className="phm-ca-nho__than">
          <p className="phm-ca__diem">
            <b>{soVn(tong)}</b>
            <span>/10 điểm</span>
          </p>
          {doi !== null && ca.truoc?.tong != null && (
            <p className="phm-ca-nho__hon">
              <b>{doi > 0 ? `Hơn ${soVn(doi)} điểm` : doi < 0 ? `Kém ${soVn(-doi)} điểm` : 'Bằng lần trước'}</b>
              <small>so với lần trước của chính con ({soVn(ca.truoc.tong)} điểm)</small>
            </p>
          )}
        </div>
      ) : (
        <p className="phm-ca__phu" data-vung="chua-cong-bo">
          Thầy chưa công bố điểm. {chuCongBoCa(ca)}
        </p>
      )}
    </button>
  )
}

export default function ManChinh({ v, tenCon, lop, now, canhBao, onCanhBaoDaXem, giaoThem, onMoBang, onDoiSbd }: ManChinhProps) {
  const pm = v.pm
  const ten = pm?.hoTen || tenCon
  return (
    <div className="m3 phm" data-vung="man-chinh-ph">
      <main className="phm-nha">
        <header className="phm-chao">
          <small>Thầy Đỗ Đại Học · dành cho phụ huynh</small>
          <h1>Chào anh/chị</h1>
          {ten && (
            <span className="phm-chao__anh" aria-hidden="true">
              {chuCaiTen(ten)}
            </span>
          )}
          <p>
            Con: <b>{ten || 'chưa rõ tên'}</b>
            {lop && (
              <>
                <br />
                Lớp {lop}
              </>
            )}
          </p>
        </header>

        {/* Dải cảnh báo của thầy: THỤ ĐỘNG (chỉ đọc + "Đã xem"); không có ⇒ không dựng. */}
        <TheCanhBaoThay vaiTro="phuhuynh" now={now} canhBao={canhBao} coTheLam={() => false} onLam={() => {}} onDaXem={onCanhBaoDaXem} />

        {v.trangThai === 'tai' && (
          <div className="phm-xuong" role="status" aria-label="Đang tải dữ liệu của con" data-vung="dang-tai">
            <i />
            <i />
            <span className="phm-sr">Đang tải dữ liệu của con…</span>
          </div>
        )}
        {v.trangThai === 'loi' && (
          <div className="phm-loi" role="alert" data-vung="loi-tai">
            <p>{v.chuLoi}</p>
            <button type="button" className="phm-nut phm-nut--chu" onClick={v.thuLai} data-vung="thu-lai">
              <RefreshCw className="phm-i phm-i--s" aria-hidden="true" />
              Thử lại
            </button>
          </div>
        )}
        {v.trangThai === 'ok' && pm && (
          <>
            <TheHomNay pm={pm} now={now} onMo={() => onMoBang()} />
            <TheCaNho pm={pm} onMo={() => onMoBang('ca-kiem-tra')} />
          </>
        )}

        <footer className="phm-chan" data-vung="chan-ph">
          <button type="button" className="phm-chan__nut" onClick={onDoiSbd}>
            Đổi số báo danh
          </button>
          <span>{chuBanApp()}</span>
        </footer>
      </main>

      <ThanhDay giaoThem={giaoThem} />
    </div>
  )
}
