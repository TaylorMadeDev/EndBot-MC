import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMacros } from '../context/MacrosContext';
import '../styles/tasks.css';

export default function Tasks() {
  const navigate = useNavigate();
  const { macros, deleteMacro } = useMacros();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMacros = macros.filter(macro =>
    macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (macro.description && macro.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = () => {
    navigate('/app/macros');
  };

  const handleEdit = (id) => {
    navigate(`/app/macros?edit=${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this macro?')) {
      deleteMacro(id);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div className="header-content">
          <h2 className="page-title">
            <i className="fas fa-tasks"></i>
            Saved Macros
          </h2>
          <p className="page-subtitle">Manage your automation macros</p>
        </div>
        <button className="btn primary" onClick={handleCreateNew}>
          <i className="fas fa-plus"></i>
          Create New Macro
        </button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search macros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="macro-count">
          {filteredMacros.length} macro{filteredMacros.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredMacros.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-project-diagram"></i>
          </div>
          <h3>No Macros Found</h3>
          <p>
            {searchTerm
              ? 'No macros match your search. Try a different keyword.'
              : 'Get started by creating your first macro!'}
          </p>
          {!searchTerm && (
            <button className="btn primary" onClick={handleCreateNew}>
              <i className="fas fa-plus"></i>
              Create Your First Macro
            </button>
          )}
        </div>
      ) : (
        <div className="macros-grid">
          {filteredMacros.map((macro) => (
            <div key={macro.id} className="macro-card">
              <div className="macro-card-header">
                <div className="macro-icon">
                  <i className="fas fa-cogs"></i>
                </div>
                <div className="macro-info">
                  <h3 className="macro-name">{macro.name}</h3>
                  <p className="macro-description">
                    {macro.description || 'No description provided'}
                  </p>
                </div>
              </div>

              <div className="macro-meta">
                <div className="meta-item">
                  <i className="fas fa-cubes"></i>
                  <span>{macro.blocks.length} blocks</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-clock"></i>
                  <span>{formatDate(macro.updatedAt || macro.createdAt)}</span>
                </div>
              </div>

              <div className="macro-actions">
                <button
                  className="btn ghost icon-btn"
                  onClick={() => handleEdit(macro.id)}
                  title="Edit Macro"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="btn ghost icon-btn danger"
                  onClick={() => handleDelete(macro.id)}
                  title="Delete Macro"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
