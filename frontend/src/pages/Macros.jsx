import React, { useState, useRef, useCallback } from 'react';
import { useMacros } from '../context/MacrosContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/macros.css';

export default function Macros() {
  const { saveMacro, updateMacro, getMacro } = useMacros();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editingMacroId = searchParams.get('edit');
  
  const [blocks, setBlocks] = useState(() => {
    if (editingMacroId) {
      const macro = getMacro(parseInt(editingMacroId));
      return macro ? macro.blocks : [{ id: 0, x: 400, y: 50, color: 'var(--start-color)', text: '🚩 Start', type: 'start', connectedTo: null }];
    }
    return [{ id: 0, x: 400, y: 50, color: 'var(--start-color)', text: '🚩 Start', type: 'start', connectedTo: null }];
  });
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [macroName, setMacroName] = useState(() => {
    if (editingMacroId) {
      const macro = getMacro(parseInt(editingMacroId));
      return macro ? macro.name : '';
    }
    return '';
  });
  const [macroDescription, setMacroDescription] = useState(() => {
    if (editingMacroId) {
      const macro = getMacro(parseInt(editingMacroId));
      return macro ? macro.description : '';
    }
    return '';
  });
  
  const [dragging, setDragging] = useState(null);
  const [previewGap, setPreviewGap] = useState(null);
  const dragStateRef = useRef({ offset: { x: 0, y: 0 }, originalPositions: {}, connectedIds: [], isFromPalette: false });
  const containerRef = useRef(null);
  const nextIdRef = useRef(1);

  const SNAP_DISTANCE = 30;
  const BLOCK_HEIGHT = 60;
  const BLOCK_WIDTH = 220;

  const blockLibrary = [
    { color: '#8b5cf6', text: 'Move', type: 'action', inputs: [{ value: '10' }], suffix: 'steps', category: 'Motion' },
    { color: '#8b5cf6', text: 'Turn', type: 'action', inputs: [{ type: 'dropdown', value: 'right', options: ['right', 'left'] }, { value: '15' }], suffix: 'degrees', category: 'Motion' },
    { color: '#06b6d4', text: 'Mine Block', type: 'action', inputs: [{ type: 'dropdown', value: 'stone', options: ['stone','coal_ore','iron_ore','diamond_ore','log'] }], category: 'Minecraft' },
    { color: '#06b6d4', text: 'Go to XZ', type: 'action', inputs: [{ value: '0' }, { value: '0' }], category: 'Minecraft' },
    { color: '#06b6d4', text: 'Place Block', type: 'action', inputs: [{ value: 'cobblestone' }], category: 'Minecraft' },
    { color: '#06b6d4', text: 'Craft Item', type: 'action', inputs: [{ type: 'dropdown', value: 'torch', options: ['torch','planks','stick','pickaxe'] }], category: 'Minecraft' },
    { color: '#06b6d4', text: 'Attack Target', type: 'action', inputs: [{ type: 'dropdown', value: 'nearest', options: ['nearest','by_name'] }], category: 'Minecraft' },
    { color: '#06b6d4', text: 'Chat Message', type: 'action', inputs: [{ value: 'Hello!' }], category: 'Minecraft' },
    { color: '#06b6d4', text: 'Pathfind to XZ', type: 'action', inputs: [{ value: '0' }, { value: '0' }], category: 'Minecraft' },
    { color: '#06b6d4', text: 'Farm Crop', type: 'action', inputs: [{ type: 'dropdown', value: 'wheat', options: ['wheat','carrot','potato'] }, { value: '5' }], category: 'Minecraft' },
    { color: '#ec4899', text: 'Wait', type: 'action', inputs: [{ value: '1' }], suffix: 'seconds', category: 'Control' },
    { color: '#ec4899', text: 'Repeat', type: 'action', inputs: [{ value: '10' }], suffix: 'times', category: 'Control' },
    { color: '#22c55e', text: 'Set Variable', type: 'action', inputs: [{ value: '0' }], category: 'Variables' },
    { color: '#22c55e', text: 'Change Variable', type: 'action', inputs: [{ value: '1' }], category: 'Variables' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Motion', 'Minecraft', 'Control', 'Variables'];

  const getConnectedBlocks = useCallback((blockId) => {
    const connected = [];
    let currentId = blockId;
    
    while (currentId !== null) {
      const nextBlock = blocks.find(b => b.connectedTo === currentId);
      if (nextBlock) {
        connected.push(nextBlock.id);
        currentId = nextBlock.id;
      } else {
        break;
      }
    }
    
    return connected;
  }, [blocks]);

  const handleMouseDown = (e, block, isFromPalette = false) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }
    
    e.preventDefault();
    
    let blockToDrag = block;
    
    if (isFromPalette) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newBlock = {
        ...block,
        id: nextIdRef.current++,
        x: e.clientX - containerRect.left - 110,
        y: e.clientY - containerRect.top - 30,
        connectedTo: null
      };
      setBlocks(prev => [...prev, newBlock]);
      blockToDrag = newBlock;
    }
    
    const positions = {};
    blocks.forEach(b => {
      positions[b.id] = { x: b.x, y: b.y, connectedTo: b.connectedTo };
    });
    if (isFromPalette) {
      positions[blockToDrag.id] = { x: blockToDrag.x, y: blockToDrag.y, connectedTo: null };
    }
    
    const connectedIds = isFromPalette ? [] : getConnectedBlocks(blockToDrag.id);
    
    dragStateRef.current = {
      offset: {
        x: isFromPalette ? 110 : e.clientX - blockToDrag.x - containerRef.current.getBoundingClientRect().left,
        y: isFromPalette ? 30 : e.clientY - blockToDrag.y - containerRef.current.getBoundingClientRect().top
      },
      originalPositions: positions,
      connectedIds: connectedIds,
      isFromPalette: isFromPalette
    };
    
    setDragging(blockToDrag.id);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragStateRef.current.offset.x;
    const newY = e.clientY - containerRect.top - dragStateRef.current.offset.y;

    const connectedBlockIds = dragStateRef.current.connectedIds;
    const draggedChainHeight = (connectedBlockIds.length + 1) * BLOCK_HEIGHT;
    const originalPositions = dragStateRef.current.originalPositions;

    let insertGap = null;
    
    for (const block of blocks) {
      if (block.id === dragging || connectedBlockIds.includes(block.id)) continue;
      
      const distanceX = Math.abs(block.x - newX);
      const distanceY = Math.abs((block.y + BLOCK_HEIGHT) - newY);
      
      if (distanceX < SNAP_DISTANCE && distanceY < SNAP_DISTANCE) {
        insertGap = { afterBlockId: block.id, height: draggedChainHeight, x: block.x };
        break;
      }
    }
    
    setPreviewGap(insertGap);

    setBlocks(prev => {
      const draggedBlock = prev.find(b => b.id === dragging);
      const deltaX = newX - draggedBlock.x;
      const deltaY = newY - draggedBlock.y;

      return prev.map(block => {
        if (block.id === dragging) {
          return { ...block, x: newX, y: newY };
        } else if (connectedBlockIds.includes(block.id)) {
          return { ...block, x: block.x + deltaX, y: block.y + deltaY };
        }
        
        if (insertGap) {
          if (block.connectedTo === insertGap.afterBlockId) {
            const targetBlock = prev.find(b => b.id === insertGap.afterBlockId);
            const originalPos = originalPositions[block.id];
            
            if (originalPos && originalPos.connectedTo === insertGap.afterBlockId) {
              return { ...block, y: Math.round(targetBlock.y + BLOCK_HEIGHT + insertGap.height) };
            }
          }
        } else {
          const originalPos = originalPositions[block.id];
          if (originalPos && !connectedBlockIds.includes(block.id) && block.id !== dragging) {
            return { ...block, x: Math.round(originalPos.x), y: Math.round(originalPos.y) };
          }
        }
        
        return block;
      });
    });
  }, [dragging, blocks, SNAP_DISTANCE, BLOCK_HEIGHT]);

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;

    const connectedBlockIds = dragStateRef.current.connectedIds;
    const originalPositions = dragStateRef.current.originalPositions;
    const isFromPalette = dragStateRef.current.isFromPalette;

    setBlocks(prev => {
      const draggedBlock = prev.find(b => b.id === dragging);
      let snapped = false;
      let snapToBlockId = null;

      for (const block of prev) {
        if (block.id === dragging || connectedBlockIds.includes(block.id)) continue;

        const distanceX = Math.abs(block.x - draggedBlock.x);
        const distanceY = Math.abs((block.y + BLOCK_HEIGHT) - draggedBlock.y);

        if (distanceX < SNAP_DISTANCE && distanceY < SNAP_DISTANCE) {
          snapped = true;
          snapToBlockId = block.id;
          break;
        }
      }

      if (snapped && snapToBlockId !== null) {
        const snapToBlock = prev.find(b => b.id === snapToBlockId);
        const previouslyConnected = prev.find(b => b.connectedTo === snapToBlockId);
        
        return prev.map(block => {
          if (block.id === dragging) {
            return {
              ...block,
              x: Math.round(snapToBlock.x),
              y: Math.round(snapToBlock.y + BLOCK_HEIGHT),
              connectedTo: snapToBlockId
            };
          } else if (connectedBlockIds.includes(block.id)) {
            const draggedBlockIndex = connectedBlockIds.indexOf(block.id);
            return {
              ...block,
              x: Math.round(snapToBlock.x),
              y: Math.round(snapToBlock.y + BLOCK_HEIGHT + (draggedBlockIndex + 1) * BLOCK_HEIGHT)
            };
          }
          
          if (previouslyConnected && block.id === previouslyConnected.id) {
            const lastInChain = connectedBlockIds.length > 0 
              ? prev.find(b => b.id === connectedBlockIds[connectedBlockIds.length - 1])
              : prev.find(b => b.id === dragging);
            
            return {
              ...block,
              y: Math.round(lastInChain.y + BLOCK_HEIGHT),
              connectedTo: connectedBlockIds.length > 0 
                ? connectedBlockIds[connectedBlockIds.length - 1] 
                : dragging
            };
          }
          
          return block;
        });
      } else {
        if (isFromPalette) {
          return prev;
        }
        return prev.map(block => (
          block.id === dragging
            ? { ...block, connectedTo: null }
            : block
        ));
      }
    });

    setDragging(null);
    setPreviewGap(null);
  }, [dragging, SNAP_DISTANCE, BLOCK_HEIGHT]);

  const handleDeleteChain = (headId) => {
    setBlocks(prev => {
      const chainIds = [];
      let currentId = headId;
      while (currentId !== null) {
        chainIds.push(currentId);
        const nextBlock = prev.find(b => b.connectedTo === currentId);
        currentId = nextBlock ? nextBlock.id : null;
      }
      const idsToRemove = new Set(chainIds);
      return prev.filter(b => !idsToRemove.has(b.id));
    });
  };

  const handleInputChange = (blockId, inputIndex, value) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        const newInputs = [...block.inputs];
        newInputs[inputIndex] = { ...newInputs[inputIndex], value };
        return { ...block, inputs: newInputs };
      }
      return block;
    }));
  };

  const saveWorkspace = () => {
    setShowSaveModal(true);
  };

  const handleSaveMacro = () => {
    if (!macroName.trim()) {
      alert('Please enter a macro name');
      return;
    }
    
    if (editingMacroId) {
      updateMacro(parseInt(editingMacroId), macroName, macroDescription, blocks);
    } else {
      saveMacro(macroName, macroDescription, blocks);
    }
    
    setShowSaveModal(false);
    navigate('/app/tasks');
  };

  const loadWorkspace = () => {
    navigate('/app/tasks');
  };

  const clearWorkspace = () => {
    setBlocks(prev => prev.filter(b => b.type === 'start'));
  };

  const filteredBlocks = selectedCategory === 'All' 
    ? blockLibrary 
    : blockLibrary.filter(block => block.category === selectedCategory);

  return (
    <div 
      className="macros-page"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-project-diagram"></i> Macro Builder
            {editingMacroId && <span className="editing-badge">Editing: {macroName}</span>}
          </h1>
          <p className="page-subtitle">Build visual macros by dragging and connecting blocks</p>
        </div>
        <div className="page-actions">
          <button className="btn ghost" onClick={loadWorkspace}>
            <i className="fas fa-arrow-left"></i>
            Back to Tasks
          </button>
          <button className="btn ghost" onClick={clearWorkspace}>
            <i className="fas fa-trash"></i>
            Clear
          </button>
          <button className="btn primary" onClick={saveWorkspace}>
            <i className="fas fa-save"></i>
            {editingMacroId ? 'Update Macro' : 'Save Macro'}
          </button>
        </div>
      </div>

      <div className="macro-container">
        {/* Block Palette */}
        <div className="block-palette">
          <h3 className="palette-title">
            <i className="fas fa-cubes"></i> Block Library
          </h3>
          
          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="palette-blocks">
            {filteredBlocks.map((blockTemplate, index) => (
              <div
                key={index}
                className="palette-block"
                style={{ backgroundColor: blockTemplate.color }}
                onMouseDown={(e) => handleMouseDown(e, blockTemplate, true)}
              >
                <span className="block-text">{blockTemplate.text}</span>
                {blockTemplate.inputs && blockTemplate.inputs.map((input, idx) => (
                  <React.Fragment key={idx}>
                    <div className="block-input-preview">
                      {input.type === 'dropdown' ? input.value : input.value}
                    </div>
                  </React.Fragment>
                ))}
                {blockTemplate.suffix && <span className="block-suffix">{blockTemplate.suffix}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="macro-canvas" ref={containerRef}>
          <div className="canvas-grid"></div>
          
          {previewGap && (
            <div
              className="preview-gap"
              style={{
                left: `${blocks.find(b => b.id === previewGap.afterBlockId)?.x}px`,
                top: `${blocks.find(b => b.id === previewGap.afterBlockId)?.y + BLOCK_HEIGHT}px`,
                height: `${previewGap.height}px`,
                width: `${BLOCK_WIDTH}px`,
              }}
            />
          )}

          {blocks.map(block => (
            <div
              key={block.id}
              className={`canvas-block ${block.type === 'start' ? 'start-block' : ''} ${dragging === block.id ? 'dragging' : ''}`}
              style={{
                left: `${block.x}px`,
                top: `${block.y}px`,
                backgroundColor: block.color,
                width: `${BLOCK_WIDTH}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, block, false)}
            >
              {block.connectedTo === null && block.type !== 'start' && (
                <button
                  className="block-delete"
                  onClick={(ev) => { ev.stopPropagation(); handleDeleteChain(block.id); }}
                  title="Delete chain"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              
              <div className="block-content">
                <span className="block-text">{block.text}</span>
                {block.inputs && block.inputs.map((input, index) => (
                  <React.Fragment key={index}>
                    {input.type === 'dropdown' ? (
                      <select
                        className="block-select"
                        value={input.value}
                        onChange={(e) => handleInputChange(block.id, index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {Array.isArray(input.options) && input.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="block-input"
                        value={input.value}
                        onChange={(e) => handleInputChange(block.id, index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    )}
                  </React.Fragment>
                ))}
                {block.suffix && <span className="block-suffix">{block.suffix}</span>}
              </div>
              
              {block.connectedTo !== null && (
                <div className="block-connector">
                  <i className="fas fa-arrow-up"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMacroId ? 'Update Macro' : 'Save Macro'}</h3>
              <button className="modal-close" onClick={() => setShowSaveModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Macro Name</label>
                <input
                  type="text"
                  placeholder="e.g., Auto Mining"
                  value={macroName}
                  onChange={(e) => setMacroName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  placeholder="Describe what this macro does..."
                  value={macroDescription}
                  onChange={(e) => setMacroDescription(e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleSaveMacro}>
                <i className="fas fa-save"></i>
                {editingMacroId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
