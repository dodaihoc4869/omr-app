// MÀN HỌC SINH của thầy (BA-APP.md đợt 2). Hai lớp trong một màn:
//   1. Danh sách em — ô tìm theo tên/SBD, lọc khối 10/11/12, điểm gần nhất.
//   2. Chạm một em → HỒ SƠ: tổng quan · chuyên đề mạnh–yếu (đã tổng hợp sẵn ở
//      máy chủ, kèm mũi tên xu hướng) · lịch sử ca thi có hạng lớp.
// Cùng hồ sơ này sẽ dùng lại cho lối vào từ mục Phụ huynh — không dựng hai màn.
// Chỉ dùng token + 6 thành phần thiết kế; số liệu dùng --sans.
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung, DauThe } from '../components/DesignSystem'
import { KhoiChuyenDe, KhoiLichSuCa, toneXepLoai } from '../components/HoSoEmView'
import { danhSachEm, deleteStudentRegistration, hoSoEm, khoiTuNamSinh, type EmTomTat, type HoSoEm } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { classify } from '../engine/score'
import { useAppStore } from '../store/appStore'
import NutDongBoDanhSach from '../components/NutDongBoDanhSach'
import PhieuZaloEm from '../components/PhieuZaloEm'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const O_NHAP: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4) 0 44px',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
  width: '100%',
}

// Các mảnh hồ sơ dùng chung với app học sinh và app phụ huynh — MỘT màn hồ sơ
// duy nhất cho ba lối vào (BA-APP.md mục 9). Tái xuất để không đổi chỗ import cũ.
export { toneXepLoai, laYeu, NGUONG_YEU, SO_CAU_DU_TIN, NHAN_BAI_TAP } from '../components/HoSoEmView'

