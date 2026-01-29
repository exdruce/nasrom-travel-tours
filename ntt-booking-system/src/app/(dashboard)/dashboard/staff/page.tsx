import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Lock, Mail } from "lucide-react";

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
          <p className="text-gray-500">Manage your team members</p>
        </div>
        <Button disabled>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Staff Management Coming Soon
            </h3>
            <p className="text-gray-500 max-w-md mb-6">
              Soon you'll be able to invite team members to help manage your
              business, assign roles, and control permissions.
            </p>

            <div className="grid md:grid-cols-3 gap-4 w-full max-w-2xl">
              <div className="p-4 bg-gray-50 rounded-lg">
                <UserPlus className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                <h4 className="font-medium text-sm">Invite Members</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Add staff via email invitation
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Lock className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                <h4 className="font-medium text-sm">Role Permissions</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Control what each role can access
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Mail className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                <h4 className="font-medium text-sm">Notifications</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Staff get notified of bookings
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
