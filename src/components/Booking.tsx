import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const activities = [
  { value: "personal", label: "☕ Personal Hangout", price: "₹199/hr" },
  { value: "movie", label: "🎬 Movie & Chill", price: "₹59/hr" },
  { value: "shopping", label: "🛍️ Shopping Buddy", price: "₹99/hr" },
  { value: "coffee", label: "☕ Coffee partner", price: "₹99/hr" },
  { value: "study", label: "📚 Study Partner", price: "₹69/hr" },
  { value: "gaming", label: "🎮 Gaming/Playing", price: "₹59/hr" },
  { value: "event", label: "🎭 Event Companion", price: "₹199/hr" },
  { value: "custom", label: "✨ Custom Activity", price: "TBD" },
];

const Booking = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedActivity) {
      toast.error("Please select an activity!");
      return;
    }

    setLoading(true);

    try {
      const activityLabel = activities.find(a => a.value === selectedActivity)?.label || selectedActivity;
      
      const { data, error } = await supabase.functions.invoke("send-booking-email", {
        body: {
          name: formData.name,
          email: formData.email,
          activity: activityLabel,
          date: formData.date,
          time: formData.time,
          message: formData.message,
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Booking request sent! I'll get back to you soon 🎉");
    } catch (error: any) {
      console.error("Error sending booking:", error);
      toast.error("Failed to send booking request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="booking" className="py-20 md:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card rounded-3xl p-12 shadow-3d border border-border transform-3d hover:shadow-3d-hover transition-all duration-500">
              <div className="w-20 h-20 bg-buddy-yellow-light rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-3d">
                <CheckCircle className="w-10 h-10 text-buddy-yellow" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Awesome! Request Sent! 🎉
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                I'll review your booking request and get back to you within 24 hours. 
                Can't wait to hang out!
              </p>
              <Button variant="outline" onClick={() => {
                setSubmitted(false);
                setFormData({ name: "", email: "", date: "", time: "", message: "" });
                setSelectedActivity("");
              }} className="shadow-3d-sm hover:shadow-3d transition-all duration-300">
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
            <span className="inline-block text-sm font-semibold text-buddy-blue bg-buddy-blue-light px-4 py-1 rounded-full mb-4 shadow-3d-sm">
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
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-3d-sm hover:shadow-3d hover:-translate-y-1 hover:translate-x-1 transition-all duration-300 transform-3d">
                <div className="w-12 h-12 rounded-lg bg-buddy-yellow-light flex items-center justify-center shadow-inner-3d">
                  <Calendar className="w-6 h-6 text-buddy-yellow" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Flexible Scheduling</p>
                  <p className="text-sm text-muted-foreground">Mornings, evenings, weekends — I work around you</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-3d-sm hover:shadow-3d hover:-translate-y-1 hover:translate-x-1 transition-all duration-300 transform-3d">
                <div className="w-12 h-12 rounded-lg bg-buddy-blue-light flex items-center justify-center shadow-inner-3d">
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
          <div className="bg-card rounded-3xl p-6 md:p-10 shadow-3d border border-border transform-3d hover:shadow-3d-hover transition-all duration-500">
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 shadow-inner-3d"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 shadow-inner-3d"
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
                      className={`p-3 rounded-xl text-left text-sm border-2 transition-all duration-300 transform-3d ${
                        selectedActivity === activity.value
                          ? "border-primary bg-primary/5 shadow-3d-sm -translate-y-1"
                          : "border-border hover:border-primary/50 hover:shadow-3d-sm hover:-translate-y-0.5"
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
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-12 shadow-inner-3d"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred Time
                  </label>
                  <Input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="h-12 shadow-inner-3d"
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
                  className="min-h-[120px] resize-none shadow-inner-3d"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                variant="hero" 
                size="xl" 
                className="w-full shadow-3d hover:shadow-3d-hover hover:-translate-y-1 transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Booking Request
                  </>
                )}
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
