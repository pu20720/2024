import { promises as fs } from 'fs';
import path from 'path'
import { NextResponse } from 'next/server';
import { env } from 'process';

export const POST = async (request: Request) => {
   try {
      // const directoryPath = process.env.DATA_PATH;
      // if (!directoryPath) return;

      const user_id = "asdasfdsdf156asd";

      // const file = await fs.(directoryPath);

      return new NextResponse(
         JSON.stringify({
            message: "success",
         }),
         {
            status: 200
         }
      );
   } catch (error) {
      return new NextResponse(
         JSON.stringify({
            error
         }),
         {
            status: 500
         }
      );
   }
};