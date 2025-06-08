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
  totalSupply = 0,
  tokenDecimals = 9 // Default or pass actual decimals
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
        if (w <= 0) w = 300; 
        if (h <= 0) h = 300; 
        setDimensions({ width: w, height: h });
      }
    };
    const observer = new ResizeObserver(updateDimensions);
    let currentRefVal = containerRef.current;
    if (currentRefVal) { observer.observe(currentRefVal); updateDimensions(); }
    return () => { if (currentRefVal) observer.unobserve(currentRefVal); observer.disconnect(); };
  }, []);

  const totalDisplayedInMap = useMemo(() => {
    let sum = 0;
    const sumLeaves = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach(node => {
        if (node && node.children) sumLeaves(node.children);
        else if (node) sum += node.value || 0; 
      });
    };
    if (Array.isArray(data)) sumLeaves(data);
    return sum;
  }, [data]);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0 || dimensions.width <= 10 || dimensions.height <= 10) {
      if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)   
      .attr("height", dimensions.height) 
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .style("display", "block").style("cursor", "grab")
      .style("background-color", "rgba(10, 5, 20, 0.45)") 
      .style("border-radius", "inherit") 
      .style("overflow", "hidden"); 

    svg.selectAll("*").remove();


    if (validChildren.length === 0) {
      svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "12px")
        .text("No valid data to display in map.");
      return;
    }
    
    const rootNode = d3.hierarchy({ name: "root", children: validChildren })
      .sum(d => d.value) 
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const effectiveWidth = dimensions.width;
    const legendHeight = 30;
    const chartHeight = dimensions.height - legendHeight - 5;

    const edgePadding = Math.max(2, Math.min(8, effectiveWidth * 0.02)); 
    const interBubblePadding = dNode => dNode.children ? 
                                Math.max(3, effectiveWidth * 0.01) : 
                                Math.max(1, effectiveWidth * 0.005);

    const packLayout = d3.pack()
      .size([effectiveWidth - (edgePadding * 2), chartHeight - (edgePadding * 2)])
      .padding(interBubblePadding);

    const packedRoot = packLayout(rootNode);
    if (!packedRoot || typeof packedRoot.descendants !== 'function') return;
    const allNodesToRender = packedRoot.descendants().slice(1); 

    if (allNodesToRender.length === 0) {
      svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "12px")
        .text("Could not generate map layout from data.");
      return;
    }
    
    const leafColorScale = d3.scaleSequentialLog(d3.interpolatePurples)
        .domain([
            d3.min(allNodesToRender.filter(d => !d.children), d => d.value) || 0.0001, 
            d3.max(allNodesToRender.filter(d => !d.children), d => d.value) || 1
        ]);
    
    const nodeGroup = svg.append("g").attr("transform", `translate(${edgePadding},${edgePadding})`);

    const nodeElements = nodeGroup.selectAll("g.node").data(allNodesToRender).join("g")
      .attr("class", d => d.children ? "node bundle-node" : "node leaf-node")
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        if (!d || !d.data) return; 
        const isBundle = !!d.children;
        const currentId = d.data.owner || d.data.name;
        if (!selectedItem || selectedItem.id !== currentId) {
          d3.select(this).select("circle").transition().duration(100)
            .attr("r", (d.r || 0) * (isBundle ? 1.02 : 1.05)) 
            .style("stroke-width", isBundle ? 2 : 1.5) 
            .style("stroke", "var(--highlight-color, #ff99ff)");
        }
        const [svgX, svgY] = d3.pointer(event, svgRef.current.closest('svg'));
        const name = d.data.name || d.data.owner;
        const balance = d.value || 0; 
        setTooltip({ 
            x: svgX, y: svgY - 10, 
            content: `${isBundle ? name + ' (Bundle)' : shortenAddress(name) + ':'} ${balance.toLocaleString(undefined, {minimumFractionDigits:3, maximumFractionDigits:3})} $IE` 
        });
      })
      .on("mouseout", function(event, d) {
         if (!d || !d.data) return; 
         const isBundle = !!d.children;
         const currentId = d.data.owner || d.data.name;
         if (!selectedItem || selectedItem.id !== currentId) {
          d3.select(this).select("circle").transition().duration(100)
            .attr("r", d.r || 0)
            .style("stroke-width", isBundle ? 1.5 : 1)
            .style("stroke", isBundle ? (d.data.color ? d3.color(d.data.color).darker(0.5) : "#777") : d3.color(leafColorScale(d.value || 0)).darker(0.4) );
        }
        setTooltip(null);
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        if (!d || !d.data) return; 
        const currentId = d.data.owner || d.data.name;
        const isBundle = !!d.children;

        // Find rank if it's a leaf node
        let rank;
        if(!isBundle && d.data.owner && Array.isArray(data)) {
            const flatLeaves = [];
            const extractLeaves = (nodes) => {
                nodes.forEach(node => {
                    if (node.children) extractLeaves(node.children);
                    else flatLeaves.push(node);
                });
            };
            extractLeaves(data);
            flatLeaves.sort((a,b) => (b.value || 0) - (a.value || 0));
            const rankedIndex = flatLeaves.findIndex(leaf => leaf.owner === d.data.owner);
            if (rankedIndex !== -1) rank = rankedIndex + 1;
        }
        
        if (selectedItem && selectedItem.element && selectedItem.id !== currentId) {
            d3.select(selectedItem.element).select("circle").transition().duration(100)
              .attr("r", selectedItem.originalRadius)
              .style("stroke-width", selectedItem.isBundle ? 1.5 : 1)
              .style("stroke", selectedItem.isBundle ? (selectedItem.color ? d3.color(selectedItem.color).darker(0.5) : "#777") : d3.color(leafColorScale(selectedItem.value)).darker(0.4));
        }
        if (!selectedItem || selectedItem.id !== currentId) {
            d3.select(this).select("circle").transition().duration(100)
              .attr("r", (d.r || 0) * (isBundle ? 1.02 : 1.05))
              .style("stroke-width", isBundle ? 2.5 : 2)
              .style("stroke", "var(--highlight-color, #ff99ff)");
            setSelectedItem({ 
                id: currentId, element: this, originalRadius: d.r || 0, 
                data: d.data, isBundle: isBundle, value: d.value || 0, color: d.data.color,
                rank // Add rank to selected item
            });
        } else {
            d3.select(this).select("circle").transition().duration(100)
              .attr("r", d.r || 0)
              .style("stroke-width", isBundle ? 1.5 : 1)
              .style("stroke", isBundle ? (d.data.color ? d3.color(d.data.color).darker(0.5) : "#777") : d3.color(leafColorScale(d.value || 0)).darker(0.4));
            setSelectedItem(null);
        }
      });

    nodeElements.append("circle")
      .attr("r", d => Math.max(0, d.r || 0)) 
      .attr("fill", d => d.children ? (d.data.color || "rgba(130, 140, 160, 0.2)") : d3.color(leafColorScale(d.value || 0)).copy({opacity: 0.7}))
      .attr("stroke", d => d.children ? (d.data.color ? d3.color(d.data.color).darker(0.5) : "#777") : d3.color(leafColorScale(d.value || 0)).darker(0.4))
      .style("stroke-width", d => d.children ? 1.5 : 1); 
      
    nodeElements.filter(d => d.children && d.r > 12) 
        .append("text")
        .attr("dy", ".0em")
        .style("text-anchor", "middle")
        .style("font-size", d => Math.max(5, Math.min(9, (d.r || 0) / 4.5)) + "px")
        .style("fill", "rgba(255,255,255,0.75)")
        .style("pointer-events", "none")
        .selectAll("tspan")
        .data(d => {
            const name = d.data.name || "Bundle";
            const words = name.split(/\s+/);
            if ((d.r || 0) < 20 && words.length > 1) return [words[0] + (words.length > 1 ? "…" : "")];
            return words.slice(0,2); 
        })
        .join("tspan")
            .attr("x", 0)
            .attr("dy", (textData,i,arr) => i === 0 && arr.length > 1 ? "-0.4em" : (i > 0 ? "1em" : "0.35em"))
            .text(textData => textData);
      
    const zoom = d3.zoom().scaleExtent([0.2, 15]).on("zoom", (event) => { nodeGroup.attr("transform", event.transform); setTooltip(null); });
    svg.call(zoom);
    svg.on("click", () => { 
      if (selectedItem && selectedItem.element) {
        d3.select(selectedItem.element).select("circle").transition().duration(150)
          .attr("r", selectedItem.originalRadius || 0)
          .style("stroke-width", selectedItem.isBundle ? 1.5 : 1)
          .style("stroke", selectedItem.isBundle ? (selectedItem.color ? d3.color(selectedItem.color).darker(0.5) : "#777") : d3.color(leafColorScale(selectedItem.value)).darker(0.4));
      }
      setSelectedItem(null);
    });

    // Legend
    const legendY = dimensions.height - edgePadding - (legendHeight / 2);
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${edgePadding + 10}, ${legendY})`);

    legend.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).style("fill", "rgba(130, 140, 160, 0.2)");
    legend.append("text").attr("x", 10).attr("y", 0).text("Defined Bundle").style("font-size", "9px").attr("alignment-baseline","middle").style("fill", "#ccc");
    
    legend.append("circle").attr("cx", 100).attr("cy", 0).attr("r", 5).style("fill", d3.color(leafColorScale( (d3.max(allNodesToRender.filter(d => !d.children), d => d.value) || 1) * 0.75 )).copy({opacity:0.7}) );
    legend.append("text").attr("x", 110).attr("y", 0).text("Large Wallet").style("font-size", "9px").attr("alignment-baseline","middle").style("fill", "#ccc");

    legend.append("circle").attr("cx", 190).attr("cy", 0).attr("r", 3).style("fill", d3.color(leafColorScale( (d3.max(allNodesToRender.filter(d => !d.children), d => d.value) || 1) * 0.25 )).copy({opacity:0.7}) );
    legend.append("text").attr("x", 200).attr("y", 0).text("Smaller Wallet (Size ~ Balance)").style("font-size", "9px").attr("alignment-baseline","middle").style("fill", "#ccc");

  }, [data, dimensions.width, dimensions.height, selectedItem, totalDisplayedInMap, totalSupply]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: initialWidth, height: initialHeight, overflow: 'hidden', position: 'relative', borderRadius: 'inherit' }}
      className="custom-bubble-map-viewer-root" 
    >
      <svg ref={svgRef} width={dimensions.width > 0 ? dimensions.width : "100%"} height={dimensions.height > 0 ? dimensions.height : "100%"}></svg>
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          background: 'rgba(15, 5, 30, 0.95)',
          color: '#f0e6ff',
          padding: '5px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          transform: 'translate(-50%, -115%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          border: '1px solid var(--highlight-color, #ff66ff)',
          zIndex: 10000,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.content}
        </div>
      )}
      {selectedItem && selectedItem.data && (
        <div 
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[calc(100%-1rem)] max-w-xs sm:max-w-sm md:max-w-md p-2 xxs:p-3 bg-slate-950 bg-opacity-90 backdrop-blur-md rounded-lg shadow-2xl border border-purple-500 text-gray-100 max-h-[40%] sm:max-h-[35%] overflow-y-auto text-xs"
          style={{ zIndex: 5000 }}
          onClick={(e) => e.stopPropagation()} 
        >
          <button 
            onClick={() => { 
              if (selectedItem.element) {
                const isBundle = selectedItem.isBundle;
                const originalRadius = selectedItem.originalRadius || 0;
                const leafColorScaleForReset = d3.scaleSequentialSqrt(d3.interpolatePuRd).domain([0,1]);
                const strokeColor = isBundle ? (selectedItem.color ? d3.color(selectedItem.color).darker(0.5) : "#777") : d3.color(leafColorScaleForReset(0.5)).darker(0.4);
                 d3.select(selectedItem.element).select("circle").transition().duration(150)
                    .attr("r", originalRadius)
                    .style("stroke-width", isBundle ? 1.5:1)
                    .style("stroke", strokeColor );
              }
              setSelectedItem(null);
            }}
            className="absolute top-1 right-1 text-gray-400 hover:text-white text-2xl leading-none p-0.5 z-10"
            aria-label="Close details"
          >&times;</button>
          <h4 className="font-bold text-purple-300 mb-1.5 text-sm border-b border-purple-700 pb-1.5">
            {selectedItem.isBundle ? "Bundle Details" : "Wallet Details"}
          </h4>
          <div className="space-y-1">
            <p className="font-mono break-all">
              <span className="text-gray-400 font-sans">{selectedItem.isBundle ? "Name: " : "Address: "}</span> 
              {selectedItem.isBundle ? selectedItem.data.name : selectedItem.data.owner}
            </p>
            <p>
              <span className="text-gray-400">{selectedItem.isBundle ? "Total Value: " : "Balance: "}</span> 
              {(selectedItem.value || 0).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} $IE
            </p>
            {!selectedItem.isBundle && selectedItem.rank !== undefined && (
                <p><span className="text-gray-400">Rank in Top 300:</span> {selectedItem.rank}</p>
            )}
            {totalDisplayedInMap > 0 && (
              <p>
                <span className="text-gray-400">{selectedItem.isBundle ? "% of Displayed (Bundle):" : "% of Displayed:"}</span> 
                {((selectedItem.value || 0) / totalDisplayedInMap * 100).toFixed(3)}%
              </p>
            )}
            {totalSupply > 0 && (
              <p>
                <span className="text-gray-400">% of Total Supply:</span> 
                {((selectedItem.value || 0) / totalSupply * 100).toFixed(3)}%
              </p>
            )}
            {selectedItem.isBundle && selectedItem.data.children && (
                 <p><span className="text-gray-400">Wallets in Bundle:</span> {selectedItem.data.children.length}</p>
            )}
            {!selectedItem.isBundle && selectedItem.data.owner && (
              <p className="pt-1">
                <a href={`https://solscan.io/account/${selectedItem.data.owner}`} target="_blank" rel="noopener noreferrer"
                  className="text-highlight-color hover:underline"> View on Solscan </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomBubbleMapViewer;