// MÀN HỌC SINH của thầy (BA-APP.md đợt 2). Hai lớp trong một màn:
//   1. Danh sách em — ô tìm theo tên/SBD, lọc khối 10/11/12, điểm gần nhất.
//   2. Chạm một em → HỒ SƠ: tổng quan · chuyên đề mạnh–yếu (đã tổng hợp sẵn ở
//      máy chủ, kèm mũi tên xu hướng) · lịch sử ca thi có hạng lớp.
// Cùng hồ sơ này sẽ dùng lại cho lối vào từ mục Phụ huynh — không dựng hai màn.
// Chỉ dùng token + 6 thành phần thiết kế; số liệu dùng --sans.
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookPlus, ClipboardCopy, RefreshCw, Search, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung, DauThe } from '../components/DesignSystem'
import { danhSachEm, hoSoEm, khoiTuNamSinh, type ChuyenDeEm, type EmTomTat, type HoSoEm, type XuHuong } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { classify } from '../engine/score'
import { useAppStore } from '../store/appStore'
import GiaoBaiTap from '../components/GiaoBaiTap'
import { baiTapCuaEm, danhSachYeuCau, type BaiTapCuaEm, type TrangThaiBaiTap, type YeuCauGiaoBai } from '../lib/exam-api'
import { soanPhieuZalo, NHAC_TRUOC_KHI_GUI } from '../lib/phieu-zalo'

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

/** Xếp loại → màu nhãn. Dùng đúng thang classify() của engine chấm điểm. */
export function toneXepLoai(diem: number | null): 'xanh' | 'tim' | 'cam' | 'do' | 'xam' {
  if (diem === null) return 'xam'
  const xl = classify(diem)
  if (xl === 'Giỏi') return 'xanh'
  if (xl === 'Khá') return 'tim'
  if (xl === 'Trung bình') return 'cam'
  return 'do'
}

/** Chuyên đề yếu = sai trên ngưỡng VÀ đã làm đủ số câu để con số nói lên điều gì. */
export const NGUONG_YEU = 0.3
export const SO_CAU_DU_TIN = 4

export function laYeu(cd: Pick<ChuyenDeEm, 'tiLeSai' | 'soCau'>): boolean {
  return cd.soCau >= SO_CAU_DU_TIN && cd.tiLeSai > NGUONG_YEU
}

/** Nhãn trạng thái bài tập — dùng chung cho màn thầy và màn học sinh. */
export const NHAN_BAI_TAP: Record<TrangThaiBaiTap, { ten: string; tone: 'xanh' | 'cam' | 'do' | 'tim' | 'xam' }> = {
  chua_lam: { ten: 'chưa làm', tone: 'xam' },
  dang_lam: { ten: 'đang làm', tone: 'tim' },
  da_nop: { ten: 'đã nộp', tone: 'xanh' },
  qua_han: { ten: 'quá hạn', tone: 'do' },
}

function phanTram(x: number): string {
  return `${Math.round(x * 100)}%`
}

