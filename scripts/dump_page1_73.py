import sys
import io
from pypdf import PdfReader

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

reader = PdfReader(r"exports\Final_TaxInvoice\S4NN_8319_TT2026-2027_73.pdf")
print("=== PAGE 1 ===")
print(reader.pages[0].extract_text())
