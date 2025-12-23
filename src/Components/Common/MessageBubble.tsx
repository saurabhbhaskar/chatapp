import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import {TimeUtils} from '../../Helper/TimeUtils';
import Avatar from './Avatar';

interface MessageBubbleProps {
  text: string;
  isOwn: boolean;
  timestamp: number;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  } | null;
  forwardedFrom?: string;
  isDeleted?: boolean;
  onLongPress?: () => void;
  senderName?: string;
  senderAvatar?: string;
  showSenderInfo?: boolean; // For group chats, show sender name/avatar for others' messages
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isOwn,
  timestamp,
  replyTo,
  forwardedFrom,
  isDeleted = false,
  onLongPress,
  senderName,
  senderAvatar,
  showSenderInfo = false,
}) => {
  const messageTime = TimeUtils.formatTime(timestamp);

  // For group messages from others, show avatar on left
  if (showSenderInfo && !isOwn) {
    return (
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={styles.groupContainer}>
        {/* Avatar on the left */}
        <View style={styles.avatarContainer}>
          <Avatar
            name={senderName || 'User'}
            imageUri={senderAvatar}
            size={32}
          />
        </View>
        
        {/* Message container on the right */}
        <View style={styles.groupMessageWrapper}>
          {/* Forwarded Label */}
          {forwardedFrom && (
            <Text style={styles.forwardedLabel}>Forwarded</Text>
          )}

          {/* Message Bubble */}
          <View style={[styles.bubble, styles.otherBubble]}>
            {/* Sender Name inside bubble at top */}
            {senderName && (
              <Text style={styles.senderNameInside}>{senderName}</Text>
            )}

            {/* Reply Preview */}
            {replyTo && (
              <View style={styles.replyPreview}>
                <View style={styles.replyLine} />
                <View style={styles.replyContent}>
                  <Text style={styles.replySender}>{replyTo.senderName}</Text>
                  <Text style={styles.replyText} numberOfLines={1}>
                    {replyTo.text || 'Media'}
                  </Text>
                </View>
              </View>
            )}

            {/* Message Text */}
            <Text
              style={[
                styles.messageText,
                styles.otherText,
                isDeleted && styles.deletedText,
              ]}>
              {isDeleted ? 'Message deleted' : text}
            </Text>
            
            {/* Timestamp */}
            <Text style={[styles.timeText, styles.otherTime]}>
              {messageTime}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // For own messages or direct chat messages (no avatar/name display)
  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer,
      ]}>
      {/* Forwarded Label */}
      {forwardedFrom && (
        <Text style={styles.forwardedLabel}>Forwarded</Text>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyLine} />
          <View style={styles.replyContent}>
            <Text style={styles.replySender}>{replyTo.senderName}</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyTo.text || 'Media'}
            </Text>
          </View>
        </View>
      )}

      {/* Message Bubble */}
      <View
        style={[
          styles.bubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
        ]}>
        <Text
          style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
            isDeleted && styles.deletedText,
          ]}>
          {isDeleted ? 'Message deleted' : text}
        </Text>
        <Text
          style={[
            styles.timeText,
            isOwn ? styles.ownTime : styles.otherTime,
          ]}>
          {messageTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: verticalScale(6),
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  // Group message layout (avatar on left, message on right)
  groupContainer: {
    flexDirection: 'row',
    marginVertical: verticalScale(6),
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: horizontalScale(8),
    marginTop: verticalScale(2),
  },
  groupMessageWrapper: {
    flex: 1,
    flexShrink: 1,
  },
  senderNameInside: {
    fontSize: moderateScale(13),
    ...fonts.semiBold,
    color: colors.primary,
    marginBottom: verticalScale(4),
  },
  forwardedLabel: {
    fontSize: moderateScale(10),
    ...fonts.regular,
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
    marginLeft: horizontalScale(4),
  },
  replyPreview: {
    flexDirection: 'row',
    marginBottom: verticalScale(4),
    paddingLeft: horizontalScale(8),
    maxWidth: '100%',
  },
  replyLine: {
    width: 3,
    backgroundColor: colors.primary,
    marginRight: horizontalScale(8),
    borderRadius: 2,
  },
  replyContent: {
    flex: 1,
  },
  replySender: {
    fontSize: moderateScale(12),
    ...fonts.semiBold,
    color: colors.primary,
    marginBottom: verticalScale(2),
  },
  replyText: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: colors.textSecondary,
  },
  bubble: {
    paddingHorizontal: horizontalScale(12),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(8),
    borderRadius: moderateScale(18),
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: '#000000',
    borderBottomRightRadius: moderateScale(4),
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    fontSize: moderateScale(16),
    ...fonts.regular,
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(2),
  },
  ownText: {
    color: colors.white,
  },
  otherText: {
    color: colors.text,
  },
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  timeText: {
    fontSize: moderateScale(11),
    ...fonts.regular,
    marginTop: 0,
    alignSelf: 'flex-end',
  },
  ownTime: {
    color: colors.white,
    opacity: 0.7,
  },
  otherTime: {
    color: colors.textSecondary,
  },
});

export default MessageBubble;

