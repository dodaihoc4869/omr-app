import type { CauChua, EmGoi, KetQuaPhanCong } from './phan-cong'

/** Một câu mỗi em, hai em khác nhau mỗi đợt; bốc thăm trong nhóm ít lượt nhất. */
export function phanCongDayHoc(cau: CauChua[], em: EmGoi[], random: () => number = Math.random): KetQuaPhanCong {
  const ds = em.filter(e => e.coMat)
  if (ds.length < 2) throw new Error('Cần ít nhất 2 học sinh có mặt để phân công dạy học.')
  if (!cau.length) throw new Error('Thầy chọn đề để phân công dạy học.')
  const counts = new Map(ds.map(e => [e.sbd, e.soLanLenBang]))
  const assigned: KetQuaPhanCong['phanCong'] = []
  for (const [i,q] of cau.entries()) {
    const previous = i % 2 ? assigned[i-1].sbd : null
    const eligible = ds.filter(e => e.sbd !== previous)
    const min = Math.min(...eligible.map(e => counts.get(e.sbd)!))
    const pool = eligible.filter(e => counts.get(e.sbd) === min)
    const pick = pool[Math.min(pool.length-1, Math.floor(random()*pool.length))]
    counts.set(pick.sbd,min+1)
    assigned.push({luot:Math.floor(i/2)+1,sbd:pick.sbd,hoTen:pick.hoTen,cau:q,muc:5,mucDoNham:q.mucDo || 'biet',viSao:'Ưu tiên ít lượt lên bảng; bốc ngẫu nhiên giữa các em cùng số lượt.'})
  }
  return {thongKe:cau.map(q=>({cau:q,soEmLam:0,soSai:0,tiLeDung:0,doChum:0,doTinCay:0,diem:0,nhom:'dang_chua'})),giangCaLop:[],chiDocDapAn:[],phanCong:assigned,chuaPhan:[],emChuaGoi:ds.filter(e=>!assigned.some(p=>p.sbd===e.sbd)).map(e=>e.hoTen),canhBao:cau.length%2?['Số câu lẻ: đợt cuối có 1 học sinh.']:[]}
}
