import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Info, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Schedule: React.FC = () => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'Perhentian' | 'Redang'>('Perhentian');

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center pt-16">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-navy mb-6 tracking-tight">
          {t('schedule.title')}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto">
          {t('schedule.subtitle')}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Weather Alert */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-12 rounded-r-xl shadow-sm flex items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-yellow-800 text-lg mb-1">Monsoon Season Update</h4>
            <p className="text-yellow-800/80 text-sm leading-relaxed">
              Schedules are subject to change based on weather and sea conditions. Please confirm your departure time 24 hours prior via WhatsApp.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-16">
          <div className="bg-white p-1.5 rounded-full shadow-lg inline-flex">
            <button
              onClick={() => setActiveTab('Perhentian')}
              className={`px-10 py-3.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'Perhentian' 
                  ? 'bg-brand-teal text-white shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-brand-teal hover:bg-gray-50'
              }`}
            >
              {t('schedule.perhentian')}
            </button>
            <button
              onClick={() => setActiveTab('Redang')}
              className={`px-10 py-3.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'Redang' 
                  ? 'bg-brand-teal text-white shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-brand-teal hover:bg-gray-50'
              }`}
            >
              {t('schedule.redang')}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Schedule Table */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Timetable Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-navy p-8 flex items-center justify-between">
                <div className="flex items-center text-white">
                  <Clock className="w-7 h-7 mr-4 text-brand-orange" />
                  <h3 className="text-2xl font-bold font-serif tracking-wide">Departure Times</h3>
                </div>
                <span className="bg-white/10 px-4 py-1.5 rounded-full text-xs text-white uppercase font-bold tracking-widest border border-white/20">
                  Daily
                </span>
              </div>
              
              <div className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Route</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-teal-50/30 transition-colors group">
                      <td className="px-8 py-6 font-medium text-navy text-lg">
                        Tok Bali <span className="text-gray-300 mx-3 group-hover:text-brand-teal transition-colors">→</span> {activeTab === 'Perhentian' ? 'Perhentian' : 'Redang'}
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-brand-teal text-xl font-serif">
                        {activeTab === 'Perhentian' ? '8:00 AM' : '9:00 AM'}
                      </td>
                    </tr>
                    <tr className="hover:bg-teal-50/30 transition-colors group">
                      <td className="px-8 py-6 font-medium text-navy text-lg">
                        Tok Bali <span className="text-gray-300 mx-3 group-hover:text-brand-teal transition-colors">→</span> {activeTab === 'Perhentian' ? 'Perhentian' : 'Redang'}
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-brand-teal text-xl font-serif">
                        {activeTab === 'Perhentian' ? '2:00 PM' : '3:00 PM'}
                      </td>
                    </tr>
                    <tr className="bg-gray-50/50 hover:bg-teal-50/30 transition-colors group">
                      <td className="px-8 py-6 font-medium text-navy text-lg">
                        {activeTab === 'Perhentian' ? 'Perhentian' : 'Redang'} <span className="text-gray-300 mx-3 group-hover:text-brand-teal transition-colors">→</span> Tok Bali
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-brand-teal text-xl font-serif">
                        {activeTab === 'Perhentian' ? '10:00 AM' : '11:00 AM'}
                      </td>
                    </tr>
                    <tr className="bg-gray-50/50 hover:bg-teal-50/30 transition-colors group">
                      <td className="px-8 py-6 font-medium text-navy text-lg">
                        {activeTab === 'Perhentian' ? 'Perhentian' : 'Redang'} <span className="text-gray-300 mx-3 group-hover:text-brand-teal transition-colors">→</span> Tok Bali
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-brand-teal text-xl font-serif">
                        {activeTab === 'Perhentian' ? '4:00 PM' : '5:00 PM'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
              <h4 className="text-lg font-bold text-navy mb-6 flex items-center uppercase tracking-wider text-sm">
                <Info className="w-5 h-5 text-brand-teal mr-3" />
                Important Information
              </h4>
              <ul className="space-y-4 text-gray-600 text-base leading-relaxed">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-brand-orange rounded-full mt-2.5 mr-4 flex-shrink-0"></span>
                  Please arrive at the jetty 30 minutes before departure time.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-brand-orange rounded-full mt-2.5 mr-4 flex-shrink-0"></span>
                  Boarding closes 10 minutes prior to departure.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-brand-orange rounded-full mt-2.5 mr-4 flex-shrink-0"></span>
                  Luggage allowance is 20kg per person. Extra charges may apply for oversized items.
                </li>
              </ul>
            </div>
          </div>

          {/* Pricing Side Panel */}
          <div className="lg:col-span-1">
            <div className="bg-brand-teal rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-56 h-56 bg-brand-orange/20 rounded-full blur-3xl"></div>
              
              <h3 className="text-3xl font-serif font-bold mb-2 relative z-10">Ticket Fares</h3>
              <p className="text-teal-100 text-sm mb-10 relative z-10 font-medium tracking-wide">Return Trip (Two-way)</p>

              <div className="space-y-6 relative z-10">
                <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-widest font-bold text-teal-100 mb-2">Adult</p>
                  <div className="flex items-baseline">
                    <span className="text-lg font-medium">RM</span>
                    <span className="text-6xl font-bold ml-2 font-serif">{activeTab === 'Perhentian' ? '70' : '110'}</span>
                  </div>
                </div>

                <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-widest font-bold text-teal-100 mb-2">Child (3-11)</p>
                  <div className="flex items-baseline">
                    <span className="text-lg font-medium">RM</span>
                    <span className="text-6xl font-bold ml-2 font-serif">{activeTab === 'Perhentian' ? '35' : '60'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/20 relative z-10">
                <Link to="/contact">
                   <Button variant="primary" fullWidth className="bg-brand-orange text-white hover:bg-white hover:text-brand-orange border-none py-4 text-sm shadow-xl">
                    Book Tickets Now
                   </Button>
                </Link>
                <p className="text-center text-xs text-teal-100 mt-4 opacity-80">
                  *Prices subject to seasonal surcharge
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Schedule;