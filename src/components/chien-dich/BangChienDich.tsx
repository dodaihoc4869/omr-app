// BẢNG CHIẾN DỊCH khi đang chạy (bản vẽ docs/ban-ve-gv-2809/GV-BangChienDich, thầy chốt 28/09) — dữ liệu từ `bang`.
// 5 thẻ số (Đã làm qua · Thành thạo · Đúng nhịp · Quá tải hôm nay · Cần thầy dạy lại, có mẫu số + so với hôm qua) ·
// heatmap em × dạng (MỘT dải xanh nhạt → đậm theo hạng Yếu/Trung bình/Khá/Giỏi, số % in trong ô, "Chưa làm" gạch chéo) ·
// nhịp của lớp · "Cần thầy dạy lại" + "Chiếu 3 câu đầu lên bảng" · hạng của lớp theo dạng.
// HẠNG dùng ĐÚNG ngưỡng thuật toán (`hangTuTiLe`): Yếu < 40% · Trung bình 40–65% · Khá 65–85% · Giỏi > 85% (bản vẽ ghi 40/60/80 — đã sửa).
// Chữa sớm giữa kỳ: chiếu 3 câu đầu, chữa xong thì bấm "Chữa xong 3 câu này" (hỏi lại, nói rõ hậu quả) ⇒ `chua-xong` với đúng 3 câu.
import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import HopXacNhan from '../HopXacNhan'
import { chuaXong, type BangChienDich as DuBang, type CauCanDayLai, type EmBang, type HangEm, type NhipEm } from './api'
import { congNgay, conLai, hienHanNop, hienNgay, phanTram } from './ngay'
import type { OChieu } from './to-chieu'
import { CHU_GIAI_HANG, CHU_HANG, hangTuTiLe, mucO } from './tinh'
import './chien-dich.css'

export { CHU_HANG }

/** Số em hiện khi thu gọn bảng. */
export const SO_EM_THU_GON = 12

/** "Cấu tạo: Khá · Lên men: Yếu" — theo đúng thứ tự cột dạng của bảng; vắng ⇒ chuỗi rỗng. */
export function chuHangTheoDang(hang: EmBang['hangTheoDang'], dang: readonly string[]): string {
  if (!hang) return ''
  return dang.filter((d) => hang[d]).map((d) => `${d}: ${CHU_HANG[hang[d]!]}`).join(' · ')
}

/** % thành thạo TRUNG BÌNH LỚP theo dạng: máy chủ gửi (`lop.theoDang`) thì dùng; máy chủ cũ ⇒ trung bình các em có câu ở dạng đó. */
export function tbLopTheoDang(du: Pick<DuBang, 'dang' | 'em' | 'lop'>): Record<string, number | null> {
  if (du.lop.theoDang) return du.lop.theoDang
  return Object.fromEntries(
    du.dang.map((d) => {
      const ds = du.em.map((e) => e.theoDang[d]).filter((x): x is number => typeof x === 'number')
      return [d, ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null]
    }),
  )
}

/** Đếm số dạng theo hạng lớp (Giỏi → Yếu). */
export function demHangLop(tb: Record<string, number | null>, hangMayChu?: Record<string, HangEm>): Record<HangEm, number> {
  const dem: Record<HangEm, number> = { L1: 0, L2: 0, L3: 0, L4: 0 }
  for (const [d, p] of Object.entries(tb)) {
    const h = hangMayChu?.[d] ?? (typeof p === 'number' ? hangTuTiLe(p) : null)
    if (h) dem[h]++
  }
  return dem
}

/** Thứ tự em: thành thạo thấp trước (thầy cần thấy em yếu trước), hoà thì theo tên. */
export function sapEmYeuTruoc(em: readonly EmBang[]): EmBang[] {
  return [...em].sort((a, b) => a.thanhThao - b.thanhThao || a.ten.localeCompare(b.ten, 'vi'))
}

/** Người lên bảng cho mỗi câu cần dạy lại: em thành thạo dạng ấy nhiều nhất, không lặp em nếu còn em khác. */
export function nguoiGiaiMau(cau: readonly CauCanDayLai[], em: readonly EmBang[]): OChieu[] {
  const daGoi = new Set<string>()
  return cau.map((c) => {
    const xep = [...em].sort((a, b) => (b.theoDang[c.dang] ?? -1) - (a.theoDang[c.dang] ?? -1) || b.thanhThao - a.thanhThao)
    const e = xep.find((x) => !daGoi.has(x.sbd)) ?? xep[0]
    if (e) daGoi.add(e.sbd)
    return { qid: c.qid, stt: c.stt, phan: 'I', mucDo: null, sbd: e?.sbd ?? '', ten: e?.ten ?? 'Cả lớp', viSao: `${c.soEm} em cần thầy dạy lại` }
  })
}

