/**
 * ĐẤU TRƯỜNG CHÂN LÝ — MÀN HÌNH.
 *
 * Thầy chốt 15-09: *"bấm vào võ đài xếp hạng thì phải hiện ra đấu trường chân
 * lý luôn, chọn cửa mời số báo danh tối đa được 6 người chơi cùng lúc, thiết
 * kế đánh nhau như đấu trường chân lý"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * MÀN NÀY KHÔNG BIẾT EM LÀ AI. Nó không nhận số báo danh, không đọc hồ sơ học
 * tập; mọi lệnh máy chủ đi qua `cong` — tám hàm gọi lại do cổng học sinh đưa
 * xuống, và chính cổng mới biết số báo danh. Đúng luật đã đặt cho cả game từ
 * đầu: *"Game không cần biết em là ai"*.
 *
 * Ô MỜI là ngoại lệ DUY NHẤT, và là ngoại lệ thầy chốt: em GÕ số báo danh của
 * bạn vào để mời. Số ấy đi thẳng lên máy chủ qua `cong.moi`, không được cất ở
 * đâu trong máy và không hiện lại ở bất cứ chỗ nào khác.
 *
 * MÁY CHỦ KHÔNG XỬ TRẬN. Nó chỉ cất đội hình từng người nộp mỗi vòng; màn này
 * gọi `chayVanTheoNop` chạy lại cả ván từ vòng 1 — hàm thuần, tất định, nên
 * máy em và máy bạn ra cùng một bảng hạng.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Coins, Crown, RefreshCw, Shield, Swords, Trophy, UserPlus, Users, Zap } from 'lucide-react'
import {
  CAP_TOI_DA_DOI, GIA_LAM_MOI, GIA_MUA_KINH_NGHIEM, KN_MOI_LAN_MUA, MAU_KHOI_DAU,
  SO_NGUOI_TOI_DA, VANG_KHOI_DAU, VANG_MOI_CAU_DUNG,
  boSinhSo, capTheoKinhNghiem, chayVanTheoNop, dungChiSo, ghepBaThanhMot,
  hatTuMaPhong, quanTheoId, quayCuaHang, vongChayDuoc,
  type GheNguoiThat, type QuanTrenBan,
} from '../game/than-thu-hoa-hoc/dau-truong-chan-ly'
import { TEN_HE_NGAN, type HeNguyenTo } from '../game/than-thu-hoa-hoc/tuong-khac'
import type { PhongTuMayChu } from '../lib/exam-api'
import { ThanCauGame, NoiDungPhuongAn, type CauCoAnh } from './CauHoiTrongGame'

/** Tám lệnh phòng đấu. Cổng học sinh đóng sẵn số báo danh vào từng hàm. */
export interface CongVoDai {
  taoPhong: (biDanh: string, he: string) => Promise<{ ok: boolean; ma?: string; error?: string }>
  moi: (ma: string, dsSbd: string[]) => Promise<{ ok: boolean; daMoi?: number; error?: string }>
  loiMoi: () => Promise<{ ok: boolean; ds?: { ma: string; soNguoi: number; chuBiDanh: string; moiLuc: string }[]; error?: string }>
  vao: (ma: string, biDanh: string, he: string) => Promise<{ ok: boolean; ma?: string; error?: string }>
  batDau: (ma: string) => Promise<{ ok: boolean; error?: string }>
  xem: (ma: string) => Promise<{ ok: boolean; phong?: PhongTuMayChu; error?: string }>
  nop: (ma: string, vong: number, nop: Record<string, unknown>) => Promise<{ ok: boolean; daNop?: number; tongNguoi?: number; error?: string }>
  dong: (ma: string) => Promise<{ ok: boolean; error?: string }>
}

export interface CauKiemVang extends CauCoAnh {
  dung: number
}

interface Props {
  cong?: CongVoDai
  /** Biệt danh hiện cho bạn cùng phòng — TÊN THẦN THÚ, không phải tên em. */
  biDanh: string
  he: HeNguyenTo
  /** Rút một câu Hoá để em kiếm vàng. Trả `null` khi hết câu. */
  raCauHoi: () => CauKiemVang | null
}

