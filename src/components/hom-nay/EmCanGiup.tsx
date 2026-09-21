import { useEffect, useMemo, useState } from 'react'
import { Info, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { cauLyDo, hanhDongCua, NHAN_HANH_DONG, type HomNay, type HomNayEm } from '../../lib/hom-nay-api'
import { layCanGiup, lyDoCanGiup, TEN_BAC_DANG, TEN_XU_HUONG, type CanGiup, type DangCanGiup, type EmCanGiup as EmCG } from '../../lib/hom-nay-v2'
import type { KetQuaLenh } from '../../lib/goi-lenh-thay'
import '../../styles/hom-nay-v2.css'

const SO_EM_GON = 4

const chuCai = (hoTen: string) => hoTen.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'
const mauChu = (lyDo: EmCG['lyDo']) => (lyDo === 'tre_nhip' ? 'chua_mo' : lyDo === 'tut_bac' ? 'do' : 'xanh')

/** Dấu xu hướng 7 ngày — nói SỰ VIỆC ("đang giảm"/"đang lên"/"giữ nguyên"), không phán xét em. */
function ChipXuHuong({ x }: { x: DangCanGiup['xuHuong'] }) {
  if (!x) return null
  const Icon = x === 'giam' ? TrendingDown : x === 'tang' ? TrendingUp : Minus
  return (
    <span className={`hn2-chip hn2-chip--nho hn2-chip--${x === 'giam' ? 'loi' : x === 'tang' ? 'tot' : 'trung'}`}>
      <Icon size={14} aria-hidden="true" />
      {TEN_XU_HUONG[x]} 7 ngày
    </span>
  )
}

function DongDang({ d }: { d: DangCanGiup }) {
  return (
    <div className="hn2-dang">
      <span className="hn2-dang-ten">{d.ten}</span>
      {d.sai != null && (
        <span className="hn2-chip hn2-chip--nho hn2-chip--loi">
          sai {d.sai}
          {d.gap != null ? `/${d.gap}` : ''} câu
        </span>
      )}
      {d.bac && <span className="hn2-chip hn2-chip--nho">bậc {TEN_BAC_DANG[d.bac]}</span>}
      <ChipXuHuong x={d.xuHuong} />
    </div>
  )
}

/** Ô EM CẦN THẦY GIÚP (bản vẽ docs/ban-ve-hom-nay-v2-2109/): mỗi em — lý do bằng SỐ + chi tiết từng dạng (sai x/y câu · bậc · xu hướng 7 ngày) + 2 hành động (Đưa vào buổi chữa · Giao bài riêng; nút Nhắn phụ huynh gỡ 21/09 — kênh tới phụ huynh nay là Gửi cảnh báo + lời Bộ não A.I); lọc theo lớp; "Xem cả N em".
 *  Nguồn chi tiết: lệnh thầy CHỈ ĐỌC `/gv/can-giup` (Code 3). Chưa có lệnh / lỗi ⇒ nói thật rồi rơi về danh sách rút gọn của `/ke-hoach/hom-nay-thay` (không mất tính năng cũ, không bịa chi tiết). */
export default function EmCanGiup({
  rutGon,
  dangTaiRutGon,
  lyDoRutGon,
  onMoEm,
  onMoHoSo,
}: {
  /** Danh sách rút gọn cũ (từ `/ke-hoach/hom-nay-thay`) — dùng khi lệnh chi tiết chưa có. */
  rutGon: HomNay['canYTuong'] | null | undefined
  dangTaiRutGon: boolean
  lyDoRutGon: string
  /** Bấm TÊN em ⇒ trang Toàn cảnh một em. */
  onMoEm: (sbd: string) => void
  /** Nút "Xem hồ sơ" của danh sách rút gọn cũ ⇒ hồ sơ ở màn Học sinh. */
  onMoHoSo: (sbd: string) => void
}) {
  const setScreen = useAppStore((s) => s.setScreen)
  const datSbdGiaoRieng = useAppStore((s) => s.datSbdGiaoRieng)
  const [lop, setLop] = useState('')
  const [kq, setKq] = useState<KetQuaLenh<CanGiup> | undefined>(undefined)
  /** Bản KHÔNG lọc lớp: lấy tên lớp + số em từng lớp cho thanh chọn lớp (lọc rồi vẫn giữ đủ nút lớp). */
  const [goc, setGoc] = useState<CanGiup | null>(null)
  const [xemHet, setXemHet] = useState(false)

  useEffect(() => {
    let con = true
    setKq(undefined)
    void layCanGiup(lop || undefined).then((r) => {
      if (!con) return
      setKq(r)
      if (r.ok && !lop) setGoc(r.du)
    })
    return () => {
      con = false
    }
  }, [lop])

  const dem = useMemo(() => {
    // Chỉ hiện số em từng lớp khi danh sách đủ (máy chủ không cắt bớt) — nếu cắt thì số đếm sẽ sai.
    if (!goc || goc.tong !== goc.ds.length) return null
    const m: Record<string, number> = {}
    for (const e of goc.ds) m[e.lop] = (m[e.lop] ?? 0) + 1
    return m
  }, [goc])

  const giaoRieng = (sbd: string) => {
    datSbdGiaoRieng(sbd) // màn Giao bài mở sẵn chế độ chọn từng em, đã tick em này
    setScreen('giaobtvn')
  }

  const chiTiet = kq?.ok ? kq.du : null
  const hienThi = chiTiet ? (xemHet ? chiTiet.ds : chiTiet.ds.slice(0, SO_EM_GON)) : []
  const soTong = chiTiet?.tong ?? rutGon?.tong

  return (
    <section className="hn2-the" aria-labelledby="hn2-giup" data-khoi="em-can-giup">
      <div className="hn2-em-dau">
        <h2 id="hn2-giup" className="hn2-tieu-de">
          Em cần thầy giúp hôm nay
        </h2>
        {soTong != null && <span className="hn2-em-tong">{soTong} em</span>}
      </div>

      {goc && goc.lop.length > 1 && (
        <div className="hn2-loc-lop" role="group" aria-label="Lọc theo lớp">
          {['', ...goc.lop].map((l) => (
            <button key={l || 'tat-ca'} type="button" className="hn2-loc" aria-pressed={lop === l} onClick={() => (setLop(l), setXemHet(false))}>
              {l || 'Tất cả'}
              {l && dem ? ` · ${dem[l] ?? 0}` : ''}
            </button>
          ))}
        </div>
      )}

      {kq === undefined && <p className="hn2-trong">Đang tải…</p>}

      {kq && !kq.ok && (
        <>
          <p className={`hn2-ghi-chu${kq.loai === 'chua_co_lenh' ? '' : ' hn2-ghi-chu--canh'}`} role={kq.loai === 'chua_co_lenh' ? 'status' : 'alert'}>
            <Info size={16} aria-hidden="true" />
            <span>{kq.chu}</span>
          </p>
          <DanhSachRutGon rutGon={rutGon} dangTai={dangTaiRutGon} lyDo={lyDoRutGon} onMoHoSo={onMoHoSo} />
        </>
      )}

      {chiTiet && chiTiet.ds.length === 0 && <p className="hn2-trong">{lop ? `Lớp ${lop} hôm nay không có em nào cần thầy giúp.` : 'Hôm nay không có em nào cần thầy giúp.'}</p>}

      {hienThi.map((e) => (
        <div className="hn2-em hn2-em--dang" key={e.sbd} data-sbd={e.sbd}>
          <span className={`hn2-em-chu hn2-em-chu--${mauChu(e.lyDo)}`} aria-hidden="true">
            {chuCai(e.hoTen)}
          </span>
          <div className="hn2-em-thong-tin">
            <button type="button" className="hn2-em-ten hn2-em-ten--nut" onClick={() => onMoEm(e.sbd)} aria-label={`${e.hoTen} · ${e.lop} — mở toàn cảnh`}>
              {e.hoTen} <span className="hn2-em-lop">· {e.lop}</span>
            </button>
            <span className="hn2-em-tt">{lyDoCanGiup(e)}</span>
          </div>
          {e.dang.length > 0 && (
            <div className="hn2-dang-ds">
              {e.dang.map((d) => (
                <DongDang key={d.ma || d.ten} d={d} />
              ))}
              {e.ngayTre != null && e.lyDo !== 'tre_nhip' && <span className="hn2-em-tre">trễ nhịp {e.ngayTre} ngày</span>}
            </div>
          )}
          <div className="hn2-em-hanh-dong">
            <button type="button" className="hn2-nut hn2-nut--vien hn2-nut--nho" onClick={() => setScreen('goilenbang')}>
              Đưa vào buổi chữa
            </button>
            <button type="button" className="hn2-nut hn2-nut--vien hn2-nut--nho" onClick={() => giaoRieng(e.sbd)}>
              Giao bài riêng
            </button>
          </div>
        </div>
      ))}

      {chiTiet && chiTiet.ds.length > SO_EM_GON && (
        <button type="button" className="hn2-lien-ket" aria-expanded={xemHet} onClick={() => setXemHet((v) => !v)}>
          {xemHet ? 'Thu gọn' : chiTiet.tong === chiTiet.ds.length ? `Xem cả ${chiTiet.tong} em` : `Xem thêm ${chiTiet.ds.length - SO_EM_GON} em`}
        </button>
      )}
      {chiTiet && chiTiet.tong > chiTiet.ds.length && (
        <button type="button" className="hn2-lien-ket" onClick={() => setScreen('hocsinh')}>
          Xem cả {chiTiet.tong} em ở màn Học sinh
        </button>
      )}
    </section>
  )
}

/** Danh sách RÚT GỌN cũ — chỉ khi lệnh chi tiết chưa có/lỗi. Giữ đúng hành vi cũ (nút theo lý do). */
function DanhSachRutGon({
  rutGon,
  dangTai,
  lyDo,
  onMoHoSo,
}: {
  rutGon: HomNay['canYTuong'] | null | undefined
  dangTai: boolean
  lyDo: string
  onMoHoSo: (sbd: string) => void
}) {
  const setScreen = useAppStore((s) => s.setScreen)
  const lam = (e: HomNayEm) => (hanhDongCua(e) === 'dua_vao_buoi_chua' ? setScreen('goilenbang') : onMoHoSo(e.sbd))
  if (!rutGon) return <p className="hn2-trong">{dangTai ? 'Đang tải…' : `Danh sách em cần giúp: ${lyDo}${/[.!]$/.test(lyDo) ? '' : '.'}`}</p>
  if (rutGon.ds.length === 0) return <p className="hn2-trong">Hôm nay không có em nào cần thầy giúp.</p>
  return (
    <>
      {rutGon.ds.map((e) => (
        <div className="hn2-em" key={e.sbd}>
          <span className="hn2-em-chu hn2-em-chu--chua_mo" aria-hidden="true">
            {chuCai(e.hoTen)}
          </span>
          <div className="hn2-em-thong-tin">
            <span className="hn2-em-ten">
              {e.hoTen} <span className="hn2-em-lop">· {e.lop}</span>
            </span>
            <span className="hn2-em-tt">{cauLyDo(e)}</span>
          </div>
          <button type="button" className="hn2-nut hn2-nut--vien hn2-nut--nho" onClick={() => lam(e)}>
            {NHAN_HANH_DONG[hanhDongCua(e)]}
          </button>
        </div>
      ))}
      {rutGon.tong > rutGon.ds.length && (
        <button type="button" className="hn2-lien-ket" onClick={() => setScreen('hocsinh')}>
          Xem cả {rutGon.tong} em
        </button>
      )}
    </>
  )
}
