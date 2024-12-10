import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 專案資料夾根目錄
const BASE_DIR = path.join(process.cwd(), "user_data");

// 確保資料夾存在
function ensureUserDirectory(userId: string): string {
    return path.join(BASE_DIR, userId);
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

        const userDir = ensureUserDirectory(user_id);
        const filePath = path.join(userDir, file_id);

        // 檢查檔案是否存在
        if (!fs.existsSync(filePath)) {
            return new NextResponse(
                JSON.stringify({
                    message: "File not found",
                    path: filePath,
                }),
                { status: 404 }
            );
        }

        // 讀取檔案內容
        const fileContent = fs.readFileSync(filePath, "utf8");

        return new NextResponse(
            JSON.stringify({
                message: "File read successfully",
                content: fileContent,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error reading file:", error);
        return new NextResponse(
            JSON.stringify({
                message: "Failed to read file",
                error: error instanceof Error ? error.message : String(error),
            }),
            { status: 500 }
        );
    }
};

export const PUT = async (request: Request) => {
    try {
        const body = await request.json();
        const { user_id, file_id, newContent } = body;

        // 驗證必要的查詢參數
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
                    path: filePath,
                }),
                { status: 404 }
            );
        }

        if (newContent === undefined || newContent === null) {
            return new NextResponse(
                JSON.stringify({
                    message: "No content provided to update",
                }),
                { status: 400 }
            );
        }

        // 更新檔案內容
        fs.writeFileSync(filePath, newContent, "utf8");

        return new NextResponse(
            JSON.stringify({
                message: "File updated successfully",
                path: filePath,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating file:", error);
        return new NextResponse(
            JSON.stringify({
                message: "Failed to update file",
                error: error instanceof Error ? error.message : String(error),
            }),
            { status: 500 }
        );
    }
};
