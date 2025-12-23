import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {removeSnackbar, SnackbarType} from '../../Redux/snackbarSlice';

const Snackbar: React.FC = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {snackbars} = useSelector((state: any) => state.snackbar);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(
    (id: string) => {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        dispatch(removeSnackbar(id));
        // Reset animations for next snackbar
        slideAnim.setValue(-100);
        opacityAnim.setValue(0);
      });
    },
    [dispatch, slideAnim, opacityAnim],
  );

  useEffect(() => {
    if (snackbars.length > 0) {
      const currentSnackbar = snackbars[0];

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Reset animations first
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);

      // Small delay to ensure smooth transition
      setTimeout(() => {
        // Slide in animation
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);

      // Auto dismiss after duration
      timerRef.current = setTimeout(() => {
        handleDismiss(currentSnackbar.id);
      }, currentSnackbar.duration || 3000);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    } else {
      // Reset animations when no snackbars
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
    }
  }, [snackbars, handleDismiss, slideAnim, opacityAnim]);

  if (snackbars.length === 0) {
    return null;
  }

  const currentSnackbar = snackbars[0];
  const getSnackbarStyle = () => {
    switch (currentSnackbar.type) {
      case SnackbarType.SUCCESS:
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle',
          iconColor: '#FFFFFF',
        };
      case SnackbarType.ERROR:
        return {
          backgroundColor: '#EF4444',
          icon: 'close-circle',
          iconColor: '#FFFFFF',
        };
      case SnackbarType.WARNING:
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning',
          iconColor: '#FFFFFF',
        };
      case SnackbarType.INFO:
      default:
        return {
          backgroundColor: '#5B8FE8',
          icon: 'information-circle',
          iconColor: '#FFFFFF',
        };
    }
  };

  const snackbarStyle = getSnackbarStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + verticalScale(10),
          transform: [{translateY: slideAnim}],
          opacity: opacityAnim,
        },
      ]}>
      <View
        style={[
          styles.snackbar,
          {backgroundColor: snackbarStyle.backgroundColor},
        ]}>
        <Icon
          name={snackbarStyle.icon}
          size={20}
          color={snackbarStyle.iconColor}
        />
        <Text style={styles.message}>{currentSnackbar.message}</Text>
        <TouchableOpacity
          onPress={() => handleDismiss(currentSnackbar.id)}
          style={styles.closeButton}>
          <Icon name="close" size={18} color={snackbarStyle.iconColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: horizontalScale(16),
    right: horizontalScale(16),
    zIndex: 9999,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: horizontalScale(12),
  },
  message: {
    flex: 1,
    fontSize: moderateScale(14),
    ...fonts.medium,
    color: '#FFFFFF',
  },
  closeButton: {
    padding: moderateScale(4),
  },
});

export default Snackbar;

