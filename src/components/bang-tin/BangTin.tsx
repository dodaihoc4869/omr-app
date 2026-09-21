// BẢNG TIN CỦA THẦY — bản 3, BÁM BẢN VẼ THẦY ĐÃ CHỐT 21/09 (docs/ban-ve-bang-tin-v3-2109/). Thầy chỉ ĐỌC: không nút hành động.
//   ≥ 880 px : một khung nhìn KHÔNG cuộn — đầu trang · 4 số lớn · [Bài tập về nhà | Tiến bộ hôm nay] · [4 ô dưới]; danh sách dài ⇒ top-N + "+N nữa" mở tấm bên.
//   < 880 px : 6 trang lướt ngang (scroll-snap), mỗi trang vừa một màn, chấm chỉ trang + "Lướt sang: …".
// Thành phần chỉ NHẬN dữ liệu (`du`) — việc gọi `/gv/bang-tin`, làm mới 60 giây và rơi về lệnh cũ nằm ở HomNayScreen.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, Search } from 'lucide-react'
import { chuMocDau, type BangTin, type EmCanDeY } from '../../lib/bang-tin-thay'
import { gioPhutVN } from '../../lib/em-toan-canh'
import type { EmTraCuu } from '../../lib/hom-nay-v2'
import OTraCuu from '../hom-nay/OTraCuu'
import TamBen from './TamBen'
import { useMedia, useTrangLuot } from './hooks'
import { BonSoLon, ChuGiaiBaiTap, HangBaiTap, HangDang, HangEm, HangViec, KhoiBaiTap, dongThuThach, KhoiBoNao, KhoiCanDeY, KhoiDangVap, KhoiMayDaLam, KhoiTienBo, TEN_O_MAY, viecCuaMay, type DungNhip } from './cac-khoi'
import '../../styles/hom-nay-v2.css'
import '../../styles/bang-tin-v3.css'

export interface BangTinProps {
  du: BangTin
  nayMs: number
  dsTraCuu: EmTraCuu[]
  onMoEm: (sbd: string) => void
  onMoCa: (ma: string) => void
  /** Số "Bài tập về nhà đúng nhịp" (lệnh cũ — chưa có trong `/gv/bang-tin`). */
  dungNhip?: DungNhip | null
  /** Danh sách ĐỦ em cần để ý cho tấm bên (bảng tin chỉ mang 5 em đầu + số còn lại). Không có / lỗi ⇒ tấm bên nói thật. */
  taiTatCaCanDeY?: () => Promise<EmCanDeY[] | null>
}

type Tam = null | 'bai' | 'em' | 'dang' | 'may' | 'tim'

function ChuCapNhat({ bt, ngan }: { bt: BangTin; ngan?: boolean }) {
  const gio = bt.capNhatLuc ? gioPhutVN(bt.capNhatLuc) : ''
  if (!gio) return null
  return <span className="bt3-cap-nhat">{ngan ? `Cập nhật ${gio}` : `Cập nhật ${gio} · tự làm mới mỗi phút`}</span>
}

function TamEmCanDeY({ bt, onMoEm, onDong, taiTatCa }: { bt: BangTin; onMoEm: (sbd: string) => void; onDong: () => void; taiTatCa?: () => Promise<EmCanDeY[] | null> }) {
  const [ds, setDs] = useState<EmCanDeY[]>(bt.canDeY.ds)
  const [dangTai, setDangTai] = useState(Boolean(taiTatCa))
  useEffect(() => {
    if (!taiTatCa) return
    let con = true
    void taiTatCa().then((d) => {
      if (!con) return
      if (d && d.length > 0) setDs(d)
      setDangTai(false)
    })
    return () => {
      con = false
    }
  }, [taiTatCa])
  const thieu = bt.canDeY.ds.length + bt.canDeY.conLai - ds.length
  return (
    <TamBen tieuDe="Em cần thầy để ý" phu="Bấm vào một em để xem toàn cảnh." onDong={onDong}>
      {dangTai && <p className="bt3-trong">Đang tải danh sách đủ…</p>}
      <ul className="bt3-ds bt3-ds--tam">
        {ds.map((e) => (
          <HangEm
            key={e.sbd}
            e={e}
            onMoEm={(s) => {
              onDong()
              onMoEm(s)
            }}
          />
        ))}
      </ul>
      {!dangTai && thieu > 0 && <p className="bt3-trong">Còn {thieu} em nữa chưa nêu tên ở đây — xem đủ ở màn Học sinh.</p>}
    </TamBen>
  )
}

