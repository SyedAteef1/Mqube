import React from "react";
import { MasterListScreen } from "./global/master/MasterListScreen.tsx";
import { documentSeriesConfig } from "./global/configs/documentSeries.con.tsx";
import { DocumentSeries } from "../services/numberingEngine.ts";

export const DocumentSeriesTab: React.FC = () => {
  return (
    <MasterListScreen<DocumentSeries>
      config={documentSeriesConfig}
    />
  );
};