export default function HocSinhScreen() {
  const sbdDangXem = useAppStore((s) => s.sbdDangXem)
  const moHoSoEm = useAppStore((s) => s.moHoSoEm)

  const [cauHinh, setCauHinh] = useState<{ url: string; mat: string } | null>(null)
  const [ds, setDs] = useState<EmTomTat[] | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [timKiem, setTimKiem] = useState('')
  const [khoiLoc, setKhoiLoc] = useState<number | null>(null)

  const [hoSo, setHoSo] = useState<HoSoEm | null>(null)
  const [dangTaiHoSo, setDangTaiHoSo] = useState(false)
  const showToast = useAppStore((s) => s.showToast)

  const tai = async () => {
    setDangTai(true)
    setLoi('')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim()) throw new Error('Chưa cấu hình link Apps Script — vào Ngân hàng câu hỏi → Cấu hình')
      if (!mat.trim()) throw new Error('Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')
      setCauHinh({ url: url.trim(), mat: mat.trim() })
      setDs(await danhSachEm(url.trim(), mat.trim()))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Lỗi không rõ')
      if (ds === null) setDs([])
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    tai()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mở hồ sơ khi có SBD đang xem (từ danh sách này, sau này cả từ mục Phụ huynh).
  useEffect(() => {
    if (!sbdDangXem || !cauHinh) {
      setHoSo(null)
      return
    }
    setDangTaiHoSo(true)
    setLoi('')
    hoSoEm(cauHinh.url, { secret: cauHinh.mat, sbd: sbdDangXem })
      .then(setHoSo)
      .catch((e) => setLoi(e instanceof Error ? e.message : 'Không mở được hồ sơ'))
      .finally(() => setDangTaiHoSo(false))
  }, [sbdDangXem, cauHinh])

  /** XOÁ EM KHỎI DANH SÁCH — chỉ thầy (máy chủ đòi mã bí mật).
   *
   * Bắt gõ đúng số báo danh, giống cách xoá ca: em vào thi là tự có tên nên
   * danh sách sẽ đông, chạm nhầm rất dễ. Xoá hồ sơ chứ KHÔNG xoá bài làm —
   * điểm và lịch sử ca vẫn nằm trong LuotThi, em thi lại là tên hiện ra lại. */
  const xoaEm = async (sbd: string, hoTen: string) => {
    if (!cauHinh) return showToast('Chưa có link Apps Script hoặc mã bí mật', 'error')
    const go = prompt(`Xoá "${hoTen || `SBD ${sbd}`}" khỏi danh sách học sinh?\n\nBài làm và điểm của em GIỮ NGUYÊN; em thi ca tiếp theo là tên tự hiện lại.\n\nGõ đúng số báo danh ${sbd} để xoá:`)
    if (go === null) return
    if (go.trim() !== sbd) return showToast('Số báo danh gõ vào không khớp — chưa xoá gì', 'warn')
    try {
      await deleteStudentRegistration(cauHinh.url, cauHinh.mat, sbd)
      setDs((truoc) => (truoc ?? []).filter((e) => e.sbd !== sbd))
      moHoSoEm('')
      showToast(`Đã xoá ${hoTen || `SBD ${sbd}`} khỏi danh sách`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không xoá được', 'error')
    }
  }

  const dsLoc = useMemo(() => {
    const q = timKiem.trim().toLowerCase()
    return (ds ?? []).filter((e) => {
      const khoi = khoiTuNamSinh(e.namSinh)
      return (khoiLoc === null || khoi === khoiLoc) && (!q || e.sbd.includes(q) || e.hoTen.toLowerCase().includes(q) || e.lop.toLowerCase().includes(q))
    })
  }, [ds, timKiem, khoiLoc])

  // ------------------------------------------------------------------ HỒ SƠ
  if (sbdDangXem) {
    const diemGanNhat = hoSo?.ca.find((c) => c.tong !== null)?.tong ?? null
    return (
      <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
        <button onClick={() => moHoSoEm('')} className="tap-target self-start inline-flex items-center" style={{ ...NHAN_NHO, gap: 4 }}>
          <ArrowLeft size={16} /> Danh sách học sinh
        </button>

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {dangTaiHoSo && !hoSo && <div style={NHAN_NHO}>Đang mở hồ sơ…</div>}

        {hoSo && (
          <>
            <TheNoiDung noPadding>
              <DauThe index={0} badge={(hoSo.em.hoTen || '?').trim().slice(0, 1).toUpperCase()} title={hoSo.em.hoTen || `SBD ${hoSo.em.sbd}`} />
              <div style={{ padding: 'var(--k5)' }}>
                <div style={NHAN_NHO}>
                  SBD <span style={SO}>{hoSo.em.sbd}</span>
                  {hoSo.em.lop ? ` · Lớp ${hoSo.em.lop}` : ''}
                  {hoSo.em.namSinh ? ` · sinh ${hoSo.em.namSinh}${khoiTuNamSinh(hoSo.em.namSinh) ? ` (khối ${khoiTuNamSinh(hoSo.em.namSinh)})` : ''}` : ''}
                </div>
                <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
                  <span className="font-bold" style={{ ...SO, fontSize: 'var(--cx-6)' }}>
                    {diemGanNhat === null ? '—' : diemGanNhat.toFixed(2).replace('.', ',')}
                  </span>
                  <Nhan tone={toneXepLoai(diemGanNhat)}>{diemGanNhat === null ? 'chưa có điểm' : classify(diemGanNhat)}</Nhan>
                  <span style={{ ...NHAN_NHO, ...SO }}>
                    {hoSo.ca.length} ca đã làm
                  </span>
                </div>
              </div>
            </TheNoiDung>

            {/* Mục GIAO BÀI TẬP VỀ NHÀ đã gỡ theo yêu cầu của thầy. Code vẫn
                còn nguyên trong repo (thư mục components, lib/bai-tap.ts, ca
                Loai=baitap ở máy chủ) — cần lại thì gắn nút vào đây, không phải
                dựng lại từ đầu. */}
            <PhieuZaloEm hoSo={hoSo} showToast={showToast} />

            {/* XOÁ EM KHỎI DANH SÁCH — CHỈ THẦY.
                Em vào thi là tự có tên, nên danh sách sẽ dính cả số báo danh gõ
                nhầm. Lệnh xoá đòi MÃ BÍ MẬT ở máy chủ, máy em và máy phụ huynh
                không gọi được. Xoá hồ sơ thôi: bài đã làm và điểm giữ nguyên
                trong LuotThi, em thi lại là tên lại hiện ra. */}
            <NutChinh variant="nguyhiem" onClick={() => void xoaEm(hoSo.em.sbd, hoSo.em.hoTen)}>
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Trash2 size={18} /> Xoá em khỏi danh sách
              </span>
            </NutChinh>

            <KhoiChuyenDe chuyenDe={hoSo.chuyenDe} />

            <KhoiLichSuCa ca={hoSo.ca} />

          </>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------- DANH SÁCH EM
  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'var(--k3)' }}>
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Học sinh
        </h1>
        {/* CÙNG MỘT NÚT VỚI KHO ĐỀ: bấm là chọn file danh sách rồi đẩy lên máy
            chủ. Danh sách này là CỔNG VÀO THI — nạp xong, số báo danh ngoài
            danh sách không thi được nữa. */}
        <NutDongBoDanhSach
          onXong={(soEm, tomTat) => {
            showToast(`Đã nạp ${soEm} em lên máy chủ${tomTat ? ` — ${tomTat}` : ''}. Từ giờ chỉ những em này vào thi được.`, 'success')
            void tai()
          }}
        />
      </div>

      {/* Nói thẳng chạm vào đâu để giao bài — nút Giao bài tập nằm trong hồ sơ
          từng em (phải biết em yếu chuyên đề nào mới rút được câu), nên nhìn
          danh sách không đoán ra. */}
      <div style={NHAN_NHO}>
        Chạm một em để xem hồ sơ: chuyên đề mạnh–yếu và toàn bộ ca thi đã làm. Em chỉ vào thi được khi nhập đúng cả ba: số báo
        danh, họ tên, năm sinh — khớp file danh sách đã đồng bộ.
      </div>

      <TheNoiDung>
        <div className="flex items-center" style={{ gap: 'var(--k3)', marginBottom: 'var(--k3)' }}>
          <div className="relative flex-1">
            <Search size={18} className="absolute" style={{ left: 14, top: 15, color: 'var(--mo)' }} />
            <input style={O_NHAP} placeholder="Tìm tên hoặc số báo danh…" value={timKiem} onChange={(e) => setTimKiem(e.target.value)} inputMode="search" aria-label="Tìm học sinh" />
          </div>
          <button
            type="button"
            onClick={tai}
            disabled={dangTai}
            className="tap-target shrink-0 flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }}
            aria-label="Tải lại"
            title="Tải lại"
          >
            <RefreshCw size={18} className={dangTai ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-wrap" style={{ gap: 'var(--k2)', marginBottom: 'var(--k3)' }} role="group" aria-label="Lọc theo khối">
          {[null, 10, 11, 12].map((k) => {
            const chon = khoiLoc === k
            return (
              <button
                key={k ?? 'tat_ca'}
                type="button"
                onClick={() => setKhoiLoc(k)}
                className="tap-target font-bold"
                style={{
                  ...SO,
                  fontSize: 'var(--cx-1)',
                  minHeight: 36,
                  padding: '0 var(--k3)',
                  borderRadius: 'var(--bo-tron)',
                  background: chon ? 'var(--muc)' : 'var(--the-2)',
                  color: chon ? 'var(--muc-nguoc)' : 'var(--nhat)',
                }}
              >
                {k === null ? 'Tất cả' : `Khối ${k}`}
              </button>
            )
          })}
        </div>

        {loi && <OThongBao tone="do">{loi}</OThongBao>}
        {ds === null ? (
          <div style={{ ...NHAN_NHO, padding: 'var(--k4) 0' }}>Đang tải danh sách học sinh…</div>
        ) : dsLoc.length === 0 ? (
          <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
            <div style={{ ...NHAN_NHO, padding: 'var(--k2) 0' }}>
              {ds.length === 0 ? 'Chưa em nào có tên trong danh sách. Em vào thi một ca là tự có tên ở đây.' : 'Không có em nào khớp bộ lọc.'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {dsLoc.map((e) => {
              const khoi = khoiTuNamSinh(e.namSinh)
              return (
                <Hang key={e.sbd} onClick={() => moHoSoEm(e.sbd)} className="flex-col" style={{ alignItems: 'stretch' }} data-sbd={e.sbd}>
                  <span className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
                    <span className="flex-1 min-w-0">
                      <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                        {e.hoTen || `SBD ${e.sbd}`}
                      </div>
                      <div style={NHAN_NHO}>
                        <span style={SO}>{e.sbd}</span>
                        {e.lop ? ` · Lớp ${e.lop}` : ''}
                        {khoi ? ` · khối ${khoi}` : ''} · <span style={SO}>{e.soCa}</span> ca
                      </div>
                    </span>
                    <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-3)' }}>
                      {e.diemGanNhat === null ? '—' : e.diemGanNhat.toFixed(2).replace('.', ',')}
                    </span>
                  </span>
                  <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                    <Nhan tone={toneXepLoai(e.diemGanNhat)}>{e.diemGanNhat === null ? 'chưa có điểm' : classify(e.diemGanNhat)}</Nhan>
                    {/* Danh sách lấy từ file thầy nạp. Em nào chỉ có số báo danh,
                        hoặc có hồ sơ cũ mà không nằm trong file mới, đều cờ hoá —
                        em ngoài danh sách KHÔNG vào thi được. */}
                    {!e.hoTen && <Nhan tone="cam">chưa có tên</Nhan>}
                    {e.trangThai === 'ngoai_danh_sach' && <Nhan tone="do">ngoài danh sách</Nhan>}
                    {e.soCa === 0 && <Nhan tone="xam">chưa thi ca nào</Nhan>}
                  </span>
                </Hang>
              )
            })}
          </div>
        )}
      </TheNoiDung>
    </div>
  )
}
