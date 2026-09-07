// KHỐI DÙNG CHUNG CHO CẢ HAI BỐ CỤC BÁO CÁO PHỤ HUYNH (v2 và v3).
//
// Tách khỏi `PhieuScreen` ngày 07/09 khi dựng bố cục v3. Thanh thời gian và
// khối bằng chứng rời màn là hai thứ v3 giữ NGUYÊN LUẬT của bản cũ — chép sang
// bản mới là hai bản sao, và luật vi phạm mà lệch nhau giữa hai bố cục thì
// phụ huynh hai em đọc ra hai chuyện khác nhau.
//
// Class CSS nằm trong `src/lib/css-bao-cao.ts`.
import { useEffect, useRef, useState } from 'react'
import type { PhieuDayDu } from '../lib/phieu-du-lieu'

// ---- tiện ích dùng chung, chép từ PhieuScreen lúc tách (07/09) ----
export function soVN(x: number, soLe = 2): string {
  return x.toFixed(soLe).replace('.', ',')
}
export function ngayNgan(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function useHienKhiToi<T extends HTMLElement>(tat: boolean): [React.RefObject<T | null>, boolean] {
  const o = useRef<T | null>(null)
  const [ra, setRa] = useState(tat)
  useEffect(() => {
    if (tat) return setRa(true)
    const el = o.current
    if (!el || typeof IntersectionObserver !== 'function') return setRa(true)
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setRa(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [tat])
  return [o, ra]
}

export function OSo({ so, ten }: { so: string | number | null; ten: string }) {
  return (
    <div className="bc-o">
      <div className="bc-o-so">{so === null || so === '' ? '—' : so}</div>
      <div className="bc-o-ten">{ten}</div>
    </div>
  )
}

// ------------------------------------------------------------------ biểu đồ
/** ĐƯỜNG ĐIỂM QUA CÁC CA. Vẽ tay: đường + vùng tô nhạt + chấm, chấm cuối to hơn.
 * Dưới 2 ca thì không vẽ — một điểm không thành xu hướng. */


export function DaiThoiGian({ cau, tat }: { cau: { giay: number | null; dung: boolean; nhan: string }[]; tat: boolean }) {
  const [o, ra] = useHienKhiToi<HTMLDivElement>(tat)
  const co = cau.filter((c) => c.giay !== null)
  if (co.length < 3) return null
  const cao = Math.max(...co.map((c) => c.giay as number))
  return (
    <div ref={o} style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 76 }}>
        {cau.map((c, i) => (
          <div
            key={i}
            title={`${c.nhan}${c.giay !== null ? ` · ${c.giay} giây` : ''}`}
            style={{
              flex: 1,
              minWidth: 2,
              height: ra ? `${c.giay === null ? 3 : Math.max(5, ((c.giay as number) / cao) * 100)}%` : '3%',
              background: c.dung ? 'var(--p-xanh)' : 'var(--p-do)',
              opacity: c.giay === null ? 0.25 : 1,
              borderRadius: '3px 3px 1px 1px',
              transition: tat ? 'none' : `height .55s cubic-bezier(.22,.9,.28,1) ${Math.min(600, i * 22)}ms`,
            }}
          />
        ))}
      </div>
      <div className="bc-ghi" style={{ marginTop: 8 }}>
        Mỗi cột là một câu theo đúng thứ tự em làm, cao là mất nhiều giây. Cột đỏ là câu sai, cột xanh là câu đúng.
      </div>
    </div>
  )
}

// ------------------------------------------------------- bằng chứng rời màn
/** Giờ:phút:giây của một mốc. Phụ huynh đối chiếu được với việc nhà lúc đó
 * (gọi điện, sai đi lấy nước) nên phải có giây, không làm tròn. */
function gioDayDu(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function giayChu(g: number): string {
  if (g < 60) return `${g} giây`
  const p = Math.floor(g / 60)
  const s = g % 60
  return s === 0 ? `${p} phút` : `${p} phút ${s} giây`
}

const LY_DO_KHOA: Record<string, string> = {
  qua_so_lan: 'rời khỏi bài quá số lần Thầy cho phép',
  roi_qua_lau: 'một lần rời khỏi bài quá lâu',
}

/** NÚT VI PHẠM NHẤP NHÁY + BẰNG CHỨNG.
 *
 * Thầy chốt 04-09: bấm "Báo phụ huynh" thì trong báo cáo phải có nút này, bấm
 * vào ra nội dung bằng chứng thoát màn hình.
 *
 * Nút nhấp nháy vì đây là thứ phụ huynh dễ lướt qua nhất mà lại cần thấy nhất.
 * Nội dung bên trong CHỈ nêu số máy đo được và mốc giờ — không câu nào kết luận
 * gian lận, vì một cuộc gọi đến cũng cho đúng tín hiệu đó. */
export function KhoiViPham({ vp }: { vp: NonNullable<PhieuDayDu['viPham']> }) {
  const [mo, setMo] = useState(false)
  const coMoc = vp.moc.length > 0
  const daiNhat = vp.moc.reduce((n, m) => (m.giay !== null && m.giay > n ? m.giay : n), 0)
  return (
    <div className="bc-vp">
      <button type="button" className={`bc-vp-nut${mo ? '' : ' bc-nhay'}`} aria-expanded={mo} onClick={() => setMo((v) => !v)}>
        <span className="bc-vp-cham" />
        Vi phạm{vp.daKhoa ? ' — bài bị khoá' : ''}
        <span style={{ fontWeight: 400, opacity: 0.85 }}>{mo ? '· đóng lại' : '· chạm để xem bằng chứng'}</span>
      </button>
      <div className={`bc-hop${mo ? ' ra' : ''}`}>
        <div>
          <div className="bc-vp-in">
            <div className="bc-vp-so">
              <OSo so={vp.soLan} ten="lần rời khỏi màn làm bài" />
              <OSo so={vp.tongGiay > 0 ? giayChu(vp.tongGiay) : null} ten="tổng thời gian ở ngoài" />
              <OSo so={daiNhat > 0 ? giayChu(daiNhat) : null} ten="lần rời lâu nhất" />
            </div>

            {vp.nguong && (
              <div className="bc-vp-noi">
                Ngưỡng Thầy đặt cho bài này: rời <b>{vp.nguong.lan}</b> lần, hoặc một lần rời quá <b>{vp.nguong.giay}</b> giây, là máy tự khoá bài.
              </div>
            )}
            {vp.daKhoa && (
              <div className="bc-vp-noi" style={{ color: 'var(--p-do)' }}>
                Bài đã bị máy khoá và nộp tự động{vp.lyDoKhoa && LY_DO_KHOA[vp.lyDoKhoa] ? `, do ${LY_DO_KHOA[vp.lyDoKhoa]}` : ''}.
              </div>
            )}

            {coMoc && (
              <div style={{ marginTop: 12 }}>
                <div className="bc-tieu">Từng lần rời</div>
                <div style={{ marginTop: 4 }}>
                  {vp.moc.map((m, i) => (
                    <div className="bc-vp-hang" key={`${m.luc}-${i}`}>
                      <span style={{ color: 'var(--p-nhat)' }}>
                        Lần {i + 1} · {gioDayDu(m.luc)}
                      </span>
                      <span style={{ fontWeight: 700 }}>{m.giay === null ? 'không thấy quay lại' : giayChu(m.giay)}</span>
                    </div>
                  ))}
                </div>
                {vp.mocBiCat ? <div className="bc-vp-noi">Còn {vp.mocBiCat} lần nữa không liệt kê hết ở đây.</div> : null}
              </div>
            )}

            <div className="bc-vp-noi">
              Máy chỉ đo được em rời khỏi màn làm bài mấy lần, mấy giây. Một cuộc gọi đến, một thông báo, hay pin yếu cũng cho đúng tín hiệu này, nên đây là dữ kiện chứ không phải kết luận. Phụ huynh hỏi em, rồi nhắn lại cho Thầy.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------- màn hình
/** `duCoSan` = báo cáo đã dựng sẵn tại chỗ, không phải tải từ máy chủ. Dùng cho
 * màn "Đã nộp bài" của học sinh: máy em đã có đủ bài làm và ngân hàng đáp án,
 * không cần thầy tạo link trước, và cũng không mở thêm đường đọc nào trên máy
 * chủ. */
/** `laCuaEm` = trang này đang mở cho CHÍNH EM đọc (màn đã nộp bài), không phải
 * cho phụ huynh. Cùng một trang, khác người đọc, nên khác cách xưng hô — thầy
 * chốt 06/09: bản của em phải là "Thầy Đỗ Đại Học nhắc nhở em".
 *
 * Là một prop TƯỜNG MINH chứ không suy từ `duCoSan`: báo cáo dựng sẵn tại chỗ
 * không đồng nghĩa với người đọc là em. */
