// NẠP DỮ LIỆU cho BÁO CÁO CHI TIẾT CỦA EM (thầy 28/09: "thay thế hết bằng bản mới"). KHÔNG phải một báo cáo thứ ba: chỉ lấy số của
// CHÍNH EM rồi vẽ bằng `BaoCaoChiTiet` chế độ `hs` (bản vẽ ca thi 28/09). Nguồn: `/hs/lich-su` (ca ĐÃ công bố + `chuaCongBo`) và
// `/hs/cau-da-thi` (mọi câu của ca — máy chủ không trả câu/đáp án/lời giải của ca chưa công bố). Ca chưa công bố ⇒ không điểm, không câu.
import { useEffect, useMemo, useRef, useState } from 'react'
import BaoCaoChiTiet from './BaoCaoChiTiet'
import { hsCauDaThiApi, hsLichSuCaApi } from '../../lib/exam-api'
import { baoCaoCuaEm, type DongCaCuaEm } from '../../lib/bao-cao-cua-em'
import { demMucDoNhanThuc } from '../../lib/muc-do-nhan-thuc'
import { dungLichSuCa, type CaChuaCongBoHs } from '../../lib/lich-su-ca-hs'
import { gioDayDu, ngayDayDu } from '../../lib/ngay-gio-24'

export interface LichSuCuaEm {
  items: DongCaCuaEm[]
  chuaCongBo: CaChuaCongBoHs[]
}

export interface BaoCaoCaCuaEmProps {
  maCa: string
  /** Tên ca đã biết sẵn (hiện ngay khi còn tải). */
  tenCa?: string
  sbd: string
  scriptUrl?: string
  /** Lịch sử đã nạp sẵn (màn Lịch sử ca) — có thì không hỏi lại máy chủ. */
  lichSu?: LichSuCuaEm | null
  onDong: () => void
  /** Làm lại các câu cần chữa của ca (cổng học sinh mở phiếu Khắc phục). */
  onKhacPhuc?: (maCa: string) => void
  /** Mở tờ "Đề và lời giải kèm lỗi sai" của cả ca. */
  onMoLaiBaiThi?: (maCa: string) => void
}

/** Lý do máy chủ trả (`{ ok: false, error }`) — bọc riêng để phân biệt với lỗi mạng của trình duyệt (chữ tiếng Anh, không hiện). */
class LoiMayChu {
  chu: string
  constructor(chu: string) {
    this.chu = chu
  }
}
/** Lý do đọc được cho em — mã nội bộ của máy chủ (VD `MAY_CHU_CHUA_CO_LENH`) KHÔNG hiện lên màn học sinh. */
function chuLoi(x: unknown, macDinh: string): string {
  const t = x instanceof LoiMayChu ? x.chu.trim() : ''
  return t && !/^[A-Z0-9_]+$/.test(t) ? `${macDinh} ${t}` : `${macDinh} Em kiểm tra mạng rồi mở lại báo cáo.`
}

