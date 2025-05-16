// import { VerifyNoticeDialog } from "@/components/verify-notice-dialog";
import { VerifyDocContent } from "./old-verify-doc-content";

export default function VerifyDocumentPage() {
  return (
    <>
      {/* <VerifyNoticeDialog /> */}
      <div className="container mx-auto max-w-3xl space-y-8 py-8">
        <VerifyDocContent />
      </div>
    </>
  );
}
