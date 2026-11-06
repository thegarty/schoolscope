import 'dotenv/config'
import {tutorDb as db} from '../../src/lib/tutoring/database'
import {sydneyDay} from '../../src/lib/tutoring/contracts'
async function main(){const command=process.argv[2]||'status';if(['pause','resume'].includes(command))await db.tutoringControl.upsert({where:{id:'global'},create:{id:'global',disabled:command==='pause'},update:{disabled:command==='pause'}});const rows=await db.tutoringReservation.findMany({where:{day:sydneyDay()}});console.log(JSON.stringify({day:sydneyDay(),disabled:(await db.tutoringControl.findUnique({where:{id:'global'}}))?.disabled??false,spentOrReservedUSD:rows.reduce((n,r)=>n+(r.settledMicros??r.reservedMicros),0)/1e6,dailyBudgetUSD:process.env.TUTOR_ENFORCE_LIMITS==='true'?25:null,active:await db.tutoringSession.count({where:{status:'active'}})}))}
main().catch(()=>{console.error('Could not read tutoring controls');process.exitCode=1}).finally(()=>db.$disconnect())
