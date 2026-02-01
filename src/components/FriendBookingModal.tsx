import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  email?: string; // Optional - fetched from friend_profiles for notifications
}

interface FriendBookingModalProps {
  friend: FriendProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const activities = [
  { value: "hangout", label: "🏃 Chilling/Hangout", price: "₹99/hr" },
  { value: "shopping", label: "🛍️ Shopping Buddy", price: "₹99/hr" },
  { value: "coffee", label: "☕ Coffee Partner", price: "₹99/hr" },
  { value: "study", label: "📚 Study Partner", price: "₹69/hr" },
  { value: "gaming", label: "🎮 Gaming/Playing", price: "₹59/hr" },
  { value: "event", label: "🎭 Event Companion", price: "₹199/hr" },
  { value: "custom", label: "✨ Custom Activity", price: "TBD" },
];

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

const FriendBookingModal = ({ friend, isOpen, onClose, onSuccess }: FriendBookingModalProps) => {
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    activity: '',
    date: undefined as Date | undefined,
    time: '',
    duration: '1',
    message: ''
  });

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.clientName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!formData.clientEmail.trim() || !/\S+@\S+\.\S+/.test(formData.clientEmail)) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (!formData.clientPhone.trim() || formData.clientPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!formData.activity) {
      toast.error("Please select an activity");
      return false;
    }
    if (!formData.date) {
      toast.error("Please select a date");
      return false;
    }
    if (!formData.time) {
      toast.error("Please select a time");
      return false;
    }
    return true;
  };

  const handleProceedToConfirm = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleConfirmBooking = async () => {
    if (!friend) return;
    
    setLoading(true);
    try {
      // Insert booking into database
      const { error } = await supabase
        .from('friend_bookings')
        .insert({
          friend_id: friend.id,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          client_phone: formData.clientPhone,
          activity: formData.activity,
          booking_date: format(formData.date!, 'yyyy-MM-dd'),
          booking_time: formData.time,
          duration: parseInt(formData.duration),
          message: formData.message || null,
          status: 'pending'
        });

      if (error) throw error;

      // Fetch friend's email from friend_profiles for notification
      let friendEmail: string | null = null;
      try {
        const { data: profileData } = await supabase
          .from('friend_profiles')
          .select('email')
          .eq('id', friend.id)
          .single();
        friendEmail = profileData?.email || null;
      } catch (err) {
        console.error('Could not fetch friend email:', err);
      }

      // Send booking confirmation email to client, admin, and friend
      try {
        await supabase.functions.invoke('send-booking-email', {
          body: {
            name: formData.clientName,
            email: formData.clientEmail,
            phone: formData.clientPhone,
            activity: activities.find(a => a.value === formData.activity)?.label || formData.activity,
            date: format(formData.date!, 'MMMM dd, yyyy'),
            time: formData.time,
            duration: formData.duration,
            message: formData.message,
            friendName: friend.full_name,
            friendEmail: friendEmail
          }
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the booking if email fails
      }

      setStep('success');
      toast.success("Booking confirmed!");
    } catch (error) {
      console.error('Booking error:', error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      activity: '',
      date: undefined,
      time: '',
      duration: '1',
      message: ''
    });
    onClose();
    if (step === 'success') {
      onSuccess();
    }
  };

  if (!friend) return null;

  const selectedActivity = activities.find(a => a.value === formData.activity);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Book {friend.full_name}</DialogTitle>
              <DialogDescription>
                Fill in your details to schedule a session with {friend.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-4">
              <img
                src={friend.profile_picture_url || buddyPhoto}
                alt={friend.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">{friend.full_name}</h3>
                <p className="text-sm text-muted-foreground">{friend.education}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Your Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Enter your full name"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone Number *</Label>
                <Input
                  id="clientPhone"
                  placeholder="Your phone number"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Activity *</Label>
                <Select value={formData.activity} onValueChange={(value) => handleInputChange('activity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((activity) => (
                      <SelectItem key={activity.value} value={activity.value}>
                        {activity.label} - {activity.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => handleInputChange('date', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour} hour{hour > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Any special requests or notes..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleProceedToConfirm} className="w-full">
                Continue to Confirmation
              </Button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Confirm Your Booking</DialogTitle>
              <DialogDescription>
                Please review your booking details before confirming
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <img
                  src={friend.profile_picture_url || buddyPhoto}
                  alt={friend.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg">{friend.full_name}</h3>
                  <p className="text-muted-foreground">{friend.education}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Your Name</p>
                  <p className="font-medium">{formData.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{formData.clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{formData.clientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activity</p>
                  <p className="font-medium">{selectedActivity?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formData.date ? format(formData.date, 'MMMM dd, yyyy') : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{formData.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{formData.duration} hour{parseInt(formData.duration) > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium text-primary">{selectedActivity?.price}</p>
                </div>
              </div>

              {formData.message && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Additional Message</p>
                  <p className="font-medium">{formData.message}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                  Back to Edit
                </Button>
                <Button onClick={handleConfirmBooking} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="mb-6">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You have successfully booked <span className="font-semibold">{friend.full_name}</span>.
              <br />
              Contact details have been sent to your email.
            </p>
            <div className="p-4 bg-muted/50 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground">Booking Details</p>
              <p className="font-medium">{selectedActivity?.label}</p>
              <p className="text-sm">{formData.date ? format(formData.date, 'MMMM dd, yyyy') : ''} at {formData.time}</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FriendBookingModal;
