import { View, Text, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { UserPlus, CheckCircle } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useInviteCode } from '@/hooks/useInviteCode';
import { colors } from '@/lib/colors';

interface InviteParentCardProps {
  studentId: string;
  studentName: string;
}

export function InviteParentCard({ studentId, studentName }: InviteParentCardProps) {
  const { inviteCode, parentName, loading, generating, error, generate, refresh } =
    useInviteCode(studentId);
  const toast = useToast();

  if (loading) return null;

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await Clipboard.setStringAsync(inviteCode.code);
      toast.show('Code copied!', 'success');
    } catch {
      toast.show('Failed to copy code', 'error');
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join Hifdh Tracker to follow ${studentName}'s progress.\nInvite code: ${inviteCode.code}`,
      });
    } catch {
      // User cancelled share — no action needed
    }
  };

  // State C — Code redeemed
  if (inviteCode?.status === 'used') {
    return (
      <Card className="mx-4 mb-3">
        <View className="flex-row items-center gap-2 mb-2">
          <CheckCircle size={20} color={colors.success} />
          <Text className="font-heading text-[17px] text-charcoal">Parent Linked</Text>
        </View>
        {parentName && (
          <Text className="font-body-semibold text-[15px] text-charcoal">{parentName}</Text>
        )}
        <Text className="text-[13px] font-body" style={{ color: colors.success }}>
          Account linked successfully
        </Text>
      </Card>
    );
  }

  // State B — Pending code
  if (inviteCode?.status === 'pending') {
    return (
      <Card className="mx-4 mb-3">
        <Text className="font-heading text-[17px] text-charcoal mb-3">Invite Parent</Text>

        <View className="bg-primary-light rounded-button p-3 items-center mb-2">
          <Text className="font-heading text-[28px] text-primary" style={{ letterSpacing: 4 }}>
            {inviteCode.code}
          </Text>
        </View>

        <Text className="font-body text-[13px] text-gray-600 text-center mb-3">
          Expires in {formatDistanceToNow(new Date(inviteCode.expires_at))}
        </Text>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button variant="secondary" size="sm" onPress={handleCopy}>
              Copy
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="ghost" size="sm" onPress={handleShare}>
              Share
            </Button>
          </View>
        </View>

        {error && (
          <Text className="font-body text-[13px] text-error mt-2 text-center">{error}</Text>
        )}
      </Card>
    );
  }

  // State A — No active code
  return (
    <Card className="mx-4 mb-3">
      <View className="flex-row items-center gap-2 mb-2">
        <UserPlus size={20} color={colors.primary} />
        <Text className="font-heading text-[17px] text-charcoal">Invite Parent</Text>
      </View>

      <Text className="font-body text-[13px] text-gray-600 mb-3">
        Generate a code for the parent to link their account.
      </Text>

      {error && (
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="font-body text-[13px] text-error flex-1">{error}</Text>
          <Button variant="ghost" size="sm" onPress={refresh}>
            Retry
          </Button>
        </View>
      )}

      <Button variant="primary" loading={generating} onPress={generate}>
        Generate Invite Code
      </Button>
    </Card>
  );
}
