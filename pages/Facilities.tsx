import React from 'react';
import { useTranslation } from 'react-i18next';
import { Utensils, Coffee, Car, Wifi, Armchair, ShoppingBag } from 'lucide-react';

const Facilities: React.FC = () => {
  const { t } = useTranslation('common');

  const facilities = [
    {
      icon: <Car className="w-7 h-7" />,
      title: "Secure Parking",
      desc: "Ample parking space with 24/7 security surveillance for peace of mind while you are on the island.",
      image: "https://picsum.photos/600/400?parking"
    },
    {
      icon: <Armchair className="w-7 h-7" />,
      title: "Premium Lounge",
      desc: "Air-conditioned waiting area with comfortable seating, charging stations, and prayer rooms (Surau).",
      image: "https://picsum.photos/600/400?lounge"
    },
    {
      icon: <Utensils className="w-7 h-7" />,
      title: "Seafood Restaurant",
      desc: "Halal-certified restaurant serving fresh local seafood and traditional Kelantanese delicacies.",
      image: "https://picsum.photos/600/400?food"
    },
    {
      icon: <Coffee className="w-7 h-7" />,
      title: "Jetty Cafe",
      desc: "Grab a quick coffee, snacks, or breakfast before your morning boat departure.",
      image: "https://picsum.photos/600/400?cafe"
    },
    {
      icon: <ShoppingBag className="w-7 h-7" />,
      title: "Convenience Store",
      desc: "Forgot something? Our shop stocks sunscreen, hats, waterproof bags, and snacks.",
      image: "https://picsum.photos/600/400?shop"
    },
    {
      icon: <Wifi className="w-7 h-7" />,
      title: "Free Wi-Fi",
      desc: "High-speed internet access available throughout the terminal building.",
      image: "https://picsum.photos/600/400?wifi"
    }
  ];

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center pt-16">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-navy mb-8 tracking-tight">Jetty Facilities</h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
          Nasrom Travel & Tours operates from a fully equipped jetty designed to make your transit comfortable and convenient.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {facilities.map((item, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
              {/* Image Top */}
              <div className="h-56 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              
              {/* Content */}
              <div className="p-8 bg-white relative">
                <div className="absolute -top-12 right-8 bg-brand-orange text-white p-4 rounded-2xl shadow-xl transform rotate-3 group-hover:rotate-12 transition-transform duration-500 ring-4 ring-white">
                  {item.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-navy mb-4 font-serif group-hover:text-brand-teal transition-colors tracking-tight">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium opacity-80">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Map / Directions teaser */}
        <div className="mt-28 border-t border-gray-100 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
               <div className="bg-gray-100 w-full h-96 rounded-3xl overflow-hidden shadow-inner border border-gray-200">
                  <img src="https://picsum.photos/800/600?map" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 opacity-80 hover:opacity-100" alt="Location Map" />
               </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="text-brand-orange font-bold uppercase tracking-[0.2em] text-xs mb-3 block">Location</span>
              <h2 className="text-4xl font-serif font-bold text-navy mb-6 tracking-tight">Easy Access & Parking</h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed font-light">
                Located just 45 minutes from Kota Bharu Airport, Jeti Tok Bali is easily accessible by car or taxi. We provide a secure, gated parking compound for guests leaving their vehicles overnight.
              </p>
              <div className="bg-teal-50/50 p-8 rounded-2xl border border-brand-teal/10">
                <h4 className="font-bold text-brand-teal mb-4 text-sm uppercase tracking-widest">Parking Rates</h4>
                <div className="flex justify-between text-base text-gray-700 border-b border-gray-200/50 pb-3 mb-3">
                  <span>Day Parking</span>
                  <span className="font-bold text-navy font-serif text-lg">RM 10 <span className="text-xs font-sans font-normal text-gray-500">/ day</span></span>
                </div>
                <div className="flex justify-between text-base text-gray-700">
                  <span>Overnight</span>
                  <span className="font-bold text-navy font-serif text-lg">RM 15 <span className="text-xs font-sans font-normal text-gray-500">/ night</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Facilities;