import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Allowed origins for CORS
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

interface BookingRequest {
  name: string;
  email: string;
  activity: string;
  date: string;
  time: string;
  message: string;
  friendName?: string;
  friendEmail?: string;
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3; // requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
};

// Basic email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string input
const sanitizeInput = (input: string, maxLength: number = 500): string => {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/<[^>]*>/g, '');
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    // Check rate limit
    if (isRateLimited(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    
    // Validate and sanitize inputs
    const name = sanitizeInput(body.name, 100);
    const email = sanitizeInput(body.email, 254);
    const activity = sanitizeInput(body.activity, 100);
    const date = sanitizeInput(body.date, 50);
    const time = sanitizeInput(body.time, 50);
    const message = sanitizeInput(body.message || '', 1000);
    const friendName = sanitizeInput(body.friendName || '', 100);
    const friendEmail = body.friendEmail ? sanitizeInput(body.friendEmail, 254) : null;

    // Validate required fields
    if (!name || !email || !activity || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Please fill in all required fields." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid email address." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing booking request", { hasName: !!name, hasActivity: !!activity, hasDate: !!date, hasTime: !!time, hasFriendEmail: !!friendEmail });

    // Send email to admin/owner
    const ownerEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: ["rriscrazy@gmail.com"],
        subject: `🎉 New Booking Request from ${name}${friendName ? ` for ${friendName}` : ''}!`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fff9e6 0%, #e6f3ff 100%); padding: 40px; border-radius: 20px;">
            <h1 style="color: #1a365d; margin-bottom: 24px; font-size: 28px;">🎉 New Booking Request!</h1>
            
            ${friendName ? `
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #e5a91a; margin-top: 0;">Booked Buddy</h2>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${friendName}</p>
            </div>
            ` : ''}
            
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #e5a91a; margin-top: 0;">Customer Details</h2>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            </div>
            
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #e5a91a; margin-top: 0;">Booking Details</h2>
              <p style="margin: 8px 0;"><strong>Activity:</strong> ${activity}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
            </div>
            
            ${message ? `
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h2 style="color: #e5a91a; margin-top: 0;">Additional Message</h2>
              <p style="margin: 0; color: #4a5568;">${message}</p>
            </div>
            ` : ''}
            
            <p style="color: #718096; margin-top: 24px; text-align: center;">
              Reply to this email or contact ${email} to confirm the booking!
            </p>
          </div>
        `,
      }),
    });

    if (!ownerEmailRes.ok) {
      await ownerEmailRes.text(); // Consume response body
      console.error("Failed to send email to owner", { status: ownerEmailRes.status });
      throw new Error("Email service error");
    }

    console.log("Email sent to owner successfully");

    // Send confirmation email to customer
    const customerEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: [email],
        subject: "Your Booking Request Received! 🎉",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fff9e6 0%, #e6f3ff 100%); padding: 40px; border-radius: 20px;">
            <h1 style="color: #1a365d; margin-bottom: 24px; font-size: 28px;">Hey ${name}! 👋</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              Thanks for reaching out! I've received your booking request and I'm excited to potentially hang out with you!
            </p>
            
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 24px 0;">
              <h2 style="color: #e5a91a; margin-top: 0;">Your Request Summary</h2>
              <p style="margin: 8px 0;"><strong>Activity:</strong> ${activity}</p>
              <p style="margin: 8px 0;"><strong>Preferred Date:</strong> ${date}</p>
              <p style="margin: 8px 0;"><strong>Preferred Time:</strong> ${time}</p>
            </div>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              I'll review your request and get back to you within 24 hours to confirm our hangout. Can't wait!
            </p>
            
            <p style="color: #e5a91a; font-weight: bold; font-size: 18px; margin-top: 24px;">
              Talk soon! 🤝
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            
            <p style="color: #a0aec0; font-size: 12px; text-align: center;">
              This is a strictly platonic friendship service. All activities are conducted in safe, public spaces.
            </p>
          </div>
        `,
      }),
    });

    if (!customerEmailRes.ok) {
      console.error("Failed to send confirmation email to customer");
    } else {
      console.log("Confirmation email sent to customer successfully");
    }

    // Send notification email to the friend/buddy being booked (if email provided)
    if (friendEmail && isValidEmail(friendEmail)) {
      try {
        const friendEmailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Rent-A-Buddy <onboarding@resend.dev>",
            to: [friendEmail],
            subject: `🎉 You've Been Booked! New Session Request`,
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fff9e6 0%, #e6f3ff 100%); padding: 40px; border-radius: 20px;">
                <h1 style="color: #1a365d; margin-bottom: 24px; font-size: 28px;">Hey ${friendName || 'Buddy'}! 🎉</h1>
                
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Great news! Someone has booked a session with you. Here are the details:
                </p>
                
                <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 24px 0;">
                  <h2 style="color: #e5a91a; margin-top: 0;">Customer Details</h2>
                  <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
                  <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                </div>
                
                <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 24px 0;">
                  <h2 style="color: #e5a91a; margin-top: 0;">Session Details</h2>
                  <p style="margin: 8px 0;"><strong>Activity:</strong> ${activity}</p>
                  <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
                  <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
                </div>
                
                ${message ? `
                <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                  <h2 style="color: #e5a91a; margin-top: 0;">Customer's Message</h2>
                  <p style="margin: 0; color: #4a5568;">${message}</p>
                </div>
                ` : ''}
                
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                  Please contact the customer at <strong>${email}</strong> to confirm the session!
                </p>
                
                <p style="color: #e5a91a; font-weight: bold; font-size: 18px; margin-top: 24px;">
                  Have a great session! 🤝
                </p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                
                <p style="color: #a0aec0; font-size: 12px; text-align: center;">
                  This is a notification from Rent-A-Buddy. All activities are conducted in safe, public spaces.
                </p>
              </div>
            `,
          }),
        });

        if (!friendEmailRes.ok) {
          console.error("Failed to send notification email to friend/buddy");
        } else {
          console.log("Notification email sent to friend/buddy successfully");
        }
      } catch (friendEmailError) {
        console.error("Error sending email to friend:", friendEmailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Booking request sent successfully!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-email function", { message: error?.message });
    // Return generic error message - don't expose internal details
    return new Response(
      JSON.stringify({ error: "Unable to process your booking request. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(null) },
      }
    );
  }
};

serve(handler);
