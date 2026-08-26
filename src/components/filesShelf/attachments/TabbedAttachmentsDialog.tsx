import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import AttachmentsAccordionGroup, {
  AttachmentsDialogTab,
} from './AttachmentsAccordionGroup';

export type { AttachmentsDialogTab };

type TabbedAttachmentsDialogProps = {
  title: string;
  tabs: AttachmentsDialogTab[];
  setOpen: (open: boolean) => void;
};

function TabbedAttachmentsDialog({
  title,
  tabs,
  setOpen,
}: TabbedAttachmentsDialogProps) {
  return (
    <>
      <DialogTitle sx={{ textAlign: 'center' }}>{title}</DialogTitle>

      <DialogContent sx={{ px: 0 }}>
        <AttachmentsAccordionGroup tabs={tabs} defaultExpandedIndex={0} />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" size="small" onClick={() => setOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </>
  );
}

export default TabbedAttachmentsDialog;
