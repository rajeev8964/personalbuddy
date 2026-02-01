import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Ruler, Weight, Heart } from "lucide-react";
import buddyPhoto from "@/assets/buddy-photo.jpeg";

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

interface FriendCardProps {
  friend: FriendProfile;
  onBookNow: (friend: FriendProfile) => void;
}

const FriendCard = ({ friend, onBookNow }: FriendCardProps) => {
  const hobbiesList = friend.hobbies.split(',').map(h => h.trim());

  return (
    <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 group">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={friend.profile_picture_url || buddyPhoto}
          alt={friend.full_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4">
          <Badge 
            variant={friend.status === 'available' ? 'default' : 'secondary'}
            className={friend.status === 'available' 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-muted'
            }
          >
            {friend.status === 'available' ? '✅ Available' : '🔒 Booked'}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-foreground mb-1">{friend.full_name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{friend.bio_data}</p>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>{friend.age} years old</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="truncate">{friend.education}</span>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" />
            <span>{friend.height}</span>
          </div>
          <div className="flex items-center gap-2">
            <Weight className="w-4 h-4 text-primary" />
            <span>{friend.weight}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Heart className="w-4 h-4 text-primary" />
            <span className="font-medium">Hobbies</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hobbiesList.map((hobby, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {hobby}
              </Badge>
            ))}
          </div>
        </div>

        <Button 
          onClick={() => onBookNow(friend)}
          disabled={friend.status !== 'available'}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {friend.status === 'available' ? '📅 Book Now' : 'Currently Unavailable'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FriendCard;
