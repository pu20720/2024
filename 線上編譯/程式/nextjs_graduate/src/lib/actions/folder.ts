import { IFile, IFolder } from "../interface";

export const asyncfetchFoldersData = async (user_id: string):
   Promise<{ status: number; message: string; data: IFolder[] }> => {
   const response = await fetch(`/api/folders?user_id=${user_id}`, {
      method: "GET",
      headers: {
         "Content-Type": "application/json",
      },
   });

   if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.folders)) {
         return {
            status: response.status,
            message: "Fetch Folders Success",
            data: data.folders as IFolder[],
         }
      }
      return {
         status: response.status,
         message: "Fetch Folders Failed",
         data: [],
      }
   }
   return {
      status: response.status,
      message: "Fetch Folders Failed",
      data: [],
   }
};

export const asyncCreateNewFolder = async (newFolder: IFolder):
   Promise<{ status: number; message: string }> => {
   const response = await fetch("/api/folder", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         id: newFolder.id,
         label: newFolder.label,
         parent_folder: newFolder.parent_folder,
         user_id: newFolder.user_id,
      }),
   });

   if (response.ok) {
      const data = await response.json();
      return {
         status: response.status,
         message: "Create Folder Success" + data.message,
      };
   }

   return {
      status: response.status,
      message: "Create Folder Failed",
   };
}

export const asyncDeleteFolder = async (folder_id: string):
   Promise<{ status: number; message: string }> => {
   const response = await fetch("/api/folder", {
      method: "DELETE",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         id: folder_id,
      }),
   });

   if (response.ok) {
      return {
         status: response.status,
         message: "Delete Folder Success",
      };
   }

   return {
      status: response.status,
      message: "Delete Folder Failed",
   };
}