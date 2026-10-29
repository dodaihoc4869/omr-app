import { khopPhanIII } from '../../src/lib/cham-so'
import { ngoaiKenhSo } from '../../src/lib/so-o-tra-loi-ngan'
import { BANG_HO_SO, BANG_MUA, docDongLop, envGhiRieng, gieoNho, gopDocD1, laBanGop, nhoTheoLuot, RAO_GHI, raoGhiD1 } from './doc-d1-theo-luot'
import {BANG_NGAY_CAP,EXP_MOI_VANG,MANH_REN_KHIEN,VANG_REN_KHIEN,ngayDatKhien} from '../../src/lib/kinh-te-game'
import {docCauHinhKichHoat} from './cnh-exp-adapter'
import {tramP08LenHienThi} from './cnh-exp-p08-hien-thi'

import {congExpVaoHoSo} from './exp-ho-so-game'
import {readGameScope} from './game-v2-reports'
import {boKeHoach7} from './goi-bai-7-nho'
import type {D1PreparedStatement,D1Result,Env,ExecutionContext} from './kieu'
import {viecPhu} from './viec-phu'
import {ganNiemChoCau} from './niem-cau'
import {coTheLaLuotMs,dapAnDaLo,napPhienNhanh,nhoBaoVe,nhoBienNhan,nhoCau,nhoDaLo,nhoEm,nhoPhien,phatTamSom,phienDuCau} from './cham-nhanh' // CHẤM NHANH «Kiểm tra» 28/10: đệm isolate cho dòng 1 của answer theo luồng
import {gameIdentity,parentPass} from './game-v2-auth'
import {readScope,syncIndex,protectedQuestions,docKhoiEm,doDayDu,laTuLuanPool,docCauTheoRef,loiCauDoi,type CauPool} from './game-v2-bank'
import {cauHopKhoi,type Khoi} from '../../src/lib/khoi-cau'
import {chanKhacKhoiEm} from './chan-khac-khoi'
import {qidThuHoiTrongLuot} from './thu-hoi-chien-dich'
import {lyDoThuong} from '../../src/game/than-thu-v2/ly-do-thuong'
import {nangLucBat} from './nang-luc-d1'
import {nganSachLuotBat,docNganSachConLai} from './ngan-sach-luot'
import {chonCauChoLuot,familyTuNhan} from './bo-chon-that'
import {giuCho,nhaCho} from './giu-cho'
import {PETS,ALIASES,OLD_SIX,learnedQuestionFilter,chooseSessionWithRoles,chooseLuotMoi,luotHomNay,SO_CAU_MOI_LUOT,publicQuestion,grade,advance} from '../../src/game/than-thu-v2/core'
import type {Attempt,Mastery,Mode,PrivateQuestion} from '../../src/game/than-thu-v2/core'
import type {ShieldState} from '../../src/game/than-thu-v2/shields'
import {khienConLai,khienRenChuaDung} from './exp-ho-so-game'
import {GHI_CHU_DUNG_HO_TRO,MANH_MOI_KHIEN,NGAY_DAT_MO_KHIEN_QUA,NT_HOAN_HAO} from './exp-cau-hinh'
import type {KhienRen} from './exp-hoc-tap'
import {syncAcademic,type Academic,academicDay} from './game-v2-academic'
import {laCauTuLuan,jsonLaTuLuan} from './cam-tu-luan'
import {tachSongSinh} from './loi-hoc-luat'
import {masteryTheoHoSo,qidChanHomNay,qidToiHanOn} from './game-v2-ho-so'
import {ghiSuKien} from './su-kien-hoc'
import {apXaoTheoRef,chonVeGoc,laQidChanDoan,rawLamLai,rawSo,type LamLaiRef} from './lam-lai-so' // 05/10: làm lại câu sai bằng bản khác (bản xáo chấm theo ref phiên; sổ ghi tc/xt/nv) — phần thuần, không vòng nạp
import {chamCauChanDoan,ghiBuocSaiChanDoan,vknCauChanDoan} from './chan-doan-buoc-sai' // 06/10: câu chẩn đoán bước sai (chấm câu nền, ghi bước sai khi em làm sai)
import {MUC_DICH_CHAN_DOAN} from './omni-kieu'
import {docCauLamHomNay} from './game-v2-cau-moi'
import {LUAT_CAP_MOI,dangChoNgayV5,ngayConThieuLenCap,type TranV5,type TruocSiet4,type TruocV5} from '../../src/lib/hap-thu-ngay'
import {chuyenDoiKhiMo,daExpGameHomNay,docTranHapThu,nhanExpGame} from './game-v2-hap-thu'
import {cheDo2,docCoHoa2} from './srs2-d1'
import {startDao2,startDao2CoVe,hoa2Action,LENH_HOA2} from './srs2-game'
import {omniBat,LENH_TAO_BANG_OMNI} from './omni-d1'
import {guiDdlSom} from './ddl-mot-lan'
import {SQL_GOI7} from './goi-bai-7-schema'
import {SQL_DONG_CO_HANH_TRINH} from './hanh-trinh-dong-co-schema'
import {SQL_HANH_TRINH_V5} from './hanh-trinh-v5-schema'
import {SQL_HT6} from './hanh-trinh-v6-schema'
import {lopCuaEm} from './bai-da-day'
import {boSungKichThuocDe,docDoGiayMot,phanSoCuaDo} from './do-giay-luot'
import {chuoiTruocTuHoSo,ntNgaySau,ntNgayTuHoSo,khongTinhTuDo,kimCuongDaXong,laPhienNguyenTu,lenhThuongTraLoi,tinhThuongTraLoi,type PhienNt,type RaThuongTraLoi} from './thuong-tra-loi' // THƯỞNG PHẠT 26/10: nguyên tử từng câu + kết bài (cùng lô chấm, 0 lệnh D1 thêm)
import {docSomOmniTraLoi,docTruocOmni,phienXetOmni,soOmniTuKetQuaCu,themVaoKetQua,xetOmniTraLoi,type SoOmni} from './omni-game'
import {TRAN_CAU_DAO_NGAY,demCauTrongNgay,tranCuaLoai,type LoaiTran,docCauBtvnChuaNop,docDauVaoLuot,docLuotDangCho,luotMoiBat,maiCho,tomTatLuot,moPhienLuotMoi} from './game-v2-luot'
import {ghiKhoanExpGame,docTongSoSom,docTruocKhoanGame,lenhKhoanExpGameGop,xongKhoanExpGameGop,type DocTruocKhoanGame,type KhoanGame,type KhoanGop} from './exp-d1'
import {expMotCau,expMotCauGame} from './exp-hoc-tap'
import {chonBanDat,docSoDoDat,luaChonTuChoices,qidTraSoDo,soDoBiTat} from './loi-giai-so-do'
import {BANG_SAN_SANG,SQL_SAN_SANG,docDauVaBan,dungDuoc,chuanBiSanSang,moChangSanSang,phienDaXong} from './san-sang'
import {ngayVn7} from './goi-bai-7-loi'
export interface Profile {nickname?:string;/** Đếm lượt đổi tên trong ngày VN (rename). */doiTen?:{ngay:string;lan:number};academic?:Academic;shields?:ShieldState;expMoi?:{daCong:number;manhDaTinh:number;ngayDat?:number;ngayNghi?:number};khienRen?:KhienRen;expGame?:{ngay:string;da:number;days?:Record<string,number>};hapThu?:{ngay:string;da:number};luatCap?:number;truocSiet?:unknown;pet:string;choice:boolean;legacy:unknown;cap:number;exp:number;wallet:number;earned:number;tower:number;mastery:Mastery[];cutover:string;season?:string;/** Luật v4: EXP chờ mốc cấp 10 (chưa đủ 21 ngày đạt). */choMoc?:number;/** Luật v4: `earned` lúc chuyển sang v4 — vàng chỉ đúc trên EXP kiếm sau mốc. */mocVang?:number;/** Dấu vết trước khi sang v4 (để lùi). */truocSiet4?:TruocSiet4;/** Luật v5: EXP tràn hôm nay + luỹ kế. */tranV5?:TranV5;/** Dấu vết trước khi sang v5 (để lùi). */truocV5?:TruocV5}
type Row={revision:number;json:string}
type Session={doan?:number;guardian?:string;guardianRound?:number;mode:Mode;questions:({qid:string;maDe:string;version:string;group:string;novel:boolean;role?:string;hoiThayKiem?:true}&LamLaiRef)[];created:number;/** Game Hóa 2.0 / Bi-a / OMNI 3 (vé thử thách, Trạm hồi phục) — chỉ đọc ở `answer`. */hoa2?:number;bia?:number;ve?:number;tram?:number;/** Huỷ chiến dịch (thầy 06/10, thu-hoi-chien-dich.ts): ISO lúc huỷ SỚM NHẤT ảnh hưởng lượt này — chỉ có khi lượt chứa câu của chiến dịch bị huỷ. */thuHoiLuc?:string}
const now=()=>new Date().toISOString()
/** Lỗi hết trần câu trong ngày, mang mã `het_tran` để màn game hiện lời cạnh nút và nút Về đảo (index.ts đưa `ma` vào phản hồi). */
const hetTran=(n:number)=>Object.assign(new Error(`Em đã hoàn thành ${n} câu hôm nay. Ngày mai quay lại nhận nhiệm vụ mới nhé.`),{ma:'het_tran'})
/** Hai câu ĐỌC của `loadProfile` (mùa + hồ sơ) — nơi gọi có thể gắn vào CUỐI một lô ghi của chính lượt mình (tối ưu 05/10: đọc lại hồ sơ cùng lô ghi). */
export const lenhDocHoSo=(env:Env,sbd:string)=>[env.DB.prepare("SELECT json FROM game_v2_settings WHERE key='season'"),env.DB.prepare('SELECT revision,json FROM game_v2_profile WHERE sbd=?').bind(sbd)]
/** Dòng thần thú CŨ của em (`than_thu`) — chỉ cần khi em CHƯA có hồ sơ game (lần đầu). Nhớ theo lượt (Gói R 15/10): `batDauDocSom` thấy lượt đọc hồ sơ không có dòng ⇒
 *  đọc NGAY (cùng đợt các lượt đọc sau hồ sơ, không chờ bước xác thực xong); `loadProfile` dùng lại đúng lượt ấy. Ngoài bản gộp ⇒ đọc thẳng như cũ. */
