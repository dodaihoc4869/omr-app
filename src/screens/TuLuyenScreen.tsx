// MÀN LÀM BÀI TỰ LUYỆN — đường `/tl#<mã>`, LINK-BAI-LUYEN.md v2.
//
// Em mở link là vào làm ngay: KHÔNG nhập số báo danh, KHÔNG cổng danh sách lớp
// (mục 2.4). Bài tự luyện ở nhà; dựng ba ô nhập cho một việc em tự nguyện làm
// chỉ tổ làm khó em. Đổi lại đầu bài in rõ tên và số báo danh, để bạn nào được
// chuyển tiếp link mở ra là thấy ngay không phải của mình.
//
// KHÔNG đồng hồ đếm ngược, KHÔNG hạn nộp, KHÔNG luật khoá ca thi, KHÔNG cơ chế
// "giữ để đọc" — em học ở nhà, mở sách vở tra cứu là việc nên khuyến khích.
//
// DÙNG CHUNG `TheCau` với màn thi, cả lúc làm lẫn lúc xem lời giải. Không dựng
// thẻ câu thứ hai, không dựng engine chấm thứ hai: máy chủ chấm (mục 2.3).
//
// ĐẦU TRANG luôn có biểu đồ tổng hợp các buổi trước (thầy chốt 05/09) — em thấy
// mình mạnh yếu chỗ nào trước khi bắt đầu.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { HinhAnh } from '../data/examContent'
import TheCau from '../components/TheCau'
import BieuDoTuLuyen from '../components/BieuDoTuLuyen'
import LogoDDH from '../components/LogoDDH'
import { NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import { layTuLuyen, nopTuLuyen, type DeTuLuyen } from '../lib/exam-api'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import { layIdThietBi } from '../lib/thiet-bi'
import { batDauCuaLan, cuaCau, docLinkTuLuyen, tomTatTuLuyen, LOI_KHONG_TIM_THAY, type BuoiTuLuyen, type CauTuLuyenAn, type ChonTuLuyen, type KetQuaTuLuyen } from '../lib/tu-luyen'

type Pha = 'dang_tai' | 'loi' | 'lam' | 'da_nop'

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }
/** Không xáo phương án ở bài tự luyện: em làm một mình, xáo chỉ làm lời giải
 * khó đối chiếu. Thứ tự gốc, hoán vị đồng nhất. */
const KHONG_XAO = [0, 1, 2, 3]

function hinhCua(c: CauTuLuyenAn): HinhAnh[] | undefined {
  return c.hinh ? (c.hinh as unknown as HinhAnh[]) : undefined
}

