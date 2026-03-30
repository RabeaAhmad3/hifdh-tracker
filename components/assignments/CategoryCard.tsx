import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { NumericStepper } from '@/components/ui/NumericStepper';
import { CardHeaderOrnament } from '@/components/ui/CardHeaderOrnament';
import { colors } from '@/lib/colors';
import { SURAHS, type Surah } from '@/lib/quran-data';
import type { AssignmentCategory, PassStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryFormData {
  surah_number: number | null;
  surah_name: string | null;
  start_ayah: string;
  end_ayah: string;
  status: PassStatus | null;
  mistakes: number;
  pauses: number;
  pages_completed: number;
  recited_to: string | null;
  notes: string;
}

interface CategoryCardProps {
  category: AssignmentCategory;
  title: string;
  data: CategoryFormData;
  onChange: (data: CategoryFormData) => void;
  teachers: { id: string; full_name: string }[];
  expanded: boolean;
  onToggle: () => void;
}

// ---------------------------------------------------------------------------
// Picker Modal (reusable for surah + teacher)
// ---------------------------------------------------------------------------

interface PickerModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  keyExtractor: (item: T) => string;
  labelExtractor: (item: T) => string;
  sublabelExtractor?: (item: T) => string | null;
  onSelect: (item: T) => void;
}

