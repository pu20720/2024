import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const GET = async (request: Request) => {
   try {
      const urlParams = new URL(request.url);
      const user_id = urlParams.searchParams.get('user_id');

      if (!user_id) {
         return new NextResponse(
            JSON.stringify({
               message: "User id undefine.",
            }),
            {
               status: 400,
            },
         );
      }

      const folders = await prisma.folder.findMany({
         where: {
            user_id,
         }
      });

      return new NextResponse(
         JSON.stringify({
            folders,
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
            status: 500,
         },
      );
   }
};