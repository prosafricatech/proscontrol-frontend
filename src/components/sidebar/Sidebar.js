'use client';

import { JumboScrollbar } from '@jumbo/components/JumboScrollbar';
import { Div } from '@jumbo/shared';
import React, { Suspense } from 'react';
import { SidebarHeader } from './sidebarHeader';
import { SidebarSkeleton } from './sidebarSkeleton';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import JumboVerticalNavbar from '@jumbo/components/JumboVerticalNavbar/JumboVerticalNavbar';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Box } from '@mui/material';
import JumboSearch from '@jumbo/components/JumboSearch';

const collapseMenusByModule = (items, dictionary) => {
    const homeLabel = dictionary.sidebar.menu.home;

    return items.flatMap((item) => {
        if (item?.type !== 'section') {
            return item ? [item] : [];
        }

        const children = Array.isArray(item.children) ? item.children : [];

        if (children.length === 0) {
            return [];
        }

        if (item.label === homeLabel) {
            return children;
        }

        return [
            {
                ...item,
                type: 'collapsible',
                children,
            },
        ];
    });
};

const filterMenuItems = (items, searchTerm, translateLabel) => {
    const normalizedSearch = searchTerm?.trim().toLowerCase();

    if (!normalizedSearch) {
        return items;
    }

    return items.flatMap((item) => {
        if (!item) {
            return [];
        }

        const labelText = typeof translateLabel === 'function' ? translateLabel(item) : item.label || '';
        const uriText = item.uri || '';
        const matchesSelf = `${labelText} ${uriText}`.toLowerCase().includes(normalizedSearch);

        const children = Array.isArray(item.children)
            ? filterMenuItems(item.children, normalizedSearch, translateLabel)
            : [];

        if (matchesSelf || children.length > 0) {
            return [{ ...item, children: children.length > 0 ? children : item.children }];
        }

        return [];
    });
};

