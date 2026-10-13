import {describe,it,expect} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {evolutionStage,evolutionCrop,EVOLUTION_LEVELS} from '../src/game/than-thu-v2/evolution'
describe('one evolution source for artwork and spells',()=>{
 it('only changes forms at the six milestones',()=>{expect([1,9,10,29,30,49,50,69,70,99,100,120].map(evolutionStage)).toEqual([0,0,1,1,2,2,3,3,4,4,5,5])})
 it('all 48 windows fit inside their assigned atlas and do not overlap',()=>{for(let pet=0;pet<8;pet++){let right=0;for(const level of EVOLUTION_LEVELS){const c=evolutionCrop(pet,level);expect(c.x).toBeGreaterThanOrEqual(right);expect(c.y+c.height).toBeLessThanOrEqual(1024);right=c.x+c.width;expect(c.row).toBe(pet%4)}expect(right).toBe(1536)}})
})
