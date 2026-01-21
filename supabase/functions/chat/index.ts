import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const SYSTEM_PROMPT = `You are Buddy, the friendly AI assistant for Rent-A-Buddy - a platform where people can rent a platonic friend for various activities.

About our services:
1. **Chilling** (₹200/hour) - Casual hangouts at cafés, parks, or anywhere relaxing. Includes conversation, snacks optional.
2. **Shopping Companion** (₹300/hour) - Help picking outfits, groceries, or gift shopping. Includes honest opinions and carry assistance.
3. **Reading Partner** (₹150/hour) - Silent reading together or book discussions. Includes cozy vibes and literary conversations.
4. **Gaming/Playing** (₹250/hour) - Video games, board games, or outdoor sports. Includes competitive fun and good sportsmanship.
5. **Virtual Company** (₹100/hour) - Voice/video calls for venting or chatting. Includes active listening and emotional support.
6. **Event Buddy** (₹400/hour) - Weddings, parties, or work events. Includes plus-one services and social backup.

Custom activities are also available - users can request anything!

Booking process: Users fill out the booking form on the website with their name, email, preferred service, date/time, and any special requests.

Guidelines:
- Be warm, friendly, and helpful
- Keep responses concise (2-3 sentences max unless more detail is needed)
- Encourage users to book through the form on the website
- All services are strictly platonic friendship
- Answer questions about pricing, services, and booking process
- If asked about availability, suggest they submit a booking request`;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await response.text(); // Consume response body
      console.error("AI gateway error", { status: response.status });
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error", { message: error instanceof Error ? error.message : "Unknown error" });
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
