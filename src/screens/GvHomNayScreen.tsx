// HÔM NAY CỦA THẦY — màn đầu app thầy khi Game Hóa 2.0 bật (BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 · GV-HomNay.dc.html, BoGop: "Tổng quan: 2 nút chính
// + nút Mở ca → Hôm nay: danh sách việc, mỗi việc 1 nút"). Trả lời MỘT câu: "Lớp tôi cần gì hôm nay?". Mã màn vẫn là `tongquan` (TongQuanScreen giữ mã).
//   · 4 ô số: Đủ mức tối thiểu hôm nay a/b em · Chưa làm câu nào n em (cộng từ bảng hôm nay của các Hành trình — `danh-sach` lọc `hanhTrinh`
//     rồi `bang` → `hanhTrinhNgay.em`, cùng phép đếm `chiSoNhip` của màn Hành trình) · Cần thầy chữa n chỗ (cùng ba nhóm thẻ "Cần thầy chữa" của
//     Bảng chiến dịch — `nhomCanThayChua`: câu sai từ 4 lần · câu có thẻ nút thắt · em sơ ý cao) · Ca kiểm tra đang mở n ca (`danhSachCa`).
//   · "Việc cần thầy · xếp theo độ gấp": ca đang mở → Theo dõi ca · Cần thầy chữa → Hành trình › Cần thầy chữa · lớp chờ bài mới (chỉ khi OMNI
//     bật và máy chủ gửi `choBaiMoi`) → Hành trình › Bài đã dạy · em chưa làm câu nào → Hành trình › Nhịp hôm nay. MỖI việc MỘT nút.
//   · "Nhịp theo khối": đủ mức a/b mỗi khối.
// SỐ CHỈ TỪ API SẴN CÓ, không đổi máy chủ, không số giả: lệnh nào lỗi thì ô / hàng của nó KHÔNG vẽ, và một dòng nói thật lệnh nào chưa đọc được.
// Ghi số cho thanh bên (`useSoDemGv`: ca đang mở, Cần thầy chữa). Phép tính thuần xuất ra để test (tests/gv-hom-nay-0910.test.tsx).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Clock, MonitorCheck, Presentation, type LucideIcon } from 'lucide-react'
import { danhSachCa, type CaTomTat } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { gioMayChu } from '../lib/gio-may-chu'
import { useAppStore } from '../store/appStore'
import { useSoDemGv, type MoHanhTrinh } from '../lib/so-dem-gv'
import { taiGioiHan } from '../lib/tai-gioi-han'
import { layLopThay } from '../lib/ten-lop-thay'
import { chuChoBaiMoi } from '../lib/bai-hom-nay'
import { danhSach, docBang, type BangChienDich, type CauCanDayLai, type ChienDichTom } from '../components/chien-dich/api'
import { baiDaDayDanhSach, docBangOmniCua, docCoOmni } from '../components/chien-dich/api-omni'
import { nhomCanThayChua } from '../components/chien-dich/omni-bang'
import { chiSoNhip, khoiCuaHanhTrinh, type ChiSoNhip } from '../components/chien-dich/nhip-hanh-trinh'
import { hienNgay, ngayVn } from '../components/chien-dich/ngay'
import type { CanThayChua } from '../../server/src/omni-kieu'
import { caConEmDangLam } from './LichSuCaScreen'
import './gv-hoa2.css'
import '../components/chien-dich/gv-v2.css'
import './gv-hom-nay.css'

// ------------------------------------------------------------------ PHÉP TÍNH THUẦN

/** Nhịp hôm nay của một Hành trình (một khối). `cs` null = chưa đọc được bảng hôm nay ⇒ không vẽ hàng. */
export interface NhipKhoi {
  cd: ChienDichTom
  khoi: string | null
  cs: ChiSoNhip | null
}

/** Cộng nhịp các khối đã đọc được bảng. Không khối nào đọc được ⇒ null (không vẽ ô số). */
export function tongNhip(ds: readonly NhipKhoi[]): { duMuc: number; coMuc: number; chuaLam: number; tong: number } | null {
  const co = ds.filter((d) => d.cs)
  if (co.length === 0) return null
  return co.reduce((s, d) => ({ duMuc: s.duMuc + d.cs!.duMuc, coMuc: s.coMuc + d.cs!.coMuc, chuaLam: s.chuaLam + d.cs!.chuaLam, tong: s.tong + d.cs!.tong }), { duMuc: 0, coMuc: 0, chuaLam: 0, tong: 0 })
}

