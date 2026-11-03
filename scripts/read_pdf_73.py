import os
from pypdf import PdfReader

files = [
    r"exports\all_54_pdf_invoices\8319_TT2026-2027_73.pdf",
    r"exports\Final_TaxInvoice\8319_TT2026-2027_73.pdf",
    r"exports\Final_TaxInvoice\S4NN_8319_TT2026-2027_73.pdf",
    r"exports\Old_Invoices\SIS_8319_TaxInvoice_TT2026-2027_73.pdf",
    r"TT\Pending\SIS_8319_TaxInvoice_TT2026-2027_73.pdf",
    r"TT\Pending\updated\8319_TT2026-2027_73.pdf"
]

for f in files:
    if os.path.exists(f):
        print(f"=== File: {f} ===")
        reader = PdfReader(f)
        text = reader.pages[0].extract_text()
        print(text[:400])
        print("...")
