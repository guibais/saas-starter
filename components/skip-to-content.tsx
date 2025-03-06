import { FC } from "react";

interface SkipToContentProps {
  contentId?: string;
}

export const SkipToContent: FC<SkipToContentProps> = ({
  contentId = "main-content",
}) => {
  return (
    <a
      href={`#${contentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-white focus:text-green-800 focus:font-medium focus:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:rounded-md"
    >
      Pular para o conteúdo principal
    </a>
  );
};
