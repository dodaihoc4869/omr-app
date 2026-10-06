// BƯỚC "BÀI HÔM NAY" của bảng Dạy học (OMNI 3, thầy chốt 05/10 — hình docs/omni-0510/GV-TickBai.jpg chỉ để lấy NỘI DUNG; bố cục theo thẻ bước sẵn có).
// CHỈ hiện khi công tắc OMNI bật (`/gv/omni co-doc`); tắt / máy chủ chưa có lệnh ⇒ bảng Dạy học y như cũ (thầy lệnh 05/10: giữ nguyên giao diện).
// Chọn lớp (ô tick xổ xuống theo KHỐI 10 · 11 · 12 — `ChonLopGiao`; mặc định lớp của buổi đang mở nếu OMNI áp cho lớp ấy; được chọn NHIỀU lớp CÙNG KHỐI, thầy 06/10)
// → cây DẠY HỌC của khối (bài sắp theo SỐ BÀI tăng dần; CHỌN MỘT BÀI; mỗi bài một chip trạng thái gộp qua các lớp đã chọn, từ `/gv/bai-da-day danh-sach` từng lớp)
// → `xem-truoc` từng lớp ⇒ thẻ xác nhận 6 con số (một lớp: y như cũ; nhiều lớp: mỗi lớp một khối, xem đủ 6 số khi mở) + cảnh báo quá tải
// → nút chính "Giao Bài <số> cho <lớp | N lớp>" ⇒ `tick` LẦN LƯỢT từng lớp chưa có bài (máy chủ giữ nguyên, mỗi lớp một chiến dịch)
// (TỰ GIAO đúng ba phần Trắc nghiệm / Đúng sai / Trả lời ngắn của bài — thầy 05/10, KHÔNG ô tích, bỏ hẳn Ví dụ minh hoạ và Các dạng toán trọng tâm;
// phạm vi = mọi bài đứng TRƯỚC trong cây cùng khối kèm tờ tự giao của chúng).
// Bài đã tick: "Bỏ tick" / "Sửa em" theo từng lớp (hỏi lại, nói thật hậu quả). Lớp chờ bài mới từ 3 ngày ⇒ một dòng nhỏ ở đầu bảng (`DongChoBaiMoi`).
// CHỌN EM NHẬN BÀI (thầy nhắn 05/10: "cho thêm chỗ chọn giao cho hs nhé (bạn bê luôn cái chọn hs ở chiến dịch cũ, cho chọn hs theo điểm danh nữa)"):
// trong thẻ xác nhận, BÊ NGUYÊN khối "Chọn em nhận chiến dịch" của màn Giao (`ChonEmGiao` + `useDsEmGiao`, mặc định cả các lớp đã chọn) + hàng chip
// "Theo điểm danh:" (buổi đang mở + tối đa 3 buổi gần nhất của từng lớp, `buoiGanDay`) + chip "Cả lớp". Gửi `sbd` (chia về đúng lớp của em) trong CẢ `xem-truoc` lẫn
// `tick`; chưa có danh sách em ⇒ giữ hành vi cũ (giao cả lớp, không gửi `sbd`). Bài đã tick: "Đã giao N em" + "Sửa em" (hộp sửa chiến dịch sẵn có).
// Chữ: bảng A2 (app thầy dùng "lượt/ngày", không "thể lực"); chủ ngữ chữ MỚI là "A.I Đỗ Đại Học" (omni-chu.ts). Kiểu dáng: `bai-hom-nay.css` (chỉ biến màu --bts-*).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import type { TeacherExamSource } from '../../data/examContent'
import { THAM_SO_OMNI, type CoOmni } from '../../../server/src/omni-kieu'
import { dungCay } from '../../lib/cay-chon-de'
import { locDeDayHoc } from '../../lib/day-hoc-len-bang'
import { TEN_AI } from '../../lib/omni-chu'
import {
  CHU_BAI_CHUA_CO_TO_TU_GIAO,
  CHU_KHONG_GIAO_MUC_DAY_HOC,
  chiaEmTheoLop,
  chuChoBaiMoi,
  chuTuGiao,
  dsBaiCuaKhoi,
  emThuocLop,
  khoiCuaTenLop,
  lopTheoKhoi,
  maDeMacDinh,
  phamViTruoc,
  ngayThangVn,
  soBaiCuaTen,
  tenGonLop,
  tenNganBai,
  trangThaiBai,
  trangThaiNhieuLop,
  type BaiCay,
  type KieuTrangThaiBai,
} from '../../lib/bai-hom-nay'
import { buoiGanDay, type BuoiGanDay } from '../../lib/buoi-hoc-api'
import {
  baiDaDayBoTick,
  baiDaDayDanhSach,
  baiDaDayTick,
  baiDaDayXemTruoc,
  docCoOmni,
  type BaiDaTick,
  type DanhSachBaiDaDay,
  type DauVaoBai,
  type XemTruocTick,
} from '../chien-dich/api-omni'
import { hienHanNop, laNgay, ngayVn } from '../chien-dich/ngay'
import ChonEmGiao, { type EmLop } from '../chien-dich/ChonEmGiao'
import { useDsEmGiao } from '../chien-dich/nguon-giao'
import { hoiXacNhan } from '../hop-thoai'
import type { DiemDanhBuoi } from './DiemDanhBuoi'
import ChonLopGiao from './ChonLopGiao'
import '../chien-dich/chien-dich.css'
import './day-hoc.css'
import './bai-hom-nay.css'

/** Chờ thầy gõ xong (hạn nộp / số lượt) rồi mới hỏi máy chủ `xem-truoc`. */
const CHO_XEM_MS = 350
/** Số tên em quá tải in ra; còn lại ghi "và N em nữa". */
const TOI_DA_TEN_QUA_TAI = 8
/** Chặn số lượt vô nghĩa — cùng trần ô "Số lượt câu mỗi ngày" của màn Giao chiến dịch (`THE_LUC_TOI_DA`, máy chủ cũng chặn). Không import màn ấy để mảnh Dạy học nhẹ. */
const LUOT_TOI_DA = 500

const LOP_CHIP: Record<KieuTrangThaiBai, string> = { da_day: 'dh-chip dh-chip--xanh', dang_luyen: 'dh-chip dh-chip--vang', hom_nay: 'dh-chip', chua_day: 'dh-chip dh-chip--xam' }
/** Màu chấm nhỏ theo lớp (cùng bộ với chip trạng thái). */
const LOP_CHAM: Record<KieuTrangThaiBai, string> = { da_day: 'bhn-cham bhn-cham--xanh', dang_luyen: 'bhn-cham bhn-cham--vang', hom_nay: 'bhn-cham bhn-cham--duong', chua_day: 'bhn-cham bhn-cham--xam' }
/** Số buổi gần đây (ngoài buổi đang mở) hiện trong hàng chip "Theo điểm danh". */
const SO_BUOI_GAN_DAY = 3
/** Hộp sửa chiến dịch sẵn có (thêm/bớt em) — nạp lười, chỉ khi thầy bấm "Sửa em". */
const SuaChienDich = lazy(() => import('../chien-dich/SuaChienDich'))

