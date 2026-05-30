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
        title: 'Иллюзия выбора',
        description: 'Найдите способ отменить подписку на этом экране.',
        learningText:
            'Дарк-паттерн «Misdirection»: Компании делают кнопку «Остаться» огромной и яркой, а отмену прячут в невидимый текст внизу экрана.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a] font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                        <span className="text-3xl">🎁</span>
                    </div>
                    <h2 className="mb-3 text-2xl font-bold text-white">Подождите!</h2>
                    <p className="mb-8 text-sm text-slate-400">
                        Если вы уйдете сейчас, вы потеряете скидку 50% на следующий месяц и все накопленные баллы.
                    </p>
                </div>
                <div className="relative z-10 flex w-full flex-col items-center p-6">
                    <button
                        onClick={onMiss}
                        className="mb-4 w-full rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-black transition-transform hover:bg-yellow-300 active:scale-95"
                    >
                        Остаться с выгодой
                    </button>
                    <button
                        onClick={onMiss}
                        className="mb-4 w-full rounded-2xl bg-white/10 py-4 text-lg font-bold text-white transition-transform hover:bg-white/20 active:scale-95"
                    >
                        Поставить на паузу
                    </button>
                    <button
                        onClick={onHit}
                        className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#555555] transition-colors hover:text-[#777]"
                    >
                        Отменить подписку
                    </button>
                </div>
            </div>
        ),
    },
    {
        id: 2,
        title: 'Ловушка в настройках',
        description: 'Вы хотите отключить автопродление. Куда нажать?',
        learningText:
            'Дарк-паттерн «Roach Motel»: Попасть в подписку легко (1 клик), а чтобы выйти, нужно продраться через дебри настроек и фейковых тумблеров.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl bg-slate-50 font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 rounded-b-3xl bg-blue-600 p-6 pt-10 text-center text-white shadow-md">
                    <h2 className="text-xl font-bold">Ваш аккаунт PRO</h2>
                    <p className="mt-1 text-sm text-blue-200">Активен до 12.10.2026</p>
                </div>
                <div className="relative z-10 mt-2 flex-1 space-y-3 p-4">
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onMiss()}
                        className="flex cursor-pointer flex-col gap-2 rounded-xl bg-white p-4 shadow-sm transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]"
                        onClick={onMiss}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">Автопродление</span>
                            <div className="relative h-6 w-12 rounded-full bg-blue-600">
                                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white"></div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">
                            Гарантирует бесперебойный доступ. Отключение не отменяет подписку.
                        </p>
                    </div>
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onMiss()}
                        className="flex cursor-pointer items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]"
                        onClick={onMiss}
                    >
                        <span className="font-medium text-slate-800">Сменить тариф</span>
                        <span className="text-slate-400">&gt;</span>
                    </div>
                    <div className="mt-8 pt-8 text-center">
                        <button
                            onClick={onHit}
                            className="text-xs text-slate-400 underline decoration-slate-300 transition-colors hover:text-red-500"
                        >
                            Деактивировать аккаунт PRO
                        </button>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 3,
        title: 'Подмена понятий',
        description: 'Откажитесь от премиум-предложения.',
        learningText:
            'Дарк-паттерн «Confirmshaming»: Кнопка отказа формулируется так, чтобы вызвать у пользователя чувство вины или глупости.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 p-6 font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 rounded-[2rem] bg-white p-8 text-center shadow-2xl">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-3xl text-pink-500">
                        👑
                    </div>
                    <h2 className="mb-2 text-2xl font-black text-slate-800">Станьте VIP</h2>
                    <p className="mb-8 text-sm leading-relaxed text-slate-500">
                        Получите безлимитный доступ ко всем материалам, персонального куратора и 1000 бонусов!
                    </p>

                    <button
                        onClick={onMiss}
                        className="mb-4 w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-lg font-bold text-white shadow-lg shadow-pink-500/30 transition-transform active:scale-95"
                    >
                        Да, я хочу стать лучше!
                    </button>

                    <button
                        onClick={onHit}
                        className="w-full py-3 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                    >
                        Нет, мне нравится учиться медленно и без помощи
                    </button>
                </div>
            </div>
        ),
    },
    {
        id: 4,
        title: 'Скрытая галочка',
        description: 'Вы хотите купить только сам курс. Перейдите к оплате правильно.',
        learningText:
            'Дарк-паттерн «Sneak into Basket»: В корзину незаметно добавляется подписка или доп. услуга в виде заранее проставленной галочки.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl bg-white font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 border-b border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-800">Оформление заказа</h2>
                </div>
                <div className="relative z-10 flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="font-medium text-slate-600">Курс «Основы IT»</span>
                        <span className="font-bold text-slate-800">1 990 ₽</span>
                    </div>

                    <div className="mb-6 mt-auto flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onHit();
                                }
                            }}
                            className="relative z-20 mt-0.5 cursor-pointer rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                onHit();
                            }}
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded border border-blue-500 bg-blue-500">
                                <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                    ></path>
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs leading-tight text-slate-500">
                            Я согласен добавить премиум-поддержку ментора и еженедельное автопродление за{' '}
                            <span className="font-bold text-slate-700">999 ₽/мес</span>.
                        </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-lg font-bold text-slate-800">Итого:</span>
                        <span className="text-2xl font-black text-blue-600">2 989 ₽</span>
                    </div>
                    <button
                        onClick={onMiss}
                        className="w-full rounded-xl bg-slate-800 py-4 text-lg font-bold text-white transition-transform active:scale-95"
                    >
                        Оплатить картой
                    </button>
                </div>
            </div>
        ),
    },
    {
        id: 5,
        title: 'Ложный таймер',
        description: 'Покиньте страницу, не поддаваясь панике.',
        learningText:
            'Дарк-паттерн «False Urgency»: Таймер обратного отсчета создает искусственную панику, заставляя принять невыгодное решение.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 p-8 text-center">
                    <div className="animate-pulse-soft mb-6 inline-flex rounded-full border border-red-500/50 bg-red-500/20 px-4 py-1 text-sm font-bold uppercase tracking-widest text-red-500">
                        Срочное предложение
                    </div>
                    <h2 className="mb-4 text-3xl font-black text-white">Скидка 90% сгорит через:</h2>

                    <div className="mb-8 flex justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800 font-mono text-3xl font-bold text-white shadow-inner">
                            04
                        </div>
                        <div className="self-center font-mono text-3xl text-slate-500">:</div>
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800 font-mono text-3xl font-bold text-white shadow-inner">
                            59
                        </div>
                    </div>

                    <button
                        onClick={onMiss}
                        className="mb-6 w-full rounded-2xl bg-red-600 py-5 text-xl font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform active:scale-95"
                    >
                        Забрать за 1₽*
                    </button>

                    <button
                        onClick={onHit}
                        className="text-xs uppercase tracking-wider text-slate-600 transition-colors hover:text-slate-400"
                    >
                        Закрыть и потерять шанс навсегда
                    </button>
                </div>
            </div>
        ),
    },
    {
        id: 6,
        title: 'Кнопка-призрак',
        description: 'Пропустите ввод данных банковской карты.',
        learningText:
            'Дарк-паттерн «Invisible Cancel»: Кнопка отказа намеренно сливается с фоном (белый текст на белом фоне или светло-серый).',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl bg-white p-8 font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 flex flex-1 flex-col">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            ></path>
                        </svg>
                    </div>
                    <h2 className="mb-3 text-2xl font-bold text-slate-800">Привяжите карту</h2>
                    <p className="mb-8 text-sm text-slate-500">
                        Это необходимо только для проверки возраста. Мы не спишем ни копейки (первые 3 дня).
                    </p>

                    <div className="pointer-events-none mb-auto space-y-4">
                        <div className="h-12 rounded-lg border border-slate-200 bg-slate-100"></div>
                        <div className="flex gap-4">
                            <div className="h-12 w-1/2 rounded-lg border border-slate-200 bg-slate-100"></div>
                            <div className="h-12 w-1/2 rounded-lg border border-slate-200 bg-slate-100"></div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button
                            onClick={onMiss}
                            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
                        >
                            Привязать и начать
                        </button>
                        <button
                            onClick={onHit}
                            className="w-full rounded-xl bg-transparent py-4 text-sm font-bold text-[#e2e8f0] transition-colors hover:text-slate-400"
                        >
                            пропустить этот шаг
                        </button>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 7,
        title: 'Запутанные формулировки',
        description: 'Подтвердите, что вы хотите отменить подписку.',
        learningText:
            'Дарк-паттерн «Trick Questions»: Использование двойных отрицаний, чтобы запутать пользователя («Я не хочу не отказываться»).',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-6 font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
                    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-2 text-lg font-bold text-slate-800">Отмена услуг</h3>
                        <p className="mb-6 text-sm text-slate-600">
                            Пожалуйста, внимательно прочитайте условия перед подтверждением действия.
                        </p>

                        <button
                            onClick={onMiss}
                            className="mb-3 w-full rounded-lg bg-red-500 py-3 font-bold text-white transition-transform hover:bg-red-600 active:scale-95"
                        >
                            Отменить отмену подписки
                        </button>
                        <button
                            onClick={onHit}
                            className="w-full rounded-lg bg-slate-200 py-3 font-bold text-slate-700 transition-transform hover:bg-slate-300 active:scale-95"
                        >
                            Продолжить отмену
                        </button>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 8,
        title: 'Подписка по умолчанию',
        description: 'Оформите разовую покупку, без автопродления.',
        learningText:
            'Дарк-паттерн «Forced Continuity»: Сервис визуально прячет вариант разовой оплаты, делая подписку единственным очевидным выбором.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl bg-white font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 bg-slate-900 p-6 pt-8 text-center text-white">
                    <h2 className="text-2xl font-bold">Выберите план</h2>
                </div>
                <div className="relative z-10 flex flex-1 flex-col justify-center bg-slate-50 p-6">
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onMiss();
                            }
                        }}
                        className="relative cursor-pointer rounded-2xl border-2 border-green-500 bg-white p-6 shadow-xl transition-transform focus:outline-none focus:ring-4 focus:ring-green-500/30 active:scale-[0.98]"
                        onClick={onMiss}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                            Хит продаж
                        </div>
                        <h3 className="mb-1 text-xl font-bold text-slate-800">Безлимит PRO</h3>
                        <div className="mb-1 text-3xl font-black text-slate-900">
                            990₽ <span className="text-sm font-normal text-slate-500">/ мес</span>
                        </div>
                        <p className="mb-4 text-xs text-slate-500">Первые 7 дней бесплатно, далее автопродление.</p>
                        <div className="w-full rounded-xl bg-green-500 py-3 text-center font-bold text-white">
                            Выбрать план
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={onHit}
                            className="text-sm text-slate-400 underline decoration-slate-300 decoration-dashed underline-offset-4 transition-colors hover:text-slate-600"
                        >
                            Купить разовый доступ на 1 месяц за 1500₽
                        </button>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 9,
        title: 'Ложный крестик',
        description: 'Закройте рекламный баннер.',
        learningText:
            'Дарк-паттерн «Fake Close»: Огромный крестик в углу – это часть картинки-ссылки. Настоящая кнопка закрытия спрятана в тексте.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col items-center justify-center overflow-hidden rounded-3xl bg-black/80 p-4 font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 shadow-[0_0_40px_rgba(59,130,246,0.6)]">
                    {/* Fake X */}
                    <div
                        role="button"
                        aria-label="Закрыть"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onMiss();
                            }
                        }}
                        className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/20 font-bold text-white transition-colors hover:bg-black/40 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={onMiss}
                    >
                        ✕
                    </div>

                    <div className="pointer-events-none p-8 text-center text-white">
                        <div className="mb-4 text-5xl">🎉</div>
                        <h2 className="mb-2 text-2xl font-black uppercase italic">Вам подарок!</h2>
                        <p className="mb-6 text-sm text-blue-100">
                            Нажмите на баннер, чтобы забрать бесплатный доступ к закрытому клубу.
                        </p>
                        <div className="w-full rounded-xl bg-yellow-400 py-3 font-black uppercase text-black shadow-lg">
                            Забрать приз
                        </div>
                    </div>
                </div>

                {/* Real close */}
                <div className="relative z-10 mt-6">
                    <button
                        onClick={onHit}
                        className="text-[10px] uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white/80"
                    >
                        Закрыть окно
                    </button>
                </div>
            </div>
        ),
    },
    {
        id: 10,
        title: 'Лабиринт отмены',
        description: 'Завершите процесс отмены подписки.',
        learningText:
            'Комбо-паттерн: Использование ярких цветов для отмены вашего действия и серых кнопок для подтверждения вашего выбора, чтобы сбить с толку.',
        renderMockUI: (onHit, onMiss) => (
            <div className="relative mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white font-sans shadow-2xl sm:max-w-sm">
                <div className="absolute inset-0 z-0" onClick={onMiss}></div>
                <div className="relative z-10 flex flex-1 flex-col justify-center p-8 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                        <span className="text-4xl">😢</span>
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-slate-800">Нам очень жаль!</h2>
                    <p className="mb-8 text-sm leading-relaxed text-slate-500">
                        Вы уверены, что хотите уйти? Мы подготовили для вас персональное предложение.
                    </p>

                    <div className="w-full space-y-3">
                        <button
                            onClick={onMiss}
                            className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
                        >
                            Получить 1 месяц бесплатно
                        </button>
                        <button
                            onClick={onMiss}
                            className="w-full rounded-xl bg-blue-500 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
                        >
                            Написать в чат поддержки
                        </button>
                        <button
                            onClick={onHit}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 py-3 text-sm font-medium text-slate-400 transition-transform hover:bg-slate-200 active:scale-95"
                        >
                            Завершить отмену
                        </button>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 11,
        isCampaign: true,
        maxSteps: 3,
        title: ['Марафон отписки', 'Психологическое давление', 'Финальный лабиринт'],
        description: [
            'Первый экран: Попробуйте найти кнопку отмены среди подарков.',
            'Второй экран: Вам пытаются навязать чувство вины. Не сдавайтесь.',
            'Третий экран: Финальное подтверждение. Найдите настоящую кнопку.',
        ],
        learningText:
            'В реальных сервисах отмена часто занимает 5 и более экранов. Важно сохранять бдительность до самого конца и не вестись на подарки-ловушки.',
        renderMockUI: (onHit, onMiss, currentStep = 0) => {
            return (
                <div className="flex h-full w-full flex-col overflow-hidden bg-[#0a0f1c] font-sans text-white">
                    {/* Step 1: Retention */}
                    {currentStep === 0 && (
                        <div className="flex flex-1 animate-fade-in flex-col items-center justify-center p-6">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 shadow-lg">
                                <span className="text-4xl">🎁</span>
                            </div>
                            <h2 className="mb-3 text-center text-xl font-bold leading-tight">Подождите!</h2>
                            <p className="mb-8 px-4 text-center text-sm text-slate-400">
                                Мы дарим вам <span className="font-bold text-white">500 баллов</span> на счет, если вы
                                останетесь с нами сегодня!
                            </p>
                            <button
                                onClick={onMiss}
                                className="mb-4 w-full rounded-2xl bg-blue-600 py-4 font-bold shadow-lg shadow-blue-600/30 transition-transform active:scale-95"
                            >
                                Забрать подарок
                            </button>
                            <button
                                onClick={onHit}
                                className="text-xs text-slate-500 underline transition-colors hover:text-slate-300"
                            >
                                Всё равно отменить
                            </button>
                        </div>
                    )}

                    {/* Step 2: Confirmation with "Confirmshaming" */}
                    {currentStep === 1 && (
                        <div className="flex flex-1 animate-slide-in-right flex-col items-center justify-center p-6">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-slate-800 shadow-inner">
                                <span className="text-4xl">😢</span>
                            </div>
                            <h2 className="mb-3 text-center text-xl font-bold">Вы точно уверены?</h2>
                            <p className="mb-8 px-4 text-center text-sm text-slate-400">
                                Без подписки вам будут недоступны{' '}
                                <span className="font-bold text-white">5000+ фильмов</span> и эксклюзивные премьеры.
                            </p>

                            <div className="w-full space-y-3">
                                <button
                                    onClick={onMiss}
                                    className="w-full rounded-2xl bg-white py-4 font-bold text-black transition-transform active:scale-95"
                                >
                                    Передумать и вернуться
                                </button>
                                <button
                                    onClick={onHit}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-white/10"
                                >
                                    Я не хочу смотреть кино
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Final maze (Tricky colors) */}
                    {currentStep === 2 && (
                        <div className="flex flex-1 animate-slide-in-right flex-col items-center justify-center p-6">
                            <h2 className="mb-10 text-center text-lg font-bold">Завершение</h2>

                            <div className="w-full space-y-4 px-2">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <p className="mb-4 text-[11px] leading-relaxed tracking-tight text-slate-400">
                                        Нажимая кнопку ниже, вы подтверждаете свой отказ от всех преимуществ и
                                        накопленного стажа в сервисе.
                                    </p>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={onMiss}
                                            className="w-full rounded-xl bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
                                        >
                                            Восстановить доступ
                                        </button>
                                        <button
                                            onClick={onHit}
                                            className="w-full py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300"
                                        >
                                            Завершить отключение
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        },
    },
];
