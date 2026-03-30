import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ProgressArc } from '@/components/ui/ProgressArc';

interface QuranProgressSectionProps {
  currentJuz: number | null;
  currentSurah: string | null;
}

export function QuranProgressSection({ currentJuz, currentSurah }: QuranProgressSectionProps) {
  const juz = currentJuz ?? 0;
  const progress = juz / 30;

  return (
    <Card className="mb-4">
      <Text className="font-body-semibold text-[15px] text-charcoal mb-3">
        Quran Progress
      </Text>
      <View className="items-center">
        <ProgressArc
          size={120}
          progress={progress}
          label={`${juz}/30`}
          strokeWidth={10}
        />
        {currentSurah != null && (
          <Text className="font-arabic text-[18px] text-charcoal mt-3">
            {currentSurah}
          </Text>
        )}
        <Text className="font-body text-[13px] text-gray-400 mt-1">
          Juz {juz} of 30
        </Text>
      </View>
    </Card>
  );
}
