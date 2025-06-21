export type Product = {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  imageUrl: string;
  price: string;
  discountedPrice: string;
};

export const allProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    description: "Top quality noise-cancelling headphones",
    location: "Downtown Toronto",
    coordinates: { lat: 43.6532, lng: -79.3832 },
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
    price: "$299",
    discountedPrice: "$249",
  },
  {
    id: "2",
    name: "Gaming Laptop",
    description: "High-performance gaming laptop",
    location: "North York",
    coordinates: { lat: 43.7615, lng: -79.4111 },
    imageUrl:
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=200&fit=crop",
    price: "$1,299",
    discountedPrice: "$1,099",
  },
  {
    id: "3",
    name: "Vintage Camera",
    description: "Classic film camera in excellent condition",
    location: "Scarborough",
    coordinates: { lat: 43.7731, lng: -79.2578 },
    imageUrl:
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=200&fit=crop",
    price: "$450",
    discountedPrice: "$350",
  },
  {
    id: "4",
    name: "Electric Bike",
    description: "Eco-friendly commuter bike",
    location: "Etobicoke",
    coordinates: { lat: 43.6205, lng: -79.5132 },
    imageUrl:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=200&fit=crop",
    price: "$1,200",
    discountedPrice: "$1,000",
  },
  {
    id: "5",
    name: "Designer Sofa",
    description: "Modern 3-seater sofa",
    location: "Mississauga",
    coordinates: { lat: 43.589, lng: -79.6441 },
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
    price: "$800",
    discountedPrice: "$600",
  },
  {
    id: "6",
    name: "Smart Watch",
    description: "Latest fitness tracking smartwatch",
    location: "Markham",
    coordinates: { lat: 43.8561, lng: -79.337 },
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
    price: "$350",
    discountedPrice: "$250",
  },
  {
    id: "7",
    name: "Mountain Bike",
    description: "Professional mountain bike",
    location: "Brampton",
    coordinates: { lat: 43.7315, lng: -79.7624 },
    imageUrl:
      "https://images.unsplash.com/photo-1544191696-15693072648c?w=300&h=200&fit=crop",
    price: "$650",
    discountedPrice: "$500",
  },
  {
    id: "8",
    name: "Coffee Machine",
    description: "Professional espresso machine",
    location: "Richmond Hill",
    coordinates: { lat: 43.8828, lng: -79.4403 },
    imageUrl:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop",
    price: "$425",
    discountedPrice: "$300",
  },
]; 