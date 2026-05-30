import { useSimulator } from '../hooks/useSimulator';
import { SimulatorResultPanel } from '../components/simulator/SimulatorResultPanel';
import { SimulatorHeader } from '../components/simulator/SimulatorHeader';
import { SimulatorInfoPanel } from '../components/simulator/SimulatorInfoPanel';
import { SimulatorMockup } from '../components/simulator/SimulatorMockup';
import { SEO } from '../components/ui/SEO';

export default function SimulatorView() {
    const {
        currentLevel,
        currentLevelIdx,
        currentStepIdx,
        feedback,
        showResult,
        progress,
        handleHit,
        handleMiss,
        reset,
        totalLevels,
    } = useSimulator();

    if (showResult) {
        return <SimulatorResultPanel reset={reset} />;
    }

    return (
        <div className="flex h-full flex-col px-4 pb-12 sm:px-6">
            <SEO
                title="Тренажер общения с поддержкой | ЧестнаяПодписка"
                description="Интерактивный тренажер: научитесь отвечать на скрипты поддержки и отстаивать свои права на возврат денег."
            />
            <div className="mx-auto w-full max-w-5xl">
                <SimulatorHeader currentLevelIdx={currentLevelIdx} totalLevels={totalLevels} progress={progress} />

                <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
                    <SimulatorInfoPanel
                        currentLevel={currentLevel}
                        currentStepIdx={currentStepIdx}
                        feedback={feedback}
                    />

                    <SimulatorMockup
                        currentLevel={currentLevel}
                        currentStepIdx={currentStepIdx}
                        feedback={feedback}
                        handleHit={handleHit}
                        handleMiss={handleMiss}
                    />
                </div>
            </div>
        </div>
    );
}
