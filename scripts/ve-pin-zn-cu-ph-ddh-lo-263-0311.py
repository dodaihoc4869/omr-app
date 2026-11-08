"""Nguồn750: giữ riêng sơ đồ phẳng Zn–Cu; không thêm số chỉ hay đáp án từ câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='466863dfc0ef748e44dbc85d86ea4fa5cd5a9354d121a7bd1ed269aa77b9c325'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='''<path d="M256 209H414V329H256Z" fill="#f2f2f2"/><path d="M527 201H697V329H527Z" fill="#3f48cc"/>
<path d="M329 116Q331 79 356 79H428 M511 79H579Q618 79 627 116" fill="none" stroke="#000" stroke-width="3"/>
<ellipse cx="470" cy="86" rx="42" ry="28" fill="#fff" stroke="#000" stroke-width="3"/><path d="M470 84L494 62" stroke="#000" stroke-width="3"/>
<path d="M256 179V329H414V198 M527 198V329H697V179" fill="none" stroke="#000" stroke-width="6"/>
<path d="M256 209H314 M347 209H390" stroke="#c3c3c3" stroke-width="3"/>
<path d="M390 280V170Q390 166 402 166H531Q550 167 550 171V277H527V198H414V280Z" fill="#c8bfe7"/>
<path d="M390 280V170Q390 166 402 166H531Q550 167 550 171V277 M414 280V198H527V277" fill="none" stroke="#000" stroke-width="5" stroke-linejoin="miter"/>
<path d="M314 116H347V301H314Z" fill="#c3c3c3"/><path d="M615 116H645V295H615Z" fill="#ed1c24"/>
<path d="M245 122L314 147 M707 124L645 166 M205 246L279 257 M735 250L685 266 M450 199L478 363" fill="none" stroke="#000" stroke-width="1"/>
'''
for x,y,t,z in [(220,128,'Zn',30),(733,128,'Cu',30),(475,143,'vôn kế',29),(126,249,'dung dịch',30),(126,283,'ZnSO₄',30),(819,249,'dung dịch',30),(819,283,'CuSO₄',30),(518,392,'cầu muối',30)]:b+=F.label(x,y,t,z)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="945" height="448" viewBox="0 0 945 448"><title>Sơ đồ pin Zn–Cu theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pin-zn-cu-ph-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=750,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2beakers2unequalliquidlevels2coloredrods/oneopenUbridge/ovalvoltmeter1pointer2wires/5leaders/8literalblocks/noaddedvoltage-polarity-electrons-KCl-answer.')
(K/'cau-truc-pin-zn-cu-ph-ddh-lo-263-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
