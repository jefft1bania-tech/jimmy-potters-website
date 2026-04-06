import GalleryPageClient from './GalleryPageClient';

export const metadata = {
  title: 'Pottery Gallery | Jimmy Potters',
  description:
    'Browse our full collection of handmade pottery photography — planters, vases, and one-of-a-kind pieces in stunning lifestyle and studio settings.',
};

// All 28 pottery photos mapped with descriptions
const allGalleryPhotos = [
  {
    src: '/images/products/teal-hanging-planter-pothos_hero.jpg',
    alt: 'Teal hanging planter with golden pothos in sunlit garden',
    caption: 'Teal Hanging Planter — Garden',
  },
  {
    src: '/images/products/teal-flower-ring-planter_flowers.jpg',
    alt: 'Teal ring planter overflowing with petunias, lobelia and sweet potato vine',
    caption: 'Teal Ring Planter — Summer Blooms',
  },
  {
    src: '/images/products/dark-green-studio-ring-planter_hero.jpg',
    alt: 'Dark green-black ring planter on white studio background',
    caption: 'Dark Green Studio Planter',
  },
  {
    src: '/images/products/dark-teal-hanging-planter-vines_porch.jpg',
    alt: 'Dark teal planter with string of hearts on brick porch',
    caption: 'Dark Teal Planter — Brick Porch',
  },
  {
    src: '/images/products/deep-teal-garden-ring-planter_garden.jpg',
    alt: 'Deep teal ring planter with trailing ivy in garden with bokeh',
    caption: 'Deep Teal Planter — Garden',
  },
  {
    src: '/images/products/celadon-drip-vase_lifestyle.jpg',
    alt: 'Celadon drip-glaze vase with yellow tulips on dining table',
    caption: 'Celadon Vase — Yellow Tulips',
  },
  {
    src: '/images/products/celadon-drip-vase_hero.jpg',
    alt: 'Celadon drip-glaze vase studio shot on white background',
    caption: 'Celadon Vase — Studio',
  },
  {
    src: '/images/products/navy-round-planter-primrose.jpg',
    alt: 'Navy round planter with primrose flowers in spring garden',
    caption: 'Navy Round Planter — Spring Primrose',
  },
  {
    src: '/images/products/orange-footed-drip-planter_garden.jpg',
    alt: 'Orange footed planter with pothos in lush spring garden',
    caption: 'Orange Footed Planter — Spring Garden',
  },
  {
    src: '/images/products/orange-footed-drip-planter_closeup.jpg',
    alt: 'Orange footed planter close-up in garden setting',
    caption: 'Orange Footed Planter — Close-up',
  },
  {
    src: '/images/products/orange-footed-drip-planter_hero.jpg',
    alt: 'Orange footed planter with snake plant on windowsill',
    caption: 'Orange Footed Planter — Snake Plant',
  },
  {
    src: '/images/products/orange-footed-planter-colorful-garden.jpg',
    alt: 'Orange footed planter with snake plant in colorful flower garden',
    caption: 'Orange Footed Planter — Flower Garden',
  },
  {
    src: '/images/products/herringbone-pots-orchids.jpg',
    alt: 'Two herringbone pattern orchid pots with white phalaenopsis orchids',
    caption: 'Herringbone Orchid Pot Set',
  },
  {
    src: '/images/products/amber-orchid-pot_detail.jpg',
    alt: 'Amber orchid pot tipped on side showing saucer detail',
    caption: 'Amber Orchid Pot — Detail',
  },
  {
    src: '/images/products/amber-orchid-pot_hero.jpg',
    alt: 'Amber orchid pot with white orchid and river stones',
    caption: 'Amber Orchid Pot — White Orchid',
  },
  {
    src: '/images/products/navy-round-planter-tulips.jpg',
    alt: 'Navy round planter with orange tulips on saucer',
    caption: 'Navy Round Planter — Orange Tulips',
  },
  {
    src: '/images/products/square-planter-garden-scene.jpg',
    alt: 'Navy square planter with daffodils surrounded by pink flowers',
    caption: 'Navy Square Planter — Daffodils',
  },
  {
    src: '/images/products/navy-faceted-planter_hero.jpg',
    alt: 'Navy faceted planter with money tree in studio setting',
    caption: 'Navy Faceted Planter — Money Tree',
  },
  {
    src: '/images/products/navy-faceted-planter_shelf.jpg',
    alt: 'Navy faceted planter with money tree on wooden shelf',
    caption: 'Navy Faceted Planter — Shelf',
  },
  {
    src: '/images/products/orange-drip-glaze-vase_closeup.jpg',
    alt: 'Close-up of orange drip-glaze vase showing sage-green glaze detail',
    caption: 'Orange Drip Vase — Glaze Detail',
  },
  {
    src: '/images/products/orange-drip-glaze-vase_lifestyle.jpg',
    alt: 'Orange drip-glaze vase with tulips on outdoor couch',
    caption: 'Orange Drip Vase — Outdoor Lifestyle',
  },
  {
    src: '/images/products/orange-footed-planter-holiday.jpg',
    alt: 'Orange footed planter with tropical plant in holiday candlelight setting',
    caption: 'Orange Footed Planter — Holiday',
  },
  {
    src: '/images/products/celadon-drip-vase_marble.jpg',
    alt: 'Celadon vase with orange-yellow tulips on marble countertop',
    caption: 'Celadon Vase — Marble',
  },
  {
    src: '/images/products/teal-mountain-planter_plant.jpg',
    alt: 'Teal mountain planter with anthurium plant',
    caption: 'Teal Mountain Planter — Anthurium',
  },
  {
    src: '/images/products/teal-mountain-planter_hero.jpg',
    alt: 'Teal mountain drip planter held in hand showing glaze detail',
    caption: 'Teal Mountain Planter — In Hand',
  },
  {
    src: '/images/products/teal-mountain-planter_studio.jpg',
    alt: 'Teal mountain planter empty on countertop showing full glaze pattern',
    caption: 'Teal Mountain Planter — Studio',
  },
  {
    src: '/images/products/teal-mountain-planter_empty.jpg',
    alt: 'Teal mountain planter empty showing inside and saucer',
    caption: 'Teal Mountain Planter — Empty',
  },
  {
    src: '/images/products/navy-faceted-planter_collection.jpg',
    alt: 'Collection of teal mountain planters with money tree and stacked saucers',
    caption: 'The Collection — Planters & Saucers',
  },
];

export default function GalleryPage() {
  return <GalleryPageClient photos={allGalleryPhotos} />;
}
