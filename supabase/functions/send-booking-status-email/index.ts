import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
  clientName: string;
  clientEmail: string;
  buddyName: string;
  activity: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, buddyName, activity, date, time, status }: StatusUpdateRequest = await req.json();

    if (!clientName || !clientEmail || !buddyName || !activity || !date || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
