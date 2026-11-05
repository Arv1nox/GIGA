export type Category = {
  id: string;
  title: string;
  icon: string;
  tone: 'categoryBlue' | 'categoryGreen' | 'categoryPeach' | 'categoryPink' | 'categoryLavender' | 'categoryYellow';
};

export type Service = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  provider: string;
  rating: number;
  reviews: number;
  image: 'cleaning' | 'repair';
  /** Main area the provider is based in, shown as "Available near …". */
  area: string;
  /** Specific barangays / towns the provider covers. */
  serviceAreas: string[];
};

export type ServiceRequest = {
  id: string;
  serviceId: string;
  /** The service area (barangay / town) the customer picked for this request. */
  serviceArea?: string;
  createdAt: string;
  status: 'Pending checkout' | 'Placed (demo)' | 'Cancelled (demo)';
  checkout?: CheckoutDetails & { total: number };
};

export type CheckoutDetails = {
  scheduledDate: string;
  timeSlot: string;
  paymentMethod: 'Pay after service' | 'Demo card';
  promoCode: 'GIGA10' | null;
};

export type Profile = {
  name: string;
  email: string;
  phone: string;
};

export const categories: Category[] = [
  { id: 'carpentry', title: 'Carpentry', icon: 'tool', tone: 'categoryBlue' },
  { id: 'plumbing', title: 'Plumbing', icon: 'droplet', tone: 'categoryPeach' },
  { id: 'cleaning', title: 'Cleaning', icon: 'wind', tone: 'categoryPink' },
  { id: 'health', title: "Doctor's Visit", icon: 'heart', tone: 'categoryLavender' },
  { id: 'catering', title: 'Catering', icon: 'coffee', tone: 'categoryYellow' },
  { id: 'landscaping', title: 'Landscaping', icon: 'sun', tone: 'categoryGreen' },
];

export const services: Service[] = [
  {
    id: 'roofing',
    title: 'Roofing',
    subtitle: 'Roof repair / installation',
    category: 'carpentry',
    price: 2300,
    provider: 'Bicol Roof Pros',
    rating: 4.9,
    reviews: 38,
    image: 'repair',
    area: 'Naga City',
    serviceAreas: ['Bagumbayan Sur', 'Concepcion Pequeña', 'San Felipe', 'Triangulo', 'Pili', 'Canaman'],
  },
  {
    id: 'pipe-repair',
    title: 'Pipe leak repair',
    subtitle: 'Fast plumbing repair',
    category: 'plumbing',
    price: 950,
    provider: 'Naga Pipe Experts',
    rating: 4.8,
    reviews: 26,
    image: 'repair',
    area: 'Naga City',
    serviceAreas: ['Abella', 'Dayangdang', 'Tinago', 'Sabang', 'Liboton', 'Mabolo'],
  },
  {
    id: 'house-cleaning',
    title: 'House cleaning',
    subtitle: 'Freshen up your home',
    category: 'cleaning',
    price: 690,
    provider: 'Happy Housekeepers',
    rating: 4.9,
    reviews: 51,
    image: 'cleaning',
    area: 'Naga City',
    serviceAreas: ['Concepcion Pequeña', 'Bagumbayan Sur', 'Triangulo', 'Balatas', 'Pacol', 'Camaligan'],
  },
  {
    id: 'bathroom-cleaning',
    title: 'Bathroom cleaning',
    subtitle: 'Deep clean & sanitize',
    category: 'cleaning',
    price: 710,
    provider: 'Mrs. Pea Cleaning',
    rating: 4.7,
    reviews: 19,
    image: 'cleaning',
    area: 'Naga City',
    serviceAreas: ['Abella', 'Peñafrancia', 'San Felipe', 'Del Rosario', 'Carolina'],
  },
  {
    id: 'deep-clean',
    title: 'Deep clean',
    subtitle: 'A detailed home refresh',
    category: 'cleaning',
    price: 890,
    provider: 'Happy Housekeepers',
    rating: 4.8,
    reviews: 33,
    image: 'cleaning',
    area: 'Naga City',
    serviceAreas: ['Concepcion Pequeña', 'Bagumbayan Sur', 'Triangulo', 'Balatas', 'Pacol', 'Camaligan'],
  },
  {
    id: 'landscaping',
    title: 'Garden care',
    subtitle: 'Lawn & garden maintenance',
    category: 'landscaping',
    price: 1200,
    provider: 'Green Bicol Gardens',
    rating: 4.8,
    reviews: 17,
    image: 'repair',
    area: 'Pili',
    serviceAreas: ['Pili', 'Canaman', 'Magarao', 'Bagumbayan Norte', 'Pacol'],
  },
  {
    id: 'electrical',
    title: 'Home electrical',
    subtitle: 'Installation & repair',
    category: 'carpentry',
    price: 850,
    provider: 'Naga HomeWorks',
    rating: 4.9,
    reviews: 29,
    image: 'repair',
    area: 'Naga City',
    serviceAreas: ['Bagumbayan Sur', 'San Felipe', 'Concepcion Grande', 'Dinaga', 'Igualdad Interior', 'Calauag'],
  },
  {
    id: 'doctor-consult',
    title: 'Doctor consultation',
    subtitle: 'General check-up and advice',
    category: 'health',
    price: 1200,
    provider: 'Bicol Home Care Clinic',
    rating: 4.9,
    reviews: 22,
    image: 'repair',
    area: 'Naga City',
    serviceAreas: ['Concepcion Pequeña', 'Abella', 'Triangulo', 'Peñafrancia', 'Del Rosario', 'Magarao'],
  },
  {
    id: 'health-checkup',
    title: 'Basic health check-up',
    subtitle: 'Vitals, blood pressure & sugar',
    category: 'health',
    price: 850,
    provider: 'Naga Wellness Partners',
    rating: 4.8,
    reviews: 31,
    image: 'repair',
    area: 'Naga City',
    serviceAreas: ['Bagumbayan Sur', 'San Felipe', 'Balatas', 'Dinaga', 'Liboton', 'Camaligan'],
  },
  {
    id: 'party-catering',
    title: 'Party catering',
    subtitle: 'Buffet for 20 to 30 guests',
    category: 'catering',
    price: 4500,
    provider: 'Bicol Feast Catering',
    rating: 4.9,
    reviews: 44,
    image: 'cleaning',
    area: 'Naga City',
    serviceAreas: ['Concepcion Pequeña', 'Bagumbayan Sur', 'Triangulo', 'Pacol', 'Canaman', 'Pili'],
  },
  {
    id: 'snack-trays',
    title: 'Snack & finger-food trays',
    subtitle: 'Platters for small gatherings',
    category: 'catering',
    price: 1800,
    provider: 'Naga Table Catering',
    rating: 4.7,
    reviews: 18,
    image: 'cleaning',
    area: 'Naga City',
    serviceAreas: ['Abella', 'San Felipe', 'Del Rosario', 'Carolina', 'Calauag', 'Sabang'],
  },
];

export function getService(id: string | undefined) {
  return services.find((service) => service.id === id);
}

export function formatPrice(amount: number) {
  return `₱${amount.toLocaleString('en-PH')}`;
}

export function formatCheckoutPrice(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}