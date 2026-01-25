import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { Button } from "../components/ui/Button";

import PerhentianImage from "../assets/images/pakej-pp.jpg";
import SunsetImage from "../assets/images/sunset.jpg";
import FishingTripImage from "../assets/images/fishing-trip.png";
import RedangImage from "../assets/images/jeti-pr-3.png";

const Packages: React.FC = () => {
  const { t } = useTranslation("common");

  const packages = [
    {
      id: 1,
      title: "Perhentian Day Trip",
      price: "150",
      duration: "Full Day",
      image: PerhentianImage,
      features: [
        "Return Boat Transfer",
        "Snorkeling Equipment",
        "Lunch Included",
        "5 Snorkeling Points",
        "Guide Service",
      ],
      tag: "Best Seller",
    },
    {
      id: 2,
      title: "Redang Leisure",
      price: "220",
      duration: "2 Days 1 Night",
      image: RedangImage,
      features: [
        "Return Boat Transfer",
        "Resort Stay",
        "Breakfast Included",
        "Marine Park Ticket",
        "Free & Easy",
      ],
      tag: "Popular",
    },
    {
      id: 3,
      title: "Sunset River Cruise",
      price: "80",
      duration: "2 Hours",
      image: SunsetImage,
      features: [
        "Scenic Mangrove Tour",
        "Light Refreshments",
        "Traditional Kuih",
        "Photo Opportunities",
        "Wildlife Spotting",
      ],
      tag: "New",
    },
    {
      id: 4,
      title: "Fishing Expedition",
      price: "350",
      duration: "8 Hours",
      image: FishingTripImage,
      features: [
        "Private Boat Charter",
        "Fishing Rods & Bait",
        "Experienced Skipper",
        "Ice Box provided",
        "Keep Your Catch",
      ],
      tag: null,
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Header */}
        <div className="text-center mb-24">
          <span className="text-brand-orange font-bold uppercase tracking-[0.25em] text-xs block mb-3">
            Adventure Awaits
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-navy mb-6 tracking-tight">
            {t("packages.title")}
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto text-xl font-light leading-relaxed">
            Curated experiences for every type of traveler. Whether you're here
            for the day or staying for the week, we have the perfect package for
            you.
          </p>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col border border-gray-100"
            >
              <div className="relative h-56">
                <img
                  src={pkg.image}
                  alt={pkg.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                {pkg.tag && (
                  <div className="absolute top-4 left-4 bg-brand-orange text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-widest">
                    {pkg.tag}
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-navy flex items-center shadow-sm">
                  <Star className="w-3.5 h-3.5 text-brand-orange mr-1 fill-current" />{" "}
                  4.9
                </div>
              </div>

              <div className="p-8 flex-grow flex flex-col">
                <div className="mb-6">
                  <p className="text-xs text-brand-teal font-bold uppercase tracking-widest mb-2">
                    {pkg.duration}
                  </p>
                  <h3 className="text-2xl font-bold text-navy font-serif leading-tight">
                    {pkg.title}
                  </h3>
                </div>

                <div className="flex items-baseline mb-8">
                  <span className="text-xs text-gray-500 mr-1 uppercase font-bold tracking-wider">
                    From
                  </span>
                  <span className="text-lg font-bold text-brand-teal">RM</span>
                  <span className="text-4xl font-bold text-navy ml-1 font-serif">
                    {pkg.price}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">/pax</span>
                </div>

                <ul className="space-y-4 mb-10 flex-grow">
                  {pkg.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm text-gray-600 font-medium"
                    >
                      <div className="bg-teal-50 rounded-full p-0.5 mr-3 mt-0.5">
                        <Check className="w-3 h-3 text-brand-teal" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to="/contact" className="mt-auto">
                  <Button
                    variant="outline"
                    fullWidth
                    className="group hover:bg-brand-teal hover:border-brand-teal hover:text-white py-3 rounded-xl border-2 font-bold text-xs tracking-widest"
                  >
                    Book Package
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Package CTA */}
        <div className="mt-24 bg-navy rounded-3xl p-10 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal rounded-full blur-[100px] opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-orange rounded-full blur-[100px] opacity-10 transform -translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-white text-center md:text-left max-w-2xl">
              <h3 className="text-3xl md:text-4xl font-serif font-bold mb-6 tracking-tight">
                Need a Custom Itinerary?
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed font-light">
                Planning a corporate retreat, family reunion, or private event?
                Contact our specialized team to build a bespoke island
                experience just for you.
              </p>
            </div>
            <Link to="/contact">
              <Button
                size="lg"
                className="bg-brand-orange text-white hover:bg-white hover:text-navy border-none shadow-xl min-w-[220px] py-4 rounded-xl text-sm"
              >
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packages;
