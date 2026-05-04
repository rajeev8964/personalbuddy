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

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Dual rate limiting: by IP and by email
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const IP_RATE_LIMIT = 5;
const EMAIL_RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const isRateLimited = (key: string, limit: number): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  if (record.count >= limit) {
    return true;
  }
  
  record.count++;
  return false;
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

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
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    if (isRateLimited(`ip:${clientIP}`, IP_RATE_LIMIT)) {
      console.warn(`IP rate limit exceeded: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    
    // Validate and sanitize inputs
    const name = sanitizeInput(body.name, 100);
    const email = sanitizeInput(body.email, 254);
    const phoneRaw = sanitizeInput(body.phone ?? "", 20);
    // Allow digits, +, -, spaces, parens; 7-20 chars; or empty
    const phone = /^[0-9+\-\s()]{7,20}$/.test(phoneRaw) ? phoneRaw : "";
    if (phoneRaw && !phone) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid contact number." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const subject = sanitizeInput(body.subject, 200);
    const message = sanitizeInput(body.message, 2000);

    // Validate required fields
    if (!name || !email || !subject || !message) {
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

    // Email-based rate limiting (prevents abuse even with IP rotation)
    if (isRateLimited(`email:${email.toLowerCase().trim()}`, EMAIL_RATE_LIMIT)) {
      console.warn(`Email rate limit exceeded: ${email}`);
      return new Response(
        JSON.stringify({ error: "Too many requests from this email. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing contact request", { hasName: !!name, hasSubject: !!subject });

    // Send email to owner
    const ownerEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: ["rriscrazy@gmail.com"],
        subject: `💬 New Message: ${subject}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #e6f3ff 0%, #fff9e6 100%); padding: 40px; border-radius: 20px;">
            <h1 style="color: #1a365d; margin-bottom: 24px; font-size: 28px;">💬 New Contact Message</h1>
            
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #3182ce; margin-top: 0;">From</h2>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
              ${phone ? `<p style="margin: 8px 0;"><strong>Contact Number:</strong> ${phone}</p>` : ""}
            </div>
            
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <h2 style="color: #3182ce; margin-top: 0;">Subject: ${subject}</h2>
              <p style="margin: 0; color: #4a5568; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="color: #718096; margin-top: 24px; text-align: center;">
              Reply directly to ${email}
            </p>
          </div>
        `,
      }),
    });

    if (!ownerEmailRes.ok) {
      await ownerEmailRes.text(); // Consume response body
      console.error("Failed to send email", { status: ownerEmailRes.status });
      throw new Error("Email service error");
    }

    console.log("Contact email sent successfully");

    // Send confirmation email to sender
    const senderEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: [email],
        subject: "Thanks for reaching out! 💬",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #e6f3ff 0%, #fff9e6 100%); padding: 40px; border-radius: 20px;">
            <h1 style="color: #1a365d; margin-bottom: 24px; font-size: 28px;">Hey ${name}! 👋</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              Thanks for getting in touch! I've received your message and will get back to you as soon as I can.
            </p>
            
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 24px 0;">
              <h2 style="color: #3182ce; margin-top: 0;">Your Message</h2>
              <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 0; color: #4a5568; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              I'll review your message and respond within 24-48 hours.
            </p>
            
            <p style="color: #3182ce; font-weight: bold; font-size: 18px; margin-top: 24px;">
              Talk soon! 🤝
            </p>
          </div>
        `,
      }),
    });

    if (!senderEmailRes.ok) {
      console.error("Failed to send confirmation email to sender");
    } else {
      console.log("Confirmation email sent to sender");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Message sent successfully!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function", { message: error?.message });
    return new Response(
      JSON.stringify({ error: "Unable to send your message. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(null) },
      }
    );
  }
};

serve(handler);
