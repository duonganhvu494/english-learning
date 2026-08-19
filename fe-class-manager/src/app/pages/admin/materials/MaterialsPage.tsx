import { useEffect, useMemo, useState } from "react";
import {
  Download,
  File,
  FileText,
  Filter,
  Image,
  Search,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import Button from "@/app/components/ui/Button";
import Card, { CardBody } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import {
  getApiErrorMessage,
  materialsApi,
  resolveApiUrl,
} from "@/api";
import type {
  MaterialCategory,
  MaterialResponse,
  MaterialUploadInitResponse,
} from "@/types";
import { resolveWorkspaceId } from "@/app/utils/workspace";
import { formatDateTime } from "@/app/utils/format";
import UploadMaterialModal, {
  type UploadMaterialFormValue,
} from "./UploadMaterialModal";

type CategoryFilter = "all" | MaterialCategory;

const categoryLabels: Record<MaterialCategory, string> = {
  general: "Tài liệu chung",
  lecture: "Bài giảng",
  assignment: "Bài tập",
  submission: "Bài nộp",
};

function formatFileSize(sizeInBytes: number | null): string {
  if (sizeInBytes === null || sizeInBytes <= 0) {
    return "-";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(sizeInBytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function getFileIcon(
  fileName: string,
  mimeType: string | null,
) {
  const lowerMime = (mimeType ?? "").toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (
    lowerMime.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|svg)$/.test(lowerName)
  ) {
    return <Image className="w-8 h-8 text-blue-500" />;
  }

  if (
    lowerMime.startsWith("video/") ||
    /\.(mp4|mov|avi|mkv|webm)$/.test(lowerName)
  ) {
    return <Video className="w-8 h-8 text-purple-500" />;
  }

  if (
    lowerMime.includes("pdf") ||
    lowerMime.includes("word") ||
    lowerMime.includes("presentation") ||
    /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/.test(lowerName)
  ) {
    return <FileText className="w-8 h-8 text-red-500" />;
  }

  return <File className="w-8 h-8 text-gray-500" />;
}

export default function MaterialsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(
    null,
  );
  const [materials, setMaterials] = useState<MaterialResponse[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<
    string | null
  >(null);
  const [showUploadModal, setShowUploadModal] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] =
    useState<CategoryFilter>("all");

  const loadMaterials = async () => {
    setIsLoading(true);

    try {
      const activeWorkspaceId = await resolveWorkspaceId();
      setWorkspaceId(activeWorkspaceId);

      const list =
        await materialsApi.listWorkspaceMaterials(
          activeWorkspaceId,
        );

      setMaterials(list);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải danh sách tài liệu",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMaterials();
  }, []);

  const filteredMaterials = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return materials.filter((item) => {
      const bySearch =
        normalized.length === 0 ||
        item.title.toLowerCase().includes(normalized) ||
        item.fileName.toLowerCase().includes(normalized);

      const byCategory =
        filterCategory === "all" ||
        item.category === filterCategory;

      return bySearch && byCategory;
    });
  }, [filterCategory, materials, searchQuery]);

  const handleUpload = async (
    formData: UploadMaterialFormValue,
  ) => {
    if (!workspaceId || isUploading) {
      return;
    }

    const selectedFile = formData.file;

    setIsUploading(true);

    let uploadSession: MaterialUploadInitResponse | null = null;

    try {
      uploadSession = await materialsApi.initUpload(
        workspaceId,
        {
          title:
            formData.title.trim() || selectedFile.name,
          fileName: selectedFile.name,
          mimeType:
            selectedFile.type ||
            "application/octet-stream",
          size: selectedFile.size,
          category: formData.category,
        },
      );

      if (uploadSession.totalParts !== 1) {
        throw new Error(
          "Tệp quá lớn cho luồng tải lên hiện tại. Vui lòng giảm dung lượng tệp.",
        );
      }

      const signResult =
        await materialsApi.signUploadPart(workspaceId, {
          materialId: uploadSession.materialId,
          uploadSessionId:
            uploadSession.uploadSessionId,
          uploadId: uploadSession.uploadId,
          objectKey: uploadSession.objectKey,
          partNumber: 1,
        });

      const uploadResult = await fetch(signResult.url, {
        method: "PUT",
        headers: {
          "Content-Type":
            selectedFile.type ||
            "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!uploadResult.ok) {
        throw new Error(
          `Tải tệp thất bại (${uploadResult.status})`,
        );
      }

      const etag =
        uploadResult.headers.get("etag") ??
        uploadResult.headers.get("ETag");

      if (!etag) {
        throw new Error(
          "Không đọc được thông tin xác nhận từ hệ thống lưu trữ sau khi tải tệp",
        );
      }

      await materialsApi.completeUpload(workspaceId, {
        materialId: uploadSession.materialId,
        uploadSessionId: uploadSession.uploadSessionId,
        uploadId: uploadSession.uploadId,
        objectKey: uploadSession.objectKey,
        parts: [{ partNumber: 1, etag }],
      });

      toast.success("Tải tài liệu thành công");
      setShowUploadModal(false);
      await loadMaterials();
    } catch (error) {
      if (uploadSession) {
        try {
          await materialsApi.abortUpload(workspaceId, {
            materialId: uploadSession.materialId,
            uploadSessionId:
              uploadSession.uploadSessionId,
            uploadId: uploadSession.uploadId,
            objectKey: uploadSession.objectKey,
          });
        } catch {
          // Giữ nguyên lỗi chính của quá trình tải tệp.
        }
      }

      toast.error(
        getApiErrorMessage(error, "Không thể tải tài liệu"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa tài liệu này?",
      )
    ) {
      return;
    }

    setIsDeletingId(materialId);

    try {
      await materialsApi.deleteMaterial(materialId);
      setMaterials((prev) =>
        prev.filter((item) => item.id !== materialId),
      );
      toast.success("Đã xóa tài liệu");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể xóa tài liệu"),
      );
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý tài liệu
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài liệu giảng dạy và học tập
          </p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          disabled={!workspaceId || isLoading}
        >
          <Upload className="w-4 h-4" />
          Tải tài liệu
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề hoặc tên tệp..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <select
                value={filterCategory}
                onChange={(event) =>
                  setFilterCategory(
                    event.target.value as CategoryFilter,
                  )
                }
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="general">
                  Tài liệu chung
                </option>
                <option value="lecture">Bài giảng</option>
                <option value="assignment">Bài tập</option>
                <option value="submission">Bài nộp</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Chưa có tài liệu phù hợp với bộ lọc
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getFileIcon(
                        material.fileName,
                        material.mimeType,
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {material.title}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {material.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(material.size)}
                      </p>

                      <div className="mt-2">
                        <Badge variant="default">
                          {categoryLabels[
                            material.category as MaterialCategory
                          ] ?? material.category}
                        </Badge>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Cập nhật:{" "}
                        {formatDateTime(material.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <a
                      className="flex-1"
                      href={resolveApiUrl(
                        material.downloadUrl,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Download className="w-3 h-3" />
                        Tải xuống
                      </Button>
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        isDeletingId === material.id
                      }
                      onClick={() =>
                        void handleDelete(material.id)
                      }
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <UploadMaterialModal
        isOpen={showUploadModal}
        isUploading={isUploading}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUpload}
      />
    </div>
  );
}