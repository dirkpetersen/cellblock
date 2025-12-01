'use client';

/**
 * Inmate Dashboard Page
 * Main interface for inmates to manage their time budgets, whitelist, devices, and wardens
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  Smartphone,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTimeStatus } from '@/lib/hooks/useTime';
import { useWhitelist, useToggleHealthyApp, useAddWhitelistItem } from '@/lib/hooks/useWhitelist';
import { useDevices, useRemoveDevice } from '@/lib/hooks/useDevices';
import { useMyWardens, useInviteWarden, useBreakGlass } from '@/lib/hooks/useWarden';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TimeDisplay } from '@/components/ui/TimeDisplay';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Slider } from '@/components/ui/Slider';
import { UsageGraph } from '@/components/UsageGraph';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { showToast } = useToast();

  const { data: timeStatus, isLoading: timeLoading } = useTimeStatus();
  const { data: whitelist } = useWhitelist();
  const { data: devices } = useDevices();
  const { data: wardens } = useMyWardens();

  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [showInviteWardenModal, setShowInviteWardenModal] = useState(false);
  const [showAddWhitelistModal, setShowAddWhitelistModal] = useState(false);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  if (authLoading || timeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasActiveWarden = wardens?.wardens?.some((w: any) => w.isActive);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  CellBlock
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Welcome back, {user?.displayName || user?.email}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Time & Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Time Status Card */}
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <TimeDisplay
                    seconds={timeStatus?.remainingSeconds || 0}
                    label="Remaining Today"
                    countdown
                    className="text-2xl"
                  />
                  <StatusIndicator
                    status={
                      timeStatus?.activeParole
                        ? 'parole'
                        : timeStatus?.isLocked
                        ? 'locked'
                        : 'active'
                    }
                  />
                </div>

                {timeStatus?.activeParole && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Parole Active
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {timeStatus.activeParole.type === 'until'
                        ? `Until ${new Date(timeStatus.activeParole.expiresAt!).toLocaleString()}`
                        : 'Temporary access granted'}
                    </p>
                  </div>
                )}

                {/* Time Budget Sliders */}
                <div className="space-y-4">
                  <Slider
                    label="Daily Limit"
                    value={timeStatus?.dailyLimit || 120}
                    min={0}
                    max={300}
                    disabled
                    colorCoded
                    helperText="Set by you or your warden"
                  />
                  <Slider
                    label="Weekly Remaining"
                    value={Math.floor((timeStatus?.weeklyRemaining || 0) / 60)}
                    min={0}
                    max={2100}
                    disabled
                    colorCoded
                    helperText={`Out of ${Math.floor((timeStatus?.weeklyLimit || 0) / 60)} minutes/week`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Whitelist Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Whitelist</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddWhitelistModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WhitelistSection
                  whitelist={whitelist?.items || []}
                  hasActiveWarden={hasActiveWarden}
                  showToast={showToast}
                />
              </CardContent>
            </Card>

            {/* Usage Graphs */}
            <div className="grid grid-cols-1 gap-6">
              <UsageGraph
                data={generateMockUsageData('daily')}
                title="Daily Usage (Last 7 Days)"
                period="daily"
              />
              <UsageGraph
                data={generateMockUsageData('weekly')}
                title="Weekly Usage (Last 4 Weeks)"
                period="weekly"
              />
            </div>
          </div>

          {/* Right Column - Devices & Wardens */}
          <div className="space-y-6">
            {/* Devices Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DevicesSection devices={devices?.devices || []} showToast={showToast} />
              </CardContent>
            </Card>

            {/* Wardens Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Wardens
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInviteWardenModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WardensSection wardens={wardens?.wardens || []} />
              </CardContent>
            </Card>

            {/* Emergency Break Glass */}
            <Card variant="outlined" className="border-danger-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-danger-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-danger-900 dark:text-danger-100">
                      Emergency Access
                    </h3>
                    <p className="text-sm text-danger-700 dark:text-danger-300 mt-1">
                      Break glass to immediately disable all restrictions. This will notify
                      all wardens.
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setShowBreakGlassModal(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Break Glass
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <BreakGlassModal
        isOpen={showBreakGlassModal}
        onClose={() => setShowBreakGlassModal(false)}
        showToast={showToast}
      />
      <InviteWardenModal
        isOpen={showInviteWardenModal}
        onClose={() => setShowInviteWardenModal(false)}
        showToast={showToast}
      />
      <AddWhitelistModal
        isOpen={showAddWhitelistModal}
        onClose={() => setShowAddWhitelistModal(false)}
        showToast={showToast}
      />
    </div>
  );
}

