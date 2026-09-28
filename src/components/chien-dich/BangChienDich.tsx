// BẢNG CHIẾN DỊCH khi đang chạy (bản vẽ docs/ban-ve-game-hoa-2-2709/GV-BangChienDich.dc.html) — dữ liệu từ `bang`.
// 4 ô số · bảng từng em (ô màu theo % thành thạo của dạng, có chú giải) · tấm "Cần thầy dạy lại" + "Gọi lên bảng 3 câu đầu".
// Chữa sớm giữa kỳ: chiếu 3 câu đầu, chữa xong thì bấm "Chữa xong 3 câu này" (hỏi lại, nói rõ hậu quả) ⇒ `chua-xong` với đúng 3 câu.
import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import HopXacNhan from '../HopXacNhan'
import { chuaXong, type BangChienDich as DuBang, type CauCanDayLai, type EmBang } from './api'
import { congNgay, conLai, hienNgay, phanTram } from './ngay'
import type { OChieu } from './to-chieu'
import { CHU_GIAI_O, mucO, sapTheoTen } from './tinh'
import './chien-dich.css'

/** Số em hiện khi thu gọn bảng. */
export const SO_EM_THU_GON = 12

const chuTreNhip = (n: number | null): string => (n == null ? 'Chưa làm' : n <= 0 ? '—' : `${n} ngày`)

