interface WhatIsIncludedProps {
  items: string[];
}

const kitIcons: { pattern: string; icon: string; color: string }[] = [
  { pattern: 'clay', icon: '🏺', color: 'bg-vibrant-peach' },
  { pattern: 'rolling', icon: '🪵', color: 'bg-amber-50' },
  { pattern: 'sculpting', icon: '🔧', color: 'bg-vibrant-sky' },
  { pattern: 'paint', icon: '🎨', color: 'bg-vibrant-lavender' },
  { pattern: 'brush', icon: '🖌️', color: 'bg-pink-50' },
  { pattern: 'mat', icon: '🧹', color: 'bg-vibrant-mint' },
];

function getItemMeta(item: string) {
  const lower = item.toLowerCase();
  for (const kit of kitIcons) {
    if (lower.includes(kit.pattern)) return kit;
  }
  return { icon: '✅', color: 'bg-gray-50' };
}

export default function WhatIsIncluded({ items }: WhatIsIncludedProps) {
  return (
    <div className="card-vibrant overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-vibrant-purple via-vibrant-teal to-vibrant-orange p-6 md:p-8">
        <h2
          id="kit-contents"
          className="font-heading font-black text-2xl md:text-3xl text-white"
        >
          📦 What&apos;s in Your Clay Kit
        </h2>
        <p className="text-white/80 font-body mt-1">
          Everything your child needs — delivered to your door
        </p>
      </div>

      {/* Items grid */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const meta = getItemMeta(item);
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 hover:bg-white hover:shadow-md transition-all duration-300 group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl ${meta.color} text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]`}
                >
                  {meta.icon}
                </div>
                <span className="font-body text-sm text-brand-text font-medium">
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
