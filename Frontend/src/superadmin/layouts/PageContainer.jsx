import React from "react";

export const PageContainer = React.memo(({
  children,
  className = ""
}) => {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 ${className}`}>
      {children}
    </div>
  );
});

export default PageContainer;
