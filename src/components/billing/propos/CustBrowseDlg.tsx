/**
 * Project      : MQube Retail OS
 * Author       : Syed Ateef
 * Designation  : Chief Systems Architect & Creator
 * Email        : ateef@tileflow.in
 * Version      : 6.7.0
 * Created      : 2026-08-21
 * Modified     : 2026-08-22
 * Copyright    : Â tileflow.in. Open Source - Permissive Use
 * License      : MIT Open Source License
 * Classification: Open Source
 */

import React, { useState, useMemo, useEffect } from "react";
import { ProPosCustomer } from "./types.ts";
import { getCustomers, initialCustomers, saveCustomers, persistCustomerChange } from "../../../services/customerStore.ts";
import { apiFetchV1 } from "../../../lib/apiFetchV1.ts";
import { X, Search, UserPlus, Check } from "lucide-react";

import { parseAndValidateGSTIN } from "../../../utils/gstEngine.ts";

interface TileFlowCustomerBrowseModalProps {
  onSelectCustomer: (cust: ProPosCustomer) => void;
  onClose: () => void;
}

const mapToProPosCustomers = (custs: any[]): ProPosCustomer[] => {
  return custs.map((c, idx) => {
    const rawGst = c.gstin || c.gstNumber || c.gst_number || "";
    const parsed = parseAndValidateGSTIN(rawGst);
    return {
      id: c.id || `CUST-${idx + 1}`,
      code: c.code || `C0${idx + 1}`,
      name: c.name || "Customer",
      phone: c.mobile || c.phone || "9876543210",
      email: c.email,
      loyaltyTier: c.loyaltyTier || "Gold",
      loyaltyPoints: c.loyaltyPoints ?? 1200,
      creditLimit: c.creditLimit ?? 50000,
      currentBalance: c.currentBalance ?? 0,
      gstin: rawGst || undefined,
      state: c.state || parsed.stateName || undefined,
      stateCode: c.stateCode || parsed.stateCode || undefined,
      registrationType: parsed.isValid ? "REGISTERED" : "UNREGISTERED",
    };
  });
};

