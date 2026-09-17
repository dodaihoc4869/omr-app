import * as T from 'three'
import {evolutionStage} from './evolution'
/** Fully volumetric models. No sprite planes: all sides remain visible during a complete rotation. */
export function buildSpirit(index:number,level:number,low=false){
 const stage=evolutionStage(level),root=new T.Group();root.name=`spirit-${index}-stage-${stage}`
 const palettes=[['rgb(143,156,94)','rgb(255,191,57)'],['rgb(43,125,216)','rgb(108,226,255)'],['rgb(219,78,29)','rgb(255,192,40)'],['rgb(238,241,223)','rgb(111,224,189)'],['rgb(44,63,118)','rgb(125,169,255)'],['rgb(236,132,179)','rgb(255,190,212)'],['rgb(192,133,47)','rgb(237,214,91)'],['rgb(230,222,249)','rgb(167,136,244)']]
 const palette=palettes[index]??palettes[0]!
 const mat=(color:string,metalness=.05,glow=0)=>new T.MeshStandardMaterial({color,roughness:.48,metalness,emissive:color,emissiveIntensity:glow})
 const body=mat(palette[0]!),accent=mat(palette[1]!,.25,.15),cream=mat('rgb(250,236,208)'),white=mat('rgb(252,251,245)'),dark=mat('rgb(20,28,46)'),gold=mat('rgb(225,181,82)',.65),green=mat('rgb(77,135,57)'),stone=mat('rgb(149,144,114)'),nose=mat('rgb(40,32,42)'),iris=mat(index===0?'rgb(142,87,25)':palette[1]!,.1,.15)
 const mesh=(geo:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;root.add(o);return o}
 const ball=(x:number,y:number,z:number,sx:number,sy:number,sz:number,m=body)=>mesh(new T.SphereGeometry(1,low?12:24,low?8:18),m,x,y,z,sx,sy,sz)
 const gem=(x:number,y:number,z:number,size:number,m=accent)=>{const crystal=mesh(new T.CylinderGeometry(0,size*.65,size*2.6,5,1),m,x,y,z);crystal.rotation.z=x>0?-.12:.12;mesh(new T.CylinderGeometry(size*.65,size*.45,size*.65,5),m,x,y-size*1.55,z);return crystal}
 const cone=(x:number,y:number,z:number,r:number,h:number,m=accent)=>mesh(new T.ConeGeometry(r,h,12),m,x,y,z)
 const tube=(points:number[][],r:number,m=accent)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],p[2]))),20,r,8,false),m,0,0,0)
 const eye=(x:number,y:number,z:number,size=.11)=>{ball(x,y,z,size*1.22,size*1.35,size*.45,cream);ball(x,y,z+size*.39,size*.95,size*1.15,size*.30,iris);ball(x,y,z+size*.65,size*.4,size*.72,size*.16,dark);ball(x-size*.22,y+size*.42,z+size*.82,size*.21,size*.21,size*.09,white)}
 const leaf=(x:number,y:number,z:number,size:number,m=green)=>{const o=ball(x,y,z,size*.4,size,size*.16,m);o.rotation.z=x>0?-.55:.55;return o}
 const wings=(height:number,m=accent)=>{for(const side of [-1,1])for(let i=0;i<5+stage;i++){const f=ball(side*(.43+i*.07),height+i*.065,-.05-i*.05,.09,.36+stage*.025,.055,m);f.rotation.z=side*(-.5-i*.04)}}
 const jewel=()=>{const chain=mesh(new T.TorusGeometry(.265,.025,8,40),gold,0,.97,.56);chain.rotation.x=.5;gem(0,.88,.78,.085+stage*.01)}
 const smile=(y:number,z:number,w=.15)=>{tube([[-w,y+.02,z],[-w*.5,y-.025,z+.02],[0,y-.005,z+.027],[w*.5,y-.025,z+.02],[w,y+.02,z]],.009,nose)}
 const spiral=(x:number,y:number,z:number,size:number)=>{const pts=Array.from({length:22},(_,i)=>{const a=i*.48,r=size*(1-i/27);return [x+Math.cos(a)*r,y+Math.sin(a)*r,z]});tube(pts,.012,cream)}
 const tuft=(x:number,y:number,z:number,size:number,m=body)=>{const points=[new T.Vector2(0,0),new T.Vector2(size*.45,size*.16),new T.Vector2(size*.34,size*.6),new T.Vector2(size*.15,size*.88),new T.Vector2(0,size*1.3)];const geo=new T.LatheGeometry(points,low?7:12);const pos=geo.getAttribute('position');for(let i=0;i<pos.count;i++){const h=pos.getY(i)/size;pos.setX(i,pos.getX(i)+Math.sin(h*2)*size*.15)}geo.computeVertexNormals();return mesh(geo,m,x,y,z)}
 const bloom=(x:number,y:number,z:number)=>{for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(x+Math.cos(a)*.055,y+Math.sin(a)*.055,z,.04,.04,.018,white)}ball(x,y,z+.025,.022,.022,.025,gold)}
 if(index===0){
  ball(0,.53,0,.69,.43,.8,stone);ball(0,.44,.03,.62,.23,.75,cream)
  for(const side of [-1,1])for(const z of [-.47,.43]){ball(side*.55,.2,z,.24,.19,.3,body);for(let j=0;j<3;j++)ball(side*.55+(j-1)*.09,.15,z+.22,.045,.055,.075,cream)}
  ball(0,.6,.79,.4,.34,.34,body);ball(0,.48,1.02,.32,.19,.17,cream);eye(-.19,.72,1.055,.1);eye(.19,.72,1.055,.1);smile(.46,1.18,.25);ball(-.09,.56,1.17,.022,.016,.01,nose);ball(.09,.56,1.17,.022,.016,.01,nose);for(const side of [-1,1]){tube([[side*.1,.86,1.025],[side*.18,.89,1.055],[side*.27,.83,1.035]],.018,body);for(const z of [-.47,.43]){ball(side*.55,.27,z+.17,.18,.15,.08,stone);spiral(side*.55,.28,z+.26,.075)}}
  for(let r=0;r<3;r++)for(let j=0;j<7;j++){const a=j*Math.PI*2/7,rad=.2+r*.18;const plate=mesh(new T.CylinderGeometry(.18,.19,.1,6),j%2?body:stone,Math.cos(a)*rad,.94-r*.07,Math.sin(a)*rad,.95,.6,1);plate.rotation.y=a; if(j%3===0)ball(Math.cos(a)*rad,1-r*.07,Math.sin(a)*rad,.13,.065,.1,green)}
  const wood=mat('rgb(110,77,43)');tube([[0,.9,-.1],[.03,1.2,-.2],[-.08,1.45+stage*.07,-.15]],.07,wood)
  for(let j=0;j<3+stage;j++){const a=j*2.4,x=Math.cos(a)*(.2+stage*.02),z=-.15+Math.sin(a)*.2,y=1.35+(j%3)*.07+stage*.06;tube([[0,1.2,-.15],[x*.5,y-.04,z],[x,y,z]],.028,wood);for(let k=0;k<(low?8:16);k++){const ka=k*2.4,kr=.035*Math.sqrt(k);ball(x+Math.cos(ka)*kr,y+Math.sin(ka)*.025,z+Math.sin(ka)*kr,.095,.075,.085,k%3?green:body)}}
  for(let j=0;j<4+stage*2;j++){const a=j*Math.PI*2/(4+stage*2);gem(Math.cos(a)*.49,.99,Math.sin(a)*.52,.09+stage*.012)}
 }else if(index===7){
  ball(0,.68,0,.47,.6,.34);ball(0,1.3,.07,.48,.38,.35);for(const side of [-1,1]){ball(side*.205,1.32,.35,.23,.25,.04,white);eye(side*.205,1.32,.39,.14);cone(side*.29,1.66,.04,.13,.32,accent);ball(side*.16,.14,.17,.14,.08,.18,gold)}
  wings(.79,body);const beak=cone(0,1.14,.46,.065,.15,gold);beak.rotation.x=Math.PI/2
  for(let j=0;j<3+stage;j++)gem((j-(2+stage)/2)*.1,1.64,.12,.06+stage*.006)
  for(const side of [-1,1])for(let j=0;j<4+stage;j++){const f=gem(side*(.37+j*.07),.85+j*.055,-.14,.055+stage*.007);f.rotation.z=side*.6}
  if(stage>=2){const halo=mesh(new T.TorusGeometry(.5+stage*.025,.016,8,64),gold,0,1.8,-.1);halo.rotation.x=.25}
 }else{
  const deer=index===6,rabbit=index===3,lion=index===2,fox=index===5,water=index===1,wolf=index===4
  ball(0,.56,0,.38,.34,.58);ball(0,.56,.4,.3,.3,.16,cream)
  for(const side of [-1,1])for(const z of [-.35,.35]){ball(side*.27,deer?.3:.22,z,deer?.085:.14,deer?.31:.21,.13);ball(side*.27,.09,z+.06,.13,.09,.19,deer?gold:lion?stone:cream)}
  ball(0,1.05,.47,.36,.34,.34);ball(-.1,.91,.76,.15,.14,.17,cream);ball(.1,.91,.76,.15,.14,.17,cream);ball(0,.97,.91,.055,.04,.025,nose);smile(.85,.87,.12)
  eye(-.175,1.12,.76,.105);eye(.175,1.12,.76,.105)
  for(const side of [-1,1])for(let j=0;j<4;j++){const fur=tuft(side*(.27+j*.035),.96-j*.045,.57,.11,cream);fur.rotation.z=-side*(.7+j*.1)}
  if(!deer&&!rabbit)for(let j=0;j<5;j++){const fur=tuft((j-2)*.07,1.33,.49,.13+(j%2)*.06,body);fur.rotation.z=(j-2)*-.15}
  if(rabbit){for(const side of [-1,1]){const ear=ball(side*.2,1.62,.46,.105,.44+stage*.025,.08,body);ear.rotation.z=-side*.18;const inner=ball(side*.2,1.63,.525,.055,.32+stage*.025,.015,accent);inner.rotation.z=-side*.18}ball(0,.62,-.6,.19,.19,.18,white);if(stage>0)wings(.9,accent)}
  else for(const side of [-1,1]){const ear=cone(side*.25,1.38,.44,.14,.3,body);ear.rotation.z=-side*.2;cone(side*.25,1.39,.49,.085,.19,cream)}
  if(lion){for(let j=0;j<12+stage*2;j++){const a=j*Math.PI*2/(12+stage*2);const f=tuft(Math.cos(a)*.32,1.05+Math.sin(a)*.31,.38,.3+stage*.025,j%2?accent:body);f.rotation.z=a-Math.PI/2}for(let j=0;j<3+stage;j++){const f=tuft((j-(2+stage)/2)*.085,1.37+(j%2)*.04,.43,.25+stage*.035);f.rotation.z=(j-2)*.13}tube([[0,.6,-.48],[.35,.83,-.75],[.5,1.05,-.65]],.045,body);cone(.5,1.15,-.65,.12,.3)}
  if(water){tube([[0,.55,-.45],[.4,.65,-.7],[.54,1.03,-.5],[.35,1.2,-.45]],.11,body);for(const side of [-1,1]){const fin=cone(side*.39,1.05,.42,.2,.45,accent);fin.rotation.z=side*1.1;cone(side*.19,1.5,.44,.065,.24+stage*.03)}for(let j=0;j<4+stage;j++)gem(0,.88,-.4+j*.09,.06)}
  if(wolf){if(stage>0)wings(.82,body);for(const side of [-1,1])for(let j=0;j<4+stage;j++){const feather=cone(side*(.36+j*.06),1.04-j*.07,.12,.09,.27,accent);feather.rotation.z=side*.8}tube([[0,.55,-.48],[-.3,.7,-.8],[-.5,.95,-.65]],.14,body)}
  if(fox){const tails=[1,2,3,5,7,9][stage]!;for(let j=0;j<tails;j++){const a=tails===1?0:(j/(tails-1)-.5)*2.4,x=Math.sin(a)*.64;tube([[0,.55,-.4],[x,.65,-.76],[x*1.2,1.1+Math.cos(a)*.12,-.68]],.12+stage*.008,accent);ball(x*1.2,1.1+Math.cos(a)*.12,-.68,.12,.16,.11,cream)}bloom(-.27,1.32,.7)}
  if(deer){for(const side of [-1,1]){tube([[side*.2,1.32,.44],[side*.3,1.57,.4],[side*.4,1.8+stage*.05,.34]],.035,gold);for(let j=0;j<2+stage;j++){const x=side*(.3+j*.035),y=1.52+j*.07;tube([[side*.3,y,.4],[x+side*.13,y+.1,.37]],.018,gold);leaf(x+side*.14,y+.14,.37,.09);if(stage>0&&j%2===0)bloom(x+side*.15,y+.14,.42)}}for(const side of [-1,1])for(let j=0;j<5;j++)ball(side*.35,.58+(j%2)*.12,-.3+j*.1,.025,.03,.04,cream);ball(0,.66,-.55,.13,.13,.13,cream)}
  if(stage>0)jewel()
  if(stage>=3){const chest=mesh(new T.OctahedronGeometry(.21),gold,0,.91,.69,1,.95,.24);chest.rotation.z=Math.PI/4;mesh(new T.OctahedronGeometry(.14),accent,0,.92,.76,1,1.2,.3);for(const side of [-1,1])for(const z of [-.35,.35]){const cuff=mesh(new T.TorusGeometry(.125,.025,8,24),gold,side*.27,.21,z);cuff.rotation.x=Math.PI/2}gem(0,1.35,.72,.07+stage*.008)}
 }
 // Stage growth affects actual volume and ornamentation; no speed-based rewards.
 const scale=.8+stage*.055;root.scale.setScalar(scale)
 if(stage===5&&index!==0){for(let j=0;j<5;j++){const x=(j-2)*.075;gem(x,index===7?1.87:1.56,.43,.04+(.06-Math.abs(x)*.15),gold)}}
 if(stage>=4)for(let j=0;j<stage+2;j++){const a=j*Math.PI*2/(stage+2);gem(Math.cos(a)*1.05,.3+(j%3)*.25,Math.sin(a)*.95,.055)}
 return root
}
