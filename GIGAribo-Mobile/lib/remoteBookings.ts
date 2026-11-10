import { supabase } from '@/lib/supabase';

export type BookingStatus = 'new' | 'confirmed' | 'completed' | 'declined' | 'cancelled';

/** A customer's booking of a provider's service (a row in the Supabase `bookings` table, see supabase/bookings.sql). */
export type Booking = {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  ownerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceArea: string;
  scheduledDate: string;
  timeSlot: string;
  paymentMethod: string;
  promoCode: string | null;
  total: number;
  status: BookingStatus;
  /** True once the provider has opened their bookings list since this booking arrived. */
  seen: boolean;
  createdAt: string;
};

type BookingRow = {
  id: string;
  service_id: string;
  service_title: string;
  provider_name: string;
  owner_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  service_area: string;
  scheduled_date: string;
  time_slot: string;
  payment_method: string;
  promo_code: string | null;
  total: number;
  status: BookingStatus;
  provider_seen: boolean;
  created_at: string;
};

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceTitle: row.service_title,
    providerName: row.provider_name,
    ownerId: row.owner_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    serviceArea: row.service_area,
    scheduledDate: row.scheduled_date,
    timeSlot: row.time_slot,
    paymentMethod: row.payment_method,
    promoCode: row.promo_code,
    total: row.total,
    status: row.status,
    seen: row.provider_seen,
    createdAt: row.created_at,
  };
}

/** What the customer's phone sends when they place a request. */
export type NewBooking = Omit<Booking, 'customerId' | 'status' | 'seen' | 'createdAt'>;

export async function insertRemoteBooking(booking: NewBooking) {
  const { error } = await supabase.from('bookings').insert({
    id: booking.id,
    service_id: booking.serviceId,
    service_title: booking.serviceTitle,
    provider_name: booking.providerName,
    owner_id: booking.ownerId,
    customer_name: booking.customerName,
    customer_phone: booking.customerPhone,
    service_area: booking.serviceArea,
    scheduled_date: booking.scheduledDate,
    time_slot: booking.timeSlot,
    payment_method: booking.paymentMethod,
    promo_code: booking.promoCode,
    total: booking.total,
  });
  // The database allows one active booking per provider, date and time (see supabase/reservations.sql).
  if (error?.code === '23505') throw new Error('SLOT_TAKEN');
  if (error) throw error;
}

/** Date and time slots a provider already has booked (and not declined or cancelled). Empty if the database is not set up yet. */
export async function fetchTakenSlots(ownerId: string): Promise<{ date: string; slot: string }[]> {
  const { data, error } = await supabase.rpc('taken_slots', { p_owner: ownerId });
  if (error) return [];
  return ((data ?? []) as { scheduled_date: string; time_slot: string }[]).map((row) => ({ date: String(row.scheduled_date).slice(0, 10), slot: row.time_slot }));
}

/** Bookings for the signed-in provider's services, newest first. */
export async function fetchProviderBookings(ownerId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as BookingRow[]).map(rowToBooking);
}

export async function setRemoteBookingStatus(id: string, status: BookingStatus) {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function markRemoteBookingsSeen(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from('bookings').update({ provider_seen: true }).in('id', ids);
  if (error) throw error;
}

/** The signed-in customer's own bookings, as id + the provider's current answer. */
export async function fetchCustomerBookingStatuses(customerId: string): Promise<{ id: string; status: BookingStatus }[]> {
  const { data, error } = await supabase.from('bookings').select('id,status').eq('customer_id', customerId);
  if (error) throw error;
  return (data ?? []) as { id: string; status: BookingStatus }[];
}

/** Calls `onChange` whenever one of this customer's bookings changes (e.g. the provider accepts it). */
export function subscribeToCustomerBookings(customerId: string, onChange: () => void) {
  const channel = supabase
    .channel(`my-bookings-${customerId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `customer_id=eq.${customerId}` }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Lets a customer cancel their own booking. */
export async function cancelRemoteBooking(id: string) {
  const { error } = await supabase.rpc('cancel_booking', { booking_id: id });
  if (error) throw error;
}

/** Calls `onChange` whenever a booking for this provider is added or changed. Returns a function that stops listening. */
export function subscribeToProviderBookings(ownerId: string, onChange: () => void) {
  const channel = supabase
    .channel(`bookings-${ownerId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `owner_id=eq.${ownerId}` }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}