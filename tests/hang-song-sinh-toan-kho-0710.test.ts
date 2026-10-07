// @vitest-environment node
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
import { damBaoBangMaySoan, napSongSinhToanKho, nhanVaGhiBanKhac } from '../server/src/hoc-lieu-may-soan'
import { thieuBanKhac } from '../server/src/may-soan-kiem'

function kho() {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,lop,da_xoa,cap_nhat_luc) VALUES ('12-KHO','12',0,'x'),('11-KHO','11',0,'x'),('12-XOA','12',1,'x')").run()
  const them = (qid: string, bam: string, phan = 'I', maDe = '12-KHO', themCau: Record<string, unknown> = {}, anhXa = true) => {
    const cau = { qid, maDe, phan, text: 'Phát biểu nào sau đây đúng?', choices: ['a','b','c','d'], ideas: phan === 'II' ? ['a','b','c','d'] : [], correct: phan === 'III' ? '2' : phan === 'II' ? 'DSDS' : 'A', ...themCau }
    d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES (?,?,'v','g',?)").run(maDe,qid,JSON.stringify(cau))
    if (anhXa) d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,lop,bo,cap_nhat_luc) VALUES (?,?,?,?,?,'CHUA_GAN','x')").run(qid,bam,maDe,phan === 'II' ? 'ds' : phan === 'III' ? 'tln' : 'tn',maDe.startsWith('11') ? '11' : '12')
  }
  return { d, them }
}

