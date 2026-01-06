import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const activities = [
  { value: "chilling", label: "☕ Chilling", price: "$25/hr" },
  { value: "shopping", label: "🛍️ Shopping Companion", price: "$30/hr" },
  { value: "reading", label: "📚 Reading Partner", price: "$20/hr" },
  { value: "gaming", label: "🎮 Gaming/Playing", price: "$25/hr" },
  { value: "virtual", label: "💬 Virtual Company", price: "$15/hr" },
  { value: "event", label: "🎭 Event Buddy", price: "$40/hr" },
  { value: "custom", label: "✨ Custom Activity", price: "TBD" },
];

const Booking = () => {
  const [submitted, setSubmitted] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Booking request sent! I'll get back to you soon 🎉");
  };

  if (submitted) {
    return (
      <section id="booking" className="py-20 md:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card rounded-3xl p-12 shadow-soft border border-border">
              <div className="w-20 h-20 bg-buddy-yellow-light rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-buddy-yellow" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Awesome! Request Sent! 🎉
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                I'll review your booking request and get back to you within 24 hours. 
                Can't wait to hang out!
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Submit Another Request
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-20 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left Column - Info */}
          <div>
            <span className="inline-block text-sm font-semibold text-buddy-blue bg-buddy-blue-light px-4 py-1 rounded-full mb-4">
              Book Your Buddy
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
              Let's Make<br />
              <span className="text-gradient-warm">Plans Together!</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Fill out the form and I'll get back to you within 24 hours to confirm our hangout. 
              Feel free to include any special requests or questions!
            </p>

            {/* Quick info cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-12 h-12 rounded-lg bg-buddy-yellow-light flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-buddy-yellow" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Flexible Scheduling</p>
                  <p className="text-sm text-muted-foreground">Mornings, evenings, weekends — I work around you</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-12 h-12 rounded-lg bg-buddy-blue-light flex items-center justify-center">
                  <Clock className="w-6 h-6 text-buddy-blue" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Minimum 2 Hours</p>
                  <p className="text-sm text-muted-foreground">Enough time for a proper hangout session</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-card rounded-3xl p-6 md:p-10 shadow-soft border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <Input 
                  type="text" 
                  placeholder="What should I call you?"
                  required
                  className="h-12"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <Input 
                  type="email" 
                  placeholder="your@email.com"
                  required
                  className="h-12"
                />
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  What Would You Like To Do?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activities.map((activity) => (
                    <button
                      key={activity.value}
                      type="button"
                      onClick={() => setSelectedActivity(activity.value)}
                      className={`p-3 rounded-xl text-left text-sm border-2 transition-all duration-200 ${
                        selectedActivity === activity.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="block font-medium text-foreground">{activity.label}</span>
                      <span className="text-xs text-muted-foreground">{activity.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred Date
                  </label>
                  <Input 
                    type="date" 
                    required
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred Time
                  </label>
                  <Input 
                    type="time" 
                    required
                    className="h-12"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Anything Else I Should Know?
                </label>
                <Textarea 
                  placeholder="Tell me about yourself, any specific plans, or questions you have..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Submit */}
              <Button type="submit" variant="hero" size="xl" className="w-full">
                <Send className="w-5 h-5 mr-2" />
                Send Booking Request
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree that this is a strictly platonic service. 
                I'll respond within 24 hours to confirm availability.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
