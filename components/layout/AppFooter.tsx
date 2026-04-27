import { Link } from 'react-router-dom';

/**
 * Global site footer with legal links and copyright.
 * Placed at the bottom of the main content area (inside scroll),
 * with generous bottom padding to avoid overlap with MobileTabBar and LegalBot FAB.
 */
export function AppFooter() {
    return (
        <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-32 md:pb-12 pt-8">
            {/* Subtle separator */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                {/* Copyright */}
                <p className="text-white/60 text-center sm:text-left select-none">
                    © {new Date().getFullYear()} Честная Подписка. Все права защищены.
                </p>

                {/* Legal links */}
                <nav aria-label="Юридические документы" className="flex items-center gap-4">
                    <Link
                        to="/privacy"
                        className="text-white/60 hover:text-white/80 transition-colors duration-200"
                    >
                        Конфиденциальность
                    </Link>
                    <span className="text-white/20" aria-hidden="true">·</span>
                    <Link
                        to="/terms"
                        className="text-white/40 hover:text-white/80 transition-colors duration-200"
                    >
                        Соглашение
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
