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
  };
}

/** Every live service (plus the signed-in provider's own paused ones). Works for guests too. */
export async function fetchRemoteServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ServiceRow[]).map(rowToService);
}

export async function insertRemoteService(service: Service) {
  const { error } = await supabase.from('services').insert(serviceToRow(service));
  if (error) throw error;
}

export async function updateRemoteService(service: Service) {
  const { id, owner_id, ...fields } = serviceToRow(service);
  void owner_id;
  const { error } = await supabase.from('services').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteRemoteService(id: string) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}