'use client';

import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { SxProps, Theme, Paper, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from './style';
import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { staticMenuItems } from '@/utilities/constants/static-menu-items';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';
import { canAccessEntityConfig, entityConfigs } from './entityConfigs';
import { useSpinner } from '@/shared/ProgressIndicators/SpinnerContext';

type SearchGlobalProps = {
  wrapperSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
};

type SearchResult = {
  id: string | number;
  label: string;
  type: string;
  url: string;
  description?: string;
};

const SearchGlobal = ({ wrapperSx, sx }: SearchGlobalProps) => {
  const [query, setQuery] = React.useState('');
  const [searchValue, setSearchValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setShow } = useSpinner();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Permission/subscription requirements for static menu items (add more as needed)
  const staticMenuPermissions: Record<string, { permissions?: string[]; orgPermissions?: string[]; modules?: string[] }> = {
    'Dashboard': {},
    'Requisitions': { orgPermissions: [PERMISSIONS.REQUISITIONS_READ], modules: [MODULES.PROCESS_APPROVAL] },
    'Approvals': { orgPermissions: [PERMISSIONS.REQUISITIONS_READ], modules: [MODULES.PROCESS_APPROVAL] },
    'Approval Chains': { orgPermissions: [PERMISSIONS.APPROVAL_CHAINS_READ], modules: [MODULES.PROCESS_APPROVAL] },
    'Sales Counter': { orgPermissions: [PERMISSIONS.SALES_READ], modules: [MODULES.POINT_OF_SALE] },
    'Proforma Invoices': { orgPermissions: [PERMISSIONS.PROFORMA_INVOICES_READ], modules: [MODULES.POINT_OF_SALE] },
    'POS Reports': { orgPermissions: [PERMISSIONS.SALES_REPORTS], modules: [MODULES.POINT_OF_SALE] },
    'Outlets': { orgPermissions: [PERMISSIONS.OUTLETS_READ], modules: [MODULES.POINT_OF_SALE] },
    'POS Price Lists': { orgPermissions: [PERMISSIONS.PRICE_LISTS_READ], modules: [MODULES.POINT_OF_SALE] },
    'POS Settings': { orgPermissions: [PERMISSIONS.POS_SETTINGS], modules: [MODULES.POINT_OF_SALE] },
    'Sales Shifts': { orgPermissions: [PERMISSIONS.FUEL_SALES_SHIFTS_READ], modules: [MODULES.FUEL_STATION] },
    'Dippings': { orgPermissions: [PERMISSIONS.FUEL_SALES_SHIFTS_READ], modules: [MODULES.FUEL_STATION] },
    'Fuel Reports': { orgPermissions: [PERMISSIONS.FUEL_SALES_SHIFTS_READ], modules: [MODULES.FUEL_STATION] },
    'Stations': { orgPermissions: [PERMISSIONS.FUEL_STATIONS_READ], modules: [MODULES.FUEL_STATION] },
    'Fuel Price Lists': { orgPermissions: [PERMISSIONS.PRICE_LISTS_READ], modules: [MODULES.FUEL_STATION] },
    'Production Batches': { orgPermissions: [PERMISSIONS.BOM_READ], modules: [MODULES.MANUFACTURING_AND_PROCESSING] },
    'BOMs': { orgPermissions: [PERMISSIONS.BOM_READ], modules: [MODULES.MANUFACTURING_AND_PROCESSING] },
    'Projects': { orgPermissions: [PERMISSIONS.PROJECTS_READ], modules: [MODULES.PROJECT_MANAGEMENT] },
    'Project Categories': { orgPermissions: [PERMISSIONS.PROJECT_CATEGORIES_READ], modules: [MODULES.PROJECT_MANAGEMENT] },
    'Approved Payments': { orgPermissions: [PERMISSIONS.APPROVED_REQUISITIONS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    'Transactions': { orgPermissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    'Accounts Reports': { orgPermissions: [PERMISSIONS.ACCOUNTS_REPORTS], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    'Budgets': { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    'Ledger Groups': { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    'Ledgers': { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    'Cost Centers': { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ], modules: [MODULES.ACCOUNTS_AND_FINANCE] },
    'Approved Purchases': { orgPermissions: [PERMISSIONS.APPROVED_REQUISITIONS_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    'Purchases': { orgPermissions: [PERMISSIONS.PURCHASES_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    'Consumptions': { orgPermissions: [PERMISSIONS.INVENTORY_CONSUMPTIONS_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    'Procurement Reports': { orgPermissions: [PERMISSIONS.PURCHASES_REPORTS], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    'Product Categories': { orgPermissions: [PERMISSIONS.PRODUCT_CATEGORIES_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    'Products': { orgPermissions: [PERMISSIONS.PRODUCTS_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    'Stores': { orgPermissions: [PERMISSIONS.STORES_READ], modules: [MODULES.PROCUREMENT_AND_SUPPLY] },
    'Files Shelf': { orgPermissions: [PERMISSIONS.FILES_SHELF_BROWSE] },
    'Stakeholders': { orgPermissions: [PERMISSIONS.STAKEHOLDERS_READ] },
    'Currencies': { orgPermissions: [PERMISSIONS.ACCOUNTS_MASTERS_READ] },
    'Measurement Units': { orgPermissions: [PERMISSIONS.MEASUREMENT_UNITS_READ] },
    'ProsAfricans': { permissions: ['ProsAfricans:Read', 'ProsAfricans:Manage'] },
    'Subscriptions': { permissions: ['ProsAfricans:Read', 'ProsAfricans:Manage'] },
    'Troubleshooting': { permissions: ['ProsAfricans:Read', 'ProsAfricans:Manage'] },
    'Users Management': { permissions: ['ProsAfricans:Read', 'ProsAfricans:Manage'] },
    'SMS': { permissions: ['ProsAfricans:Read', 'ProsAfricans:Manage'] },
    'Organizations': {},
    'Invitations': {},
    // Human Resources
    'Employees': { modules: [MODULES.HUMAN_RESOURCES] },
    'Leave Requests': { modules: [MODULES.HUMAN_RESOURCES] },
    'Payroll Periods': { modules: [MODULES.HUMAN_RESOURCES] },
    'Departments': { modules: [MODULES.HUMAN_RESOURCES] },
    'Designations': { modules: [MODULES.HUMAN_RESOURCES] },
    'Leave Types': { modules: [MODULES.HUMAN_RESOURCES] },
    'Allowance Types': { modules: [MODULES.HUMAN_RESOURCES] },
    'Deduction Types': { modules: [MODULES.HUMAN_RESOURCES] },
    'Employer Contribution Types': { modules: [MODULES.HUMAN_RESOURCES] },
    'PAYE Tax Bands': { modules: [MODULES.HUMAN_RESOURCES] },
  };

  const { checkPermission, checkOrganizationPermission, organizationHasSubscribed, authOrganization } = useJumboAuth();

  // Helper to check if user can access a menu item
  const canAccessMenu = (label: string) => {
    const req = staticMenuPermissions[label];
    if (!req) return true; // If not specified, allow by default
    if (req.permissions && !checkPermission(req.permissions)) return false;
    if (req.orgPermissions && !checkOrganizationPermission(req.orgPermissions)) return false;
    if (req.modules && !organizationHasSubscribed(req.modules)) return false;
    return true;
  };

  React.useEffect(() => {
    // If user is unauthorized to any organization, do not search
    if (!authOrganization || !authOrganization.organization || authOrganization.organization.status === 'Unauthorized') {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    if (!searchValue) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);

    // Only show static menu items the user can access
    const pageMatches: SearchResult[] = staticMenuItems
      .filter(page =>
        page.label.toLowerCase().includes(searchValue.toLowerCase()) && canAccessMenu(page.label)
      )
      .map(page => ({
        id: page.uri,
        label: page.label,
        type: 'Page',
        url: page.uri,
      }));

    // Show static results instantly and keep them visible
    setResults(pageMatches);

    // Fetch only entity configs the user can access
    let isCancelled = false;
    Promise.allSettled(
      entityConfigs
        .filter(entity =>
          (canAccessMenu(entity.label) || canAccessMenu(entity.type)) &&
          canAccessEntityConfig(entity, {
            checkPermission,
            checkOrganizationPermission,
            organizationHasSubscribed,
          })
        )
        .map(async (entity) =>
          entity.search(searchValue, {
            checkPermission,
            checkOrganizationPermission,
            organizationHasSubscribed,
          })
        )
    ).then((allResults) => {
      if (isCancelled) return;
      // Only keep entity results for which the user has permission (by label or type)
      const entityResults = allResults
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<SearchResult[]>).value)
        .flat()
        .filter(result => canAccessMenu(result.label) || canAccessMenu(result.type));
      setResults([...pageMatches, ...entityResults]);
      setLoading(false);
    });
    return () => { isCancelled = true; };
  }, [searchValue, authOrganization]);

  // Debounce input
  React.useEffect(() => {
    if (!query) {
      setSearchValue('');
      return;
    }
    const handler = setTimeout(() => {
      setSearchValue(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Show static results instantly as user types
    if (!value) {
      setResults([]);
      setOpen(false);
      return;
    }
    setOpen(true);
    const pageMatches: SearchResult[] = staticMenuItems
      .filter(page =>
        page.label.toLowerCase().includes(value.toLowerCase()) && canAccessMenu(page.label)
      )
      .map(page => ({
        id: page.uri,
        label: page.label,
        type: 'Page',
        url: page.uri,
      }));
    setResults(pageMatches);
  };

  // Search immediately on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchValue(query);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Prevent adding ?search=PageName for static menu items
    const isStaticMenu = staticMenuItems.some(item => item.label === result.label);
    let url = result.url;
    if (!isStaticMenu) {
      try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('search', result.label);
        url = urlObj.pathname + urlObj.search;
      } catch (e) {
        // fallback: if URL parsing fails, append/replace manually
        if (url.includes('?')) {
          url = url.replace(/([?&])search=[^&]*/, `$1search=${encodeURIComponent(result.label)}`);
          if (!/([?&])search=/.test(url)) {
            url += `&search=${encodeURIComponent(result.label)}`;
          }
        } else {
          url += `?search=${encodeURIComponent(result.label)}`;
        }
      }
    }
    // Only show spinner if navigating to a different route (including search params)
    if (window.location.pathname + window.location.search !== url) {
      setShow(true);
    }
    try {
      router.push(url);
    } catch (e) {
      console.error('router.push failed:', e, 'Falling back to window.location.assign');
      window.location.assign(url);
    }
  };

  // Hide spinner after route or query param change (client-side navigation)
  React.useEffect(() => {
    setShow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <Box sx={{ position: 'relative', ...wrapperSx }}>
      <Search style={{ position: 'relative' }}>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          name='search-globally'
          placeholder='Search anything'
          inputProps={{ 'aria-label': 'search' }}
          sx={sx ?? {}}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setOpen(true)}
          inputRef={inputRef}
        />
        {query && (
          <Box
            sx={(theme) => ({
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%',
              p: 0.2,
              color: theme.type === 'dark' ? theme.palette.grey[300] : theme.palette.text.secondary,
              transition: 'background 0.2s',
              '&:hover': {
                background: theme.type === 'dark' ? 'rgba(60,60,60,1)' : 'rgba(220,220,220,1)',
              },
            })}
            onClick={() => {
              setQuery('');
              setSearchValue('');
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <CloseIcon fontSize="small" />
          </Box>
        )}
      </Search>
      {open && (
        <Paper sx={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, maxHeight: 320, overflowY: 'auto' }}>
          {results.length === 0 ? (
            loading ? (
              <Box sx={{ p: 2, color: 'text.secondary', textAlign: 'center', fontSize: 13 }}>
                Loading more results...
              </Box>
            ) : (
              <Box sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>No results</Box>
            )
          ) : (
            <>
              <List>
                {results.map((result) => (
                  <ListItem
                    component="div"
                    key={result.type + '-' + result.id}
                    onMouseDown={() => handleResultClick(result)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      transition: 'background 0.2s',
                      '&:hover': {
                        backgroundColor: (theme) =>
                          theme.type === 'dark'
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.04)',
                        color: (theme) =>
                          theme.type === 'dark'
                            ? theme.palette.primary.light
                            : theme.palette.primary.dark,
                      },
                    }}
                  >
                    <ListItemText
                      primary={result.label}
                      secondary={result.description || result.type}
                      primaryTypographyProps={{
                        sx: {
                          color: (theme) =>
                            theme.type === 'dark'
                              ? 'white'
                              : 'inherit',
                        },
                      }}
                      secondaryTypographyProps={{
                        sx: {
                          color: (theme) =>
                            theme.type === 'dark'
                              ? 'rgba(255,255,255,0.7)'
                              : 'text.secondary',
                          fontSize: 13,
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {loading && (
                <Box sx={{ p: 1, color: 'text.secondary', textAlign: 'center', fontSize: 13 }}>
                  Loading more results...
                </Box>
              )}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export { SearchGlobal };
