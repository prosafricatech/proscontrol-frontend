import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dialog, Grid, IconButton, ListItemText, Stack, Typography, Divider, Tooltip, useMediaQuery } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import JumboSearch from '@jumbo/components/JumboSearch';
import DeliverablesListItem from './DeliverablesListItem';
import { useProjectProfile } from '../ProjectProfileProvider';
import DeliverableGroupItemAction from './DeliverableGroupItemAction';
import DeliverableGroupActionTail from './DeliverableGroupActionTail';
import DeliverablesBulkImport from './DeliverablesBulkImport';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

function getNestedKey(parentKey, index) {
  return parentKey ? `${parentKey}.${index}` : `${index}`;
}

function filterChildrenGroups(children = [], normalizedQuery = '') {
  if (!normalizedQuery) {
    return children;
  }

  return children.reduce((acc, child) => {
    const filteredChildren = filterChildrenGroups(child.children || [], normalizedQuery);
    const filteredDeliverables = (child.deliverables || []).filter((deliverable) =>
      deliverable?.description?.toLowerCase().includes(normalizedQuery)
    );
    const selfMatches =
      child.name?.toLowerCase().includes(normalizedQuery) ||
      child.description?.toLowerCase().includes(normalizedQuery);

    if (selfMatches || filteredDeliverables.length > 0 || filteredChildren.length > 0) {
      acc.push({
        ...child,
        deliverables: filteredDeliverables,
        children: filteredChildren,
      });
    }

    return acc;
  }, []);
}

const DeliverableGroupsAccordion = memo(function DeliverableGroupsAccordion({
  group,
  expanded,
  handleChange,
  parentKey = '',
}) {
  const [childExpanded, setChildExpanded] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find(c => c.is_base === 1);
  const currencyCode = baseCurrency?.code;

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  const filteredDeliverables = useMemo(() => {
    const deliverables = group?.deliverables || [];
    if (!normalizedQuery) {
      return deliverables;
    }

    return deliverables.filter((deliverable) =>
      deliverable?.description?.toLowerCase().includes(normalizedQuery)
    );
  }, [group?.deliverables, normalizedQuery]);

  const filteredChildren = useMemo(
    () => filterChildrenGroups(group?.children || [], normalizedQuery),
    [group?.children, normalizedQuery]
  );

  const handleChildChange = useCallback((childIndex) => {
    setChildExpanded((prevState) => ({
      ...prevState,
      [childIndex]: !prevState[childIndex],
    }));
  }, []);

  return (
    <Accordion
      expanded={expanded === true}
      onChange={handleChange}
      TransitionProps={{ unmountOnExit: true }}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        padding: 0.5,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        '& > .MuiAccordionDetails-root:hover': {
          bgcolor: 'transparent',
        },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
        }}
      >
        <Grid container paddingLeft={1} paddingRight={1} width={'100%'} columnSpacing={1} rowSpacing={1} alignItems={'center'}>
          <Grid size={{xs: 8, md: group.description ? 2 : 5.5}}>
            <ListItemText
              primary={
                <Tooltip title={'Group Name'}>
                  <Typography component="span">{group.name}</Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title={'Code'}>
                  <Typography component="span">{group.code}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          {group.description &&
            <Grid size={{xs: 8, md: 3.5}}>
              <ListItemText
                secondary={
                  <Tooltip title={'Description'}>
                    <Typography component="span">{group.description}</Typography>
                  </Tooltip>
                }
              />
            </Grid>
          }
          <Grid size={{ xs: 12, md: 5.5 }} textAlign={'end'}>
            <Tooltip title={'Amount'}>
              <Typography component="span">
                {group?.contract_sum?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: currencyCode,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 4, md: 1}} textAlign={'end'}>
            <DeliverableGroupItemAction group={group} />
          </Grid>
        </Grid>
        <Divider />
      </AccordionSummary>

      {expanded === true && (
      <AccordionDetails
        sx={{
          backgroundColor: 'background.paper',
          marginBottom: 3,
        }}
      >
        <Grid container>
          <Grid size={{xs: 12}} textAlign={'end'} display="flex" justifyContent="flex-end" alignItems="center">
            {(group.children?.length > 0 || group.deliverables?.length > 0) &&
              <Grid paddingBottom={1} >
                <JumboSearch
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                />
              </Grid>
            }
            <Grid>
              {!group.deliverables?.length && <DeliverableGroupActionTail openDialog={openDialog} setOpenDialog={setOpenDialog} group={group} />} {/*Action Tail for New Deliverable Group inside deliverable group*/}
            </Grid>
            <Grid>
              {!group.children?.length && <DeliverableGroupItemAction group={group} isAccDetails={true} />}
            </Grid>
          </Grid>

          <DeliverablesListItem filteredDeliverables={filteredDeliverables} />

          {filteredChildren?.length > 0 && (
            <Grid size={{xs: 12}}>
              {filteredChildren?.map((child, index) => (
                <DeliverableGroupsAccordion
                  key={child?.id ?? getNestedKey(parentKey, index)}
                  group={child}
                  expanded={childExpanded[index] === true}
                  handleChange={() => handleChildChange(index)}
                  parentKey={getNestedKey(parentKey, index)}
                  openDialog={openDialog}
                  setOpenDialog={setOpenDialog}
                />
              ))}
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
      )}
    </Accordion>
  );
});


