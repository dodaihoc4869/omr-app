// DUYỆT BÀI BỔ SUNG (thầy chốt bản vẽ 01/11, docs/ban-ve-trong-2610/gv-duyet-bo-sung.html): thầy «bỏ chỗ này khi bấm vào ca thi … nếu cần duyệt thì cho
// hiện rõ vào 1 chỗ đẹp hơn chuyên nghiệp hơn». Khối cũ ở màn Theo dõi ca (KhungBaiBoSung) đã gỡ; việc duyệt chỉ còn ở Hôm nay › Việc cần thầy › tấm này.
//   · Xếp THEO CA (ca có bài chờ lâu nhất lên đầu), mỗi em một dòng gọn: tên · SBD, số câu làm thêm, gửi lúc mấy giờ, sau khi máy chủ chốt bao lâu.
//   · Hai nút Bỏ / Nhận mỗi dòng; ca từ 2 bài trở lên có «Nhận cả N bài». Xử lý xong dòng đó hiện kết quả tại chỗ (không biến mất đột ngột).
//   · Nhận ⇒ máy chủ gộp câu làm thêm vào bài và chấm lại ca; Bỏ ⇒ giữ điểm cũ (server/src/bai-bo-sung.ts, không đổi).
// Nạp LƯỜI khi thầy bấm «Duyệt» (mảnh riêng, kho chạy-lúc). Màu: chỉ biến --tr-* (duyet-bo-sung.css).
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Check, ClipboardCheck, Info } from 'lucide-react'
import { xuLyBaiBoSung, type BaiBoSung } from '../../lib/bai-bo-sung'
import './duyet-bo-sung.css'

const hai = (n: number) => String(n).padStart(2, '0')
/** «19:54 · 25/10» theo giờ Việt Nam (máy thầy). Thuần. */
export function gioNgay(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const vn = new Date(d.getTime() + 7 * 3_600_000)
  return `${hai(vn.getUTCHours())}:${hai(vn.getUTCMinutes())} · ${hai(vn.getUTCDate())}/${hai(vn.getUTCMonth() + 1)}`
}
/** «sau chốt 2 phút / 3 giờ / 21 ngày». Thuần. */
export function sauChot(gui: string, chot: string): string {
  const ms = Date.parse(gui) - Date.parse(chot)
  if (!Number.isFinite(ms) || ms < 0) return ''
  const phut = Math.max(1, Math.round(ms / 60_000))
  if (phut < 60) return `sau chốt ${phut} phút`
  const gio = Math.round(phut / 60)
  if (gio < 48) return `sau chốt ${gio} giờ`
  return `sau chốt ${Math.round(gio / 24)} ngày`
}
/** Gom theo ca; ca có bài gửi sớm nhất lên đầu, trong ca theo giờ gửi. Thuần (có test). */
export function gomTheoCa(ds: readonly BaiBoSung[]): { maCa: string; tenCa: string; nopLuc: string; bai: BaiBoSung[] }[] {
  const theo = new Map<string, BaiBoSung[]>()
  for (const b of ds) theo.set(b.maCa, [...(theo.get(b.maCa) ?? []), b])
  return [...theo.entries()]
    .map(([maCa, bai]) => {
      const xep = [...bai].sort((a, b) => a.guiLuc.localeCompare(b.guiLuc))
      const nop = xep.map((b) => b.nopLuc).filter(Boolean).sort()
      return { maCa, tenCa: xep[0]!.tenCa || maCa, nopLuc: nop[nop.length - 1] ?? '', bai: xep }
    })
    .sort((a, b) => a.bai[0]!.guiLuc.localeCompare(b.bai[0]!.guiLuc))
}
const viet = (ten: string) => ten.trim().split(/\s+/).slice(-2).map((x) => x[0] ?? '').join('').toUpperCase() || 'HS'

type KetQua = { nhan: boolean; chu: string } | { loi: string }

