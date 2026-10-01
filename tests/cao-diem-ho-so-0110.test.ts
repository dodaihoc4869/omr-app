// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { gopDocD1 } from '../server/src/doc-d1-theo-luot'
import { docLanLam } from '../server/src/srs2-d1'
import { damBaoBangBia } from '../server/src/bi-a'
import { loadProfile } from '../server/src/game-v2'
import type { Env } from '../server/src/kieu'

describe('hồ sơ giờ cao điểm: dữ liệu tươi và lịch sử cần thiết',()=>{
  it('lọc lịch sử cũ nhưng giữ đủ lần sai/đúng/gợi ý tại mốc; không lẫn em/câu và không lấy sự kiện che',async()=>{
    const d=taoD1That()
    const st=d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,assistance,visibility) VALUES(?,?,?,?,?,?,?,?,?,?)')
    d.sql.exec('BEGIN')
    for(let i=0;i<4000;i++)st.run(`cu-${i}`,'S1','Q1','game',`cu-${i}`,i%2,'2026-09-01T00:00:00Z','2026-09-01','unassisted','visible')
    for(let i=0;i<20;i++)st.run(`moi-${i}`,'S1',i%2?'Q1':'Q2','game',`moi-${i}`,i%3?1:0,'2026-10-01T00:00:00Z','2026-10-01',i%4?'unassisted':'assisted','visible')
    st.run('che','S1','Q1','thi','C1',0,'2026-10-01T00:00:00Z','2026-10-01','unassisted','embargoed')
    st.run('em-khac','S2','Q1','game','X',0,'2026-10-01T00:00:00Z','2026-10-01','unassisted','visible')
    st.run('cau-khac','S1','Q3','game','X',0,'2026-10-01T00:00:00Z','2026-10-01','unassisted','visible')
    d.sql.exec('COMMIT')
    const truoc=await docLanLam(d.env,'S1',['Q1','Q2'])
    const sau=await docLanLam(d.env,'S1',['Q1','Q2'],'2026-10-01T00:00:00Z')
    expect(truoc).toHaveLength(4020);expect(sau).toHaveLength(20)
    expect(sau).toEqual(truoc.filter(x=>x.luc>='2026-10-01T00:00:00Z'))
    expect(sau.some(x=>x.coGoiY)).toBe(true);expect(sau.some(x=>!x.dung)).toBe(true)
  })
  it('gộp SELECT cùng lượt; batch lỗi ở bảng phụ không làm mất dữ liệu bảng chính',async()=>{
    const d=taoD1That()
    const db=gopDocD1(d.env.DB)
    const [a,b,c]=await Promise.all([
      db.prepare('SELECT 41 AS n').first<number>('n'),
      db.prepare('SELECT 42 AS n').all<{n:number}>(),
      db.prepare('SELECT * FROM bang_chua_co').all().catch(()=>null),
    ])
    expect(a).toBe(41);expect(b.results).toEqual([{n:42}]);expect(c).toBeNull()
    const dbKhac=gopDocD1(d.env.DB)
    expect(await dbKhac.prepare('SELECT 43 AS n').first<number>('n')).toBe(43)
  })
  it('gộp lô SELECT và first; lô ghi dùng changes() vẫn nguyên tử, nộp lặp không cộng hai lần',async()=>{
    const d=taoD1That();d.sql.exec('CREATE TABLE test_cas(k TEXT PRIMARY KEY, n INTEGER); INSERT INTO test_cas VALUES(\'P\',0)')
    let soBatch=0
    const goc=d.env.DB.batch.bind(d.env.DB)
    const db=gopDocD1({...d.env.DB,batch:((ds:Parameters<typeof goc>[0])=>{soBatch++;return goc(ds)}) as typeof goc})
    const [a,b]=await Promise.all([db.prepare('SELECT 1 AS n').first<number>('n'),db.batch([db.prepare('SELECT 2 AS n'),db.prepare('SELECT 3 AS n')])])
    expect(a).toBe(1);expect(b.map(x=>x.results)).toEqual([[{n:2}],[{n:3}]]);expect(soBatch).toBe(1)
    const ghi=()=>db.batch([db.prepare("INSERT OR IGNORE INTO test_cas(k,n) VALUES('EVENT',1)"),db.prepare("UPDATE test_cas SET n=n+1 WHERE k='P' AND changes()=1")])
    await ghi();await ghi()
    expect(d.sql.prepare("SELECT n FROM test_cas WHERE k='P'").get()).toEqual({n:1})
    expect((await db.prepare("UPDATE test_cas SET n=2 WHERE k='P' RETURNING n").all()).results).toEqual([{n:2}])
  })
  it('20 lớp đọc request riêng vẫn khởi tạo Bi-a một lần theo D1 gốc',async()=>{
    const d=taoD1That();let batch=0,alter=0
    const goc=d.env.DB
    const db={...goc,batch:((ds:Parameters<typeof goc.batch>[0])=>{batch++;return goc.batch(ds)}) as typeof goc.batch,prepare:(sql:string)=>{if(sql.startsWith('ALTER TABLE bi_a_co_mat'))alter++;return goc.prepare(sql)}}
    await Promise.all(Array.from({length:20},()=>damBaoBangBia({...d.env,DB:gopDocD1(db)})))
    expect(batch).toBe(1);expect(alter).toBe(1)
    await damBaoBangBia({...d.env,DB:gopDocD1(db)});expect(batch).toBe(1)
  })
  it('mùa và hồ sơ đọc trong một batch tươi; thay mùa vẫn reset đúng qua CAS',async()=>{
    const d=taoD1That();await loadProfile(d.env,'S1')
    let batch=0
    const goc=d.env.DB.batch.bind(d.env.DB)
    const env={...d.env,DB:{...d.env.DB,batch:(ds:Parameters<typeof goc>[0])=>{batch++;return goc(ds)}}} as unknown as Env
    const cu=await loadProfile(env,'S1');expect(batch).toBe(1)
    d.sql.prepare("INSERT INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({id:'mua-moi'}))
    const moi=await loadProfile(env,'S1')
    expect(moi.profile.season).toBe('mua-moi');expect(moi.profile.cap).toBe(1);expect(moi.profile.wallet).toBe(0);expect(moi.revision).toBeGreaterThan(cu.revision)
  })
})
