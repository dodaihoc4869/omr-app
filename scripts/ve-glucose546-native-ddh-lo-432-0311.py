"""Ba dạng glucose nguồn546: giữ từng H, chỉ số và đầu bán mũi tên."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6702ef90d5118e0511d538cbf2d11aebc0c4adc90d2a2c23e15374cd82b1ccc0';b=''
def path(d,w=1.3):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def fill(d,color='#000000'):
 global b
 b+=f'<path d="{d}" fill="{color}"/>'
def lab(x,y,t,z=30,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=30):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=30):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
# Vòng trái. Hai chân nêm thẳng đứng rộng6px tại C3/C2.
path('M32 132L82 96H146 M173 105L211 132 M82 96V78 M82 96V105 M32 132V112 M32 132V154 M82 168V158 M82 168V191 M160 168V149 M160 168V191 M211 132V111 M211 132V151')
fill('M32 132L82 165.5H160L211 132L160 171.5H82Z')
lab(160,106,'O');first(82,76,'CH₂OH');lab(82,128,'H');lab(32,108,'H');last(35,179,'HO',28);first(82,152,'OH');lab(82,215,'H');lab(160,150,'H');first(160,215,'OH');lab(211,108,'H');first(211,175,'OH')
# Fischer: bốn hàng có thứ tự H/OH,HO/H,H/OH,H/OH.
path('M362 50V186 M335 68H387 M336 100H388 M335 132H387 M335 165H387')
first(362,46,'CHO');first(362,215,'CH₂OH')
for y,t1,t2 in [(80,'H','OH'),(112,'HO','H'),(144,'H','OH'),(176,'H','OH')]:
 if t1=='HO':last(322,y,t1)
 else:lab(323,y,t1)
 if t2=='OH':first(400,y,t2)
 else:lab(402,y,t2)
# Vòng phải có neo riêng, không áp dụng phép dịch nguyên vòng trái.
path('M527 132L577 96H642 M668 105L708 132 M577 96V78 M577 96V104 M527 132V112 M527 132V155 M577 168.5V157 M577 168.5V190 M655 168.5V153 M655 168.5V190 M708 132V115 M708 132V154')
fill('M527 132L577 165.5H655L708 132L655 171.5H577Z')
lab(655,107,'O');first(577,76,'CH₂OH');lab(577,128,'H');lab(527,109,'H');first(527,180,'OH');first(577,153,'OH');lab(577,215,'H');lab(655,150,'H');first(655,215,'OH');first(708,110,'OH');lab(708,178,'H')
# Bốn bán mũi tên: đầu phải ở trên, đầu trái ở dưới.
for x1,x2,y1,y2 in [(236,294,128,134),(444,500,130,136)]:
 path(f'M{x1} {y1}H{x2} M{x1-1} {y2}H{x2-1}',1.5)
 fill(f'M{x2} {y1}L{x2-15} {y1-7}L{x2-13} {y1}Z')
 fill(f'M{x1-1} {y2}L{x1+13} {y2+6}L{x1+13} {y2}Z')
# Hai nhãn OH hemiacetal giữ chữ l cuối; nhãn là regular.
lab(273.5,240,'OH hemiacetal',20.5);lab(707,30,'OH hemiacetal',21.5)
path('M255 220Q235 214 224 190');fill('M224 184L226 204L232 198L238 198Z')
path('M691 36Q710 48 714 69');fill('M716 77L704 62L713 66L720 61Z')
# Hai khung nét đứt, từng đoạn được xác nhận riêng theo nguồn.
BOXES=[[(198,147,200,148),(205,147,209,148),(214,147,218,148),(223,147,226,148),(231,147,235,148),(240,147,243,148),(248,148,250,151),(194,150,196,154),(250,155,251,159),(194,158,195,162),(250,164,251,168),(194,167,195,171),(250,173,251,176),(195,176,197,179),(244,179,248,181),(201,180,205,181),(210,180,213,181),(218,180,222,181),(227,180,231,181),(236,180,239,181)],[(714,81,718,83),(740,81,744,83),(696,82,700,83),(706,82,709,83),(722,82,726,83),(731,82,735,83),(690,84,693,87),(747,85,748,88),(690,92,692,96),(748,93,748,97),(690,100,692,104),(748,101,748,105),(690,109,693,113),(747,110,748,113),(704,115,708,116),(696,115,699,116),(713,115,717,116),(722,115,725,116),(730,115,734,116),(739,115,742,116)]]
# Mỗi bbox là hướng dẫn native xấp xỉ của một đoạn; không phải đo subpixel.
CORNERS={(248,148,250,151):'M248 148.5Q250 149 250.5 152',(194,150,196,154):'M196 150Q194.5 151 194.5 155',(195,176,197,179):'M195.5 176Q195.5 178 197.5 180',(244,179,248,181):'M244 180.5Q247 181 249 179.5',(690,84,693,87):'M693 84.5Q691 85 690.5 88',(747,85,748,88):'M747 85Q748.5 86 748.5 89',(690,109,693,113):'M690.5 109Q691 112 693 113',(747,110,748,113):'M748 110Q748 112 747 114'}
for runs in BOXES:
 for x1,y1,x2,y2 in runs:
  if (x1,y1,x2,y2)in CORNERS:path(CORNERS[x1,y1,x2,y2],2)
  elif x2-x1>=y2-y1:path(f'M{x1} {(y1+y2)/2}H{x2+1}',2)
  else:path(f'M{(x1+x2)/2} {y1}V{y2+1}',2)
for x,y,t in [(220,141,'1'),(168,186,'2'),(92,187,'3'),(20,139,'4'),(72,94,'5'),(82,48,'6'),(361,20,'1'),(352,64,'2'),(352,96,'3'),(352,128,'4'),(352,161,'5'),(352,187,'6'),(717,142,'1'),(665,188,'2'),(587,189,'3'),(515,139,'4'),(566,94,'5'),(578,49,'6')]:lab(x,y,t,18)
lab(108,258,'α-glucose',20.5);lab(399,261,'glucose',20.5);lab(632,258,'β-glucose',21)
# Mảnh bị cắt ở mép trên: không phục hồi phần chữ ngoài ảnh.
fill('M25 0H28L27 2Z M53 0Q59 4 65 0H67Q60 6 52 1Z M107 0H110L109 2Z')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="791" height="270" viewBox="0 0 791 270"><title>Ba dạng glucose theo nguồn546</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose546-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='18C36H18OstructuresEXCLannotationOH/12freeOH3CH2OH-15hydroxylO2ringO1aldehydeO/14standaloneH/2Haworth1Fischer/18nums/4TAPER2boldfront6pxVERTICALfeet82-160and577-655/4HALFfilledharpoons2FULLfilledcurvedleaders/2dashedOHboxes20individualNONPERIODICborderRunsEACH-nativeC1stemOVERLAPSrightbottomdashKEEP/EXACT2OH hemiacetalWITHl-α-glucose-glucose-β-glucose/ALLregularUPRIGHT-SUB2-FIRSTC-FIRSTO-HOlastO/3TOPcroppedUNKNOWNfragmentsKEEP/NOaddedH-equation-condition-answer-alias473151106250/nativeapproxNOTsubpixel'
r=dict(i=546,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-glucose546-native-ddh-lo-432-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-glucose546-lo-432.json').write_text(json.dumps(dict(hash=h,native=[791,270],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all1publicdeVIP27-C2-B4-II-3; left-mid-right3x/heads6x/TOP6x. AnomericOH LEFTdownRIGHTup. FischerH/OH-HO/H-H/OH-H/OH. 4HALFheads2FULLleaders, 4TAPERvertical6px, 18nums. TOPpartialUNKNOWNkeep/noRestore.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
