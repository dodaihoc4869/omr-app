// Đọc dữ kiện trong đề, không nhận dapAn/biểu thức/kết quả của lượt soạn.
// Phạm vi cố định, chưa hiểu một đề ⇒ trả null; không tự duyệt đề lạ.
import {deChoKiemMu} from '../../server/src/chua-hoc-lieu-kiem-may'
export type DeMu=ReturnType<typeof deChoKiemMu>
const number=(s:string)=>Number(s.replace(',','.'))
const round=(x:number,n:number)=>x.toFixed(n).replace('.',',')
const val=(s:string,key:string)=>{const r=new RegExp(`(?:^|[^a-zA-Z_])${key}=([0-9]+(?:[.,][0-9]+)?)`).exec(s);return r ? number(r[1]) : null}
const correctReasons=new Set([
  'D đổi mL thành g; sau đó chia M mới ra mol.',
  'M là khối lượng một mol; m/M đếm được số mol trong mẫu.',
  'Phản ứng dừng theo lượng chất giới hạn, chất còn dư không tạo thêm ester.',
  'So n(A)/a và n(B)/b; giá trị nhỏ hơn quyết định lượng phản ứng.',
  'Đó là mức sản phẩm tối đa có thể tạo từ lượng chất ban đầu.',
  'Kiểm lại đơn vị, chất giới hạn và thứ tự thực tế/lí thuyết.',
])
export function giaiDeHieuSuat(d:DeMu):{dapAn:string;lyDo:string}|null{
  const n=d.noiDung,s=n.hoi
  if(n.kieu==='chon_ly_do'){
    const choices=(n.luaChon??[]).filter(x=>correctReasons.has(x.noi))
    if(choices.length!==1) return null
    return {dapAn:choices[0].ky,lyDo:choices[0].noi}
  }
  const V=val(s,'V'),D=val(s,'D'),M=val(s,'M'),m=val(s,'m')
  if(n.kieu==='so' && /Tính n \(mol\)/.test(s) && M && ((V!==null && D!==null)||m!==null)){
    const ans=(m??V!*D!)/M
    return {dapAn:/3 chữ số thập phân/.test(s)?round(ans,3):String(ans).replace('.',','),lyDo:`Khối lượng là ${m??V!*D!} g; chia khối lượng mol ${M} g/mol được ${ans} mol.`}
  }
  if(n.kieu==='chon' && /Biểu thức nào tính đúng số mol/.test(s) && V!==null && D!==null && M){
    const expected=`${String(V)}×${String(D).replace('.',',')}/${String(M)}`
    const choice=(n.luaChon??[]).filter(x=>x.noi===expected)
    return choice.length===1 ? {dapAn:choice[0].ky,lyDo:`Cần đổi thể tích ${V} mL thành ${V*D} g rồi chia ${M} g/mol.`} : null
  }
  if(n.kieu==='chon' && /Chất giới hạn là gì/.test(s)){
    const direct=/Có ([\d,]+) mol ethanol và ([\d,]+) mol acid/.exec(s)
    const masses=/Ethanol có ([\d,]+) g \(M=([\d,]+) g\/mol\), acetic acid có ([\d,]+) g \(M=([\d,]+) g\/mol\)/.exec(s)
    if(!direct&&!masses) return null
    const ne=direct ? number(direct[1]) : number(masses![1])/number(masses![2])
    const na=direct ? number(direct[2]) : number(masses![3])/number(masses![4])
    const target=ne<na?'Ethanol':na<ne?'Acetic acid':'Hai chất vừa đủ'
    const choices=(n.luaChon??[]).filter(x=>x.noi.startsWith(target)&& !/so trực tiếp khối lượng/.test(x.noi))
    return choices.length===1 ? {dapAn:choices[0].ky,lyDo:`Tỉ lệ 1:1: n ethanol=${ne} mol, n acid=${na} mol; chọn chất có lượng phản ứng nhỏ hơn.`} : null
  }
  if(n.kieu==='so' && /Lượng ester lí thuyết/.test(s)){
    const a=/có ([\d,]+) mol ethanol và ([\d,]+) mol acid/.exec(s)
    if(!a) return null
    const e=number(a[1]),c=number(a[2])
    return {dapAn:String(Math.min(e,c)).replace('.',','),lyDo:`Ester hoá 1:1 nên lượng ester tối đa bằng min(${e},${c}) mol.`}
  }
  if(n.kieu==='so' && /Lượng C lí thuyết/.test(s)){
    const a=/phương trình (2?A)\+(2?B)→C, có ([\d,]+) mol A và ([\d,]+) mol B/.exec(s)
    if(!a) return null
    const ea=number(a[3])/(a[1].startsWith('2')?2:1),eb=number(a[4])/(a[2].startsWith('2')?2:1)
    return {dapAn:String(Math.min(ea,eb)).replace('.',','),lyDo:`Chia mol mỗi chất cho hệ số: ${ea} và ${eb}; giá trị nhỏ hơn là lượng C tối đa.`}
  }
  const tt=val(s,'m_tt'),lt=val(s,'m_lt'),H=val(s,'H')
  if(n.kieu==='so' && tt!==null && lt && /Tính H/.test(s)) return {dapAn:String(tt/lt*100).replace('.',','),lyDo:`Tỉ lệ thực tế/lí thuyết=${tt}/${lt}; nhân 100 được ${tt/lt*100}%.`}
  if(n.kieu==='so' && H && lt!==null && /Tính khối lượng thực tế/.test(s)) return {dapAn:String(lt*H/100).replace('.',','),lyDo:`Thực thu bằng ${H}% của ${lt} g: ${lt}×${H}/100=${lt*H/100} g.`}
  if(n.kieu==='so' && H && tt!==null && /Tính khối lượng lí thuyết/.test(s)) return {dapAn:String(tt*100/H).replace('.',','),lyDo:`${tt} g ứng với ${H}%, nên mức 100% là ${tt}×100/${H}=${tt*100/H} g.`}
  if(n.kieu==='chon' && /Cách tính hiệu suất nào phù hợp/.test(s)){
    const x=/lí thuyết có thể thu ([\d,]+) g ester, thực tế thu ([\d,]+) g/.exec(s)
    if(!x) return null
    const target=`${x[2]}/${x[1]}×100%`,choices=(n.luaChon??[]).filter(c=>c.noi===target)
    return choices.length===1 ? {dapAn:choices[0].ky,lyDo:'Lấy khối lượng thực thu chia mức sản phẩm tối đa, rồi đổi tỉ số sang phần trăm.'} : null
  }
  const full=/Đun ([\d,]+) mL acetic acid \(D=([\d,]+) g\/mL; M=([\d,]+) g\/mol\) với ([\d,]+) mL ethanol \(D=([\d,]+) g\/mL; M=([\d,]+) g\/mol\).*Thu được ([\d,]+) g ethyl acetate \(M=([\d,]+) g\/mol\)/.exec(s)
  if(n.kieu==='so' && full && /tỉ lệ 1:1:1:1/.test(s) && /hàng phần mười/.test(s)){
    const a=number(full[1])*number(full[2])/number(full[3]),e=number(full[4])*number(full[5])/number(full[6]),theo=Math.min(a,e)*number(full[8])
    const h=number(full[7])/theo*100
    if(!(h>0&&h<=100)) return null
    return {dapAn:round(h,1),lyDo:`Acid ${a} mol, ethanol ${e} mol; chất giới hạn cho tối đa ${theo} g ester. Thực tế ${full[7]} g nên H=${h}%, làm tròn một chữ số.`}
  }
  return null
}
