// LÀM CÂU ÔN (việc on_lai của Bảng nhiệm vụ) — mặc Material 3 ngay từ đầu. Vòng: lấy đề → em làm → nộp → hiện đáp án/lời giải.
// Luật máy chủ (docs/ke-hoach-ngay-api-1909.md): đáp án chỉ về SAU khi ghi sổ; câu CHƯA TRẢ LỜI không ghi sổ, không khoá, không có
// lời giải (nằm trong `chuaLam`) ⇒ giao diện nói rõ "chưa được tính, em làm nốt" chứ KHÔNG coi là sai; nộp lại cùng câu cùng ngày giữ
// kết quả lần đầu ⇒ câu đã chấm KHOÁ ô đáp án. Màu chỉ đọc biến --m3-* (lam-cau-on.css), không mã màu cứng.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CircleAlert, RefreshCw, X } from 'lucide-react'
import '../m3'
import './lam-cau-on.css'
import { MomOption, MomQuestionStem } from '../MomQuestionMedia'
import { LoiGiaiCauSai } from '../KhoiCauSai'
import { HinhTaiViTri } from '../QuestionMedia'
import { nopOnLai, taiCauTheoQid, type CauOn, type KetQuaCauOn, type PhanHoiNopOn, type TienBoOn } from './cau-on-api'

const KY_TU = ['A', 'B', 'C', 'D', 'E', 'F']
const NHAN_PHAN: Record<CauOn['phan'], string> = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng / Sai', III: 'Phần III · Trả lời ngắn' }

export interface LamCauOnProps {
  token: string
  /** SBD chỉ để đặt khoá lưu nháp trong máy. */
  sbd?: string
  /** `viec.id` của kế hoạch (vd `on_lai:2026-09-19`) — cùng ngày cùng bộ câu nên nháp dùng lại được. */
  viecId: string
  qid: string[]
  tieuDe?: string
  /** Bấm "Xong": đóng sheet về Bảng nhiệm vụ (màn cổng tự hỏi lại kế hoạch khi sheet đóng). */
  onXong: () => void
}

type Pha = 'tai' | 'loi' | 'lam'

const khoaNhap = (sbd: string | undefined, viecId: string) => `omr_cauon:${sbd || 'khach'}:${viecId}`

function docNhap(khoa: string, hopLe: Set<string>): Record<string, string> {
  try {
    const t = JSON.parse(localStorage.getItem(khoa) || '{}')
    const kq: Record<string, string> = {}
    if (t && typeof t === 'object') for (const [k, v] of Object.entries(t)) if (hopLe.has(k) && typeof v === 'string') kq[k] = v
    return kq
  } catch {
    return {}
  }
}

/** Đã trả lời đủ chưa: Phần I có chữ; Phần II đủ 4 ý; Phần III có chữ. */
export function daTraLoi(c: CauOn, dapAn: string | undefined): boolean {
  const v = dapAn || ''
  if (c.phan === 'II') return v.length === 4 && !v.includes('-') && /^[DS]{4}$/.test(v)
  if (c.phan === 'III') return v.trim() !== ''
  return /^[A-F]$/.test(v)
}

const chuanDS = (s: string) => s.replace(/[Đđ]/g, 'D').toUpperCase().replace(/[^DS]/g, '')

