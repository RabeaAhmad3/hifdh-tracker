import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Student } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { fetchParentStudents } from '@/hooks/useParentStudents';

interface ParentStudentContextType {
  students: Student[];
  selectedStudent: Student | null;
  setSelectedStudentId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ParentStudentContext = createContext<ParentStudentContextType | null>(
  null,
);

export function ParentStudentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const result = await fetchParentStudents(profile.id);
      setStudents(result);
      // Default to first student if none selected or selected no longer valid
      if (result.length > 0) {
        setSelectedId((prev) => {
          if (prev && result.some((s) => s.id === prev)) return prev;
          return result[0].id;
        });
      }
    } catch {
      // Silently fail — empty student list will show appropriate empty states
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId) ?? null,
    [students, selectedId],
  );

  const value = useMemo(
    () => ({
      students,
      selectedStudent,
      setSelectedStudentId: setSelectedId,
      loading,
      refresh: loadStudents,
    }),
    [students, selectedStudent, loading, loadStudents],
  );

  return (
    <ParentStudentContext.Provider value={value}>
      {children}
    </ParentStudentContext.Provider>
  );
}

export function useParentStudentContext(): ParentStudentContextType {
  const context = useContext(ParentStudentContext);
  if (!context) {
    throw new Error(
      'useParentStudentContext must be used within a ParentStudentProvider',
    );
  }
  return context;
}
