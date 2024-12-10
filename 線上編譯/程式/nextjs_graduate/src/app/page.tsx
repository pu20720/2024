"use client";
import ExplorerEditorBlock from "@/components/layout/block/ExplorerEditorBlock";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {

  const session = useSession();
  const router = useRouter();

  if (!session.data) {
    router.push("/signin");
  }

  return (
    <main>
      {/* <FileExplorer /> */}
      <div className="bg-black">
        <ExplorerEditorBlock />
      </div>
    </main>
  );
}