describe('nạp hàng song sinh toàn kho: SQL thật, chỉ hàng học liệu', () => {
  it('phân trang ổn định, gộp băm, loại tự luận theo JSON thật, tờ xóa; báo câu chưa ánh xạ', async () => {
    const { d, them } = kho()
    them('a','chung'); them('b','chung'); them('c','ds','II'); them('d','so','III')
    them('e','tl','III','12-KHO',{ correct: 'FeSO4' })
    them('f','xoa','I','12-XOA'); them('g','11','I','11-KHO'); them('h','thieu','I','12-KHO',{},false)
    const a = await napSongSinhToanKho(d.env,{ so: 2,lop:'12' })
    expect(a).toMatchObject({ daQuet:2,nhom:1,vaoHang:1,tiep:'b',chuaAnhXa:1 })
    const b = await napSongSinhToanKho(d.env,{ so:2,lop:'12',sau:a.tiep })
    expect(b).toMatchObject({ daQuet:2,nhom:2,vaoHang:2,tiep:'d' })
    const c = await napSongSinhToanKho(d.env,{ so:2,lop:'12',sau:b.tiep })
    expect(c).toMatchObject({ daQuet:1,tuLuan:1,vaoHang:0,tiep:null })
    expect(d.dem('may_soan_viec')).toBe(3)
    expect(d.dem('loi_giai_cau')).toBe(7)
    expect(d.dem('loi_giai_viec')).toBe(0)
    d.sql.close()
  })
  it('lặp lại không đổi lease/trượt/thử lại; chỉ mở lại việc xong còn thiếu', async () => {
    const { d, them } = kho()
    for (const qid of ['a','b','c','d']) them(qid,qid)
    await damBaoBangMaySoan(d.env)
    const ins = d.sql.prepare("INSERT INTO may_soan_viec(bam,qid,ma_de,dang,lop,bo,trang_thai,so_lan,ma_luot,nhan_luc,tao_luc,cap_nhat_luc) VALUES (?,?,'12-KHO','tn','12','CHUA_GAN',?,3,'lease','luc','x','x')")
    ins.run('a','a','dang');ins.run('b','b','truot');ins.run('c','c','cho');ins.run('d','d','xong')
    expect(await napSongSinhToanKho(d.env,{})).toMatchObject({ vaoHang:1 })
    expect(d.sql.prepare("SELECT trang_thai,so_lan,ma_luot,nhan_luc FROM may_soan_viec WHERE bam='a'").get()).toMatchObject({ trang_thai:'dang',so_lan:3,ma_luot:'lease',nhan_luc:'luc' })
    expect(d.sql.prepare("SELECT trang_thai,so_lan FROM may_soan_viec WHERE bam='b'").get()).toMatchObject({ trang_thai:'truot',so_lan:3 })
    expect(d.dem('may_soan_viec',"trang_thai='cho'")).toBe(2)
    expect(await napSongSinhToanKho(d.env,{})).toMatchObject({ vaoHang:0 })
    d.sql.close()
  })
  it('không xếp câu đủ sáu bản; JSON lỗi không được suy đoán thành câu hợp lệ', async () => {
    const { d, them } = kho()
    them('a','du');them('b','loi')
    d.sql.prepare("UPDATE game_v2_question SET json='{' WHERE qid='b'").run()
    const bans = Array.from({length:6},(_,i)=>({de:`Phát biểu mới đủ dữ liệu số ${i}`,pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A'}))
    d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES ('du','a',?,'[]','[]','[]','x')").run(JSON.stringify(bans))
    expect(await napSongSinhToanKho(d.env,{})).toMatchObject({ du:1,loiJson:1,vaoHang:0 })
    d.sql.close()
  })
  it('đường nạp toàn kho vẫn yêu cầu cổng mã bí mật', async () => {
    const { d, them } = kho();them('a','a')
    const r = await worker.fetch(new Request('https://test/kho/may-soan/nap-toan-kho',{ method:'POST',body:'{}' }),d.env)
    expect(r.status).toBe(403)
    expect(d.dem('may_soan_viec')).toBe(0)
    d.sql.close()
  })
  it('dừng khi không đọc được học liệu, không xem lỗi truy vấn là kho trống', async () => {
    const { d, them } = kho();them('a','a')
    d.sql.exec('DROP TABLE cau_y_ds')
    await expect(napSongSinhToanKho(d.env,{})).rejects.toThrow('cau_y_ds')
    expect(d.dem('may_soan_viec')).toBe(0)
    d.sql.close()
  })
  it('tám vị trí cũ hỏng chỉ còn bốn vị trí thêm; không đổi nghĩa qid cũ hoặc báo đủ sáu', async () => {
    const { d } = kho()
    const cu = Array.from({length:8},(_,i)=>({ de:`bản cũ hỏng ${i}`,dap_an:'' }))
    d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES ('slots','a',?,'[]','[]','[]','x')").run(JSON.stringify(cu))
    const moi = Array.from({length:6},(_,i)=>({ kieu:'ly_thuyet',de:`Phát biểu về tính chất của chất trong tình huống ${i} sau đây đúng?`,pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A',buoc:['Xét tính chất của chất.'],chot:'Dựa vào cấu tạo và tính chất của chất.',kiem:{d2:'A',chac:true,lyDo2:'Xét độc lập tính chất và chọn A.'} }))
    const r = await nhanVaGhiBanKhac(d.env,{ qid:'a',bam:'slots',dang:'tn',phan:'I',de:'Câu gốc phát biểu nào đúng?',pa:{A:'a',B:'b',C:'c',D:'d'},y:[],dapAn:'A',kieu:'ly_thuyet',bang:null },{qidMau:'a',maDe:'12-KHO',lop:'12'},moi)
    expect(r).toMatchObject({giu:4,tong:4})
    expect(r.bo).toHaveLength(2)
    expect(r.bo[0].lyDo).toContain('vị trí lịch sử')
    const luu = JSON.parse((d.sql.prepare("SELECT song_sinh_json FROM cau_bo_tro WHERE bam='slots'").get() as {song_sinh_json:string}).song_sinh_json)
    expect(luu).toHaveLength(12);expect(luu.slice(0,8)).toEqual(cu)
    expect(thieuBanKhac('tn',r.tong,0)).toBe('mot_phan')
    d.sql.close()
  })
})
