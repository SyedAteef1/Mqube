"""
Fix all TSC errors caused by NGP-v2 rename.
Strategy: Update JSX tag usages to match the actual imported alias names.
"""
import re
from pathlib import Path

repo_root = Path(".").resolve()

# ─────────────────────────────────────────────────────────────────────────────
# 1. IMPORT PATH FIXES  (string literal replacements in any file that contains them)
# ─────────────────────────────────────────────────────────────────────────────
IMPORT_PATH_FIXES = [
    # Old filename -> new filename (within imports)
    ('"./LoyaltyLookupDlg.tsx"', '"./ProPosLoyaltyLooku.tsx"'),
    ('"./PosSalesReturn.tsx"', '"./ProPosSalesReturnD.tsx"'),
    ('"./TaxInvoiceRcpt.tsx"', '"./ProPosTaxInvoiceRc.tsx"'),
    ('"./CashMovementsDlg.tsx"', '"./ProPosCashMovesDlg.tsx"'),
    ('"./ShiftCloseDlg.tsx"', '"./ProPosShiftCloseDl.tsx"'),
    ('"./DailyReportsDash.tsx"', '"./ProPosDailyReports.tsx"'),
    ('"./PromotionEngine.tsx"', '"./ProPosPromotionEng.tsx"'),
    ('"./CommissionBuild.tsx"', '"./ProPosCommissionBu.tsx"'),
    ('"./AdvCustSearchDlg.tsx"', '"./AdvancedCustSearch.tsx"'),
    ('"./InvForecast.tsx"', '"./InventoryForecastW.tsx"'),
    ('"./crm/CrmPipeline.tsx"', '"./crm/OppPipe.tsx"'),
]

