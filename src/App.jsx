import React, { useState, useCallback, useRef, useEffect } from 'react';

const BLOCK_WIDTH = 160;
const BLOCK_HEIGHT = 80;

const getRandomPosition = (maxW, maxH) => {
    const x = Math.max(20, Math.floor(Math.random() * (maxW - BLOCK_WIDTH - 40)));
    const y = Math.max(20, Math.floor(Math.random() * (maxH - BLOCK_HEIGHT - 40)));
    return { x, y };
};

const Block = React.memo(({ block, updateBlockPosition, addNewBlock }) => {
    const { id, x, y } = block;
    const dragData = useRef(null);

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        e.preventDefault();

        const offsetX = e.clientX - x;
        const offsetY = e.clientY - y;

        dragData.current = { offsetX, offsetY, blockId: id };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [id, x, y, updateBlockPosition]);

    const handleMouseMove = useCallback((e) => {
        if (!dragData.current) return;

        const newX = e.clientX - dragData.current.offsetX;
        const newY = e.clientY - dragData.current.offsetY;

        updateBlockPosition(dragData.current.blockId, newX, newY);
    }, [updateBlockPosition]);

    const handleMouseUp = useCallback(() => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        dragData.current = null;
    }, [handleMouseMove]);

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    return (
        <div
            id={`block-${id}`}
            className="absolute bg-pink-600 rounded-lg shadow-xl cursor-grab active:cursor-grabbing transform transition-shadow duration-100 ease-in-out hover:shadow-2xl flex flex-col justify-between"
            style={{
                width: BLOCK_WIDTH,
                height: BLOCK_HEIGHT,
                left: x,
                top: y,
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="p-2 text-white font-bold text-lg text-center select-none">
                Node {id}
            </div>
            <div className="flex justify-center items-center p-2 bg-pink-700 rounded-b-lg">
                <button
                    className="w-8 h-8 flex items-center justify-center bg-white text-pink-600 font-extrabold text-xl rounded-full shadow-md hover:bg-pink-100 transition duration-150 transform hover:scale-105 focus:outline-none"
                    onClick={() => addNewBlock(id)}
                    aria-label={`Add child to Node ${id}`}
                >
                    +
                </button>
            </div>
        </div>
    );
});

const App = () => {
    const [blocks, setBlocks] = useState(() => {
        const { x, y } = getRandomPosition(window.innerWidth, window.innerHeight);
        return [{ id: 0, parentId: null, x, y }];
    });
    const [nextId, setNextId] = useState(1);

    const updateBlockPosition = useCallback((id, newX, newY) => {
        setBlocks(currentBlocks => {
            return currentBlocks.map(block =>
                block.id === id ? { ...block, x: newX, y: newY } : block
            );
        });
    }, []);

    const addNewBlock = useCallback((parentId) => {
        setBlocks(currentBlocks => {
            const { x, y } = getRandomPosition(window.innerWidth, window.innerHeight);
            const newBlock = { id: nextId, parentId, x, y };
            return [...currentBlocks, newBlock];
        });
        setNextId(prevId => prevId + 1);
    }, [nextId]);

    const getBlockCenter = useCallback((block) => {
        if (!block) return { cx: 0, cy: 0 };
        return {
            cx: block.x + BLOCK_WIDTH / 2,
            cy: block.y + BLOCK_HEIGHT / 2,
        };
    }, []);

    const lines = blocks
        .filter(block => block.parentId !== null)
        .map(block => {
            const parent = blocks.find(b => b.id === block.parentId);
            if (!parent) return null;

            const childCenter = getBlockCenter(block);
            const parentCenter = getBlockCenter(parent);

            return {
                x1: parentCenter.cx,
                y1: parentCenter.cy,
                x2: childCenter.cx,
                y2: childCenter.cy,
            };
        })
        .filter(line => line !== null);


    return (
        <div className="relative w-screen h-screen overflow-hidden bg-pink-50">
            <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {lines.map((line, index) => (
                    <line
                        key={index}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#713292"
                        strokeWidth="2"
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                    />
                ))}
            </svg>

            {blocks.map(block => (
                <Block
                    key={block.id}
                    block={block}
                    updateBlockPosition={updateBlockPosition}
                    addNewBlock={addNewBlock}
                />
            ))}

            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 p-2 bg-pink-900 text-white text-sm rounded-lg shadow-xl">
                Drag nodes to reposition them and see the lines update in real-time.
            </div>
        </div>
    );
};

export default App;
