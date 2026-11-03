"""Dựng SVG hóa học từ cấu trúc đã đọc ảnh nguồn; kết quả luôn chờ soát bản vẽ độc lập.
python scripts/dung-cau-truc-vector-0311.py <tệp dữ liệu JSON>
"""
from pathlib import Path
import sys,json,hashlib,html,re,math,xml.etree.ElementTree as ET
from rdkit import Chem,rdBase
from rdkit.Chem import rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D
from PIL import ImageFont
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';S=G/'docs/hinh-vector-0311/nguon'
A=sorted(json.loads((S/'kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);BY_HASH={a['hash']:a for a in A}
def special(kind):
 def text(x,y,s,anchor='middle'):return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="DejaVu Sans,Arial,sans-serif" font-size="34" fill="#252440">{s}</text>'
 def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round"/>'
 if kind=='glutamic-cross':
  b=''.join(text(x,232,t)for x,t in [(120,'HO₂C'),(300,'CH₂'),(480,'CH₂'),(650,'C'),(800,'CO₂H')])
  b+=''.join(line(x,220,xx,220)for x,xx in [(169,259),(341,439),(522,630),(671,745)])
  b+=text(650,112,'NH₂')+line(650,130,650,190)+text(650,352,'H')+line(650,245,650,310)
 elif kind=='alkyl12-sulfonic':
  pts=[(550,220),(500,133),(400,133),(350,220),(400,307),(500,307)];b=''
  for i in range(6):b+=line(*pts[i],*pts[(i+1)%6])
  inner=[(450+(x-450)*.8,220+(y-220)*.8)for x,y in pts]
  for i in [1,3,5]:b+=line(*inner[i],*inner[(i+1)%6])
  b+=text(40,232,'CH₃[CH₂]₁₁','start')+line(250,220,350,220)+line(550,220,625,220)+text(650,232,'S')
  b+=text(650,112,'OH')+line(650,130,650,195)+text(775,232,'O')+line(675,215,745,215)+line(675,225,745,225)
  b+=text(650,332,'O')+line(645,245,645,292)+line(655,245,655,292)
 elif kind in ['ala-glu-gly','gly-ala-val']:
  xy=[70,175,270,365,460,555,650,745,850]
  labels=['H₂N','CH'if kind=='ala-glu-gly'else'CH₂','C','N','CH','C','N','CH₂'if kind=='ala-glu-gly'else'CH','COOH']
  ext=[38,30,16,18,30,16,18,35,54]
  b=''.join(text(x,232,t)for x,t in zip(xy,labels))
  for k in range(8):b+=line(xy[k]+ext[k],220,xy[k+1]-ext[k+1],220)
  for x in [270,555]:b+=text(x,112,'O')+line(x-5,132,x-5,194)+line(x+5,132,x+5,194)
  for x in [365,650]:b+=line(x,248,x,273)+text(x,310,'H')
  sides=[(175,'CH₃'),(460,'CH₂CH₂COOH')]if kind=='ala-glu-gly'else[(460,'CH₃'),(745,'CH(CH₃)₂')]
  for x,t in sides:b+=line(x,248,x,320)+text(x,360,t)
  return '<svg xmlns="http://www.w3.org/2000/svg" width="950" height="400" viewBox="0 0 950 400"><title>Biểu thức cấu tạo peptide theo hình nguồn</title>'+b+'</svg>'
 elif kind=='styrene-vong-tron-chu':
  pts=[(240,140),(205,79),(135,79),(100,140),(135,201),(205,201)]
  b=''.join(line(*pts[i],*pts[(i+1)%6])for i in range(6))
  b+='<circle cx="170" cy="140" r="46" fill="none" stroke="#252440" stroke-width="2.5"/>'
  b+=line(240,140,280,140)+text(292,152,'CH=CH₂.','start')
  return '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="280" viewBox="0 0 600 280"><title>Công thức styrene theo hình nguồn</title>'+b+'</svg>'
 elif kind=='nguon-H3N-ch2-ch2-coo':
  b=text(100,190,'H₃N')+line(148,174,230,126)+line(230,126,330,184)+line(330,184,393,148)+text(455,158,'COO⁻')
  return '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="260" viewBox="0 0 600 260"><title>Biểu diễn nguyên văn theo hình nguồn</title>'+b+'</svg>'
 else:raise ValueError('Chưa có cách dựng đặc biệt '+kind)
 return '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="400" viewBox="0 0 900 400"><title>Biểu diễn cấu tạo theo hình nguồn</title>'+b+'</svg>'
def compose_grid(r):
 ns='http://www.w3.org/2000/svg';ET.register_namespace('',ns)
 panels=r['panels'];columns=min(2,max(1,int(r.get('columns',len(panels)))));rows=math.ceil(len(panels)/columns)
 bodyW=360;bodyH=120 if r.get('compact')else 220;gap=24;captionRows=max([len(p.get('caption',[]))for p in panels]+[1]);cellH=bodyH+captionRows*28+16
 width=columns*bodyW+(columns+1)*gap;height=rows*cellH+(rows+1)*gap
 root=ET.Element('{'+ns+'}svg',{'width':str(width),'height':str(height),'viewBox':f'0 0 {width} {height}','role':'img'})
 ET.SubElement(root,'{'+ns+'}title').text='Các cấu trúc theo hình nguồn';rendered=[]
 for i,p in enumerate(panels):
  child={'hash':r['hash'],'i':r['i'],'caption':[],'canvasWidth':bodyW,'canvasHeight':bodyH}
  if 'text'in p:child['textNguyenVan']=p['text']
  else:child['smiles']=p['smiles']
  for old,new in [('circle','vongThomDangTron'),('explicitH','giuHTuongMinh'),('terminalONa','terminalONa'),('terminalCationText','terminalCationText'),('nhanNguyenTu','nhanNguyenTu')]:
   if p.get(old):child[new]=p[old]
  item=build([child])[0]
  if item.get('trangThai')!='cho-soat-doc-lap':raise ValueError('Lỗi dựng panel '+str(i+1)+': '+item.get('loi',''))
  x=gap+(i%columns)*(bodyW+gap);y=gap+(i//columns)*(cellH+gap)
  if r.get('panelBorder'):
   attrs={'x':str(x-4),'y':str(y-4),'width':str(bodyW+8),'height':str(cellH+8),'rx':'4','fill':'none','stroke':'#c9c9de','stroke-width':'1.5'}
   if r['panelBorder']=='dashed':attrs['stroke-dasharray']='7 5'
   ET.SubElement(root,'{'+ns+'}rect',attrs)
  inner=ET.fromstring((M/item['svg']).read_text());inner.attrib.update({'x':str(x),'y':str(y),'width':str(bodyW),'height':str(bodyH),'preserveAspectRatio':'xMidYMid meet'});root.append(inner)
  for n,caption in enumerate(p.get('caption',[])):
   text=ET.SubElement(root,'{'+ns+'}text',{'x':str(x+bodyW/2),'y':str(y+bodyH+25+n*28),'text-anchor':'middle','font-family':'DejaVu Sans,Arial,sans-serif','font-size':'22','fill':'#087f8e'})
   if 'pH_I'in caption:
    before,after=caption.split('pH_I',1);text.text=before+'pH';sub=ET.SubElement(text,'{'+ns+'}tspan',{'baseline-shift':'sub','font-size':'70%'});sub.text='I';sub.tail=after
   else:text.text=caption
  separator=(r.get('separators')or[])[i]if i<len(r.get('separators')or[])else None
  if separator:
   sx=x+bodyW+8;sy=y+bodyH*.6
   if separator=='và' and (i+1)%columns==0 and i+1<len(panels):sx=4;sy=y+cellH+gap+bodyH/2+8
   t=ET.SubElement(root,'{'+ns+'}text',{'x':str(sx),'y':str(sy),'font-family':'DejaVu Sans,Arial,sans-serif','font-size':'22','fill':'#252440'});t.text=separator
  rendered.append({'panel':i+1,'smiles':p.get('smiles'),'text':p.get('text'),'caption':p.get('caption',[]),'hashSvg':item['hashSvg'],'svg':item['svg'],'congThuc':item.get('congThuc')})
 return ET.tostring(root,encoding='unicode'),rendered
def build(source):
 results=[]
 for row in source:
  r=dict(row)
  try:
   if r.get('tamGiu'):
    r['trangThai']='can-soat-dang-bieu-dien';results.append(r);continue
   if r['hash']not in BY_HASH:raise ValueError('Không tìm thấy hash nguồn đã đọc')
   if r.get('kind')=='grid':
    svg,children=compose_grid(r);b=svg.encode();digest=hashlib.sha256(b).hexdigest();fn='cau-truc-grid-'+digest+'.svg';(M/fn).write_bytes(b)
    r.update(svg=fn,hashSvg=digest,byteSvg=len(b),panelsRendered=children,trangThai='cho-soat-doc-lap',boCuc='Giữ thứ tự và nhãn nguồn, tối đa2cột để rõ trên màn hình hẹp.');results.append(r);continue
   if 'textNguyenVan'in r:
    text=r['textNguyenVan'];width=int(r.get('canvasWidth',660));height=int(r.get('canvasHeight',150));measured=ImageFont.truetype('DejaVuSans.ttf',30).getlength(text);font=30*min(1,(width-40)/max(1,measured))
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><title>Biểu thức theo hình nguồn</title><text x="{width/2}" y="{height/2+font*.35}" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="{font:.2f}" fill="#252440">'+html.escape(text)+'</text></svg>'
    b=svg.encode();digest=hashlib.sha256(b).hexdigest();fn='cau-truc-'+digest+'.svg';(M/fn).write_bytes(b);r.update(svg=fn,hashSvg=digest,byteSvg=len(b),trangThai='cho-soat-doc-lap');results.append(r);continue
   if r.get('giuNguyenVanKhongSuyHoaTri'):
    svg=special(r['kieuDacBiet']);b=svg.encode();digest=hashlib.sha256(b).hexdigest();fn='cau-truc-'+digest+'.svg';(M/fn).write_bytes(b)
    r.update(svg=fn,hashSvg=digest,byteSvg=len(b),smilesChuan=None,congThuc=None,soNguyenTuNang=None,rdkit=None,trangThai='cho-soat-doc-lap');results.append(r);continue
   params=Chem.SmilesParserParams();params.removeHs=not r.get('giuHTuongMinh',False)
   mol=Chem.MolFromSmiles(r['smiles'],params)
   if mol is None:raise ValueError('Cấu trúc không qua kiểm hóa trị của RDKit')
   for label,aromatic in [('aromaticN',True),('aliphaticN',False)]:
    if label not in r.get('nhanNguyenTu',{}):continue
    atoms=[a for a in mol.GetAtoms()if a.GetAtomicNum()==7 and a.GetIsAromatic()==aromatic]
    if len(atoms)!=1:raise ValueError('Nhãn nguyên tử không xác định duy nhất')
    atoms[0].SetProp('atomNote',r['nhanNguyenTu'][label])
   drawMol=Chem.Mol(mol)
   if r.get('terminalONa') or r.get('terminalCationText'):
    # Nhóm thu gọn ONa đúng kiểu nguồn; mô hình hoá học đầy đủ vẫn giữ Na+ và O−.
    rw=Chem.RWMol(drawMol)
    cation=r.get('terminalCationText','ONa');number=19 if cation=='OK'else 11
    sodium=[a.GetIdx()for a in rw.GetAtoms()if a.GetAtomicNum()==number]
    if len(sodium)!=1:raise ValueError('Nhóm ONa cần đúng một Na')
    rw.RemoveAtom(sodium[0]);drawMol=rw.GetMol()
    terminal=[a for a in drawMol.GetAtoms()if a.GetAtomicNum()==8 and a.GetFormalCharge()==-1]
    if len(terminal)!=1:raise ValueError('Nhóm ONa không xác định duy nhất')
    a=terminal[0];a.SetAtomicNum(0);a.SetFormalCharge(0);a.SetNoImplicit(True);a.SetNumExplicitHs(0);a.SetNumRadicalElectrons(0);a.SetProp('atomLabel',cation)
   # Mọi chỉ định lập thể/đồng vị/điện tích trong dữ liệu đọc nguồn được giữ.
   width=int(r.get('canvasWidth',720 if mol.GetNumHeavyAtoms()>20 else 600));height=int(r.get('canvasHeight',340))
   d=rdMolDraw2D.MolDraw2DSVG(width,height);o=d.drawOptions()
   o.clearBackground=False;o.setAtomPalette({i:(37/255,36/255,64/255)for i in range(0,119)})
   if r.get('phongApp'):
    import importlib.util
    spec=importlib.util.spec_from_file_location('phong_vector',G/'scripts/phong-vector-0311.py');phong=importlib.util.module_from_spec(spec);spec.loader.exec_module(phong);o.fontFile=str(phong.PATH);r['font']='DDH Rounded';r['hashPhong']=phong.HASH
   o.bondLineWidth=2.5;o.minFontSize=20;o.maxFontSize=30;o.padding=.12;o.legendFontSize=22;o.legendFraction=.15
   o.setLegendColour((8/255,127/255,142/255))
   legend='\n'.join(r.get('caption',[]))
   rdMolDraw2D.PrepareAndDrawMolecule(d,drawMol,legend=legend)
   d.FinishDrawing();svg=d.GetDrawingText().replace("encoding='iso-8859-1'", "encoding='UTF-8'")
   if r.get('vongThomDangTron'):
    ns='http://www.w3.org/2000/svg';ET.register_namespace('',ns);root=ET.fromstring(svg)
    for ring in drawMol.GetRingInfo().AtomRings():
     if len(ring)!=6 or not all(drawMol.GetAtomWithIdx(a).GetIsAromatic() and drawMol.GetAtomWithIdx(a).GetAtomicNum()==6 for a in ring):continue
     bonds=[drawMol.GetBondBetweenAtoms(ring[k],ring[(k+1)%6]).GetIdx() for k in range(6)]
     for bi in bonds:
      paths=[x for x in root if x.tag.endswith('path') and re.match(rf'^bond-{bi}(?: |$)',x.attrib.get('class',''))]
      if len(paths)>1:
       def length(p):
        v=[float(x)for x in re.findall(r'-?\d+(?:\.\d+)?',p.attrib.get('d',''))]
        return math.hypot(v[-2]-v[0],v[-1]-v[1])if len(v)>=4 else 0
       keep=max(paths,key=length)
       for p in paths:
        if p is not keep:root.remove(p)
     xy=[d.GetDrawCoords(a)for a in ring];cx=sum(p.x for p in xy)/6;cy=sum(p.y for p in xy)/6;radius=sum(math.hypot(p.x-cx,p.y-cy)for p in xy)/6*.6
     ET.SubElement(root,'{'+ns+'}circle',{'cx':f'{cx:.2f}','cy':f'{cy:.2f}','r':f'{radius:.2f}','fill':'none','stroke':'#252440','stroke-width':'2.5'})
    svg=ET.tostring(root,encoding='unicode')
   if r.get('nhanTrongVong'):
    label=r['nhanTrongVong'];rings=[ring for ring in drawMol.GetRingInfo().AtomRings()if len(ring)==label['soCanh']and any(drawMol.GetAtomWithIdx(a).GetAtomicNum()==7 for a in ring)]
    if len(rings)!=1:raise ValueError('Nhãn vòng không xác định duy nhất')
    xy=[d.GetDrawCoords(a)for a in rings[0]];cx=sum(p.x for p in xy)/len(xy);cy=sum(p.y for p in xy)/len(xy)
    ns='http://www.w3.org/2000/svg';ET.register_namespace('',ns);root=ET.fromstring(svg)
    t=ET.SubElement(root,'{'+ns+'}text',{'x':f'{cx:.2f}','y':f'{cy+7:.2f}','text-anchor':'middle','font-family':'DejaVu Sans,Arial,sans-serif','font-size':'22','fill':'#252440'});t.text=label['chu'];svg=ET.tostring(root,encoding='unicode')
   at=svg.find('>',svg.find('<svg'))+1;svg=svg[:at]+'<title>Công thức cấu tạo theo hình nguồn</title>'+svg[at:]
   if r['smiles']=='[H]O[H]':
    svg='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="110" viewBox="0 0 300 110"><title>Liên kết trong phân tử nước</title><g fill="#252440" font-family="DejaVu Sans,Arial,sans-serif" font-size="32" text-anchor="middle"><text x="45" y="66">H</text><text x="150" y="66">O</text><text x="255" y="66">H</text></g><path d="M65 55H125M175 55H235" stroke="#252440" stroke-width="2.5"/></svg>'
   if r.get('bieuThucChu'):
    svg='<svg xmlns="http://www.w3.org/2000/svg" width="660" height="110" viewBox="0 0 660 110"><title>Biểu thức cấu tạo theo hình nguồn</title><text x="24" y="68" font-family="DejaVu Sans,Arial,sans-serif" font-size="32" fill="#252440">'+html.escape(r['bieuThucChu'])+'</text></svg>'
   if r.get('kieuDacBiet'):svg=special(r['kieuDacBiet'])
   b=svg.encode();digest=hashlib.sha256(b).hexdigest();fn='cau-truc-'+digest+'.svg';(M/fn).write_bytes(b)
   r.update(svg=fn,hashSvg=digest,byteSvg=len(b),smilesChuan=Chem.MolToSmiles(mol),congThuc=rdMolDescriptors.CalcMolFormula(mol),soNguyenTuNang=mol.GetNumHeavyAtoms(),rdkit=rdBase.rdkitVersion,trangThai='cho-soat-doc-lap')
  except Exception as e:r.update(trangThai='loi-dung',loi=str(e))
  results.append(r)
 return results
if __name__=='__main__':
 p=Path(sys.argv[1]);out=p.with_name(p.stem+'-ban-dung.json')
 previous={(a['hash'],a.get('hashSvg')):a for a in json.loads(out.read_text())}if out.exists()else{}
 r=build(json.loads(p.read_text()))
 # Chỉ giữ chứng nhận nếu cả hash nguồn và toàn bộ byteSVG không đổi.
 for item in r:
  old=previous.get((item['hash'],item.get('hashSvg')), {})
  if old.get('trangThai')=='da-soat-doc-lap' and old.get('hashSvgDaSoat')==item.get('hashSvg'):
   for key in ['trangThai','hashSvgDaSoat','nguoiSoat']:
    if key in old:item[key]=old[key]
 out.write_text(json.dumps(r,ensure_ascii=False,indent=2))
 print('Đã dựng',len(r),'nguồn; đã soát',sum(a['trangThai']=='da-soat-doc-lap'for a in r),'; còn chờ',sum(a['trangThai']=='cho-soat-doc-lap'for a in r),out)
