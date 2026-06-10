import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../styles/colors';

const logo = require('../../../assets/Copilot_20260608_111229 (1).png');

export default function Header({ title, subtitle, backLabel, onBack, children }) {
  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        {backLabel ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{'<'} {backLabel}</Text>
          </Pressable>
        ) : null}
        <View style={styles.titleRow}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <View style={styles.titleBlock}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    borderBottomWidth: 3,
    borderBottomColor: colors.orange,
  },
  inner: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  titleRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#f3d6c9',
    marginTop: 4,
    fontSize: 14,
  },
});

