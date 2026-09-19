import type { CauChua, EmGoi, KetQuaPhanCong } from './phan-cong'
import { tiLeSaiChuyenDe } from './phan-cong'
import { hashSeed, mulberry32 } from './exam-shuffle'

/**
 * THUẬT TOÁN GỌI LÊN BẢNG DẠY HỌC — BẬC THANG SƯ PHẠM 3 NẤC (SCAFFOLDING LADDER)
 *
 * Thay thế hoàn toàn cơ chế bốc thăm ngẫu nhiên. Khi dạy học bài mới theo đề:
 *   · Nấc 1 (Khởi động & Nền tảng - 0 sao / Nhận biết): Ưu tiên học sinh có tỷ lệ sai
 *     cao ở chuyên đề này hoặc học lực trung bình/yếu. Giúp em làm được câu vừa sức,
 *     tự tin vào bài mới, củng cố gốc vững chắc.
 *   · Nấc 2 (Kỹ năng chuẩn mực - 1 sao / Thông hiểu): Ưu tiên học sinh khá làm mẫu
 *     các bước giải, công thức mới cho cả lớp quan sát.
 *   · Nấc 3 (Mở rộng bứt phá - 2 sao / Vận dụng): Ưu tiên học sinh giỏi/xuất sắc để
 *     đào sâu bản chất, biện luận phương pháp tối ưu, tạo không khí tranh luận cho lớp.
 *
 * Đồng thời bảo đảm 3 nguyên tắc bất biến:
 *   1. Không trùng học sinh trong cùng một cặp chiếu (2 em/đợt).
 *   2. Cân bằng số lượt lên bảng (ưu tiên em ít lên bảng trước).
 *   3. Loại bỏ học sinh vắng mặt.
 */

export function nacCuaCau(q: CauChua): 1 | 2 | 3 {
  if (q.sao === 2 || q.mucDo === 'van_dung') return 3
  if (q.sao === 1 || q.mucDo === 'hieu') return 2
  return 1
}

export function nacCuaEm(em: EmGoi, chuyenDe?: string): 1 | 2 | 3 {
  if (!em.chuyenDe || !em.chuyenDe.length || !chuyenDe) return 2
  const tiLe = tiLeSaiChuyenDe(em, chuyenDe)
  if (tiLe >= 0.45) return 1
  if (tiLe >= 0.2) return 2
  return 3
}

const TEN_NAC: Record<1 | 2 | 3, string> = {
  1: 'Nấc 1: Khởi động & Nền tảng · Củng cố gốc vững vàng',
  2: 'Nấc 2: Kỹ năng chuẩn mực · Rèn luyện phương pháp mới',
  3: 'Nấc 3: Mở rộng bứt phá · Đào sâu bản chất & biện luận',
}

/** Nguồn số ngẫu nhiên của bước "bốc thăm giữa các em ngang nhau": một HÀM (test truyền tay), hoặc một
 * SEED — số, hoặc chuỗi (qua `hashSeed`, ví dụ mã ca) — để bảng dựng lại được y hệt. */
export type NguonBocTham = (() => number) | number | string

/** Không truyền gì thì vẫn TẤT ĐỊNH: hai lần bấm cùng đầu vào ra cùng bảng. Trước 19/09 mặc định là
 * `Math.random` nên bấm lại là ra bảng khác, và không dựng lại được bảng thầy đã cầm hôm qua. */
const SEED_MAC_DINH = 'phan-cong-day-hoc'

function taoBocTham(nguon: NguonBocTham): () => number {
  if (typeof nguon === 'function') return nguon
  return mulberry32(typeof nguon === 'number' ? nguon : hashSeed(nguon))
}

export function phanCongDayHoc(cau: CauChua[], em: EmGoi[], nguon: NguonBocTham = SEED_MAC_DINH): KetQuaPhanCong {
  const random = taoBocTham(nguon)
  const ds = em.filter((e) => e.coMat)
  if (ds.length < 2) throw new Error('Cần ít nhất 2 học sinh có mặt để phân công dạy học.')
  if (!cau.length) throw new Error('Thầy chọn đề để phân công dạy học.')

  const counts = new Map(ds.map((e) => [e.sbd, e.soLanLenBang]))
  const assigned: KetQuaPhanCong['phanCong'] = []

  for (const [i, q] of cau.entries()) {
    const previous = i % 2 ? assigned[i - 1].sbd : null
    const eligible = ds.filter((e) => e.sbd !== previous)
    const minCount = Math.min(...eligible.map((e) => counts.get(e.sbd)!))
    const minPool = eligible.filter((e) => counts.get(e.sbd) === minCount)

    const nacCau = nacCuaCau(q)

    // Sắp xếp các em trong minPool theo độ tương thích sư phạm với nấc câu hỏi
    const xep = minPool.map((e) => {
      const nacEm = nacCuaEm(e, q.chuyenDe)
      const doLech = Math.abs(nacCau - nacEm)
      return { e, nacEm, doLech }
    })

    const doLechNhoNhat = Math.min(...xep.map((x) => x.doLech))
    const hopNhat = xep.filter((x) => x.doLech === doLechNhoNhat).map((x) => x.e)

    // Giữa các em cùng độ lệch và cùng số lượt: bốc đều theo random
    const pick = hopNhat[Math.min(hopNhat.length - 1, Math.floor(random() * hopNhat.length))]

    counts.set(pick.sbd, minCount + 1)
    const viSao = `${TEN_NAC[nacCau]} (Lượt lên bảng: ${minCount})`

    assigned.push({
      luot: Math.floor(i / 2) + 1,
      sbd: pick.sbd,
      hoTen: pick.hoTen,
      cau: q,
      muc: (nacCau === 1 ? 1 : nacCau === 2 ? 2 : 3) as 1 | 2 | 3,
      mucDoNham: q.mucDo || (nacCau === 3 ? 'van_dung' : nacCau === 2 ? 'hieu' : 'biet'),
      viSao,
    })
  }

  return {
    thongKe: cau.map((q) => ({
      cau: q,
      soEmLam: 0,
      soSai: 0,
      tiLeDung: 0,
      doChum: 0,
      doTinCay: 0,
      diem: 0,
      nhom: 'dang_chua',
    })),
    giangCaLop: [],
    chiDocDapAn: [],
    phanCong: assigned,
    chuaPhan: [],
    emChuaGoi: ds.filter((e) => !assigned.some((p) => p.sbd === e.sbd)).map((e) => e.hoTen),
    canhBao: cau.length % 2 ? ['Số câu lẻ: đợt cuối có 1 học sinh.'] : [],
  }
}

