import React, { createContext, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ApprovalChainsListItemAction from './ApprovalChainsListItemAction';
import ApprovalChainLevels from './ApprovalChainLevels';
import approvalChainsServices from './approvalChainsServices';
import { ApprovalChain, ApprovalChainLevel } from './ApprovalChainType';
import { DEPARTMENT_SCOPABLE_PROCESS_TYPES } from '@/utilities/constants/processTypes';
import { useQuery } from '@tanstack/react-query';

interface ApprovalChainsListItemContextValue {
  approvalChainLevels: ApprovalChainLevel[];
  approvalChain: ApprovalChain;
  queryParams: { status: string };
  setQueryParams: React.Dispatch<React.SetStateAction<{ status: string }>>;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  selectedApprovalChainLevel: ApprovalChainLevel | null;
  setSelectedApprovalChainLevel: React.Dispatch<React.SetStateAction<ApprovalChainLevel | null>>;
  openDialog: boolean;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

export const approvalChainsListItemContext = createContext<ApprovalChainsListItemContextValue>(
  {} as ApprovalChainsListItemContextValue
);

interface ApprovalChainsListItemProps {
  approvalChain: ApprovalChain;
}

const ApprovalChainsListItem: React.FC<ApprovalChainsListItemProps> = ({ approvalChain }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedApprovalChainLevel, setSelectedApprovalChainLevel] = useState<ApprovalChainLevel | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [queryParams, setQueryParams] = useState({ status: 'Active' });

  const { data: approvalChainLevels = [], isLoading } = useQuery({
    queryKey: ['approvalChainLevels', { approvalChainId: approvalChain.id, status: queryParams.status }],
    queryFn: () => approvalChainsServices.getApprovalChainLevels(approvalChain.id, queryParams.status),
    enabled: expanded,
  });

  const contextValue: ApprovalChainsListItemContextValue = {
    approvalChainLevels,
    approvalChain,
    queryParams,
    setQueryParams,
    expanded,
    setExpanded,
    selectedApprovalChainLevel,
    setSelectedApprovalChainLevel,
    openDialog,
    setOpenDialog,
  };

  return (
    <approvalChainsListItemContext.Provider value={contextValue}>
      <Accordion
        expanded={expanded}
        square
        sx={{ 
          borderRadius: 2, 
          borderTop: 2,
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        onChange={() => setExpanded((prevExpanded) => !prevExpanded)}
      >
        <AccordionSummary
          expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
          sx={{
            px: 2,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: '10px 0',
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
                fontSize: '0.9rem',
              },
            },
          }}
        >
          <Grid
            paddingLeft={1}
            paddingRight={1}
            columnSpacing={1}
            alignItems={'center'}
            sx={{width: '100%'}}
            container
          >
            <Grid size={{xs: 6, md: 5}}>
              <Tooltip title={'Type'}>
                <Typography>{approvalChain.process_type}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 5}}>
              {approvalChain.department?.name && (
                <Tooltip title={'Department'}>
                  <Chip
                    size="small"
                    label={approvalChain.department.name}
                    sx={{ mr: 0.5 }}
                  />
                </Tooltip>
              )}
              {approvalChain.cost_center?.name && !DEPARTMENT_SCOPABLE_PROCESS_TYPES.includes(approvalChain.process_type) && (
                <Tooltip title={'Cost Center'}>
                  <Chip
                    size="small"
                    label={approvalChain.cost_center.name}
                  />
                </Tooltip>
              )}
            </Grid>
            <Grid size={{xs: 12, md: 2}} display={'flex'} alignItems={{xs: 'end', md: 'start'}} justifyContent={{xs: 'end', md: 'start'}}>
              <Tooltip title={'Status'}>
                <Chip
                  size="small"
                  label={approvalChain.status}
                  color={approvalChain.status === 'active' ? 'success' : 'warning'}
                />
              </Tooltip>
            </Grid>
          </Grid>
          <Divider/>
        </AccordionSummary>
        <AccordionDetails
          sx={{ 
            backgroundColor: 'background.paper',
            marginBottom: 3,
          }}
        >
          {isLoading && <LinearProgress/>}
          <Grid container>
            <Grid size={12} textAlign={'end'}>
              <ApprovalChainsListItemAction approvalChain={approvalChain} />
            </Grid>
            
            <Grid size={12}>
              <ApprovalChainLevels/>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </approvalChainsListItemContext.Provider>
  );
};

export default React.memo(ApprovalChainsListItem);