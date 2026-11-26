import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../general/theme';

interface GenderPillSelectorProps {
  selectedGender: 'male' | 'female';
  onSelectGender: (gender: 'male' | 'female') => void;
}

const GenderPillSelector: React.FC<GenderPillSelectorProps> = ({
  selectedGender,
  onSelectGender,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pill,
          selectedGender === 'male' && styles.pillActive,
        ]}
        onPress={() => onSelectGender('male')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="male"
          size={18}
          color={selectedGender === 'male' ? COLORS.white : COLORS.textMuted}
          style={styles.icon}
        />
        <Text
          style={[
            styles.label,
            selectedGender === 'male' && styles.labelActive,
          ]}
        >
          Dành cho nam
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.pill,
          selectedGender === 'female' && styles.pillActive,
        ]}
        onPress={() => onSelectGender('female')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="female"
          size={18}
          color={selectedGender === 'female' ? COLORS.white : COLORS.textMuted}
          style={styles.icon}
        />
        <Text
          style={[
            styles.label,
            selectedGender === 'female' && styles.labelActive,
          ]}
        >
          Dành cho nữ
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default GenderPillSelector;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 20,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  labelActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