// Whitelist Section Component
function WhitelistSection({
  whitelist,
  hasActiveWarden,
  showToast,
}: {
  whitelist: any[];
  hasActiveWarden: boolean;
  showToast: any;
}) {
  const toggleHealthyApp = useToggleHealthyApp();

  const categorized = {
    utility: whitelist.filter((item) => item.category === 'utility'),
    healthy: whitelist.filter((item) => item.category === 'healthy'),
    custom: whitelist.filter((item) => item.category === 'custom'),
  };

  const handleToggle = async (itemId: string, enabled: boolean) => {
    try {
      await toggleHealthyApp.mutateAsync({ itemId, enabled });
      showToast({
        type: hasActiveWarden ? 'info' : 'success',
        title: hasActiveWarden ? 'Request Submitted' : 'Whitelist Updated',
        message: hasActiveWarden
          ? 'Your warden will need to approve this change'
          : 'App toggled successfully',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to toggle app',
        message: error.message,
      });
    }
  };

  if (whitelist.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No whitelist items yet. Add some apps to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(categorized).map(([category, items]) => {
        if (items.length === 0) return null;

        return (
          <div key={category}>
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 capitalize">
              {category}
            </h4>
            <div className="space-y-2">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </p>
                    {item.iosBundleId && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        iOS: {item.iosBundleId}
                      </p>
                    )}
                  </div>
                  {category === 'healthy' && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isEnabled}
                        onChange={(e) => handleToggle(item.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary-600" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Devices Section Component
function DevicesSection({ devices, showToast }: { devices: any[]; showToast: any }) {
  const removeDevice = useRemoveDevice();

  const handleRemove = async (deviceId: string) => {
    if (!confirm('Remove this device? It will need to be re-registered.')) return;

    try {
      await removeDevice.mutateAsync(deviceId);
      showToast({
        type: 'success',
        title: 'Device Removed',
        message: 'Device has been removed successfully',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to remove device',
        message: error.message,
      });
    }
  };

  if (devices.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No devices registered yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {devices.map((device: any) => (
        <div
          key={device.id}
          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
        >
          <div>
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
              {device.deviceName || 'Unnamed Device'}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {device.platform} • {device.osVersion}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRemove(device.id)}
          >
            <Trash2 className="h-4 w-4 text-danger-500" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// Wardens Section Component
function WardensSection({ wardens }: { wardens: any[] }) {
  if (wardens.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No wardens assigned yet. Invite someone to help you stay accountable.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {wardens.map((warden: any) => (
        <div
          key={warden.id}
          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
        >
          <div>
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
              {warden.displayName || warden.email}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge size="sm" variant={warden.isActive ? 'success' : 'default'}>
                {warden.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {warden.isPrimary && (
                <Badge size="sm" variant="primary">
                  Primary
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Break Glass Modal
function BreakGlassModal({
  isOpen,
  onClose,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  showToast: any;
}) {
  const [comment, setComment] = useState('');
  const breakGlass = useBreakGlass();

  const handleBreakGlass = async () => {
    try {
      await breakGlass.mutateAsync(comment);
      showToast({
        type: 'warning',
        title: 'Break Glass Activated',
        message: 'All restrictions have been disabled. Wardens have been notified.',
      });
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to break glass',
        message: error.message,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Break Glass - Emergency Access"
      description="This will immediately disable all restrictions and notify your wardens."
      size="md"
    >
      <Textarea
        label="Reason (optional)"
        placeholder="Explain why you need emergency access..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />
      <ModalFooter className="mt-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleBreakGlass}
          isLoading={breakGlass.isPending}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Break Glass
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Invite Warden Modal
function InviteWardenModal({
  isOpen,
  onClose,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  showToast: any;
}) {
  const [email, setEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const inviteWarden = useInviteWarden();

  const handleInvite = async () => {
    try {
      await inviteWarden.mutateAsync({ email, isPrimary });
      showToast({
        type: 'success',
        title: 'Invitation Sent',
        message: `Warden invite sent to ${email}`,
      });
      setEmail('');
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to send invitation',
        message: error.message,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Warden" size="md">
      <Input
        label="Email Address"
        type="email"
        placeholder="warden@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Primary Warden (can approve budget changes)
          </span>
        </label>
      </div>
      <ModalFooter className="mt-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleInvite} isLoading={inviteWarden.isPending}>
          Send Invitation
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Add Whitelist Modal
function AddWhitelistModal({
  isOpen,
  onClose,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  showToast: any;
}) {
  const [name, setName] = useState('');
  const [iosBundleId, setIosBundleId] = useState('');
  const [androidPackageName, setAndroidPackageName] = useState('');
  const [windowsDomain, setWindowsDomain] = useState('');
  const [comment, setComment] = useState('');
  const addWhitelistItem = useAddWhitelistItem();

  const handleAdd = async () => {
    try {
      await addWhitelistItem.mutateAsync({
        name,
        iosBundleId: iosBundleId || undefined,
        androidPackageName: androidPackageName || undefined,
        windowsDomain: windowsDomain || undefined,
        comment: comment || undefined,
      });
      showToast({
        type: 'success',
        title: 'Whitelist Item Added',
        message: 'Your custom whitelist item requires warden approval',
      });
      setName('');
      setIosBundleId('');
      setAndroidPackageName('');
      setWindowsDomain('');
      setComment('');
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to add whitelist item',
        message: error.message,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom App" size="md">
      <div className="space-y-4">
        <Input
          label="App Name"
          placeholder="e.g., Duolingo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="iOS Bundle ID (optional)"
          placeholder="com.example.app"
          value={iosBundleId}
          onChange={(e) => setIosBundleId(e.target.value)}
        />
        <Input
          label="Android Package Name (optional)"
          placeholder="com.example.app"
          value={androidPackageName}
          onChange={(e) => setAndroidPackageName(e.target.value)}
        />
        <Input
          label="Windows Domain (optional)"
          placeholder="example.com"
          value={windowsDomain}
          onChange={(e) => setWindowsDomain(e.target.value)}
        />
        <Textarea
          label="Reason (optional)"
          placeholder="Why do you need this app?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>
      <ModalFooter className="mt-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleAdd} isLoading={addWhitelistItem.isPending}>
          Add to Whitelist
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Mock data generator for usage graphs
function generateMockUsageData(period: 'daily' | 'weekly'): any[] {
  const data = [];
  const count = period === 'daily' ? 7 : 4;

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString(),
      minutes: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
    });
  }

  return data;
}
