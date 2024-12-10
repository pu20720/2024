import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// 專案資料夾根目錄
const BASE_DIR = path.join(process.cwd(), 'user_data');

// 確保資料夾存在
function ensureUserDirectory(userId: string): string {
    const userDir = path.join(BASE_DIR, userId);

    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
        console.log(`User directory created: ${userDir}`);
    }

    return userDir;
}

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get("user_id");
        const file_id = searchParams.get("file_id");


        if (!user_id || !file_id) {
            return new NextResponse(
                JSON.stringify({
                    message: "Missing required fields",
                }),
                { status: 400 }
            );
        }

        // 假設使用 `ensureUserDirectory` 函數來獲取目錄路徑
        const userDir = ensureUserDirectory(user_id);
        const filePath = path.join(userDir, file_id);

        // 檢查檔案是否存在
        if (!fs.existsSync(filePath)) {
            return new NextResponse(
                JSON.stringify({
                    message: "File not found",
                }),
                { status: 404 }
            );
        }

        // 讀取檔案內容
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        // 回傳檔案
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("Error handling GET request:", error);
        return new NextResponse(
            JSON.stringify({
                message: "Internal Server Error",
                error,
            }),
            { status: 500 }
        );
    }
};

export const POST = async (request: Request) => {
    const body = await request.json();
    const { user_id, file_id } = body;

    if (!user_id || !file_id) {
        return new NextResponse(
            JSON.stringify({
                message: "Missing required fields",
            }),
            {
                status: 400
            }
        );
    }

    try {
        const userDir = ensureUserDirectory(user_id);
        const filePath = path.join(userDir, file_id);

        fs.writeFileSync(filePath, "", 'utf8');
        console.log(`File saved at: ${filePath}`);

        return new NextResponse(
            JSON.stringify({
                message: {
                    path: filePath
                }
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
        const { user_id, file_id } = body;

        if (!user_id || !file_id) {
            return new NextResponse(
                JSON.stringify({
                    message: "Missing required fields",
                }),
                { status: 400 }
            );
        }

        const userDir = ensureUserDirectory(user_id);
        const filePath = path.join(userDir, file_id);

        // 檢查檔案是否存在
        if (!fs.existsSync(filePath)) {
            return new NextResponse(
                JSON.stringify({
                    message: "File not found",
                }),
                { status: 404 }
            );
        }

        // 刪除檔案
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);

        return new NextResponse(
            JSON.stringify({
                message: "File deleted successfully",
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting file:", error);
        return new NextResponse(
            JSON.stringify({
                message: "Failed to delete file",
                error: error instanceof Error ? error.message : String(error),
            }),
            { status: 500 }
        );
    }
};