import { Link } from 'react-router-dom';

/**
 * Global site footer with legal links and copyright.
 * Placed at the bottom of the main content area (inside scroll),
 * with generous bottom padding to avoid overlap with MobileTabBar and LegalBot FAB.
 */
export function AppFooter() {
    return (
        <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-32 pt-8 md:pb-12">
            {/* Subtle separator */}
            <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
                {/* Copyright */}
                <p className="select-none text-center text-white/60 sm:text-left">
                    © {new Date().getFullYear()} Честная Подписка. Все права защищены.
                </p>

                {/* Legal links */}
                <nav aria-label="Юридические документы" className="flex items-center gap-4">
                    <Link to="/privacy" className="text-white/60 transition-colors duration-200 hover:text-white/80">
                        Конфиденциальность
                    </Link>
                    <span className="text-white/20" aria-hidden="true">
                        ·
                    </span>
                    <Link to="/terms" className="text-white/60 transition-colors duration-200 hover:text-white/80">
                        Соглашение
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
