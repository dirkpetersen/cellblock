'use client';

/**
 * Warden Dashboard Page
 * Interface for wardens to monitor inmates, approve requests, and manage emergency controls
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, XCircle, User, Bell, Lock, Unlock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  useInmates,
  usePendingRequests,
  useApproveRequest,
  useGrantParole,
  useTriggerLockdown,
} from '@/lib/hooks/useWarden';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusIndicator, Status } from '@/components/ui/StatusIndicator';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { UsageGraph } from '@/components/UsageGraph';
import { TimeDisplay } from '@/components/ui/TimeDisplay';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export default function WardenDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { showToast } = useToast();

  const { data: inmates, isLoading: inmatesLoading } = useInmates();
  const { data: requests } = usePendingRequests();

  const [selectedInmate, setSelectedInmate] = useState<any>(null);
  const [showParoleModal, setShowParoleModal] = useState(false);
  const [showLockdownModal, setShowLockdownModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  if (authLoading || inmatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading warden dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingCount = requests?.requests?.length || 0;

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
                  Warden Dashboard
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Monitoring {inmates?.inmates?.length || 0} inmates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                My Dashboard
              </Button>
              <Button variant="ghost" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inmates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            {pendingCount > 0 && (
              <Card variant="elevated" className="border-l-4 border-accent-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-accent-500" />
                      <CardTitle>Pending Requests</CardTitle>
                      <Badge variant="warning">{pendingCount}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RequestsList
                    requests={requests?.requests || []}
                    onSelectRequest={(req) => {
                      setSelectedRequest(req);
                      setShowRequestModal(true);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Inmates List */}
            <Card>
              <CardHeader>
                <CardTitle>Supervised Inmates</CardTitle>
                <CardDescription>
                  Real-time status and quick actions for all inmates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InmatesList
                  inmates={inmates?.inmates || []}
                  onGrantParole={(inmate) => {
                    setSelectedInmate(inmate);
                    setShowParoleModal(true);
                  }}
                  onTriggerLockdown={(inmate) => {
                    setSelectedInmate(inmate);
                    setShowLockdownModal(true);
                  }}
                  onViewDetails={(inmate) => setSelectedInmate(inmate)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Selected Inmate Details */}
          <div className="space-y-6">
            {selectedInmate ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedInmate.displayName || selectedInmate.email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InmateDetails inmate={selectedInmate} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      variant="success"
                      onClick={() => setShowParoleModal(true)}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Grant Parole
                    </Button>
                    <Button
                      className="w-full"
                      variant="danger"
                      onClick={() => setShowLockdownModal(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Trigger Lockdown
                    </Button>
                  </CardContent>
                </Card>

                <UsageGraph
                  data={generateMockUsageData('daily')}
                  title={`Usage: ${selectedInmate.displayName || selectedInmate.email}`}
                  period="daily"
                />
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <User className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Select an inmate to view details and usage reports
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ParoleModal
        isOpen={showParoleModal}
        onClose={() => setShowParoleModal(false)}
        inmate={selectedInmate}
        showToast={showToast}
      />
      <LockdownModal
        isOpen={showLockdownModal}
        onClose={() => setShowLockdownModal(false)}
        inmate={selectedInmate}
        showToast={showToast}
      />
      <RequestModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        showToast={showToast}
      />
    </div>
  );
}

// Inmates List Component
function InmatesList({
  inmates,
  onGrantParole,
  onTriggerLockdown,
  onViewDetails,
}: {
  inmates: any[];
  onGrantParole: (inmate: any) => void;
  onTriggerLockdown: (inmate: any) => void;
  onViewDetails: (inmate: any) => void;
}) {
  if (inmates.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No inmates under supervision yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {inmates.map((inmate: any) => {
        const status: Status = inmate.activeParole
          ? 'parole'
          : inmate.isLocked
            ? 'locked'
            : inmate.isOnline
              ? 'active'
              : 'offline';

        return (
          <div
            key={inmate.id}
            className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
            onClick={() => onViewDetails(inmate)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {inmate.displayName || inmate.email}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Last active: {formatRelativeTime(inmate.lastHeartbeat || new Date())}
                </p>
              </div>
              <StatusIndicator status={status} />
            </div>

            {inmate.timeStatus && (
              <div className="mb-3">
                <TimeDisplay
                  seconds={inmate.timeStatus.remainingSeconds || 0}
                  label="Remaining Today"
                  showIcon={false}
                  className="text-sm"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={(e) => {
                  e.stopPropagation();
                  onGrantParole(inmate);
                }}
              >
                <Unlock className="h-3 w-3 mr-1" />
                Parole
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerLockdown(inmate);
                }}
              >
                <Lock className="h-3 w-3 mr-1" />
                Lock
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Inmate Details Component
function InmateDetails({ inmate }: { inmate: any }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Email</p>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{inmate.email}</p>
      </div>

      {inmate.timeStatus && (
        <>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Daily Budget</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {Math.floor(inmate.timeStatus.dailyLimit / 60)} minutes
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Weekly Budget</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {Math.floor(inmate.timeStatus.weeklyLimit / 60)} minutes
            </p>
          </div>
        </>
      )}

      {inmate.devices && (
        <div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Devices</p>
          <div className="space-y-1">
            {inmate.devices.map((device: any) => (
              <div key={device.id} className="text-sm text-zinc-900 dark:text-zinc-100">
                {device.deviceName || 'Unnamed'} ({device.platform})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Requests List Component
function RequestsList({
  requests,
  onSelectRequest,
}: {
  requests: any[];
  onSelectRequest: (request: any) => void;
}) {
  if (requests.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No pending requests</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((request: any) => (
        <div
          key={request.id}
          className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-accent-500 dark:hover:border-accent-500 transition-colors cursor-pointer"
          onClick={() => onSelectRequest(request)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge size="sm" variant="warning">
                  {request.type}
                </Badge>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {formatRelativeTime(request.createdAt)}
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {request.inmateName || request.inmateEmail}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {request.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Parole Modal
function ParoleModal({
  isOpen,
  onClose,
  inmate,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  inmate: any;
  showToast: any;
}) {
  const [type, setType] = useState<'minutes' | 'until'>('minutes');
  const [minutes, setMinutes] = useState('60');
  const [untilDate, setUntilDate] = useState('');
  const [reason, setReason] = useState('');
  const grantParole = useGrantParole();

  const handleGrant = async () => {
    if (!inmate) return;

    try {
      const value = type === 'minutes' ? parseInt(minutes) : untilDate;
      await grantParole.mutateAsync({
        inmateId: inmate.id,
        type,
        value,
        reason: reason || undefined,
      });
      showToast({
        type: 'success',
        title: 'Parole Granted',
        message: `Temporary access granted to ${inmate.displayName || inmate.email}`,
      });
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to grant parole',
        message: error.message,
      });
    }
  };

  if (!inmate) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant Parole"
      description={`Temporarily remove restrictions for ${inmate.displayName || inmate.email}`}
      size="md"
    >
      <div className="space-y-4">
        <Select
          label="Duration Type"
          options={[
            { value: 'minutes', label: 'Fixed Duration (minutes)' },
            { value: 'until', label: 'Until Specific Time' },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value as 'minutes' | 'until')}
        />

        {type === 'minutes' ? (
          <Input
            label="Duration (minutes)"
            type="number"
            min="1"
            max="10000"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            helperText="Maximum 10,000 minutes (~7 days)"
          />
        ) : (
          <Input
            label="Until Date & Time"
            type="datetime-local"
            value={untilDate}
            onChange={(e) => setUntilDate(e.target.value)}
          />
        )}

        <Textarea
          label="Reason (optional)"
          placeholder="Why are you granting parole?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
      <ModalFooter className="mt-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleGrant} isLoading={grantParole.isPending}>
          <Unlock className="h-4 w-4 mr-2" />
          Grant Parole
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Lockdown Modal
function LockdownModal({
  isOpen,
  onClose,
  inmate,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  inmate: any;
  showToast: any;
}) {
  const [gracePeriod, setGracePeriod] = useState('0');
  const [reason, setReason] = useState('');
  const triggerLockdown = useTriggerLockdown();

  const handleLockdown = async () => {
    if (!inmate) return;

    try {
      await triggerLockdown.mutateAsync({
        inmateId: inmate.id,
        gracePeriodMinutes: parseInt(gracePeriod),
        reason: reason || undefined,
      });
      showToast({
        type: 'warning',
        title: 'Lockdown Triggered',
        message: `Lockdown initiated for ${inmate.displayName || inmate.email}`,
      });
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to trigger lockdown',
        message: error.message,
      });
    }
  };

  if (!inmate) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trigger Lockdown"
      description={`Force lock all devices for ${inmate.displayName || inmate.email}`}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Grace Period (minutes)"
          type="number"
          min="0"
          max="120"
          value={gracePeriod}
          onChange={(e) => setGracePeriod(e.target.value)}
          helperText="Time before lockdown takes effect (0 = immediate)"
        />

        <Textarea
          label="Reason (optional)"
          placeholder="Why are you triggering lockdown?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
      <ModalFooter className="mt-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleLockdown} isLoading={triggerLockdown.isPending}>
          <Lock className="h-4 w-4 mr-2" />
          Trigger Lockdown
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Request Approval Modal
function RequestModal({
  isOpen,
  onClose,
  request,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  showToast: any;
}) {
  const [comment, setComment] = useState('');
  const approveRequest = useApproveRequest();

  const handleApprove = async (approved: boolean) => {
    if (!request) return;

    try {
      await approveRequest.mutateAsync({
        requestId: request.id,
        approved,
        comment: comment || undefined,
      });
      showToast({
        type: approved ? 'success' : 'info',
        title: approved ? 'Request Approved' : 'Request Denied',
        message: `Request has been ${approved ? 'approved' : 'denied'}`,
      });
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to process request',
        message: error.message,
      });
    }
  };

  if (!request) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Request"
      description={`From ${request.inmateName || request.inmateEmail}`}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Request Type</p>
          <Badge variant="warning">{request.type}</Badge>
        </div>

        {request.description && (
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{request.description}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Requested</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {formatDate(request.createdAt)}
          </p>
        </div>

        <Textarea
          label="Comment (optional)"
          placeholder="Add a comment about your decision..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>
      <ModalFooter className="mt-6">
        <Button
          variant="outline"
          onClick={() => handleApprove(false)}
          isLoading={approveRequest.isPending}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Deny
        </Button>
        <Button
          variant="success"
          onClick={() => handleApprove(true)}
          isLoading={approveRequest.isPending}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Mock data generator
function generateMockUsageData(_period: 'daily'): any[] {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString(),
      minutes: Math.floor(Math.random() * 180) + 30,
    });
  }
  return data;
}
