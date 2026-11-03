import React, { useState, useEffect, useMemo } from "react";
import {
  MenuAccessSubjectType,
  MenuItemPermission,
  MenuOperationType,
  SecurityUserEntry,
  SecurityGroupEntry,
  SecurityNodeEntry,
} from "./types.ts";
import {
  initialSecurityUsers,
  initialSecurityGroups,
  initialSecurityNodes,
  getPermissionsForSubject,
  savePermissionsForSubject,
  syncPermissionsWithBackend,
  persistPermissionsToBackend,
  getHousekeepingSecurityConfig,
} from "../../services/securityStore.ts";
import { apiFetchV1 } from "../../lib/apiFetchV1";
import {
  User,
  Users,
  Server,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  Shield,
  Layers,
  X,
} from "lucide-react";

interface TileFlowMenuAccessViewProps {
  onClose: () => void;
}

export const MenuAccessView: React.FC<TileFlowMenuAccessViewProps> = ({
  onClose,
}) => {
  const [subjectType, setSubjectType] = useState<MenuAccessSubjectType>("User");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("002");
  const [users, setUsers] = useState<SecurityUserEntry[]>(initialSecurityUsers);
  const [companyCode, setCompanyCode] = useState<string>("All");
  const [companyName, setCompanyName] = useState<string>("All Companies");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    sales: true,
    cash: false,
    stock: true,
    reports: false,
    housekeeping: false,
    catalogue: false,
    setup: false,
    help: false,
  });
  const [menuTree, setMenuTree] = useState<MenuItemPermission[]>(() =>
    getPermissionsForSubject("User", "002")
  );
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hkConfig = useMemo(() => getHousekeepingSecurityConfig(), []);

  useEffect(() => {
    let isMounted = true;
    apiFetchV1("/users/?limit=200").then((response: any) => {
      if (!isMounted || !Array.isArray(response?.users) || response.users.length === 0) return;
      const databaseUsers = response.users.map((user: any) => ({
        id: user.id || user.userId,
        name: user.fullName || user.displayName || user.username,
        groupId: user.role || "",
        companyCode: user.companyId || "All",
        companyName: user.companyId || "All Companies",
        isLocked: user.status === "Inactive",
      }));
      setUsers(databaseUsers);
      setSelectedSubjectId((currentId) =>
        databaseUsers.some((user: SecurityUserEntry) => user.id === currentId)
          ? currentId
          : databaseUsers[0].id
      );
    }).catch(() => {
      // Keep the local seed list available when the control-plane request is unavailable.
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Reload tree when subject type or subject ID changes (with backend synchronization)
  useEffect(() => {
    const loaded = getPermissionsForSubject(subjectType, selectedSubjectId);
    setMenuTree(loaded);

    let isMounted = true;
    syncPermissionsWithBackend(subjectType, selectedSubjectId, companyCode).then((synced) => {
      if (isMounted && synced) {
        setMenuTree(synced);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [subjectType, selectedSubjectId, companyCode]);

  // Find active subject metadata
  const activeSubjectMeta = useMemo(() => {
    if (subjectType === "User") {
      const u = users.find((x) => x.id === selectedSubjectId);
      return { id: u?.id || selectedSubjectId, name: u?.name || "Ram" };
    } else if (subjectType === "Group") {
      const g = initialSecurityGroups.find((x) => x.id === selectedSubjectId);
      return { id: g?.id || selectedSubjectId, name: g?.name || "Counters" };
    } else {
      const n = initialSecurityNodes.find((x) => x.id === selectedSubjectId);
      return { id: n?.id || selectedSubjectId, name: n?.name || "Billing Counter 1" };
    }
  }, [subjectType, selectedSubjectId, users]);

  const handleToggleExpand = (menuId: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    menuTree.forEach((m) => {
      next[m.menuId] = true;
    });
    setExpandedMenus(next);
  };

  const handleCollapseAll = () => {
    setExpandedMenus({});
  };

  // Toggle parent menu accessibility
  const handleToggleParent = (menuId: string) => {
    setMenuTree((prevTree) =>
      prevTree.map((item) => {
        if (item.menuId === menuId) {
          const nextVal = !item.isAccessible;
          const updatedChildren = item.children?.map((c) => ({
            ...c,
            isAccessible: nextVal,
          }));
          return {
            ...item,
            isAccessible: nextVal,
            children: updatedChildren,
          };
        }
        return item;
      })
    );
  };

  // Toggle child menu accessibility
  const handleToggleChild = (parentMenuId: string, childMenuId: string) => {
    setMenuTree((prevTree) =>
      prevTree.map((parent) => {
        if (parent.menuId === parentMenuId && parent.children) {
          const updatedChildren = parent.children.map((child) => {
            if (child.menuId === childMenuId) {
              return { ...child, isAccessible: !child.isAccessible };
            }
            return child;
          });
          const anyChildAccessible = updatedChildren.some((c) => c.isAccessible);
          return {
            ...parent,
            isAccessible: anyChildAccessible,
            children: updatedChildren,
          };
        }
        return parent;
      })
    );
  };

  // Toggle operation checkbox
  const handleToggleOperation = (
    parentMenuId: string,
    childMenuId: string,
    op: string
  ) => {
    setMenuTree((prevTree) =>
      prevTree.map((parent) => {
        if (parent.menuId === parentMenuId && parent.children) {
          const updatedChildren = parent.children.map((child) => {
            if (child.menuId === childMenuId) {
              const currentOps = child.allowedOperations || {};
              const nextOps = {
                ...currentOps,
                [op]: !currentOps[op],
              };
              return { ...child, allowedOperations: nextOps };
            }
            return child;
          });
          return { ...parent, children: updatedChildren };
        }
        return parent;
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await persistPermissionsToBackend(subjectType, selectedSubjectId, companyCode, menuTree);
      setSaveFeedback("Menu access policies updated and audited successfully!");
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch {
      setSaveFeedback("Failed to save menu permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const loaded = getPermissionsForSubject(subjectType, selectedSubjectId);
    setMenuTree(loaded);
    setSaveFeedback("Permissions reverted to saved state.");
    setTimeout(() => setSaveFeedback(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#fafafa] text-[#171717] text-xs font-sans select-none overflow-hidden">
      {/* 1. Scope & Target Selector Bar */}
      <div className="p-4 bg-white border-b border-[#e7e7e7] flex flex-col gap-3 shadow-2xs">
        {/* Subject Type Segmented Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-[#f4f4f4] p-1 rounded-lg border border-[#e7e7e7]">
            {(["User", "Group", "Node"] as MenuAccessSubjectType[]).map((type) => {
              const isActive = subjectType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSubjectType(type);
                    setSelectedSubjectId(type === "Node" ? "NODE-POS-01" : "002");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-[#414141] shadow-xs font-bold"
                      : "text-[#727272] hover:text-[#171717]"
                  }`}
                >
                  {type === "User" && <User className="w-3.5 h-3.5" />}
                  {type === "Group" && <Users className="w-3.5 h-3.5" />}
                  {type === "Node" && <Server className="w-3.5 h-3.5" />}
                  <span>{type} Level</span>
                </button>
              );
            })}
          </div>

          {/* Quick Target Summary Badge */}
          <div className="flex items-center gap-2 bg-[#f5f5f5] border border-[#d8d8d8] px-3 py-1 rounded-lg text-[11px] font-mono text-[#414141]">
            <Shield className="w-3.5 h-3.5 text-[#414141]" />
            <span>Target: <strong>{subjectType} {activeSubjectMeta.id} ({activeSubjectMeta.name})</strong></span>
          </div>
        </div>

        {/* Identity Inputs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <label className="w-24 text-[#535353] font-medium shrink-0">
              {subjectType} ID:
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                readOnly
                value={selectedSubjectId}
                className="w-24 px-3 py-1.5 bg-[#fafafa] border border-[#d4d4d4] rounded-lg text-xs font-mono font-bold text-[#171717]"
              />
              <button
                type="button"
                onClick={() => setShowBrowseModal(true)}
                className="px-3 py-1.5 bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#414141] border border-[#d8d8d8] rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                Browse
              </button>
              <input
                type="text"
                readOnly
                value={activeSubjectMeta.name}
                className="flex-1 px-3 py-1.5 bg-[#fafafa] border border-[#d4d4d4] rounded-lg text-xs font-semibold text-[#171717] truncate"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="w-24 text-[#535353] font-medium shrink-0">Company:</label>
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                readOnly
                value={companyCode}
                className="w-20 px-3 py-1.5 bg-[#fafafa] border border-[#d4d4d4] rounded-lg text-xs font-mono text-[#727272]"
              />
              <input
                type="text"
                readOnly
                value={companyName}
                className="flex-1 px-3 py-1.5 bg-[#fafafa] border border-[#d4d4d4] rounded-lg text-xs font-semibold text-[#171717] truncate"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Menu Permissions Matrix Grid */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-2 text-[11px] text-[#727272]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1 bg-white hover:bg-[#f4f4f4] border border-[#d4d4d4] rounded-md font-semibold text-xs text-[#3f3f3f] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3 h-3 text-[#414141]" /> Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1 bg-white hover:bg-[#f4f4f4] border border-[#d4d4d4] rounded-md font-semibold text-xs text-[#3f3f3f] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Minus className="w-3 h-3 text-[#414141]" /> Collapse All
            </button>
          </div>

          {saveFeedback && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1 border border-emerald-200 rounded-lg animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{saveFeedback}</span>
            </div>
          )}
        </div>

        {/* Tree Table */}
        <div className="flex-1 overflow-auto bg-white border border-[#e7e7e7] rounded-xl shadow-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e7e7e7] sticky top-0 z-10 text-[11px] font-mono text-[#535353]">
                <th className="w-10 p-2.5 text-center border-r border-[#e7e7e7]">Tree</th>
                <th className="p-2.5 border-r border-[#e7e7e7] font-bold min-w-[280px]">
                  Menu Description & Module
                </th>
                <th className="p-2.5 font-bold">Granular Operational Rights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f4]">
              {menuTree.map((rootMenu) => {
                const isExpanded = !!expandedMenus[rootMenu.menuId];
                return (
                  <React.Fragment key={rootMenu.menuId}>
                    {/* Root Level Row */}
                    <tr className="bg-[#fafafa]/60 hover:bg-[#f5f5f5] font-bold transition-colors">
                      <td className="p-2 text-center border-r border-[#e7e7e7]">
                        {rootMenu.children && rootMenu.children.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleExpand(rootMenu.menuId)}
                            className="w-5 h-5 bg-white border border-[#d4d4d4] hover:border-[#414141] rounded text-center flex items-center justify-center cursor-pointer transition-colors mx-auto"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#414141]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#727272]" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="p-2 border-r border-[#e7e7e7]">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rootMenu.isAccessible}
                            onChange={() => handleToggleParent(rootMenu.menuId)}
                            className="w-4 h-4 rounded text-[#414141] focus:ring-[#414141] cursor-pointer"
                          />
                          <span className="text-[#171717] font-semibold">{rootMenu.menuName}</span>
                        </label>
                      </td>
                      <td className="p-2 text-xs text-[#727272] font-mono">
                        {rootMenu.isAccessible ? (
                          <span className="text-emerald-700 font-bold">Module Root Enabled</span>
                        ) : (
                          <span className="text-rose-600 font-medium">Restricted at Module Level</span>
                        )}
                      </td>
                    </tr>

                    {/* Children Sub-Rows */}
                    {isExpanded &&
                      rootMenu.children?.map((child) => (
                        <tr
                          key={child.menuId}
                          className="hover:bg-[#fafafa] border-b border-[#f4f4f4] transition-colors"
                        >
                          <td className="p-2 text-center border-r border-[#e7e7e7]" />
                          <td className="p-2 pl-9 border-r border-[#e7e7e7]">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={child.isAccessible}
                                onChange={() =>
                                  handleToggleChild(rootMenu.menuId, child.menuId)
                                }
                                className="w-4 h-4 rounded text-[#414141] focus:ring-[#414141] cursor-pointer"
                              />
                              <span className={child.isAccessible ? "text-[#171717] font-semibold" : "text-[#a1a1a1]"}>
                                {child.menuName}
                              </span>
                            </label>
                          </td>
                          <td className="p-2">
                            {child.supportedOperations && (
                              <div className="flex items-center gap-4 flex-wrap">
                                {child.supportedOperations.map((op) => {
                                  const isAllowed = child.allowedOperations?.[op] ?? false;
                                  return (
                                    <label
                                      key={op}
                                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                        !child.isAccessible
                                          ? "opacity-40 border-transparent text-[#a1a1a1]"
                                          : isAllowed
                                          ? "bg-[#f5f5f5] border-[#d8d8d8] text-[#414141] font-bold"
                                          : "bg-white border-[#e7e7e7] text-[#727272] hover:border-[#d4d4d4]"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        disabled={!child.isAccessible}
                                        checked={child.isAccessible && isAllowed}
                                        onChange={() =>
                                          handleToggleOperation(
                                            rootMenu.menuId,
                                            child.menuId,
                                            op
                                          )
                                        }
                                        className="w-3.5 h-3.5 rounded text-[#414141] focus:ring-[#414141] cursor-pointer"
                                      />
                                      <span className="font-mono text-[10px] uppercase">
                                        {op}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Footer Action Bar */}
      <div className="p-3 bg-white border-t border-[#e7e7e7] flex items-center justify-between shrink-0">
        <div className="text-[11px] font-mono text-[#727272] flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#414141]" />
          <span>Active Policy: <strong>Two-Pass Permission Cascade</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-white hover:bg-[#f4f4f4] text-[#3f3f3f] border border-[#d4d4d4] rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-[#414141] hover:bg-[#4e4e4e] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-98"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving Policy..." : "Save Restrictions"}
          </button>
        </div>
      </div>

      {/* Browse Modal */}
      {showBrowseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white border border-[#e7e7e7] rounded-2xl shadow-2xl p-5 w-96 font-sans space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e7e7] font-bold text-sm text-[#171717]">
              <span>Select {subjectType} Target</span>
              <button
                type="button"
                onClick={() => setShowBrowseModal(false)}
                className="p-1 rounded-lg text-[#727272] hover:text-[#171717] hover:bg-[#f4f4f4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto divide-y divide-[#f4f4f4] border border-[#e7e7e7] rounded-xl">
              {subjectType === "User" &&
                users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedSubjectId(u.id);
                      setShowBrowseModal(false);
                    }}
                    className="px-4 py-2.5 hover:bg-[#f5f5f5] cursor-pointer flex justify-between items-center text-xs transition-colors"
                  >
                    <span className="font-mono text-[#414141] font-bold">{u.id}</span>
                    <span className="font-semibold text-[#171717]">{u.name}</span>
                  </div>
                ))}
              {subjectType === "Group" &&
                initialSecurityGroups.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedSubjectId(g.id);
                      setShowBrowseModal(false);
                    }}
                    className="px-4 py-2.5 hover:bg-[#f5f5f5] cursor-pointer flex justify-between items-center text-xs transition-colors"
                  >
                    <span className="font-mono text-[#414141] font-bold">{g.id}</span>
                    <span className="font-semibold text-[#171717]">{g.name}</span>
                  </div>
                ))}
              {subjectType === "Node" &&
                initialSecurityNodes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelectedSubjectId(n.id);
                      setShowBrowseModal(false);
                    }}
                    className="px-4 py-2.5 hover:bg-[#f5f5f5] cursor-pointer flex justify-between items-center text-xs transition-colors"
                  >
                    <span className="font-mono text-[#414141] font-bold">{n.id}</span>
                    <span className="font-semibold text-[#171717]">{n.name}</span>
                  </div>
                ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowBrowseModal(false)}
                className="px-4 py-2 bg-white hover:bg-[#f4f4f4] border border-[#d4d4d4] rounded-lg font-semibold text-xs text-[#3f3f3f] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