export default function DuyetBoSung({ ds, matKhau, onDong }: { ds: readonly BaiBoSung[]; matKhau: () => Promise<string>; onDong: () => void }) {
  const nhom = useMemo(() => gomTheoCa(ds), [ds])
  const [kq, setKq] = useState<Record<string, KetQua>>({})
  const [dang, setDang] = useState<ReadonlySet<string>>(new Set())
  const nutVe = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    nutVe.current?.focus()
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') onDong() }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [onDong])

  const xuLy = async (bai: readonly BaiBoSung[], nhan: boolean) => {
    const viec = bai.filter((b) => !kq[b.khoa] || 'loi' in kq[b.khoa]!)
    if (!viec.length) return
    setDang((s) => new Set([...s, ...viec.map((b) => b.khoa)]))
    const m = await matKhau().catch(() => '')
    // tuần tự: mỗi lần Nhận máy chủ chấm lại cả ca — không bắn song song cùng một ca
    for (const b of viec) {
      let ra: KetQua
      try {
        if (!m) throw new Error('Máy này chưa có mã bí mật của thầy')
        const r = await xuLyBaiBoSung(m, b.khoa, nhan)
        ra = { nhan, chu: nhan ? (r.chamLai ? `Đã nhận · đã chấm lại ca ${b.tenCa || b.maCa}` : 'Đã nhận · điểm chấm khi ca đóng') : 'Đã bỏ · giữ điểm cũ' }
      } catch (e) {
        ra = { loi: e instanceof Error ? e.message : String(e) }
      }
      setKq((x) => ({ ...x, [b.khoa]: ra }))
      setDang((s) => { const n = new Set(s); n.delete(b.khoa); return n })
    }
  }

  const con = ds.filter((b) => !kq[b.khoa] || 'loi' in kq[b.khoa]!).length
  const cuNhat = [...ds].map((b) => b.guiLuc).filter(Boolean).sort()[0]
  const phu = `${con} bài chờ · ${nhom.length} ca kiểm tra${cuNhat ? ` · cũ nhất ${gioNgay(cuNhat).split(' · ')[1]}` : ''}`

  return createPortal(
    <div className="m3 m3-thay vo-thay" style={{ display: 'contents' }}>
      <div className="dbs-man" role="dialog" aria-modal="true" aria-labelledby="dbs-tieu">
        <header className="dbs-tren">
          <button ref={nutVe} type="button" className="dbs-ve tt-nhan" onClick={onDong}>
            <ArrowLeft size={18} aria-hidden="true" />
            Hôm nay
          </button>
          <div className="dbs-tren-chu">
            <h1 id="dbs-tieu">Bài bổ sung chờ duyệt</h1>
            <p className="gvv2-so">{phu}</p>
          </div>
        </header>
        <div className="dbs-than">
          <div className="dbs-khung">
            <p className="dbs-ghi">
              <Info size={18} aria-hidden="true" />
              <span>
                Máy em còn giữ câu làm thêm, nhưng máy chủ đã chốt bài trước khi nhận được. <b>Nhận</b>: gộp câu làm thêm vào bài và chấm lại ca.{' '}
                <b>Bỏ</b>: giữ điểm cũ.
              </span>
            </p>
            {nhom.length === 0 && <p className="dbs-trong">Không còn bài bổ sung nào chờ duyệt.</p>}
            {nhom.map((n) => {
              const cho = n.bai.filter((b) => !kq[b.khoa] || 'loi' in kq[b.khoa]!)
              return (
                <section key={n.maCa} className="dbs-the" aria-label={`Ca ${n.tenCa}`}>
                  <div className="dbs-nhom">
                    <span className="dbs-o" aria-hidden="true"><ClipboardCheck size={20} /></span>
                    <div className="dbs-nhom-chu">
                      <h2>{n.tenCa}</h2>
                      <p className="gvv2-so">{n.nopLuc ? `Máy chủ chốt bài ${gioNgay(n.nopLuc)} · ` : ''}{cho.length ? `${cho.length} bài chờ` : 'đã xử lý hết'}</p>
                    </div>
                    {cho.length >= 2 && (
                      <button type="button" className="dbs-nut dbs-nut-nhe tt-nhan" disabled={cho.some((b) => dang.has(b.khoa))} onClick={() => void xuLy(cho, true)}>
                        Nhận cả {cho.length} bài
                      </button>
                    )}
                  </div>
                  <ul className="dbs-ds">
                    {n.bai.map((b) => {
                      const r = kq[b.khoa]
                      const xong = r && !('loi' in r)
                      const ten = b.hoTen || 'Học sinh'
                      return (
                        <li key={b.khoa} className="dbs-dong" data-xong={xong ? '' : undefined}>
                          <span className="dbs-av" aria-hidden="true">{viet(ten)}</span>
                          <div className="dbs-dong-chu">
                            <p className="dbs-ten">{ten} <small className="gvv2-so">SBD {b.sbd}</small></p>
                            {xong ? (
                              <p className="dbs-mo" data-ket={r.nhan ? 'nhan' : 'bo'}>{r.chu}</p>
                            ) : (
                              <p className="dbs-mo gvv2-so">
                                <b>{b.soCauMoi} câu</b> làm thêm · gửi {gioNgay(b.guiLuc)}{b.nopLuc && sauChot(b.guiLuc, b.nopLuc) ? `, ${sauChot(b.guiLuc, b.nopLuc)}` : ''}
                              </p>
                            )}
                            {r && 'loi' in r && <p className="dbs-loi" role="alert">Chưa xử lý được: {r.loi}</p>}
                          </div>
                          <div className="dbs-hai">
                            {xong ? (
                              <span className="dbs-xong"><Check size={16} aria-hidden="true" /> Xong</span>
                            ) : (
                              <>
                                <button type="button" className="dbs-nut dbs-nut-trong tt-nhan" disabled={dang.has(b.khoa)} onClick={() => void xuLy([b], false)} aria-label={`Bỏ bài bổ sung của ${ten}`}>
                                  Bỏ
                                </button>
                                <button type="button" className="dbs-nut tt-nhan" disabled={dang.has(b.khoa)} onClick={() => void xuLy([b], true)} aria-label={`Nhận bài bổ sung của ${ten}`}>
                                  {dang.has(b.khoa) ? '…' : 'Nhận'}
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
