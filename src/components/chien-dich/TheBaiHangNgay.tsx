// HÀNH TRÌNH › BÀI HẰNG NGÀY (thầy 12/10, nguyên văn: "tôi cần biết lịch sử học sinh làm bài tập hàng ngày, tính từ 12/10. Học sinh thiếu nhiều
// ngày nhất hiển thị lên đầu, làm thiếu nhiều câu nhất trong từng ngày").
//   · Số từ lệnh CHỈ ĐỌC `/gv/bai-hang-ngay` (`src/lib/bai-hang-ngay-api.ts`, hợp đồng `server/src/bai-hang-ngay-kieu.ts`) — không bịa số.
//   · BẢNG NHIỆT: hàng = em (máy chủ đã xếp: số ngày thiếu ↓ → tổng câu thiếu ↓ → tên); cột = ngày từ 12/10; ô = "đã làm/mức" tô theo bốn mức
//     (đủ · thiếu ít · thiếu nhiều · không làm — `mucO`), ô hôm nay viền riêng ("tính tới lúc tải"). Bấm đầu cột một ngày ⇒ xếp em thiếu nhiều câu
//     NHẤT ngày ấy lên đầu ("làm thiếu nhiều câu nhất trong từng ngày"); "Xếp theo tổng" trả về thứ tự chung.
//   · Cột tổng (chỉ các ngày ĐÃ QUA — hôm nay chưa hết ngày nên chưa cộng): số ngày thiếu · tổng câu thiếu · ngày thiếu nhiều nhất. Hoà ⇒ em còn
//     thiếu nhiều câu hôm nay đứng trước. Lọc Khối (thanh phân đoạn) · Lớp (ô chọn) · tìm tên/SBD (không dấu vẫn khớp).
//   · Bấm tên em (một nút, ≥ 48 px) ⇒ tấm hồ sơ làm bài (`HoSoLamCauEm`, nạp lười); đóng tấm ⇒ focus về đúng nút.
//   · Mức nào máy chủ chưa lưu (ngày em không mở kế hoạch, Gói bài 7 ngày) là mức ƯỚC TÍNH theo quy tắc hiện hành — một dòng ghi chú nói rõ số ô.
//   · Danh sách dài: 50 em mỗi đợt + "Xem thêm" (chuẩn B16). Mảnh riêng, chỉ tải khi thầy mở thẻ (ngoài precache, vite.config.ts).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownWideNarrow, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import { layBaiHangNgay, MUC_THEO_TANG, type EmBaiHangNgay, type KetQuaBaiHangNgay } from '../../lib/bai-hang-ngay-api'
import { chuCaiTen, khopTim } from './nhip-hanh-trinh'
import { chuO, mucO, ngayNgan, TEN_MUC_O, thuDu, thuNgan, xepTheoNgay, type MucO } from './bai-hang-ngay-ui'
import type { EmHoSo } from './HoSoLamCauEm'
import './bai-hang-ngay.css'

const HoSoLamCauEm = lazy(() => import('./HoSoLamCauEm'))

/** Số em hiện mỗi đợt. */
export const MOI_DOT_EM = 50
const KHOI = ['10', '11', '12'] as const
type Khoi = (typeof KHOI)[number]

type Du = { ok: true; kq: KetQuaBaiHangNgay } | { ok: false; chu: string }

function Xuong() {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label="Đang tải bài hằng ngày của các em">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="gvv2-cc-xuong-dong">
          <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: 40, height: 40, borderRadius: 999 }} />
          <span className="gvv2-cc-xuong-chu">
            <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '36%', height: 14 }} />
            <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '20%', height: 12 }} />
          </span>
          <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: 220, height: 28 }} />
        </span>
      ))}
    </div>
  )
}

