export const SPK = {
  configuration: {
    branding: {
      updateBranding: (config: any) => {
        try {
          localStorage.setItem("tileflow_branding_config", JSON.stringify(config));
        } catch (e) {
          console.warn("Failed to persist branding config", e);
        }
      }
    }
  }
};
