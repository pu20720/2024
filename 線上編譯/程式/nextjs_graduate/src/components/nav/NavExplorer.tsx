"use client";
import React, { useEffect, useState } from 'react'
import { CgFileAdd, CgFolderAdd } from "react-icons/cg";
import { TbReload } from "react-icons/tb";
import { MdDelete } from "react-icons/md";
import { v4 as uuidv4 } from 'uuid';
import { FILE_TYPE, IFile, IFolder, IOpenedFile } from '@/lib/interface';
import { asyncCreateNewFolder, asyncDeleteFolder, asyncfetchFoldersData } from '@/lib/actions/folder';
import { asyncCreateNewFile, asyncDeleteFile, asyncfetchFilesData } from '@/lib/actions/files';
import FileExplorer from '../tree/FileExplorer';
import FileList from '../File/FileList';
import { createLoaclFile, deleteLoaclFile, fetchLocalFileData } from '@/lib/localAction/files';
import { useSession } from 'next-auth/react';
import { getFileFullType } from '@/lib/functions';

var newFileIndex = 1;

interface INavExplorer {
   onOpenFile: ({
      code, file_id, file_name, file_type, owner_id
   }: IOpenedFile) => void;
}

const NavExplorer = ({ onOpenFile }: INavExplorer) => {

   const session = useSession();

   const [userId, setUserId] = useState<string>("");
   const [foldersData, setFoldersData] = useState<IFolder[]>([]);
   const [filesData, setFilesData] = useState<IFile[]>([]);
   const [newFileClicked, setNewFileClicked] = useState<React.MouseEvent>();
   const [rootFolderId, setRootFolderId] = useState<string>("");
   const [selectedFileId, setSelectedFileId] = useState<string>("");

   async function fetchAllFiles() {
      const data = await asyncfetchFilesData(userId)
      setFilesData(data.data.sort((a, b) => a.label.localeCompare(b.label)));
   }

   useEffect(() => {
      setUserId(session.data?.user.id)
   }, [])

   useEffect(() => {
      if (userId) {
         fetchAllFiles();
      }
   }, [userId])

   const handleCreateFile = async (event: React.MouseEvent) => {
      setNewFileClicked(event);

      const newId = uuidv4();

      const res = await createLoaclFile({
         file_id: newId,
         owner_id: userId,
      })

      console.log(res);

      var newFile: IFile = {
         id: newId,
         user_id: userId,
         label: newFileIndex > 1 ? `New File ${newFileIndex.toString()}` : "New File",
      }
      setFilesData([...filesData, newFile]);
      await asyncCreateNewFile(newFile);
      newFileIndex++;
   }

   const handleDeleteFolder = async () => {
      const res = await deleteLoaclFile({
         file_id: selectedFileId,
         owner_id: userId,
      })

      if (selectedFileId === "") return;
      try {
         const res = await asyncDeleteFile(selectedFileId);
         if (res.status === 200) {
            const updatedFiles = filesData
               .filter(file => file.id !== selectedFileId)
               .sort((a, b) => a.label.localeCompare(b.label));
            setFilesData(updatedFiles);
            setSelectedFileId("");
         } else {
            console.error("Delete File Failed:", res.message);
         }
      } catch (error) {
         console.error("Error in Delete File:", error);
      }
   }

   const handleFileSelect = async (file_id: string) => {
      console.log("Selected file ID:" + file_id);
      setSelectedFileId(file_id);

      const selectedFile = filesData.find(file => file.id === file_id);
      if (!selectedFile) {
         console.log("file not found.");
         return;
      }

      const data = await fetchLocalFileData({
         file_id: file_id,
         owner_id: userId,
      })

      const fileType = getFileFullType(selectedFile.label);

      onOpenFile({
         code: data?.data,
         file_id: file_id,
         file_name: selectedFile?.label,
         file_type: fileType,
         owner_id: userId,
      });
   };


   return (
      <div className='text-white'>
         <div className='w-full h-8 mb-2 bg-slate-700 flex justify-around items-center'>
            <div
               onClick={fetchAllFiles}
               className='p-1 rounded-md text-[#9a9b9d] hover:bg-slate-600 hover:text-white'>
               <TbReload fontSize={18} />
            </div>
            <div
               onClick={handleCreateFile}
               className='p-1 rounded-md text-[#9a9b9d] hover:bg-slate-600 hover:text-white'>
               <CgFileAdd fontSize={18} />
            </div>
            <div
               onClick={handleDeleteFolder}
               className='p-1 rounded-md text-[#9a9b9d] hover:bg-slate-600 hover:text-white'>
               <MdDelete fontSize={18} />
            </div>
         </div>
         <div>
            <FileList
               filesData={filesData}
               onFileSelect={handleFileSelect} />
         </div>
      </div>
   )
}

export default NavExplorer