function ChuGiai({ kq }: { kq: KetQuaBaiHangNgay }) {
  return (
    <div className="gvv2-bhn-chu-giai">
      <ul className="gvv2-bhn-mau" aria-label="Chú giải màu ô">
        {(Object.keys(TEN_MUC_O) as MucO[]).map((m) => (
          <li key={m}>
            <span className="gvv2-bhn-mau-o" data-muc={m} aria-hidden="true" />
            {TEN_MUC_O[m]}
          </li>
        ))}
        <li>
          <span className="gvv2-bhn-mau-o" data-muc="hom-nay" aria-hidden="true" />
          Hôm nay (tính tới lúc tải, chưa cộng vào tổng)
        </li>
      </ul>
      <details className="gvv2-bhn-cach">
        <summary>
          Ô ghi <b>đã làm/mức tối thiểu</b> của ngày · mức tính thế nào?
          {kq.soOUocTinh > 0 && <span className="gvv2-so"> ({kq.soOUocTinh}/{kq.soO} ô dùng mức ước tính)</span>}
        </summary>
        <p className="gvv2-bhn-ghi gvv2-so">
          Mức tối thiểu theo tầng của em: Nền {MUC_THEO_TANG[1]} câu · Hiểu {MUC_THEO_TANG[2]} · Vận dụng, Tổng hợp {MUC_THEO_TANG[3]}. Ngày em mở kế hoạch Hành
          trình, mức là số đã chốt đầu ngày. Ngày không có mức đã lưu (em không mở kế hoạch, hoặc Gói bài 7 ngày — gói không lưu mức theo ngày) dùng mức
          ước tính theo tầng gần nhất đã ghi của em; chưa ghi tầng nào thì tính tầng Nền. Đã làm = số câu khác nhau em làm có kết quả trong ngày, không
          tính lượt chỉ đọc lời giải. Hôm nay chưa hết ngày nên chưa cộng vào số ngày thiếu và câu thiếu.
        </p>
      </details>
    </div>
  )
}

function DongEm({ e, ngay, onMo }: { e: EmBaiHangNgay; ngay: readonly string[]; onMo: (e: EmBaiHangNgay, nut: HTMLButtonElement) => void }) {
  const theoNgay = new Map(e.ngay.map((n) => [n.ngay, n]))
  const lon = e.ngayThieuNhieuNhat
  const soNgayQua = e.ngay.filter((n) => !n.homNay).length
  const homNay = e.ngay.find((n) => n.homNay)
  return (
    <tr className="gvv2-bhn-hang" data-sbd={e.sbd}>
      <th scope="row" className="gvv2-bhn-em-o">
        <button
          type="button"
          className="gvv2-bhn-em tt-nhan"
          onClick={(ev) => onMo(e, ev.currentTarget)}
          aria-label={`${e.hoTen}, SBD ${e.sbd}: thiếu ${e.soNgayThieu} ngày, ${e.tongCauThieu} câu${homNay ? `; hôm nay ${homNay.datMuc ? 'đã đủ mức' : `còn thiếu ${homNay.thieu} câu`}` : ''} — xem hồ sơ làm bài`}
        >
          <span className="gvv2-avatar gvv2-bhn-av" aria-hidden="true">
            {chuCaiTen(e.hoTen)}
          </span>
          <span className="gvv2-bhn-ten">
            <b>{e.hoTen}</b>
            <small className="gvv2-so">
              {e.lop ? `${e.lop} · ` : ''}SBD {e.sbd}
            </small>
          </span>
          <ChevronRight className="gvv2-bhn-mui" size={18} aria-hidden="true" />
        </button>
      </th>
      {ngay.map((d) => {
        const n = theoNgay.get(d)
        if (!n) return <td key={d} className="gvv2-bhn-o" data-nhan={ngayNgan(d)}>—</td>
        return (
          <td key={d} className="gvv2-bhn-o" data-muc={mucO(n)} data-hom-nay={n.homNay ? 'true' : undefined} data-uoc={n.mucUocTinh ? 'true' : undefined} data-nhan={ngayNgan(d)} title={chuO(n)}>
            <span className="gvv2-so" aria-hidden="true">
              {n.daLam}/{n.mucToiThieu}
            </span>
            <span className="gvv2-an-chu">{chuO(n)}</span>
          </td>
        )
      })}
      {soNgayQua === 0 ? (
        <td className="gvv2-bhn-tong gvv2-bhn-tong--trong" data-nhan="Tổng các ngày đã qua" colSpan={3}>
          <small>Chưa có ngày nào đã qua</small>
        </td>
      ) : (
        <>
          <td className="gvv2-bhn-tong gvv2-so" data-nhan="Số ngày thiếu" data-nang={e.soNgayThieu > 0 ? 'true' : undefined}>
            <b>{e.soNgayThieu}</b>
            <small>/{soNgayQua} ngày</small>
          </td>
          <td className="gvv2-bhn-tong gvv2-so" data-nhan="Câu thiếu" data-nang={e.tongCauThieu > 0 ? 'true' : undefined}>
            <b>{e.tongCauThieu}</b>
            <small> câu</small>
          </td>
          <td className="gvv2-bhn-tong gvv2-so" data-nhan="Ngày thiếu nhiều nhất">
            {lon ? (
              <>
                <b>{ngayNgan(lon.ngay)}</b>
                <small> · thiếu {lon.thieu} câu</small>
              </>
            ) : (
              <small>Không thiếu ngày nào</small>
            )}
          </td>
        </>
      )}
    </tr>
  )
}

