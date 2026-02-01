import { Button } from "@/components/ui/button";
import { Heart, Shield, Star } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden pt-20">
      {/* Background decorations with 3D effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-buddy-yellow-light rounded-full blur-3xl opacity-60 animate-float-3d" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-buddy-blue-light rounded-full blur-3xl opacity-50 animate-float-3d" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-buddy-coral-light rounded-full blur-3xl opacity-30 animate-pulse-soft" />
        
        {/* 3D floating shapes */}
        <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-gradient-warm rounded-2xl shadow-3d animate-spin-slow opacity-40 transform rotate-45" />
        <div className="absolute bottom-1/3 left-1/5 w-16 h-16 bg-gradient-sky rounded-full shadow-3d animate-bounce-3d opacity-30" />
        <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-buddy-coral rounded-xl shadow-3d animate-float opacity-25 transform -rotate-12" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge with 3D effect */}
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 mb-8 shadow-3d transform-3d hover:shadow-3d-hover hover:-translate-y-1 transition-all duration-300 animate-slide-up">
            <span className="animate-wave inline-block text-2xl">👋</span>
            <span className="text-sm font-medium text-muted-foreground">
              Your new platonic friend is here!
            </span>
          </div>

          {/* Main Heading with 3D text effect */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-slide-up text-shadow-3d" style={{ animationDelay: "0.1s" }}>
            Need a Friend?
            <br />
            <span className="text-gradient-warm inline-block hover:scale-105 transition-transform duration-300">Rent a Buddy!</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Sometimes you just need someone to hang out with — no strings attached. 
            I'm here for coffee dates, gaming sessions, shopping trips, or just a friendly chat. 
            <strong className="text-foreground"> 100% platonic, 100% fun!</strong>
          </p>

          {/* CTA Buttons with 3D effect */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild className="shadow-3d hover:shadow-3d-hover hover:-translate-y-2 transition-all duration-300 transform-3d">
              <a href="#booking">
                Book Your Buddy 🎉
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild className="shadow-3d-sm hover:shadow-3d hover:-translate-y-1 transition-all duration-300 transform-3d">
              <a href="#services">
                See What We Can Do
              </a>
            </Button>
          </div>

          {/* Trust indicators with 3D cards */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-2 text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-3d-sm hover:shadow-3d hover:-translate-y-1 transition-all duration-300 transform-3d">
              <Shield className="w-5 h-5 text-buddy-blue" />
              <span className="text-sm font-medium">Strictly Platonic</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-3d-sm hover:shadow-3d hover:-translate-y-1 transition-all duration-300 transform-3d">
              <Heart className="w-5 h-5 text-buddy-coral" />
              <span className="text-sm font-medium">Genuine Connection</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-3d-sm hover:shadow-3d hover:-translate-y-1 transition-all duration-300 transform-3d">
              <Star className="w-5 h-5 text-buddy-yellow" />
              <span className="text-sm font-medium">50+ Happy Clients</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator with 3D effect */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2 shadow-3d-sm">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
