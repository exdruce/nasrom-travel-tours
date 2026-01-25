import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/Button";

// Validation Schema
const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number is too short" }),
  destination: z.string().min(1, { message: "Please select a destination" }),
  passengers: z
    .number()
    .min(1, { message: "At least 1 passenger required" })
    .max(28),
  date: z.string().min(1, { message: "Date is required" }),
  message: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact: React.FC = () => {
  const { t } = useTranslation("common");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Construct WhatsApp Message
    const text = `*New Inquiry via Website*%0A%0AName: ${data.name}%0AEmail: ${data.email}%0APhone: ${data.phone}%0ADestination: ${data.destination}%0APassengers: ${data.passengers}%0ADate: ${data.date}%0ANote: ${data.message || "N/A"}`;
    const waLink = `https://wa.me/60123456789?text=${text}`;

    toast.success("Inquiry ready!", {
      description: "Redirecting you to WhatsApp to finalize details...",
    });

    setTimeout(() => {
      window.open(waLink, "_blank");
      setIsSubmitting(false);
    }, 1000);
  };

  // Modern Input Style Class
  const inputClass =
    "w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all duration-300 text-navy placeholder:text-gray-400 font-medium text-sm";
  const labelClass =
    "text-xs font-bold text-navy uppercase tracking-widest ml-1 mb-1.5 block";

  return (
    <div className="pt-24 min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-navy text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-teal rounded-full blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-orange rounded-full blur-[100px] opacity-10 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <span className="text-brand-orange font-bold uppercase tracking-[0.25em] text-xs mb-4 block animate-fade-in">
            Get in Touch
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight leading-tight">
            {t("contact.title")}
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            {t("contact.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100/50">
            <div className="flex items-center mb-10 border-b border-gray-100 pb-6">
              <div className="bg-brand-teal/10 p-3.5 rounded-full mr-5">
                <Mail className="w-6 h-6 text-brand-teal" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy font-serif tracking-tight">
                  {t("contact.form.title")}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Fill out the form below and we will get back to you shortly.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>{t("contact.form.name")}</label>
                  <input
                    {...register("name")}
                    className={inputClass}
                    placeholder="e.g. Ahmad Ali"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    {t("contact.form.phone")}
                  </label>
                  <input
                    {...register("phone")}
                    className={inputClass}
                    placeholder="+60 12 345 6789"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("contact.form.email")}</label>
                <input
                  {...register("email")}
                  type="email"
                  className={inputClass}
                  placeholder="name@jetitokbali.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className={labelClass}>Passengers</label>
                  <input
                    {...register("passengers", { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className={inputClass}
                  />
                  {errors.passengers && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                      {errors.passengers.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Preferred Date</label>
                  <input
                    {...register("date")}
                    type="date"
                    className={inputClass}
                  />
                  {errors.date && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                      {errors.date.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("contact.form.dest")}</label>
                <div className="relative">
                  <select
                    {...register("destination")}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled>
                      Select your destination
                    </option>
                    <option value="Perhentian">
                      Pulau Perhentian (Perhentian Island)
                    </option>
                    <option value="Redang">Pulau Redang (Redang Island)</option>
                    <option value="RiverCruise">Sungai Semerak Cruise</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                {errors.destination && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                    {errors.destination.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t("contact.form.msg")}</label>
                <textarea
                  {...register("message")}
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="Any special requests or questions?"
                />
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-navy hover:bg-navy-light shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-xl py-4"
                >
                  <span className="flex items-center gap-2">
                    {isSubmitting ? "Processing..." : t("contact.form.submit")}
                    {!isSubmitting && <Send className="w-4 h-4" />}
                  </span>
                </Button>
              </div>
            </form>
          </div>

          {/* Info Section */}
          <div className="space-y-6 lg:mt-8">
            <div className="bg-gradient-to-br from-brand-teal to-brand-dark rounded-2xl shadow-xl p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

              <h3 className="text-xl font-bold mb-4 font-serif relative z-10 flex items-center tracking-wide">
                <MessageCircle className="w-6 h-6 mr-3" />
                Quick Contact
              </h3>
              <p className="text-teal-50 mb-8 text-sm leading-relaxed relative z-10">
                Prefer to chat directly? Click below to open WhatsApp with our
                support team immediately. We typically reply within 15 minutes.
              </p>
              <a
                href="https://wa.me/60123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full bg-white text-brand-teal py-3.5 rounded-xl hover:bg-teal-50 transition-colors font-bold shadow-lg relative z-10 transform hover:-translate-y-0.5"
              >
                Chat on WhatsApp
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-navy mb-6 font-serif border-b border-gray-100 pb-4 tracking-tight">
                Office Info
              </h3>

              <div className="space-y-8">
                <div className="flex items-start group">
                  <div className="bg-gray-50 p-3.5 rounded-xl mr-5 group-hover:bg-brand-teal group-hover:text-white transition-colors duration-300">
                    <MapPin className="w-5 h-5 text-brand-teal group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-xs uppercase tracking-widest mb-1.5">
                      Address
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Jalan Tok Bali - Kuala Besut,
                      <br />
                      Semerak, 16700 Pasir Puteh,
                      <br />
                      Kelantan
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="bg-gray-50 p-3.5 rounded-xl mr-5 group-hover:bg-brand-teal group-hover:text-white transition-colors duration-300">
                    <Clock className="w-5 h-5 text-brand-teal group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-xs uppercase tracking-widest mb-1.5">
                      Operating Hours
                    </h4>
                    <p className="text-gray-600 text-sm">
                      <span className="font-semibold text-navy">
                        Boat Services:
                      </span>
                      <br />
                      8:00 AM - 3:00 PM
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      <span className="font-semibold text-navy">
                        Jetty Terminal:
                      </span>
                      <br />
                      8:00 AM - 10:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="bg-gray-50 p-3.5 rounded-xl mr-5 group-hover:bg-brand-teal group-hover:text-white transition-colors duration-300">
                    <Phone className="w-5 h-5 text-brand-teal group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-xs uppercase tracking-widest mb-1.5">
                      Phone Support
                    </h4>
                    <p className="text-brand-orange font-bold text-lg tracking-tight">
                      +60 12-345 6789
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Available 8am - 10pm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
