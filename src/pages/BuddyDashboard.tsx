import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogOut, Calendar, Clock, User, ArrowLeft, Mail, Phone, Edit, CheckCircle, XCircle } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { format } from "date-fns";

interface BuddyProfile {
  id: string;
  full_name: string;
  status: 'available' | 'booked';
  is_approved: boolean;
  profile_picture_url: string | null;
}

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  booking_date: string;
  booking_time: string;
  duration: number;
  activity: string;
  status: string;
  message: string | null;
  created_at: string;
}

const BuddyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BuddyProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/login');
      } else {
        fetchData(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/login');
      } else {
        fetchData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    try {
      // Fetch buddy's profile
      const { data: profileData, error: profileError } = await supabase
        .from('friend_profiles')
        .select('id, full_name, status, is_approved, profile_picture_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        // No profile exists, redirect to create one
        toast.info("Please create your profile first");
        navigate('/create-profile');
        return;
      }

      setProfile(profileData as BuddyProfile);

      // Fetch bookings for this buddy
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('friend_bookings')
        .select('*')
        .eq('friend_id', profileData.id)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (checked: boolean) => {
    if (!profile) return;
    
    setUpdatingStatus(true);
    try {
      const newStatus = checked ? 'available' : 'booked';
      const { error } = await supabase
        .from('friend_profiles')
        .update({ status: newStatus })
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile({ ...profile, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBookingAction = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    try {
      const { error } = await supabase
        .from('friend_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      toast.success(`Booking ${newStatus}`);

      // Send email notification to client
      try {
        await supabase.functions.invoke('send-booking-status-email', {
          body: {
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            buddyName: profile?.full_name || 'Your Buddy',
            activity: booking.activity,
            date: booking.booking_date,
            time: booking.booking_time,
            status: newStatus,
          },
        });
      } catch (emailError) {
        console.error('Failed to send status email:', emailError);
        // Don't show error to user - booking was still updated
      }
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error(error.message || "Failed to update booking");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => 
    new Date(b.booking_date) >= new Date() && b.status !== 'cancelled'
  );
  const pastBookings = bookings.filter(b => 
    new Date(b.booking_date) < new Date() || b.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Buddy Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/create-profile')}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Status Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {profile?.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{profile?.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {profile?.is_approved ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="availability" className="font-medium">Availability</Label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.status === 'available' ? 'You are visible to customers' : 'You are hidden from listings'}
                    </p>
                  </div>
                  <Switch
                    id="availability"
                    checked={profile?.status === 'available'}
                    onCheckedChange={handleStatusToggle}
                    disabled={updatingStatus || !profile?.is_approved}
                  />
                </div>
                {!profile?.is_approved && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Availability toggle will be enabled once your profile is approved.
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{upcomingBookings.length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{bookings.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Bookings
                </CardTitle>
                <CardDescription>
                  Bookings scheduled for upcoming dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming bookings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking} 
                        getStatusColor={getStatusColor}
                        onConfirm={() => handleBookingAction(booking.id, 'confirmed')}
                        onDecline={() => handleBookingAction(booking.id, 'cancelled')}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-5 h-5" />
                    Past Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastBookings.slice(0, 5).map((booking) => (
                      <BookingCard key={booking.id} booking={booking} getStatusColor={getStatusColor} isPast />
                    ))}
                    {pastBookings.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        + {pastBookings.length - 5} more past bookings
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

interface BookingCardProps {
  booking: Booking;
  getStatusColor: (status: string) => string;
  isPast?: boolean;
  onConfirm?: () => void;
  onDecline?: () => void;
}

const BookingCard = ({ booking, getStatusColor, isPast, onConfirm, onDecline }: BookingCardProps) => {
  const showActions = !isPast && booking.status === 'pending' && onConfirm && onDecline;
  
  return (
    <div className={`p-4 border rounded-lg ${isPast ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{booking.client_name}</h4>
          <p className="text-sm text-muted-foreground">{booking.activity}</p>
        </div>
        <Badge className={getStatusColor(booking.status)}>
          {booking.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {format(new Date(booking.booking_date), 'PPP')}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {booking.booking_time} ({booking.duration}h)
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href={`mailto:${booking.client_email}`} className="flex items-center gap-1 text-primary hover:underline">
          <Mail className="w-4 h-4" />
          {booking.client_email}
        </a>
        <a href={`tel:${booking.client_phone}`} className="flex items-center gap-1 text-primary hover:underline">
          <Phone className="w-4 h-4" />
          {booking.client_phone}
        </a>
      </div>

      {booking.message && (
        <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
          "{booking.message}"
        </p>
      )}

      {showActions && (
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button size="sm" onClick={onConfirm} className="flex-1">
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={onDecline} className="flex-1">
            <XCircle className="w-4 h-4 mr-1" />
            Decline
          </Button>
        </div>
      )}
    </div>
  );
};

export default BuddyDashboard;
