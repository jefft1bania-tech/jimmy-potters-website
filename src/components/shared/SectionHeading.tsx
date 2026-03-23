interface SectionHeadingProps {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}

export default function SectionHeading({
  children,
  light = false,
  className = '',
}: SectionHeadingProps) {
  return (
    <h2
      className={`font-heading font-extrabold text-3xl md:text-4xl ${
        light ? 'text-white' : 'text-brand-text'
      } ${className}`}
    >
      {children}
    </h2>
  );
}
