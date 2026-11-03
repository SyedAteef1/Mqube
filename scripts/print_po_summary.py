import openpyxl

fp = r"F:\TileFlow-Clients Data\Tattly Threads\Invoice\Tattly_Threads_Consolidated_PO_Extraction.xlsx"
wb = openpyxl.load_workbook(fp, read_only=True, data_only=True)
ws = wb['PO_Summary_Register']
for row in ws.iter_rows(values_only=True):
    print(row[0], row[1], row[2], row[4])