const docThanThuCu=(env:Env,sbd:string)=>nhoTheoLuot(env.DB,`than_thu|${sbd}`,()=>env.DB.prepare('SELECT du_lieu_json AS json FROM than_thu WHERE sbd=?').bind(sbd).first<{json:string}>(),['than_thu'])
/** `docSan` (chỉ-thêm, tối ưu 05/10): kết quả hai câu `lenhDocHoSo` nơi gọi VỪA chạy (cuối lô ghi của chính lượt này) ⇒ khỏi đọc lại; mọi bước sau y như cũ. */
export async function loadProfile(env:Env,sbd:string,docSan?:readonly {results:Row[]}[]):Promise<{profile:Profile;revision:number}>{
  // Cao điểm 01/10: hai SELECT tươi trong MỘT batch của CHÍNH request này, không đệm hồ sơ/vàng hay mùa.
  const [mua,hoSo]=(docSan??await env.DB.batch<Row>(lenhDocHoSo(env,sbd))) as readonly [{results:Row[]},{results:Row[]}]
  const reset=mua.results[0],row0=hoSo.results[0]
  gieoNho(env.DB,'mua',reset??null,BANG_MUA) // tối ưu 05/10: các phần sau của CHÍNH lượt này (EXP, Đoàn, đồng bộ học tập) khỏi đọc lại dòng mùa
  const season=reset?String(JSON.parse(String(reset.json)).id):''
  let row:Row|null|undefined=row0
  if(!row){
    const legacy=await docThanThuCu(env,sbd)
    let old:Record<string,unknown>={};try{old=JSON.parse(legacy?.json??'{}')}catch{/* Keep raw snapshot below. */}
    const id=String(old.idThanhThuChon??old.thanThuId??'');const pet=ALIASES[id]??id
    const profile:Profile={pet:PETS.some(p=>p.id===pet)?pet:'dat_quy',choice:!id||OLD_SIX.has(id)||!PETS.some(p=>p.id===pet),legacy:legacy?.json??null,
      cap:Math.max(1,Math.min(120,Number(old.capDo)||1)),exp:Math.max(0,Number(old.exp)||0),wallet:Math.max(0,Number(old.khoExp)||0),earned:0,tower:Math.max(1,Math.min(999,Number(old.tangThapCaoNhat)||1)),mastery:[],cutover:now()}
    if(season)Object.assign(profile,{pet:'dat_quy',choice:true,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],season,luatCap:LUAT_CAP_MOI,mocVang:0})
    // Gói R 15/10: tạo hồ sơ + ĐỌC LẠI DÒNG THẮNG trong CÙNG một lô (một đợt D1 thay hai; hai máy cùng mở lần đầu vẫn cùng thấy dòng thắng). Lỗi lô ⇒ ném như cũ.
    const [,doc]=await env.DB.batch<Row>([env.DB.prepare('INSERT OR IGNORE INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').bind(sbd,JSON.stringify(profile),now()),env.DB.prepare('SELECT revision,json FROM game_v2_profile WHERE sbd=?').bind(sbd)])
    row=doc?.results?.[0]??null
  }
  if(!row)throw new Error('Chưa mở được hồ sơ game.')
  const current=JSON.parse(row.json) as Profile
  if(season&&current.season!==season){
    const fresh:Profile={pet:'dat_quy',choice:true,legacy:current.legacy,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],cutover:now(),season,luatCap:LUAT_CAP_MOI,mocVang:0}
    const updated=await env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=?').bind(JSON.stringify(fresh),sbd,row.revision).run()
    if(!updated.meta.changes)return loadProfile(env,sbd)
    return {profile:fresh,revision:row.revision+1}
  }
  // ĐỢT 1 thần thú mỗi ngày: hồ sơ đã chơi theo luật cấp cũ được CHUYỂN ĐỔI LƯỜI khi mở (CAS theo revision; thua CAS/lỗi ⇒ dùng hồ sơ như đã đọc, cron quét nốt).
  if(current.luatCap!==LUAT_CAP_MOI){const doi=await chuyenDoiKhiMo(env,sbd,current,row.revision);if(doi)return doi}
  return {profile:current,revision:row.revision}
}
async function save(env:Env,sbd:string,p:Profile,rev:number){const r=await env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=?').bind(JSON.stringify(p),sbd,rev).run();if(!r.meta.changes)throw new Error('Hồ sơ vừa đổi trên thiết bị khác. Em tải lại hồ sơ.');return rev+1}
function visible(p:Profile,hapThuInfo?:{tran:number;lyDo?:string|null;soCauHomNay?:number;canCau?:number}){const {legacy:_,academic,expMoi,truocSiet:_ts,truocSiet4:_t4,truocV5:_t5,tranV5,mocVang:_mv,...rest}=p;const homNay=academicDay(now());const v4=p.luatCap===LUAT_CAP_MOI
  // LUẬT v5 (29/09 chiều): không ống nghiệm, không trần ngày. Gửi `choMoc` (ngăn chờ v4), số ngày cho mốc cấp, mốc ngày cấp sau, số ngày còn thiếu khi thanh đầy (`choNgay`),
  // EXP tràn hôm nay (`tranHomNay`: exp, vàng, mảnh đã đổi). `ngayMoCap10` giữ cho máy em cũ (= mốc ngày của cấp kế tiếp).
  const soNgayCap=Math.max(0,expMoi?.ngayDat??0)+Math.max(0,expMoi?.ngayNghi??0),capSau=Math.min(120,Math.max(1,p.cap)+1),tranHomNay=tranV5&&tranV5.ngay===homNay?{exp:tranV5.exp,vang:tranV5.vang,manh:tranV5.manh}:{exp:0,vang:0,manh:0}
  return {...rest,ongNghiem:v4?0:p.wallet,...(v4?{choMoc:p.choMoc??0,ngayMoCap10:BANG_NGAY_CAP[capSau]??0,ngayCapSau:BANG_NGAY_CAP[capSau]??0,soNgayCap,choNgay:dangChoNgayV5(p.cap,p.exp,soNgayCap)?ngayConThieuLenCap(p.cap,soNgayCap):0,tranHomNay,expMoiVang:EXP_MOI_VANG}:{hapThuHomNay:{da:p.hapThu&&p.hapThu.ngay===homNay?p.hapThu.da:0,tran:hapThuInfo?.tran??null,lyDo:hapThuInfo?.lyDo??null,...(hapThuInfo?.soCauHomNay!==undefined?{soCauHomNay:hapThuInfo.soCauHomNay,canCau:hapThuInfo.canCau}:{})}}),expGameHomNay:{da:daExpGameHomNay(p,homNay),tran:null},khienConLai:khienConLai(p),soNgayDat:expMoi?.ngayDat??0,renKhien:{gia:VANG_REN_KHIEN,duTru:0,manh:MANH_REN_KHIEN,donVi:'vang',ngayCan:ngayDatKhien((p.khienRen?.daRen??0)+1)},ngayMoKhienQua:NGAY_DAT_MO_KHIEN_QUA,khienRen:p.khienRen?{manh:p.khienRen.manh,daRen:p.khienRen.daRen,chuaDung:khienRenChuaDung(p),conLai:khienConLai(p),moiKhien:MANH_MOI_KHIEN}:undefined,academic:academic?{total:academic.total,today:academic.days[academicDay(now())]??0,lastGain:academic.lastGain,at:academic.at,dailyLimit:100}:undefined}}
async function attempts(env:Env,sbd:string){const r=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE sbd=? ORDER BY created_at DESC LIMIT 3000').bind(sbd).all<{json:string}>();return r.results.map(x=>(JSON.parse(x.json) as {attempt:Attempt}).attempt).reverse()}
/** Câu của lượt theo (ma_de, qid, version). Chỉ mục lệch nguồn ⇒ `docCauTheoRef` tự đồng bộ đúng tờ đó rồi tra lại (29/09); version tất định nên câu
 *  không đổi vẫn chấm được và lời giải là bản mới nhất. Câu thật sự đổi đề/đáp án hoặc bị rút ⇒ lỗi mã `cau_doi` (máy em bỏ qua câu / mở lượt mới). */
async function currentQuestion(env:Env,q:{qid:string;maDe:string;version:string},rowSom?:Promise<{json:string}|null>|null){
  // `rowSom` (tối ưu 05/10): dòng câu đã đọc sẵn cùng đợt với phiên (`SQL_CAU_THEO_PHIEN`, cùng điều kiện). Không thấy dòng ⇒ đường cũ (tra lại + tự đồng bộ tờ lệch).
  const row=rowSom?await rowSom:null
  let cau:PrivateQuestion|null
  if(row){try{cau=JSON.parse(row.json) as PrivateQuestion}catch{cau=null}}
  else cau=await docCauTheoRef(env,q)
  if(!cau)throw loiCauDoi()
  // CẤM RÚT TỰ LUẬN (21/09): lượt đã tạo trước lệnh cấm mà còn câu tự luận thì đóng như câu rút khỏi kho — không phục vụ, không chấm.
  // 15/10 CHỐT LÚC PHÁT: câu phần III bàn phím số không gõ đủ đáp số (`ngoaiKenhSo`) cũng đóng như vậy (chỉ mục cũ chưa mang cờ vẫn bị chặn).
  if(laCauTuLuan(cau)||ngoaiKenhSo(cau))throw loiCauDoi()
  return cau
}
/** Các qid trong LƯỢT mà hiện là TỰ LUẬN (lượt soạn trước lệnh cấm 21/09). MỘT truy vấn theo (qid, version); không thấy dòng ⇒ không kết tội. */
/** Câu của lượt cũ KHÔNG được phục vụ nữa: tự luận (21/09) và câu KHỐI CAO hơn khối em (Boss 21/09 — lượt soạn trước luật khối vẫn có thể chứa câu khối 12 cho em khối 11). */
async function qidTuLuanTrongLuot(env:Env,refs:{qid:string;version:string;maDe?:string}[],khoiEm:Khoi|null=null,rSom?:Promise<{results:{qid:string;version:string;json:string}[]}>):Promise<Set<string>>{
  const ra=new Set<string>();if(!refs.length)return ra
  // `rSom` (tối ưu 05/10): CÙNG câu đọc nhưng danh sách qid lấy thẳng từ JSON phiên trong SQL (`SQL_CAU_CUA_PHIEN`) ⇒ chạy được cùng đợt với lượt đọc phiên.
  const r=rSom?await rSom:await env.DB.prepare('SELECT q.qid,q.version,q.json FROM game_v2_question q WHERE q.qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(refs.map(x=>x.qid))).all<{qid:string;version:string;json:string}>()
  const can=new Set(refs.map(x=>`${x.qid}|${x.version}`))
  for(const x of r.results)if(can.has(`${x.qid}|${x.version}`)&&jsonLaTuLuan(x.json))ra.add(x.qid)
  const giu=new Set(await chanKhacKhoiEm(env,'luot_cu',{khoiEm},refs));for(const x of refs)if(!giu.has(x))ra.add(x.qid) // LUẬT THẦY 05/10: cổng cuối như lúc mở lượt — chỉ câu ĐÚNG khối em (khác khối / không rõ / mâu thuẫn ⇒ không phục vụ)
  return ra
}
/** TƯƠNG THÍCH máy em đang sống (Boss 21/09): màn Đảo cũ chỉ biết vai yeu|toi_han|lap|thu_thach ⇒ `role` trả tập cũ (moi → lap, trum → thu_thach); `roleV2` = vai THẬT cho màn mới. */
const vaiChoMay=(v?:string)=>({role:v==='moi'?'lap':v==='trum'?'thu_thach':v,roleV2:v})
/** Lượt Đảo: kho chỉ gồm dạng và kiến thức có bằng chứng từ chính em. */
async function startLuotMoi(env:Env,sbd:string,p:Profile,b:Record<string,unknown>,action:string):Promise<Record<string,unknown>>{
  const tNow=Date.now(),ngay=academicDay(now())
  const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
  const scope=await readScope(env,sbd)
  const dangLop=[...new Set(scope.evidence.map(e=>e.dang).filter((d):d is string=>!!d))]
  const t=await docTranHapThu(env,sbd,ngay)
  const dauVao=await docDauVaoLuot(env,sbd,ngay,tNow,t.dat)
  const info=luotHomNay(dauVao)
  const dayStart=new Date(ngay+'T00:00:00+07:00').toISOString()
  const count={n:await demCauTrongNgay(env,sbd,dayStart,'dao')} // trần ĐẢO riêng (36), không tính lượt của Đoàn
  const remaining=Math.max(0,TRAN_CAU_DAO_NGAY-count.n)
  const history=await attempts(env,sbd),mastery=await masteryTheoHoSo(env,sbd,p.mastery)
  const cho=maiCho(dangLop,mastery,tNow),tom=tomTatLuot(info,dauVao.soLuotDaLam)
  // Khối của em CHỈ đọc MỘT LẦN (Boss 22/09, lượt 2): dùng lại cho nhánh lượt-đang-chờ VÀ chooseLuotMoi bên dưới — trước đây gọi docKhoiEm HAI LẦN khi lượt chờ tồn tại nhưng bị bỏ hết câu (tự luận/lệch khối).
  const khoiEm=await docKhoiEm(env,sbd)
  if(action==='start'){
    // Lượt em vừa mở mà chưa trả lời câu nào: trả lại CHÍNH lượt ấy (không bốc lại câu, không tốn lượt).
    const dangCho=await docLuotDangCho(env,sbd,tNow)
    if(dangCho){
      try{
        const old=JSON.parse(dangCho.json) as Session;const tuLuan=await qidTuLuanTrongLuot(env,old.questions,khoiEm);const qs=[]
        // Thầy có thể giao BTVN SAU khi lượt này đã bốc câu: câu nào nay nằm trong bài em chưa nộp ⇒ bỏ lượt chờ, mở lượt mới (không trả lại câu có thể lộ đáp án).
        const chanBtvn=await docCauBtvnChuaNop(env,sbd),chanCu=await protectedQuestions(env);for(const key of control.blocked)chanCu.add(key)
        const daHocCu=learnedQuestionFilter(scope.evidence,chanCu),theoQid=new Map(scope.pool.map(q=>[q.qid,q]));if(old.questions.some(ref=>{const q=theoQid.get(ref.qid);return chanBtvn.has(ref.qid)||chanBtvn.has(ref.group)||!cauHopKhoi(khoiEm,q??ref)||!q||!daHocCu(q)})){await env.DB.prepare('DELETE FROM game_v2_session WHERE id=? AND sbd=?').bind(dangCho.id,sbd).run();return startLuotMoi(env,sbd,p,b,action)} // lượt chờ chưa trả lời câu nào: bỏ hẳn rồi tính lại từ đầu (không mất lượt, số lượt đúng)
        for(const ref of old.questions){if(tuLuan.has(ref.qid))continue;qs.push({...publicQuestion(await currentQuestion(env,ref)),...vaiChoMay(ref.role)})}
        if(qs.length)return {ok:true,id:dangCho.id,questions:qs,missing:scope.missing,luot:tom,maiCho:cho}
      }catch{/* câu đã đổi/rút khỏi kho: mở lượt mới */}
    }
  }
  if(action==='recommendations'&&(!remaining||!info.luotTiepTheo))return {ok:true,dailyUsed:count.n,tranNgay:TRAN_CAU_DAO_NGAY,suggestions:[],remaining,luot:tom}
  if(!info.luotTiepTheo)return {ok:true,questions:[],het:true,luot:tom,maiCho:cho,message:'Hôm nay em đã dùng hết lượt thần thú. Mai thú chờ em.'}
  if(!remaining)throw hetTran(TRAN_CAU_DAO_NGAY)
  const blocked=await protectedQuestions(env)
  for(const key of control.blocked)blocked.add(key)
  for(const qid of await qidChanHomNay(env,sbd,tNow))blocked.add(qid)
  for(const x of await docCauBtvnChuaNop(env,sbd))blocked.add(x)
  // Chỉ nhận câu ĐỦ `dang` và `mucDo` (hàm chọn coi câu thiếu mức là dễ nhất), đã duyệt, không tự luận, không bị chặn, trong phạm vi thầy đặt.
  const homNay=await docCauLamHomNay(env,sbd,dayStart,ngay)
  const groupByQid=new Map(scope.pool.map(q=>[q.qid,q.group]))
  for(const qid of [...homNay]){const group=groupByQid.get(qid);if(group)homNay.add(group)}
  const daHoc=learnedQuestionFilter(scope.evidence,blocked)
  const poolDaHoc=scope.pool.filter(q=>q.reviewed&&!laTuLuanPool(q)&&!!q.dang&&!!q.mucDo&&daHoc(q)&&(control.types.length===0||control.types.includes(q.dang))&&(typeof b.dang!=='string'||q.dang===b.dang))
  const eligible=poolDaHoc.filter(q=>!homNay.has(q.qid)&&!homNay.has(q.group))
  const lt=info.luotTiepTheo
  const chonGoc=chooseLuotMoi(eligible,scope.evidence,history,mastery,{loai:lt.loai,cap:p.cap,now:tNow,thuong:lt.thuong,blocked,soCau:Math.min(SO_CAU_MOI_LUOT,remaining),khoiEm,dueQids:await qidToiHanOn(env,sbd,ngay)})
  // CNH-1.0 P05/T09 (02 §5.2 + §7.2): lượt này CHỈ lấy phần NGÂN SÁCH CÒN LẠI của ngày (mọi màn dùng chung
  // một ngân sách), và cắt theo thứ tự TẤT ĐỊNH (điểm §7.2 → hash `student|day|plan_version|qid|version`).
  // Cờ `cau_hinh.ngan_sach_luot` MẶC ĐỊNH TẮT ⇒ đường cũ nguyên vẹn.
  let chon=chonGoc, nganSachThieu:{conLaiGiay:number;soCauBoQua:number}|undefined, lyDoLuot:Record<string,number>|undefined, hoanLuot:{deferredCount:number;overBudgetSeconds:number}|undefined, giuDangMo:Record<string,string>|undefined
  if(await nganSachLuotBat(env)){
    // BỘ CHỌN CHUNG §7.1 chạy trên TOÀN BỘ tập ứng viên HỢP LỆ (`eligible`) — RV05: KHÔNG đưa cho bộ chọn mới
    // một tập đã bị `chooseLuotMoi` cắt sẵn theo thuật toán cũ (làm thế thì trần 6 câu quyết định ai được xét).
    const ns=await docNganSachConLai(env,sbd,ngay)
    const vaiTheoQid=new Map(chonGoc.map(x=>[x.q.qid,x.role]))
    const nhomTheoQid=new Map(eligible.map(q=>[q.qid,q.group]))
    const kq=await chonCauChoLuot(env,eligible.map(q=>({qid:q.qid,version:q.version,part:q.phan as 'I'|'II'|'III',mucDo:q.mucDo,group:q.group,dangKey:q.dang??q.group,skillIds:Array.isArray(q.kienThuc)?q.kienThuc as string[]:[],familyId:familyTuNhan(q)})),
      {sbd,ngay,nowMs:tNow,mastery,conLaiGiay:ns&&ns.nganSachGiay>0?ns.conLaiGiay:null,tranCau:Math.min(SO_CAU_MOI_LUOT,remaining),mauTocDo:ns?.mau,phienBanKeHoach:ns?.phienBanKeHoach})
    const groupsCua=new Set(scope.evidence.map(e=>e.group))
    chon=kq.chon.flatMap(v=>{const q=eligible.find(x=>x.qid===v.qid);return q?[{q,role:vaiTheoQid.get(v.qid)??'moi',dai:q.phan!=='I',moi:!groupsCua.has(q.group)}]:[]})
    lyDoLuot=Object.keys(kq.lyDo).length?kq.lyDo:undefined
    if(kq.deferredCount)hoanLuot={deferredCount:kq.deferredCount,overBudgetSeconds:kq.overBudgetSeconds}
    if(ns&&ns.nganSachGiay>0&&kq.deferredCount)nganSachThieu={conLaiGiay:ns.conLaiGiay,soCauBoQua:kq.deferredCount}
    // RV02: câu đã phát cho NHIỆM VỤ CÒN HIỆU LỰC (dù lease thiết bị đã hết) ⇒ trả lại để em RESUME, KHÔNG phát mới.
    if(kq.dungLaiTask.size)giuDangMo=Object.fromEntries(kq.dungLaiTask)
    void nhomTheoQid
  }
  chon=await chanKhacKhoiEm(env,'dao',{sbd,khoiEm},chon,{cauCua:x=>x.q}) // LUẬT THẦY 05/10: cổng cuối (cả gợi ý `recommendations`) — chỉ câu đúng khối em
  if(action==='recommendations')return {ok:true,dailyUsed:count.n,tranNgay:TRAN_CAU_DAO_NGAY,suggestions:chon.map(x=>({title:x.q.tenDang||'Ôn kiến thức đã học',source:x.q.maDe,part:x.q.phan})),remaining,luot:tom}
  // P05 mục 4 + RV01/RV02: GIÀNH CHỖ nguyên tử theo ĐƠN VỊ NỘI DUNG (`content_group`) cho các câu của lượt;
  // nhiệm vụ CÒN hiệu lực (dù hết lease thiết bị) thì KHÔNG bị chiếm — trả `giuChoDangMo` để em RESUME.
  const idLuot=crypto.randomUUID()
  let giuMat:string[]=[]
  if(await nganSachLuotBat(env)&&chon.length){
    const g=await giuCho(env,{sbd,ngay,taskId:idLuot,qids:chon.map(x=>x.q.qid),nowMs:tNow,nguon:'game',
      nhomTheoQid:new Map(chon.map(x=>[x.q.qid,x.q.group])),hanTaskGiay:2*3600})
    if(g.thua.length){giuMat=g.thua;const thang=new Set(g.thang);chon=chon.filter(x=>thang.has(x.q.qid))}
    if(g.dangMo.size)giuDangMo=Object.fromEntries(g.dangMo)
  }
  if(!chon.length){
    if(nganSachThieu&&chonGoc.length)return {ok:true,questions:[],lyDo:'het_ngan_sach_ngay',luot:tom,maiCho:cho,missing:scope.missing,nganSach:nganSachThieu,message:'Hôm nay em đã dùng gần hết thời gian học. Em làm nốt việc đang mở hoặc quay lại buổi sau nhé.'}
    const lyDo=eligible.length?'chi_con_cau_qua_bac':poolDaHoc.length?'het_cau_moi_hom_nay':'kho_trong';return {ok:true,questions:[],lyDo,luot:tom,maiCho:cho,missing:scope.missing,message:lyDo==='het_cau_moi_hom_nay'?'Hôm nay em đã làm hết câu phù hợp trong kho. Mai em quay lại nhé.':lyDo==='chi_con_cau_qua_bac'?'Các câu còn lại cao hơn mức em đang làm ở dạng đó. Em làm thêm bài Thầy giao rồi quay lại nhé.':'Chưa có câu thuộc phần em đã học. Em hoàn thành bài Thầy giao rồi quay lại nhé.'}
  }
  const id=idLuot,groups=new Set(scope.evidence.map(e=>e.group))
  const session:Session={mode:'adventure',created:Date.now(),questions:chon.map(x=>({qid:x.q.qid,maDe:x.q.maDe,version:x.q.version,group:x.q.group,novel:!groups.has(x.q.group),role:x.role}))}
  // CHỐNG PHÁT TRÙNG KHI RETRY/CẠNH TRANH (thầy 24/09, lát cắt 1): mở phiên CHỈ KHI em chưa có lượt chờ, trong MỘT câu lệnh
  // (cùng vị từ `docLuotDangCho`). Hai yêu cầu song song ⇒ đúng MỘT bộ câu được phát; yêu cầu thua quay lại dưới đây và trả ĐÚNG lượt vừa mở.
  if(!await moPhienLuotMoi(env,id,sbd,JSON.stringify(session),Date.now()))return startLuotMoi(env,sbd,p,b,action)
  const day=await doDayDu(env,chon.map(x=>x.q as CauPool)) // pool là bản NHẸ: chỉ các câu ĐƯỢC CHỌN mới nạp đầy đủ để đưa cho em
  return {ok:true,id,questions:chon.map((x,i)=>({...publicQuestion(day[i]!),...vaiChoMay(x.role)})),missing:scope.missing,sourceCases:[...new Set(scope.evidence.map(e=>e.ca))].slice(0,3),...(nganSachThieu?{nganSach:nganSachThieu}:{}),...(giuMat.length?{giuChoThua:giuMat}:{}),...(giuDangMo?{giuChoDangMo:giuDangMo}:{}),...(lyDoLuot?{chonLyDo:lyDoLuot}:{}),...(hoanLuot?{hoanLuot}:{}),luot:{...tomTatLuot({...info,conLai:Math.max(0,info.conLai-1)},dauVao.soLuotDaLam+1),luotDangMo:lt},maiCho:cho}
}
/** Promise bắt đầu sớm: đánh dấu "đã bắt" để lỗi không thành lỗi treo — nơi dùng vẫn `await` và nhận đúng lỗi. */
const som=<T,>(p:Promise<T>)=>{p.catch(()=>{});return p}
/** Lệnh game được chạy lượt đọc "cổng đóng băng" (reset) SONG SONG khi đệm cổng vừa hết hạn (index.ts, tối ưu 05/10): chỉ các lệnh CHỈ chạm D1 qua `env.DB`
 *  (rào ghi chặn được mọi lệnh ghi). */
export const laLenhCongSongSong=(action:string):boolean=>['hoc-tap-gap','hoc-tap-dem','hoc-tap-lam-lai','hoc-tap-kiem-start','hoc-tap-kiem-nop','hoc-tap-sanh','hoc-tap-start','hoc-tap-cau-da-lam','hoc-tap-cau-chi-tiet','sync','resume','start','answer','complete','profile','recommendations','academic-sync','so-tay','progress-history'].includes(action)||LENH_HOA2.has(action)
export async function gameV2(env:Env,action:string,b:Record<string,unknown>,ctx?:ExecutionContext):Promise<Record<string,unknown>> {
  // Rào ghi (index.ts, tối ưu 05/10): đệm cổng đóng băng vừa hết hạn ⇒ lượt đọc cổng chạy song song, mọi lệnh GHI của lệnh này chờ cổng. Lệnh nội bộ
  // (Đoàn gọi `answer`) dùng lại đúng bản gộp đọc của lượt ngoài (đã có rào) ⇒ không bọc lần nữa.
  const rao=(env as unknown as Record<symbol,unknown>)[RAO_GHI] as Promise<unknown>|undefined
  env = { ...env, DB: gopDocD1(rao&&!laBanGop(env.DB)?raoGhiD1(env.DB,rao):env.DB, action !== 'hoa2-sanh') }
  // CHỐT ĐÁP ÁN (29/09): cờ cửa P08 cho phần trám bên dưới đọc CÙNG đợt đầu (đệm 15 s dùng chung lượt đọc đang bay) — không thêm một đợt D1 ở cuối.
  if(action==='answer')void docCauHinhKichHoat(env,true).catch(()=>null)
  const r=await gameV2Tho(env,action,b,ctx)
  // CNH-1.0 P08 (Cline 25/09): TRÁM số ví/trạng thái P08 lên MỌI bản hiển thị có `profile` — MỘT chỗ phủ hết
  // các nhánh trả `visible(p)` bên dưới. CHỈ sửa bản hiển thị (không đụng hồ sơ đã lưu). Cửa ĐÓNG (mặc định)
  // hoặc em chưa chuyển đổi ⇒ `tram` = null ⇒ giữ nguyên bản cũ. Phản hồi của lệnh P08 đã có `p08` ⇒ bỏ qua
  // (số đã đúng, và đọc lại ngay sau ghi có thể lệch bản sao).
  if(r&&r.ok===true&&r.profile&&!r.p08){
    const tram=await tramP08LenHienThi(env,await gameIdentity(env,b)).catch(()=>null)
    if(tram)Object.assign(r.profile as Record<string,unknown>,tram)
  }
  return r
}
/** Chốt đáp án (29/09): bốn lượt đọc của `answer` không cần hồ sơ ⇒ bắt đầu sớm, song song. Promise bị từ chối được "đánh dấu đã bắt" để không thành lỗi treo;
 *  nơi dùng vẫn `await` từng cái theo đúng thứ tự cũ nên lỗi báo cho em không đổi. */
function docTruocAnswer(env:Env,sbd:string,b:Record<string,unknown>){
  const id=String(b.session??''),qid=String(b.qid??'')
  return {
    session:som(env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id,sbd).first<{json:string}>()),
    blocked:som(protectedQuestions(env)),
    control:som(readGameScope(env,sbd)),
    previous:som(env.DB.prepare('SELECT json FROM game_v2_attempt WHERE id=? AND sbd=?').bind(`${id}|${qid}`,sbd).first<{json:string}>()),
    // Tối ưu 05/10: câu của lượt (đúng câu `currentQuestion` tra: ma_de/version lấy từ JSON phiên ngay trong SQL) — cùng đợt với phiên, khỏi một đợt sau.
    // Câu song sinh (qid ảo) / câu CHẨN ĐOÁN (06/10, qid `nen:…` — không có trong kho) ⇒ không đọc sớm (đường cũ tự lo).
    cau:tachSongSinh(qid).songSinh===null&&!laQidChanDoan(qid)?som(env.DB.prepare(SQL_CAU_THEO_PHIEN).bind(id,sbd,qid,qid).first<{json:string}>()):null,
    // Phần ĐỌC của khoản EXP câu đúng (cấu hình EXP, mùa, cờ P08, khoá đã có) — đọc SẴN cùng đợt (chưa biết đúng/sai; câu sai ⇒ bỏ không dùng, không ghi gì).
    // Trước: đọc sau khi chấm, và lô ghi chấm phải chờ thêm một đợt.
    exp:som(docTruocKhoanGame(env,sbd,[`cau_game|${id}|${qid}`,`thuthach|${qid}`])),
    // Tối ưu 05/10: TỔNG SỔ EXP đọc sẵn CÙNG đợt (exp-d1.ts `docTongSoSom`: một câu, mốc mùa lấy trong SQL) để bước cộng vào hồ sơ của câu đúng đi CÙNG
    // lô chấm (`lenhKhoanExpGameGop`) — trước: một lô riêng ở đợt sau. Câu sai / EXP tắt ⇒ bỏ không dùng, không ghi gì.
    tong:som(docTongSoSom(env,sbd,Date.now())),
    // LỜI GIẢI KIỂU SƠ ĐỒ (26/10, loi-giai-so-do.ts): bản ĐẠT của câu đọc sẵn CÙNG đợt đầu (một SELECT theo khoá chính, gộp chung lô đọc của lượt) —
    // kèm vào phản hồi SAU chấm dưới tên `soDo`, không thêm vòng. Công tắc tắt / câu chẩn đoán ⇒ không đọc.
    soDo:soDoBiTat(env)||laQidChanDoan(qid)?null:som(docSoDoDat(env.DB,qidTraSoDo(qid))),
  }
}
/** Câu ĐẦY ĐỦ của câu `qid` trong lượt `id` — như `SQL_THEO_REF` (game-v2-bank.ts) với (ma_de, version) của câu ĐẦU TIÊN mang qid ấy trong JSON phiên. */
const SQL_CAU_THEO_PHIEN=`SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
  JOIN (SELECT json_extract(j.value,'$.maDe') AS ma_de,json_extract(j.value,'$.version') AS version FROM game_v2_session s, json_each(s.json,'$.questions') j
    WHERE s.id=? AND s.sbd=? AND json_extract(j.value,'$.qid')=? ORDER BY j.key LIMIT 1) r
  WHERE q.ma_de=r.ma_de AND q.qid=? AND q.version=r.version AND COALESCE(d.da_xoa,0)=0`
/** Câu của MỘT phiên (theo qid trong JSON phiên) — cùng kết quả với câu đọc theo danh sách qid của `qidTuLuanTrongLuot`, nhưng không cần đọc phiên trước. */
const SQL_CAU_CUA_PHIEN="SELECT q.qid,q.version,q.json FROM game_v2_question q WHERE q.qid IN (SELECT json_extract(j.value,'$.qid') FROM game_v2_session s, json_each(s.json,'$.questions') j WHERE s.id=? AND s.sbd=?)"
/** `complete` (tối ưu 05/10): phiên, các câu đã trả lời, khối em, câu của phiên (lọc tự luận) và cờ ngân sách lượt là các lượt ĐỌC không phụ thuộc hồ sơ ⇒
 *  bắt đầu CÙNG đợt với hồ sơ (trước: năm đợt nối tiếp sau hồ sơ). Nơi dùng vẫn `await` đúng thứ tự cũ ⇒ lỗi báo cho em không đổi. */
function docTruocComplete(env:Env,sbd:string,b:Record<string,unknown>){
  const id=String(b.session??'')
  return {
    session:som(env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id,sbd).first<{json:string}>()),
    attempts:som(env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=?').bind(id,sbd).all<{json:string}>()),
    khoi:som(docKhoiEm(env,sbd)),
    cauPhien:som(env.DB.prepare(SQL_CAU_CUA_PHIEN).bind(id,sbd).all<{qid:string;version:string;json:string}>()),
    nganSach:som(nganSachLuotBat(env)),
  }
}
/** Số lần đổi tên thần thú tối đa mỗi ngày (máy chủ đếm). */
/**
 * CÁC LƯỢT ĐỌC ĐẦU của một lệnh game (tối ưu 05/10) — CHỈ ĐỌC, không ghi gì, không trả gì cho em: hồ sơ (mùa + hồ sơ), phần đọc riêng của lệnh
 * (`answer`/`complete`/Đoàn), cờ Hoá 2.0/Bi-a + lớp em, ô Bi-a của Sảnh. `gameV2Tho` bắt đầu chúng NGAY khi token qua bước kiểm không chạm D1
 * (`gameIdentity(…, khiDaKy)`), tức CÙNG đợt với lượt đọc mật khẩu (khi đệm xác thực 60 s trượt); mọi việc khác chỉ chạy sau khi xác thực xong.
 */
function batDauDocSom(env:Env,action:string,b:Record<string,unknown>,sbd:string){
  // Hồ sơ (mùa + hồ sơ, hai SELECT của `loadProfile`) đọc ngay; dòng mùa gieo vào sổ nhớ của lượt để EXP/Đoàn/đồng bộ học tập khỏi đọc lại.
  // Nhớ theo lượt: lệnh `answer` NỘI BỘ của Đoàn (cùng request, chưa ghi gì từ lúc này) dùng lại đúng lượt đọc này thay vì đọc hồ sơ lần nữa.
  const hoSoSom=som(nhoTheoLuot(env.DB,`hoso|${sbd}`,()=>env.DB.batch<Row>(lenhDocHoSo(env,sbd)),BANG_HO_SO))
  gieoNho(env.DB,'mua',hoSoSom.then(r=>r[0]?.results[0]??null),BANG_MUA)
  // Gói R 15/10: em CHƯA có hồ sơ game (lần đầu) ⇒ dòng thần thú cũ (`loadProfile` cần để tạo hồ sơ) đọc ngay khi lượt đọc hồ sơ về — không chờ bước xác thực. Chỉ đọc.
  void hoSoSom.then(r=>{if(!r[1]?.results[0])void docThanThuCu(env,sbd).catch(()=>null)},()=>{})
  // CHỐT ĐÁP ÁN (thầy 29/09 "bấm chốt đáp án nó chấm 1 lúc mới được"): lượt, câu bảo vệ ca thi, phạm vi thầy đặt, bản chấm cũ KHÔNG phụ thuộc hồ sơ ⇒
  // bắt đầu CÙNG đợt với loadProfile (trước: 5 đợt nối tiếp). Nhánh `answer` vẫn await đúng thứ tự cũ ⇒ lỗi nào báo trước vẫn như cũ.
  const truocAnswer=action==='answer'?docTruocAnswer(env,sbd,b):null
  const truocComplete=action==='complete'?docTruocComplete(env,sbd,b):null
  // OMNI 3 (tối ưu 05/10): máy em gửi `msLam` (chỉ khi OMNI áp cho em) ⇒ các lượt ĐỌC OMNI của lần trả lời bắt đầu CÙNG đợt hồ sơ (nhớ theo lượt, omni-game.ts).
  if(action==='answer')docSomOmniTraLoi(env,sbd,action,b)
  // CAO ĐIỂM 20h–24h (29/09): cờ Game Hóa 2.0 (đệm 15 s dùng chung, lượt đọc đang bay được chia sẻ) đọc CÙNG đợt với hồ sơ thay vì một đợt riêng sau đó.
  if(LENH_HOA2.has(action)||action==='start'||action==='recommendations')void docCoHoa2(env).catch(()=>null)
  // Tối ưu 05/10: "em có ở Hoá 2.0" (cờ đệm + lớp của em, nhớ theo lượt) hỏi CÙNG đợt với hồ sơ — trước: một đợt nối tiếp sau hồ sơ. Chỉ ĐỌC.
  // Lớp của em (cờ Hoá 2.0 theo lớp) vào CÙNG lô đọc với hồ sơ — kể cả khi cờ còn đang được đọc (một dòng theo khoá chính, không thêm lượt D1).
  // `start`/`recommendations` Đảo cũng hỏi "em có ở Hoá 2.0" ngay sau hồ sơ ⇒ đọc sẵn lớp cùng lô (nhớ theo lượt, `cheDo2` dùng lại).
  if(LENH_HOA2.has(action)||action==='start'||action==='recommendations')void docDongLop(env.DB,sbd).catch(()=>null)
  const cheDo2Som=LENH_HOA2.has(action)?som(cheDo2(env,sbd)):null
  // "Câu đã làm" + chi tiết câu (tối ưu vòng 2, 06/10): hai lệnh CHỈ ĐỌC ⇒ chạy luôn CÙNG đợt với hồ sơ thần thú (trước: chờ hồ sơ xong mới bắt đầu — một đợt D1 nối tiếp thừa). Em chưa chọn thần thú / chưa ở
  // Hoá 2.0 ⇒ kết quả bỏ không dùng (đường kiểm bên dưới giữ nguyên thứ tự và lời cũ); lỗi của nó chỉ tới đúng chỗ `await` như cũ.
  const cauDaLamSom=action==='hoa2-cau-da-lam'||action==='hoa2-cau-chi-tiet'?som(hoa2Action(env,sbd,action,b)):null
  return {sbd,hoSoSom,truocAnswer,truocComplete,cheDo2Som,cauDaLamSom}
}
/** Nhóm bảng (tạo lúc chạy) mà Sảnh / Mở chặng học tập cần: Gói 7, động cơ Hành trình v4/v5/v6, OMNI 3 — tên nhóm + lệnh ĐÚNG như nơi tạo của từng nhóm. */
const DDL_LUOT_HOC:readonly (readonly [string,readonly string[]])[]=[[BANG_SAN_SANG,SQL_SAN_SANG],['goi_bai_7_v1',SQL_GOI7],['hanh_trinh_v4',SQL_DONG_CO_HANH_TRINH],['hanh_trinh_v5',SQL_HANH_TRINH_V5],['hanh_trinh_v6',SQL_HT6],['omni_3_0510',LENH_TAO_BANG_OMNI]]
/**
 * ĐẦU LƯỢT của Sảnh / Mở chặng học tập (Gói R 15/10 — luật thầy 13/10 "sửa xong máy chủ phải nhanh hơn"), gọi khi token đã qua kiểm chữ ký/hạn (token giả bị chặn
 * trước mọi lượt D1 như cũ), CÙNG đợt với lượt đọc mật khẩu: (1) lệnh tạo bảng của cả lượt gửi ngay, song song, thẳng D1 gốc (`guiDdlSom` — isolate mới: trước
 * 5 đợt nối tiếp rải trong lượt); (2) các lượt CHỈ ĐỌC đầu tiên của lượt: lịch kiểm tra riêng + cờ Gói 7 (một câu đọc nhóm cờ, đệm 15 s), danh sách gói (khi bảng
 * gói đã sẵn — `docDanhSachGoiSom7`), lớp của em (đệm 30 s dùng chung — `lapGoi7` dùng lại đúng lượt đọc đang bay). Không ghi dữ liệu, không trả gì trước khi
 * xác thực xong; mọi kết quả chỉ dùng sau `await` xác thực, lỗi nổi lên đúng chỗ `await` cũ.
 */
function batDauHocTapSom(env:Env,sbd:string,action=''){
  guiDdlSom(env,DDL_LUOT_HOC)
  void lopCuaEm(env,sbd).catch(()=>null)
  const kiem=som(import('./kiem-tra-ca-nhan').then(kt=>kt.docKtCn(env,sbd,Date.now(),true)))
  // Bọc trong đối tượng: lời hứa đọc gói giữ NGUYÊN (không bị `then` mở ra) để nơi gọi truyền tiếp như `docDanhSachGoiSom7`.
  const dsGoi=som(import('./goi-bai-7').then(g7=>({p:g7.docDanhSachGoiSom7(env,sbd)})))
  // SẴN SÀNG (27/10, san-sang.ts): dấu + bản sẵn của em đọc CÙNG đợt này (chỉ đọc) — khớp ⇒ Sảnh / Mở chặng trả ngay, không lập kế hoạch trên đường chờ.
  const sanSang=som(docDauVaBan(env,sbd,Date.now()))
  // Chuỗi ngày theo bài của Sảnh (chỉ đọc; cờ tắt ⇒ null) cũng bắt đầu ngay — đường Sảnh dùng bản sẵn khỏi chờ thêm một đợt.
  const chuoi=action==='hoc-tap-sanh'?som(import('./chuoi-ngay-bai-d1').then(m=>m.chuoiBaiNeuBat(env,sbd,Date.now()),()=>null)):null
  return {sbd,kiem,dsGoi,sanSang,chuoi}
}
async function gameV2Tho(env:Env,action:string,b:Record<string,unknown>,ctx?:ExecutionContext):Promise<Record<string,unknown>> {
  // MÁY EM BÁO RỜI APP GIỮA CHỪNG ⇒ lập lại bản sẵn Sảnh + chặng NỀN (san-sang.ts `chuanBiKhiThoat`). Chỉ cần chữ ký + hạn của token (0 đợt D1 ở đường chờ), không đọc / ghi gì của em ngoài bảng lập sẵn.
  if(action==='hoc-tap-chuan-bi'){
    const {gameSbdDaKy}=await import('./game-v2-auth')
    const sbd=await gameSbdDaKy(env,b)
    return (await import('./san-sang')).chuanBiKhiThoat(envGhiRieng(env),sbd,ctx)
  }
  // Tối ưu 05/10: lượt kiểm mật khẩu (khi đệm 60 s trượt) chạy CÙNG đợt với các lượt ĐỌC đầu của lệnh (`batDauDocSom`, gọi khi token đã qua kiểm chữ ký/hạn —
  // token giả bị chặn trước mọi lượt D1 như cũ). Không ghi gì, không trả gì trước khi xác thực xong. `gameIdentity` bị thay (test) ⇒ đọc sau xác thực như cũ.
  const giu:{ds:ReturnType<typeof batDauDocSom>|null;hocTap?:ReturnType<typeof batDauHocTapSom>;kiem?:{sbd:string;p:ReturnType<typeof import('./kiem-tra-ca-nhan')['docKtCn']>};dem?:{sbd:string;p:Promise<Record<string,unknown>>}}={ds:null}
  // NỘP TỨC THÌ (thầy 27/10 «bấm nút nộp load chậm lag»): lịch Kiểm tra ôn tập (`docKtCn`, CHỈ ĐỌC) mọi lệnh khác cũng cần ⇒ bắt đầu CÙNG đợt lượt đọc mật khẩu
  // + các lượt đọc đầu — trước: một đợt D1 nối tiếp riêng SAU xác thực ở mỗi lần nộp câu (`answer`), đếm sau câu (`hoc-tap-dem`), học cách giải, làm lại.
  // Kết quả / lỗi chỉ dùng ở đúng chỗ `await kiem` cũ bên dưới. Lệnh của chính Kiểm tra ôn tập (`hoc-tap-ktcn-*`) trả trước khi đọc ⇒ không đọc sớm.
  // Lệnh đếm nhẹ sau mỗi câu (`hoc-tap-dem`, 2 câu CHỈ ĐỌC): cũng bắt đầu cùng đợt ấy — chỉ dùng khi tới đúng nhánh trả số đếm như cũ (Gói 7 bật, không phải ngày
  // chỉ làm kiểm tra); nhánh khác bỏ kết quả.
  // 28/10 «sửa phải xong mới hiện chặng sau»: số câu phần ngày Tự sửa lỗi còn thiếu (chỉ khi máy em đã báo khoá) — đọc CÙNG đợt mật khẩu, không thêm đợt chờ.
  const sbd=await gameIdentity(env,b,s=>{if(action==='hoc-tap-sanh'||action==='hoc-tap-start')giu.hocTap=batDauHocTapSom(env,s,action);else{if(action!=='sync'&&!action.startsWith('hoc-tap-'))giu.ds=batDauDocSom(env,action,b,s);if(action!=='sync'&&!action.startsWith('hoc-tap-ktcn-'))giu.kiem={sbd:s,p:som(import('./kiem-tra-ca-nhan').then(kt=>kt.docKtCn(env,s,Date.now(),true)))};if(action==='hoc-tap-dem')giu.dem={sbd:s,p:som(import('./goi-bai-7').then(g7=>g7.demHomNay7(env,s,Date.now())))}}})
  // Kế hoạch sảnh vừa nhớ (goi-bai-7-nho.ts) chỉ dành cho lượt mở chặng NGAY sau đó: mọi lệnh khác của em (nộp câu, học cách giải, kiểm…) xoá bản nhớ.
  if(action!=='hoc-tap-sanh'&&action!=='hoc-tap-start')boKeHoach7(env.DB,sbd)
  // Kiểm tra theo lịch RIÊNG từng em sở hữu cả ngày, kể cả khi em đã nộp sớm.
  // Cổng ở trước lập Gói 7/Hành trình: API cũ và phiên cũ không phát bài thường song song.
  const kt=await import('./kiem-tra-ca-nhan')
  if(action.startsWith('hoc-tap-ktcn-'))return kt.ktCnAction(env,sbd,action,b,Date.now())
  // Hai lượt chỉ đọc độc lập chạy cùng đợt; lịch kiểm tra vẫn chặn trước mọi lệnh lập/ghi bài thường.
  const g7Som=action==='hoc-tap-sanh'||action==='hoc-tap-start'?await import('./goi-bai-7'):undefined
  // Gói R: lượt đọc đầu đã bắt đầu cùng đợt mật khẩu (`batDauHocTapSom`) ⇒ dùng lại; danh sách gói chưa đọc được lúc ấy (bảng gói chưa sẵn) ⇒ đọc như cũ.
  const hocTapSom=giu.hocTap&&giu.hocTap.sbd===sbd?giu.hocTap:undefined
  const dsGoiSom=(hocTapSom?(await hocTapSom.dsGoi).p:undefined)??g7Som?.docDanhSachGoiSom7(env,sbd)
  const kiem=await (hocTapSom?hocTapSom.kiem:giu.kiem&&giu.kiem.sbd===sbd?giu.kiem.p:kt.docKtCn(env,sbd,Date.now(),true))
  if(kt.laNgayKt(kiem,Date.now())&&!kt.coHocNgayKt(kiem)){
    const tt=kt.tomTatKt(kiem!,Date.now())
    if(action==='hoc-tap-sanh'||action==='hoa2-sanh')return {ok:true,cheDo2:true,ngay:tt.ngay,kiemTraCaNhan:tt,theLuc:{tong:tt.tong,con:tt.con},chienDich:null,doan:{con:0},dao:{con:0}}
    if(action==='hoc-tap-dem')return {ok:true,daLamHomNay:tt.daTra,toiThieu:tt.tong,kiemTraCaNhan:tt}
    if(['hoc-tap-start','hoc-tap-gap','hoc-tap-lam-lai','hoc-tap-kiem-start','hoc-tap-kiem-nop','start','answer','resume','complete','hoa2-dao-start','hoa2-thu-suc','hoa2-thu-suc-them','hoa2-de-thu-start','hoa2-de-thu-nop'].includes(action))throw new Error('Hôm nay em chỉ làm bài kiểm tra theo lịch riêng. Bài tập tiếp tục vào ngày học kế tiếp.')
  }
  // KHOÁ CHẶNG SAU KIỂM TRA ÔN TẬP (thầy 27/10): ngày có Kiểm tra ôn tập + vẫn có bài học ⇒ bài kiểm tra đang mở mà chưa nộp thì KHÔNG mở chặng / làm lại /
  // học cách giải / phiên cũ (start · resume · answer · complete) — kể cả lối cũ. Sảnh, đếm, xem câu đã làm vẫn chạy. Dùng lại lượt đọc `kiem` ở trên (không thêm
  // vòng D1). Quá hạn / đã nộp / công tắc thầy tắt ⇒ không khoá.
  if(['hoc-tap-start','hoc-tap-gap','hoc-tap-lam-lai','hoc-tap-kiem-start','hoc-tap-kiem-nop','start','answer','resume','complete'].includes(action)){
    const khoa=kt.ktDangKhoaChang(kiem,Date.now())
    if(khoa)return {ok:false,ma:kt.MA_KHOA_KT,error:kt.CHU_KHOA_KT,kiemTraCaNhan:khoa}
  }
  // 29/10 20:15 (thầy: «sao vẫn có học sinh bị vậy … sửa luôn đi để học sinh còn làm, triệt để, không được phép có lỗi này nữa» — ảnh Lộ trình cho bấm BẮT ĐẦU chặng 1,
  // «Tự sửa lỗi ✓ · Sửa 2 lỗi cũ 2/2», mà mở chặng báo «Em sửa xong lỗi hôm nay rồi mới mở chặng tiếp nhé»; lần thứ ba: 28/10 19:55, 29/10 06:10): MÁY CHỦ KHÔNG CÒN CHẶN mở chặng vì Tự sửa lỗi.
  // Khoá «sửa xong mới tới chặng sau» thuộc Lộ trình (nút chặng khoá xám, màn chặng chỉ mở chặng Lộ trình đã cho bấm). Bản chặn ở máy chủ dựa vào danh sách «đã xong» do máy em
  // gửi nền — lệch một nhịp (mạng chậm, đổi máy, mã câu khác khoá) là em kẹt giữa Lộ trình và màn chặng, không có đường ra. Không còn lệnh đọc khoá Sửa lỗi trong lượt mở chặng.
  // App học sinh tập trung làm bài (10/10): không bắt chọn thần thú, không mở phòng/game.
  // Cùng bộ kế hoạch, phiên, quyền và answer hiện có; chỉ bỏ ràng buộc cửa Đảo/Đoàn ở giao diện.
  if(action.startsWith('hoc-tap-')){
    const g7=await import('./goi-bai-7')
    // Đợt 18: Sảnh / Mở chặng đọc ĐOÁN danh sách gói CÙNG đợt với cờ Gói 7 (xem `docDanhSachGoiSom7`) — chỉ dùng khi cờ bật, đúng lượt đọc sẽ chạy.
    const gsSom7=dsGoiSom
    const cfg7=await g7.coGoi7(env)
    if(cfg7.bat){
      // KHÔNG đồng bộ gói từ máy em (khẩn 12/10 21h — giờ cao điểm app treo "Đang chuẩn bị những câu…"): `dongBoGoi7` mỗi 20 giây/isolate nạp lại
      // MỌI gói đang mở của lớp (đọc R2 từng tờ, upsert ~164 dòng/gói) ⇒ dồn tải ghi D1 vào đúng lệnh sảnh / bắt đầu chặng. Trước 18:53 lượt này lọc
      // theo KHỐI nên với em khối 12 là no-op; sửa theo tên lớp làm nó chạy thật ⇒ quá tải. Bài mới vẫn vào gói: cron mỗi phút của Worker (index.ts)
      // + trang thầy Bài mới 7 ngày (`gvGoi7`) + bước phát hành `ap-goi7-song`. Em mới mở app chậm nhất ~1 phút sau khi thầy tick là thấy bài.
      if(action==='hoc-tap-gap')return g7.gapHuongDan7(env,sbd,b,Date.now())
      // Ô "đã làm/M câu hôm nay" sau mỗi câu: lệnh nhẹ 3 truy vấn chỉ đọc (khẩn 12/10 22h30) — thay lượt nạp lại cả sảnh (`lapGoi7`) sau mỗi câu.
      if(action==='hoc-tap-dem')return giu.dem&&giu.dem.sbd===sbd?giu.dem.p:g7.demHomNay7(env,sbd,Date.now())
      // Làm lại cuối chặng kiểu Duolingo (26/10, goi-bai-7-lam-lai.ts): câu anh em cho câu em vừa sai, có hỗ trợ, không EXP.
      if(action==='hoc-tap-lam-lai')return import('./goi-bai-7-lam-lai').then(m=>m.lamLaiCuoiChang7(env,sbd,b,Date.now()))
      // SẴN SÀNG (27/10): bản sẵn khớp dấu, cùng ngày ⇒ chặng đã lập sẵn thành phiên ngay (MỘT lô ghi) — không lập kế hoạch trên đường chờ. Không được ⇒ đường cũ.
      if(action==='hoc-tap-start'){const ss=hocTapSom?await hocTapSom.sanSang.catch(()=>null):null,nowSs=Date.now();if(ss&&dungDuoc(ss[1],ss[0],ngayVn7(nowSs))&&ss[1].chang){const rs=await moChangSanSang(env,sbd,nowSs,ss[1]).catch(()=>null);if(rs)return rs}
        const r7=await g7.startGoi7(env,sbd,Date.now(),gsSom7);if(r7)return r7}
      // B3 chuỗi ngày theo bài (26/10, chuoi-ngay-bai-d1.ts): cờ duolingo_bai bật ⇒ `chuoiNgay` {so, giuChuoi, sucChua, lich7, cuu?, binhVuaDo?}; đọc song song lập kế hoạch.
      // SẴN SÀNG (27/10): bản sẵn khớp dấu, cùng ngày ⇒ phần Sảnh lấy từ bản sẵn; Kiểm tra ôn tập + chuỗi ngày đọc TƯƠI (cùng đợt). Bản cũ hơn 10 phút ⇒ lập lại NỀN.
      // Lượt chậm (không khớp) ⇒ như cũ, rồi cất bản sẵn NỀN với dấu đọc TRƯỚC khi lập (kèm chặng kế tiếp chưa lưu phiên).
      if(action==='hoc-tap-sanh'){const chuoiSom=hocTapSom?.chuoi??import('./chuoi-ngay-bai-d1').then(m=>m.chuoiBaiNeuBat(env,sbd,Date.now()),()=>null);const ss=hocTapSom?await hocTapSom.sanSang.catch(()=>null):null,nowSs=Date.now()
        if(ss&&dungDuoc(ss[1],ss[0],ngayVn7(nowSs))&&ss[1].sanh){const ban=ss[1],chuoi7=await chuoiSom;if(ctx&&nowSs-ban.luc>10*60_000)ctx.waitUntil(chuanBiSanSang(envGhiRieng(env),sbd,nowSs));return {ok:true,cheDo2:true,...ban.sanh,...(chuoi7?{chuoiNgay:chuoi7}:{}),...(kiem?{kiemTraCaNhan:kt.tomTatKt(kiem,nowSs)}:{}),chienDich:null,doan:{con:0}}}
        const lap7=(await g7.lapDungLai7(env,sbd,Date.now()))??await g7.lapGoi7(env,sbd,Date.now(),gsSom7);if(lap7){g7.nhoLapSanh7(env,sbd,Date.now(),lap7);const con7=lap7.plan.viec.length,t7=g7.tomTatGoi7(lap7,Date.now()),chuoi7=await chuoiSom;if(ctx&&ss?.[0])ctx.waitUntil(chuanBiSanSang(envGhiRieng(env),sbd,Date.now(),{dau:ss[0],lap:lap7}));return {ok:true,cheDo2:true,ngay:t7.ngay,goi7:t7,...(chuoi7?{chuoiNgay:chuoi7}:{}),...(kiem?{kiemTraCaNhan:kt.tomTatKt(kiem,Date.now())}:{}),theLuc:{con:con7,tong:lap7.daLamNgay+con7},chienDich:null,doan:{con:0},dao:{con:con7}}}}
      if(action==='hoc-tap-kiem-start'||action==='hoc-tap-kiem-nop')return import('./goi-bai-7-kiem').then(m=>m.kiemGoi7(env,sbd,action,b,Date.now()))
    }

    // Gói 7 tắt ⇒ không có số Gói 7 (máy em giữ số của sảnh, không bịa).
    if(action==='hoc-tap-dem')return {ok:true,daLamHomNay:null,toiThieu:null}
    if(action==='hoc-tap-lam-lai')return {ok:true,questions:[]}
    if(!await cheDo2(env,sbd)){
      if(action==='hoc-tap-start')return gameV2(env,'start',{...b,mode:'adventure'},ctx)
      return {ok:true,cheDo2:false}
    }
    if(action==='hoc-tap-start'){const chanMoi=cfg7.bat?await import('./goi-bai-7-chan-moi').then(m=>m.docChanCauMoiGoi7(env,sbd)):new Set<string>();return startDao2(env,sbd,Date.now(),true,chanMoi)}
    const alias:Record<string,string>={'hoc-tap-sanh':'hoa2-sanh','hoc-tap-cau-da-lam':'hoa2-cau-da-lam','hoc-tap-cau-chi-tiet':'hoa2-cau-chi-tiet'}
    if(!alias[action])throw new Error('Chức năng học này chưa có.')
    const r=await hoa2Action(env,sbd,alias[action]!,b)
    if(kiem)r.kiemTraCaNhan=kt.tomTatKt(kiem,Date.now())
    if(cfg7.bat && action==='hoc-tap-sanh'){const lap7=await g7.lapGoi7(env,sbd,Date.now());if(lap7)r.goi7=g7.tomTatGoi7(lap7,Date.now())}
    return r
  }
  if(action==='sync')return {ok:true,...await syncIndex(env)}
  const ds=giu.ds&&giu.ds.sbd===sbd?giu.ds:batDauDocSom(env,action,b,sbd)
  const {truocAnswer,truocComplete,cheDo2Som,cauDaLamSom}=ds
  const {profile:p,revision}=await loadProfile(env,sbd,await ds.hoSoSom)
  // GAME HÓA 2.0 (srs2-game.ts): Sảnh bản đồ, Câu đã làm, Rương Bát Linh. Chỉ khi cờ `cau_hinh.game_hoa_2` bật cho em.
  if(LENH_HOA2.has(action)){
    if(!await cheDo2Som)return {ok:true,cheDo2:false};
    if(p.choice&&action!=='hoa2-cau-da-lam'&&action!=='hoa2-cau-chi-tiet')return {ok:true,cheDo2:true,canChonThu:true};
    return cauDaLamSom??hoa2Action(env,sbd,action,b);
  }
  // NHANH 27/10: nhịp nền ~3 phút + mỗi lần quay lại tab ⇒ phần lớn lượt KHÔNG có gì mới ⇒ hồ sơ y nguyên (bỏ qua mốc giờ đồng bộ `academic.at`) thì KHÔNG ghi
  // lại — trước: lần nào cũng UPDATE cả JSON hồ sơ (một đợt ghi D1 nối tiếp).
  if(action==='academic-sync'){const truocSync=JSON.stringify(p),atTruoc=p.academic?.at;const result=await syncAcademic(env,sbd,p,b.mom);const ac=p.academic,atMoi=ac?.at;if(ac&&atTruoc!==undefined)ac.at=atTruoc;const yNguyen=JSON.stringify(p)===truocSync;if(ac)ac.at=atMoi!;return {ok:true,...result,profile:visible(p),revision:yNguyen?revision:await save(env,sbd,p,revision)}}
  if(action==='progress-history'){
    const rows=await env.DB.prepare(`SELECT date(created_at,'+7 hours') AS day, COUNT(*) AS total,
      SUM(CASE WHEN json_extract(json,'$.attempt.correct')=1 AND COALESCE(json_extract(json,'$.attempt.assisted'),0)=0 THEN 1 ELSE 0 END) AS correct
      FROM game_v2_attempt WHERE sbd=? AND created_at>=? GROUP BY day ORDER BY day`).bind(sbd,new Date(Math.max(Date.now()-30*86400000,Date.parse(p.cutover)||0)).toISOString()).all()
    return {ok:true,history:rows.results}
  }
  if(action==='share')return {ok:true,pass:await parentPass(env,sbd)}
  if(action==='profile'){
    // Tối ưu 05/10: ba phần ĐỌC độc lập (nhiệm vụ, trần hấp thụ, đầu vào lượt) chạy CÙNG đợt — trước: nối tiếp. `datHomNay` của đầu vào lượt
    // chỉ được chép lại (không dùng để đọc) ⇒ gắn sau khi có trần hấp thụ. Lỗi vẫn tới đúng chỗ `await` cũ.
    const pTasks=som(env.DB.prepare('SELECT id,dang FROM game_v2_task WHERE sbd=? AND completed_at IS NULL ORDER BY created_at LIMIT 20').bind(sbd).all<{id:string;dang:string}>())
    const pTran=som(docTranHapThu(env,sbd,academicDay(now()))),pLuot=som(docDauVaoLuot(env,sbd,academicDay(now()),Date.now(),false))
    const tasks=await pTasks;const tranHapThu=await pTran;const dauVaoLuot={...await pLuot,datHomNay:tranHapThu.dat}
    return {ok:true,profile:visible(p,{tran:tranHapThu.tran,soCauHomNay:tranHapThu.soCauHomNay,canCau:tranHapThu.canCau}),revision,luot:tomTatLuot(luotHomNay(dauVaoLuot),dauVaoLuot.soLuotDaLam),tasks:tasks.results}
  }
  if(action==='choose'){
    if(!p.choice)throw new Error('Hồ sơ đã chọn thần thú.')
    const pet=PETS.find(x=>x.id===b.pet);if(!pet)throw new Error('Chọn một trong tám thần thú.')
    p.pet=pet.id;p.choice=false;return {ok:true,profile:visible(p),revision:await save(env,sbd,p,revision)}
  }
  if(action==='start'||action==='recommendations'){
    const mode:Mode=['adventure','repair'].includes(String(b.mode))?b.mode as Mode:'adventure'
    if(b.guardian)throw new Error('Võ đài Linh Tâm đã đóng.')
    // GAME HÓA 2.0: nguồn câu = kế hoạch ngày đã chốt. Cờ tắt ⇒ đường cũ bên dưới.
    if(mode==='adventure'&&await cheDo2(env,sbd))return action==='start'?startDao2CoVe(env,sbd,b,Date.now()):hoa2Action(env,sbd,'hoa2-sanh',b)
    if(mode==='adventure'&&await luotMoiBat(env))return startLuotMoi(env,sbd,p,b,action)
    // Tối ưu 08/10: readScope, protectedQuestions, readGameScope độc lập → SONG SONG; sau đó qidChanHomNay, docCauBtvnChuaNop, attempts cũng SONG SONG.
    const tNow=Date.now()
    const [scope,blocked,control]=await Promise.all([readScope(env,sbd),protectedQuestions(env),readGameScope(env,sbd)])
    if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
    for(const key of control.blocked)blocked.add(key)
    // GĐ 5 (Kênh 4): một đồng hồ giờ máy chủ cho cả lượt chọn; câu em đang/đã làm hôm nay ở chỗ khác không ra ở game; mốc ôn theo hồ sơ.
    const [chanNgay,chanBtvn,history]=await Promise.all([qidChanHomNay(env,sbd,tNow),docCauBtvnChuaNop(env,sbd),attempts(env,sbd)])
    // Game hiện lời giải ngay ⇒ đường CŨ cũng KHÔNG được rút câu nằm trong bài tập về nhà em CHƯA nộp (Code 1 rà chéo W2b).
    for(const qid of chanNgay)blocked.add(qid)
    for(const x of chanBtvn)blocked.add(x)
    const daHoc=learnedQuestionFilter(scope.evidence,blocked)
    const eligible=scope.pool.filter(q=>!laTuLuanPool(q)&&daHoc(q)&&(control.types.length===0||q.dang!==null&&control.types.includes(q.dang))&&(typeof b.dang!=='string'||q.dang===b.dang))
    const dayStart=new Date(academicDay(now())+'T00:00:00+07:00')
    const loaiTran:LoaiTran='dao' // Linh Tâm/võ đài/đường cũ ⇒ trần Đảo (36)
    const count={n:await demCauTrongNgay(env,sbd,dayStart.toISOString(),loaiTran)}
    const remaining=Math.max(0,tranCuaLoai(loaiTran)-count.n)
    const masteryLuot=await masteryTheoHoSo(env,sbd,p.mastery)
    const chonGoc=chooseSessionWithRoles(eligible,scope.evidence,history,masteryLuot,mode,tNow).slice(0,remaining)
    // CNH-1.0 P05/T09 (02 §5.2): lượt này CHỈ được lấy phần NGÂN SÁCH CÒN LẠI của ngày — nhiều màn dùng
    // chung một ngân sách. Cờ `cau_hinh.ngan_sach_luot` MẶC ĐỊNH TẮT ⇒ hành vi cũ nguyên vẹn.
    let chon=chonGoc, nganSachThieu: { conLaiGiay: number; soCauBoQua: number } | undefined, lyDoLuot: Record<string, number> | undefined, hoanLuot: { deferredCount: number; overBudgetSeconds: number } | undefined, giuDangMo: Record<string, string> | undefined
    if(await nganSachLuotBat(env)){
      // BỘ CHỌN CHUNG §7.1 chạy trên TOÀN BỘ tập ứng viên HỢP LỆ (`eligible`) — RV05: không đưa vào bộ chọn mới
      // một tập đã bị `chooseLuotMoi` cắt trước theo thuật toán cũ. Vai chỉ dùng để HIỂN THỊ (không cắt pool).
      const ns=await docNganSachConLai(env,sbd,academicDay(now()))
      const kq=await chonCauChoLuot(env,eligible.map(q=>({qid:q.qid,version:q.version,part:q.phan as 'I'|'II'|'III',mucDo:q.mucDo,group:q.group,dangKey:q.dang??q.group,skillIds:Array.isArray(q.kienThuc)?q.kienThuc as string[]:[],familyId:familyTuNhan(q)})),
        {sbd,ngay:academicDay(now()),nowMs:tNow,mastery:masteryLuot,conLaiGiay:ns&&ns.nganSachGiay>0?ns.conLaiGiay:null,tranCau:Math.min(SO_CAU_MOI_LUOT,remaining),mauTocDo:ns?.mau,phienBanKeHoach:ns?.phienBanKeHoach})
      const vaiCu=new Map(chonGoc.map(x=>[x.q.qid,x.role]))
      // Vai chỉ để HIỂN THỊ: dùng vai cũ nếu bộ chọn cũ đã cấp, còn lại `toi_han` (câu đến hạn) — KHÔNG cắt pool theo vai.
      chon=kq.chon.flatMap((v)=>{const q=eligible.find(x=>x.qid===v.qid);return q?[{q,role:vaiCu.get(v.qid)??'toi_han' as const}]:[]})
      lyDoLuot=Object.keys(kq.lyDo).length?kq.lyDo:undefined
      if(kq.deferredCount)hoanLuot={deferredCount:kq.deferredCount,overBudgetSeconds:kq.overBudgetSeconds}
      if(ns&&ns.nganSachGiay>0&&kq.deferredCount)nganSachThieu={conLaiGiay:ns.conLaiGiay,soCauBoQua:kq.deferredCount}
      // RV02: câu đã phát cho nhiệm vụ CÒN hiệu lực ⇒ trả lại để RESUME, không phát mới.
      if(kq.dungLaiTask.size)giuDangMo=Object.fromEntries(kq.dungLaiTask)
    }
    chon=await chanKhacKhoiEm(env,'game_cu',sbd,chon,{cauCua:x=>x.q}) // LUẬT THẦY 05/10: cổng cuối — Linh Tâm/võ đài/repair/tower/đường cũ chỉ câu đúng khối em
    const selected=chon.map(x=>x.q),vai=new Map(chon.map(x=>[x.q.qid,x.role]))
    if(action==='recommendations')return {ok:true,dailyUsed:count.n,tranNgay:tranCuaLoai(loaiTran),suggestions:selected.map(q=>({title:q.tenDang||'Ôn kiến thức đã học',source:q.maDe,part:q.phan})),remaining}
    if(!remaining)throw hetTran(tranCuaLoai(loaiTran))
    const qs=selected
    if(!qs.length)return {ok:true,questions:[],missing:scope.missing,message:'Chưa có câu đã chấm, đã công bố và phù hợp trong kho. Em hoàn thành bài Thầy giao rồi quay lại.'}
    const id=crypto.randomUUID();const groups=new Set(scope.evidence.map(e=>e.group))
    const session:Session={mode,created:Date.now(),questions:qs.map(q=>({qid:q.qid,maDe:q.maDe,version:q.version,group:q.group,novel:!groups.has(q.group)}))}
    const inserted=await env.DB.prepare('INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id,sbd,JSON.stringify(session),now()).run()
    if(!inserted.meta.changes)return gameV2(env,'start',b)
    const qsDay=await doDayDu(env,qs as CauPool[])
    return {ok:true,id,questions:qsDay.map(q=>({...publicQuestion(q),role:vai.get(q.qid)})),missing:scope.missing,sourceCases:[...new Set(scope.evidence.map(e=>e.ca))].slice(0,3),...(nganSachThieu?{nganSach:nganSachThieu}:{}),...(giuDangMo?{giuChoDangMo:giuDangMo}:{}),...(lyDoLuot?{chonLyDo:lyDoLuot}:{}),...(hoanLuot?{hoanLuot}:{})}
  }
  if(action==='resume'){
    const row=await env.DB.prepare("SELECT id,json FROM game_v2_session WHERE sbd=? AND created_at>? AND json_extract(json,'$.doan') IS NULL AND COALESCE(json_extract(json,'$.bia'),0)=0 ORDER BY created_at DESC LIMIT 1").bind(sbd,new Date(Date.now()-2*3600000).toISOString()).first<{id:string;json:string}>()
    if(!row)return {ok:true,questions:[]}
    const session=JSON.parse(row.json) as Session;const blocked=await protectedQuestions(env);const control=await readGameScope(env,sbd);if(!control.enabled)throw new Error('Thầy đang tạm dừng game.');for(const key of control.blocked)blocked.add(key);const qs=[],riengQ:PrivateQuestion[]=[]
    // CẤM RÚT TỰ LUẬN (21/09): lượt soạn trước lệnh cấm mà còn câu tự luận ⇒ BỎ câu ấy khỏi lượt trả về (em làm nốt các câu còn lại, `complete` cũng chỉ đòi các câu này).
    const tuLuan=await qidTuLuanTrongLuot(env,session.questions,await docKhoiEm(env,sbd))
    for(const q of await qidThuHoiTrongLuot(env,sbd,session))tuLuan.add(q) // THU HỒI KHI HUỶ (06/10): câu của chiến dịch đã huỷ không trả lại cho em làm nốt (lượt không cờ ⇒ rỗng, không truy vấn)
    // 29/09: câu THẬT SỰ đổi đề/đáp án (hoặc bị rút) giữa lượt ⇒ BỎ câu ấy khỏi lượt trả về như câu tự luận (em làm nốt các câu còn lại, `complete` cũng không đòi) — em không kẹt.
    for(const ref of session.questions){if(tuLuan.has(ref.qid))continue;const q=await docCauTheoRef(env,ref);if(!q||laCauTuLuan(q))continue;if(blocked.has(q.qid)||blocked.has(q.group))throw new Error('Lượt cũ có câu đang bảo vệ. Em mở lượt mới.');const qx=apXaoTheoRef(q,ref);riengQ.push(qx);qs.push(publicQuestion(qx))} // 05/10: bản xáo phát lại y hệt lúc phát
    if(!qs.length)return {ok:true,questions:[]}
    if((session as {hocTap?:number}).hocTap===1)await ganNiemChoCau(env,sbd,qs as unknown as Record<string,unknown>[],riengQ,(session as {hoa2?:number}).hoa2===1) // TEM NIÊM PHONG (niem-cau.ts): phiên học tập mở lại vẫn có dòng 1 tức thì
    const rows=await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session=? AND sbd=? ORDER BY created_at').bind(row.id,sbd).all<{json:string}>()
    return {ok:true,id:row.id,questions:qs,mode:session.mode,answered:rows.results.map(x=>JSON.parse(x.json))}
  }
  if(action==='answer'){
    const id=String(b.session??'');const qid=String(b.qid??'');const receipt=`${id}|${qid}`
    // CHẤM NHANH (28/10, cham-nhanh.ts): đáp án của câu này đã xuống máy em qua dòng 1 ⇒ chấm theo ĐÚNG đáp án đã nộp lần ấy; biên nhận đã vào đường thường ⇒ không chấm nhanh nữa.
    const daLo=dapAnDaLo(receipt);if(daLo!==undefined)b.answer=daLo
    nhoBienNhan(receipt)
    const truoc=truocAnswer??docTruocAnswer(env,sbd,b)
    const row=await truoc.session
    if(!row)throw new Error('Không tìm thấy lượt học của em.')
    const session=JSON.parse(row.json) as Session
    if(session.doan)throw new Error('Chặng Đoàn Hộ Tống đã đóng. Em mở chặng học mới nhé.')
    if(Date.now()-session.created>2*3600000)throw new Error('Lượt học đã hết hạn. Em mở lượt mới.')
    const ref=session.questions.find(q=>q.qid===qid);if(!ref)throw new Error('Câu không thuộc lượt học.')
    // THU HỒI KHI HUỶ (thầy 06/10, thu-hoi-chien-dich.ts): lượt có cờ `thuHoiLuc` mà câu này thuộc chiến dịch ĐÃ HUỶ ⇒ đóng như câu rút khỏi kho (`cau_doi`: máy em tự sang câu kế, không tính sai). Lượt không cờ: không thêm truy vấn.
    if(session.thuHoiLuc&&(await qidThuHoiTrongLuot(env,sbd,{thuHoiLuc:session.thuHoiLuc,questions:[ref]})).has(qid))throw loiCauDoi()
    // GAME HÓA 2.0: câu thứ 41 trở đi trong ngày (Huyết Chiến) không rơi vật phẩm. v5 (thầy chốt 29/09, điểm 5): Huyết Chiến VẪN có EXP (bỏ trần EXP theo ngày).
    const hoa2=(session as {hoa2?:number}).hoa2===1
    // OMNI 3 (làn B3): cờ hỏi SONG SONG với câu — chỉ phiên Hoá 2.0 Đảo/Đoàn (không Bi-a). Cờ tắt ⇒ mọi thứ dưới đây y hệt hôm nay.
    const omniSom=phienXetOmni(session)?som(omniBat(env,sbd).catch(()=>false)):null
    // 05/10 bậc 3 (cau-anh-em.ts): ref phiên có hoán vị `xt` ⇒ chấm trên BẢN XÁO đúng như đã phát (`q`); `qGoc` giữ cho OMNI từng ý / sổ (đáp án quy về khung gốc).
    // Tối ưu 05/10: dòng câu đọc sẵn cùng đợt với phiên (`truoc.cau`, cùng điều kiện tra) — bản xáo áp lên đúng câu gốc ấy như cũ.
    const qGoc=await currentQuestion(env,ref,truoc.cau),q=apXaoTheoRef(qGoc,ref)
    // CHẤM NHANH: nhớ phiên + câu đúng như vừa đọc (không thêm lượt D1); phiên chưa đủ câu trong đệm ⇒ nạp NỀN cả phiên (chỉ đọc, sau phản hồi).
    nhoPhien(id,sbd,session);nhoCau(ref,qGoc);if(ctx&&!phienDuCau(id))ctx.waitUntil(napPhienNhanh(envGhiRieng(env),id,sbd))
    // Đọc OMNI (thời gian kỳ vọng, số lượt lướt hôm nay, hồ sơ, ma trận Q, lượt của chuyến) bắt đầu ngay khi biết câu — song song phần kiểm phạm vi / bản chấm cũ.
    const omniDoc=omniSom?som(omniSom.then(bat=>bat?docTruocOmni(env,sbd,id,session,q,Date.now()):null)):null
    const blocked=await truoc.blocked
    nhoBaoVe(blocked) // CHẤM NHANH: tập câu bảo vệ ca thi (bản sao, TRƯỚC khi thêm câu chặn riêng của em)
    const control=await truoc.control;if(!control.enabled)throw new Error('Thầy đang tạm dừng game cho hồ sơ này.')
    // CHẤM NHANH: phạm vi thầy đặt + em có đang được xét OMNI (chưa biết ⇒ coi như có: đường thường lo «chưa tính»). Đã qua cổng lịch Kiểm tra ôn tập ở đầu lệnh.
    void (omniSom??Promise.resolve(true)).then(o=>nhoEm(sbd,control,o!==false),()=>{})
    for(const key of control.blocked)blocked.add(key)
    // 06/10: câu CHẨN ĐOÁN bước sai (chan-doan-buoc-sai.ts) đứng thay chỗ một câu lỗi ĐÃ qua phạm vi lúc phát — không xét lại dạng (câu nền không mang dạng của kho).
    const laCD=laQidChanDoan(qid)
    if(control.types.length&&!laCD&&(!q.dang||!control.types.includes(q.dang)))throw new Error('Thầy vừa đổi phạm vi luyện. Em mở lượt mới.')
    if(blocked.has(q.qid)||blocked.has(q.group))throw new Error('Câu đang được dùng cho ca thi. Em mở lượt học khác; câu này không bị tính sai.')
    // Hậu xử lý có thể chạy lại từ receipt nếu lần nộp trước dừng giữa chừng.
    // Gói R 15/10: sổ học là VIỆC PHỤ sau phản hồi (`ctx.waitUntil`) ⇒ ghi THẲNG D1 gốc (vẫn qua rào cổng đóng băng `RAO_GHI` như mọi lệnh ghi của lượt), không
    // xếp hàng chung với đường trả lời — trước: lệnh ghi sổ vào hàng ghi của bản gộp đọc ⇒ lượt đọc EXP còn lại của phản hồi phải chờ nó (một đợt D1). Phần còn lại
    // của phản hồi không đọc bảng sổ. Không có `ctx` (việc phụ chạy tại chỗ, nối tiếp) ⇒ y như cũ.
    const envSo:Env=ctx?envGhiRieng(env):env
    const ghiSoHoc=async(attempt:Attempt,chon?:string,so?:SoOmni)=>{
      const env=envSo
      // CNH-1.0 P03: khi cờ `nang_luc_v1` BẬT, sự kiện ĐƯỢC HỖ TRỢ cũng vào sổ (kèm `assistance:'assisted'`)
      // để phần hỗ trợ có bằng chứng và KHÔNG bị tính là lần tự làm. Cờ TẮT ⇒ giữ nguyên hành vi cũ (bỏ qua),
      // không đổi hồ sơ mạnh yếu đang chạy.
      const ghiAssisted = !attempt.assisted || hoa2 || await nangLucBat(env)
      // OMNI 3 (`so`): lướt ⇒ `ket_qua NULL` + purpose 'luot' (không phải một lần làm); chuyến vé ⇒ purpose 'probe'; raw thêm {ms, tt, td}; Phần II ⇒ kết quả từng ý.
      // `so` vắng (cờ tắt / phiên không xét OMNI) ⇒ dòng sổ y hệt hôm nay.
      // 05/10 (cau-anh-em.ts): `raw` thêm tc (câu anh em thay cho câu gốc) / xt (bản xáo; `chon` quy về khung gốc) / nv (nguyên văn); không có ⇒ y hệt hôm nay.
      // 06/10 (chan-doan-buoc-sai.ts): câu CHẨN ĐOÁN ⇒ purpose 'chan_doan' (không phải lần làm của câu lỗi — mọi bộ đọc lần làm bỏ qua; OMNI coi là quan sát của vi kỹ năng
      // nó kiểm), raw thêm `cd: 1` (+ `tc` = câu lỗi từ ref). Em làm SAI (tự làm, không lướt) ⇒ một dòng `omni_buoc_sai` cho câu lỗi như em tự khai bước sai.
      const ghi=ghiAssisted?await ghiSuKien(env,[{nguon:'game',maNguon:id,sbd,qid,lan:1,ketQua:so?.luot?null:attempt.correct?1:0,luc:new Date(attempt.at).toISOString(),maDang:q.dang,chuyenDe:'',mucDo:q.mucDo??'',attemptId:receipt,assistance:attempt.assisted?'assisted':'none',purpose:laCD?MUC_DICH_CHAN_DOAN:so?.purpose??(session.mode==='repair'?'repair':'maintenance'),receivedAt:attempt.at,...phanSoCuaDo(boSungKichThuocDe(docDoGiayMot(b,{ms:b.msLam}),q.phan,q),rawSo(rawLamLai(ref,q.phan,chon),so?.raw).raw), // 20/10 đo giây: giây + kích thước đề vào sổ CẢ KHI OMNI tắt (trước: bị bỏ)
        ...(so?.subitem?{subitem:so.subitem}:{}),cauVersion:qGoc.version}]):null
      // Chỉ ref máy chủ đã xếp từ lịch Hỏi thầy mới cần khép projection. Đợi sổ ghi bền; việc này vốn chạy trong waitUntil, câu thường không đọc thêm D1.
      if(ghi?.ok===true&&ghi.soGui>0&&ref.hoiThayKiem===true)try{await(await import('./hoi-thay-dong-bo-sua')).dongBoSuaLoiHoiThay(env,sbd,tachSongSinh(ref.tc??ref.qid).goc,attempt.at)}catch(e){console.error('[hoi-thay] chưa đồng bộ ôn chung:',e instanceof Error?e.message:String(e))}
      if(laCD&&!attempt.correct&&!attempt.assisted&&!so?.luot&&ref.tc)await ghiBuocSaiChanDoan(env,sbd,ref.tc,vknCauChanDoan(q),attempt.at)
    }
    /** Khoản EXP của câu đúng tự làm (`null` ⇒ câu không vào EXP: sai / được hỗ trợ). MỘT chỗ dựng khoản cho cả đường ghi riêng lẫn đường gộp lô chấm (tối ưu 05/10). */
    // THƯỞNG PHẠT 26/10: phiên BÀI HỌC / Kim cương ⇒ khoản câu = NGUYÊN TỬ của câu (+ Hoàn hảo ở câu cuối), kể cả câu sai nghiêm túc (2) / có hỗ trợ (5) / làm lại (3);
    // câu không được tính ⇒ 0 ⇒ không khoản. Cùng khoá `cau_game|lượt|câu` ⇒ gọi lại / nộp lại không cộng đôi. Phiên game khác: luật cũ y nguyên.
    let ttCau:Pick<RaThuongTraLoi,'thuong'|'thuongBai'>|null=null
    const khoanCuaCau=(attempt:Attempt):{k:KhoanGame;thuThach:boolean}|null=>{
      if(ttCau){
        const n=ttCau.thuong.nguyenTu+ttCau.thuongBai
        if(!(n>0))return null
        const ngay=academicDay(new Date(attempt.at).toISOString()),luc=new Date(attempt.at).toISOString()
        return {k:{khoa:`cau_game|${id}|${qid}`,loai:'cau_game',exp:n,ngay,luc,ghiChu:attempt.correct&&attempt.assisted?`${GHI_CHU_DUNG_HO_TRO}: +${n}`:`Nguyên tử câu bài học: +${n}`,maNguon:id,qid,khongTran:true},thuThach:false}
      }
      if(!(attempt.correct&&!attempt.assisted))return null
      const ngay=academicDay(new Date(attempt.at).toISOString()),luc=new Date(attempt.at).toISOString()
      // Câu thử thách / câu trùm: đủ EXP như câu học tập (`expMotCau`), KHÔNG cộng thêm EXP câu game (v5, đề xuất mục 3).
      if(ref.role==='thu_thach'||ref.role==='trum'){
        const goc=expMotCau(q.phan,Number(q.sao)||0)
        return {k:{khoa:`thuthach|${qid}`,loai:'thu_thach',exp:goc,ngay,luc,ghiChu:`Câu thử thách đúng lần đầu: +${goc}`,maNguon:id,qid},thuThach:true}
      }
      // v5 (THẦY ĐÃ CHỐT 29/09, điểm 5): MỌI câu game THƯỜNG tự làm đúng (không trợ giúp / Bùa / Hỏi thầy; kể cả Huyết Chiến) có EXP = ½ câu học tập qua MỘT hàm `expMotCauGame`,
      // KHÔNG trần ngày; khoá (lượt, câu) ⇒ gọi lại / nộp lại không cộng đôi.
      const n=expMotCauGame(q.phan,Number(q.sao)||0)
      return {k:{khoa:`cau_game|${id}|${qid}`,loai:'cau_game',exp:n,ngay,luc,ghiChu:`Câu đúng trong game Phần ${q.phan}: +${n}`,maNguon:id,qid,khongTran:true},thuThach:false}
    }
    const ghiExpCau=async(attempt:Attempt,hoSo?:{revision:number;json:string},expSom?:Promise<DocTruocKhoanGame>):Promise<{bat:boolean;exp:number;daGhiTruoc:boolean;thuThach:number;hoSo?:{revision:number;json:string}}>=>{
      const kc=khoanCuaCau(attempt)
      if(!kc)return {bat:false,exp:0,daGhiTruoc:false,thuThach:0}
      const t=await ghiKhoanExpGame(env,sbd,kc.k,Date.now(),{hoSo,docSom:expSom})
      return {...t,thuThach:kc.thuThach?t.exp:0}
    }
    // 29/09: phần SỔ (su_kien_hoc) không nằm trong phản hồi ⇒ VIỆC PHỤ (`ctx.waitUntil` trên Worker thật; không có ctx ⇒ chạy tại chỗ, song song với EXP).
    // Phần EXP vẫn chờ (số trả em). `hoSo` = hồ sơ ngay sau batch chấm (đã biết) ⇒ khoản EXP khỏi đọc lại.
    const ghiKetQuaHoc=async(attempt:Attempt,chon?:string,hoSo?:{revision:number;json:string},expSom?:Promise<DocTruocKhoanGame>,so?:SoOmni,eSan?:Promise<Awaited<ReturnType<typeof ghiExpCau>>>)=>{
      // Tối ưu 05/10: lô ghi EXP (em chờ số) đi TRƯỚC trong hàng ghi của lượt; dòng sổ (việc phụ, `ctx.waitUntil`) ghi SAU khi phần EXP xong — trước: sổ
      // ghi trước nên lô EXP phải chờ thêm một đợt. Hai việc không đọc bảng của nhau (sổ ⇄ exp_so/hồ sơ) ⇒ kết quả y hệt.
      // `eSan`: phần EXP nơi gọi đã chạy (khoản đã ghi CÙNG lô chấm).
      const e=eSan??ghiExpCau(attempt,hoSo,expSom)
      // SẴN SÀNG (27/10): sổ ghi xong mà phiên Gói 7 đã trả lời HẾT câu ⇒ chuẩn bị NỀN Sảnh + chặng kế tiếp (em đọc kết quả câu cuối trong lúc ấy). Chỉ khi có `ctx`.
      const sauCauCuoi=async()=>{if(ctx&&(session as {goi7?:number}).goi7===1&&await phienDaXong(envSo,sbd,id))await chuanBiSanSang(envSo,sbd,Date.now())}
      const [,kq]=await Promise.all([viecPhu(ctx,()=>e.then(()=>undefined,()=>undefined).then(()=>ghiSoHoc(attempt,chon,so)).then(sauCauCuoi)),e]);return kq
    }
    /** `expCau` = EXP THẬT đã vào thú nhờ câu này (thưởng nấc + khoản câu game + thử thách của CHÍNH lượt này) — đọc lại từ sổ nên gọi lại vẫn ra đúng số, không cộng đôi. */
    const expCauCuaCau=async(reward:number)=>{
      const r=await env.DB.prepare("SELECT COALESCE(SUM(exp),0) AS e FROM exp_so WHERE (khoa=? OR (khoa=? AND ma_nguon=?))").bind(`${sbd}|cau_game|${id}|${qid}`,`${sbd}|thuthach|${qid}`,id).first<{e:number}>().catch(()=>null)
      const expCau=Math.max(0,Math.floor(Number(reward)||0))+Math.max(0,Math.floor(Number(r?.e)||0))
      return {expCau}
    }
    // LỜI GIẢI KIỂU SƠ ĐỒ (26/10): bản đạt đọc sẵn từ đầu lượt, KIỂM LẠI với câu đúng như đã phát (`q`: bản xáo / song sinh) — chỉ vào PHẢN HỒI (`soDo`),
    // không vào bản chấm lưu ở game_v2_attempt. `solution` cũ giữ nguyên để lùi.
    const soDoKem=async():Promise<{soDo?:unknown}>=>{const rows=truoc.soDo?await truoc.soDo:null;const ban=rows?.length?chonBanDat(rows,qidTraSoDo(qid),()=>({phan:q.phan,dapAn:q.correct,...(q.phan==='I'?{luaChon:luaChonTuChoices(q.choices)}:{})})):null;return ban?{soDo:ban}:{}}
    const previous=await truoc.previous
    if(previous){const cu=JSON.parse(previous.json);if(cu.thuong&&typeof cu.thuong.nguyenTu==='number')ttCau={thuong:cu.thuong,thuongBai:cu.ketBai?.hoanHao?NT_HOAN_HAO:0};await ghiKetQuaHoc(cu.attempt,typeof cu.traLoi==='string'?cu.traLoi:undefined,undefined,truoc.exp,soOmniTuKetQuaCu(ref.xt?{...cu,traLoi:chonVeGoc(ref,q.phan,String(cu.traLoi??'')),answer:qGoc.correct}:cu,b,qGoc,session));const [moi,ec]=await Promise.all([loadProfile(env,sbd),expCauCuaCau(Number(cu.reward)||0)]);return {ok:true,...cu,...(await soDoKem()),...ec,profile:visible(moi.profile),revision:moi.revision,replayed:true}} // 05/10: lượt BẢN XÁO ⇒ phần OMNI từng ý dựng lại theo khung gốc (như lần chấm đầu: qGoc + đáp án quy về gốc)
    if(session.guardian)throw new Error('Võ đài Linh Tâm đã đóng.')
    // TRẦN CÂU/NGÀY chỉ chặn ở lúc PHÁT câu (`start` / rút: `Math.min(soCau, remaining)`), KHÔNG chặn ở đây (Boss 21/09, P0 "không nộp được bài"): câu ĐÃ PHÁT trong một lượt đang mở thì luôn được trả lời, em không kẹt giữa ải
    // vì trần đổi / đếm lại. Mỗi câu của một lượt chỉ trả lời MỘT lần (`receipt` = lượt|câu là khoá chính; nộp lại ⇒ `replayed`), nên tổng số lượt trong ngày ≤ trần + phần dư của lượt cuối đã phát.
    const submitted=String(b.answer??'').trim()
    if(q.phan==='I'&&!/^[ABCD]$/.test(submitted)||q.phan==='II'&&!/^[DS]{4}$/.test(submitted)||q.phan==='III'&&(!submitted||submitted.length>40))throw new Error('Em điền đủ đáp án trước khi chấm.')
    // 06/10: câu CHẨN ĐOÁN Phần III (câu nền) chấm như câu nền — khớp đáp án hoặc lệch ≤ 0,5 % giá trị đúng (chan-doan-buoc-sai.ts `chamCauChanDoan`); câu khác y hệt cũ.
    const attempt:Attempt={id:receipt,session:id,qid,group:q.group,dang:q.dang,mucDo:q.mucDo,correct:laCD?chamCauChanDoan(q,String(b.answer??'')):(session as {hocTap?:number}).hocTap===1&&q.phan==='III'?khopPhanIII(String(b.answer??''),q.correct):grade(q,String(b.answer??'')),assisted:b.assisted===true||!!(ref as {goiY?:unknown}).goiY,at:Date.now(),novel:ref.novel}
    // DÒNG 1 SỚM (29/10, cham-nhanh.ts `phatTamSom`): đã chấm xong sau đợt đọc đầu ⇒ gửi đúng / sai NGAY cho lượt xin theo luồng, không chờ OMNI + lô ghi (~2 đợt D1). Cùng điều kiện an toàn
    // với chấm nhanh từ đệm (phiên học tập, không chẩn đoán / tự luận / kênh số / được hỗ trợ); câu sai CÓ THỂ là lướt (làm < 8 giây, phiên xét OMNI) chờ bản đầy đủ. Không đăng ký ⇒ không làm gì.
    {
      const ss=session as {hocTap?:number;goi7?:number;bia?:number;kimCuong?:number;thuHoiLuc?:unknown;guardian?:unknown}
      if(!laCD&&!attempt.assisted&&(ss.hocTap===1||ss.goi7===1)&&!ss.bia&&ss.kimCuong!==1&&!ss.thuHoiLuc&&!ss.guardian&&!laCauTuLuan(qGoc)&&!ngoaiKenhSo(qGoc)&&!(omniSom&&!attempt.correct&&coTheLaLuotMs(b.msLam))){
        const khongTinh=laPhienNguyenTu(session as unknown as PhienNt)&&khongTinhTuDo(boSungKichThuocDe(docDoGiayMot(b,{ms:b.msLam}),q.phan,q),attempt.correct)
        if(phatTamSom(b,{ok:true,tam:true,correct:attempt.correct,answer:q.correct,traLoi:submitted,solution:q.solution,solutionImages:q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai'),...(khongTinh?{khongTinh:true as const}:{})}))nhoDaLo(receipt,String(b.answer??''))
      }
    }
    // OMNI 3: xét lướt / chắc-mà-sai / P dạng / Trạm hồi phục (omni-game.ts). Lỗi đọc ⇒ null ⇒ lượt chấm như cờ tắt.
    const docOmni=omniDoc?await omniDoc:null
    const omni=docOmni?await xetOmniTraLoi(env,{sbd,phien:session,qidPhien:qid,cau:qGoc,chon:chonVeGoc(ref,q.phan,submitted),dung:attempt.correct,hoTro:attempt.assisted,b,nowMs:attempt.at,doc:docOmni}):null
    // THƯỞNG PHẠT 26/10 (thuong-tra-loi.ts): hàm thuần trên dữ liệu ĐÃ CÓ trong lượt (JSON phiên + hồ sơ + số đo giây) — không đọc thêm D1.
    const phienNt=session as unknown as PhienNt
    const ngayNt=academicDay(new Date(attempt.at).toISOString())
    let tt:RaThuongTraLoi|null=null
    if(laPhienNguyenTu(phienNt)&&!laCD){
      if(kimCuongDaXong(phienNt))throw new Error('Thử thách này đã kết thúc. Em xem kết quả nhé.')
      const doNt=boSungKichThuocDe(docDoGiayMot(b,{ms:b.msLam}),q.phan,q)
      // 28/10 lặp câu trong ngày (thuong-tra-loi.ts NGAY_LAP_CAU): tập câu gốc đúng / sai hôm nay nằm trong hồ sơ (`ntNgay`) — đọc sẵn, ghi CAS cùng lô.
      const daLamNgay=ntNgayTuHoSo((p as {ntNgay?:unknown}).ntNgay,ngayNt)
      tt=tinhThuongTraLoi({session:phienNt,qid,dung:attempt.correct,hoTro:attempt.assisted,khongTinh:!!omni?.luot||khongTinhTuDo(doNt,attempt.correct),cau:q,
        chuoiTruoc:chuoiTruocTuHoSo((p as {ntChuoi?:unknown}).ntChuoi,ngayNt),giay:doNt?.giay??null,nowMs:attempt.at,daLamNgay})
      ttCau=tt
      ;(p as {ntChuoi?:unknown}).ntChuoi={n:ngayNt,c:tt.thuong.chuoiDung}
      ;(p as {ntNgay?:unknown}).ntNgay=ntNgaySau(daLamNgay,ngayNt,qid,attempt.correct,tt.thuong.tinh)
    }
    // Lướt (sai quá nhanh, ≤ 3 lượt/ngày): KHÔNG đổi mastery của hồ sơ game (bỏ `advance`), không thưởng nấc.
    // 06/10: câu CHẨN ĐOÁN cũng không đổi mastery theo dạng (câu nền không thuộc dạng nào của kho — không sinh khoá dạng lạ trong báo cáo tiến bộ game).
    const masteryCu=p.mastery.find(m=>m.key===(q.dang??q.group))
    const step=omni?.luot||laCD?{mastery:masteryCu??{key:q.dang??q.group,stage:0,first:0,due:0,groups:[],repaired:false},reward:0,milestone:0}:advance(masteryCu,attempt)
    // Thưởng nấc dạng (Đảo và Đoàn cùng đường này): v5 bỏ trần 120 EXP game/ngày và bỏ Huyết Chiến cho EXP ⇒ nhận đủ (bộ đếm ngày vẫn ghi để thống kê).
    const thuong=step.reward>0?nhanExpGame(p,academicDay(now()),step.reward):0
    if(!omni?.luot&&!laCD)p.mastery=[...p.mastery.filter(m=>m.key!==step.mastery.key),step.mastery]
    congExpVaoHoSo(p,thuong) // v5: thưởng nấc vào thú qua `nhanV5` (hồ sơ cũ hơn v3 vẫn vào ống)
    const result={attempt,traLoi:submitted,...(ref.xt?{traLoiGoc:chonVeGoc(ref,q.phan,submitted)}:{}),correct:attempt.correct,answer:q.correct,solution:q.solution,solutionImages:q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai'),reward:thuong,...(thuong<step.reward?{thuongGoc:step.reward}:{}),stage:step.mastery.stage,lyDoThuong:lyDoThuong({correct:attempt.correct,assisted:attempt.assisted,reward:thuong,milestone:step.milestone,stage:step.mastery.stage}),...(omni?themVaoKetQua(omni):{}),
      ...(tt?{thuong:tt.thuong,...(tt.ketBai?{ketBai:tt.ketBai}:{}),...(tt.kimCuong?{kimCuong:tt.kimCuong}:{})}:{})}
    const queries=[env.DB.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM game_v2_profile WHERE sbd=? AND revision=?)').bind(receipt,sbd,id,qid,q.group,JSON.stringify(result),now(),sbd,revision)]
    // Bài 7 ngày: đáp án chỉ mở SAU chấm (+1 ms), không phủ định lần vừa tự làm; lần đo trong 12 giờ sau vẫn là có trợ giúp.
    if((session as {goi7?:number}).goi7===1)queries.push(env.DB.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) SELECT ?,value,?,0,\'goi7:sau_nop\' FROM json_each(?) WHERE EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)').bind(sbd,new Date(attempt.at+1).toISOString(),JSON.stringify([...new Set([qid,ref.tc].filter(Boolean))]),receipt))
    if(step.reward)queries.push(env.DB.prepare('INSERT OR IGNORE INTO game_v2_reward(id,sbd,amount,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)').bind(`${sbd}|${step.mastery.key}|${step.milestone}`,sbd,thuong,now(),receipt))
    const jsonP=JSON.stringify(p)
    queries.push(env.DB.prepare('UPDATE game_v2_profile SET json=?,revision=revision+1 WHERE sbd=? AND revision=? AND EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)').bind(jsonP,sbd,revision,receipt))
    // OMNI 3: chuyến vừa mở Trạm hồi phục ⇒ ghi `tram: 1` vào JSON phiên CÙNG lô (tối đa một trạm/chuyến; chỉ khi bản chấm vào được).
    if(omni?.omni.tram)queries.push(env.DB.prepare("UPDATE game_v2_session SET json=json_set(json,'$.tram',1) WHERE id=? AND sbd=? AND EXISTS(SELECT 1 FROM game_v2_attempt WHERE id=?)").bind(id,sbd,receipt))
    // 29/09: em trả lời ĐÚNG (tự làm) ⇒ phần ĐỌC của khoản EXP (cấu hình EXP, ngày mùa, cờ P08, khoá đã có) chạy CÙNG đợt với batch chấm — ghi EXP khỏi chờ thêm đợt.
    const coExp=tt?tt.thuong.nguyenTu+tt.thuongBai>0:attempt.correct&&!attempt.assisted
    const expSom=coExp?truoc.exp:undefined // đọc sẵn từ đầu lượt (docTruocAnswer) — cùng các khoá như cũ
    // Tối ưu 05/10: khoản EXP câu đúng GHI CÙNG lô chấm (exp-d1.ts `lenhKhoanExpGameGop`: ba câu đặt NGAY SAU câu UPDATE hồ sơ, `changes()=1` nối với nó)
    // — trước: một lô riêng ở đợt sau. Không đủ điều kiện gộp (EXP tắt / khoản đã có / đọc trước lỗi) ⇒ lô chấm y hệt cũ, EXP đi đường cũ.
    const viTriHoSo=queries.length-(omni?.omni.tram?2:1)
    let gop:KhoanGop|null=null
    const kc=coExp?khoanCuaCau(attempt):null
    if(kc&&expSom){try{gop=lenhKhoanExpGameGop(env,sbd,kc.k,await expSom,Date.now(),{revision:revision+1,json:jsonP},truoc.tong?await truoc.tong.catch(()=>null):null)}catch{gop=null}}
    let written:D1Result[]
    // THƯỞNG PHẠT 26/10: câu ghi JSON phiên / bài xong / Kim cương + câu đọc mục tiêu ngày đi CUỐI lô chấm (0 lệnh D1 thêm). Phần này lỗi (vd. bảng chưa có) ⇒ chạy lại
    // lô KHÔNG có nó — thưởng không bao giờ làm hỏng lượt chấm.
    const ltt=tt?lenhThuongTraLoi(env,{sbd,phien:id,receipt,ngay:ngayNt,luc:new Date(attempt.at).toISOString(),nowMs:attempt.at,ra:tt,chuyenDe:phienNt.kc}):null
    let coTt=!!ltt
    const chayLo=async(ds:D1PreparedStatement[]):Promise<D1Result[]>=>{
      if(!ltt)return env.DB.batch(ds)
      try{return await env.DB.batch([...ds,...ltt.lenh])}catch(e){if(!coTt)throw e;coTt=false;return env.DB.batch(ds)}
    }
    if(gop){
      // Lô gộp lỗi (vd. bảng sổ EXP lệch) ⇒ chạy lại ĐÚNG lô chấm cũ (lô lỗi đã huỷ cả giao dịch) rồi EXP đi đường cũ — không để phần EXP làm hỏng lượt chấm.
      try{written=await chayLo([...queries.slice(0,viTriHoSo+1),...gop.lenh,...queries.slice(viTriHoSo+1)])}catch{gop=null;written=await chayLo(queries)}
    }else written=await chayLo(queries)
    const mucTieuNt=ltt&&coTt&&tt?.ketBai?ltt.mucTieuTu(written):null
    if(coTt&&ltt)written=written.slice(0,written.length-ltt.lenh.length)
    if(!written[0]?.meta.changes)throw new Error('Một thiết bị khác vừa cập nhật. Em bấm chấm lại để đồng bộ.')
    // 29/09: câu KHÔNG vào EXP (sai / được hỗ trợ) của lượt chấm MỚI ⇒ sổ EXP không thể có khoản của (lượt, câu) này (khoá `cau_game|lượt|câu` / `thuthach|câu`+lượt chỉ
    // được ghi ở đây, SAU khi bản chấm vào D1 — mà bản chấm vừa được chèn lần đầu) ⇒ `expCau` = thưởng nấc, khỏi đọc sổ.
    const kqGop=gop?written.slice(viTriHoSo+1,viTriHoSo+1+gop.lenh.length):null
    const eGop=gop&&kc&&kqGop?(async()=>{const t=await xongKhoanExpGameGop(env,sbd,gop!,kqGop);if(!t)return ghiExpCau(attempt,{revision:revision+1,json:jsonP},expSom);return {...t,thuThach:kc.thuThach?t.exp:0}})():undefined
    const g=await ghiKetQuaHoc(attempt,submitted,{revision:revision+1,json:jsonP},expSom,omni?.so,eGop)
    const ecSom=coExp?null:{expCau:Math.max(0,Math.floor(Number(thuong)||0))} // ĐÁP ÁN EM CHỌN vào sổ (`raw_json`) — cho bảng chi tiết em trên tờ chiếu (28/09)
    const expThuThach=g.thuThach // chỉ phần thử thách (máy em cũ cộng `reward + expThuThach`); tổng thật ở `expCau`
    let pOut=p,revOut=revision+1
    // 29/09: khoản EXP vừa ghi MỚI ⇒ biết chính xác số đã vào sổ (= g.exp) và hồ sơ sau cùng (g.hoSo) ⇒ khỏi đọc lại hồ sơ + sổ (trước: 2 đợt nối tiếp).
    // Ghi trước đó / lỗi / không rõ ⇒ đọc lại như cũ (song song).
    const [f,ec]=await Promise.all([g.bat?(g.hoSo?{profile:JSON.parse(g.hoSo.json) as Profile,revision:g.hoSo.revision}:loadProfile(env,sbd)):null,ecSom??(g.bat&&!g.daGhiTruoc?{expCau:Math.max(0,Math.floor(Number(thuong)||0))+Math.max(0,Math.floor(Number(g.exp)||0))}:!g.bat?{expCau:Math.max(0,Math.floor(Number(thuong)||0))}:expCauCuaCau(thuong))])
    if(f){pOut=f.profile;revOut=f.revision}
    const ketBaiRa=result.ketBai?{ketBai:{...result.ketBai,...(mucTieuNt?{mucTieu:mucTieuNt}:{})}}:{}
    return {ok:true,...result,...ketBaiRa,...(await soDoKem()),...(expThuThach?{expThuThach}:{}),...ec,profile:visible(pOut),revision:revOut}
  }
  if(action==='complete'){
    const truoc=truocComplete??docTruocComplete(env,sbd,b)
    const id=String(b.session??'');const row=await truoc.session;if(!row)throw new Error('Không có lượt này.')
    const session=JSON.parse(row.json) as Session;const r=await truoc.attempts
    const done=r.results.map(x=>JSON.parse(x.json) as {attempt:Attempt})
    // CẤM RÚT TỰ LUẬN (21/09): câu tự luận còn sót trong lượt cũ không được đòi em làm; chỉ đếm các câu rút được.
    const tuLuan=await qidTuLuanTrongLuot(env,session.questions,await truoc.khoi,truoc.cauPhien)
    for(const q of await qidThuHoiTrongLuot(env,sbd,session))tuLuan.add(q) // THU HỒI KHI HUỶ (06/10): câu của chiến dịch đã huỷ (máy em đã bỏ qua) không bị đòi
    // 29/09: câu chưa làm mà nay đã đổi đề/đáp án hoặc bị rút (máy em đã tự bỏ qua) cũng không bị đòi — chỉ tra khi còn thiếu, nên lượt đủ câu không tốn thêm truy vấn.
    const daLam=new Set(done.map(x=>x.attempt.qid))
    for(const ref of session.questions)if(!tuLuan.has(ref.qid)&&!daLam.has(ref.qid)&&!await docCauTheoRef(env,ref))tuLuan.add(ref.qid)
    if(done.filter(x=>!tuLuan.has(x.attempt.qid)).length!==session.questions.filter(x=>!tuLuan.has(x.qid)).length)throw new Error('Em cần hoàn thành các câu trong lượt.')
    // Tối ưu 05/10: mọi lệnh đánh dấu nhiệm vụ xong (trước: mỗi dạng một đợt nối tiếp) + đọc lại hồ sơ (trước: đợt riêng ở cuối) trong MỘT lô —
    // D1 chạy lô tuần tự trong một giao dịch ⇒ hồ sơ đọc được SAU các lệnh ghi, như cũ. Nhả chỗ (bảng `giu_cho`, không đụng hồ sơ) vẫn chạy sau, như cũ.
    const lenhNhiemVu=[...new Set(session.questions.map(q=>done.find(a=>a.attempt.qid===q.qid)?.attempt.dang).filter(Boolean))].map(dang=>env.DB.prepare('UPDATE game_v2_task SET completed_at=? WHERE sbd=? AND dang=? AND completed_at IS NULL').bind(now(),sbd,dang))
    const loGhi=await env.DB.batch<Row>([...lenhNhiemVu,...lenhDocHoSo(env,sbd)])
    // P05/P07: LƯỢT KẾT THÚC ⇒ NHẢ CHỖ ngay (không để chỗ treo tới hết lease). Chỉ nhả phần do CHÍNH phiên này giữ.
    if(await truoc.nganSach)await nhaCho(env,sbd,id)
    const fresh=await loadProfile(env,sbd,[loGhi[lenhNhiemVu.length]!,loGhi[lenhNhiemVu.length+1]!])
    return {ok:true,profile:visible(fresh.profile),revision:fresh.revision,correct:done.filter(x=>x.attempt.correct).length,total:done.length}
  }
  throw new Error('Không có lệnh game này.')
}
