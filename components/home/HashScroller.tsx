'use client';

import { useEffect } from 'react';

/**
 * HashScroller — when the home page mounts with a hash in the URL
 * (e.g. `/#architecture` from a navbar click on another page), scroll
 * the matching element into view. Without this, Next.js's hash
 * navigation leaves the user at the top of the page.
 */
export default function HashScroller() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hash = window.location.hash;
        if (!hash || hash.length < 2) return;

        // Defer one frame so the section components have mounted
        // and the DOM has the target id available.
        const id = hash.slice(1);
        const raf = window.requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        return () => window.cancelAnimationFrame(raf);
    }, []);

    return null;
}
