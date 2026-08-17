import { StyleSheet } from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    position: 'relative',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  watermarkText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#CCCCCC',
  },
  table: {
    display: 'table' as any,
    width: '100%',
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    fontSize: '8px',
    padding: 2,
    marginRight: 1,
  },
  borderedTableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    margin: 'none',
  },
  normalTableHeader: {
    backgroundColor: '#bdbdbd',
    margin: 'none',
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: '10px',
    padding: 4,
    marginRight: 1,
    backgroundColor: '#acacac',
  },
  majorInfo: {
    fontSize: '12px',
    padding: 3,
  },
  midInfo: {
    fontSize: '10px',
    padding: 2,
  },
  minInfo: {
    fontSize: '8px',
    padding: 1,
    color: '#6d6d6e',
  },
  microInfo: {
    fontSize: '5px',
    padding: 0.5,
  },
  contrastTableHeader: {
    padding: 3,
    fontSize: '12px',
  },
  dottedLine: {
    textAlign: 'center',
    letterSpacing: 5,
    fontSize: '6px',
  },
  blackLine: {
    borderBottomWidth: 1.5,
    borderColor: 'black',
    marginBottom: 1,
  },
  shadedBG: '#d5d5d5' as any,
});

export default pdfStyles;
