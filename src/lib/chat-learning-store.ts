/**
 * Chat Learning Store — Recursive Self-Learning System
 *
 * How it works:
 * 1. Every client interaction is logged (question + answer + timestamp)
 * 2. Users can rate answers (helpful / not helpful) via thumbs up/down
 * 3. Highly-rated Q&A pairs get promoted to "learned patterns"
 * 4. Learned patterns are injected into the system prompt for future conversations
 * 5. Frequently asked questions are tracked to identify knowledge gaps
 * 6. The system continuously improves from real client interactions
 *
 * Storage: In-memory Map (persists across requests within the same serverless instance).
 * For production persistence, this can be backed by Vercel KV, Redis, or a database.
 */

interface ChatInteraction {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  rating: 'helpful' | 'not_helpful' | null;
  topic: string;
  sessionId: string;
}

interface LearnedPattern {
  question: string;
  answer: string;
  helpfulCount: number;
  unhelpfulCount: number;
  lastUsed: number;
  topic: string;
}

interface FAQEntry {
  question: string;
  count: number;
  bestAnswer: string;
  topic: string;
}

// In-memory stores (persist across requests in the same Lambda instance)
const interactions: Map<string, ChatInteraction> = new Map();
const learnedPatterns: Map<string, LearnedPattern> = new Map();
const faqTracker: Map<string, FAQEntry> = new Map();
const topicCounter: Map<string, number> = new Map();

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Normalize question for pattern matching
function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[?!.,;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Detect the topic of a question
function detectTopic(question: string): string {
  const lower = question.toLowerCase();

  if (lower.match(/price|cost|how much|dollar|\$/)) return 'pricing';
  if (lower.match(/ship|deliver|package|arrive/)) return 'shipping';
  if (lower.match(/class|program|school|after.?school|enroll|register|sign.?up/)) return 'classes';
  if (lower.match(/virtual|zoom|online|remote/)) return 'virtual-classes';
  if (lower.match(/summer|camp/)) return 'summer-camp';
  if (lower.match(/kit|supply|material|include|what.*come|what.*get/)) return 'kit-contents';
  if (lower.match(/age|old|young|kid|child|grade|kindergarten/)) return 'age-range';
  if (lower.match(/sibling|discount|promo|coupon|code|deal/)) return 'discounts';
  if (lower.match(/refund|cancel|money.?back/)) return 'refund';
  if (lower.match(/miss|absent|can.?t make|sick/)) return 'missed-class';
  if (lower.match(/planter|vase|pot|ceramic|pottery|glaze|hang/)) return 'products';
  if (lower.match(/custom|commission|special.?order/)) return 'custom-orders';
  if (lower.match(/gift|present|wrap/)) return 'gifting';
  if (lower.match(/newsletter|10.*percent|discount.*sign/)) return 'newsletter';
  if (lower.match(/location|where|address|fairfax|virginia|dc/)) return 'location';
  if (lower.match(/contact|email|phone|reach|talk/)) return 'contact';
  if (lower.match(/instagram|facebook|social/)) return 'social-media';
  if (lower.match(/safe|food|lead|toxic|microwave|dishwasher/)) return 'safety';
  if (lower.match(/drain|hole|water|plant care/)) return 'plant-care';
  if (lower.match(/schedule|when|time|day|date/)) return 'scheduling';

  return 'general';
}

// Find similar learned patterns
function findSimilarPatterns(question: string, limit: number = 5): LearnedPattern[] {
  const normalized = normalizeQuestion(question);
  const words = normalized.split(' ').filter((w) => w.length > 2);
  const topic = detectTopic(question);

  const scored: { pattern: LearnedPattern; score: number }[] = [];

  for (const pattern of learnedPatterns.values()) {
    const patternNorm = normalizeQuestion(pattern.question);
    const patternWords = patternNorm.split(' ');

    // Score by word overlap + topic match + helpfulness
    let score = 0;
    for (const word of words) {
      if (patternWords.some((pw) => pw.includes(word) || word.includes(pw))) {
        score += 2;
      }
    }
    if (pattern.topic === topic) score += 3;
    score += pattern.helpfulCount * 2;
    score -= pattern.unhelpfulCount;

    if (score > 2) {
      scored.push({ pattern, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.pattern);
}

// ==================== PUBLIC API ====================

/**
 * Log a new interaction
 */
export function logInteraction(
  question: string,
  answer: string,
  sessionId: string
): string {
  const id = generateId();
  const topic = detectTopic(question);

  const interaction: ChatInteraction = {
    id,
    question,
    answer,
    timestamp: Date.now(),
    rating: null,
    topic,
    sessionId,
  };

  interactions.set(id, interaction);

  // Track FAQ frequency
  const normalized = normalizeQuestion(question);
  const existing = faqTracker.get(normalized);
  if (existing) {
    existing.count++;
    existing.bestAnswer = answer;
  } else {
    faqTracker.set(normalized, {
      question,
      count: 1,
      bestAnswer: answer,
      topic,
    });
  }

  // Track topic popularity
  topicCounter.set(topic, (topicCounter.get(topic) || 0) + 1);

  // Auto-promote to learned pattern if asked frequently (3+ times)
  const faq = faqTracker.get(normalized);
  if (faq && faq.count >= 3 && !learnedPatterns.has(normalized)) {
    learnedPatterns.set(normalized, {
      question: faq.question,
      answer: faq.bestAnswer,
      helpfulCount: faq.count,
      unhelpfulCount: 0,
      lastUsed: Date.now(),
      topic: faq.topic,
    });
  }

  return id;
}

/**
 * Rate an interaction — feeds the learning loop
 */
export function rateInteraction(interactionId: string, rating: 'helpful' | 'not_helpful'): void {
  const interaction = interactions.get(interactionId);
  if (!interaction) return;

  interaction.rating = rating;

  const normalized = normalizeQuestion(interaction.question);

  if (rating === 'helpful') {
    // Promote helpful answers to learned patterns
    const existing = learnedPatterns.get(normalized);
    if (existing) {
      existing.helpfulCount++;
      existing.answer = interaction.answer; // Update with latest good answer
      existing.lastUsed = Date.now();
    } else {
      learnedPatterns.set(normalized, {
        question: interaction.question,
        answer: interaction.answer,
        helpfulCount: 1,
        unhelpfulCount: 0,
        lastUsed: Date.now(),
        topic: interaction.topic,
      });
    }
  } else {
    // Track unhelpful answers to avoid repeating them
    const existing = learnedPatterns.get(normalized);
    if (existing) {
      existing.unhelpfulCount++;
      // Remove pattern if consistently unhelpful
      if (existing.unhelpfulCount > existing.helpfulCount + 2) {
        learnedPatterns.delete(normalized);
      }
    }
  }
}

/**
 * Get learned context to inject into the system prompt.
 * This is the recursive learning — past successful interactions
 * inform future responses.
 */
export function getLearnedContext(currentQuestion: string): string {
  const similarPatterns = findSimilarPatterns(currentQuestion);

  if (similarPatterns.length === 0) return '';

  const lines = similarPatterns.map(
    (p) =>
      `Q: "${p.question}" → Good answer (rated helpful ${p.helpfulCount}x): "${p.answer}"`
  );

  return `\n\nLEARNED FROM PAST INTERACTIONS (use these as reference for similar questions):
${lines.join('\n')}`;
}

/**
 * Get FAQ insights — most asked questions
 */
export function getTopFAQs(limit: number = 10): FAQEntry[] {
  return Array.from(faqTracker.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get topic distribution — what clients ask about most
 */
export function getTopicStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const [topic, count] of topicCounter.entries()) {
    stats[topic] = count;
  }
  return stats;
}

/**
 * Get total interaction count
 */
export function getInteractionCount(): number {
  return interactions.size;
}

/**
 * Get total learned patterns count
 */
export function getLearnedPatternCount(): number {
  return learnedPatterns.size;
}

/**
 * Export all learnings as JSON (for backup / persistence)
 */
export function exportLearnings(): {
  patterns: LearnedPattern[];
  faqs: FAQEntry[];
  topicStats: Record<string, number>;
  totalInteractions: number;
} {
  return {
    patterns: Array.from(learnedPatterns.values()),
    faqs: getTopFAQs(50),
    topicStats: getTopicStats(),
    totalInteractions: interactions.size,
  };
}

/**
 * Import learned patterns (for bootstrapping from previous data)
 */
export function importLearnings(patterns: LearnedPattern[]): void {
  for (const p of patterns) {
    const normalized = normalizeQuestion(p.question);
    learnedPatterns.set(normalized, p);
  }
}
