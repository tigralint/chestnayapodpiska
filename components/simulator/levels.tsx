import React from 'react';

export interface Level {
    id: number;
    title: string | string[];
    description: string | string[];
    learningText: string;
    isCampaign?: boolean;
    maxSteps?: number;
    renderMockUI: (onHit: () => void, onMiss: () => void, currentStep?: number) => React.ReactNode;
}

export const LEVELS: Level[] = [
    {
        id: 1,
        title: "Иллюзия выбора",
        description: "Найдите способ отменить подписку на этом экране.",
        learningText: "Дарк-паттерн «Misdirection»: Компании делают кнопку «Остаться» огромной и яркой, а отмену прячут в невидимый текст внизу экрана.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl h-full flex flex-col font-sans">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10 pointer-events-none">
                    <div className="w-20 h-20 bg-yellow-400 rounded-full mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                        <span className="text-3xl">🎁</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Подождите!</h2>
                    <p className="text-slate-400 mb-8 text-sm">Если вы уйдете сейчас, вы потеряете скидку 50% на следующий месяц и все накопленные баллы.</p>
                </div>
                <div className="p-6 relative z-10 flex flex-col items-center w-full">
                    <button onClick={onMiss} className="w-full py-4 bg-yellow-400 text-black font-bold rounded-2xl text-lg mb-4 hover:bg-yellow-300 active:scale-95 transition-transform">
                        Остаться с выгодой
                    </button>
                    <button onClick={onMiss} className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl text-lg mb-4 hover:bg-white/20 active:scale-95 transition-transform">
                        Поставить на паузу
                    </button>
                    <button onClick={onHit} className="text-[#555555] text-[11px] uppercase tracking-widest font-semibold pb-2 px-4 hover:text-[#777] transition-colors">
                        Отменить подписку
                    </button>
                </div>
            </div>
        )
    },
    {
        id: 2,
        title: "Ловушка в настройках",
        description: "Вы хотите отключить автопродление. Куда нажать?",
        learningText: "Дарк-паттерн «Roach Motel»: Попасть в подписку легко (1 клик), а чтобы выйти, нужно продраться через дебри настроек и фейковых тумблеров.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-slate-50 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="bg-blue-600 p-6 pt-10 text-white text-center relative z-10 rounded-b-3xl shadow-md">
                    <h2 className="font-bold text-xl">Ваш аккаунт PRO</h2>
                    <p className="text-blue-200 text-sm mt-1">Активен до 12.10.2026</p>
                </div>
                <div className="flex-1 p-4 space-y-3 relative z-10 mt-2">
                    <div role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onMiss()} className="p-4 rounded-xl bg-white shadow-sm flex flex-col gap-2 transition-transform active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={onMiss}>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-800 font-medium">Автопродление</span>
                            <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">Гарантирует бесперебойный доступ. Отключение не отменяет подписку.</p>
                    </div>
                    <div role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onMiss()} className="p-4 rounded-xl bg-white shadow-sm flex justify-between items-center cursor-pointer transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={onMiss}>
                        <span className="text-slate-800 font-medium">Сменить тариф</span>
                        <span className="text-slate-400">&gt;</span>
                    </div>
                    <div className="mt-8 text-center pt-8">
                        <button onClick={onHit} className="text-slate-400 text-xs hover:text-red-500 underline decoration-slate-300 transition-colors">
                            Деактивировать аккаунт PRO
                        </button>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 3,
        title: "Подмена понятий",
        description: "Откажитесь от премиум-предложения.",
        learningText: "Дарк-паттерн «Confirmshaming»: Кнопка отказа формулируется так, чтобы вызвать у пользователя чувство вины или глупости.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative p-6 justify-center">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="bg-white rounded-[2rem] p-8 text-center relative z-10 shadow-2xl">
                    <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">👑</div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Станьте VIP</h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Получите безлимитный доступ ко всем материалам, персонального куратора и 1000 бонусов!</p>

                    <button onClick={onMiss} className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-lg mb-4 shadow-lg shadow-pink-500/30 active:scale-95 transition-transform">
                        Да, я хочу стать лучше!
                    </button>

                    <button onClick={onHit} className="w-full py-3 text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors">
                        Нет, мне нравится учиться медленно и без помощи
                    </button>
                </div>
            </div>
        )
    },
    {
        id: 4,
        title: "Скрытая галочка",
        description: "Вы хотите купить только сам курс. Перейдите к оплате правильно.",
        learningText: "Дарк-паттерн «Sneak into Basket»: В корзину незаметно добавляется подписка или доп. услуга в виде заранее проставленной галочки.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="p-6 border-b border-slate-100 relative z-10">
                    <h2 className="font-bold text-xl text-slate-800">Оформление заказа</h2>
                </div>
                <div className="flex-1 p-6 relative z-10 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-600 font-medium">Курс «Основы IT»</span>
                        <span className="text-slate-800 font-bold">1 990 ₽</span>
                    </div>

                    <div className="mt-auto mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onHit(); } }} className="mt-0.5 cursor-pointer relative z-20 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" onClick={(e) => { e.stopPropagation(); onHit(); }}>
                            <div className="w-5 h-5 bg-blue-500 rounded border border-blue-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 leading-tight">
                            Я согласен добавить премиум-поддержку ментора и еженедельное автопродление за <span className="font-bold text-slate-700">999 ₽/мес</span>.
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-100">
                        <span className="text-slate-800 font-bold text-lg">Итого:</span>
                        <span className="text-blue-600 font-black text-2xl">2 989 ₽</span>
                    </div>
                    <button onClick={onMiss} className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl text-lg active:scale-95 transition-transform">
                        Оплатить картой
                    </button>
                </div>
            </div>
        )
    },
    {
        id: 5,
        title: "Ложный таймер",
        description: "Покиньте страницу, не поддаваясь панике.",
        learningText: "Дарк-паттерн «False Urgency»: Таймер обратного отсчета создает искусственную панику, заставляя принять невыгодное решение.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative justify-center border border-slate-800">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 p-8 text-center">
                    <div className="inline-flex px-4 py-1 bg-red-500/20 text-red-500 rounded-full text-sm font-bold tracking-widest uppercase mb-6 border border-red-500/50 animate-pulse-soft">
                        Срочное предложение
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">Скидка 90% сгорит через:</h2>

                    <div className="flex justify-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-3xl font-mono text-white font-bold shadow-inner">04</div>
                        <div className="text-3xl font-mono text-slate-500 self-center">:</div>
                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-3xl font-mono text-white font-bold shadow-inner">59</div>
                    </div>

                    <button onClick={onMiss} className="w-full py-5 bg-red-600 text-white font-bold rounded-2xl text-xl mb-6 shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-transform">
                        Забрать за 1₽*
                    </button>

                    <button onClick={onHit} className="text-slate-600 text-xs uppercase tracking-wider hover:text-slate-400 transition-colors">
                        Закрыть и потерять шанс навсегда
                    </button>
                </div>
            </div>
        )
    },
    {
        id: 6,
        title: "Кнопка-призрак",
        description: "Пропустите ввод данных банковской карты.",
        learningText: "Дарк-паттерн «Invisible Cancel»: Кнопка отказа намеренно сливается с фоном (белый текст на белом фоне или светло-серый).",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative p-8">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 flex-1 flex flex-col">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">Привяжите карту</h2>
                    <p className="text-slate-500 text-sm mb-8">Это необходимо только для проверки возраста. Мы не спишем ни копейки (первые 3 дня).</p>

                    <div className="space-y-4 mb-auto pointer-events-none">
                        <div className="h-12 bg-slate-100 rounded-lg border border-slate-200"></div>
                        <div className="flex gap-4">
                            <div className="h-12 w-1/2 bg-slate-100 rounded-lg border border-slate-200"></div>
                            <div className="h-12 w-1/2 bg-slate-100 rounded-lg border border-slate-200"></div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button onClick={onMiss} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-lg shadow-lg active:scale-95 transition-transform">
                            Привязать и начать
                        </button>
                        <button onClick={onHit} className="w-full py-4 bg-transparent text-[#e2e8f0] font-bold rounded-xl text-sm transition-colors hover:text-slate-400">
                            пропустить этот шаг
                        </button>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 7,
        title: "Запутанные формулировки",
        description: "Подтвердите, что вы хотите отменить подписку.",
        learningText: "Дарк-паттерн «Trick Questions»: Использование двойных отрицаний, чтобы запутать пользователя («Я не хочу не отказываться»).",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-slate-100 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative p-6 border border-slate-200">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-sm w-full border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Отмена услуг</h3>
                        <p className="text-sm text-slate-600 mb-6">Пожалуйста, внимательно прочитайте условия перед подтверждением действия.</p>

                        <button onClick={onMiss} className="w-full py-3 bg-red-500 text-white font-bold rounded-lg mb-3 hover:bg-red-600 active:scale-95 transition-transform">
                            Отменить отмену подписки
                        </button>
                        <button onClick={onHit} className="w-full py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 active:scale-95 transition-transform">
                            Продолжить отмену
                        </button>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 8,
        title: "Подписка по умолчанию",
        description: "Оформите разовую покупку, без автопродления.",
        learningText: "Дарк-паттерн «Forced Continuity»: Сервис визуально прячет вариант разовой оплаты, делая подписку единственным очевидным выбором.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="bg-slate-900 p-6 pt-8 text-white relative z-10 text-center">
                    <h2 className="font-bold text-2xl">Выберите план</h2>
                </div>
                <div className="flex-1 p-6 relative z-10 bg-slate-50 flex flex-col justify-center">

                    <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMiss(); } }} className="bg-white p-6 rounded-2xl border-2 border-green-500 shadow-xl relative cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus:ring-4 focus:ring-green-500/30" onClick={onMiss}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Хит продаж</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Безлимит PRO</h3>
                        <div className="text-3xl font-black text-slate-900 mb-1">990₽ <span className="text-sm font-normal text-slate-500">/ мес</span></div>
                        <p className="text-xs text-slate-500 mb-4">Первые 7 дней бесплатно, далее автопродление.</p>
                        <div className="w-full py-3 bg-green-500 text-white text-center font-bold rounded-xl">Выбрать план</div>
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={onHit} className="text-slate-400 text-sm hover:text-slate-600 underline decoration-slate-300 decoration-dashed underline-offset-4 transition-colors">
                            Купить разовый доступ на 1 месяц за 1500₽
                        </button>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 9,
        title: "Ложный крестик",
        description: "Закройте рекламный баннер.",
        learningText: "Дарк-паттерн «Fake Close»: Огромный крестик в углу — это часть картинки-ссылки. Настоящая кнопка закрытия спрятана в тексте.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-black/80 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative p-4 justify-center items-center">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="w-full bg-gradient-to-b from-blue-500 to-blue-700 rounded-2xl relative z-10 overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.6)]">
                    {/* Fake X */}
                    <div role="button" aria-label="Закрыть" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMiss(); } }} className="absolute top-2 right-2 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-black/40 transition-colors focus:outline-none focus:bg-black/60 focus:ring-2 focus:ring-white" onClick={onMiss}>
                        ✕
                    </div>

                    <div className="p-8 text-center text-white pointer-events-none">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-black mb-2 uppercase italic">Вам подарок!</h2>
                        <p className="text-sm text-blue-100 mb-6">Нажмите на баннер, чтобы забрать бесплатный доступ к закрытому клубу.</p>
                        <div className="w-full py-3 bg-yellow-400 text-black font-black uppercase rounded-xl shadow-lg">Забрать приз</div>
                    </div>
                </div>

                {/* Real close */}
                <div className="mt-6 relative z-10">
                    <button onClick={onHit} className="text-white/30 text-[10px] uppercase tracking-[0.2em] hover:text-white/80 transition-colors">
                        Закрыть окно
                    </button>
                </div>
            </div>
        )
    },
    {
        id: 10,
        title: "Лабиринт отмены",
        description: "Завершите процесс отмены подписки.",
        learningText: "Комбо-паттерн: Использование ярких цветов для отмены вашего действия и серых кнопок для подтверждения вашего выбора, чтобы сбить с толку.",
        renderMockUI: (onHit, onMiss) => (
            <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col font-sans relative border border-slate-200">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="flex-1 p-8 relative z-10 flex flex-col justify-center text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-6">
                        <span className="text-4xl">😢</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Нам очень жаль!</h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Вы уверены, что хотите уйти? Мы подготовили для вас персональное предложение.</p>

                    <div className="space-y-3 w-full">
                        <button onClick={onMiss} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl text-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
                            Получить 1 месяц бесплатно
                        </button>
                        <button onClick={onMiss} className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl text-lg shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
                            Написать в чат поддержки
                        </button>
                        <button onClick={onHit} className="w-full py-3 bg-slate-100 text-slate-400 font-medium rounded-xl text-sm mt-2 border border-slate-200 hover:bg-slate-200 active:scale-95 transition-transform">
                            Завершить отмену
                        </button>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 11,
        isCampaign: true,
        maxSteps: 3,
        title: [
            "Марафон отписки",
            "Психологическое давление",
            "Финальный лабиринт"
        ],
        description: [
            "Первый экран: Попробуйте найти кнопку отмены среди подарков.",
            "Второй экран: Вам пытаются навязать чувство вины. Не сдавайтесь.",
            "Третий экран: Финальное подтверждение. Найдите настоящую кнопку."
        ],
        learningText: "В реальных сервисах отмена часто занимает 5 и более экранов. Важно сохранять бдительность до самого конца и не вестись на подарки-ловушки.",
        renderMockUI: (onHit, onMiss, currentStep = 0) => {
            return (
                <div className="w-full h-full bg-[#0a0f1c] text-white flex flex-col font-sans overflow-hidden">
                    {/* Step 1: Retention */}
                    {currentStep === 0 && (
                        <div className="flex-1 p-6 flex flex-col items-center justify-center animate-fade-in">
                            <div className="w-20 h-20 bg-blue-600 rounded-3xl mb-6 flex items-center justify-center shadow-lg">
                                <span className="text-4xl">🎁</span>
                            </div>
                            <h2 className="text-xl font-bold mb-3 text-center leading-tight">Подождите!</h2>
                            <p className="text-slate-400 text-sm mb-8 text-center px-4">Мы дарим вам <span className="text-white font-bold">500 баллов</span> на счет, если вы останетесь с нами сегодня!</p>
                            <button onClick={onMiss} className="w-full py-4 bg-blue-600 rounded-2xl mb-4 font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-transform">Забрать подарок</button>
                            <button onClick={onHit} className="text-slate-500 text-xs underline hover:text-slate-300 transition-colors">Всё равно отменить</button>
                        </div>
                    )}

                    {/* Step 2: Confirmation with "Confirmshaming" */}
                    {currentStep === 1 && (
                        <div className="flex-1 p-6 flex flex-col items-center justify-center animate-slide-in-right">
                            <div className="w-20 h-20 bg-slate-800 rounded-full mb-6 flex items-center justify-center border border-white/10 shadow-inner">
                                <span className="text-4xl">😢</span>
                            </div>
                            <h2 className="text-xl font-bold mb-3 text-center">Вы точно уверены?</h2>
                            <p className="text-slate-400 text-sm mb-8 text-center px-4">Без подписки вам будут недоступны <span className="text-white font-bold">5000+ фильмов</span> и эксклюзивные премьеры.</p>

                            <div className="space-y-3 w-full">
                                <button onClick={onMiss} className="w-full py-4 bg-white text-black font-bold rounded-2xl active:scale-95 transition-transform">Передумать и вернуться</button>
                                <button onClick={onHit} className="w-full py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Я не хочу смотреть кино</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Final maze (Tricky colors) */}
                    {currentStep === 2 && (
                        <div className="flex-1 p-6 flex flex-col items-center justify-center animate-slide-in-right">
                            <h2 className="text-lg font-bold mb-10 text-center">Завершение</h2>

                            <div className="w-full space-y-4 px-2">
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[11px] text-slate-400 mb-4 tracking-tight leading-relaxed">Нажимая кнопку ниже, вы подтверждаете свой отказ от всех преимуществ и накопленного стажа в сервисе.</p>

                                    <div className="flex flex-col gap-3">
                                        <button onClick={onMiss} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                                            Восстановить доступ
                                        </button>
                                        <button onClick={onHit} className="w-full py-3 text-slate-500 text-[10px] font-semibold uppercase tracking-widest hover:text-slate-300">
                                            Завершить отключение
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    }
];
