import type { ReactNode } from "react";

interface SceneWrapperProps {
  children: ReactNode;
}

export default function SceneWrapper({ children }: SceneWrapperProps) {
  return (
    <div className="relative overflow-hidden" style={{ minHeight: "100dvh" }}>
      {children}
    </div>
  );
}
