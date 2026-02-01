import { Heart, Mail, Instagram, Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤝</span>
              <span className="text-xl font-display font-bold">
                Rent-A-Buddy
              </span>
            </a>
            <p className="text-background/70 mb-6 max-w-sm">
              Your friendly companion for any occasion. Strictly platonic, genuinely fun, 
              and always here when you need a friend.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://wa.me/917970137598" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
              </a>
              <a href="https://www.instagram.com/write2skill?igsh=Ymd1amhoeWgxeW4z" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:buddyhello736@gmail.com" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="text-background/70 hover:text-background transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#about" className="text-background/70 hover:text-background transition-colors">
                  About Me
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-background/70 hover:text-background transition-colors">
                  Reviews
                </a>
              </li>
              <li>
                <a href="#booking" className="text-background/70 hover:text-background transition-colors">
                  Book Now
                </a>
              </li>
              <li>
                <a href="/admin-auth" className="text-background/70 hover:text-background transition-colors">
                  Admin Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold mb-4">Get In Touch</h4>
            <ul className="space-y-2 text-background/70">
              <li>Available Mon-Sun</li>
              <li>9 AM - 10 PM</li>
              <li>Virtual calls anytime</li>
              <li className="pt-2">
                <a href="mailto:buddyhello736@gmail.com" className="hover:text-background transition-colors">
                  buddyhello736@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © 2026 Rent-A-Buddy. All rights reserved.
          </p>
          <p className="text-background/50 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-buddy-coral fill-buddy-coral" /> for lonely souls everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