/** Sức học theo dạng (hạng máy dùng để bốc câu mới) — chữ chuẩn app thầy. */
export const CHU_HANG: Record<'L1' | 'L2' | 'L3' | 'L4', string> = { L1: 'Yếu', L2: 'Trung bình', L3: 'Khá', L4: 'Giỏi' }
/** "Cấu tạo: Khá · Lên men: Yếu" — theo đúng thứ tự cột dạng của bảng; vắng ⇒ chuỗi rỗng. */
export function chuHangTheoDang(hang: EmBang['hangTheoDang'], dang: readonly string[]): string {
  if (!hang) return ''
  return dang.filter((d) => hang[d]).map((d) => `${d}: ${CHU_HANG[hang[d]!]}`).join(' · ')
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
  const dsEm = useMemo(() => sapTheoTen(du.em), [du.em])
  const hien = caLop ? dsEm : dsEm.slice(0, SO_EM_THU_GON)
  const ba = du.canDayLai.slice(0, 3)
  const luotBa = ba.reduce((s, c) => s + c.soEm, 0)

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
          <h1>Lên bảng · Chiến dịch {cd.ten}</h1>
          <p className="cd-so">
            {cd.lop ? `Lớp ${cd.lop} · ` : ''}
            {cd.soEm} em · Hạn nộp: {conLai(cd.hanNop, nowMs)} (tới 23:59 {hienNgay(cd.hanNop, false)}) · hết hạn nộp, màn này tự chuyển sang Buổi chữa
          </p>
        </div>
        <span className="cd-chip">Đang chạy</span>
      </div>

      <div className="cd-o-so-hang" data-khoi="o-so-chien-dich">
        <div className="cd-o-so">
          <span>Cọ xát trung bình lớp</span>
          <strong>{phanTram(du.lop.coXat)}</strong>
        </div>
        <div className="cd-o-so">
          <span>Thành thạo trung bình lớp</span>
          <strong>{phanTram(du.lop.thanhThao)}</strong>
        </div>
        <div className="cd-o-so cd-o-so--do">
          <span>Em đang Huyết Chiến</span>
          <strong>{du.lop.huyetChien} em</strong>
        </div>
        <div className="cd-o-so cd-o-so--vang">
          <span>Cần thầy dạy lại</span>
          <strong>
            {du.lop.canDayLaiCau} câu · {du.lop.canDayLaiLuot} lượt em
          </strong>
        </div>
      </div>

      <div className="cd-bo-cuc">
        <section className="cd-the" aria-labelledby="cd-bang-em">
          <div className="cd-the-dau">
            <h2 id="cd-bang-em">Từng em · Thành thạo theo dạng</h2>
            <span className="cd-so">
              Hiện {hien.length}/{dsEm.length} em · xếp theo tên
            </span>
          </div>
          {dsEm.length === 0 ? (
            <p className="cd-phu">Chiến dịch chưa có em nào — kiểm tra lại lớp đã giao.</p>
          ) : (
            <div className="cd-cuon-ngang">
              <table className="cd-bang" data-khoi="bang-tung-em">
                <thead>
                  <tr>
                    <th scope="col">Học sinh</th>
                    <th scope="col">Cọ xát</th>
                    <th scope="col">Thành thạo</th>
                    {du.dang.map((d) => (
                      <th key={d} scope="col" title={d}>
                        <span className="cd-ten-dang">{d}</span>
                      </th>
                    ))}
                    <th scope="col">Trễ nhịp</th>
                  </tr>
                </thead>
                <tbody>
                  {hien.map((e) => (
                    <tr key={e.sbd}>
                      <th scope="row" style={{ fontWeight: 500, color: 'var(--bts-chu)', textAlign: 'left', fontSize: 14 }}>
                        {e.ten}
                        {e.huyetChien && <span className="cd-nhan-hc">Huyết Chiến</span>}
                        {chuHangTheoDang(e.hangTheoDang, du.dang) && (
                          <span className="cd-hang-dong" data-khoi="hang-theo-dang">
                            {chuHangTheoDang(e.hangTheoDang, du.dang)}
                          </span>
                        )}
                      </th>
                      <td>{phanTram(e.coXat / soCau)}</td>
                      <td>{phanTram(e.thanhThao / soCau)}</td>
                      {du.dang.map((d) => {
                        const t = e.theoDang[d]
                        const m = mucO(t)
                        return (
                          <td key={d}>
                            <span className={`cd-o cd-o--${m}`} data-o={m} title={`${d}: ${phanTram(t)} câu thành thạo`}>
                              {phanTram(t)}
                            </span>
                          </td>
                        )
                      })}
                      <td>{chuTreNhip(e.treNhip)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="cd-chu-giai" data-khoi="chu-giai-o-mau">
            <span>Ô màu = % câu thành thạo của dạng:</span>
            {CHU_GIAI_O.map((g) => (
              <span key={g.muc}>
                <span className={`cd-o cd-o--mau cd-o--${g.muc}`} aria-hidden="true" />
                {g.chu}
              </span>
            ))}
            {du.em.some((e) => e.hangTheoDang && Object.keys(e.hangTheoDang).length) && (
              <span>Dòng dưới tên em = sức học theo dạng (Yếu · Trung bình · Khá · Giỏi) — máy bốc câu mới theo đó.</span>
            )}
            {dsEm.length > SO_EM_THU_GON && (
              <button type="button" className="m3-nut-chu cd-nut-nho" aria-expanded={caLop} onClick={() => setCaLop((x) => !x)}>
                {caLop ? 'Thu gọn' : 'Xem cả lớp'}
              </button>
            )}
          </div>
        </section>

        <section className="cd-the" aria-labelledby="cd-can-day-lai">
          <h2 id="cd-can-day-lai">Cần thầy dạy lại</h2>
          <p className="cd-phu">Câu em sai từ 4 lần, lần cuối vẫn sai — đã rời Đoàn Hộ Tống, chờ thầy chữa.</p>
          {du.canDayLai.length === 0 ? (
            <p className="cd-phu">Chưa có câu nào cần thầy dạy lại — các em đang tự ôn được.</p>
          ) : (
            <ul className="cd-ds-cau">
              {du.canDayLai.map((c) => (
                <li key={c.qid}>
                  <span>
                    <b>Câu {c.stt}</b> · {c.dang}
                  </span>
                  <b>{c.soEm} em</b>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="m3-nut-chinh" disabled={ba.length === 0 || dangChieu} onClick={() => void chieuBa()}>
            {dangChieu ? 'Đang mở tờ chiếu…' : `Gọi lên bảng ${ba.length || 3} câu đầu`}
          </button>
          <p className="cd-phu">Chữa sớm giữa kỳ: chữa xong, câu quay lại Đoàn Hộ Tống của các em từ hôm sau.</p>
          {daChieu3 && (
            <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => setHoiChua(true)}>
              Chữa xong {ba.length} câu này
            </button>
          )}
        </section>
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
