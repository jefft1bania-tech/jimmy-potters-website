interface BadgeProps {
  variant: 'teal' | 'orange' | 'sold' | 'green' | 'purple';
  children: React.ReactNode;
}

const variantClasses = {
  teal: 'bg-brand-teal/10 text-brand-teal',
  orange: 'bg-brand-orange/10 text-brand-orange',
  sold: 'bg-gray-200 text-gray-500',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-brand-cta/10 text-brand-cta',
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-bold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
