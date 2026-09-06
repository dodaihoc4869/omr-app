// HỌC SINH HỎI — màn riêng, vào từ ô ngoài màn chính (thầy chốt 06/09).
//
// Trước đó câu hỏi của em nằm lẫn trong Chi tiết ca: thầy phải nhớ ca nào rồi
// mở đúng ca đó mới thấy. Nay một ô ngoài màn chính là thấy NGAY ca nào đang
// có em chờ chữa, chạm vào ra đúng trang đã thiết kế.
//
// MỘT LỆNH GỌI cho cả màn: `danhSachCauHoi` với mã ca rỗng trả mọi dòng, rồi
// gom theo ca tại máy. Gọi từng ca một là ba chục lệnh cho một lần mở màn —
// đi ngược hẳn việc giảm tải vừa làm.
//
// XOÁ VÀ KHÔI PHỤC (thầy chốt 06/09 chiều): tích chọn nhiều ca rồi xoá một
// lượt. Xoá chỉ ĐÁNH DẤU trên máy chủ, ca vào Thùng rác và lấy lại được —
// câu hỏi là thứ em đã chủ động gửi, không nên bốc hơi vì một cú chạm nhầm.
import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Loader2, MessageCircleQuestion, RotateCcw, Trash2 } from 'lucide-react'
import type { TeacherExamSource } from '../data/examContent'
import { NutChinh, OThongBao, TheNoiDung } from '../components/DesignSystem'
import KhoiCauHoiEm from '../components/KhoiCauHoiEm'
import { danhSachCauHoi, xoaCauHoi } from '../lib/exam-api'
import { loadScriptUrl, loadSessionTeacherBank, loadTeacherSecret } from '../lib/exam-db'
import { gomTheoCa, type CaCoCauHoi } from '../lib/hoi-bai'
import { useAppStore } from '../store/appStore'

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }

function ngayGio(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

/** Ô tích của một thẻ. Tách hẳn thành nút riêng cạnh thẻ chứ không lồng trong
 * thẻ: nút lồng trong nút là HTML sai, và chạm nhầm thì mở luôn ca. */
function OTich({ bat, doi, nhan }: { bat: boolean; doi: () => void; nhan: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={bat}
      aria-label={nhan}
      onClick={doi}
      className="tap-target shrink-0 flex items-center justify-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: 'var(--bo-2)',
        border: 'none',
        background: 'none',
        color: bat ? 'var(--chinh)' : 'var(--mo)',
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          border: `2px solid ${bat ? 'var(--chinh)' : 'var(--vien-dam)'}`,
          background: bat ? 'var(--chinh)' : 'transparent',
          color: 'var(--muc-nguoc)',
        }}
      >
        {bat && <Check size={16} strokeWidth={3} />}
      </span>
    </button>
  )
}