/** Thẻ Bài hằng ngày. `khoiDau` = khối chọn sẵn (Hôm nay › lối vào theo khối); vắng ⇒ Tất cả. */
export default function TheBaiHangNgay({ khoiDau = null }: { khoiDau?: number | null }) {
  const [du, setDu] = useState<Du | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [khoi, setKhoi] = useState<Khoi | null>(khoiDau === 10 || khoiDau === 11 || khoiDau === 12 ? (String(khoiDau) as Khoi) : null)
  const [lop, setLop] = useState('')
  const [tim, setTim] = useState('')
  const [xep, setXep] = useState<string | null>(null)
  const [soHien, setSoHien] = useState(MOI_DOT_EM)
  const [mo, setMo] = useState<EmHoSo | null>(null)
  const nutVua = useRef<HTMLButtonElement | null>(null)

  const lan = useRef(0)
  const tai = useCallback(async () => {
    const l = ++lan.current
    setDangTai(true)
    let kq: Du
    try {
      const r = await layBaiHangNgay()
      kq = r.ok ? { ok: true, kq: r.du } : { ok: false, chu: r.loai === 'chua_co_lenh' ? r.chu : lyDoDeHieu(r.chu) }
    } catch (e) {
      kq = { ok: false, chu: lyDoDeHieu(e) }
    }
    if (l !== lan.current) return
    setDu(kq)
    setDangTai(false)
  }, [])
  useEffect(() => {
    void tai()
    return () => {
      lan.current++
    }
  }, [tai])

  const kq = du?.ok ? du.kq : null
  const tatCa = useMemo(() => kq?.em ?? [], [kq])
  const dsKhoi = useMemo(() => KHOI.map((k) => ({ khoi: k, soEm: tatCa.filter((e) => e.khoi === k).length })).filter((k) => k.soEm > 0), [tatCa])
  const coLocKhoi = dsKhoi.length >= 2
  const khoiChon = coLocKhoi && khoi !== null && dsKhoi.some((k) => k.khoi === khoi) ? khoi : null
  const dsLop = useMemo(() => (kq?.lop ?? []).filter((l) => !khoiChon || l.khoi === khoiChon), [kq, khoiChon])
  const lopChon = dsLop.some((l) => l.tenLop === lop) ? lop : ''
  const loc = useMemo(() => {
    const ds = tatCa.filter((e) => (!khoiChon || e.khoi === khoiChon) && (!lopChon || e.lop === lopChon) && khopTim({ sbd: e.sbd, ten: e.hoTen }, tim))
    return xep ? [...ds].sort(xepTheoNgay(xep)) : ds
  }, [tatCa, khoiChon, lopChon, tim, xep])
  const hien = loc.slice(0, soHien)
  const emThieu = loc.filter((e) => e.soNgayThieu > 0).length
  const coHomNay = !!kq && kq.ngay.includes(kq.homNay)
  const chuaDuHomNay = loc.filter((e) => e.ngay.some((n) => n.homNay && !n.datMuc)).length

  const onMo = useCallback((e: EmBaiHangNgay, nut: HTMLButtonElement) => {
    nutVua.current = nut
    setMo({ sbd: e.sbd, ten: e.hoTen, khoi: e.khoi === '10' || e.khoi === '11' || e.khoi === '12' ? e.khoi : null, lop: e.lop })
  }, [])
  const onDong = useCallback(() => {
    setMo(null)
    nutVua.current?.focus()
  }, [])
  const doiLoc = (f: () => void) => {
    f()
    setSoHien(MOI_DOT_EM)
  }

  return (
    <section className="gvv2-the gvv2-cc gvv2-bhn" aria-label="Bài hằng ngày · em thiếu nhiều ngày nhất đứng trước">
      <div className="gvv2-cc-dau">
        <p className="gvv2-cc-tom" aria-live="polite">
          {kq && tatCa.length > 0 ? (
            <>
              <b className="gvv2-so">{emThieu}</b>
              <span className="gvv2-so">/{loc.length}</span> em thiếu ít nhất một ngày đã qua
              {coHomNay && (
                <>
                  {' · '}
                  <b className="gvv2-so">{chuaDuHomNay}</b> em chưa đủ mức hôm nay
                </>
              )}
              {' · '}từ {ngayNgan(kq.tu)} đến {ngayNgan(kq.den)} <span className="gvv2-so">({kq.ngay.length} ngày)</span>
            </>
          ) : (
            'Bài hằng ngày từ 12/10: em thiếu nhiều ngày nhất đứng trước'
          )}
        </p>
        <button type="button" className="gvv2-nut-chu tt-nhan" onClick={() => void tai()} disabled={dangTai} aria-busy={dangTai}>
          <RefreshCw size={18} aria-hidden="true" className={dangTai && du ? 'gvv2-quay' : undefined} />
          {dangTai && du ? 'Đang làm mới…' : 'Làm mới'}
        </button>
      </div>

      {kq && tatCa.length > 0 && (
        <div className="gvv2-bhn-loc">
          {coLocKhoi && (
            <div className="gvv2-phan-doan" role="radiogroup" aria-label="Lọc theo khối">
              <button type="button" role="radio" aria-checked={khoiChon === null} className="gvv2-phan-doan-nut tt-nhan" onClick={() => doiLoc(() => setKhoi(null))}>
                <b>Tất cả</b>
                <small className="gvv2-so">{tatCa.length} em</small>
              </button>
              {dsKhoi.map((k) => (
                <button key={k.khoi} type="button" role="radio" aria-checked={khoiChon === k.khoi} className="gvv2-phan-doan-nut tt-nhan" onClick={() => doiLoc(() => setKhoi(k.khoi))}>
                  <b>Khối {k.khoi}</b>
                  <small className="gvv2-so">{k.soEm} em</small>
                </button>
              ))}
            </div>
          )}
          <label className="gvv2-bhn-lop">
            <span>Lớp</span>
            <select value={lopChon} onChange={(ev) => doiLoc(() => setLop(ev.target.value))}>
              <option value="">Mọi lớp</option>
              {dsLop.map((l) => (
                <option key={l.tenLop} value={l.tenLop}>
                  {l.tenLop} · {l.soEm} em
                </option>
              ))}
            </select>
          </label>
          <label className="gvv2-tim gvv2-bhn-tim">
            <Search size={16} aria-hidden="true" />
            <input type="search" value={tim} onChange={(ev) => doiLoc(() => setTim(ev.target.value))} placeholder="Tìm tên hoặc số báo danh…" aria-label="Tìm học sinh theo tên hoặc số báo danh" />
          </label>
        </div>
      )}

      {du === null ? (
        <Xuong />
      ) : !du.ok ? (
        <div className="gvv2-loi gvv2-cc-loi" role="alert">
          <p>Chưa tải được bài hằng ngày của các em. {du.chu}</p>
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
            Thử lại
          </button>
        </div>
      ) : tatCa.length === 0 ? (
        <p className="gvv2-trong">Chưa có em nào nhận bài hằng ngày: chưa có Hành trình khối hay Gói bài 7 ngày nào đang chạy. Thầy tick bài vừa dạy ở thẻ Dạy học để app bắt đầu xếp bài.</p>
      ) : (
        <>
          <ChuGiai kq={du.kq} />
          {du.kq.canhBao.map((c) => (
            <p key={c} className="gvv2-bhn-canh-bao" role="status">
              {c}
            </p>
          ))}
          {xep && (
            <div className="gvv2-bhn-xep" role="status">
              <span>
                Đang xếp em thiếu nhiều câu nhất ngày <b>{thuDu(xep)}</b> lên đầu.
              </span>
              <button type="button" className="gvv2-nut-chu tt-nhan" onClick={() => doiLoc(() => setXep(null))}>
                Xếp lại theo tổng
              </button>
            </div>
          )}
          {loc.length === 0 ? (
            <p className="gvv2-trong">Không có em nào khớp bộ lọc{khoiChon ? ` ở Khối ${khoiChon}` : ''}{lopChon ? ` · lớp ${lopChon}` : ''}.</p>
          ) : (
            <div className="gvv2-bhn-cuon" role="region" aria-label="Bảng bài hằng ngày, cuộn ngang khi nhiều ngày" tabIndex={0}>
              <table className="gvv2-bhn-bang" style={{ ['--so-ngay' as string]: du.kq.ngay.length }}>
                <caption className="gvv2-an-chu">Bài hằng ngày từng em: đã làm trên mức tối thiểu mỗi ngày, số ngày thiếu, câu thiếu, ngày thiếu nhiều nhất.</caption>
                <thead>
                  <tr>
                    <th scope="col" className="gvv2-bhn-em-o">
                      Học sinh <span className="gvv2-so">· {loc.length} em</span>
                    </th>
                    {du.kq.ngay.map((d) => (
                      <th key={d} scope="col" className="gvv2-bhn-ngay" aria-sort={xep === d ? 'descending' : 'none'} data-hom-nay={d === du.kq.homNay ? 'true' : undefined}>
                        <button
                          type="button"
                          className="gvv2-bhn-ngay-nut tt-nhan"
                          aria-pressed={xep === d}
                          aria-label={`${thuDu(d)}${d === du.kq.homNay ? ' (hôm nay)' : ''}: xếp em thiếu nhiều câu nhất ngày này lên đầu`}
                          onClick={() => doiLoc(() => setXep((x) => (x === d ? null : d)))}
                        >
                          <b className="gvv2-so">{ngayNgan(d)}</b>
                          <small>{d === du.kq.homNay ? 'Hôm nay' : thuNgan(d)}</small>
                          {xep === d && <ArrowDownWideNarrow size={14} aria-hidden="true" />}
                        </button>
                      </th>
                    ))}
                    <th scope="col" className="gvv2-bhn-tong-dau">Số ngày thiếu</th>
                    <th scope="col" className="gvv2-bhn-tong-dau">Câu thiếu</th>
                    <th scope="col" className="gvv2-bhn-tong-dau">Ngày thiếu nhiều nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {hien.map((e) => (
                    <DongEm key={e.sbd} e={e} ngay={du.kq.ngay} onMo={onMo} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {loc.length > hien.length && (
            <button type="button" className="gvv2-nut-vien tt-nhan gvv2-bhn-them" onClick={() => setSoHien((s) => s + MOI_DOT_EM)}>
              Xem thêm {Math.min(MOI_DOT_EM, loc.length - hien.length)} em (còn {loc.length - hien.length})
            </button>
          )}
        </>
      )}

      {mo &&
        createPortal(
          <div className="m3 m3-thay vo-thay" data-hoa2="" data-vo-cong="ho-so-lam-cau" style={{ display: 'contents' }}>
            <Suspense
              fallback={
                <>
                  <div className="gvv2-hs-che" aria-hidden="true" />
                  <div className="gvv2-hs gvv2-hs--cho" role="status" aria-label="Đang mở hồ sơ làm bài" />
                </>
              }
            >
              <HoSoLamCauEm em={mo} onDong={onDong} />
            </Suspense>
          </div>,
          document.body,
        )}
    </section>
  )
}

