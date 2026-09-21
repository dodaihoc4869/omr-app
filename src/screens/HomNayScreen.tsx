// MÀN HÔM NAY của thầy — BẢN 3 = BẢNG TIN (thầy chốt bản vẽ 21/09; đề bài prompt-bang-tin-thay-v3.md; bản vẽ docs/ban-ve-bang-tin-v3-2109/).
// Thầy chỉ ĐỌC: một lệnh chỉ-đọc `/gv/bang-tin` (hợp đồng docs/hop-dong-bang-tin-v3-2109.md) trả đủ cho cả màn; tự làm mới mỗi 60 giây (dừng khi tab ẩn).
// Máy chủ CHƯA có lệnh (404) hoặc chưa từng đọc được ⇒ rơi về bản 2 (HomNayCu) qua các lệnh cũ — không báo lỗi đỏ. Đang chờ lần đầu ⇒ khung xương (không màn trắng).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { layBangTin, type BangTin, type EmCanDeY } from '../lib/bang-tin-thay'
import { layCanGiup, lyDoCanGiup } from '../lib/hom-nay-v2'
import BangTinV3, { BangTinXuong } from '../components/bang-tin/BangTin'
import type { DungNhip } from '../components/bang-tin/cac-khoi'
import { useTuLamMoi } from '../components/bang-tin/hooks'
import { BANG_NHIP_THAY, TUY_CHON_NHIP_THAY } from '../lib/nhip-may-thay'
import BangTinSan from '../components/bang-tin-san/BangTinSan'
import { useSanSong } from '../components/bang-tin-san/use-san-song'
import { useSucKhoeMay } from '../components/bang-tin-san/use-suc-khoe'
import type { DuLieuSan } from '../lib/bang-tin-san/kieu'
import HomNayCu from './HomNayCu'

/**
 * MÀN HÔM NAY = BẢNG TIN KIỂU SÀN GIAO DỊCH (thầy chốt mẫu 21/09; hợp đồng docs/hop-dong-bang-tin-song-2109.md): hỏi `/gv/bang-tin-song` mỗi 10 giây. Máy chủ chưa có lệnh / cờ `cau_hinh.bang_tin_san = tat` /
 * lỗi / thân sai dạng ⇒ rơi về Bảng tin bản 3 (`HomNayBan3`, `/gv/bang-tin`) rồi bản 2 — không màn trắng. Đang dùng sàn thì KHÔNG gọi lệnh của bản 3 (lệnh sống đã mang đủ khoá, khỏi tính hai lần).
 */
export default function HomNayScreen() {
  const san = useSanSong()
  const moToanCanh = useAppStore((s) => s.moToanCanh)
  if (san.kieu === 'cho') return <BangTinXuong />
  if (san.kieu === 'san') return <BangTinSanCoChip du={san.du} onMoEm={moToanCanh} matKetNoi={san.matKetNoi} />
  return <HomNayBan3 />
}

/** Bảng tin sàn + chip "Máy chủ: tốt / đang bận / nghẽn": chip chỉ hỏi máy chủ KHI SÀN ĐANG HIỆN (rơi về bản 3 thì không gọi lệnh sức khoẻ). */
function BangTinSanCoChip({ du, onMoEm, matKetNoi }: { du: DuLieuSan; onMoEm: (sbd: string) => void; matKetNoi: boolean }) {
  const sucKhoe = useSucKhoeMay(true)
  return <BangTinSan du={du} onMoEm={onMoEm} matKetNoi={matKetNoi} sucKhoe={sucKhoe} />
}

function HomNayBan3() {
  const classList = useAppStore((s) => s.classList)
  const moToanCanh = useAppStore((s) => s.moToanCanh)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  /** `bt` = bản đọc thành công GẦN NHẤT (lần sau lỗi thì giữ bản cũ, không nhảy về bản dự phòng); `xong` = đã có câu trả lời đầu tiên. */
  const [tt, setTt] = useState<{ bt: BangTin | null; xong: boolean }>({ bt: null, xong: false })
  const [nayMs, setNayMs] = useState(() => Date.now())

  /** Trả `true` khi đọc được (`false` ⇒ vòng tự làm mới LÙI DẦN 30 → 60 → 120 s; không gọi chồng — xem src/lib/nhip-may-thay.ts). */
  const lam = useCallback(
    () =>
      layBangTin().then((r) => {
        setNayMs(Date.now())
        setTt((t) => ({ bt: r.ok ? r.du : t.bt, xong: true }))
        return r.ok
      }),
    [],
  )
  useEffect(() => {
    void lam()
  }, [lam])
  useTuLamMoi(lam, BANG_NHIP_THAY.bangTinV3, TUY_CHON_NHIP_THAY.bangTinV3)

  /** Danh sách ĐỦ em cần để ý cho tấm bên: lệnh chi tiết cũ `/gv/can-giup`; lỗi ⇒ null ⇒ tấm bên nói thật. */
  const taiTatCaCanDeY = useCallback(async (): Promise<EmCanDeY[] | null> => {
    const r = await layCanGiup()
    if (!r.ok) return null
    return r.du.ds.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: e.lop, lyDo: [{ loai: e.lyDo, chu: lyDoCanGiup(e), so: null, tong: null }] }))
  }, [])

  /** Ô "Bài tập về nhà đúng nhịp": nay có ngay trong `/gv/bang-tin` (`nhip.btvnDungNhip`) — không gọi lệnh cũ `/ke-hoach/hom-nay-thay`; vắng ⇒ ô nói thật "chưa có số liệu". */
  const dungNhip = useMemo<DungNhip | null>(() => (tt.bt?.nhip.btvnDungNhip ? { soEm: tt.bt.nhip.btvnDungNhip.dungNhip, soCoLo: tt.bt.nhip.btvnDungNhip.tongEm } : null), [tt.bt])

  const dsTraCuu = useMemo(() => classList.map((h) => ({ sbd: h.sbd, hoTen: h.hoTen, lop: h.lop })), [classList])

  if (!tt.xong) return <BangTinXuong />
  if (!tt.bt) return <HomNayCu />
  return <BangTinV3 du={tt.bt} nayMs={nayMs} dsTraCuu={dsTraCuu} onMoEm={moToanCanh} onMoCa={moChiTietCa} dungNhip={dungNhip} taiTatCaCanDeY={taiTatCaCanDeY} />
}
