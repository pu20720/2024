import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const POST = async (request: Request) => {
   try {
      const body = await request.json();
      const { id, user_id, label, parent_folder } = body;

      const res = await prisma.folder.create({
         data: {
            id: id,
            user_id: user_id,
            label: label,
            parent_folder: parent_folder,
         }
      });

      return new NextResponse(
         JSON.stringify({
            message: {
               id: id,
               user_id: user_id,
               label: label,
               parent_folder: parent_folder,
            },
         }),
         {
            status: 200
         }
      );
   } catch (error) {
      return new NextResponse(
         JSON.stringify({
            message: error,
         }),
         {
            status: 500
         }
      );
   }
};

export const DELETE = async (request: Request) => {
   try {
      const body = await request.json();
      const { id } = body;

      const deleteFolder = async (folderId: string) => {
         // get all child folders
         const childFolders = await prisma.folder.findMany({
            where: { parent_folder: folderId }
         });

         // delete all child folders
         for (const childFolder of childFolders) {
            await deleteFolder(childFolder.id);
         }

         // delete current folder
         await prisma.folder.delete({
            where: { id: folderId }
         });
      };

      // start delete
      await deleteFolder(id);

      return new NextResponse(
         JSON.stringify({
            message: {
               id: id,
            },
         }),
         {
            status: 200
         }
      );
   } catch (error) {
      return new NextResponse(
         JSON.stringify({
            message: {
               error: error,
            },
         }),
         {
            status: 500
         }
      );
   }
};