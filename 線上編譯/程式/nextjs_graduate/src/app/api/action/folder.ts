import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { IFolder } from "@/lib/interface";

export const createRootFolder = async ({ user_id }: IFolder) => {
   try {
      const res = await prisma.folder.create({
         data: {
            user_id: user_id,
            folder_name: user_id,
            parent_folder: "",
         }
      });

      return res;
   } catch (error) {
      return Error('Failed to create root folder.' + error);
   }
};

// export const createRootFolder = async ({ folder_name, parent_folder }: IFolder) => {
//    try {
//       const res = await prisma.folder.create({
//          data: {
//             folder_name,
//             parent_folder,
//          }
//       });
//       return res;
//    } catch (error) {
//       throw new Error('Failed to create root folder.' + error);
//    }
// };

// export const getRootFolders = async () => {
//    try {
//       const res = await prisma.folder.findMany({
//          select: {
//             id: true,
//             folder_name: true,
//             parent_folder: true,
//          }
//       });
//       return res;
//    } catch (error) {
//       throw new Error('Failed to fetch root folders.' + error);
//    }
// };