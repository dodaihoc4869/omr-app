// NGÂN HÀNG CÂU HỎI — app CHỈ ĐỌC đề đã có sẵn (NAPDETUDONG.md): không thả
// file, không đọc PDF/DOCX, không duyệt câu. Thầy thả file vào kho-de/moi/,
// pipeline "Nạp đề mới" đẩy lên kho đề Apps Script, màn này tự đồng bộ về
// máy thầy khi mở (và khi bấm "Đồng bộ ngay").
//
// Việc còn lại cho thầy ở đây: xem các câu pipeline NGHI ĐÁP ÁN ĐỀ SAI (hoặc
// đề thiếu đáp án) — quyết định giữ hay sửa đáp án. Sửa xong app hỏi có chấm
// lại các ca đã dùng câu đó không (cập nhật ngân hàng CÓ đáp án của từng ca;
// màn Theo dõi mở lại là chấm theo đáp án mới).
import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Trash2, ChevronDown, ChevronUp, Upload } from 'lucide-react'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { TheNoiDung, DauThe, Hang, Nhan, OThongBao, NutChinh } from '../components/DesignSystem'
import { ChemText } from '../lib/chem-format'
import { deleteExamSource, loadAllSessionTeacherBanks, loadExamSources, loadScriptUrl, loadTeacherSecret, saveExamSource, saveScriptUrl, saveSessionTeacherBank, saveTeacherSecret } from '../lib/exam-db'
import { caDungDe, capNhatCaDaMo, dongBoNganHang, type KetQuaDongBo } from '../lib/exam-sync'
import { capNhatKeyBank, luuDe, xoaDe as xoaDeTrenKho } from '../lib/exam-api'
import { buildTeacherSourceFromKhoDe, parseKhoDeJsonText } from '../lib/exam-kho-de-import'
import { mergeKeepAnswers, validateTeacherSource } from '../data/examContent'
import TheCau from '../components/TheCau'
import { useAppStore } from '../store/appStore'

type CauNghi = {
  phan: 'I' | 'II' | 'III'
  idx: number
  q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion
}

/** Câu chờ thầy quyết. Gồm CẢ `lech_co_hd`: pipeline giải ra đáp án khác đề
 * nhưng đề vẫn có hướng dẫn, thường là đề hỏi chưa chặt (đếm cả đồng phân hình
 * học, hai ý mâu thuẫn nhau). Trước đây ba trạng thái này bị lọc mất nên tài
 * liệu ghi "3 câu chờ thầy quyết" mà màn hình chỉ hiện 1 — thầy không có cách
 * nào chốt hai câu còn lại. */
const TRANG_THAI_CHO_QUYET = ['nghi_dap_an_sai', 'thieu_dap_an', 'lech_co_hd']

