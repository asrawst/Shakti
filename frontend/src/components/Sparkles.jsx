import React from 'react';
import '../App.css'; // Ensure we have access to the animation keyframes

const Sparkles = () => {
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            // Calculate normalized position (-1 to 1)
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Generate particles with an extra 'factor' for parallax depth
    // Moving assignment inside component to keep it stable but we need useMemo to avoid regen
    const particles = React.useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: `${Math.random() * 5}s`,
        duration: `${3 + Math.random() * 4}s`,
        size: Math.random() * 3 + 1,
        factor: (Math.random() - 0.5) * 50 // Movement factor (-25 to 25px max shift)
    })), []);

    return (
        <div className="sparkles-container">
            {particles.map(p => {
                // Calculate offset based on mouse position and particle's unique factor
                const xOffset = mousePos.x * p.factor;
                const yOffset = mousePos.y * p.factor;

                return (
                    <div
                        key={p.id}
                        className="sparkle"
                        style={{
                            left: `${p.left}%`,
                            top: `${p.top}%`,
                            animationDelay: p.delay,
                            animationDuration: p.duration,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            // Combine the flow animation (CSS) with the interactive transform (Inline)
                            // Note: We need a wrapper or modifying CSS to avoid conflict if CSS uses transform.
                            // CSS uses transform! "transform: translateX..." in keyframes.
                            // We should apply the parallax to a CSS variable instead of transform property directly.
                            '--parallax-x': `${xOffset}px`,
                            '--parallax-y': `${yOffset}px`
                        }}
                    />
                );
            })}
        </div>
    );
};

export default Sparkles;
