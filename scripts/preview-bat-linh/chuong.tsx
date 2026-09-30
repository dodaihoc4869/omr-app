// Visual fixture only: keep the actual reveal mounted so it can be inspected.
import {createRoot} from 'react-dom/client'
import DoanTungChuong from '../../src/game/than-thu-v2/DoanTungChuong'
import type {KhungNhinHiep} from '../../src/game/than-thu-v2/doan-core'
import type {GheXem} from '../../src/game/than-thu-v2/doan-kieu'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/game/than-thu-v2/doan.css'
import '../../src/game/than-thu-v2/doan2/doan2.css'
import '../../src/components/hoa2/phong-baloo'
const boss=new URLSearchParams(location.search).has('boss')
const ghe:GheXem[]=[{ghe:0,ten:'Minh',pet:1,cap:50,laMay:false,roi:false,laEm:true,trangThai:'da_chot',tinHieu:null}]
const kq:KhungNhinHiep={hiep:boss?4:2,laTrum:boss,tongSatThuong:48,tongChan:0,quaiHaGuc:1,quaiConLai:2,linhTamMat:0,linhTamHoi:0,linhTamSau:80,ban:[],
 trum:boss?{loai:'chua_te_ket_tua',voGiap:true,yDung:4}:null,
 cuaEm:{ghe:0,nop:true,dung:true,tuLam:true,hanhDong:'danh',tenChieu:'Thuỷ Long Quyển',satThuong:48,heSo:{dung:1.5,lienKich:1,anThach:1},lienKich:false,chan:0,hoi:0,lan:0,haGuc:1,giup:null,giupThanhCong:false,duocGiupBoi:null,nangLuongSau:2,yGiu:[],yDung:[]}} as KhungNhinHiep
createRoot(document.getElementById('root')!).render(<div className="dh dh2"><DoanTungChuong kq={kq} ghe={ghe} loaiQuai="bun_acid" tenQuai="Bùn Acid" tinh cheDo2 onXong={()=>{}}/></div>)
