// Runtime workerd/D1 cục bộ, dữ liệu tổng hợp; không kết nối production.
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { Env } from '../server/src/kieu'
import { seedChua, Q, hocLieuMau } from './_chua-cau-sai-fixture'
import {hocLieuThay} from '../server/src/chua-cau-sai-thay'
import {bamDeMu,probeDuyNhat} from '../server/src/chua-hoc-lieu-kiem-may'
import { moDot, phatItem, nopItem } from '../server/src/chua-cau-sai'
import { hangChieu, daChuaTrenLop } from '../server/src/chua-cau-sai-chieu'
import { dongBoTuLuyen } from '../server/src/chua-cau-sai-tu-luyen'
import { damBaoBangTuLuyen } from '../server/src/tu-luyen'
const E = { ...(env as unknown as Env), MA_BI_MAT: 'bi-mat-test-cuc-bo' } as Env
let token = '',
  dotId = '',
  itemId = ''
beforeAll(async () => {
  for (const sql of (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL) {
    const ds = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !/^\s*--/.test(l))
      .map((l) => l.replace(/\s--.*$/, ''))
      .join('\n')
      .split(/;\s*(?:\n|$)/)
      .map((x) => x.trim())
      .filter(Boolean)
    for (let i = 0; i < ds.length; i += 50)
      await E.DB.batch(ds.slice(i, i + 50).map((x) => E.DB.prepare(x)))
  }
  const cot = new Set(
    (
      await E.DB.prepare("SELECT name FROM pragma_table_info('ca')").all<{
        name: string
      }>()
    ).results.map((x) => x.name),
  )
  for (const c of [
    'pham_vi',
    'danh_sach_chon_json',
    'mat_khau',
    'de_rieng',
    'pham_vi_hoi_lai',
  ])
    if (!cot.has(c))
      await E.DB.prepare(`ALTER TABLE ca ADD COLUMN ${c} TEXT`).run()
  token = await seedChua(E)
  const r = await moDot(E, { token, qid: Q })
  expect(r.status).toBe(200)
  dotId = ((await r.json()) as any).dotId
})
describe('Vòng chữa trên workerd/D1', () => {
  it('8 lần phát đồng thời giữ một phiên và một item', async () => {
    const rs = await Promise.all(
      Array.from({ length: 8 }, () => phatItem(E, { token, dotId })),
    )
    const ds = await Promise.all(rs.map((r) => r.json() as Promise<any>))
    expect(ds.every((r) => r.ok)).toBe(true)
    expect(new Set(ds.map((r) => r.item.id)).size).toBe(1)
    itemId = ds[0].item.id
    expect(
      (
        await E.DB.prepare(
          'SELECT COUNT(*) AS n FROM chua_loi_item',
        ).first<any>()
      ).n,
    ).toBe(1)
  })
  it('8 lần nộp đồng thời khoá đúng một receipt và một sự kiện', async () => {
    const rs = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        nopItem(E, {
          token,
          dotId,
          itemId,
          attemptId: `D1-${i}`,
          traLoi: i === 0 ? '40' : '23',
        }),
      ),
    )
    expect(rs.filter((r) => r.status === 200).length).toBe(1)
    expect(
      (
        await E.DB.prepare(
          'SELECT COUNT(*) AS n FROM chua_loi_nop',
        ).first<any>()
      ).n,
    ).toBe(1)
    expect(
      (
        await E.DB.prepare(
          "SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon='chua_loi'",
        ).first<any>()
      ).n,
    ).toBe(1)
  })
  it('receipt đã lưu phát lại đúng, không sửa câu trả lời đầu', async () => {
    const n = await E.DB.prepare(
      'SELECT attempt_id,tra_loi,response_json FROM chua_loi_nop',
    ).first<any>()
    const r = await nopItem(E, {
      token,
      dotId,
      itemId,
      attemptId: n.attempt_id,
      traLoi: n.tra_loi,
    })
    const j = (await r.json()) as any
    expect(j.receiptId).toBe(JSON.parse(n.response_json).receiptId)
    expect(j.idempotent).toBe(true)
  })
  it('8 xác nhận Thầy chữa cùng lúc chỉ mở bước một lần và giữ một receipt lớp', async () => {
    for (let i = 0; i < 15; i++) {
      const p = (await (
        await phatItem(E, { token, dotId, tiep: true })
      ).json()) as any
      if (p.trangThai === 'can_thay') break
      expect(p.item).toBeTruthy()
      const row = await E.DB.prepare(
        'SELECT probe_ref FROM chua_loi_item WHERE id=?',
      )
        .bind(p.item.id)
        .first<any>()
      const probe = JSON.parse(row.probe_ref)
      const r = await nopItem(E, {
        token,
        dotId,
        itemId: p.item.id,
        attemptId: `runtime-class-${i}`,
        traLoi:
          p.item.loai === 'ghep_bai' ? '999' : probe.noiDungTrucTiep.dapAn,
      })
      expect(r.status).toBe(200)
    }
    const now = Date.now()
    await E.DB.batch([
      E.DB.prepare(
        "INSERT INTO buoi_hoc(id,ten,lop,bi_mat,mo_luc,het_han,cap_nhat_luc) VALUES('runtime-buoi','Chữa','12','x',?,?,?)",
      ).bind(
        new Date(now).toISOString(),
        new Date(now + 3600000).toISOString(),
        new Date(now).toISOString(),
      ),
      E.DB.prepare(
        "INSERT INTO buoi_hoc_diem_danh(buoi_id,sbd,luc,cach,trang_thai,cap_nhat_luc) VALUES('runtime-buoi','HS1','x','thay','co_mat','x')",
      ),
    ])
    const g = ((await (await hangChieu(E, { lop: '12' })).json()) as any).ds[0]
    expect(g).toBeTruthy()
    const b = {
      requestId: 'runtime-chua-lop-123456',
      buoiId: 'runtime-buoi',
      nhomId: g.id,
      buocId: 'm',
      dot: g.em.map((e: any) => ({ dotId: e.dotId, revision: e.revision })),
    }
    const rs = await Promise.all(
      Array.from({ length: 8 }, () => daChuaTrenLop(E, b)),
    )
    expect(rs.every((r) => r.status === 200)).toBe(true)
    const ds = await Promise.all(rs.map((r) => r.json()))
    expect(ds.every((r) => JSON.stringify(r) === JSON.stringify(ds[0]))).toBe(
      true,
    )
    expect(
      (
        await E.DB.prepare(
          'SELECT COUNT(*) AS n FROM chua_loi_chua_lop',
        ).first<any>()
      ).n,
    ).toBe(1)
    const dot = await E.DB.prepare(
      'SELECT revision,trang_thai_day FROM chua_loi_dot WHERE id=?',
    )
      .bind(dotId)
      .first<any>()
    expect(dot.revision).toBe(g.em[0].revision + 1)
    expect(dot.trang_thai_day).toBe('dang_chua_buoc')
  })
})

