import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "rriscrazy@gmail.com";

const ALLOWED_ORIGINS = [
  "https://personalbuddy.lovable.app",
  "https://id-preview--8430cbd5-a7f6-45ff-b5f0-91dbe9719eef.lovable.app",
  "https://8430cbd5-a7f6-45ff-b5f0-91dbe9719eef.lovableproject.com",
  "http://localhost:5173",
];

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.some(a =>
    origin === a || origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com"));
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const profileId = typeof body.profileId === "string" ? body.profileId : "";
    if (!profileId || !isValidUUID(profileId)) {
      return new Response(JSON.stringify({ error: "Invalid profileId" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error } = await supabase
      .from("friend_profiles")
      .select("id, full_name, email, age, education, hobbies, bio_data, action_token, profile_picture_url")
      .eq("id", profileId)
      .maybeSingle();

    if (error || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const baseUrl = `${SUPABASE_URL}/functions/v1/handle-action`;
    const approveUrl = `${baseUrl}?type=profile&action=approve&token=${profile.action_token}`;
    const rejectUrl = `${baseUrl}?type=profile&action=reject&token=${profile.action_token}`;

    const html = `
      <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:linear-gradient(135deg,#fff9e6 0%,#e6f3ff 100%);padding:40px;border-radius:20px;">
        <h1 style="color:#1a365d;margin:0 0 20px;">🆕 New Buddy Profile — Approval Needed</h1>
        <p style="color:#4a5568;">A new buddy has submitted their profile for review.</p>

        ${profile.profile_picture_url ? `<div style="text-align:center;margin:16px 0;"><img src="${escapeHtml(profile.profile_picture_url)}" alt="Profile" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #e5a91a;"/></div>` : ""}

        <div style="background:#fff;padding:24px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1);margin:20px 0;">
          <h2 style="color:#e5a91a;margin-top:0;">Profile Details</h2>
          <p style="margin:8px 0;"><strong>Name:</strong> ${escapeHtml(profile.full_name)}</p>
          <p style="margin:8px 0;"><strong>Email:</strong> ${escapeHtml(profile.email)}</p>
          <p style="margin:8px 0;"><strong>Age:</strong> ${escapeHtml(String(profile.age))}</p>
          <p style="margin:8px 0;"><strong>Education:</strong> ${escapeHtml(profile.education)}</p>
          <p style="margin:8px 0;"><strong>Hobbies:</strong> ${escapeHtml(profile.hobbies)}</p>
          <p style="margin:8px 0;"><strong>Bio:</strong> ${escapeHtml(profile.bio_data)}</p>
        </div>

        <div style="text-align:center;margin:32px 0;">
          <a href="${approveUrl}" style="display:inline-block;background:#166534;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;margin:6px;">✅ Approve</a>
          <a href="${rejectUrl}" style="display:inline-block;background:#991b1b;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;margin:6px;">❌ Reject</a>
        </div>

        <p style="color:#a0aec0;font-size:12px;text-align:center;">One click is all it takes — the buddy will be notified automatically.</p>
      </div>
    `;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🆕 Buddy Profile Approval: ${escapeHtml(profile.full_name)}`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Resend failed", await res.text());
      throw new Error("Email service error");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("send-profile-approval-email error", (err as Error).message);
    return new Response(JSON.stringify({ error: "Failed to send approval email" }), {
      status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(null) },
    });
  }
};

serve(handler);