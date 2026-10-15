// @vitest-environment node
// B2 (thầy 15/10 "làm cả đợt 1 và 2"): bảng siêu dữ liệu câu TÍNH SẴN `cau_meta` (server/src/cau-meta.ts). Khoá:
//   · ba câu đọc (srs2 docMetaCau · omni docCauKho · danh mục Hành trình) cho KẾT QUẢ Y HỆT trước và sau khi dựng bảng — kể cả câu nằm ở hai tờ (thứ tự
//     dòng theo rowid), dòng JSON hỏng (bỏ), câu chưa duyệt (danh mục bỏ);
//   · khớp mốc ⇒ đọc bảng (sửa JSON câu mà không lập lại chỉ mục thì số không đổi — chứng minh đọc bảng); lập lại chỉ mục (mốc đổi) ⇒ ngay lập tức đọc
//     đường cũ (số MỚI), cron dựng lại ⇒ đọc bảng với số mới;
//   · tờ mồ côi (có câu, không mốc) ⇒ không có dấu ⇒ luôn đường cũ; D1 test cũ (câu không kèm mốc) không đổi gì;
//   · mỗi câu đọc vẫn đúng MỘT lệnh D1.
import { describe, expect, it } from 'vitest'
import { taoKhoOmni, cauJson, type KhoOmni } from './omni-3-ke-hoach-chung'
import { dongBoCauMeta } from '../server/src/cau-meta'
import { docMetaCau } from '../server/src/srs2-d1'
import { docCauKho, xoaDemOmni } from '../server/src/omni-d1'
import { danhMuc } from '../server/src/hanh-trinh-v5-d1'
import type { Env } from '../server/src/kieu'

