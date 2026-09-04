// GỌI HỌC SINH LÊN BẢNG.
//
// Ba bước đúng thứ tự thầy làm trên lớp:
//   1. chọn đề trong kho (câu để chữa lấy từ đề này),
//   2. tích em — hoặc lấy nguyên danh sách em vừa thi ca gần nhất,
//   3. bấm "Phân công câu hỏi": mỗi em nhận một câu thuộc chuyên đề em SAI
//      NHIỀU NHẤT trong ca gần nhất của chính em đó.
//
// Máy chủ trả chuyên đề của ca gần nhất qua `hoSoEm`, mỗi em một lượt gọi
// 2–4 giây — nên chỉ gọi cho những em ĐÃ TÍCH, chạy song song 4 em một đợt, và
// hiện rõ đang chạy tới đâu. Thuật toán phân công nằm ở lib/goi-len-bang.ts.
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ClipboardCopy, Check, RefreshCw, Search, Users, Wand2 } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { chuoi, chiTietCa, danhSachCa, danhSachEm, hoSoEm, type CaTomTat, type EmTomTat } from '../lib/exam-api'
import { loadExamSources, loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { bangPhanCongChu, phanCongCauHoi, type CauCoTheGoi, type EmDeGoi, type PhanCong } from '../lib/goi-len-bang'
import type { TeacherExamSource } from '../data/examContent'
import { useAppStore } from '../store/appStore'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE_MUC: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700, color: 'var(--muc)' }
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

/** Đề đã lưu → danh sách câu có thể gọi lên bảng. Câu KHÔNG có chuyên đề vẫn
 * giữ lại: nó dùng được khi đề thiếu câu đúng chuyên đề, chỉ là không ưu tiên. */
function cauTuDe(de: TeacherExamSource): CauCoTheGoi[] {
  const lay = (phan: 'I' | 'II' | 'III', ds: { id: string; text: string; chuyenDe?: string; mucDo?: 'biet' | 'hieu' | 'van_dung' }[]) =>
    ds.map((q, i) => ({
      id: q.id,
      phan,
      so: i + 1,
      chuyenDe: q.chuyenDe,
      mucDo: q.mucDo,
      tomTat: (q.text || '').replace(/\$\\ce\{([^}]*)\}\$/g, '$1').replace(/\s+/g, ' ').trim().slice(0, 90),
    }))
  return [...lay('I', de.phanI), ...lay('II', de.phanII), ...lay('III', de.phanIII)]
}

/** Chạy song song có giới hạn — 251 em mà gọi hết một lúc là máy chủ nghẹn. */
async function songSong<T, R>(ds: T[], soLuong: number, viec: (x: T) => Promise<R>, xong?: (da: number) => void): Promise<R[]> {
  const ra: R[] = new Array(ds.length)
  let i = 0
  let da = 0
  const chay = async () => {
    while (i < ds.length) {
      const k = i++
      ra[k] = await viec(ds[k])
      xong?.(++da)
    }
  }
  await Promise.all(Array.from({ length: Math.min(soLuong, ds.length) }, chay))
  return ra
}

