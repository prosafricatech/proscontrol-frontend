import { Text, View } from '@react-pdf/renderer';
import pdfStyles from './pdf-styles';

function PageFooter() {
  return (
    <View style={pdfStyles.footer}>
      <Text>Powered by: proserp.co.tz</Text>
      <Text
        style={{ ...pdfStyles.minInfo, marginTop: 2 }}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export default PageFooter;
