export interface NavItem {
  label: string;
  href: string;
}

export interface Package {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: string;
  inclusions: string[];
  image: string;
}

export interface Review {
  name: string;
  location: string;
  rating: number;
  text: string;
  trip: string;
}

export interface FaqItem {
  q: string;
  a: string;
}