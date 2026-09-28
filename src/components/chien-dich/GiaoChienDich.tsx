// BƯỚC TIẾP THEO · GIAO CHIẾN DỊCH LUYỆN (bản vẽ docs/ban-ve-game-hoa-2-2709/GV-GiaoChienDich.dc.html).
// Hiện ở màn ca đã kết thúc (điền sẵn tờ đề + lớp của ca) và ở màn Ca kiểm tra ("Giao chiến dịch mới", chưa điền gì).
// Mỗi lần đổi đầu vào ⇒ gọi `suc-chua` (đồng hồ sức chứa); nút chính "Giao chiến dịch cho N em" ⇒ `tao`.
// Thầy 28/09: thể lực/ngày điền số bất kì + nút gạt "Tự động" (máy chủ tính thể lực nhỏ nhất bảo đảm mục tiêu); bỏ "rút còn" và "lùi hạn nộp".
// Giao xong cho HOÀN TÁC ("Huỷ giao" ⇒ `huy`) thay vì hỏi lại trước (luật C8).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TeacherExamSource } from '../../data/examContent'
import { useAppStore } from '../../store/appStore'
import HopChonDe from '../HopChonDe'
import { docDsEm, huyChienDich, taoChienDich, tinhSucChua, type SucChua } from './api'
import ChonEmGiao, { khoiCuaLop, type EmLop } from './ChonEmGiao'
import DongHoSucChua from './DongHoSucChua'
import HopChon from './HopChon'
import { congNgay, hienHanNop, laNgay, ngayVn } from './ngay'
import './chien-dich.css'

export const THE_LUC_MAC_DINH = 40
export const TRAN_HUYET_CHIEN = 80
/** Chặn số vô nghĩa (giống máy chủ `THE_LUC_TOI_DA`). */
export const THE_LUC_TOI_DA = 500
/** Chờ thầy gõ xong rồi mới hỏi máy chủ (ms). */
const CHO_TINH_MS = 350

interface ToDe {
  maDe: string
  tuCa: boolean
}


