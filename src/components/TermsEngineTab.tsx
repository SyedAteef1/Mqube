import React from "react";
import { MasterListScreen } from "./global/master/MasterListScreen.tsx";
import { termsEngineConfig, Clause } from "./global/configs/termsEngine.config.tsx";

export const TermsEngineTab: React.FC = () => {
  return (
    <MasterListScreen<Clause>
      config={termsEngineConfig}
    />
  );
};
