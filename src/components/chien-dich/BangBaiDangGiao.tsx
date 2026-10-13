// Bài đang giao: một lệnh tổng hợp, giữ nguyên bảng khi cập nhật hoặc lưu hạn.
// Chỉ báo Đã lưu sau khi máy chủ xác nhận đúng từng bài/ngày; không tải lại bảng sau lưu.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { ngayVn, type GoiDu } from './goi7-ui'
import { chuDemGiao, chuHanDong, goiDangGiao, TOI_DA_DONG_GIAO } from './buoi-day-ui'
import './sua-han-bai.css'

const CHU_CHUA_CO_LENH = 'Máy chủ chưa có bảng bài 7 ngày.'
type ThongKe = { soEm: number; pGap: number | null; pTuLam: number | null }
type DuBang = { bat: boolean; goi: GoiDu[]; thongKe: Record<string, ThongKe> }
type SuaHan = { id: string; han: string; hanCu: string }
type SuaNhieu = { goi: GoiDu[]; chon: Set<string>; han: string }
const laHo = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const laNgay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s
const laPhanTram = (p: unknown): p is number | null => p === null || typeof p === 'number' && Number.isFinite(p) && p >= 0 && p <= 100

/** Số thiếu/sai dạng không biến thành 0% hoặc dữ liệu lớp khác. */
function docBang(d: Record<string, unknown>): DuBang | null {
  if (typeof d.bat !== 'boolean') return null
  if (!d.bat) return { bat: false, goi: [], thongKe: {} }
  if (!Array.isArray(d.goi) || !laHo(d.thongKe)) return null
  const goi: GoiDu[] = [], thongKe: Record<string, ThongKe> = {}
  for (const g of d.goi) {
    if (!laHo(g) || typeof g.id !== 'string' || !g.id || typeof g.ten !== 'string' || typeof g.lop !== 'string' || typeof g.han !== 'string' || !laNgay(g.han)) return null
    if (goi.some(cu => cu.id === g.id) || g.bat_dau !== undefined && (typeof g.bat_dau !== 'string' || !laNgay(g.bat_dau))) return null
    goi.push(g as unknown as GoiDu)
    const t = d.thongKe[g.id]
    if (laHo(t) && typeof t.soEm === 'number' && Number.isInteger(t.soEm) && t.soEm >= 0 && laPhanTram(t.pGap) && laPhanTram(t.pTuLam) && (t.pGap === null || t.pTuLam === null || t.pTuLam <= t.pGap)) {
      thongKe[g.id] = { soEm: t.soEm, pGap: t.soEm ? t.pGap : null, pTuLam: t.soEm ? t.pTuLam : null }
    }
  }
  const homNay = ngayVn()
  return { bat: true, goi: [...goiDangGiao(goi, homNay), ...goi.filter(g => g.han < homNay).sort((a, b) => b.han.localeCompare(a.han))], thongKe }
}

function Thanh({ p, nhan, loai }: { p: number | null; nhan: string; loai: 'gap' | 'tu-lam' }) {
  if (p === null) return <span className="gvv2-bdg-khong">Chưa có số</span>
  return (
    <span className="gvv2-bdg-thanh-o">
      <span className="gvv2-bdg-thanh" data-loai={loai} role="img" aria-label={`${nhan} ${p}%`}>
        <i style={{ width: `${Math.max(0, Math.min(100, p))}%` }} />
      </span>
      <b className="gvv2-so">{p}%</b>
    </span>
  )
}

