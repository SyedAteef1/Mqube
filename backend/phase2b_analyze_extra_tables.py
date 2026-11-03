"""
PHASE 2B: Analyze extra tables in tileflow001 (not in fresh DB)
Classify: Control-Plane, Canonical, Legacy, Business-Data
"""
import psycopg2

# Tables ONLY in tileflow001 (45 extra tables)
extra_tables = [
    'approval_actions', 'approval_policies', 'approval_requests',
    'cge_unified_policies', 'communicator_logs', 'communicator_templates',
    'control_companies', 'control_company_databases', 'control_users',
    'crm_campaigns', 'crm_customer_activities', 'crm_leads', 'crm_opportunities',
    'distribution_claims', 'distribution_route_stops', 'distribution_routes', 'distribution_settlements',
    'ecom_channels', 'ecom_order_imports', 'ecom_reconciliations', 'ecom_sku_mappings', 'ecom_stock_sync_logs',
    'eway_bills', 'invoice_document_artifacts',
    'item_batches', 'item_serials', 'item_warehouse_locations',
    'loading_sheet_items', 'loading_sheets',
    'party_addresses', 'party_contacts', 'party_relationships',
    'pdt_demand_signals', 'pdt_distribution_predictions', 'pdt_model_registry', 'pdt_sku_twin_cache',
    'psv_party_scopes', 'psv_stock_balances', 'psv_stock_events', 'psv_visibility_policies',
    'sales_order_invoice_allocations',
    'tax_invoice_template_versions', 'tax_invoice_templates',
    'tenant_capability_bindings', 'user_workspace_configs'
]

classifications = {
    'CONTROL_PLANE': [
        'control_companies', 'control_company_databases', 'control_users',
        'communicator_logs', 'communicator_templates',
        'tileflow_permissions', 'tileflow_menus', 'tileflow_audit_log'  # should be in fresh
    ],
    'APPROVAL_WORKFLOW': [
        'approval_actions', 'approval_policies', 'approval_requests'
    ],
    'CRM_MODULE': [
        'crm_campaigns', 'crm_customer_activities', 'crm_leads', 'crm_opportunities'
    ],
    'DISTRIBUTION': [
        'distribution_claims', 'distribution_route_stops', 'distribution_routes', 'distribution_settlements'
    ],
    'ECOMMERCE': [
        'ecom_channels', 'ecom_order_imports', 'ecom_reconciliations', 'ecom_sku_mappings', 'ecom_stock_sync_logs'
    ],
    'INVENTORY': [
        'item_batches', 'item_serials', 'item_warehouse_locations', 'loading_sheet_items', 'loading_sheets'
    ],
    'PARTY_MANAGEMENT': [
        'party_addresses', 'party_contacts', 'party_relationships'
    ],
    'PREDICTIVE': [
        'pdt_demand_signals', 'pdt_distribution_predictions', 'pdt_model_registry', 'pdt_sku_twin_cache'
    ],
    'PSV_VISIBILITY': [
        'psv_party_scopes', 'psv_stock_balances', 'psv_stock_events', 'psv_visibility_policies'
    ],
    'TAX_INVOICING': [
        'tax_invoice_template_versions', 'tax_invoice_templates', 'eway_bills', 'invoice_document_artifacts'
    ],
    'SALES_ORDER': [
        'sales_order_invoice_allocations'
    ],
    'CONFIG': [
        'tenant_capability_bindings', 'user_workspace_configs'
    ]
}

print("[PHASE 2B] Classification of 45 extra tables in tileflow001")
print("="*70)

for category, tables in classifications.items():
    print(f"\n{category}:")
    for table in tables:
        if table in extra_tables:
            print(f"  ✗ {table} (IN tileflow001, NOT in fresh DB)")
        elif table == 'tileflow_permissions' or table == 'tileflow_menus' or table == 'tileflow_audit_log':
            print(f"  ✓ {table} (in fresh DB as expected)")

print("\n" + "="*70)
print("MISSING TABLES IN tileflow001 (11 tables only in fresh DB):")
print("="*70)
missing_in_tileflow001 = [
    'audit_logs', 'company_bank_accounts', 'company_database_registries',
    'company_policy_settings', 'compliance_thresholds', 'legacy_pos_shifts',
    'pos_profiles', 'tileflow_audit_log', 'tileflow_menus', 'tileflow_permissions', 'sync_queue'
]

control_plane_canonical = ['company_database_registries', 'company_policy_settings', 'compliance_thresholds', 
                           'tileflow_audit_log', 'tileflow_menus', 'tileflow_permissions']
print(f"\nControl-Plane/Canonical tables missing: {len(control_plane_canonical)}")
for table in control_plane_canonical:
    print(f"  ! {table} (MUST BE CREATED IN tileflow001)")

print(f"\nOther missing tables: {len(missing_in_tileflow001) - len(control_plane_canonical)}")
for table in missing_in_tileflow001:
    if table not in control_plane_canonical:
        print(f"  ? {table}")

print("\n" + "="*70)
print("VERDICT:")
print("="*70)
print("  tileflow001 has DIVERGED from canonical schema")
print("  - Has 45 extra tables (likely from deleted/abandoned migrations)")
print("  - Missing 6 CRITICAL control-plane tables that ARE in fresh DB")
print("  - Status: REQUIRES MANUAL REMEDIATION (NOT SAFE TO AUTO-FIX)")
