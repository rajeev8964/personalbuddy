import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  name: string;
  email: string;
  activity: string;
  date: string;
  time: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, activity, date, time, message }: BookingRequest = await req.json();

    console.log("Received booking request:", { name, email, activity, date, time });

    // Send email to owner
    const ownerEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rent-A-Buddy <onboarding@resend.dev>",
        to: ["rajeevrathour80764@gmail.com"],
        subject: `🎉 New Booking Request from ${name}!`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fff9e6 0%, #e6f3ff 100%); padding: 40px; border-radius: 20px;">
            <h1 style="color: #1a365d; margin-bottom: 24px; font-size: 28px;">🎉 New Booking Request!</h1>
            
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
      const errorData = await ownerEmailRes.text();
      console.error("Failed to send email to owner:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
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

    return new Response(
      JSON.stringify({ success: true, message: "Booking request sent successfully!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
