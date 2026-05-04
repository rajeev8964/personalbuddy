import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const htmlPage = (title: string, body: string, color = "#166534") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#fff9e6 0%,#e6f3ff 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
  .card{background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.08);padding:40px;max-width:520px;text-align:center;}
  h1{color:${color};margin:0 0 16px;font-size:26px;}
  p{color:#4a5568;line-height:1.6;margin:0 0 12px;}
  .badge{display:inline-block;background:${color};color:#fff;padding:8px 18px;border-radius:999px;font-weight:bold;margin:12px 0 18px;}
  a{color:#e5a91a;text-decoration:none;font-weight:bold;}
</style></head><body><div class="card">${body}</div></body></html>`;

async function sendEmail(payload: Record<string, unknown>) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("sendEmail failed", (e as Error).message);
  }
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // 'profile' | 'booking'
  const action = url.searchParams.get("action"); // approve|reject|confirm|decline
  const token = url.searchParams.get("token") ?? "";

  if (!token || !isValidUUID(token)) {
    return new Response(htmlPage("Invalid link", `<h1>Invalid link</h1><p>This action link is missing or malformed.</p>`, "#991b1b"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (type === "profile") {
      if (action !== "approve" && action !== "reject") {
        return new Response(htmlPage("Invalid action", `<h1>Invalid action</h1>`, "#991b1b"), {
          status: 400, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      const { data: profile, error: pErr } = await supabase
        .from("friend_profiles")
        .select("id, full_name, email, is_approved, action_token, action_token_used_at, action_token_expires_at")
        .eq("action_token", token)
        .maybeSingle();
      if (pErr || !profile) {
        return new Response(htmlPage("Not found", `<h1>Profile not found</h1><p>This link may have expired or already been used.</p>`, "#991b1b"), {
          status: 404, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      if ((profile as any).action_token_used_at) {
        return new Response(htmlPage("Link already used", `<h1>Link already used</h1><p>This approval link has already been used and cannot be reused.</p>`, "#991b1b"), {
          status: 410, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      if ((profile as any).action_token_expires_at && new Date((profile as any).action_token_expires_at).getTime() < Date.now()) {
        return new Response(htmlPage("Link expired", `<h1>Link expired</h1><p>This approval link has expired. Please review the profile from the admin portal.</p>`, "#991b1b"), {
          status: 410, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const approve = action === "approve";
      const { error: uErr } = await supabase
        .from("friend_profiles")
        .update({
          is_approved: approve,
          action_token_used_at: new Date().toISOString(),
          action_token: crypto.randomUUID(),
        })
        .eq("id", profile.id)
        .is("action_token_used_at", null);
      if (uErr) throw uErr;

      // Notify the profile owner
      const subject = approve
        ? "🎉 Your buddy profile has been approved!"
        : "Update on your buddy profile";
      const body = approve
        ? `<h1 style="color:#166534;">Hey ${escapeHtml(profile.full_name)}! 🎉</h1>
           <p>Great news — your buddy profile has been <strong>approved</strong> and is now visible to customers.</p>
           <p>You can manage your availability and bookings from your buddy dashboard.</p>`
        : `<h1 style="color:#991b1b;">Hi ${escapeHtml(profile.full_name)},</h1>
           <p>We've reviewed your buddy profile and are unable to approve it at this time.</p>
           <p>You can edit and resubmit your profile from the create-profile page.</p>`;

      await sendEmail({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: [profile.email],
        subject,
        html: `<div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:linear-gradient(135deg,#fff9e6 0%,#e6f3ff 100%);padding:40px;border-radius:20px;">${body}</div>`,
      });

      const color = approve ? "#166534" : "#991b1b";
      return new Response(
        htmlPage(
          approve ? "Profile approved" : "Profile rejected",
          `<h1>${approve ? "Profile Approved ✅" : "Profile Rejected ❌"}</h1>
           <div class="badge">${escapeHtml(profile.full_name)}</div>
           <p>The buddy has been notified by email.</p>`,
          color,
        ),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    if (type === "booking") {
      if (action !== "confirm" && action !== "decline") {
        return new Response(htmlPage("Invalid action", `<h1>Invalid action</h1>`, "#991b1b"), {
          status: 400, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      const { data: booking, error: bErr } = await supabase
        .from("friend_bookings")
        .select("id, client_name, client_email, activity, booking_date, booking_time, status, action_token, action_token_used_at, action_token_expires_at, friend_id, friend_profiles:friend_id(full_name)")
        .eq("action_token", token)
        .maybeSingle();
      if (bErr || !booking) {
        return new Response(htmlPage("Not found", `<h1>Booking not found</h1><p>This link may have expired or already been used.</p>`, "#991b1b"), {
          status: 404, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      if ((booking as any).action_token_used_at) {
        return new Response(htmlPage("Link already used", `<h1>Link already used</h1><p>This booking link has already been used and cannot be reused.</p>`, "#991b1b"), {
          status: 410, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      if ((booking as any).action_token_expires_at && new Date((booking as any).action_token_expires_at).getTime() < Date.now()) {
        return new Response(htmlPage("Link expired", `<h1>Link expired</h1><p>This booking link has expired. Please manage the booking from the dashboard.</p>`, "#991b1b"), {
          status: 410, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const newStatus = action === "confirm" ? "confirmed" : "cancelled";
      const { error: uErr } = await supabase
        .from("friend_bookings")
        .update({
          status: newStatus,
          action_token_used_at: new Date().toISOString(),
          action_token: crypto.randomUUID(),
        })
        .eq("id", booking.id)
        .is("action_token_used_at", null);
      if (uErr) throw uErr;

      const buddy = (booking as any).friend_profiles;
      const buddyName = buddy?.full_name ?? "Your Buddy";
      const isConfirmed = newStatus === "confirmed";
      const subject = isConfirmed
        ? `✅ Your booking with ${buddyName} is confirmed!`
        : `❌ Booking update: session with ${buddyName}`;
      const html = `<div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:linear-gradient(135deg,${isConfirmed ? '#e6ffe6' : '#fff5f5'} 0%,#e6f3ff 100%);padding:40px;border-radius:20px;">
        <h1 style="color:${isConfirmed ? '#166534' : '#991b1b'};">Hey ${escapeHtml(booking.client_name)},</h1>
        <p>Your booking with <strong>${escapeHtml(buddyName)}</strong> has been <strong>${isConfirmed ? 'confirmed' : 'declined'}</strong>.</p>
        <div style="background:#fff;padding:24px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1);margin:24px 0;">
          <p style="margin:8px 0;"><strong>Activity:</strong> ${escapeHtml(booking.activity)}</p>
          <p style="margin:8px 0;"><strong>Date:</strong> ${escapeHtml(booking.booking_date)}</p>
          <p style="margin:8px 0;"><strong>Time:</strong> ${escapeHtml(booking.booking_time)}</p>
        </div>
        <p style="color:#a0aec0;font-size:12px;text-align:center;">— Rent-A-Buddy</p>
      </div>`;

      await sendEmail({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: [booking.client_email],
        subject,
        html,
      });

      const color = isConfirmed ? "#166534" : "#991b1b";
      return new Response(
        htmlPage(
          isConfirmed ? "Booking confirmed" : "Booking declined",
          `<h1>${isConfirmed ? "Booking Confirmed ✅" : "Booking Declined ❌"}</h1>
           <div class="badge">${escapeHtml(booking.client_name)} → ${escapeHtml(buddyName)}</div>
           <p>The customer has been notified by email.</p>`,
          color,
        ),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    return new Response(htmlPage("Invalid type", `<h1>Invalid request</h1>`, "#991b1b"), {
      status: 400, headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("handle-action error", (err as Error).message);
    return new Response(htmlPage("Error", `<h1>Something went wrong</h1><p>Please try again later.</p>`, "#991b1b"), {
      status: 500, headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};

serve(handler);