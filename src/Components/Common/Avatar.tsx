import React from 'react';
import {View, Text, StyleSheet, Image, ImageSourcePropType} from 'react-native';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {StringUtils} from '../../Helper/StringUtils';

interface AvatarProps {
  name?: string;
  imageUri?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  name = '',
  imageUri,
  size = 40,
  backgroundColor,
  textColor = '#FFFFFF',
}) => {
  const initials = StringUtils.getInitials(name);
  
  // Generate color from name if not provided
  const getColorFromName = (name: string): string => {
    const colors = [
      '#5B8FE8',
      '#EF4444',
      '#10B981',
      '#F59E0B',
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#84CC16',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const avatarColor = backgroundColor || getColorFromName(name);
  const scaledSize = horizontalScale(size);

  if (imageUri) {
    return (
      <View style={[styles.container, {width: scaledSize, height: scaledSize}]}>
        <Image
          source={{uri: imageUri}}
          style={[styles.image, {width: scaledSize, height: scaledSize}]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: scaledSize,
          height: scaledSize,
          borderRadius: scaledSize / 2,
          backgroundColor: avatarColor,
        },
      ]}>
      <Text
        style={[
          styles.initials,
          {
            fontSize: moderateScale(size * 0.4),
            color: textColor,
          },
        ]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 50,
  },
  initials: {
    ...fonts.bold,
  },
});

export default Avatar;

