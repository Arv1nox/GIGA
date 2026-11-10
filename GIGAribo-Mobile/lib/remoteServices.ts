import { supabase } from '@/lib/supabase';
import { DEFAULT_WORK_END, DEFAULT_WORK_START, type Service } from '@/constants/marketplace';

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
  /** Working hours: need the columns from supabase/working-hours.sql. */
  work_start?: number | null;
  work_end?: number | null;
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
    workStart: row.work_start ?? undefined,
    workEnd: row.work_end ?? undefined,
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
    work_start: service.workStart ?? DEFAULT_WORK_START,
    work_end: service.workEnd ?? DEFAULT_WORK_END,
  };
}

// Columns added later by optional SQL files. If one is missing in the database, save without it instead of failing.
const OPTIONAL_COLUMNS = ['image_url', 'work_start', 'work_end'] as const;

async function saveWithoutMissingColumns(
  row: Record<string, unknown>,
  run: (row: Record<string, unknown>) => PromiseLike<{ error: { message?: string } | null }>,
) {
  const current = { ...row };
  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt += 1) {
    const { error } = await run(current);
    if (!error) return;
    const missing = OPTIONAL_COLUMNS.find((column) => column in current && error.message?.includes(column));
    if (!missing) throw error;
    delete current[missing];
  }
}

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
  // A missing optional column (photo, working hours) just means that part is not saved yet.
  await saveWithoutMissingColumns(serviceToRow(service), (row) => supabase.from('services').insert(row));
}

export async function updateRemoteService(service: Service) {
  const { id, owner_id, ...fields } = serviceToRow(service);
  void owner_id;
  await saveWithoutMissingColumns(fields, (row) => supabase.from('services').update(row).eq('id', id));
}

export async function deleteRemoteService(id: string) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}