export default function BangBaiDangGiao({ onMoChuaBai }: { onMoChuaBai?: () => void }) {
  const [du, setDu] = useState<DuBang | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState('')
  const [caCu, setCaCu] = useState(false)
  const [sua, setSua] = useState<SuaHan | null>(null)
  const [nhieu, setNhieu] = useState<SuaNhieu | null>(null)
  const [luu, setLuu] = useState(false)
  const [daLuu, setDaLuu] = useState<Record<string, string>>({})
  const [loiHan, setLoiHan] = useState('')
  const docLan = useRef(0), thayDoi = useRef(0), song = useRef(true), dangDoc = useRef(false), dangLuu = useRef(false)
  const idTieuDe = useId(), idNhieu = useId()
  const homNay = ngayVn()

  const tai = useCallback(async (caCu = false) => {
    if (dangDoc.current || dangLuu.current) return
    dangDoc.current = true
    const lan = ++docLan.current, ban = thayDoi.current
    setDangTai(true); setLoiTai('')
    try {
      const r = await goiLenh('/gv/goi-bai-7', { action: 'tong_hop', ...(caCu ? { caCu: true } : {}) }, CHU_CHUA_CO_LENH)
      if (!song.current || lan !== docLan.current || ban !== thayDoi.current) return
      const moi = r.ok ? docBang(r.du) : null
      if (!moi) { setLoiTai(r.ok ? 'Máy chủ trả lời chưa đủ số liệu. Thầy thử lại.' : r.chu); return }
      const theoId = new Map(moi.goi.map(g => [g.id, g]))
      setDu(moi)
      // Cập nhật sau lỗi 2 máy: giữ ngày thầy đang nhập, lấy hạn hiện tại để so khi lưu lại.
      setSua(cu => cu && theoId.has(cu.id) ? { ...cu, hanCu: theoId.get(cu.id)!.han } : null)
      setNhieu(cu => {
        if (!cu || !moi.bat) return null
        const goi = cu.goi.flatMap(g => theoId.has(g.id) ? [theoId.get(g.id)!] : [])
        return { ...cu, goi, chon: new Set([...cu.chon].filter(id => theoId.has(id))) }
      })
      setDaLuu(cu => Object.fromEntries(Object.entries(cu).filter(([id, han]) => theoId.get(id)?.han === han)))
      setLoiHan('')
    } catch {
      if (song.current && ban === thayDoi.current) setLoiTai('Không nối được máy chủ.')
    } finally {
      dangDoc.current = false
      if (song.current && lan === docLan.current) setDangTai(false)
    }
  }, [])
  useEffect(() => {
    song.current = true
    void tai()
    return () => { song.current = false }
  }, [tai])

  // Lọc metadata ở máy thầy ngay; số liệu quá hạn đọc bằng một tổng hợp giới hạn, giữ nguyên bảng.
  const tatCa = du?.goi.filter(g => caCu || g.han >= homNay) ?? []
  const dong = tatCa.slice(0, TOI_DA_DONG_GIAO)
  const conNua = tatCa.length - dong.length
  const cacGoiSua = nhieu ? nhieu.goi.filter(g => nhieu.chon.has(g.id)) : []
  const nhieuDaLuu = !!nhieu && cacGoiSua.length > 0 && cacGoiSua.every(g => daLuu[g.id] === nhieu.han)
  const minHan = cacGoiSua.reduce((n, g) => g.bat_dau && g.bat_dau > n ? g.bat_dau : n, homNay)

  const luuHan = async () => {
    if (dangLuu.current || (!sua && !nhieu)) return
    const goi = nhieu ? cacGoiSua : [{ id: sua!.id, han: sua!.hanCu }]
    const han = nhieu?.han ?? sua!.han
    const min = nhieu ? minHan : du?.goi.find(g => g.id === sua!.id)?.bat_dau ?? homNay
    if (!goi.length) { setLoiHan('Thầy chọn ít nhất một lớp để sửa hạn.'); return }
    if (!laNgay(han) || han < homNay || han < min) { setLoiHan('Thầy chọn hạn từ hôm nay và không trước ngày giao bài.'); return }
    if (goi.every(g => daLuu[g.id] === han)) return
    dangLuu.current = true
    ++thayDoi.current // Lượt đọc cũ không được đè hạn vừa lưu hoặc ngày thầy đang chọn.
    setLuu(true); setLoiHan('')
    try {
      const body = nhieu
        ? { action: 'sua_han_hang_loat', goi: goi.map(g => ({ goiId: g.id, hanCu: g.han })), han }
        : { action: 'sua_han', goiId: sua!.id, han, hanCu: sua!.hanCu }
      const r = await goiLenh('/gv/goi-bai-7', body, CHU_CHUA_CO_LENH)
      if (!song.current) return
      if (!r.ok) { setLoiHan(r.chu); return }
      const kq = nhieu ? r.du.ketQua : [{ goiId: r.du.goiId, han: r.du.han, ok: true }]
      const ids = new Set(goi.map(g => g.id))
      if (!Array.isArray(kq) || kq.length !== ids.size || !kq.every(x => laHo(x) && x.ok === true && x.han === han && typeof x.goiId === 'string' && ids.delete(x.goiId)) || ids.size) {
        setLoiHan('Chưa nhận được xác nhận lưu hạn. Thầy cập nhật rồi thử lại.'); return
      }
      const daDoi = new Set(goi.map(g => g.id))
      setDu(cu => cu ? { ...cu, goi: cu.goi.map(g => daDoi.has(g.id) ? { ...g, han } : g) } : cu)
      setDaLuu(cu => ({ ...cu, ...Object.fromEntries(goi.map(g => [g.id, han])) }))
      setSua(cu => cu ? { ...cu, hanCu: han } : cu)
      setNhieu(cu => cu ? { ...cu, goi: cu.goi.map(g => daDoi.has(g.id) ? { ...g, han } : g) } : cu)
    } catch {
      if (song.current) setLoiHan('Không nối được máy chủ. Ngày thầy đã chọn vẫn được giữ để thử lại.')
    } finally {
      dangLuu.current = false
      if (song.current) setLuu(false)
    }
  }
  const batSua = (g: GoiDu) => {
    setSua({ id: g.id, han: g.han < homNay ? homNay : g.han, hanCu: g.han })
    setNhieu(null); setLoiHan('')
    setDaLuu(cu => { const moi = { ...cu }; delete moi[g.id]; return moi })
  }
  const huySua = () => { setSua(null); setNhieu(null); setLoiHan('') }
  const bamLuu = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); void luuHan() }
  const enterLuu = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); void luuHan() } }
  const capNhat = (
    <button type="button" className="gvv2-nut-chu" onClick={() => void tai(caCu)} disabled={dangTai || luu} aria-busy={dangTai}>
      <RefreshCw size={16} aria-hidden="true" /> {dangTai ? 'Đang cập nhật…' : 'Cập nhật'}
    </button>
  )

  return (
    <div className="gvv2-bdg" data-khoi="bai-dang-giao" role="region" aria-labelledby={idTieuDe}>
      <div className="gvv2-bdg-dau">
        <h3 id={idTieuDe} className="gvv2-bdg-ten">
          Bài đang giao{du?.bat && dong.length > 0 ? ` · ${chuDemGiao(dong)}` : ''}
        </h3>
        {du?.bat && dong.length > 0 && <span className="gvv2-bdg-chu-thich">Mỗi thanh: phần câu gốc cả lớp đã gặp / đã tự làm</span>}
        {du && capNhat}
      </div>
      {du?.bat && <div className="gvv2-bdg-cong-cu">
        <label className="gvv2-bdg-cu"><input type="checkbox" checked={caCu} disabled={luu || !!nhieu || dangTai} onChange={e => { setCaCu(e.target.checked); huySua(); void tai(e.target.checked) }} /> Hiện cả bài đã quá hạn để sửa</label>
        {dong.length > 0 && <button type="button" className="gvv2-nut-chu" disabled={luu} aria-expanded={!!nhieu} onClick={() => { setNhieu({ goi: dong, chon: new Set(dong.map(g => g.id)), han: dong.reduce((h, g) => g.han > h ? g.han : h, homNay) }); setSua(null); setLoiHan('') }}>Sửa hạn hàng loạt</button>}
      </div>}
      {nhieu && <div className="gvv2-bdg-hang-loat" role="group" aria-labelledby={idNhieu}>
        <h4 id={idNhieu}>Sửa hạn hàng loạt · {cacGoiSua.length} bài được chọn</h4>
        <label className="gvv2-bdg-cu"><input type="checkbox" disabled={luu} checked={nhieu.chon.size === nhieu.goi.length} onChange={e => setNhieu({ ...nhieu, chon: e.target.checked ? new Set(nhieu.goi.map(g => g.id)) : new Set() })} /> Chọn tất cả bài trong bảng</label>
        <div className="gvv2-bdg-chon-nhieu">{nhieu.goi.map(g => <label className="gvv2-bdg-cu" key={g.id}><input type="checkbox" disabled={luu} checked={nhieu.chon.has(g.id)} onChange={e => { const chon = new Set(nhieu.chon); if (e.target.checked) chon.add(g.id); else chon.delete(g.id); setNhieu({ ...nhieu, chon }) }} aria-label={`Chọn ${g.ten} · ${g.lop}`} /> {g.lop} · {g.ten}</label>)}</div>
        <div className="gvv2-bdg-sua-han">
          <label>Hạn mới chung · 23:59 giờ Việt Nam<input autoFocus type="date" required min={minHan} value={nhieu.han} disabled={luu} onKeyDown={enterLuu} onChange={e => setNhieu({ ...nhieu, han: e.target.value })} /></label>
          <span><button type="button" className="gvv2-nut-chu" disabled={luu || nhieuDaLuu} onClick={bamLuu}>{luu ? 'Đang lưu…' : 'Lưu hạn các lớp'}</button><button type="button" className="gvv2-nut-chu" disabled={luu} onClick={huySua}>{nhieuDaLuu ? 'Đóng' : 'Hủy'}</button></span>
          <span className="gvv2-bdg-da-luu" role="status" title="Kế hoạch từng em tự tính lại theo tiến độ còn thiếu và lịch kiểm tra.">{nhieuDaLuu ? `Đã lưu hạn mới cho ${cacGoiSua.length} bài` : ''}</span>
          {loiHan && <p role="alert">{loiHan}</p>}
        </div>
      </div>}
      {loiTai && <p className="dh-loi" role="alert">{du ? 'Chưa cập nhật được bài đang giao: ' : 'Chưa tải được bài đang giao: '}{loiTai}</p>}

      {!du && dangTai ? (
        <div className="gvv2-bdg-xuong" role="status" aria-label="Đang tải bài đang giao">
          {[0, 1, 2].map((k) => (
            <span key={k} className="tt-xuong" style={{ display: 'block', width: '100%', height: 44, borderRadius: 12 }} />
          ))}
        </div>
      ) : !du ? null : !du.bat ? (
        <p className="dh-phu">Máy chủ chưa bật giao bài 7 ngày — bảng này hiện khi app bắt đầu giao bài theo bài thầy tick.</p>
      ) : dong.length === 0 ? (
        <p className="dh-phu">Chưa lớp nào đang có bài giao. Tick bài vừa dạy ở trên: app giao bài đó cho lớp trong 7 ngày.</p>
      ) : (
        <>
          <div className="gvv2-bdg-cuon">
            <table className="gvv2-bdg-bang">
              <thead>
                <tr>
                  <th scope="col">Lớp</th>
                  <th scope="col">Bài</th>
                  <th scope="col">Hạn nộp</th>
                  <th scope="col">Đã gặp câu gốc</th>
                  <th scope="col">Đã tự làm</th>
                </tr>
              </thead>
              <tbody>
                {dong.map((g) => {
                  const ct = du.thongKe[g.id]
                  const han = chuHanDong(g.han, homNay)
                  return (
                    <tr key={g.id} data-khoi="dong-giao" data-so-em={ct?.soEm}>
                      <td data-nhan="Lớp">
                        <span className="gvv2-bdg-lop">
                          <b>{g.lop || 'Chưa rõ lớp'}</b>
                          {ct && <small className="gvv2-so">{ct.soEm} em</small>}
                        </span>
                      </td>
                      <td data-nhan="Bài">
                        <span className="gvv2-bdg-bai">{g.ten}</span>
                      </td>
                      <td data-nhan="Hạn nộp">
                        {sua?.id === g.id ? <div className="gvv2-bdg-sua-han" role="group" aria-label={`Sửa hạn ${g.ten} · ${g.lop}`}>
                          <label>Hạn mới · 23:59 giờ Việt Nam<input autoFocus type="date" required min={homNay > String(g.bat_dau ?? '') ? homNay : g.bat_dau} value={sua.han} disabled={luu} aria-label={`Hạn mới của ${g.ten} · ${g.lop}`} onKeyDown={enterLuu} onChange={e => setSua({ ...sua, han: e.target.value })} /></label>
                          <span><button type="button" className="gvv2-nut-chu" disabled={luu || daLuu[g.id] === sua.han} onClick={bamLuu}>{luu ? 'Đang lưu…' : 'Lưu hạn'}</button><button type="button" className="gvv2-nut-chu" disabled={luu} onClick={huySua}>{daLuu[g.id] === sua.han ? 'Đóng' : 'Hủy'}</button></span>
                          <span className="gvv2-bdg-da-luu" role="status" title="Kế hoạch từng em tự tính lại theo tiến độ còn thiếu và lịch kiểm tra.">{daLuu[g.id] === sua.han ? 'Đã lưu hạn mới' : ''}</span>
                          {loiHan && <p role="alert">{loiHan}</p>}
                        </div> : <div className="gvv2-bdg-han-o">
                          <span className="gvv2-bdg-han" title={han.du}><span className="gvv2-so">{han.ngan}</span>{han.con && <small>{han.con}</small>}</span>
                          <button type="button" className="gvv2-nut-chu" aria-label={`Sửa hạn ${g.ten} · ${g.lop}`} disabled={luu || !!nhieu} onClick={() => batSua(g)}>Sửa hạn</button>
                          <span className="gvv2-bdg-da-luu" role="status" title="Kế hoạch từng em tự tính lại theo tiến độ còn thiếu và lịch kiểm tra.">{daLuu[g.id] === g.han ? 'Đã lưu hạn mới' : ''}</span>
                        </div>}

                      </td>
                      {!ct ? (
                        <td colSpan={2} data-nhan="Tiến độ" className="gvv2-bdg-canh">
                          {dangTai ? <span role="status">Đang tải số liệu của bài này…</span> : 'Chưa tải được số liệu của bài này — bấm Cập nhật.'}
                        </td>
                      ) : ct.soEm === 0 ? (
                        <td colSpan={2} data-nhan="Tiến độ" className="gvv2-bdg-canh" data-khoi="chua-em-nhan">
                          Chưa em nào nhận bài · kiểm lại danh sách lớp
                        </td>
                      ) : (
                        <>
                          <td data-nhan="Đã gặp câu gốc">
                            <Thanh p={ct.pGap} nhan="Đã gặp câu gốc" loai="gap" />
                          </td>
                          <td data-nhan="Đã tự làm">
                            <Thanh p={ct.pTuLam} nhan="Đã tự làm" loai="tu-lam" />
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {conNua > 0 && <p className="dh-phu">Còn {conNua} bài đang giao khác (bảng hiện {TOI_DA_DONG_GIAO} bài hạn nộp gần nhất).</p>}
          {onMoChuaBai && (
            <button type="button" className="gvv2-nut-chu gvv2-bdg-sang" onClick={onMoChuaBai}>
              Câu nhiều em sai của các bài này nằm ở mục Chữa bài ›
            </button>
          )}
        </>
      )}
      {loiTai && (
        <button type="button" className="gvv2-nut-vien" disabled={dangTai || luu} onClick={() => void tai(caCu)}>
          Thử lại
        </button>
      )}
    </div>
  )
}
