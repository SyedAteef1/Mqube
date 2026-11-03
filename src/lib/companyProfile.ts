import { useEffect, useState } from "react";
import { apiFetchV1 } from "./apiFetchV1.ts";

export interface CompanyProfile {
  name: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  bank: { bankName: string; accountName: string; accountNo: string; ifsc: string; branch: string };
}

/** The owner's business details, as printed on every bill. */
export function useCompanyProfile(): CompanyProfile {
  const companyId = localStorage.getItem("tileflow_company_id");
  const [profile, setProfile] = useState<CompanyProfile>({
    name: localStorage.getItem("tileflow_company_name") || "",
    gstin: "",
    address: "",
    phone: "",
    email: "",
    bank: { bankName: "", accountName: "", accountNo: "", ifsc: "", branch: "" },
  });

  useEffect(() => {
    apiFetchV1<any>("/company/profile")
      .then((res) => {
        setProfile({
          name: res.name || "",
          gstin: res.gst_number || "",
          address: res.address || "",
          phone: res.phone || "",
          email: res.email || "",
          bank: {
            bankName: res.bank_name || "",
            accountName: res.bank_account_name || "",
            accountNo: res.bank_account_no || "",
            ifsc: res.bank_ifsc || "",
            branch: res.bank_branch || "",
          },
        });
      })
      .catch(() => {});
  }, [companyId]);

  return profile;
}