function Sidebar({ menus }) {
    const dictionary = useDictionary();
    const { t } = useTranslation();
    const [menuItems, setMenuItems] = React.useState(menus);
    const [searchTerm, setSearchTerm] = React.useState('');
    const { authOrganization, checkPermission, checkOrganizationPermission, organizationHasSubscribed, authUser } = useJumboAuth();

    React.useEffect(() => {
        let updatedMenus = [...menus.filter(menu => menu.label === dictionary.sidebar.menu.home)];

        if (authOrganization?.organization?.name) {

            if (organizationHasSubscribed(MODULES.PROCESS_APPROVAL)) {
                //Process Approval sections
                updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.processApproval)];

                const processApprovalMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.processApproval);

                if (!checkOrganizationPermission([PERMISSIONS.REQUISITIONS_CREATE, PERMISSIONS.REQUISITIONS_EDIT, PERMISSIONS.REQUISITIONS_DELETE, PERMISSIONS.REQUISITIONS_EDIT])) {
                    if (processApprovalMenuIndex >= 0) {
                        updatedMenus[processApprovalMenuIndex].children = updatedMenus[processApprovalMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.requisitions
                        );
                    }
                }
                if (!checkOrganizationPermission([PERMISSIONS.APPROVED_REQUISITIONS_PAY, PERMISSIONS.APPROVED_REQUISITIONS_PURCHASE, PERMISSIONS.IMPREST_RETIREMENTS_READ, PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE, PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ, PERMISSIONS.PURCHASES_CREATE])) {
                    if (processApprovalMenuIndex >= 0) {
                        updatedMenus[processApprovalMenuIndex].children = updatedMenus[processApprovalMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.approvals
                        );
                    }
                }
                if (!checkOrganizationPermission(PERMISSIONS.IMPREST_RETIREMENTS_READ)) {
                    if (processApprovalMenuIndex >= 0) {
                        updatedMenus[processApprovalMenuIndex].children = updatedMenus[processApprovalMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.retirements
                        );
                    }
                }

                // Process Approval > Leave Requests / Loan Requests — no permission gate
                // at all (beyond the Process Approval subscription check already applied
                // above): approving here is meant to work purely off holding a role that
                // sits on the request's approval chain, with no LeaveRequests/Loans grant
                // required (see LeaveRequestApprovalController::store()'s/
                // LoanRequestApprovalController::store()'s dropped ability middleware) —
                // gating the link itself behind one of those same abilities would put HR
                // right back where a Technical-Manager-style chain-only approver never
                // sees the link at all. WHICH requests show up once opened is entirely
                // LeaveRequestController::index()'s/LoanRequestController::index()'s job
                // (creator, no-chain, or their role sits on the chain).

                // Process Approval > Payroll — no dedicated "approve" ability exists on
                // the backend for payroll runs, so this reuses the same ability that
                // gates the HR menu's own Payroll Runs entry.
                if (!checkOrganizationPermission(PERMISSIONS.PAYROLLRUNS_CREATE)) {
                    if (processApprovalMenuIndex >= 0) {
                        updatedMenus[processApprovalMenuIndex].children = updatedMenus[processApprovalMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.payroll_runs
                        );
                    }
                }

                const hasApprovalMasters = checkOrganizationPermission([
                    PERMISSIONS.APPROVAL_CHAINS_CREATE,
                    PERMISSIONS.APPROVAL_CHAINS_READ,
                    PERMISSIONS.APPROVAL_CHAINS_EDIT,
                    PERMISSIONS.APPROVAL_CHAINS_DEACTIVATE,
                ]);

                // Process Approval > Masters
                if (!hasApprovalMasters) {
                    if (processApprovalMenuIndex >= 0) {
                        updatedMenus[processApprovalMenuIndex].children = updatedMenus[processApprovalMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }

                //Project Management  > Masters > Product Categories
                if (!hasApprovalMasters) {
                    if (processApprovalMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[processApprovalMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[processApprovalMenuIndex].children[mastersIndex].children = updatedMenus[processApprovalMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.approvalChains
                            );
                        }
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.POINT_OF_SALE)) {
                //PoS
                if (checkOrganizationPermission(
                    [
                        PERMISSIONS.SALES_READ,
                        PERMISSIONS.PROFORMA_INVOICES_READ,
                        PERMISSIONS.OUTLETS_READ,
                        PERMISSIONS.PRICE_LISTS_READ,
                        PERMISSIONS.SALES_REPORTS
                    ])) {
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.pos)];
                }

                //PoS > Counter/Sales
                if (!checkOrganizationPermission([PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_EDIT, PERMISSIONS.SALES_COMPLETE, PERMISSIONS.SALES_READ])) {
                    const posMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.pos);
                    if (posMenuIndex >= 0) {
                        const salesIndex = updatedMenus[posMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.salesCounter);
                        if (salesIndex >= 0) {
                            updatedMenus[posMenuIndex].children[salesIndex].children = updatedMenus[posMenuIndex].children[salesIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.salesCounter
                            );
                        }
                    }
                }

                // PoS > Proformas
                if (!checkOrganizationPermission([PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_EDIT, PERMISSIONS.SALES_COMPLETE, PERMISSIONS.SALES_READ])) {
                    const posMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.pos);
                    if (posMenuIndex >= 0) {
                        updatedMenus[posMenuIndex].children = updatedMenus[posMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.salesCounter
                        );
                        const salesIndex = updatedMenus[posMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.salesCounter);
                        if (salesIndex >= 0) {
                            updatedMenus[posMenuIndex].children[salesIndex].children = updatedMenus[posMenuIndex].children[salesIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.proformas
                            );
                        }
                    }
                }

                // PoS > Reports
                if (!checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) {
                    const posMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.pos);
                    if (posMenuIndex >= 0) {
                        updatedMenus[posMenuIndex].children = updatedMenus[posMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.reports
                        );
                    }
                }

                // PoS > Masters
                if (!checkOrganizationPermission([PERMISSIONS.OUTLETS_READ, PERMISSIONS.POS_SETTINGS, PERMISSIONS.PRICE_LISTS_READ, PERMISSIONS.PRICE_LISTS_CREATE])) {
                    const posMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.pos);
                    if (posMenuIndex >= 0) {
                        updatedMenus[posMenuIndex].children = updatedMenus[posMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }

                // PoS > Masters > Outlets
                if (!checkOrganizationPermission(PERMISSIONS.OUTLETS_READ)) {
                    const posMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.pos);
                    if (posMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[posMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[posMenuIndex].children[mastersIndex].children = updatedMenus[posMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.outlets
                            );
                        }
                    }
                }

                //PoS > Masters > PriceLists
                if (!checkOrganizationPermission([PERMISSIONS.PRICE_LISTS_READ, PERMISSIONS.PRICE_LISTS_CREATE, PERMISSIONS.PRICE_LISTS_EDIT, PERMISSIONS.PRICE_LISTS_DELETE])) {
                    const posMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.pos);
                    if (posMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[posMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[posMenuIndex].children[mastersIndex].children = updatedMenus[posMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.priceLists
                            );
                        }
                    }
                }

                // PoS > Masters > Settings
                if (!checkOrganizationPermission(PERMISSIONS.POS_SETTINGS)) {
                    const posMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.pos);
                    if (posMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[posMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[posMenuIndex].children[mastersIndex].children = updatedMenus[posMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.settings
                            );
                        }
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.FUEL_STATION)) {
                //Fuel Station
                if (checkOrganizationPermission(
                    [
                        PERMISSIONS.FUEL_STATIONS_READ,
                        PERMISSIONS.FUEL_STATIONS_CREATE,
                        PERMISSIONS.FUEL_STATIONS_UPDATE,
                        PERMISSIONS.FUEL_STATIONS_DELETE,
                        PERMISSIONS.FUEL_SALES_SHIFTS_READ,
                        PERMISSIONS.FUEL_SALES_SHIFTS_CREATE,
                        PERMISSIONS.FUEL_SALES_SHIFTS_UPDATE,
                        PERMISSIONS.FUEL_SALES_SHIFTS_CLOSE,
                        PERMISSIONS.FUEL_SALES_SHIFTS_DELETE,
                    ])) {
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.fuelStations)];
                }

                // Fuel Station > Sales Shift
                if (!checkOrganizationPermission([
                    PERMISSIONS.FUEL_SALES_SHIFTS_READ,
                    PERMISSIONS.FUEL_SALES_SHIFTS_CREATE,
                    PERMISSIONS.FUEL_SALES_SHIFTS_UPDATE,
                    PERMISSIONS.FUEL_SALES_SHIFTS_DELETE,
                ])) {
                    const fuelStationMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fuelStations);
                    if (fuelStationMenuIndex >= 0) {
                        updatedMenus[fuelStationMenuIndex].children = updatedMenus[fuelStationMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.salesShifts
                        );
                    }
                }

                // Fuel Station > Masters
                if (!checkOrganizationPermission([
                    PERMISSIONS.FUEL_STATIONS_READ,
                    PERMISSIONS.FUEL_STATIONS_CREATE,
                    PERMISSIONS.FUEL_STATIONS_UPDATE,
                    PERMISSIONS.FUEL_STATIONS_DELETE,
                    PERMISSIONS.PRICE_LISTS_READ,
                    PERMISSIONS.PRICE_LISTS_CREATE,
                    PERMISSIONS.PRICE_LISTS_EDIT,
                    PERMISSIONS.PRICE_LISTS_DELETE
                ])) {
                    const fuelStationMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fuelStations);
                    if (fuelStationMenuIndex >= 0) {
                        updatedMenus[fuelStationMenuIndex].children = updatedMenus[fuelStationMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }

                // Fuel Station > Masters > Fuel Stations
                if (!checkOrganizationPermission([
                    PERMISSIONS.FUEL_STATIONS_READ,
                    PERMISSIONS.FUEL_STATIONS_CREATE,
                    PERMISSIONS.FUEL_STATIONS_UPDATE,
                    PERMISSIONS.FUEL_STATIONS_DELETE,
                ])) {
                    const fuelStationMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fuelStations);
                    if (fuelStationMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[fuelStationMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[fuelStationMenuIndex].children[mastersIndex].children = updatedMenus[fuelStationMenuIndex].children[mastersIndex].children.filter(
                                child => child.label !== dictionary.sidebar.menuItem.stations
                            );
                        }
                    }
                }

                //fuelStations > Masters > PriceLists
                if (!checkOrganizationPermission([PERMISSIONS.PRICE_LISTS_READ, PERMISSIONS.PRICE_LISTS_CREATE, PERMISSIONS.PRICE_LISTS_EDIT, PERMISSIONS.PRICE_LISTS_DELETE])) {
                    const fuelStationMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fuelStations);
                    if (fuelStationMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[fuelStationMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[fuelStationMenuIndex].children[mastersIndex].children = updatedMenus[fuelStationMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.priceLists
                            );
                        }
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING)) {
                //Manufacturing & Processing
                if (checkOrganizationPermission([
                    PERMISSIONS.BOM_READ,
                    PERMISSIONS.BOM_CREATE,
                    PERMISSIONS.BOM_EDIT,
                    PERMISSIONS.BOM_DELETE,
                    PERMISSIONS.PRODUCTION_BATCHES_CREATE,
                    PERMISSIONS.PRODUCTION_BATCHES_READ,
                    PERMISSIONS.PRODUCTION_BATCHES_EDIT,
                    PERMISSIONS.PRODUCTION_BATCHES_DELETE,
                    PERMISSIONS.MANUFACTURING_ORDERS_CREATE,
                    PERMISSIONS.MANUFACTURING_ORDERS_READ,
                    PERMISSIONS.MANUFACTURING_ORDERS_EDIT,
                    PERMISSIONS.MANUFACTURING_ORDERS_DELETE,
                ])) {
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.manufacturing)];
                }

                // Manufacturing & Processing > Manufacturing Orders
                if (!checkOrganizationPermission([
                    PERMISSIONS.PRODUCTION_BATCHES_CREATE,
                    PERMISSIONS.PRODUCTION_BATCHES_EDIT,
                    PERMISSIONS.PRODUCTION_BATCHES_READ,
                    PERMISSIONS.PRODUCTION_BATCHES_DELETE,
                ])) {
                    const manufacturingMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.manufacturing);
                    if (manufacturingMenuIndex >= 0) {
                        updatedMenus[manufacturingMenuIndex].children = updatedMenus[manufacturingMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.boms
                        );
                    }
                }

                const hasProjectMasters = checkOrganizationPermission([
                    PERMISSIONS.PRODUCT_CATEGORIES_READ,
                    PERMISSIONS.PROJECT_CATEGORIES_CREATE,
                    PERMISSIONS.PROJECT_CATEGORIES_EDIT,
                    PERMISSIONS.PROJECT_CATEGORIES_DELETE,
                ]);

                // Project Management > Masters
                if (!hasProjectMasters) {
                    const projectsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.projectManagement);
                    if (projectsMenuIndex >= 0) {
                        updatedMenus[projectsMenuIndex].children = updatedMenus[projectsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }

                //Project Management  > Masters > Product Categories
                if (!hasProjectMasters) {
                    const projectsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.projectManagement);
                    if (projectsMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[projectsMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[projectsMenuIndex].children[mastersIndex].children = updatedMenus[projectsMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.projectCategories
                            );
                        }
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT)) {
                //Project Management
                if (checkOrganizationPermission([
                    PERMISSIONS.PROJECTS_READ,
                    PERMISSIONS.PROJECTS_CREATE,
                    PERMISSIONS.PROJECTS_EDIT,
                    PERMISSIONS.PROJECTS_DELETE,
                    PERMISSIONS.PROJECT_CATEGORIES_EDIT,
                    PERMISSIONS.PROJECT_CATEGORIES_CREATE,
                    PERMISSIONS.PROJECT_CATEGORIES_READ,
                    PERMISSIONS.PROJECT_CATEGORIES_EDIT,
                    PERMISSIONS.PROJECT_CATEGORIES_DELETE,
                ])) {
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.projectManagement)];
                }

                // Project Management > Projects
                if (!checkOrganizationPermission([
                    PERMISSIONS.PROJECTS_READ,
                    PERMISSIONS.PROJECTS_CREATE,
                    PERMISSIONS.PROJECTS_EDIT,
                    PERMISSIONS.PROJECTS_DELETE,
                ])) {
                    const projectsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.projectManagement);
                    if (projectsMenuIndex >= 0) {
                        updatedMenus[projectsMenuIndex].children = updatedMenus[projectsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.projects
                        );
                    }
                }

                const hasProjectMasters = checkOrganizationPermission([
                    PERMISSIONS.PROJECT_CATEGORIES_READ,
                    PERMISSIONS.PROJECT_CATEGORIES_CREATE,
                    PERMISSIONS.PROJECT_CATEGORIES_EDIT,
                    PERMISSIONS.PROJECT_CATEGORIES_DELETE,
                ]);

                // Project Management > Masters
                if (!hasProjectMasters) {
                    const projectsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.projectManagement);
                    if (projectsMenuIndex >= 0) {
                        updatedMenus[projectsMenuIndex].children = updatedMenus[projectsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }

                //Project Management  > Masters > Product Categories
                if (!hasProjectMasters) {
                    const projectsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.projectManagement);
                    if (projectsMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[projectsMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[projectsMenuIndex].children[mastersIndex].children = updatedMenus[projectsMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.projectCategories
                            );
                        }
                    }
                }

                // Project Management > Approved Subcontract Certificates
                if (!checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACT_CERTIFICATES_APPROVE)) {
                    const projectsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.projectManagement);
                    if (projectsMenuIndex >= 0) {
                        updatedMenus[projectsMenuIndex].children = updatedMenus[projectsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.approvedSubcontractCertificates
                        );
                    }
                }

                // Project Management > Approved Project Payment Claims
                if (!checkOrganizationPermission(PERMISSIONS.PROJECT_PAYMENT_CLAIMS_APPROVE)) {
                    const projectsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.projectManagement);
                    if (projectsMenuIndex >= 0) {
                        updatedMenus[projectsMenuIndex].children = updatedMenus[projectsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.approvedProjectPaymentClaims
                        );
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {

                //Accounts
                if (checkOrganizationPermission(
                    [
                        PERMISSIONS.ACCOUNTS_MASTERS_READ,
                        PERMISSIONS.ACCOUNTS_MASTERS_CREATE,
                        PERMISSIONS.ACCOUNTS_MASTERS_READ,
                        PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
                        PERMISSIONS.ACCOUNTS_REPORTS,
                        PERMISSIONS.BUDGETS_READ,
                    ])) {
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance)];
                }

                // Accounts > Transactions
                if (!checkOrganizationPermission([
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
                    PERMISSIONS.PAYMENTS_READ,
                    PERMISSIONS.PAYMENTS_CREATE,
                    PERMISSIONS.PAYMENTS_EDIT,
                    PERMISSIONS.PAYMENTS_DELETE,
                    PERMISSIONS.FUND_TRANSFERS_READ,
                    PERMISSIONS.FUND_TRANSFERS_CREATE,
                    PERMISSIONS.FUND_TRANSFERS_DELETE,
                    PERMISSIONS.FUND_TRANSFERS_EDIT,
                    PERMISSIONS.RECEIPTS_READ,
                    PERMISSIONS.RECEIPTS_EDIT,
                    PERMISSIONS.RECEIPTS_CREATE,
                    PERMISSIONS.RECEIPTS_DELETE,
                    PERMISSIONS.JOURNAL_VOUCHERS_READ,
                    PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
                    PERMISSIONS.JOURNAL_VOUCHERS_DELETE,
                    PERMISSIONS.JOURNAL_VOUCHERS_EDIT,
                ])) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);
                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.transactions
                        );
                    }
                }

                //Accounts > Transactions
                if (!checkOrganizationPermission([
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
                    PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
                    PERMISSIONS.PAYMENTS_READ,
                    PERMISSIONS.PAYMENTS_CREATE,
                    PERMISSIONS.PAYMENTS_EDIT,
                    PERMISSIONS.PAYMENTS_DELETE,
                    PERMISSIONS.FUND_TRANSFERS_READ,
                    PERMISSIONS.FUND_TRANSFERS_CREATE,
                    PERMISSIONS.FUND_TRANSFERS_DELETE,
                    PERMISSIONS.FUND_TRANSFERS_EDIT,
                    PERMISSIONS.RECEIPTS_READ,
                    PERMISSIONS.RECEIPTS_EDIT,
                    PERMISSIONS.RECEIPTS_CREATE,
                    PERMISSIONS.RECEIPTS_DELETE,
                    PERMISSIONS.JOURNAL_VOUCHERS_READ,
                    PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
                    PERMISSIONS.JOURNAL_VOUCHERS_DELETE,
                    PERMISSIONS.JOURNAL_VOUCHERS_EDIT,
                ])) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);
                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.transactions
                        );
                    }
                }

                // Accounts > Bank Reconciliation
                if (!checkOrganizationPermission([
                    PERMISSIONS.BANK_RECONCILIATION_READ,
                    PERMISSIONS.BANK_RECONCILIATION_CREATE,
                    PERMISSIONS.BANK_RECONCILIATION_EDIT,
                    PERMISSIONS.BANK_RECONCILIATION_DELETE,
                ])) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);
                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.bankReconciliation
                        );
                    }
                }

                //Accounts > Supplier Bills
                if (
                    !authOrganization?.organization?.settings?.defer_grn_billing ||
                    !checkOrganizationPermission([
                        PERMISSIONS.PURCHASES_READ,
                        PERMISSIONS.PURCHASES_CREATE,
                    ])
                ) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);
                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.supplierBills
                        );
                    }
                }

                //Accounts > Approved Payments
                if (!organizationHasSubscribed(MODULES.PROCESS_APPROVAL)) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);

                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.approvedPayments
                        );
                    }
                }

                //Accounts > Approved Payroll Runs
                if (!organizationHasSubscribed([MODULES.HUMAN_RESOURCES, MODULES.ACCOUNTS_AND_FINANCE]) && !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE) && !checkOrganizationPermission([PERMISSIONS.PAYROLL_READ, PERMISSIONS.PAYROLLRUNS_CREATE])) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);

                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.approvedPayrollRuns
                        );
                    }
                }

                //Accounts > Approved Loans
                if (!organizationHasSubscribed([MODULES.HUMAN_RESOURCES, MODULES.ACCOUNTS_AND_FINANCE]) && !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE) && !checkOrganizationPermission(PERMISSIONS.LOANS_READ)) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);

                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.approvedLoans
                        );
                    }
                }

                // Accounts > Masters
                if (!checkOrganizationPermission([PERMISSIONS.ACCOUNTS_MASTERS_READ, PERMISSIONS.ACCOUNTS_MASTERS_CREATE])) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);
                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }

                // Accounts > Reports
                if (!checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) {
                    const accountsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.accounts_and_finance);
                    if (accountsMenuIndex >= 0) {
                        updatedMenus[accountsMenuIndex].children = updatedMenus[accountsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.reports
                        );
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.ASSET_REGISTER)) {

                //Fixed Assets
                if (checkOrganizationPermission(
                    [
                        PERMISSIONS.ASSETS_READ,
                        PERMISSIONS.ASSETS_CREATE,
                        PERMISSIONS.ASSETS_EDIT,
                        PERMISSIONS.ASSETS_DELETE,
                        PERMISSIONS.ASSETS_SETUP,
                        PERMISSIONS.ASSETS_DEPRECIATE,
                        PERMISSIONS.ASSETS_DISPOSE,
                    ])) {
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.fixedAssets)];
                }

                // Fixed Assets > Asset Register
                if (!checkOrganizationPermission([
                    PERMISSIONS.ASSETS_READ,
                    PERMISSIONS.ASSETS_CREATE,
                    PERMISSIONS.ASSETS_EDIT,
                    PERMISSIONS.ASSETS_DELETE,
                ])) {
                    const fixedAssetsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fixedAssets);
                    if (fixedAssetsMenuIndex >= 0) {
                        updatedMenus[fixedAssetsMenuIndex].children = updatedMenus[fixedAssetsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.assetRegister
                        );
                    }
                }

                // Fixed Assets > Depreciation Runs
                if (!checkOrganizationPermission([
                    PERMISSIONS.ASSETS_READ,
                    PERMISSIONS.ASSETS_DEPRECIATE,
                ])) {
                    const fixedAssetsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fixedAssets);
                    if (fixedAssetsMenuIndex >= 0) {
                        updatedMenus[fixedAssetsMenuIndex].children = updatedMenus[fixedAssetsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.depreciationRuns
                        );
                    }
                }

                // Fixed Assets > Reports
                if (!checkOrganizationPermission(PERMISSIONS.ASSETS_READ)) {
                    const fixedAssetsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fixedAssets);
                    if (fixedAssetsMenuIndex >= 0) {
                        updatedMenus[fixedAssetsMenuIndex].children = updatedMenus[fixedAssetsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.assetReports
                        );
                    }
                }

                // Fixed Assets > Masters (GL Mappings)
                if (!checkOrganizationPermission(PERMISSIONS.ASSETS_SETUP)) {
                    const fixedAssetsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.fixedAssets);
                    if (fixedAssetsMenuIndex >= 0) {
                        updatedMenus[fixedAssetsMenuIndex].children = updatedMenus[fixedAssetsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
                //Procurement & Supply
                if (checkOrganizationPermission(
                    [
                        PERMISSIONS.PURCHASES_READ,
                        PERMISSIONS.PURCHASES_CREATE,
                        PERMISSIONS.PURCHASES_RECEIVE,
                        PERMISSIONS.PURCHASES_UNRECEIVE,
                        PERMISSIONS.RFQS_READ,
                        PERMISSIONS.RFQS_CREATE,
                        PERMISSIONS.RFQS_EDIT,
                        PERMISSIONS.RFQS_DELETE,
                        PERMISSIONS.PRODUCTS_READ,
                        PERMISSIONS.PRODUCTS_CREATE,
                        PERMISSIONS.PRODUCT_CATEGORIES_READ,
                        PERMISSIONS.PRODUCT_CATEGORIES_CREATE,
                        PERMISSIONS.STORES_READ,
                        PERMISSIONS.INVENTORY_TRANSFERS_READ,
                        PERMISSIONS.INVENTORY_TRANSFERS_CREATE,
                        PERMISSIONS.STORES_CREATE,
                        PERMISSIONS.INVENTORY_CONSUMPTIONS_READ,
                        PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE
                    ])) {
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply)];
                }

                // Procurement > Purchases
                if (!checkOrganizationPermission([
                    PERMISSIONS.PURCHASES_READ,
                    PERMISSIONS.PURCHASES_CREATE,
                    PERMISSIONS.PURCHASES_RECEIVE,
                    PERMISSIONS.PURCHASES_UNRECEIVE
                ])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        updatedMenus[procurementsMenuIndex].children = updatedMenus[procurementsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.purchases
                        );
                    }
                }

                // Procurement > RFQs
                if (!checkOrganizationPermission([
                    PERMISSIONS.RFQS_READ,
                    PERMISSIONS.RFQS_CREATE,
                    PERMISSIONS.RFQS_EDIT,
                    PERMISSIONS.RFQS_DELETE
                ])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        updatedMenus[procurementsMenuIndex].children = updatedMenus[procurementsMenuIndex].children.filter(
                            child => child.label !== 'RFQs'
                        );
                    }
                }

                //Accounts > Approved Payments
                if (!organizationHasSubscribed(MODULES.PROCESS_APPROVAL)) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        updatedMenus[procurementsMenuIndex].children = updatedMenus[procurementsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.approvedPurchases
                        );
                    }
                }


                //Procurement > Purchases > Purchases List
                if (!checkOrganizationPermission([
                    PERMISSIONS.PURCHASES_READ,
                    PERMISSIONS.PURCHASES_CREATE,
                    PERMISSIONS.PURCHASES_RECEIVE,
                    PERMISSIONS.PURCHASES_UNRECEIVE
                ])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        updatedMenus[procurementsMenuIndex].children = updatedMenus[procurementsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.purchases
                        );
                    }
                }

                //Procurement > Reports
                if (!checkOrganizationPermission(PERMISSIONS.PURCHASES_REPORTS)) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        updatedMenus[procurementsMenuIndex].children = updatedMenus[procurementsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.reports
                        );
                    }
                }

                //Procurement > Inventory Consumptions
                if (!checkOrganizationPermission([PERMISSIONS.INVENTORY_CONSUMPTIONS_READ, PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        updatedMenus[procurementsMenuIndex].children = updatedMenus[procurementsMenuIndex].children.filter(
                            item => item.label !== dictionary.sidebar.menuItem.consumptions
                        );
                    }
                }


                // Procurement > Masters
                if (!checkOrganizationPermission([
                    PERMISSIONS.PRODUCT_CATEGORIES_READ,
                    PERMISSIONS.STORES_READ,
                    PERMISSIONS.INVENTORY_TRANSFERS_READ,
                    PERMISSIONS.INVENTORY_TRANSFERS_CREATE,
                    PERMISSIONS.PRODUCTS_READ,
                    PERMISSIONS.INVENTORY_CONSUMPTIONS_READ,
                    PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE
                ])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        updatedMenus[procurementsMenuIndex].children = updatedMenus[procurementsMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.masters
                        );
                    }
                }


                //Procurement > Masters > Product Categories
                if (!checkOrganizationPermission([PERMISSIONS.PRODUCT_CATEGORIES_READ, PERMISSIONS.PRODUCT_CATEGORIES_CREATE])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[procurementsMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[procurementsMenuIndex].children[mastersIndex].children = updatedMenus[procurementsMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.product_categories
                            );
                        }
                    }
                }

                //Procurement > Masters > Products
                if (!checkOrganizationPermission([PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_CREATE])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[procurementsMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[procurementsMenuIndex].children[mastersIndex].children = updatedMenus[procurementsMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.products
                            );
                        }
                    }
                }

                //Procurement > Masters > Stores
                if (!checkOrganizationPermission([PERMISSIONS.STORES_READ, PERMISSIONS.STORES_CREATE, PERMISSIONS.INVENTORY_TRANSFERS_READ, PERMISSIONS.INVENTORY_TRANSFERS_CREATE, PERMISSIONS.INVENTORY_CONSUMPTIONS_READ, PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE])) {
                    const procurementsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.procurementAndSupply);
                    if (procurementsMenuIndex >= 0) {
                        const mastersIndex = updatedMenus[procurementsMenuIndex].children.findIndex(child => child.label === dictionary.sidebar.menuItem.masters);
                        if (mastersIndex >= 0) {
                            updatedMenus[procurementsMenuIndex].children[mastersIndex].children = updatedMenus[procurementsMenuIndex].children[mastersIndex].children.filter(
                                item => item.label !== dictionary.sidebar.menuItem.stores
                            );
                        }
                    }
                }
            }

            if (organizationHasSubscribed(MODULES.HUMAN_RESOURCES)) {
                if (checkOrganizationPermission([
                    PERMISSIONS.EMPLOYEES_READ,
                    PERMISSIONS.EMPLOYEES_CREATE,
                    PERMISSIONS.EMPLOYEES_UPDATE,
                    PERMISSIONS.EMPLOYEES_DELETE,
                    PERMISSIONS.PAYROLLRUNS_CREATE,
                    PERMISSIONS.PAYROLL_READ,
                    PERMISSIONS.LEAVE_ALLOCATIONS_READ,
                    PERMISSIONS.LOANS_READ,
                    PERMISSIONS.LEAVE_REQUESTS_READ
                ])) {
                    // Human Resources
                    updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.humanResources)];
                }


                // HR > Employee
                if (!checkOrganizationPermission([
                    PERMISSIONS.EMPLOYEES_READ,
                    PERMISSIONS.EMPLOYEES_CREATE,
                    PERMISSIONS.EMPLOYEES_UPDATE,
                    PERMISSIONS.EMPLOYEES_DELETE
                ])) {
                    const hrMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.humanResources);
                    if (hrMenuIndex >= 0) {
                        updatedMenus[hrMenuIndex].children = updatedMenus[hrMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.employees
                        );
                    }
                }

                // HR > leave requests
                if (!checkOrganizationPermission([
                    PERMISSIONS.LEAVE_REQUESTS_CREATE,
                    PERMISSIONS.LEAVE_REQUESTS_DELETE,
                    PERMISSIONS.LEAVE_REQUESTS_READ,
                    PERMISSIONS.LEAVE_REQUESTS_EDIT,
                ])) {
                    const hrMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.humanResources);
                    if (hrMenuIndex >= 0) {
                        updatedMenus[hrMenuIndex].children = updatedMenus[hrMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.leave_requests
                        );
                    }
                }

                // HR > loan requests
                if (!checkOrganizationPermission([
                    PERMISSIONS.LOANS_CREATE,
                    PERMISSIONS.LOANS_READ, PERMISSIONS.LOANS_EDIT, PERMISSIONS.LOANS_DELETE
                ])) {
                    const hrMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.humanResources);
                    if (hrMenuIndex >= 0) {
                        updatedMenus[hrMenuIndex].children = updatedMenus[hrMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.loan_requests
                        );
                    }
                }

                // HR > payrollrun
                if (!checkOrganizationPermission([
                    PERMISSIONS.PAYROLL_READ,
                    PERMISSIONS.PAYROLLRUNS_CREATE
                ])) {
                    const hrMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.humanResources);
                    if (hrMenuIndex >= 0) {
                        updatedMenus[hrMenuIndex].children = updatedMenus[hrMenuIndex].children.filter(
                            child => child.label !== dictionary.sidebar.menuItem.payroll
                        );
                    }
                }
            }

            //Tools
            if (authOrganization?.organization?.active_subscriptions?.length > 0 && checkOrganizationPermission(
                [
                    PERMISSIONS.FILES_SHELF_BROWSE,
                ])) {
                updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.tools)];
            }

            // Procurement > Purchases
            if (!checkOrganizationPermission(PERMISSIONS.FILES_SHELF_BROWSE)) {
                const toolsMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.tools);
                if (toolsMenuIndex >= 0) {
                    updatedMenus[toolsMenuIndex].children = updatedMenus[toolsMenuIndex].children.filter(
                        child => child.label !== dictionary.sidebar.menuItem.filesShelf
                    );
                }
            }

            //Masters
            if (authOrganization?.organization?.active_subscriptions?.length > 0 && checkOrganizationPermission(
                [
                    PERMISSIONS.STAKEHOLDERS_READ,
                    PERMISSIONS.MEASUREMENT_UNITS_READ,
                    PERMISSIONS.ACCOUNTS_MASTERS_CREATE,
                ])
            ) {
                updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menuItem.masters)];
            }

            // Masters > Stakeholders > List
            if (!checkOrganizationPermission([PERMISSIONS.STAKEHOLDERS_READ, PERMISSIONS.STAKEHOLDERS_CREATE])) {
                const mastersMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menuItem.masters);
                if (mastersMenuIndex >= 0) {
                    const stakeholdersMenuIndex = updatedMenus[mastersMenuIndex].children.findIndex(child => child.label === 'Stakeholders');
                    if (stakeholdersMenuIndex >= 0) {
                        updatedMenus[mastersMenuIndex].children[stakeholdersMenuIndex].children = updatedMenus[mastersMenuIndex].children[stakeholdersMenuIndex].children.filter(
                            item => item.label !== 'List'
                        );
                    }
                }
            }

            // Masters > Stakeholders > Groups
            if (!checkOrganizationPermission(PERMISSIONS.STAKEHOLDER_GROUPS_READ)) {
                const mastersMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menuItem.masters);
                if (mastersMenuIndex >= 0) {
                    const stakeholdersMenuIndex = updatedMenus[mastersMenuIndex].children.findIndex(child => child.label === 'Stakeholders');
                    if (stakeholdersMenuIndex >= 0) {
                        updatedMenus[mastersMenuIndex].children[stakeholdersMenuIndex].children = updatedMenus[mastersMenuIndex].children[stakeholdersMenuIndex].children.filter(
                            item => item.label !== 'Groups'
                        );
                    }
                }
            }

            // Masters > Stakeholders — drop the whole group if both children were removed
            {
                const mastersMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menuItem.masters);
                if (mastersMenuIndex >= 0) {
                    const stakeholdersMenuIndex = updatedMenus[mastersMenuIndex].children.findIndex(child => child.label === 'Stakeholders');
                    if (stakeholdersMenuIndex >= 0 && updatedMenus[mastersMenuIndex].children[stakeholdersMenuIndex].children.length === 0) {
                        updatedMenus[mastersMenuIndex].children = updatedMenus[mastersMenuIndex].children.filter(
                            child => child.label !== 'Stakeholders'
                        );
                    }
                }
            }

            // Masters > Currencies
            if (!checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_CREATE)) {
                const mastersMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menuItem.masters);
                if (mastersMenuIndex >= 0) {
                    updatedMenus[mastersMenuIndex].children = updatedMenus[mastersMenuIndex].children.filter(
                        child => child.label !== dictionary.sidebar.menuItem.currencies
                    );
                }
            }

            // Masters > Measurement Units
            if (!checkOrganizationPermission(PERMISSIONS.MEASUREMENT_UNITS_READ)) {
                const mastersMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menuItem.masters);
                if (mastersMenuIndex >= 0) {
                    updatedMenus[mastersMenuIndex].children = updatedMenus[mastersMenuIndex].children.filter(
                        child => child.label !== dictionary.sidebar.menuItem.measurement_units
                    );
                }
            }

            // Masters > Audit Trail
            if (!checkOrganizationPermission(PERMISSIONS.AUDIT_READ)) {
                const mastersMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menuItem.masters);
                if (mastersMenuIndex >= 0) {
                    updatedMenus[mastersMenuIndex].children = updatedMenus[mastersMenuIndex].children.filter(
                        child => child.label !== 'Audit Trail'
                    );
                }
            }

            //SMS
            if (
                organizationHasSubscribed(MODULES.SMS) &&
                checkOrganizationPermission([PERMISSIONS.SMS_READ, PERMISSIONS.SMS_SEND])
            ) {
                updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === 'SMS')];
            }
        }

        //Pros Control
        if (!!authUser?.permissions && authUser.permissions.length > 0) {
            updatedMenus = [...updatedMenus, ...menus.filter(menu => menu.label === dictionary.sidebar.menu.prosControl)];
        }

        // Pros Control > ProsAfricans
        if (!checkPermission([
            PROS_CONTROL_PERMISSIONS.PROSAFRICANS_READ,
            PROS_CONTROL_PERMISSIONS.PROSAFRICANS_MANAGE
        ])) {
            const prosControlMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.prosControl);
            if (prosControlMenuIndex >= 0) {
                updatedMenus[prosControlMenuIndex].children = updatedMenus[prosControlMenuIndex].children.filter(
                    child => child.label !== dictionary.sidebar.menuItem.prosAfricans
                );
            }
        }

        //Pros Control > Subscriptions
        if (!checkPermission([
            PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_MANAGE,
            PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_READ
        ])) {
            const prosControlMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.prosControl);
            if (prosControlMenuIndex >= 0) {
                updatedMenus[prosControlMenuIndex].children = updatedMenus[prosControlMenuIndex].children.filter(
                    child => child.label !== dictionary.sidebar.menuItem.subscriptions
                );
            }
        }

        //Pros Control > Troubleshooting
        if (!checkPermission([
            PROS_CONTROL_PERMISSIONS.DATABASE_MIGRATE,
            PROS_CONTROL_PERMISSIONS.DATABASE_REFRESH,
            PROS_CONTROL_PERMISSIONS.PERMISSIONS_MANAGE
        ])) {
            const prosControlMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.prosControl);
            if (prosControlMenuIndex >= 0) {
                updatedMenus[prosControlMenuIndex].children = updatedMenus[prosControlMenuIndex].children.filter(
                    child => child.label !== dictionary.sidebar.menuItem.troubleshooting
                );
            }
        }

        // Pros Control > Bulk Imports
        const prosControlMenuIndex = updatedMenus.findIndex(
            menu => menu.label === dictionary.sidebar.menu.prosControl
        )

        if (prosControlMenuIndex >= 0) {
            const hasOrganization = !!authOrganization?.organization?.id;

            if (!hasOrganization) {
                updatedMenus[prosControlMenuIndex].children =
                    updatedMenus[prosControlMenuIndex].children.filter(
                        child => child.label !== dictionary.sidebar.menuItem.bulkImports
                    );
            }
        }

        if (!checkPermission([
            PROS_CONTROL_PERMISSIONS.USERS_READ,
            PROS_CONTROL_PERMISSIONS.USERS_MANAGE,
        ])) {
            const prosControlMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.prosControl);
            if (prosControlMenuIndex >= 0) {
                updatedMenus[prosControlMenuIndex].children = updatedMenus[prosControlMenuIndex].children.filter(
                    child => child.label !== dictionary.sidebar.menuItem.usersManagement
                );
            }
        }

        // Pros Control > Audit Trail (platform-wide trail, for ProsAfrica staff only)
        if (!checkPermission([
            PROS_CONTROL_PERMISSIONS.AUDIT_READ,
            PROS_CONTROL_PERMISSIONS.AUDIT_READ_ORGANIZATIONS,
        ])) {
            const prosControlMenuIndex = updatedMenus.findIndex(menu => menu.label === dictionary.sidebar.menu.prosControl);
            if (prosControlMenuIndex >= 0) {
                updatedMenus[prosControlMenuIndex].children = updatedMenus[prosControlMenuIndex].children.filter(
                    child => child.label !== 'Audit Trail'
                );
            }
        }

        //Organizations should always included
        const orgMenu = menus.find(menu => menu.label === dictionary.sidebar.menu.organizations);
        if (orgMenu) {
            updatedMenus.push(orgMenu);
        }

        setMenuItems(collapseMenusByModule(updatedMenus, dictionary));
    }, [authOrganization, checkOrganizationPermission, authUser?.permissions, checkPermission, dictionary, menus, organizationHasSubscribed]);

    const visibleMenuItems = React.useMemo(() => {
        return filterMenuItems(menuItems, searchTerm, (item) => t(item.label));
    }, [menuItems, searchTerm, t]);

    return (
        <React.Fragment>
            <SidebarHeader />
            <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
                <JumboSearch
                    value={searchTerm}
                    onChange={(value) => setSearchTerm(value)}
                    placeholder="Search Menu"
                    sx={{ width: '100%' }}
                />
            </Box>
            {searchTerm.trim() && visibleMenuItems.length === 0 && (
                <Box sx={{ px: 3, py: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                    No matching menu found.
                </Box>
            )}
            <JumboScrollbar
                autoHide
                autoHideDuration={200}
                autoHideTimeout={500}
            >
                <Suspense
                    fallback={
                        <Div
                            sx={{
                                display: 'flex',
                                minWidth: 0,
                                alignItems: 'center',
                                alignContent: 'center',
                                px: 3
                            }}
                        >
                            <SidebarSkeleton />
                        </Div>
                    }
                >
                    <JumboVerticalNavbar items={visibleMenuItems} isSearchActive={Boolean(searchTerm.trim())} />
                </Suspense>
            </JumboScrollbar>
        </React.Fragment>
    );
};

export { Sidebar };
