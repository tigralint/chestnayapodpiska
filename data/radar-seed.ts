import { RadarAlertResponse } from '../types';

/**
 * Fallback-данные для «Народного радара».
 * Используются только если API Redis недоступно или загружается впервые.
 */
export const ALERTS_SEED: RadarAlertResponse[] = [
    {
        id: "1",
        location: "Москва",
        time: "10 минут назад",
        text: "Массовые списания по 2990₽ за подписку на «Курс IT-Профессии». 15 пользователей уже формируют претензию.",
        severity: "high",
        category: "hidden_cancel",
        serviceName: "Курс IT-Профессии",
        reportCount: 15
    },
    {
        id: "2",
        location: "Санкт-Петербург",
        time: "45 минут назад",
        text: "Онлайн-школа X отказывается возвращать деньги за курс дизайна, ссылаясь на оферту.",
        severity: "medium",
        category: "refund_refused",
        serviceName: "SkillFactory",
        reportCount: 1
    },
    {
        id: "3",
        location: "Казань",
        time: "5 часов назад",
        text: "Появился новый фишинговый сервис, маскирующийся под оплату ЖКХ. Будьте внимательны с реквизитами!",
        severity: "critical",
        category: "phishing",
        serviceName: "Gosuslugi-Pay",
        reportCount: 8
    }
];
