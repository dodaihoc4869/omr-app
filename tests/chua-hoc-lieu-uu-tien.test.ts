// @vitest-environment node
import { expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { viecVongChua } from '../server/src/chua-hoc-lieu-viec'

it('máy soạn ưu tiên câu mở được nhiều em; hòa số em thì cứu vòng quá hạn trước', async () => {
  const d = taoD1That()
  await d.env.DB.batch([
    d.env.DB.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,cap_nhat_luc) VALUES('D','Đề','12',3,'k','v1')"),
    d.env.DB.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('D','v1','x')"),
    ...['Q-NHIEU','Q-QUA-HAN','Q-IT'].map(qid=>d.env.DB.prepare(
      "INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES('D',?,'v1',?,?)",
    ).bind(qid,qid,JSON.stringify({qid,maDe:'D',version:'v1',group:qid,phan:'I',text:qid,choices:['a','b','c','d'],correct:'A',reviewed:true}))),
  ])
  const now=Date.now(),future=now+86400000,old=now-86400000
  const rows=[
    ['n1','E1','Q-NHIEU',future],['n2','E2','Q-NHIEU',future],['n3','E3','Q-NHIEU',future],
    ['q1','E1','Q-QUA-HAN',old],['q2','E2','Q-QUA-HAN',old],['q3','E3','Q-QUA-HAN',old],
    ['i1','E1','Q-IT',old],['i2','E2','Q-IT',old],
  ]
  for(const [id,sbd,qid,han] of rows) await d.env.DB.prepare(
    `INSERT INTO chua_loi_dot(id,sbd,qid_chuan,phien_ban_cau,mo_luc,trang_thai_day,giao_luc,chot_do_luc,tao_luc,cap_nhat_luc)
     VALUES(?,?,?,'v1',1,'thieu_hoc_lieu',1,?,1,1)`,
  ).bind(id,sbd,qid,han).run()

  const r=await viecVongChua(d.env,{so:3,daLam:[]})
  expect(r.viec.map(x=>x.cau?.qid)).toEqual(['Q-QUA-HAN','Q-NHIEU','Q-IT'])
  expect(r.viec.map(x=>x.uuTien)).toEqual([
    {soEm:3,soDot:3,soQuaHan:3,hanGanNhat:old},
    {soEm:3,soDot:3,soQuaHan:0,hanGanNhat:future},
    {soEm:2,soDot:2,soQuaHan:2,hanGanNhat:old},
  ])
})
