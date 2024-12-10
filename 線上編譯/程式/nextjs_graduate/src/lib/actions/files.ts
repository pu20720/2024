import { IFile } from "../interface";

export const asyncfetchFilesData = async (user_id: string):
   Promise<{ status: number; message: string; data: IFile[] }> => {
   const response = await fetch(`/api/files?user_id=${user_id}`, {
      method: "GET",
      headers: {
         "Content-Type": "application/json",
      },
   });

   if (response.ok) {
      const data = await response.json();
      return {
         status: response.status,
         message: "Fetch Files Success",
         data: data.files as IFile[],
      }
   }
   return {
      status: response.status,
      message: "Fetch Files Failed",
      data: [],
   }
};

export const asyncfetchFileData = async (file_id: string):
   Promise<{ status: number; message: string; data: IFile | null }> => {
   const response = await fetch(`/api/file?file_id=${file_id}`, {
      method: "GET",
      headers: {
         "Content-Type": "application/json",
      },
   });

   if (response.ok) {
      const data = await response.json();
      return {
         status: response.status,
         message: "Fetch File Success",
         data: data.file as IFile,
      }
   }
   return {
      status: response.status,
      message: "Fetch File Failed",
      data: null,
   }
};

export const asyncCreateNewFile = async (newFile: IFile):
   Promise<{ status: number; message: string }> => {
   const response = await fetch("/api/file", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         id: newFile.id,
         label: newFile.label,
         user_id: newFile.user_id,
      }),
   });

   if (response.ok) {
      const data = await response.json();
      return {
         status: response.status,
         message: "Create File Success: " + data.message,
      };
   }

   return {
      status: response.status,
      message: "Create File Failed",
   };
}

export const asyncDeleteFile = async (file_id: string):
   Promise<{ status: number; message: string }> => {
   const response = await fetch("/api/file", {
      method: "DELETE",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         id: file_id,
      }),
   });

   if (response.ok) {
      return {
         status: response.status,
         message: "Delete File Success",
      };
   }

   return {
      status: response.status,
      message: "Delete File Failed",
   };
}

export const asyncUpdateFileName = async (file_id: string, new_label: string):
   Promise<{ status: number; message: string }> => {
   const response = await fetch("/api/file", {
      method: "PUT",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         file_id,
         new_label
      }),
   });

   if (response.ok) {
      return {
         status: response.status,
         message: "Update File Success",
      };
   }

   return {
      status: response.status,
      message: "Update File Failed",
   };
}

export const asyncfetchFile = async (user_id: string, file_id: string):
   Promise<{ status: number; message: string; data: File | null }> => {
   try {
      const response = await fetch(`/api/local/file?user_id=${user_id}&file_id=${file_id}`, {
         method: "GET",
         headers: {
            "Content-Type": "application/octet-stream",
         },
      });

      if (response.ok) {
         const blob = await response.blob();
         const file = new File([blob], file_id, { type: blob.type });

         return {
            status: response.status,
            message: "Fetch Files Success",
            data: file,
         };
      } else {
         return {
            status: response.status,
            message: "Fetch Files Failed",
            data: null,
         };
      }
   } catch (error) {
      return {
         status: 500,
         message: "Fetch Files Failed: " + error,
         data: null,
      };
   }
};