/** Một chip "Theo điểm danh": buổi + SBD em có mặt. */
export interface ChipBuoi {
  id: string
  chu: string
  sbd: string[]
}
/** Chip điểm danh: buổi đang mở của bảng Dạy học (cùng lớp) trước, rồi tối đa 3 buổi gần nhất của lớp; bỏ buổi 0 em có mặt, bỏ trùng. Thuần. */
export function dungChipBuoi(lop: string, dangMo: { id: string; lop: string; moLuc: string; coMat: string[] } | null, ganDay: readonly Pick<BuoiGanDay, 'id' | 'lop' | 'moLuc' | 'coMat'>[]): ChipBuoi[] {
  const ra: ChipBuoi[] = []
  const chip = (b: { id: string; moLuc: string; coMat: readonly string[] }) => {
    const sbd = [...new Set(b.coMat.filter(Boolean))]
    if (!sbd.length || ra.some((x) => x.id === b.id)) return
    const ngay = ngayThangVn(b.moLuc)
    ra.push({ id: b.id, chu: `Buổi${ngay ? ` ${ngay}` : ''} · ${sbd.length} em có mặt`, sbd })
  }
  if (dangMo && (!dangMo.lop || dangMo.lop === lop)) chip(dangMo)
  const truoc = ra.length
  for (const b of ganDay) {
    if (ra.length - truoc >= SO_BUOI_GAN_DAY) break
    if (b.lop && lop && b.lop !== lop) continue
    chip(b)
  }
  return ra
}
const giongTap = (a: ReadonlySet<string>, b: readonly string[]) => a.size === b.length && b.every((x) => a.has(x))
/** Chữ chip gọn cho nhãn nhỏ theo lớp: bỏ đuôi "· chứng chỉ a/b". */
const chuNgan = (chu: string) => chu.split(' · chứng chỉ')[0]!

