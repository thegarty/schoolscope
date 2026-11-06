import type { LessonContext, TeachingBlock } from './contracts'
// Reviewed teaching context, not an assertion of a particular school's teaching sequence.
export const CURRICULUM_VERSION='2026-11-06.1'
export const STATES = {
 NSW:{name:'New South Wales',authority:'NSW Education Standards Authority',url:'https://curriculum.nsw.edu.au/learning-areas/mathematics'},
 VIC:{name:'Victoria',authority:'Victorian Curriculum and Assessment Authority',url:'https://f10.vcaa.vic.edu.au/learning-areas/mathematics/introduction'},
 QLD:{name:'Queensland',authority:'Queensland Curriculum and Assessment Authority',url:'https://www.qcaa.qld.edu.au/p-10/aciq'},
 WA:{name:'Western Australia',authority:'School Curriculum and Standards Authority',url:'https://k10outline.scsa.wa.edu.au/home/teaching/curriculum-browser/mathematics'},
 SA:{name:'South Australia',authority:'Australian Curriculum',url:'https://www.australiancurriculum.edu.au/'},
 TAS:{name:'Tasmania',authority:'Australian Curriculum',url:'https://www.australiancurriculum.edu.au/'},
 ACT:{name:'Australian Capital Territory',authority:'Australian Curriculum',url:'https://www.australiancurriculum.edu.au/'},
 NT:{name:'Northern Territory',authority:'Australian Curriculum',url:'https://www.australiancurriculum.edu.au/'},
} as const
export const LESSONS = {
 fractions:{title:'Make sense of fractions',short:'Fractions',prompt:'How can we show that 1/2 and 2/4 are the same amount?',worksheet:['A picnic sandwich is cut into four equal pieces.','1. Shade two pieces. What fraction have you shaded?','2. Is that the same as one half? Explain why.','3. Can you find another fraction equal to one half?'],colour:'#5d68c4'},
 multiplication:{title:'Find a smarter way to multiply',short:'Multiplication',prompt:'There are 6 rows of 8 chairs. How could you work out the total without counting every chair?',worksheet:['Six rows. Eight chairs in each row.','1. Sketch the rows or use a number line.','2. Split 6 × 8 into two easier facts.','3. How many chairs are there altogether?'],colour:'#d47c4f'},
 measurement:{title:'Measure a little garden',short:'Measurement',prompt:'A garden is 6 metres long and 4 metres wide. How much edging does it need?',worksheet:['A rectangular garden measures 6 m by 4 m.','1. Label the sides of the garden.','2. Work out the distance around the outside.','3. How is that different from the space inside?'],colour:'#3e8878'},
} as const
export function curriculum(context: LessonContext) {
 const level=context.year<=4?'Years 3–4: use concrete representations, equal parts, multiplication facts, and familiar metric units.':'Years 5–6: connect representations to equivalent fractions, efficient multiplication, and perimeter/area with appropriate units.'
 const regional=context.state==='NSW'?`NSW ${context.year<=4?'Stage 2':'Stage 3'} teaching context.`:context.state==='VIC'?`Victorian Levels ${context.year<=4?'3–4':'5–6'} teaching context.`:`Australian Curriculum Years ${context.year<=4?'3–4':'5–6'} teaching context.`
 return {version:CURRICULUM_VERSION,...STATES[context.state],guidance:`${regional} ${level} Use Australian English, metric units and dollars. This is broad year-band guidance, not verified syllabus-outcome mapping or the school's current lesson.`}
}
export function starterBlocks(c: LessonContext): TeachingBlock[] {
 if(c.lesson==='fractions') return [{id:'welcome',kind:'fraction',title:'Two out of four equal parts',numerator:2,denominator:4},{id:'first-question',kind:'question',title:'Your first thought',question:'What do you notice about the shaded part?',hint:'Imagine joining the two shaded pieces together.',options:['Exactly half is shaded','The whole bar is shaded','Nothing is shaded']}]
 if(c.lesson==='multiplication') return [{id:'welcome',kind:'numberline',title:'Build equal groups',min:0,max:48,points:[0,8,16,24,32,40,48]},{id:'first-question',kind:'question',title:'Your first thought',question:'What changes each time we move along the line?',hint:'Look at the gaps between the numbers.',options:['We add 8 each time','We add 6 each time','We double each number']}]
 return [{id:'welcome',kind:'geometry',title:'Our garden',shape:'rectangle',width:6,height:4,unit:'m'},{id:'first-question',kind:'question',title:'Your first thought',question:'Which sides would need edging?',hint:'Trace around the outside with your finger.',options:['All four outside edges','Only the two long edges','The space inside the garden']}]
}
