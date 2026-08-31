import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { DownloadOutlined, ErrorOutline, UploadOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, useState } from 'react';
import assetsServices from './assets-services';

interface AssetImportDialogContentProps {
  onClose: () => void;
}

const AssetImportDialogContent: React.FC<AssetImportDialogContentProps> = ({ onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const downloadTemplate = useMutation({
    mutationFn: assetsServices.downloadImportTemplate,
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Asset Register Import Template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const importAssets = useMutation({
    mutationFn: (selectedFile: File) => {
      const formData = new FormData();
      formData.append('assets_excel', selectedFile);
      return assetsServices.bulkImport(formData);
    },
    onSuccess: (response: any) => {
      setResult(response);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      enqueueSnackbar(response.message, { variant: response.errors?.length ? 'warning' : 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setResult(null);
  };

  return (
    <>
      <DialogTitle>{dictionary.register.import.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {dictionary.register.import.description}
        </Typography>

        {(downloadTemplate.isPending || importAssets.isPending) && <LinearProgress sx={{ mb: 2 }} />}

        <Stack spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={() => downloadTemplate.mutate()}
            disabled={downloadTemplate.isPending}
          >
            {downloadTemplate.isPending ? dictionary.register.import.downloading : dictionary.register.import.downloadTemplate}
          </Button>

          <Alert severity="info">{dictionary.register.import.uploadInstructions}</Alert>

          {file ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">{file.name}</Typography>
              <Button size="small" color="error" onClick={() => setFile(null)}>
                {dictionary.register.import.removeFile}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<UploadOutlined />}
                onClick={() => importAssets.mutate(file)}
                disabled={importAssets.isPending}
              >
                {importAssets.isPending ? dictionary.register.import.importing : dictionary.register.import.uploadAndImport}
              </Button>
            </Stack>
          ) : (
            <Button variant="outlined" component="label" startIcon={<UploadOutlined />}>
              {dictionary.register.import.selectFile}
              <input hidden type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            </Button>
          )}

          {result && (
            <Box>
              <Alert severity={result.errors?.length ? 'warning' : 'success'} sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>{dictionary.register.import.summary}</Typography>
                <Grid container spacing={2} mt={0.5}>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary" display="block">{dictionary.register.import.imported}</Typography>
                    <Typography variant="h6" color="success.main">{result.imported ?? 0}</Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary" display="block">{dictionary.register.import.skipped}</Typography>
                    <Typography variant="h6" color="warning.main">{result.skipped ?? 0}</Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary" display="block">{dictionary.register.import.errors}</Typography>
                    <Typography variant="h6" color="error.main">{result.errors?.length ?? 0}</Typography>
                  </Grid>
                </Grid>
              </Alert>

              {result.errors?.length > 0 && (
                <Box sx={{ maxHeight: 240, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {result.errors.map((item: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, p: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <ErrorOutline fontSize="small" color="warning" />
                      <Typography variant="body2">
                        <strong>{dictionary.register.import.rowErrorsHeader} {item.row}:</strong> {item.error}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{dictionary.glMappings.form.buttons.cancel}</Button>
      </DialogActions>
    </>
  );
};

export default AssetImportDialogContent;
