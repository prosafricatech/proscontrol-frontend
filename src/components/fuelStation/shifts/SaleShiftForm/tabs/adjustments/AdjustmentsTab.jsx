"use client";

import { 
  Typography,
  Box,
} from '@mui/material';
import Adjustments from './Adjustments';
import AdjustmentsRow from './AdjustmentsRow';

function AdjustmentsTab({  
  cashierIndex, 
  localAdjustments, 
  setLocalAdjustments,
  cashierPumpProducts
}) {

  return (
    <Box>
        <Adjustments
          adjustments={localAdjustments}
          setAdjustments={setLocalAdjustments}
          cashierPumpProducts={cashierPumpProducts}
        />

        {localAdjustments.map((adjustment, index) => (
            <AdjustmentsRow
                key={index}
                adjustment={adjustment}
                index={index}
                adjustments={localAdjustments}
                setAdjustments={setLocalAdjustments}
                cashierPumpProducts={cashierPumpProducts}
            />
        ))}
      
      {localAdjustments.length === 0 && (
        <Typography color="textSecondary" textAlign="center" py={4}>
          No Adjustments added for this cashier yet. Add one using the form above.
        </Typography>
      )}
    </Box>
  );
}

export default AdjustmentsTab;