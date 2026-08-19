import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import {
  getApiErrorMessage,
  materialsApi,
  resolveApiUrl,
} from '@/api';
import type {
  MaterialCategory,
  MaterialResponse,
  MaterialUploadInitResponse,
} from '@/types';
import { resolveWorkspaceId } from '@/app/utils/workspace';
import { formatDateTime } from '@/app/utils/format';

type CategoryFilter = 'all' | MaterialCategory;

const categoryLabels: Record<MaterialCategory, string> = {
  general: 'Tài liệu chung',
  lecture: 'Bài giảng',
  assignment: 'Bài tập',
  submission: 'Bài nộp',
};

function formatFileSize(sizeInBytes: number | null): string {
  if (sizeInBytes === null || sizeInBytes <= 0) {
    return '-';
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

function getFileIcon(fileName: string, mimeType: string | null) {
  const lowerMime = (mimeType ?? '').toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(lowerName)) {
    return <Image className="w-8 h-8 text-blue-500" />;
  }
  if (lowerMime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(lowerName)) {
    return <Video className="w-8 h-8 text-purple-500" />;
  }
  if (
    lowerMime.includes('pdf') ||
    lowerMime.includes('word') ||
    lowerMime.includes('presentation') ||
    /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/.test(lowerName)
  ) {
    return <FileText className="w-8 h-8 text-red-500" />;
  }
  return <File className="w-8 h-8 text-gray-500" />;
}

export default function MaterialsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MaterialCategory>('general');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('all');

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const activeWorkspaceId = await resolveWorkspaceId();
      setWorkspaceId(activeWorkspaceId);
      const list = await materialsApi.listWorkspaceMaterials(activeWorkspaceId);
      setMaterials(list);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách tài liệu'));
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
        filterCategory === 'all' || item.category === filterCategory;
      return bySearch && byCategory;
    });
  }, [filterCategory, materials, searchQuery]);

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadTitle('');
    setUploadCategory('general');
  };

  const closeUploadModal = () => {
    if (isUploading) {
      return;
    }
    setShowUploadModal(false);
    resetUploadForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    let uploadSession: MaterialUploadInitResponse | null = null;

    try {
      uploadSession = await materialsApi.initUpload(workspaceId, {
        title: uploadTitle.trim() || selectedFile.name,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
        category: uploadCategory,
      });

      if (uploadSession.totalParts !== 1) {
        throw new Error('Tệp quá lớn cho luồng upload hiện tại. Vui lòng chia nhỏ tệp hoặc giảm dung lượng.');
      }

      const signResult = await materialsApi.signUploadPart(workspaceId, {
        materialId: uploadSession.materialId,
        uploadSessionId: uploadSession.uploadSessionId,
        uploadId: uploadSession.uploadId,
        objectKey: uploadSession.objectKey,
        partNumber: 1,
      });

      const uploadResult = await fetch(signResult.url, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
        },
        body: selectedFile,
      });

      console.log("uploadResult", uploadResult);

      if (!uploadResult.ok) {
        throw new Error(`Upload thất bại (${uploadResult.status})`);
      }

      const etag =
        uploadResult.headers.get('etag') ??
        uploadResult.headers.get('ETag');
      if (!etag) {
        throw new Error('Không đọc được ETag từ storage sau khi upload');
      }

      await materialsApi.completeUpload(workspaceId, {
        materialId: uploadSession.materialId,
        uploadSessionId: uploadSession.uploadSessionId,
        uploadId: uploadSession.uploadId,
        objectKey: uploadSession.objectKey,
        parts: [{ partNumber: 1, etag }],
      });

      toast.success('Tải tài liệu thành công');
      setShowUploadModal(false);
      resetUploadForm();
      await loadMaterials();
    } catch (error) {
      if (uploadSession) {
        try {
          await materialsApi.abortUpload(workspaceId, {
            materialId: uploadSession.materialId,
            uploadSessionId: uploadSession.uploadSessionId,
            uploadId: uploadSession.uploadId,
            objectKey: uploadSession.objectKey,
          });
        } catch {
          // Keep original error from upload flow.
        }
      }
      toast.error(getApiErrorMessage(error, 'Không thể tải tài liệu'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      return;
    }

    setIsDeletingId(materialId);
    try {
      await materialsApi.deleteMaterial(materialId);
      setMaterials((prev) => prev.filter((item) => item.id !== materialId));
      toast.success('Đã xóa tài liệu');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xóa tài liệu'));
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài liệu</h1>
          <p className="text-gray-600 mt-1">Quản lý tài liệu giảng dạy và học tập theo workspace</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} disabled={!workspaceId || isLoading}>
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
                placeholder="Tìm kiếm theo tên hoặc file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as CategoryFilter)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="general">Tài liệu chung</option>
                <option value="lecture">Bài giảng</option>
                <option value="assignment">Bài tập</option>
                <option value="submission">Bài nộp</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : filteredMaterials.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Chưa có tài liệu phù hợp bộ lọc</p>
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
                      {getFileIcon(material.fileName, material.mimeType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{material.title}</p>
                      <p className="text-xs text-gray-600 truncate">{material.fileName}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatFileSize(material.size)}</p>
                      <div className="mt-2">
                        <Badge variant="default">
                          {categoryLabels[(material.category as MaterialCategory)] ?? material.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Cập nhật: {formatDateTime(material.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <a
                      className="flex-1"
                      href={resolveApiUrl(material.downloadUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="w-3 h-3" />
                        Tải xuống
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeletingId === material.id}
                      onClick={() => void handleDelete(material.id)}
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

      <Modal
        isOpen={showUploadModal}
        onClose={closeUploadModal}
        title="Tải tài liệu mới"
        size="lg"
      >
        <form onSubmit={handleUpload}>
          <ModalBody className="space-y-4">
            <Input
              label="Tiêu đề tài liệu"
              placeholder="VD: Lesson 3 Slides"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Tài liệu chung</option>
                <option value="lecture">Bài giảng</option>
                <option value="assignment">Bài tập</option>
                <option value="submission">Bài nộp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn file
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="material-file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="material-file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  {selectedFile ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Kéo thả file hoặc click để chọn file
                    </p>
                  )}
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeUploadModal} disabled={isUploading}>
              Hủy
            </Button>
            <Button type="submit" disabled={!selectedFile || isUploading}>
              <Upload className="w-4 h-4" />
              {isUploading ? 'Đang tải...' : 'Tải lên'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
