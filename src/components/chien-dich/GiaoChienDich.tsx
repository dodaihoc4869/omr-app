// BƯỚC TIẾP THEO · GIAO CHIẾN DỊCH LUYỆN (bản vẽ docs/ban-ve-game-hoa-2-2709/GV-GiaoChienDich.dc.html).
// Hiện ở màn ca đã kết thúc (điền sẵn tờ đề + lớp của ca) và ở màn Ca kiểm tra ("Giao chiến dịch mới", chưa điền gì).
// Mỗi lần đổi đầu vào ⇒ gọi `suc-chua` (đồng hồ sức chứa); nút chính "Giao chiến dịch cho N em" ⇒ `tao` (kèm `rutCon` nếu thầy chọn rút).
// Giao xong cho HOÀN TÁC ("Huỷ giao" ⇒ `huy`) thay vì hỏi lại trước (luật C8).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TeacherExamSource } from '../../data/examContent'
import { useAppStore } from '../../store/appStore'
import HopChonDe from '../HopChonDe'
import { huyChienDich, taoChienDich, tinhSucChua, type SucChua } from './api'
import ChonEmGiao, { type EmLop } from './ChonEmGiao'
import DongHoSucChua, { type RutCon } from './DongHoSucChua'
import HopChon from './HopChon'
import { congNgay, hienHanNop, laNgay, ngayVn } from './ngay'
import './chien-dich.css'

export const THE_LUC_MAC_DINH = 40
export const TRAN_HUYET_CHIEN = 80
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
  // Chọn khối → lớp → từng em (khi máy có danh sách học sinh). `boEm` = em thầy bỏ tích.
  const [lopChon, setLopChon] = useState<Set<string>>(() => new Set(lopCa.trim() ? [lopCa.trim()] : []))
  const [boEm, setBoEm] = useState<Set<string>>(new Set())
  const [hanNop, setHanNop] = useState(() => congNgay(homNay, 7))
  const [theLuc, setTheLuc] = useState(THE_LUC_MAC_DINH)
  const [huyetChien, setHuyetChien] = useState(true)

  const [sc, setSc] = useState<SucChua | null>(null)
  const [dangTinh, setDangTinh] = useState(false)
  const [loiTinh, setLoiTinh] = useState('')
  const [rutCon, setRutCon] = useState<RutCon | null>(null)
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
  const dsEm = useMemo<EmLop[]>(
    () => (classList ?? []).map((r) => ({ sbd: String(r.sbd ?? '').trim(), hoTen: String(r.hoTen ?? '').trim(), lop: String(r.lop ?? '').trim() })).filter((e) => e.sbd && e.lop),
    [classList],
  )
  const coDanhSach = dsEm.length > 0
  const dsLop = useMemo(() => [...new Set(dsEm.map((e) => e.lop))].sort((a, b) => a.localeCompare(b, 'vi')), [dsEm])
  const sbdChon = useMemo(() => dsEm.filter((e) => lopChon.has(e.lop) && !boEm.has(e.sbd)).map((e) => e.sbd), [dsEm, lopChon, boEm])
  // Có danh sách ⇒ gửi đúng SBD đã tích (+ tên lớp làm nhãn); không có ⇒ gửi tên lớp gõ tay, máy chủ tự lấy em của lớp.
  const nhanLop = coDanhSach ? [...lopChon].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })).join(', ') : lop.trim()
  const doiTuong = coDanhSach ? { lop: nhanLop, sbd: sbdChon } : { lop: lop.trim() }

  const maDeChon = useMemo(() => to.map((t) => t.maDe).filter((m) => chon.has(m)), [to, chon])
  const hanHopLe = laNgay(hanNop) && hanNop >= homNay
  const duDauVao = maDeChon.length > 0 && (coDanhSach ? sbdChon.length > 0 : lop.trim() !== '') && hanHopLe
  const khoaDauVao = JSON.stringify([maDeChon, doiTuong, hanNop, theLuc])

  // Đổi đầu vào ⇒ gợi ý "rút còn" cũ hết đúng.
  const khoaTruoc = useRef(khoaDauVao)
  useEffect(() => {
    if (khoaTruoc.current === khoaDauVao) return
    khoaTruoc.current = khoaDauVao
    setRutCon(null)
  }, [khoaDauVao])

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
      void tinhSucChua({ ...doiTuong, maDe: maDeChon, hanNop, theLucNgay: theLuc, ...(rutCon ? { rutCon: rutCon.soCau } : {}) }).then((r) => {
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
  }, [khoaDauVao, rutCon?.soCau, lanTinh, duDauVao, daGiao])

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
      ...(rutCon ? { rutCon: rutCon.soCau } : {}),
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
  const tongCau = sc ? (rutCon && sc.soCau > rutCon.soCau ? `Tổng ${sc.soCau} câu → rút còn ${rutCon.soCau} câu` : `Tổng ${sc.soCau} câu`) : ''

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

      {coDanhSach && <ChonEmGiao ds={dsEm} lopChon={lopChon} boEm={boEm} onDoiLop={setLopChon} onDoiBoEm={setBoEm} />}

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
        <label className="cd-truong">
          Thể lực mỗi ngày (câu)
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={TRAN_HUYET_CHIEN}
            value={theLuc}
            onChange={(e) => setTheLuc(Math.max(10, Math.min(TRAN_HUYET_CHIEN, Math.floor(Number(e.target.value) || THE_LUC_MAC_DINH))))}
          />
        </label>
        <label className="cd-tich" style={{ alignSelf: 'end' }}>
          <input type="checkbox" checked={huyetChien} onChange={(e) => setHuyetChien(e.target.checked)} />
          <span>Cho Huyết Chiến tới {TRAN_HUYET_CHIEN} câu/ngày khi em chậm nhịp</span>
        </label>
      </div>

      <DongHoSucChua
        sc={sc}
        dangTinh={dangTinh}
        loi={loiTinh}
        theLuc={theLuc}
        rutCon={rutCon}
        onRut={setRutCon}
        onLuiHan={setHanNop}
        onBoRut={() => setRutCon(null)}
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
