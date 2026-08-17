import { Text, View } from '@react-pdf/renderer';
import pdfStyles from './pdf-styles';

const PageNumber = () => {
  return (
    <View style={{ ...pdfStyles.footer, bottom: 2 }} fixed>
      <Text
        style={{ ...pdfStyles.minInfo, marginTop: 2 }}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
};

export default PageNumber;
