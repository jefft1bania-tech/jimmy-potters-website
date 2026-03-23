import Link from 'next/link';
import Image from 'next/image';
import { getOpenClasses } from '@/lib/classes';
import ClassCard from '@/components/classes/ClassCard';
import WhatIsIncluded from '@/components/classes/WhatIsIncluded';
import SectionHeading from '@/components/shared/SectionHeading';

export const metadata = {
  title: 'Virtual Pottery Classes for Kids | Jimmy Potters',
  description: '4-week virtual pottery classes for kids ages 7-14. Clay kit delivered to your door. Live on Zoom. $155 per child, 15% sibling discount.',
};

export default function ClassesPage() {
  const classes = getOpenClasses();

  return (
    <div className="py-12">
      {/* Hero */}
      <div className="section-container mb-12">
        <div className="card overflow-hidden relative">
          <div className="relative h-64 md:h-80">
            <Image
              src="/images/classes/kids-pottery-hero.jpg"
              alt="Kids pottery class"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-primary/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-white">
                Virtual Pottery Classes for Kids 🎨
              </h1>
              <p className="text-white/80 font-body mt-2 text-lg">
                Ages 7-14 • Clay kit delivered • Live on Zoom
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="section-container mb-12">
        <SectionHeading light className="text-center mb-8">
          How It Works
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="font-heading font-bold text-lg text-brand-text">1. Register & Pay</h3>
            <p className="text-gray-500 font-body text-sm mt-2">
              Choose your class and complete checkout. Use code SIBLING15 for 15% off siblings.
            </p>
          </div>
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="font-heading font-bold text-lg text-brand-text">2. Receive Your Clay Kit</h3>
            <p className="text-gray-500 font-body text-sm mt-2">
              A complete kit with clay, tools, and paint ships to your door before the first class.
            </p>
          </div>
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">💻</div>
            <h3 className="font-heading font-bold text-lg text-brand-text">3. Join on Zoom</h3>
            <p className="text-gray-500 font-body text-sm mt-2">
              Your Zoom link arrives by email after payment. Join each week for live instruction!
            </p>
          </div>
        </div>
      </div>

      {/* Available Classes */}
      <div className="section-container mb-12">
        <SectionHeading light className="mb-6">
          Available Classes
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <ClassCard key={cls.id} classSession={cls} />
          ))}
        </div>
        {classes.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-2xl mb-2">🎨</p>
            <p className="font-heading font-bold text-xl text-brand-text">
              No classes currently scheduled
            </p>
            <p className="text-gray-500 font-body mt-2">
              Check back soon for new sessions!
            </p>
          </div>
        )}
      </div>

      {/* What's in the Kit */}
      {classes.length > 0 && (
        <div className="section-container mb-12">
          <div className="card p-8 md:p-10">
            <WhatIsIncluded items={classes[0].kitContents} />
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="section-container">
        <div className="card p-8 md:p-10">
          <h2 className="font-heading font-extrabold text-2xl text-brand-text mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-heading font-bold text-brand-text">What age is this for?</h3>
              <p className="text-gray-600 font-body text-sm mt-1">
                Our virtual classes are designed for kids ages 7-14. Projects are adaptable for different skill levels within that range.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-bold text-brand-text">Do I need to buy any supplies?</h3>
              <p className="text-gray-600 font-body text-sm mt-1">
                Nope! Everything your child needs is included in the clay kit that ships to your door before the first class.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-bold text-brand-text">What if we miss a class?</h3>
              <p className="text-gray-600 font-body text-sm mt-1">
                We understand life happens! Contact us and we&apos;ll help you catch up or provide instructions for the missed session.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-bold text-brand-text">How does the sibling discount work?</h3>
              <p className="text-gray-600 font-body text-sm mt-1">
                Use code <strong>SIBLING15</strong> at checkout for 15% off additional children. Register each child separately with the same promo code.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-bold text-brand-text">When does the clay kit ship?</h3>
              <p className="text-gray-600 font-body text-sm mt-1">
                Kits ship within 2-3 business days of registration. We recommend registering at least one week before the first class.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
