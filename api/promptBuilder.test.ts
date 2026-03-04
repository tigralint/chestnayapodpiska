import { describe, it, expect } from 'vitest';
import { buildSubscriptionPrompt, buildCoursePrompt, buildClaimPrompt } from './promptBuilder';

describe('promptBuilder', () => {
    describe('buildSubscriptionPrompt', () => {
        it('should include the service name', () => {
            const result = buildSubscriptionPrompt('Яндекс Плюс', '299', '2024-01-15', 'Забыл отменить', 'soft');
            expect(result).toContain('Яндекс Плюс');
        });

        it('should include financial details', () => {
            const result = buildSubscriptionPrompt('Netflix', '799', '2024-02-10', 'Не пользовался', 'hard');
            expect(result).toContain('799');
            expect(result).toContain('2024-02-10');
        });

        it('should set soft tone correctly', () => {
            const result = buildSubscriptionPrompt('ivi', '399', '2024-01-01', 'Тест', 'soft');
            expect(result).toContain('Вежливый');
            expect(result).not.toContain('суд');
        });

        it('should set hard tone correctly', () => {
            const result = buildSubscriptionPrompt('ivi', '399', '2024-01-01', 'Тест', 'hard');
            expect(result).toContain('Ультимативный');
            expect(result).toContain('суд');
        });

        it('should reference ЗоЗПП', () => {
            const result = buildSubscriptionPrompt('Test', '100', '2024-01-01', 'Тест', 'soft');
            expect(result).toContain('ст. 32 ЗоЗПП');
        });
    });

    describe('buildCoursePrompt', () => {
        it('should include the course name', () => {
            const result = buildCoursePrompt('Skillbox', '50000', '30', '35000', 'soft');
            expect(result).toContain('Skillbox');
        });

        it('should include refund amount', () => {
            const result = buildCoursePrompt('Skillbox', '50000', '30', '35000', 'hard');
            expect(result).toContain('35000');
        });

        it('should set hard tone for courses', () => {
            const result = buildCoursePrompt('GeekBrains', '80000', '20', '64000', 'hard');
            expect(result).toContain('Жесткий');
        });

        it('should set constructive tone for courses', () => {
            const result = buildCoursePrompt('GeekBrains', '80000', '20', '64000', 'soft');
            expect(result).toContain('Конструктивный');
        });
    });

    describe('buildClaimPrompt', () => {
        it('should produce structured prompt with all paragraphs', () => {
            const result = buildClaimPrompt({
                entityName: 'TestService',
                entityLabel: 'сервис',
                financialDetails: '- СУММА: 100',
                tonePart: 'Тон: Мягкий.',
                verbForms: 'Используй формы: «тест».',
                specificParagraphs: ['Абзац 1', 'Абзац 2'],
            });

            expect(result).toContain('TestService');
            expect(result).toContain('- СУММА: 100');
            expect(result).toContain('Абзац 1');
            expect(result).toContain('Абзац 2');
            expect(result).toContain('ст. 32 ЗоЗПП');
        });
    });
});
