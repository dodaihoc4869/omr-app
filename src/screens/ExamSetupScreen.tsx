// MỞ CA KIỂM TRA — tối giản theo yêu cầu thầy (2026-09-02): đề đã tự về từ
// kho, link Apps Script đã cấu hình 1 lần ở màn Ngân hàng câu hỏi, nên màn
// này CHỈ còn 3 việc: chọn đề · lớp & thời gian · cách công bố điểm → Mở ca.
// Không còn mục dán link, không xoá đề ở đây (xoá ở Ngân hàng câu hỏi).
import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, Square, Library, Copy, Check } from 'lucide-react'
import { bankSizeWarning, mergeAndStrip, mergeKeepAnswers, type TeacherExamSource } from '../data/examContent'
import { TheNoiDung, Hang, OThongBao, NutChinh } from '../components/DesignSystem'
import NutDongBo from '../components/NutDongBo'
import { publishSession, type CongBoDiem } from '../lib/exam-api'
import { loadExamSources, loadScriptUrl, loadTeacherSecret, saveSessionTeacherBank } from '../lib/exam-db'
import { dongBoNganHang } from '../lib/exam-sync'
import { useAppStore } from '../store/appStore'

function randomSessionCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Link mời NGẮN: <origin>/omr-app/t/<mã ca> (public/404.html chuyển hướng về
 * ?examCode=…; máy em lấy link Apps Script từ public/cau-hinh.json). Chỉ dùng
 * link ngắn khi link trong cau-hinh.json ĐÚNG BẰNG link thầy đang dùng — lệch
 * thì quay về link dài có &api=… để em không nộp nhầm chỗ. */
async function taoLinkMoi(maCa: string, scriptUrl: string): Promise<string> {
  const base = import.meta.env.BASE_URL
  const linkDai = `${location.origin}${base}?examCode=${maCa}&api=${encodeURIComponent(scriptUrl)}`
  try {
    const res = await fetch(`${base}cau-hinh.json`, { cache: 'no-cache' })
    if (!res.ok) return linkDai
    const cfg = (await res.json()) as { scriptUrl?: string }
    if ((cfg.scriptUrl || '').trim() !== scriptUrl) return linkDai
    return `${location.origin}${base}t/${maCa}`
  } catch {
    return linkDai
  }
}

const O_NHAP: React.CSSProperties = {
  height: 52,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
  width: '100%',
}
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

const CACH_CONG_BO: { id: CongBoDiem; ten: string; mota: string }[] = [
  { id: 'khong', ten: 'Không công bố trên máy em', mota: 'Thầy chấm ở màn Theo dõi rồi gửi nhận xét cho phụ huynh.' },
  { id: 'ngay', ten: 'Ngay sau khi em nộp bài', mota: 'Hiện điểm + câu sai + lời giải trên máy em. Em nộp sớm có thể kể đáp án cho em đang làm.' },
  { id: 'ca_lop_xong', ten: 'Khi cả lớp nộp xong', mota: 'Em nộp xong chỉ thấy "đang chờ cả lớp"; điểm tự hiện khi mọi em đã vào thi đều nộp (hoặc đều hết giờ).' },
]

