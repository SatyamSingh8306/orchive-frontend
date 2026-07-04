/**
 * Background — kept as a no-op on the new paper design system. Pages that
 * used to render bespoke dark gradients with floating blobs should drop this
 * component (or just keep an empty fragment). It's exported as a default
 * component so existing imports keep working.
 */
const Background = () => {
    return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
};

export default Background;