export default function GiaoChienDich({
  maCa,
  lop: lopCa = '',
  maDeCa = [],
  tenGoiY = '',
  nowMs,
  onXong,
  onDeSau,
}: {
  maCa?: string
  lop?: string
  /** Tờ đề (mã kho máy chủ) của ca vừa kiểm tra — tích sẵn. */
  maDeCa?: string[]
  tenGoiY?: string
  nowMs?: number
  onXong?: (id: string) => void
  onDeSau?: () => void
}) {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const classList = useAppStore((s) => s.classList) as { sbd?: string; hoTen?: string; lop?: string }[] | undefined
  const homNay = useMemo(() => ngayVn(nowMs ?? Date.now()), [nowMs])

  const [ten, setTen] = useState(tenGoiY || 'Chiến dịch luyện')
  const [to, setTo] = useState<ToDe[]>(() => maDeCa.map((m) => ({ maDe: m, tuCa: true })))
  const [chon, setChon] = useState<Set<string>>(() => new Set(maDeCa))
  const [lop, setLop] = useState(lopCa)
  // Tập SBD nhận chiến dịch — ba cách tích (toàn khối / theo lớp / từng em) cùng sửa tập này.
  const [chonEm, setChonEm] = useState<Set<string>>(new Set())
  const daDienSan = useRef(false)
  const [hanNop, setHanNop] = useState(() => congNgay(homNay, 7))
  const [theLuc, setTheLuc] = useState(THE_LUC_MAC_DINH)
  // Ô thể lực giữ CHỮ thầy đang gõ (xoá trắng để gõ lại được); số hợp lệ mới đổi `theLuc`.
  const [theLucChu, setTheLucChu] = useState(String(THE_LUC_MAC_DINH))
  const [tuDong, setTuDong] = useState(true)
  const [huyetChien, setHuyetChien] = useState(true)

  const [sc, setSc] = useState<SucChua | null>(null)
  const [dangTinh, setDangTinh] = useState(false)
  const [loiTinh, setLoiTinh] = useState('')
  const [lanTinh, setLanTinh] = useState(0)

  const [dangGiao, setDangGiao] = useState(false)
  const [loiGiao, setLoiGiao] = useState('')
  const [daGiao, setDaGiao] = useState<{ id: string; soCau: number; soEm: number } | null>(null)
  const [dangHuy, setDangHuy] = useState(false)

  // Ngân hàng đề trên máy này — ĐỦ mọi tờ, tách theo phần y như màn Mở ca (thầy 28/09: "chưa hiển thị đầy đủ đề kho đề").
  // KHÔNG khử trùng cả kho ở đây: khử trước khi chọn làm tờ trùng hết câu BIẾN MẤT khỏi cây. Câu trùng giữa các tờ ĐÃ TÍCH do máy chủ bỏ khi giao.
  const [kho, setKho] = useState<TeacherExamSource[]>([])
  const [moHopDe, setMoHopDe] = useState(false)
  const [chonTam, setChonTam] = useState<Set<string>>(new Set())
  useEffect(() => {
    let huy = false
    void (async () => {
      try {
        const [{ loadExamSources }, { tachNhieuTheoPhan }] = await Promise.all([import('../../lib/exam-db'), import('../../lib/tach-phan-de')])
        const ds = tachNhieuTheoPhan(await loadExamSources())
        if (!huy) setKho(ds)
      } catch {
        /* không đọc được kho: tờ hiện bằng mã, không có số câu */
      }
    })()
    return () => {
      huy = true
    }
  }, [])
  // Danh sách học sinh: ƯU TIÊN máy chủ (cùng bảng máy chủ dùng khi giao) — máy thầy chưa nạp "Danh sách lớp" vẫn chọn được khối/lớp/em.
  // Máy chủ không trả lời ⇒ dùng danh sách trên máy; cả hai rỗng ⇒ lùi về ô gõ tên lớp.
  const [emMayChu, setEmMayChu] = useState<{ sbd: string; hoTen: string; khoi?: string; lop?: string; tenLop?: string }[] | null>(null)
  useEffect(() => {
    let huy = false
    void docDsEm().then((r) => {
      if (!huy && r.ok && Array.isArray(r.du.em) && r.du.em.length > 0) setEmMayChu(r.du.em)
    }).catch(() => {})
    return () => {
      huy = true
    }
  }, [])
  const dsEm = useMemo<EmLop[]>(
    () =>
      emMayChu
        ? emMayChu.map((e) => {
            const khoi = String(e.khoi ?? e.lop ?? '').trim()
            return { sbd: e.sbd, hoTen: e.hoTen, khoi: khoiCuaLop(khoi), tenLop: String(e.tenLop ?? '').trim() || khoi }
          }).filter((e) => e.sbd && e.tenLop)
        : (classList ?? [])
            .map((r) => {
              const lop = String(r.lop ?? '').trim()
              return { sbd: String(r.sbd ?? '').trim(), hoTen: String(r.hoTen ?? '').trim(), khoi: khoiCuaLop(lop), tenLop: lop }
            })
            .filter((e) => e.sbd && e.tenLop),
    [emMayChu, classList],
  )
  const coDanhSach = dsEm.length > 0
  const dsLop = useMemo(() => [...new Set(dsEm.map((e) => e.tenLop))].sort((a, b) => a.localeCompare(b, 'vi')), [dsEm])
  // Ca vừa kiểm tra có lớp ⇒ tích sẵn em của khối/lớp đó MỘT lần khi danh sách về.
  useEffect(() => {
    if (daDienSan.current || !coDanhSach) return
    daDienSan.current = true
    const l = lopCa.trim()
    if (l) setChonEm(new Set(dsEm.filter((e) => e.khoi === l || e.tenLop === l).map((e) => e.sbd)))
  }, [coDanhSach, dsEm, lopCa])
  const sbdChon = useMemo(() => dsEm.filter((e) => chonEm.has(e.sbd)).map((e) => e.sbd), [dsEm, chonEm])
  // Nhãn: khối chọn đủ ⇒ "Khối 12"; còn lại ⇒ tên các lớp có em được chọn.
  const nhanLop = useMemo(() => {
    if (!coDanhSach) return lop.trim()
    const ra: string[] = []
    const khoi = [...new Set(dsEm.map((e) => e.khoi))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))
    for (const k of khoi) {
      const cua = dsEm.filter((e) => e.khoi === k)
      const chon = cua.filter((e) => chonEm.has(e.sbd))
      if (!chon.length) continue
      if (chon.length === cua.length) ra.push(k === 'Khác' ? 'Khác' : `Khối ${k}`)
      else ra.push(...[...new Set(chon.map((e) => e.tenLop))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })))
    }
    return ra.join(', ')
  }, [coDanhSach, dsEm, chonEm, lop])
  // Có danh sách ⇒ gửi đúng SBD đã tích (+ nhãn); không có ⇒ gửi tên lớp gõ tay, máy chủ tự lấy em của lớp.
  const doiTuong = coDanhSach ? { lop: nhanLop, sbd: sbdChon } : { lop: lop.trim() }

  const maDeChon = useMemo(() => to.map((t) => t.maDe).filter((m) => chon.has(m)), [to, chon])
  const hanHopLe = laNgay(hanNop) && hanNop >= homNay
  const duDauVao = maDeChon.length > 0 && (coDanhSach ? sbdChon.length > 0 : lop.trim() !== '') && hanHopLe
  const khoaDauVao = JSON.stringify([maDeChon, doiTuong, hanNop, theLuc])

  // ĐỒNG HỒ SỨC CHỨA: gọi lại mỗi khi đổi đầu vào (chờ thầy gõ xong); câu trả lời cũ về muộn thì bỏ.
  const luotTinh = useRef(0)
  useEffect(() => {
    if (daGiao) return
    if (!duDauVao) {
      setSc(null)
      setLoiTinh('')
      setDangTinh(false)
      return
    }
    const luot = ++luotTinh.current
    setDangTinh(true)
    const hen = setTimeout(() => {
      void tinhSucChua({ ...doiTuong, maDe: maDeChon, hanNop, theLucNgay: theLuc }).then((r) => {
        if (luot !== luotTinh.current) return
        setDangTinh(false)
        if (r.ok) {
          setSc(r.du)
          setLoiTinh('')
        } else {
          setSc(null)
          setLoiTinh(r.chu)
        }
      })
    }, CHO_TINH_MS)
    return () => clearTimeout(hen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaDauVao, lanTinh, duDauVao, daGiao])

  // TỰ ĐỘNG: đặt thể lực = số máy chủ đề xuất (khối lượng lượt không phụ thuộc thể lực ⇒ một vòng là đứng).
  useEffect(() => {
    if (!tuDong || !sc?.theLucDeXuat || sc.theLucDeXuat === theLuc) return
    setTheLuc(sc.theLucDeXuat)
    setTheLucChu(String(sc.theLucDeXuat))
  }, [tuDong, sc?.theLucDeXuat, theLuc])

  const giao = async () => {
    if (!duDauVao || dangGiao) return
    setDangGiao(true)
    setLoiGiao('')
    const r = await taoChienDich({
      ten: ten.trim() || 'Chiến dịch luyện',
      ...doiTuong,
      maDe: maDeChon,
      hanNop,
      theLucNgay: theLuc,
      huyetChien,
      ...(maCa ? { maCa } : {}),
    })
    setDangGiao(false)
    if (!r.ok) {
      setLoiGiao(r.chu)
      return
    }
    setDaGiao(r.du)
    showToast(`Đã giao chiến dịch cho ${r.du.soEm} em · ${r.du.soCau} câu`, 'success')
    onXong?.(r.du.id)
  }

  const huyGiao = async () => {
    if (!daGiao || dangHuy) return
    setDangHuy(true)
    const r = await huyChienDich(daGiao.id)
    setDangHuy(false)
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    setDaGiao(null)
    showToast('Đã huỷ chiến dịch vừa giao — học sinh không nhận nữa', 'success')
  }

  const doiTich = (m: string) =>
    setChon((cu) => {
      const s = new Set(cu)
      if (s.has(m)) s.delete(m)
      else s.add(m)
      return s
    })

  const themTo = () => {
    const moi = [...chonTam].filter(Boolean)
    setTo((cu) => [...cu, ...moi.filter((m, i) => moi.indexOf(m) === i && !cu.some((t) => t.maDe === m)).map((m) => ({ maDe: m, tuCa: false }))])
    setChon((cu) => new Set([...cu, ...moi]))
    setMoHopDe(false)
  }

  if (daGiao) {
    return (
      <section className="cd-the" data-khoi="giao-chien-dich" aria-live="polite">
        <span className="cd-nhan-buoc">ĐÃ GIAO CHIẾN DỊCH</span>
        <h2>{ten.trim() || 'Chiến dịch luyện'}</h2>
        <p className="cd-phu">
          {daGiao.soEm} em · {daGiao.soCau} câu · hạn nộp {hienHanNop(hanNop)}. Theo dõi ở mục Lên bảng.
        </p>
        <div className="cd-hang-nut">
          <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangHuy} onClick={() => void huyGiao()}>
            {dangHuy ? 'Đang huỷ…' : 'Huỷ giao'}
          </button>
          <button type="button" className="m3-nut-chinh" onClick={() => setScreen('goilenbang')}>
            Xem bảng chiến dịch
          </button>
        </div>
      </section>
    )
  }

  const soEm = sc?.soEm ?? 0
  const tongCau = sc ? `Tổng ${sc.soCau} câu` : ''

  return (
    <section className="cd-the" data-khoi="giao-chien-dich" aria-labelledby="cd-giao-tieu-de">
      <div>
        <span className="cd-nhan-buoc">{maCa ? 'BƯỚC TIẾP THEO' : 'CHIẾN DỊCH MỚI'}</span>
        <h2 id="cd-giao-tieu-de">Giao chiến dịch luyện{ten.trim() ? `: ${ten.trim()}` : ''}</h2>
      </div>

      <label className="cd-truong">
        Tên chiến dịch
        <input type="text" value={ten} maxLength={80} onChange={(e) => setTen(e.target.value)} />
      </label>

      <fieldset className="cd-truong" style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ padding: 0, marginBottom: 4 }}>Câu trong chiến dịch</legend>
        {to.length === 0 && <p className="cd-phu">Chưa có tờ đề nào — thêm tờ từ Ngân hàng đề.</p>}
        {to.map((t) => {
          // Số câu DÙNG ĐƯỢC của tờ do máy chủ đếm (đã bỏ trùng, tự luận, chưa duyệt) ⇒ cộng các tờ = tổng bên dưới.
          const n = sc?.soCauTheoTo?.[t.maDe]
          return (
            <label key={t.maDe} className="cd-tich">
              <input type="checkbox" checked={chon.has(t.maDe)} onChange={() => doiTich(t.maDe)} />
              <span>
                {t.tuCa ? `Đề vừa kiểm tra · ${t.maDe}` : t.maDe}
                {n !== undefined && chon.has(t.maDe) ? ` · ${n} câu` : ''}
              </span>
            </label>
          )
        })}
        <div>
          <button
            type="button"
            className="m3-nut-chu cd-nut-nho"
            onClick={() => {
              setChonTam(new Set())
              setMoHopDe(true)
            }}
          >
            + Thêm tờ đề từ Ngân hàng đề
          </button>
        </div>
        {tongCau && <small className="cd-so">{tongCau} · đã bỏ câu tự luận và câu chưa duyệt</small>}
      </fieldset>

      {coDanhSach && <ChonEmGiao ds={dsEm} chon={chonEm} onDoi={setChonEm} />}

      <div className="cd-luoi-2">
        {!coDanhSach && (
          <label className="cd-truong">
            Giao cho lớp
            <input type="text" list="cd-ds-lop" value={lop} placeholder="Ví dụ 12A1" onChange={(e) => setLop(e.target.value)} />
            <small className="cd-so">{sc ? `Lớp ${lop.trim()} · ${sc.soEm} em` : lop.trim() ? `Lớp ${lop.trim()}` : 'Chọn lớp để giao'}</small>
            <datalist id="cd-ds-lop">
              {dsLop.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>
        )}
        <label className="cd-truong">
          Hạn nộp (hết lúc 23:59)
          <input type="date" value={hanNop} min={homNay} onChange={(e) => setHanNop(e.target.value)} />
          <small className="cd-so">{hanHopLe ? hienHanNop(hanNop) : 'Hạn nộp phải từ hôm nay trở đi'}</small>
        </label>
      </div>

      <div className="cd-luoi-2">
        <div className="cd-truong">
          <label htmlFor="cd-the-luc">Thể lực mỗi ngày (lượt câu)</label>
          <input
            id="cd-the-luc"
            type="number"
            inputMode="numeric"
            min={1}
            max={THE_LUC_TOI_DA}
            value={theLucChu}
            disabled={tuDong}
            onChange={(e) => {
              setTheLucChu(e.target.value)
              const n = Math.floor(Number(e.target.value))
              if (Number.isFinite(n) && n >= 1) setTheLuc(Math.min(THE_LUC_TOI_DA, n))
            }}
          />
          <label className="cd-tich cd-gat">
            <input type="checkbox" role="switch" checked={tuDong} onChange={(e) => setTuDong(e.target.checked)} />
            <span>Tự động: máy tính số lượt/ngày nhỏ nhất đủ để cả lớp kịp hạn nộp</span>
          </label>
          <small className="cd-so">
            {tuDong ? (sc?.theLucDeXuat ? `Máy đề xuất ${sc.theLucDeXuat} lượt/ngày · em ở giữa lớp ≤ 70% sức chứa, không em nào quá tải` : 'Đang tính…') : 'Gõ số bất kì; gạt Tự động để máy tính'}
          </small>
        </div>
        <label className="cd-tich" style={{ alignSelf: 'end' }}>
          <input type="checkbox" checked={huyetChien} onChange={(e) => setHuyetChien(e.target.checked)} />
          <span>Cho Huyết Chiến tới {2 * theLuc} câu/ngày khi em chậm nhịp (tự tính: gấp đôi thể lực)</span>
        </label>
      </div>

      <DongHoSucChua
        sc={sc}
        dangTinh={dangTinh}
        loi={loiTinh}
        theLuc={theLuc}
        onTinhLai={() => setLanTinh((x) => x + 1)}
      />

      {loiGiao && (
        <p className="cd-loi" role="alert">
          {loiGiao}
        </p>
      )}
      <div className="cd-hang-nut">
        {onDeSau && (
          <button type="button" className="m3-nut-chu cd-nut-nho" onClick={onDeSau}>
            Để sau
          </button>
        )}
        <button type="button" className="m3-nut-chinh" disabled={!duDauVao || !sc || dangTinh || dangGiao} onClick={() => void giao()}>
          {dangGiao ? 'Đang giao…' : `Giao chiến dịch cho ${soEm} em`}
        </button>
      </div>

      {moHopDe && (
        <HopChon
          tieuDe="Thêm tờ đề từ Ngân hàng đề"
          moTa="Tích các tờ muốn đưa vào chiến dịch. Câu tự luận và câu chưa duyệt tự bỏ."
          nhanXacNhan={`Thêm ${chonTam.size} tờ`}
          xacNhanDuoc={chonTam.size > 0}
          onXacNhan={themTo}
          onDong={() => setMoHopDe(false)}
          rong={640}
        >
          {kho.length === 0 ? (
            <p className="cd-phu">Máy này chưa có Ngân hàng đề — vào Ngân hàng đề để đồng bộ trước.</p>
          ) : (
            <HopChonDe
              ds={kho}
              daChon={chonTam}
              chonNhieu
              onChon={(m) =>
                setChonTam((cu) => {
                  const s = new Set(cu)
                  if (s.has(m)) s.delete(m)
                  else s.add(m)
                  return s
                })
              }
              onChonTatCa={(ma) => setChonTam(new Set(ma))}
            />
          )}
        </HopChon>
      )}
    </section>
  )
}
