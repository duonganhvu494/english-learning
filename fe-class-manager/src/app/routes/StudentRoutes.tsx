import { Navigate, Route } from "react-router";

import RequireRole from "@/app/routes/RequireRole";
import StudentLayout from "@/app/layouts/StudentLayout";

import StudentClassesPage from "@/app/pages/student/StudentClassesPage";
import StudentAssignmentsPage from "@/app/pages/student/StudentAssignmentsPage";
import StudentClassroom from "@/app/pages/student/StudentClassroom";
import StudentAssignment from "@/app/pages/student/StudentAssignment";

export default function StudentRoutes() {
  return (
    <Route element={<RequireRole role="student" />}>
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="/student/classes" replace />} />

        <Route path="classes" element={<StudentClassesPage />} />

        <Route path="classes/:classId" element={<StudentClassroom />} />

        <Route path="assignments" element={<StudentAssignmentsPage />} />

        <Route
          path="assignments/:assignmentId"
          element={<StudentAssignment />}
        />
      </Route>
    </Route>
  );
}
