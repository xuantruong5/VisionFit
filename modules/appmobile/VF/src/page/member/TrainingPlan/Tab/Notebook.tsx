import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../../../general/theme';

/**
 * Notebook Tab - Đã chuyển đổi sang Module Sổ Tay chính (src/page/member/SoTay)
 * Chuyển hướng an toàn khi được kích hoạt.
 */
const Notebook = ({ navigation }: any) => {
  useEffect(() => {
    if (navigation?.navigate) {
      navigation.navigate('Sổ Tay');
    }
  }, [navigation]);

  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default Notebook;