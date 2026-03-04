import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Radio, AlertCircle } from '../components/icons';
import { ALERTS } from '../data/radar-alerts';
import { SEO } from '../components/ui/SEO';


export default function RadarView() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <SEO
        title="Радар активных подписок | ЧестнаяПодписка"
        description="Найдите все скрытые платные подписки, привязанные к вашей карте, и отмените их до следующего списания."
      />
      <div className="max-w-5xl mx-auto w-full">

        <div className="md:hidden flex items-center mb-8 mt-2 opacity-0 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white bg-white/10 rounded-full mr-4 active:scale-95 transition-transform">
            <ChevronLeft />
          </button>
          <h1 className="text-2xl font-bold text-white">Народный радар</h1>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">Демо</span>
        </div>

        <div className="hidden md:block mb-12 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white font-semibold text-sm flex items-center transition-colors mb-6 active:scale-95">
            <ChevronLeft className="w-5 h-5 mr-1" /> Вернуться
          </button>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight flex items-center gap-4">
            <Radio className="w-10 h-10 text-accent-purple" />
            Народный радар
          </h1>
          <p className="text-slate-400 text-lg">Тепловая карта обмана и успехов пользователей.</p>
          <div className="mt-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">Демо-данные — в будущем будет подключено к реальному API</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Radar Animation Graphic */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 real-glass-panel rounded-[3rem] relative overflow-hidden h-[400px] border border-accent-purple/20 opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="absolute inset-0 bg-accent-purple/5"></div>

            {/* Abstract Radar Circles */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <div className="absolute w-full h-full border border-accent-purple/20 rounded-full"></div>
              <div className="absolute w-3/4 h-3/4 border border-accent-purple/30 rounded-full"></div>
              <div className="absolute w-1/2 h-1/2 border border-accent-purple/40 rounded-full"></div>
              <div className="absolute w-1/4 h-1/4 bg-accent-purple/20 rounded-full animate-ping"></div>
              <Radio className="w-8 h-8 text-accent-purple relative z-10" />

              {/* Dots on radar */}
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
              <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-orange-400 rounded-full animate-pulse shadow-[0_0_10px_orange]" style={{ animationDelay: '0.5s' }}></div>
            </div>

            <div className="mt-8 text-center relative z-10">
              <p className="text-accent-purple font-mono uppercase tracking-widest text-sm mb-1">Live Feed</p>
              <p className="text-slate-300 font-medium text-sm">Сканирование инфополя...</p>
            </div>
          </div>

          {/* Alerts Feed */}
          <div className="lg:col-span-2 space-y-4">
            {ALERTS.map((alert, idx) => {

              // Determine styling based on severity
              let colorClasses = "border-white/10 bg-white/5";
              let iconColor = "text-slate-400";
              let titleColor = "text-white";

              if (alert.severity === 'critical') {
                colorClasses = "border-red-500/30 bg-red-500/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]";
                iconColor = "text-red-400";
                titleColor = "text-red-200";
              } else if (alert.severity === 'high') {
                colorClasses = "border-orange-500/30 bg-orange-500/5";
                iconColor = "text-orange-400";
                titleColor = "text-orange-200";
              } else if (alert.severity === 'success') {
                colorClasses = "border-emerald-500/30 bg-emerald-500/5";
                iconColor = "text-emerald-400";
                titleColor = "text-emerald-200";
              }

              return (
                <div
                  key={alert.id}
                  className={`real-glass-panel rounded-[2rem] p-6 border ${colorClasses} opacity-0 animate-slide-up hover:-translate-y-1 transition-transform cursor-default`}
                  style={{ animationDelay: `${200 + idx * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 ${iconColor}`} />
                      <span className={`font-bold text-sm tracking-wide ${titleColor}`}>{alert.location}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{alert.time}</span>
                  </div>

                  <div className="flex items-start gap-4">
                    {alert.severity === 'critical' && <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-400 animate-pulse" />}
                    <p className="text-slate-300 text-[15px] leading-relaxed">
                      {alert.text}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="mt-8 text-center p-6 border border-dashed border-white/20 rounded-[2rem] opacity-0 animate-slide-up" style={{ animationDelay: '700ms' }}>
              <p className="text-slate-400 text-sm">Хотите добавить свой случай на радар? Модуль сбора анонимных данных находится в разработке.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}