# ─────────────────────────────────────────────────────────────────────────────
# 2. WRONG-SOURCE IMPORT FIXES  (exact string replacement)
# ─────────────────────────────────────────────────────────────────────────────
WRONG_SOURCE_FIXES = [
    {
        "file": "src/components/customer/CustFormTab.tsx",
        "old": 'import { TileFlowCustomerPriceGroupModal } from "./CustomerLedger.tsx";',
        "new": 'import { TileFlowCustomerPriceGroupModal } from "./CustPriceGroupDlg.tsx";',
    },
    {
        "file": "src/components/customer/CustMasterWs.tsx",
        "old": 'import { TileFlowCustomerFormTab } from "./CustomerLedger.tsx";',
        "new": 'import { TileFlowCustomerFormTab } from "./CustFormTab.tsx";',
    },
    {
        "file": "src/components/customer/CustMasterWs.tsx",
        "old": 'import { TileFlowCustomerRetailDetailsTab } from "./CustomerLedger.tsx";',
        "new": 'import { TileFlowCustomerRetailDetailsTab } from "./CustRetailDetTab.tsx";',
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# 3. NAMED → DEFAULT IMPORT FIXES
# ─────────────────────────────────────────────────────────────────────────────
NAMED_TO_DEFAULT = [
    {
        "file": "src/components/billing/propos/ProPosEodReportVie.tsx",
        "old": 'import { ProPosDenomination } from "./ProPosDenomination.tsx";',
        "new": 'import ProPosDenomination from "./ProPosDenomination.tsx";',
    },
    {
        "file": "src/components/billing/propos/ProPosShiftCloseDl.tsx",
        "old": 'import { ProPosDenomination } from "./ProPosDenomination.tsx";',
        "new": 'import ProPosDenomination from "./ProPosDenomination.tsx";',
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# 4. JSX NAME FIXES  (wrong_jsx_name -> correct_imported_alias)
#    Applied with word-boundary regex to avoid partial matches.
#    Format: { "file_key": [(wrong, correct), ...] }
# ─────────────────────────────────────────────────────────────────────────────
JSX_NAME_FIXES = {
    # App.tsx ----------------------------------------------------------------
    "src/App.tsx": [
        ("SupplierDashTab", "SupplierDashboardTab"),
        ("MasterMgmtTab", "MasterManagementTab"),
        ("TaxInvoicePrintPag", "TaxInvoicePrintPage"),
        ("ErrorBoundary", "TileFlowErrorBoundary"),
        ("CompanySelectScree", "CompanySelectionScreen"),
        ("DrillDownCrumbs", "DrillDownBreadcrumbs"),
        ("GlobalF2BrowseDlg", "GlobalF2BrowseModal"),
        ("CtxInspectorHUD", "ContextualInspectorHUD"),
    ],
    # BarcodeStudioTab --------------------------------------------------------
    "src/components/BarcodeStudioTab.tsx": [
        ("TagLabelPrintingTa", "TagLabelPrintingTab"),
    ],
    # TagLabelPrintingTa (barcode) -------------------------------------------
    "src/components/barcode/TagLabelPrintingTa.tsx": [
        ("BarcodeScriptGenVi", "BarcodeScriptGenerationView"),
        ("SearchableMultiSel", "SearchableMultiSelect"),
        ("EditQuantityDetDlg", "EditQuantityDetailsModal"),
        ("BarcodePrinterSele", "BarcodePrinterSelectModal"),
    ],
    # DashboardTab ------------------------------------------------------------
    "src/components/DashboardTab.tsx": [
        ("InvForecastidget", "InvForecastidget"),  # no change needed here
        ("InvForecast", "InvForecastidget"),  # JSX uses <InvForecast>
    ],
    # ExcelGridEntrySec -------------------------------------------------------
    "src/components/ExcelGridEntrySec.tsx": [
        ("HeaderMapPrev", "HeaderMapPrevewModal"),
        ("HeaderAliasDlg", "HeaderAliasDlgModal"),
    ],
    # CrmStudioTab ------------------------------------------------------------
    "src/components/CrmStudioTab.tsx": [
        ("CrmPipeline", "OpportunityPipeline"),
    ],
    # CustMasterWs ------------------------------------------------------------
    "src/components/customer/CustMasterWs.tsx": [
        ("CustomerFormTab", "TileFlowCustomerFormTab"),
        ("CustomerRetail", "TileFlowCustomerRetailDetailsTab"),
        ("CustAddlDetails", "TileFlowCustomerAdditionalDetailsTab"),
        ("CustMailingDlg", "TileFlowCustomerMailingModal"),
        ("AdvCustSearchDlg", "TileFlowAdvancedCustomerSearchModal"),
    ],
    # CustFormTab -------------------------------------------------------------
    "src/components/customer/CustFormTab.tsx": [
        ("CustomerPriceDlg", "TileFlowCustomerPriceGroupModal"),
    ],
    # ProPosWs ----------------------------------------------------------------
    "src/components/billing/propos/ProPosWs.tsx": [
        ("ProPosBilling", "TileFlowProPosBillinginal"),
        ("ProPosEodReport", "TileFlowProPosEodReportw"),
        ("DailyReportsDash", "TileFlowDailyReportsDashDashboard"),
        ("PromotionEngine", "TileFlowPromotionEngineine"),
        ("CommissionBuild", "TileFlowCommissionBuildilder"),
    ],
    # ProPosBillingTerm -------------------------------------------------------
    "src/components/billing/propos/ProPosBillingTerm.tsx": [
        ("LoyaltyLookupDlg", "TileFlowLoyaltyLookupDlgpModal"),
        ("PosSalesReturn", "TileFlowProPosSalesReturnModal"),
        ("TaxInvoiceRcpt", "TileFlowProPosTaxInvoiceReceipt"),
        ("ProPosPdtImportDlg", "TileFlowPdtImportDlg"),
        ("CustBrowseDlg", "TileFlowCustomerBrowseModal"),
        ("ProPosHotkeysDlg", "TileFlowProPosHotkeysDlg"),
        ("ProPosReprintDlg", "TileFlowProPosReprintDlg"),
        ("CashMovementsDlg", "TileFlowProPosCashMovementsModal"),
        ("ShiftCloseDlg", "TileFlowProPosShiftCloseModal"),
        ("ItemTypeaheadDrop", "TileFlowItemTypeaheadDropdown"),
        ("ProPosSettlementDl", "TileFlowPosSettlement"),
        ("ProPosRecallDlg", "TileFlowProPosRecallDlg"),
        ("ProPosCancellation", "TileFlowProPosCancelDlg"),
    ],
}


def word_replace(content: str, wrong: str, correct: str) -> tuple[str, bool]:
    """Replace word occurrences of `wrong` with `correct` (word-boundary safe)."""
    pattern = rf'(?<![A-Za-z0-9_]){re.escape(wrong)}(?![A-Za-z0-9_])'
    new_content = re.sub(pattern, correct, content)
    return new_content, new_content != content


def process_file(path: Path) -> bool:
    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  ERROR reading {path}: {e}")
        return False

    original = content
    # Use relative path from repo root for dictionary lookup
    try:
        rel = path.relative_to(repo_root)
        file_key = str(rel).replace("\\", "/")
    except ValueError:
        file_key = str(path).replace("\\", "/")
    changes = []

    # 1. Fix import paths (string literal)
    for old_path, new_path in IMPORT_PATH_FIXES:
        if old_path in content:
            content = content.replace(old_path, new_path)
            changes.append(f"  import path: {old_path} -> {new_path}")

    # 2. Fix wrong-source imports
    for fix in WRONG_SOURCE_FIXES:
        if fix["file"] == file_key and fix["old"] in content:
            content = content.replace(fix["old"], fix["new"])
            changes.append(f"  wrong src fix")

    # 3. Named → default import fixes
    for fix in NAMED_TO_DEFAULT:
        if fix["file"] == file_key and fix["old"] in content:
            content = content.replace(fix["old"], fix["new"])
            changes.append(f"  named->default")

    # 4. JSX name fixes
    if file_key in JSX_NAME_FIXES:
        for wrong, correct in JSX_NAME_FIXES[file_key]:
            if wrong == correct:
                continue
            new_content, changed = word_replace(content, wrong, correct)
            if changed:
                content = new_content
                changes.append(f"  jsx: {wrong} -> {correct}")

    if content != original:
        path.write_text(content, encoding="utf-8")
        print(f"FIXED: {path}")
        for c in changes:
            print(c)
        return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# SCAN all .tsx / .ts in src/
# ─────────────────────────────────────────────────────────────────────────────
fixed_count = 0
for path in sorted(list(repo_root.glob("src/**/*.tsx")) + list(repo_root.glob("src/**/*.ts"))):
    if process_file(path):
        fixed_count += 1

print(f"\nTotal files fixed: {fixed_count}")