export interface DemCanThayChua {
  catTia: number
  nutThat: number
  soY: number
  tong: number
}

/** Đếm "Cần thầy chữa" — đúng ba nhóm của thẻ Cần thầy chữa trên Bảng chiến dịch (`nhomCanThayChua`; máy chủ chưa gửi nhóm câu sai từ 4 lần
 *  ⇒ dựng từ "Cần thầy dạy lại" sẵn có, cùng nghĩa). Một dòng = một chỗ. */
export function demCanThayChua(ds: readonly { canDayLai: readonly CauCanDayLai[]; omni: readonly CanThayChua[] }[]): DemCanThayChua {
  const d = { catTia: 0, nutThat: 0, soY: 0, tong: 0 }
  for (const x of ds) {
    for (const g of nhomCanThayChua(x.omni, x.canDayLai)) {
      if (g.loai === 'cat_tia') d.catTia += g.dong.length
      else if (g.loai === 'nut_that') d.nutThat += g.dong.length
      else d.soY += g.dong.length
    }
  }
  d.tong = d.catTia + d.nutThat + d.soY
  return d
}

/** "4 câu sai từ 4 lần trở lên · 2 câu có thẻ nút thắt · 1 em sơ ý cao" — nhóm 0 thì bỏ. */
export function chuCanThayChua(d: DemCanThayChua): string {
  return [d.catTia && `${d.catTia} câu sai từ 4 lần trở lên`, d.nutThat && `${d.nutThat} câu có thẻ nút thắt`, d.soY && `${d.soY} em sơ ý cao`].filter(Boolean).join(' · ')
}

// ------------------------------------------------------------------ TẢI SỐ

export interface DuLieuHomNay {
  /** null = chưa đọc được danh sách ca (lý do ở `loiCa`). */
  ca: CaTomTat[] | null
  loiCa: string
  /** null = chưa đọc được danh sách chiến dịch (lý do ở `loiCd`). */
  cd: ChienDichTom[] | null
  loiCd: string
  nhip: NhipKhoi[]
  /** null = chưa biết (danh sách lỗi / mọi bảng lỗi). */
  canThayChua: DemCanThayChua | null
  /** Lớp chờ bài mới (OMNI): chỉ lớp đã chờ từ `NGAY_NHAC_CHO_BAI_MOI` ngày. */
  choBaiMoi: { lop: string; soNgay: number }[]
}

const loiChu = (e: unknown, macDinh: string) => (e instanceof Error && e.message ? e.message : macDinh)

