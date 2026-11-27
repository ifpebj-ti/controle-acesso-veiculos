import { useEffect, useRef } from "react";
import { ActionFeedback } from "../../components/ui/ActionFeedback";

export function CorrectionFeedback({
  message,
  tone = "error",
}: {
  message?: string | null;
  tone?: "error" | "success";
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (message) wrapper.current?.scrollIntoView?.({ block: "nearest" });
  }, [message]);
  return (
    <div ref={wrapper}>
      <ActionFeedback message={message} tone={tone} focusOnChange />
    </div>
  );
}
