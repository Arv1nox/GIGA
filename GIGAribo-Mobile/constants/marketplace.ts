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
  /** Supabase user id of the provider who added this service (only set for services added in the app). */
  ownerId?: string;
  /** False while the provider has paused the service. Paused services are hidden from customers. */
  active?: boolean;
  /** About text for the provider's profile (only set for services added in the app). */
  providerAbout?: string;
  /** True once the service is saved in the shared database, so every customer can see it. */
  synced?: boolean;
  /** Optional photo the provider added. A web URL once uploaded, or a file on this device if the upload failed. */
  imageUrl?: string;
};

export type Provider = {
  id: string;
  name: string;
  /** Feather icon name shown on the profile. */
  icon: string;
  tagline: string;
  about: string;
  /** Main place the provider is based. */
  area: string;
  yearsActive: number;
  responseTime: string;
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

/**
 * Services that providers added from inside the app.
 * MarketplaceContext keeps this in sync (shared database + saved on the device),
 * so the lookup helpers below can find them alongside the built-in sample data.
 */
let customServices: Service[] = [];
let customProviders: Provider[] = [];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function providerSlug(name: string) {
  return slugify(name) || 'provider';
}

/** Provider profiles are built from the services each provider added. */
export function setCustomMarketplace(nextServices: Service[]) {
  customServices = nextServices;
  const byName = new Map<string, Provider>();
  for (const service of nextServices) {
    if (byName.has(service.provider)) continue;
    const category = categories.find((item) => item.id === service.category);
    byName.set(service.provider, {
      id: providerSlug(service.provider),
      name: service.provider,
      icon: category?.icon ?? 'briefcase',
      tagline: service.subtitle || service.title,
      about: service.providerAbout?.trim() || `${service.provider} offers home services in ${service.area}.`,
      area: service.area,
      yearsActive: 0,
      responseTime: 'Within a day',
    });
  }
  customProviders = [...byName.values()];
}

/** Built-in sample services plus live services providers added (paused ones are hidden). */
export function getAllServices() {
  return [...services, ...customServices.filter((service) => service.active !== false)];
}

export function getService(id: string | undefined) {
  // Search every custom service (even paused ones) so a provider can still open their own listing.
  return [...services, ...customServices].find((service) => service.id === id);
}

export const providers: Provider[] = [
  {
    id: 'bicol-roof-pros',
    name: 'Bicol Roof Pros',
    icon: 'home',
    tagline: 'Roof repair and installation',
    about: 'A local roofing crew handling leak repairs, re-roofing and new installations for homes in and around Naga City.',
    area: 'Naga City',
    yearsActive: 8,
    responseTime: 'Within a day',
  },
  {
    id: 'naga-pipe-experts',
    name: 'Naga Pipe Experts',
    icon: 'droplet',
    tagline: 'Fast plumbing repair',
    about: 'Plumbers who fix leaking pipes, clogged drains and faulty fixtures, with quick visits across Naga City.',
    area: 'Naga City',
    yearsActive: 6,
    responseTime: 'Within a few hours',
  },
  {
    id: 'happy-housekeepers',
    name: 'Happy Housekeepers',
    icon: 'wind',
    tagline: 'Home and deep cleaning',
    about: 'A friendly cleaning team for regular house cleaning and detailed deep cleans, bringing their own supplies and equipment.',
    area: 'Naga City',
    yearsActive: 5,
    responseTime: 'Within a day',
  },
  {
    id: 'mrs-pea-cleaning',
    name: 'Mrs. Pea Cleaning',
    icon: 'wind',
    tagline: 'Bathroom cleaning and sanitizing',
    about: 'Specialists in bathroom cleaning, from tiles and glass to fixtures, leaving the space fresh and sanitized.',
    area: 'Naga City',
    yearsActive: 4,
    responseTime: 'Within a day',
  },
  {
    id: 'green-bicol-gardens',
    name: 'Green Bicol Gardens',
    icon: 'sun',
    tagline: 'Lawn and garden care',
    about: 'Garden care for homes around Pili and nearby towns: mowing, trimming, planting and regular upkeep.',
    area: 'Pili',
    yearsActive: 7,
    responseTime: 'Within a day',
  },
  {
    id: 'naga-homeworks',
    name: 'Naga HomeWorks',
    icon: 'zap',
    tagline: 'Home electrical installation and repair',
    about: 'Electricians for wiring, outlets, lighting and repairs in homes across Naga City.',
    area: 'Naga City',
    yearsActive: 9,
    responseTime: 'Within a few hours',
  },
  {
    id: 'bicol-home-care-clinic',
    name: 'Bicol Home Care Clinic',
    icon: 'heart',
    tagline: 'Doctor consultations at home',
    about: 'General consultations and advice from a doctor, brought to your home so you can skip the clinic queue.',
    area: 'Naga City',
    yearsActive: 5,
    responseTime: 'Within a day',
  },
  {
    id: 'naga-wellness-partners',
    name: 'Naga Wellness Partners',
    icon: 'heart',
    tagline: 'Home health check-ups',
    about: 'Basic health check-ups at home, including vitals, blood pressure and sugar readings.',
    area: 'Naga City',
    yearsActive: 3,
    responseTime: 'Within a day',
  },
  {
    id: 'bicol-feast-catering',
    name: 'Bicol Feast Catering',
    icon: 'coffee',
    tagline: 'Buffet catering for parties and events',
    about: 'Full buffet catering for birthdays, family gatherings and small events, with set-up included.',
    area: 'Naga City',
    yearsActive: 10,
    responseTime: 'Within a day',
  },
  {
    id: 'naga-table-catering',
    name: 'Naga Table Catering',
    icon: 'coffee',
    tagline: 'Snack trays and finger food',
    about: 'Snack platters and finger-food trays for small gatherings, meetings and celebrations.',
    area: 'Naga City',
    yearsActive: 4,
    responseTime: 'Within a day',
  },
];

export function getProvider(name: string | undefined) {
  return [...providers, ...customProviders].find((provider) => provider.name === name);
}

export function getProviderById(id: string | undefined) {
  return [...providers, ...customProviders].find((provider) => provider.id === id);
}

export function getProviderServices(providerName: string) {
  return getAllServices().filter((service) => service.provider === providerName);
}

export function getCustomServices() {
  return customServices;
}

/** Overall rating and review count, worked out from the provider's services. */
export function getProviderStats(providerName: string) {
  const list = getProviderServices(providerName);
  const reviews = list.reduce((sum, service) => sum + service.reviews, 0);
  const rating = reviews ? list.reduce((sum, service) => sum + service.rating * service.reviews, 0) / reviews : 0;
  return { rating, reviews, services: list.length };
}

/** Every location where the provider's services are offered. */
export function getProviderLocations(providerName: string) {
  const all = getProviderServices(providerName).flatMap((service) => service.serviceAreas);
  return all.filter((area, index) => all.indexOf(area) === index);
}

export function formatPrice(amount: number) {
  return `₱${amount.toLocaleString('en-PH')}`;
}

export function formatCheckoutPrice(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}