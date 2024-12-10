import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createRootFolder } from '../../action/folder';

export const POST = async (request: Request) => {
   try {
      const body = await request.json();
      const { user_id } = body;

      const dataPath = process.env.NEXT_PUBLIC_DATA_PATH;
      if (!dataPath) {
         console.log("Data path not found.");
         return;
      }
      await fs.mkdir(dataPath + user_id, { recursive: true });

      const db_res = await prisma.folder.create({
         data: {
            user_id: user_id,
            label: user_id,
            parent_folder: "",
         }
      });

      return new NextResponse(
         JSON.stringify({
            message: user_id,
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