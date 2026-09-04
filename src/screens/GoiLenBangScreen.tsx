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
import { ArrowLeft, ClipboardCopy, Check, RefreshCw, Search, Users, Wand2, Trash2, X, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Hang, Nhan, OThongBao, NutChinh, TheNoiDung } from '../components/DesignSystem'
import { chuoi, chiTietCa, danhSachCa, danhSachEm, ghiLenBang, hoSoEm, khoiTuNamSinh, qidDaLam, type CaTomTat, type EmTomTat } from '../lib/exam-api'
import { loadExamSources, loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { tachNhieuTheoPhan } from '../lib/tach-phan-de'
import HopChonDe from '../components/HopChonDe'
import { bangPhanCongChu, phanCongCauHoi, TEN_MUC, type CauCoTheGoi, type EmDeGoi, type PhanCong } from '../lib/goi-len-bang'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import TheCau from '../components/TheCau'
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
      viTri: i,
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
  const [khoiLoc, setKhoiLoc] = useState<number | null>(null)
  const [tich, setTich] = useState<Set<string>>(new Set())

  const [caGanNhat, setCaGanNhat] = useState<CaTomTat | null>(null)
  const [dangLayCa, setDangLayCa] = useState(false)

  const [dangPhan, setDangPhan] = useState(false)
  const [tienDo, setTienDo] = useState('')
  const [ketQua, setKetQua] = useState<PhanCong[] | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  const [loi, setLoi] = useState('')
  // Sau khi phân công: chạm tên em để xem CÂU ĐẦY ĐỦ kèm lời giải; tích để bỏ
  // bớt em (em vắng, em thầy đổi ý) rồi xoá một lượt.
  const [xemCauCua, setXemCauCua] = useState('')
  const [tichXoa, setTichXoa] = useState<Set<string>>(new Set())
  const [dangCham, setDangCham] = useState('')
  // CÂU ĐÃ GỌI trong buổi này, theo SBD. Bấm "Phân công" lần nữa thì em nhận
  // câu KHÁC — chữa lại đúng câu vừa chữa thì em không tiến thêm bước nào.
  // Cộng thêm câu em đã làm trong bài thi/bài tập (máy chủ trả qua qidDaLam).
  const [daGoi, setDaGoi] = useState<Record<string, string[]>>({})

  useEffect(() => {
    void (async () => {
      const [url, mat, kho] = await Promise.all([loadScriptUrl(), loadTeacherSecret(), loadExamSources()])
      // TÁCH BA MÃ THEO PHẦN, đồng bộ với Ngân hàng đề và Mở ca (thầy chốt 04-09
      // tối). Chữa bài trên bảng thường chỉ chữa trắc nghiệm, hoặc chỉ trả lời
      // ngắn — chọn đúng phần là máy không rút nhầm câu đúng sai lên bảng.
      const ds = tachNhieuTheoPhan(kho)
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
    return (dsEm ?? []).filter((e) => {
      if (khoiLoc !== null && khoiTuNamSinh(e.namSinh) !== khoiLoc) return false
      return !q || e.sbd.includes(q) || e.hoTen.toLowerCase().includes(q) || e.lop.toLowerCase().includes(q)
    })
  }, [dsEm, tim, khoiLoc])

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
            // Lấy CÙNG LÚC hồ sơ và tập câu em đã làm: hai lệnh nối tiếp nhau
            // thì 30 em mất gấp đôi thời gian chờ.
            const [h, qids] = await Promise.all([
              hoSoEm(cauHinh.url, { secret: cauHinh.mat, sbd }),
              qidDaLam(cauHinh.url, cauHinh.mat, sbd).catch(() => [] as string[]),
            ])
            return { h, qids }
          } catch {
            return null
          }
        },
        (da) => setTienDo(`${da}/${sbds.length}`),
      )
      const emDeGoi: EmDeGoi[] = sbds.map((sbd, i) => {
        const h = hoSo[i]?.h
        const trongDs = (dsEm ?? []).find((e) => e.sbd === sbd)
        return {
          sbd,
          hoTen: h?.em.hoTen || trongDs?.hoTen || '',
          lop: h?.em.lop || trongDs?.lop || '',
          chuyenDeCaGanNhat: h?.chuyenDeCaGanNhat ?? [],
        }
      })

      // Câu cần tránh = câu đã gọi trong buổi này + câu em đã làm trước đó.
      const tranh: Record<string, string[]> = {}
      sbds.forEach((sbd, i) => {
        tranh[sbd] = [...new Set([...(daGoi[sbd] ?? []), ...(hoSo[i]?.qids ?? [])])]
      })

      const kq = phanCongCauHoi(emDeGoi, cauHoi, tranh)
      setKetQua(kq)
      // Ghi nhớ ngay: lần bấm sau phải ra câu khác.
      setDaGoi((cu) => {
        const m = { ...cu }
        for (const p of kq) if (p.cau) m[p.sbd] = [...new Set([...(m[p.sbd] ?? []), p.cau.id])]
        return m
      })
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

  /** Câu ĐẦY ĐỦ (phương án, hình, lời giải) từ đề đang chọn — dựng thẻ y hệt
   * lúc em xem lại bài, không vẽ lại một kiểu hiển thị thứ hai. */
  const cauDayDu = (c: CauCoTheGoi) => {
    if (!de) return null
    if (c.phan === 'I') return { phan: 'I' as const, q: de.phanI[c.viTri] as TeacherMcqQuestion | undefined }
    if (c.phan === 'II') return { phan: 'II' as const, q: de.phanII[c.viTri] as TeacherTrueFalseQuestion | undefined }
    return { phan: 'III' as const, q: de.phanIII[c.viTri] as TeacherShortAnswerQuestion | undefined }
  }

  const doiTichXoa = (sbd: string) =>
    setTichXoa((cu) => {
      const m = new Set(cu)
      if (m.has(sbd)) m.delete(sbd)
      else m.add(sbd)
      return m
    })

  /** Bỏ em khỏi bảng phân công. KHÔNG phân công lại cho em còn lại: thầy đã đọc
   * bảng rồi, câu tự nhảy sang em khác thì gọi nhầm ngay trên lớp. */
  /** CHẤM CÂU TRÊN BẢNG: ghi đạt/không đạt vào log mạnh–yếu của em rồi bỏ em
   * khỏi bảng — chữa xong là xong, không để lẫn với em chưa gọi.
   *
   * Ghi hỏng thì KHÔNG bỏ khỏi bảng: mất dòng mà không có gì trên máy chủ là
   * thầy tưởng đã ghi rồi. */
  const chamLenBang = async (p: PhanCong, dat: boolean) => {
    if (!cauHinh) return showToast('Chưa cấu hình máy chủ', 'error')
    const cd = p.chuyenDeYeu?.ten || p.cau?.chuyenDe || ''
    if (!cd) return showToast('Câu này không có chuyên đề — chưa ghi được vào log mạnh–yếu', 'warn')
    setDangCham(p.sbd)
    try {
      await ghiLenBang(cauHinh.url, cauHinh.mat, { sbd: p.sbd, chuyenDe: cd, dat, qid: p.cau?.id })
      showToast(`${p.hoTen || p.sbd}: ${dat ? 'đạt' : 'không đạt'} — đã ghi vào ${cd}`, dat ? 'success' : 'warn')
      setKetQua((cu) => (cu ?? []).filter((x) => x.sbd !== p.sbd))
      setTich((cu) => new Set([...cu].filter((x) => x !== p.sbd)))
      setTichXoa((cu) => new Set([...cu].filter((x) => x !== p.sbd)))
      if (xemCauCua === p.sbd) setXemCauCua('')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không ghi được kết quả', 'error')
    } finally {
      setDangCham('')
    }
  }

  const xoaKhoiBang = (sbds: Set<string>) => {
    if (!ketQua || sbds.size === 0) return
    const con = ketQua.filter((p) => !sbds.has(p.sbd))
    setKetQua(con)
    setTich((cu) => new Set([...cu].filter((x) => !sbds.has(x))))
    setTichXoa(new Set())
    if (xemCauCua && sbds.has(xemCauCua)) setXemCauCua('')
    showToast(`Đã bỏ ${sbds.size} em khỏi bảng phân công`, 'success')
  }

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
          <div style={{ marginTop: 'var(--k3)' }}>
            {/* Hộp chọn đề gọn, cuộn trong hộp — cùng một hộp với màn Mở ca. */}
            <HopChonDe
              ds={deDaLuu}
              daChon={new Set(maDe ? [maDe] : [])}
              onChon={(ma) => {
                setMaDe(ma)
                setKetQua(null)
              }}
              cao={264}
            />
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

        {/* Lọc khối trước rồi mới gõ tên: 251 em ba khối, không lọc thì gõ tên
            nào cũng ra vài em trùng của khối khác. */}
        <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
          {([null, 10, 11, 12] as (number | null)[]).map((k) => {
            const chon = khoiLoc === k
            return (
              <button
                key={String(k)}
                type="button"
                onClick={() => setKhoiLoc(k)}
                className="tap-target font-bold"
                style={{ minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: chon ? 'var(--muc)' : 'var(--the-2)', color: chon ? 'var(--muc-nguoc)' : 'var(--muc)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
              >
                {k === null ? 'Tất cả' : `Khối ${k}`}
              </button>
            )
          })}
          <span style={{ ...NHAN_NHO, ...SO }}>{dsLoc.length} em</span>
        </div>

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
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--k2)' }}>
            <div style={TIEU_DE_MUC}>Phân công</div>
            <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
              {tichXoa.size > 0 && (
                <button
                  type="button"
                  onClick={() => xoaKhoiBang(tichXoa)}
                  className="tap-target inline-flex items-center font-bold"
                  style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--do-nen)', color: 'var(--do)', border: 'none', fontSize: 'var(--cx-1)' }}
                >
                  <Trash2 size={16} /> Xoá {tichXoa.size} em đã tích
                </button>
              )}
              <button
                type="button"
                onClick={() => void copyBang()}
                className="tap-target inline-flex items-center font-bold"
                style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: daCopy ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopy ? 'var(--xanh)' : 'var(--muc)', border: 'none', fontSize: 'var(--cx-1)' }}
              >
                {daCopy ? <Check size={16} /> : <ClipboardCopy size={16} />} {daCopy ? 'Đã copy' : 'Copy bảng'}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap" style={{ ...NHAN_NHO, marginTop: 4, gap: 'var(--k2)' }}>
            <span>
              <span style={SO}>{soDung}</span>/<span style={SO}>{ketQua.length}</span> em nhận đúng câu chuyên đề mình yếu · chạm tên em để xem câu và lời giải · bấm phân công lần nữa là ra câu khác, khó hơn một bậc
            </span>
            {ketQua.length > 0 && (
              <button
                type="button"
                onClick={() => setTichXoa(tichXoa.size === ketQua.length ? new Set() : new Set(ketQua.map((p) => p.sbd)))}
                className="tap-target"
                style={{ ...NHAN_NHO, minHeight: 32, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', border: 'none' }}
              >
                {tichXoa.size === ketQua.length ? 'Bỏ tích hết' : 'Tích hết'}
              </button>
            )}
          </div>

          <div className="flex flex-col" style={{ gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
            {ketQua.map((p) => {
              const mo = xemCauCua === p.sbd
              const day = p.cau ? cauDayDu(p.cau) : null
              return (
                <div key={p.sbd} className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  <Hang style={{ alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={tichXoa.has(p.sbd)}
                      onChange={() => doiTichXoa(p.sbd)}
                      aria-label={`Tích để xoá ${p.hoTen || p.sbd}`}
                      style={{ width: 20, height: 20, accentColor: 'var(--do)', marginTop: 2, marginRight: 'var(--k3)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setXemCauCua(mo ? '' : p.sbd)}
                      className="flex-1 min-w-0 text-left tap-target"
                      style={{ background: 'none', border: 'none', padding: 0, minHeight: 0, color: 'var(--muc)' }}
                    >
                      <span className="block font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', textDecoration: 'underline', textDecorationColor: 'var(--vien-dam)', textUnderlineOffset: 3 }}>
                        {p.hoTen || `SBD ${p.sbd}`}
                      </span>
                      {p.chuyenDeYeu ? (
                        <span style={NHAN_NHO}>
                          Yếu nhất: {p.chuyenDeYeu.ten} — sai <span style={SO}>{p.chuyenDeYeu.soSai}/{p.chuyenDeYeu.soCau}</span> câu
                        </span>
                      ) : (
                        <span style={NHAN_NHO}>Chưa có dữ liệu chuyên đề</span>
                      )}
                      {p.cau && !mo && (
                        <span className="block" style={{ ...NHAN_NHO, color: 'var(--muc)', marginTop: 4 }}>
                          {p.cau.tomTat}
                        </span>
                      )}
                      {p.viSao && (
                        <span className="block" style={{ ...NHAN_NHO, marginTop: 2 }}>
                          {p.viSao}
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
                        {p.lyDo === 'het_cau_moi' && <Nhan tone="cam">hết câu mới</Nhan>}
                        {p.cau?.mucDo && <Nhan tone="tim">{TEN_MUC[p.cau.mucDo]}</Nhan>}
                      </span>
                    </button>
                    <span className="shrink-0 text-right flex items-start" style={{ gap: 'var(--k2)' }}>
                      <span>
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
                      <button
                        type="button"
                        onClick={() => xoaKhoiBang(new Set([p.sbd]))}
                        aria-label={`Bỏ ${p.hoTen || p.sbd} khỏi bảng`}
                        className="tap-target flex items-center justify-center"
                        style={{ width: 32, height: 32, borderRadius: 'var(--bo-tron)', background: 'transparent', border: 'none', color: 'var(--mo)' }}
                      >
                        <X size={16} />
                      </button>
                    </span>
                  </Hang>

                  {/* CHẤM NGAY TẠI LỚP: chữa xong bấm một nút, kết quả vào log
                      mạnh–yếu của em và hàng này biến khỏi bảng. */}
                  <div className="flex items-center flex-wrap" style={{ gap: 'var(--k2)', paddingLeft: 'var(--k6)' }}>
                    <button
                      type="button"
                      onClick={() => void chamLenBang(p, true)}
                      disabled={dangCham === p.sbd}
                      className="tap-target inline-flex items-center font-bold"
                      style={{ gap: 6, minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--xanh-nen)', color: 'var(--xanh)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                    >
                      <ThumbsUp size={15} /> Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => void chamLenBang(p, false)}
                      disabled={dangCham === p.sbd}
                      className="tap-target inline-flex items-center font-bold"
                      style={{ gap: 6, minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--do-nen)', color: 'var(--do)', border: 'none', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
                    >
                      <ThumbsDown size={15} /> Không đạt
                    </button>
                    {dangCham === p.sbd && <span style={NHAN_NHO}>Đang ghi…</span>}
                  </div>

                  {/* CÂU ĐẦY ĐỦ + LỜI GIẢI — dựng bằng đúng thẻ câu của màn xem
                      lại, nên công thức, hình và lời giải hiện y như em thấy. */}
                  {mo && (
                    <div style={{ paddingLeft: 'var(--k2)' }}>
                      {!day?.q ? (
                        <OThongBao tone="cam">Không tìm thấy câu này trong đề đang chọn — thầy đổi đề rồi phân công lại.</OThongBao>
                      ) : day.phan === 'I' ? (
                        <TheCau
                          cheDo="xem_lai"
                          phan="I"
                          stt={p.cau!.so}
                          tieuDe={day.q.tieuDe}
                          text={day.q.text}
                          thanCauImg={day.q.thanCauImg}
                          table={day.q.table}
                          imageDataUrl={day.q.imageDataUrl}
                          hinhAnh={day.q.hinhAnh}
                          choices={day.q.choices}
                          choiceImgs={day.q.choiceImgs}
                          choicePerm={[0, 1, 2, 3]}
                          selected={null}
                          correct={day.q.correct}
                          explanation={day.q.explanation}
                          loiGiai={day.q.loiGiai}
                          nhanLoiGiai={day.q.loiGiaiTrangThai}
                        />
                      ) : day.phan === 'II' ? (
                        <TheCau
                          cheDo="xem_lai"
                          phan="II"
                          stt={p.cau!.so}
                          tieuDe={day.q.tieuDe}
                          text={day.q.text}
                          thanCauImg={day.q.thanCauImg}
                          table={day.q.table}
                          imageDataUrl={day.q.imageDataUrl}
                          hinhAnh={day.q.hinhAnh}
                          ideas={day.q.ideas}
                          ideaImgs={day.q.ideaImgs}
                          selected={[null, null, null, null]}
                          correct={day.q.correct}
                          explanation={day.q.explanation}
                          loiGiai={day.q.loiGiai}
                          nhanLoiGiai={day.q.loiGiaiTrangThai}
                        />
                      ) : (
                        <TheCau
                          cheDo="xem_lai"
                          phan="III"
                          stt={p.cau!.so}
                          tieuDe={day.q.tieuDe}
                          text={day.q.text}
                          thanCauImg={day.q.thanCauImg}
                          table={day.q.table}
                          imageDataUrl={day.q.imageDataUrl}
                          hinhAnh={day.q.hinhAnh}
                          selected={null}
                          correct={day.q.correct}
                          explanation={day.q.explanation}
                          loiGiai={day.q.loiGiai}
                          nhanLoiGiai={day.q.loiGiaiTrangThai}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </TheNoiDung>
      )}
    </div>
  )
}
