import { Button, DialogActions, DialogContent } from '@mui/material';
import PurchaseOrderOnScreenPreview from '@/components/procurement/purchases/PurchaseOrderOnScreenPreview';

interface RelatableOrderDetailsProps {
    order: any;
    toggleOpen: (open: boolean) => void;
}

function RelatableOrderDetails({ order, toggleOpen }: RelatableOrderDetailsProps) {
    return (
        <>
            <DialogContent>
                <PurchaseOrderOnScreenPreview order={order} />
            </DialogContent>
            <DialogActions>
                <Button size="small" variant='outlined' onClick={() => toggleOpen(false)}>
                    Close
                </Button>
            </DialogActions>
        </>
    );
}

export default RelatableOrderDetails;
