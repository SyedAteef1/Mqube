import React, { useState, useEffect } from "react";
import { 
  Image as ImageIcon, 
  Save, 
  Folder, 
  Globe, 
  Server, 
  Sparkles, 
  CheckCircle, 
  HelpCircle,
  Eye,
  RefreshCw,
  FileCode
} from "lucide-react";
import { 
  ImagePathConfig, 
  getImagePathConfig, 
  saveImagePathConfig, 
  resolveProductImageUrl 
} from "../../services/imagePathConfig.ts";

interface TileFlowImgPathStudiodioProps {
  onNotification?: (title: string, message: string, type?: "success" | "error") => void;
}

export const ImgPathStudio: React.FC<TileFlowImgPathStudiodioProps> = ({
  onNotification
}) => {
  const [config, setConfig] = useState<ImagePathConfig>(getImagePathConfig());
  const [testImageName, setTestImageName] = useState<string>("shoe-classic-01");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setPreviewUrl(resolveProductImageUrl(testImageName, config));
  }, [testImageName, config]);

  const handleSave = () => {
    saveImagePathConfig(config);
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
    onNotification?.("Image Configuration Saved", "Product image base paths updated successfully.", "success");
  };

  const handlePresetSelect = (type: "server" | "cdn" | "local") => {
    if (type === "server") {
      setConfig(prev => ({
        ...prev,
        basePathType: "server",
        basePathUrl: "/api/v1/products/images/",
        defaultExtension: ".jpg"
      }));
    } else if (type === "cdn") {
      setConfig(prev => ({
        ...prev,
        basePathType: "cdn",
        basePathUrl: "https://cdn.tileflow.in/catalog/products/",
        defaultExtension: ".webp"
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        basePathType: "local",
        basePathUrl: "/catalog/products/images/",
        defaultExtension: ".jpg"
      }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f9f9f9] dark:bg-[#1c1c1c] text-[#1c1c1c] dark:text-[#f1f1f1] font-sans select-none overflow-y-auto p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c7c7c7] dark:border-[#464646] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ImageIcon className="text-[#494949]" size={22} />
            <h1 className="text-base font-bold text-[#373737] dark:text-[#c5c5c5]">
              Product Image Path &amp; Catalog Resolver Configuration
            </h1>
          </div>
          <p className="text-xs text-[#5e5e5e] dark:text-[#c6c6c6] mt-0.5">
            Configure how MQube resolves and renders product images when only the image filename is entered in Item Master.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSavedSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-[#767676] animate-in fade-in">
              <CheckCircle size={14} /> Saved!
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-[#494949] hover:bg-[#373737] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Save size={15} />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Main Grid: Settings on Left, Live Preview Tester on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Path Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Presets */}
          <div className="bg-white dark:bg-[#303030] p-5 rounded-xl border border-[#c7c7c7] dark:border-[#464646] shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#373737] dark:text-[#c5c5c5]">
              1. Base Storage Source Preset
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handlePresetSelect("server")}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1.5 ${
                  config.basePathType === "server"
                    ? "border-[#494949] bg-[#ededed] dark:bg-[#2f2f2f] text-[#373737] dark:text-[#c5c5c5]"
                    : "border-[#c7c7c7] dark:border-[#464646] hover:bg-[#f4f4f4]"
                }`}
              >
                <Server size={18} />
                <span className="font-bold text-xs">MQube Server</span>
                <span className="text-[10px] opacity-75">Hosted Media Path</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect("cdn")}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1.5 ${
                  config.basePathType === "cdn"
                    ? "border-[#494949] bg-[#ededed] dark:bg-[#2f2f2f] text-[#373737] dark:text-[#c5c5c5]"
                    : "border-[#c7c7c7] dark:border-[#464646] hover:bg-[#f4f4f4]"
                }`}
              >
                <Globe size={18} />
                <span className="font-bold text-xs">Cloud CDN</span>
                <span className="text-[10px] opacity-75">HTTPS Web CDN</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect("local")}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1.5 ${
                  config.basePathType === "local"
                    ? "border-[#494949] bg-[#ededed] dark:bg-[#2f2f2f] text-[#373737] dark:text-[#c5c5c5]"
                    : "border-[#c7c7c7] dark:border-[#464646] hover:bg-[#f4f4f4]"
                }`}
              >
                <Folder size={18} />
                <span className="font-bold text-xs">Local / LAN Share</span>
                <span className="text-[10px] opacity-75">Network Drive Folder</span>
              </button>
            </div>
          </div>

          {/* Path & Extension Parameters */}
          <div className="bg-white dark:bg-[#303030] p-5 rounded-xl border border-[#c7c7c7] dark:border-[#464646] shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#373737] dark:text-[#c5c5c5]">
              2. Base Path &amp; Extension Rules
            </h2>

            <div>
              <label className="text-xs font-bold text-[#5e5e5e] dark:text-[#c6c6c6] block mb-1">
                Base Path / Directory URL*
              </label>
              <input
                type="text"
                value={config.basePathUrl}
                onChange={e => setConfig(prev => ({ ...prev, basePathUrl: e.target.value }))}
                placeholder="e.g. /api/v1/products/images/ or https://cdn.myshop.com/images/"
                className="w-full p-2.5 bg-[#f9f9f9] dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded-lg font-mono text-xs font-bold outline-none focus:border-[#494949]"
              />
              <p className="text-[10px] text-[#76777d] mt-1">
                The filename from the item master will be appended to this base path.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#5e5e5e] dark:text-[#c6c6c6] block mb-1">
                  Default File Extension
                </label>
                <select
                  value={config.defaultExtension}
                  onChange={e => setConfig(prev => ({ ...prev, defaultExtension: e.target.value }))}
                  className="w-full p-2.5 bg-[#f9f9f9] dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded-lg font-semibold text-xs outline-none"
                >
                  <option value=".jpg">.jpg (Standard JPEG)</option>
                  <option value=".png">.png (PNG with Transparency)</option>
                  <option value=".webp">.webp (Modern High Efficiency)</option>
                  <option value="">(None - Filename already includes extension)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5e5e5e] dark:text-[#c6c6c6] block mb-1">
                  Auto-Naming Convention
                </label>
                <select
                  value={config.namingConvention}
                  onChange={e => setConfig(prev => ({ ...prev, namingConvention: e.target.value as any }))}
                  className="w-full p-2.5 bg-[#f9f9f9] dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded-lg font-semibold text-xs outline-none"
                >
                  <option value="custom">Custom Image Name (As typed in row)</option>
                  <option value="stock_no">Match Stock No (e.g. SMRT-001.jpg)</option>
                  <option value="barcode">Match Barcode (e.g. 8901234567890.jpg)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Interactive Tester */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#303030] p-5 rounded-xl border border-[#c7c7c7] dark:border-[#464646] shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#373737] dark:text-[#c5c5c5] flex items-center gap-1.5">
              <Eye size={15} /> Live Path Resolution Tester
            </h2>

            <div>
              <label className="text-xs font-bold text-[#5e5e5e] dark:text-[#c6c6c6] block mb-1">
                Enter Test Image Name / Filename:
              </label>
              <input
                type="text"
                value={testImageName}
                onChange={e => setTestImageName(e.target.value)}
                placeholder="e.g. nike-air-01 or 89012345"
                className="w-full p-2 bg-[#f9f9f9] dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded-lg font-mono text-xs font-bold outline-none"
              />
            </div>

            {/* Resolved URL Display */}
            <div className="p-3 bg-[#ededed] dark:bg-[#2f2f2f] border border-[#d2d2d2] dark:border-[#464646] rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-[#373737] dark:text-[#c5c5c5] uppercase block">
                Resolved URL Path:
              </span>
              <p className="font-mono text-xs break-all font-semibold text-[#494949] dark:text-[#e2e2e2]">
                {previewUrl}
              </p>
            </div>

            {/* Image Preview Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#5e5e5e] dark:text-[#c6c6c6]">
                Preview Display:
              </span>
              <div className="w-full h-48 rounded-xl border-2 border-dashed border-[#c7c7c7] dark:border-[#464646] bg-[#f9f9f9] dark:bg-[#1c1c1c] flex flex-col items-center justify-center overflow-hidden p-2 relative group">
                <img
                  src={previewUrl}
                  alt="Product Preview"
                  className="max-h-full max-w-full object-contain rounded transition group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = config.fallbackPlaceholder;
                  }}
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-mono">
                  {testImageName}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default ImgPathStudio;
