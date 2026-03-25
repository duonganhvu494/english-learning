"use client";

import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StudentsDictionary } from "./types";

type StudentsSearchStatsProps = {
  searchQuery: string;
  totalStudents: number;
  activeStudents: number;
  dictionary: StudentsDictionary;
  onSearchQueryChange: (value: string) => void;
};

export function StudentsSearchStats({
  searchQuery,
  totalStudents,
  activeStudents,
  dictionary,
  onSearchQueryChange,
}: StudentsSearchStatsProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
      <div className="xl:flex-1">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder={dictionary.searchPlaceholder}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:w-auto">
        <Card className="border-app-border bg-app-surface">
          <CardContent className="px-4 py-3">
            <p className="text-sm text-app-text-muted">{dictionary.totalStudents}</p>
            <p className="text-2xl font-semibold text-app-text">{totalStudents}</p>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardContent className="px-4 py-3">
            <p className="text-sm text-app-text-muted">{dictionary.activeStudents}</p>
            <p className="text-2xl font-semibold text-app-text">{activeStudents}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