function cauNghiCua(s: TeacherExamSource): CauNghi[] {
  const out: CauNghi[] = []
  const nghi = (q: { loiGiaiTrangThai?: string }) => TRANG_THAI_CHO_QUYET.includes(q.loiGiaiTrangThai ?? '')
  s.phanI.forEach((q, idx) => {
    if (nghi(q)) out.push({ phan: 'I', idx, q })
  })
  s.phanII.forEach((q, idx) => {
    if (nghi(q)) out.push({ phan: 'II', idx, q })
  })
  s.phanIII.forEach((q, idx) => {
    if (nghi(q)) out.push({ phan: 'III', idx, q })
  })
  return out
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

export default function NganHangDeScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)

  const [scriptUrl, setScriptUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [sources, setSources] = useState<TeacherExamSource[]>([])
  const [dangDongBo, setDangDongBo] = useState(false)
  const [ketQua, setKetQua] = useState<KetQuaDongBo | null>(null)
  const [moCauHinh, setMoCauHinh] = useState(false)
  const [moDe, setMoDe] = useState<Set<string>>(new Set())
  const [hoiChamLai, setHoiChamLai] = useState<{ maDe: string; soCa: number; capNhat: () => Promise<void> } | null>(null)
  const [dangDay, setDangDay] = useState(false)
  const [hoiXoa, setHoiXoa] = useState<{ s: TeacherExamSource; caLienQuan: string[] } | null>(null)
  const [dangXoa, setDangXoa] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /** Dự phòng khi máy chạy pipeline không gọi được Apps Script (chặn mạng):
   * thầy chọn file kho-de/xong/<mã>.json — app đẩy lên kho (luuDe) và lưu
   * luôn vào ngân hàng máy này. Cùng khuôn JSON, cùng kiểm tra. */
  const dayFileJson = async (file: File) => {
    if (!scriptUrl.trim() || !secret.trim()) {
      showToast('Cần link Apps Script + mã bí mật trước (mục Cấu hình)', 'error')
      setMoCauHinh(true)
      return
    }
    setDangDay(true)
    try {
      const raw = await file.text()
      const parsed = parseKhoDeJsonText(raw)
      if (!parsed.ok || !parsed.json) throw new Error(parsed.errors[0])
      const { source, errors, canXemList } = buildTeacherSourceFromKhoDe(parsed.json)
      if (errors.length > 0) throw new Error(errors[0])
      const v = validateTeacherSource(source)
      if (v.length > 0) throw new Error(v[0])
      const r = await luuDe(scriptUrl.trim(), secret.trim(), JSON.parse(raw))
      await saveExamSource(source)
      // Ca đã mở dùng đề này → đổi sang bản mới (lời giải/đáp án) cho học sinh xem lại.
      const soCa = await capNhatCaDaMo(scriptUrl.trim(), secret.trim(), source).catch(() => 0)
      if (soCa > 0) showToast(`Đã cập nhật lời giải/đáp án cho ${soCa} ca đã mở`, 'success')
      await taiLocal()
      showToast(`Đã đẩy đề ${r.maDe} lên kho (${r.soCau} câu${r.soNghi ? `, ${r.soNghi} câu nghi` : ''}) và lưu vào máy này${canXemList.length ? ` — cần xem: ${canXemList.join(', ')}` : ''}`, r.soNghi ? 'warn' : 'success')
    } catch (e) {
      showToast(`Đẩy đề lỗi: ${e instanceof Error ? e.message : 'không rõ'}`, 'error')
    } finally {
      setDangDay(false)
    }
  }

  const taiLocal = async () => setSources(await loadExamSources())

  const dongBo = async (url: string, mat: string, imLang = false) => {
    if (!url.trim() || !mat.trim()) {
      if (!imLang) showToast('Chưa có link Apps Script hoặc mã bí mật — mở mục Cấu hình bên dưới', 'error')
      setMoCauHinh(true)
      return
    }
    setDangDongBo(true)
    try {
      const kq = await dongBoNganHang(url.trim(), mat.trim())
      setKetQua(kq)
      await taiLocal()
      const tomTat = [kq.moi.length ? `${kq.moi.length} đề mới` : '', kq.capNhat.length ? `${kq.capNhat.length} đề cập nhật` : ''].filter(Boolean).join(', ')
      if (!imLang || tomTat) showToast(tomTat ? `Đồng bộ xong: ${tomTat}` : 'Ngân hàng đã mới nhất', kq.loi.length ? 'warn' : 'success')
    } catch (e) {
      showToast(`Đồng bộ lỗi: ${e instanceof Error ? e.message : 'không rõ'}`, 'error')
    } finally {
      setDangDongBo(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      setScriptUrl(url)
      setSecret(mat)
      await taiLocal()
      if (url && mat) dongBo(url, mat, true)
      else setMoCauHinh(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const luuCauHinh = async () => {
    await saveScriptUrl(scriptUrl.trim())
    await saveTeacherSecret(secret.trim())
    showToast('Đã lưu trên máy này', 'success')
    dongBo(scriptUrl, secret)
  }

  /** Mở hộp hỏi xoá. Đếm trước số ca đã mở dùng đề này để nói thẳng cho thầy,
   * thay vì để thầy đoán xoá đề có làm mất bài đã nộp không (không hề). */
  const moHoiXoa = async (s: TeacherExamSource) => {
    const banks = await loadAllSessionTeacherBanks().catch(() => [])
    setHoiXoa({ s, caLienQuan: caDungDe(banks, s.maDe) })
  }

  /** Chỉ gỡ khỏi IndexedDB máy này. Kho còn nguyên nên lần Đồng bộ sau đề về lại. */
  const xoaTrenMayNay = async (maDe: string) => {
    setDangXoa(true)
    try {
      await deleteExamSource(maDe)
      await taiLocal()
      setHoiXoa(null)
      showToast(`Đã gỡ đề ${maDe} khỏi máy này — kho vẫn giữ, bấm Đồng bộ là về lại`, 'success')
    } finally {
      setDangXoa(false)
    }
  }

  /** Xoá HẲN: dòng trong sheet NganHangDe + file JSON trên Drive, rồi mới gỡ
   * bản trên máy. Thứ tự này là cố ý — kho xoá hỏng thì giữ nguyên bản local
   * để thầy thử lại, không để rơi vào cảnh máy mất đề mà kho vẫn còn. */
  const xoaHanKhoiKho = async (maDe: string) => {
    if (!scriptUrl.trim() || !secret.trim()) {
      showToast('Cần link Apps Script + mã bí mật mới xoá được ở kho (mục Cấu hình)', 'error')
      return
    }
    setDangXoa(true)
    try {
      await xoaDeTrenKho(scriptUrl.trim(), secret.trim(), maDe)
      await deleteExamSource(maDe)
      await taiLocal()
      setKetQua(null)
      setHoiXoa(null)
      showToast(`Đã xoá hẳn đề ${maDe} khỏi kho và khỏi máy này`, 'success')
    } catch (e) {
      showToast(`Xoá ở kho lỗi: ${e instanceof Error ? e.message : 'không rõ'} — đề vẫn còn nguyên`, 'error')
    } finally {
      setDangXoa(false)
    }
  }

  /** Thầy chốt đáp án mới cho 1 câu: sửa trong ngân hàng, gỡ cờ nghi, rồi
   * hỏi có chấm lại các ca đã dùng câu đó không. */
  const chotDapAn = async (s: TeacherExamSource, c: CauNghi, dapAnMoi: string) => {
    const next: TeacherExamSource = JSON.parse(JSON.stringify(s))
    const apDung = (q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion) => {
      if (c.phan === 'I') (q as TeacherMcqQuestion).correct = dapAnMoi as 'A' | 'B' | 'C' | 'D'
      else if (c.phan === 'II') (q as TeacherTrueFalseQuestion).correct = dapAnMoi.split('') as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']
      else (q as TeacherShortAnswerQuestion).correct = dapAnMoi
      q.loiGiaiTrangThai = 'khop'
      q.ghiChuLoiGiai = `Thầy chốt đáp án ${dapAnMoi} ngày ${new Date().toLocaleDateString('vi-VN')}`
    }
    const list = c.phan === 'I' ? next.phanI : c.phan === 'II' ? next.phanII : next.phanIII
    apDung(list[c.idx])
    await saveExamSource(next)
    await taiLocal()

    // Các ca đã mở có dùng câu này (ngân hàng có đáp án lưu riêng từng ca).
    const banks = await loadAllSessionTeacherBanks()
    const qid = c.q.id
    const caLienQuan = banks.filter((b) => b.sources.some((src) => [...src.phanI, ...src.phanII, ...src.phanIII].some((q) => q.id === qid)))
    if (caLienQuan.length === 0) {
      showToast(`Đã chốt đáp án ${dapAnMoi} cho ${c.phan === 'I' ? 'Phần I' : c.phan === 'II' ? 'Phần II' : 'Phần III'} câu ${c.idx + 1}`, 'success')
      return
    }
    setHoiChamLai({
      maDe: s.maDe,
      soCa: caLienQuan.length,
      capNhat: async () => {
        for (const b of caLienQuan) {
          const capNhat = b.sources.map((src) => {
            const cp: TeacherExamSource = JSON.parse(JSON.stringify(src))
            for (const q of [...cp.phanI, ...cp.phanII, ...cp.phanIII]) if (q.id === qid) apDung(q)
            return cp
          })
          await saveSessionTeacherBank(b.maCa, capNhat)
          // Đẩy bản CÓ đáp án mới lên máy chủ để học sinh xem lại đúng đáp án thầy chốt.
          if (scriptUrl.trim() && secret.trim()) {
            await capNhatKeyBank(scriptUrl.trim(), secret.trim(), b.maCa, mergeKeepAnswers(capNhat)).catch(() => {
              showToast(`Ca ${b.maCa}: chưa đẩy được đáp án mới lên máy chủ (mất mạng?)`, 'error')
            })
          }
        }
        showToast(`Đã cập nhật đáp án cho ${caLienQuan.length} ca — mở "Theo dõi & chấm bài" từng ca để xem điểm mới`, 'success')
      },
    })
  }

  const tongCau = useMemo(() => sources.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0), [sources])
  const tongNghi = useMemo(() => sources.reduce((n, s) => n + cauNghiCua(s).length, 0), [sources])

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k5)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between">
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Ngân hàng câu hỏi
        </h1>
        <button onClick={() => setScreen('examhub')} style={NHAN_NHO} className="tap-target">
          ← Kiểm tra
        </button>
      </div>

      <TheNoiDung>
        <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
          <div>
            <div className="font-bold" style={{ fontSize: 'var(--cx-4)', fontFamily: 'var(--serif)', fontVariantNumeric: 'tabular-nums' }}>
              {sources.length} đề · {tongCau} câu
            </div>
            <div style={NHAN_NHO}>
              Thả file vào <code>kho-de/moi/</code> trên máy — đề tự về đây sau khi pipeline chạy.
            </div>
          </div>
          {tongNghi > 0 && <Nhan tone="do">{tongNghi} câu cần thầy quyết</Nhan>}
        </div>
        <div className="flex flex-col" style={{ marginTop: 'var(--k4)', gap: 'var(--k2)' }}>
          <NutChinh onClick={() => dongBo(scriptUrl, secret)} disabled={dangDongBo}>
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={18} className={dangDongBo ? 'animate-spin' : ''} /> {dangDongBo ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
            </span>
          </NutChinh>
          <NutChinh variant="phu" onClick={() => fileRef.current?.click()} disabled={dangDay}>
            <span className="inline-flex items-center gap-2">
              <Upload size={18} /> {dangDay ? 'Đang đẩy…' : 'Đẩy file JSON từ kho-de/xong lên kho'}
            </span>
          </NutChinh>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) dayFileJson(f)
            }}
          />
        </div>
        {ketQua && (ketQua.loi.length > 0 || ketQua.canXem.length > 0) && (
          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
            {ketQua.loi.map((l, i) => (
              <OThongBao key={`l${i}`} tone="do">
                {l}
              </OThongBao>
            ))}
            {ketQua.canXem.length > 0 && <OThongBao tone="cam">Cần thầy xem: {ketQua.canXem.join(' · ')}</OThongBao>}
          </div>
        )}
      </TheNoiDung>

      {sources.map((s, i) => {
        const nghi = cauNghiCua(s)
        const mo = moDe.has(s.maDe)
        return (
          <TheNoiDung key={s.maDe} noPadding>
            <DauThe index={i} badge={s.maDe.length <= 3 ? s.maDe : i + 1} title={`Mã ${s.maDe}`} tone={nghi.length ? 'cam' : undefined} />
            <div className="flex flex-col" style={{ padding: 'var(--k4) var(--k5)', gap: 'var(--k3)' }}>
              <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
                <div style={{ ...NHAN_NHO, fontVariantNumeric: 'tabular-nums' }}>
                  I{s.phanI.length} · II{s.phanII.length} · III{s.phanIII.length}
                  {s.ngayNap ? ` · nạp ${new Date(s.ngayNap).toLocaleDateString('vi-VN')}` : ''}
                  {s.nguon ? ` · ${s.nguon}` : ''}
                </div>
                <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
                  {s.nhom && <Nhan tone="tim">{s.nhom}</Nhan>}
                  {nghi.length > 0 ? <Nhan tone="do">{nghi.length} nghi</Nhan> : <Nhan tone="xanh">đáp án đủ</Nhan>}
                  <button onClick={() => moHoiXoa(s)} className="tap-target" style={{ color: 'var(--mo)' }} title="Xoá đề" aria-label={`Xoá đề ${s.maDe}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {nghi.length > 0 && (
                <>
                  <button
                    onClick={() =>
                      setMoDe((prev) => {
                        const n = new Set(prev)
                        if (n.has(s.maDe)) n.delete(s.maDe)
                        else n.add(s.maDe)
                        return n
                      })
                    }
                    className="tap-target flex items-center justify-between font-bold"
                    style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', color: 'var(--do)' }}
                  >
                    <span>Câu nghi đáp án đề sai / thiếu đáp án ({nghi.length})</span>
                    {mo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {mo && (
                    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
                      {nghi.map((c) => (
                        <CauNghiCard key={c.q.id} c={c} onChot={(da) => chotDapAn(s, c, da)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </TheNoiDung>
        )
      })}

      {sources.length === 0 && !dangDongBo && (
        <OThongBao>Chưa có đề nào. Thả file .pdf vào <code>kho-de/moi/</code> trên máy rồi gõ "Nạp đề mới" trong Cowork (hoặc đợi 22:00), sau đó bấm Đồng bộ ngay.</OThongBao>
      )}

      <TheNoiDung>
        <button onClick={() => setMoCauHinh((v) => !v)} className="tap-target w-full flex items-center justify-between font-bold" style={{ fontSize: 'var(--cx-3)', fontFamily: 'var(--serif)' }}>
          <span>Cấu hình (1 lần)</span>
          {moCauHinh ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {moCauHinh && (
          <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)' }}>
            <div>
              <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Link Apps Script (/exec)</div>
              <input style={O_NHAP} value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" />
            </div>
            <div>
              <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Mã bí mật kho đề (đúng bằng MA_BI_MAT đã đặt trong Apps Script)</div>
              <input style={O_NHAP} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Mã bí mật" autoComplete="off" />
            </div>
            <NutChinh variant="phu" onClick={luuCauHinh}>
              Lưu & đồng bộ
            </NutChinh>
            <div style={NHAN_NHO}>
              Mã chỉ lưu trên máy này (IndexedDB), không nằm trong code app, không gửi cho học sinh. Cách đặt MA_BI_MAT: xem đầu file <code>docs/apps-script-kiem-tra.gs</code>.
            </div>
          </div>
        )}
      </TheNoiDung>

      {hoiXoa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
          <div className="w-full flex flex-col" style={{ maxWidth: 420, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
            <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
              Xoá đề {hoiXoa.s.maDe}
            </div>
            <div style={{ ...NHAN_NHO, fontVariantNumeric: 'tabular-nums' }}>
              {hoiXoa.s.phanI.length + hoiXoa.s.phanII.length + hoiXoa.s.phanIII.length} câu
              {hoiXoa.s.nhom ? ` · ${hoiXoa.s.nhom}` : ''}
              {hoiXoa.s.nguon ? ` · ${hoiXoa.s.nguon}` : ''}
            </div>

            {hoiXoa.caLienQuan.length > 0 && (
              <OThongBao tone="cam">
                <b>{hoiXoa.caLienQuan.length} ca đã mở</b> dùng đề này ({hoiXoa.caLienQuan.slice(0, 4).join(', ')}
                {hoiXoa.caLienQuan.length > 4 ? '…' : ''}). Xoá đề <b>không</b> đụng tới các ca đó: mỗi ca giữ bản đề riêng, bài đã nộp và điểm vẫn nguyên.
              </OThongBao>
            )}

            <div className="flex flex-col" style={{ gap: 'var(--k1)' }}>
              <NutChinh variant="phu" onClick={() => xoaTrenMayNay(hoiXoa.s.maDe)} disabled={dangXoa}>
                Chỉ xoá trên máy này
              </NutChinh>
              <div style={NHAN_NHO}>Kho trên Apps Script vẫn giữ. Bấm Đồng bộ là đề về lại máy.</div>
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--k1)' }}>
              <NutChinh variant="nguyhiem" onClick={() => xoaHanKhoiKho(hoiXoa.s.maDe)} disabled={dangXoa || !scriptUrl.trim() || !secret.trim()}>
                {dangXoa ? 'Đang xoá…' : 'Xoá hẳn khỏi kho'}
              </NutChinh>
              <div style={NHAN_NHO}>
                Xoá cả dòng trong sheet NganHangDe và file JSON trên Drive, rồi xoá luôn trên máy này. <b>Đồng bộ lại sẽ không còn đề này.</b> File gốc trong{' '}
                <code>kho-de/xong/</code> trên ổ cứng vẫn còn, muốn dùng lại thì bấm "Đẩy file JSON" để đưa lên kho.
              </div>
            </div>

            <NutChinh variant="phu" onClick={() => setHoiXoa(null)} disabled={dangXoa}>
              Đóng, không xoá
            </NutChinh>
          </div>
        </div>
      )}

      {hoiChamLai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
          <div className="w-full flex flex-col" style={{ maxWidth: 400, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
            <div style={{ fontSize: 'var(--cx-3)', lineHeight: 1.6 }}>
              Đã chốt đáp án mới cho đề {hoiChamLai.maDe}. Có <b>{hoiChamLai.soCa} ca đã mở</b> dùng câu này — chấm lại các bài đã nộp theo đáp án mới không?
            </div>
            <div style={NHAN_NHO}>Chọn "Chấm lại": điểm của các ca đó đổi theo đáp án mới khi mở màn Theo dõi. Chọn "Giữ": các ca cũ vẫn chấm theo đáp án cũ, chỉ ca mở sau này dùng đáp án mới.</div>
            <div className="flex" style={{ gap: 'var(--k2)' }}>
              <NutChinh variant="phu" onClick={() => setHoiChamLai(null)}>
                Giữ điểm cũ
              </NutChinh>
              <NutChinh
                onClick={async () => {
                  const h = hoiChamLai
                  setHoiChamLai(null)
                  await h.capNhat()
                }}
              >
                Chấm lại
              </NutChinh>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CauNghiCard({ c, onChot }: { c: CauNghi; onChot: (dapAn: string) => void }) {
  const q = c.q
  const nhanPhan = c.phan === 'I' ? 'Phần I' : c.phan === 'II' ? 'Phần II' : 'Phần III'
  const dapAnDe = c.phan === 'II' ? (q as TeacherTrueFalseQuestion).correct.join('') : String((q as TeacherMcqQuestion | TeacherShortAnswerQuestion).correct)
  const [tuNhap, setTuNhap] = useState('')
  const [moDe, setMoDe] = useState(false)
  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)', padding: 'var(--k3)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
        <b style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>
          {nhanPhan} câu {c.idx + 1}
        </b>
        <Nhan tone={q.loiGiaiTrangThai === 'thieu_dap_an' ? 'cam' : 'do'}>{q.loiGiaiTrangThai === 'thieu_dap_an' ? 'đề thiếu đáp án' : 'nghi đáp án đề sai'}</Nhan>
      </div>
      {/* Thầy phải ĐỌC ĐƯỢC CẢ CÂU mới chốt được đáp án. Bản đầu chỉ hiện thân
          câu, không có phương án lẫn hình, nên thầy nhìn "DSDD hay DSSD" mà
          không có gì để đối chiếu. Nay bấm ra đúng thẻ câu như màn xem lại, kèm
          phương án, hình và lời giải. */}
      {moDe ? (
        <TheCauNghi c={c} />
      ) : (
        <div className="cau-de" style={{ fontSize: 'var(--cx-2)', lineHeight: 1.6 }}>
          <ChemText text={q.text} />
        </div>
      )}
      <button type="button" onClick={() => setMoDe((v) => !v)} className="tap-target self-start font-bold" style={{ ...NHAN_NHO, color: 'var(--muc)', textDecoration: 'underline' }} aria-expanded={moDe}>
        {moDe ? 'Thu gọn đề' : 'Xem đề đầy đủ (phương án, hình, lời giải)'}
      </button>
      <div className="flex flex-wrap" style={{ gap: 'var(--k2)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}>
        <span>
          Đáp án đề (đang chấm): <b>{dapAnDe}</b>
        </span>
        {q.dapAnTuGiai && (
          <span>
            Tự giải: <b style={{ color: 'var(--do)' }}>{q.dapAnTuGiai}</b>
          </span>
        )}
      </div>
      {q.explanation && (
        <OThongBao>
          <ChemText text={q.explanation} />
          {q.ghiChuLoiGiai && <div style={{ marginTop: 'var(--k1)', fontStyle: 'normal', fontSize: 'var(--cx-1)', color: 'var(--nhat)', fontFamily: 'var(--sans)' }}>{q.ghiChuLoiGiai}</div>}
        </OThongBao>
      )}
      <div style={NHAN_NHO}>Thầy chốt đáp án:</div>
      <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }}>
        {c.phan === 'I' &&
          (['A', 'B', 'C', 'D'] as const).map((k) => (
            <Hang key={k} selected={dapAnDe === k} onClick={() => onChot(k)} className="!w-auto" style={{ minHeight: 44, padding: 'var(--k2) var(--k4)' }}>
              <b style={{ fontFamily: 'var(--sans)' }}>{k}</b>
            </Hang>
          ))}
        {c.phan !== 'I' && (
          <>
            <input
              style={{ ...O_NHAP, width: 160, height: 44 }}
              placeholder={c.phan === 'II' ? 'vd DSDS' : 'vd 12,5'}
              value={tuNhap}
              onChange={(e) => setTuNhap(c.phan === 'II' ? e.target.value.toUpperCase().replace(/[^DS]/g, '').slice(0, 4) : e.target.value)}
            />
            <NutChinh variant="phu" className="!w-auto px-4" onClick={() => tuNhap.trim() && onChot(tuNhap.trim())} disabled={c.phan === 'II' ? tuNhap.length !== 4 : !tuNhap.trim()}>
              Chốt
            </NutChinh>
          </>
        )}
        <NutChinh variant="phu" className="!w-auto px-4" onClick={() => onChot(dapAnDe)}>
          Giữ đáp án đề
        </NutChinh>
      </div>
    </div>
  )
}

/** Thẻ câu đầy đủ để thầy đối chiếu trước khi chốt đáp án — dùng lại đúng
 * `TheCau` chế độ "xem_lai" của màn học sinh, không dựng thẻ câu thứ hai.
 * `choicePerm` giữ nguyên thứ tự gốc A-B-C-D: thầy đang đối chiếu với FILE ĐỀ,
 * xáo thứ tự ở đây là thầy chốt nhầm chữ cái. */
function TheCauNghi({ c }: { c: CauNghi }) {
  const q = c.q
  const chung = {
    cheDo: 'xem_lai' as const,
    stt: c.idx + 1,
    tieuDe: q.chuyenDe,
    text: q.text,
    thanCauImg: q.thanCauImg,
    table: q.table,
    imageDataUrl: q.imageDataUrl,
    hinhAnh: q.hinhAnh,
    explanation: q.explanation,
    loiGiai: q.loiGiai,
    nhanLoiGiai: q.loiGiaiTrangThai,
  }
  if (c.phan === 'I') {
    const m = q as TeacherMcqQuestion
    return <TheCau {...chung} phan="I" choices={m.choices} choiceImgs={m.choiceImgs} choicePerm={[0, 1, 2, 3]} selected={null} correct={m.correct} />
  }
  if (c.phan === 'II') {
    const t = q as TeacherTrueFalseQuestion
    return <TheCau {...chung} phan="II" ideas={t.ideas} ideaImgs={t.ideaImgs} selected={[null, null, null, null]} correct={t.correct} />
  }
  const s = q as TeacherShortAnswerQuestion
  return <TheCau {...chung} phan="III" selected={null} correct={s.correct} />
}
