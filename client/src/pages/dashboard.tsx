import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Student, Course } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const stats = [
    {
      name: "Total Students",
      value: students?.length || 0,
      icon: "👥",
      change: "+20% from last month"
    },
    {
      name: "Active Students",
      value: students?.filter(s => s.status === "active").length || 0,
      icon: "✅",
      change: "80% success rate"
    },
    {
      name: "Pending Students",
      value: students?.filter(s => s.status === "pending").length || 0,
      icon: "⏳",
      change: "5 new this week"
    },
    {
      name: "Total Courses",
      value: courses?.length || 0,
      icon: "📚",
      change: "2 added recently"
    }
  ];

  // Transform data for charts
  const enrollmentData = [
    { name: 'Active', value: students?.filter(s => s.status === "active").length || 0 },
    { name: 'Pending', value: students?.filter(s => s.status === "pending").length || 0 },
    { name: 'Cancelled', value: students?.filter(s => s.status === "cancelled").length || 0 },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-green-700">Welcome back, {user?.username}!</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-green-100 hover:border-green-200 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                {stat.name}
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Chart */}
      <Card className="border-green-100 mt-8">
        <CardHeader>
          <CardTitle className="text-green-700">Enrollment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-green-700">Recent Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {students?.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                      student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-green-700">Recent Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {courses?.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{course.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        try {
                          return new URL(course.driveLink).hostname;
                        } catch {
                          return 'View Course Content';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}