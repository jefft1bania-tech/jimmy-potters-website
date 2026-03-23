export interface ClassSession {
  id: string;
  slug: string;
  name: string;
  price: number; // cents
  siblingDiscount: number; // percent
  description: string;
  ageRange: string;
  schedule: {
    dayOfWeek: string;
    time: string;
    startDate: string;
    endDate: string;
    sessionCount: number;
    dates: string[];
  };
  maxStudents: number;
  enrolledCount: number;
  kitContents: string[];
  zoomLink: string; // NEVER exposed to client
  zoomPasscode: string; // NEVER exposed to client
  images: string[];
  status: 'open' | 'full' | 'completed';
  stripePriceId: string;
}

// Safe version without Zoom details - for client-side rendering
export type PublicClassSession = Omit<ClassSession, 'zoomLink' | 'zoomPasscode'>;
