import { useSimulator } from '../hooks/useSimulator';
import { SimulatorResultPanel } from '../components/simulator/SimulatorResultPanel';
import { SimulatorHeader } from '../components/simulator/SimulatorHeader';
import { SimulatorInfoPanel } from '../components/simulator/SimulatorInfoPanel';
import { SimulatorMockup } from '../components/simulator/SimulatorMockup';

export default function SimulatorView() {
  const {
    currentLevel,
    currentLevelIdx,
    currentStepIdx,
    feedback,
    score,
    showResult,
    progress,
    handleHit,
    handleMiss,
    reset,
    totalLevels
  } = useSimulator();

  if (showResult) {
    return <SimulatorResultPanel score={score} totalLevels={totalLevels} reset={reset} />;
  }

  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <div className="max-w-5xl mx-auto w-full">
        <SimulatorHeader
          currentLevelIdx={currentLevelIdx}
          totalLevels={totalLevels}
          score={score}
          progress={progress}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start relative z-10">
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
