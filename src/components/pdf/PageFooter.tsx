import { Text, View } from '@react-pdf/renderer';
import pdfStyles from './pdf-styles';

function PageFooter() {
  return (
    <View style={pdfStyles.footer}>
      <Text>Powered by: proserp.co.tz</Text>
    </View>
  );
}

export default PageFooter;