const MOC = '2026-10-01T00:00:00.000Z'
function dungKho(): KhoOmni & { ds: string[] } {
  const k = taoKhoOmni()
  // một câu nằm ở HAI tờ (tờ thứ hai tên dạng khác) + một dòng JSON hỏng
  k.d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    .run('DH-B2', 'DH-B1-3', 'v1', 'g-DH-B1-3', 'DH-B2.D0', cauJson('DH-B1-3', 'DH-B2', 3, { tenDang: 'Dạng ở tờ B2' }))
  k.d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DH-B3','DH-B3-HONG','v1','g','DH-B3.D0','{hong')").run()
  k.d.sql.exec(`INSERT INTO game_v2_index(ma_de,source_version,indexed_at) SELECT DISTINCT ma_de,'v','${MOC}' FROM game_v2_question`)
  const ds = [...k.qids('DH-B0'), ...k.qids('DH-B1'), ...k.qids('DH-B2'), 'DH-B1-TL', 'DH-B3-HONG', 'KHONG-CO']
  return { ...k, ds }
}
async function doc(env: Env, ds: string[]) {
  xoaDemOmni()
  const meta = await docMetaCau(env, ds, ['DH-B2'])
  const kho = await docCauKho(env, ds)
  const dm = await danhMuc(env, { chienDich: null, phamVi: { maDe: new Set(['DH-B0', 'DH-B1', 'DH-B2']) } as never, cau: ds.map((qid) => ({ qid })) as never }, Date.parse(MOC))
  return JSON.stringify({ meta: [...meta], kho: [...kho], dm: dm.map((x) => [x.qid, x.tang, x.q, x.nhan]) })
}
const demLenh = (env: Env) => {
  let n = 0
  const db = env.DB as unknown as { prepare: (s: string) => unknown }
  const goc = db.prepare.bind(db)
  db.prepare = (s: string) => { n++; return goc(s) }
  return () => n
}

describe('cau_meta — bảng siêu dữ liệu câu tính sẵn', () => {
  it('kết quả y hệt trước/sau khi dựng; khớp mốc thì đọc bảng; lập lại chỉ mục thì đọc đường cũ ngay, cron dựng lại', async () => {
    const a = dungKho(), b = dungKho()
    const truoc = await doc(a.env, a.ds)
    expect(truoc).toContain('Dạng ở tờ B2')
    const t = JSON.parse(truoc) as { meta: unknown[]; kho: unknown[]; dm: unknown[] }
    expect([t.meta.length, t.kho.length, t.dm.length].every((n) => n > 20)).toBe(true) // ba câu đọc đều có dữ liệu thật để so
    // dựng bảng ở kho b (40 tờ/lượt ⇒ một lượt xong, có dấu)
    expect(await dongBoCauMeta(b.env, 40)).toMatchObject({ dung: 5, conNua: false, khop: true })
    expect(b.d.sql.prepare("SELECT COUNT(*) n FROM cau_meta WHERE qid='DH-B3-HONG'").get()).toEqual({ n: 0 })
    expect(await doc(b.env, b.ds)).toBe(truoc)
    // sửa JSON câu KHÔNG lập lại chỉ mục ⇒ vẫn đọc bảng (số cũ) — chứng minh nhánh bảng đang chạy
    b.d.sql.exec("UPDATE game_v2_question SET json=json_set(json,'$.tenDang','Tên mới') WHERE qid='DH-B1-0'")
    expect(await doc(b.env, b.ds)).toBe(truoc)
    // lập lại chỉ mục tờ ấy (mốc đổi) ⇒ đường cũ ngay, số mới
    b.d.sql.exec("UPDATE game_v2_index SET indexed_at='2026-10-02T00:00:00.000Z' WHERE ma_de='DH-B1'")
    const moi = await doc(b.env, b.ds)
    expect(moi).toContain('Tên mới')
    // cron dựng lại đúng một tờ ⇒ đọc bảng, cùng số mới
    expect(await dongBoCauMeta(b.env, 40)).toMatchObject({ dung: 1, khop: true })
    expect(b.d.sql.prepare("SELECT ten_dang FROM cau_meta WHERE qid='DH-B1-0'").get()).toEqual({ ten_dang: 'Tên mới' })
    expect(await doc(b.env, b.ds)).toBe(moi)
    // trạng thái thường ngày: không tờ lệch ⇒ không dựng gì
    expect(await dongBoCauMeta(b.env, 40)).toMatchObject({ dung: 0, conNua: false, khop: true })
    a.d.sql.close(); b.d.sql.close()
  })

  it('dựng dần theo trần mỗi lượt; chưa xong thì chưa có dấu (đọc đường cũ)', async () => {
    const k = dungKho()
    expect(await dongBoCauMeta(k.env, 4)).toMatchObject({ dung: 4, conNua: true, khop: false })
    expect(k.d.sql.prepare("SELECT COUNT(*) n FROM cau_meta_to WHERE ma_de='*'").get()).toEqual({ n: 0 })
    expect(await dongBoCauMeta(k.env, 4)).toMatchObject({ dung: 1, conNua: false, khop: true })
    k.d.sql.close()
  })

  it('tờ mồ côi (có câu, không mốc) ⇒ không dấu ⇒ đường cũ, đủ câu của tờ ấy; D1 test không mốc không đổi gì', async () => {
    const a = dungKho(), b = dungKho()
    for (const k of [a, b]) k.d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('MO-COI', 'MO-COI-1', 'v1', 'g-MO-COI-1', 'MO-COI.D0', cauJson('MO-COI-1', 'MO-COI', 1))
    const ds = [...a.ds, 'MO-COI-1']
    const truoc = await doc(a.env, ds)
    expect(await dongBoCauMeta(b.env, 40)).toMatchObject({ khop: false })
    expect(b.d.sql.prepare("SELECT ma_de FROM cau_meta_to WHERE ma_de IN ('*','!')").all()).toEqual([{ ma_de: '!' }])
    expect(await doc(b.env, ds)).toBe(truoc)
    expect(truoc).toContain('MO-COI-1')
    // kiểm lại trong 1 giờ: không dò lại
    expect(await dongBoCauMeta(b.env, 40)).toMatchObject({ dung: 0, khop: false })
    a.d.sql.close(); b.d.sql.close()
  })

  it('mỗi câu đọc vẫn đúng MỘT lệnh D1 (cả khi khớp lẫn khi lệch)', async () => {
    const k = dungKho()
    for (const lan of [0, 1]) {
      if (lan) await dongBoCauMeta(k.env, 40)
      const n = demLenh(k.env)
      await docMetaCau(k.env, k.ds)
      expect(n()).toBe(1)
    }
    k.d.sql.close()
  })
})
