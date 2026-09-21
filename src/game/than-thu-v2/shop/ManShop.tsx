// CỬA HÀNG PHỤ KIỆN THẦN THÚ — khung ba màn + tấm phủ xác nhận: Cửa hàng → Thử đồ → (Xác nhận) → Tủ đồ, có nút quay lại.
// Màn CHỈ nói chuyện với máy chủ qua `api: ShopApi` (tiêm từ ngoài, phải ổn định giữa các lần dựng). Mọi số dư (vàng, ống nghiệm, ngày ăn) lấy TỪ ĐÁP của api:
// máy em không lưu, không tự cộng trừ; số cũ chỉ bị thay khi máy chủ trả số mới. Bấm lặp không ghi hai lần: cờ đồng bộ + nút khoá + `khoaYeuCau` sinh MỘT lần cho mỗi lần bấm.
// Danh sách món: máy chủ trả phần động (giá, đã có, khoá, số cái), màn ghép tên/bậc/Bật mí từ danh mục `src/lib/phu-kien-danh-muc.ts`.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DANH_MUC_PHU_KIEN } from '../../../lib/phu-kien-danh-muc'
import type { MonPhuKien } from '../../../lib/phu-kien-danh-muc'
import { KhoiLoi, giamChuyenDong } from './chung'
import { chuDaCoi, chuDaMac, chuDoiXong, chuMuaXong, chuTamDong } from './chu-shop'
import CuaHang, { DauCuaHang } from './CuaHang'
import type { BoLoc } from './CuaHang'
import { MA_MAT_MANG, MA_TAM_DONG } from './kieu'
import type { DangMac, EmCo, MonShop, ShopApi, ViSoMo, VeThu } from './kieu'
import { cauMonKe, chuanDangMac, docLoi, ghepDanhMuc, kepSoExp, monDangThu, oSapMo, sinhKhoa } from './logic-shop'
import TamChao from './TamChao'
import ThuDo from './ThuDo'
import TuDo from './TuDo'
import XacNhanMua from './XacNhanMua'
import type { ViecXacNhan } from './XacNhanMua'
import './shop.css'

export type ManShopMan = 'cua-hang' | 'thu-do' | 'tu-do'

export interface ManShopProps {
  /** Năm lệnh máy chủ (giả ở B1, thật ở B5). PHẢI ổn định giữa các lần dựng (useMemo / hằng). */
  api: ShopApi
  /** Thần thú CỦA EM: loài (chỉ số) + cấp. */
  pet: number
  cap: number
  /** Tên em đặt cho thần thú (hiện trên khung tên). */
  tenThu?: string
  onDong: () => void
  /** Điểm cắm vẽ thú mặc đồ; mặc định = `ThuHinh` + lớp CSS giữ chỗ. */
  veThu?: VeThu
  /** Điểm cắm hình món trên thẻ; mặc định = hình giữ chỗ bằng CSS. */
  veHinhMon?: (m: MonShop) => ReactNode
  /** Danh mục món (tên, bậc, Bật mí); mặc định danh mục thật. */
  danhMuc?: readonly MonPhuKien[]
  /** Hiện tấm chào lần đầu. Nơi gọi tự nhớ "đã chào" và báo qua `onDaChao`. */
  chaoLanDau?: boolean
  onDaChao?: () => void
  /** Mở thẳng một màn (trang xem thử, test). */
  manDau?: ManShopMan
}

type BuocTai = 'dang' | 'xong' | 'loi' | 'mat-mang' | 'dong'
const HANG: Record<BuocTai, number> = { dang: 0, xong: 0, loi: 1, 'mat-mang': 2, dong: 3 }
type ViecMo = { loai: 'mua'; ma: string } | { loai: 'doi'; soExp: number }
interface Bao {
  chu: string
  thuLai?: () => void
}