export async function taiHomNay(): Promise<DuLieuHomNay> {
  const taiCa = async () => {
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      if (!url.trim() || !mat.trim()) throw new Error('Chưa kết nối máy chủ — vào Cài đặt › Công cụ kỹ thuật › Kết nối máy chủ')
      return { ca: await danhSachCa(url.trim(), mat.trim(), false), loiCa: '' }
    } catch (e) {
      return { ca: null, loiCa: loiChu(e, 'Không tải được danh sách ca') }
    }
  }
  const taiCd = async () => {
    try {
      const r = await danhSach()
      return r.ok ? { cd: r.du.chienDich, loiCd: '' } : { cd: null, loiCd: r.chu }
    } catch (e) {
      return { cd: null, loiCd: loiChu(e, 'Không tải được chiến dịch') }
    }
  }
  const taiCoOmni = async () => {
    try {
      const r = await docCoOmni()
      return r.ok ? r.du : null
    } catch {
      return null
    }
  }
  const [{ ca, loiCa }, { cd, loiCd }, co] = await Promise.all([taiCa(), taiCd(), taiCoOmni()])

  const chay = (cd ?? []).filter((c) => c.trangThai === 'dang_chay')
  const bang: (BangChienDich | null)[] = await taiGioiHan(chay, async (c) => {
    try {
      const r = await docBang(c.id)
      return r.ok ? r.du : null
    } catch {
      return null
    }
  })

  // Bảng bài OMNI (ba nhóm Cần thầy chữa): như Lên bảng chiến dịch — chỉ chiến dịch còn chạy, không phải Hành trình; OMNI tắt ⇒ không hỏi.
  const canOmni = chay.map((c, i) => ({ c, b: bang[i] })).filter((x) => co?.bat && x.b && !x.b.hanhTrinhNgay && !x.b.hetHan)
  const taiOmni = taiGioiHan(canOmni, async ({ c }) => {
    try {
      const r = await docBangOmniCua(c.id)
      return r.ok && (!r.du.chienDich.id || r.du.chienDich.id === c.id) ? r.du.canThayChua : []
    } catch {
      return [] as CanThayChua[]
    }
  })
  // Lớp chờ bài mới (OMNI): lớp OMNI áp (danh sách lớp của công tắc; bật cả trung tâm ⇒ mọi lớp của thầy), mỗi lớp một lệnh `danh-sach`.
  const taiCho = (async () => {
    if (!co?.bat) return []
    try {
      let lop = co.lop
      if (!lop.length) {
        const r = await layLopThay()
        lop = r.ok ? r.du.lop.map((l) => l.tenLop) : []
      }
      const kq = await taiGioiHan(lop, async (l) => {
        try {
          const r = await baiDaDayDanhSach(l)
          return r.ok && r.du.choBaiMoi && chuChoBaiMoi(l, r.du.choBaiMoi) ? { lop: l.trim(), soNgay: r.du.choBaiMoi.soNgay } : null
        } catch {
          return null
        }
      })
      return kq.filter((x): x is { lop: string; soNgay: number } => !!x).sort((a, b) => b.soNgay - a.soNgay || a.lop.localeCompare(b.lop, 'vi'))
    } catch {
      return []
    }
  })()
  const [omni, choBaiMoi] = await Promise.all([taiOmni, taiCho])
  const omniCua = new Map(canOmni.map((x, i) => [x.c.id, omni[i] ?? []] as const))

  const daDoc = chay.map((c, i) => ({ c, b: bang[i] })).filter((x): x is { c: ChienDichTom; b: BangChienDich } => !!x.b)
  const canThayChua = cd === null || (chay.length > 0 && daDoc.length === 0) ? null : demCanThayChua(daDoc.map(({ c, b }) => ({ canDayLai: b.canDayLai ?? [], omni: omniCua.get(c.id) ?? [] })))

  const nhip: NhipKhoi[] = chay
    .map((c, i) => ({ c, b: bang[i] }))
    .filter((x) => x.c.hanhTrinh)
    .map(({ c, b }) => ({ cd: c, khoi: khoiCuaHanhTrinh(c), cs: b?.hanhTrinhNgay ? chiSoNhip(b.hanhTrinhNgay.em) : null }))
    .sort((a, b) => String(a.khoi).localeCompare(String(b.khoi)))

  return { ca, loiCa, cd, loiCd, nhip, canThayChua, choBaiMoi }
}

// ------------------------------------------------------------------ MÀN

type Mau = 'xl' | 'ho' | 'hp' | 'xd' | 'tim'
interface Viec {
  key: string
  mau: Mau
  icon: LucideIcon
  tieuDe: string
  phu: string
  nut: string
  lam: () => void
}

const tiLe = (a: number, b: number) => (b > 0 ? Math.round((100 * Math.min(a, b)) / b) : 0)

