export type Lang = 'en' | 'es';

const translations = {
  en: {
    // Announcement bar
    announcement: 'Complimentary Shipping on All Orders — Handcrafted in Fort Lauderdale, Florida',

    // Nav links
    nav: {
      shop: 'Shop',
      kit: 'Kit',
      about: 'About',
      signIn: 'Sign In / Sign Up',
      myAccount: 'My Account',
      cartEmpty: 'Shopping cart, empty',
      cartItems: (n: number) => `Shopping cart, ${n} items`,
      langToggle: 'Español',
    },

    // Homepage hero
    hero: {
      eyebrow: 'Fort Lauderdale, Florida',
      title1: 'One-of-a-Kind',
      title2: 'Pottery',
      subtitle: 'Every piece is shaped by hand on the wheel, glazed with original formulas, and fired at 2,200°F — creating colors and textures that can never be exactly replicated. When you find the one that speaks to you, it was made for your hands only.',
      shopBtn: 'Shop Pottery',
      spotsOpen: 'New pieces added weekly',
      kitIncluded: 'Free shipping on all orders',
    },

    // Featured products
    featured: {
      eyebrow: 'The Collection',
      title: 'From the Studio',
      subtitle: 'No molds. No duplicates. Just clay, fire, and the maker\'s hands.',
      viewAll: 'View all',
      viewAllMobile: 'View All Pottery',
    },

    // Lifestyle gallery
    gallery: {
      title: 'In the Wild',
      subtitle: 'See how our collectors style their pieces at home.',
      shopLink: 'Shop the collection',
    },

    // Shop page
    shop: {
      breadHome: 'Home',
      breadShop: 'Shop',
      eyebrow: 'The Collection',
      title1: 'Handmade',
      title2: 'Pottery',
      subtitle: "Born on the wheel. Transformed by fire. Finished by hand.",
      subtitle2: "Once a piece sells, it is never remade.",
      aboutIntro: 'Every piece in this collection started as a lump of raw clay in our Fort Lauderdale studio. It was shaped on the wheel, coated in glazes we mix by hand, and fired at over 2,200°F until the colors fused into something unrepeatable. The drips, the depth, the way light moves across the surface — that is what makes each piece a collector\'s item, not just a pot. When you bring one home, you own the only one that will ever exist.',
      aboutHighlight: 'Complimentary FedEx shipping with tracking & insurance on every order.',
      galleryBtn: 'View Full Gallery',
      showing: (start: number, end: number, total: number) => `Showing ${start}–${end} of ${total} pieces`,
      page: (cur: number, total: number) => `Page ${cur} of ${total}`,
      emptyTitle: 'Every piece has found its home',
      emptySubtitle: 'Follow us on Instagram — new work drops without warning.',
      prev: 'Previous',
      next: 'Next',
      footer: 'Handcrafted with care in Fort Lauderdale, Florida',
      oneOfAKind: 'One of a Kind',
      sold: 'Sold',
    },

    // Gallery page
    galleryPage: {
      breadGallery: 'Gallery',
      eyebrow: 'Full Collection',
      title1: 'Pottery',
      title2: 'Gallery',
      subtitle: (n: number) => `${n} photos — every piece, every angle, every setting.`,
      subtitle2: 'Click any photo to view it full size.',
      backBtn: 'Back to Shop',
      showing: (start: number, end: number, total: number) => `Showing ${start}–${end} of ${total} photos`,
      ofPhotos: (cur: number, total: number) => `${cur} of ${total}`,
    },

    // About page
    aboutPage: {
      title: 'Jimmy Potters Studio',
      subtitle: 'Fort Lauderdale, Florida — where clay becomes art',
      potteryTitle: 'Why We Make',
      potteryP1: 'We started Jimmy Potters with a simple belief: your home deserves objects with a story. Not something stamped in a factory — something a person sat down and made with their hands, one afternoon, with intention. Every planter, vase, and pot in our collection was wheel-thrown in our Fort Lauderdale studio, dipped in glazes we formulate ourselves, and kiln-fired until the surface takes on a life of its own.',
      potteryP2: 'The drip of a glaze, the thumbprint near the base, the way two colors bleed into each other at the rim — these aren\'t flaws. They\'re proof that a human being made this for you. That\'s what separates a Jimmy Potters piece from everything else on the shelf. When it\'s in your home, people notice. They ask about it. And the answer is always a good story.',
      contactTitle: 'Get In Touch',
      contactSubtitle: "Curious about a piece, a custom order, or a collaboration? We'd love to hear from you.",
      shopBtn: 'Shop Pottery',
      wholesaleEyebrow: 'For Retailers & Plant Shops',
      wholesaleTitle: 'Stock Jimmy Potters in Your Store',
      wholesaleLead: 'We partner with independent plant shops, design studios, hotels, and boutiques across the US. Tiered wholesale pricing, dedicated production runs, and signature pieces your customers won\'t find on Amazon.',
      wholesaleBullet1: 'Tiered pricing — up to 50% off retail',
      wholesaleBullet2: 'Low MOQ — start with 12 pieces',
      wholesaleBullet3: '4–6 week production lead time',
      wholesaleBullet4: 'Net 30 terms for approved accounts',
      wholesaleCta: 'Apply for Wholesale',
      wholesaleCtaSecondary: 'Request Line Sheet',
    },

    // Newsletter
    newsletter: {
      title: 'Be the First to See New Work',
      subtitle: 'Join our list and get',
      discount: '10% off',
      subtitleEnd: 'your first piece — plus early access to new drops before they go public.',
      placeholder: 'Enter your email address',
      button: 'Sign Up & Save 10%',
      success: 'You\'re in! Check your inbox for your 10% discount code. New pieces are coming soon.',
      privacy: 'No spam, ever. Unsubscribe anytime.',
    },

    // Footer
    footer: {
      tagline: 'Handcrafted pottery from Fort Lauderdale, Florida.',
      tagline2: 'Every piece made once. Never repeated.',
      navTitle: 'Navigate',
      shopPottery: 'Shop Pottery',
      aboutUs: 'About Us',
      connectTitle: 'Connect',
      copyright: (year: number) => `© ${year} Jimmy Potters Studio. All rights reserved. Fort Lauderdale, Florida.`,
    },

    // Product details
    product: {
      addToCart: 'Add to Cart',
      freeShipping: 'Complimentary shipping on all orders',
      details: 'Details',
      shipping: 'Shipping',
    },

    // Kit page
    kit: {
      title: 'Home Pottery Kit',
      subtitle: 'Everything you need to create pottery at home',
      dateNightTitle: 'Date Night Edition',
      dateNightDesc: 'A complete pottery experience for two. Open the box, follow our step-by-step video tutorial, and create beautiful handmade pieces together. No experience needed.',
      whatsInside: "What's Inside",
      item1: '2KG Jimmy Potters branded air-dry clay',
      item2: 'Paint set of choice (pastel, floral, earth, or classic — 8 tubes)',
      item3: 'Pottery carving/shaping/cutting tools in branded canvas bag',
      item4: '2 ultra fine bristle paintbrushes',
      item5: 'Waterproof varnish (70ml)',
      item6: 'Pre-formed clay shapes',
      item7: 'Branded gift-ready box',
      item8: 'Access to video tutorials',
      howItWorks: 'How It Works',
      step1: 'Order your kit — ships with free FedEx',
      step2: 'Watch the guided video tutorial',
      step3: 'Create your masterpiece at home',
      price: '$100.00',
      buyBtn: 'Buy Kit',
      videoAccess: 'Includes access to our exclusive video tutorial',
      perfectFor: 'Perfect for date nights, family time, or a creative gift',
    },

    // Cart
    cart: {
      title: 'Your Cart',
      empty: 'Your cart is empty',
      emptySubtitle: 'Every piece is one of a kind — find the one that\'s yours.',
      continueShopping: 'Continue Shopping',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      free: 'Free',
      total: 'Total',
      checkout: 'Checkout',
      remove: 'Remove',
    },

    // Preview mode (NEXT_PUBLIC_SALES_ENABLED=false)
    previewBanner: {
      text: '🚧 Preview mode — online store is being finalized. Checkout opens soon. Explore freely!',
    },
    preview: {
      buttonLabel: 'Checkout opens soon',
      tooltip: 'Checkout opens soon',
      checkoutTitle: 'Checkout opens soon',
      checkoutSubtitle: 'Our online store is being finalized. Browsing and wholesale applications are open — card payments will unlock shortly. Thank you for your patience.',
      backToShop: 'Back to Shop',
      applyWholesale: 'Apply for Wholesale',
    },
  },

  es: {
    announcement: 'Envío Gratuito en Todos los Pedidos — Hecho a Mano en Fort Lauderdale, Florida',

    nav: {
      shop: 'Tienda',
      kit: 'Kit',
      about: 'Nosotros',
      signIn: 'Iniciar Sesión / Registrarse',
      myAccount: 'Mi Cuenta',
      cartEmpty: 'Carrito de compras, vacío',
      cartItems: (n: number) => `Carrito de compras, ${n} artículos`,
      langToggle: 'English',
    },

    hero: {
      eyebrow: 'Fort Lauderdale, Florida',
      title1: 'Cerámica',
      title2: 'Única',
      subtitle: 'Cada pieza es moldeada a mano en el torno, esmaltada con fórmulas originales y cocida a 1,200°C — creando colores y texturas que nunca se pueden replicar exactamente. Cuando encuentras la que te habla, fue hecha solo para tus manos.',
      shopBtn: 'Ver Cerámica',
      spotsOpen: 'Nuevas piezas cada semana',
      kitIncluded: 'Envío gratis en todos los pedidos',
    },

    featured: {
      eyebrow: 'La Colección',
      title: 'Desde el Taller',
      subtitle: 'Sin moldes. Sin duplicados. Solo arcilla, fuego y las manos del artesano.',
      viewAll: 'Ver todo',
      viewAllMobile: 'Ver Toda la Cerámica',
    },

    gallery: {
      title: 'En su Hábitat',
      subtitle: 'Mira cómo nuestros coleccionistas decoran con sus piezas.',
      shopLink: 'Ver la colección',
    },

    shop: {
      breadHome: 'Inicio',
      breadShop: 'Tienda',
      eyebrow: 'La Colección',
      title1: 'Cerámica',
      title2: 'Artesanal',
      subtitle: 'Nacida en el torno. Transformada por el fuego. Terminada a mano.',
      subtitle2: 'Cuando una pieza se vende, nunca se vuelve a hacer.',
      aboutIntro: 'Cada pieza de esta colección comenzó como un trozo de arcilla cruda en nuestro taller de Fort Lauderdale. Fue moldeada en el torno, cubierta con esmaltes que mezclamos a mano y cocida a más de 1,200°C hasta que los colores se fusionaron en algo irrepetible. Los goteos, la profundidad, la forma en que la luz se mueve sobre la superficie — eso es lo que hace de cada pieza un objeto de colección, no solo una maceta. Cuando te llevas una a casa, posees la única que existirá jamás.',
      aboutHighlight: 'Envío FedEx gratuito con seguimiento y seguro en cada pedido.',
      galleryBtn: 'Ver Galería Completa',
      showing: (start: number, end: number, total: number) => `Mostrando ${start}–${end} de ${total} piezas`,
      page: (cur: number, total: number) => `Página ${cur} de ${total}`,
      emptyTitle: 'Cada pieza ha encontrado su hogar',
      emptySubtitle: 'Síguenos en Instagram — las nuevas piezas aparecen sin aviso.',
      prev: 'Anterior',
      next: 'Siguiente',
      footer: 'Hecho con cariño en Fort Lauderdale, Florida',
      oneOfAKind: 'Pieza Única',
      sold: 'Vendido',
    },

    galleryPage: {
      breadGallery: 'Galería',
      eyebrow: 'Colección Completa',
      title1: 'Galería de',
      title2: 'Cerámica',
      subtitle: (n: number) => `${n} fotos — cada pieza, cada ángulo, cada escenario.`,
      subtitle2: 'Haz clic en cualquier foto para verla en tamaño completo.',
      backBtn: 'Volver a la Tienda',
      showing: (start: number, end: number, total: number) => `Mostrando ${start}–${end} de ${total} fotos`,
      ofPhotos: (cur: number, total: number) => `${cur} de ${total}`,
    },

    aboutPage: {
      title: 'Jimmy Potters Studio',
      subtitle: 'Fort Lauderdale, Florida — donde la arcilla se convierte en arte',
      potteryTitle: 'Por Qué Creamos',
      potteryP1: 'Comenzamos Jimmy Potters con una creencia simple: tu hogar merece objetos con historia. No algo estampado en una fábrica — algo que una persona se sentó a hacer con sus manos, una tarde, con intención. Cada maceta, jarrón y plato de nuestra colección fue torneado en nuestro taller de Fort Lauderdale, sumergido en esmaltes que formulamos nosotros mismos y cocido en horno hasta que la superficie cobra vida propia.',
      potteryP2: 'El goteo de un esmalte, la huella del pulgar cerca de la base, la forma en que dos colores se funden en el borde — no son defectos. Son la prueba de que un ser humano hizo esto para ti. Eso es lo que separa una pieza de Jimmy Potters de todo lo demás en la estantería. Cuando está en tu hogar, la gente lo nota. Preguntan por ella. Y la respuesta siempre es una buena historia.',
      contactTitle: 'Contáctanos',
      contactSubtitle: '¿Curiosidad sobre una pieza, un pedido personalizado o una colaboración? Nos encantaría saber de ti.',
      shopBtn: 'Ver Cerámica',
      wholesaleEyebrow: 'Para Tiendas y Viveros',
      wholesaleTitle: 'Vende Jimmy Potters en Tu Tienda',
      wholesaleLead: 'Colaboramos con viveros independientes, estudios de diseño, hoteles y boutiques en todo EE.UU. Precios escalonados al por mayor, producción dedicada y piezas exclusivas que tus clientes no encontrarán en Amazon.',
      wholesaleBullet1: 'Precios escalonados — hasta 50% de descuento',
      wholesaleBullet2: 'Pedido mínimo bajo — desde 12 piezas',
      wholesaleBullet3: 'Producción en 4–6 semanas',
      wholesaleBullet4: 'Términos Net 30 para cuentas aprobadas',
      wholesaleCta: 'Solicitar Cuenta Mayorista',
      wholesaleCtaSecondary: 'Pedir Hoja de Productos',
    },

    newsletter: {
      title: 'Sé el Primero en Ver las Nuevas Creaciones',
      subtitle: 'Únete a nuestra lista y recibe',
      discount: '10% de descuento',
      subtitleEnd: 'en tu primera pieza — más acceso anticipado a nuevos lanzamientos antes de que sean públicos.',
      placeholder: 'Ingresa tu correo electrónico',
      button: 'Suscríbete y Ahorra 10%',
      success: '¡Ya estás dentro! Revisa tu bandeja de entrada para tu código del 10%. Nuevas piezas vienen pronto.',
      privacy: 'Sin spam, nunca. Cancela cuando quieras.',
    },

    footer: {
      tagline: 'Cerámica artesanal de Fort Lauderdale, Florida.',
      tagline2: 'Cada pieza hecha una vez. Nunca repetida.',
      navTitle: 'Navegar',
      shopPottery: 'Ver Cerámica',
      aboutUs: 'Sobre Nosotros',
      connectTitle: 'Conectar',
      copyright: (year: number) => `© ${year} Jimmy Potters Studio. Todos los derechos reservados. Fort Lauderdale, Florida.`,
    },

    product: {
      addToCart: 'Agregar al Carrito',
      freeShipping: 'Envío gratuito en todos los pedidos',
      details: 'Detalles',
      shipping: 'Envío',
    },

    kit: {
      title: 'Kit de Cerámica en Casa',
      subtitle: 'Todo lo que necesitas para crear cerámica en casa',
      dateNightTitle: 'Edición Noche de Cita',
      dateNightDesc: 'Una experiencia completa de cerámica para dos. Abre la caja, sigue nuestro video tutorial paso a paso y crea hermosas piezas hechas a mano juntos. No se necesita experiencia.',
      whatsInside: 'Qué Incluye',
      item1: '2KG de arcilla de secado al aire marca Jimmy Potters',
      item2: 'Set de pinturas a elección (pastel, floral, tierra o clásico — 8 tubos)',
      item3: 'Herramientas de tallado/modelado/corte en bolsa de lona con marca',
      item4: '2 pinceles de cerdas ultra finas',
      item5: 'Barniz impermeabilizante (70ml)',
      item6: 'Formas de arcilla preformadas',
      item7: 'Caja de regalo con marca',
      item8: 'Acceso a video tutoriales',
      howItWorks: 'Cómo Funciona',
      step1: 'Ordena tu kit — envío gratis con FedEx',
      step2: 'Mira el video tutorial guiado',
      step3: 'Crea tu obra maestra en casa',
      price: '$100.00',
      buyBtn: 'Comprar Kit',
      videoAccess: 'Incluye acceso a nuestro video tutorial exclusivo',
      perfectFor: 'Perfecto para noches de cita, tiempo en familia o un regalo creativo',
    },

    cart: {
      title: 'Tu Carrito',
      empty: 'Tu carrito está vacío',
      emptySubtitle: 'Cada pieza es única — encuentra la que es tuya.',
      continueShopping: 'Seguir Comprando',
      subtotal: 'Subtotal',
      shipping: 'Envío',
      free: 'Gratis',
      total: 'Total',
      checkout: 'Pagar',
      remove: 'Eliminar',
    },

    // Preview mode (NEXT_PUBLIC_SALES_ENABLED=false)
    previewBanner: {
      text: '🚧 Modo de vista previa — la tienda en línea se está finalizando. El pago estará disponible pronto. ¡Explora libremente!',
    },
    preview: {
      buttonLabel: 'El pago estará disponible pronto',
      tooltip: 'El pago estará disponible pronto',
      checkoutTitle: 'El pago estará disponible pronto',
      checkoutSubtitle: 'Nuestra tienda en línea se está finalizando. La navegación y las solicitudes mayoristas están abiertas — los pagos con tarjeta se habilitarán en breve. Gracias por tu paciencia.',
      backToShop: 'Volver a la Tienda',
      applyWholesale: 'Solicitar Cuenta Mayorista',
    },
  },
} as const;

export type Translations = typeof translations['en'];
export default translations;
