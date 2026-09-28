// LÊN BẢNG — CHẾ ĐỘ GAME HÓA 2.0 (chỉ khi cờ bật; cờ tắt thì màn Gọi lên bảng chạy như cũ).
// Đầu màn chọn chiến dịch (`danh-sach`). Chiến dịch đang chạy ⇒ Bảng chiến dịch (`bang`); hết hạn nộp ⇒ TỰ chuyển Buổi chữa
// (`buoi-chua`), kể cả khi màn đang mở đúng lúc qua 23:59. Tờ máy chiếu dùng lại luồng có sẵn (`to-chieu.ts` + `KhungXemPhieu`).
// Tờ có hai nút Đạt / Chưa đạt (cầu nối của Gọi lên bảng, `ghi-to-chieu.ts`); kết quả hiện lại trên Buổi chữa.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { chuThieuNoiDung } from '../../lib/tra-cau-chieu'
import KhungXemPhieu from '../KhungXemPhieu'
import { danhSach, docBang, docBuoiChua, type BangChienDich as DuBang, type BuoiChuaMayChu, type DanhSachChienDich } from './api'
import BangChienDich from './BangChienDich'
import BuoiChua from './BuoiChua'
import { hienNgay, mocHetHan } from './ngay'
import { dungToChieu, napBangTra, type CauGoc, type OChieu } from './to-chieu'
import { useGhiToChieu } from './ghi-to-chieu'
import './chien-dich.css'

/** Chiến dịch mặc định: cái đang chạy mới giao nhất (danh sách máy chủ đã xếp mới trước). */
export function chonMacDinh(ds: DanhSachChienDich['chienDich']): string {
  return (ds.find((c) => c.trangThai === 'dang_chay') ?? ds[0])?.id ?? ''
}

