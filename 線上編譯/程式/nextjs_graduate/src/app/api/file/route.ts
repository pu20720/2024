import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
   try {
      const urlParams = new URL(request.url);
      const file_id = urlParams.searchParams.get('file_id');

      if (!file_id) {
         return new NextResponse(
            JSON.stringify({
               message: "File id undefine.",
            }),
            {
               status: 400,
            },
         );
      }

      const file = await prisma.file.findUnique({
         where: {
            id: file_id,
         }
      });

      return new NextResponse(
         JSON.stringify({
            file
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

export const POST = async (request: Request) => {
   try {
      const body = await request.json();
      const { id, user_id, label } = body;

      const res = await prisma.file.create({
         data: {
            id: id,
            user_id: user_id,
            label: label
         }
      });

      return new NextResponse(
         JSON.stringify({
            message: {
               id: id,
               user_id: user_id,
               label: label,
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

      const deleteFile = async (fileId: string) => {
         // delete current folder
         await prisma.file.delete({
            where: { id: fileId }
         });
      };

      // start delete
      await deleteFile(id);

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

export const PUT = async (request: Request) => {
   try {
      const body = await request.json();
      const { file_id, new_label } = body;

      const updatedFile = await prisma.file.update({
         where: { id: file_id },
         data: { label: new_label },
      });

      return new Response(
         JSON.stringify({
            message: 'File updated successfully',
            data: updatedFile,
         }),
         { status: 200 }
      );

   } catch (error) {
      console.error('Error updating file:', error);
      return new Response(
         JSON.stringify({ error: 'Failed to update file' }),
         { status: 500 }
      );
   }
}