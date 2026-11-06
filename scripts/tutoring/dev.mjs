import {spawn} from 'node:child_process'
const children=[spawn('pnpm',['tutor:controller'],{stdio:'inherit'}),spawn('pnpm',['dev','--hostname','127.0.0.1'],{stdio:'inherit'})]
for(const c of children)c.on('exit',code=>{if(code)for(const child of children)child.kill()})
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{for(const c of children)c.kill(sig)})
