import watch from "@/assets/watch.jpg";
import chair from "@/assets/chair.jpg";
import headphones from "@/assets/headphones.jpg";
import camera from "@/assets/camera-hero.jpg";

export const categories = [
  "All auctions",
  "Electronics",
  "Fashion",
  "Home & Furniture",
  "Art & Collectibles",
  "Automotive",
];

export type Auction = {
  id: string;
  title: string;
  category: string;
  image: string;
  price: number;
  bids: number;
  seconds: number;
  increment: number;
  tag: string;
  description: string;
  seller: string;
  closed?: boolean;
};

export const initialAuctions: Auction[] = [
  {
    id: "vintage-watch",
    title: "Vintage Oyster Perpetual",
    category: "Fashion",
    image: watch,
    price: 2450,
    bids: 24,
    seconds: 8124,
    increment: 50,
    tag: "Ending soon",
    description:
      "An elegant vintage automatic wristwatch with a stainless steel bracelet and olive dial. Excellent pre-owned condition with light signs of wear. Includes a presentation box.",
    seller: "The Watch Archive",
  },
  {
    id: "lounge-chair",
    title: "Eames Lounge Chair & Ottoman",
    category: "Home & Furniture",
    image: chair,
    price: 1250,
    bids: 18,
    seconds: 19843,
    increment: 50,
    tag: "Popular",
    description:
      "A timeless lounge chair and matching ottoman, featuring rich walnut shells and supple black leather. A beautifully maintained statement piece for your home.",
    seller: "Modern Objects",
  },
  {
    id: "wireless-headphones",
    title: "Apple AirPods Max — Silver",
    category: "Electronics",
    image: headphones,
    price: 185,
    bids: 32,
    seconds: 3544,
    increment: 10,
    tag: "Ending soon",
    description:
      "Premium over-ear wireless headphones in silver with active noise cancellation. Lightly used and fully functional. Includes carrying case and charging cable.",
    seller: "Audio Collective",
  },
  {
    id: "vintage-camera",
    title: "Leica M3 Vintage Film Camera",
    category: "Art & Collectibles",
    image: camera,
    price: 890,
    bids: 12,
    seconds: 95326,
    increment: 25,
    tag: "Rare find",
    description:
      "A classic 35mm rangefinder camera with a silver finish and black leather body. A collectible piece of photographic history, with smooth mechanical operation.",
    seller: "Analog Archive",
  },
];
