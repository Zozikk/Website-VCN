"use client";

import { useEffect } from "react";

interface CmsScriptRunnerProps {
  script: string;
  slug: string;
}

export function CmsScriptRunner({ script, slug }: CmsScriptRunnerProps) {
  useEffect(() => {
    if (!script || !script.trim()) {
      return;
    }

    const root = document.querySelector(`[data-page-slug="${slug}"]`);

    if (!root) {
      return;
    }

    const pageContext = { slug, preview: false };

    try {
      const execute = new Function("root", "pageContext", script);
      execute(root, pageContext);
    } catch (error) {
      console.error("CMS runtime script error:", error);
    }
  }, [script, slug]);

  return null;
}
