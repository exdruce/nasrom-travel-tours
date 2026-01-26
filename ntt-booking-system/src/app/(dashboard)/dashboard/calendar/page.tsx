import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-900">Calendar View</p>
              <p className="text-sm text-gray-500">
                View and manage your upcoming bookings here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