export default function GoiLenBangScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const showToast = useAppStore((s) => s.showToast)

  const [cauHinh, setCauHinh] = useState<{ url: string; mat: string } | null>(null)
  const [deDaLuu, setDeDaLuu] = useState<TeacherExamSource[]>([])
  const [maDe, setMaDe] = useState('')

  const [dsEm, setDsEm] = useState<EmTomTat[] | null>(null)
  const [tim, setTim] = useState('')
  const [tich, setTich] = useState<Set<string>>(new Set())

  const [caGanNhat, setCaGanNhat] = useState<CaTomTat | null>(null)
  const [dangLayCa, setDangLayCa] = useState(false)

  const [dangPhan, setDangPhan] = useState(false)
  const [tienDo, setTienDo] = useState('')
  const [ketQua, setKetQua] = useState<PhanCong[] | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    void (async () => {
      const [url, mat, ds] = await Promise.all([loadScriptUrl(), loadTeacherSecret(), loadExamSources()])
      setDeDaLuu(ds)
      if (ds.length > 0) setMaDe(ds[0].maDe)
      if (url.trim() && mat.trim()) {
        setCauHinh({ url: url.trim(), mat: mat.trim() })
        try {
          setDsEm(await danhSachEm(url.trim(), mat.trim()))
        } catch (e) {
          setLoi(e instanceof Error ? e.message : 'Không lấy được danh sách học sinh')
          setDsEm([])
        }
      } else {
        setLoi('Chưa cấu hình link Apps Script hoặc mã bí mật — vào Ngân hàng câu hỏi → Cấu hình')
        setDsEm([])
      }
    })()
  }, [])

  const de = deDaLuu.find((d) => d.maDe === maDe) ?? null
  const cauHoi = useMemo(() => (de ? cauTuDe(de) : []), [de])

  const dsLoc = useMemo(() => {
    const q = tim.trim().toLowerCase()
    if (!q) return dsEm ?? []
    return (dsEm ?? []).filter((e) => e.sbd.includes(q) || e.hoTen.toLowerCase().includes(q) || e.lop.toLowerCase().includes(q))
  }, [dsEm, tim])

  const doiTich = (sbd: string) =>
    setTich((cu) => {
      const m = new Set(cu)
      if (m.has(sbd)) m.delete(sbd)
      else m.add(sbd)
      return m
    })

  /** TÍCH SẴN EM VỪA THI CA GẦN NHẤT — việc thầy làm nhiều nhất: chấm xong ca,
   * gọi ngay mấy em vừa thi lên chữa. Chỉ lấy em ĐÃ NỘP, vì em bỏ dở thì chưa
   * có dữ liệu chuyên đề để phân câu. */
  const tichEmCaGanNhat = async () => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    setDangLayCa(true)
    setLoi('')
    try {
      const ds = await danhSachCa(cauHinh.url, cauHinh.mat)
      const thi = ds.filter((c) => c.loai !== 'baitap')
      if (thi.length === 0) throw new Error('Chưa có ca thi nào')
      const ca = thi[0]
      const ct = await chiTietCa(cauHinh.url, cauHinh.mat, ca.maCa)
      const daNop = ct.luot.filter((l) => l.trangThai === 'da_nop' || l.trangThai === 'khoa').map((l) => chuoi(l.sbd))
      if (daNop.length === 0) throw new Error(`Ca ${ca.tenCa || ca.maCa} chưa em nào nộp bài`)
      setCaGanNhat(ca)
      setTich(new Set(daNop))
      setKetQua(null)
      showToast(`Đã tích ${daNop.length} em vừa thi ca ${ca.tenCa || ca.maCa}`, 'success')
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không lấy được ca gần nhất')
    } finally {
      setDangLayCa(false)
    }
  }

  const phanCong = async () => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    if (!de) return showToast('Chưa chọn đề', 'warn')
    if (tich.size === 0) return showToast('Chưa tích em nào', 'warn')
    setDangPhan(true)
    setLoi('')
    setKetQua(null)
    try {
      const sbds = (dsEm ?? []).filter((e) => tich.has(e.sbd)).map((e) => e.sbd)
      setTienDo(`0/${sbds.length}`)
      const hoSo = await songSong(
        sbds,
        4,
        async (sbd) => {
          try {
            return await hoSoEm(cauHinh.url, { secret: cauHinh.mat, sbd })
          } catch {
            return null
          }
        },
        (da) => setTienDo(`${da}/${sbds.length}`),
      )
      const emDeGoi: EmDeGoi[] = sbds.map((sbd, i) => {
        const h = hoSo[i]
        const trongDs = (dsEm ?? []).find((e) => e.sbd === sbd)
        return {
          sbd,
          hoTen: h?.em.hoTen || trongDs?.hoTen || '',
          lop: h?.em.lop || trongDs?.lop || '',
          chuyenDeCaGanNhat: h?.chuyenDeCaGanNhat ?? [],
        }
      })
      setKetQua(phanCongCauHoi(emDeGoi, cauHoi))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không phân công được')
    } finally {
      setDangPhan(false)
      setTienDo('')
    }
  }

  const copyBang = async () => {
    if (!ketQua || !de) return
    const t = bangPhanCongChu(ketQua, de.maDe)
    try {
      await navigator.clipboard.writeText(t)
      setDaCopy(true)
      setTimeout(() => setDaCopy(false), 2500)
      showToast('Đã copy bảng phân công', 'success')
    } catch {
      showToast(t, 'success')
    }
  }

  const soDung = ketQua?.filter((p) => p.lyDo === 'dung_chuyen_de_yeu').length ?? 0

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)', fontFamily: 'var(--sans)' }}>
      <button onClick={() => setScreen('examhub')} className="tap-target self-start inline-flex items-center" style={{ ...NHAN_NHO, gap: 4 }}>
        <ArrowLeft size={16} /> Kiểm tra
      </button>
      <h1 className="font-bold" style={{ fontSize: 'var(--cx-5)', fontFamily: 'var(--serif)' }}>
        Gọi học sinh lên bảng
      </h1>

      {loi && <OThongBao tone="do">{loi}</OThongBao>}

      {/* BƯỚC 1 — CHỌN ĐỀ */}
      <TheNoiDung>
        <div style={TIEU_DE_MUC}>1. Đề lấy câu để chữa</div>
        {deDaLuu.length === 0 ? (
          <OThongBao tone="cam">Chưa có đề nào trong máy — vào Ngân hàng câu hỏi bấm Đồng bộ trước.</OThongBao>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
            {deDaLuu.map((d) => {
              const chon = d.maDe === maDe
              const soCau = d.phanI.length + d.phanII.length + d.phanIII.length
              return (
                <button
                  key={d.maDe}
                  type="button"
                  onClick={() => {
                    setMaDe(d.maDe)
                    setKetQua(null)
                  }}
                  className="tap-target w-full text-left"
                  style={{ padding: 'var(--k3) var(--k4)', borderRadius: 'var(--bo-1)', background: chon ? 'var(--xanh-nen)' : 'var(--the-2)', border: `1.5px solid ${chon ? 'var(--xanh)' : 'transparent'}`, color: 'var(--muc)' }}
                >
                  <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
                    <span className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                      Mã {d.maDe}
                    </span>
                    <span style={{ ...NHAN_NHO, ...SO }}>{soCau} câu</span>
                  </div>
                  {d.nhom && <div style={NHAN_NHO}>{d.nhom}</div>}
                </button>
              )
            })}
          </div>
        )}
      </TheNoiDung>

      {/* BƯỚC 2 — TÍCH EM */}
      <TheNoiDung>
        <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
          <div style={TIEU_DE_MUC}>2. Em gọi lên bảng</div>
          <span style={{ ...NHAN_NHO, ...SO }}>đã tích {tich.size}</span>
        </div>

        <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
          <button
            type="button"
            onClick={() => void tichEmCaGanNhat()}
            disabled={dangLayCa}
            className="tap-target inline-flex items-center font-bold"
            style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
          >
            <Users size={16} /> {dangLayCa ? 'Đang lấy ca…' : 'Tích em vừa thi ca gần nhất'}
          </button>
          {tich.size > 0 && (
            <button type="button" onClick={() => setTich(new Set())} className="tap-target" style={{ ...NHAN_NHO, minHeight: 40, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'transparent', border: 'none' }}>
              Bỏ tích hết
            </button>
          )}
        </div>
        {caGanNhat && <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>Ca gần nhất: {caGanNhat.tenCa || `mã ${caGanNhat.maCa}`}</div>}

        <div className="relative" style={{ marginTop: 'var(--k3)' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--nhat)' }} />
          <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm theo tên hoặc số báo danh…" style={O_NHAP} aria-label="Tìm học sinh" />
        </div>

        {dsEm === null ? (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Đang tải danh sách…</div>
        ) : dsLoc.length === 0 ? (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k3)' }}>Không có em nào khớp.</div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--k1)', marginTop: 'var(--k3)', maxHeight: 380, overflowY: 'auto' }}>
            {dsLoc.map((e) => {
              const chon = tich.has(e.sbd)
              return (
                <label key={e.sbd} className="tap-target flex items-center" style={{ gap: 'var(--k3)', padding: 'var(--k2) var(--k3)', borderRadius: 'var(--bo-1)', background: chon ? 'var(--xanh-nen)' : 'transparent', cursor: 'pointer' }}>
                  <input type="checkbox" checked={chon} onChange={() => doiTich(e.sbd)} style={{ width: 20, height: 20, accentColor: 'var(--xanh)' }} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                      {e.hoTen || '(chưa có tên)'}
                    </span>
                    <span style={NHAN_NHO}>
                      SBD <span style={SO}>{e.sbd}</span>
                      {e.lop ? ` · Lớp ${e.lop}` : ''}
                      {e.soCa > 0 ? ` · ${e.soCa} ca` : ' · chưa thi ca nào'}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </TheNoiDung>

      {/* BƯỚC 3 — PHÂN CÔNG */}
      <NutChinh onClick={() => void phanCong()} disabled={dangPhan || tich.size === 0 || !de}>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          {dangPhan ? <RefreshCw size={18} className="animate-spin" /> : <Wand2 size={18} />}
          {dangPhan ? `Đang xem chuyên đề yếu… ${tienDo}` : `Phân công câu hỏi (${tich.size} em)`}
        </span>
      </NutChinh>

      {ketQua && (
        <TheNoiDung>
          <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>Phân công</div>
            <button
              type="button"
              onClick={() => void copyBang()}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: daCopy ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopy ? 'var(--xanh)' : 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
            >
              {daCopy ? <Check size={16} /> : <ClipboardCopy size={16} />} {daCopy ? 'Đã copy' : 'Copy bảng'}
            </button>
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 4 }}>
            <span style={SO}>{soDung}</span>/<span style={SO}>{ketQua.length}</span> em nhận đúng câu chuyên đề mình yếu
          </div>

          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
            {ketQua.map((p) => (
              <Hang key={p.sbd} style={{ alignItems: 'flex-start' }}>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
                    {p.hoTen || `SBD ${p.sbd}`}
                  </span>
                  {p.chuyenDeYeu ? (
                    <span style={NHAN_NHO}>
                      Yếu nhất: {p.chuyenDeYeu.ten} — sai <span style={SO}>{p.chuyenDeYeu.soSai}/{p.chuyenDeYeu.soCau}</span> câu
                    </span>
                  ) : (
                    <span style={NHAN_NHO}>Chưa có dữ liệu chuyên đề</span>
                  )}
                  {p.cau && (
                    <span className="block" style={{ ...NHAN_NHO, color: 'var(--muc)', marginTop: 4 }}>
                      {p.cau.tomTat}
                    </span>
                  )}
                  {p.ghiChu && (
                    <span className="block" style={{ ...NHAN_NHO, color: 'var(--cam)', marginTop: 4 }}>
                      {p.ghiChu}
                    </span>
                  )}
                  <span className="flex items-center flex-wrap" style={{ gap: 4, marginTop: 4 }}>
                    {p.lyDo === 'dung_chuyen_de_yeu' && <Nhan tone="xanh">đúng chuyên đề yếu</Nhan>}
                    {p.lyDo === 'de_khong_co_chuyen_de_nay' && <Nhan tone="cam">đề thiếu chuyên đề này</Nhan>}
                    {p.lyDo === 'chua_co_du_lieu' && <Nhan tone="xam">chưa có dữ liệu</Nhan>}
                    {p.cau?.mucDo && <Nhan tone="tim">{p.cau.mucDo === 'van_dung' ? 'vận dụng' : p.cau.mucDo === 'hieu' ? 'thông hiểu' : 'nhận biết'}</Nhan>}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {p.cau ? (
                    <>
                      <span className="block font-bold" style={{ ...SO, fontSize: 'var(--cx-4)' }}>
                        {p.cau.so}
                      </span>
                      <span style={NHAN_NHO}>Phần {p.cau.phan}</span>
                    </>
                  ) : (
                    <span style={{ ...NHAN_NHO, color: 'var(--mo)' }}>—</span>
                  )}
                </span>
              </Hang>
            ))}
          </div>
        </TheNoiDung>
      )}
    </div>
  )
}
