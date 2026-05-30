import { useState, useMemo, useCallback } from 'react';
import { ClaimHistoryItem } from '../../types';
import { CreditCard, GraduationCap, Copy, Download, Trash, ChevronDown } from '../icons';
import { copyToClipboard } from '../../utils/clipboard';
import { useToastContext } from '../../context/AppContext';
import { cn } from '../../utils/cn';

interface ClaimHistoryListProps {
    history: ClaimHistoryItem[];
    onUpdateStatus: (id: string, status: ClaimHistoryItem['status']) => void;
    onDelete: (id: string) => void;
}

type FilterStatus = 'all' | ClaimHistoryItem['status'];
type FilterType = 'all' | ClaimHistoryItem['type'];

export function ClaimHistoryList({ history, onUpdateStatus, onDelete }: ClaimHistoryListProps) {
    const { addToast } = useToastContext();
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [typeFilter, setTypeFilter] = useState<FilterType>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const handleCopy = useCallback(async (id: string, text: string) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopiedId(id);
            addToast('Текст претензии скопирован в буфер обмена', 'success');
            setTimeout(() => setCopiedId(null), 2000);
        } else {
            addToast('Не удалось скопировать текст', 'error');
        }
    }, [addToast]);

    const handleDownload = useCallback(async (item: ClaimHistoryItem) => {
        try {
            const { downloadWordDoc } = await import('../../utils/downloadWord');
            const safeName = item.serviceName.replace(/[^a-zа-я0-9]/gi, '_');
            
            if (item.type === 'subscription') {
                downloadWordDoc(
                    `Претензия_${safeName}`,
                    "В службу поддержки / Руководству",
                    item.serviceName,
                    "_________________________ (Email / Телефон: _________________)",
                    "ДОСУДЕБНАЯ ПРЕТЕНЗИЯ",
                    "",
                    item.resultText
                );
            } else {
                downloadWordDoc(
                    `Уведомление_о_расторжении_${safeName}`,
                    "Руководству образовательной платформы",
                    item.serviceName,
                    "_________________________ (Email / Паспорт: _________________)",
                    "ПРЕТЕНЗИЯ",
                    "об одностороннем расторжении договора и возврате денежных средств",
                    item.resultText
                );
            }
            addToast('Документ Word успешно скачан', 'success');
        } catch (err) {
            console.error(err);
            addToast('Ошибка при скачивании документа', 'error');
        }
    }, [addToast]);

    const handleDelete = useCallback((id: string, serviceName: string) => {
        onDelete(id);
        addToast(`Претензия к "${serviceName}" удалена из истории`, 'info');
    }, [onDelete, addToast]);

    // Filtering logic
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesType = typeFilter === 'all' || item.type === typeFilter;
            return matchesStatus && matchesType;
        });
    }, [history, statusFilter, typeFilter]);

    // Format currency helper
    const formatAmount = (val: number) => {
        return `${val.toLocaleString('ru-RU')} ₽`;
    };

    // Format date helper
    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return isoString;
        }
    };

    return (
        <section id="history" className="w-full mt-16 scroll-mt-24 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        Мои претензии
                        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white/10 text-slate-300">
                            {history.length}
                        </span>
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm md:text-base">
                        История сгенерированных документов и отслеживание статуса возврата средств.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                typeFilter === 'all' ? "bg-white/10 text-white shadow-md" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Все типы
                        </button>
                        <button
                            onClick={() => setTypeFilter('subscription')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                typeFilter === 'subscription' ? "bg-accent-cyan/25 text-accent-cyan shadow-md" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Подписки
                        </button>
                        <button
                            onClick={() => setTypeFilter('course')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                typeFilter === 'course' ? "bg-accent-purple/25 text-accent-purple shadow-md" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Курсы
                        </button>
                    </div>

                    <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                statusFilter === 'all' ? "bg-white/10 text-white shadow-md" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Все статусы
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                statusFilter === 'pending' ? "bg-amber-500/20 text-amber-400 shadow-md" : "text-slate-400 hover:text-white"
                            )}
                        >
                            В процессе
                        </button>
                        <button
                            onClick={() => setStatusFilter('refunded')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                statusFilter === 'refunded' ? "bg-emerald-500/20 text-emerald-400 shadow-md" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Возвращено
                        </button>
                        <button
                            onClick={() => setStatusFilter('refused')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                statusFilter === 'refused' ? "bg-rose-500/20 text-rose-400 shadow-md" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Отказано
                        </button>
                    </div>
                </div>
            </div>

            {filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredHistory.map((item) => (
                        <div
                            key={item.id}
                            className="real-glass border border-white/15 rounded-3xl p-6 flex flex-col justify-between shadow-lg relative group transition-all duration-300 hover:scale-[1.01] hover:border-white/20"
                        >
                            {/* Card Header */}
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center border",
                                            item.type === 'course' 
                                                ? "bg-accent-purple/10 border-accent-purple/20 text-accent-purple" 
                                                : "bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan"
                                        )}>
                                            {item.type === 'course' ? <GraduationCap className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white leading-tight">{item.serviceName}</h3>
                                            <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id, item.serviceName)}
                                        aria-label="Удалить претензию"
                                        className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-white/5 rounded-xl shrink-0"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Claim Info */}
                                <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-2xl p-4 mb-5 border border-white/5">
                                    <div>
                                        <span className="text-slate-500 text-xs block mb-1">Сумма к возврату</span>
                                        <span className="font-extrabold text-white text-base md:text-lg">{formatAmount(item.amount)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 text-xs block mb-1">Тон документа</span>
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-0.5",
                                            item.tone === 'hard' ? "bg-rose-500/10 text-rose-400" : "bg-cyan-500/10 text-cyan-400"
                                        )}>
                                            {item.tone === 'hard' ? 'Требовательный' : 'Вежливый'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Picker & Action Buttons */}
                            <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">Статус претензии:</span>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                                            className={cn(
                                                "text-xs font-bold rounded-xl px-3 py-1.5 border cursor-pointer outline-none transition-all bg-[#0d1220]/90 hover:bg-[#141b30]/90 flex items-center gap-1.5 select-none relative z-40",
                                                item.status === 'pending' && "border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
                                                item.status === 'refunded' && "border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
                                                item.status === 'refused' && "border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                                            )}
                                        >
                                            <span>
                                                {item.status === 'pending' && "⏳ В процессе"}
                                                {item.status === 'refunded' && "🎉 Деньги вернули"}
                                                {item.status === 'refused' && "❌ Отказано"}
                                            </span>
                                            <ChevronDown className={cn("w-3.5 h-3.5 opacity-70 transition-transform duration-200", openDropdownId === item.id && "rotate-180")} />
                                        </button>
                                        
                                        {openDropdownId === item.id && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-30 cursor-default" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(null);
                                                    }}
                                                />
                                                <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-white/10 real-glass-panel shadow-[0_10px_35px_rgba(0,0,0,0.6)] overflow-hidden z-40 flex flex-col p-1 animate-fade-in origin-top-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onUpdateStatus(item.id, 'pending');
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5",
                                                            item.status === 'pending' ? "bg-amber-500/10 text-amber-400 font-extrabold" : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        ⏳ В процессе
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onUpdateStatus(item.id, 'refunded');
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5",
                                                            item.status === 'refunded' ? "bg-emerald-500/10 text-emerald-400 font-extrabold" : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        🎉 Деньги вернули
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onUpdateStatus(item.id, 'refused');
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5",
                                                            item.status === 'refused' ? "bg-rose-500/10 text-rose-400 font-extrabold" : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        ❌ Отказано
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleCopy(item.id, item.resultText)}
                                        className="flex-1 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copiedId === item.id ? 'Скопировано!' : 'Копировать'}
                                    </button>
                                    <button
                                        onClick={() => handleDownload(item)}
                                        className="flex-1 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Download className="w-4 h-4" />
                                        Скачать Word
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="real-glass border border-white/10 rounded-3xl p-12 text-center">
                    <p className="text-slate-400 text-lg">Нет претензий с выбранными фильтрами</p>
                </div>
            )}
        </section>
    );
}
