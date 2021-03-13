import React, { ReactElement } from "react";
import cn from "classnames";
import { TextContainer } from "@react-md/typography";

import Markdown, { MarkdownProps } from "./Markdown";

export interface MarkdownPageProps extends MarkdownProps {
  containerClassName?: string;
}

export default function MarkdownPage({
  containerClassName,
  children,
  ...props
}: MarkdownPageProps): ReactElement {
  return (
    <TextContainer className={cn("markdown-page", containerClassName)}>
      <Markdown {...props}>{children}</Markdown>
    </TextContainer>
  );
}
