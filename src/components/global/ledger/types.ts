import React from "react";

export interface LedgerColumn<T> {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (val: any, record: T, index?: number) => React.ReactNode;
}

export interface LedgerFilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  defaultValue?: string;
}

export interface LedgerConfig<T> {
  entityName: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  apiEndpoint: string;
  idKey?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];
  columns: LedgerColumn<T>[];
  filters?: LedgerFilterOption[];
  responseTransform?: (data: any) => T[];
  exportFileName?: string;
}
