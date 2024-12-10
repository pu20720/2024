import { asyncUpdateFileName } from '@/lib/actions/files';
import { IFile } from '@/lib/interface';
import { LanguageIcons } from '@/utils/Icons';
import React, { useState, useRef, useEffect } from 'react';
import { MdCheck, MdOutlineModeEdit } from 'react-icons/md';


interface IFileList {
  filesData: IFile[];
  onFileSelect: (fileId: string) => void;
}

const FileList = ({ filesData, onFileSelect }: IFileList) => {
  const [selectedFile, setSelectedFile] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileClick = (fileId: string) => {
    setSelectedFile(fileId);
    onFileSelect(fileId);
  };

  const handleEditFileName = (fileId: string, currentName: string) => {
    setEditingFileId(fileId);
    setEditingFileName(currentName);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingFileName(e.target.value);
  };

  const handleUpdateFileName = async (fileId = editingFileId, newFileName = editingFileName) => {
    if (fileId && newFileName) {
      try {
        await asyncUpdateFileName(fileId, newFileName);
        filesData.forEach((file) => {
          if (file.id === fileId) {
            file.label = newFileName;
          }
        });
        setEditingFileId(null);
        setEditingFileName('');
      } catch (error) {
        console.error('Failed to update file name:', error);
        alert('更新失敗，請重試！');
      }
    }
  };

  const onSubmitName = () => {
    if (editingFileId) {
      handleUpdateFileName(editingFileId, editingFileName);
    }
  };

  const handleBlur = () => {
    if (editingFileName.trim() === '') {
      inputRef.current?.focus();
      return;
    }
    handleUpdateFileName();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmitName();
    }
  };

  useEffect(() => {
    if (editingFileId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingFileId]);


  const getFileType = (filename: string) => {
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'c':
        return 'c';
      case 'cpp':
        return 'cpp';
      case 'py':
        return 'python';
      case 'js':
        return 'javascript';
      default:
        return 'text';
    }
  };

  return (
    <div>
      {filesData.map((file) => {
        const fileType = getFileType(file.label);
        const Icon = LanguageIcons[fileType];

        return (
          <div
            key={file.id}
            className={`pl-4 pr-2 h-7 content-center flex justify-between items-center
            ${file.id === selectedFile ? `bg-gray-600` : `hover:bg-slate-700`}
          `}
          >
            {/* 圖示區域 */}
            <div className="mr-2">
              {Icon}
            </div>

            {/* 文件名稱 */}
            <div className="w-full">
              {editingFileId === file.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingFileName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full bg-transparent text-white focus:outline-none"
                />
              ) : (
                <p className="select-none truncate overflow-hidden text-ellipsis whitespace-nowrap" onClick={() => handleFileClick(file.id)}>
                  {file.label}
                </p>
              )}
            </div>

            {/* 編輯按鈕 */}
            {editingFileId === file.id ? (
              <div className="p-1 text-green-600 cursor-pointer hover:text-green-300" onClick={onSubmitName}>
                <MdCheck size={18} />
              </div>
            ) : (
              <div
                className="p-1 text-transparent cursor-pointer hover:text-slate-300"
                onClick={() => handleEditFileName(file.id, file.label)}
              >
                <MdOutlineModeEdit />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};


export default FileList;