function TamKhac({ tam, bt, onDong }: { tam: 'bai' | 'dang' | 'may'; bt: BangTin; onDong: () => void }) {
  if (tam === 'bai')
    return (
      <TamBen tieuDe="Bài tập về nhà đang chạy" phu={`${bt.baiTap.length} bài giao từ mốc của bảng tin`} onDong={onDong}>
        <ChuGiaiBaiTap />
        <ul className="bt3-ds bt3-ds--tam">{bt.baiTap.map((b) => <HangBaiTap key={b.ma} b={b} />)}</ul>
      </TamBen>
    )
  if (tam === 'dang')
    return (
      <TamBen tieuDe="Dạng cả lớp đang vấp" phu="số em vấp / số em đã gặp dạng · 3 ngày gần nhất" onDong={onDong}>
        <ul className="bt3-ds bt3-ds--tam">{bt.dangVap.map((d) => <HangDang key={d.ma} d={d} />)}</ul>
      </TamBen>
    )
  return (
    <TamBen tieuDe={TEN_O_MAY} onDong={onDong}>
      <ul className="bt3-ds bt3-ds--tam">{viecCuaMay(bt).map((v) => <HangViec key={v.loai} v={v} />)}</ul>
    </TamBen>
  )
}

export default function BangTinV3(p: BangTinProps) {
  const { du: bt, nayMs, onMoEm } = p
  const dienThoai = useMedia('(max-width: 879px)')
  const [tam, setTam] = useState<Tam>(null)
  const moTam = (t: Exclude<Tam, null>) => () => setTam(t)
  const dong = useMemo(() => () => setTam(null), [])
  const moc = chuMocDau(bt, nayMs)

  const khoi = {
    so: <BonSoLon bt={bt} nayMs={nayMs} dungNhip={p.dungNhip} />,
    bai: <KhoiBaiTap bt={bt} nayMs={nayMs} onMoTatCa={moTam('bai')} />,
    tien: <KhoiTienBo bt={bt} nayMs={nayMs} onMoEm={onMoEm} />,
    em: <KhoiCanDeY bt={bt} nayMs={nayMs} onMoEm={onMoEm} onMoTatCa={moTam('em')} />,
    dang: <KhoiDangVap bt={bt} nayMs={nayMs} onMoTatCa={moTam('dang')} />,
    bn: <KhoiBoNao bn={bt.boNao} lyDo={bt.lyDoThieu.boNao} thuThach={dongThuThach(bt)} />,
    may: <KhoiMayDaLam bt={bt} nayMs={nayMs} onMoTatCa={moTam('may')} />,
  }

  return (
    <>
      <div className={`gv-page bt3${dienThoai ? ' bt3--dt' : ''}`} data-khung="bang-tin-v3">
        {dienThoai ? (
          <>
            <header className="bt3-dau">
              <div className="bt3-dau-hang">
                <h1 className="bt3-h1">Bảng tin</h1>
                <button type="button" className="bt3-tim-nut" aria-label="Tìm học sinh" onClick={moTam('tim')}>
                  <Search size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="bt3-dau-hang">
                <span className="bt3-chip">{moc}</span>
                <ChuCapNhat bt={bt} ngan />
              </div>
            </header>
            <LuotNgang
              trang={[
                {
                  ten: 'Nhịp hôm nay',
                  nd: (
                    <>
                      {khoi.so}
                      {khoi.may}
                    </>
                  ),
                },
                {
                  ten: 'Bài tập về nhà đang chạy',
                  nd: (
                    <>
                      <ChuGiaiBaiTap />
                      {khoi.bai}
                    </>
                  ),
                },
                { ten: 'Tiến bộ hôm nay', nd: khoi.tien },
                { ten: 'Em cần thầy để ý', nd: khoi.em },
                { ten: 'Dạng cả lớp đang vấp', nd: khoi.dang },
                { ten: 'Bộ não A.I đêm qua', nd: khoi.bn },
              ]}
              tenNgan={['Nhịp hôm nay', 'Bài tập về nhà', 'Tiến bộ hôm nay', 'Em cần thầy để ý', 'Dạng đang vấp', 'Bộ não A.I']}
            />
          </>
        ) : (
          <>
            <header className="bt3-dau">
              <h1 className="bt3-h1">Bảng tin</h1>
              <span className="bt3-chip">{moc}</span>
              <ChuCapNhat bt={bt} />
              <span className="bt3-day" />
              <OTraCuu ds={p.dsTraCuu} onMoEm={onMoEm} onMoCa={p.onMoCa} placeholder="Tìm học sinh theo tên hoặc số báo danh" />
            </header>
            {khoi.so}
            <div className="bt3-giua">
              {khoi.bai}
              {khoi.tien}
            </div>
            <div className="bt3-duoi">
              {khoi.em}
              {khoi.dang}
              {khoi.bn}
              {khoi.may}
            </div>
          </>
        )}
      </div>
      {tam === 'em' && <TamEmCanDeY bt={bt} onMoEm={onMoEm} onDong={dong} taiTatCa={p.taiTatCaCanDeY} />}
      {(tam === 'bai' || tam === 'dang' || tam === 'may') && <TamKhac tam={tam} bt={bt} onDong={dong} />}
      {tam === 'tim' && (
        <TamBen tieuDe="Tìm học sinh" phu="Gõ tên (không dấu cũng ra) hoặc số báo danh." onDong={dong}>
          <OTraCuu
            ds={p.dsTraCuu}
            autoFocus
            onMoEm={(s) => {
              dong()
              onMoEm(s)
            }}
            onMoCa={(m) => {
              dong()
              p.onMoCa(m)
            }}
          />
        </TamBen>
      )}
    </>
  )
}