export default function BaoCaoCaCuaEm({ maCa, tenCa, sbd, scriptUrl = '', lichSu: lsSan = null, onDong, onKhacPhuc, onMoLaiBaiThi }: BaoCaoCaCuaEmProps) {
  const [ls, setLs] = useState<LichSuCuaEm | null>(lsSan)
  const [cau, setCau] = useState<unknown[] | null>(null)
  const [dangTai, setDangTai] = useState(true)
  // CẤM NUỐT LỖI IM LẶNG (luật 15/09, chuyển từ báo cáo cũ): gọi hỏng thì giữ lý do và HIỆN RA — không được rơi thành
  // "Ca này chưa có điểm đã công bố" hay "Em đúng trọn mọi câu" (sai sự thật).
  const [loiLs, setLoiLs] = useState<string | null>(null)
  const [loiCau, setLoiCau] = useState<string | null>(null)
  // Bấm "Thử lại" ⇒ tăng số lượt để hỏi lại máy chủ.
  const [luot, setLuot] = useState(0)
  // Lịch sử có sẵn chỉ đọc LÚC MỞ (màn cha dựng object mới mỗi lần vẽ — đưa vào phụ thuộc là hỏi máy chủ liên tục).
  const lsSanRef = useRef(lsSan)

  useEffect(() => {
    let huy = false
    setDangTai(true)
    const san = lsSanRef.current
    const hoiLs: Promise<LichSuCuaEm> = san
      ? Promise.resolve(san)
      : hsLichSuCaApi(scriptUrl, sbd).then((r) => {
          if (!r.ok) throw new LoiMayChu(String((r as { error?: unknown }).error ?? ''))
          return { items: (r.items ?? []) as DongCaCuaEm[], chuaCongBo: r.chuaCongBo ?? [] }
        })
    const hoiCau = hsCauDaThiApi(scriptUrl, sbd, [maCa]).then((r) => {
      if (!r.ok || !Array.isArray(r.items)) throw new LoiMayChu(r.error ?? '')
      return r.items
    })
    void Promise.allSettled([hoiLs, hoiCau]).then(([a, b]) => {
      if (huy) return
      setLs(a.status === 'fulfilled' ? a.value : null)
      setLoiLs(a.status === 'fulfilled' ? null : chuLoi(a.reason, 'Chưa tải được kết quả của em.'))
      setCau(b.status === 'fulfilled' ? b.value : null)
      setLoiCau(b.status === 'fulfilled' ? null : chuLoi(b.reason, 'Chưa tải được từng câu của ca này.'))
      setDangTai(false)
    })
    return () => {
      huy = true
    }
  }, [maCa, sbd, scriptUrl, luot])

  // Chỉ dòng ĐÃ CÔNG BỐ của đúng ca này; lượt nộp muộn nhất.
  const dong = useMemo(() => dungLichSuCa(ls?.items, ls?.chuaCongBo).find((d) => d.maCa === maCa) ?? null, [ls, maCa])
  const daCongBo = dong?.kieu === 'da_cong_bo' ? dong : null
  const cauCa = useMemo(() => (daCongBo && cau ? cau.filter((x) => (x as { maCa?: unknown })?.maCa === maCa) : null), [cau, daCongBo, maCa])
  const bc = useMemo(() => (daCongBo ? baoCaoCuaEm(daCongBo.goc, cauCa) : null), [daCongBo, cauCa])
  const mucDo = useMemo(() => demMucDoNhanThuc(cauCa), [cauCa])

  return (
    <BaoCaoChiTiet
      cheDo="hs"
      maCa={maCa}
      tenCa={dong?.ten || tenCa || 'Ca kiểm tra'}
      lopCa=""
      ngay={dong ? ngayDayDu(dong.nopLuc, '') : ''}
      gioNop={dong ? gioDayDu(dong.nopLuc, '') : ''}
      thoiGianPhut={null}
      siSo={0}
      lop={null}
      them={null}
      dangTai={dangTai}
      dsEm={[]}
      tab="em"
      onTab={() => {}}
      sbdEm={sbd}
      onChonEm={() => {}}
      emBc={bc}
      xuHuongEm={daCongBo && daCongBo.xuHuong !== null ? { doi: daCongBo.xuHuong, diemTruoc: Math.round((daCongBo.diem - daCongBo.xuHuong) * 100) / 100 } : null}
      mucDo={mucDo}
      loiEm={loiLs}
      loiCauEm={loiCau}
      onThuLaiEm={() => setLuot((x) => x + 1)}
      onDong={onDong}
      onKhacPhuc={onKhacPhuc ? () => onKhacPhuc(maCa) : undefined}
      // Tờ đề mở ở lớp phủ của màn cha ⇒ đóng báo cáo trước để tờ đề không nằm dưới.
      onXemDe={
        onMoLaiBaiThi
          ? () => {
              onDong()
              onMoLaiBaiThi(maCa)
            }
          : undefined
      }
    />
  )
}
