import {describe,it,expect} from 'vitest'
import {learningBattle,BATTLE_SKINS} from '../src/game/than-thu-v2/learning-battle'
const sequence=(values:boolean[])=>values.map((correct,i)=>({qid:`I_${i}`,correct}))
describe('learning combat is presentation only',()=>{
 it('begins at full health without a result',()=>{expect(learningBattle([],6)).toMatchObject({hp:100,enemy:100,count:0})})
 it('fires an ultimate on each third consecutive correct answer',()=>{expect(learningBattle(sequence([true,true,true]),6)).toMatchObject({enemy:32,streak:3,rage:true,damage:34});expect(learningBattle(sequence([true,true,true,true]),6).rage).toBe(false)})
 it('counterattack resets combo and next correct recovers ten HP',()=>{expect(learningBattle(sequence([true,false]),6)).toMatchObject({hp:82,streak:0,rage:false});expect(learningBattle(sequence([true,false,true]),6)).toMatchObject({hp:92,heal:10,streak:1})})
 it('never makes HP negative, preserves learning at zero, allows recovery',()=>{expect(learningBattle(sequence(Array(8).fill(false)),8)).toMatchObject({hp:0,protected:true});expect(learningBattle(sequence([...Array(8).fill(false),true]),9)).toMatchObject({hp:10,protected:false})})
 it('does not apply a repeated receipt twice',()=>{const a=sequence([true,false]);expect(learningBattle([...a,...a],6)).toEqual(learningBattle(a,6))})
 it('reconstructs the same state when resuming',()=>{const a=sequence([true,false,true,true]);expect(learningBattle(JSON.parse(JSON.stringify(a)),6)).toEqual(learningBattle(a,6))})
 it('scales monster to short sessions without division by zero',()=>{expect(learningBattle(sequence([true]),1).enemy).toBe(0);expect(learningBattle(sequence([true,true]),2).enemy).toBe(0);expect(Number.isFinite(learningBattle([],0).damage)).toBe(true)})
 it('keeps eight distinct skills without changing stable profile IDs',()=>{expect(new Set(BATTLE_SKINS.map(s=>s.move)).size).toBe(8)})
})
