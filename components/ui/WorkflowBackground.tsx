/**
 * WorkflowBackground — no-op on the new paper design system.
 * Replaces the old dark gradient + glow layers.
 */
export default function WorkflowBackground() {
    return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}
