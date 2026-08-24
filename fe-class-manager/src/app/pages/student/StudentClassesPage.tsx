import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, GraduationCap, Search } from "lucide-react";
import { toast } from "sonner";

import Card, { CardBody } from "@/app/components/ui/Card";

import Button from "@/app/components/ui/Button";

import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";

import { classesApi, getApiErrorMessage } from "@/api";

import type { ClassResponse } from "@/types";

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const loadClasses = async () => {
    setIsLoading(true);

    try {
      const result = await classesApi.listMyClasses();

      setClasses(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách lớp học"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return classes;
    }

    return classes.filter(
      (classItem) =>
        classItem.className.toLowerCase().includes(query) ||
        (classItem.description ?? "").toLowerCase().includes(query),
    );
  }, [classes, searchQuery]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lớp học của tôi</h1>

        <p className="text-gray-600 mt-1">Các lớp học mà bạn đang tham gia</p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lớp đang tham gia</p>

                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {classes.length}
                </p>
              </div>

              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* LIST */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">Danh sách lớp học</h2>

              <p className="text-sm text-gray-500 mt-1">
                {classes.length} lớp học
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                placeholder="Tìm kiếm lớp học..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-14 text-center text-sm text-gray-500">
              Đang tải danh sách lớp học...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="py-14 text-center">
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto" />

              <h3 className="font-medium text-gray-900 mt-3">
                {searchQuery
                  ? "Không tìm thấy lớp học"
                  : "Bạn chưa tham gia lớp học nào"}
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                {searchQuery
                  ? "Thử tìm kiếm với từ khóa khác."
                  : "Khi giáo viên thêm bạn vào lớp, lớp học sẽ xuất hiện tại đây."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lớp học</TableHead>

                  <TableHead>Mô tả</TableHead>

                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClasses.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <Link
                        to={`/student/classes/${classItem.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>

                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {classItem.className}
                          </p>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Lớp đang tham gia
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-lg line-clamp-2">
                        {classItem.description || "Giáo viên chưa thêm mô tả"}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end">
                        <Link to={`/student/classes/${classItem.id}`}>
                          <Button variant="outline" size="sm">
                            Vào lớp
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && classes.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Hiển thị {filteredClasses.length} / {classes.length} lớp học
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
