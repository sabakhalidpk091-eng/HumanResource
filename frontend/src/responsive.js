import React, { useEffect, useState } from "react";

export function useIsNarrowScreen(breakpoint = 900) {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(
        typeof window !== "undefined" && window.innerWidth <= breakpoint
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isNarrow;
}

export function ResponsiveGrid({ style, narrowStyle, children }) {
  const isNarrow = useIsNarrowScreen();

  return (
    <div style={isNarrow ? { ...style, ...narrowStyle } : style}>
      {children}
    </div>
  );
}
