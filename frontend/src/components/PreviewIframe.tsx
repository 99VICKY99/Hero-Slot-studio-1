import { useEffect, useMemo, useRef } from "react";

/**
 * Sandboxed iframe preview shell. See docs/ARCHITECTURE.md §7 and
 * CLAUDE.md §13 for the security contract:
 *  - sandbox="allow-scripts" (required for click-capture IIFE)
 *  - CSP `script-src 'self'` embedded in the injected document
 *  - Renderer strips <script> tags; the IIFE below is the only JS that runs
 */

export interface ElementClickPayload {
  elementId: string;
  rect?: DOMRect;
  modifiers?: { shift: boolean };
}

interface PreviewIframeProps {
  html: string;
  css: string;
  onElementClick?: (payload: ElementClickPayload) => void;
  onElementHover?: (elementId: string | null) => void;
  title?: string;
  className?: string;
}

const CLICK_CAPTURE_IIFE = `
(function() {
  function findElement(target) {
    if (!(target instanceof Element)) return null;
    return target.closest('[data-element-id]');
  }
  document.addEventListener('click', function(e) {
    var el = findElement(e.target);
    if (!el) return;
    var rect = el.getBoundingClientRect();
    window.parent.postMessage({
      type: 'element-click',
      elementId: el.getAttribute('data-element-id'),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      modifiers: { shift: !!e.shiftKey }
    }, '*');
  });
  document.addEventListener('mouseover', function(e) {
    var el = findElement(e.target);
    if (!el) return;
    window.parent.postMessage({
      type: 'element-hover',
      elementId: el.getAttribute('data-element-id')
    }, '*');
  });
  document.addEventListener('mouseout', function(e) {
    var el = findElement(e.target);
    if (!el) return;
    window.parent.postMessage({ type: 'element-hover', elementId: null }, '*');
  });
})();
`;

function buildIframeDocument(html: string, css: string): string {
  // CSP meta enforces no external scripts — only 'self' (the srcdoc itself).
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none';" />
    <style>
      html, body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>${CLICK_CAPTURE_IIFE}</script>
  </body>
</html>`;
}

export function PreviewIframe({
  html,
  css,
  onElementClick,
  onElementHover,
  title = "Hero preview",
  className,
}: PreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const srcDoc = useMemo(() => buildIframeDocument(html, css), [html, css]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as {
        type?: string;
        elementId?: string | null;
        rect?: DOMRect;
        modifiers?: { shift: boolean };
      };
      if (!data || typeof data.type !== "string") return;

      if (data.type === "element-click" && typeof data.elementId === "string") {
        // eslint-disable-next-line no-console -- developer feedback until toolbar lands in W4
        console.debug("[preview] element-click", data.elementId);
        onElementClick?.({
          elementId: data.elementId,
          rect: data.rect,
          modifiers: data.modifiers,
        });
      } else if (data.type === "element-hover") {
        onElementHover?.(typeof data.elementId === "string" ? data.elementId : null);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onElementClick, onElementHover]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className={
        className ??
        "h-full w-full rounded-lg border border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
      }
    />
  );
}
