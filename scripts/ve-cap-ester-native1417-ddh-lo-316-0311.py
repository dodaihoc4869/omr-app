"""Hai hình của cùng câu: giữ lớp màu và phản ứng nguyên bản."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());rows=[]
def label(x,y,t,z=28,anchor='middle',weight='de'):return F.label(x,y,t,z,anchor=anchor,fill='#111',weight=weight)
def path(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def save(i,h,b,w,ht,stem,note):
 qs=[]
 for q in iv['questions']:
  refs=[r for r in q['hinh'] if r['hash']==h]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{ht}" viewBox="0 0 {w} {ht}"><title>Hình theo nguồn{i}</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn=stem+'-'+hh+'.svg';(K/fn).write_bytes(raw)
 rows.append(dict(i=i,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note));print(i,hh,len(raw))
b=''
for left,right,center,split in [(189,248,219,165),(327,386,357,153),(457,516,487,None)]:
 b+=f'<path d="M{left} 142H{right}V219Q{right-4} 240 {center} 240Q{left+4} 240 {left} 219Z" fill="#3f48cc"/>'
 if split:
  b+=f'<path d="M{left} 142H{right}V{split}H{left}Z" fill="#fff200"/>'+path(f'M{left} {split}H{right}',2.2)
 b+=path(f'M{left} 142H{right}',2.2)+path(f'M{left} 5V219Q{left+4} 240 {center} 240Q{right-4} 240 {right} 219V5',3.8)
b+=label(77,123,'ester',28,'start')+label(19,222,'dung dịch',28,'start')+path(f'M{77+F.advance("ester",28)+3} 122L197 154 M{19+F.advance("dung dịch",28)+3} 212L196 194',0.75)
for x,t in [(217,'(1)'),(361,'(2)'),(488,'(3)')]:b+=label(x,280,t,31,weight='dam')
save(1417,'fe97a5b7345378de73db5022c23ad45c8ea53f27f6d86e0c807bbfd52d867f30',b,566,299,'ong-ester-native1417-ddh','3openU3blueflat/yellow1thick2thin3none/2leadersNOheads/ester-dungdịchREGULAR/3numsactualDAM/noaddedlevels-chemicals-answer/noalias1269')
b=path('M1 14L38 35L62 21 M90 21L114 35L152 14L190 35L228 14 M190 35V79 M34 33V64 M42 33V64')
b+=label(76,21,'O',25)+label(38,86,'O',25)+label(259,59,'+',24)+label(284,59,'NaOH',25,'start')
b+=path('M369 49H488',1.7)+'<path d="M472 44L488 49L472 54L476 49Z" fill="#111"/>'+label(430,40,'t',25)+label(443,29,'o',16)
b+=path('M512 14L550 35L573 22 M546 33V64 M554 33V64')+label(550,86,'O',25)+label(578,21,'ONa',25,'start')+label(673,60,'+',24)
b+=path('M728 29L765 50L803 29L841 50L864 37 M765 50V93')+label(869,37,'OH',25,'start')
save(287,'30c291741fa7266cf32f1654732c92fa1732b0b210051887d36a814a16b278c4',b,909,95,'phan-ung-ester-native-ddh','7C2Oester+NaOH→2C2OONa+5C1Oalcohol/2COdouble2splitfeet/2plus1filledRIGHT/t smallSUPo/allthinregularDDH/noaddedconditions-name-answer')
(K/'cau-truc-cap-ester-native1417-ddh-lo-316-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
