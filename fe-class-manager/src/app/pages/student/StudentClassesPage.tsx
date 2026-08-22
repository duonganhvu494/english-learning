import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import Card, { CardBody } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

import { classesApi, getApiErrorMessage } from "@/api";

import type { ClassResponse } from "@/types";

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lớp học của tôi</h1>

        <p className="text-gray-600 mt-1">Các lớp học mà bạn đang tham gia.</p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-500">
          Đang tải danh sách lớp học...
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7 text-blue-500" />
            </div>

            <h3 className="font-semibold text-gray-900 mt-4">
              Bạn chưa tham gia lớp học nào
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Khi giáo viên thêm bạn vào lớp, lớp học sẽ xuất hiện tại đây.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classes.map((classItem) => (
            <Card key={classItem.id} hover className="h-full overflow-hidden">
              <div className="h-2 bg-blue-500" />

              <CardBody className="flex flex-col h-full">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {classItem.className}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                      {classItem.description ||
                        "Giáo viên chưa thêm mô tả cho lớp học này."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link
                    to={`/student/classes/${classItem.id}`}
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      Xem lớp học
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
