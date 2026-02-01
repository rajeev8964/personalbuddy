import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogOut, ArrowLeft, CheckCircle, Clock, User } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";

interface ExistingProfile {
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
  is_approved: boolean;
  created_at: string;
}

const CreateProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | null>(null);
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
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/login');
      } else {
        checkExistingProfile(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/login');
      } else {
        checkExistingProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkExistingProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friend_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setExistingProfile(data as unknown as ExistingProfile);
        // Pre-fill form with existing data for editing
        setFormData({
          full_name: data.full_name,
          email: data.email,
          age: data.age.toString(),
          education: data.education,
          weight: data.weight,
          height: data.height,
          hobbies: data.hobbies,
          bio_data: data.bio_data,
          profile_picture_url: data.profile_picture_url || '',
        });
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    if (!validateForm() || !user) return;

    setSubmitting(true);
    try {
      const profileData = {
        user_id: user.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        age: parseInt(formData.age),
        education: formData.education.trim(),
        weight: formData.weight.trim(),
        height: formData.height.trim(),
        hobbies: formData.hobbies.trim(),
        bio_data: formData.bio_data.trim(),
        profile_picture_url: formData.profile_picture_url.trim() || null,
        status: 'available' as const,
        is_approved: false,
      };

      if (existingProfile) {
        // Update existing profile (only if not approved)
        const { error } = await supabase
          .from('friend_profiles')
          .update({
            ...profileData,
            is_approved: false, // Reset approval on edit
          })
          .eq('id', existingProfile.id);

        if (error) throw error;
        toast.success("Profile updated! It will be reviewed by admin.");
      } else {
        // Create new profile
        const { error } = await supabase
          .from('friend_profiles')
          .insert(profileData);

        if (error) throw error;
        toast.success("Profile submitted! It will be reviewed by admin.");
      }

      // Refresh profile data
      checkExistingProfile(user.id);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <h1 className="text-xl font-bold">Create Your Profile</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Status Banner */}
        {existingProfile && (
          <Card className={`mb-6 ${existingProfile.is_approved ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {existingProfile.is_approved ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Profile Approved!</p>
                      <p className="text-sm text-muted-foreground">Your profile is visible to customers.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-400">Pending Approval</p>
                      <p className="text-sm text-muted-foreground">Your profile is under review. You can edit it while waiting.</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {existingProfile ? 'Edit Your Profile' : 'Create Your Profile'}
            </CardTitle>
            <CardDescription>
              Fill in your details to create a profile. Once approved by admin, customers can book you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    disabled={existingProfile?.is_approved}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@example.com"
                    disabled={existingProfile?.is_approved}
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
                    disabled={existingProfile?.is_approved}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height *</Label>
                  <Input
                    id="height"
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    placeholder={'5\'11"'}
                    disabled={existingProfile?.is_approved}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight *</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    placeholder="70kg"
                    disabled={existingProfile?.is_approved}
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
                  disabled={existingProfile?.is_approved}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobbies">Hobbies *</Label>
                <Input
                  id="hobbies"
                  value={formData.hobbies}
                  onChange={(e) => handleChange('hobbies', e.target.value)}
                  placeholder="Gaming, Cricket, Traveling, Music"
                  disabled={existingProfile?.is_approved}
                />
                <p className="text-xs text-muted-foreground">Separate hobbies with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio_data">Bio/Description *</Label>
                <Textarea
                  id="bio_data"
                  value={formData.bio_data}
                  onChange={(e) => handleChange('bio_data', e.target.value)}
                  placeholder="Write a friendly bio about yourself..."
                  rows={4}
                  disabled={existingProfile?.is_approved}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
                <Input
                  id="profile_picture_url"
                  value={formData.profile_picture_url}
                  onChange={(e) => handleChange('profile_picture_url', e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  disabled={existingProfile?.is_approved}
                />
                <p className="text-xs text-muted-foreground">Leave empty for default photo</p>
              </div>

              {existingProfile?.is_approved ? (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Your profile is approved and cannot be edited. Contact admin for changes.
                  </p>
                </div>
              ) : (
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : existingProfile ? (
                      'Update Profile'
                    ) : (
                      'Submit Profile'
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateProfile;
