import { View, Text, Pressable } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { CATEGORY_LABELS } from '@/lib/constants';
import { colors } from '@/lib/colors';
import type { CommentEntry } from '@/hooks/useStudentComments';

interface CommentsListProps {
  comments: CommentEntry[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function CommentsList({ comments, loading, hasMore, onLoadMore }: CommentsListProps) {
  if (comments.length === 0) return null;

  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        Teacher Comments
      </Text>

      {comments.map((item, index) => (
        <View
          key={`${item.date}-${item.category}-${index}`}
          className={`py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="font-body text-[12px] text-gray-400">
              {format(parseISO(item.date), 'MMM d')}
            </Text>
            <View className="rounded-chip px-3 py-1" style={{ backgroundColor: `${colors.primary}20` }}>
              <Text className="font-body-medium text-[13px] text-primary">
                {CATEGORY_LABELS[item.category]}
              </Text>
            </View>
          </View>
          <Text className="font-body text-[14px] text-charcoal">{item.notes}</Text>
        </View>
      ))}

      {hasMore && (
        <Pressable
          onPress={onLoadMore}
          disabled={loading}
          className="h-12 items-center justify-center mt-2"
        >
          <Text className="font-body-medium text-[14px] text-primary">
            {loading ? 'Loading...' : 'Load More'}
          </Text>
        </Pressable>
      )}
    </Card>
  );
}
