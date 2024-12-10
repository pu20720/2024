import prisma from "@/lib/prisma";

export const createUser = async (username: string) => {
   try {
      const res = await prisma.user.create({
         data: {
            username,
            root_folder_id,
         }
      });
      return res;
   } catch (error) {
      throw new Error('Failed to create root folder.');
   }
};