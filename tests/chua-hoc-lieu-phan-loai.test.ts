// @vitest-environment node
import { expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { hangHocLieu } from '../server/src/chua-cau-sai-thay'

it('hàng học liệu không làm mất dấu câu chưa duyệt, tự luận hoặc thiếu nguồn', async () => {
  const d = taoD1That()
  await d.env.DB.batch([
    d.env.DB.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,cap_nhat_luc) VALUES('D','Đề','12',3,'k','v1')"),
    d.env.DB.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('D','v1','x')"),
    d.env.DB.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES('D','Q-SAN','v1','G1',?)").bind(JSON.stringify({qid:'Q-SAN',maDe:'D',version:'v1',phan:'I',text:'Chọn đáp án.',choices:['a','b','c','d'],correct:'A',reviewed:true})),
    d.env.DB.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES('D','Q-CHUA','v1','G2',?)").bind(JSON.stringify({qid:'Q-CHUA',maDe:'D',version:'v1',phan:'I',text:'Chọn đáp án.',choices:['a','b','c','d'],correct:'A',reviewed:false})),
    d.env.DB.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES('D','Q-TL','v1','G3',?)").bind(JSON.stringify({qid:'Q-TL',maDe:'D',version:'v1',phan:'III',text:'Xác định công thức của chất X.',correct:'NaCl',reviewed:true})),
  ])
  for (const [i,qid] of ['Q-SAN','Q-CHUA','Q-TL','Q-MAT'].entries()) {
    await d.env.DB.prepare(
      `INSERT INTO chua_loi_dot(id,sbd,qid_chuan,phien_ban_cau,mo_luc,trang_thai_day,ly_do_thieu,giao_luc,chot_do_luc,tao_luc,cap_nhat_luc)
       VALUES(?,?,?,'v1',1,'thieu_hoc_lieu','chua_co_hoc_lieu',1,10,1,1)`,
    ).bind(`L${i}`,`E${i}`,qid).run()
  }

  const j=await (await hangHocLieu(d.env)).json() as any
  expect(Object.fromEntries(j.ds.map((x:any)=>[x.qid,x.loaiHang]))).toEqual({
    'Q-SAN':'san_sang_soan',
    'Q-CHUA':'cau_chua_duyet',
    'Q-TL':'tu_luan_khong_tu_dong',
    'Q-MAT':'thieu_cau_goc',
  })
  expect(j.tongHop.san_sang_soan).toMatchObject({soNhomCau:1,soDot:1,soEmCau:1})
  expect(j.tongHop.thieu_cau_goc.soNhomCau).toBe(1)
})
