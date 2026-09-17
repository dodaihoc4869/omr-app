import {describe,it,expect} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import Spirit2D from '../src/game/than-thu-v2/Spirit2D'
import {evolutionStage,evolutionCrop,EVOLUTION_LEVELS} from '../src/game/than-thu-v2/evolution'
describe('one evolution source for artwork and spells',()=>{
 it('only changes forms at the six milestones',()=>{expect([1,9,10,29,30,49,50,69,70,99,100,120].map(evolutionStage)).toEqual([0,0,1,1,2,2,3,3,4,4,5,5])})
 it('all 48 windows fit inside their assigned atlas and do not overlap',()=>{for(let pet=0;pet<8;pet++){let right=0;for(const level of EVOLUTION_LEVELS){const c=evolutionCrop(pet,level);expect(c.x).toBeGreaterThanOrEqual(right);expect(c.y+c.height).toBeLessThanOrEqual(1024);right=c.x+c.width;expect(c.row).toBe(pet%4)}expect(right).toBe(1536)}})
 it('all 48 illustrations select the right transparent atlas and clipped level',()=>{
  for(let pet=0;pet<8;pet++)for(const level of EVOLUTION_LEVELS){
   const c=evolutionCrop(pet,level),html=renderToStaticMarkup(createElement(Spirit2D,{index:pet,level,motion:'cast',event:1,battle:true}))
   expect(html).toContain(`data-stage="${evolutionStage(level)}"`)
   expect(html).toContain(`evolution-${pet<4?'elements':'virtues'}-cutout.png`)
   expect(html).toContain(`viewBox="0 0 ${c.width} ${c.height}"`)
   expect(html).toContain('clipPath');expect(html).not.toContain('<canvas')
   expect(html).toContain('spirit-2d-cast')
  }
 })
})
