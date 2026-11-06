import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
const local=()=>path.resolve(process.env.TUTOR_UPLOAD_DIR || '.tutor-uploads')
function localPath(key:string) { if(!/^[a-f0-9-]+\.(jpg|pdf)$/.test(key)) throw new Error('Invalid storage key'); return path.join(local(),key) }
let s3:S3Client|undefined
function client() { return s3??=new S3Client({endpoint:process.env.TUTOR_S3_ENDPOINT,region:process.env.TUTOR_S3_REGION || 'auto',forcePathStyle:true,credentials:{accessKeyId:process.env.TUTOR_S3_ACCESS_KEY!,secretAccessKey:process.env.TUTOR_S3_SECRET_KEY!}}) }
export async function putObject(key:string,data:Buffer,mime:string) {
 if(process.env.TUTOR_S3_BUCKET) await client().send(new PutObjectCommand({Bucket:process.env.TUTOR_S3_BUCKET,Key:key,Body:data,ContentType:mime}))
 else { await mkdir(local(),{recursive:true,mode:0o700}); await writeFile(localPath(key),data,{mode:0o600}) }
}
export async function getObject(key:string) { if(!process.env.TUTOR_S3_BUCKET) return readFile(localPath(key)); const response=await client().send(new GetObjectCommand({Bucket:process.env.TUTOR_S3_BUCKET,Key:key})); return Buffer.from(await response.Body!.transformToByteArray()) }
export async function deleteObject(key:string) { if(process.env.TUTOR_S3_BUCKET) await client().send(new DeleteObjectCommand({Bucket:process.env.TUTOR_S3_BUCKET,Key:key})); else await unlink(localPath(key)).catch(e=>{if(e.code!=='ENOENT')throw e}) }
