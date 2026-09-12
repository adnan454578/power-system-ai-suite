import React, { useState } from 'react';
import { Bot, User, Copy, Check, Volume2, FileText, Image as ImageIcon } from 'lucide-react';
import InteractiveToolWidget from './InteractiveToolWidget';

export default function ChatMessage({ message, onTriggerGridEvent, onNavigateTab }) {
  const isBot = message.sender === 'bot';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = (message.text || '').replace(/[*#`$•_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatText = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    // Table parser state
    let inTable = false;
    let tableRows = [];
    const elements = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const dataRows = tableRows.slice(2); // row 1 is separator :---
        elements.push(
          <div key={`table-${elements.length}`} style={{ overflowX: 'auto', margin: '10px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: '#FFFFFF', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border-subtle)' }}>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable();
      }

      if (line.startsWith('### ')) {
        elements.push(<h4 key={idx} style={{ margin: '12px 0 6px', color: 'var(--accent-forest)', fontSize: '0.95rem' }}>{line.replace('### ', '')}</h4>);
      } else if (line.startsWith('## ')) {
        elements.push(<h3 key={idx} style={{ margin: '14px 0 6px', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{line.replace('## ', '')}</h3>);
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        const itemText = line.substring(2);
        elements.push(
          <div key={idx} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '4px' }}>
            <span style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>•</span>
            <div>{renderBoldAndCode(itemText)}</div>
          </div>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={idx} style={{ margin: '8px 0', padding: '6px 12px', borderLeft: '3px solid var(--accent-emerald)', background: '#F8FAFC', borderRadius: '4px', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {renderBoldAndCode(line.substring(2))}
          </blockquote>
        );
      } else if (!trimmed) {
        elements.push(<div key={idx} style={{ height: '8px' }} />);
      } else {
        elements.push(<p key={idx} style={{ margin: '3px 0' }}>{renderBoldAndCode(line)}</p>);
      }
    });

    if (inTable) {
      flushTable();
    }

    return elements;
  };

  const renderBoldAndCode = (str) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`|\$\$.*?\$\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="mono" style={{ background: '#ECFDF5', color: 'var(--accent-forest)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em', border: '1px solid #A7F3D0', fontWeight: 600 }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return (
          <div key={i} className="mono" style={{ margin: '6px 0', padding: '6px 10px', background: '#F8FAFC', borderRadius: '6px', color: 'var(--accent-forest)', fontSize: '0.85rem', borderLeft: '3px solid var(--accent-emerald)', border: '1px solid var(--border-subtle)' }}>
            {part.slice(2, -2)}
          </div>
        );
      }
      return part;
    });
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      marginBottom: '16px',
      flexDirection: isBot ? 'row' : 'row-reverse'
    }}>
      {/* Avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: isBot ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#F1F5F9',
        border: isBot ? 'none' : '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: isBot ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
      }}>
        {isBot ? <Bot size={20} color="#FFFFFF" /> : <User size={20} color="#475569" />}
      </div>

      {/* Message Content Container */}
      <div style={{ maxWidth: '85%', minWidth: '260px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
          justifyContent: isBot ? 'flex-start' : 'flex-end'
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isBot ? 'var(--accent-forest)' : 'var(--text-secondary)' }}>
            {isBot ? 'GridMind AI' : 'Power Engineer'}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {message.timestamp}
          </span>
        </div>

        <div style={{
          position: 'relative',
          padding: '16px 20px',
          borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          background: isBot ? '#FFFFFF' : '#ECFDF5',
          border: isBot ? '1px solid var(--border-subtle)' : '1px solid #A7F3D0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          lineHeight: '1.6'
        }}>
          {/* File Attachment Card (with photo preview if image) */}
          {message.filePreview && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: '#F8FAFC',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {message.filePreview.previewUrl ? <ImageIcon size={15} color="var(--accent-forest)" /> : <FileText size={15} color="var(--accent-forest)" />}
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {message.filePreview.name}
                  </span>
                </div>
                <span className="badge badge-stable" style={{ fontSize: '0.62rem' }}>
                  {message.filePreview.type}
                </span>
              </div>

              {/* Visual Thumbnail for Photos/Images */}
              {message.filePreview.previewUrl && (
                <div style={{ marginTop: '4px', maxHeight: '180px', overflow: 'hidden', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <img
                    src={message.filePreview.previewUrl}
                    alt={message.filePreview.name}
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', background: '#0F172A' }}
                  />
                </div>
              )}
            </div>
          )}

          {formatText(message.text)}

          {message.widget && (
            <InteractiveToolWidget 
              widget={message.widget} 
              onTriggerGridEvent={onTriggerGridEvent}
              onNavigateTab={onNavigateTab}
            />
          )}

          {/* ChatGPT-style Action Toolbar (Copy / Speak) */}
          {isBot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={handleCopy}
                style={{ background: 'transparent', border: 'none', color: copied ? 'var(--accent-forest)' : 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                title="Copy response"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleSpeak}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                title="Read aloud"
              >
                <Volume2 size={13} />
                <span>Listen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
