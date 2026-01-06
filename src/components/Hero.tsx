import { Button } from "@/components/ui/button";
import { Heart, Shield, Star } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden pt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-buddy-yellow-light rounded-full blur-3xl opacity-60 animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-buddy-blue-light rounded-full blur-3xl opacity-50 animate-pulse-soft" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-buddy-coral-light rounded-full blur-3xl opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 mb-8 shadow-soft animate-slide-up">
            <span className="animate-wave inline-block">👋</span>
            <span className="text-sm font-medium text-muted-foreground">
              Your new platonic friend is here!
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Need a Friend?
            <br />
            <span className="text-gradient-warm">Rent a Buddy!</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Sometimes you just need someone to hang out with — no strings attached. 
            I'm here for coffee dates, gaming sessions, shopping trips, or just a friendly chat. 
            <strong className="text-foreground"> 100% platonic, 100% fun!</strong>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#booking">
                Book Your Buddy 🎉
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#services">
                See What We Can Do
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-buddy-blue" />
              <span className="text-sm font-medium">Strictly Platonic</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-5 h-5 text-buddy-coral" />
              <span className="text-sm font-medium">Genuine Connection</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-5 h-5 text-buddy-yellow" />
              <span className="text-sm font-medium">50+ Happy Clients</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
