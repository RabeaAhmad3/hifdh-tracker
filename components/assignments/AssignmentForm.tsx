import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format, addDays, subDays } from 'date-fns';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/colors';
import {
  fetchForStudentDate,
  fetchTeachers,
  saveStudentDay,
} from '@/hooks/useAssignments';
import type {
  AssignmentCategory,
  BehaviorRating,
  Assignment,
} from '@/lib/types';

import {
  CategoryCard,
  type CategoryFormData,
} from '@/components/assignments/CategoryCard';
import { BehaviorSection } from '@/components/assignments/BehaviorSection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssignmentFormProps {
  studentId: string;
  teacherId: string;
  initialDate?: Date;
  onSaved?: () => void;
}

type CategoryState = Record<AssignmentCategory, CategoryFormData>;
type ExpandedState = Record<AssignmentCategory, boolean>;

const CATEGORIES: { key: AssignmentCategory; title: string }[] = [
  { key: 'new_lesson', title: 'New Lesson' },
  { key: 'previous_lesson', title: 'Previous Lesson' },
  { key: 'revision', title: 'Revision' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultCategoryData(): CategoryFormData {
  return {
    surah_number: null,
    surah_name: null,
    start_ayah: '',
    end_ayah: '',
    status: null,
    mistakes: 0,
    pauses: 0,
    pages_completed: 0,
    recited_to: null,
    notes: '',
  };
}

function defaultCategoryState(): CategoryState {
  return {
    new_lesson: defaultCategoryData(),
    previous_lesson: defaultCategoryData(),
    revision: defaultCategoryData(),
  };
}

function defaultExpandedState(): ExpandedState {
  return {
    new_lesson: false,
    previous_lesson: false,
    revision: false,
  };
}

function assignmentToCategoryData(a: Assignment): CategoryFormData {
  return {
    surah_number: a.surah_number,
    surah_name: a.surah_name,
    start_ayah: a.start_ayah != null ? String(a.start_ayah) : '',
    end_ayah: a.end_ayah != null ? String(a.end_ayah) : '',
    status: a.status,
    mistakes: a.mistakes,
    pauses: a.pauses,
    pages_completed: a.pages_completed,
    recited_to: a.recited_to,
    notes: a.notes ?? '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssignmentForm({
  studentId,
  teacherId,
  initialDate,
  onSaved,
}: AssignmentFormProps) {
  const toast = useToast();

  // Date state
  const [date, setDate] = useState<Date>(initialDate ?? new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Teachers list
  const [teachers, setTeachers] = useState<
    { id: string; full_name: string }[]
  >([]);

  // Category form state
  const [categories, setCategories] = useState<CategoryState>(
    defaultCategoryState,
  );
  const [expanded, setExpanded] = useState<ExpandedState>(
    defaultExpandedState,
  );

  // Behavior state
  const [behaviorRating, setBehaviorRating] = useState<BehaviorRating | null>(
    null,
  );
  const [behaviorNotes, setBehaviorNotes] = useState('');

  // Next assignment
  const [nextAssignment, setNextAssignment] = useState('');

  // Loading / saving
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch teachers on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchTeachers();
        if (!cancelled) setTeachers(result);
      } catch {
        // silently fail — picker just shows empty
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch existing data when date or studentId changes
  // ---------------------------------------------------------------------------

  const loadExistingData = useCallback(
    async (d: Date) => {
      setLoading(true);
      try {
        const dateStr = format(d, 'yyyy-MM-dd');
        const { assignments, behavior } = await fetchForStudentDate(
          studentId,
          dateStr,
        );

        // Reset to defaults first
        const newCategories = defaultCategoryState();
        const newExpanded = defaultExpandedState();

        // Populate from existing assignments
        for (const a of assignments) {
          const cat = a.category as AssignmentCategory;
          if (cat in newCategories) {
            newCategories[cat] = assignmentToCategoryData(a);
            newExpanded[cat] = true;
          }
        }

        setCategories(newCategories);
        setExpanded(newExpanded);

        // Populate behavior
        if (behavior != null) {
          setBehaviorRating(behavior.rating);
          setBehaviorNotes(behavior.notes ?? '');
        } else {
          setBehaviorRating(null);
          setBehaviorNotes('');
        }

        // Populate next assignment from the new_lesson row
        const newLessonAssignment = assignments.find(
          (a) => a.category === 'new_lesson',
        );
        setNextAssignment(newLessonAssignment?.next_assignment ?? '');
      } catch {
        toast.show('Failed to load data for this date', 'error');
      } finally {
        setLoading(false);
      }
    },
    [studentId, toast],
  );

  useEffect(() => {
    loadExistingData(date);
  }, [date, loadExistingData]);

  // ---------------------------------------------------------------------------
  // Date navigation
  // ---------------------------------------------------------------------------

  const goToPreviousDay = () => setDate((d) => subDays(d, 1));
  const goToNextDay = () => setDate((d) => addDays(d, 1));

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate != null) {
      setDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Category updates
  // ---------------------------------------------------------------------------

  const updateCategory = (
    cat: AssignmentCategory,
    data: CategoryFormData,
  ) => {
    setCategories((prev) => ({ ...prev, [cat]: data }));
  };

  const toggleCategory = (cat: AssignmentCategory) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');

      const categoryPayloads = CATEGORIES.map(({ key }) => {
        const d = categories[key];
        return {
          category: key,
          enabled: expanded[key],
          surah_number: d.surah_number,
          surah_name: d.surah_name,
          start_ayah: d.start_ayah ? parseInt(d.start_ayah, 10) : null,
          end_ayah: d.end_ayah ? parseInt(d.end_ayah, 10) : null,
          status: d.status,
          mistakes: d.mistakes,
          pauses: d.pauses,
          pages_completed: d.pages_completed,
          recited_to: d.recited_to,
          notes: d.notes.trim() || null,
        };
      });

      const { error } = await saveStudentDay({
        studentId,
        teacherId,
        date: dateStr,
        categories: categoryPayloads,
        behavior:
          behaviorRating != null
            ? {
                rating: behaviorRating,
                notes: behaviorNotes.trim() || null,
              }
            : null,
        nextAssignment: nextAssignment.trim() || null,
      });

      if (error != null) {
        toast.show(error, 'error');
      } else {
        toast.show('Saved successfully', 'success');
        onSaved?.();
      }
    } catch {
      toast.show('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const dateDisplay = format(date, 'EEE, MMM d, yyyy');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-offwhite"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date navigator */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            onPress={goToPreviousDay}
            className="h-12 w-12 items-center justify-center"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.primary} />
          </Pressable>

          <Pressable onPress={() => setShowDatePicker(true)}>
            <Text className="font-body-semibold text-[16px] text-charcoal">
              {dateDisplay}
            </Text>
          </Pressable>

          <Pressable
            onPress={goToNextDay}
            className="h-12 w-12 items-center justify-center"
            hitSlop={8}
          >
            <ChevronRight size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Date picker (conditional) */}
        {showDatePicker && (
          <View className="mb-4">
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
            />
            {Platform.OS === 'ios' && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowDatePicker(false)}
              >
                Done
              </Button>
            )}
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <Text className="font-body text-[14px] text-gray-400 text-center mb-4">
            Loading...
          </Text>
        )}

        {/* Category cards */}
        {CATEGORIES.map(({ key, title }) => (
          <View key={key} className="mb-4">
            <CategoryCard
              category={key}
              title={title}
              data={categories[key]}
              onChange={(data) => updateCategory(key, data)}
              teachers={teachers}
              expanded={expanded[key]}
              onToggle={() => toggleCategory(key)}
            />
          </View>
        ))}

        {/* Next assignment */}
        <View className="mb-6">
          <Input
            label="Next Assignment"
            placeholder="What should the student prepare next..."
            value={nextAssignment}
            onChangeText={setNextAssignment}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            style={{ minHeight: 60 }}
          />
        </View>

        {/* Behavior section */}
        <View className="mb-6">
          <BehaviorSection
            value={behaviorRating}
            onChange={setBehaviorRating}
            notes={behaviorNotes}
            onNotesChange={setBehaviorNotes}
          />
        </View>

        {/* Save button */}
        <Button onPress={handleSave} loading={saving} disabled={loading}>
          Save
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
