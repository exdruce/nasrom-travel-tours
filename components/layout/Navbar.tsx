import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

// Brand Logo Component
const BrandLogo = ({ scrolled }: { scrolled: boolean }) => (
  <div className="flex items-center group">
    <img
      src="/assets/logo.svg"
      alt="Nasrom Travel & Tours"
      className={cn(
        "h-24 sm:h-32 w-auto object-contain transition-all duration-300 drop-shadow-lg -my-3 sm:-my-5",
        scrolled ? "brightness-100" : "brightness-100",
      )}
    />
  </div>
);

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ms" : "en");
  };

  const navLinks = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.profile"), href: "/profile" },
    { name: t("nav.boatSchedule"), href: "/schedule" },
    { name: t("nav.packages"), href: "/packages" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  return (
    <nav
      className={cn(
        "fixed w-full z-50 transition-all duration-500",
        scrolled
          ? "bg-gradient-to-b from-brand-teal/90 via-brand-teal/60 to-transparent backdrop-blur-sm py-3"
          : "bg-gradient-to-b from-brand-teal/90 via-brand-teal/50 to-transparent py-5",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <BrandLogo scrolled={scrolled} />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-sm p-1.5 rounded-full border border-white/10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  location.pathname === link.href
                    ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                    : "text-white/90 hover:text-white hover:bg-white/10",
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
            >
              <Globe className="w-4 h-4 text-brand-orange group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold text-white">
                {i18n.language.toUpperCase()}
              </span>
            </button>
            <Link to="/contact">
              <Button
                size="sm"
                className="bg-brand-orange hover:bg-orange-500 text-white font-semibold border-none shadow-lg shadow-brand-orange/20 rounded-full px-6 transition-all hover:scale-105"
              >
                {t("nav.bookNow")}
              </Button>
            </Link>
          </div>

          {/* Mobile Actions & Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-white text-xs font-bold"
            >
              <Globe className="w-3 h-3 text-brand-orange" />
              {i18n.language.toUpperCase()}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:bg-white/10 p-2 rounded-full transition-colors focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "md:hidden absolute top-full left-0 w-full bg-brand-teal/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden transform origin-top",
          isOpen
            ? "max-h-screen opacity-100 scale-y-100"
            : "max-h-0 opacity-0 scale-y-95",
        )}
      >
        <div className="px-6 py-8 space-y-4 flex flex-col items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-lg font-medium w-full text-center py-3 rounded-xl transition-all",
                location.pathname === link.href
                  ? "bg-white/10 text-brand-orange"
                  : "text-white hover:bg-white/5 hover:text-brand-orange",
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-6 w-full">
            <Link
              to="/contact"
              className="block w-full"
              onClick={() => setIsOpen(false)}
            >
              <Button
                fullWidth
                className="bg-brand-orange text-white hover:bg-orange-500 border-none rounded-xl py-6 text-lg shadow-lg"
              >
                {t("nav.bookNow")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
