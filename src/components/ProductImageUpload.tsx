import React, { useEffect, useState } from "react";
import { Upload, Modal, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

interface ProductImageUploadProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({ value, onChange }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");

  // Keep the internal file list in sync when the form value changes
  // (e.g. opening the modal to edit a different product).
  useEffect(() => {
    if (value) {
      setFileList([{ uid: "-1", name: "anh-san-pham", status: "done", url: value }]);
    } else {
      setFileList([]);
    }
  }, [value]);

  const beforeUpload = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ chấp nhận file ảnh");
      return Upload.LIST_IGNORE;
    }
    const isSmallEnough = file.size / 1024 / 1024 < 2;
    if (!isSmallEnough) {
      message.error("Ảnh phải nhỏ hơn 2MB");
      return Upload.LIST_IGNORE;
    }
    const base64 = await fileToBase64(file);
    setFileList([{ uid: "-1", name: file.name, status: "done", url: base64 }]);
    onChange?.(base64);
    return false; // ngăn không cho antd tự upload lên server
  };

  const handleRemove = () => {
    setFileList([]);
    onChange?.(undefined);
  };

  const handlePreview = (file: UploadFile) => {
    setPreviewImage(file.url || "");
    setPreviewOpen(true);
  };

  const handleDownload = (file: UploadFile) => {
    const link = document.createElement("a");
    link.href = file.url || "";
    link.download = file.name || "anh-san-pham.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadProps: UploadProps = {
    listType: "picture-card",
    fileList,
    maxCount: 1,
    beforeUpload,
    onRemove: handleRemove,
    onPreview: handlePreview,
    showUploadList: { showDownloadIcon: true, showRemoveIcon: true, showPreviewIcon: true },
    onDownload: handleDownload,
    accept: "image/*",
  };

  return (
    <>
      <Upload {...uploadProps}>
        {fileList.length === 0 && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
          </div>
        )}
      </Upload>
      <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)}>
        <img alt="preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </>
  );
};

export default ProductImageUpload;
