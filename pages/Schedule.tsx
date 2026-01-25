import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Info, AlertTriangle, Ship, Anchor } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";

const Schedule: React.FC = () => {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<"Perhentian" | "JettyAccess">(
    "Perhentian",
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50 to-transparent -z-10" />
      <div className="absolute top-20 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-40 left-10 w-72 h-72 bg-brand-teal/5 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center pt-8 md:pt-16 relative z-10">
        <span className="text-brand-orange font-bold tracking-widest uppercase text-sm mb-3 block">
          Travel Itinerary
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-navy mb-6 tracking-tight">
          {t("schedule.title")}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
          {t("schedule.subtitle")}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Weather Alert - Modernized */}
        <div className="bg-white border-l-4 border-yellow-400 p-6 mb-12 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-full flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-grow">
            <h4 className="font-bold text-navy text-lg mb-1">
              Monsoon Season Update
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Schedules are subject to change based on weather and sea
              conditions. Please confirm your departure time 24 hours prior via
              WhatsApp.
            </p>
          </div>
        </div>

        {/* Tab Navigation - Modern Pills with Icons */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-2 rounded-full shadow-lg inline-flex gap-2">
            <button
              onClick={() => setActiveTab("Perhentian")}
              className={`flex items-center px-6 md:px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === "Perhentian"
                  ? "bg-navy text-white shadow-md transform scale-105"
                  : "text-gray-500 hover:text-navy hover:bg-gray-100"
              }`}
            >
              <Ship
                className={`w-4 h-4 mr-2 ${activeTab === "Perhentian" ? "text-brand-orange" : ""}`}
              />
              {t("schedule.perhentian")}
            </button>
            <button
              onClick={() => setActiveTab("JettyAccess")}
              className={`flex items-center px-6 md:px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === "JettyAccess"
                  ? "bg-navy text-white shadow-md transform scale-105"
                  : "text-gray-500 hover:text-navy hover:bg-gray-100"
              }`}
            >
              <Anchor
                className={`w-4 h-4 mr-2 ${activeTab === "JettyAccess" ? "text-brand-orange" : ""}`}
              />
              {t("schedule.jettyAccess")}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Schedule Table - Only show for Perhentian tab */}
          {activeTab === "Perhentian" && (
            <div className="lg:col-span-8 space-y-8">
              {/* Timetable Card */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
                <div className="bg-navy p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                  {/* Decorative bg in header */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                  <div className="flex items-center text-white relative z-10">
                    <div className="bg-white/10 p-3 rounded-xl mr-5 backdrop-blur-sm">
                      <Clock className="w-8 h-8 text-brand-orange" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold font-serif tracking-wide text-white">
                        Departure Times
                      </h3>
                      <p className="text-blue-200 text-sm mt-1">
                        Daily Speedboat Schedule
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center bg-brand-orange text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transform rotate-0 md:rotate-0">
                    Daily Service
                  </span>
                </div>

                <div className="p-0">
                  <div className="hidden md:block">
                    {" "}
                    {/* Desktop Table */}
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-10 py-6 text-left text-xs font-extrabold text-gray-400 uppercase tracking-widest font-sans">
                            Route Pattern
                          </th>
                          <th className="px-10 py-6 text-right text-xs font-extrabold text-gray-400 uppercase tracking-widest font-sans">
                            Scheduled Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[
                          {
                            from: "Tok Bali",
                            to: "Perhentian",
                            time: "8:00 AM",
                          },
                          {
                            from: "Tok Bali",
                            to: "Perhentian",
                            time: "2:00 PM",
                          },
                          {
                            from: "Perhentian",
                            to: "Tok Bali",
                            time: "10:00 AM",
                          },
                          {
                            from: "Perhentian",
                            to: "Tok Bali",
                            time: "4:00 PM",
                          },
                        ].map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-teal-50/40 transition-colors group cursor-default"
                          >
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <span className="font-bold text-navy text-lg">
                                  {item.from}
                                </span>
                                <div className="flex-1 border-t-2 border-dashed border-gray-200 relative mx-4 max-w-[100px]">
                                  <Ship className="w-4 h-4 text-brand-teal absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-1" />
                                </div>
                                <span className="font-bold text-navy text-lg">
                                  {item.to}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <span className="inline-block bg-brand-teal/10 text-brand-teal font-bold px-4 py-2 rounded-lg text-lg font-serif">
                                {item.time}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile List View */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {[
                      { from: "Tok Bali", to: "Perhentian", time: "8:00 AM" },
                      { from: "Tok Bali", to: "Perhentian", time: "2:00 PM" },
                      { from: "Perhentian", to: "Tok Bali", time: "10:00 AM" },
                      { from: "Perhentian", to: "Tok Bali", time: "4:00 PM" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="p-6 flex flex-col gap-4 hover:bg-teal-50/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                              Route
                            </span>
                            <div className="flex items-center gap-2 font-bold text-navy text-lg">
                              {item.from}{" "}
                              <span className="text-brand-orange">→</span>{" "}
                              {item.to}
                            </div>
                          </div>
                          <div className="bg-brand-teal/10 px-4 py-2 rounded-xl">
                            <span className="text-brand-teal font-bold font-serif text-xl">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100">
                <h4 className="text-xl font-bold text-navy mb-8 flex items-center">
                  <div className="bg-brand-teal/10 p-2 rounded-lg mr-4">
                    <Info className="w-5 h-5 text-brand-teal" />
                  </div>
                  Important Information
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    "Please arrive at the jetty 30 minutes before departure time.",
                    "Boarding closes 10 minutes prior to departure.",
                    "Luggage allowance is 20kg per person. Extra charges may apply for oversized items.",
                  ].map((info, idx) => (
                    <div
                      key={idx}
                      className="flex items-start bg-gray-50 p-4 rounded-xl"
                    >
                      <div className="w-2 h-2 bg-brand-orange rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        {info}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Side Panel */}
          <div
            className={
              activeTab === "Perhentian" ? "lg:col-span-4" : "lg:col-span-12"
            }
          >
            <div
              className={`rounded-3xl shadow-2xl p-8 md:p-10 text-white relative overflow-hidden h-full flex flex-col transition-all duration-500 ${activeTab === "Perhentian" ? "bg-gradient-to-br from-brand-teal to-brand-dark" : "bg-navy"}`}
            >
              <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-56 h-56 bg-brand-orange/20 rounded-full blur-3xl"></div>

              {activeTab === "Perhentian" ? (
                <>
                  <div className="relative z-10 mb-8">
                    <span className="text-teal-200 text-xs font-bold uppercase tracking-widest mb-2 block">
                      Pricing
                    </span>
                    <h3 className="text-3xl font-serif font-bold text-white leading-tight">
                      Ticket Fares
                    </h3>
                    <p className="text-teal-100/80 text-sm mt-2">
                      Return Trip (Two-way) inclusive of speedboat transfer
                    </p>
                  </div>

                  <div className="space-y-4 relative z-10 flex-grow">
                    {[
                      {
                        label: "Dewasa (Pergi & Balik)",
                        price: "80",
                        unit: "RM",
                      },
                      {
                        label: "Kanak-kanak (Pergi & Balik)",
                        price: "50",
                        unit: "RM",
                      },
                      { label: "Staff (Sehala)", price: "25", unit: "RM" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/20 transition-colors cursor-default group"
                      >
                        <p className="text-xs uppercase tracking-widest font-bold text-teal-200 mb-2 group-hover:text-white transition-colors">
                          {item.label}
                        </p>
                        <div className="flex items-baseline">
                          <span className="text-lg font-medium text-teal-100">
                            {item.unit}
                          </span>
                          <span className="text-5xl font-bold ml-2 font-serif text-white">
                            {item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
                    <Link to="/contact" className="block w-full">
                      <Button
                        variant="primary"
                        fullWidth
                        className="bg-brand-orange text-white hover:bg-white hover:text-brand-orange border-none py-4 text-base font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        Book Tickets Now
                      </Button>
                    </Link>
                    <p className="text-center text-xs text-teal-100/60 mt-4">
                      *Prices subject to seasonal surcharge
                    </p>
                  </div>
                </>
              ) : (
                <div className="relative z-10">
                  <div className="text-center mb-12">
                    <h3 className="text-4xl font-serif font-bold mb-4">
                      {t("schedule.jettyAccess")}
                    </h3>
                    <p className="text-blue-200 text-lg max-w-2xl mx-auto">
                      Essential information regarding jetty entry fees and
                      additional charges for parking and marine park
                      conservation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: "Warganegara", price: "10", sub: "" },
                      { label: "Bukan Warganegara", price: "20", sub: "" },
                      {
                        label: "Kanak-kanak",
                        price: "5",
                        sub: "12 Tahun Ke Bawah",
                      },
                      {
                        label: "Taman Laut",
                        price: "5",
                        sub: "Conservation Fee",
                      },
                      {
                        label: "Car Parking",
                        price: "15",
                        sub: "/DAY",
                        isUnitSuffix: true,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
                      >
                        <p className="text-xs uppercase tracking-widest font-bold text-blue-300 mb-3 h-8 flex items-end">
                          {item.label}
                        </p>
                        <div className="flex items-baseline mb-2">
                          <span className="text-xl font-medium text-blue-200">
                            RM
                          </span>
                          <span className="text-6xl font-bold ml-2 font-serif text-white">
                            {item.price}
                          </span>
                          {item.isUnitSuffix && (
                            <span className="text-lg font-bold ml-2 text-blue-200">
                              {item.sub}
                            </span>
                          )}
                        </div>
                        {!item.isUnitSuffix && item.sub && (
                          <p className="text-sm text-blue-200/70">{item.sub}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-16 text-center">
                    <Link to="/contact">
                      <Button
                        variant="primary"
                        className="bg-brand-orange text-white hover:bg-white hover:text-brand-orange border-none px-12 py-4 text-base font-bold shadow-xl hover:shadow-2xl rounded-full"
                      >
                        Contact Us for More Info
                      </Button>
                    </Link>
                    <p className="text-center text-xs text-blue-200/50 mt-6">
                      *Prices are subject to change without prior notice
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
