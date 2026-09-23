// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That, type D1That } from './_d1-that'
import { phGiaoThem } from '../server/src/ph-giao-them'
import { chonCauBaiHangNgay } from '../server/src/parent-news-nguon-cau'
import { chotThuThach, chonCauThuThach } from '../server/src/thu-thach-rieng'
import { chonCauChoPhuHuynh } from '../server/src/parent-news-chon-cau'
import { readScope } from '../server/src/game-v2-bank'

const NGAY = '2026-09-23'
const NOW = Date.parse(`${NGAY}T12:00:00+07:00`)
function setup() {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Một','12','x'),('S2','Hai','12','x'),('NEW','Mới','12','x'); INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE','Đề','12',20,'k',0,'v'); INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE','v','x')")
  const question = (id: string, dang: string, knowledge = ['k'], group = id) => {
    const q = { qid:id, maDe:'DE', version:'v', group, phan:'I', text:`Nội dung ${id}`, choices:['A. a','B. b','C. c','D. d'], ideas:[], hinhAnh:[], dang, tenDang:dang, mucDo:'biet', sao:0, kienThuc:knowledge, correct:'B', solution:'Giải', reviewed:true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE',id,'v',group,dang,JSON.stringify(q))
  }
  const learn = (sbd: string, id: string, dang: string, ngay = '2026-09-01') => {
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,'btvn','B',1,0,?,?)").run(`${sbd}|${id}`,sbd,id,`${ngay}T00:00:00Z`,ngay)
    d.sql.prepare("INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,4,4,0,1,0,0,'x')").run(`${sbd}|${dang}`,sbd,dang)
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,?,?,?,'CD',1,1,0,0,0,0,'btvn',?,'2026-10-01','dang_on',0,'x')").run(`${sbd}|${id}`,sbd,id,dang,`${ngay}T00:00:00Z`)
  }
  return { d, question, learn }
}
function challenge(d: D1That, sbd: string, dang: string[]) {
  d.sql.prepare("INSERT INTO ai_dieu_chinh(sbd,ngay,json,ap_dung,het_han,huy,nop_luc,che_do) VALUES(?,?,?,1,'2999-01-01',0,'x','that')").run(sbd,NGAY,JSON.stringify({thuThach:{dang,soCau:6,bac:'dung_bac'},loiMoi:'Luyện câu phù hợp hôm nay.'}))
  return chotThuThach(d.env,sbd,NGAY,NOW)
}

