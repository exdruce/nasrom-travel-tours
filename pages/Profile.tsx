import React from "react";
import { useTranslation } from "react-i18next";
import { Shield, Clock, Heart, Award } from "lucide-react";

import HeroBg from "../assets/images/photo_18_2026-01-23_23-44-26.jpg";
import StoryImage from "../assets/images/photo_15_2026-01-23_23-44-26.jpg";
import Gallery1 from "../assets/images/photo_22_2026-01-23_23-44-26.jpg";
import Gallery2 from "../assets/images/photo_19_2026-01-23_23-44-26.jpg";
import Gallery3 from "../assets/images/photo_11_2026-01-23_23-44-26.jpg";
import Gallery4 from "../assets/images/photo_9_2026-01-23_23-44-26.jpg";

const Profile: React.FC = () => {
  const { t } = useTranslation("common");

  const values = [
    {
      icon: <Shield className="w-8 h-8 text-brand-orange" />,
      title: "Safety First",
      desc: "Our fleet maintains the highest safety standards with regular maintenance and certified crew members.",
    },
    {
      icon: <Clock className="w-8 h-8 text-brand-orange" />,
      title: "Punctuality",
      desc: "We respect your holiday time. Our boats depart on schedule to ensure you maximize your island experience.",
    },
    {
      icon: <Heart className="w-8 h-8 text-brand-orange" />,
      title: "Premium Comfort",
      desc: "Travel in style with our cushioned seating, covered cabins, and ample luggage storage.",
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Header */}
      <div className="relative bg-navy py-32 sm:py-48">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={HeroBg}
            alt="Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight">
            {t("profile.title")}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            Your trusted partner for luxury island transfers and river cruises
            in Tok Bali.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-brand-orange/10 rounded-full z-0" />
              <img
                src={StoryImage}
                alt="Our Boat"
                className="relative z-10 rounded-2xl shadow-2xl border-b-8 border-brand-teal w-full"
              />
              <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-xl shadow-xl z-20 max-w-xs hidden md:block">
                <div className="flex items-center gap-5">
                  <Award className="w-12 h-12 text-brand-orange" />
                  <div>
                    <p className="font-bold text-navy text-xl font-serif">
                      Top Rated
                    </p>
                    <p className="text-sm text-gray-500">Service in Tok Bali</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs">
                {t("profile.story")}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-navy tracking-tight leading-tight">
                Bridging the Gap to Paradise
              </h2>
              <div className="space-y-6 text-lg text-gray-600 font-light leading-relaxed">
                <p>
                  Established with a vision to revolutionize the ferry service
                  industry in Tok Bali, Nasrom Travel & Tours has grown from a
                  humble operator to the leading provider of premium boat
                  transfers.
                </p>
                <p>
                  We understand that your holiday begins the moment you step
                  onto the jetty. That's why we've invested in a modern fleet
                  and a private lounge to ensure your journey is as memorable as
                  the destination itself.
                </p>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-10 border-t border-gray-100 mt-10">
                <div>
                  <h4 className="text-5xl font-serif font-bold text-brand-teal mb-2">
                    10+
                  </h4>
                  <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">
                    Years Experience
                  </p>
                </div>
                <div>
                  <h4 className="text-5xl font-serif font-bold text-brand-teal mb-2">
                    50k+
                  </h4>
                  <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">
                    Happy Passengers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-serif font-bold text-navy mb-4 tracking-tight">
              Our Core Values
            </h2>
            <div className="h-1.5 w-24 bg-brand-orange mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {values.map((item, i) => (
              <div
                key={i}
                className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-transparent hover:border-brand-orange group transform hover:-translate-y-1"
              >
                <div className="bg-brand-teal/5 w-20 h-20 rounded-full flex items-center justify-center mb-8 group-hover:bg-brand-teal/10 transition-colors">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-navy mb-4 font-serif">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 h-80 md:h-96">
        {[Gallery1, Gallery2, Gallery3, Gallery4].map((img, i) => (
          <div key={i} className="relative group overflow-hidden">
            <img
              src={img}
              alt="Gallery"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-brand-teal/30 group-hover:bg-transparent transition-colors duration-500" />
          </div>
        ))}
      </section>
    </div>
  );
};

export default Profile;
