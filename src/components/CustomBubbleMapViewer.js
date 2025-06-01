// src/components/CustomBubbleMapViewer.js
import React, { useState, useMemo, useRef, useEffect } from 'react';

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const CustomBubbleMapViewer = ({ data = [], width: initialWidth = '100%', height: initialHeight = 450 }) => {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null); // Ref for the container div
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    // Debounce resize handler
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      }, 100); // Adjust debounce delay as needed
    };

    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);


  const processedBubbles = useMemo(() => {
    if (!data || data.length === 0 || containerWidth === 0) return { items: [], calculatedHeight: initialHeight };

    const balances = data.map(d => d.uiAmount);
    const minBalance = Math.min(...balances.filter(b => b > 0));
    const maxBalance = Math.max(...balances);

    const minRadius = 5;
    const maxRadius = Math.min(60, containerWidth / 8); // Ensure bubbles aren't excessively large

    const radiusScale = (amount) => {
      if (amount <= 0) return minRadius / 2;
      if (maxBalance === minBalance || maxBalance <= 0) return (minRadius + maxRadius) / 2;
      const proportion = Math.pow(amount / maxBalance, 0.45); // Slightly adjust power for spread
      return minRadius + proportion * (maxRadius - minRadius);
    };

    const bubbles = [];
    let currentX = 0;
    let currentY = 0;
    let rowMaxDiameter = 0;
    const padding = 8; // Increased padding slightly

    // Sort data to attempt placing larger bubbles first - can help with basic packing
    const sortedData = [...data].sort((a, b) => b.uiAmount - a.uiAmount);

    sortedData.forEach((holder, index) => {
      const radius = radiusScale(holder.uiAmount);
      const diameter = radius * 2;

      if (index === 0) {
        currentY = padding + radius; // Center of the first bubble in Y
        rowMaxDiameter = diameter;
      }
      
      if (currentX + diameter + (padding * 2) > containerWidth && index > 0) {
        currentX = 0;
        currentY += rowMaxDiameter + padding;
        rowMaxDiameter = diameter; // Reset for new row
      }
      
      // Update rowMaxDiameter if current bubble is larger
      if (diameter > rowMaxDiameter) {
          rowMaxDiameter = diameter;
      }

      const xPos = currentX + padding + radius;
      // Adjust yPos to keep bubbles aligned along their horizontal centerline for the current row.
      // The currentY marks the top of the row, add half of current row's max diameter.
      const yPosCurrentRow = currentY - radius + (rowMaxDiameter / 2);


      bubbles.push({
        id: holder.owner || `bubble-${index}`,
        x: xPos,
        y: yPosCurrentRow, 
        r: radius,
        fill: 'hsla(270, 50%, 70%, 0.7)', 
        stroke: 'hsla(270, 60%, 85%, 0.9)',
        data: holder,
      });
      currentX = xPos + radius; // Next bubble starts right after this one, padding added at start of next
    });
    
    const calculatedHeight = Math.max(initialHeight, currentY + (rowMaxDiameter / 2) + padding);

    return { items: bubbles, calculatedHeight: calculatedHeight };

  }, [data, containerWidth, initialHeight]);
  
  const { items: bubblesToRender, calculatedHeight: finalSvgHeight } = processedBubbles;

  if (!data || data.length === 0) {
    return (
      <div ref={containerRef} style={{ width: initialWidth, height: initialHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color, #555)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
        <p className="text-gray-400 text-sm">No holder data to display in custom map.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: initialWidth, height: finalSvgHeight, border: '1px solid var(--border-color, #4a0e60)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}> {/* Changed overflow to hidden */}
      <svg width={containerWidth > 0 ? containerWidth : '100%'} height={finalSvgHeight}>
        {bubblesToRender.map(bubble => (
          <g key={bubble.id} transform={`translate(${bubble.x}, ${bubble.y})`}>
            <circle
              r={bubble.r}
              fill={bubble.fill}
              stroke={bubble.stroke}
              strokeWidth="1"
              onMouseEnter={(e) => {
                const svgElement = e.currentTarget.ownerSVGElement;
                if (!svgElement) return;
                const svgRect = svgElement.getBoundingClientRect();
                // Calculate tooltip position relative to the SVG container
                // Position tooltip above the bubble
                let tipX = bubble.x + e.nativeEvent.offsetX - svgRect.left; // e.nativeEvent.offsetX is experimental, might need clientX
                let tipY = bubble.y - bubble.r - 10; // 10px above the bubble's top edge

                // Adjust if tooltip goes off-screen (simple boundary check)
                // This assumes tooltip width is around 150-200px
                if (tipX + 100 > containerWidth) tipX = containerWidth - 100;
                if (tipX - 100 < 0) tipX = 100;
                if (tipY < 0) tipY = bubble.y + bubble.r + 10; // If off top, position below


                setTooltip({
                  x: tipX, 
                  y: tipY, 
                  content: `${shortenAddress(bubble.data.owner)}: ${bubble.data.uiAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} $IE`
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer', transition: 'fill 0.2s ease, stroke 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.fill = 'hsla(270, 60%, 80%, 0.9)'; e.currentTarget.style.stroke = 'hsla(270, 70%, 90%, 1)';}}
              onMouseOut={(e) => { e.currentTarget.style.fill = bubble.fill;  e.currentTarget.style.stroke = bubble.stroke;}}
            />
          </g>
        ))}
      </svg>
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: `${tooltip.x}px`, // Ensure units are passed
          top: `${tooltip.y}px`,  // Ensure units are passed
          background: 'rgba(26, 0, 51, 0.95)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          pointerEvents: 'none',
          transform: tooltip.y < 30 ? 'translate(-50%, 10px)' : 'translate(-50%, -110%)', // Adjust based on y position
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          border: '1px solid var(--highlight-color, #ff66ff)',
          zIndex: 10000,
          whiteSpace: 'nowrap',
          transition: 'opacity 0.1s ease-in-out', // Smooth appearance
          opacity: 1,
        }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default CustomBubbleMapViewer;