import { useEffect, useState } from 'react';

function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        isLarge: window.innerWidth >= 768 // Assuming 768px as the breakpoint for medium and large screens
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                isLarge: window.innerWidth >= 768
            });
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}
export { useWindowSize };