// src/components/CustomBubbleMapViewer.js
import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react';
import * as d3 from 'd3';

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const CustomBubbleMapViewer = ({ 
  data = [], 
  initialWidth = '100%', 
  initialHeight = '100%',
  totalSupply = 0 
}) => {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        let w = containerRef.current.offsetWidth;
        let h = containerRef.current.offsetHeight; 
        
        if (w <= 0) w = 280; 
        if (h <= 0) h = 280; 
        
        setDimensions({ width: w, height: h });
      }
    };

    const observer = new ResizeObserver(updateDimensions);
    let currentRef = containerRef.current; 
    if (currentRef) {
      observer.observe(currentRef);
      updateDimensions(); 
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  const totalDisplayedInMap = useMemo(() => {
    let sum = 0;
    const sumLeaves = (nodes) => {
      nodes.forEach(node => {
        if (node.children) sumLeaves(node.children);
        else sum += node.value || 0; 
      });
    };
    sumLeaves(data);
    return sum;
  }, [data]);

  useEffect(() => {
    if (!data || data.length === 0 || dimensions.width <= 10 || dimensions.height <= 10) {
      if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)   
      .attr("height", dimensions.height) 
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .style("display", "block").style("cursor", "grab")
      .style("background-color", "rgba(10, 5, 20, 0.4)") 
      .style("border-radius", "inherit") 
      .style("overflow", "hidden"); 

    svg.selectAll("*").remove();

    const rootNode = d3.hierarchy({ name: "root", children: data })
      .sum(d => d.value || 0) 
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const effectiveWidth = dimensions.width;
    const edgePadding = Math.max(1, Math.min(5, effectiveWidth * 0.015)); 
    const interBubblePadding = d => d.children ? 
                                Math.max(2, effectiveWidth * 0.007) : 
                                Math.max(0.5, effectiveWidth * 0.003);

    const packLayout = d3.pack()
      .size([effectiveWidth - (edgePadding * 2), dimensions.height - (edgePadding * 2)])
      .padding(interBubblePadding);

    const packedRoot = packLayout(rootNode);
    const allNodesToRender = packedRoot.descendants().slice(1); 

    const leafColorScale = d3.scaleSequentialSqrt(d3.interpolatePuRd)
        .domain([0, d3.max(allNodesToRender.filter(d => !d.children), d => d.r) || 1]);
    
    const nodeGroup = svg.append("g").attr("transform", `translate(${edgePadding},${edgePadding})`);

    const nodeElements = nodeGroup.selectAll("g.node").data(allNodesToRender).join("g")
      .attr("class", d => d.children ? "node bundle-node" : "node leaf-node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        const isBundle = !!d.children;
        const currentId = d.data.owner || d.data.name;
        if (!selectedItem || selectedItem.id !== currentId) {
          d3.select(this).select("circle").transition().duration(100)
            .attr("r", d.r * (isBundle ? 1.02 : 1.05)) 
            .style("stroke-width", isBundle ? 2 : 1.5) 
            .style("stroke", "var(--highlight-color, #ff99ff)");
        }
        const [svgX, svgY] = d3.pointer(event, svgRef.current.closest('svg'));
        const name = d.data.name || d.data.owner;
        const balance = d.value; 
        setTooltip({ 
            x: svgX, y: svgY - 10, 
            content: `${isBundle ? name + ' (Bundle)' : shortenAddress(name) + ':'} ${balance.toLocaleString(undefined, {minimumFractionDigits:3, maximumFractionDigits:3})} $IE` 
        });
      })
      .on("mouseout", function(event, d) {
         const isBundle = !!d.children;
         const currentId = d.data.owner || d.data.name;
         if (!selectedItem || selectedItem.id !== currentId) {
          d3.select(this).select("circle").transition().duration(100)
            .attr("r", d.r)
            .style("stroke-width", isBundle ? 1.5 : 1)
            .style("stroke", isBundle ? (d.data.color ? d3.color(d.data.color).darker(0.5) : "#777") : d3.color(leafColorScale(d.r)).darker(0.4) );
        }
        setTooltip(null);
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        const currentId = d.data.owner || d.data.name;
        const isBundle = !!d.children;

        if (selectedItem && selectedItem.element && selectedItem.id !== currentId) {
           d3.select(selectedItem.element).select("circle").transition().duration(100)
              .attr("r", selectedItem.originalRadius)
              .style("stroke-width", selectedItem.isBundle ? 1.5:1)
              .style("stroke", selectedItem.isBundle ? (selectedItem.color ? d3.color(selectedItem.color).darker(0.5) : "#777") : d3.color(leafColorScale(selectedItem.originalRadius)).darker(0.4));
        }

        if(!selectedItem || selectedItem.id !== currentId){
          d3.select(this).select("circle").transition().duration(100)
            .attr("r", d.r * (isBundle ? 1.02 : 1.05))
            .style("stroke-width", isBundle ? 2.5:2)
            .style("stroke", "var(--highlight-color, #ff99ff)");
          setSelectedItem({ id: currentId, element: this, originalRadius: d.r, data: d.data, isBundle: isBundle, value: d.value, color: d.data.color });
        } else { 
           d3.select(this).select("circle").transition().duration(100)
              .attr("r", d.r)
              .style("stroke-width", isBundle ? 1.5:1)
              .style("stroke", isBundle ? (d.data.color ? d3.color(d.data.color).darker(0.5) : "#777") : d3.color(leafColorScale(d.r)).darker(0.4));
          setSelectedItem(null);
        }
      });

    nodeElements.append("circle")
      .attr("r", d => Math.max(0, d.r)) 
      .attr("fill", d => d.children ? (d.data.color || "rgba(150, 150, 170, 0.15)") : d3.color(leafColorScale(d.r)).copy({opacity: 0.65}))
      .attr("stroke", d => d.children ? (d.data.color ? d3.color(d.data.color).darker(0.5) : "#777") : d3.color(leafColorScale(d.r)).darker(0.4))
      .style("stroke-width", d => d.children ? 1.5 : 1); 
      
    nodeElements.filter(d => d.children && d.r > 10) 
        .append("text")
        .attr("dy", ".0em") 
        .style("text-anchor", "middle")
        .style("font-size", d => Math.max(5, Math.min(9, d.r / 4.5)) + "px") 
        .style("fill", "rgba(255,255,255,0.8)")
        .style("pointer-events", "none")
        .selectAll("tspan")
        .data(d => {
            const name = d.data.name || "Bundle";
            const words = name.split(/\s+/);
            if (d.r < 20 && words.length > 1) return [words[0] + (words.length > 1 ? "…" : "")];
            return words.slice(0,2); 
        })
        .join("tspan")
            .attr("x", 0)
            .attr("dy", (d,i,arr) => i === 0 && arr.length > 1 ? "-0.4em" : (i > 0 ? "1em" : "0.3em"))
            .text(d => d);
      
    const zoom = d3.zoom().scaleExtent([0.2, 15]).on("zoom", (event) => { nodeGroup.attr("transform", event.transform); setTooltip(null); });
    svg.call(zoom);

    svg.on("click", () => { 
      if (selectedItem && selectedItem.element) {
        d3.select(selectedItem.element).select("circle").transition().duration(150)
          .attr("r", selectedItem.originalRadius)
          .style("stroke-width", selectedItem.isBundle ? 1.5 : 1)
          .style("stroke", selectedItem.isBundle ? (selectedItem.color ? d3.color(selectedItem.color).darker(0.5) : "#777") : d3.color(leafColorScale(selectedItem.originalRadius)).darker(0.4));
      }
      setSelectedItem(null);
    });

  }, [data, dimensions.width, dimensions.height, selectedItem, totalDisplayedInMap, totalSupply]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: initialWidth, 
        height: initialHeight, 
        overflow: 'hidden', 
        position: 'relative', 
        borderRadius: 'inherit' 
      }}
    >
      <svg 
        ref={svgRef} 
        width={dimensions.width > 0 ? dimensions.width : "100%"} 
        height={dimensions.height > 0 ? dimensions.height : "100%"}
      ></svg>
      {tooltip && (
        <div style={{
          position: 'fixed', 
          left: `${tooltip.x}px`, top: `${tooltip.y}px`,
          background: 'rgba(15, 5, 30, 0.95)', color: '#f0e6ff',
          padding: '5px 8px', borderRadius: '4px', fontSize: '10px', 
          fontFamily: 'monospace', pointerEvents: 'none',
          transform: 'translate(-50%, -115%)', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          border: '1px solid var(--highlight-color, #ff66ff)',
          zIndex: 10000, whiteSpace: 'nowrap',
        }}>
          {tooltip.content}
        </div>
      )}
       {selectedItem && (
        <div 
          className="absolute bottom-1 left-1 p-1.5 sm:p-2 bg-black bg-opacity-85 backdrop-blur-sm rounded shadow-xl border border-purple-500 text-2xs sm:text-xs text-gray-200 max-h-[25%] sm:max-h-[20%] w-auto max-w-[calc(100%-0.5rem)] sm:max-w-xs overflow-y-auto"
          style={{ zIndex: 5000 }}
          onClick={(e) => e.stopPropagation()} 
        >
          <button 
            onClick={() => {
              if (selectedItem && selectedItem.element) {
                const isBundle = selectedItem.isBundle;
                const originalRadius = selectedItem.originalRadius;
                const leafColorScaleForReset = d3.scaleSequentialSqrt(d3.interpolatePuRd).domain([0, d3.max(allNodesToRender.filter(d => !d.children), d => d.r) || 1]); // Recreate for safety
                const defaultStrokeColor = isBundle ? (selectedItem.color ? d3.color(selectedItem.color).darker(0.5) : "#777") : d3.color(leafColorScaleForReset(originalRadius)).darker(0.4);
                 d3.select(selectedItem.element).select("circle").transition().duration(150)
                    .attr("r", originalRadius)
                    .style("stroke-width", isBundle ? 1.5:1)
                    .style("stroke", defaultStrokeColor );
              }
              setSelectedItem(null);
            }}
            className="absolute top-0.5 right-0.5 text-gray-300 hover:text-white text-base sm:text-lg leading-none p-0.5 z-10"
            aria-label="Close details"
          >&times;</button>
          <p className="font-semibold text-purple-300 mb-0.5 text-xs sm:text-sm">
            {selectedItem.isBundle ? "Bundle Details:" : "Wallet Details:"}
          </p>
          <p className="font-mono break-all text-2xs leading-tight">
            <strong className="text-gray-400">{selectedItem.isBundle ? "Name:" : "Address:"}</strong> 
            {selectedItem.isBundle ? selectedItem.data.name : selectedItem.data.owner}
          </p>
          <p className="text-2xs leading-tight">
            <strong className="text-gray-400">{selectedItem.isBundle ? "Total Value:" : "Balance:"}</strong> 
            {selectedItem.value.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} $IE
          </p>
          {!selectedItem.isBundle && totalDisplayedInMap > 0 && (
            <p className="text-2xs leading-tight">
              <strong className="text-gray-400">% of Top Displayed:</strong> 
              {((selectedItem.value || 0) / totalDisplayedInMap * 100).toFixed(3)}%
            </p>
          )}
          {totalSupply > 0 && (
            <p className="text-2xs leading-tight">
              <strong className="text-gray-400">% of Total Supply:</strong> 
              {((selectedItem.value || 0) / totalSupply * 100).toFixed(3)}%
            </p>
          )}
          {!selectedItem.isBundle && (
            <p className="mt-1">
              <a 
                href={`https://solscan.io/account/${selectedItem.data.owner}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-highlight-color hover:underline text-2xs"
              >
                Solscan
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomBubbleMapViewer;