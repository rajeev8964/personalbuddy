import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import FriendsSection from "@/components/FriendsSection";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Booking from "@/components/Booking";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <FriendsSection />
      <About />
      <Testimonials />
      <Booking />
      <Contact />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
