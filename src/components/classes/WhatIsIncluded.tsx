interface WhatIsIncludedProps {
  items: string[];
}

const itemEmojis: Record<string, string> = {
  clay: '🏺',
  rolling: '🪵',
  sculpting: '🔧',
  paint: '🎨',
  brush: '🖌️',
  mat: '🧹',
};

function getEmoji(item: string): string {
  const lower = item.toLowerCase();
  for (const [key, emoji] of Object.entries(itemEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return '✅';
}

export default function WhatIsIncluded({ items }: WhatIsIncludedProps) {
  return (
    <div className="bg-brand-teal/5 rounded-2xl p-6">
      <h3 className="font-heading font-bold text-lg text-brand-text mb-4">
        📦 What&apos;s in the Clay Kit
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-sm font-body text-gray-700">
            <span>{getEmoji(item)}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
