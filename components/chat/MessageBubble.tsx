import React from 'react';
import { View, Text } from 'react-native';
import { format } from 'date-fns';
import type { MessageWithSender } from '@/lib/types';

interface MessageBubbleProps {
  message: MessageWithSender;
  isSent: boolean;
  showSenderName?: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isSent,
  showSenderName = false,
}: MessageBubbleProps) {
  const time = format(new Date(message.created_at), 'h:mm a');

  return (
    <View className={`mb-2 px-4 ${isSent ? 'items-end' : 'items-start'}`}>
      {showSenderName && !isSent && (
        <Text className="mb-1 ml-2 font-body-medium text-[12px] text-gray-600">
          {message.sender_name}
        </Text>
      )}
      <View
        className={`max-w-[80%] px-4 py-2.5 ${
          isSent
            ? 'rounded-2xl rounded-br-sm bg-primary'
            : 'rounded-2xl rounded-bl-sm border border-gray-100 bg-white'
        }`}
      >
        <Text
          className={`font-body text-[15px] ${isSent ? 'text-white' : 'text-charcoal'}`}
        >
          {message.content}
        </Text>
      </View>
      <Text className="mt-1 px-2 text-[11px] text-gray-400">{time}</Text>
    </View>
  );
});
