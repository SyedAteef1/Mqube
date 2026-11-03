import React from "react";
import { useDrillDown } from "./drilldown_store.tsx";

export const DrillDownBreadcrumbs: React.FC = () => {
  const { breadcrumbs, jumpToContext, clearBreadcrumbs } = useDrillDown();

  if (breadcrumbs.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-theme-surface-2 border-b border-theme-divider text-sm font-sans shrink-0 overflow-x-auto whitespace-nowrap">
      <button 
        onClick={clearBreadcrumbs}
        className="text-theme-muted hover:text-theme-primary transition-colors flex items-center"
      >
        <span className="material-symbols-outlined text-[16px]">home</span>
      </button>
      
      {breadcrumbs.map((bc, index) => (
        <React.Fragment key={`${bc.entityType}-${bc.entityId}-${index}`}>
          <span className="text-theme-muted material-symbols-outlined text-[14px]">chevron_right</span>
          <button 
            onClick={() => jumpToContext(index)}
            className={`transition-colors flex items-center space-x-1 ${
              index === breadcrumbs.length - 1 
                ? "text-blue-400 font-semibold cursor-default" 
                : "text-theme-body hover:text-blue-400"
            }`}
          >
            <span>{bc.title}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