export default function LenBangChienDich({ onCheDoCu }: { onCheDoCu?: () => void }) {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)

  const [ds, setDs] = useState<DanhSachChienDich | null>(null)
  const [loiDs, setLoiDs] = useState('')
  const [chonId, setChonId] = useState('')
  const [bang, setBang] = useState<DuBang | null>(null)
  const [buoi, setBuoi] = useState<BuoiChuaMayChu | null>(null)
  const [coMat, setCoMat] = useState<string[]>([])
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const [tra, setTra] = useState<ReadonlyMap<string, CauGoc>>(new Map())
  const traHua = useRef<Promise<Map<string, CauGoc>> | null>(null)
  const layTra = useCallback(() => (traHua.current ??= napBangTra()), [])
  useEffect(() => {
    let huy = false
    void layTra().then((m) => !huy && setTra(m))
    return () => {
      huy = true
    }
  }, [layTra])

  const taiDs = useCallback(async () => {
    setLoiDs('')
    const r = await danhSach()
    if (!r.ok) {
      setLoiDs(r.chu)
      return
    }
    setDs(r.du)
    setChonId((cu) => (cu && r.du.chienDich.some((c) => c.id === cu) ? cu : chonMacDinh(r.du.chienDich)))
  }, [])
  useEffect(() => {
    void taiDs()
  }, [taiDs])

  const luot = useRef(0)
  const tai = useCallback(async (id: string, dsCoMat: string[]) => {
    if (!id) return
    const l = ++luot.current
    setDangTai(true)
    setLoi('')
    const b = await docBang(id)
    if (l !== luot.current) return
    if (!b.ok) {
      setDangTai(false)
      setBang(null)
      setBuoi(null)
      setLoi(b.chu)
      return
    }
    setBang(b.du)
    if (b.du.hetHan) {
      const bc = await docBuoiChua(id, dsCoMat)
      if (l !== luot.current) return
      if (!bc.ok) {
        setBuoi(null)
        setLoi(bc.chu)
      } else setBuoi(bc.du)
    } else setBuoi(null)
    setDangTai(false)
  }, [])
  useEffect(() => {
    // Đổi chiến dịch: bỏ số của chiến dịch cũ ngay (không để thầy đọc nhầm bảng cũ trong lúc chờ).
    setBang(null)
    setBuoi(null)
    setCoMat([])
    void tai(chonId, [])
  }, [chonId, tai])

  // Qua 23:59 ngày hạn nộp trong lúc màn đang mở ⇒ tự nạp lại (máy chủ trả hetHan ⇒ chuyển Buổi chữa).
  // MỘT hẹn giờ đúng mốc hết hạn (không vòng lặp định kỳ — bảng nhịp app thầy `tests/nhip-bang-2109`).
  useEffect(() => {
    if (!bang) return
    setNowMs(Date.now())
    if (bang.hetHan) return
    const het = mocHetHan(bang.chienDich.hanNop)
    const cho = het + 2000 - Date.now()
    if (!Number.isFinite(cho) || cho > 2_000_000_000) return
    const hen = setTimeout(() => void tai(chonId, coMat), Math.max(0, cho))
    return () => clearTimeout(hen)
  }, [bang, chonId, coMat, tai])

  const [html, setHtml] = useState('')
  const [dangChieu, setDangChieu] = useState(false)
  const { ketQua, moPhien, ganO, dongPhien } = useGhiToChieu(chonId)
  const moChieu = async (dsO: OChieu[], tenBuoi: string): Promise<boolean> => {
    if (!dsO.length) {
      showToast('Chưa có câu nào để chiếu lên bảng', 'warn')
      return false
    }
    setDangChieu(true)
    try {
      const ma = moPhien()
      const { html: h, soThieu, o } = await dungToChieu(dsO, tenBuoi, await layTra(), ma)
      const bao = chuThieuNoiDung(soThieu)
      if (bao) showToast(bao, 'warn')
      ganO(ma, o)
      setHtml(h)
      return true
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không mở được tờ máy chiếu', 'warn')
      return false
    } finally {
      setDangChieu(false)
    }
  }

  const dsCd = ds?.chienDich ?? []

  return (
    <div className="cd-trang" data-khoi="len-bang-chien-dich">
      {/* ĐẦU MÀN: chọn chiến dịch */}
      <div className="cd-chon">
        <label htmlFor="cd-chon-chien-dich">Chiến dịch</label>
        {dsCd.length > 0 ? (
          <select id="cd-chon-chien-dich" value={chonId} onChange={(e) => setChonId(e.target.value)}>
            {dsCd.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ten}
                {c.lop ? ` · Lớp ${c.lop}` : ''} · hạn nộp {hienNgay(c.hanNop, false)}
                {c.trangThai === 'da_dong' ? ' · đã đóng' : c.hetHan ? ' · hết hạn nộp' : ''}
              </option>
            ))}
          </select>
        ) : (
          <span className="cd-phu">{ds ? 'Chưa có chiến dịch' : loiDs ? '' : 'Đang tải…'}</span>
        )}
      </div>

      {loiDs && (
        <section className="cd-the" role="alert">
          <p className="cd-loi">{loiDs}</p>
          <div>
            <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => void taiDs()}>
              Thử lại
            </button>
          </div>
        </section>
      )}

      {ds && dsCd.length === 0 && (
        <section className="cd-the" data-khoi="chua-co-chien-dich">
          <h2>Chưa có chiến dịch nào</h2>
          <p className="cd-phu">Kết thúc một ca kiểm tra rồi giao chiến dịch luyện ở “Bước tiếp theo”, hoặc giao chiến dịch mới từ mục Ca kiểm tra.</p>
          <div>
            <button type="button" className="m3-nut-chinh" onClick={() => setScreen('lichsuca')}>
              Tới Ca kiểm tra
            </button>
          </div>
        </section>
      )}

      {chonId && loi && !dangTai && (
        <section className="cd-the" role="alert">
          <p className="cd-loi">{loi}</p>
          <div>
            <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => void tai(chonId, coMat)}>
              Thử lại
            </button>
          </div>
        </section>
      )}

      {chonId && dangTai && !bang && (
        <section className="cd-the" aria-busy="true">
          <p className="cd-phu">Đang tải chiến dịch…</p>
        </section>
      )}

      {bang && !bang.hetHan && (
        <BangChienDich du={bang} nowMs={nowMs} dangChieu={dangChieu} onChieu={moChieu} onDaChua={() => void tai(chonId, coMat)} />
      )}

      {bang && bang.hetHan && !buoi && dangTai && (
        <section className="cd-the" aria-busy="true">
          <p className="cd-phu">Hết hạn nộp — đang xếp buổi chữa…</p>
        </section>
      )}

      {bang && bang.hetHan && buoi && (
        <BuoiChua
          du={buoi}
          dsEm={bang.em.map((e) => ({ sbd: e.sbd, ten: e.ten }))}
          coMat={coMat}
          canDayLai={bang.canDayLai}
          homNay={bang.homNay}
          tra={tra}
          ketQua={ketQua}
          dangChieu={dangChieu}
          onChieu={moChieu}
          onDoiCoMat={(sbd) => {
            setCoMat(sbd)
            void tai(chonId, sbd)
          }}
          onDaChua={() => void taiDs()}
        />
      )}

      {onCheDoCu && (
        <div>
          <button type="button" className="m3-nut-chu cd-nut-nho" onClick={onCheDoCu}>
            Gọi lên bảng theo một ca kiểm tra (cách cũ)
          </button>
        </div>
      )}

      {html && (
        <KhungXemPhieu
          html={html}
          ten="Tờ máy chiếu — lên bảng chiến dịch"
          dong={() => {
            dongPhien()
            setHtml('')
          }}
        />
      )}
    </div>
  )
}