function PickerModal<T>({
  visible,
  onClose,
  title,
  items,
  keyExtractor,
  labelExtractor,
  sublabelExtractor,
  onSelect,
}: PickerModalProps<T>) {
  const renderItem = useCallback(
    ({ item }: { item: T }) => (
      <Pressable
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        className="flex-row items-center px-4 py-3 border-b border-gray-100"
      >
        <View className="flex-1">
          <Text className="font-body text-[15px] text-charcoal">
            {labelExtractor(item)}
          </Text>
          {sublabelExtractor != null && sublabelExtractor(item) != null && (
            <Text className="font-arabic text-[14px] text-gray-600 mt-0.5">
              {sublabelExtractor(item)}
            </Text>
          )}
        </View>
      </Pressable>
    ),
    [labelExtractor, sublabelExtractor, onSelect, onClose],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-offwhite">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <Text className="font-body-semibold text-[18px] text-charcoal">
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} className="h-12 w-12 items-center justify-center">
            <X size={22} color={colors.charcoal} />
          </Pressable>
        </View>
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pass / Not Pass toggle
// ---------------------------------------------------------------------------

function PassToggle({
  value,
  onChange,
}: {
  value: PassStatus | null;
  onChange: (v: PassStatus) => void;
}) {
  return (
    <View className="flex-row gap-2 mb-4">
      <Pressable
        onPress={() => onChange('pass')}
        className={`flex-1 h-12 items-center justify-center rounded-button border ${
          value === 'pass'
            ? 'bg-success border-success'
            : 'bg-white border-gray-200'
        }`}
      >
        <Text
          className={`font-body-medium text-[14px] ${
            value === 'pass' ? 'text-white' : 'text-charcoal'
          }`}
        >
          Pass
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('not_pass')}
        className={`flex-1 h-12 items-center justify-center rounded-button border ${
          value === 'not_pass'
            ? 'bg-error border-error'
            : 'bg-white border-gray-200'
        }`}
      >
        <Text
          className={`font-body-medium text-[14px] ${
            value === 'not_pass' ? 'text-white' : 'text-charcoal'
          }`}
        >
          Not Pass
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CategoryCard
// ---------------------------------------------------------------------------

export function CategoryCard({
  category,
  title,
  data,
  onChange,
  teachers,
  expanded,
  onToggle,
}: CategoryCardProps) {
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);

  const showMistakesPauses =
    category === 'previous_lesson' || category === 'revision';

  const selectedSurah =
    data.surah_number != null
      ? SURAHS.find((s) => s.number === data.surah_number)
      : null;

  const selectedTeacher =
    data.recited_to != null
      ? teachers.find((t) => t.id === data.recited_to)
      : null;

  const update = (partial: Partial<CategoryFormData>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeaderOrnament />

      {/* Header */}
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between p-4"
      >
        <Text className="font-body-semibold text-[18px] text-charcoal">
          {title}
        </Text>
        {expanded ? (
          <ChevronUp size={20} color={colors.gray600} />
        ) : (
          <ChevronDown size={20} color={colors.gray600} />
        )}
      </Pressable>

      {/* Body (when expanded) */}
      {expanded && (
        <View className="px-4 pb-4">
          {/* Pass / Not Pass */}
          <Text className="font-body-medium text-[13px] text-gray-600 mb-2">
            Status
          </Text>
          <PassToggle
            value={data.status}
            onChange={(v) => update({ status: v })}
          />

          {/* Surah Picker */}
          <Text className="font-body-medium text-[13px] text-gray-600 mb-1">
            Surah
          </Text>
          <Pressable
            onPress={() => setShowSurahPicker(true)}
            className="h-12 rounded-button border border-gray-200 bg-white px-4 justify-center mb-4"
          >
            <Text
              className={`font-body text-[15px] ${
                selectedSurah != null ? 'text-charcoal' : 'text-gray-400'
              }`}
            >
              {selectedSurah != null
                ? `${selectedSurah.number}. ${selectedSurah.name}`
                : 'Select surah...'}
            </Text>
          </Pressable>

          <PickerModal<Surah>
            visible={showSurahPicker}
            onClose={() => setShowSurahPicker(false)}
            title="Select Surah"
            items={SURAHS}
            keyExtractor={(s) => String(s.number)}
            labelExtractor={(s) => `${s.number}. ${s.name}`}
            sublabelExtractor={(s) => s.arabicName}
            onSelect={(s) =>
              update({
                surah_number: s.number,
                surah_name: s.name,
              })
            }
          />

          {/* Ayah range */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Input
                label="Start Ayah"
                placeholder="1"
                value={data.start_ayah}
                onChangeText={(text) =>
                  update({ start_ayah: text.replace(/[^0-9]/g, '') })
                }
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Input
                label="End Ayah"
                placeholder="10"
                value={data.end_ayah}
                onChangeText={(text) =>
                  update({ end_ayah: text.replace(/[^0-9]/g, '') })
                }
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Pages completed */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-body-medium text-[13px] text-gray-600">
              Pages Completed
            </Text>
            <NumericStepper
              value={data.pages_completed}
              onChange={(v) => update({ pages_completed: v })}
              min={0}
              max={20}
            />
          </View>

          {/* Mistakes & Pauses (previous_lesson + revision only) */}
          {showMistakesPauses && (
            <>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-body-medium text-[13px] text-gray-600">
                  Mistakes
                </Text>
                <NumericStepper
                  value={data.mistakes}
                  onChange={(v) => update({ mistakes: v })}
                  min={0}
                  max={99}
                />
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-body-medium text-[13px] text-gray-600">
                  Pauses
                </Text>
                <NumericStepper
                  value={data.pauses}
                  onChange={(v) => update({ pauses: v })}
                  min={0}
                  max={99}
                />
              </View>
            </>
          )}

          {/* Recited to picker */}
          <Text className="font-body-medium text-[13px] text-gray-600 mb-1">
            Recited To
          </Text>
          <Pressable
            onPress={() => setShowTeacherPicker(true)}
            className="h-12 rounded-button border border-gray-200 bg-white px-4 justify-center mb-4"
          >
            <Text
              className={`font-body text-[15px] ${
                selectedTeacher != null ? 'text-charcoal' : 'text-gray-400'
              }`}
            >
              {selectedTeacher != null
                ? selectedTeacher.full_name
                : 'Select teacher...'}
            </Text>
          </Pressable>

          <PickerModal<{ id: string; full_name: string }>
            visible={showTeacherPicker}
            onClose={() => setShowTeacherPicker(false)}
            title="Select Teacher"
            items={teachers}
            keyExtractor={(t) => t.id}
            labelExtractor={(t) => t.full_name}
            onSelect={(t) => update({ recited_to: t.id })}
          />

          {/* Comments */}
          <Input
            label="Comments (optional)"
            placeholder="Additional notes..."
            value={data.notes}
            onChangeText={(text) => update({ notes: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />
        </View>
      )}
    </Card>
  );
}
