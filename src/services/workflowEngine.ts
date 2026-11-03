export type WorkflowStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Cancelled";
export type DocumentType = "PurchaseOrder" | "SalesOrder" | "Quotation" | "SalesInvoice" | "SalesReturn";

export interface WorkflowTransition {
  action: string;
  from: string[];
  to: string;
  roles?: string[];
}

export class WorkflowEngine {
  private static transitions: Record<string, WorkflowTransition[]> = {
    PurchaseOrder: [
      { action: "submit", from: ["Draft", "Rejected"], to: "Submitted" },
      { action: "approve", from: ["Submitted"], to: "Approved", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "reject", from: ["Submitted"], to: "Rejected", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "cancel", from: ["Draft", "Submitted", "Approved"], to: "Cancelled" }
    ],
    SalesOrder: [
      { action: "submit", from: ["Draft", "Rejected"], to: "Submitted" },
      { action: "approve", from: ["Submitted"], to: "Approved", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "reject", from: ["Submitted"], to: "Rejected", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "cancel", from: ["Draft", "Submitted", "Approved"], to: "Cancelled" }
    ],
    Quotation: [
      { action: "submit", from: ["Draft", "Rejected"], to: "Submitted" },
      { action: "approve", from: ["Submitted"], to: "Approved", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "reject", from: ["Submitted"], to: "Rejected", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "cancel", from: ["Draft", "Submitted", "Approved"], to: "Cancelled" }
    ],
    SalesInvoice: [
      { action: "submit", from: ["Draft", "Rejected"], to: "Submitted" },
      { action: "approve", from: ["Submitted"], to: "Approved", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "reject", from: ["Submitted"], to: "Rejected", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "cancel", from: ["Draft", "Submitted", "Approved"], to: "Cancelled" }
    ],
    SalesReturn: [
      { action: "submit", from: ["Draft", "Rejected"], to: "Submitted" },
      { action: "approve", from: ["Submitted"], to: "Approved", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "reject", from: ["Submitted"], to: "Rejected", roles: ["Manager", "Admin", "Store Manager"] },
      { action: "cancel", from: ["Draft", "Submitted", "Approved"], to: "Cancelled" }
    ]
  };

  static canTransition(docType: DocumentType, currentStatus: string, action: string, userRole: string = "Admin"): boolean {
    const docTransitions = this.transitions[docType];
    if (!docTransitions) return false;

    const transition = docTransitions.find(t => t.action === action);
    if (!transition) return false;

    if (!transition.from.includes(currentStatus)) {
      return false;
    }

    if (transition.roles && !transition.roles.includes(userRole)) {
      return false;
    }

    return true;
  }

  static getNextStatus(docType: DocumentType, action: string): string {
    const docTransitions = this.transitions[docType];
    if (!docTransitions) throw new Error("Invalid document type");

    const transition = docTransitions.find(t => t.action === action);
    if (!transition) throw new Error("Invalid workflow action");

    return transition.to;
  }
  
  static getAvailableActions(docType: DocumentType, currentStatus: string, userRole: string = "Admin"): string[] {
    const docTransitions = this.transitions[docType];
    if (!docTransitions) return [];
    
    return docTransitions
      .filter(t => t.from.includes(currentStatus) && (!t.roles || t.roles.includes(userRole)))
      .map(t => t.action);
  }
}