export const TileFlowCustomerBrowseModal: React.FC<TileFlowCustomerBrowseModalProps> = ({
  onSelectCustomer,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customerList, setCustomerList] = useState<ProPosCustomer[]>(() => {
    try {
      const local = getCustomers();
      if (local && local.length > 0) {
        return mapToProPosCustomers(local);
      }
    } catch {
      // Keep the browse view empty until live data is available.
    }
    return [];
  });

  // Fetch live customers from server on modal mount
  useEffect(() => {
    let isMounted = true;
    apiFetchV1("/customers")
      .then((res: any) => {
        if (isMounted && Array.isArray(res) && res.length > 0) {
          setCustomerList(mapToProPosCustomers(res));
        }
      })
      .catch(() => {
        // Keep local cache
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // The first load returns at most 100 customers; ask the server as the user types so every customer can be found.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    let isMounted = true;
    const timer = setTimeout(() => {
      apiFetchV1(`/customers/search?q=${encodeURIComponent(q)}&limit=50`)
        .then((res: any) => {
          if (!isMounted || !Array.isArray(res) || res.length === 0) return;
          const found = mapToProPosCustomers(res);
          setCustomerList(prev => {
            const known = new Set(prev.map(c => c.id));
            const extra = found.filter(c => !known.has(c.id));
            return extra.length ? [...prev, ...extra] : prev;
          });
        })
        .catch(() => {
          // Keep showing what is already loaded
        });
    }, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const [selectedCustId, setSelectedCustId] = useState<string>(() => {
    return customerList[0]?.id || "";
  });

  // New Customer On-the-Fly Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [newCustCode, setNewCustCode] = useState<string>("C01");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customerList;
    const q = searchQuery.toLowerCase().trim();
    return customerList.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.id.toLowerCase().includes(q)
    );
  }, [customerList, searchQuery]);

  const activeSelected = useMemo(() => {
    return filteredCustomers.find(c => c.id === selectedCustId) || filteredCustomers[0] || customerList[0];
  }, [filteredCustomers, customerList, selectedCustId]);

  const handleAddNewCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const newId = `cust-${Date.now()}`;
    const newCode = newCustCode || `C0${customerList.length + 1}`;
    const created: ProPosCustomer = {
      id: newId,
      code: newCode,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      loyaltyTier: "Silver",
      loyaltyPoints: 0,
      creditLimit: 10000,
      currentBalance: 0
    };

    // Update local modal list
    setCustomerList(prev => [created, ...prev]);

    // Persist to customer store and server
    const currentFullList = getCustomers();
    const newCustomerRecord = {
      id: newId,
      code: newCode,
      name: newCustName.trim(),
      mobile: newCustPhone.trim(),
      customerGroupId: "CG-Retail",
      outstanding: 0,
      status: "Active" as const,
      createdDate: new Date().toISOString().split("T")[0],
      tags: ["Walk-In", "POS"]
    };
    saveCustomers([newCustomerRecord, ...currentFullList]);

    onSelectCustomer(created);
    onClose();
  };

  // Keyboard navigation & Enter selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeSelected) {
          onSelectCustomer(activeSelected);
          onClose();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = filteredCustomers.findIndex(c => c.id === selectedCustId);
        if (currentIndex < filteredCustomers.length - 1) {
          setSelectedCustId(filteredCustomers[currentIndex + 1].id);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = filteredCustomers.findIndex(c => c.id === selectedCustId);
        if (currentIndex > 0) {
          setSelectedCustId(filteredCustomers[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredCustomers, selectedCustId, activeSelected, onSelectCustomer, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#1c1c1c] text-[#1c1c1c] dark:text-[#f1f1f1] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#c6c6c6] dark:border-[#474747] max-h-[88vh]">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[#c6c6c6] dark:border-[#474747] bg-[#f9f9f9] dark:bg-[#1b1b1b] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#272727] text-white rounded-lg">
              <Search size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1b1b1b] dark:text-white">Customer Search &amp; Browse Window [F2]</h3>
                <span className="text-[10px] px-2 py-0.5 bg-[#e2e2e2] text-[#272727] rounded font-bold">
                  Browse Mode
                </span>
              </div>
              <p className="text-xs text-[#5e5e5e] dark:text-[#c6c6c6]">Search customer catalogue or insert new shopper profile on the fly.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-[#5e5e5e] hover:bg-[#f4f4f4] p-1.5 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Action Toolbar */}
        <div className="p-4 border-b border-[#eeeeee] dark:border-[#303030] bg-[#f9f9f9] dark:bg-[#1b1b1b] flex gap-3 items-center shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={15} />
            <input
              type="text"
              autoFocus
              name="browseCustomerSearch"
              aria-label="Search customer"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Customer Code, Name, or Mobile No..."
              className="w-full pl-9 pr-3 py-2 border border-[#c6c6c6] dark:border-[#474747] rounded-xl bg-white dark:bg-[#1c1c1c] text-xs outline-none focus:border-[#272727]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-[#e2e2e2] dark:bg-[#414141] text-[#272727] dark:text-white rounded-xl text-xs font-bold hover:brightness-105 transition flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <UserPlus size={14} />
            <span>{showAddForm ? "Hide Quick Form" : "+ New Customer"}</span>
          </button>
        </div>

        {/* Quick Add Form on the Fly */}
        {showAddForm && (
          <div className="p-4 bg-[#e2e2e2]/30 dark:bg-[#414141]/10 border-b border-[#272727]/20 grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#5e5e5e] mb-1">Customer Code</label>
              <input
                type="text"
                value={newCustCode}
                onChange={e => setNewCustCode(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#c6c6c6] rounded-lg text-xs font-mono font-bold bg-white dark:bg-[#1c1c1c]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#5e5e5e] mb-1">Customer Name</label>
              <input
                type="text"
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                placeholder="Full Name..."
                className="w-full px-2.5 py-1.5 border border-[#c6c6c6] rounded-lg text-xs bg-white dark:bg-[#1c1c1c]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#5e5e5e] mb-1">Mobile Number</label>
              <input
                type="text"
                value={newCustPhone}
                onChange={e => setNewCustPhone(e.target.value)}
                placeholder="10-digit mobile..."
                className="w-full px-2.5 py-1.5 border border-[#c6c6c6] rounded-lg text-xs font-mono bg-white dark:bg-[#1c1c1c]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddNewCustomer}
                className="w-full py-1.5 bg-[#272727] text-white text-xs font-bold rounded-lg hover:bg-[#414141] transition"
              >
                Save &amp; Select
              </button>
            </div>
          </div>
        )}

        {/* Customer List Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#f9f9f9] dark:bg-[#1b1b1b] sticky top-0 text-[10px] font-bold uppercase tracking-wider text-[#5e5e5e] dark:text-[#c6c6c6] border-b border-[#c6c6c6] dark:border-[#474747]">
              <tr>
                <th className="px-3 py-2 w-20">Code</th>
                <th className="px-3 py-2">Customer Name</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2 text-center">Loyalty Tier</th>
                <th className="px-3 py-2 text-right">Points</th>
                <th className="px-3 py-2 text-right">Credit Limit</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee] dark:divide-[#303030]">
              {filteredCustomers.map(c => {
                const isSelected = c.id === activeSelected?.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustId(c.id)}
                    onDoubleClick={() => {
                      onSelectCustomer(c);
                      onClose();
                    }}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? "bg-[#ffffcc] dark:bg-[#3a3a1a] text-black dark:text-yellow-200 font-bold"
                        : "hover:bg-[#f9f9f9] dark:hover:bg-[#303030]"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-[#272727] dark:text-[#bababa]">{c.code}</td>
                    <td className="px-3 py-2.5">{c.name}</td>
                    <td className="px-3 py-2.5 font-mono">{c.phone}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2 py-0.5 bg-[#e2e2e2] dark:bg-[#414141] text-[#272727] dark:text-white rounded text-[10px] font-bold">
                        {c.loyaltyTier || "Silver"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{c.loyaltyPoints?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono">₹{c.creditLimit?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCustomer(c);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[#272727] text-white rounded text-[10px] font-bold hover:bg-[#414141] transition"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#c6c6c6] dark:border-[#474747] bg-[#f9f9f9] dark:bg-[#1b1b1b] flex justify-between items-center shrink-0">
          <span className="text-xs text-[#5e5e5e] dark:text-[#c6c6c6]">
            Press <strong>[Enter]</strong> or <strong>double click</strong> to select customer.
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#c6c6c6] dark:border-[#474747] bg-white dark:bg-[#303030] rounded-xl text-xs font-bold hover:bg-[#eeeeee] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeSelected) {
                  onSelectCustomer(activeSelected);
                  onClose();
                }
              }}
              className="px-6 py-2 bg-[#272727] text-white rounded-xl text-xs font-bold hover:bg-[#414141] transition flex items-center gap-1.5 shadow-sm"
            >
              <Check size={14} />
              <span>Select Customer [Enter]</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TileFlowCustomerBrowseModal;

