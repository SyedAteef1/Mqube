import React, { useEffect, useState } from "react";
import { apiFetchV1 } from "../lib/apiFetchV1.ts";

const FIELDS = [
  { section: "Business details" },
  { key: "name", label: "Business Name", required: true },
  { key: "gst_number", label: "Your GSTIN", placeholder: "e.g. 27AAXFT2508H1ZR" },
  { key: "address", label: "Business Address", multiline: true },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { section: "Bank details printed on bills" },
  { key: "bank_name", label: "Bank Name" },
  { key: "bank_account_name", label: "Account Name" },
  { key: "bank_account_no", label: "Account Number" },
  { key: "bank_ifsc", label: "IFSC Code" },
  { key: "bank_branch", label: "Branch" },
] as const;

export const BusinessProfileTab: React.FC<{ currentUser?: any; onNotification?: (title: string, message: string, type?: any) => void }> = ({
  currentUser,
  onNotification,
}) => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isOwner = String(currentUser?.role || "").toUpperCase() === "SYSADMIN";

  useEffect(() => {
    apiFetchV1<any>("/company/profile")
      .then((profile) => {
        setForm(Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, (value as string) || ""])));
        setLoaded(true);
      })
      .catch((err) => setError(err?.message || "Could not load your business details."));
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetchV1("/company/profile", { method: "PUT", body: JSON.stringify(form) });
      localStorage.setItem("tileflow_company_name", form.name);
      onNotification?.("Business Profile Saved", "New bills will use these details.", "success");
    } catch (err: any) {
      setError(err?.message || "Could not save your business details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl mx-auto p-6 space-y-4 text-theme-body">
      <div>
        <h1 className="text-2xl font-bold">Business Profile</h1>
        <p className="text-sm text-theme-muted">
          These are your own details as the owner. They print at the top of every bill. A customer's GSTIN is added separately on the customer.
        </p>
      </div>
      {!isOwner && <p className="text-sm text-amber-700">Only the owner can change these details.</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {FIELDS.map((field) =>
        "section" in field ? (
          <h2 key={field.section} className="text-sm font-bold uppercase tracking-wide pt-3 border-t border-theme-divider">{field.section}</h2>
        ) : (
          <label key={field.key} className="block text-sm font-semibold">
            {field.label}
            {React.createElement("multiline" in field ? "textarea" : "input", {
              "aria-label": field.label,
              className: "mt-1 w-full rounded border border-theme-divider bg-white text-slate-900 px-3 py-2 font-normal",
              value: form[field.key] || "",
              required: "required" in field,
              placeholder: "placeholder" in field ? field.placeholder : undefined,
              disabled: !isOwner || !loaded,
              onChange: (event: any) => setForm((prev) => ({ ...prev, [field.key]: event.target.value })),
            })}
          </label>
        ),
      )}
      {isOwner && (
        <button type="submit" disabled={saving || !loaded} className="bg-blue-600 text-white font-bold px-5 py-2 rounded disabled:opacity-50">
          {saving ? "Saving..." : "Save Business Profile"}
        </button>
      )}
    </form>
  );
};
