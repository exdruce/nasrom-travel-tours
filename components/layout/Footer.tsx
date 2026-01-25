import React from "react";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react";
import Logo from "../../assets/logo.svg";

const Footer: React.FC = () => {
  const { t } = useTranslation("common");

  return (
    <footer className="bg-navy text-white pt-24 pb-10 border-t-4 border-brand-orange">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex flex-col">
              <img
                src={Logo}
                alt="Nasrom Travel & Tours"
                className="h-40 w-auto object-contain self-start -my-10"
              />
            </div>
            <p className="text-gray-300 leading-relaxed max-w-sm border-l-2 border-brand-orange pl-4">
              {t("footer.aboutText")}
            </p>
            <div className="flex space-x-4 pt-4">
              <a
                href="#"
                className="bg-brand-teal p-2 rounded-full hover:bg-white hover:text-brand-teal transition-all shadow-lg hover:-translate-y-1"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="bg-brand-teal p-2 rounded-full hover:bg-white hover:text-brand-teal transition-all shadow-lg hover:-translate-y-1"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold border-b border-brand-orange pb-2 inline-block text-brand-teal">
              {t("footer.contactInfo")}
            </h4>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start space-x-3 group">
                <MapPin className="w-5 h-5 text-brand-orange mt-1 flex-shrink-0 group-hover:animate-bounce" />
                <span className="group-hover:text-white transition-colors">
                  Jalan Tok Bali - Kuala Besut, Semerak, 16700 Pasir Puteh,
                  Kelantan
                </span>
              </li>
              <li className="flex items-center space-x-3 group">
                <Phone className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <span className="group-hover:text-white transition-colors">
                  +60 13-939 1888
                </span>
              </li>
              <li className="flex items-center space-x-3 group">
                <Mail className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <span className="group-hover:text-white transition-colors">
                  info@jetitokbali.com
                </span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold border-b border-brand-orange pb-2 inline-block text-brand-teal">
              Waktu Operasi / Hours
            </h4>
            <div className="space-y-4 text-gray-300">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <span className="block text-brand-orange font-bold text-sm uppercase tracking-wider mb-1">
                  Boat Services
                </span>
                <span>8:00 AM - 3:00 PM (Daily)</span>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <span className="block text-brand-orange font-bold text-sm uppercase tracking-wider mb-1">
                  Jetty Facilities
                </span>
                <span>8:00 AM - 10:00 PM (Daily)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} NASROM Travel & Tours Sdn Bhd. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