describe('Đồng bộ Tu luyện theo lô trên workerd/D1', () => {
  const luot = 'tl_runtime_batch'
  const T = Date.parse('2026-10-07T03:00:00Z')
  it('13 câu qua ba batch giữ giờ/đáp án đầu; retry và dữ liệu đã có không ghi đôi sổ', async () => {
    await damBaoBangTuLuyen(E)
    const ds = Array.from({ length: 13 }, (_, i) => ({ qid: `DH-12-C1-B1-III-${900+i}`, dangMa: 'M', phan: 'III' }))
    await E.DB.prepare('INSERT INTO tu_luyen_luot(id,sbd,che_do,de_rieng_json,tao_luc) VALUES(?,\'HS1\',3,?,?)').bind(luot,JSON.stringify(ds),T).run()
    // Một câu giữa lô đã được chấm riêng và đồng bộ trước khi nộp cả bài.
    await E.DB.prepare("INSERT INTO tu_luyen_cham_cau(luot_id,sbd,qid,tra_loi,dung,diem,luc) VALUES(?,'HS1',?,'dap-an-3',1,0,?)").bind(luot,ds[3].qid,T+3).run()
    expect(await dongBoTuLuyen(E,'HS1',luot)).toBe(true)
    await E.DB.batch(ds.map((q,i) => E.DB.prepare("INSERT OR IGNORE INTO tu_luyen_cham_cau(luot_id,sbd,qid,tra_loi,dung,diem,luc) VALUES(?,'HS1',?,?,?,0,?)").bind(luot,q.qid,`dap-an-${i}`,i%2,T+i)))
    const batchGoc = E.DB.batch.bind(E.DB)
    const kichThuoc: number[] = []
    const db = new Proxy(E.DB, { get(target,key) {
      if (key === 'batch') return async (statements: D1PreparedStatement[]) => { kichThuoc.push(statements.length); return batchGoc(statements) }
      const value = Reflect.get(target,key)
      return typeof value === 'function' ? value.bind(target) : value
    } })
    const e = {...E,DB:db}
    expect(await dongBoTuLuyen(e,'HS1',luot)).toBe(true)
    expect(kichThuoc).toEqual([12,12,2])
    const dem = async () => (await E.DB.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon='tu_luyen' AND ma_nguon=?").bind(luot).first<any>()).n
    expect(await dem()).toBe(13)
    expect((await E.DB.prepare('SELECT COUNT(*) AS n FROM chua_loi_tu_receipt WHERE luot_id=?').bind(luot).first<any>()).n).toBe(13)
    const truoc = await E.DB.prepare("SELECT qid,luc,raw_json FROM su_kien_hoc WHERE nguon='tu_luyen' AND ma_nguon=? ORDER BY qid").bind(luot).all()
    expect(await dongBoTuLuyen(e,'HS1',luot)).toBe(true)
    expect(await dem()).toBe(13)
    expect((await E.DB.prepare("SELECT qid,luc,raw_json FROM su_kien_hoc WHERE nguon='tu_luyen' AND ma_nguon=? ORDER BY qid").bind(luot).all()).results).toEqual(truoc.results)
    expect(truoc.results[0].luc).toBe(new Date(T).toISOString())
    expect(JSON.parse(String(truoc.results[0].raw_json)).traLoi).toBe('dap-an-0')
  })
  it('lỗi ghi sổ giữa một lô rollback cả receipt và các sự kiện trước nó', async () => {
    const id='tl_runtime_batch_fail'
    const ds=[{qid:'DH-12-C1-B1-III-980'},{qid:'DH-12-C1-B1-III-981'}]
    await E.DB.prepare("INSERT INTO tu_luyen_luot(id,sbd,che_do,de_rieng_json,tao_luc) VALUES(?,'HS1',3,?,?)").bind(id,JSON.stringify(ds),T).run()
    await E.DB.batch(ds.map(q=>E.DB.prepare("INSERT INTO tu_luyen_cham_cau(luot_id,sbd,qid,tra_loi,dung,diem,luc) VALUES(?,'HS1',?,'23',0,0,?)").bind(id,q.qid,T)))
    await E.DB.exec("CREATE TRIGGER chua_batch_loi_test BEFORE INSERT ON su_kien_hoc WHEN NEW.ma_nguon='tl_runtime_batch_fail' AND NEW.qid='DH-12-C1-B1-III-981' BEGIN SELECT RAISE(ABORT,'loi-test'); END")
    try {
      expect(await dongBoTuLuyen(E,'HS1',id)).toBe(false)
      expect((await E.DB.prepare('SELECT COUNT(*) AS n FROM chua_loi_tu_receipt WHERE luot_id=?').bind(id).first<any>()).n).toBe(0)
      expect((await E.DB.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc WHERE ma_nguon=?').bind(id).first<any>()).n).toBe(0)
    } finally { await E.DB.exec('DROP TRIGGER chua_batch_loi_test') }
    expect(await dongBoTuLuyen(E,'HS1',id)).toBe(true)
    expect((await E.DB.prepare('SELECT COUNT(*) AS n FROM chua_loi_tu_receipt WHERE luot_id=?').bind(id).first<any>()).n).toBe(2)
    expect((await E.DB.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc WHERE ma_nguon=?').bind(id).first<any>()).n).toBe(2)
  })
  it('nạp học liệu kiểm máy thật giữ bằng chứng, idempotent và không gắn tên thầy',async()=>{
    const h=hocLieuMau()
    h.buoc[0].tieuDe='Khối lượng mol · kiểm máy'
    const kiemMay={phienBan:1,luotSoan:'D1-soan-0001',luotKiem:'D1-kiem-0001',tra:await Promise.all(probeDuyNhat(h).map(async p=>({qid:p.qid,phienBan:p.phienBan,bamDe:await bamDeMu(p),dapAn:p.noiDungTrucTiep!.dapAn,lyDo:'Đã giải riêng và cộng đúng các nguyên tử trong công thức.',chac:true}))),chuyenMon:{dungKhoaHoc:true,tuongDuong:true,dungDoKho:true,duBuoc:true,lyDo:'Đủ dữ kiện khối lượng nguyên tử, cùng kỹ năng cộng nguyên tử khối, bốn bản đều mới và giữ độ khó.'}}
    const bad=structuredClone(kiemMay);bad.tra[0].dapAn='999'
    expect((await hocLieuThay(E,{luu:true,hocLieu:h,kiemMay:bad})).status).toBe(422)
    const first=await hocLieuThay(E,{luu:true,hocLieu:h,kiemMay}),receipt=await first.json() as any
    expect(first.status).toBe(200)
    const row=await E.DB.prepare('SELECT hoc_lieu_json,nguoi_duyet FROM chua_loi_hoc_lieu WHERE bam=?').bind(receipt.bam).first<any>()
    expect(row.nguoi_duyet).toBe('máy kiểm độc lập · v1')
    expect(JSON.parse(row.hoc_lieu_json).kiemMay.tra).toHaveLength(kiemMay.tra.length)
    kiemMay.luotKiem='D1-kiem-0002'
    const again=await (await hocLieuThay(E,{luu:true,hocLieu:h,kiemMay})).json() as any
    expect(again.bam).toBe(receipt.bam)
    expect((await E.DB.prepare('SELECT COUNT(*) AS n FROM chua_loi_hoc_lieu WHERE bam=?').bind(receipt.bam).first<any>()).n).toBe(1)
  })

})