export default function ExamSetupScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const classList = useAppStore((s) => s.classList)

  const [scriptUrl, setScriptUrl] = useState('')
  const [savedSources, setSavedSources] = useState<TeacherExamSource[]>([])
  const [selectedMaDe, setSelectedMaDe] = useState<Set<string>>(new Set())
  const [timKiemMaDe, setTimKiemMaDe] = useState('')

  const [lop, setLop] = useState('')
  const [thoiGianPhut, setThoiGianPhut] = useState(45)
  const [congBoDiem, setCongBoDiem] = useState<CongBoDiem>('khong')
  const [opening, setOpening] = useState(false)
  const [opened, setOpened] = useState<{ maCa: string; joinLink: string } | null>(null)
  const [daCopy, setDaCopy] = useState(false)

  useEffect(() => {
    let huy = false
    loadScriptUrl().then(setScriptUrl)
    loadExamSources().then((list) => {
      if (huy) return
      setSavedSources(list)
      // Chỉ có 1 đề thì chọn sẵn luôn — bớt một chạm.
      if (list.length === 1) setSelectedMaDe(new Set([list[0].maDe]))
    })
    // Đồng bộ IM LẶNG khi mở màn (đề pipeline vừa đẩy lên tự về) — lỗi/mất
    // mạng thì bỏ qua, thầy vẫn còn nút "Đồng bộ" để bấm tay.
    Promise.all([loadScriptUrl(), loadTeacherSecret()])
      .then(([url, mat]) => (url.trim() && mat.trim() ? dongBoNganHang(url.trim(), mat.trim()) : null))
      .then((kq) => {
        if (!kq || huy) return
        if (kq.moi.length + kq.capNhat.length > 0) loadExamSources().then((list) => !huy && setSavedSources(list))
      })
      .catch(() => {})
    return () => {
      huy = true
    }
  }, [])

  // Lớp gợi ý từ danh sách lớp đã nối (Google Sheet) — bấm 1 chạm thay vì gõ.
  const dsLop = useMemo(() => Array.from(new Set(classList.map((r) => r.lop.trim()).filter(Boolean))).sort(), [classList])

  const toggleSelect = (maDe: string) => {
    setSelectedMaDe((prev) => {
      const next = new Set(prev)
      if (next.has(maDe)) next.delete(maDe)
      else next.add(maDe)
      return next
    })
  }

  const selectedSources = savedSources.filter((c) => selectedMaDe.has(c.maDe))
  const sizeWarning = selectedSources.length > 0 ? bankSizeWarning(selectedSources) : null

  const dsDeLoc = useMemo(() => {
    const q = timKiemMaDe.trim().toLowerCase()
    if (!q) return savedSources
    return savedSources.filter((c) => c.maDe.toLowerCase().includes(q))
  }, [savedSources, timKiemMaDe])

  const tongCauDaChon = selectedSources.reduce((s, c) => s + c.phanI.length + c.phanII.length + c.phanIII.length, 0)

  const chonTatCa = () => setSelectedMaDe(new Set(dsDeLoc.map((c) => c.maDe)))
  const boChonTatCa = () => setSelectedMaDe(new Set())

  const handleOpenSession = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa cấu hình link Apps Script — vào Ngân hàng câu hỏi → Cấu hình', 'error')
    if (selectedSources.length === 0) return showToast('Chưa chọn đề nào cho ca này', 'error')
    if (!lop.trim()) return showToast('Chưa nhập lớp', 'error')
    if (!Number.isFinite(thoiGianPhut) || thoiGianPhut <= 0) return showToast('Thời gian làm bài phải lớn hơn 0', 'error')

    setOpening(true)
    try {
      const maCa = randomSessionCode()
      const publicBank = mergeAndStrip(selectedSources)
      const keyBank = congBoDiem === 'khong' ? undefined : mergeKeepAnswers(selectedSources)
      await publishSession(scriptUrl.trim(), maCa, lop.trim(), thoiGianPhut, publicBank, congBoDiem, keyBank)
      // Lưu bản CÓ đáp án trên máy thầy để màn Theo dõi chấm lại được sau này.
      await saveSessionTeacherBank(maCa, selectedSources)
      setOpened({ maCa, joinLink: await taoLinkMoi(maCa, scriptUrl.trim()) })
      setDaCopy(false)
      showToast('Đã mở ca kiểm tra', 'success')
    } catch (e) {
      showToast(`Lỗi mở ca: ${e instanceof Error ? e.message : 'không rõ nguyên nhân'}`, 'error')
    } finally {
      setOpening(false)
    }
  }

  const copyLink = () => {
    if (!opened) return
    navigator.clipboard.writeText(opened.joinLink).then(() => {
      setDaCopy(true)
      showToast('Đã copy link mời vào thi', 'success')
    })
  }

  // ------------------------------------------------------------ CA ĐÃ MỞ
  if (opened) {
    return (
      <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Ca kiểm tra đã mở
        </h1>
        <div className="text-center" style={{ background: 'var(--g1)', color: 'var(--giay)', borderRadius: 'var(--bo-3)', padding: 'var(--k6)', boxShadow: 'var(--bong-2)' }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', opacity: 0.9 }}>Mã ca</div>
          <div className="font-bold" style={{ ...SO, fontSize: 44, letterSpacing: '.18em' }}>
            {opened.maCa}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', opacity: 0.9 }}>
            Lớp {lop.trim()} · {thoiGianPhut} phút · {tongCauDaChon} câu · {CACH_CONG_BO.find((c) => c.id === congBoDiem)?.ten}
          </div>
        </div>
        <TheNoiDung>
          <div style={NHAN_NHO}>Gửi link này vào nhóm Zalo lớp — em mở link, gõ số báo danh là vào thi:</div>
          <div className="break-all" style={{ ...SO, fontSize: 'var(--cx-1)', background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)', marginTop: 'var(--k2)', marginBottom: 'var(--k3)' }}>
            {opened.joinLink}
          </div>
          <NutChinh onClick={copyLink}>
            <span className="inline-flex items-center gap-2">
              {daCopy ? <Check size={18} /> : <Copy size={18} />} {daCopy ? 'Đã copy' : 'Copy link mời vào thi'}
            </span>
          </NutChinh>
        </TheNoiDung>
        <NutChinh variant="phu" onClick={() => setScreen('exammonitor')}>
          Theo dõi bài nộp của ca này →
        </NutChinh>
        <button onClick={() => setOpened(null)} className="tap-target" style={NHAN_NHO}>
          ← Mở ca khác
        </button>
      </div>
    )
  }

  // ------------------------------------------------------------ SOẠN CA
  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between">
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Mở ca kiểm tra
        </h1>
        <button onClick={() => setScreen('examhub')} style={NHAN_NHO} className="tap-target">
          ← Kiểm tra
        </button>
      </div>

      {/* 1. ĐỀ */}
      <TheNoiDung>
        <div className="flex items-center justify-between" style={{ gap: 'var(--k3)', marginBottom: 'var(--k3)' }}>
          <div className="min-w-0">
            <div style={TIEU_DE_MUC}>Đề cho ca này</div>
            {selectedSources.length > 0 && (
              <div style={NHAN_NHO}>
                Đã chọn {selectedSources.length} đề · {tongCauDaChon} câu
              </div>
            )}
          </div>
          {/* Một chạm kéo đề mới từ kho về — không cần vào Ngân hàng câu hỏi. */}
          <NutDongBo
            onXong={(kq) => {
              if (kq.moi.length + kq.capNhat.length > 0) loadExamSources().then(setSavedSources)
              if (kq.canXem.length > 0) showToast(`${kq.canXem.length} câu nghi đáp án — xem ở Ngân hàng câu hỏi`, 'error')
            }}
          />
        </div>

        {savedSources.length === 0 ? (
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <OThongBao tone="cam">Ngân hàng chưa có đề nào — thả file vào kho-de/moi/ trên máy, đề tự về.</OThongBao>
            <NutChinh variant="phu" onClick={() => setScreen('nganhangde')}>
              <span className="inline-flex items-center gap-2">
                <Library size={18} /> Mở Ngân hàng câu hỏi
              </span>
            </NutChinh>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {savedSources.length >= 6 && (
              <input style={O_NHAP} placeholder="Tìm theo mã đề…" value={timKiemMaDe} onChange={(e) => setTimKiemMaDe(e.target.value)} inputMode="search" />
            )}
            {dsDeLoc.map((c) => {
              const dangChon = selectedMaDe.has(c.maDe)
              const tongCau = c.phanI.length + c.phanII.length + c.phanIII.length
              return (
                <Hang key={c.maDe} selected={dangChon} onClick={() => toggleSelect(c.maDe)} data-trang-thai={dangChon ? 'chon' : undefined}>
                  <span className="shrink-0" style={{ color: dangChon ? 'var(--xanh)' : 'var(--mo)' }}>
                    {dangChon ? <CheckSquare size={20} /> : <Square size={20} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
                      Mã {c.maDe}
                    </div>
                    <div style={NHAN_NHO}>
                      I {c.phanI.length} · II {c.phanII.length} · III {c.phanIII.length}
                    </div>
                  </span>
                  <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-2)' }}>
                    {tongCau} câu
                  </span>
                </Hang>
              )
            })}
            {savedSources.length > 1 && (
              <div className="flex items-center" style={{ gap: 'var(--k4)', ...NHAN_NHO }}>
                <button onClick={chonTatCa} className="tap-target" style={{ color: 'var(--muc)', fontWeight: 700 }}>
                  Chọn tất cả
                </button>
                <button onClick={boChonTatCa} className="tap-target">
                  Bỏ chọn
                </button>
              </div>
            )}
            {sizeWarning && <OThongBao tone="cam">{sizeWarning}</OThongBao>}
          </div>
        )}
      </TheNoiDung>

      {/* 2. LỚP & THỜI GIAN */}
      <TheNoiDung>
        <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Lớp & thời gian</div>
        <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
          {dsLop.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
              {dsLop.map((l) => {
                const chon = lop.trim() === l
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLop(l)}
                    className="tap-target font-bold"
                    style={{
                      ...SO,
                      fontSize: 'var(--cx-2)',
                      padding: '0 var(--k4)',
                      borderRadius: 'var(--bo-tron)',
                      background: chon ? 'var(--muc)' : 'var(--the-2)',
                      color: chon ? 'var(--muc-nguoc)' : 'var(--muc)',
                    }}
                  >
                    {l}
                  </button>
                )
              })}
            </div>
          )}
          <input style={O_NHAP} placeholder="Lớp (vd 12A1)" value={lop} onChange={(e) => setLop(e.target.value)} />
          <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              style={{ ...O_NHAP, width: 110, ...SO }}
              value={thoiGianPhut}
              onChange={(e) => setThoiGianPhut(Number(e.target.value))}
            />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)' }}>phút làm bài</span>
          </div>
        </div>
      </TheNoiDung>

      {/* 3. CÔNG BỐ ĐIỂM */}
      <TheNoiDung>
        <div style={{ ...TIEU_DE_MUC, marginBottom: 'var(--k3)' }}>Công bố điểm cho học sinh</div>
        <div className="flex flex-col" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Cách công bố điểm">
          {CACH_CONG_BO.map((c) => {
            const chon = congBoDiem === c.id
            return (
              <Hang key={c.id} selected={chon} onClick={() => setCongBoDiem(c.id)} data-trang-thai={chon ? 'chon' : undefined}>
                <span
                  className="shrink-0 flex items-center justify-center"
                  aria-hidden
                  style={{ width: 20, height: 20, borderRadius: 'var(--bo-tron)', border: `2px solid ${chon ? 'var(--xanh)' : 'var(--vien-dam)'}` }}
                >
                  {chon && <span style={{ width: 10, height: 10, borderRadius: 'var(--bo-tron)', background: 'var(--xanh)' }} />}
                </span>
                <span className="flex-1 min-w-0">
                  <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
                    {c.ten}
                  </div>
                  <div style={NHAN_NHO}>{c.mota}</div>
                </span>
              </Hang>
            )
          })}
        </div>
      </TheNoiDung>

      <NutChinh onClick={handleOpenSession} disabled={opening}>
        {opening ? 'Đang mở ca…' : 'Mở ca kiểm tra'}
      </NutChinh>
    </div>
  )
}
