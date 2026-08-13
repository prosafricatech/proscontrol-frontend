'use client';

import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { PhotoCameraOutlined, DeleteOutline } from '@mui/icons-material';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';

interface EmployeePhotoUploadProps {
  employeeId: number;
  photoPath?: string | null;
  firstName?: string | null;
  size?: number;
  editable?: boolean;
  onChanged?: () => void;
}

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong'
  );
};

/**
 * An Avatar showing the employee's photo (or their initial as a fallback)
 * that doubles as the upload/replace/remove control when `editable`. Used
 * on the employee profile header; other surfaces (selectors, list rows)
 * render the plain, non-editable Avatar instead — see EmployeeSelector.tsx
 * / EmployeesListItem.tsx.
 */
const EmployeePhotoUpload = ({
  employeeId,
  photoPath,
  firstName,
  size = 64,
  editable = true,
  onChanged,
}: EmployeePhotoUploadProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { showDialog, hideDialog } = useJumboDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['showEmployee', String(employeeId)] });
    onChanged?.();
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      humanResourcesServices.uploadEmployeePhoto(employeeId, file),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Photo updated successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => humanResourcesServices.deleteEmployeePhoto(employeeId),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Photo removed successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) uploadMutation.mutate(file);
    setMenuAnchor(null);
  };

  const handleRemove = () => {
    setMenuAnchor(null);
    showDialog({
      title: 'Remove Photo',
      content: "Are you sure you want to remove this employee's photo?",
      onYes: () => {
        hideDialog();
        deleteMutation.mutate();
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const avatar = (
    <Avatar
      src={photoPath || undefined}
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main',
        fontSize: size / (64 / 24),
      }}
    >
      {firstName?.[0] ?? '?'}
    </Avatar>
  );

  if (!editable) {
    return avatar;
  }

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      {avatar}
      {isBusy && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.4)',
            borderRadius: '50%',
          }}
        >
          <CircularProgress size={size / 3} sx={{ color: 'white' }} />
        </Box>
      )}
      <Tooltip title='Change photo'>
        <IconButton
          size='small'
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          disabled={isBusy}
          sx={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <PhotoCameraOutlined fontSize='small' />
        </IconButton>
      </Tooltip>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp'
        hidden
        onChange={handleFileChange}
      />
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          <PhotoCameraOutlined fontSize='small' sx={{ mr: 1 }} />
          {photoPath ? 'Replace photo' : 'Upload photo'}
        </MenuItem>
        {photoPath && (
          <MenuItem onClick={handleRemove}>
            <DeleteOutline fontSize='small' sx={{ mr: 1 }} />
            Remove photo
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default EmployeePhotoUpload;
