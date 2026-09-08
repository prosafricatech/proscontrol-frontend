'use client'
import React, { useState } from 'react'
import { InventoryOutlined, MoreHorizOutlined, ViewTimelineOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import ItemMovement from './ItemMovement';
import ConvertToAssetDialogContent from './ConvertToAssetDialogContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function StockListItemAction({productStock}) {
   const [openMovementDialog, setOpenMovementDialog] = useState(false);
   const [openConvertDialog, setOpenConvertDialog] = useState(false);
   const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();

   //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const canConvertToAsset = productStock.type === 'Inventory'
    && productStock.balance > 0
    && organizationHasSubscribed(MODULES.ASSET_REGISTER)
    && checkOrganizationPermission([PERMISSIONS.ASSETS_CREATE]);

    const menuItems = [
      {icon: <ViewTimelineOutlined/>, title: 'Movement', action: 'movement'},
      ...(canConvertToAsset ? [{icon: <InventoryOutlined/>, title: 'Convert to Asset', action: 'convert_to_asset'}] : []),
    ];

    const handleItemAction = (menuItem) => {
      switch (menuItem.action) {
        case 'movement':
          setOpenMovementDialog(true);
        break;
        case 'convert_to_asset':
          setOpenConvertDialog(true);
        break;
      default:
      }
    }

  return  (
    <React.Fragment>
      <Dialog
        open={openMovementDialog}
        scroll={'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
      >
        <ItemMovement productStock={productStock} toggleOpen={setOpenMovementDialog} />
      </Dialog>
      {canConvertToAsset && (
        <Dialog
          open={openConvertDialog}
          scroll={'paper'}
          fullWidth
          fullScreen={belowLargeScreen}
          maxWidth='sm'
        >
          <ConvertToAssetDialogContent productStock={productStock} toggleOpen={setOpenConvertDialog} />
        </Dialog>
      )}
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined/>
          </Tooltip>
        }
          menuItems={menuItems}
          onClickCallback={handleItemAction}
        />
      </React.Fragment>
  )
}

export default StockListItemAction