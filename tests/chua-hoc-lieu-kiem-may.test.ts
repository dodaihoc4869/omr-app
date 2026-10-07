import {describe,it,expect} from 'vitest'
import {hocLieuMau} from './_chua-cau-sai-fixture'
import {bamDeMu,deChoKiemMu,probeDuyNhat,kiemBangMay,type BangKiemMay} from '../server/src/chua-hoc-lieu-kiem-may'
async function daKiem(){
  const h=hocLieuMau()
  const b:BangKiemMay={phienBan:1,luotSoan:'soan-00001',luotKiem:'kiem-00001',tra:await Promise.all(probeDuyNhat(h).map(async p=>({qid:p.qid,phienBan:p.phienBan,bamDe:await bamDeMu(p),dapAn:p.noiDungTrucTiep!.dapAn,lyDo:'Đã kiểm từng dữ kiện và tính lại đáp số độc lập.',chac:true}))),chuyenMon:{dungKhoaHoc:true,tuongDuong:true,dungDoKho:true,duBuoc:true,lyDo:'Đủ dữ kiện, giữ kỹ năng đếm nguyên tử và tính khối lượng mol của câu gốc.'}}
  return {h,b}
}
describe('Nhận học liệu theo bằng chứng máy, không giả duyệt người',()=>{
  it('đầu vào mù giữ bảng, lựa chọn và đơn vị nhưng không mang đáp án/giả thuyết/hỗ trợ',()=>{
    const h=hocLieuMau(),p=h.buoc[0].phanBiet[0],d=deChoKiemMu(p)
    expect(d.noiDung.luaChon).toEqual(p.noiDungTrucTiep!.luaChon)
    expect(JSON.stringify(d)).not.toMatch(/dapAn|dapAnSai|cachNghiCu|hoTro/)
  })
  it('nhận bằng chứng đủ từng câu có lý do và soát tương đương',async()=>{const {h,b}=await daKiem();expect(await kiemBangMay(h,b)).toEqual([])})
  it('không nhận nếu thiếu câu kiểm',async()=>{const {h,b}=await daKiem();b.tra.pop();expect(await kiemBangMay(h,b)).toContain('kiem_mu_thieu_hoac_thua_muc')})
  it('đổi một lựa chọn sau giải mù làm bằng chứng hết hiệu lực',async()=>{const {h,b}=await daKiem();h.buoc[0].phanBiet[0].noiDungTrucTiep!.luaChon![0].noi='Chỉ O';expect(await kiemBangMay(h,b)).toContain('kiem_mu_lech_de')})
  it('lệch đáp án bị loại',async()=>{const {h,b}=await daKiem();b.tra[0].dapAn='999';expect(await kiemBangMay(h,b)).toContain('hai_luot_lech_dap_an')})
  it('không chắc, không có lý do hoặc lặp kết quả đều bị loại',async()=>{const {h,b}=await daKiem();b.tra[0].chac=false;b.tra[1].lyDo='';b.tra.push({...b.tra[2]});expect(await kiemBangMay(h,b)).toContain('kiem_mu_thieu_ly_do_hoac_chua_chac');expect(await kiemBangMay(h,b)).toContain('kiem_mu_trung_muc')})
  it('một phiên không được tự nhận là hai lượt độc lập',async()=>{const {h,b}=await daKiem();b.luotKiem=b.luotSoan;expect(await kiemBangMay(h,b)).toContain('thieu_hai_luot_kiem')})
  it('chưa đạt độ khó hoặc tính tương đương không được dùng',async()=>{const {h,b}=await daKiem();b.chuyenMon.dungDoKho=false;expect(await kiemBangMay(h,b)).toContain('chua_qua_kiem_chuyen_mon')})
})
