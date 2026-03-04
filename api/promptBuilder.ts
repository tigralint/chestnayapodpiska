/**
 * Centralized prompt builder for AI claim generation.
 * Eliminates duplication between subscription and course prompt templates.
 */

interface PromptParams {
    entityName: string;
    entityLabel: string;
    financialDetails: string;
    tonePart: string;
    verbForms: string;
    specificParagraphs: string[];
}

export function buildClaimPrompt(params: PromptParams): string {
    const paragraphList = params.specificParagraphs
        .map(p => `   - ${p}`)
        .join('\n');

    return `Составь развернутый текст заявления о возврате средств.
ДАННЫЕ:
<user_input>
${params.financialDetails}
</user_input>

ИНСТРУКЦИЯ (СТРОГО):
1. Обязательно назови ${params.entityLabel} "${params.entityName}" по имени в тексте.
2. Ссылка на ст. 32 ЗоЗПП и ст. 782 ГК РФ.
3. Срок возврата — 10 дней (ст. 31 ЗоЗПП).
4. ${params.tonePart}
5. ${params.verbForms}
6. Текст должен содержать 4-5 отдельных абзацев (БЕЗ заголовков «Вступление», «Факты» и т.д. — просто сплошные абзацы текста):
${paragraphList}
7. Каждый абзац — не менее 2-3 предложений. Общий объём — минимум 200 слов.
8. НЕ ВЫДУМЫВАЙ данные (ИНН, расчётные счета, БИК, номера договоров). Вместо них ставь плейсхолдеры: [ВАШИ РЕКВИЗИТЫ], [ФИО], [№ ДОГОВОРА].

ФОРМАТ: ТОЛЬКО основной текст заявления. Без шапок, заголовков и подписей. Чистый текст. Абзацы разделяй пустой строкой.`;
}

export function buildSubscriptionPrompt(
    serviceName: string,
    amount: string,
    date: string,
    reason: string,
    tone: 'soft' | 'hard'
): string {
    const tonePart = tone === 'hard'
        ? 'Тон: Ультимативный. Упомяни Роспотребнадзор и суд.'
        : 'Тон: Вежливый и лояльный. Напиши, что я ценю сервис, но прошу возврат.';

    return buildClaimPrompt({
        entityName: serviceName,
        entityLabel: 'сервис',
        financialDetails: `- СЕРВИС: ${serviceName}\n- СУММА: ${amount} руб.\n- ДАТА: ${date}\n- ПРИЧИНА: ${reason}`,
        tonePart,
        verbForms: 'Используй формы: «пользовался(-ась)», «подписался(-ась)», «отменил(а)».',
        specificParagraphs: [
            'Кто я, когда и на что подписался.',
            'Что произошло, почему хочу вернуть деньги, подробности ситуации.',
            'Ссылки на конкретные статьи закона и их суть.',
            'Чётко сформулировать, чего именно требую (возврат суммы, сроки).',
            'Предупреждение о последствиях или вежливое завершение.',
        ],
    });
}

export function buildCoursePrompt(
    courseName: string,
    totalCost: string,
    percentCompleted: string,
    refund: string,
    tone: 'soft' | 'hard'
): string {
    const tonePart = tone === 'hard' ? 'Тон: Жесткий.' : 'Тон: Конструктивный.';

    return buildClaimPrompt({
        entityName: courseName,
        entityLabel: 'школу',
        financialDetails: `- ШКОЛА: ${courseName}\n- ОБЩАЯ ЦЕНА: ${totalCost} руб.\n- ПРОЙДЕНО: ${percentCompleted}%\n- СУММА К ВОЗВРАТУ: ${refund} руб.`,
        tonePart,
        verbForms: 'Используй формы: «приобрел(а)», «изучил(а)», «решил(а)».',
        specificParagraphs: [
            'Когда и какой договор был заключён, стоимость обучения.',
            `Сколько пройдено, почему решил(а) расторгнуть, конкретные претензии к качеству или формату.`,
            `Ссылки на ст. 32 ЗоЗПП, расчёт суммы к возврату.`,
            `Точная сумма возврата ${refund} руб., срок 10 дней.`,
            'Предупреждение о последствиях или вежливое завершение.',
        ],
    });
}
