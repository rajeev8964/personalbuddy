import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import FriendCard from "./FriendCard";
import FriendBookingModal from "./FriendBookingModal";
import { Loader2 } from "lucide-react";

interface FriendProfile {
  id: string;
  full_name: string;
  age: number;
  education: string;
  weight: string;
  height: string;
  hobbies: string;
  bio_data: string;
  profile_picture_url: string | null;
  status: 'available' | 'booked';
}

const FriendsSection = () => {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      // Use the public view that excludes sensitive email addresses
      const { data, error } = await supabase
        .from('friend_profiles_public')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion since we know the structure
      setFriends((data || []) as unknown as FriendProfile[]);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (friend: FriendProfile) => {
    setSelectedFriend(friend);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFriend(null);
  };

  const handleBookingSuccess = () => {
    fetchFriends(); // Refresh the list
    handleCloseModal();
  };

  if (loading) {
    return (
      <section id="boys-profiles" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section id="boys-profiles" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            Meet Your Companions
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Boys <span className="text-primary">Profiles</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Browse our friendly companions and find the perfect match for your activities.
            Each profile is verified for quality and safety.
          </p>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No profiles available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onBookNow={handleBookNow}
              />
            ))}
          </div>
        )}
      </div>

      <FriendBookingModal
        friend={selectedFriend}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleBookingSuccess}
      />
    </section>
  );
};

export default FriendsSection;
