import openpyxl

po_fp = r"F:\TileFlow-Clients Data\Tattly Threads\Invoice\Tattly_Threads_Consolidated_PO_Extraction.xlsx"
wb = openpyxl.load_workbook(po_fp, read_only=True, data_only=True)
ws = wb['PO_Line_Items_All']
header = None
for row in ws.iter_rows(values_only=True):
    if header is None:
        header = [str(c) if c is not None else '' for c in row]
        continue
    row_dict = dict(zip(header, row))
    po_num = str(row_dict.get('PO_Number', '')).strip()
    style = str(row_dict.get('Vendor_Style_Code', '')).strip().upper()
    size = str(row_dict.get('Size', '')).strip()
    if po_num in ['5182778198', '5182778209']:
        if style in ['CH-19-E', 'SND-05-G', 'CH-04-A']:
            print(f"PO {po_num} -> Style: {style}, Color: {row_dict.get('Color')}, Size: {size}, MRP: {row_dict.get('MRP')}, Base_Cost: {row_dict.get('Base_Cost')}")
