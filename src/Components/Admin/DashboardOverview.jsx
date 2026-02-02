import React from "react";
import { 
  Users, 
  Building2, 
  Workflow, 
  Settings, 
  Shield,
  TrendingUp,
  Activity
} from "lucide-react";

const DashboardOverview = ({ 
  users = [], 
  departments = [], 
  functions = [], 
  operations = [], 
  roles = [],
  onSectionChange
}) => {
  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      section: "users"
    },
    {
      title: "Departments",
      value: departments.length,
      icon: Building2,
      color: "bg-green-500",
      textColor: "text-green-500",
      section: "departments"
    },
    {
      title: "Functions",
      value: functions.length,
      icon: Workflow,
      color: "bg-purple-500",
      textColor: "text-purple-500",
      section: "functions"
    },
    {
      title: "Operations",
      value: operations.length,
      icon: Settings,
      color: "bg-orange-500",
      textColor: "text-orange-500",
      section: "operations"
    },
    {
      title: "Roles",
      value: roles.length,
      icon: Shield,
      color: "bg-red-500",
      textColor: "text-red-500",
      section: "roles"
    }
  ];

  const recentUsers = users.slice(0, 5);
  const recentDepartments = departments.slice(0, 3);

  const handleQuickAction = (section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-blue-100">Manage your system's users, departments, functions, and operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(stat.section)}
            className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction("users")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center cursor-pointer"
          >
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="font-medium text-gray-700">Add User</p>
          </button>
          <button 
            onClick={() => handleQuickAction("departments")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center cursor-pointer"
          >
            <Building2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-gray-700">Add Department</p>
          </button>
          <button 
            onClick={() => handleQuickAction("functions")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center cursor-pointer"
          >
            <Workflow className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="font-medium text-gray-700">Add Function</p>
          </button>
          <button 
            onClick={() => handleQuickAction("operations")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center cursor-pointer"
          >
            <Settings className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="font-medium text-gray-700">Add Operation</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Users</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {user.department?.name || "No Dept"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No users available</p>
          )}
        </div>

        {/* Recent Departments */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Departments</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          {recentDepartments.length > 0 ? (
            <div className="space-y-3">
              {recentDepartments.map((dept, index) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{dept.name}</p>
                      <p className="text-sm text-gray-500">Department</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {users.filter(u => u.department?.id === dept.id).length} users
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No departments available</p>
          )}
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Users Active</p>
            <p className="text-2xl font-bold text-green-600">{users.length}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Departments</p>
            <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Roles</p>
            <p className="text-2xl font-bold text-purple-600">{roles.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