export default function ManShop({ api, pet, cap, tenThu, onDong, veThu, veHinhMon, danhMuc = DANH_MUC_PHU_KIEN, chaoLanDau = false, onDaChao, manDau = 'cua-hang' }: ManShopProps) {
  const [man, setMan] = useState<ManShopMan>(manDau)
  const [tai, setTai] = useState<{ buoc: BuocTai; loi: string }>({ buoc: 'dang', loi: '' })
  const [vi, setVi] = useState<ViSoMo | null>(null)
  const [vang, setVang] = useState(0)
  const [em, setEm] = useState<EmCo | null>(null)
  const [danhSach, setDanhSach] = useState<MonShop[] | null>(null)
  const [dangMac, setDangMac] = useState<DangMac>({})
  const [dangThu, setDangThu] = useState<DangMac>({})
  const [tieuDiem, setTieuDiem] = useState<string | null>(null)
  const [loc, setLoc] = useState<BoLoc>('tat-ca')
  const [soExp, setSoExp] = useState(0)
  const [mo, setMo] = useState<ViecMo | null>(null)
  const [dangGui, setDangGui] = useState(false)
  const [loiXN, setLoiXN] = useState('')
  const [baoDoi, setBaoDoi] = useState('')
  const [bao, setBao] = useState('')
  const [loiMac, setLoiMac] = useState<Bao | null>(null)
  const [dangGuiMac, setDangGuiMac] = useState<string | null>(null)
  const [chao, setChao] = useState(chaoLanDau)

  // Tham chiếu mới nhất để hàm tải không phụ thuộc danh tính của prop.
  const apiRef = useRef(api)
  const danhMucRef = useRef(danhMuc)
  useEffect(() => {
    apiRef.current = api
    danhMucRef.current = danhMuc
  })
  const phienTai = useRef(0)
  const conSong = useRef(true)
  const dangGuiRef = useRef(false)
  const dangGuiMacRef = useRef(false)
  const khoaRef = useRef<string | null>(null)
  const goc = useRef<HTMLDivElement>(null)
  const thanhRef = useRef<HTMLInputElement>(null)
  const canDoiTieuDiem = useRef(false)
  const manTruoc = useRef(man)
  const moTu = useRef<HTMLElement | null>(null)
  const phuTruoc = useRef(false)

  const taiLai = useCallback(async (imLang: boolean) => {
    const phien = ++phienTai.current
    if (!imLang) setTai({ buoc: 'dang', loi: '' })
    const [a, b] = await Promise.allSettled([apiRef.current.vangXem(), apiRef.current.shopDanhSach()])
    if (phien !== phienTai.current || !conSong.current) return
    let buoc = 'xong' as BuocTai // gán trong hàm con ⇒ ép kiểu để TS không thu hẹp về 'xong'
    let loi = ''
    const ghiLoi = (e: unknown) => {
      const d = docLoi(e)
      const b2: BuocTai = d.ma === MA_TAM_DONG ? 'dong' : d.ma === MA_MAT_MANG ? 'mat-mang' : 'loi'
      if (HANG[b2] > HANG[buoc]) {
        buoc = b2
        loi = d.loi
      }
    }
    if (b.status === 'fulfilled') {
      setDanhSach(ghepDanhMuc(b.value.mon, danhMucRef.current))
      setDangMac(chuanDangMac(b.value.dangMac))
      setEm(b.value.emCo)
      setVang(b.value.vang)
    } else ghiLoi(b.reason)
    if (a.status === 'fulfilled') {
      if (a.value.bat) {
        setVi(a.value)
        if (b.status !== 'fulfilled') setVang(a.value.vang)
      } else if (buoc !== 'dong') {
        buoc = 'dong'
        loi = chuTamDong
      }
    } else ghiLoi(a.reason)
    if (imLang && buoc !== 'xong') return // làm mới im lặng hỏng ⇒ giữ nguyên cái đang có
    setTai({ buoc, loi })
  }, [])

  useEffect(() => {
    conSong.current = true
    void taiLai(false)
    return () => {
      conSong.current = false
    }
  }, [taiLai])

  // Thẻ món hiển thị: cờ `dangMac` theo bản đồ đang mặc (máy chủ trả), không theo cờ của từng món.
  const mon = useMemo<MonShop[] | null>(() => (danhSach ? danhSach.map((m) => ({ ...m, dangMac: dangMac[m.oGan] === m.ma })) : null), [danhSach, dangMac])
  const sapMo = useCallback((o: Parameters<typeof oSapMo>[0]) => oSapMo(o, mon ?? [], danhMuc), [mon, danhMuc])

  // Cuộn về đầu khi đổi màn; "Đổi vàng" từ Thử đồ đưa em tới thanh kéo.
  useEffect(() => {
    if (manTruoc.current === man) return
    manTruoc.current = man
    if (man === 'cua-hang' && canDoiTieuDiem.current) {
      canDoiTieuDiem.current = false
      const t = thanhRef.current
      t?.scrollIntoView?.({ behavior: giamChuyenDong() ? 'auto' : 'smooth', block: 'center' })
      t?.focus({ preventScroll: true })
      return
    }
    goc.current?.scrollIntoView?.({ block: 'start' })
  }, [man])

  const chuyen = (m: ManShopMan) => {
    setBao('')
    setLoiMac(null)
    setMan(m)
  }

  const thuMon = (m: MonShop) => {
    setDangThu((t) => ({ ...t, [m.oGan]: m.ma }))
    setTieuDiem(m.ma)
    chuyen('thu-do')
  }
  const boThu = (m: MonShop) => {
    const con = { ...dangThu, [m.oGan]: null }
    setDangThu(con)
    setTieuDiem(monDangThu(mon ?? [], con)[0]?.ma ?? null)
  }

  // ── xác nhận mua / đổi ──
  const viecXN: ViecXacNhan | null = useMemo(() => {
    if (!mo) return null
    if (mo.loai === 'mua') {
      const m = mon?.find((x) => x.ma === mo.ma)
      return m ? { loai: 'mua', mon: m, vang } : null
    }
    return vi ? { loai: 'doi', soExp: mo.soExp, ongNghiem: vi.ongNghiem, giuLai: vi.giuLai } : null
  }, [mo, mon, vang, vi])

  const moXacNhan = (v: ViecMo) => {
    moTu.current = document.activeElement instanceof HTMLElement ? document.activeElement : null // nút đã mở hộp: đóng xong trả tiêu điểm về đó
    khoaRef.current = null
    setLoiXN('')
    setMo(v)
  }
  const deSau = () => {
    if (dangGuiRef.current) return
    const chuaRo = khoaRef.current !== null // lần gửi trước hỏng mà chưa biết máy chủ đã ghi chưa ⇒ làm mới để thấy số thật
    khoaRef.current = null
    setMo(null)
    setLoiXN('')
    if (chuaRo) void taiLai(true)
  }

  const xacNhan = async () => {
    if (!viecXN || dangGuiRef.current) return
    dangGuiRef.current = true
    setDangGui(true)
    setLoiXN('')
    try {
      if (viecXN.loai === 'mua') {
        const m = viecXN.mon
        khoaRef.current ??= sinhKhoa('mua')
        const r = await apiRef.current.shopMua(m.ma, m.gia, khoaRef.current)
        khoaRef.current = null
        const ds = (danhSach ?? []).map((x) => (x.ma === r.maMon ? { ...x, daCo: true, moKhoa: true } : x))
        setDanhSach(ds)
        setVang(r.vang)
        if (r.daMac) setDangMac((d) => ({ ...d, [m.oGan]: r.maMon }))
        setDangThu((t) => ({ ...t, [m.oGan]: m.ma }))
        setTieuDiem(m.ma)
        setBao([chuMuaXong(m.ten, r.vang), cauMonKe(ds, r.vang, vi?.doiToiDa ?? 0)].filter(Boolean).join(' '))
        setMo(null)
        void taiLai(true)
      } else {
        khoaRef.current ??= sinhKhoa('doi')
        const r = await apiRef.current.vangDoi(viecXN.soExp, khoaRef.current)
        khoaRef.current = null
        setVang(r.vang)
        setVi((v) => (v ? { ...v, vang: r.vang, ongNghiem: r.ongNghiem, ngayAn: r.ngayAn } : v))
        setSoExp(0)
        setBaoDoi(chuDoiXong(r.vang, r.ngayAn))
        setMo(null)
        void taiLai(true) // lấy lại `doiToiDa` do máy chủ tính
      }
    } catch (e) {
      const d = docLoi(e)
      if (d.ma !== '' && d.ma !== MA_MAT_MANG) khoaRef.current = null // máy chủ đã trả lời rõ: lần bấm sau là khoá mới
      setLoiXN(d.loi)
      if (d.ma !== MA_MAT_MANG) void taiLai(true)
    } finally {
      dangGuiRef.current = false
      setDangGui(false)
    }
  }

  // ── mặc / cởi ──
  const doiMac: (m: MonShop, coi: boolean) => Promise<void> = useCallback(async (m: MonShop, coi: boolean) => {
    if (dangGuiMacRef.current) return
    dangGuiMacRef.current = true
    setDangGuiMac(m.ma)
    setLoiMac(null)
    try {
      const r = await apiRef.current.thuMacDo(m.oGan, coi ? null : m.ma)
      setDangMac(chuanDangMac(r.dangMac))
      setBao(coi ? chuDaCoi(m.ten) : chuDaMac(m.ten))
    } catch (e) {
      setLoiMac({ chu: docLoi(e).loi, thuLai: () => void doiMac(m, coi) })
    } finally {
      dangGuiMacRef.current = false
      setDangGuiMac(null)
    }
  }, [])

  const xongChao = () => {
    setChao(false)
    onDaChao?.()
  }

  const phu = !!viecXN || chao
  useEffect(() => {
    if (phuTruoc.current && !phu) {
      const e = moTu.current
      moTu.current = null
      if (e && e.isConnected && !(e as HTMLButtonElement).disabled) e.focus({ preventScroll: true })
      else goc.current?.focus({ preventScroll: true }) // nút cũ đã đổi thành khoá / biến mất: giữ tiêu điểm trong màn thay vì rơi ra thân trang
    }
    phuTruoc.current = phu
  }, [phu])
  const xong = tai.buoc === 'xong' && vi !== null && mon !== null
  const dangTai = tai.buoc === 'dang' || (tai.buoc === 'xong' && !xong)
  const mucLoiTai = tai.buoc === 'loi' || tai.buoc === 'mat-mang' || tai.buoc === 'dong'

  return (
    <div ref={goc} className="ps" data-man={man} data-co-phu={phu ? '1' : '0'} tabIndex={-1}>
      <div className="ps-man" inert={phu || undefined}>
        {man === 'cua-hang' &&
          (mucLoiTai ? (
            <>
              <DauCuaHang onVe={onDong} onTuDo={() => chuyen('tu-do')} />
              <KhoiLoi loi={tai.loi} onThuLai={tai.buoc === 'dong' ? undefined : () => void taiLai(false)} />
            </>
          ) : (
            <CuaHang
              dangTai={dangTai}
              vi={vi}
              vang={vang}
              em={em}
              mon={mon ?? []}
              dangThu={dangThu}
              loc={loc}
              sapMo={sapMo}
              soExp={soExp}
              baoDoi={baoDoi}
              thanhRef={thanhRef}
              veHinhMon={veHinhMon}
              onLoc={setLoc}
              onSoExp={(n) => {
                setBaoDoi('')
                setSoExp(kepSoExp(n, vi?.doiToiDa ?? 0))
              }}
              onDoi={() => {
                const x = kepSoExp(soExp, vi?.doiToiDa ?? 0)
                if (x > 0) moXacNhan({ loai: 'doi', soExp: x })
              }}
              onThu={thuMon}
              onTuDo={() => chuyen('tu-do')}
              onVe={onDong}
            />
          ))}
        {man === 'thu-do' &&
          (mon ? (
            <ThuDo
              vang={vang}
              vi={vi}
              em={em}
              mon={mon}
              dangMac={dangMac}
              dangThu={dangThu}
              tieuDiem={tieuDiem}
              pet={pet}
              cap={cap}
              tenThu={tenThu}
              veThu={veThu}
              bao={bao}
              loiMac={loiMac ? { loi: loiMac.chu, thuLai: loiMac.thuLai ?? (() => undefined) } : null}
              dangGuiMac={dangGuiMac !== null}
              onTieuDiem={setTieuDiem}
              onVe={() => chuyen('cua-hang')}
              onToiCuaHang={() => chuyen('cua-hang')}
              onToiDoi={() => {
                canDoiTieuDiem.current = true
                chuyen('cua-hang')
              }}
              onMua={(m) => moXacNhan({ loai: 'mua', ma: m.ma })}
              onMac={(m) => void doiMac(m, false)}
              onBoThu={boThu}
            />
          ) : (
            <>
              <DauCuaHang onVe={() => chuyen('cua-hang')} onTuDo={() => chuyen('tu-do')} />
              <KhoiLoi loi={tai.loi} onThuLai={() => void taiLai(false)} />
            </>
          ))}
        {man === 'tu-do' && (
          <TuDo
            mon={mon}
            dangTai={tai.buoc === 'dang'}
            loiTai={tai.loi}
            dong={tai.buoc === 'dong'}
            sapMo={sapMo}
            bao={bao}
            loiMac={loiMac ? { loi: loiMac.chu, thuLai: loiMac.thuLai ?? (() => undefined) } : null}
            dangGui={dangGuiMac}
            onMac={(m) => void doiMac(m, false)}
            onCoi={(m) => void doiMac(m, true)}
            onVe={() => chuyen('cua-hang')}
            onToiCuaHang={() => chuyen('cua-hang')}
            onThuLai={() => void taiLai(false)}
          />
        )}
      </div>
      {viecXN && <XacNhanMua viec={viecXN} dangGui={dangGui} loi={loiXN} onXacNhan={() => void xacNhan()} onDeSau={deSau} />}
      {chao && <TamChao onXong={xongChao} />}
    </div>
  )
}
