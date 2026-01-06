import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
  icon: LucideIcon;
  emoji: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  popular?: boolean;
}

const ServiceCard = ({ icon: Icon, emoji, title, description, price, features, popular }: ServiceCardProps) => {
  return (
    <div className={`relative bg-card rounded-2xl p-6 md:p-8 shadow-3d border transition-all duration-500 transform-3d hover:shadow-3d-hover hover:-translate-y-2 hover:rotate-1 ${popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-warm text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-3d-sm animate-float">
          Most Popular ⭐
        </div>
      )}

      {/* Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shadow-3d-sm transform-3d hover:scale-110 transition-transform duration-300">
          <span className="text-3xl animate-bounce-3d">{emoji}</span>
        </div>
        <Icon className="w-6 h-6 text-buddy-blue" />
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-display font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>

      {/* Price */}
      <div className="mb-6">
        <span className="text-3xl font-display font-bold text-gradient-warm">{price}</span>
        <span className="text-muted-foreground text-sm"> / hour</span>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-buddy-yellow text-lg">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button 
        variant={popular ? "hero" : "outline"} 
        className={`w-full shadow-3d-sm hover:shadow-3d hover:-translate-y-1 transition-all duration-300 ${popular ? '' : ''}`}
        asChild
      >
        <a href="#booking">Book Now</a>
      </Button>
    </div>
  );
};

export default ServiceCard;
