import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { AttachmentOutlined, ExpandMoreOutlined } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AttachmentForm from './AttachmentForm';
import attachmentsServices from './attachmentsServices';
import { Attachment } from './AttachmentsType';

export type AttachmentsDialogTab = {
  label: string;
  attachmentable_type: string;
  attachmentable_id: number;
  readOnly?: boolean;
};

type TabbedAttachmentsDialogProps = {
  title: string;
  tabs: AttachmentsDialogTab[];
  setOpen: (open: boolean) => void;
};

type SectionProps = {
  tab: AttachmentsDialogTab;
  expanded: boolean;
  onToggle: () => void;
};

const AttachmentsSection: React.FC<SectionProps> = ({
  tab,
  expanded,
  onToggle,
}) => {
  const { data: attachments = [] } = useQuery({
    queryKey: [
      'attachments',
      Number(tab.attachmentable_id),
      tab.attachmentable_type,
    ],
    queryFn: () =>
      attachmentsServices.attachments({
        attachmentable_id: tab.attachmentable_id,
        attachmentable_type: tab.attachmentable_type,
      }),
  });
  const count = (attachments as Attachment[])?.length || 0;

  return (
    <Accordion expanded={expanded} onChange={onToggle} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
        <Badge badgeContent={count} color="info" sx={{ mr: 2.5 }}>
          {tab.readOnly && count > 0 && (
            <AttachmentOutlined fontSize="small" color="warning" />
          )}
        </Badge>
        <Typography>{tab.label}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0, '& .MuiDialogContent-root': { px: 2 } }}>
        {expanded && (
          <AttachmentForm
            hideFeatures
            readOnly={tab.readOnly}
            attachmentable_type={tab.attachmentable_type}
            attachmentable_id={tab.attachmentable_id}
            attachment_name={tab.label}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
};

function TabbedAttachmentsDialog({
  title,
  tabs,
  setOpen,
}: TabbedAttachmentsDialogProps) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <>
      <DialogTitle sx={{ textAlign: 'center' }}>{title}</DialogTitle>

      <DialogContent sx={{ px: 0 }}>
        {tabs.map((tab, index) => (
          <AttachmentsSection
            key={index}
            tab={tab}
            expanded={expandedIndex === index}
            onToggle={() =>
              setExpandedIndex((prev) => (prev === index ? -1 : index))
            }
          />
        ))}
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
