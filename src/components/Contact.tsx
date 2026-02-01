import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Message sent! I'll get back to you soon 💬");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="contact" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card rounded-3xl p-12 shadow-3d border border-border transform-3d hover:shadow-3d-hover transition-all duration-500">
              <div className="w-20 h-20 bg-buddy-blue-light rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-3d">
                <CheckCircle className="w-10 h-10 text-buddy-blue" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Message Received! 💬
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Thanks for reaching out! I'll read your message and get back to you as soon as possible.
              </p>
              <Button variant="outline" onClick={() => {
                setSubmitted(false);
                setFormData({ name: "", email: "", subject: "", message: "" });
              }} className="shadow-3d-sm hover:shadow-3d transition-all duration-300">
                Send Another Message
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left Column - Info */}
          <div>
            <span className="inline-block text-sm font-semibold text-buddy-blue bg-buddy-blue-light px-4 py-1 rounded-full mb-4 shadow-3d-sm">
              Get In Touch
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
              Have a<br />
              <span className="text-gradient-cool">Question?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Got a question that isn't covered on this page? Want to share feedback or just say hi? 
              Drop me a message and I'll get back to you!
            </p>

            {/* Contact info cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-3d-sm hover:shadow-3d hover:-translate-y-1 hover:translate-x-1 transition-all duration-300 transform-3d">
                <div className="w-12 h-12 rounded-lg bg-buddy-blue-light flex items-center justify-center shadow-inner-3d">
                  <Mail className="w-6 h-6 text-buddy-blue" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Quick Response</p>
                  <p className="text-sm text-muted-foreground">I typically respond within 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-3d-sm hover:shadow-3d hover:-translate-y-1 hover:translate-x-1 transition-all duration-300 transform-3d">
                <div className="w-12 h-12 rounded-lg bg-buddy-yellow-light flex items-center justify-center shadow-inner-3d">
                  <MessageCircle className="w-6 h-6 text-buddy-yellow" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">General Inquiries</p>
                  <p className="text-sm text-muted-foreground">Questions, feedback, collaborations & more</p>
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
                  placeholder="What's your name?"
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

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <Input 
                  type="text" 
                  placeholder="What's this about?"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="h-12 shadow-inner-3d"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Message
                </label>
                <Textarea 
                  placeholder="Write your message here..."
                  className="min-h-[150px] resize-none shadow-inner-3d"
                  required
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
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
