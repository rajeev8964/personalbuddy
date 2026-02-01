import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    avatar: "🧑‍🦰",
    role: "New to the city",
    content: "I moved here alone and didn't know anyone. My buddy helped me explore the city and I actually made my first real friend through this experience!",
    rating: 5,
  },
  {
    name: "James K.",
    avatar: "👨",
    role: "Introvert gamer",
    content: "Finally someone who gets my gaming references! We've had so many fun co-op sessions. It's nice to have a consistent gaming partner.",
    rating: 5,
  },
  {
    name: "Emily R.",
    avatar: "👩",
    role: "Shopping enthusiast",
    content: "Best shopping companion ever! Gave honest opinions without being mean, helped me find my style, and made what could be stressful actually fun.",
    rating: 5,
  },
  {
    name: "Michael T.",
    avatar: "👨‍🦱",
    role: "Work-from-home dad",
    content: "The virtual company calls during my lunch breaks have been a lifesaver. Sometimes you just need another adult to talk to!",
    rating: 5,
  },
  {
    name: "Lisa P.",
    avatar: "👩‍🦳",
    role: "Book lover",
    content: "Our silent reading sessions at the library are the highlight of my week. No pressure to talk, just peaceful company.",
    rating: 5,
  },
  {
    name: "David H.",
    avatar: "🧔",
    role: "Wedding attendee",
    content: "Brought my buddy to a wedding as my +1. They were charming, respectful, and made the whole event so much more enjoyable!",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 md:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-buddy-yellow bg-buddy-yellow-light px-4 py-1 rounded-full mb-4">
            Happy Buddies
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            What People <span className="text-gradient-warm">Are Saying</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Real stories from real people who found a friend when they needed one.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-card rounded-2xl p-6 border border-border shadow-card hover:shadow-soft transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-buddy-yellow-light mb-4" />

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-buddy-yellow text-buddy-yellow" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
