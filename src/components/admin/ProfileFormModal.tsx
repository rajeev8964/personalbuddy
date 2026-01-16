import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FriendProfile {
  id: string;
  full_name: string;
  email: string;
  age: number;
  education: string;
  weight: string;
  height: string;
  hobbies: string;
  bio_data: string;
  profile_picture_url: string | null;
  status: 'available' | 'booked';
}

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: FriendProfile | null;
}

const ProfileFormModal = ({ isOpen, onClose, onSuccess, profile }: ProfileFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    age: '',
    education: '',
    weight: '',
    height: '',
    hobbies: '',
    bio_data: '',
    profile_picture_url: '',
    status: 'available' as 'available' | 'booked',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        email: profile.email,
        age: profile.age.toString(),
        education: profile.education,
        weight: profile.weight,
        height: profile.height,
        hobbies: profile.hobbies,
        bio_data: profile.bio_data,
        profile_picture_url: profile.profile_picture_url || '',
        status: profile.status,
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        age: '',
        education: '',
        weight: '',
        height: '',
        hobbies: '',
        bio_data: '',
        profile_picture_url: '',
        status: 'available',
      });
    }
  }, [profile, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Valid email is required");
      return false;
    }
    if (!formData.age || parseInt(formData.age) < 18) {
      toast.error("Age must be 18 or older");
      return false;
    }
    if (!formData.education.trim()) {
      toast.error("Education is required");
      return false;
    }
    if (!formData.weight.trim()) {
      toast.error("Weight is required");
      return false;
    }
    if (!formData.height.trim()) {
      toast.error("Height is required");
      return false;
    }
    if (!formData.hobbies.trim()) {
      toast.error("Hobbies are required");
      return false;
    }
    if (!formData.bio_data.trim()) {
      toast.error("Bio is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const profileData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        age: parseInt(formData.age),
        education: formData.education.trim(),
        weight: formData.weight.trim(),
        height: formData.height.trim(),
        hobbies: formData.hobbies.trim(),
        bio_data: formData.bio_data.trim(),
        profile_picture_url: formData.profile_picture_url.trim() || null,
        status: formData.status,
      };

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('friend_profiles')
          .update(profileData)
          .eq('id', profile.id);

        if (error) throw error;
        toast.success("Profile updated successfully");
      } else {
        // Create new profile
        const { error } = await supabase
          .from('friend_profiles')
          .insert(profileData);

        if (error) throw error;
        toast.success("Profile created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Edit Profile' : 'Add New Profile'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email/Gmail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                min="18"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                placeholder="21"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height *</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder={'5\'11"'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight *</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="70kg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Education/Study *</Label>
            <Input
              id="education"
              value={formData.education}
              onChange={(e) => handleChange('education', e.target.value)}
              placeholder="B.Tech Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hobbies">Hobbies *</Label>
            <Input
              id="hobbies"
              value={formData.hobbies}
              onChange={(e) => handleChange('hobbies', e.target.value)}
              placeholder="Gaming, Cricket, Traveling, Music"
            />
            <p className="text-xs text-muted-foreground">Separate with commas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio_data">Bio/Description *</Label>
            <Textarea
              id="bio_data"
              value={formData.bio_data}
              onChange={(e) => handleChange('bio_data', e.target.value)}
              placeholder="Write a friendly bio..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
              <Input
                id="profile_picture_url"
                value={formData.profile_picture_url}
                onChange={(e) => handleChange('profile_picture_url', e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-muted-foreground">Leave empty for default photo</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                profile ? 'Update Profile' : 'Create Profile'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileFormModal;