/** Chênh lệch điểm % so với hôm qua: "▲ 8 hôm qua" / "▼ 2 hôm qua" / "bằng hôm qua". */
function chuChenh(nay: number, homQua: number | undefined): { chu: string; huong: 'len' | 'xuong' | 'bang' } | null {
  if (typeof homQua !== 'number' || !Number.isFinite(homQua)) return null
  const d = Math.round(nay * 100) - Math.round(homQua * 100)
  if (d === 0) return { chu: 'bằng hôm qua', huong: 'bang' }
  return { chu: `${d > 0 ? '▲' : '▼'} ${Math.abs(d)} điểm so với hôm qua`, huong: d > 0 ? 'len' : 'xuong' }
}

const CHU_NHIP: Record<NhipEm, string> = { vuot: 'Vượt nhịp', dung: 'Đúng nhịp', tre12: 'Trễ 1–2 ngày', tre3: 'Trễ từ 3 ngày' }
const chuTre = (e: EmBang): string => {
  const n = e.soNgayTre ?? e.treNhip
  if (e.treNhip == null && e.soNgayTre == null) return 'Chưa làm'
  return n && n > 0 ? `${n} ngày` : '—'
}

export default function BangChienDich({
  du,
  nowMs,
  dangChieu,
  onChieu,
  onDaChua,
}: {
  du: DuBang
  nowMs: number
  dangChieu: boolean
  onChieu: (ds: OChieu[], tenBuoi: string) => Promise<boolean>
  /** Gọi sau khi "Chữa xong" thành công để nạp lại bảng. */
  onDaChua: () => void
}) {
  const showToast = useAppStore((s) => s.showToast)
  const [caLop, setCaLop] = useState(false)
  const [daChieu3, setDaChieu3] = useState(false)
  const [hoiChua, setHoiChua] = useState(false)
  const [dangChua, setDangChua] = useState(false)

  const cd = du.chienDich
  const soCau = Math.max(1, cd.soCau)
  const tb = useMemo(() => tbLopTheoDang(du), [du])
  // Dạng xếp theo cả lớp yếu nhất bên trái (dạng không có số đứng cuối).
  const dang = useMemo(() => [...du.dang].sort((a, b) => (tb[a] ?? 2) - (tb[b] ?? 2)), [du.dang, tb])
  const dsEm = useMemo(() => sapEmYeuTruoc(du.em), [du.em])
  const hien = caLop ? dsEm : dsEm.slice(0, SO_EM_THU_GON)
  const ba = du.canDayLai.slice(0, 3)
  const luotBa = ba.reduce((s, c) => s + c.soEm, 0)
  const lop = du.lop
  const soEm = du.em.length || cd.soEm
  const tbCoXat = Math.round(lop.coXat * soCau)
  const chenhCoXat = chuChenh(lop.coXat, lop.homQua?.coXat)
  const chenhThanhThao = chuChenh(lop.thanhThao, lop.homQua?.thanhThao)
  const soTre = lop.nhip ? lop.nhip.tre12 + lop.nhip.tre3 : null
  const soDangYeu = dang.filter((d) => typeof tb[d] === 'number' && hangTuTiLe(tb[d]!) === 'L1').length
  const hangLop = demHangLop(tb, lop.hangTheoDang)
  const tongHang = hangLop.L1 + hangLop.L2 + hangLop.L3 + hangLop.L4

  const chieuBa = async () => {
    const ok = await onChieu(nguoiGiaiMau(ba, du.em), `Chữa sớm · ${cd.ten}`)
    if (ok) setDaChieu3(true)
  }
  const chuaBa = async () => {
    setDangChua(true)
    const r = await chuaXong(cd.id, ba.map((c) => c.qid))
    setDangChua(false)
    setHoiChua(false)
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    showToast(`Đã ghi chữa xong: ${r.du.soLuot} lượt em, ôn lại từ ${hienNgay(r.du.ngayOnLai)}`, 'success')
    setDaChieu3(false)
    onDaChua()
  }

  return (
    <>
      <div className="cd-dau">
        <div>
          <p className="cd-duong-dan">Chữa trên lớp › Bảng chiến dịch</p>
          <h1>
            {cd.ten}
            {cd.lop ? ` · ${cd.lop}` : ''}
          </h1>
          <p className="cd-so">
            {cd.soCau} câu · {du.dang.length} dạng · {soEm} em
            {lop.ngayThu && lop.tongNgay ? ` · ngày ${lop.ngayThu} / ${lop.tongNgay}` : ''} · hạn nộp {hienHanNop(cd.hanNop)} ({conLai(cd.hanNop, nowMs)}) · hết hạn nộp, màn này tự chuyển sang Buổi chữa
          </p>
        </div>
        <span className="cd-chip-muc cd-chip-muc--xanh">Đang chạy</span>
      </div>

      <div className="cd-kpi-hang" data-khoi="o-so-chien-dich">
        <div className="cd-kpi" data-mau="xd">
          <span className="cd-kpi-nhan" title="Câu em đã làm ít nhất 1 lần (trung bình lớp)">
            Đã làm qua <span className="cd-chu-thich">(câu em đã làm ít nhất 1 lần)</span>
          </span>
          <strong data-so="da-lam-qua">
            {Math.round(lop.coXat * 100)}
            <small>% câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">
            TB {tbCoXat} / {cd.soCau} câu
            {chenhCoXat && <span className={`cd-chenh cd-chenh--${chenhCoXat.huong}`}> · {chenhCoXat.chu}</span>}
          </span>
        </div>
        <div className="cd-kpi" data-mau="xl">
          <span className="cd-kpi-nhan" title="Câu đúng đủ lịch ôn, lần cuối đúng">
            Thành thạo <span className="cd-chu-thich">(đúng đủ lịch ôn, lần cuối đúng)</span>
          </span>
          <strong data-so="thanh-thao">
            {Math.round(lop.thanhThao * 100)}
            <small>% câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">
            {typeof lop.mucCanHomNay === 'number' ? `mức cần làm qua hôm nay ${phanTram(lop.mucCanHomNay)}` : 'trung bình lớp'}
            {chenhThanhThao && <span className={`cd-chenh cd-chenh--${chenhThanhThao.huong}`}> · {chenhThanhThao.chu}</span>}
          </span>
        </div>
        <div className="cd-kpi" data-mau="xd">
          <span className="cd-kpi-nhan">Đúng nhịp</span>
          <strong data-so="dung-nhip">
            {typeof lop.dungNhip === 'number' ? lop.dungNhip : '—'}
            <small>/ {soEm} em</small>
          </strong>
          <span className="cd-kpi-phu cd-so">{lop.nhip ? `${soTre} em trễ nhịp · ${lop.nhip.tre3} em từ 3 ngày` : 'máy chủ chưa gửi nhịp'}</span>
        </div>
        <div className="cd-kpi" data-mau="hp">
          <span className="cd-kpi-nhan" title="Em phải làm vượt số lượt/ngày để kịp hạn">
            Quá tải hôm nay
          </span>
          <strong data-so="qua-tai">
            {lop.huyetChien}
            <small>em</small>
          </strong>
          <span className="cd-kpi-phu cd-so">phải làm quá {cd.theLucNgay} lượt/ngày để kịp hạn</span>
        </div>
        <div className="cd-kpi" data-mau="ho">
          <span className="cd-kpi-nhan">Cần thầy dạy lại</span>
          <strong data-so="can-day-lai">
            {lop.canDayLaiCau}
            <small>câu</small>
          </strong>
          <span className="cd-kpi-phu cd-so">{lop.canDayLaiLuot} lượt em</span>
        </div>
      </div>

      <div className="cd-bo-cuc">
        <section className="cd-the" aria-labelledby="cd-bang-em">
          <div className="cd-the-dau">
            <div>
              <h2 id="cd-bang-em">Từng em × dạng · % câu thành thạo</h2>
              <span className="cd-so cd-phu">
                Hiện {hien.length}/{dsEm.length} em · {soDangYeu}/{dang.length} dạng Yếu
              </span>
            </div>
          </div>
          {dsEm.length === 0 ? (
            <p className="cd-phu">Chiến dịch chưa có em nào — kiểm tra lại lớp đã giao.</p>
          ) : (
            <div className="cd-cuon-ngang">
              <table className="cd-bang cd-nhiet" data-khoi="bang-tung-em">
                <thead>
                  <tr>
                    <th scope="col" className="cd-nhiet-ten">
                      Học sinh
                    </th>
                    <th scope="col">Thành thạo ▲</th>
                    <th scope="col">Trễ nhịp</th>
                    {dang.map((d) => (
                      <th key={d} scope="col" title={d} className="cd-nhiet-dang">
                        <span className="cd-ten-dang-xoay">{d}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="cd-nhiet-lop" data-khoi="hang-ca-lop">
                    <th scope="row" className="cd-nhiet-ten">
                      Cả lớp ({soEm} em)
                    </th>
                    <td className="cd-so">{phanTram(lop.thanhThao)}</td>
                    <td>—</td>
                    {dang.map((d) => {
                      const t = tb[d]
                      const h = lop.hangTheoDang?.[d] ?? (typeof t === 'number' ? hangTuTiLe(t) : null)
                      const m = mucO(t)
                      return (
                        <td key={d}>
                          <span className={`cd-o cd-o--${m}`} data-o={m} title={`${d}: cả lớp ${phanTram(t)} câu thành thạo`}>
                            {typeof t === 'number' ? Math.round(t * 100) : '—'}
                          </span>
                          {h && <span className="cd-hang-duoi">{CHU_HANG[h]}</span>}
                        </td>
                      )
                    })}
                  </tr>
                  {hien.map((e) => {
                    const hangChu = chuHangTheoDang(e.hangTheoDang, dang)
                    return (
                      <tr key={e.sbd}>
                        <th scope="row" className="cd-nhiet-ten" title={hangChu ? `Sức học theo dạng — ${hangChu}` : undefined}>
                          {e.ten}
                          {e.huyetChien && <span className="cd-nhan-hc">Quá tải hôm nay</span>}
                          {hangChu && (
                            <span className="cd-an-chu" data-khoi="hang-theo-dang">
                              {hangChu}
                            </span>
                          )}
                        </th>
                        <td className="cd-so">{phanTram(e.thanhThao / soCau)}</td>
                        <td className={`cd-so${(e.soNgayTre ?? e.treNhip ?? 0) >= 3 ? ' cd-chu-do' : (e.soNgayTre ?? e.treNhip ?? 0) >= 1 ? ' cd-chu-vang' : ''}`}>{chuTre(e)}</td>
                        {dang.map((d) => {
                          const t = e.theoDang[d]
                          const m = mucO(t, e.daLamTheoDang?.[d])
                          const h = e.hangTheoDang?.[d]
                          return (
                            <td key={d}>
                              <span
                                className={`cd-o cd-o--${m}`}
                                data-o={m}
                                title={`${d}: ${m === 'chua-lam' ? 'chưa làm câu nào' : `${phanTram(t)} câu thành thạo`}${h ? ` · sức học ${CHU_HANG[h]}` : ''}`}
                              >
                                {m === 'chua-lam' ? <span className="cd-an-chu">Chưa làm</span> : typeof t === 'number' ? Math.round(t * 100) : '—'}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="cd-chu-giai" data-khoi="chu-giai-o-mau">
            {CHU_GIAI_HANG.map((g) => (
              <span key={g.hang}>
                <span className={`cd-o cd-o--mau cd-o--${g.hang}`} aria-hidden="true" />
                {g.chu}
              </span>
            ))}
            <span>
              <span className="cd-o cd-o--mau cd-o--chua-lam" aria-hidden="true" />
              Chưa làm
            </span>
            {dsEm.length > SO_EM_THU_GON && (
              <button type="button" className="m3-nut-vien cd-nut-nho" aria-expanded={caLop} onClick={() => setCaLop((x) => !x)}>
                {caLop ? 'Thu gọn' : `Xem cả ${dsEm.length} em · ${dang.length} dạng`}
              </button>
            )}
          </div>
          <p className="cd-phu">
            Em xếp theo thành thạo thấp trước (▲). Dạng xếp theo cả lớp yếu nhất bên trái. Số trong ô = % câu của dạng em đã thành thạo; hạng theo đúng ngưỡng app
            dùng để bốc câu mới. Rê chuột lên tên em để xem sức học theo dạng.
          </p>
        </section>

        <div className="cd-cot-phai">
          {lop.nhip && (
            <section className="cd-the" aria-labelledby="cd-nhip-lop" data-khoi="nhip-lop">
              <div className="cd-the-dau">
                <h2 id="cd-nhip-lop">Nhịp của lớp</h2>
                <span className="cd-so cd-phu">{soEm} em · hôm nay</span>
              </div>
              {(['vuot', 'dung', 'tre12', 'tre3'] as const).map((k) => (
                <div key={k} className="cd-nhip-hang" data-nhip={k}>
                  <span>{CHU_NHIP[k]}</span>
                  <div className="cd-thanh" aria-hidden="true">
                    <div className={`cd-thanh--${k}`} style={{ width: `${Math.min(100, Math.max(0, (100 * lop.nhip![k]) / Math.max(1, soEm)))}%` }} />
                  </div>
                  <b className="cd-so">{lop.nhip![k]} em</b>
                </div>
              ))}
              <p className="cd-phu">Trễ = số ngày liền không làm câu nào. Vượt nhịp = đã làm qua cao hơn mức cần hôm nay từ 10 điểm %.</p>
            </section>
          )}

          {(du.noCu?.length ?? 0) > 0 && (
            <section className="cd-the" aria-labelledby="cd-no-cu" data-khoi="no-cu">
              <div className="cd-the-dau">
                <h2 id="cd-no-cu">Nợ cũ nhiều</h2>
                <span className="cd-so cd-phu">{du.noCu!.length} em</span>
              </div>
              <p className="cd-phu">Nợ cũ chiếm tối đa một nửa lượt mỗi ngày. Thầy có thể nâng số lượt/ngày hoặc chữa trên lớp.</p>
              <ul className="cd-ds-cau">
                {du.noCu!.map((x) => (
                  <li key={x.sbd}>{x.cau}.</li>
                ))}
              </ul>
            </section>
          )}

          <section className="cd-the cd-the--nhan" aria-labelledby="cd-can-day-lai">
            <div className="cd-the-dau">
              <h2 id="cd-can-day-lai">Cần thầy dạy lại</h2>
              <span className="cd-so cd-phu">
                {lop.canDayLaiCau} câu · {lop.canDayLaiLuot} lượt em
              </span>
            </div>
            <p className="cd-phu">Câu em sai từ 4 lần, lần cuối vẫn sai — đã tạm rời game, chờ thầy chữa.</p>
            {du.canDayLai.length === 0 ? (
              <p className="cd-phu">Chưa có câu nào cần thầy dạy lại — các em đang tự ôn được.</p>
            ) : (
              <ol className="cd-ds-cau">
                {du.canDayLai.map((c) => (
                  <li key={c.qid}>
                    <span>
                      <b>Câu {c.stt}</b> · {c.dang}
                      {c.mucDo && <small className="cd-phu"> · {c.mucDo}</small>}
                    </span>
                    <b className="cd-so">{c.soEm} em</b>
                  </li>
                ))}
              </ol>
            )}
            <button type="button" className="m3-nut-chinh" disabled={ba.length === 0 || dangChieu} onClick={() => void chieuBa()}>
              {dangChieu ? 'Đang mở tờ chiếu…' : `Chiếu ${ba.length || 3} câu đầu lên bảng`}
            </button>
            <p className="cd-phu">Chữa sớm giữa kỳ: chữa xong, câu quay lại Đoàn Hộ Tống của các em từ hôm sau.</p>
            {daChieu3 && (
              <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => setHoiChua(true)}>
                Chữa xong {ba.length} câu này
              </button>
            )}
          </section>

          {tongHang > 0 && (
            <section className="cd-the" aria-labelledby="cd-hang-lop" data-khoi="hang-lop-theo-dang">
              <div className="cd-the-dau">
                <h2 id="cd-hang-lop">Hạng của lớp theo dạng</h2>
                <span className="cd-so cd-phu">{tongHang} dạng</span>
              </div>
              <div className="cd-thanh-chong" aria-hidden="true">
                {(['L4', 'L3', 'L2', 'L1'] as const).map((h) => (
                  <div key={h} className={`cd-o--${h}`} style={{ width: `${(100 * hangLop[h]) / tongHang}%` }} />
                ))}
              </div>
              <ul className="cd-ds-muc cd-ds-muc--ngang">
                {(['L4', 'L3', 'L2', 'L1'] as const).map((h) => (
                  <li key={h} data-hang={h}>
                    <span className={`cd-cham cd-o--${h}`} aria-hidden="true" />
                    <span>{CHU_HANG[h]}</span>
                    <b className="cd-so">{hangLop[h]}</b>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {hoiChua && (
        <HopXacNhan
          tieuDe={`Chữa xong ${ba.length} câu này?`}
          noiDung={
            <p>
              {luotBa} lượt em đang “Cần thầy dạy lại” ở câu {ba.map((c) => c.stt).join(', ')} được mở khoá: các câu này quay lại Đoàn Hộ Tống của các em từ{' '}
              {hienNgay(congNgay(du.homNay, 1))}. Việc này không hoàn tác được.
            </p>
          }
          nhanXacNhan="Chữa xong"
          nhanDangLam="Đang ghi…"
          dangLam={dangChua}
          onXacNhan={() => void chuaBa()}
          onHuy={() => setHoiChua(false)}
        />
      )}
    </>
  )
}
