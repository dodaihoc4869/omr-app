// Danh sách cần thầy hỗ trợ: tải theo nút, phân trang và gửi có biên nhận.
// Gửi hướng dẫn chỉ chuyển yêu cầu khỏi hàng chờ; em vẫn phải tự kiểm lại.
import { useEffect, useRef, useState } from 'react'
import { docCanGiupHoiThay, guiHoTroHoiThay, type GuiHoTroHoiThay, type MocCanGiupHoiThay, type YeuCauCanGiupHoiThay as YeuCau } from '../../lib/hoi-thay-gv-api'
import './can-giup-hoi-thay.css'

const khoaEm = (x: YeuCau) => JSON.stringify([x.sbd, x.qid])
const khoaNhom = (x: YeuCau) => JSON.stringify([x.lop, x.qid])
const moiId = () => `hoi-thay-${Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join('')}`
const gio = (luc: number) => new Date(luc).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })

export default function CanGiupHoiThay() {
  const [mo, setMo] = useState(false)
  const [ds, setDs] = useState<YeuCau[]>([])
  const [tong, setTong] = useState(0)
  const [sau, setSau] = useState<MocCanGiupHoiThay>()
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [banNhap, setBanNhap] = useState<Record<string, string>>({})
  const [gui, setGui] = useState<{ nhom: string; body: GuiHoTroHoiThay } | null>(null)
  const [dangGui, setDangGui] = useState(false)
  const [loiGui, setLoiGui] = useState<{ nhom: string; chu: string } | null>(null)
  const [thongBao, setThongBao] = useState('')
  const song = useRef(true), lanTai = useRef(0), khoaGui = useRef(false)
  useEffect(() => { song.current = true; return () => { song.current = false; lanTai.current++ } }, [])

  const tai = async (them = false) => {
    if (khoaGui.current) return
    const lan = ++lanTai.current
    setDangTai(true); setLoi(''); setMo(true)
    const r = await docCanGiupHoiThay('', them ? sau : undefined)
    if (!song.current || lan !== lanTai.current) return
    setDangTai(false)
    if (!r.ok) { setLoi(r.loi); return }
    setDs((cu) => {
      const gop = new Map<string, YeuCau>()
      for (const x of [...(them ? cu : []), ...r.du.ds]) {
        const truoc = gop.get(khoaEm(x))
        if (!truoc || x.revision >= truoc.revision) gop.set(khoaEm(x), x)
      }
      return [...gop.values()]
    })
    setTong(r.du.tong); setSau(r.du.sau)
  }

  const nhom = new Map<string, YeuCau[]>()
  for (const x of ds) {
    const k = khoaNhom(x), cu = nhom.get(k)
    if (cu) cu.push(x); else nhom.set(k, [x])
  }
  const cacNhom = [...nhom].sort((a, b) => b[1].length - a[1].length || b[1][0].capNhatLuc - a[1][0].capNhatLuc)

  const guiNhom = async (k: string, em: YeuCau[]) => {
    if (khoaGui.current || dangTai) return
    const body = gui?.nhom === k ? gui.body : {
      qid: em[0].qid, loiGo: (banNhap[k] ?? '').trim(), requestId: moiId(),
      em: em.slice(0, 50).map((x) => ({ sbd: x.sbd, revision: x.revision })),
    }
    if (!body.loiGo || (gui && gui.nhom !== k)) return
    khoaGui.current = true; setDangGui(true); setGui({ nhom: k, body }); setLoiGui(null); setThongBao('')
    const r = await guiHoTroHoiThay(body)
    if (!song.current) return
    khoaGui.current = false; setDangGui(false)
    if (!r.ok) {
      // Mất phản hồi: chưa biết máy chủ đã ghi hay chưa. Giữ nguyên nội dung và mã lần gửi.
      const chuaRo = r.ma === 'ket_noi' || !r.ma
      if (!chuaRo) setGui(null)
      setLoiGui({ nhom: k, chu: chuaRo ? `${r.loi} Thầy bấm Thử gửi lại để kiểm tra đúng lần gửi này.` : r.loi })
      return
    }
    setGui(null); setThongBao(r.du.thongBao || `Đã gửi hướng dẫn cho ${r.du.soEm} em. Các em sẽ tự kiểm lại.`)
    const daGui = new Set(body.em.map((x) => JSON.stringify([x.sbd, body.qid])))
    setDs((cu) => cu.filter((x) => !daGui.has(khoaEm(x))))
    setTong((cu) => Math.max(0, cu - r.du.soEm))
    // Tải lại tại chỗ để lấy phiên bản mới, không rời màn hoặc đánh dấu em đã hiểu.
    await tai()
  }

  return <section className="ht-can-giup" aria-label="Chỗ cần thầy giúp">
    <div className="ht-can-giup-dau">
      <div><h3>Chỗ cần thầy giúp</h3><p className="cd-phu">Gom các em cùng lớp, cùng câu để thầy hướng dẫn một lần.</p></div>
      <button type="button" className="m3-nut-chu m3-nut-vien" disabled={dangTai || !!gui} onClick={() => void tai()}>
        {dangTai ? 'Đang tải…' : mo ? 'Tải lại chỗ cần giúp' : 'Xem chỗ cần giúp'}
      </button>
    </div>
    {loi && <p className="cd-loi" role="alert">{loi}</p>}
    {thongBao && <p className="ht-can-giup-da-gui" role="status">{thongBao}</p>}
    {mo && <>
      <p className="ht-can-giup-tong" aria-live="polite">Đang xem <b>{ds.length}/{tong}</b> yêu cầu{cacNhom.length > 0 ? ` · ${cacNhom.length} nhóm trong danh sách đã tải` : ''}.</p>
      {!dangTai && !loi && tong === 0 && <p className="cd-phu">Chưa có em nào đang chờ thầy hỗ trợ.</p>}
      {cacNhom.length > 1 && <p className="cd-phu">Nhóm có nhiều em trong danh sách đã tải được xếp trước.</p>}
      <div className="ht-can-giup-ds">
        {cacNhom.map(([k, em]) => {
          const dau = em[0], dangCho = gui?.nhom === k
          return <article className="ht-can-giup-nhom" key={k}>
            <div className="ht-can-giup-nhan"><span>{dau.lop || 'Chưa có lớp'}</span><b>{em.length} em cần giúp</b></div>
            <h4>{dau.tieuDe || 'Câu học sinh đang hỏi'}</h4>
            <p className="cd-phu ht-can-giup-ma">Mã câu: {dau.qid}</p>
            <details><summary>Xem các em và chỗ đang vướng ({em.length} em)</summary>
              <ul>{em.map((x) => <li key={x.sbd}><b>{x.ten || x.sbd}</b> · SBD {x.sbd}<span>{x.lyDo || 'Em cần thầy giải thích thêm.'}</span><small>Gửi lúc {gio(x.guiLuc)}</small></li>)}</ul>
            </details>
            <label className="cd-truong">Hướng dẫn gửi các em
              <textarea rows={4} maxLength={4000} value={banNhap[k] ?? ''} disabled={dangCho} placeholder="Thầy chỉ rõ bước cần chú ý và cách để các em tự thử lại…" onChange={(e) => setBanNhap((cu) => ({ ...cu, [k]: e.target.value }))} />
            </label>
            <p className="cd-phu">Gửi hướng dẫn chưa xác nhận các em đã làm được. Các em vẫn sẽ tự kiểm lại.{em.length > 50 ? ' Mỗi lần gửi tối đa 50 em trong nhóm.' : ''}</p>
            {loiGui?.nhom === k && <p className="cd-loi" role="alert">{loiGui.chu}</p>}
            <button type="button" className="m3-nut-chinh" disabled={dangTai || dangGui || (!!gui && !dangCho) || (!dangCho && !(banNhap[k] ?? '').trim())} onClick={() => void guiNhom(k, em)}>
              {dangCho ? dangGui ? 'Đang gửi hướng dẫn…' : 'Thử gửi lại' : `Gửi hướng dẫn cho ${Math.min(50, em.length)} em`}
            </button>
          </article>
        })}
      </div>
      {sau && <button type="button" className="m3-nut-chu m3-nut-vien ht-can-giup-tiep" disabled={dangTai || !!gui} onClick={() => void tai(true)}>{dangTai ? 'Đang tải…' : 'Xem tiếp các yêu cầu'}</button>}
    </>}
  </section>
}
