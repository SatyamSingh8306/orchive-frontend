'use client';

import type { WorkflowNode, Edge } from '@/types/workflow';
import type {
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import NodeCard from '@/components/agent-maker/NodeCard';

export default function WorkflowCanvas({
  canvasRef,
  nodeWidth,
  nodeHeight,
  worldWidth,
  worldHeight,
  nodes,
  edges,
  viewport,
  isPanning,
  connectingFromNodeId,
  connectionCursorWorld,
  onCanvasMouseDown,
  onWheel,
  onDoubleClick,
  onNodeMouseDown,
  onSelectNode,
  onPortMouseDown,
  onDeleteNode,
  onDeleteEdge,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  nodeWidth: number;
  nodeHeight: number;
  worldWidth: number;
  worldHeight: number;
  nodes: WorkflowNode[];
  edges: Edge[];
  viewport: { x: number; y: number; scale: number };
  isPanning: boolean;
  connectingFromNodeId: string | null;
  connectionCursorWorld: { x: number; y: number } | null;
  onCanvasMouseDown: (e: ReactMouseEvent<HTMLDivElement>) => void;
  onWheel: (e: ReactWheelEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  onNodeMouseDown: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onPortMouseDown: (
    e: ReactMouseEvent<HTMLDivElement>,
    nodeId: string,
    side: 'left' | 'right',
  ) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
}) {
  const getPortPosition = (node: WorkflowNode, side: 'left' | 'right') => {
    const x = side === 'left' ? node.x : node.x + nodeWidth;
    const y = node.y + nodeHeight / 2;
    return { x, y };
  };

  const calculateEdgePath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const horizontalDistance = Math.abs(end.x - start.x);
    const verticalDistance = Math.abs(end.y - start.y);
    
    // Control point distance based on the longer dimension
    const controlDistance = Math.max(horizontalDistance * 0.3, verticalDistance * 0.5, 60);
    
    // Create smoother, more organized curves
    if (start.y === end.y) {
      // Horizontal line with slight curve
      const midX = (start.x + end.x) / 2;
      const midY = start.y;
      return `M ${start.x} ${start.y} Q ${midX} ${midY - 20} ${end.x} ${end.y}`;
    } else if (start.x < end.x) {
      // Rightward flow
      const cp1X = start.x + controlDistance;
      const cp1Y = start.y;
      const cp2X = end.x - controlDistance;
      const cp2Y = end.y;
      return `M ${start.x} ${start.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${end.x} ${end.y}`;
    } else {
      // Leftward flow
      const cp1X = start.x - controlDistance;
      const cp1Y = start.y;
      const cp2X = end.x + controlDistance;
      const cp2Y = end.y;
      return `M ${start.x} ${start.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${end.x} ${end.y}`;
    }
  };

  const getArrowPoints = (end: { x: number; y: number }, start: { x: number; y: number }) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 8;
    const arrowAngle = Math.PI / 6;
    
    return [
      `${end.x},${end.y}`,
      `${end.x - arrowLength * Math.cos(angle - arrowAngle)},${end.y - arrowLength * Math.sin(angle - arrowAngle)}`,
      `${end.x - arrowLength * Math.cos(angle + arrowAngle)},${end.y - arrowLength * Math.sin(angle + arrowAngle)}`
    ].join(' ');
  };

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // De-duplicate by id at render time. Old saved workflows (or repeated
  // sidebar drops in older builds) may contain duplicate node ids; this
  // keeps React keys unique without mutating parent state.
  const seenIds = new Set<string>();
  const uniqueNodes = nodes.filter(n => {
    if (seenIds.has(n.id)) return false;
    seenIds.add(n.id);
    return true;
  });

  const preview =
    connectingFromNodeId && connectionCursorWorld
      ? {
          from: connectingFromNodeId,
          toPoint: connectionCursorWorld,
        }
      : null;

  return (
    <div
      ref={canvasRef}
      className="flex-1 relative overflow-hidden bg-[var(--paper)]"
      onMouseDown={onCanvasMouseDown}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(11,11,15,0.18) 1px, transparent 0)',
        backgroundSize: `${26 * viewport.scale}px ${26 * viewport.scale}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
    >
      <div
        className={`absolute left-0 top-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          width: worldWidth,
          height: worldHeight,
        }}
      >
        <svg className="absolute inset-0" style={{ width: worldWidth, height: worldHeight }}>
          {edges.map(edge => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const start = getPortPosition(fromNode, 'right');
            const end = getPortPosition(toNode, 'left');
            const path = calculateEdgePath(start, end);
            const arrowPoints = getArrowPoints(end, start);

            return (
              <g key={edge.id}>
                <path
                  d={path}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={1.5}
                  strokeLinecap="square"
                  className="cursor-pointer hover:stroke-[var(--accent)]"
                  onClick={() => onDeleteEdge && onDeleteEdge(edge.id)}
                />
                <polygon
                  points={arrowPoints}
                  fill="var(--ink)"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {preview && (() => {
            const fromNode = nodeMap.get(preview.from);
            if (!fromNode) return null;

            const start = getPortPosition(fromNode, 'right');
            const end = preview.toPoint;
            const path = calculateEdgePath(start, end);

            return (
              <path
                key="__preview__"
                d={path}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.5}
                strokeLinecap="square"
                strokeDasharray="6 6"
              />
            );
          })()}
        </svg>

        <div className="absolute inset-0" style={{ width: worldWidth, height: worldHeight }}>
          {uniqueNodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              width={nodeWidth}
              height={nodeHeight}
              isConnectingFrom={connectingFromNodeId === node.id}
              onNodeMouseDown={onNodeMouseDown}
              onSelect={onSelectNode}
              onPortMouseDown={onPortMouseDown}
              onDeleteNode={onDeleteNode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
