export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  owner: string;
  description: string;
  dependencies?: string[];
  relatedModules?: string[];
  apiEndpoints?: string[];
  databaseTables?: string[];
  permissions?: string[];
  lastUpdated?: string;
}

// Scope narrowed to module metadata only per ADR-002 (docs/architecture/decisions/ADR-002-TILEFLOW-MET.md), disposition (a).
class MetadataRegistryService {
  private modules: Map<string, Readonly<ModuleMetadata>> = new Map();
  private listeners: Set<() => void> = new Set();

  registerModule(metadata: ModuleMetadata) {
    const existing = this.modules.get(metadata.id);
    const payload = Object.freeze({ ...metadata });

    if (existing) {
      const existingJson = JSON.stringify(existing);
      const payloadJson = JSON.stringify(payload);
      if (existingJson !== payloadJson) {
        // Allow updating auto-registered workspace entries with richer module metadata
        if (existing.owner === "System Auto-Registered") {
          this.modules.set(payload.id, payload);
          this.emitChange();
          return;
        }
        throw new Error(`Module '${metadata.id}' is already registered with different metadata.`);
      }
      return;
    }

    this.modules.set(payload.id, payload);
    this.emitChange();
  }

  getModule(id: string): Readonly<ModuleMetadata> | undefined {
    return this.modules.get(id);
  }

  getModules(): ReadonlyArray<Readonly<ModuleMetadata>> {
    return Array.from(this.modules.values());
  }

  getAllMetadata() {
    return {
      modules: this.getModules(),
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  clear() {
    this.modules.clear();
    this.emitChange();
  }

  private emitChange() {
    this.listeners.forEach((listener) => listener());
  }
}

export const MetadataRegistry = new MetadataRegistryService();