export default function GvHomNayScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const datSo = useSoDemGv((s) => s.datSo)
  const datMoHanhTrinh = useSoDemGv((s) => s.datMoHanhTrinh)
  const [du, setDu] = useState<DuLieuHomNay | null>(null)
  const [dangTai, setDangTai] = useState(false)

  const lanTai = useRef(0)
  const tai = useCallback(async () => {
    const lan = ++lanTai.current
    setDangTai(true)
    const kq = await taiHomNay()
    if (lan !== lanTai.current) return
    setDu(kq)
    setDangTai(false)
  }, [])
  useEffect(() => {
    void tai()
    return () => {
      lanTai.current++
    }
  }, [tai])

  const now = gioMayChu()
  const caMo = useMemo(() => (du?.ca ?? []).filter((c) => c.loai !== 'baitap' && caConEmDangLam(c, now)), [du, now])
  const tong = useMemo(() => (du ? tongNhip(du.nhip) : null), [du])
  const khoiCo = useMemo(() => (du?.nhip ?? []).filter((n) => n.cs), [du])

  useEffect(() => {
    if (!du) return
    datSo({ caMo: du.ca ? caMo.length : null, canThayChua: du.canThayChua ? du.canThayChua.tong : null })
  }, [du, caMo.length, datSo])

  const moHanhTrinh = (m: MoHanhTrinh) => {
    datMoHanhTrinh(m)
    setScreen('chiendich')
  }

  // VIỆC CẦN THẦY — xếp theo độ gấp: ca đang mở (đang diễn ra) → Cần thầy chữa → lớp chờ bài mới → em chưa làm câu nào.
  const viec: Viec[] = []
  for (const c of caMo) {
    viec.push({
      key: `ca-${c.maCa}`,
      mau: 'xd',
      icon: MonitorCheck,
      tieuDe: `Ca đang mở: ${c.tenCa || `Ca ${c.maCa}`}${c.lop ? ` · ${c.lop}` : ''}`,
      phu: `Đã vào ${c.daVao} em · đã nộp ${c.daNop} em`,
      nut: 'Theo dõi ca',
      lam: () => moChiTietCa(c.maCa),
    })
  }
  if (du?.canThayChua && du.canThayChua.tong > 0) {
    viec.push({ key: 'can-chua', mau: 'hp', icon: Presentation, tieuDe: `Cần thầy chữa: ${du.canThayChua.tong} chỗ`, phu: chuCanThayChua(du.canThayChua), nut: 'Xếp buổi chữa', lam: () => moHanhTrinh({ the: 'can-chua' }) })
  }
  if (du && du.choBaiMoi.length > 0) {
    const ds = du.choBaiMoi
    viec.push({
      key: 'bai-moi',
      mau: 'tim',
      icon: BookOpen,
      tieuDe: ds.length === 1 ? `${ds[0]!.lop}: ${ds[0]!.soNgay} ngày chưa có bài mới` : `${ds.length} lớp chưa có bài mới`,
      phu: ds.length === 1 ? 'Hành trình đang ôn bài cũ · tick bài vừa dạy để mở câu mới' : `${ds.map((x) => `${x.lop}: ${x.soNgay} ngày`).join(' · ')} — tick bài vừa dạy để mở câu mới`,
      nut: 'Bổ sung bài',
      lam: () => moHanhTrinh({ the: 'bai-da-day', boSungBai: true }),
    })
  }
  if (tong && tong.chuaLam > 0) {
    const coEm = khoiCo.filter((n) => n.cs!.chuaLam > 0)
    const nhieuNhat = [...coEm].sort((a, b) => b.cs!.chuaLam - a.cs!.chuaLam)[0]
    viec.push({
      key: 'chua-lam',
      mau: 'ho',
      icon: Clock,
      tieuDe: `${tong.chuaLam} em chưa làm câu nào hôm nay`,
      phu: coEm.map((n) => `Khối ${n.khoi ?? '—'}: ${n.cs!.chuaLam} em`).join(' · '),
      nut: 'Xem danh sách',
      lam: () => moHanhTrinh({ the: 'nhip', chienDichId: nhieuNhat?.cd.id }),
    })
  }

  const loi = du ? [du.loiCa && `Danh sách ca: ${du.loiCa}`, du.loiCd && `Hành trình và chiến dịch: ${du.loiCd}`].filter(Boolean).join(' · ') : ''
  const coO = !!du && (!!tong || du.canThayChua !== null || du.ca !== null)

  return (
    <div className="gv2-trang gvhn">
      <header className="gvhn-dau">
        <h1 className="gvv2-h1">Hôm nay của thầy</h1>
        <p className="gvv2-phu">
          {hienNgay(ngayVn(now))}
          {khoiCo.length > 0 && tong && (
            <>
              {' · '}
              <span className="gvv2-so">{khoiCo.length}</span> khối · <span className="gvv2-so">{tong.tong}</span> em đang chạy Hành trình
            </>
          )}
        </p>
        <button type="button" className="gvv2-nut-chinh" onClick={() => moHanhTrinh({ the: 'bai-da-day', boSungBai: true })}>Bổ sung bài hôm nay</button>
      </header>

      {!du ? (
        <p className="gvv2-trong" role="status">
          Đang tải việc hôm nay…
        </p>
      ) : (
        <>
          {loi && (
            <div className="gvv2-the gvv2-loi" role="alert">
              <p>Chưa đọc được: {loi}</p>
              <button type="button" className="gvv2-nut-vien" onClick={() => void tai()} disabled={dangTai}>
                {dangTai ? 'Đang tải lại…' : 'Thử lại'}
              </button>
            </div>
          )}

          {coO && (
            <section className="gvhn-so-ds" aria-label="Số liệu hôm nay">
              {tong && (
                <div className="gvhn-so" data-mau="xl">
                  <span className="gvhn-so-nhan">Đủ mức tối thiểu hôm nay</span>
                  <b className="gvv2-so">
                    {tong.duMuc}
                    <small>/{tong.coMuc} em</small>
                  </b>
                </div>
              )}
              {tong && (
                <div className="gvhn-so" data-mau="ho">
                  <span className="gvhn-so-nhan">Chưa làm câu nào</span>
                  <b className="gvv2-so">
                    {tong.chuaLam}
                    <small> em</small>
                  </b>
                </div>
              )}
              {du.canThayChua && (
                <div className="gvhn-so" data-mau="hp">
                  <span className="gvhn-so-nhan">Cần thầy chữa</span>
                  <b className="gvv2-so">
                    {du.canThayChua.tong}
                    <small> chỗ</small>
                  </b>
                </div>
              )}
              {du.ca && (
                <div className="gvhn-so" data-mau="xd">
                  <span className="gvhn-so-nhan">Ca kiểm tra đang mở</span>
                  <b className="gvv2-so">
                    {caMo.length}
                    <small> ca</small>
                  </b>
                </div>
              )}
            </section>
          )}

          <div className="gvhn-luoi">
            <section className="gvv2-the gvhn-viec" aria-labelledby="gvhn-viec-tieu">
              <h2 id="gvhn-viec-tieu" className="gvv2-h2">
                Việc cần thầy · xếp theo độ gấp
              </h2>
              {viec.length === 0 ? (
                <p className="gvv2-trong">{loi ? 'Chưa đủ số liệu để xếp việc — bấm Thử lại ở trên.' : 'Không có việc cần thầy lúc này. Màn tự đọc lại số mỗi lần thầy mở.'}</p>
              ) : (
                <ul className="gvhn-viec-ds">
                  {viec.map((v) => {
                    const Icon = v.icon
                    return (
                      <li key={v.key} className="gvhn-viec-dong">
                        <span className="gvhn-dau-o" data-mau={v.mau} aria-hidden="true">
                          <Icon size={22} aria-hidden="true" />
                        </span>
                        <span className="gvhn-viec-chu">
                          <b>{v.tieuDe}</b>
                          {v.phu && <span>{v.phu}</span>}
                        </span>
                        {/* Một nút chính trên màn (luật C2): việc gấp nhất; các việc sau là nút viền. */}
                        <button type="button" className="gvv2-nut-vien" onClick={v.lam} aria-label={`${v.nut}: ${v.tieuDe}`}>
                          {v.nut}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {khoiCo.length > 0 && (
              <aside className="gvv2-the gvhn-khoi" aria-labelledby="gvhn-khoi-tieu">
                <h2 id="gvhn-khoi-tieu" className="gvv2-h2">
                  Nhịp theo khối
                </h2>
                {khoiCo.map((n) => {
                  const ti = tiLe(n.cs!.duMuc, n.cs!.coMuc)
                  return (
                    <div key={n.cd.id} className="gvhn-khoi-dong">
                      <div className="gvhn-khoi-chu">
                        <b>Khối {n.khoi ?? '—'}</b>
                        <span className="gvv2-so">
                          {n.cs!.duMuc}/{n.cs!.coMuc} em đủ mức
                        </span>
                      </div>
                      <span className="gvv2-thanh" data-du="true" role="progressbar" aria-label={`Khối ${n.khoi ?? '—'}: em đủ mức tối thiểu hôm nay`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ti}>
                        <i style={{ width: `${ti}%` }} />
                      </span>
                      <button type="button" className="gvv2-nut-vien" onClick={() => moHanhTrinh({ the: 'nhip', chienDichId: n.cd.id })}>Xem Hành trình khối {n.khoi ?? '—'}</button>
                    </div>
                  )
                })}
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  )
}
