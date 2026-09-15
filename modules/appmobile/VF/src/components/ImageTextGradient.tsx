import React from 'react';
import {StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ImageTextGradient = () => (
  <LinearGradient
    colors={[
      'rgba(0, 55, 75, 0.98)',
      'rgba(0, 75, 92, 0.90)',
      'rgba(0, 90, 105, 0.62)',
      'rgba(0, 100, 115, 0.28)',
      'rgba(0, 100, 115, 0)',
    ]}
    locations={[0, 0.25, 0.5, 0.75, 1]}
    start={{x: 0, y: 0.5}}
    end={{x: 1, y: 0.5}}
    style={styles.gradient}
  />
);

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '78%',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
});

export default ImageTextGradient;