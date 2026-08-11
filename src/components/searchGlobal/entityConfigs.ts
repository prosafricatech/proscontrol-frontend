'use client'

import requisitionsServices from '@/components/processApproval/requisitionsServices.js';
import budgetsServices from '@/components/accounts/budgets/budgets-services.js';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices.js';
import userManagementServices from '@/components/prosControl/userManagement/user-management-services';
import ledgerServices from '@/components/accounts/ledgers/ledger-services.js';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import productServices from '@/components/productAndServices/products/productServices.js';
import currencyServices from '@/components/masters/Currencies/currency-services.js';
import measurementUnitServices from '@/components/masters/measurementUnits/measurement-unit-services.js';
import posServices from '@/components/pos/pos-services.js';
import { staticMenuItems } from '@/utilities/constants/static-menu-items';
import purchaseServices from '../procurement/purchases/purchase-services';
import stakeholderServices from '../masters/stakeholders/stakeholder-services';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';

type SearchAccessContext = {
  checkPermission?: (permissions: string | string[], mustHaveAll?: boolean) => boolean;
  checkOrganizationPermission?: (permissions: string | string[], mustHaveAll?: boolean) => boolean;
  organizationHasSubscribed?: (modules: string | string[], mustHaveAll?: boolean) => boolean;
};

type EntityAccess = {
  permissions?: string[];
  orgPermissions?: string[];
  modules?: string[];
};

type EntityConfig = {
  type: string;
  label: string;
  access?: EntityAccess;
  search: (...args: any[]) => Promise<any[]>;
};

// Helper: lowercased entity types already covered by deep search
const deepEntityTypes = [
  'ledger', 'project', 'product', 'budget', 'employee', 'department', 
  'user', 'requisition', 'currency', 'measurement unit', 'counter sale'
];

const canOrg = (ctx: SearchAccessContext | undefined, permissions: string | string[]) =>
  !!ctx?.checkOrganizationPermission?.(permissions);

const hasModule = (ctx: SearchAccessContext | undefined, modules: string | string[]) =>
  !!ctx?.organizationHasSubscribed?.(modules);

const canUser = (ctx: SearchAccessContext | undefined, permissions: string | string[]) =>
  !!ctx?.checkPermission?.(permissions);

export const canAccessEntityConfig = (
  config: EntityConfig,
  ctx?: SearchAccessContext
) => {
  const access = config.access;
  if (!access) return true;
  if (access.permissions && !canUser(ctx, access.permissions)) return false;
  if (access.orgPermissions && !canOrg(ctx, access.orgPermissions)) return false;
  if (access.modules && !hasModule(ctx, access.modules)) return false;
  return true;
};

// ==================== MASTER DATA CONFIGURATIONS ====================

