import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, LogOut, Users, Calendar, Shield } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import AdminProfiles from "@/components/admin/AdminProfiles";
import AdminBookings from "@/components/admin/AdminBookings";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/admin-auth');
      } else {
        setTimeout(() => {
          verifyAdminAccess(session);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/admin-auth');
      } else {
        verifyAdminAccess(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const verifyAdminAccess = async (session: Session) => {
    try {
      // Use server-side verification via edge function
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.isAdmin) {
        setIsAdmin(true);
      } else {
        toast.error("Access denied. Admin privileges required.");
        await supabase.auth.signOut();
        navigate('/admin-auth');
      }
    } catch (error) {
      console.error('Error verifying admin:', error);
      // Fallback to client-side check if edge function fails
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          setIsAdmin(true);
        } else {
          toast.error("Access denied. Admin privileges required.");
          await supabase.auth.signOut();
          navigate('/admin-auth');
        }
      } catch (fallbackError) {
        console.error('Fallback admin check failed:', fallbackError);
        navigate('/admin-auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/admin-auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
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
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <AdminProfiles />
          </TabsContent>

          <TabsContent value="bookings">
            <AdminBookings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
