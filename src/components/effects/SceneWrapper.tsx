import type { ReactNode } from "react";

interface SceneWrapperProps {
  children: ReactNode;
}

export default function SceneWrapper({ children }: SceneWrapperProps) {
  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      {children}
    </div>
  );
}
