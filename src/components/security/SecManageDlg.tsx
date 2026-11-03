import React, { useState, useEffect } from "react";
import { MenuAccessView } from "./MenuAccessView.tsx";
import { SecConfigView } from "./SecConfigView.tsx";
import { initialSecurityUsers, initialSecurityGroups, initialSecurityNodes } from "../../services/securityStore.ts";
import {
  ShieldCheck,
  Users,
  UserCheck,
  KeyRound,
  Layers,
  Lock,
  Unlock,
  Sliders,
  FileText,
  UserCircle2,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Shield,
} from "lucide-react";

export type SecuritySidebarTab =
  | "List Profiles"
  | "Manage Users"
  | "Manage Groups"
  | "Change Password"
  | "Manage Menu Access"
  | "Unlock Users"
  | "Configuration"
  | "Activity Log Report"
  | "My Profile"
  | "Manage Data Access";

interface TileFlowSecurityManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SecuritySidebarTab;
}

export const SecManageDlg: React.FC<TileFlowSecurityManagementModalProps> = ({
  isOpen,
  onClose,
  initialTab = "List Profiles",
}) => {
  const [activeTab, setActiveTab] = useState<SecuritySidebarTab>(initialTab);
  const [isMaximized, setIsMaximized] = useState(false);
  const [users, setUsers] = useState(initialSecurityUsers);
  const [userSearch, setUserSearch] = useState("");
  const [passwordTargetUser, setPasswordTargetUser] = useState("002");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUnlockUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isLocked: false } : u))
    );
    showToast(`Operator account ${userId} unlocked successfully.`);
  };

  const handleToggleLock = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const next = !u.isLocked;
          showToast(`User ${u.name} is now ${next ? "Locked" : "Active"}.`);
          return { ...u, isLocked: next };
        }
        return u;
      })
    );
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast("Passwords do not match or are empty.");
      return;
    }
    showToast(`Password successfully reset for Operator ${passwordTargetUser}.`);
    setNewPassword("");
    setConfirmPassword("");
  };

  const navItems: { id: SecuritySidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "List Profiles", label: "Security Overview", icon: ShieldCheck },
    { id: "Manage Menu Access", label: "Menu Access Control", icon: Layers },
    { id: "Manage Users", label: "Manage Operators", icon: Users },
    { id: "Manage Groups", label: "Security Groups", icon: UserCheck },
    { id: "Change Password", label: "Change Password", icon: KeyRound },
    { id: "Unlock Users", label: "Unlock Accounts", icon: Unlock },
    { id: "Configuration", label: "Security Policies", icon: Sliders },
    { id: "Activity Log Report", label: "Audit Log Stream", icon: FileText },
    { id: "My Profile", label: "Operator Profile", icon: UserCircle2 },
    { id: "Manage Data Access", label: "Data Boundary Rules", icon: Database },
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-3 backdrop-blur-xs font-sans">
      {/* Modern Light Studio Window Container */}
      <div
        className={`bg-white rounded-2xl border border-[#d4d4d4] shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
          isMaximized ? "w-full h-full rounded-none" : "w-[1100px] h-[720px] max-w-[98vw] max-h-[96vh]"
        }`}
      >
        {/* 1. Global Studio Header */}
        <div className="bg-white border-b border-[#e7e7e7] px-5 py-3.5 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#414141]/10 text-[#414141] rounded-xl flex items-center justify-center border border-[#414141]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#727272] leading-tight">
                <span>MQube Control Plane</span>
                <span>/</span>
                <span>Security & Governance</span>
                <span>/</span>
                <span className="text-[#414141] font-semibold">{activeTab}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-base font-bold font-display text-[#171717] tracking-tight">
                  Security & Access Control Studio
                </h2>
                <span className="px-2 py-0.5 bg-[#f5f5f5] text-[#414141] text-[10px] font-mono font-bold border border-[#d8d8d8] rounded">
                  auth.security.rbac
                </span>
              </div>
            </div>
          </div>

          {/* Window Action Controls */}
          <div className="flex items-center gap-2">
            {toastMsg && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{toastMsg}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              className="p-2 text-[#727272] hover:text-[#171717] hover:bg-[#f4f4f4] rounded-lg transition-colors cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Studio (Esc)"
              className="p-2 text-[#727272] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Main Studio Work Area */}
        <div className="flex-1 flex min-h-0 bg-[#fafafa] overflow-hidden">
          {/* Left Navigation Sidebar (220px) */}
          <aside className="w-56 bg-white border-r border-[#e7e7e7] flex flex-col justify-between select-none shrink-0 p-3">
            <div className="space-y-1 overflow-y-auto">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a1a1a1] px-2.5 py-1">
                Security Modules
              </div>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer truncate ${
                      isActive
                        ? "bg-[#f5f5f5] text-[#414141] font-bold border border-[#d8d8d8] shadow-xs"
                        : "text-[#535353] hover:bg-[#fafafa] hover:text-[#171717]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#414141]" : "text-[#727272]"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom System Status */}
            <div className="pt-3 border-t border-[#f4f4f4] space-y-2">
              <div className="px-2 py-1.5 bg-[#fafafa] rounded-lg border border-[#e7e7e7] text-[11px] font-mono text-[#727272]">
                <div className="text-[10px] text-[#a1a1a1]">Cluster Status:</div>
                <div className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Postgres RBAC Active
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 px-3 bg-[#f4f4f4] hover:bg-[#e7e7e7] text-[#3f3f3f] font-semibold text-xs rounded-lg transition-colors cursor-pointer text-center"
              >
                Close Studio
              </button>
            </div>
          </aside>

          {/* Right Content Work Area */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#fafafa]">
            {activeTab === "Manage Menu Access" && <MenuAccessView onClose={onClose} />}

            {activeTab === "Configuration" && <SecConfigView onClose={onClose} />}

            {activeTab === "List Profiles" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#e7e7e7] rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-[#727272] text-xs font-medium">
                      <span>Total Operators</span>
                      <Users className="w-4 h-4 text-[#414141]" />
                    </div>
                    <div className="mt-2 text-2xl font-bold font-display text-[#171717]">
                      {users.length}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                      {users.filter((u) => !u.isLocked).length} Active accounts
                    </div>
                  </div>

                  <div className="bg-white border border-[#e7e7e7] rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-[#727272] text-xs font-medium">
                      <span>Security Groups</span>
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold font-display text-[#171717]">
                      {initialSecurityGroups.length}
                    </div>
                    <div className="mt-1 text-[11px] text-[#727272]">
                      Role-based hierarchies
                    </div>
                  </div>

                  <div className="bg-white border border-[#e7e7e7] rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-[#727272] text-xs font-medium">
                      <span>POS Node Terminals</span>
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold font-display text-[#171717]">
                      {initialSecurityNodes.length}
                    </div>
                    <div className="mt-1 text-[11px] text-[#727272]">
                      Terminal-bound restrictions
                    </div>
                  </div>

                  <div className="bg-white border border-[#e7e7e7] rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-[#727272] text-xs font-medium">
                      <span>Account Lockouts</span>
                      <Lock className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="mt-2 text-2xl font-bold font-display text-rose-700">
                      {users.filter((u) => u.isLocked).length}
                    </div>
                    <div className="mt-1 text-[11px] text-rose-600 font-medium">
                      {users.filter((u) => u.isLocked).length === 0 ? "Zero locked accounts" : "Requires admin unlock"}
                    </div>
                  </div>
                </div>

                {/* Quick Action Cards */}
                <div className="bg-white border border-[#e7e7e7] rounded-xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] font-mono">
                    Security Governance Modules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      onClick={() => setActiveTab("Manage Menu Access")}
                      className="p-4 bg-[#fafafa] hover:bg-[#f5f5f5] border border-[#e7e7e7] hover:border-[#d8d8d8] rounded-xl cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl text-[#414141]">
                          account_tree
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#a1a1a1] group-hover:text-[#414141] transition-colors" />
                      </div>
                      <h4 className="font-bold text-xs text-[#171717]">Menu Access Control</h4>
                      <p className="text-[11px] text-[#727272] leading-relaxed">
                        Configure user, group, and node level menu rights and operations matrix.
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveTab("Manage Users")}
                      className="p-4 bg-[#fafafa] hover:bg-[#f5f5f5] border border-[#e7e7e7] hover:border-[#d8d8d8] rounded-xl cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl text-emerald-600">
                          group
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#a1a1a1] group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <h4 className="font-bold text-xs text-[#171717]">Operator Accounts</h4>
                      <p className="text-[11px] text-[#727272] leading-relaxed">
                        Manage cashier profiles, assign branch terminals, and unlock operator accounts.
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveTab("Configuration")}
                      className="p-4 bg-[#fafafa] hover:bg-[#f5f5f5] border border-[#e7e7e7] hover:border-[#d8d8d8] rounded-xl cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl text-purple-600">
                          tune
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#a1a1a1] group-hover:text-purple-600 transition-colors" />
                      </div>
                      <h4 className="font-bold text-xs text-[#171717]">Security Configuration</h4>
                      <p className="text-[11px] text-[#727272] leading-relaxed">
                        Password complexity requirements, session timeouts, and housekeeping retention.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Manage Users" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#171717] font-display">
                      Operator Accounts Registry
                    </h3>
                    <p className="text-xs text-[#727272]">
                      Maintain cashier accounts, security roles, and branch terminal associations.
                    </p>
                  </div>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-[#a1a1a1] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search operator..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-white border border-[#d4d4d4] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#171717] focus:outline-none focus:border-[#414141]"
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#e7e7e7] rounded-xl overflow-hidden shadow-xs text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#e7e7e7] font-mono text-[11px] text-[#535353]">
                        <th className="px-4 py-2.5">Operator ID</th>
                        <th className="px-4 py-2.5">Full Name</th>
                        <th className="px-4 py-2.5">Security Group</th>
                        <th className="px-4 py-2.5">Branch Code</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f4f4]">
                      {users
                        .filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.id.includes(userSearch))
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-[#fafafa] transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-[#414141]">{u.id}</td>
                            <td className="px-4 py-3 font-semibold text-[#171717] flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#f5f5f5] text-[#414141] font-bold text-[10px] flex items-center justify-center border border-[#d8d8d8]">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              {u.name}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#535353]">
                              {initialSecurityGroups.find((g) => g.id === u.groupId)?.name || u.groupId}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#727272]">{u.companyCode}</td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  u.isLocked
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {u.isLocked ? "LOCKED" : "ACTIVE"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleToggleLock(u.id)}
                                className="px-2.5 py-1 bg-white hover:bg-[#f4f4f4] border border-[#d4d4d4] rounded-md font-semibold text-[11px] text-[#3f3f3f] cursor-pointer"
                              >
                                {u.isLocked ? "Unlock" : "Lock"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "Manage Groups" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#171717] font-display">
                    Security Groups & Role Hierarchy
                  </h3>
                  <p className="text-xs text-[#727272]">
                    Define role scopes, supervisor overrides, and group-level permission assignments.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {initialSecurityGroups.map((g) => (
                    <div key={g.id} className="bg-white border border-[#e7e7e7] rounded-xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] text-[#414141] flex items-center justify-center font-bold font-mono text-xs border border-[#d8d8d8]">
                            {g.id}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#171717]">{g.name}</h4>
                            <p className="text-[10px] font-mono text-[#727272]">{g.companyName}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded border border-emerald-200">
                          Active Policy
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#f4f4f4] flex items-center justify-between text-xs text-[#727272]">
                        <span>Assigned Members: <strong>{users.filter((u) => u.groupId === g.id).length}</strong></span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("Manage Menu Access")}
                          className="text-[#414141] hover:underline font-semibold text-xs cursor-pointer"
                        >
                          Edit Group Rights &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Change Password" && (
              <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto space-y-5">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] text-[#414141] flex items-center justify-center mx-auto border border-[#d8d8d8]">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#171717] font-display">
                    Administrative Password Reset
                  </h3>
                  <p className="text-xs text-[#727272]">
                    Enforce immediate password change for any operator account across the cluster.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="bg-white border border-[#e7e7e7] rounded-xl p-5 shadow-xs space-y-4 text-xs">
                  <div>
                    <label className="block text-[#535353] font-medium mb-1">Target Operator</label>
                    <select
                      value={passwordTargetUser}
                      onChange={(e) => setPasswordTargetUser(e.target.value)}
                      className="w-full bg-[#fafafa] border border-[#d4d4d4] rounded-lg px-3 py-2 text-[#171717] font-semibold focus:bg-white focus:outline-none focus:border-[#414141]"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.id} - {u.name} ({u.groupId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#535353] font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#fafafa] border border-[#d4d4d4] rounded-lg px-3 py-2 text-[#171717] focus:bg-white focus:outline-none focus:border-[#414141]"
                      placeholder="Minimum 8 characters with digits"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#535353] font-medium mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#fafafa] border border-[#d4d4d4] rounded-lg px-3 py-2 text-[#171717] focus:bg-white focus:outline-none focus:border-[#414141]"
                      placeholder="Re-enter password to verify"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#414141] hover:bg-[#4e4e4e] text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                  >
                    Reset & Enforce Password
                  </button>
                </form>
              </div>
            )}

            {activeTab === "Unlock Users" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#171717] font-display">
                    Account Lockout & Remediation Portal
                  </h3>
                  <p className="text-xs text-[#727272]">
                    Review and unlock cashier accounts locked due to consecutive authentication failures.
                  </p>
                </div>

                <div className="bg-white border border-[#e7e7e7] rounded-xl overflow-hidden shadow-xs text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#e7e7e7] font-mono text-[11px] text-[#535353]">
                        <th className="px-4 py-2.5">User ID</th>
                        <th className="px-4 py-2.5">Operator Name</th>
                        <th className="px-4 py-2.5">Assigned Terminal</th>
                        <th className="px-4 py-2.5 text-center">Lock Status</th>
                        <th className="px-4 py-2.5 text-center">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f4f4]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#fafafa]">
                          <td className="px-4 py-3 font-mono font-bold text-[#414141]">{u.id}</td>
                          <td className="px-4 py-3 font-semibold text-[#171717]">{u.name}</td>
                          <td className="px-4 py-3 font-mono text-[#727272]">{u.companyCode}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                u.isLocked
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {u.isLocked ? "LOCKED" : "ACTIVE"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.isLocked ? (
                              <button
                                type="button"
                                onClick={() => handleUnlockUser(u.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs cursor-pointer"
                              >
                                Unlock Account
                              </button>
                            ) : (
                              <span className="text-[#a1a1a1] text-[11px] font-mono">No action required</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "Activity Log Report" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#171717] font-display">
                    Immutable Security Audit Log Stream
                  </h3>
                  <p className="text-xs text-[#727272]">
                    Live audit trail recorded directly into PostgreSQL table tileflow_audit_log.
                  </p>
                </div>
                <div className="bg-white border border-[#e7e7e7] rounded-xl p-4 shadow-xs space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f4f4f4] text-[11px] text-[#727272]">
                    <span>Table: tileflow_audit_log</span>
                    <span className="text-emerald-700 font-bold">SHA-256 Tamper Protected</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { event: "USER_LOGIN_SUCCESS", user: "001 (SYSADMIN)", time: "Just now", ip: "127.0.0.1" },
                      { event: "MENU_PERMISSION_UPDATE", user: "001 (SYSADMIN)", time: "5 mins ago", ip: "127.0.0.1" },
                      { event: "SECURITY_POLICY_SAVED", user: "001 (SYSADMIN)", time: "12 mins ago", ip: "127.0.0.1" },
                    ].map((log, i) => (
                      <div key={i} className="p-2.5 bg-[#fafafa] border border-[#e7e7e7] rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-[#f5f5f5] text-[#414141] font-bold text-[10px] rounded border border-[#d8d8d8]">
                            {log.event}
                          </span>
                          <span className="text-[#171717] font-semibold">{log.user}</span>
                        </div>
                        <div className="text-[#727272] text-[11px]">
                          <span>{log.time}</span> | <span>{log.ip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "My Profile" && (
              <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto space-y-4">
                <div className="bg-white border border-[#e7e7e7] rounded-2xl p-6 shadow-xs text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#f5f5f5] text-[#414141] font-bold text-xl flex items-center justify-center mx-auto border-2 border-[#d8d8d8]">
                    AD
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#171717]">Admin User (SYSADMIN)</h3>
                    <p className="text-xs font-mono text-[#727272]">ID: 001 | Role: SYSTEM ADMINISTRATOR</p>
                  </div>
                  <div className="pt-3 border-t border-[#f4f4f4] grid grid-cols-2 gap-3 text-left text-xs font-mono">
                    <div className="p-2.5 bg-[#fafafa] rounded-lg border border-[#e7e7e7]">
                      <span className="text-[10px] text-[#a1a1a1] block">Current Branch</span>
                      <strong className="text-[#171717]">Branch 01 (Main Store)</strong>
                    </div>
                    <div className="p-2.5 bg-[#fafafa] rounded-lg border border-[#e7e7e7]">
                      <span className="text-[10px] text-[#a1a1a1] block">Access Clearance</span>
                      <strong className="text-emerald-700">Full System Access</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Manage Data Access" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#171717] font-display">
                    Multi-Tenant Data Boundary Control
                  </h3>
                  <p className="text-xs text-[#727272]">
                    Enforce strict company-level and store branch-level transactional data isolation.
                  </p>
                </div>
                <div className="bg-white border border-[#e7e7e7] rounded-xl p-5 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f4]">
                    <div>
                      <h4 className="font-bold text-[#171717]">Strict Branch Isolation Policy</h4>
                      <p className="text-[11px] text-[#727272]">Prevent billing operators from querying inventory outside assigned branch.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] font-mono rounded border border-emerald-200">
                      ENFORCED
                    </span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* 3. Bottom Status Bar */}
        <div className="bg-[#fafafa] border-t border-[#e7e7e7] px-4 py-2 flex items-center justify-between text-[11px] text-[#727272] select-none font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#171717]">MQube</span>
            <span>&bull;</span>
            <span>Control Plane Security Engine v6.17</span>
          </div>
          <div className="text-[#414141] font-semibold">
            Press Esc to Close
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecManageDlg;
