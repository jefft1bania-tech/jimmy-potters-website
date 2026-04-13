import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import LifestyleGallery from '@/components/home/LifestyleGallery';

export default function HomePage() {
  return (
    <>
      {/* Hero — luxury studio atmosphere with pottery showcase + Jok mascot */}
      <HeroSection />

      {/* Product sections — dark gallery */}
      <div className="shop-bg relative">
        <div className="shop-particles" aria-hidden="true">
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
          <div className="shop-particle" />
        </div>
        <FeaturedProducts />
        <div className="gold-divider" />
        <LifestyleGallery />
      </div>
    </>
  );
}
