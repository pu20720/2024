import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: AuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
        }),
    ],
    callbacks: {
        // 自定義 session 回傳的內容
        async session({ session, token }) {
            if (token.sub) {
                session.user.id = token.sub; // 將使用者 ID 加入 session
            }
            return session;
        },
        // 設置 token 內容
        async jwt({ token, account, profile }) {
            if (account) {
                token.sub = account.providerAccountId; // 將 GitHub 使用者 ID 加入 token
            }
            return token;
        },
    },

};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };