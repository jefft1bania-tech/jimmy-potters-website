import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'About | Jimmy Potters',
  description: 'Meet Jimmy Potters — handmade pottery and virtual pottery classes for kids in Northern Virginia.',
};

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="section-container">
        <div className="card p-8 md:p-12 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-5xl">🏺</span>
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-brand-text mt-4">
              Meet Jimmy Potters
            </h1>
            <p className="text-gray-500 font-body mt-2 text-lg">
              Handmade with heart in Virginia
            </p>
          </div>

          {/* The Pottery */}
          <section className="mb-10">
            <h2 className="font-heading font-bold text-2xl text-brand-text mb-4">
              The Pottery 🏺
            </h2>
            <p className="text-gray-600 font-body leading-relaxed mb-4">
              Every piece in our collection is handmade and one of a kind. From our signature
              drip-glaze vases with their vibrant orange bodies and cascading sage-green glaze, to
              our elegant hanging planters mounted on minimalist metal rings — each creation tells
              its own story.
            </p>
            <p className="text-gray-600 font-body leading-relaxed">
              We believe pottery should be both beautiful and functional. Our planters are designed
              for real plants, with drainage holes and durable glazes that hold up to everyday use.
              When you bring a Jimmy Potters piece into your home, you&apos;re getting something
              no one else in the world has.
            </p>
          </section>

          {/* The Classes */}
          <section className="mb-10">
            <h2 className="font-heading font-bold text-2xl text-brand-text mb-4">
              The Classes 🎨
            </h2>
            <p className="text-gray-600 font-body leading-relaxed mb-4">
              What started as after-school pottery classes in Northern Virginia schools has grown
              into something bigger. We now teach kids ages 7-14 from anywhere through our virtual
              Zoom classes. Every student receives a complete clay kit delivered to their door —
              no extra trips to the art supply store needed.
            </p>
            <p className="text-gray-600 font-body leading-relaxed">
              Our instructors are passionate about making pottery accessible and fun. In just 4
              weeks, your child will learn to sculpt, mold, and paint their own pottery creations.
              It&apos;s messy, it&apos;s creative, and kids absolutely love it.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 rounded-2xl p-8 text-center">
            <h2 className="font-heading font-bold text-xl text-brand-text mb-4">
              Get In Touch
            </h2>
            <p className="text-gray-600 font-body mb-4">
              Questions about our pottery or classes? We&apos;d love to hear from you.
            </p>
            <div className="flex flex-col items-center gap-2 text-sm font-body">
              <a
                href="https://www.jimmypotters.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cta hover:underline"
              >
                www.jimmypotters.com
              </a>
              <a
                href="https://instagram.com/jimmypotters"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cta hover:underline"
              >
                @jimmypotters on Instagram
              </a>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Link href="/shop" className="btn-primary text-sm">
                Shop Pottery
              </Link>
              <Link href="/classes" className="btn-primary text-sm !bg-brand-teal hover:!bg-brand-teal/80">
                View Classes
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
