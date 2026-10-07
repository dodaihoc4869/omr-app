// Mẫu đã soát phạm vi: chỉ câu ethanol + acetic acid 1:1, đổi thể tích sang mol và tính hiệu suất.
// Chưa phải bộ sinh cho toàn kho. Đáp án được bộ giải riêng đọc lại chữ đề.
import type {HocLieuChua,ProbeRef,BuocChua} from '../../server/src/chua-cau-sai-kieu'
import type {PrivateQuestion} from '../../src/game/than-thu-v2/core'
export const QID_HIEU_SUAT='12-C1-B1-D2-III-26'
export const VERSION_HIEU_SUAT='f1feaf55400832385b149955a5699371'
export function soanHieuSuat(q:PrivateQuestion):HocLieuChua|null {
  if(q.qid!==QID_HIEU_SUAT || q.version!==VERSION_HIEU_SUAT || q.reviewed!==true || q.phan!=='III') return null
  const skill=['doi_mol','chat_gioi_han','hieu_suat']
  const p=(id:string,hoi:string,dapAn:string,s:number,kieu:'so'|'chon'|'chon_ly_do'='so',options?:string[],wrong?:string[]):ProbeRef=>({
    qid:`hs-0710-${id}`,phienBan:'hs-0710.1',phan:kieu==='so'?'III':'I',kyNang:[skill[s]],laTuongDuong:false,
    ...(wrong ? {dapAnSai:wrong} : {}),noiDungTrucTiep:{hoi,kieu,dapAn,...(options ? {luaChon:options.map((noi,i)=>({ky:'ABCD'[i],noi}))} : {})}})
  const b0=p('pb-mol','Acetic acid có V=16 mL, D=1,05 g/mL và M=60 g/mol. Biểu thức nào tính đúng số mol?','B',0,'chon',['16/60','16×1,05/60','16×60/1,05','16×1,05×60'],['A'])
  const b1=p('pb-het','Ethanol có 9,2 g (M=46 g/mol), acetic acid có 10,8 g (M=60 g/mol), phản ứng theo tỉ lệ 1:1. Chất giới hạn là gì?','B',1,'chon',['Ethanol vì đem so trực tiếp khối lượng hai chất.','Acetic acid vì 0,18 mol nhỏ hơn 0,20 mol.','Hai chất vừa đủ.','Không thể xác định từ dữ kiện trên.'],['A'])
  const b2=p('pb-h','Theo lí thuyết có thể thu 10 g ester, thực tế thu 6 g. Cách tính hiệu suất nào phù hợp?','B',2,'chon',['10/6×100%','6/10×100%','6/(10+6)×100%','10−6'],['A'])
  const step=(s:number,title:string,cd:ProbeRef,pb:ProbeRef,kl:ProbeRef[],why:ProbeRef[],transfer:ProbeRef[],hb:string[],hoTro:string[],loi:string[]):BuocChua=>({
    id:skill[s],thuTu:s,tieuDe:title,tienQuyet:s ? [skill[s-1]] : [],viKyNang:[skill[s]],chanDoan:[cd],phanBiet:[pb],kiemLai:kl,
    hoTro:hoTro.map((noiDung,i)=>({muc:(i+1) as 1|2|3,noiDung})),
    loiThuongGap:[{ma:`loi-${skill[s]}`,loai:'phuong_phap',tinHieu:loi[0],probeXacNhan:pb.qid}],
    hieuBuoc:{mucTieu:hb[0],yNghiaDaiLuong:hb[1],viSaoCanBuoc:hb[2],dieuKienApDung:hb[3],noiVoiBuocSau:hb[4],
      doiChieu:[{maLoi:`loi-${skill[s]}`,probeXacNhan:pb,cachNghiCu:loi[0],diemLech:loi[1],heQua:loi[2],cachDung:loi[3]}],kiemLyDo:why,chuyenGiao:transfer,
      bieuDien:{loai:'cong_thuc',noiDung:hb[5],moTaVanBan:hb[1],hienSau:'nop_chan_doan'}}})
  const buoc:BuocChua[]=[
    step(0,'Đổi về mol để so được lượng chất',
      p('cd-mol','Ethanol có khối lượng m=9,2 g và M=46 g/mol. Tính n (mol).','0,2',0),b0,
      [p('kl-mol1','Ethanol có khối lượng m=11,5 g và M=46 g/mol. Tính n (mol).','0,25',0),p('kl-mol2','Acetic acid có khối lượng m=18 g và M=60 g/mol. Tính n (mol).','0,3',0)],
      [p('ld-mol1','Vì sao phải dùng khối lượng riêng khi đổi V sang n?','B',0,'chon_ly_do',['Vì khối lượng riêng chính là khối lượng mol.','D đổi mL thành g; sau đó chia M mới ra mol.','Vì D dùng thay hệ số phản ứng.','Để đổi mol thành phần trăm.']),p('ld-mol2','Khi có m và M, vì sao dùng n=m/M?','C',0,'chon_ly_do',['Nhân m với M luôn tăng số mol.','M là số mol của mẫu.','M là khối lượng một mol; m/M đếm được số mol trong mẫu.','M là thể tích của mẫu.'])],
      [p('cg-mol1','Acetic acid có V=10 mL, D=1,05 g/mL và M=60 g/mol. Tính n (mol).','0,175',0),p('cg-mol2','Ethanol có V=10 mL, D=0,8 g/mL và M=46 g/mol. Tính n (mol), làm tròn 3 chữ số thập phân.','0,174',0)],
      ['Tính lượng chất của từng chất ban đầu.','D (g/mL) đổi V (mL) thành m (g); M (g/mol) đổi m thành n (mol).','Hai thể tích bằng nhau vẫn có thể chứa số mol khác nhau.','Chất lỏng tinh khiết: m=V×D và n=m/M; dung dịch có nồng độ cần tính lượng chất tan riêng.','Giữ đủ chữ số rồi so số mol theo hệ số phản ứng.','m=V×D; n=m/M'],
      ['Em đã có V, D hay m? Chọn đường đổi từ dữ kiện đó.','Nhân mL với g/mL thì mL triệt tiêu, còn gam; tiếp tục chia g/mol thì còn mol.','Ví dụ khác: 5 mL chất có D=0,9 g/mL, M=90 g/mol thì m=4,5 g và n=0,05 mol. Dùng cùng đường đổi cho dữ kiện em đang làm.'],
      ['Em dùng V/M mà bỏ khối lượng riêng.','V là mL, còn M là g/mol: hai đơn vị chưa khớp.','Số mol tính ra sẽ lệch và kéo theo chọn sai chất giới hạn.','Đổi m=V×D trước, rồi lấy n=m/M.']),
    step(1,'Tìm chất quyết định lượng ester tối đa',
      p('cd-het','Phản ứng ethanol + acetic acid theo tỉ lệ 1:1. Có 0,12 mol ethanol và 0,20 mol acid. Chất giới hạn là gì?','A',1,'chon',['Ethanol.','Acetic acid.','Cả hai vừa đủ.','Không thể xác định.']),b1,
      [p('kl-het1','Phản ứng 1:1: có 0,30 mol ethanol và 0,18 mol acid. Lượng ester lí thuyết là bao nhiêu mol?','0,18',1),p('kl-het2','Phản ứng 1:1: có 0,25 mol ethanol và 0,40 mol acid. Lượng ester lí thuyết là bao nhiêu mol?','0,25',1)],
      [p('ld-het1','Vì sao cần tìm chất giới hạn trước khi tính lượng ester lí thuyết?','B',1,'chon_ly_do',['Vì chất có khối lượng lớn luôn phản ứng hết.','Phản ứng dừng theo lượng chất giới hạn, chất còn dư không tạo thêm ester.','Vì H2SO4 đặc là chất tạo ester.','Vì thể tích hai chất luôn bằng nhau.']),p('ld-het2','Với phản ứng aA+bB→sản phẩm, cách so nào xác định chất giới hạn?','D',1,'chon_ly_do',['So khối lượng A và B, bỏ hệ số.','So thể tích mọi chất bất kể điều kiện.','Chỉ so n(A) và n(B) cho mọi phản ứng.','So n(A)/a và n(B)/b; giá trị nhỏ hơn quyết định lượng phản ứng.'])],
      [p('cg-het1','Theo phương trình 2A+B→C, có 0,30 mol A và 0,20 mol B. Lượng C lí thuyết (mol) là bao nhiêu?','0,15',1),p('cg-het2','Theo phương trình A+2B→C, có 0,30 mol A và 0,40 mol B. Lượng C lí thuyết (mol) là bao nhiêu?','0,2',1)],
      ['Chọn đúng chất giới hạn bằng số mol và hệ số.','n/ν là số mol phản ứng tối đa mà lượng chất đó cho phép, ν là hệ số trong phương trình.','Lấy chất dư làm mốc sẽ làm lượng ester lí thuyết quá lớn.','Đã cân bằng phương trình; ester hoá đơn chức đang xét có tỉ lệ acid:alcohol:ester=1:1:1.','Dùng n ester lí thuyết để đổi thành khối lượng rồi tính hiệu suất.','n ester lí thuyết=min(n acid,n ethanol)'],
      ['Đọc lại hệ số trước khi so lượng chất.','Lượng acid và alcohol cùng đơn vị mol mới so được; với 1:1 chọn số mol nhỏ hơn.','Ví dụ khác: acid 0,08 mol, alcohol 0,13 mol (1:1) thì chỉ tạo tối đa 0,08 mol ester, còn alcohol dư.'],
      ['Em so trực tiếp gam của hai chất.','Mỗi chất có khối lượng mol khác nhau nên ít gam chưa chắc ít mol.','Lượng ester lí thuyết sẽ sai dù phép chia hiệu suất ở bước sau đúng.','Tính từng số mol, chia cho hệ số rồi chọn lượng phản ứng nhỏ hơn.']),
    step(2,'So lượng thu được với mức tối đa',
      p('cd-h','Khối lượng ester thực tế m_tt=9 g và lí thuyết m_lt=15 g. Tính H (%).','60',2),b2,
      [p('kl-h1','Khối lượng ester thực tế m_tt=12 g và lí thuyết m_lt=20 g. Tính H (%).','60',2),p('kl-h2','Khối lượng ester thực tế m_tt=14 g và lí thuyết m_lt=25 g. Tính H (%).','56',2)],
      [p('ld-h1','Vì sao mẫu số của H phải là lượng ester lí thuyết từ chất giới hạn?','A',2,'chon_ly_do',['Đó là mức sản phẩm tối đa có thể tạo từ lượng chất ban đầu.','Đó là tổng khối lượng mọi chất trong bình.','Đó luôn là khối lượng chất dư.','Vì hiệu suất luôn lớn hơn 100%.']),p('ld-h2','Khi H tính ra lớn hơn 100% trong bài ester hoá này, em nên làm gì?','C',2,'chon_ly_do',['Chốt ngay vì phản ứng tạo thêm khối lượng.','Đổi dấu kết quả rồi nộp.','Kiểm lại đơn vị, chất giới hạn và thứ tự thực tế/lí thuyết.','Bỏ khối lượng mol khỏi phép tính.'])],
      [p('cg-h1','Khối lượng ester lí thuyết m_lt=40 g, hiệu suất H=80%. Tính khối lượng thực tế m_tt (g).','32',2),p('cg-h2','Khối lượng ester thực tế m_tt=15 g, hiệu suất H=75%. Tính khối lượng lí thuyết m_lt (g).','20',2)],
      ['Tính và tự kiểm hiệu suất phản ứng.','H là phần sản phẩm thực thu được so với mức tối đa; H×100% khi tỉ số chưa ở dạng phần trăm.','Đề hỏi hiệu quả tạo ester, không hỏi phần trăm ester trong toàn hỗn hợp.','So cùng một sản phẩm, cùng đơn vị; dùng khối lượng ester thu được, không tính cả dung môi/tạp chất.','Giữ chữ số trung gian, chỉ làm tròn kết quả cuối theo yêu cầu đề.','H=m thực tế/m lí thuyết×100%'],
      ['Đánh dấu lượng nào “thu được”, lượng nào “tối đa”.','Hiệu suất là một phần của mức tối đa: thực tế nằm trên, lí thuyết nằm dưới.','Ví dụ khác: tối đa 50 g, thực thu 35 g thì H=35/50×100%=70%. Em thử xác định hai lượng trong bài của mình.'],
      ['Em lấy lượng lí thuyết chia lượng thực tế.','Em đang tính nghịch đảo của phần sản phẩm thu được.','Kết quả có thể vượt 100%, không biểu diễn hiệu suất của bài này.','Đặt thực tế ở tử, lí thuyết ở mẫu; kiểm H trong khoảng 0–100%.']),
  ]
  const full=(id:string,va:number,ve:number,m:number,loai:'ghep_bai'|'kiem_chung')=>{
    const hoi=`Đun ${va} mL acetic acid (D=1,05 g/mL; M=60 g/mol) với ${ve} mL ethanol (D=0,789 g/mL; M=46 g/mol), có H2SO4 đặc xúc tác. Phương trình acid+ethanol→ethyl acetate+nước theo tỉ lệ 1:1:1:1. Thu được ${m} g ethyl acetate (M=88 g/mol). Tính hiệu suất phản ứng (%), làm tròn đến hàng phần mười.`
    const ans=(m/(Math.min(va*1.05/60,ve*.789/46)*88)*100).toFixed(1).replace('.',',')
    return {...p(id,hoi,ans,2),kyNang:skill,laTuongDuong:true,loai}
  }
  return {schemaVersion:1,qidGoc:q.qid,contentVersion:q.version,buoc,
    banGhepBai:[full('ghep1',12,20,12,'ghep_bai'),full('ghep2',18,16,13,'ghep_bai')],
    banKiemChung:[full('gap2a',16,12,11,'kiem_chung'),full('gap2b',14,22,17,'kiem_chung')]}
}
