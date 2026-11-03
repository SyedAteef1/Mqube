import React, { useEffect } from "react";
import { MetadataRegistry, ModuleMetadata } from "../services/metadataRegistry.ts";
import { useLayoutEngine } from "../layout_engine/layout_store.tsx";

/**
 * A hook that automatically syncs LayoutManager's registered workspaces
 * to the centralized MetadataRegistry.
 */
export const useLayoutModuleRegistration = () => {
  const { registeredWorkspaces } = useLayoutEngine();
  
  useEffect(() => {
    registeredWorkspaces.forEach((ws) => {
      // Create a normalized module definition from the layout workspace
      const moduleMeta: ModuleMetadata = {
        id: ws.id,
        name: ws.label,
        version: "v1.0",
        owner: "System Auto-Registered",
        description: `Module in category: ${ws.category}`,
        dependencies: ["Core System"],
      };
      
      try {
        MetadataRegistry.registerModule(moduleMeta);
      } catch {
        // Safe fallback if already registered with richer metadata
      }
    });
  }, [registeredWorkspaces]);
};

/**
 * A base component wrapper that explicitly registers a module's metadata,
 * useful for modules that need to supply more detailed metadata (like version, owner)
 * than what's available in the LayoutManager workspace registration.
 */
export interface TileFlowBaseModuleProps {
  children: React.ReactNode;
  metadata?: Partial<ModuleMetadata> & { id: string; name: string };
}

export const TileFlowBaseModule: React.FC<TileFlowBaseModuleProps> = ({ children, metadata }) => {
  useEffect(() => {
    if (metadata) {
      try {
        MetadataRegistry.registerModule({
          version: "v1.0",
          owner: "MQube Core",
          description: `${metadata.name} module`,
          dependencies: ["Core System"],
          ...metadata,
        });
      } catch {
        // Safe fallback if already registered
      }
    }
  }, [metadata]);
  
  return <>{children}</>;
};
