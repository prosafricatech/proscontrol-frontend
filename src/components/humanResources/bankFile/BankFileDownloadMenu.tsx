'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import {
  AccountBalanceOutlined,
  SearchOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import BankFileFormatSettingsDialog from './BankFileFormatSettingsDialog';
import { BankFileFormatDetail, BankFileFormatOption } from './BankFileFormatType';

interface BankFileDownloadMenuProps {
  /** Fetches + saves the file for the chosen format code — endpoint differs
   * per caller (a payroll run's salary sheet vs. a period's advances), so
   * this component only drives the format picker, not the actual download. */
  onDownload: (formatCode: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * Format picker for "Download Bank File" — lists every registered bank
 * format (see App\Support\Payroll\BankFileFormats) plus a per-format
 * settings (gear) icon for the org-specific values that format needs.
 * Shared between the salary bank-transfer list and the advances transfer
 * sheet, since both already produce the same normalized row shape.
 */
const BankFileDownloadMenu = ({
  onDownload,
  disabled,
}: BankFileDownloadMenuProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [search, setSearch] = useState('');
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [settingsFormat, setSettingsFormat] =
    useState<BankFileFormatDetail | null>(null);

  const { data: formats = [] } = useQuery<BankFileFormatOption[]>({
    queryKey: ['bankFileFormats'],
    queryFn: humanResourcesServices.getBankFileFormats,
  });

  const filteredFormats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return formats;
    return formats.filter((format) =>
      format.label.toLowerCase().includes(term)
    );
  }, [formats, search]);

  const handleDownload = async (code: string) => {
    setAnchorEl(null);
    setSearch('');
    setDownloadingCode(code);
    try {
      await onDownload(code);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    } finally {
      setDownloadingCode(null);
    }
  };

  const handleConfigure = async (code: string) => {
    setAnchorEl(null);
    setSearch('');
    try {
      const detail = await humanResourcesServices.getBankFileFormatSettings(
        code
      );
      setSettingsFormat(detail);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    }
  };

  return (
    <>
      <Tooltip title='Download Bank File'>
        <span>
          <IconButton
            size='small'
            color='primary'
            disabled={disabled || !!downloadingCode}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            {downloadingCode ? (
              <CircularProgress size={20} />
            ) : (
              <AccountBalanceOutlined />
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setSearch('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ width: 320, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1 }}>
            <TextField
              size='small'
              fullWidth
              autoFocus
              placeholder='Search bank format...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchOutlined fontSize='small' />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <List dense sx={{ overflowY: 'auto' }}>
            {filteredFormats.length === 0 && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ px: 2, py: 1 }}
              >
                No matching bank formats
              </Typography>
            )}
            {filteredFormats.map((format) => (
              <ListItemButton
                key={format.code}
                onClick={() => handleDownload(format.code)}
              >
                <ListItemText>{format.label}</ListItemText>
                <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}>
                  <Tooltip title={`Configure ${format.label}`}>
                    <IconButton
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfigure(format.code);
                      }}
                    >
                      <SettingsOutlined fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </ListItemIcon>
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Popover>

      {settingsFormat && (
        <BankFileFormatSettingsDialog
          open={!!settingsFormat}
          format={settingsFormat}
          onClose={() => setSettingsFormat(null)}
          onSaved={() => {
            const code = settingsFormat.code;
            setSettingsFormat(null);
            handleDownload(code);
          }}
        />
      )}
    </>
  );
};

export default BankFileDownloadMenu;
