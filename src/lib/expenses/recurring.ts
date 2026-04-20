// Recurring-expense engine. Pure functions; caller wraps with Supabase IO.
// Figures out which recurring_expenses rows are due to post as overhead_expenses.

export type Recurrence = 'monthly' | 'quarterly' | 'annual';

export type RecurringExpense = {
  id: string;
  category: string;
  amount_cents: number;
  recurrence: Recurrence;
  starts_on: string;      // ISO date
  ends_on: string | null; // ISO date or null
  last_posted_on: string | null;
};

export type DuePost = {
  recurring_expense_id: string;
  category: string;
  amount_cents: number;
  incurred_on: string; // ISO date the expense should book under
};

function addInterval(date: Date, recurrence: Recurrence): Date {
  const next = new Date(date);
  if (recurrence === 'monthly')        next.setUTCMonth(next.getUTCMonth() + 1);
  else if (recurrence === 'quarterly') next.setUTCMonth(next.getUTCMonth() + 3);
  else                                  next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseISODate(iso: string): Date {
  // Treat "YYYY-MM-DD" as UTC midnight to keep all date math timezone-independent.
  return new Date(iso + 'T00:00:00.000Z');
}

export function computeDuePosts(
  recurring: RecurringExpense[],
  today: Date = new Date(),
): DuePost[] {
  const todayISO = toISODate(today);
  const posts: DuePost[] = [];

  for (const r of recurring) {
    if (r.starts_on > todayISO) continue;

    // Determine the next date to post.
    // If never posted, the first post is at starts_on.
    // Otherwise, next post is last_posted_on + recurrence interval.
    let nextDate: Date;
    if (r.last_posted_on == null) {
      nextDate = parseISODate(r.starts_on);
    } else {
      nextDate = addInterval(parseISODate(r.last_posted_on), r.recurrence);
    }

    // Post every due interval up to and including today.
    while (toISODate(nextDate) <= todayISO) {
      if (r.ends_on && toISODate(nextDate) > r.ends_on) break;
      posts.push({
        recurring_expense_id: r.id,
        category: r.category,
        amount_cents: r.amount_cents,
        incurred_on: toISODate(nextDate),
      });
      nextDate = addInterval(nextDate, r.recurrence);
    }
  }

  return posts;
}