/** Trạng thái + lệnh của bước Bài hôm nay. `kho` = kho DẠY HỌC của bảng (`khoDayHoc`), nạp lười bằng `napKho`. */
export function useBaiHomNay(dd: Pick<DiemDanhBuoi, 'dsLop' | 'tt'>, kho: TeacherExamSource[] | null, napKho: () => Promise<TeacherExamSource[]>) {
  const showToast = useAppStore((s) => s.showToast)
  const [co, setCo] = useState<CoOmni | null>(null)
  useEffect(() => {
    let song = true
    void docCoOmni().then((r) => {
      if (song && r.ok) setCo(r.du)
    })
    return () => {
      song = false
    }
  }, [])
  const bat = co?.bat === true

  // LỚP: bật theo lớp ⇒ đúng các lớp đã bật; bật cả trung tâm / chạy thử theo em ⇒ mọi lớp. Mặc định = lớp của buổi đang mở (nếu OMNI áp cho lớp ấy).
  const lopBuoi = dd.tt?.buoi.dangMo ? (dd.tt.buoi.lop ?? '').trim() : ''
  const lopMacDinh = bat && lopBuoi && (!co!.lop.length || co!.lop.includes(lopBuoi)) ? lopBuoi : ''
  const dsLop = useMemo(() => {
    if (!co?.bat) return []
    const goc = co.lop.length ? co.lop : dd.dsLop.map((l) => l.tenLop)
    return [...new Set([...goc, ...(lopMacDinh ? [lopMacDinh] : [])])]
  }, [co, dd.dsLop, lopMacDinh])
  // Bộ chọn lớp: chỉ lớp biết khối, xếp khối 10 → 11 → 12 (cây bài cần khối; "Chưa xếp lớp" không có trong ô).
  const lopChonDuoc = useMemo(
    () =>
      lopTheoKhoi(
        dsLop.map((ten) => {
          const d = dd.dsLop.find((l) => l.tenLop === ten)
          return { tenLop: ten, khoi: d?.khoi, soEm: d?.soEm }
        }),
      ),
    [dsLop, dd.dsLop],
  )
  const [lopTay, setLopTay] = useState<string[] | null>(null)
  const lopChon = useMemo(() => lopTay ?? (lopMacDinh ? [lopMacDinh] : []), [lopTay, lopMacDinh])
  const khoaLop = lopChon.join('\u0001')
  const lop = lopChon[0] ?? ''
  const khoi = useMemo(() => khoiCuaTenLop(dd.dsLop.find((l) => l.tenLop === lop)?.khoi ?? '') || khoiCuaTenLop(lop), [dd.dsLop, lop])

  // DANH SÁCH BÀI ĐÃ TICK của từng lớp đã chọn (mỗi lớp một lệnh, chạy song song).
  const [dsTheoLop, setDsTheoLop] = useState<Record<string, DanhSachBaiDaDay>>({})
  const [loiDsTheoLop, setLoiDsTheoLop] = useState<Record<string, string>>({})
  const [dangTaiDs, setDangTaiDs] = useState(false)
  const luotDs = useRef(0)
  const taiDs = useCallback(async () => {
    const l = ++luotDs.current
    if (!bat || !lopChon.length) {
      setDsTheoLop({})
      setLoiDsTheoLop({})
      setDangTaiDs(false)
      return
    }
    setDangTaiDs(true)
    setLoiDsTheoLop({})
    const kq = await Promise.all(lopChon.map(async (x) => [x, await baiDaDayDanhSach(x)] as const))
    if (l !== luotDs.current) return
    setDangTaiDs(false)
    const ds: Record<string, DanhSachBaiDaDay> = {}
    const loi: Record<string, string> = {}
    for (const [x, r] of kq) {
      if (r.ok) ds[x] = r.du
      else loi[x] = r.chu
    }
    setDsTheoLop(ds)
    setLoiDsTheoLop(loi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bat, khoaLop])
  useEffect(() => {
    void taiDs()
  }, [taiDs])
  useEffect(() => {
    if (bat && lop && !kho) void napKho()
  }, [bat, lop, kho, napKho])

  // CÂY DẠY HỌC của khối (chương theo số chương, bài theo số bài tăng dần — `dsBaiCuaKhoi`).
  const dsBai = useMemo(() => (kho && khoi ? dsBaiCuaKhoi(dungCay(locDeDayHoc(kho)), khoi) : []), [kho, khoi])
  const tickTheoLop = useMemo(() => new Map(lopChon.map((l) => [l, new Map((dsTheoLop[l]?.bai ?? []).map((b) => [b.khoaBai, b]))] as const)), [lopChon, dsTheoLop])

  // CHỌN EM NHẬN BÀI (05/10): danh sách em của bộ chọn màn Giao (`useDsEmGiao`, nạp qua `NapDsEm` chỉ khi OMNI bật + có lớp) — mặc định cả các lớp đã chọn.
  const [dsEm, setDsEm] = useState<EmLop[]>([])
  const [chonEm, setChonEm] = useState<Set<string>>(new Set())
  const daDienEm = useRef<Set<string>>(new Set())
  const emCuaLop = useCallback((l: string) => new Set(dsEm.filter((e) => emThuocLop(e, l)).map((e) => e.sbd)), [dsEm])
  const emLop = useMemo(() => [...new Set(lopChon.flatMap((l) => dsEm.filter((e) => emThuocLop(e, l)).map((e) => e.sbd)))], [dsEm, lopChon])
  useEffect(() => {
    // Danh sách về / đổi lớp ⇒ tích sẵn em của lớp MỚI chọn đúng MỘT lần (như màn Giao tích theo lớp của ca); bỏ lớp ⇒ bỏ em của lớp ấy.
    if (!dsEm.length) return
    const da = daDienEm.current
    const them: string[] = []
    const bo: string[] = []
    for (const l of [...da]) {
      if (lopChon.includes(l)) continue
      da.delete(l)
      bo.push(...emCuaLop(l))
    }
    for (const l of lopChon) {
      if (da.has(l)) continue
      da.add(l)
      them.push(...emCuaLop(l))
    }
    if (!them.length && !bo.length) return
    setChonEm((cu) => {
      const s = new Set(cu)
      for (const x of bo) s.delete(x)
      for (const x of them) s.add(x)
      return s
    })
  }, [dsEm, lopChon, emCuaLop])
  const coDanhSachEm = dsEm.length > 0
  const sbdChon = useMemo(() => dsEm.filter((e) => chonEm.has(e.sbd)).map((e) => e.sbd), [dsEm, chonEm])
  const emTheoLop = useMemo(() => chiaEmTheoLop(lopChon, dsEm, sbdChon), [lopChon, dsEm, sbdChon])
  // Buổi gần đây của từng lớp (điểm danh) — lỗi / không có ⇒ không có chip.
  const [dsBuoiTheoLop, setDsBuoiTheoLop] = useState<Record<string, BuoiGanDay[]>>({})
  useEffect(() => {
    let song = true
    setDsBuoiTheoLop({})
    if (!bat || !lopChon.length) return
    for (const l of lopChon)
      void buoiGanDay(l).then((r) => {
        if (song && r.ok) setDsBuoiTheoLop((cu) => ({ ...cu, [l]: r.du }))
      })
    return () => {
      song = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bat, khoaLop])
  const tt = dd.tt
  const chipBuoi = useMemo(() => {
    const dangMo = tt?.buoi.dangMo ? { id: tt.buoi.id, lop: (tt.buoi.lop ?? '').trim(), moLuc: tt.buoi.moLuc, coMat: tt.coMat.map((e) => e.sbd) } : null
    const coTrongDs = new Set(dsEm.map((e) => e.sbd))
    const nhieu = lopChon.length > 1
    // Chỉ giữ em có trong danh sách em (bấm chip ⇒ chọn đúng các em có mặt). Nhiều lớp: mỗi lớp một nhóm chip, nhãn kèm tên gọn của lớp.
    return lopChon.flatMap((l) =>
      dungChipBuoi(l, dangMo, dsBuoiTheoLop[l] ?? [])
        .map((c) => ({ ...c, id: nhieu ? `${l}|${c.id}` : c.id, chu: nhieu ? `${tenGonLop(l)} · ${c.chu}` : c.chu, lop: l, chon: c.sbd.filter((s) => coTrongDs.has(s)) }))
        .filter((c) => c.chon.length > 0),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tt, dsBuoiTheoLop, dsEm, khoaLop])
  /** Bấm chip điểm danh: một lớp ⇒ chọn đúng các em có mặt (như cũ); nhiều lớp ⇒ chỉ thay phần em của lớp ấy, giữ em các lớp khác. */
  const chonTheoChip = (c: { lop: string; chon: string[] }) =>
    setChonEm((cu) => (lopChon.length <= 1 ? new Set(c.chon) : new Set([...[...cu].filter((s) => !emCuaLop(c.lop).has(s)), ...c.chon])))
  const chipDangChon = (c: { lop: string; chon: string[] }) => (lopChon.length <= 1 ? giongTap(chonEm, c.chon) : giongTap(new Set([...chonEm].filter((s) => emCuaLop(c.lop).has(s))), c.chon))

  // CHỌN MỘT BÀI (tờ tự giao suy từ bài, không ô tích) + sửa hạn nộp / số lượt.
  const [chon, setChon] = useState<BaiCay | null>(null)
  const maDeTuGiao = useMemo(() => (chon ? maDeMacDinh(chon) : []), [chon])
  const [moSua, setMoSua] = useState(false)
  const [hanSua, setHanSua] = useState('')
  const [theLucChu, setTheLucChu] = useState('')
  const [loiGiao, setLoiGiao] = useState('')
  const homNay = ngayVn(Date.now())
  useEffect(() => {
    // Đổi KHỐI ⇒ bỏ bài đang chọn (cây khác); đổi lớp trong cùng khối thì giữ (chip trạng thái tự cập nhật).
    setChon(null)
  }, [khoi])
  useEffect(() => {
    // Bài đang chọn đã có ở MỌI lớp đã chọn (vừa giao xong / thầy thêm lớp đã dạy) ⇒ không còn gì để giao.
    setChon((c) => (c && lopChon.length > 0 && lopChon.every((l) => tickTheoLop.get(l)?.has(c.khoaBai)) ? null : c))
  }, [lopChon, tickTheoLop])
  const chonBai = (b: BaiCay) => {
    setChon(b)
    setMoSua(false)
    setHanSua('')
    setTheLucChu('')
    setLoiGiao('')
  }
  const nTheLuc = Math.floor(Number(theLucChu))
  const theLucSua = theLucChu.trim() && Number.isFinite(nTheLuc) && nTheLuc >= 1 ? Math.min(LUOT_TOI_DA, nTheLuc) : undefined
  const loiTheLuc = theLucChu.trim() && !theLucSua ? 'Số lượt phải là số nguyên từ 1' : ''
  const hanHopLe = !hanSua || (laNgay(hanSua) && hanSua >= homNay)

  // ĐẦU VÀO từng lớp: chỉ lớp CHƯA có bài này; có danh sách em ⇒ gửi đúng em đã chọn của lớp ấy (0 em ⇒ bỏ qua lớp); chưa có ⇒ hành vi cũ: máy chủ giao cả lớp.
  const dauVaoLop = useMemo(() => {
    if (!chon || !lopChon.length || !maDeTuGiao.length) return []
    const ra: { lop: string; dauVao: DauVaoBai }[] = []
    for (const l of lopChon) {
      if (tickTheoLop.get(l)?.has(chon.khoaBai)) continue
      const sbd = coDanhSachEm ? (emTheoLop.get(l) ?? []) : null
      if (sbd && !sbd.length) continue
      ra.push({
        lop: l,
        dauVao: {
          lop: l,
          khoaBai: chon.khoaBai,
          tenBai: chon.tenBai,
          viTri: chon.viTri,
          maDe: maDeTuGiao,
          ...(hanSua && hanHopLe ? { hanNop: hanSua } : {}),
          ...(theLucSua ? { theLucNgay: theLucSua } : {}),
          ...(sbd ? { sbd } : {}),
        },
      })
    }
    return ra
  }, [chon, lopChon, maDeTuGiao, hanSua, hanHopLe, theLucSua, coDanhSachEm, emTheoLop, tickTheoLop])

  // XEM TRƯỚC từng lớp: mỗi lần đổi đầu vào (chờ thầy gõ xong); câu trả lời cũ về muộn thì bỏ.
  const [xemTheoLop, setXemTheoLop] = useState<Record<string, XemTruocTick>>({})
  const [loiXemTheoLop, setLoiXemTheoLop] = useState<Record<string, string>>({})
  const [dangXem, setDangXem] = useState(false)
  const luotXem = useRef(0)
  const khoaXem = JSON.stringify(dauVaoLop.map((x) => x.dauVao))
  useEffect(() => {
    const l = ++luotXem.current
    if (!dauVaoLop.length) {
      setXemTheoLop({})
      setLoiXemTheoLop({})
      setDangXem(false)
      return
    }
    setDangXem(true)
    const hen = setTimeout(() => {
      void Promise.all(dauVaoLop.map(async (x) => [x.lop, await baiDaDayXemTruoc(x.dauVao)] as const)).then((kq) => {
        if (l !== luotXem.current) return
        setDangXem(false)
        const xem: Record<string, XemTruocTick> = {}
        const loi: Record<string, string> = {}
        for (const [x, r] of kq) {
          if (r.ok) xem[x] = r.du
          else loi[x] = r.chu
        }
        setXemTheoLop(xem)
        setLoiXemTheoLop(loi)
      })
    }, CHO_XEM_MS)
    return () => clearTimeout(hen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaXem])

  // GIAO (tick) — thẻ xác nhận chính là bước hỏi lại; giao xong vẫn "Bỏ tick" được (luật C8: hoàn tác thay vì hỏi thêm). Nhiều lớp: LẦN LƯỢT từng lớp chưa có bài.
  const [dangGiao, setDangGiao] = useState(false)
  const giao = async () => {
    if (!chon || !dauVaoLop.length || dangGiao || dangXem || dauVaoLop.some((x) => !xemTheoLop[x.lop])) return
    setDangGiao(true)
    setLoiGiao('')
    const phamVi = phamViTruoc(dsBai, chon.viTri)
    const ok: { lop: string; daCo: boolean; hanNop: string }[] = []
    const loi: { lop: string; chu: string }[] = []
    for (const x of dauVaoLop) {
      const r = await baiDaDayTick({ ...x.dauVao, phamVi })
      if (r.ok) ok.push({ lop: x.lop, daCo: r.du.daCo, hanNop: r.du.hanNop })
      else loi.push({ lop: x.lop, chu: r.chu })
    }
    setDangGiao(false)
    const ten = tenNganBai(chon.tenBai)
    if (ok.length === 1 && dauVaoLop.length === 1) {
      const k = ok[0]!
      showToast(k.daCo ? `${ten} đã giao cho ${k.lop} từ trước — giữ chiến dịch có sẵn (đổi em nhận bài: bấm Sửa em)` : `Đã giao ${ten} cho ${k.lop}${k.hanNop ? ` · hạn nộp ${hienHanNop(k.hanNop)}` : ''}`, 'success')
    } else if (ok.length) {
      const moi = ok.filter((k) => !k.daCo).map((k) => k.lop)
      const cu = ok.filter((k) => k.daCo).map((k) => k.lop)
      showToast([moi.length ? `Đã giao ${ten} cho ${moi.length} lớp: ${moi.join(', ')}` : '', cu.length ? `${cu.join(', ')} đã có ${ten} từ trước — giữ chiến dịch có sẵn` : ''].filter(Boolean).join(' · '), 'success')
    }
    if (loi.length) setLoiGiao(loi.length === 1 && dauVaoLop.length === 1 ? loi[0]!.chu : loi.map((x) => `${x.lop}: ${x.chu}`).join(' · '))
    if (ok.length) void taiDs()
    if (!loi.length) setChon(null)
  }

  const [dangBo, setDangBo] = useState('')
  const boTick = async (b: Pick<BaiDaTick, 'khoaBai' | 'tenBai'>, lopBo: string = lop) => {
    if (dangBo) return
    const ten = tenNganBai(b.tenBai)
    const ok = await hoiXacNhan({
      tieuDe: `Bỏ tick ${ten}?`,
      noiDung: `Chiến dịch luyện của ${ten} (lớp ${lopBo}) dừng: chưa em nào làm câu nào thì huỷ hẳn; đã có em làm thì đóng lại, kết quả đã làm vẫn giữ. Bài trở về "Chưa dạy".`,
      nhanDongY: 'Bỏ tick',
      nhanKhong: 'Giữ bài',
      nguyHiem: true,
    })
    if (!ok) return
    setDangBo(`${lopBo}|${b.khoaBai}`)
    const r = await baiDaDayBoTick(lopBo, b.khoaBai)
    setDangBo('')
    if (!r.ok) {
      showToast(r.chu, 'error')
      return
    }
    showToast(
      r.du.chienDich === 'da_huy'
        ? `Đã bỏ tick ${ten} — chiến dịch chưa có lượt làm nên đã huỷ`
        : r.du.chienDich === 'da_dong'
          ? `Đã bỏ tick ${ten} — chiến dịch đã đóng, kết quả đã làm vẫn giữ`
          : `Đã bỏ tick ${ten}`,
      'success',
    )
    void taiDs()
  }

  // "Sửa em" của bài đã tick: hộp sửa chiến dịch sẵn có; không có mã chiến dịch ⇒ sang mục Chiến dịch luyện.
  const setScreen = useAppStore((s) => s.setScreen)
  const [suaCd, setSuaCd] = useState<{ id: string; ten: string } | null>(null)
  const suaEm = (b: Pick<BaiDaTick, 'chienDichId' | 'tenBai'>) => {
    if (b.chienDichId) setSuaCd({ id: b.chienDichId, ten: b.tenBai })
    else setScreen('chiendich')
  }

  const chuCho = bat ? lopChon.map((l) => chuChoBaiMoi(l, dsTheoLop[l]?.choBaiMoi)).filter((c): c is string => !!c) : []
  return {
    setDsEm,
    dsEm,
    chonEm,
    setChonEm,
    emLop,
    emTheoLop,
    coDanhSachEm,
    sbdChon,
    chipBuoi,
    chonTheoChip,
    chipDangChon,
    suaCd,
    setSuaCd,
    suaEm,
    bat,
    co,
    dsLop,
    lopChonDuoc,
    lop,
    lopChon,
    setLopChon: (ds: string[]) => setLopTay(ds),
    khoi,
    dsTheoLop,
    loiDsTheoLop,
    dangTaiDs,
    taiDs,
    dsBai,
    tickTheoLop,
    chon,
    chonBai,
    maDeTuGiao,
    moSua,
    setMoSua,
    hanSua,
    setHanSua,
    theLucChu,
    setTheLucChu,
    theLucSua,
    loiTheLuc,
    hanHopLe,
    homNay,
    dauVaoLop,
    xemTheoLop,
    loiXemTheoLop,
    dangXem,
    giao,
    dangGiao,
    loiGiao,
    boTick,
    dangBo,
    chuCho,
  }
}
export type BaiHomNay = ReturnType<typeof useBaiHomNay>

/** Dòng nhỏ ở đầu bảng Dạy học: "Lớp 12A1: 3 ngày chưa có bài mới" (chỉ khi lớp chờ bài mới từ 3 ngày; nhiều lớp ⇒ mỗi lớp một chip). */
export function DongChoBaiMoi({ bhn }: { bhn: Pick<BaiHomNay, 'chuCho'> }) {
  if (!bhn.chuCho.length) return null
  return (
    <p className="dh-phu bhn-cho" data-khoi="cho-bai-moi">
      {bhn.chuCho.map((c) => (
        <span key={c} className="dh-chip dh-chip--vang">
          {c}
        </span>
      ))}
    </p>
  )
}

/** Một dòng bài của cây: số bài, tên + số câu, chip trạng thái (gộp qua các lớp đã chọn), Sửa em / Bỏ tick (một lớp: ngay trên dòng; nhiều lớp: mở "Theo lớp"). */
function HangBai({ bhn, b }: { bhn: BaiHomNay; b: BaiCay }) {
  const { lopChon, chon, chonBai, tickTheoLop } = bhn
  const nhieu = lopChon.length > 1
  const ticks = lopChon.map((l) => ({ lop: l, tick: tickTheoLop.get(l)?.get(b.khoaBai) }))
  const dangChon = chon?.khoaBai === b.khoaBai
  const tt = trangThaiNhieuLop(ticks.map((x) => x.tick), dangChon)
  const daHet = ticks.length > 0 && ticks.every((x) => !!x.tick)
  const tick1 = nhieu ? undefined : ticks[0]?.tick
  const so = soBaiCuaTen(b.tenBai)
  const soEm1 = tick1 ? (tick1.soEm ?? tick1.chungChi?.tong) : null
  const [moChiTiet, setMoChiTiet] = useState(false)
  return (
    <li className={`bhn-bai${dangChon ? ' bhn-bai--chon' : ''}${daHet ? ' bhn-bai--xong' : ''}`} data-bai={b.khoaBai} data-trang-thai={tt.kieu}>
      <label className="bhn-bai-chon">
        <input type="radio" className="bhn-bai-radio" name="dh-bai-hom-nay" checked={dangChon} disabled={daHet} onChange={() => chonBai(b)} />
        <span className="bhn-bai-so" aria-hidden="true">
          {so ?? '•'}
        </span>
        <span className="bhn-bai-chu">
          <span className="bhn-bai-ten" title={b.tenBai}>
            {b.tenBai}
          </span>
          <small>
            {b.soCau} câu
            {soEm1 ? ` · Đã giao ${soEm1} em` : ''}
          </small>
        </span>
      </label>
      <span className="bhn-bai-phai">
        <span className={LOP_CHIP[tt.kieu]}>{tt.chu}</span>
        {tick1 && (
          <button type="button" className="m3-nut-chu dh-nut-nho" onClick={() => bhn.suaEm(tick1)} title={tick1.chienDichId ? 'Thêm / bớt em của chiến dịch bài này' : 'Mở mục Chiến dịch luyện'}>
            Sửa em
          </button>
        )}
        {tick1 && (
          <button type="button" className="m3-nut-chu dh-nut-nho" disabled={bhn.dangBo === `${lopChon[0]}|${b.khoaBai}`} onClick={() => void bhn.boTick(b, lopChon[0])}>
            {bhn.dangBo === `${lopChon[0]}|${b.khoaBai}` ? 'Đang bỏ…' : 'Bỏ tick'}
          </button>
        )}
      </span>
      {nhieu && ticks.some((x) => x.tick) && (
        <div className="bhn-bai-lop" data-khoi="bai-theo-lop">
          <ul className="bhn-cham-ds" aria-label="Trạng thái theo lớp">
            {ticks.map((x) => {
              const t = trangThaiBai(x.tick, false)
              return (
                <li key={x.lop} className={LOP_CHAM[t.kieu]} data-lop={x.lop} title={`${x.lop}: ${t.chu}`} aria-label={`${x.lop}: ${t.chu}`}>
                  {t.kieu === 'chua_day' ? tenGonLop(x.lop) : `${tenGonLop(x.lop)} · ${chuNgan(t.chu)}`}
                </li>
              )
            })}
            <li className="bhn-cham-nut">
              <button type="button" className="bhn-nut-link" aria-expanded={moChiTiet} onClick={() => setMoChiTiet(!moChiTiet)}>
                Sửa em / Bỏ tick theo lớp
              </button>
            </li>
          </ul>
          {moChiTiet && (
            <ul className="bhn-chi-tiet">
              {ticks
                .filter((x) => x.tick)
                .map((x) => (
                  <li key={x.lop} className="bhn-chi-tiet-hang" data-lop={x.lop}>
                    <span className="bhn-chi-tiet-ten">{x.lop}</span>
                    <span className="bhn-chi-tiet-nut">
                      <button type="button" className="m3-nut-chu dh-nut-nho" aria-label={`Sửa em · ${x.lop}`} onClick={() => bhn.suaEm(x.tick!)}>
                        Sửa em
                      </button>
                      <button type="button" className="m3-nut-chu dh-nut-nho" aria-label={`Bỏ tick · ${x.lop}`} disabled={bhn.dangBo === `${x.lop}|${b.khoaBai}`} onClick={() => void bhn.boTick(b, x.lop)}>
                        {bhn.dangBo === `${x.lop}|${b.khoaBai}` ? 'Đang bỏ…' : 'Bỏ tick'}
                      </button>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

/** Thẻ một chương: tên chương + "k/n bài đã giao" + thanh tiến độ, rồi các dòng bài. */
function ChuongBai({ bhn, g }: { bhn: BaiHomNay; g: { chuong: string; bai: BaiCay[] } }) {
  const daGiao = g.bai.filter((b) => bhn.lopChon.some((l) => bhn.tickTheoLop.get(l)?.has(b.khoaBai))).length
  const pct = g.bai.length ? Math.round((100 * daGiao) / g.bai.length) : 0
  return (
    <section className="bhn-chuong" aria-label={g.chuong || 'Bài'}>
      {g.chuong && (
        <header className="bhn-chuong-dau">
          <h3>{g.chuong}</h3>
          <span className="bhn-chuong-dem">
            {daGiao}/{g.bai.length} bài đã giao
          </span>
          <div className="bhn-tien" aria-hidden="true">
            <i style={{ width: `${pct}%` }} />
          </div>
        </header>
      )}
      <ul className="bhn-bai-ds" aria-label={g.chuong || 'Bài'}>
        {g.bai.map((b) => (
          <HangBai key={b.khoaBai} bhn={bhn} b={b} />
        ))}
      </ul>
    </section>
  )
}

/** Thẻ bước "Bài hôm nay" — cùng kiểu thẻ bước của bảng Dạy học. OMNI tắt ⇒ không vẽ gì. */
export function BuocBaiHomNay({ bhn, kho, soBuoc = 4 }: { bhn: BaiHomNay; kho: TeacherExamSource[] | null; soBuoc?: number }) {
  if (!bhn.bat) return null
  const { lop, lopChon, lopChonDuoc, khoi, dsTheoLop, loiDsTheoLop, dangTaiDs, taiDs, dsBai, chon } = bhn
  // Nhóm bài theo chương, giữ thứ tự đã sắp.
  const theoChuong: { chuong: string; bai: BaiCay[] }[] = []
  for (const b of dsBai) {
    const cuoi = theoChuong[theoChuong.length - 1]
    if (cuoi && cuoi.chuong === b.chuong) cuoi.bai.push(b)
    else theoChuong.push({ chuong: b.chuong, bai: [b] })
  }
  const loiDs = lopChon.filter((l) => loiDsTheoLop[l]).map((l) => (lopChon.length > 1 ? `${l}: ${loiDsTheoLop[l]}` : loiDsTheoLop[l]!))
  return (
    <section className="dh-buoc bhn" aria-labelledby="dh-b4" data-khoi="bai-hom-nay">
      {lopChon.length > 0 && <NapDsEm onCo={bhn.setDsEm} />}
      <div className="dh-buoc-dau">
        <span className="dh-so" aria-hidden="true">
          {soBuoc}
        </span>
        <div className="dh-buoc-ten">
          <h2 id="dh-b4">Bài hôm nay</h2>
          <p>Tick bài vừa dạy — {TEN_AI} tự giao luyện theo bài cho các lớp thầy chọn. Bài đứng trước bài đã tick là bài cũ để ôn lại.</p>
        </div>
      </div>

      <div className="bhn-lop">
        <span className="bhn-nhan">Lớp nhận bài</span>
        <ChonLopGiao dsLop={lopChonDuoc} chon={lopChon} onDoi={bhn.setLopChon} />
        {lopChon.length > 0 && khoi && (
          <p className="bhn-khoi-meta">
            <span className="bhn-khoi-chip">Cây Dạy học · Khối {khoi}</span>
            {lopChon.length > 1 && <span className="dh-phu">{lopChon.length} lớp đang chọn — bài tick ở dưới sẽ giao lần lượt cho từng lớp chưa có bài.</span>}
          </p>
        )}
      </div>

      {!lopChon.length ? (
        <p className="bhn-trong">Chọn lớp để xem cây bài Dạy học của khối và trạng thái từng bài.</p>
      ) : !khoi ? (
        <p className="bhn-trong">Chưa nhận ra khối của lớp {lop} (tên lớp cần bắt đầu bằng 10, 11 hoặc 12).</p>
      ) : !kho ? (
        <p className="bhn-trong" aria-busy="true">
          Đang đọc kho đề…
        </p>
      ) : dsBai.length === 0 ? (
        <p className="bhn-trong">Kho chưa có bài Dạy học của khối {khoi}. Vào Ngân hàng câu hỏi → Đồng bộ ngay để nạp đề.</p>
      ) : (
        <>
          {loiDs.length > 0 ? (
            <div className="dh-hang">
              <p className="dh-loi" role="alert">
                {loiDs.join(' · ')}
              </p>
              <button type="button" className="m3-nut-vien dh-nut-nho" onClick={() => void taiDs()}>
                Thử lại
              </button>
            </div>
          ) : dangTaiDs && lopChon.every((l) => !dsTheoLop[l]) ? (
            <p className="dh-phu" aria-busy="true">
              Đang đọc trạng thái các bài…
            </p>
          ) : null}
          <div className="bhn-cay" data-khoi="cay-bai" role="radiogroup" aria-label={`Bài vừa dạy · ${lopChon.length > 1 ? 'các lớp' : 'lớp'} ${lopChon.join(', ')}`}>
            {theoChuong.map((g) => (
              <ChuongBai key={g.chuong || '_'} bhn={bhn} g={g} />
            ))}
          </div>
        </>
      )}

      {chon && <TheXacNhan bhn={bhn} chon={chon} />}
      {bhn.suaCd && (
        <Suspense fallback={null}>
          <SuaChienDich
            id={bhn.suaCd.id}
            ten={bhn.suaCd.ten}
            onDong={() => bhn.setSuaCd(null)}
            onDaLuu={(kq) => {
              bhn.setSuaCd(null)
              useAppStore.getState().showToast(`Đã lưu chiến dịch: ${kq.tomTat}`, 'success')
              void taiDs()
            }}
          />
        </Suspense>
      )}
    </section>
  )
}

/** Nạp danh sách em của bộ chọn màn Giao (`useDsEmGiao`) — chỉ dựng khi OMNI bật và đã có lớp (OMNI tắt ⇒ không gọi thêm lệnh nào). */
function NapDsEm({ onCo }: { onCo: (ds: EmLop[]) => void }) {
  const ds = useDsEmGiao()
  useEffect(() => {
    onCo(ds)
  }, [ds, onCo])
  return null
}

/** Lưới 6 con số của MỘT lớp (ô "Đủ lượt để ca chốt ≥ 8" ẩn khi chưa có P). */
function LuoiSo({ xem, hanSua, theLucSua, dangXem }: { xem: XemTruocTick; hanSua: string; theLucSua: number | undefined; dangXem: boolean }) {
  const pct = xem.sucChua > 0 ? Math.round((100 * xem.luotCan) / xem.sucChua) : null
  return (
    <div className="cd-kpi-hang" data-khoi="sau-con-so" aria-busy={dangXem}>
      <div className="cd-kpi" data-so-tick="cau">
        <span className="cd-kpi-nhan">Câu rút được</span>
        <strong>
          {xem.soCau}
          <small>câu</small>
        </strong>
        <span className="cd-kpi-phu">{xem.soTuLuan > 0 ? `đã bỏ ${xem.soTuLuan} câu tự luận` : 'không có câu tự luận'}</span>
      </div>
      <div className="cd-kpi" data-so-tick="han">
        <span className="cd-kpi-nhan">{hanSua ? 'Hạn nộp (thầy sửa)' : 'Hạn nộp tự tính'}</span>
        <strong>
          {xem.D}
          <small>ngày</small>
        </strong>
        <span className="cd-kpi-phu">hết {hienHanNop(xem.hanNop, false) || xem.hanNop}</span>
      </div>
      <div className="cd-kpi" data-so-tick="luot">
        <span className="cd-kpi-nhan">Lượt cần / sức chứa</span>
        <strong>
          {xem.luotCan}
          <small>/ {xem.sucChua} lượt</small>
        </strong>
        <span className="cd-kpi-phu">em ở giữa lớp{pct !== null ? ` · ${pct}% sức chứa` : ''}</span>
      </div>
      <div className="cd-kpi" data-so-tick="luot-ngay">
        <span className="cd-kpi-nhan">Số lượt mỗi ngày</span>
        <strong>
          {xem.theLucNgay}
          <small>lượt/ngày</small>
        </strong>
        <span className="cd-kpi-phu">{theLucSua ? 'thầy sửa' : 'mặc định của lớp'}</span>
      </div>
      <div className="cd-kpi" data-so-tick="du-luot">
        <span className="cd-kpi-nhan">Đủ lượt để luyện hết</span>
        <strong>
          {xem.duLuot}
          <small>/ {xem.soEmChon} em</small>
        </strong>
        {xem.soEmChon !== xem.tongEm && <span className="cd-kpi-phu">em được giao · lớp có {xem.tongEm} em</span>}
      </div>
      {xem.duDiem8 !== null && (
        <div className="cd-kpi" data-so-tick="du-diem-8">
          <span className="cd-kpi-nhan">Đủ lượt để ca chốt ≥ 8</span>
          <strong>
            {xem.duDiem8}
            <small>/ {xem.soEmChon} em</small>
          </strong>
        </div>
      )}
    </div>
  )
}

/** Cảnh báo quá tải của một lớp (nhiều lớp: kèm tên lớp). */
function CanhBaoQuaTai({ xem, lop, kemLop }: { xem: XemTruocTick; lop: string; kemLop: boolean }) {
  const quaTai = xem.quaTai
  if (!quaTai.length) return null
  return (
    <p className="dh-loi" role="alert" data-khoi="qua-tai">
      {kemLop ? `Lớp ${lop}: ` : ''}
      {quaTai.length} em quá tải ngay từ ngày đầu: {quaTai.slice(0, TOI_DA_TEN_QUA_TAI).map((e) => e.ten).join(', ')}
      {quaTai.length > TOI_DA_TEN_QUA_TAI ? ` và ${quaTai.length - TOI_DA_TEN_QUA_TAI} em nữa` : ''}. Gợi ý: lùi hạn nộp hoặc tăng số lượt mỗi ngày. Vẫn giao được.
    </p>
  )
}

/** Thẻ XÁC NHẬN TRƯỚC KHI GIAO: tờ vào bài luyện, các lớp nhận, 6 con số có nhãn (mỗi lớp), cảnh báo quá tải, nút chính + nút sửa hạn nộp / số lượt. */
function TheXacNhan({ bhn, chon }: { bhn: BaiHomNay; chon: BaiCay }) {
  const { lopChon, maDeTuGiao, moSua, setMoSua, hanSua, setHanSua, theLucChu, setTheLucChu, theLucSua, loiTheLuc, hanHopLe, homNay, dauVaoLop, xemTheoLop, loiXemTheoLop, dangXem, giao, dangGiao, loiGiao } = bhn
  const { dsEm, chonEm, setChonEm, emLop, coDanhSachEm, sbdChon, chipBuoi, emTheoLop } = bhn
  const ten = tenNganBai(chon.tenBai)
  const tuGiao = chuTuGiao(chon)
  const so = soBaiCuaTen(chon.tenBai)
  const nhieu = lopChon.length > 1
  const lopGiao = dauVaoLop.map((x) => x.lop)
  const lopDaCo = lopChon.filter((l) => !lopGiao.includes(l) && bhn.tickTheoLop.get(l)?.has(chon.khoaBai))
  const lopBoQua = coDanhSachEm ? lopChon.filter((l) => !lopGiao.includes(l) && !lopDaCo.includes(l)) : []
  const xongCaDs = lopGiao.length > 0 && lopGiao.every((l) => xemTheoLop[l])
  const nhanLop = lopGiao.length > 1 ? `${lopGiao.length} lớp` : (lopGiao[0] ?? lopChon[0] ?? '')
  const nutGiao = dangGiao ? 'Đang giao…' : `Giao ${ten} cho ${nhanLop}`
  const lopDauTien = lopGiao[0]
  const xem1 = lopDauTien ? xemTheoLop[lopDauTien] : undefined
  const loiXem1 = lopDauTien ? loiXemTheoLop[lopDauTien] : undefined
  return (
    <div className="bhn-xn" data-khoi="xac-nhan-tick" aria-live="polite">
      <div className="bhn-xn-dau">
        <span className="bhn-bai-so bhn-bai-so--lon" aria-hidden="true">
          {so ?? '•'}
        </span>
        <div className="bhn-xn-ten">
          <h3>Xác nhận trước khi giao · {chon.tenBai}</h3>
          <div className="bhn-xn-lop" data-khoi="giao-cho">
            <span className="dh-phu">Giao cho</span>
            {lopGiao.map((l) => (
              <span key={l} className="bhn-lop-the" data-lop={l}>
                {l}
                {coDanhSachEm ? ` · ${emTheoLop.get(l)?.length ?? 0} em` : ''}
              </span>
            ))}
            {lopGiao.length === 0 && <span className="dh-phu">{lopDaCo.length ? `chưa có lớp nào cần giao` : 'chưa có lớp nào đủ điều kiện'}</span>}
          </div>
          {lopBoQua.length > 0 && (
            <p className="dh-phu" data-khoi="lop-bo-qua">
              Chưa chọn em nào nên chưa giao: {lopBoQua.join(', ')}.
            </p>
          )}
          {lopDaCo.length > 0 && (
            <p className="dh-phu" data-khoi="lop-da-co">
              Đã có bài này từ trước, giữ chiến dịch sẵn có: {lopDaCo.join(', ')}.
            </p>
          )}
        </div>
      </div>

      {/* Thầy 05/10: ba phần Trắc nghiệm / Đúng sai / Trả lời ngắn TỰ GIAO (dòng tĩnh, không ô tích); Ví dụ minh hoạ và Các dạng toán trọng tâm không bao giờ giao. */}
      <div className="bhn-tu-giao" data-khoi="tu-giao">
        {/* Bài không còn tờ tự giao ⇒ chỉ một lời báo (khối lỗi bên dưới), không nhắc hai chỗ. */}
        {tuGiao && <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{tuGiao}</p>}
        <p className="dh-phu">{CHU_KHONG_GIAO_MUC_DAY_HOC}</p>
      </div>

      {/* BÊ NGUYÊN khối "Chọn em nhận chiến dịch" của màn Giao (thầy nhắn 05/10) + chọn theo điểm danh. Chưa có danh sách em ⇒ giao cả lớp như cũ. */}
      {coDanhSachEm && (
        <section className="cd-buoc" aria-labelledby="dh-tick-em" data-khoi="chon-em-tick">
          <div className="cd-buoc-dau">
            <h3 id="dh-tick-em">Chọn em nhận chiến dịch</h3>
            <span className={`cd-chip-muc cd-chip-muc--${sbdChon.length ? 'xanh' : 'xam'} cd-so`}>
              {sbdChon.length} / {dsEm.length} em
            </span>
          </div>
          {chipBuoi.length > 0 && (
            <div className="cd-hang-chip" role="group" aria-label="Chọn em theo điểm danh" data-khoi="theo-diem-danh">
              <span className="cd-phu">Theo điểm danh:</span>
              {chipBuoi.map((c) => (
                <button key={c.id} type="button" className="cd-chip" aria-pressed={bhn.chipDangChon(c)} onClick={() => bhn.chonTheoChip(c)}>
                  {c.chu}
                </button>
              ))}
              {emLop.length > 0 && (
                <button type="button" className="cd-chip" aria-pressed={giongTap(chonEm, emLop)} onClick={() => setChonEm(new Set(emLop))}>
                  {nhieu ? `Cả ${lopChon.length} lớp (${emLop.length} em)` : `Cả lớp (${emLop.length} em)`}
                </button>
              )}
            </div>
          )}
          <ChonEmGiao ds={dsEm} chon={chonEm} onDoi={setChonEm} />
          {!sbdChon.length && (
            <p className="dh-loi" role="alert">
              Chọn ít nhất 1 em.
            </p>
          )}
        </section>
      )}

      {!dauVaoLop.length ? (
        // Chưa chọn em ⇒ lời báo đã nằm NGAY CẠNH bộ chọn em (không nhắc hai chỗ).
        maDeTuGiao.length > 0 && coDanhSachEm && !sbdChon.length ? null : (
          <p className="dh-loi" role="alert">
            {maDeTuGiao.length === 0 ? CHU_BAI_CHUA_CO_TO_TU_GIAO : !hanHopLe ? 'Hạn nộp phải từ hôm nay trở đi.' : lopDaCo.length ? 'Mọi lớp đã chọn đều có bài này rồi.' : 'Chưa đủ thông tin để xem trước.'}
          </p>
        )
      ) : !nhieu ? (
        loiXem1 && !dangXem ? (
          <p className="dh-loi" role="alert">
            {loiXem1}
          </p>
        ) : !xem1 ? (
          <p className="dh-phu" aria-busy="true">
            Đang tính câu rút được, hạn nộp và số lượt…
          </p>
        ) : (
          <>
            <LuoiSo xem={xem1} hanSua={hanSua} theLucSua={theLucSua} dangXem={dangXem} />
            <CanhBaoQuaTai xem={xem1} lop={lopDauTien!} kemLop={false} />
          </>
        )
      ) : (
        <ul className="bhn-xem-ds" data-khoi="xem-theo-lop" aria-busy={dangXem}>
          {lopGiao.map((l) => {
            const x = xemTheoLop[l]
            const loi = loiXemTheoLop[l]
            const pct = x && x.sucChua > 0 ? Math.round((100 * x.luotCan) / x.sucChua) : null
            const dau = (
              <>
                <b>{l}</b>
                {x ? (
                  <span className="cd-so bhn-xem-tom">
                    {x.soEmChon} em · hạn {hienHanNop(x.hanNop, false) || x.hanNop}
                    {pct !== null ? ` · ${pct}% sức chứa` : ''}
                  </span>
                ) : loi && !dangXem ? null : (
                  <span className="dh-phu">Đang tính…</span>
                )}
                {x && x.quaTai.length > 0 && <span className="cd-chip-muc cd-chip-muc--do">Quá tải {x.quaTai.length} em</span>}
              </>
            )
            return (
              <li key={l} className="bhn-xem-lop" data-lop={l}>
                {x ? (
                  <details className="bhn-xem-chi-tiet">
                    <summary className="bhn-xem-dau" aria-label={`Xem đủ các con số của lớp ${l}`}>
                      {dau}
                      <span className="bhn-xem-mui" aria-hidden="true">
                        ▾
                      </span>
                    </summary>
                    <LuoiSo xem={x} hanSua={hanSua} theLucSua={theLucSua} dangXem={dangXem} />
                  </details>
                ) : (
                  <div className="bhn-xem-dau">{dau}</div>
                )}
                {loi && !dangXem && (
                  <p className="dh-loi" role="alert">
                    {loi}
                  </p>
                )}
                {x && <CanhBaoQuaTai xem={x} lop={l} kemLop />}
              </li>
            )
          })}
        </ul>
      )}

      {moSua && (
        <div className="cd-hai-ngay" data-khoi="sua-han-luot">
          <label className="cd-truong">
            Hạn nộp (hết lúc 23:59)
            <input type="date" value={hanSua} min={homNay} onChange={(e) => setHanSua(e.target.value)} />
            <small className="cd-so cd-phu">{!hanSua ? `Để trống = ${TEN_AI} tự tính (${THAM_SO_OMNI.HAN_BAI_MIN}–${THAM_SO_OMNI.HAN_BAI_MAX} ngày)` : hanHopLe ? hienHanNop(hanSua) : 'Hạn nộp phải từ hôm nay trở đi'}</small>
          </label>
          <label className="cd-truong">
            Số lượt câu mỗi ngày (một em)
            <input type="number" inputMode="numeric" min={1} max={LUOT_TOI_DA} value={theLucChu} placeholder={xem1 ? String(xem1.theLucNgay) : ''} onChange={(e) => setTheLucChu(e.target.value)} />
            <small className="cd-so cd-phu">{loiTheLuc || (nhieu ? 'Để trống = số lượt mặc định của từng lớp (Cài đặt). Số thầy nhập áp cho mọi lớp đang giao.' : 'Để trống = số lượt mặc định của lớp (Cài đặt)')}</small>
          </label>
        </div>
      )}

      {loiGiao && (
        <p className="dh-loi" role="alert">
          {loiGiao}
        </p>
      )}
      <div className="dh-hang bhn-hanh-dong">
        <button type="button" className="m3-nut-chinh dh-nut" disabled={!dauVaoLop.length || !xongCaDs || dangXem || dangGiao} onClick={() => void giao()}>
          {nutGiao}
        </button>
        <button type="button" className="m3-nut-vien dh-nut" aria-expanded={moSua} onClick={() => setMoSua(!moSua)}>
          Sửa hạn nộp hoặc số lượt/ngày
        </button>
      </div>
    </div>
  )
}
