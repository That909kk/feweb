// Legacy types for backward compatibility with mock data
export interface LegacyUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  roles: LegacyUserRole[];
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

export type LegacyUserRole = 'customer' | 'employee' | 'admin';

export interface LegacyService {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  duration: number;
  category: string;
}

export interface BookingRequest {
  id: string;
  customerId: string;
  serviceId: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  employeeId?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee extends LegacyUser {
  experience: string;
  skills: string[];
  availability: { [key: string]: string[] };
  rating: number;
  completedJobs: number;
  bio?: string;
  verified: boolean;
}

export interface LandingPageContent {
  hero: {
    title: string;
    subtitle: string;
    ctaButton: string;
  };
  features: {
    title: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  services: {
    title: string;
    viewAll: string;
  };
  testimonials: {
    title: string;
    items: Array<{
      name: string;
      rating: number;
      comment: string;
      avatar: string;
    }>;
  };
  stats: Array<{
    number: string;
    label: string;
  }>;
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
}

export interface Review {
  id: string;
  customerId: string;
  employeeId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerName: string;
  customerAvatar?: string;
}