const MAU_HE: Partial<Record<HeNguyenTo, string>> = {
  hoa: 'rgb(249, 115, 22)', khi: 'rgb(16, 185, 129)', kiem: 'rgb(56, 189, 248)',
  axit: 'rgb(168, 85, 247)', dien: 'rgb(59, 130, 246)', huuco: 'rgb(132, 204, 22)',
}

function TheQuan({ q, phu }: { q: QuanTrenBan; phu?: string }) {
  const c = dungChiSo(q)
  const g = quanTheoId(q.idQuan)
  if (c === null || g === undefined) return null
  return (
    <div
      className="rounded-xl border px-2.5 py-2 text-left bg-white dark:bg-slate-900"
      style={{ borderColor: MAU_HE[c.he] }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">{c.ten}</span>
        <span className="text-[10px] font-bold" style={{ color: MAU_HE[c.he] }}>
          {'★'.repeat(c.sao)}
        </span>
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        {TEN_HE_NGAN[c.he]} · {c.mau} HP · {c.cong} ATK · {c.giap} giáp
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{g.ghiChu}</div>
      {phu !== undefined && <div className="text-[10px] font-bold text-amber-600 mt-0.5">{phu}</div>}
    </div>
  )
}

export default function DauTruongChanLy({ cong, biDanh, he, raCauHoi }: Props) {
  const [ma, setMa] = useState('')
  const [maGo, setMaGo] = useState('')
  const [phong, setPhong] = useState<PhongTuMayChu | null>(null)
  const [loi, setLoi] = useState('')
  const [dangGoi, setDangGoi] = useState(false)
  const [dsMoi, setDsMoi] = useState<{ ma: string; soNguoi: number; chuBiDanh: string; moiLuc: string }[]>([])
  const [sbdMoi, setSbdMoi] = useState('')
  const [daMoi, setDaMoi] = useState<string[]>([])

  // ─── Trạng thái ván của CHÍNH EM, sống trên máy này ───
  const [vang, setVang] = useState(VANG_KHOI_DAU)
  const [kinhNghiem, setKinhNghiem] = useState(0)
  const [kho, setKho] = useState<QuanTrenBan[]>([])
  const [oHang, setOHang] = useState<string[]>([])
  const [daNop, setDaNop] = useState(0)
  const [cau, setCau] = useState<CauKiemVang | null>(null)
  const [loiCau, setLoiCau] = useState('')
  const [vanDaChay, setVanDaChay] = useState<ReturnType<typeof chayVanTheoNop> | null>(null)
  const [vongDaXu, setVongDaXu] = useState(0)

  const capDoi = capTheoKinhNghiem(kinhNghiem)
  const gheCuaToi = phong?.nguoi.find((n) => n.laMinh)?.khoa ?? ''
  const vong = phong?.vong ?? 0

  const toiTrongVan = useMemo(
    () => vanDaChay?.phong.nguoi.find((n) => n.sbd === gheCuaToi) ?? null,
    [vanDaChay, gheCuaToi],
  )
  const mauCuaToi = toiTrongVan?.mau ?? MAU_KHOI_DAU
  const chuoiCuaToi = toiTrongVan?.chuoi ?? 0

  // ─── Cửa hàng: hạt giống theo mã phòng + vòng + ghế, nên mỗi em một cửa hàng
  //     riêng nhưng vẫn tái lập được khi mở lại. ───
  const quayLai = useCallback((mien = false) => {
    if (!mien) {
      if (vang < GIA_LAM_MOI) { setLoi('Không đủ vàng để làm mới'); return }
      setVang((v) => v - GIA_LAM_MOI)
    }
    const hat = hatTuMaPhong(`${ma}|${gheCuaToi}|${Math.random()}`, vong)
    setOHang(quayCuaHang(capDoi, boSinhSo(hat)))
  }, [vang, ma, gheCuaToi, vong, capDoi])

  useEffect(() => {
    if (phong?.trangThai !== 'dang_choi') return
    const hat = hatTuMaPhong(`${ma}|${gheCuaToi}`, vong)
    setOHang(quayCuaHang(capTheoKinhNghiem(kinhNghiem), boSinhSo(hat)))
    setDaNop(0)
    setCau(raCauHoi())
    setLoiCau('')
    // Chỉ chạy khi SANG VÒNG MỚI — không phụ thuộc `kinhNghiem` để tránh
    // quay lại cửa hàng mỗi lần em mua một điểm kinh nghiệm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vong, phong?.trangThai, ma, gheCuaToi])

  // ─── Hỏi máy chủ đều đặn ───
  const xemPhong = useCallback(async (maXem: string) => {
    if (cong === undefined || maXem === '') return
    const r = await cong.xem(maXem)
    if (r.ok && r.phong !== undefined) setPhong(r.phong)
    else if (r.error !== undefined) setLoi(r.error)
  }, [cong])

  useEffect(() => {
    if (ma === '') return
    void xemPhong(ma)
    const t = window.setInterval(() => { void xemPhong(ma) }, 2500)
    return () => window.clearInterval(t)
  }, [ma, xemPhong])

  useEffect(() => {
    if (cong === undefined || ma !== '') return
    const hoi = async () => {
      const r = await cong.loiMoi()
      if (r.ok && r.ds !== undefined) setDsMoi(r.ds)
    }
    void hoi()
    const t = window.setInterval(() => { void hoi() }, 6000)
    return () => window.clearInterval(t)
  }, [cong, ma])

  // ─── Khi MỌI GHẾ đã nộp vòng V thì chạy lại cả ván tới vòng V ───
  useEffect(() => {
    if (phong === null || phong.trangThai !== 'dang_choi') return
    const ghe: GheNguoiThat[] = phong.nguoi.map((n) => ({
      khoa: n.khoa,
      biDanh: n.biDanh,
      he: (n.he || 'hoa') as HeNguyenTo,
      nop: Object.fromEntries(
        Object.entries(n.nop).map(([v, x]) => [v, {
          doiHinh: x.doiHinh.map((q) => ({ idQuan: q.idQuan, sao: Math.max(1, Math.min(3, q.sao)) as 1 | 2 | 3 })),
          vang: x.vang, kinhNghiem: x.kinhNghiem,
        }]),
      ),
    }))
    const v = vongChayDuoc(ghe, phong.vong)
    if (v === 0 || v <= vongDaXu) return
    const van = chayVanTheoNop(phong.ma, ghe, v)
    setVanDaChay(van)
    setVongDaXu(v)
    const toi = van.phong.nguoi.find((n) => n.sbd === gheCuaToi)
    if (toi !== undefined) setVang(toi.vang)
  }, [phong, vongDaXu, gheCuaToi])

  const goi = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setDangGoi(true)
    setLoi('')
    const r = await fn()
    setDangGoi(false)
    if (!r.ok) setLoi(r.error ?? 'Máy chủ từ chối')
    return r
  }

  if (cong === undefined) {
    return (
      <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-5 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
        <b>Đấu Trường Chân Lý cần cổng học sinh.</b> Em đang mở game ở chỗ không
        có đường lên máy chủ, nên chưa mời bạn vào phòng được. Vào lại qua cổng
        học sinh là chơi được ngay.
      </div>
    )
  }

  // ═══════════════ SẢNH — chưa vào phòng nào ═══════════════
  if (ma === '' || phong === null) {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <Swords className="w-5 h-5 text-blue-600" />
            <span>Đấu Trường Chân Lý</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Sáu người một phòng. Mỗi vòng: <b>trả lời câu Hoá lấy vàng</b> → mua quân
            ở cửa hàng → ba quân giống nhau tự ghép lên sao → đội hình đánh tự động
            với một người trong phòng. Thua thì mất máu; hết máu là bị loại.
            Người trụ cuối cùng hạng nhất.
          </p>
        </div>

        {loi !== '' && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-800 dark:text-rose-300">
            {loi}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={dangGoi}
            onClick={async () => {
              const r = await goi(() => cong.taoPhong(biDanh, he))
              const m = (r as { ma?: string }).ma
              if (r.ok && m !== undefined) { setMa(m); setVang(VANG_KHOI_DAU); setKho([]); setKinhNghiem(0) }
            }}
            className="p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer disabled:opacity-60"
          >
            Mở phòng mới
            <div className="text-[11px] font-medium opacity-90 mt-0.5">Em làm chủ phòng và mời bạn</div>
          </button>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Vào bằng mã phòng</div>
            <div className="flex gap-2">
              <input
                value={maGo}
                onChange={(e) => setMaGo(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="VD: K7P3"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-black tracking-widest text-center"
              />
              <button
                type="button"
                disabled={dangGoi || maGo.length < 4}
                onClick={async () => {
                  const r = await goi(() => cong.vao(maGo, biDanh, he))
                  if (r.ok) { setMa(maGo); setVang(VANG_KHOI_DAU); setKho([]); setKinhNghiem(0) }
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Vào
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Lời mời gửi cho em
          </div>
          {dsMoi.length === 0 ? (
            <div className="text-xs text-slate-500">Chưa ai mời em. Bạn nào mở phòng thì gõ số báo danh của em vào ô mời.</div>
          ) : (
            <div className="space-y-2">
              {dsMoi.map((m) => (
                <button
                  key={m.ma}
                  type="button"
                  onClick={async () => {
                    const r = await goi(() => cong.vao(m.ma, biDanh, he))
                    if (r.ok) { setMa(m.ma); setVang(VANG_KHOI_DAU); setKho([]); setKinhNghiem(0) }
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {m.chuBiDanh} mời — phòng <span className="font-mono tracking-widest">{m.ma}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">{m.soNguoi}/{SO_NGUOI_TOI_DA} người</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════ PHÒNG CHỜ ═══════════════
  if (phong.trangThai === 'cho') {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã phòng — đọc cho bạn gõ vào</div>
          <div className="text-4xl font-black font-mono tracking-[0.4em] text-blue-600">{phong.ma}</div>
        </div>

        {loi !== '' && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-800 dark:text-rose-300">{loi}</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: SO_NGUOI_TOI_DA }, (_, i) => {
            const n = phong.nguoi[i]
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border text-center ${
                  n === undefined
                    ? 'border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <div className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {n === undefined ? 'Ghế trống → máy lấp' : n.biDanh}
                </div>
                {n !== undefined && (
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {TEN_HE_NGAN[(n.he || 'hoa') as HeNguyenTo]}{n.laMinh ? ' · em' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {phong.laChu && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Mời bạn bằng số báo danh
            </div>
            <div className="flex gap-2">
              <input
                value={sbdMoi}
                onChange={(e) => setSbdMoi(e.target.value.slice(0, 20))}
                placeholder="Gõ số báo danh của bạn"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
              <button
                type="button"
                disabled={dangGoi || sbdMoi.trim() === ''}
                onClick={async () => {
                  const s = sbdMoi.trim()
                  const r = await goi(() => cong.moi(phong.ma, [s]))
                  if (r.ok) { setDaMoi((d) => (d.includes(s) ? d : [...d, s])); setSbdMoi('') }
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Gửi lời mời
              </button>
            </div>
            {daMoi.length > 0 && (
              <div className="text-[11px] text-slate-500">
                Đã mời {daMoi.length} bạn. Lời mời hiện ở màn Đấu Trường của bạn ấy.
              </div>
            )}
            <button
              type="button"
              disabled={dangGoi}
              onClick={() => { void goi(() => cong.batDau(phong.ma)) }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm cursor-pointer disabled:opacity-60"
            >
              Bắt đầu ván — ghế trống để máy lấp
            </button>
          </div>
        )}

        {!phong.laChu && (
          <div className="text-center text-xs text-slate-500">Đang chờ chủ phòng bấm bắt đầu…</div>
        )}

        <button
          type="button"
          onClick={() => { setMa(''); setPhong(null); setVanDaChay(null); setVongDaXu(0) }}
          className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
        >
          Rời phòng
        </button>
      </div>
    )
  }

  // ═══════════════ KẾT THÚC ═══════════════
  if (vanDaChay !== null && vanDaChay.phong.ketThuc) {
    const hang = [...vanDaChay.phong.daLoai].reverse()
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Bảng hạng phòng {phong.ma}
        </h2>
        <div className="space-y-1.5">
          {hang.map((khoa, i) => {
            const n = vanDaChay.phong.nguoi.find((x) => x.sbd === khoa)
            const laToi = khoa === gheCuaToi
            return (
              <div
                key={khoa}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${
                  laToi ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                  {i === 0 && <Crown className="w-4 h-4 text-amber-500" />}
                  Hạng {i + 1} — {n?.biDanh ?? khoa}{laToi ? ' (em)' : ''}
                </span>
                <span className="text-[11px] text-slate-500">
                  {n?.laMay === true ? 'máy' : 'người'} · trụ tới vòng {n?.vongBiLoai === 0 ? vanDaChay.phong.vong : n?.vongBiLoai}
                </span>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => { void cong.dong(phong.ma); setMa(''); setPhong(null); setVanDaChay(null); setVongDaXu(0) }}
          className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-sm cursor-pointer"
        >
          Về sảnh
        </button>
      </div>
    )
  }

  // ═══════════════ ĐANG ĐÁNH ═══════════════
  const bienBanCuoi = vanDaChay?.bienBan[vanDaChay.bienBan.length - 1]
  const tranCuaToi = bienBanCuoi?.tran.find((t) => t.a === gheCuaToi || t.b === gheCuaToi)
  const doiHinh = [...kho]
    .sort((a, b) => (dungChiSo(b)?.cong ?? 0) - (dungChiSo(a)?.cong ?? 0))
    .slice(0, capDoi)

  return (
    <div className="space-y-4">
      {/* Thanh trạng thái */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { nhan: 'Vòng', so: String(vong), phu: `phòng ${phong.ma}` },
          { nhan: 'Máu', so: String(mauCuaToi), phu: `/ ${MAU_KHOI_DAU}` },
          { nhan: 'Vàng', so: String(vang), phu: chuoiCuaToi === 0 ? 'chưa có chuỗi' : `chuỗi ${chuoiCuaToi > 0 ? 'thắng' : 'thua'} ${Math.abs(chuoiCuaToi)}` },
          { nhan: 'Cấp đội', so: String(capDoi), phu: `${doiHinh.length}/${capDoi} ô ra trận` },
        ].map((o) => (
          <div key={o.nhan} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{o.nhan}</div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-tight">{o.so}</div>
            <div className="text-[10px] text-slate-500">{o.phu}</div>
          </div>
        ))}
      </div>

      {tranCuaToi !== undefined && (
        <div className={`rounded-xl px-3 py-2 text-xs font-bold border ${
          tranCuaToi.thang === gheCuaToi
            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
            : 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
        }`}>
          Vòng {bienBanCuoi?.vong}: {tranCuaToi.thang === gheCuaToi
            ? `Thắng! Đối thủ mất ${tranCuaToi.mauMat} máu.`
            : tranCuaToi.thang === null
              ? `Hoà — cả hai mất ${tranCuaToi.mauMat} máu.`
              : `Thua — em mất ${tranCuaToi.mauMat} máu, địch còn ${tranCuaToi.quanSongSot} quân.`}
          {tranCuaToi.bong && ' (đánh với bóng của người đã bị loại)'}
        </div>
      )}

      {loi !== '' && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-800 dark:text-rose-300">{loi}</div>
      )}

      {/* CÂU HỎI LẤY VÀNG — không học thì không có tiền mua quân */}
      {cau !== null && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1.5"><Coins className="w-4 h-4" /> Đúng một câu = +{VANG_MOI_CAU_DUNG} vàng</span>
          </div>
          <ThanCauGame c={cau} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cau.phuongAn.map((_pa, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i === cau.dung) {
                    setVang((v) => v + VANG_MOI_CAU_DUNG)
                    setLoiCau('')
                    setCau(raCauHoi())
                  } else {
                    setLoiCau(`Sai. Đáp án đúng là ${String.fromCharCode(65 + cau.dung)}.`)
                    setCau(raCauHoi())
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-left text-xs font-medium cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40 flex gap-2"
              >
                <strong className="text-amber-700 shrink-0">{String.fromCharCode(65 + i)}.</strong>
                <NoiDungPhuongAn c={cau} i={i} />
              </button>
            ))}
          </div>
          {loiCau !== '' && <div className="text-[11px] font-bold text-rose-600">{loiCau}</div>}
        </div>
      )}

      {/* CỬA HÀNG */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Cửa hàng — cấp {capDoi}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => quayLai(false)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Làm mới −{GIA_LAM_MOI}
            </button>
            <button
              type="button"
              onClick={() => {
                if (vang < GIA_MUA_KINH_NGHIEM) { setLoi('Không đủ vàng mua kinh nghiệm'); return }
                setVang((v) => v - GIA_MUA_KINH_NGHIEM)
                setKinhNghiem((k) => k + KN_MOI_LAN_MUA)
              }}
              disabled={capDoi >= CAP_TOI_DA_DOI}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer disabled:opacity-40 flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Lên cấp −{GIA_MUA_KINH_NGHIEM}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {oHang.map((id, i) => {
            const g = quanTheoId(id)
            if (g === undefined) return null
            return (
              <button
                key={`${id}-${i}`}
                type="button"
                disabled={vang < g.gia}
                onClick={() => {
                  setVang((v) => v - g.gia)
                  setKho((k) => ghepBaThanhMot([...k, { idQuan: g.id, sao: 1 }]))
                  setOHang((o) => o.filter((_, j) => j !== i))
                }}
                className="text-left cursor-pointer disabled:opacity-40"
              >
                <TheQuan q={{ idQuan: g.id, sao: 1 }} phu={`Mua ${g.gia} vàng`} />
              </button>
            )
          })}
          {oHang.length === 0 && (
            <div className="text-xs text-slate-500 col-span-full py-2">Đã mua hết ô. Làm mới để quay tiếp.</div>
          )}
        </div>
      </div>

      {/* ĐỘI HÌNH */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Đội hình ra trận ({doiHinh.length}/{capDoi})
          {kho.length > doiHinh.length && (
            <span className="font-medium text-slate-400"> · {kho.length - doiHinh.length} quân ngồi ngoài</span>
          )}
        </span>
        {kho.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">Chưa có quân nào. Trả lời câu Hoá lấy vàng rồi mua ở cửa hàng.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...kho]
              .sort((a, b) => (dungChiSo(b)?.cong ?? 0) - (dungChiSo(a)?.cong ?? 0))
              .map((q, i) => (
                <div key={i} className={i < capDoi ? '' : 'opacity-45'}>
                  <TheQuan q={q} phu={i < capDoi ? 'Ra trận' : 'Ngồi ngoài'} />
                </div>
              ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={dangGoi || daNop === vong}
        onClick={async () => {
          const r = await goi(() => cong.nop(phong.ma, vong, {
            doiHinh, mau: mauCuaToi, vang, kinhNghiem, chuoi: chuoiCuaToi,
          }))
          if (r.ok) setDaNop(vong)
        }}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm cursor-pointer disabled:opacity-60"
      >
        {daNop === vong ? 'Đã nộp — đang chờ bạn trong phòng nộp nốt…' : `Sẵn sàng — nộp đội hình vòng ${vong}`}
      </button>

      <div className="text-[11px] text-slate-400 text-center leading-relaxed">
        Máy chủ chỉ giữ hộ đội hình. Trận đánh do máy em tính và nó tất định:
        cùng mã phòng thì máy em với máy bạn ra cùng một kết quả.
      </div>
    </div>
  )
}
