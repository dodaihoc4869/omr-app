// Bù tăng dần các câu sai mới đã công bố và mở các vòng đã đủ học liệu.
// Không bật lại cờ, không sửa điểm/EXP, không chạy khi còn ca thi mở.
import '../server/src/index'
import { execFileSync } from 'node:child_process'
import { taoDbVanHanh } from './chua-d1-van-hanh'
import { chuanCauHinh } from '../server/src/chua-cau-sai-cau-hinh'
import { qidChuan } from '../server/src/chua-cau-sai-adapter'
import type { Env } from '../server/src/kieu'
import { taoGiaoGanD1 } from './chua-giao-gan-d1'
import { raDanhSach } from './chua-giao-cua-so'
import { docCacCapGiao, type CapGiao } from './chua-giao-danh-sach'

const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`
const db = taoDbVanHanh(async (sql) => {
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ sql }),
    signal: AbortSignal.timeout(60000),
  })
  const j = (await r.json()) as {
    success?: boolean
    result?: {
      success: boolean
      results: Record<string, unknown>[]
      meta: Record<string, number>
    }[]
  }
  if (!r.ok || !j.success || !Array.isArray(j.result))
    throw new Error(`D1 không hoàn tất (${r.status}).`)
  return j.result
})

// giaoDotCuaEm chỉ đọc R2 để lấy câu gốc. Công cụ không được ghi/xoá kho đề.
const env = {
  DB: db,
  DE: {
    async get(key: string) {
      const body = execFileSync(
        'npx',
        [
          'wrangler',
          'r2',
          'object',
          'get',
          `omr-de/${key}`,
          '--remote',
          '--pipe',
          '--config',
          'server/wrangler.toml',
        ],
        {
          maxBuffer: 32 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )
      return {
        body: new Uint8Array(body),
        async json() {
          return JSON.parse(body.toString())
        },
      }
    },
    async put() {
      throw new Error('Công cụ cập nhật không được ghi R2.')
    },
    async delete() {
      throw new Error('Công cụ cập nhật không được xoá R2.')
    },
  },
  MA_BI_MAT: 'khong-dung',
} as unknown as Env

const khoa = (x: CapGiao) => `${x.sbd}\0${qidChuan(x.qid)}`

async function main() {
  const ca = await db
    .prepare("SELECT COUNT(*) AS n FROM ca WHERE trang_thai='mo'")
    .first<{ n: number }>()
  if (!ca || Number(ca.n) !== 0) {
    console.log(
      JSON.stringify({
        ok: true,
        hoan: 'co_ca_thi_mo',
        thongDiep: 'Giữ nguyên dữ liệu; lượt cập nhật sau sẽ tự chạy lại.',
      }),
    )
    return
  }

  const row = await db
    .prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='chua_cau_sai_v1'")
    .first<{ gia_tri: string }>()
  const config = chuanCauHinh(JSON.parse(row?.gia_tri ?? '{}'))
  if (!config.bat || config.phamVi !== 'tat_ca') {
    console.log(
      JSON.stringify({
        ok: true,
        hoan: 'co_dang_tat_hoac_gioi_han',
        thongDiep: 'Không tự ý đổi phạm vi thầy đã chọn.',
      }),
    )
    return
  }

  // Bù cho các bộ học liệu đã có từ trước bản mở khóa tức thời. Chỉ vòng chưa
  // có phiên mới được đổi trạng thái, nên không thay nội dung giữa một lượt học.
  const mo = await db
    .prepare(
      `UPDATE chua_loi_dot SET trang_thai_day='can_chan_doan',ly_do_thieu='',revision=revision+1,cap_nhat_luc=?
       WHERE dong_luc IS NULL
         AND trang_thai_day IN ('thieu_hoc_lieu','tam_khoa','cau_thay_doi')
         AND NOT EXISTS(SELECT 1 FROM chua_loi_phien p WHERE p.dot_id=chua_loi_dot.id)
         AND EXISTS(
           SELECT 1 FROM chua_loi_hoc_lieu h
           WHERE h.qid_chuan=chua_loi_dot.qid_chuan
             AND h.content_version=chua_loi_dot.phien_ban_cau
             AND h.trang_thai='du_dung'
         )`,
    )
    .bind(Date.now())
    .run()

  const [cap, dangMo] = await Promise.all([
    docCacCapGiao(env),
    db
      .prepare(
        'SELECT sbd,qid_chuan AS qid FROM chua_loi_dot WHERE dong_luc IS NULL',
      )
      .all<CapGiao>(),
  ])
  const daCo = new Set((dangMo.results ?? []).map(khoa))
  const canGiao = cap.filter((x) => !daCo.has(khoa(x)))

  let daGiao = 0
  if (canGiao.length > 0) {
    const gan = await taoGiaoGanD1()
    try {
      for (let i = 0; i < canGiao.length; i += 48) {
        daGiao += await raDanhSach(canGiao.slice(i, i + 48), gan.goi)
        if (daGiao % 240 === 0 || daGiao === canGiao.length)
          console.log(
            JSON.stringify({
              dangCapNhat: true,
              daGiao,
              tongCanGiao: canGiao.length,
            }),
          )
      }
    } finally {
      await gan.close()
    }
  }

  const [trangThai, hocLieu] = await Promise.all([
    db
      .prepare(
        `SELECT trang_thai_day AS trangThai,COUNT(*) AS soDot,COUNT(DISTINCT sbd) AS soEm
         FROM chua_loi_dot WHERE dong_luc IS NULL GROUP BY trang_thai_day ORDER BY trang_thai_day`,
      )
      .all(),
    db
      .prepare(
        "SELECT COUNT(*) AS soBo FROM chua_loi_hoc_lieu WHERE trang_thai='du_dung'",
      )
      .first(),
  ])
  console.log(
    JSON.stringify({
      ok: true,
      soDotDaMo: Number(mo.meta?.changes ?? 0),
      soCapDuDieuKien: cap.length,
      soCapMoiDaGiao: daGiao,
      trangThai: trangThai.results,
      hocLieu,
    }),
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      loi: error instanceof Error ? error.message : 'Lượt cập nhật chưa hoàn tất.',
    }),
  )
  process.exitCode = 1
})
