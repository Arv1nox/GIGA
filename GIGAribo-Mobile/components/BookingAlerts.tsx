import React from 'react';
import { router } from 'expo-router';
import { Toast } from '@/components/Toast';
import { useMarketplace } from '@/context/MarketplaceContext';

/**
 * Pop-ups for bookings:
 * - providers: a customer booked one of their services
 * - customers: a provider accepted, declined or completed their booking
 */
export function BookingAlerts() {
  const { bookingAlert, requestAlert } = useMarketplace();
  const answerTitle = requestAlert?.status === 'confirmed'
    ? 'Booking accepted'
    : requestAlert?.status === 'completed'
      ? 'Booking completed'
      : 'Booking declined';
  const answerDetail = requestAlert
    ? requestAlert.status === 'confirmed'
      ? `${requestAlert.provider} accepted ${requestAlert.serviceTitle}`
      : requestAlert.status === 'completed'
        ? `${requestAlert.serviceTitle} is marked as done`
        : `${requestAlert.provider} could not take ${requestAlert.serviceTitle}`
    : undefined;
  return (
    <>
      <Toast
        trigger={bookingAlert ? bookingAlert.id : null}
        title="New booking"
        detail={bookingAlert ? `${bookingAlert.customerName} booked ${bookingAlert.serviceTitle}` : undefined}
        onPress={() => router.push('/bookings')}
        duration={5000}
      />
      <Toast
        trigger={requestAlert ? requestAlert.id : null}
        title={answerTitle}
        detail={answerDetail}
        onPress={() => router.push('/(tabs)/requests')}
        duration={5000}
      />
    </>
  );
}