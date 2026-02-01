import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import ProfileFormModal from "./ProfileFormModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import buddyPhoto from "@/assets/buddy-photo.jpeg";

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
  is_approved: boolean;
  user_id: string | null;
  created_at: string;
}

const AdminProfiles = () => {
  const [profiles, setProfiles] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FriendProfile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('friend_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles((data || []) as unknown as FriendProfile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: FriendProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
  };

  const handleSuccess = () => {
    fetchProfiles();
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('friend_profiles')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      toast.success("Profile deleted successfully");
      fetchProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error("Failed to delete profile");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleApprove = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('friend_profiles')
        .update({ is_approved: true })
        .eq('id', profileId);

      if (error) throw error;
      
      toast.success("Profile approved successfully");
      fetchProfiles();
    } catch (error) {
      console.error('Error approving profile:', error);
      toast.error("Failed to approve profile");
    }
  };

  const handleReject = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('friend_profiles')
        .update({ is_approved: false })
        .eq('id', profileId);

      if (error) throw error;
      
      toast.success("Profile rejected");
      fetchProfiles();
    } catch (error) {
      console.error('Error rejecting profile:', error);
      toast.error("Failed to reject profile");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Friend Profiles</h2>
          <p className="text-muted-foreground">Manage all friend profiles</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No profiles yet</p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className={!profile.is_approved ? 'border-yellow-500/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={profile.profile_picture_url || buddyPhoto}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{profile.age} yrs</Badge>
                          <Badge variant="outline">{profile.education}</Badge>
                          <Badge 
                            variant={profile.status === 'available' ? 'default' : 'secondary'}
                            className={profile.status === 'available' ? 'bg-green-500' : ''}
                          >
                            {profile.status}
                          </Badge>
                          <Badge 
                            variant={profile.is_approved ? 'default' : 'outline'}
                            className={profile.is_approved ? 'bg-blue-500' : 'border-yellow-500 text-yellow-600'}
                          >
                            {profile.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                          {profile.user_id && (
                            <Badge variant="outline" className="text-xs">
                              User Created
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!profile.is_approved && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(profile.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {profile.is_approved && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            onClick={() => handleReject(profile.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEdit(profile)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(profile.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {profile.bio_data}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProfileFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        profile={editingProfile}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This action cannot be undone.
              All associated bookings will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProfiles;
