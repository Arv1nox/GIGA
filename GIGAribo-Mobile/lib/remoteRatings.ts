import { supabase } from '@/lib/supabase';

/** Average rating and number of ratings for one service. */
export type RatingStat = { rating: number; reviews: number };

/** Every service's rating, worked out from the Supabase `ratings` table (see supabase/ratings.sql). Works for guests too. */
export async function fetchRatingStats(): Promise<Record<string, RatingStat>> {
  const { data, error } = await supabase.from('ratings').select('service_id,stars');
  if (error) throw error;
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of (data ?? []) as { service_id: string; stars: number }[]) {
    const entry = totals[row.service_id] ?? { sum: 0, count: 0 };
    entry.sum += row.stars;
    entry.count += 1;
    totals[row.service_id] = entry;
  }
  const stats: Record<string, RatingStat> = {};
  for (const [serviceId, { sum, count }] of Object.entries(totals)) {
    stats[serviceId] = { rating: sum / count, reviews: count };
  }
  return stats;
}

/** The stars the signed-in customer gave, keyed by booking id. */
export async function fetchMyRatings(customerId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('ratings').select('booking_id,stars').eq('customer_id', customerId);
  if (error) throw error;
  const mine: Record<string, number> = {};
  for (const row of (data ?? []) as { booking_id: string; stars: number }[]) mine[row.booking_id] = row.stars;
  return mine;
}

/** Saves one rating (and an optional written review) for one completed booking of one service. */
export async function insertRemoteRating(bookingId: string, serviceId: string, stars: number, comment: string, customerName: string) {
  const { error } = await supabase.from('ratings').insert({
    booking_id: bookingId,
    service_id: serviceId,
    stars,
    comment: comment.trim() || null,
    customer_name: customerName,
  });
  if (error) throw error;
}

/** One customer's rating of a service, with their review if they wrote one. */
export type ServiceReview = { id: string; stars: number; comment: string | null; customerName: string; createdAt: string };

/** Who rated a service and what they said, newest first. Works for guests too. */
export async function fetchServiceReviews(serviceId: string): Promise<ServiceReview[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('id,stars,comment,customer_name,created_at')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as { id: string; stars: number; comment: string | null; customer_name: string; created_at: string }[]).map((row) => ({
    id: row.id,
    stars: row.stars,
    comment: row.comment,
    customerName: row.customer_name,
    createdAt: row.created_at,
  }));
}