const masterDataConfigs = [
  {
    type: 'stakeholder',
    label: 'Stakeholder',
    access: { orgPermissions: [PERMISSIONS.STAKEHOLDERS_READ] },
    search: async (query: string) => {
      try {
        const data = await stakeholderServices.getList({ type: 'all', keyword: query, page: 1, limit: 5 });
        const menuItem = '/en-US/masters/stakeholders';
        return Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.name && item.name.toLowerCase().includes(query.toLowerCase())) ||
                (item.email && item.email.toLowerCase().includes(query.toLowerCase())) ||
                (item.code && item.code.toLowerCase().includes(query.toLowerCase()))
              )
              .map((item: any) => ({
                id: item.id,
                label: item.name || item.email || item.code || item.id,
                type: 'Stakeholder',
                url: `${menuItem}?search=${encodeURIComponent(item.name || item.email || item.code || query)}`,
                description: item.email || item.code || '',
              }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'costCenter',
    label: 'Cost Center',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string) => {
      try {
        const service = (await import('@/components/masters/costCenters/cost-center-services')).default;
        const data = await service.getList({ keyword: query, limit: 5 });
        const menuItem = '/en-US/cost_centers';
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name || item.code || item.id,
              type: 'Cost Center',
              url: `${menuItem}?search=${encodeURIComponent(item.name || query)}`,
              description: 'Cost Center',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'currency',
    label: 'Currency',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ] },
    search: async (query: string) => {
      try {
        const data = await currencyServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('currencies'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Currency',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Currency',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'measurementUnit',
    label: 'Measurement Unit',
    access: { orgPermissions: [PERMISSIONS.MEASUREMENT_UNITS_READ] },
    search: async (query: string) => {
      try {
        const data = await measurementUnitServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('measurement units'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Measurement Unit',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Measurement Unit',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'department',
    label: 'Department',
    access: { modules: [MODULES.HUMAN_RESOURCES] },
    search: async (query: string) => {
      try {
        const data = await humanResourcesServices.getDepartmentsList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('departments'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Department',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Department',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
];

// ==================== FINANCIAL REPORTS CONFIGURATIONS ====================

const financialReportsConfigs = [
  {
    type: 'report',
    label: 'Trial Balance',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_REPORTS], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('trial balance'.includes(query.toLowerCase()) || query.toLowerCase().includes('trial balance')) {
        return [{
          id: 'trial-balance',
          label: 'Trial Balance',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=trial-balance',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Income Statement',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_REPORTS], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('income statement'.includes(query.toLowerCase()) || query.toLowerCase().includes('income statement')) {
        return [{
          id: 'income-statement',
          label: 'Income Statement',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=income-statement',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Balance Sheet',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_REPORTS], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('balance sheet'.includes(query.toLowerCase()) || query.toLowerCase().includes('balance sheet')) {
        return [{
          id: 'balance-sheet',
          label: 'Balance Sheet',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=balance-sheet',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Cashier Report',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_REPORTS], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('cashier report'.includes(query.toLowerCase()) || query.toLowerCase().includes('cashier report')) {
        return [{
          id: 'cashier-report',
          label: 'Cashier Report',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=cashier-report',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Debtors & Creditors',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_REPORTS], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('debtors & creditors'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('debtors') || 
          query.toLowerCase().includes('creditors')) {
        return [{
          id: 'debtors-creditors',
          label: 'Debtors & Creditors',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=debtors-creditors',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Z Report',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_REPORTS], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('z report'.includes(query.toLowerCase()) || query.toLowerCase().includes('z report')) {
        return [{
          id: 'z-report',
          label: 'Z Report',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=z-report',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
];

// ==================== PROCUREMENT & SUPPLY CONFIGURATIONS ====================

const procurementConfigs = [
  {
    type: 'requisition',
    label: 'Requisition',
    access: { orgPermissions: [PERMISSIONS.REQUISITIONS_READ], modules: [MODULES.PROCESS_APPROVAL] },
    search: async (query: string) => {
      try {
        const data = await requisitionsServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('requisitions'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.requisitionNo || item.name || item.title || item.reference || item.id,
              type: 'Requisition',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Requisition',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'purchaseOrder',
    label: 'Purchase Order',
    access: { orgPermissions: [PERMISSIONS.PURCHASES_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    search: async (query: string) => {
      try {
        const data = await purchaseServices.getList({ keyword: query, limit: 5 });
        const menuItem = '/en-US/procurement/purchases';
        return Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.orderNo && item.orderNo.toLowerCase().includes(query.toLowerCase())) ||
                'purchases order'.includes(query.toLowerCase()) ||
                query.toLowerCase().includes('purchases order')
              )
              .map((item: any) => ({
                id: item.id,
                label: item.orderNo || item.id,
                type: 'Purchase Order',
                url: `${menuItem}?search=${encodeURIComponent(item.orderNo || query)}`,
                description: 'Purchase Order',
              }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'report',
    label: 'Procurement Reports',
    access: { orgPermissions: [PERMISSIONS.PURCHASES_REPORTS], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.PURCHASES_REPORTS)) return [];
      const q = query.toLowerCase();
      if (q.includes('procurement report') || 
          q.includes('procurement & supply report') || 
          q.includes('procurement and supply report')) {
        return [
          {
            id: 'procurement-product-insights',
            label: 'Product Insights',
            type: 'Procurement Report',
            url: '/en-US/procurement/reports?report=product-insights',
            description: 'Procurement & Supply Report',
          },
          {
            id: 'procurement-purchases-report',
            label: 'Purchases Report',
            type: 'Procurement Report',
            url: '/en-US/procurement/reports?report=purchases-report',
            description: 'Procurement & Supply Report',
          },
        ];
      }
      return [];
    },
  },
];

// ==================== PROJECT MANAGEMENT CONFIGURATIONS ====================

import projectCategoryServices from '@/components/projectManagement/projectCategories/project-category-services';

const projectConfigs = [
  {
    type: 'project',
    label: 'Project',
    access: { orgPermissions: [PERMISSIONS.PROJECTS_READ], modules: [MODULES.PROJECT_MANAGEMENT] },
    search: async (query: string) => {
      try {
        const data = await projectsServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('projects'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Project',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Project',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'projectCategory',
    label: 'Project Category',
    access: { orgPermissions: [PERMISSIONS.PROJECT_CATEGORIES_READ], modules: [MODULES.PROJECT_MANAGEMENT] },
    search: async (query: string) => {
      try {
        const data = await projectCategoryServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('project categories'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Project Category',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(item.name || query)}` : undefined,
              description: 'Project Category',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
];

// ==================== HR & USER MANAGEMENT CONFIGURATIONS ====================

const hrUserConfigs = [
  {
    type: 'employee',
    label: 'Employee',
    access: { modules: [MODULES.HUMAN_RESOURCES] },
    search: async (query: string) => {
      try {
        const data = await humanResourcesServices.getEmployeesList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('employees'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name || item.fullName || item.email,
              type: 'Employee',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Employee',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'user',
    label: 'User',
    access: { permissions: ['ProsAfricans:Read', 'ProsAfricans:Manage'] },
    search: async (query: string) => {
      try {
        const data = await userManagementServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('users management'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name || item.fullName || item.email,
              type: 'User',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'User',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
];

// ==================== PRODUCT & SERVICES CONFIGURATIONS ====================

const productConfigs = [
  {
    type: 'product',
    label: 'Product',
    access: { orgPermissions: [PERMISSIONS.PRODUCTS_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    search: async (query: string) => {
      try {
        const data = await productServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('products'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Product',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Product',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
];

// ==================== POINT OF SALE CONFIGURATIONS ====================

const posConfigs = [
  {
    type: 'outlet',
    label: 'Sales Outlet',
    access: { orgPermissions: [PERMISSIONS.OUTLETS_READ], modules: [MODULES.POINT_OF_SALE] },
    search: async (query: string) => {
      try {
        const data = await (await import('@/components/pos/outlet/outlet-services')).default.getList({ keyword: query, limit: 5 });
        const results = Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.name && item.name.toLowerCase().includes(query.toLowerCase())) ||
                'sales outlet'.includes(query.toLowerCase()) ||
                query.toLowerCase().includes('sales outlet')
              )
              .map((item: any) => ({
                id: item.id,
                label: item.name || item.id,
                type: 'Sales Outlet',
                url: `/en-US/pos/outlets?search=${encodeURIComponent(item.name || query)}`,
                description: 'Sales Outlet',
              }))
          : [];
        return results;
      } catch {
        return [];
      }
    },
  },
  {
    type: 'proforma',
    label: 'Proforma Invoice',
    access: { orgPermissions: [PERMISSIONS.PROFORMA_INVOICES_READ], modules: [MODULES.POINT_OF_SALE] },
    search: async (query: string) => {
      try {
        const data = await (await import('@/components/pos/proformaInvoices/proforma-services')).default.getList({ 
          keyword: query, 
          limit: 5, 
          sales_outlet_id: 'all' 
        });
        const results = Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.proformaNo && item.proformaNo.toLowerCase().includes(query.toLowerCase())) ||
                'proforma invoice'.includes(query.toLowerCase()) ||
                query.toLowerCase().includes('proforma invoice')
              )
              .map((item: any) => ({
                id: item.id,
                label: item.proformaNo || item.id,
                type: 'Proforma Invoice',
                url: `/en-US/pos/proformas?search=${encodeURIComponent(item.proformaNo || query)}`,
                description: 'Proforma Invoice',
              }))
          : [];
        return results;
      } catch {
        return [];
      }
    },
  },
  {
    type: 'counterSale',
    label: 'Counter Sale',
    access: { orgPermissions: [PERMISSIONS.SALES_READ], modules: [MODULES.POINT_OF_SALE] },
    search: async (query: string) => {
      try {
        const data = await posServices.getCounterSales({
          counterId: 'all',
          keyword: query,
          limit: 5,
          page: 1,
          from: undefined,
          to: undefined,
          status: undefined,
        });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('sales counter'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.saleNo || item.invoice_no || item.customer_name || item.id,
              type: 'Counter Sale',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Counter Sale',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'report',
    label: 'Cashier Report (POS)',
    access: { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.POINT_OF_SALE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.SALES_REPORTS)) return [];
      if ('cashier report'.includes(query.toLowerCase()) || query.toLowerCase().includes('cashier report')) {
        return [{
          id: 'pos-cashier-report',
          label: 'Cashier Report',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=cashier-report',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales Manifest',
    access: { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.POINT_OF_SALE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales manifest'.includes(query.toLowerCase()) || query.toLowerCase().includes('sales manifest')) {
        return [{
          id: 'pos-sales-manifest',
          label: 'Sales Manifest',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-manifest',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales & Cash Summary',
    access: { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.POINT_OF_SALE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!canOrg(ctx, PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales & cash summary'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('sales & cash summary') || 
          query.toLowerCase().includes('sales and cash summary')) {
        return [{
          id: 'pos-sales-cash-summary',
          label: 'Sales & Cash Summary',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-cash-summary',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
];

// ==================== FUEL STATION CONFIGURATIONS ====================

const fuelStationConfigs = [
  {
    type: 'report',
    label: 'Dipping Report',
    access: { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.FUEL_STATION] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!hasModule(ctx, MODULES.FUEL_STATION) || !canOrg(ctx, PERMISSIONS.SALES_REPORTS)) return [];
      if ('dipping report'.includes(query.toLowerCase()) || query.toLowerCase().includes('dipping report')) {
        return [{
          id: 'fuel-dipping-report',
          label: 'Dipping Report',
          type: 'Fuel Station Report',
          url: '/en-US/fuelStations/reports?report=dipping-report',
          description: 'Fuel Station Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'FV Report',
    access: { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.FUEL_STATION] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!hasModule(ctx, MODULES.FUEL_STATION) || !canOrg(ctx, PERMISSIONS.SALES_REPORTS)) return [];
      if ('fv report'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('fv report') || 
          query.toLowerCase().includes('fuel vouchers report')) {
        return [{
          id: 'fuel-fv-report',
          label: 'FV Report',
          type: 'Fuel Station Report',
          url: '/en-US/fuelStations/reports?report=fv-report',
          description: 'Fuel Station Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales Manifest',
    access: { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.POINT_OF_SALE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!hasModule(ctx, MODULES.POINT_OF_SALE) || !canOrg(ctx, PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales manifest'.includes(query.toLowerCase()) || query.toLowerCase().includes('sales manifest')) {
        return [{
          id: 'pos-sales-manifest',
          label: 'Sales Manifest',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-manifest',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales & Cash Summary',
    access: { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.FUEL_STATION, MODULES.POINT_OF_SALE] },
    search: async (query: string, ctx?: SearchAccessContext) => {
      if (!hasModule(ctx, MODULES.FUEL_STATION) && !hasModule(ctx, MODULES.POINT_OF_SALE)) return [];
      if (!canOrg(ctx, PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales & cash summary'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('sales & cash summary') || 
          query.toLowerCase().includes('sales and cash summary')) {
        return [{
          id: 'pos-sales-cash-summary',
          label: 'Sales & Cash Summary',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-cash-summary',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
];

// ==================== ACCOUNTING & FINANCE CONFIGURATIONS ====================

const accountingConfigs = [
  {
    type: 'ledger',
    label: 'Ledger',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string) => {
      try {
        const data = await ledgerServices.getLedgers({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('ledgers'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Ledger',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Ledger',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'budget',
    label: 'Budget',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string) => {
      try {
        const data = await budgetsServices.getBudgets({ keyword: query, limit: 5 });
        const menuItem = '/en-US/accounts/budgets';
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Budget',
              url: `${menuItem}?search=${encodeURIComponent(query)}`,
              description: 'Budget',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'transaction',
    label: 'Transaction',
    access: { orgPermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    search: async (query: string, onPartialResult?: (partial: any[]) => void) => {
      try {
        const types = ['payments', 'receipts', 'journal_vouchers', 'debit', 'credit'];
        const menuItem = '/en-US/accounts/transactions';
        let allResults: any[] = [];

        // If query matches a type, return a direct result for that type
        const typeMatch = types.concat('transfers').find(type => type.replace('_', ' ').toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(type.replace('_', ' ')));
        if (typeMatch) {
          const label = typeMatch.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          return [{
            id: `type-${typeMatch}`,
            label: label,
            type: `Transaction Type`,
            url: `${menuItem}?type=${typeMatch}`,
            description: `Search all ${label}`,
          }];
        }

        // Fetch non-transfer types in parallel
        const fetches = types.map(async (type) => {
          const service = (await import('@/components/accounts/transactions/transactions-services')).default;
          const data = await service.getList({ keyword: query, limit: 10, type });
          let results: any[] = [];
          if (Array.isArray(data?.data)) {
            results = data.data.map((item: any) => ({
              id: item.id,
              label: item.voucherNo || item.transactionNo || item.reference || item.narration || item.id,
              type: `Transaction (${type.replace('_', ' ')})`,
              url: `${menuItem}?type=${type}&search=${encodeURIComponent(query)}`,
              description: `Transaction - ${type.replace('_', ' ')}`,
            }));
            allResults = allResults.concat(results);
            if (onPartialResult) onPartialResult([...allResults]);
          }
        });
        // Start fetching transfers in parallel, but don't block others
        const transferPromise = (async () => {
          const service = (await import('@/components/accounts/transactions/transactions-services')).default;
          const data = await service.getList({ keyword: query, limit: 10, type: 'transfers' });
          let results: any[] = [];
          if (Array.isArray(data?.data)) {
            results = data.data.map((item: any) => ({
              id: item.id,
              label: item.voucherNo || item.transactionNo || item.reference || item.narration || item.id,
              type: `Transaction (transfers)`,
              url: `${menuItem}?type=transfers&search=${encodeURIComponent(query)}`,
              description: `Transaction - transfers`,
            }));
            allResults = allResults.concat(results);
            if (onPartialResult) onPartialResult([...allResults]);
          }
        })();
        await Promise.all(fetches);
        await transferPromise;
        return allResults;
      } catch {
        return [];
      }
    },
  },
];

// ==================== GENERIC MENU CONFIGURATIONS ====================

const genericMenuConfigs = [
  ...masterDataConfigs,
  ...financialReportsConfigs,
  ...procurementConfigs,
  ...projectConfigs,
  ...hrUserConfigs,
  ...productConfigs,
  ...posConfigs,
  ...fuelStationConfigs,
  ...accountingConfigs,
  ...staticMenuItems
    .filter(item => !deepEntityTypes.some(type => item.label.toLowerCase().includes(type)))
    .map(item => ({
      type: item.label,
      label: item.label,
      search: async (query: string) => {
        if (item.label.toLowerCase().includes(query.toLowerCase())) {
          return [{
            id: item.uri,
            label: item.label,
            type: item.label,
            url: `${item.uri}?search=${encodeURIComponent(query)}`,
          }];
        }
        return [];
      },
    })),
];

export const entityConfigs: EntityConfig[] = [
  ...genericMenuConfigs
];