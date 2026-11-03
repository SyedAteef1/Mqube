import React, { useState } from "react";
import { CommissionRule } from "./types.ts";
import { Award, Plus, Trash2, Save, User, Percent, ShieldCheck } from "lucide-react";

export const TileFlowCommissionBuildilder: React.FC = () => {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([
    {
      id: "comm-1",
      salesStaffCode: "SM1",
      staffName: "Staff Member 01",
      category: "Footwear",
      tierMin: 0,
      tierMax: 50000,
      commissionPct: 2.5,
      effectiveFrom: "2026-08-01",
      isActive: true
    },
    {
      id: "comm-2",
      salesStaffCode: "SM1",
      staffName: "Staff Member 01",
      category: "Footwear",
      tierMin: 50001,
      tierMax: 150000,
      commissionPct: 4.0,
      effectiveFrom: "2026-08-01",
      isActive: true
    },
    {
      id: "comm-3",
      salesStaffCode: "SM2",
      staffName: "Staff Member 02",
      category: "Apparel",
      tierMin: 0,
      tierMax: 100000,
      commissionPct: 3.0,
      effectiveFrom: "2026-08-01",
      isActive: true
    }
  ]);

  const handleAddRow = () => {
    setCommissionRules(prev => [
      ...prev,
      {
        id: `comm-${Date.now()}`,
        salesStaffCode: "SM1",
        staffName: "Staff Member 01",
        category: "All Categories",
        tierMin: 0,
        tierMax: 100000,
        commissionPct: 3.0,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        isActive: true
      }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setCommissionRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-[#f9f9f9] dark:bg-[#1c1c1c] text-[#1c1c1c] dark:text-[#f1f1f1] overflow-y-auto p-6 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#c6c6c6] dark:border-[#474747]">
          <div>
            <h1 className="text-xl font-bold text-[#272727] dark:text-[#bababa] flex items-center gap-2">
              <Award size={22} />
              Sales Staff Commission &amp; Incentive Rule Builder
            </h1>
            <p className="text-xs text-[#5e5e5e] dark:text-[#c6c6c6] mt-0.5">
              Define tiered volume commissions, brand kickers, and salesperson reward structures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 bg-[#272727] text-white rounded-xl text-xs font-bold hover:bg-[#414141] transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              Add Commission Slab
            </button>
          </div>
        </div>

        {/* Rule Table */}
        <div className="bg-white dark:bg-[#303030] rounded-2xl border border-[#c6c6c6] dark:border-[#474747] overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#f9f9f9] dark:bg-[#1b1b1b] text-[10px] font-bold uppercase tracking-wider text-[#5e5e5e] dark:text-[#c6c6c6] border-b border-[#c6c6c6] dark:border-[#474747]">
              <tr>
                <th className="px-4 py-3">Salesperson Code</th>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Category Filter</th>
                <th className="px-4 py-3 text-right">Min Sales (₹)</th>
                <th className="px-4 py-3 text-right">Max Sales (₹)</th>
                <th className="px-4 py-3 text-right text-[#272727] dark:text-[#bababa]">Commission %</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee] dark:divide-[#303030]">
              {commissionRules.map(r => (
                <tr key={r.id} className="hover:bg-[#f9f9f9] dark:hover:bg-[#1b1b1b] transition">
                  <td className="px-4 py-3 font-mono font-bold">{r.salesStaffCode}</td>
                  <td className="px-4 py-3 font-semibold">{r.staffName}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{r.tierMin.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{r.tierMax.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-sm text-[#272727] dark:text-[#bababa]">
                    {r.commissionPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(r.id)}
                      className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition"
                      title="Delete Slab"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default TileFlowCommissionBuildilder;
