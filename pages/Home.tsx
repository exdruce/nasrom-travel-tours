import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ArrowRight, Palmtree, Sunset, Utensils, Anchor } from "lucide-react";
import { Button } from "../components/ui/Button";

import HeroImage from "../assets/images/jeti-nasrom.jpg";

import PerhentianImage from "../assets/images/jeti-pp-3.png";
import SunsetImage from "../assets/images/semerak.jpg";
import JettyImage from "../assets/images/jeti-2.jpg";
import RedangImage from "../assets/images/jeti-pr-2.png";

const Home: React.FC = () => {
  const { t } = useTranslation("home");
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.5,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const stats = [
    { label: "Passengers", value: "28", suffix: "Pax" },
    { label: "River Cruise", value: "3.8", suffix: "KM" },
    { label: "Daily Service", value: "8", suffix: "AM-3PM" },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={HeroImage}
            alt="Tok Bali Jetty"
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
          {/* Updated gradient to use brand teal */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-teal/70 via-navy/30 to-navy/90" />
        </div>

        <div
          className="relative z-10 max-w-7xl mx-auto px-4 text-center sm:px-6 lg:px-8"
          ref={textRef}
        >
          <div className="inline-flex flex-col items-center justify-center mb-8 animate-fade-in">
            <span className="font-script text-6xl md:text-8xl text-white drop-shadow-lg mb-4">
              Nasrom
            </span>
            <span className="text-white/90 text-xs tracking-[0.4em] uppercase border-t border-white/30 pt-4 w-full font-medium">
              Travel & Tours
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-8 leading-tight max-w-5xl mx-auto drop-shadow-xl tracking-tight">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-12 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
            {t("hero.description")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link to="/contact">
              <Button
                size="lg"
                className="min-w-[220px] shadow-2xl hover:-translate-y-1 text-base py-4 rounded-xl"
              >
                {t("hero.ctaPrimary")}
              </Button>
            </Link>
            <Link to="/schedule">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[220px] border-white text-white hover:bg-white hover:text-brand-teal text-base py-4 rounded-xl"
              >
                {t("hero.ctaSecondary")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
          <ArrowRight className="rotate-90 w-6 h-6" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-navy py-16 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-orange to-brand-teal opacity-80"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="text-center pt-8 md:pt-0 group cursor-default"
              >
                <div className="text-5xl font-serif font-bold text-brand-orange mb-3 group-hover:scale-105 transition-transform duration-500">
                  {stat.value}{" "}
                  <span className="text-2xl text-brand-orange/60 font-sans font-light">
                    {stat.suffix}
                  </span>
                </div>
                <div className="text-brand-teal uppercase tracking-[0.2em] text-xs font-bold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-brand-orange font-bold uppercase tracking-[0.2em] text-xs mb-3 block">
              Discover Paradise
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-6 tracking-tight">
              {t("services.title")}
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed font-light">
              From island hopping to serene river cruises, we provide premium
              experiences tailored for comfort and adventure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Perhentian Card */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-b-4 border-brand-teal">
              <div className="relative h-72 overflow-hidden">
                <img
                  src={PerhentianImage}
                  alt="Perhentian"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-brand-teal/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-brand-teal uppercase tracking-wide shadow-sm">
                  Most Popular
                </div>
              </div>
              <div className="p-10">
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                  <Palmtree className="w-7 h-7 text-brand-teal" />
                </div>
                <h3 className="text-2xl font-bold text-navy mb-4 font-serif tracking-tight">
                  Pulau Perhentian
                </h3>
                <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed">
                  Crystal clear waters and white sandy beaches. Snorkeling,
                  diving and relaxation awaits at this tropical haven.
                </p>
                <Link to="/packages">
                  <span className="text-brand-orange font-bold text-sm uppercase tracking-wider group-hover:underline flex items-center gap-2">
                    Explore Package <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Redang Card */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-b-4 border-brand-orange">
              <div className="relative h-72 overflow-hidden">
                <img
                  src={RedangImage}
                  alt="Redang"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-brand-teal/20 group-hover:bg-black/0 transition-colors" />
              </div>
              <div className="p-10">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                  <Anchor className="w-7 h-7 text-brand-orange" />
                </div>
                <h3 className="text-2xl font-bold text-navy mb-4 font-serif tracking-tight">
                  Pulau Redang
                </h3>
                <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed">
                  Luxury island destination with world-class resorts, turtles,
                  and epic sunset views perfect for families.
                </p>
                <Link to="/packages">
                  <span className="text-brand-orange font-bold text-sm uppercase tracking-wider group-hover:underline flex items-center gap-2">
                    Explore Package <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>

            {/* River Cruise Card */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-b-4 border-brand-teal">
              <div className="relative h-72 overflow-hidden">
                <img
                  src={SunsetImage}
                  alt="River Cruise"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-brand-teal/20 group-hover:bg-black/0 transition-colors" />
              </div>
              <div className="p-10">
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                  <Sunset className="w-7 h-7 text-brand-teal" />
                </div>
                <h3 className="text-2xl font-bold text-navy mb-4 font-serif tracking-tight">
                  Sungai Semerak
                </h3>
                <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed">
                  3.8km scenic cruise through mangroves. Experience nature,
                  wildlife, and stunning sunsets along the river.
                </p>
                <Link to="/packages">
                  <span className="text-brand-orange font-bold text-sm uppercase tracking-wider group-hover:underline flex items-center gap-2">
                    Explore Package <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Teaser */}
      <section className="relative py-28 bg-brand-teal overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-white rounded-full opacity-5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-brand-orange rounded-full opacity-10 blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">
                World Class Comfort
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8 tracking-tight">
                Premium Jetty Facilities
              </h2>
              <p className="text-white/90 mb-10 text-lg leading-relaxed font-light">
                Start your journey in comfort. Tok Bali Jetty offers a wide
                range of amenities to ensure a pleasant experience before your
                boat departs.
              </p>

              <ul className="space-y-5 mb-12">
                {[
                  "Malay & Seafood Restaurants",
                  "Air-conditioned Lounge",
                  "Secure Parking Area",
                  "Island Equipment Shop",
                  "Cafe & Coffee",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center text-white font-medium text-lg"
                  >
                    <div className="bg-brand-orange p-1.5 rounded-full mr-4 shadow-lg">
                      <Utensils className="w-3.5 h-3.5 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link to="/facilities">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-brand-teal rounded-xl px-8 py-3.5"
                >
                  View All Facilities
                </Button>
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-orange transform rotate-3 rounded-2xl opacity-40 transition-transform group-hover:rotate-6" />
              <img
                src={JettyImage}
                alt="Jetty Facilities"
                className="relative rounded-2xl shadow-2xl border-4 border-white/20 transition-transform group-hover:-translate-y-2 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-orange relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 drop-shadow-md tracking-tight">
            Ready for your adventure?
          </h2>
          <p className="text-white/90 text-xl mb-10 font-medium max-w-2xl mx-auto">
            Book your boat transfer or river cruise today securely via WhatsApp
            or our inquiry form.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link to="/contact">
              <button className="bg-white text-brand-orange px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl uppercase tracking-widest transform hover:-translate-y-1">
                Book Now
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
