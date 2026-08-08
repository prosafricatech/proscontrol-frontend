'use client';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import requisitionsServices from '../../requisitionsServices';
import { ApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedPaymentForm from './form/ApprovedPaymentForm';

interface ApprovedPaymentActionTailProps {
  approvedRequisition: ApprovalRequisition;
  isExpanded: boolean;
}

const ApprovedPaymentActionTail: React.FC<ApprovedPaymentActionTailProps> = ({
  approvedRequisition,
  isExpanded,
}) => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: approvedRequisitionDetails, isFetching } = useQuery({
    queryKey: ['requisitionDetails', { id: approvedRequisition.id }],
    queryFn: async () =>
      requisitionsServices.getApprovedRequisitionDetails(
        approvedRequisition.id
      ),
    enabled: !!isExpanded && !!openDialog,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <React.Fragment>
      <Dialog
        maxWidth='lg'
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <ApprovedPaymentForm
          toggleOpen={setOpenDialog}
          approvedDetails={approvedRequisitionDetails}
          approvedRequisition={approvedRequisition}
        />
      </Dialog>

      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title='Pay'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <FontAwesomeIcon icon={faMoneyBill1} size='lg' />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default React.memo(ApprovedPaymentActionTail);
