// src/Pages/CalendarPage.jsx
import React from "react";
import CalendarLayout from "./CalendarLayout";
import CalendarView from "./CalendarView";
import { useAuth } from "../../auth/AuthContext";
import { CalendarProvider } from "../../auth/CalendarContext"; 

export default function CalendarPage() {
  const { user, logout } = useAuth();

  return (
    <CalendarProvider>
      <CalendarLayout user={user} onLogout={logout}>
        <div className="p-6">
          <CalendarView />
        </div>
      </CalendarLayout>
    </CalendarProvider>
  );
}