import '@mui/lab/themeAugmentation';
import { Shadows, ThemeOptions, alpha } from '@mui/material';

const shadows: Shadows = [
  'none',
  '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
  '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
  '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
  '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
  '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
  '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
  '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
  '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
  '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
  '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
  '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
  '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
  '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
  '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
  '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
  '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
  '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
  '0 5px 10px rgba(0, 0, 0, 0.085)',
  '0 5px 10px rgba(0, 0, 0, 0.175)',
];
export const mainTheme: ThemeOptions = {
  type: 'dark',
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 800,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    primary: {
      main: '#2196f3',
      light: '#A67FFB',
      dark: '#5E3BB7',
      contrastText: '#FFF',
    },
    secondary: {
      main: '#E44A77',
      light: '#FF7EA6',
      dark: '#DF295E',
      contrastText: '#FFF',
    },
    error: {
      main: '#E73145',
      light: '#FF6A70',
      dark: '#AD001E',
      contrastText: '#FFF',
    },
    warning: {
      main: '#F39711',
      light: '#FFC84C',
      dark: '#BB6900',
      contrastText: '#FFF',
    },
    info: {
      main: '#2EB5C9',
      light: '#6FE7FC',
      dark: '#b5edf5ff',
      contrastText: '#FFF',
    },
    success: {
      main: '#3BD2A2',
      light: '#07ab2d',
      dark: '#00A073',
      contrastText: '#FFF',
    },
    text: {
      primary: '#C5CDE6',
      secondary: '#9da9b7ff',
      disabled: '#A2B2C3',
    },
    divider: alpha('#FFFFFF', 0.3),
    background: {
      paper: '#26324D',
      default: '#19243B',
    },
    action: {
      active: '#C5CDE6',
      hover: '#323b4f',
      disabled: '#8595A6',
      disabledBackground: '#8595A6',
    },
  },
  shadows: shadows,
  typography: {
    fontFamily: 'NoirPro, Arial',
    fontSize: 14,
    h1: {
      fontSize: '1.5rem',
      lineHeight: 1.2,
      fontWeight: 400,
      color: '#f6f6f6',
      margin: '0 0 .5rem',
    },
    h2: {
      fontSize: '1.4rem',
      lineHeight: 1.2,
      fontWeight: 400,
      color: '#f6f6f6',
      margin: '0 0 .5rem',
    },
    h3: {
      fontSize: '1.25rem',
      lineHeight: 1.2,
      fontWeight: 400,
      color: '#f6f6f6',
      margin: '0 0 .5rem',
    },
    h4: {
      fontSize: '1.1rem',
      lineHeight: 1.2,
      fontWeight: 400,
      color: '#f6f6f6',
      margin: '0 0 .5rem',
    },
    h5: {
      fontSize: '1rem',
      lineHeight: 1.2,
      fontWeight: 400,
      color: '#f6f6f6',
      margin: '0 0 .5rem',
    },
    h6: {
      fontSize: '.875rem',
      lineHeight: 1.2,
      fontWeight: 400,
      color: '#f6f6f6',
      margin: '0 0 .5rem',
    },
    body1: {
      fontSize: '.875rem',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: alpha('#000', 0.1),
        },
        head: {
          letterSpacing: 1.5,
          fontWeight: 400,
          fontSize: 12,
          lineHeight: 1.25,
          background: '#3C475F',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 'auto',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: `0 0.5rem 1.25rem ${alpha('#000000', 0.15)}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          display: 'flex',
          alignItems: 'center',
          '& .MuiAlert-icon': {
            marginRight: 12,
            opacity: 0.9,
          },
          '& .MuiAlert-message': {
            lineHeight: 1.5,
          },
        },
        standardInfo: {
          backgroundColor: '#2EB5C9',
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' },
          '& .MuiAlert-message': { color: '#fff' },
        },
        standardSuccess: {
          backgroundColor: '#3BD2A2',
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' },
          '& .MuiAlert-message': { color: '#fff' },
        },
        standardWarning: {
          backgroundColor: '#fff7e6',
          color: '#5a3d00',
          '& .MuiAlert-icon': { color: '#b56b00' },
        },
        standardError: {
          backgroundColor: '#E73145',
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' },
          '& .MuiAlert-message': { color: '#fff' },
        },
        filledInfo: {
          backgroundColor: '#2EB5C9',
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' },
        },
        filledSuccess: {
          backgroundColor: '#3BD2A2',
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' },
        },
        filledWarning: {
          backgroundColor: '#fff7e6',
          color: '#5a3d00',
          '& .MuiAlert-icon': { color: '#b56b00' },
        },
        filledError: {
          backgroundColor: '#E73145',
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' },
        },
        outlinedInfo: {
          border: '1px solid #2EB5C9',
          color: '#2EB5C9',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9da9b7',
          },
          '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9da9b7',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#9da9b7',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: `0 0.5rem 1.25rem ${alpha('#000000', 0.15)}`,
          ':first-of-type': {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
          ':last-of-type': {
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 20px 20px',
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          paddingInline: 20,
        },
        content: {
          marginBlock: 20,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '18px 24px',
        },
        title: {
          fontSize: '1.1rem',
          marginBottom: 0,
        },
        subheader: {
          margin: '4px 0 0',
        },
        action: {
          margin: 0,
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '8px 24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        // filled: {
        //   '&.MuiChip-colorDefault': {
        //     backgroundColor: '#3C475F',
        //   },
        // },

        sizeSmall: {
          height: 22,
          fontSize: 12,
        },
        labelMedium: {
          paddingInline: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.MuiButton-loading': {
            backgroundColor: '#3C475F',
            color: '#8595A6',
            opacity: 0.7,
            pointerEvents: 'none',

            '& .MuiCircularProgress-root': {
              color: '#A67FFB',
            },
          },
        },
      },
    },
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          '&.MuiLoadingButton-loading': {
            backgroundColor: '#3C475F',
            color: '#8595A6',
            boxShadow: 'none',
            opacity: 0.7,
            pointerEvents: 'none',

            '& .MuiLoadingButton-loadingIndicator': {
              color: '#A67FFB',
            },
          },

          '&.MuiLoadingButton-loading:hover': {
            backgroundColor: '#3C475F',
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          backgroundColor: '#3C475F',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 18,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiAvatarGroup: {
      styleOverrides: {
        avatar: {
          color: '#C5CDE6',
          backgroundColor: '#323b4f',
          fontSize: 16,
          borderColor: alpha('#FFFFFF', 0.1),
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          background: '#3C475F',
        },
      },
    },
  },
};
