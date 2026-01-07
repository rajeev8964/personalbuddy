import { Heart, Shield, Smile, Clock } from "lucide-react";
import buddyPhoto from "@/assets/buddy-photo.jpeg";

const traits = [
  {
    icon: Smile,
    title: "Easy-Going",
    description: "I adapt to your vibe — whether you want deep conversations or comfortable silence.",
  },
  {
    icon: Shield,
    title: "Safe & Respectful",
    description: "Clear boundaries, strictly platonic. Your comfort is always my priority.",
  },
  {
    icon: Heart,
    title: "Genuinely Caring",
    description: "I'm not just here for the hours — I actually enjoy making new friends!",
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Morning person or night owl? I work around your availability.",
  },
];

const About = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image/Visual Side */}
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Background shapes */}
              <div className="absolute inset-0 bg-buddy-yellow-light rounded-3xl rotate-6 opacity-50" />
              <div className="absolute inset-0 bg-buddy-blue-light rounded-3xl -rotate-3 opacity-50" />
              
              {/* Main card with photo background */}
              <div 
                className="relative rounded-3xl shadow-soft overflow-hidden h-full flex items-end justify-center"
                style={{
                  backgroundImage: `url(${buddyPhoto})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }}
              >
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <div className="relative text-center p-8 z-10">
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    Hey, I'm Your Buddy!
                  </h3>
                  <p className="text-white/80">
                    Professional friend, amateur comedian, excellent listener
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <span className="bg-buddy-yellow-light text-buddy-yellow px-3 py-1 rounded-full text-sm font-medium">Introvert-Friendly</span>
                    <span className="bg-buddy-blue-light text-buddy-blue px-3 py-1 rounded-full text-sm font-medium">Great Listener</span>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-card shadow-warm rounded-2xl px-4 py-2 animate-float">
                <span className="text-sm font-semibold text-foreground">⭐ 5.0 Rating</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card shadow-soft rounded-2xl px-4 py-2 animate-float" style={{ animationDelay: "1s" }}>
                <span className="text-sm font-semibold text-foreground">50+ Hangouts</span>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-sm font-semibold text-buddy-coral bg-buddy-coral-light px-4 py-1 rounded-full mb-4">
              About Me
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
              Your Friend-for-Hire,<br />
              <span className="text-gradient-warm">No Strings Attached</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              I started Rent-A-Buddy because I genuinely love meeting new people and helping them feel less alone. 
              Whether you're new in town, just need someone to talk to, or want a shopping buddy without judgment — I'm here for you.
            </p>
            <p className="text-muted-foreground mb-8">
              <strong className="text-foreground">Important:</strong> This is a strictly platonic service. 
              I'm here for friendship, companionship, and good times — nothing more, nothing less. 
              Your comfort and safety are my top priorities.
            </p>

            {/* Traits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {traits.map((trait) => (
                <div key={trait.title} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <trait.icon className="w-5 h-5 text-buddy-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{trait.title}</h4>
                    <p className="text-sm text-muted-foreground">{trait.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