function DeliverableGroupsListItem() {
  const { project, deliverable_groups } = useProjectProfile();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkImportDialog, setOpenBulkImportDialog] = useState(false);
  const [expandedById, setExpandedById] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const LOCAL_STORAGE_KEY = 'deliverableGroupsExpanded';

  // Restore expanded state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        setExpandedById(parsed);
      }
    } catch {}
  }, []);

  // Persist expanded state to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expandedById));
  }, [expandedById]);

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  const filteredGroups = useMemo(() => {
    const groups = Array.isArray(deliverable_groups) ? deliverable_groups : [];

    if (!normalizedQuery) {
      return groups;
    }

    return groups.filter((group) =>
      group.name?.toLowerCase().includes(normalizedQuery) ||
      group.description?.toLowerCase().includes(normalizedQuery)
    );
  }, [deliverable_groups, normalizedQuery]);

  const sortedDeliverableGroups = useMemo(() => {
    return [...filteredGroups].sort((a, b) => {
      if (a.position_index === null) return 1;
      if (b.position_index === null) return -1;
      return a.position_index - b.position_index;
    });
  }, [filteredGroups]);

  const handleChange = useCallback((groupId) => {
    setExpandedById((prevState) => ({
      ...prevState,
      [groupId]: !prevState[groupId],
    }));
  }, []);

  return (
    <React.Fragment>
      <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openBulkImportDialog}>
        {openBulkImportDialog && <DeliverablesBulkImport project={project} setOpenDialog={setOpenBulkImportDialog} />}
      </Dialog>

      <Grid container columnSpacing={1} justifyContent="flex-end" alignItems="center">
        {deliverable_groups?.length > 0 &&
          <Grid>
            <JumboSearch
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </Grid>
        }
        <Grid>
          <Tooltip title={'Bulk Import Deliverables'}>
            <IconButton onClick={() => setOpenBulkImportDialog(true)}>
              <UploadFileIcon />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid>
          <DeliverableGroupActionTail openDialog={openDialog} setOpenDialog={setOpenDialog} group={null} />
        </Grid>
      </Grid>
      <Stack direction={'column'}>
        {sortedDeliverableGroups && sortedDeliverableGroups.length > 0 ? (
          sortedDeliverableGroups.map((group, index) => (
            <DeliverableGroupsAccordion
              key={group?.id ?? index}
              group={group}
              expanded={expandedById[group?.id] === true}
              handleChange={() => handleChange(group?.id)}
              openDialog={openDialog}
              setOpenDialog={setOpenDialog}
            />
          ))
        ) : (
          <Alert variant="outlined" severity="info">
            No Deliverable Group Found
          </Alert>
        )}
      </Stack>
    </React.Fragment>
  );
}

export default DeliverableGroupsListItem;