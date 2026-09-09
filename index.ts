import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.0";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const allowedCategories=new Set(["Sign In","Create Account","Email Verification","Password","Other"]); const encoder=new TextEncoder();
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:corsHeaders})}
function cleanText(value:unknown,max=2000){return String(value??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max)}
async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",encoder.encode(value));return [...new Uint8Array(digest)].map((b)=>b.toString(16).padStart(2,"0")).join("")}

// Notifications are sent only to the owner's fixed support inbox, never to a
// recipient supplied by an anonymous request. The ticket is saved first.
async function notifySupport(ticket: string, email: string, category: string, message: string, appVersion: string, requestId: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.error("Support email unavailable: RESEND_API_KEY missing", { ticket }); return false; }
  const payload = {
    from: "Pocket 64 Support <support@pocket64.app>",
    to: ["pocket64app@gmail.com"],
    reply_to: email,
    subject: `Pocket 64 support — ${ticket} — ${category}`,
    text: `Support ticket: ${ticket}\nFrom: ${email}\nCategory: ${category}\nApp version: ${appVersion || "Unknown"}\n\n${message}`,
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `p64-support/${requestId}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.id) {
        console.info("Support email accepted", { ticket, email_id: result.id });
        return true;
      }
      console.error("Support email rejected", { ticket, status: response.status, code: result.name });
      if (response.status !== 429 && response.status < 500) return false;
    } catch { console.error("Support email request failed", { ticket, attempt }); }
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

Deno.serve(async(req:Request)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});if(req.method!=="POST")return json({error:"Method not allowed"},405);try{const body=await req.json().catch(()=>({}));const email=cleanText(body.email,254).toLowerCase(),category=cleanText(body.category,40),message=cleanText(body.message,2000),website=cleanText(body.website,200),appVersion=cleanText(body.app_version,32),userAgent=cleanText(body.user_agent,500),platform=cleanText(body.platform,120),lastError=cleanText(body.last_error,500),clientRequestId=cleanText(body.client_request_id,36);if(website)return json({ok:true,ticket:""});if(!/^\S+@\S+\.\S+$/.test(email))return json({error:"Enter a valid email address."},400);if(!allowedCategories.has(category))return json({error:"Invalid support category."},400);if(message.length<8||message.length>2000)return json({error:"Support message must be 8–2000 characters."},400);if(!/^[0-9a-f-]{36}$/i.test(clientRequestId))return json({error:"Invalid request id."},400);const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});const forwarded=req.headers.get("x-forwarded-for")||req.headers.get("cf-connecting-ip")||"unknown",ip=forwarded.split(",")[0].trim(),ipHash=await sha256(`p64-support-v1:${ip}`),since=new Date(Date.now()-86400000).toISOString();const[{count:ipCount},{count:emailCount}]=await Promise.all([db.from("support_requests").select("id",{count:"exact",head:true}).eq("ip_hash",ipHash).gte("created_at",since),db.from("support_requests").select("id",{count:"exact",head:true}).eq("email",email).gte("created_at",since)]);if((ipCount??0)>=8||(emailCount??0)>=4)return json({error:"Too many support requests today. Please try again later."},429);let userId:string|null=null;const authHeader=req.headers.get("authorization")||"";if(authHeader.toLowerCase().startsWith("bearer ")){const{data}=await db.auth.getUser(authHeader.slice(7));userId=data?.user?.id??null}const{data,error}=await db.from("support_requests").insert({email,category,message,app_version:appVersion||null,user_agent:userAgent||null,platform:platform||null,last_error:lastError||null,user_id:userId,ip_hash:ipHash,client_request_id:clientRequestId}).select("ticket_code").single();if(error){if(String(error.code)==="23505"){const existing=await db.from("support_requests").select("ticket_code").eq("client_request_id",clientRequestId).maybeSingle();return json({ok:true,ticket:existing.data?.ticket_code||""})}throw error}const ticket=data?.ticket_code||"";const emailAccepted=await notifySupport(ticket,email,category,message,appVersion,clientRequestId);return json({ok:true,ticket,email_notification:emailAccepted?"accepted":"failed"})}catch(error){console.error("Pocket 64 support error",error);return json({error:"Could not save the support request."},500)}});
