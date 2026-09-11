import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';

const formatAmount = (amount) =>
  amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TrialBalanceGroupedOnScreen = ({ reportData, authOrganization }) => {
  const theme = useTheme();
  const [openRows, setOpenRows] = useState([]);

  const mainColor = authOrganization?.organization.settings?.main_color || '#2113AD';
  const headerColor = theme.type === 'dark' ? '#29f096' : mainColor;
  const contrastText = authOrganization?.organization.settings?.contrast_text || '#FFFFFF';

  if (!reportData) return null;

  const toggleRow = (rowId) => {
    setOpenRows((prevOpenRows) =>
      prevOpenRows.includes(rowId)
        ? prevOpenRows.filter((id) => id !== rowId)
        : [...prevOpenRows, rowId]
    );
  };

  const renderGroup = (group, level) => {
    const hasChildren = (group.children?.length > 0) || (group.ledgers?.length > 0);
    const isOpen = openRows.includes(`g-${group.id}`);

    return (
      <React.Fragment key={`g-${group.id}`}>
        <TableRow
          onClick={() => hasChildren && toggleRow(`g-${group.id}`)}
          sx={{ cursor: hasChildren ? 'pointer' : 'default', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <TableCell style={{ paddingLeft: level * 20 }}>
            {hasChildren && (isOpen ? <KeyboardArrowDown /> : <KeyboardArrowRight />)}
            <span style={{ fontWeight: 'bold', marginLeft: 5 }}>{group.name}</span>
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
            {group.balance?.side === 'DR' && formatAmount(group.balance.amount)}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
            {group.balance?.side === 'CR' && formatAmount(group.balance.amount)}
          </TableCell>
        </TableRow>
        {isOpen && group.children?.map((child) => renderGroup(child, level + 1))}
        {isOpen && group.ledgers?.map((ledger) => (
          <TableRow key={`l-${ledger.id}`}>
            <TableCell style={{ paddingLeft: (level + 1) * 20 }}>{ledger.name}</TableCell>
            <TableCell align="right">
              {ledger.balance?.side === 'DR' && formatAmount(ledger.balance.amount)}
            </TableCell>
            <TableCell align="right">
              {ledger.balance?.side === 'CR' && formatAmount(ledger.balance.amount)}
            </TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="trial-balance-grouped">
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: headerColor, color: contrastText }}>LEDGER GROUP</TableCell>
            <TableCell align="right" sx={{ backgroundColor: headerColor, color: contrastText }}>DEBIT</TableCell>
            <TableCell align="right" sx={{ backgroundColor: headerColor, color: contrastText }}>CREDIT</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reportData.groups?.map((group) => renderGroup(group, 0))}
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText, borderBottom: 'none' }}>
              TOTAL
            </TableCell>
            <TableCell align="right" sx={{ backgroundColor: mainColor, color: contrastText, borderBottom: 'none' }}>
              {formatAmount(reportData.totalDebit)}
            </TableCell>
            <TableCell align="right" sx={{ backgroundColor: mainColor, color: contrastText, borderBottom: 'none' }}>
              {formatAmount(reportData.totalCredit)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TrialBalanceGroupedOnScreen;
