import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageIcon, Loader2 } from "lucide-react";

interface BookingPhoto {
  id: string;
  photo_url: string;
  uploaded_at: string;
  booking_id: string;
}

interface CustomerPhotoGalleryProps {
  profileId: string;
}

const CustomerPhotoGallery = ({ profileId }: CustomerPhotoGalleryProps) => {
  const [photos, setPhotos] = useState<(BookingPhoto & { client_name?: string; activity?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [profileId]);

  const fetchPhotos = async () => {
    try {
      // Fetch photos for bookings belonging to this buddy
      const { data: bookings } = await supabase
        .from('friend_bookings')
        .select('id, client_name, activity')
        .eq('friend_id', profileId);

      if (!bookings?.length) {
        setLoading(false);
        return;
      }

      const bookingIds = bookings.map(b => b.id);
      const { data: photosData } = await supabase
        .from('booking_photos')
        .select('*')
        .in('booking_id', bookingIds)
        .order('uploaded_at', { ascending: false });

      const enriched = (photosData || []).map(photo => {
        const booking = bookings.find(b => b.id === photo.booking_id);
        return { ...photo, client_name: booking?.client_name, activity: booking?.activity };
      });

      setPhotos(enriched);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Customer Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No customer photos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative cursor-pointer rounded-lg overflow-hidden aspect-square"
                  onClick={() => setSelectedPhoto(photo.photo_url)}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.client_name || "Customer"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                      <p className="font-medium">{photo.client_name}</p>
                      <p className="opacity-80">{photo.activity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-2">
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Customer photo"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerPhotoGallery;