export default function LamCauOn({ token, sbd, viecId, qid, tieuDe, onXong }: LamCauOnProps) {
  const [pha, setPha] = useState<Pha>('tai')
  const [loiTai, setLoiTai] = useState('')
  const [cau, setCau] = useState<CauOn[]>([])
  const [khongCo, setKhongCo] = useState<string[]>([])
  const [traLoi, setTraLoi] = useState<Record<string, string>>({})
  const [ketQua, setKetQua] = useState<Record<string, KetQuaCauOn>>({})
  const [chuaLam, setChuaLam] = useState<string[]>([])
  const [tienBo, setTienBo] = useState<TienBoOn | null>(null)
  const [exp, setExp] = useState(0)
  const [dangNop, setDangNop] = useState(false)
  const [loiNop, setLoiNop] = useState('')
  const [daNopLan, setDaNopLan] = useState(0)
  const [lanTai, setLanTai] = useState(0)
  const dauTrang = useRef<HTMLDivElement>(null)
  const khoa = khoaNhap(sbd, viecId)
  const khoaQid = qid.join('|')

  // ─── (1) lấy đề ───
  useEffect(() => {
    let huy = false
    setPha('tai')
    void taiCauTheoQid(token, qid).then((r) => {
      if (huy) return
      if (!r.ok) {
        setLoiTai(r.loi)
        setPha('loi')
        return
      }
      setCau(r.cau)
      setKhongCo(r.khongCo)
      setTraLoi(docNhap(khoa, new Set(r.cau.map((c) => c.qid))))
      setPha('lam')
    })
    return () => {
      huy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, khoaQid, lanTai])

  // ─── nháp trong máy (chỉ câu chưa chấm) ───
  useEffect(() => {
    if (pha !== 'lam') return
    try {
      const nhap: Record<string, string> = {}
      for (const [k, v] of Object.entries(traLoi)) if (!ketQua[k] && v) nhap[k] = v
      localStorage.setItem(khoa, JSON.stringify(nhap))
    } catch {
      /* máy đầy/riêng tư: không nhớ được thì thôi */
    }
  }, [traLoi, ketQua, pha, khoa])

  const chon = useCallback((q: string, gia: string) => setTraLoi((t) => ({ ...t, [q]: gia })), [])
  const chonY = useCallback((q: string, i: number, v: 'D' | 'S') => {
    setTraLoi((t) => {
      const a = (t[q] && t[q].length === 4 ? t[q] : '----').split('')
      a[i] = v
      return { ...t, [q]: a.join('') }
    })
  }, [])

  const dsChuaCham = useMemo(() => cau.filter((c) => !ketQua[c.qid]), [cau, ketQua])
  const soDaTraLoi = useMemo(() => dsChuaCham.filter((c) => daTraLoi(c, traLoi[c.qid])).length, [dsChuaCham, traLoi])
  const soChuaTraLoi = dsChuaCham.length - soDaTraLoi
  const xongHet = pha === 'lam' && cau.length > 0 && dsChuaCham.length === 0

  // ─── (3) nộp ───
  const nop = async () => {
    if (dangNop) return
    const gui = dsChuaCham.filter((c) => daTraLoi(c, traLoi[c.qid])).map((c) => ({ qid: c.qid, dapAn: c.phan === 'II' ? chuanDS(traLoi[c.qid]) : (traLoi[c.qid] || '').trim() }))
    if (gui.length === 0) return
    setDangNop(true)
    setLoiNop('')
    const r: PhanHoiNopOn = await nopOnLai(token, gui)
    setDangNop(false)
    if (!r.ok) {
      setLoiNop(r.error || 'Chưa nộp được. Em thử lại.')
      return
    }
    setKetQua((truoc) => {
      const moi = { ...truoc }
      // Nộp lại giữ kết quả LẦN ĐẦU: câu đã có kết quả thì không ghi đè.
      for (const k of r.ketQua || []) if (!moi[k.qid]) moi[k.qid] = k
      return moi
    })
    setChuaLam(r.chuaLam || [])
    if (r.tienBo) setTienBo(r.tienBo)
    setExp((e) => e + (r.exp && r.exp > 0 ? r.exp : 0))
    setDaNopLan((n) => n + 1)
  }

  // Sau mỗi lần nộp thành công: kéo về đầu để thấy tổng kết (không cuộn mượt khi giảm chuyển động).
  useEffect(() => {
    if (daNopLan === 0) return
    const giam = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    dauTrang.current?.scrollIntoView?.({ behavior: giam ? 'auto' : 'smooth', block: 'start' })
  }, [daNopLan])

  const soChamDung = Object.values(ketQua).filter((k) => k.dung).length
  const soCham = Object.keys(ketQua).length

  return (
    <div className="lco" ref={dauTrang}>
      <section className="lco-dau" aria-labelledby="lco-tieu-de">
        <h2 id="lco-tieu-de" className="lco-tieu-de">
          {tieuDe || 'Ôn câu hôm nay'}
        </h2>
        {pha === 'lam' && (
          <p className="lco-phu">
            Chọn đáp án cho từng câu rồi bấm <b>Nộp</b>. Câu chưa trả lời <b>chưa được tính</b> và không bị coi là sai — em làm nốt sau cũng được.
          </p>
        )}
        {pha === 'lam' && cau.length > 0 && (
          <div className="lco-hang-chip">
            <span className="m3-chip" data-vai-tro="primary">
              Đã trả lời {soDaTraLoi + soCham}/{cau.length} câu
            </span>
            {soCham > 0 && (
              <span className="m3-chip" data-vai-tro="tertiary">
                Đã chấm {soCham} · đúng {soChamDung}
              </span>
            )}
          </div>
        )}
      </section>

      {pha === 'tai' && (
        <div className="lco-tai" aria-busy="true" aria-live="polite">
          <span className="lco-sr">Đang tải câu ôn</span>
          <div className="m3-xuong" style={{ height: 96 }} />
          <div className="m3-xuong" style={{ height: 176 }} />
          <div className="m3-xuong" style={{ height: 176 }} />
        </div>
      )}

      {pha === 'loi' && (
        <div className="lco-thong-bao" role="alert" data-vai-tro="error">
          <CircleAlert size={22} aria-hidden="true" />
          <div>
            <p className="lco-thong-bao-chu">{loiTai}</p>
            <button type="button" className="m3-nut-vien" onClick={() => setLanTai((n) => n + 1)}>
              <RefreshCw size={18} aria-hidden="true" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      )}

      {pha === 'lam' && daNopLan > 0 && (
        <section className="lco-tong-ket" aria-live="polite" aria-label="Kết quả lượt nộp">
          <p className="lco-tong-ket-chinh">
            Đúng {soChamDung}/{soCham} câu đã chấm
          </p>
          {tienBo && (
            <p className="lco-phu">
              Hôm nay em đã ôn {tienBo.daLamCau} câu · lên bậc {tienBo.lenBac} · tụt bậc {tienBo.tutBac}
            </p>
          )}
          {exp > 0 && <p className="lco-exp">+{exp} EXP học tập</p>}
          {soChuaTraLoi > 0 && (
            <p className="lco-nhac">
              Còn {soChuaTraLoi} câu chưa trả lời — <b>chưa được tính</b>. Em làm nốt rồi nộp tiếp.
            </p>
          )}
        </section>
      )}

      {pha === 'lam' && cau.length === 0 && (
        <div className="lco-thong-bao" role="status" data-vai-tro="secondary">
          <CircleAlert size={22} aria-hidden="true" />
          <p className="lco-thong-bao-chu">Chưa mở được câu nào của việc này. Em quay lại Bảng nhiệm vụ, lát nữa thử lại.</p>
        </div>
      )}

      {pha === 'lam' && (
        <ol className="lco-ds">
          {cau.map((c, i) => (
            <TheCauOn
              key={c.qid}
              c={c}
              so={i + 1}
              dapAn={traLoi[c.qid] || ''}
              ketQua={ketQua[c.qid]}
              chuaTraLoi={chuaLam.includes(c.qid) || (daNopLan > 0 && !ketQua[c.qid] && !daTraLoi(c, traLoi[c.qid]))}
              khoa={dangNop}
              onChon={(g) => chon(c.qid, g)}
              onChonY={(y, v) => chonY(c.qid, y, v)}
            />
          ))}
          {khongCo.map((q, i) => (
            <li key={q} className="lco-the lco-the--khong-co" data-vai-tro="secondary">
              <p className="lco-the-ten">Câu {cau.length + i + 1}</p>
              <p className="lco-phu">Chưa mở được câu này. Em bỏ qua nó, các câu khác vẫn làm bình thường.</p>
            </li>
          ))}
        </ol>
      )}

      {pha === 'lam' && cau.length > 0 && (
        <div className="lco-day">
          {loiNop && (
            <p className="lco-loi-nop" role="alert">
              {loiNop}
            </p>
          )}
          <div className="lco-day-hang">
            {xongHet ? (
              <>
                <p className="lco-day-chu">Em đã làm xong việc này</p>
                <button type="button" className="m3-nut-chinh" onClick={onXong}>
                  <Check size={20} aria-hidden="true" />
                  <span>Xong</span>
                </button>
              </>
            ) : (
              <>
                <p className="lco-day-chu">{soChuaTraLoi > 0 ? `Còn ${soChuaTraLoi} câu chưa trả lời` : 'Em đã trả lời hết các câu'}</p>
                <button type="button" className="m3-nut-chinh" disabled={soDaTraLoi === 0 || dangNop} onClick={() => void nop()}>
                  {dangNop ? 'Đang nộp…' : soDaTraLoi === 0 || soDaTraLoi === dsChuaCham.length ? 'Nộp bài' : `Nộp ${soDaTraLoi} câu đã làm`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── một thẻ câu ─────────────────────────────────────────────────────────────
function TheCauOn({
  c,
  so,
  dapAn,
  ketQua,
  chuaTraLoi,
  khoa,
  onChon,
  onChonY,
}: {
  c: CauOn
  so: number
  dapAn: string
  ketQua?: KetQuaCauOn
  chuaTraLoi: boolean
  khoa: boolean
  onChon: (g: string) => void
  onChonY: (y: number, v: 'D' | 'S') => void
}) {
  const daCham = !!ketQua
  const khoaO = daCham || khoa
  const idTen = `lco-c-${c.qid}`
  const dungChuoi = ketQua ? (c.phan === 'II' ? chuanDS(String(ketQua.dapAnDung || '')) : String(ketQua.dapAnDung || '').trim().toUpperCase()) : ''
  const trangThai = daCham ? (ketQua!.dung ? 'dung' : 'sai') : chuaTraLoi ? 'chua' : ''
  const anhLoi = (ketQua?.anhLoiGiai || []).map((h) => ({ ...h, viTri: 'sau_loi_giai' as const }))
  return (
    <li className="lco-the" data-trang-thai={trangThai || undefined} aria-labelledby={`${idTen}-ten`}>
      <div className="lco-the-dau">
        <h3 id={`${idTen}-ten`} className="lco-the-ten">
          Câu {so}
        </h3>
        <span className="m3-chip" data-vai-tro="secondary">
          {NHAN_PHAN[c.phan]}
        </span>
        {c.tenDang && <span className="m3-chip lco-chip-dang">{c.tenDang}</span>}
        {daCham && (
          <span className="m3-chip lco-chip-kq" data-vai-tro={ketQua!.dung ? 'tertiary' : 'error'}>
            {ketQua!.dung ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
            {ketQua!.dung ? 'Đúng' : 'Chưa đúng'}
          </span>
        )}
        {!daCham && chuaTraLoi && (
          <span className="m3-chip" data-vai-tro="secondary">
            Chưa trả lời — chưa được tính
          </span>
        )}
      </div>

      <div className="lco-de">
        <MomQuestionStem q={c as any} />
      </div>

      {c.phan === 'I' && (
        <div className="lco-nhom" role="radiogroup" aria-labelledby={`${idTen}-ten`}>
          {(c.choices || []).map((nd, k) => {
            const ky = KY_TU[k]
            const chon = dapAn === ky
            const laDung = daCham && dungChuoi === ky
            return (
              <label key={ky} className="lco-lua" data-chon={chon || undefined} data-dung={laDung || undefined} data-sai={daCham && chon && !laDung ? true : undefined}>
                <input type="radio" name={idTen} value={ky} checked={chon} disabled={khoaO} onChange={() => onChon(ky)} />
                <span className="lco-ky" aria-hidden="true">
                  {ky}
                </span>
                <span className="lco-nd">
                  <MomOption q={c as any} index={k} text={nd} />
                </span>
                {daCham && laDung && <span className="lco-dau-kq">Đáp án đúng</span>}
                {daCham && chon && !laDung && <span className="lco-dau-kq lco-dau-kq--sai">Em chọn</span>}
              </label>
            )
          })}
        </div>
      )}

      {c.phan === 'II' && (
        <div className="lco-nhom">
          {(c.ideas || c.choices || []).map((nd, k) => {
            const cur = dapAn.length === 4 ? dapAn[k] : '-'
            const dungY = daCham ? dungChuoi[k] : ''
            return (
              <div key={k} className="lco-y" role="radiogroup" aria-labelledby={`${idTen}-y${k}`}>
                <div id={`${idTen}-y${k}`} className="lco-y-nd">
                  <MomOption q={c as any} index={k} text={`${String.fromCharCode(97 + k)}) ${nd}`} tf />
                </div>
                <div className="lco-doan">
                  {(['D', 'S'] as const).map((v) => (
                    <label key={v} className="lco-doan-o" data-chon={cur === v || undefined} data-dung={daCham && dungY === v ? true : undefined} data-sai={daCham && cur === v && dungY !== v ? true : undefined}>
                      <input type="radio" name={`${idTen}-y${k}`} value={v} checked={cur === v} disabled={khoaO} onChange={() => onChonY(k, v)} />
                      <span>{v === 'D' ? 'Đúng' : 'Sai'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {c.phan === 'III' && (
        <div className="lco-nhom">
          <label className="lco-nhap">
            <span className="lco-nhap-nhan">Đáp án của em (số)</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Ví dụ 12,5"
              value={dapAn}
              disabled={khoaO}
              onChange={(e) => onChon(e.target.value)}
            />
          </label>
        </div>
      )}

      {daCham && (
        <div className="lco-loi-giai">
          {c.phan === 'III' && (
            <p className="lco-dap-an-dung">
              Đáp án đúng: <b>{ketQua!.dapAnDung}</b>
            </p>
          )}
          <LoiGiaiCauSai hoaHoc c={{ text: c.text, phan: c.phan, dapAnDung: ketQua!.dapAnDung, loiGiai: ketQua!.loiGiai } as any} />
          <HinhTaiViTri hinhAnh={anhLoi as any} viTri="sau_loi_giai" nhan="lời giải" />
        </div>
      )}
    </li>
  )
}
