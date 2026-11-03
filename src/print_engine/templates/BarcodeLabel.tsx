import React from "react";

export const BarcodeLabel: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="w-[50mm] h-[25mm] bg-white text-black p-[2mm] mx-auto box-border flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-start">
        <span className="text-[8px] font-bold truncate max-w-[30mm]">{data.companyName || "MQube"}</span>
        <span className="text-[10px] font-bold">${data.items?.[0]?.rate?.toFixed(2) || "99.99"}</span>
      </div>
      <div className="text-[9px] truncate w-full">{data.items?.[0]?.name || "Product Name"}</div>
      <div className="flex flex-col items-center mt-1">
        <div className="w-full h-[8mm] bg-black"></div>
        <span className="text-[8px] font-mono mt-0.5">{data.items?.[0]?.barcode || "123456789012"}</span>
      </div>
    </div>
  );
};
