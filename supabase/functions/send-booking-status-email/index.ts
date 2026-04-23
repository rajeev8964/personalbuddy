import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = [
  "https://personalbuddy.lovable.app",
  "https://id-preview--8430cbd5-a7f6-45ff-b5f0-91dbe9719eef.lovable.app",
  "https://8430cbd5-a7f6-45ff-b5f0-91dbe9719eef.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

interface StatusUpdateRequest {
  bookingId: string;
  status: 'confirmed' | 'cancelled';
}

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Simple in-memory rate limit (per user, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  const rec = rateLimitMap.get(key);
  if (!rec || now > rec.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  if (rec.count >= RATE_LIMIT) return true;
  rec.count++;
  return false;
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const userId = claimsData.claims.sub as string;

    // 2. Rate limit per user
    if (isRateLimited(userId)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 3. Parse + validate input
    const body = await req.json() as Partial<StatusUpdateRequest>;
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId : '';
    const status = body.status;
    if (!bookingId || !isValidUUID(bookingId) || (status !== 'confirmed' && status !== 'cancelled')) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 4. Fetch booking server-side (service role) so email content is trusted
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('friend_bookings')
      .select('id, client_name, client_email, activity, booking_date, booking_time, friend_id, friend_profiles:friend_id(full_name, user_id)')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingErr || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 5. Authorize: caller must be admin or the buddy linked to the booking
    const buddy = (booking as any).friend_profiles;
    const { data: adminRow } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    const isAdmin = !!adminRow;
    const isBuddy = buddy?.user_id === userId;
    if (!isAdmin && !isBuddy) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const clientName = escapeHtml(booking.client_name);
    const clientEmail = booking.client_email;
    const buddyName = escapeHtml(buddy?.full_name ?? 'Your Buddy');
    const activity = escapeHtml(booking.activity);
    const date = escapeHtml(booking.booking_date);
    const time = escapeHtml(booking.booking_time);

    const isConfirmed = status === 'confirmed';
    const subject = isConfirmed 
      ? `✅ Your Booking with ${buddyName} is Confirmed!`
      : `❌ Booking Update: Session with ${buddyName}`;

    const emailHtml = isConfirmed ? `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #e6ffe6 0%, #e6f3ff 100%); padding: 40px; border-radius: 20px;">
        <h1 style="color: #166534; margin-bottom: 24px; font-size: 28px;">Great News, ${clientName}! 🎉</h1>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Your booking with <strong>${buddyName}</strong> has been confirmed! Get ready for an awesome time!
        </p>
        
        <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 24px 0;">
          <h2 style="color: #166534; margin-top: 0;">📅 Session Details</h2>
          <p style="margin: 8px 0;"><strong>Buddy:</strong> ${buddyName}</p>
          <p style="margin: 8px 0;"><strong>Activity:</strong> ${activity}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
        </div>
        
        <div style="background: #166534; color: white; padding: 16px 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">Status: CONFIRMED ✅</p>
        </div>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Please arrive on time and have a wonderful experience!
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="color: #a0aec0; font-size: 12px; text-align: center;">
          This is a notification from Rent-A-Buddy. All activities are conducted in safe, public spaces.
        </p>
      </div>
    ` : `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fff5f5 0%, #e6f3ff 100%); padding: 40px; border-radius: 20px;">
        <h1 style="color: #991b1b; margin-bottom: 24px; font-size: 28px;">Hi ${clientName},</h1>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          We regret to inform you that your booking with <strong>${buddyName}</strong> could not be confirmed at this time.
        </p>
        
        <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 24px 0;">
          <h2 style="color: #991b1b; margin-top: 0;">📅 Session Details</h2>
          <p style="margin: 8px 0;"><strong>Buddy:</strong> ${buddyName}</p>
          <p style="margin: 8px 0;"><strong>Activity:</strong> ${activity}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
        </div>
        
        <div style="background: #991b1b; color: white; padding: 16px 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">Status: DECLINED ❌</p>
        </div>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Don't worry! There are many other amazing buddies available. Feel free to browse and book with someone else.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="color: #a0aec0; font-size: 12px; text-align: center;">
          This is a notification from Rent-A-Buddy. All activities are conducted in safe, public spaces.
        </p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: [clientEmail],
        subject,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error("Failed to send status email:", errorText);
      throw new Error("Email service error");
    }

    console.log(`Status email sent successfully: ${status} for ${clientEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-status-email:", error?.message);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(null) } }
    );
  }
};

serve(handler);
