import { supabase } from '@/lib/supabase';
import type { Service } from '@/constants/marketplace';

/** Shape of a row in the Supabase `services` table (see supabase/services.sql). */
type ServiceRow = {
  id: string;
  owner_id: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  provider: string;
  provider_about: string;
  area: string;
  service_areas: string[];
  active: boolean;
  /** Needs the `image_url` column and `service-images` bucket (see supabase/service-images.sql). */
  image_url?: string | null;
};

function rowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    price: row.price,
    provider: row.provider,
    providerAbout: row.provider_about,
    rating: 0,
    reviews: 0,
    image: row.category === 'cleaning' ? 'cleaning' : 'repair',
    area: row.area,
    serviceAreas: row.service_areas ?? [],
    ownerId: row.owner_id,
    active: row.active,
    synced: true,
    imageUrl: row.image_url || undefined,
  };
}

function serviceToRow(service: Service): ServiceRow {
  return {
    id: service.id,
    owner_id: service.ownerId ?? '',
    title: service.title,
    subtitle: service.subtitle,
    category: service.category,
    price: service.price,
    provider: service.provider,
    provider_about: service.providerAbout ?? '',
    area: service.area,
    service_areas: service.serviceAreas,
    active: service.active !== false,
    // Only a web URL can be shared; a file on this phone means the upload did not work.
    image_url: service.imageUrl && /^https?:\/\//.test(service.imageUrl) ? service.imageUrl : null,
  };
}

const isImageColumnError = (error: { message?: string } | null) => Boolean(error?.message?.includes('image_url'));

/** Uploads a picked photo to the public `service-images` bucket and returns its web URL. */
export async function uploadServiceImage(uri: string, ownerId: string, mimeType?: string | null): Promise<string> {
  const type = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const response = await fetch(uri);
  const body = await response.arrayBuffer();
  const path = `${ownerId}/${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage.from('service-images').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('service-images').getPublicUrl(path).data.publicUrl;
}

/** Every live service (plus the signed-in provider's own paused ones). Works for guests too. */
export async function fetchRemoteServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ServiceRow[]).map(rowToService);
}

export async function insertRemoteService(service: Service) {
  const row = serviceToRow(service);
  let { error } = await supabase.from('services').insert(row);
  if (error && isImageColumnError(error)) {
    // The image column has not been added yet: still list the service, just without its photo.
    const { image_url, ...withoutImage } = row;
    void image_url;
    ({ error } = await supabase.from('services').insert(withoutImage));
  }
  if (error) throw error;
}

export async function updateRemoteService(service: Service) {
  const { id, owner_id, ...fields } = serviceToRow(service);
  void owner_id;
  let { error } = await supabase.from('services').update(fields).eq('id', id);
  if (error && isImageColumnError(error)) {
    const { image_url, ...withoutImage } = fields;
    void image_url;
    ({ error } = await supabase.from('services').update(withoutImage).eq('id', id));
  }
  if (error) throw error;
}

export async function deleteRemoteService(id: string) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}