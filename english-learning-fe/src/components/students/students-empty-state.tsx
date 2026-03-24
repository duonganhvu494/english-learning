"use client";

import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentsDictionary } from "./types";

type StudentsEmptyStateProps = {
  searchQuery: string;
  dictionary: StudentsDictionary;
  onAddFirstStudent: () => void;
};

export function StudentsEmptyState({
  searchQuery,
  dictionary,
  onAddFirstStudent,
}: StudentsEmptyStateProps) {
  return (
    <div className="px-4 py-14 text-center">
      <Users className="mx-auto mb-4 h-14 w-14 text-app-text-soft" />
      <h3 className="mb-2 text-xl font-medium text-app-text">
        {searchQuery ? dictionary.noStudentsFound : dictionary.noStudentsYet}
      </h3>
      <p className="mb-5 text-app-text-muted">
        {searchQuery ? dictionary.tryAdjustingSearch : dictionary.addFirstStudentHint}
      </p>

      {!searchQuery ? (
        <Button className="mx-auto w-auto" onClick={onAddFirstStudent}>
          <Plus className="mr-2 h-4 w-4" />
          {dictionary.addFirstStudent}
        </Button>
      ) : null}
    </div>
  );
}
