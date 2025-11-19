
export const useProductionStage = (stageName, productions) => {
  // Define stage flow
  const stageFlow = [
    "Pending Production",  // Store IN stage
    "Cutting",
    "Stitching", 
    "Trimming",
    "QC",
    "Ironing",
    "Packing",
    "Production Completed"
  ];

  // Get current stage index
  const currentStageIndex = stageFlow.indexOf(stageName);

  // ✅ FIXED: Filter data for current stage
  const getStageData = () => {
    if (stageName === "Pending Production") {
      // Store IN shows all pending productions
      return productions.filter(p => 
        p.status === "Pending Production" || !p.status
      );
    }
    
    // ✅ For other stages, show:
    // 1. Productions from PREVIOUS stage (ready to be processed)
    // 2. Productions ALREADY in current stage (being processed)
    const previousStage = stageFlow[currentStageIndex - 1];
    
    return productions.filter(p => 
      p.status === previousStage || p.status === stageName
    );
  };

  // Check if production can move to this stage
  const canAccessStage = (production) => {
    if (!production.status) return false;
    
    const productionStageIndex = stageFlow.indexOf(production.status);
    
    // Can access if production is at previous stage or current stage
    return productionStageIndex === currentStageIndex - 1 || 
           productionStageIndex === currentStageIndex;
  };

  // Get next stage name
  const getNextStage = () => {
    if (currentStageIndex < stageFlow.length - 1) {
      return stageFlow[currentStageIndex + 1];
    }
    return null;
  };

  // Get previous stage name
  const getPreviousStage = () => {
    if (currentStageIndex > 0) {
      return stageFlow[currentStageIndex - 1];
    }
    return null;
  };

  return {
    stageData: getStageData(),
    canAccessStage,
    getNextStage,
    getPreviousStage,
    currentStage: stageName,
    isFirstStage: currentStageIndex === 0,
    isLastStage: currentStageIndex === stageFlow.length - 1
  };
};
