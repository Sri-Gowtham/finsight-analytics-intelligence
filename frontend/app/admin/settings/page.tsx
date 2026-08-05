import { RoleGuard } from '@/components/role-guard';

/**
 * Data Source Settings has been removed from the MVP.
 * Data source configuration is managed in n8n credentials, not this application.
 */
export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-text-secondary max-w-md">
          Data source configuration is managed in the n8n workflow credentials and is not
          configurable from this interface. This page has been removed from the MVP scope.
        </p>
      </div>
    </RoleGuard>
  );
}
