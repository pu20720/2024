import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
   try {
      const body = await request.json();
      const { path } = body;

      const dataPath = process.env.NEXT_PUBLIC_DATA_PATH;
      if (!dataPath) {
         console.log("Data path not found.");
         return;
      }

      await fs.access(dataPath + path);

      return new NextResponse(
         JSON.stringify(true),
         {
            status: 200
         }
      );
   } catch (error) {
      return new NextResponse(
         JSON.stringify(false),
         {
            status: 200
         }
      );
   }
};

// const handler = (req: NextApiRequest, res: NextApiResponse) => {
//    const directoryPath = '/home/user/testAA';

//    fs.readdir(directoryPath, (err, files) => {
//       if (err) {
//          res.status(500).json({ error: 'Unable to scan directory' });
//          return;
//       }

//       const filePaths = files.map(file => path.join(directoryPath, file));
//       res.status(200).json({ files: filePaths });
//    });
// }

// export default handler;
