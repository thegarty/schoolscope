import 'dotenv/config'
import OpenAI from 'openai'
const client=new OpenAI({maxRetries:0})
async function main(){for(const name of ['gpt-live-1','gpt-6-luna','gpt-6-sol']) {
 const model=await client.models.retrieve(name)
 console.log(`${name}: ${model.id===name?'available':'unexpected model identifier'}`)
}
}
main().catch(()=>{console.error("Model availability verification failed");process.exitCode=1})
