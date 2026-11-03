import sys
import io
from pypdf import PdfReader

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

reader = PdfReader(r"exports\Final_TaxInvoice\S4NN_8319_TT2026-2027_73.pdf")
print("Number of pages:", len(reader.pages))
for i, page in enumerate(reader.pages):
    print(f"=== PAGE {i+1} ===")
    print(page.extract_text())
