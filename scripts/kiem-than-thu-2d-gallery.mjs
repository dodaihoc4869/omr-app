import {chromium} from 'playwright'
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1680}})
await page.goto('http://127.0.0.1:5173')
await page.evaluate(async()=>{
 const {default:React}=await import('/node_modules/.vite/deps/react.js'),{default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js'),{default:Spirit}=await import('/src/game/than-thu-v2/Spirit2D.tsx')
 document.body.innerHTML='<div id="gallery"></div>';document.body.style.background='rgb(14,21,39)'
 const levels=[1,10,30,50,70,100],names=['Thạch Quy','Thuỷ Long','Viêm Sư','Phong Thố','Tinh Lang','Ái Hồ','Ân Lộc','Minh Linh']
 createRoot(document.getElementById('gallery')).render(React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(6,1fr)',color:'white'}},...names.flatMap((name,index)=>levels.map(level=>React.createElement('div',{key:name+level,style:{textAlign:'center',border:'1px solid rgb(45,57,76)'}},React.createElement(Spirit,{index,level,compact:true,low:true}),React.createElement('div',null,name+' · '+level))))))
})
await page.waitForTimeout(1500)
await page.screenshot({path:'/tmp/than-thu-48-2d.png',fullPage:true})
await browser.close()