export default function CauHoiScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const [url, setUrl] = useState('')
  const [mat, setMat] = useState('')
  const [ds, setDs] = useState<CaCoCauHoi[] | null>(null)
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const [mo, setMo] = useState<CaCoCauHoi | null>(null)
  const [banks, setBanks] = useState<TeacherExamSource[] | null>(null)
  /** 'chinh' = ca đang hiện · 'rac' = ca đã bỏ vào thùng rác. */
  const [che, setChe] = useState<'chinh' | 'rac'>('chinh')
  const [chon, setChon] = useState<Set<string>>(new Set())
  const [dangXoa, setDangXoa] = useState(false)

  const tai = async (u: string, m: string, cheXem: 'chinh' | 'rac') => {
    setDang(true)
    setLoi('')
    try {
      const items = await danhSachCauHoi(u.trim(), m.trim(), '', cheXem === 'rac')
      setDs(gomTheoCa(items))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không lấy được câu hỏi')
      setDs(null)
    } finally {
      setDang(false)
    }
  }

  useEffect(() => {
    let con = true
    void (async () => {
      const [u, m] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!con) return
      setUrl(u || '')
      setMat(m || '')
      if (!u || !m) return setLoi('Chưa có link Apps Script hoặc mã bí mật. Vào Ngân hàng câu hỏi → Cấu hình để nhập.')
      await tai(u, m, 'chinh')
    })()
    return () => {
      con = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bản đề CÓ đáp án của ca — cần để dựng trang tổng hợp. Ca mở ở máy khác thì
  // máy này không có, và khối chi tiết nói thẳng điều đó chứ không dựng trang
  // thiếu lời giải.
  useEffect(() => {
    if (!mo) return setBanks(null)
    let con = true
    void (async () => {
      const b = await loadSessionTeacherBank(mo.maCa)
      if (con) setBanks(b ?? null)
    })()
    return () => {
      con = false
    }
  }, [mo])

  const tong = useMemo(() => {
    if (!ds) return null
    return { soCa: ds.length, chuaChua: ds.reduce((n, c) => n + c.chuaChua, 0) }
  }, [ds])

  const doiChon = (maCa: string) =>
    setChon((cu) => {
      const moi = new Set(cu)
      if (moi.has(maCa)) moi.delete(maCa)
      else moi.add(maCa)
      return moi
    })

  const doiChe = async (cheMoi: 'chinh' | 'rac') => {
    setChe(cheMoi)
    setChon(new Set())
    setMo(null)
    if (url && mat) await tai(url, mat, cheMoi)
  }

  /** Xoá hoặc khôi phục. `tatCa` chỉ dùng cho nút "Khôi phục tất cả". */
  const chay = async (khoiPhuc: boolean, tatCa = false) => {
    const maCa = tatCa ? [] : [...chon]
    if (!tatCa && maCa.length === 0) return
    setDangXoa(true)
    try {
      const r = await xoaCauHoi(url.trim(), mat.trim(), maCa, { khoiPhuc, tatCa })
      showToast(khoiPhuc ? `Đã khôi phục ${r.soCa} ca (${r.soDong} lượt hỏi)` : `Đã bỏ ${r.soCa} ca vào thùng rác`, 'success')
      setChon(new Set())
      await tai(url, mat, che)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không làm được', 'error')
    } finally {
      setDangXoa(false)
    }
  }

  if (mo) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}>
        <button
          type="button"
          onClick={() => setMo(null)}
          className="tap-target inline-flex items-center self-start font-bold"
          style={{ gap: 4, minHeight: 44, padding: '0 var(--k3) 0 var(--k2)', borderRadius: 'var(--bo-tron)', border: 'none', background: 'var(--the)', color: 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', boxShadow: 'var(--bong-1)' }}
        >
          <ChevronLeft size={18} /> Mọi ca
        </button>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--mo)', letterSpacing: '.16em', textTransform: 'uppercase' }}>
            {che === 'rac' ? 'Thùng rác' : 'Học sinh hỏi'}
          </div>
          <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', lineHeight: 1.15, marginTop: 2 }}>
            {mo.tenCa || `Ca ${mo.maCa}`}
          </h1>
        </div>
        <KhoiCauHoiEm scriptUrl={url.trim()} secret={mat.trim()} maCa={mo.maCa} tenCa={mo.tenCa} lop="" banks={banks} showToast={showToast} moSan />
      </div>
    )
  }

  const laRac = che === 'rac'
  const daChonHet = Boolean(ds && ds.length > 0 && chon.size === ds.length)

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}>
      <header style={{ paddingTop: 'var(--k2)' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--mo)', letterSpacing: '.16em', textTransform: 'uppercase' }}>Đỗ Đại Học</div>
        <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', lineHeight: 1.15, marginTop: 2 }}>
          {laRac ? 'Thùng rác' : 'Học sinh hỏi'}
        </h1>
        {tong && (
          <div style={{ ...NHAN, marginTop: 4 }}>
            {laRac
              ? `${tong.soCa} ca đã bỏ · chọn ca cần lấy lại`
              : `${tong.soCa} ca có câu hỏi${tong.chuaChua > 0 ? ` · ${tong.chuaChua} em chờ Thầy chữa` : ' · đã chữa hết'}`}
          </div>
        )}
      </header>

      {/* HAI LỐI NHÌN, không trộn: màn chính chỉ ca đang hiện, thùng rác chỉ ca
          đã bỏ. Trộn rồi để màn tự lọc là mỗi lần mở lại kéo về cả đống dòng cũ. */}
      <div className="flex" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant={laRac ? 'phu' : 'chinh'} onClick={() => void doiChe('chinh')} disabled={dang}>
          Đang hiện
        </NutChinh>
        <NutChinh variant={laRac ? 'chinh' : 'phu'} onClick={() => void doiChe('rac')} disabled={dang}>
          Thùng rác
        </NutChinh>
      </div>

      {loi && <OThongBao tone="cam">{loi}</OThongBao>}

      {dang && (
        <TheNoiDung>
          <div className="inline-flex items-center" style={{ gap: 8, ...NHAN }}>
            <Loader2 size={16} className="animate-spin" /> Đang lấy câu hỏi…
          </div>
        </TheNoiDung>
      )}

      {ds && ds.length === 0 && !dang && (
        <OThongBao tone="xanh">
          {laRac ? 'Thùng rác trống.' : 'Chưa em nào gửi câu hỏi. Em nộp bài xong bấm “Hỏi bài Thầy” là câu hỏi về đây.'}
        </OThongBao>
      )}

      {ds && ds.length > 0 && (
        <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }}>
          <button
            type="button"
            onClick={() => setChon(daChonHet ? new Set() : new Set(ds.map((c) => c.maCa)))}
            className="tap-target inline-flex items-center font-bold"
            style={{ gap: 6, minHeight: 44, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', border: '1px solid var(--vien-dam)', background: 'none', color: 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
          >
            {daChonHet ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
          {chon.size > 0 && <span style={NHAN}>Đã chọn {chon.size} ca</span>}
        </div>
      )}

      {ds?.map((c) => {
        const daChon = chon.has(c.maCa)
        return (
          <div
            key={c.maCa}
            className="the-bam flex items-center"
            style={{ padding: 'var(--k3) var(--k4)', ...(daChon ? { outline: '2px solid var(--chinh)', outlineOffset: -2 } : {}) }}
          >
            <OTich bat={daChon} doi={() => doiChon(c.maCa)} nhan={`Chọn ${c.tenCa || `ca ${c.maCa}`}`} />
            <button
              type="button"
              onClick={() => setMo(c)}
              className="tap-target text-left flex items-center"
              style={{ flex: '1 1 auto', minWidth: 0, gap: 'var(--k3)', border: 'none', background: 'none', color: 'inherit', padding: 0, minHeight: 56 }}
            >
              <span className="the-bam-icon shrink-0 flex items-center justify-center">
                <MessageCircleQuestion size={22} />
              </span>
              <span className="min-w-0" style={{ flex: '1 1 auto' }}>
                <span className="the-bam-ten font-bold">{c.tenCa || `Ca ${c.maCa}`}</span>
                <span className="the-bam-phu">
                  {c.soEm} em hỏi · {c.soCau} câu{c.moiNhat ? ` · ${ngayGio(c.moiNhat)}` : ''}
                </span>
              </span>
              {!laRac && c.chuaChua > 0 && (
                <span className="font-bold shrink-0" style={{ marginRight: 'var(--k2)', padding: '2px 10px', borderRadius: 'var(--bo-tron)', background: 'var(--do)', color: 'var(--muc-nguoc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}>
                  {c.chuaChua}
                </span>
              )}
              <ChevronRight size={18} className="the-bam-mui shrink-0" />
            </button>
          </div>
        )
      })}

      {ds && ds.length > 0 && (
        <div style={NHAN}>
          {laRac
            ? 'Tích chọn ca rồi bấm Khôi phục. Ca trong thùng rác vẫn mở xem được, chỉ không hiện ở màn chính.'
            : 'Số đỏ là số em chưa được chữa. Chạm một ca để xem từng em hỏi câu nào; tích ô vuông để bỏ ca vào thùng rác.'}
        </div>
      )}

      {/* THANH HÀNH ĐỘNG dính đáy, chỉ hiện khi đã chọn — không chiếm chỗ lúc
          thầy chỉ đang xem. Nút "Khôi phục tất cả" hiện ngay cả khi chưa chọn
          vì đó là việc thầy hay làm nhất khi mở thùng rác. */}
      {ds && ds.length > 0 && (chon.size > 0 || laRac) && (
        <div
          className="flex flex-wrap"
          style={{ gap: 'var(--k2)', position: 'sticky', bottom: 'calc(var(--k4) + 64px)', padding: 'var(--k3)', borderRadius: 'var(--bo-3)', background: 'var(--the)', boxShadow: 'var(--bong-2)' }}
        >
          {laRac ? (
            <>
              {chon.size > 0 && (
                <NutChinh onClick={() => void chay(true)} disabled={dangXoa}>
                  <span className="inline-flex items-center" style={{ gap: 6 }}>
                    <RotateCcw size={16} /> Khôi phục {chon.size} ca
                  </span>
                </NutChinh>
              )}
              <NutChinh variant="phu" onClick={() => void chay(true, true)} disabled={dangXoa}>
                Khôi phục tất cả
              </NutChinh>
            </>
          ) : (
            <NutChinh variant="nguyhiem" onClick={() => void chay(false)} disabled={dangXoa}>
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Trash2 size={16} /> Bỏ {chon.size} ca vào thùng rác
              </span>
            </NutChinh>
          )}
        </div>
      )}

      {!dang && !ds && !loi && (
        <NutChinh variant="phu" onClick={() => void tai(url, mat, che)}>
          Tải lại
        </NutChinh>
      )}
    </div>
  )
}
