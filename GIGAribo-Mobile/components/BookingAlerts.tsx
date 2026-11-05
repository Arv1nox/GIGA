import React from 'react';
import { router } from 'expo-router';
import { Toast } from '@/components/Toast';
import { useMarketplace } from '@/context/MarketplaceContext';

/** Pops up for providers when a customer books one of their services while the app is open. */
export function BookingAlerts() {
  const { bookingAlert } = useMarketplace();
  return (
    <Toast
      trigger={bookingAlert ? bookingAlert.id : null}
      title="New booking"
      detail={bookingAlert ? `${bookingAlert.customerName} booked ${bookingAlert.serviceTitle}` : undefined}
      onPress={() => router.push('/bookings')}
      duration={5000}
    />
  );
}