import ServiceCard from "./ServiceCard";
import { Coffee, ShoppingBag, BookOpen, Gamepad2, Video, Users } from "lucide-react";

const services = [
  {
    icon: Coffee,
    emoji: "☕",
    title: "Chilling",
    description: "Casual hangouts at cafes, parks, or wherever you're comfortable. Just good vibes and easy conversation.",
    price: "₹500",
    features: [
      "Coffee dates & cafe hangouts",
      "Park walks & outdoor chilling",
      "Events & social gatherings",
      "No awkward silences guaranteed",
    ],
  },
  {
    icon: ShoppingBag,
    emoji: "🛍️",
    title: "Shopping Companion",
    description: "Need a second opinion on that outfit? I'll help you find the perfect look or just keep you company.",
    price: "₹600",
    features: [
      "Fashion advice & outfit picks",
      "Grocery shopping buddy",
      "Mall exploration partner",
      "Honest feedback always",
    ],
    popular: true,
  },
  {
    icon: BookOpen,
    emoji: "📚",
    title: "Reading Partner",
    description: "Silent reading sessions or lively book discussions. Perfect for introverts who want company without pressure.",
    price: "₹400",
    features: [
      "Library & bookstore visits",
      "Silent reading sessions",
      "Book club discussions",
      "Study buddy support",
    ],
  },
  {
    icon: Gamepad2,
    emoji: "🎮",
    title: "Gaming/Playing",
    description: "From video games to board games to outdoor sports. Let's have some competitive (or cooperative) fun!",
    price: "₹500",
    features: [
      "Video game co-op sessions",
      "Board game nights",
      "Outdoor sports & activities",
      "Learning new games together",
    ],
  },
  {
    icon: Video,
    emoji: "💬",
    title: "Virtual Company",
    description: "Can't meet in person? I'm just a call away. Voice or video calls for when you need someone to talk to.",
    price: "₹300",
    features: [
      "Voice calls for venting",
      "Video call hangouts",
      "Work-from-home company",
      "Late night chats available",
    ],
  },
  {
    icon: Users,
    emoji: "🎭",
    title: "Event Buddy",
    description: "Concerts, movies, weddings, or that work event you don't want to go alone to. I've got you!",
    price: "₹800",
    features: [
      "Wedding +1 companion",
      "Concert & event partner",
      "Movie premiere dates",
      "Networking event support",
    ],
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-buddy-blue bg-buddy-blue-light px-4 py-1 rounded-full mb-4">
            What We Can Do Together
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Pick Your <span className="text-gradient-warm">Adventure</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you need someone to shop with, game with, or just talk to — I'm your person. 
            All activities are strictly platonic and focused on genuine friendship.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ServiceCard {...service} />
            </div>
          ))}
        </div>

        {/* Custom request */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Don't see what you're looking for?
          </p>
          <a 
            href="#booking" 
            className="text-buddy-blue font-semibold hover:underline underline-offset-4"
          >
            Request a custom activity →
          </a>
        </div>
      </div>
    </section>
  );
};

export default Services;