function ngayGio(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

function MuiTen({ xuHuong }: { xuHuong: XuHuong }) {
  // Xu hướng nói về TỈ LỆ SAI: sai giảm = tiến bộ (xanh, mũi tên xuống).
  if (xuHuong === 'tot') return <TrendingDown size={14} style={{ color: 'var(--xanh)' }} aria-label="đang tiến bộ" />
  if (xuHuong === 'xau') return <TrendingUp size={14} style={{ color: 'var(--do)' }} aria-label="đang sa sút" />
  if (xuHuong === 'deu') return <Minus size={14} style={{ color: 'var(--mo)' }} aria-label="đi ngang" />
  return null
}

function ThanhTiLe({ tiLe }: { tiLe: number }) {
  const mau = tiLe > NGUONG_YEU ? 'var(--do)' : tiLe > 0.15 ? 'var(--cam)' : 'var(--xanh)'
  return (
    <span className="block" style={{ height: 6, borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', overflow: 'hidden' }} aria-hidden="true">
      <span className="block" style={{ width: `${Math.min(100, Math.round(tiLe * 100))}%`, height: '100%', background: mau }} />
    </span>
  )
}

export default function HocSinhScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
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
  const [moGiaoBai, setMoGiaoBai] = useState(false)
  const showToast = useAppStore((s) => s.showToast)
  const [baiTap, setBaiTap] = useState<BaiTapCuaEm[] | null>(null)
  // Hàng chờ phụ huynh xin giao bài (BA-APP đợt 4) — máy thầy là nơi rút câu.
  const [yeuCau, setYeuCau] = useState<YeuCauGiaoBai[]>([])

  const tai = async () => {
    setDangTai(true)
    setLoi('')
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim()) throw new Error('Chưa cấu hình link Apps Script — vào Ngân hàng câu hỏi → Cấu hình')
      if (!mat.trim()) throw new Error('Chưa nhập mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')
      setCauHinh({ url: url.trim(), mat: mat.trim() })
      setDs(await danhSachEm(url.trim(), mat.trim()))
      danhSachYeuCau(url.trim(), mat.trim())
        .then(setYeuCau)
        .catch(() => setYeuCau([]))
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
    baiTapCuaEm(cauHinh.url, { secret: cauHinh.mat, sbd: sbdDangXem })
      .then(setBaiTap)
      .catch(() => setBaiTap([]))
  }, [sbdDangXem, cauHinh])

  const taiLaiBaiTap = () => {
    if (!cauHinh || !sbdDangXem) return
    baiTapCuaEm(cauHinh.url, { secret: cauHinh.mat, sbd: sbdDangXem }).then(setBaiTap).catch(() => {})
  }

  /** Soạn phiếu kết quả ca gần nhất theo đúng quy tắc viết của thầy rồi copy
   * để dán Zalo. Máy KHÔNG đoán nguyên nhân — nhắc thầy tự thêm trước khi gửi. */
  const copyPhieu = async (hs: HoSoEm) => {
    const ca = hs.caGanNhat
    if (!ca || ca.tong === null) return showToast('Em chưa có ca nào đã chấm điểm', 'warn')
    // Số của RIÊNG ca gần nhất, không phải số cộng dồn — phiếu gửi phụ huynh
    // mà ghi sai số là mất tin ngay.
    const yeuNhat = hs.chuyenDeCaGanNhat.find((c) => c.soSai > 0) ?? null
    const bai = baiTap?.find((b) => b.trangThai !== 'da_nop' && b.hanNop)
    const phieu = soanPhieuZalo({
      hoTen: hs.em.hoTen || `SBD ${hs.em.sbd}`,
      ngay: ca.nopLuc,
      diem: ca.tong,
      xepLoai: classify(ca.tong),
      diemPhan: ca.diemI !== null && ca.diemII !== null && ca.diemIII !== null ? { I: ca.diemI, II: ca.diemII, III: ca.diemIII } : null,
      soCauSai: hs.soCauSaiCaGanNhat,
      chuyenDeSai: yeuNhat ? { ten: yeuNhat.ten, soSai: yeuNhat.soSai } : null,
      baiTapDaGiao: bai ? { soCau: 0, hanNop: bai.hanNop } : null,
    })
    try {
      await navigator.clipboard.writeText(phieu)
      showToast(`Đã copy phiếu. ${NHAC_TRUOC_KHI_GUI}`, 'success')
    } catch {
      showToast(phieu, 'success')
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
    const yeu = (hoSo?.chuyenDe ?? []).filter(laYeu)
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

            {yeuCau.some((y) => y.sbd === hoSo.em.sbd) && (
              <OThongBao tone="cam">
                Phụ huynh em này đã bấm đồng ý giao bài. Bấm <b>Giao bài tập</b> để giao; giao xong yêu cầu tự đóng.
              </OThongBao>
            )}

            <div className="flex" style={{ gap: 'var(--k2)' }}>
              <NutChinh onClick={() => setMoGiaoBai(true)}>
                <span className="inline-flex items-center" style={{ gap: 6 }}>
                  <BookPlus size={18} /> Giao bài tập
                </span>
              </NutChinh>
              <NutChinh variant="phu" onClick={() => copyPhieu(hoSo)}>
                <span className="inline-flex items-center" style={{ gap: 6 }}>
                  <ClipboardCopy size={18} /> Copy phiếu Zalo
                </span>
              </NutChinh>
            </div>

            <TheNoiDung>
              <h2 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
                Điểm mạnh — yếu
              </h2>
              {hoSo.chuyenDe.length === 0 ? (
                <div style={NHAN_NHO}>Chưa có dữ liệu chuyên đề. Chấm một ca (màn Chi tiết ca) là bảng này tự có.</div>
              ) : (
                <>
                  {yeu.length > 0 && (
                    <OThongBao tone="cam">
                      Yếu nhất: <b>{yeu[0].ten}</b> — sai <b style={SO}>{phanTram(yeu[0].tiLeSai)}</b> trên <span style={SO}>{yeu[0].soCau}</span> câu đã làm.
                    </OThongBao>
                  )}
                  <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)' }}>
                    {hoSo.chuyenDe.map((cd) => (
                      <div key={cd.ten} data-chuyen-de={cd.ten}>
                        <div className="flex items-baseline justify-between" style={{ gap: 'var(--k2)' }}>
                          <span className="flex items-center min-w-0" style={{ gap: 4 }}>
                            <span className="truncate" style={{ fontSize: 'var(--cx-2)' }}>
                              {cd.ten}
                            </span>
                            <MuiTen xuHuong={cd.xuHuong} />
                          </span>
                          <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-2)' }}>
                            sai {phanTram(cd.tiLeSai)}
                          </span>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <ThanhTiLe tiLe={cd.tiLeSai} />
                        </div>
                        <div style={{ ...NHAN_NHO, ...SO, marginTop: 2 }}>
                          {cd.soSai}/{cd.soCau} câu sai
                          {cd.soCau < SO_CAU_DU_TIN ? ' · còn ít câu, chưa đủ kết luận' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TheNoiDung>

            <TheNoiDung>
              <h2 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
                Lịch sử ca thi
              </h2>
              {hoSo.ca.length === 0 ? (
                <div style={NHAN_NHO}>Em chưa nộp bài ca nào.</div>
              ) : (
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  {hoSo.ca.map((c) => (
                    <Hang key={`${c.maCa}-${c.lanThu}`} className="flex-col" style={{ alignItems: 'stretch' }} data-ma-ca={c.maCa}>
                      <span className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
                        <span className="flex-1 min-w-0">
                          <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                            {c.tenCa || `Ca ${c.maCa}`}
                            {c.lanThu > 1 ? ` (lần ${c.lanThu})` : ''}
                          </div>
                          <div style={NHAN_NHO}>
                            <span style={SO}>{ngayGio(c.nopLuc)}</span>
                            {c.hang && c.siSo ? (
                              <>
                                {' · hạng '}
                                <span style={SO}>
                                  {c.hang}/{c.siSo}
                                </span>
                              </>
                            ) : ''}
                          </div>
                        </span>
                        <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-3)' }}>
                          {c.tong === null ? 'chưa chấm' : c.tong.toFixed(2).replace('.', ',')}
                        </span>
                      </span>
                      <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                        {c.tong !== null && <Nhan tone={toneXepLoai(c.tong)}>{classify(c.tong)}</Nhan>}
                        {c.trangThai === 'khoa' && <Nhan tone="do">bị khoá</Nhan>}
                        {c.trangThai !== 'khoa' && c.soLanRoiMan > 0 && <Nhan tone="cam">rời màn {c.soLanRoiMan} lần</Nhan>}
                      </span>
                    </Hang>
                  ))}
                </div>
              )}
            </TheNoiDung>

            <TheNoiDung>
              <h2 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
                Bài tập về nhà
              </h2>
              {baiTap === null ? (
                <div style={NHAN_NHO}>Đang tải…</div>
              ) : baiTap.length === 0 ? (
                <div style={NHAN_NHO}>Chưa giao bài tập nào cho em.</div>
              ) : (
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  {baiTap.map((b) => (
                    <Hang key={b.maCa} className="flex-col" style={{ alignItems: 'stretch' }} data-bai-tap={b.maCa}>
                      <span className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
                        <span className="flex-1 min-w-0">
                          <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                            {b.tenCa || `Bài ${b.maCa}`}
                          </div>
                          <div style={NHAN_NHO}>
                            giao <span style={SO}>{ngayGio(b.giaoLuc)}</span>
                            {b.hanNop ? <> · hạn <span style={SO}>{ngayGio(b.hanNop)}</span></> : ''}
                          </div>
                        </span>
                        <span className="shrink-0 font-bold" style={{ ...SO, fontSize: 'var(--cx-3)' }}>
                          {b.tong === null ? '' : b.tong.toFixed(2).replace('.', ',')}
                        </span>
                      </span>
                      <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                        <Nhan tone={NHAN_BAI_TAP[b.trangThai].tone}>{NHAN_BAI_TAP[b.trangThai].ten}</Nhan>
                      </span>
                    </Hang>
                  ))}
                </div>
              )}
            </TheNoiDung>

            {moGiaoBai && (
              <GiaoBaiTap
                sbd={hoSo.em.sbd}
                hoTen={hoSo.em.hoTen}
                chuyenDeEm={hoSo.chuyenDe}
                nguongYeu={NGUONG_YEU}
                onXong={() => {
                  setMoGiaoBai(false)
                  taiLaiBaiTap()
                }}
              />
            )}
          </>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------- DANH SÁCH EM
  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <div className="flex items-center justify-between">
        <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
          Học sinh
        </h1>
        <button onClick={() => setScreen('classlist')} style={NHAN_NHO} className="tap-target">
          Danh sách lớp →
        </button>
      </div>

      {yeuCau.length > 0 && (
        <OThongBao tone="cam">
          <span className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
            <span>
              <b style={SO}>{yeuCau.length}</b> phụ huynh xin giao bài tập: {yeuCau.slice(0, 3).map((y) => y.hoTen || y.sbd).join(', ')}
              {yeuCau.length > 3 ? '…' : ''}
            </span>
            <button onClick={() => moHoSoEm(yeuCau[0].sbd)} className="tap-target font-bold" style={{ ...SO, fontSize: 'var(--cx-1)', textDecoration: 'underline' }}>
              Mở hồ sơ em đầu tiên
            </button>
          </span>
        </OThongBao>
      )}

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
            <div style={{ ...NHAN_NHO, padding: 'var(--k2) 0' }}>{ds.length === 0 ? 'Chưa em nào đăng ký hồ sơ.' : 'Không có em nào khớp bộ lọc.'}</div>
            {ds.length === 0 && (
              <NutChinh variant="phu" onClick={() => setScreen('registrationmanager')}>
                Mở Quản lý đăng ký
              </NutChinh>
            )}
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
                    {!e.coLinkRieng && <Nhan tone="xam">chưa có link riêng</Nhan>}
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