/** Điện thoại: mỗi trang vừa MỘT màn (không cuộn dọc trong trang); nhãn "Trang k trong 6 · …" ở đầu trang; chấm chỉ trang + nút "Lướt sang: …" (48 px) ở đáy. */
function LuotNgang({ trang, tenNgan }: { trang: { ten: string; nd: ReactNode }[]; tenNgan: string[] }) {
  const { ref, trang: i, chuyen } = useTrangLuot(trang.length)
  const cuoi = i === trang.length - 1
  return (
    <>
      <div className="bt3-luot" ref={ref} role="region" aria-label="Các trang của bảng tin — lướt ngang" tabIndex={0}>
        {trang.map((t, k) => (
          <div key={t.ten} className="bt3-trang" data-trang={k + 1}>
            <p className="bt3-trang-nhan">
              Trang {k + 1} trong {trang.length} · {t.ten}
            </p>
            {t.nd}
          </div>
        ))}
      </div>
      <nav className="bt3-luot-nav" aria-label="Các trang của bảng tin">
        <span className="bt3-cham" aria-hidden="true">
          {trang.map((t, k) => (
            <span key={t.ten} className={k === i ? 'bt3-cham-nay' : undefined} />
          ))}
        </span>
        <button type="button" className="bt3-luot-sang" onClick={() => chuyen(cuoi ? 0 : i + 1)}>
          {cuoi ? `Về đầu: ${tenNgan[0]}` : `Lướt sang: ${tenNgan[i + 1]}`}
        </button>
      </nav>
    </>
  )
}

// ─────────────────────────────── CHỜ · LỖI ───────────────────────────────

/** Khung xương lúc chờ máy chủ: cùng lưới với bảng tin, không màn trắng (C10). */
export function BangTinXuong() {
  const dienThoai = useMedia('(max-width: 879px)')
  return (
    <div className={`gv-page bt3 bt3-xuong${dienThoai ? ' bt3--dt' : ''}`} data-khung="bang-tin-cho" role="status" aria-label="Đang tải bảng tin">
      <div className="bt3-dau">
        <h1 className="bt3-h1">Bảng tin</h1>
        <span className="bt3-xuong-o bt3-xuong-o--chip" />
      </div>
      <div className="bt3-hang-so">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="bt3-so bt3-xuong-o" />
        ))}
      </div>
      <div className="bt3-giua">
        <div className="bt3-o bt3-xuong-o" />
        <div className="bt3-o bt3-xuong-o" />
      </div>
      <div className="bt3-duoi">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="bt3-o bt3-xuong-o" />
        ))}
      </div>
    </div>
  )
}

/** Bảng tin không đọc được: nói chuyện gì xảy ra + việc máy sẽ làm tiếp (thầy chỉ đọc — không nút). */
export function BangTinLoi({ chu }: { chu: string }) {
  return (
    <div className="gv-page bt3 bt3-loi" data-khung="bang-tin-loi">
      <div className="bt3-loi-the" role="alert">
        <AlertCircle size={36} aria-hidden="true" />
        <h1>Chưa đọc được bảng tin</h1>
        <p>{chu}</p>
        <p className="bt3-loi-phu">Bảng tin sẽ tự thử lại sau ít phút. Số liệu của học sinh vẫn được máy chủ giữ nguyên.</p>
      </div>
    </div>
  )
}
