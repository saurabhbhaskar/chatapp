import React, {useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated} from 'react-native';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import {TimeUtils} from '../../Helper/TimeUtils';
import Avatar from './Avatar';
import Icon from 'react-native-vector-icons/Ionicons';

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
  onReply?: () => void;
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
  onReply,
  senderName,
  senderAvatar,
  showSenderInfo = false,
}) => {
  const messageTime = TimeUtils.formatTime(timestamp);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // PanResponder for swipe-to-reply (own messages: left swipe, other messages: right swipe)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isDeleted,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isDeleted) return false;
        // Own messages: respond to left swipes (dx < -10)
        // Other messages: respond to right swipes (dx > 10)
        return isOwn ? gestureState.dx < -10 : gestureState.dx > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isOwn) {
          // Own messages: swiping left
          if (gestureState.dx < 0) {
            const swipeDistance = Math.max(gestureState.dx, -80);
            translateX.setValue(swipeDistance);
            opacity.setValue(Math.min(Math.abs(swipeDistance) / 80, 1));
          }
        } else {
          // Other messages: swiping right
          if (gestureState.dx > 0) {
            const swipeDistance = Math.min(gestureState.dx, 80);
            translateX.setValue(swipeDistance);
            opacity.setValue(Math.min(swipeDistance / 80, 1));
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isOwn) {
          // Own messages: left swipe
          if (gestureState.dx < -50 && onReply) {
            // Swiped enough to trigger reply
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: -80,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // Trigger reply callback
              setTimeout(() => {
                onReply();
                // Reset animation
                Animated.parallel([
                  Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                  }),
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                ]).start();
              }, 100);
            });
          } else {
            // Not enough swipe, reset
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        } else {
          // Other messages: right swipe
          if (gestureState.dx > 50 && onReply) {
            // Swiped enough to trigger reply
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 80,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // Trigger reply callback
              setTimeout(() => {
                onReply();
                // Reset animation
                Animated.parallel([
                  Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                  }),
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                ]).start();
              }, 100);
            });
          } else {
            // Not enough swipe, reset
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      },
    }),
  ).current;

  // For group messages from others, show avatar on left
  if (showSenderInfo && !isOwn) {
    // If replying, use replied message length; otherwise use current message length
    const messageLengthForWidth = replyTo ? (replyTo.text?.length || 0) : text.length;
    const isShortMessage = messageLengthForWidth < 30;
    return (
      <View style={styles.groupContainer}>
        {/* Swipe indicator for other messages (left side) */}
        <Animated.View
          style={[
            styles.swipeIndicator,
            styles.swipeIndicatorLeft,
            {
              opacity,
              transform: [{translateX}],
            },
          ]}>
          <Icon name="arrow-forward" size={20} color={colors.white} />
          <Text style={styles.swipeText}>Reply</Text>
        </Animated.View>

        <View style={styles.groupContainerInner} {...panResponder.panHandlers}>
          {/* Avatar on the left */}
          <View style={styles.avatarContainerLeft}>
            <Avatar
              name={senderName || 'User'}
              imageUri={senderAvatar}
              size={32}
            />
          </View>
          
          {/* Message container on the right */}
          <Animated.View
            style={[
              styles.groupMessageWrapper,
              isShortMessage && styles.shortMessageWrapper,
              {transform: [{translateX}]},
            ]}>
            <TouchableOpacity
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.messageWrapper}>
          {/* Forwarded Label */}
          {forwardedFrom && (
            <Text style={styles.forwardedLabel}>Forwarded</Text>
          )}

          {/* Message Bubble */}
          <View style={[
            styles.bubble,
            styles.otherBubble,
            isShortMessage && styles.shortBubble,
          ]}>
            {/* Sender Name inside bubble at top */}
            {senderName && (
              <Text style={styles.senderNameInside}>{senderName}</Text>
            )}

            {/* Reply Preview */}
            {replyTo && (
              <View style={[styles.replyPreview, (replyTo.text?.length || 0) < 30 && styles.shortReplyPreview]}>
                <View style={styles.replyLine} />
                <View style={[styles.replyContent, (replyTo.text?.length || 0) < 30 && styles.shortReplyContent]}>
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
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // For own messages or direct chat messages (no avatar/name display)
  // If replying, use replied message length; otherwise use current message length
  const messageLengthForWidth = replyTo ? (replyTo.text?.length || 0) : text.length;
  const isShortMessage = messageLengthForWidth < 30;
  
  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer,
        isShortMessage && !isOwn && styles.shortContainer,
      ]}>
      {/* Swipe indicator for own messages (left side) */}
      {isOwn && (
        <Animated.View
          style={[
            styles.swipeIndicator,
            styles.swipeIndicatorRight,
            {
              opacity,
              transform: [{translateX}],
            },
          ]}>
          <Icon name="arrow-back" size={20} color={colors.white} />
          <Text style={styles.swipeText}>Reply</Text>
        </Animated.View>
      )}

      {/* Swipe indicator for other messages (left side) */}
      {!isOwn && (
        <Animated.View
          style={[
            styles.swipeIndicator,
            styles.swipeIndicatorLeft,
            {
              opacity,
              transform: [{translateX}],
            },
          ]}>
          <Icon name="arrow-forward" size={20} color={colors.white} />
          <Text style={styles.swipeText}>Reply</Text>
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.animatedWrapper,
          {transform: [{translateX}]},
        ]}
        {...panResponder.panHandlers}>
        <TouchableOpacity
          onLongPress={onLongPress}
          activeOpacity={0.7}
          style={styles.messageWrapper}>
          {/* Forwarded Label */}
          {forwardedFrom && (
            <Text style={styles.forwardedLabel}>Forwarded</Text>
          )}

          {/* Reply Preview */}
          {replyTo && (
            <View style={[styles.replyPreview, (replyTo.text?.length || 0) < 30 && styles.shortReplyPreview]}>
              <View style={styles.replyLine} />
              <View style={[styles.replyContent, (replyTo.text?.length || 0) < 30 && styles.shortReplyContent]}>
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
              isShortMessage && !isOwn && styles.shortBubble,
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: verticalScale(6),
    maxWidth: '80%',
  },
  shortContainer: {
    maxWidth: '60%',
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
    marginVertical: verticalScale(6),
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  groupContainerInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  avatarContainer: {
    marginRight: horizontalScale(8),
    marginTop: verticalScale(2),
  },
  avatarContainerLeft: {
    marginRight: horizontalScale(8),
    marginTop: verticalScale(2),
  },
  groupMessageWrapper: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  shortMessageWrapper: {
    maxWidth: '60%',
  },
  shortBubble: {
    alignSelf: 'flex-start',
  },
  senderNameInside: {
    fontSize: moderateScale(13),
    ...fonts.semiBold,
    color: '#1976D2',
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
    alignSelf: 'flex-start',
  },
  shortReplyPreview: {
    maxWidth: '70%',
  },
  replyLine: {
    width: 3,
    backgroundColor: colors.primary,
    marginRight: horizontalScale(8),
    borderRadius: 2,
    flexShrink: 0,
  },
  replyContent: {
    flexShrink: 1,
    minWidth: 0,
  },
  shortReplyContent: {
    maxWidth: '100%',
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  ownBubble: {
    backgroundColor: '#E5E7EB',
    borderBottomRightRadius: moderateScale(4),
  },
  otherBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    fontSize: moderateScale(16),
    ...fonts.regular,
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(2),
  },
  ownText: {
    color: colors.text,
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
    color: colors.textSecondary,
  },
  otherTime: {
    color: colors.textSecondary,
  },
  animatedWrapper: {
    width: '100%',
    flexShrink: 1,
  },
  messageWrapper: {
    width: '100%',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: verticalScale(-15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(20),
    gap: horizontalScale(6),
    zIndex: 1,
  },
  swipeIndicatorRight: {
    right: horizontalScale(-90),
  },
  swipeIndicatorLeft: {
    left: horizontalScale(-90),
  },
  swipeText: {
    fontSize: moderateScale(12),
    ...fonts.semiBold,
    color: colors.white,
  },
});

export default MessageBubble;

