import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
   try {
      // const body = await request.json();
      // const {  } = body;

      const directoryPath = '/home/user/testAA';
      let files: string[] = [];

      const file = await fs.readFile(directoryPath);

      console.log(file);


      // fs.readdir(directoryPath, (error, datas) => {
      //    if (error) {
      //       console.log("error", error);
      //    }

      //    files = datas.map(data => path.join(directoryPath, data));
      //    console.log(files);
      // })

      return new NextResponse(
         JSON.stringify({
            message: "success",
            files: files,
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
