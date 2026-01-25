import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ms: {
    common: {
      nav: {
        home: "Utama",
        profile: "Profil",
        boatSchedule: "Jadual Bot",
        packages: "Pakej",
        gallery: "Galeri",
        contact: "Hubungi",
        bookNow: "Tempah Sekarang"
      },
      footer: {
        about: "Tentang Kami",
        aboutText: "NASROM Travel & Tours adalah penyedia perkhidmatan bot premium terulung dari Jeti Tok Bali ke destinasi pulau idaman anda.",
        contactInfo: "Hubungi Kami",
        quickLinks: "Pautan Pantas"
      },
      contact: {
        title: "Mulakan Perjalanan Anda",
        subtitle: "Pasukan kami sedia membantu merancang percutian pulau yang sempurna untuk anda.",
        form: {
          title: "Hantar Pertanyaan",
          name: "Nama Penuh",
          email: "Alamat E-mel",
          phone: "Nombor Telefon",
          dest: "Destinasi Pilihan",
          msg: "Mesej / Permintaan Khas",
          submit: "Hantar Pertanyaan",
          success: "Terima kasih! Kami akan menghubungi anda sebentar lagi."
        }
      },
      profile: {
        title: "Mengenai Nasrom",
        story: "Warisan Kami",
        vision: "Visi",
        mission: "Misi"
      },
      schedule: {
        title: "Jadual Perjalanan",
        subtitle: "Masa berlepas harian dan kadar tambang terkini",
        perhentian: "Pulau Perhentian",
        redang: "Pulau Redang",
        priceAdult: "Dewasa",
        priceChild: "Kanak-kanak"
      },
      packages: {
        title: "Pakej Eksklusif",
        subtitle: "Pilih pengembaraan anda yang seterusnya",
        dayTrip: "Balik Hari",
        snorkeling: "Snorkeling",
        fishing: "Memancing"
      }
    },
    home: {
      hero: {
        title: "Pelayaran Eksklusif ke Syurga Pulau",
        subtitle: "Gerbang Utama dari Tok Bali",
        description: "Alami perjalanan mewah dan selesa ke Pulau Perhentian dan Redang dengan armada bot kabin moden kami.",
        ctaPrimary: "Tempah Tiket",
        ctaSecondary: "Lihat Jadual"
      },
      services: {
        title: "Perkhidmatan Kami",
        subtitle: "Pengalaman Tanpa Batasan",
        perhentian: "Pulau Perhentian",
        redang: "Pulau Redang",
        river: "Pelayaran Sungai"
      }
    }
  },
  en: {
    common: {
      nav: {
        home: "Home",
        profile: "Profile",
        boatSchedule: "Schedule",
        packages: "Packages",
        gallery: "Gallery",
        contact: "Contact",
        bookNow: "Book Now"
      },
      footer: {
        about: "About Nasrom",
        aboutText: "NASROM Travel & Tours is the premier provider of luxury boat transfers from Tok Bali Jetty to Malaysia's most stunning islands.",
        contactInfo: "Get in Touch",
        quickLinks: "Navigate"
      },
      contact: {
        title: "Let's Plan Your Getaway",
        subtitle: "Our dedicated team is ready to craft your perfect island itinerary.",
        form: {
          title: "Send an Inquiry",
          name: "Full Name",
          email: "Email Address",
          phone: "Phone Number",
          dest: "Preferred Destination",
          msg: "Message / Special Requests",
          submit: "Submit Inquiry",
          success: "Thank you! We will be in touch shortly."
        }
      },
      profile: {
        title: "Our Legacy",
        story: "Our Story",
        vision: "Our Vision",
        mission: "Our Mission"
      },
      schedule: {
        title: "Ferry Schedule",
        subtitle: "Daily departure times and current fare rates",
        perhentian: "Perhentian Island",
        redang: "Redang Island",
        priceAdult: "Adult",
        priceChild: "Child"
      },
      packages: {
        title: "Curated Packages",
        subtitle: "Choose your next adventure",
        dayTrip: "Day Trip",
        snorkeling: "Snorkeling",
        fishing: "Fishing"
      }
    },
    home: {
      hero: {
        title: "Premium Island Voyages",
        subtitle: "Your Gateway from Tok Bali",
        description: "Experience the epitome of comfort on your journey to Perhentian & Redang Islands aboard our modern cabin cruisers.",
        ctaPrimary: "Book Your Voyage",
        ctaSecondary: "View Schedule"
      },
      services: {
        title: "Our Services",
        subtitle: "Curated Experiences",
        perhentian: "Perhentian Island",
        redang: "Redang Island",
        river: "River Cruise"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;