import classesData from '../../data/classes.json';
import { ClassSession, PublicClassSession } from '@/types/class-session';

const classes: ClassSession[] = classesData as ClassSession[];

export function getAllClasses(): PublicClassSession[] {
  return classes.map(stripPrivateFields);
}

export function getOpenClasses(): PublicClassSession[] {
  return classes
    .filter((c) => c.status === 'open')
    .map(stripPrivateFields);
}

export function getClassBySlug(slug: string): PublicClassSession | undefined {
  const cls = classes.find((c) => c.slug === slug);
  return cls ? stripPrivateFields(cls) : undefined;
}

export function getClassById(id: string): ClassSession | undefined {
  return classes.find((c) => c.id === id);
}

// Server-only: returns full class data including Zoom link
export function getClassByIdFull(id: string): ClassSession | undefined {
  return classes.find((c) => c.id === id);
}

export function getSpotsRemaining(cls: PublicClassSession): number {
  return cls.maxStudents - cls.enrolledCount;
}

export function formatClassDates(dates: string[]): string {
  return dates
    .map((d) => {
      const date = new Date(d + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    })
    .join(', ');
}

function stripPrivateFields(cls: ClassSession): PublicClassSession {
  const { zoomLink, zoomPasscode, ...publicData } = cls;
  return publicData;
}