export default function TuLuyenScreen() {
  const [pha, setPha] = useState<Pha>('dang_tai')
  const [loi, setLoi] = useState('')
  const [de, setDe] = useState<DeTuLuyen | null>(null)
  /** Cửa sổ câu của LẦN GIAO NÀY. Phải gửi kèm lúc nộp để máy chủ chấm đúng bộ
   * em vừa làm, không phải cả gói 40 câu. */
  const [cua, setCua] = useState({ batDau: 0, soCau: 0 })
  const [buoiTruoc, setBuoiTruoc] = useState<BuoiTuLuyen[]>([])
  const [chon, setChon] = useState<ChonTuLuyen>({})
  const [kq, setKq] = useState<KetQuaTuLuyen | null>(null)
  const [dangNop, setDangNop] = useState(false)
  const [zoom, setZoom] = useState('')
  const urlRef = useRef('')

  useEffect(() => {
    let con = true
    void (async () => {
      const { ma, soCau: soCauLink } = docLinkTuLuyen(location.hash)
      // Mã sai định dạng trả về ĐÚNG câu như mã không tồn tại — không để ai dò
      // ra quy tắc mã qua thông điệp lỗi.
      if (!ma) {
        if (con) {
          setLoi(LOI_KHONG_TIM_THAY)
          setPha('loi')
        }
        return
      }
      try {
        const url = await loadScriptUrlHoacMacDinh()
        urlRef.current = url
        const d = await layTuLuyen(url, ma)
        if (!con) return
        // Gói chở tới 40 câu; mỗi lần giao chỉ lấy một cửa sổ, lần sau dịch
        // sang cửa sổ kế tiếp — giao lần 2 mà đúng đề cũ thì em chép lại đáp án
        // lần 1, số liệu thành rác.
        const n = soCauLink && soCauLink > 0 ? Math.min(soCauLink, d.cau.length) : d.cau.length
        const batDau = batDauCuaLan(d.lanThu, n)
        setCua({ batDau, soCau: n })
        setDe({ ...d, cau: cuaCau(d.cau, batDau, n) })
        setBuoiTruoc(((d as unknown as { lichSuEm?: BuoiTuLuyen[] }).lichSuEm ?? []) as BuoiTuLuyen[])
        setPha('lam')
      } catch (e) {
        if (!con) return
        setLoi(e instanceof Error ? e.message : LOI_KHONG_TIM_THAY)
        setPha('loi')
      }
    })()
    return () => {
      con = false
    }
  }, [])

  const tomTat = useMemo(() => tomTatTuLuyen(buoiTruoc), [buoiTruoc])

  const daLam = useMemo(() => {
    if (!de) return 0
    return de.cau.filter((c) => {
      const v = chon[c.id] ?? ''
      if (c.phan === 'II') return v.length === 4 && !v.includes('-')
      return v.trim() !== ''
    }).length
  }, [de, chon])

  const dat = (qid: string, v: string) => setChon((cu) => ({ ...cu, [qid]: v }))

  const datY = (qid: string, i: number, v: 'D' | 'S') =>
    setChon((cu) => {
      const s = (cu[qid] ?? '----').padEnd(4, '-').split('')
      s[i] = v
      return { ...cu, [qid]: s.join('') }
    })

  const nop = async () => {
    if (!de || dangNop) return
    setDangNop(true)
    try {
      const r = await nopTuLuyen(urlRef.current, de.ma, chon, layIdThietBi(), cua)
      setKq(r)
      setPha('da_nop')
      window.scrollTo({ top: 0 })
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không nộp được bài')
    } finally {
      setDangNop(false)
    }
  }

  if (pha === 'dang_tai') {
    return (
      <Trang>
        <div className="flex items-center justify-center" style={{ minHeight: '60vh', gap: 'var(--k2)', ...NHAN }}>
          <Loader2 size={18} className="animate-spin" /> Đang mở bài luyện…
        </div>
      </Trang>
    )
  }

  if (pha === 'loi') {
    return (
      <Trang>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 'var(--k7)' }}>
          <TheNoiDung>
            <OThongBao tone="cam">{loi}</OThongBao>
          </TheNoiDung>
        </div>
      </Trang>
    )
  }

  if (!de) return null

  const xemLai = pha === 'da_nop' && kq
  const chamTheoQid = new Map((kq?.cham ?? []).map((c) => [c.qid, c]))
  const dayDuTheoQid = new Map((kq?.cau ?? []).map((c) => [c.id, c]))

  return (
    <Trang>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 var(--k3) var(--k7)' }}>
        {/* ĐẦU BÀI in rõ tên em — bạn khác được chuyển tiếp link mở ra là thấy
            ngay không phải của mình. */}
        <div className="flex items-center" style={{ gap: 'var(--k3)', padding: 'var(--k5) 0' }}>
          <LogoDDH size={30} />
          <div>
            <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', color: 'var(--muc)' }}>
              Bài luyện của {de.hoTen || `SBD ${de.sbd}`}
            </div>
            <div style={{ ...NHAN, ...SO }}>
              SBD {de.sbd} · {de.cau.length} câu{cua.batDau > 0 ? ` · lần ${Math.floor(cua.batDau / Math.max(1, cua.soCau)) + 1}` : ''} · không tính vào điểm thi
            </div>
          </div>
        </div>

        {/* BIỂU ĐỒ TỔNG HỢP CÁC BUỔI TRƯỚC — luôn ở đầu trang. */}
        <TheNoiDung>
          <BieuDoTuLuyen tt={tomTat} tieuDe="Các buổi luyện trước" />
        </TheNoiDung>

        {xemLai && kq && (
          <div style={{ marginTop: 'var(--k4)' }}>
            <TheNoiDung>
              <div className="flex items-baseline" style={{ gap: 'var(--k3)' }}>
                <div className="font-bold" style={{ ...SO, fontFamily: 'var(--sans)', fontSize: 'var(--cx-6)', lineHeight: 1, color: 'var(--muc)' }}>
                  {kq.soDung}/{kq.soCau}
                </div>
                <div style={NHAN}>câu đúng{kq.lanThu > 1 ? ` · lần làm thứ ${kq.lanThu}` : ''}</div>
              </div>
              <div style={{ ...NHAN, marginTop: 'var(--k2)' }}>Kéo xuống xem lời giải từng câu. Làm lại được bao nhiêu lần cũng được.</div>
            </TheNoiDung>
          </div>
        )}

        <div className="flex flex-col" style={{ gap: 'var(--k4)', marginTop: 'var(--k4)' }}>
          {de.cau.map((c, i) => {
            const cham = chamTheoQid.get(c.id)
            const dayDu = dayDuTheoQid.get(c.id)
            const chung = {
              stt: i + 1,
              tieuDe: c.chuyenDe || undefined,
              id: `cau-${i + 1}`,
              text: c.text,
              thanCauImg: c.anhThanCau,
              table: c.bang ?? undefined,
              hinhAnh: hinhCua(c),
              onZoom: (src: string) => setZoom(src),
              cheDo: (xemLai ? 'xem_lai' : 'thi') as 'xem_lai' | 'thi',
              // Lời giải CHỈ có sau khi nộp — trước đó máy em không hề nhận.
              loiGiai: dayDu ? { chot: dayDu.chot, buoc: dayDu.buoc ?? undefined, ketQua: dayDu.ketQua } : undefined,
            }
            const v = chon[c.id] ?? ''
            if (c.phan === 'I') {
              const pa = (c.luaChon ?? ['', '', '', '']) as string[]
              return (
                <TheCau
                  key={c.id}
                  {...chung}
                  phan="I"
                  choices={[pa[0] ?? '', pa[1] ?? '', pa[2] ?? '', pa[3] ?? '']}
                  choiceImgs={c.anhLuaChon as [string?, string?, string?, string?] | undefined}
                  choicePerm={KHONG_XAO}
                  selected={(v || null) as 'A' | 'B' | 'C' | 'D' | null}
                  onSelect={xemLai ? undefined : (o) => dat(c.id, o)}
                  correct={cham ? (cham.dapAn as 'A' | 'B' | 'C' | 'D') : undefined}
                />
              )
            }
            if (c.phan === 'II') {
              const y = (c.luaChon ?? ['', '', '', '']) as string[]
              const s = v.padEnd(4, '-').split('').map((x) => (x === 'D' || x === 'S' ? (x as 'D' | 'S') : null))
              const dung = cham?.dapAn ?? ''
              return (
                <TheCau
                  key={c.id}
                  {...chung}
                  phan="II"
                  ideas={[y[0] ?? '', y[1] ?? '', y[2] ?? '', y[3] ?? '']}
                  ideaImgs={c.anhLuaChon as [string?, string?, string?, string?] | undefined}
                  selected={s}
                  onSelect={xemLai ? undefined : (idx, val) => datY(c.id, idx, val)}
                  correct={dung.length === 4 ? (dung.split('') as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']) : undefined}
                />
              )
            }
            return (
              <TheCau
                key={c.id}
                {...chung}
                phan="III"
                selected={v || null}
                onChange={xemLai ? undefined : (t) => dat(c.id, t)}
                correct={cham?.dapAn}
              />
            )
          })}
        </div>

        {!xemLai && (
          <div style={{ marginTop: 'var(--k5)' }}>
            <div style={{ ...NHAN, ...SO, marginBottom: 'var(--k2)' }}>
              Đã làm {daLam}/{de.cau.length} câu
            </div>
            <NutChinh onClick={() => void nop()} disabled={dangNop}>
              {dangNop ? 'Đang nộp…' : 'Nộp bài'}
            </NutChinh>
            {loi && (
              <div style={{ marginTop: 'var(--k3)' }}>
                <OThongBao tone="cam">{loi}</OThongBao>
              </div>
            )}
          </div>
        )}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 overflow-auto" style={{ background: 'var(--phu-dam)' }} onClick={() => setZoom('')}>
          <img src={zoom} alt="Phóng to" className="max-w-full max-h-full" style={{ borderRadius: 'var(--bo-1)' }} />
        </div>
      )}
    </Trang>
  )
}

function Trang({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--serif)' }}>
      {children}
    </div>
  )
}

/** Nút quay lại giữ cho màn này dùng được trong app thầy khi xem thử. */
export function NutVe({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="tap-target inline-flex items-center" style={{ ...NHAN, gap: 4, background: 'none', border: 'none' }}>
      <ArrowLeft size={16} /> Quay lại
    </button>
  )
}
