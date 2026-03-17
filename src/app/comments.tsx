"use client";

import Giscus from "@giscus/react";

export default function Comments() {
  return (
    <div className="mt-16 border-t border-zinc-800 pt-12">
      <p className="mb-6 font-mono text-sm text-green-400/70">
        {">"} leave a comment
      </p>
      <Giscus
        repo="luxdvie/freedom-for-steve"
        repoId="R_kgDORo0XVw"
        category="General"
        categoryId="DIC_kwDORo0XV84C4mQs"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="noborder_dark"
        lang="en"
        loading="lazy"
      />
    </div>
  );
}