describe('phạm vi tự động theo từng em, không bù lớp/chương', () => {
  it('qid trùng giữa hai đề không lấy nội dung đề thứ hai làm bằng chứng đã học',async()=>{
    const {d,question,learn}=setup()
    question('duplicate','ES.A');learn('S1','duplicate','ES.A')
    const raw=JSON.parse((d.sql.prepare("SELECT json FROM game_v2_question WHERE qid='duplicate'").get() as {json:string}).json)
    d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE2','Đề khác','12',1,'k2',0,'v'); INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE2','v','x')")
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE2','duplicate','v','other','ES.B',JSON.stringify({...raw,maDe:'DE2',group:'other',dang:'ES.B',text:'Nội dung chưa học'}))
    const scope=await readScope(d.env,'S1')
    expect(scope.evidence).toEqual([])
    expect(scope.missing).toBeGreaterThan(0)
    expect(scope.pool).toEqual([])
  })
  it('HS mới không có bằng chứng không nhận câu từ kho hoặc điều chỉnh AI', async () => {
    const { d, question } = setup(); question('A','ES.A')
    expect((await chonCauBaiHangNgay(d.env,'NEW',6,NOW)).cau).toEqual([])
    expect(await challenge(d,'NEW',['ES.A'])).toBeNull()
  })
  it('hai em cùng lớp khác dạng; thiếu câu không mở rộng cùng chuyên đề; chặn câu nhiều kiến thức', async () => {
    const { d, question, learn } = setup()
    question('A0','ES.A'); question('A1','ES.A'); question('B0','ES.B'); question('B1','ES.B'); question('A-extra','ES.A',['k','unlearned'])
    learn('S1','A0','ES.A'); learn('S2','B0','ES.B')
    const one = await chonCauBaiHangNgay(d.env,'S1',10,NOW)
    const two = await chonCauBaiHangNgay(d.env,'S2',10,NOW)
    expect(one.cau.map(q=>q.qid).sort()).toEqual(['A0','A1'])
    expect(two.cau.map(q=>q.qid).sort()).toEqual(['B0','B1'])
    const c = await challenge(d,'S1',['ES.A','ES.B'])
    expect(c?.qid.sort()).toEqual(['A0','A1'])
  })
  it('loại bản sao nội dung trong lượt và bản sao câu vừa làm dù qid khác', async () => {
    const { d, question, learn } = setup()
    question('A0','ES.A',['k'],'OLD'); question('A-copy','ES.A',['k'],'OLD')
    question('B','ES.A',['k'],'NEW'); question('B-copy','ES.A',['k'],'NEW')
    learn('S1','A0','ES.A',NGAY)
    expect((await chonCauBaiHangNgay(d.env,'S1',10,NOW)).cau.length).toBe(1)
    const c = await challenge(d,'S1',['ES.A'])
    expect(c?.qid.length).toBe(1)
    expect(c?.qid.every(q=>q.startsWith('B'))).toBe(true)
  })
  it('PH giao thêm chỉ dùng phạm vi riêng, khử bản sao nội dung trong gói', async () => {
    const { d, question, learn } = setup()
    for (let i=0; i<5; i++) { question(`old${i}`,'ES.A'); learn('S1',`old${i}`,'ES.A') }
    for (let i=0; i<20; i++) {
      question(`new${i}`,'ES.A',['k'],`pair${Math.floor(i/2)}`)
      question(`foreign${i}`,'ES.B',['k'])
      question(`mixed${i}`,'ES.A',['k','unlearned'])
    }
    const r = await phGiaoThem(d.env,{sbd:'S1'},NOW)
    expect(r.ok).toBe(true)
    const rows = d.sql.prepare("SELECT qid_json FROM ph_giao_them WHERE sbd = 'S1'").all() as {qid_json:string}[]
    expect(rows).toHaveLength(1)
    const ids = JSON.parse(rows[0]!.qid_json) as string[]
    expect(ids.every(x=>x.startsWith('old') || x.startsWith('new'))).toBe(true)
    const groups = ids.map(id=>(d.sql.prepare('SELECT content_group FROM game_v2_question WHERE qid = ?').get(id) as {content_group:string}).content_group)
    expect(new Set(groups).size).toBe(ids.length)
  })
  it('thử thách chốt từ bản cũ không tiếp tục phát câu ngoài phạm vi', async () => {
    const { d, question, learn } = setup()
    question('A','ES.A'); question('B','ES.B'); learn('S1','A','ES.A')
    d.sql.prepare("INSERT INTO thu_thach_rieng(sbd,ngay,dang_json,bac,so_cau,so_cau_muon,qid_json,loi_moi,tao_luc) VALUES('S1',?,'[\"ES.B\"]','dung_bac',1,3,'[\"B\"]','Luyện tập','x')").run(NGAY)
    expect(await chotThuThach(d.env,'S1',NGAY,NOW)).toBeNull()
    expect(d.sql.prepare('SELECT qid_json FROM thu_thach_rieng').get()).toEqual({qid_json:'["B"]'})
  })
  it('đọc theo lô: tăng kho 25 → 250 câu không sinh truy vấn trên từng câu', async () => {
    const counts: number[] = []
    for (const n of [25,250]) {
      const { d, question, learn } = setup()
      question('learned','ES.A'); learn('S1','learned','ES.A')
      for (let i=0; i<n; i++) question(`candidate-${i}`,'ES.A')
      // Mỗi kích thước có phiên bản kho riêng: đo cache lạnh một cách rõ ràng.
      d.sql.prepare('UPDATE de_kho SET cap_nhat_luc = ?').run(`bench-${n}`)
      d.sql.prepare('UPDATE game_v2_index SET source_version = ?').run(`bench-${n}`)
      const before = d.soLenh.prepare
      expect((await chonCauBaiHangNgay(d.env,'S1',10,NOW)).cau).toHaveLength(10)
      counts.push(d.soLenh.prepare-before)
    }
    expect(counts[1]).toBeLessThanOrEqual(counts[0]!+2)
    console.info('[pham-vi-2309] query count 25/250 candidates:', counts.join('/'))
  })
  it('hàm thuần không nhận fallback thiếu metadata hoặc dạng chưa học; câu tới hạn được giữ', () => {
    const r = chonCauChoPhuHuynh({ soCan:10,seed:1,ungVien:[{qid:'due',dang:null,mucDo:null},{qid:'foreign',dang:'X',mucDo:'biet'},{qid:'unknown',dang:'A',mucDo:null}],toiHan:[{qid:'due',mocOnKe:NGAY,lanSai:1}],dangYeu:[],dangDaHoc:new Set(['A']),suKienGanDay:new Set() })
    expect(r.map(x=>x.qid)).toEqual(['due'])
  })
  it('thử thách pure không chọn hai bản sao và bù bằng câu khác', () => {
    const r = chonCauThuThach({sbd:'S1',ngay:NGAY,dang:['A'],soCau:3,mucNhamTheoDang:new Map([['A',0]]),loaiTru:new Set(),ungVien:[{qid:'1',dang:'A',muc:0,group:'same'},{qid:'2',dang:'A',muc:0,group:'same'},{qid:'3',dang:'A',muc:0,group:'other'}]})
    expect(r.qid).toHaveLength(2); expect(r.thieu).toBe(1)
  })
  it('nút khắc phục legacy dùng kế hoạch ôn và nộp server thay vì câu sai đầu cố định', () => {
    const s = readFileSync('src/screens/StudentPortalScreen.tsx','utf8').split("case 'mo_khac_phuc':")[1]!.split("case 'mo_thu_thach':")[0]!
    expect(s).toContain('taiKeHoachNgay({ token: auth.token })')
    expect(s).not.toContain('dungPhieu')
    expect(s).not.toContain('hsCauSaiApi')
  })
  it('nút thử sức legacy lấy câu đã chốt của server, không nạp kho local', () => {
    const s = readFileSync('src/screens/StudentPortalScreen.tsx','utf8').split("case 'mo_thu_thach':")[1]!.split("case 'mo_thi':")[0]!
    expect(s).toContain('taiThuThachHomNay(auth.token)')
    expect(s).toContain('duongNop: DUONG_NOP_THU_THACH')
    expect(s).not.toContain('loadExamSources')
  })
})
