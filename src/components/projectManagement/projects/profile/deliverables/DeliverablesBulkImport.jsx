'use client';

import {
  CheckCircleOutline,
  DescriptionOutlined,
  DownloadOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  UploadOutlined,
  Refresh,
  Close,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Grid,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import projectsServices from '../../project-services';

const getErrorMessage = (error) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0];
    return Array.isArray(first) ? first[0] : String(first);
  }
  return error?.response?.data?.message || error?.message || 'Something went wrong';
};

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const DeliverablesBulkImport = ({ project, setOpenDialog }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isDark = theme.type === 'dark';

  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleClose = () => setOpenDialog(false);

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: () => projectsServices.downloadDeliverablesExcelTemplate(project.id),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${project?.name ?? 'Project'} Deliverables.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded successfully', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: importDeliverables, isPending: isImporting } = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('project_id', project.id);
      formData.append('deliverables_excel', file);
      return projectsServices.importDeliverablesExcel(formData);
    },
    onSuccess: (response) => {
      setImportResult(response);
      setFile(null);

      queryClient.invalidateQueries({ queryKey: ['projectDeliverableGroups'] });

      if (response.errors && response.errors.length > 0) {
        enqueueSnackbar(
          `${response.message}. ${response.errors.length} error(s) found. Check the details below.`,
          { variant: 'warning' }
        );
      } else if (response.imported > 0 && response.skipped === 0) {
        enqueueSnackbar(response.message || 'Deliverables imported successfully', { variant: 'success' });
      } else if (response.imported > 0 && response.skipped > 0) {
        enqueueSnackbar(`${response.message}. ${response.imported} imported, ${response.skipped} skipped.`, { variant: 'warning' });
      } else {
        enqueueSnackbar(response.message || 'Nothing was imported. Please check the errors below.', { variant: 'error' });
      }
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setImportResult(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setTabValue(0);
  };

  const hasErrors = (importResult?.errors || []).length > 0;

  return (
    <React.Fragment>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Bulk Import Deliverables
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Import deliverable groups and their line items for {project?.name} using Excel. Downloading the
          template again later also exports whatever is currently in this project.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, py: 1.5, minHeight: 40 } }}
          >
            <Tab icon={<DownloadOutlined />} label="Download Template" iconPosition="start" />
            <Tab icon={<UploadOutlined />} label="Upload Excel" iconPosition="start" />
          </Tabs>
        </Box>

        {(isDownloading || isImporting) && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert
              severity="info"
              icon={<DescriptionOutlined />}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                  color: isDark ? theme.palette.info.light : undefined,
                },
                bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
                color: isDark ? theme.palette.common.white : undefined,
                border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
              }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
                Getting Started
              </Typography>
              <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
                Download the Excel template below. Fill in one row per deliverable group/line item
                following the format in the Instructions sheet. If this project already has
                deliverables, the download comes pre-filled with them.
              </Typography>
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                borderRadius: 2,
                border: `2px dashed ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                }}
              >
                <DescriptionOutlined sx={{ fontSize: 32, color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Deliverables Template
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Groups, nested groups and deliverable line items in one sheet
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadOutlined />}
                onClick={() => downloadTemplate()}
                disabled={isDownloading}
                size="large"
                sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {isDownloading ? 'Downloading...' : 'Download Template'}
              </Button>
            </Paper>
          </Stack>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert
              severity="info"
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                  color: isDark ? theme.palette.info.light : undefined,
                },
                bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
                color: isDark ? theme.palette.common.white : undefined,
                border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
              }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
                Upload Instructions
              </Typography>
              <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
                Upload the filled Excel file. Groups whose code already exists are reused, and
                deliverables whose description already exists in their group are skipped - so
                re-uploading a corrected file is safe.
              </Typography>
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                borderRadius: 2,
                border: `2px dashed ${file ? theme.palette.success.main : theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: file
                    ? alpha(theme.palette.success.main, isDark ? 0.15 : 0.08)
                    : alpha(theme.palette.text.secondary, 0.05),
                }}
              >
                <InsertDriveFileOutlined
                  sx={{ fontSize: 32, color: file ? theme.palette.success.main : 'text.secondary', opacity: file ? 1 : 0.5 }}
                />
              </Box>

              {file ? (
                <React.Fragment>
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(file.size / 1024).toFixed(1)} KB &bull; Ready to upload
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" color="error" size="small" onClick={() => setFile(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                      Remove File
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<UploadOutlined />}
                      onClick={() => importDeliverables(file)}
                      disabled={isImporting}
                      size="large"
                      sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {isImporting ? 'Uploading...' : 'Upload & Import'}
                    </Button>
                  </Stack>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Typography variant="body2" color="text.secondary">
                    No file selected
                  </Typography>
                  <Button variant="outlined" component="label" startIcon={<UploadOutlined />} sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}>
                    Select Excel File
                    <input hidden type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
                  </Button>
                </React.Fragment>
              )}
            </Paper>

            {importResult && (
              <Box sx={{ width: '100%' }}>
                <Stack spacing={3}>
                  <Alert
                    severity={hasErrors ? 'warning' : 'success'}
                    icon={hasErrors ? <ErrorOutline /> : <CheckCircleOutline />}
                    sx={{
                      borderRadius: 2,
                      width: '100%',
                      '& .MuiAlert-icon': {
                        alignItems: 'center',
                        color: isDark ? (hasErrors ? theme.palette.warning.light : theme.palette.success.light) : undefined,
                      },
                      bgcolor: isDark ? alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.12) : undefined,
                      color: isDark ? theme.palette.common.white : undefined,
                      border: isDark
                        ? `1px solid ${alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.3)}`
                        : undefined,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
                      Import Summary
                    </Typography>

                    <Grid container spacing={2} sx={{ width: '100%', mt: 1 }}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          Imported
                        </Typography>
                        <Typography variant="h6" color={isDark ? theme.palette.success.light : 'success.main'} fontWeight={700}>
                          {importResult.imported ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          Skipped
                        </Typography>
                        <Typography variant="h6" color={isDark ? theme.palette.warning.light : 'warning.main'} fontWeight={700}>
                          {importResult.skipped ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          Errors
                        </Typography>
                        <Typography variant="h6" color={isDark ? theme.palette.error.light : 'error.main'} fontWeight={700}>
                          {importResult.errors?.length ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          Total Processed
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color={isDark ? 'inherit' : undefined}>
                          {(importResult.imported ?? 0) + (importResult.skipped ?? 0)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {importResult.message && (
                      <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'} sx={{ mt: 1 }}>
                        {importResult.message}
                      </Typography>
                    )}
                  </Alert>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorOutline fontSize="small" color="warning" />
                        Skipped Rows ({importResult.errors.length} row{importResult.errors.length > 1 ? 's' : ''})
                      </Typography>

                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, isDark ? 0.06 : 0.03),
                          borderRadius: 1,
                          border: 1,
                          borderColor: alpha(theme.palette.warning.main, isDark ? 0.15 : 0.1),
                          overflow: 'hidden',
                          maxHeight: 320,
                          overflowY: 'auto',
                          width: '100%',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr',
                            bgcolor: alpha(theme.palette.warning.main, isDark ? 0.12 : 0.06),
                            borderBottom: 1,
                            borderColor: theme.palette.divider,
                            p: 1.5,
                            gap: 1,
                            position: 'sticky',
                            top: 0,
                          }}
                        >
                          <Typography variant="caption" fontWeight={700}>
                            Row No.
                          </Typography>
                          <Typography variant="caption" fontWeight={700}>
                            Error Description
                          </Typography>
                        </Box>

                        {importResult.errors.map((item, index) => (
                          <Box key={`${item.row}-${index}`} sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 1, p: 1.5 }}>
                            <Typography variant="body2" color="warning.main">
                              {item.row}.
                            </Typography>
                            <Typography variant="body2">{item.error}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {(!importResult.errors || importResult.errors.length === 0) && importResult.imported > 0 && (
                    <Alert severity="success" sx={{ width: '100%' }}>
                      <Typography variant="body2">
                        All {importResult.imported} row{importResult.imported > 1 ? 's were' : ' was'} imported successfully!
                      </Typography>
                    </Alert>
                  )}

                  <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset} size="small" sx={{ alignSelf: 'flex-start' }}>
                    Import Another File
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        </TabPanel>
      </DialogContent>
    </React.Fragment>
  );
};

export default DeliverablesBulkImport;
