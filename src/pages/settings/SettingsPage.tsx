import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Trash2,
  ShieldCheck,
  Lock,
  UserCircle,
  Mail,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, isUsingDemoSession } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Trang Cai dat tai khoan FoodLens: thong tin ca nhan, mat khau,
// du lieu phan tich mon an (xuat JSON / xoa lich su) va xoa tai khoan.
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfileName, updatePassword, deleteAccount } = useAuthStore();

  // Profile name state
  const [displayName, setDisplayName] = useState(profile?.full_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setDisplayName(profile.full_name);
    }
  }, [profile?.full_name]);

  // Change Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // FoodLens data state
  const [analysisCount, setAnalysisCount] = useState<number | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);

  const loadAnalysisCount = useCallback(async () => {
    if (!profile?.id || isUsingDemoSession()) {
      setAnalysisCount(0);
      return;
    }
    const { count } = await supabase
      .from('food_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id);
    setAnalysisCount(typeof count === 'number' ? count : 0);
  }, [profile?.id]);

  useEffect(() => {
    loadAnalysisCount();
  }, [loadAnalysisCount]);

  // Delete account modal state
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }
    setIsSavingName(true);
    const ok = await updateProfileName(displayName.trim());
    setIsSavingName(false);
    if (ok) {
      toast.success('Đã cập nhật tên hiển thị!');
    } else {
      toast.error(useAuthStore.getState().error || 'Không thể cập nhật tên hiển thị.');
    }
  };

  const handleSaveAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newAccountPassword !== confirmAccountPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    setIsSavingPassword(true);
    const ok = await updatePassword(newAccountPassword);
    setIsSavingPassword(false);
    if (ok) {
      toast.success('Đã cập nhật mật khẩu tài khoản thành công!');
      setIsPasswordModalOpen(false);
      setNewAccountPassword('');
      setConfirmAccountPassword('');
    } else {
      toast.error(useAuthStore.getState().error || 'Không thể đổi mật khẩu lúc này.');
    }
  };

  const handleExportData = async () => {
    if (!profile?.id) return;
    try {
      const { data: rows, error } = await supabase
        .from('food_analyses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const payload = {
        exported_at: new Date().toISOString(),
        app: 'FoodLens',
        profile: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          created_at: profile.created_at,
        },
        food_analyses: rows || [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foodlens-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống dữ liệu FoodLens của bạn dạng JSON!');
    } catch {
      toast.error('Không thể xuất dữ liệu lúc này.');
    }
  };

  const handleClearHistoryConfirmed = async () => {
    if (!profile?.id) return;
    setIsClearingHistory(true);
    const { error } = await supabase
      .from('food_analyses')
      .delete()
      .eq('user_id', profile.id);
    setIsClearingHistory(false);
    setIsClearHistoryOpen(false);
    if (error) {
      toast.error('Không thể xóa lịch sử phân tích lúc này.');
    } else {
      toast.success('Đã xóa toàn bộ lịch sử phân tích món ăn.');
      loadAnalysisCount();
    }
  };

  const handleDeleteAccountConfirmed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmWord.trim().toUpperCase() !== 'XOA') {
      toast.error('Vui lòng gõ chính xác chữ "XOA" để xác nhận.');
      return;
    }
    if (!isUsingDemoSession() && !deleteAccountPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu tài khoản hiện tại để xác thực.');
      return;
    }

    setIsDeletingAccount(true);
    const result = await deleteAccount(deleteAccountPassword);
    setIsDeletingAccount(false);

    if (!result.success) {
      toast.error(result.error || 'Không thể xóa vĩnh viễn tài khoản lúc này.');
      return;
    }

    toast.success('Tài khoản và toàn bộ dữ liệu FoodLens đã được xóa vĩnh viễn.');
    setIsDeleteAccountOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-ink tracking-tight">
          Cài đặt tài khoản
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          Quản lý thông tin cá nhân, mật khẩu và dữ liệu phân tích món ăn của bạn trên FoodLens.
        </p>
      </div>

      {/* 1. Account Profile Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-6 border border-ink/10 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lavender flex items-center justify-center text-magic-600 shrink-0">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-ink">
                Thông tin tài khoản
              </h2>
              <p className="text-xs text-ink-soft">
                Tên hiển thị, email đăng nhập và mật khẩu bảo mật của bạn
              </p>
            </div>
          </div>

          <Badge variant="mint" size="sm">
            Hạn mức phân tích: 10 lượt/ngày
          </Badge>
        </div>

        <form onSubmit={handleSaveName} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <Input
              label="Tên hiển thị của bạn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Trần Công Quý"
              required
            />
          </div>

          <div className="md:col-span-4">
            <Input
              label="Email tài khoản"
              value={profile?.email || 'Đã xác thực qua Supabase'}
              disabled
              leftIcon={<Mail className="w-4 h-4 text-ink-faint" />}
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingName}
              disabled={displayName.trim() === (profile?.full_name || '')}
              className="w-full"
            >
              Lưu tên
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-heading font-bold text-ink block">
              Mật khẩu đăng nhập
            </span>
            <span className="text-xs text-ink-soft">
              Khuyến nghị đặt mật khẩu tối thiểu 6 ký tự bao gồm chữ và số.
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setNewAccountPassword('');
              setConfirmAccountPassword('');
              setIsPasswordModalOpen(true);
            }}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </Card>

      {/* 2. FoodLens Data Section */}
      <Card variant="white" className="p-6 md:p-8 space-y-6 border border-ink/10 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-mint flex items-center justify-center text-[#166E48] shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-extrabold text-ink">
              Dữ liệu FoodLens của bạn
            </h2>
            <p className="text-xs text-ink-soft">
              Lịch sử phân tích món ăn thuộc về bạn — xuất bản sao hoặc xóa sạch bất cứ lúc nào
            </p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-ink/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <span className="text-sm font-heading font-extrabold text-ink block">
                Lịch sử phân tích món ăn
              </span>
              <p className="text-xs text-ink-soft mt-0.5">
                Bạn đã lưu <strong className="text-ink">{analysisCount ?? '…'}</strong> kết quả phân tích trên FoodLens.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExportData}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Xuất JSON
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsClearHistoryOpen(true)}
                disabled={!analysisCount}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Xóa lịch sử
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-4 text-xs text-ink-soft leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>
              Ảnh món ăn bạn tải lên chỉ được gửi tới AI để phân tích và không lưu trữ lâu dài trên máy chủ. Kết quả phân tích được bảo vệ bằng chính sách bảo mật theo tài khoản (RLS) — chỉ bạn mới xem được lịch sử của mình.
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Danger Zone */}
      <Card variant="white" className="p-6 md:p-8 space-y-4 border border-danger/25 shadow-card">
        <div>
          <h2 className="text-lg font-heading font-extrabold text-danger-text">
            Xóa vĩnh viễn tài khoản
          </h2>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            Xóa sạch tài khoản đăng nhập cùng toàn bộ lịch sử phân tích món ăn khỏi hệ thống FoodLens. Thao tác này không thể khôi phục.
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => setIsDeleteAccountOpen(true)}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Xóa tài khoản của tôi
        </Button>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu tài khoản"
        description="Nhập mật khẩu mới cho tài khoản FoodLens của bạn."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveAccountPassword} className="space-y-4 pt-2">
          <Input
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={newAccountPassword}
            onChange={(e) => setNewAccountPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            required
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={confirmAccountPassword}
            onChange={(e) => setConfirmAccountPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            required
          />
          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSavingPassword}>
            Lưu mật khẩu mới
          </Button>
        </form>
      </Modal>

      {/* Clear History Confirm */}
      <ConfirmDialog
        isOpen={isClearHistoryOpen}
        onClose={() => setIsClearHistoryOpen(false)}
        onConfirm={handleClearHistoryConfirmed}
        title="Xóa toàn bộ lịch sử phân tích?"
        description="Mọi kết quả phân tích món ăn đã lưu của bạn sẽ bị xóa vĩnh viễn khỏi FoodLens. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa lịch sử"
        isLoading={isClearingHistory}
      />

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteAccountOpen}
        onClose={() => {
          if (!isDeletingAccount) setIsDeleteAccountOpen(false);
        }}
        title="Xóa vĩnh viễn tài khoản FoodLens?"
        description="Thao tác này xóa sạch tài khoản đăng nhập và toàn bộ lịch sử phân tích món ăn của bạn khỏi hệ thống. Không thể khôi phục."
        maxWidth="sm"
      >
        <form onSubmit={handleDeleteAccountConfirmed} className="space-y-4 pt-2">
          {!isUsingDemoSession() && (
            <Input
              label="Mật khẩu tài khoản hiện tại"
              type="password"
              autoComplete="current-password"
              value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)}
              placeholder="Nhập mật khẩu để xác thực"
              required
            />
          )}
          <Input
            label='Gõ "XOA" để xác nhận'
            value={deleteConfirmWord}
            onChange={(e) => setDeleteConfirmWord(e.target.value)}
            placeholder="XOA"
            required
          />
          <Button type="submit" variant="danger" size="md" className="w-full" isLoading={isDeletingAccount}>
            Tôi hiểu, xóa vĩnh viễn
          </Button>
        </form>
      </Modal>
    </div>
  );
};
