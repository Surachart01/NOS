"use client";
import React, { useState, useEffect, useCallback } from "react";

/* --- Types --- */
interface SlideData {
  id: string; type: string; title: string; tag: string; speakerNotes?: string;
  subtitle?: string; body?: string;
  description?: string;
  diagramType?: string;
  image?: string;
  items?: string[];
  cols?: { icon: string; title: string; items: string[] }[];
  rows?: { item: string; detail: string; score: string }[];
  duration?: string;
  objectives?: string[];
  steps?: string[];
  csvPath?: string;
  question?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}
interface WeekData {
  week: string; title: string; topic: string; description: string;
  learningObjectives: string[];
  slides: SlideData[];
}
interface SessionMeta { id: string; displayNum: string; title: string; topic: string; disabled?: boolean; }
interface WeekGroup { weekLabel: string; sessions: SessionMeta[]; }

/* --- SVG Icons --- */
const MenuIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const ChevLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>;
const ChevRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,6 15,12 9,18" /></svg>;
const MaxIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>;
const MinIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6m10-10h-6V4m0 6l7-7M3 21l7-7" /></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const NoteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>;

/* --- Slide Renderers --- */
function CoverSlide({ s }: { s: SlideData }) {
  return (
    <div className="slide slide-cover">
      <div style={{ position: "relative", zIndex: 1 }}>
        <span className="cover-tag">{s.tag}</span>
        <h1>{s.title}<br /><span>{s.subtitle}</span></h1>
        {s.body && <p>{s.body}</p>}
      </div>
    </div>
  );
}

function renderFormattedText(text: string) {
  if (!text) return "";
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1);
      return (
        <code
          key={index}
          style={{
            color: "#0284c7",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', Courier, monospace",
            fontSize: "0.9em",
            fontWeight: "bold",
            display: "inline",
            wordBreak: "break-word"
          }}
        >
          {code}
        </code>
      );
    }
    return part;
  });
}

function ContentSlide({ s }: { s: SlideData }) {
  // Detect if a line is a terminal/command line
  const isCmd = (line: string) => {
    const t = line.trim();
    return (
      t.startsWith('student@') ||
      t.startsWith('$ ') || t === '$' ||
      t.startsWith('# ') || t === '#' ||
      t.startsWith('MariaDB>') ||
      t.startsWith('MariaDB [(') ||
      t.startsWith('node@') ||
      /^\s{1,}(MariaDB|mysql|node|npm)\b/.test(line) ||
      /^\s{2,}[a-z$#]/.test(line)   // indented lines inside a command block
    );
  };

  // Group items: consecutive cmd lines → one terminal block
  type Group = { type: 'text'; text: string } | { type: 'cmd'; lines: string[] };
  const groups: Group[] = [];
  s.items?.forEach((item) => {
    if (isCmd(item)) {
      const last = groups[groups.length - 1];
      if (last && last.type === 'cmd') {
        last.lines.push(item);
      } else {
        groups.push({ type: 'cmd', lines: [item] });
      }
    } else {
      groups.push({ type: 'text', text: item });
    }
  });

  // Colour SQL & shell keywords inside a command line
  const colourCmd = (line: string) => {
    const sqlKw = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|SHOW|USE|GRANT|FLUSH|TABLE|DATABASE|DATABASES|FROM|WHERE|INTO|VALUES|PRIMARY|KEY|AUTO_INCREMENT|VARCHAR|INT|ALL|PRIVILEGES|ON|TO|BY|IDENTIFIED)\b/g;
    const mariaPrompt = /^(MariaDB\s*\[.*?\]>|MariaDB>|mysql>)\s*/;
    const shellPrompt = /^(student@[^\$]*\$|#|\$)\s*/;
    const trimmed = line.trim();

    if (mariaPrompt.test(trimmed)) {
      const match = trimmed.match(mariaPrompt)!;
      const prompt = match[0];
      const rest = trimmed.slice(prompt.length);
      const coloured = rest.replace(sqlKw, '<span style="color:#ff7b72;font-weight:bold">$1</span>');
      return (
        <span>
          <span style={{ color: '#8b949e' }}>{prompt}</span>
          <span dangerouslySetInnerHTML={{ __html: coloured }} />
        </span>
      );
    }
    if (shellPrompt.test(trimmed)) {
      const match = trimmed.match(shellPrompt)!;
      const prompt = match[0];
      const rest = trimmed.slice(prompt.length);
      return (
        <span>
          <span style={{ color: '#79c0ff' }}>{prompt}</span>
          <span style={{ color: '#7ee787' }}>{rest}</span>
        </span>
      );
    }
    // indented continuation line
    return <span style={{ color: '#e6edf3', paddingLeft: '1.5em' }}>{trimmed}</span>;
  };

  return (
    <div className="slide slide-content">
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>
      {s.body && <p style={{ fontSize: 'clamp(20px,2.5vw,32px)', color: 'var(--text-secondary)', marginBottom: 20 }}>{s.body}</p>}
      <div style={{ display: 'flex', gap: '30px', flex: 1 }}>
        <div style={{ flex: s.image ? 1 : 'auto', width: '100%' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groups.map((g, gi) => {
              if (g.type === 'text') {
                const isSubItem = g.text.trim().startsWith('-') || g.text.trim().startsWith('✅') || g.text.trim().startsWith('⚠') || g.text.trim().startsWith('📌');
                return (
                  <li key={gi} style={{
                    fontSize: isSubItem ? '90%' : undefined,
                    paddingLeft: isSubItem ? '16px' : undefined,
                    color: isSubItem ? 'var(--text-secondary)' : 'var(--text-primary)',
                    lineHeight: 1.5
                  }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {renderFormattedText(g.text)}
                    </span>
                  </li>
                );
              }
              // Terminal block
              return (
                <li key={gi} className="terminal-prompt-box" style={{ listStyleType: 'none', paddingLeft: 0, width: '100%' }}>
                  {/* Terminal titlebar */}
                  <div style={{ background: '#161b22', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #30363d' }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
                    <span style={{ fontSize: '11px', color: '#8b949e', marginLeft: '8px', fontFamily: 'monospace' }}>
                      {g.lines[0].trim().startsWith('MariaDB') ? 'MariaDB Monitor' : 'Terminal'}
                    </span>
                  </div>
                  {/* Command lines */}
                  <div style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: '13px', lineHeight: '1.9', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {g.lines.map((line, li) => (
                      <div key={li}>{colourCmd(line)}</div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {s.image && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={s.image} alt="" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', objectFit: 'contain' }} />
          </div>
        )}
      </div>
    </div>
  );
}


function TwoColSlide({ s }: { s: SlideData }) {
  return (
    <div className="slide slide-content slide-two-col">
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>
      <div className="two-col-grid">
        {s.cols?.map((col, i) => (
          <div className="col-box" key={i}>
            <h3>{col.icon} {col.title}</h3>
            <ul>{col.items.map((item, j) => <li key={j}><span style={{ flex: 1, minWidth: 0 }}>{renderFormattedText(item)}</span></li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   NGINX CONFIG SLIDE — full config "what to type" view
   ============================================================ */
function NginxConfigSlide({ s }: { s: SlideData }) {
  const [activeLine, setActiveLine] = useState<number | null>(null);

  type ConfigLine = {
    line: string;
    type: 'block' | 'directive' | 'key' | 'blank';
    label?: string;
    color?: string;
    icon?: string;
  };

  const configLines: ConfigLine[] = [
    { line: 'server {', type: 'block' },
    { line: '    listen 80;', type: 'directive', icon: '🔌', color: '#60a5fa', label: 'รับ Request บนพอร์ต 80 (HTTP มาตรฐาน)' },
    { line: '    server_name _;', type: 'directive', icon: '🏷️', color: '#34d399', label: 'รับทุก IP และทุกโดเมน (_ = wildcard)' },
    { line: '', type: 'blank' },
    { line: '    location / {', type: 'block', icon: '📍', color: '#f59e0b', label: 'กฎสำหรับ URL ทุกรูปแบบ (เริ่มด้วย /)' },
    { line: '        proxy_pass http://127.0.0.1:5173;', type: 'key', icon: '🚀', color: '#f87171', label: '⭐ ส่งต่อ Request ไปยัง Vite ที่พอร์ต 5173' },
    { line: '        proxy_http_version 1.1;', type: 'directive', icon: '📡', color: '#818cf8', label: 'ใช้ HTTP/1.1 รองรับ WebSocket (Vite HMR)' },
    { line: '        proxy_set_header Upgrade $http_upgrade;', type: 'directive', icon: '🔄', color: '#94a3b8', label: 'ส่ง header สำหรับ WebSocket Upgrade' },
    { line: "        proxy_set_header Connection 'upgrade';", type: 'directive', icon: '🔄', color: '#94a3b8', label: 'ระบุว่าเป็นการเชื่อมต่อแบบ Upgrade' },
    { line: '        proxy_set_header Host $host;', type: 'directive', icon: '🏠', color: '#6ee7b7', label: 'ส่ง Host header ต้นฉบับไปด้วย' },
    { line: '        proxy_cache_bypass $http_upgrade;', type: 'directive', icon: '⚡', color: '#fbbf24', label: 'ไม่ใช้ cache เมื่อเป็น WebSocket' },
    { line: '    }', type: 'block' },
    { line: '}', type: 'block' },
  ];

  const annotatedLines = configLines.filter(cl => cl.label);

  const extraCmds = [
    { cmd: 'ln -s /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/', color: '#79c0ff', desc: 'เปิดใช้งาน config' },
    { cmd: 'rm /etc/nginx/sites-enabled/default', color: '#ff7b72', desc: 'ลบ config เดิมทิ้ง' },
    { cmd: 'nginx -t', color: '#7ee787', desc: 'ตรวจสอบ syntax' },
    { cmd: 'systemctl reload nginx', color: '#ffa657', desc: 'Reload Nginx' },
  ];

  const renderLine = (cl: ConfigLine, i: number) => {
    const isActive = activeLine === i;
    let content: React.ReactNode;

    if (cl.type === 'blank') {
      content = <span>&nbsp;</span>;
    } else if (cl.type === 'key') {
      content = (
        <>
          <span style={{ color: '#c9d1d9' }}>{'        '}</span>
          <span style={{ color: '#79c0ff' }}>proxy_pass</span>
          <span style={{ color: '#ffa657' }}> http://</span>
          <span style={{ color: '#f87171', fontWeight: 700 }}>127.0.0.1:5173</span>
          <span style={{ color: '#c9d1d9' }}>;</span>
        </>
      );
    } else if (cl.type === 'block') {
      content = <span style={{ color: '#c9d1d9' }}>{cl.line}</span>;
    } else {
      // directive — split key=value at first space after indent
      const trimmed = cl.line.trimStart();
      const indent = cl.line.slice(0, cl.line.length - trimmed.length);
      const spaceIdx = trimmed.indexOf(' ');
      const key = spaceIdx !== -1 ? trimmed.slice(0, spaceIdx) : trimmed;
      const val = spaceIdx !== -1 ? trimmed.slice(spaceIdx) : '';
      content = (
        <>
          <span style={{ color: 'transparent' }}>{indent}</span>
          <span style={{ color: '#79c0ff' }}>{key}</span>
          <span style={{ color: '#a3d4ff' }}>{val}</span>
        </>
      );
    }

    return (
      <div
        key={i}
        onClick={() => cl.label ? setActiveLine(isActive ? null : i) : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1px 12px',
          background: isActive ? 'rgba(248,113,113,0.1)' : 'transparent',
          borderLeft: isActive ? '3px solid #f87171' : '3px solid transparent',
          cursor: cl.label ? 'pointer' : 'default',
          transition: 'background 0.12s',
          gap: 0,
        }}
      >
        {/* line number */}
        <span style={{ color: '#3d4451', fontSize: '11px', minWidth: '22px', textAlign: 'right', marginRight: '16px', userSelect: 'none', flexShrink: 0 }}>
          {cl.type !== 'blank' ? i + 1 : ''}
        </span>
        {/* code */}
        <span style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: '13.5px', lineHeight: '1.9', whiteSpace: 'pre', flex: 1 }}>
          {content}
        </span>
        {/* dot indicator */}
        {cl.label && (
          <span style={{ fontSize: '8px', color: isActive ? cl.color : '#3d4451', marginLeft: '6px', flexShrink: 0, transition: 'color 0.15s' }}>●</span>
        )}
      </div>
    );
  };

  return (
    <div className="slide slide-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ncfg-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
          50%      { box-shadow: 0 0 12px 3px rgba(248,113,113,0.25); }
        }
        @keyframes ncfg-slide-in {
          from { opacity:0; transform:translateX(6px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .ncfg-proxy { animation: ncfg-pulse 2.2s ease-in-out infinite; }
        .ncfg-ann   { animation: ncfg-slide-in 0.2s ease-out both; }
      `}} />

      <div className="slide-tag">{s.tag}</div>
      <h2 style={{ marginBottom: '10px' }}>{s.title}</h2>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>

        {/* ══ LEFT: Full config to type ══ */}
        <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>

          {/* Step badge + command */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', borderRadius: '6px', padding: '3px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
              ขั้นตอนที่ 1
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>สร้างไฟล์ config:</span>
            <code style={{ color: '#7ee787', background: 'rgba(126,231,135,0.1)', border: '1px solid rgba(126,231,135,0.2)', padding: '2px 8px', borderRadius: '5px', fontSize: '12.5px', fontFamily: 'monospace' }}>
              nano /etc/nginx/sites-available/webapp
            </code>
          </div>

          {/* THE CONFIG BLOCK — full height, no truncation */}
          <div style={{ background: '#0d1117', borderRadius: '12px', overflow: 'hidden', border: '1px solid #30363d', boxShadow: '0 6px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            {/* Titlebar */}
            <div style={{ background: '#161b22', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
              <span style={{ fontSize: '11px', color: '#8b949e', marginLeft: '8px', fontFamily: 'monospace', flex: 1 }}>
                /etc/nginx/sites-available/webapp
              </span>
              <span style={{ fontSize: '10px', color: '#484f58', fontStyle: 'italic' }}>
                คลิกบรรทัดเพื่อดูคำอธิบาย
              </span>
            </div>

            {/* Code lines — full config, no scroll, fits slide */}
            <div style={{ padding: '10px 0' }}>
              {configLines.map((cl, i) => renderLine(cl, i))}
            </div>
          </div>

          {/* Step 2 — commands to run after */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', borderRadius: '6px', padding: '3px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
              ขั้นตอนที่ 2
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>รันคำสั่งต่อไปนี้ใน Terminal:</span>
          </div>
          <div style={{ background: '#0d1117', borderRadius: '10px', border: '1px solid #30363d', padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {extraCmds.map((ec, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
                <span style={{ color: '#484f58', flexShrink: 0 }}>$</span>
                <span style={{ color: ec.color }}>{ec.cmd}</span>
                <span style={{ color: '#484f58', fontSize: '11px', marginLeft: 'auto', whiteSpace: 'nowrap' }}>← {ec.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT: Line-by-line explanation table ══ */}
        <div style={{ width: '258px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>

          {/* Header */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📋 คำอธิบายแต่ละบรรทัด
          </div>

          {/* Annotation table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', flex: 1 }}>
            {annotatedLines.map((cl, idx) => {
              const lineIdx = configLines.indexOf(cl);
              const isActive = activeLine === lineIdx;
              return (
                <div
                  key={idx}
                  className={isActive ? 'ncfg-ann' : ''}
                  onClick={() => setActiveLine(isActive ? null : lineIdx)}
                  style={{
                    padding: '9px 12px',
                    borderBottom: idx < annotatedLines.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isActive ? `${cl.color}18` : 'transparent',
                    borderLeft: isActive ? `3px solid ${cl.color}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Code snippet */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{cl.icon}</span>
                    <code style={{ fontSize: '11px', color: isActive ? cl.color : '#79c0ff', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {cl.line.trim().replace(/;$/, '')}
                    </code>
                  </div>
                  {/* Explanation (always visible, not just on click) */}
                  <div style={{ fontSize: '11.5px', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: '20px' }}>
                    {cl.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result callout */}
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>✅ ผลลัพธ์ที่ได้</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.55 }}>
              เปิด <code style={{ color: '#7ee787', background: 'rgba(126,231,135,0.1)', padding: '0 4px', borderRadius: '3px' }}>http://[IP ตู้]</code> บน Browser<br />
              → Nginx (พอร์ต 80) รับ → ส่งต่อ<br />
              → Vite Dev Server (พอร์ต 5173) ✨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NGINX FLOW ANIMATION
   ============================================================ */
function NginxFlowAnimation({ s }: { s: SlideData }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    { label: '① ผู้ใช้พิมพ์ URL', desc: 'Browser ส่ง HTTP GET Request ไปยัง IP ของเซิร์ฟเวอร์ที่พอร์ต 80', from: 'browser', to: 'nginx', color: '#60a5fa', icon: '🌐', cmd: 'GET / HTTP/1.1\nHost: 192.168.10.101' },
    { label: '② Nginx รับ Request', desc: 'Nginx ตรวจสอบคำขอ — อ่านไฟล์ HTML จาก /var/www/html/ เพื่อส่งกลับ', from: 'nginx', to: 'disk', color: '#34d399', icon: '⚡', cmd: 'Reading /var/www/html/index.html' },
    { label: '③ Nginx ส่ง Response', desc: 'Nginx ส่งไฟล์ HTML กลับไปให้ Browser พร้อม HTTP Status 200 OK', from: 'nginx', to: 'browser', color: '#f59e0b', icon: '📄', cmd: 'HTTP/1.1 200 OK\nContent-Type: text/html' },
    { label: '④ Browser แสดงผล', desc: 'Browser รับ HTML แล้ว render เป็นหน้าเว็บให้ผู้ใช้มองเห็น', from: 'browser', to: 'screen', color: '#a78bfa', icon: '✅', cmd: 'Page rendered: index.html' },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setStep(prev => (prev + 1) % steps.length);
    }, 2200);
    return () => clearTimeout(timer);
  }, [step, isPlaying]);

  const current = steps[step];

  const nodes = [
    { id: 'browser', label: 'Browser', icon: '💻', sub: 'Client PC', color: '#3b82f6' },
    { id: 'nginx', label: 'Nginx', icon: '🌐', sub: 'Port 80', color: '#10b981' },
    { id: 'disk', label: 'Files', icon: '📁', sub: '/var/www/html', color: '#8b5cf6' },
  ];

  return (
    <div className="slide slide-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes nginx-packet {
          0%   { transform: translateX(0)   translateY(0)   scale(1);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(var(--nx,0)) translateY(var(--ny,0)) scale(0.8); opacity: 0; }
        }
        @keyframes nginx-glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(99,179,237,0.3); }
          50%       { box-shadow: 0 0 18px 6px rgba(99,179,237,0.7); }
        }
        @keyframes nginx-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nginx-node-active { animation: nginx-glow 1.2s ease-in-out infinite; }
        .nginx-step-in     { animation: nginx-slide-in 0.35s ease-out both; }
      `}} />
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, marginTop: '12px' }}>

        {/* Left: Node diagram */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Step progress bar */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {steps.map((st, i) => (
              <button key={i} onClick={() => { setStep(i); setIsPlaying(false); }} style={{
                flex: 1, padding: '6px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.25s',
                background: step === i ? current.color : 'var(--bg-card)',
                color: step === i ? 'white' : 'var(--text-secondary)',
                boxShadow: step === i ? `0 0 10px ${current.color}55` : 'none'
              }}>{i + 1}</button>
            ))}
          </div>

          {/* Flow diagram */}
          <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', position: 'relative' }}>
            {/* Nodes row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '10px', position: 'relative' }}>
              {nodes.map((node) => {
                const isActive = current.from === node.id || current.to === node.id;
                return (
                  <div key={node.id} className={isActive ? 'nginx-node-active' : ''} style={{
                    background: isActive ? `${node.color}22` : 'var(--bg-card)',
                    border: `2px solid ${isActive ? node.color : 'var(--border)'}`,
                    borderRadius: '12px', padding: '14px 10px', textAlign: 'center', minWidth: '90px',
                    transition: 'all 0.3s ease', cursor: 'default'
                  }}>
                    <div style={{ fontSize: '28px' }}>{node.icon}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '4px', color: isActive ? node.color : 'var(--text-primary)' }}>{node.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{node.sub}</div>
                  </div>
                );
              })}
              {/* Animated arrow SVG */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 300 80">
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill={current.color} />
                  </marker>
                </defs>
                {step === 0 && <line x1="60" y1="40" x2="155" y2="40" stroke={current.color} strokeWidth="2.5" strokeDasharray="6,3" markerEnd="url(#arrowhead)" style={{ animation: 'none' }} />}
                {step === 1 && <line x1="165" y1="40" x2="245" y2="40" stroke={current.color} strokeWidth="2.5" strokeDasharray="6,3" markerEnd="url(#arrowhead)" />}
                {step === 2 && <line x1="155" y1="40" x2="60" y2="40" stroke={current.color} strokeWidth="2.5" strokeDasharray="6,3" markerEnd="url(#arrowhead)" />}
                {step === 3 && <circle cx="50" cy="40" r="20" fill="none" stroke={current.color} strokeWidth="2" strokeDasharray="4,2" />}
              </svg>
            </div>

            {/* Terminal command display */}
            <div style={{ background: '#0d1117', borderRadius: '8px', padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#58a6ff', marginTop: '12px', minHeight: '52px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              <span style={{ color: '#7c3aed', marginRight: '8px' }}>$</span>{current.cmd}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
              background: isPlaying ? '#ef4444' : '#22c55e', color: 'white'
            }}>{isPlaying ? '❚❚ หยุด' : '▶ เล่น'}</button>
            <button onClick={() => setStep(p => (p + 1) % steps.length)} style={{
              padding: '7px 18px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
              background: 'var(--bg-card)', color: 'var(--text-primary)'
            }}>ขั้นตอนถัดไป ▶</button>
          </div>
        </div>

        {/* Right: Step explanation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div key={step} className="nginx-step-in" style={{
            background: `${current.color}15`, border: `2px solid ${current.color}`,
            borderRadius: '12px', padding: '20px', flex: 1
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{current.icon}</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: current.color, marginBottom: '8px' }}>{current.label}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{current.desc}</div>
          </div>

          {/* All steps list */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ขั้นตอนทั้งหมด</div>
            {steps.map((st, i) => (
              <div key={i} onClick={() => { setStep(i); setIsPlaying(false); }} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px', transition: 'all 0.2s',
                background: step === i ? `${st.color}22` : 'transparent',
                border: step === i ? `1px solid ${st.color}` : '1px solid transparent'
              }}>
                <span style={{ fontSize: '16px' }}>{st.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: step === i ? 'bold' : 'normal', color: step === i ? st.color : 'var(--text-primary)' }}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MARIADB QUERY ANIMATION
   ============================================================ */
function MariaDBQueryAnimation({ s }: { s: SlideData }) {
  const [activeQuery, setActiveQuery] = useState(0);
  const [queryRunning, setQueryRunning] = useState(false);
  const [resultRows, setResultRows] = useState<string[][]>([]);
  const [queryLog, setQueryLog] = useState<string[]>(['MariaDB [(none)]> ']);

  const queries = [
    {
      label: 'SHOW DATABASES', icon: '📂', color: '#60a5fa',
      cmd: 'SHOW DATABASES;',
      desc: 'แสดงรายการฐานข้อมูลทั้งหมดในระบบ',
      headers: ['Database'],
      rows: [['information_schema'], ['mywebdb'], ['mysql'], ['performance_schema']],
      delay: 120,
    },
    {
      label: 'CREATE TABLE', icon: '🏗️', color: '#34d399',
      cmd: 'CREATE TABLE students (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(100)\n);',
      desc: 'สร้างตาราง students ที่มี id, name, email',
      headers: ['Result'],
      rows: [['Query OK, 0 rows affected']],
      delay: 200,
    },
    {
      label: 'INSERT', icon: '➕', color: '#f59e0b',
      cmd: "INSERT INTO students (name, email)\nVALUES ('สมชาย', 'somchai@school.com');",
      desc: 'เพิ่มข้อมูลนักเรียนเข้าตาราง',
      headers: ['Result'],
      rows: [['Query OK, 1 row affected']],
      delay: 150,
    },
    {
      label: 'SELECT *', icon: '🔍', color: '#a78bfa',
      cmd: 'SELECT * FROM students;',
      desc: 'ดึงข้อมูลทั้งหมดจากตาราง students',
      headers: ['id', 'name', 'email'],
      rows: [['1', 'สมชาย', 'somchai@school.com'], ['2', 'สมหญิง', 'somying@school.com']],
      delay: 100,
    },
  ];

  const runQuery = (idx: number) => {
    if (queryRunning) return;
    setActiveQuery(idx);
    setQueryRunning(true);
    setResultRows([]);
    const q = queries[idx];
    setQueryLog(prev => [...prev, q.cmd, '']);
    let i = 0;
    const iv = setInterval(() => {
      if (i < q.rows.length) {
        const rowData = q.rows[i];  // capture before i is incremented
        setResultRows(prev => [...prev, rowData]);
        i++;
      } else {
        clearInterval(iv);
        setQueryRunning(false);
        setQueryLog(prev => [...prev, `${q.rows.length} row(s) in set`, 'MariaDB [mywebdb]> ']);
      }
    }, q.delay);
  };

  const current = queries[activeQuery];

  return (
    <div className="slide slide-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes db-row-in {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes db-pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        .db-row-in  { animation: db-row-in 0.2s ease-out both; }
        .db-cursor  { animation: db-pulse 0.9s step-end infinite; display: inline-block; }
      `}} />
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, marginTop: '12px' }}>

        {/* Left: query picker */}
        <div style={{ width: '210px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>คำสั่ง SQL</div>
          {queries.map((q, i) => (
            <button key={i} onClick={() => runQuery(i)} disabled={queryRunning} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
              border: `2px solid ${activeQuery === i ? q.color : 'var(--border)'}`,
              background: activeQuery === i ? `${q.color}18` : 'var(--bg-card)',
              color: 'var(--text-primary)', cursor: queryRunning ? 'not-allowed' : 'pointer',
              textAlign: 'left', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s',
              opacity: queryRunning && activeQuery !== i ? 0.5 : 1
            }}>
              <span style={{ fontSize: '20px' }}>{q.icon}</span>
              <div>
                <div style={{ color: activeQuery === i ? q.color : 'var(--text-primary)', fontWeight: 'bold' }}>{q.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '2px' }}>{q.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Middle: SQL terminal */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* SQL editor */}
          <div style={{ background: '#0d1117', borderRadius: '10px', padding: '14px 18px', fontFamily: 'monospace', fontSize: '13px', color: '#c9d1d9', lineHeight: 1.7, minHeight: '110px', border: '1px solid #30363d' }}>
            <div style={{ color: '#8b949e', marginBottom: '6px', fontSize: '11px' }}>-- คำสั่ง SQL ที่จะรัน</div>
            <span style={{ color: '#ff7b72' }}>{current.cmd.split(' ')[0]}</span>
            {' '}
            <span style={{ color: '#79c0ff' }}>{current.cmd.split('\n').join('\n').replace(/^\S+\s*/, '')}</span>
            {queryRunning && <span className="db-cursor" style={{ color: '#58a6ff' }}>█</span>}
          </div>

          {/* Result table */}
          <div style={{ flex: 1, background: '#0d1117', borderRadius: '10px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', color: '#c9d1d9', overflow: 'auto', border: '1px solid #30363d' }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #30363d', paddingBottom: '6px', marginBottom: '6px' }}>
              {current.headers.map((h, i) => (
                <div key={i} style={{ flex: 1, color: '#79c0ff', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {resultRows.map((row, ri) =>
              Array.isArray(row) ? (
                <div key={ri} className="db-row-in" style={{ display: 'flex', gap: '0', padding: '4px 0', borderBottom: '1px solid #21262d' }}>
                  {row.map((cell, ci) => (
                    <div key={ci} style={{ flex: 1, color: '#7ee787' }}>{cell}</div>
                  ))}
                </div>
              ) : null
            )}
            {!queryRunning && resultRows.length === 0 && (
              <div style={{ color: '#8b949e', marginTop: '8px' }}>กด คำสั่ง SQL ทางซ้ายเพื่อรัน...</div>
            )}
          </div>
        </div>

        {/* Right: info panel */}
        <div style={{ width: '190px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: `${current.color}18`, border: `1px solid ${current.color}`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{current.icon}</div>
            <div style={{ fontWeight: 'bold', color: current.color, fontSize: '14px', marginBottom: '6px' }}>{current.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{current.desc}</div>
          </div>

          {/* Port info */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>ข้อมูล MariaDB</div>
            <div style={{ fontSize: '12px', lineHeight: 1.8 }}>
              <div>🔌 พอร์ต: <strong style={{ color: '#34d399' }}>3306</strong></div>
              <div>🗂️ ภาษา: <strong>SQL</strong></div>
              <div>🔐 User: <strong>root / webuser</strong></div>
              <div>📁 Data: <strong>/var/lib/mysql</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NODE.JS REQUEST ANIMATION
   ============================================================ */
function NodeJSRequestAnimation({ s }: { s: SlideData }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [serverLogs, setServerLogs] = useState<string[]>([
    'Server running at http://0.0.0.0:3000/',
    'Waiting for requests...',
  ]);

  const steps = [
    { label: 'Browser ส่ง Request', icon: '📤', color: '#60a5fa', from: 'browser', to: 'nodejs', desc: 'Browser ส่ง HTTP GET ไปที่พอร์ต 3000 ของ Node.js', log: 'Incoming GET / from 192.168.10.1' },
    { label: 'Node.js ประมวลผล', icon: '⚙️', color: '#f59e0b', from: 'nodejs', to: 'mariadb', desc: 'Node.js รับ Request และสืบค้นข้อมูลจาก MariaDB (พอร์ต 3306)', log: 'Querying MariaDB: SELECT * FROM students;' },
    { label: 'MariaDB ส่งข้อมูล', icon: '🗄️', color: '#34d399', from: 'mariadb', to: 'nodejs', desc: 'MariaDB ส่งผลลัพธ์ rows กลับมาให้ Node.js', log: 'DB result: 2 rows returned' },
    { label: 'Node.js ส่ง Response', icon: '📥', color: '#a78bfa', from: 'nodejs', to: 'browser', desc: 'Node.js ประกอบ JSON Response แล้วส่งกลับผ่าน HTTP 200', log: 'Response sent: 200 OK ({"status":"ok","data":[...]})' },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const t = setTimeout(() => {
      const next = (step + 1) % steps.length;
      setStep(next);
      setServerLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${steps[next].log}`]);
    }, 2000);
    return () => clearTimeout(t);
  }, [step, isPlaying]);

  const current = steps[step];
  const nodesDef = [
    { id: 'browser', label: 'Browser', icon: '💻', color: '#3b82f6', sub: 'Client' },
    { id: 'nodejs', label: 'Node.js', icon: '🟢', color: '#f59e0b', sub: 'Port 3000' },
    { id: 'mariadb', label: 'MariaDB', icon: '🗄️', color: '#10b981', sub: 'Port 3306' },
  ];

  const arrowFromTo: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
    'browser->nodejs': { x1: 55, y1: 40, x2: 155, y2: 40 },
    'nodejs->mariadb': { x1: 165, y1: 40, x2: 255, y2: 40 },
    'mariadb->nodejs': { x1: 255, y1: 45, x2: 165, y2: 45 },
    'nodejs->browser': { x1: 155, y1: 45, x2: 55, y2: 45 },
  };
  const arrowKey = `${current.from}->${current.to}`;
  const arrow = arrowFromTo[arrowKey];

  return (
    <div className="slide slide-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes nj-log-in {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nj-pulse-node {
          0%, 100% { box-shadow: 0 0 8px 1px rgba(245,158,11,0.3); }
          50%       { box-shadow: 0 0 18px 4px rgba(245,158,11,0.7); }
        }
        @keyframes nj-arrow {
          0%   { stroke-dashoffset: 40; opacity: 0.5; }
          100% { stroke-dashoffset: 0;  opacity: 1; }
        }
        .nj-log-in    { animation: nj-log-in 0.3s ease-out both; }
        .nj-active    { animation: nj-pulse-node 1s ease-in-out infinite; }
        .nj-arrow     { stroke-dasharray: 8,4; animation: nj-arrow 0.8s linear infinite; }
      `}} />
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, marginTop: '12px' }}>

        {/* Left: flow diagram */}
        <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Step tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {steps.map((st, i) => (
              <button key={i} onClick={() => { setStep(i); setIsPlaying(false); }} style={{
                flex: 1, padding: '7px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: 'all 0.25s',
                background: step === i ? st.color : 'var(--bg-card)',
                color: step === i ? 'white' : 'var(--text-secondary)',
                boxShadow: step === i ? `0 0 12px ${st.color}55` : 'none'
              }}>{i + 1}</button>
            ))}
          </div>

          {/* Node diagram */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px 12px', position: 'relative', minHeight: '130px', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', position: 'relative' }}>
              {nodesDef.map(nd => {
                const isActive = nd.id === current.from || nd.id === current.to;
                return (
                  <div key={nd.id} className={nd.id === current.from ? 'nj-active' : ''} style={{
                    background: isActive ? `${nd.color}22` : 'var(--bg-card)',
                    border: `2px solid ${isActive ? nd.color : 'var(--border)'}`,
                    borderRadius: '12px', padding: '12px 10px', textAlign: 'center', minWidth: '85px', transition: 'all 0.3s'
                  }}>
                    <div style={{ fontSize: '26px' }}>{nd.icon}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: isActive ? nd.color : 'var(--text-primary)', marginTop: '3px' }}>{nd.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{nd.sub}</div>
                  </div>
                );
              })}
              {/* Arrow SVG */}
              {arrow && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 310 80">
                  <defs>
                    <marker id="nj-arrow-head" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill={current.color} />
                    </marker>
                  </defs>
                  <line x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2}
                    stroke={current.color} strokeWidth="2.5"
                    className="nj-arrow"
                    markerEnd="url(#nj-arrow-head)" />
                </svg>
              )}
            </div>
          </div>

          {/* Server console log */}
          <div style={{ flex: 1, background: '#0d1117', borderRadius: '10px', padding: '14px', fontFamily: 'monospace', fontSize: '11.5px', color: '#58a6ff', overflow: 'auto', border: '1px solid #30363d', lineHeight: 1.7 }}>
            <div style={{ color: '#8b949e', marginBottom: '6px', fontSize: '10px' }}>▶ Node.js Server Console</div>
            {serverLogs.map((log, i) => (
              <div key={i} className={i === serverLogs.length - 1 ? 'nj-log-in' : ''} style={{ color: i === serverLogs.length - 1 ? '#7ee787' : '#8b949e' }}>{log}</div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              flex: 1, padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
              background: isPlaying ? '#ef4444' : '#22c55e', color: 'white'
            }}>{isPlaying ? '❚❚ หยุด' : '▶ เล่น'}</button>
            <button onClick={() => { const n = (step + 1) % steps.length; setStep(n); setIsPlaying(false); setServerLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${steps[n].log}`]); }} style={{
              flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
              background: 'var(--bg-card)', color: 'var(--text-primary)'
            }}>ขั้นตอนถัดไป ▶</button>
          </div>
        </div>

        {/* Right: step detail */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div key={step} className="nj-log-in" style={{
            background: `${current.color}18`, border: `2px solid ${current.color}`,
            borderRadius: '12px', padding: '18px', flex: 1
          }}>
            <div style={{ fontSize: '30px', marginBottom: '8px' }}>{current.icon}</div>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: current.color, marginBottom: '8px' }}>{current.label}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{current.desc}</div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>Node.js Info</div>
            <div style={{ fontSize: '12px', lineHeight: 1.8 }}>
              <div>🔌 พอร์ต: <strong style={{ color: '#f59e0b' }}>3000</strong></div>
              <div>📦 ภาษา: <strong>JavaScript</strong></div>
              <div>🛠️ ไฟล์: <strong>server.js</strong></div>
              <div>🔄 รัน: <strong>node server.js</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DhcpHotelAnimation({ s }: { s: SlideData }) {
  // State for hotel simulation
  const [rooms, setRooms] = useState([
    { id: 101, ip: '192.168.1.101', occupiedBy: null as string | null },
    { id: 102, ip: '192.168.1.102', occupiedBy: null as string | null },
    { id: 103, ip: '192.168.1.103', occupiedBy: null as string | null },
    { id: 104, ip: '192.168.1.104', occupiedBy: null as string | null },
  ]);

  const [queue, setQueue] = useState([
    { name: 'โทรศัพท์มือถือ', icon: '📱' },
    { name: 'โน้ตบุ๊ก', icon: '💻' },
    { name: 'แท็บเล็ต', icon: '📟' },
  ]);

  const [checkedIn, setCheckedIn] = useState<{ name: string; icon: string; room: number; ip: string }[]>([]);
  const [activeStep, setActiveStep] = useState<'D' | 'O' | 'R' | 'A' | null>(null);
  const [currentDevice, setCurrentDevice] = useState<{ name: string; icon: string } | null>(null);
  const [currentRoom, setCurrentRoom] = useState<{ id: number; ip: string; occupiedBy: string | null } | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  const resetSimulation = () => {
    setRooms([
      { id: 101, ip: '192.168.1.101', occupiedBy: null as string | null },
      { id: 102, ip: '192.168.1.102', occupiedBy: null as string | null },
      { id: 103, ip: '192.168.1.103', occupiedBy: null as string | null },
      { id: 104, ip: '192.168.1.104', occupiedBy: null as string | null },
    ]);
    setQueue([
      { name: 'โทรศัพท์มือถือ', icon: '📱' },
      { name: 'โน้ตบุ๊ก', icon: '💻' },
      { name: 'แท็บเล็ต', icon: '📟' },
    ]);
    setCheckedIn([]);
    setActiveStep(null);
    setCurrentDevice(null);
    setCurrentRoom(null);
    setStepIndex(0);
  };

  const handleNextStep = useCallback(() => {
    // If no devices left and not in an active step, reset after a delay
    if (queue.length === 0 && !activeStep && stepIndex === 0) {
      resetSimulation();
      return;
    }

    if (stepIndex === 0) {
      // D - Discover: Pick next device
      if (queue.length > 0) {
        const nextDev = queue[0];
        setCurrentDevice(nextDev);
        setQueue(queue.slice(1));

        const freeRoomIndex = rooms.findIndex(r => r.occupiedBy === null);
        if (freeRoomIndex === -1) {
          setIsPlaying(false);
          alert("ขออภัยค่ะ IP Address เต็มคลังแล้ว!");
          return;
        }
        const room = rooms[freeRoomIndex];
        setCurrentRoom(room);
        setActiveStep('D');
        setStepIndex(1);
      }
    } else if (stepIndex === 1) {
      // O - Offer
      setActiveStep('O');
      setStepIndex(2);
    } else if (stepIndex === 2) {
      // R - Request
      setActiveStep('R');
      setStepIndex(3);
    } else if (stepIndex === 3) {
      // A - ACK
      setActiveStep('A');
      setStepIndex(4);
    } else if (stepIndex === 4) {
      // Finalize ACK
      if (currentRoom && currentDevice) {
        setRooms(prevRooms => prevRooms.map(r => r.id === currentRoom.id ? { ...r, occupiedBy: currentDevice.name } : r));
        setCheckedIn(prevChecked => [...prevChecked, { ...currentDevice, room: currentRoom.id, ip: currentRoom.ip }]);
      }
      setActiveStep(null);
      setCurrentDevice(null);
      setCurrentRoom(null);
      setStepIndex(0);
    }
  }, [queue, activeStep, stepIndex, rooms, currentRoom, currentDevice]);

  // Effect for Auto-play
  useEffect(() => {
    if (!isPlaying) return;

    // Use 2.5 seconds interval for easy visual reading
    const interval = setTimeout(() => {
      handleNextStep();
    }, 2500);

    return () => clearTimeout(interval);
  }, [isPlaying, handleNextStep]);

  // CSS animations
  const packetAnimation = activeStep === 'D' || activeStep === 'R'
    ? 'travel-to-server-anim 2s infinite ease-in-out'
    : activeStep === 'O' || activeStep === 'A'
      ? 'travel-to-client-anim 2s infinite ease-in-out'
      : 'none';

  const packetEmoji = activeStep === 'D' ? '📣'
    : activeStep === 'O' ? '🛌'
      : activeStep === 'R' ? '✉️'
        : activeStep === 'A' ? '🔑'
          : '';

  return (
    <div className="slide slide-content slide-dhcp-hotel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-box {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes fade-in-box {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes travel-to-server-anim {
          0% { transform: translateX(0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(110px); opacity: 0; }
        }
        @keyframes travel-to-client-anim {
          0% { transform: translateX(110px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(0); opacity: 0; }
        }
        .animate-pulse-box {
          animation: pulse-box 1.5s infinite;
        }
        .animate-fade-in-box {
          animation: fade-in-box 0.3s ease-out;
        }
      `}} />
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>

      <div style={{ display: 'flex', gap: '25px', flex: 1, overflow: 'visible', marginTop: '5px', minHeight: '0' }}>
        {/* Left Column: Theory Text & DORA active pipeline */}
        <div style={{ flex: 0.9, minWidth: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto', maxHeight: '100%', paddingRight: '5px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            {s.items?.map((item, i) => {
              const isSubItem = item.trim().startsWith("-");
              return (
                <div key={i} style={{
                  lineHeight: '1.4',
                  paddingLeft: isSubItem ? '15px' : '0',
                  color: isSubItem ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontWeight: isSubItem ? 'normal' : 'bold'
                }}>
                  {item}
                </div>
              );
            })}
          </div>

          {/* DORA Pipeline visualizer */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            marginTop: '10px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ขั้นตอน DORA ที่กำลังทำงาน
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
              <div style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                background: activeStep === 'D' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeStep === 'D' ? 'white' : 'var(--text-secondary)',
                boxShadow: activeStep === 'D' ? '0 0 10px var(--accent-dim)' : 'none',
                transform: activeStep === 'D' ? 'scale(1.05)' : 'scale(1)'
              }}>
                1. Discover
              </div>
              <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>➔</span>
              <div style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                background: activeStep === 'O' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeStep === 'O' ? 'white' : 'var(--text-secondary)',
                boxShadow: activeStep === 'O' ? '0 0 10px var(--accent-dim)' : 'none',
                transform: activeStep === 'O' ? 'scale(1.05)' : 'scale(1)'
              }}>
                2. Offer
              </div>
              <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>➔</span>
              <div style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                background: activeStep === 'R' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeStep === 'R' ? 'white' : 'var(--text-secondary)',
                boxShadow: activeStep === 'R' ? '0 0 10px var(--accent-dim)' : 'none',
                transform: activeStep === 'R' ? 'scale(1.05)' : 'scale(1)'
              }}>
                3. Request
              </div>
              <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>➔</span>
              <div style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                background: activeStep === 'A' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeStep === 'A' ? 'white' : 'var(--text-secondary)',
                boxShadow: activeStep === 'A' ? '0 0 10px var(--accent-dim)' : 'none',
                transform: activeStep === 'A' ? 'scale(1.05)' : 'scale(1)'
              }}>
                4. ACK
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Hotel Simulation */}
        <div style={{
          flex: 1.3,
          background: 'var(--bg-elevated)',
          borderRadius: '12px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid var(--border)',
          position: 'relative',
          minHeight: '400px'
        }}>
          {/* Simulation Header with Auto-play Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '15px' }}>แอนิเมชันจำลองโรงแรม DHCP</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  background: isPlaying ? '#ef4444' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                {isPlaying ? (
                  <>
                    <span style={{ fontSize: '10px' }}>❚❚</span> หยุดชั่วคราว
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '10px' }}>▶</span> เล่นอัตโนมัติ
                  </>
                )}
              </button>

              {!isPlaying && (
                <button
                  onClick={handleNextStep}
                  disabled={queue.length === 0 && !activeStep}
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    opacity: (queue.length === 0 && !activeStep) ? 0.5 : 1
                  }}
                >
                  สเต็ปถัดไป
                </button>
              )}

              <button
                onClick={resetSimulation}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }}
              >
                รีเซ็ต
              </button>
            </div>
          </div>

          {/* Hotel Grid Area */}
          <div style={{ display: 'flex', flex: 1, gap: '10px', alignItems: 'stretch', margin: '5px 0', position: 'relative' }}>

            {/* Left side of simulation: Client devices queue */}
            <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', zIndex: 2 }}>

              {/* Active check-in device */}
              {currentDevice ? (
                <div className="animate-pulse-box" style={{
                  background: 'var(--accent-dim)',
                  border: '2px solid var(--accent)',
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '2px' }}>{currentDevice.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{currentDevice.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '2px', fontWeight: 'bold' }}>
                    {activeStep === 'D' ? 'กำลังส่งคำขอ...' : activeStep === 'R' ? 'กำลังตอบกลับ...' : 'กำลังคุย...'}
                  </div>
                </div>
              ) : (
                <div style={{ height: '80px', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  ไม่มีอุปกรณ์กำลังเช็คอิน
                </div>
              )}

              {/* Waiting Queue */}
              {queue.length > 0 && (
                <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>คิวอุปกรณ์ถัดไป</div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {queue.map((q, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-elevated)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: '16px' }}>{q.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checked-In Devices */}
              {checkedIn.length > 0 && (
                <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center', fontWeight: 'bold' }}>ต่อ Wi-Fi สำเร็จแล้ว</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {checkedIn.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        background: 'var(--bg-elevated)',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)'
                      }}>
                        <span>{item.icon}</span>
                        <span style={{ fontWeight: 'bold', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                        <span style={{ background: '#22c55e', color: 'white', padding: '1px 3px', borderRadius: '3px', transform: 'scale(0.85)', transformOrigin: 'right' }}>
                          IP: {item.ip.split('.').slice(-2).join('.')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Middle side: The receptionist / DHCP Server & Traveling packet */}
            <div style={{
              flex: 0.9,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderLeft: '1px dashed var(--border)',
              borderRight: '1px dashed var(--border)',
              padding: '0 5px',
              position: 'relative'
            }}>
              {/* Traveling Packet Animation */}
              {activeStep && (
                <div style={{
                  position: 'absolute',
                  top: '30%',
                  fontSize: '24px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: packetAnimation,
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  {packetEmoji}
                </div>
              )}

              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                zIndex: 2
              }}>
                👩‍💼
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px', textAlign: 'center', zIndex: 2 }}>
                พนักงานต้อนรับ
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textAlign: 'center', zIndex: 2 }}>
                (DHCP Server)
              </div>

              {/* Message Bubble Overlay */}
              {activeStep && currentDevice && currentRoom && (
                <div className="animate-fade-in-box" style={{
                  marginTop: '10px',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent)',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '10px',
                  textAlign: 'center',
                  width: '100%',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  zIndex: 2
                }}>
                  {activeStep === 'D' && (
                    <>
                      <strong>Discover (D)</strong><br />
                      ส่งกระจายขอ IP
                    </>
                  )}
                  {activeStep === 'O' && (
                    <>
                      <strong>Offer (O)</strong><br />
                      เสนอห้อง {currentRoom.id}
                    </>
                  )}
                  {activeStep === 'R' && (
                    <>
                      <strong>Request (R)</strong><br />
                      ขอยืนยันห้อง {currentRoom.id}
                    </>
                  )}
                  {activeStep === 'A' && (
                    <>
                      <strong>Acknowledge (A)</strong><br />
                      เช็คอินห้องสำเร็จ!
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right side of simulation: Hotel Room slots */}
            <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center', zIndex: 2 }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 'bold' }}>
                ห้องพักและ IP Address
              </div>
              {rooms.map(room => {
                const isTarget = currentRoom && currentRoom.id === room.id && activeStep;
                return (
                  <div key={room.id} style={{
                    background: room.occupiedBy ? 'rgba(239, 68, 68, 0.08)' : isTarget ? 'rgba(59, 130, 246, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                    border: room.occupiedBy ? '1px solid #ef4444' : isTarget ? '2px solid var(--accent)' : '1px solid #22c55e',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>ห้อง {room.id}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{room.ip.split('.').slice(-2).join('.')}</div>
                    </div>
                    <div style={{
                      fontWeight: 'bold',
                      color: room.occupiedBy ? '#ef4444' : '#22c55e',
                      fontSize: '9px'
                    }}>
                      {room.occupiedBy ? `เต็ม (${room.occupiedBy.substring(0, 3)})` : isTarget ? 'เสนอ...' : 'ว่าง'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step description helper */}
          {activeStep ? (
            <div style={{
              background: 'var(--bg-card)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              border: '1px solid var(--border)',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              {activeStep === 'D' && <span><strong>ขั้นตอนที่ 1 (Discover):</strong> Client ตะโกนถาม 📣 หา DHCP Server</span>}
              {activeStep === 'O' && <span><strong>ขั้นตอนที่ 2 (Offer):</strong> DHCP Server เสนอจัดหา 🛌 IP Address ว่างให้</span>}
              {activeStep === 'R' && <span><strong>ขั้นตอนที่ 3 (Request):</strong> Client ส่งเอกสาร ✉️ ยืนยันที่จะตกลงรับ IP นี้</span>}
              {activeStep === 'A' && <span><strong>ขั้นตอนที่ 4 (Acknowledge):</strong> Server ส่งมอบกุญแจ 🔑 มอบ IP ให้ไปใช้เชื่อมต่อเน็ต</span>}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              border: '1px solid var(--border)',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              {queue.length === 0 ? 'เชื่อมต่ออุปกรณ์ครบหมดแล้ว! แอนิเมชันจะวนรอบรีเซ็ตใหม่ในครู่เดียว...' : 'ระบบกำลังจำลองการทำงานของ DHCP คลื่น DORA อัตโนมัติ...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StackInstallerAnimation({ s }: { s: SlideData }) {
  const [activeItem, setActiveItem] = useState<"nginx" | "mariadb" | "nodejs" | "git">("nginx");
  const [installed, setInstalled] = useState<Record<string, boolean>>({
    nginx: false,
    mariadb: false,
    nodejs: false,
    git: false
  });
  const [verified, setVerified] = useState<Record<string, boolean>>({
    nginx: false,
    mariadb: false,
    nodejs: false,
    git: false
  });

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "student@lxc-container-std01:~$ "
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showTestWindow, setShowTestWindow] = useState(false);

  const consoleEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  const itemsInfo = {
    nginx: {
      name: "Nginx (Web Server)",
      icon: "🌐",
      port: "Port 80 (HTTP)",
      desc: "ทำหน้าที่รับ HTTP Request จากเบราว์เซอร์ และส่งกลับหน้าเว็บ HTML/CSS/JS หรือทำหน้าที่เป็น Reverse Proxy ส่งต่อคำขอไปหา Node.js",
      installCmd: "sudo apt update && sudo apt install nginx -y",
      checkCmd: "sudo systemctl status nginx",
      checkOutput: [
        "● nginx.service - A high performance web server and a reverse proxy server",
        "     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)",
        "     Active: active (running) since Mon 2026-06-08 23:59:00 UTC; 12s ago",
        "     Docs: man:nginx(8)",
        "   Main PID: 4215 (nginx)",
        "      Tasks: 2 (limit: 9508)",
        "     Memory: 8.2M",
        "        CPU: 15ms",
        "     CGroup: /system.slice/nginx.service",
        "             ├─4215 \"nginx: master process /usr/sbin/nginx -g daemon on;\"",
        "             └─4216 \"nginx: worker process\""
      ],
      installLogs: [
        "Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease",
        "Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]",
        "Fetched 126 kB in 0.5s (252 kB/s)",
        "Reading package lists... Done",
        "Building dependency tree... Done",
        "Reading state information... Done",
        "The following NEW packages will be installed:",
        "  nginx nginx-common nginx-core",
        "0 upgraded, 3 newly installed, 0 to remove.",
        "Need to get 508 kB of archives.",
        "Unpacking nginx (1.24.0-1ubuntu1)...",
        "Setting up nginx (1.24.0-1ubuntu1)...",
        "Systemd service started automatically.",
        "Processing triggers for systemd (255.4-2ubuntu3)..."
      ]
    },
    mariadb: {
      name: "MariaDB (Database)",
      icon: "🗄️",
      port: "Port 3306",
      desc: "ระบบจัดการฐานข้อมูลแบบ Relational Database (SQL) สำหรับเก็บข้อมูลบัญชีผู้ใช้ คะแนน สถิติ หรือเนื้อหาเว็บที่ Node.js ต้องการสืบค้น",
      installCmd: "sudo apt install mariadb-server -y",
      checkCmd: "sudo systemctl status mariadb",
      checkOutput: [
        "● mariadb.service - MariaDB 10.11 database server",
        "     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled; preset: enabled)",
        "     Active: active (running) since Mon 2026-06-08 23:59:10 UTC; 8s ago",
        "     Docs: man:mariadbd(8)",
        "           https://mariadb.com/kb/en/library/",
        "   Main PID: 5104 (mariadbd)",
        "     Status: \"Taking requests\"",
        "      Tasks: 70 (limit: 9508)",
        "     Memory: 78.4M",
        "     CGroup: /system.slice/mariadb.service",
        "             └─5104 /usr/sbin/mariadbd"
      ],
      installLogs: [
        "Reading package lists... Done",
        "Building dependency tree... Done",
        "The following NEW packages will be installed:",
        "  mariadb-server mariadb-server-10.11 mariadb-client",
        "Need to get 18.2 MB of archives.",
        "Unpacking mariadb-server (1:10.11.8)...",
        "Setting up mariadb-server (1:10.11.8)...",
        "Creating database tables... Done",
        "Setting up root password authentication...",
        "Starting MariaDB database server... Done"
      ]
    },
    nodejs: {
      name: "Node.js (Backend)",
      icon: "🟢",
      port: "Port 3000",
      desc: "สภาพแวดล้อมรัน JavaScript ฝั่งเซิร์ฟเวอร์ ใช้สำหรับรันโค้ดเขียนแอปพลิเคชันระบบหลังบ้าน ติดต่อฐานข้อมูล และประมวลผลคำขอต่างๆ",
      installCmd: "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install nodejs -y",
      checkCmd: "node -v && npm -v",
      checkOutput: [
        "v20.11.0",
        "10.2.4"
      ],
      installLogs: [
        "## Installing the NodeSource Node.js 20.x repo...",
        "## Populating apt source list file...",
        "## Running apt update...",
        "Get:1 http://deb.nodesource.com/node_20.x noble InRelease [4582 B]",
        "Reading package lists... Done",
        "The following NEW packages will be installed:",
        "  nodejs",
        "Need to get 32.4 MB of archives.",
        "Unpacking nodejs (20.11.0-1nodesource1)...",
        "Setting up nodejs (20.11.0-1nodesource1)...",
        "Node.js successfully installed."
      ]
    },
    git: {
      name: "Git (Version Control)",
      icon: "🐙",
      port: "N/A",
      desc: "เครื่องมือควบคุมรุ่นซอฟต์แวร์ สำหรับดึงโค้ดโปรเจกต์จากคลังเก็บ (GitHub) ลงมารันบนเครื่องเซิร์ฟเวอร์จริง หรืออัปเดตเวอร์ชันโปรแกรม",
      installCmd: "sudo apt install git -y",
      checkCmd: "git --version",
      checkOutput: [
        "git version 2.43.0"
      ],
      installLogs: [
        "Reading package lists... Done",
        "Building dependency tree... Done",
        "The following NEW packages will be installed:",
        "  git git-man liberror-perl",
        "Need to get 6204 kB of archives.",
        "Unpacking git (1:2.43.0-1ubuntu1)...",
        "Setting up git (1:2.43.0-1ubuntu1)...",
        "Git version 2.43.0 installed successfully."
      ]
    }
  };

  const handleInstall = () => {
    if (isRunning) return;
    setIsRunning(true);
    const item = itemsInfo[activeItem];

    // Add command to log
    setTerminalLogs(prev => [...prev, `${item.installCmd}`]);
    setProgress(0);

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < item.installLogs.length) {
        const nextLog = item.installLogs[currentLogIdx];
        setTerminalLogs(prev => [...prev, nextLog]);
        setProgress(Math.floor((currentLogIdx / item.installLogs.length) * 100));
        currentLogIdx++;
      } else {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setInstalled(prev => ({ ...prev, [activeItem]: true }));
          setTerminalLogs(prev => [...prev, "student@lxc-container-std01:~$ "]);
          setIsRunning(false);
          setProgress(null);
        }, 500);
      }
    }, 200);
  };

  const handleVerify = () => {
    if (isRunning) return;
    setIsRunning(true);
    const item = itemsInfo[activeItem];

    setTerminalLogs(prev => [...prev, `${item.checkCmd}`]);

    setTimeout(() => {
      if (!installed[activeItem]) {
        setTerminalLogs(prev => [
          ...prev,
          `bash: ${item.checkCmd.split(' ')[0]}: command not found`,
          "student@lxc-container-std01:~$ "
        ]);
        setIsRunning(false);
        return;
      }

      setTerminalLogs(prev => [
        ...prev,
        ...item.checkOutput,
        "student@lxc-container-std01:~$ "
      ]);
      setVerified(prev => ({ ...prev, [activeItem]: true }));
      setIsRunning(false);
    }, 800);
  };

  const handleTestRequest = () => {
    if (!installed[activeItem] || !verified[activeItem]) {
      alert("กรุณาติดตั้งและตรวจเช็คสถานะซอฟต์แวร์ให้เสร็จสิ้นก่อนส่งคำขอทดสอบ!");
      return;
    }

    setTestResult("requesting");
    setShowTestWindow(true);

    setTimeout(() => {
      setTestResult("success");
    }, 1500);
  };

  const activeInfo = itemsInfo[activeItem];

  return (
    <div className="slide slide-content slide-stack-installer" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes flow-left-right {
          0% { stroke-dashoffset: 20; opacity: 0.3; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.3; }
        }
        .flow-line {
          stroke-dasharray: 5, 5;
          animation: flow-left-right 1.5s linear infinite;
        }
        .glowing-node {
          filter: drop-shadow(0 0 8px var(--glow-color));
          transition: all 0.3s ease;
        }
      `}} />
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '0', marginTop: '10px' }}>

        {/* Left Column: Stack Selector & Info */}
        <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(Object.keys(itemsInfo) as Array<keyof typeof itemsInfo>).map(key => (
              <button
                key={key}
                onClick={() => {
                  if (!isRunning) {
                    setActiveItem(key);
                    setShowTestWindow(false);
                  }
                }}
                disabled={isRunning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: activeItem === key ? 'var(--accent-dim)' : 'var(--bg-card)',
                  border: activeItem === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                  color: activeItem === key ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                <span style={{ fontSize: '20px' }}>{itemsInfo[key].icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px' }}>{itemsInfo[key].name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{itemsInfo[key].port}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {installed[key] ? (
                    <span style={{ fontSize: '11px', color: '#10b981' }} title="Installed">💿</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.5 }}>⚪</span>
                  )}
                  {verified[key] ? (
                    <span style={{ fontSize: '11px', color: '#10b981' }} title="Active">🟢</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.5 }}>🔴</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            flex: 1,
            overflowY: 'auto'
          }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 'bold' }}>คำอธิบายและหน้าที่:</h4>
            <p style={{ lineHeight: '1.5' }}>{activeInfo.desc}</p>
          </div>
        </div>

        {/* Middle Column: Terminal Sim */}
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            background: '#090d16',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'monospace',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
          }}>
            {/* Terminal Header */}
            <div style={{
              background: '#151f32',
              padding: '6px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              <span>💻 student@std01-container: ~</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              </div>
            </div>

            {/* Terminal Body */}
            <div style={{
              flex: 1,
              padding: '12px',
              fontSize: '11.5px',
              color: '#38bdf8',
              overflowY: 'auto',
              lineHeight: '1.4',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {terminalLogs.map((log, idx) => {
                const isCmd = log.startsWith("sudo ") || log.startsWith("curl ") || log.includes("apt ") || log.includes("-v");
                return (
                  <div key={idx} style={{
                    color: isCmd ? '#f43f5e' : log.includes("active (running)") ? '#4ade80' : log.includes("student@lxc-container") ? '#a855f7' : '#94a3b8',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {log.includes("student@lxc-container") ? "" : isCmd ? "$ " : ""}{log}
                  </div>
                );
              })}
              {progress !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', color: '#eab308' }}>
                  <span>กำลังดาวน์โหลดและติดตั้ง:</span>
                  <div style={{ width: '100px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#eab308' }} />
                  </div>
                  <span>{progress}%</span>
                </div>
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleInstall}
              disabled={isRunning || installed[activeItem]}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                background: installed[activeItem] ? '#10b98122' : 'var(--accent)',
                border: installed[activeItem] ? '1px solid #10b981' : '1px solid var(--accent)',
                color: installed[activeItem] ? '#10b981' : 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: (isRunning || installed[activeItem]) ? 'not-allowed' : 'pointer'
              }}
            >
              {installed[activeItem] ? "✅ ติดตั้งสำเร็จแล้ว" : "🚀 รันคำสั่งติดตั้ง (Install)"}
            </button>
            <button
              onClick={handleVerify}
              disabled={isRunning}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                background: 'var(--bg-card)',
                border: verified[activeItem] ? '1px solid #10b981' : '1px solid var(--border)',
                color: verified[activeItem] ? '#10b981' : 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: isRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {verified[activeItem] ? "🟢 เช็คสถานะ: ทำงานปกติ" : "🔍 รันคำสั่งเช็ค (Verify)"}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Container Topology & Live Test */}
        <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Visual LXC Container */}
            <div style={{
              width: '100%',
              height: '180px',
              border: '2px solid #a855f7',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.03)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px'
            }}>
              <span style={{
                position: 'absolute',
                top: '-10px',
                background: '#a855f7',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '99px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                📦 LXC Container (std01)
              </span>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                IP: <code style={{ color: '#a855f7', fontWeight: 'bold' }}>192.168.10.101</code>
              </div>

              {/* Stack items icons inside container */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: 'auto' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: installed.nginx ? 1 : 0.2,
                  filter: installed.nginx ? 'drop-shadow(0 0 6px #38bdf8)' : 'none',
                  transition: 'all 0.5s ease'
                }}>
                  <span style={{ fontSize: '28px' }}>🌐</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Nginx (Port 80)</span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: installed.mariadb ? 1 : 0.2,
                  filter: installed.mariadb ? 'drop-shadow(0 0 6px #ef4444)' : 'none',
                  transition: 'all 0.5s ease'
                }}>
                  <span style={{ fontSize: '28px' }}>🗄️</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>MariaDB (3306)</span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: installed.nodejs ? 1 : 0.2,
                  filter: installed.nodejs ? 'drop-shadow(0 0 6px #22c55e)' : 'none',
                  transition: 'all 0.5s ease'
                }}>
                  <span style={{ fontSize: '28px' }}>🟢</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Node.js (3000)</span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: installed.git ? 1 : 0.2,
                  filter: installed.git ? 'drop-shadow(0 0 6px #f97316)' : 'none',
                  transition: 'all 0.5s ease'
                }}>
                  <span style={{ fontSize: '28px' }}>🐙</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Git</span>
                </div>
              </div>
            </div>

            {/* Test Request trigger */}
            <button
              onClick={handleTestRequest}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '12px',
                borderRadius: '6px',
                background: '#a855f7',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 10px rgba(168, 85, 247, 0.3)'
              }}
            >
              ⚡ ส่งคำขอทดสอบเว็บ/บริการ (Test Request)
            </button>
          </div>

          {/* Simulated Browser or connection feedback */}
          {showTestWindow && (
            <div style={{
              height: '140px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: '#090d16',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Window Header */}
              <div style={{
                background: '#1e293b',
                padding: '4px 8px',
                fontSize: '9.5px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ display: 'flex', gap: '3px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                </span>
                <span style={{ background: '#0f172a', padding: '1px 8px', borderRadius: '4px', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {activeItem === 'nginx' ? 'http://192.168.10.101/' : activeItem === 'nodejs' ? 'http://192.168.10.101:3000/' : activeItem === 'mariadb' ? 'mariadb-connection://192.168.10.101:3306/' : 'git-repo://'}
                </span>
              </div>

              {/* Window Body */}
              <div style={{ flex: 1, padding: '8px', fontSize: '10px', overflowY: 'auto' }}>
                {testResult === "requesting" ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '20px' }}>⏳</span>
                    <span>กำลังยิงสัญญาณทดสอบระบบเครือข่าย...</span>
                  </div>
                ) : activeItem === 'nginx' ? (
                  <div style={{ background: 'white', color: '#334155', padding: '8px', borderRadius: '4px', height: '100%', fontFamily: 'sans-serif' }}>
                    <h1 style={{ fontSize: '12px', color: '#0f172a', margin: '0 0 4px 0' }}>Welcome to nginx!</h1>
                    <p style={{ fontSize: '8px', margin: '0 0 6px 0' }}>If you see this page, the nginx web server is successfully installed and working in container <strong>std01-nginx</strong>.</p>
                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 6px 0' }} />
                    <div style={{ fontSize: '7px', color: '#64748b' }}><em>Thank you for using nginx.</em></div>
                  </div>
                ) : activeItem === 'nodejs' ? (
                  <div style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: '9px' }}>
                    {"{"}<br />
                    {"  \"status\": \"success\","}<br />
                    {"  \"message\": \"Hello from Express API inside LXC Container!\","}<br />
                    {"  \"port\": 3000,"}<br />
                    {"  \"runtime\": \"Node.js v20.11.0\""}<br />
                    {"}"}
                  </div>
                ) : activeItem === 'mariadb' ? (
                  <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '9.5px' }}>
                    <span style={{ color: '#eab308' }}>MariaDB [(none)]&gt;</span> show databases;<br />
                    +--------------------+<br />
                    | Database           |<br />
                    +--------------------+<br />
                    | information_schema |<br />
                    | mysql              |<br />
                    | performance_schema |<br />
                    | sys                |<br />
                    +--------------------+<br />
                    4 rows in set (0.001 sec)
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '9.5px' }}>
                    $ git status<br />
                    On branch main<br />
                    Your branch is up to date with &apos;origin/main&apos;.<br />
                    nothing to commit, working tree clean
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InteractiveActivitySlide({ s }: { s: SlideData }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [act2Order, setAct2Order] = useState<number[]>([]);
  const [revealedAct3, setRevealedAct3] = useState<boolean>(false);
  const [act5QuestionIdx, setAct5QuestionIdx] = useState<number>(0);
  const [selectedOptionAct5, setSelectedOptionAct5] = useState<string | null>(null);
  const [act6Answers, setAct6Answers] = useState<{ [key: number]: boolean }>({});

  // New Week 3b States
  const [w3bAct1Path, setW3bAct1Path] = useState<string>("/home/student");
  const [w3bAct1Error, setW3bAct1Error] = useState<string | null>(null);
  const [w3bAct2Matches, setW3bAct2Matches] = useState<{ [key: string]: string }>({});
  const [w3bAct2SelectedLeft, setW3bAct2SelectedLeft] = useState<string | null>(null);
  const [w3bAct3Tab, setW3bAct3Tab] = useState<number>(1);

  // Reset states when slide changes
  useEffect(() => {
    setSelectedOption(null);
    setAct2Order([]);
    setRevealedAct3(false);
    setAct5QuestionIdx(0);
    setSelectedOptionAct5(null);
    setAct6Answers({});

    // Reset Week 3b States
    setW3bAct1Path("/home/student");
    setW3bAct1Error(null);
    setW3bAct2Matches({});
    setW3bAct2SelectedLeft(null);
    setW3bAct3Tab(1);
  }, [s.id]);

  const handleAct2Click = (num: number) => {
    if (act2Order.includes(num)) {
      setAct2Order(act2Order.filter(n => n !== num));
    } else {
      if (act2Order.length < 4) {
        setAct2Order([...act2Order, num]);
      }
    }
  };

  const renderAct1 = () => {
    // กิจกรรม 1: วิเคราะห์เหตุการณ์ IP Address ชนกัน
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {/* Top visual graphic of the clash */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          background: 'rgba(239, 68, 68, 0.03)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px dashed #ef4444',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Computer A */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '42px' }}>💻</span>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>เครื่องคอมพิวเตอร์ A</div>
            <div style={{ background: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
              IP: 192.168.1.10
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '24px' }}>🎛️</span>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Switch</div>
            <div style={{ fontSize: '18px', animation: 'pulse-box 1s infinite', color: '#ef4444', fontWeight: 'bold', textShadow: '0 0 8px rgba(239,68,68,0.3)' }}>
              💥 IP Conflict! 💥
            </div>
          </div>

          {/* Computer B */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '42px' }}>💻</span>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>เครื่องคอมพิวเตอร์ B</div>
            <div style={{ background: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
              IP: 192.168.1.10
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-primary)', lineHeight: '1.4' }}>
          หากเครื่องคอมพิวเตอร์ 2 เครื่องในวงแลนเดียวกัน ได้รับการตั้งหมายเลข IP Address เดียวกัน (เช่น 192.168.1.10) พร้อมกัน จะเกิดอะไรขึ้น?
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { key: 'A', text: 'ก) คอมพิวเตอร์ทั้งสองเครื่องสามารถใช้งานและแชร์ข้อมูลกันได้ตามปกติ', isCorrect: false },
            { key: 'B', text: 'ข) เกิดปัญหา IP Address ชนกัน (IP Conflict) ทำให้ไม่สามารถสื่อสารในเครือข่ายได้', isCorrect: true },
            { key: 'C', text: 'ค) ระบบเครือข่ายจะปิดเครื่องคอมพิวเตอร์เครื่องที่สองโดยอัตโนมัติ', isCorrect: false }
          ].map(opt => {
            const isSelected = selectedOption === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedOption(opt.key)}
                style={{
                  background: isSelected ? (opt.isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)') : 'var(--bg-elevated)',
                  border: isSelected ? (opt.isCorrect ? '2px solid #22c55e' : '2px solid #ef4444') : '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Feedback Panel */}
        {selectedOption && (
          <div className="animate-fade-in-box" style={{
            background: selectedOption === 'B' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: selectedOption === 'B' ? '1px solid #22c55e' : '1px solid #ef4444',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {selectedOption === 'B' ? (
              <span style={{ color: '#22c55e' }}>ถูกต้อง! 🎉 เมื่อ IP Address ชนกัน (IP Conflict) จะทำให้อุปกรณ์สับสน ส่งข้อมูลไม่ถูกเครื่อง และไม่สามารถเชื่อมต่อสื่อสารในเครือข่ายได้!</span>
            ) : (
              <span style={{ color: '#ef4444' }}>ยังไม่ถูกใจครับ! ลองพิจารณาผลกระทบด้านความขัดแย้งของหมายเลขที่ระบุปลายทางดูอีกทีนะ</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAct2 = () => {
    // กิจกรรม 2: เรียงลำดับ DORA Challenge
    const items = [
      { id: 1, name: 'Request (ขอยืนยันใช้ IP)' },
      { id: 2, name: 'Discover (ค้นหาเซิร์ฟเวอร์)' },
      { id: 3, name: 'Acknowledge (อนุมัติส่งมอบ)' },
      { id: 4, name: 'Offer (เสนอหมายเลข IP)' }
    ];

    const isCorrectOrder = act2Order.length === 4 && act2Order[0] === 2 && act2Order[1] === 4 && act2Order[2] === 1 && act2Order[3] === 3;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
          เรียงลำดับกระบวนการ DORA ของ DHCP ให้ถูกต้อง!
        </div>

        {/* The block buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {items.map(item => {
            const index = act2Order.indexOf(item.id);
            const isSelected = index !== -1;
            return (
              <button
                key={item.id}
                onClick={() => handleAct2Click(item.id)}
                style={{
                  background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{item.name}</span>
                {isSelected && (
                  <span style={{
                    background: 'white',
                    color: 'var(--accent)',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Order Display */}
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px dashed var(--border)',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {act2Order.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>คลิกเลือกบล็อกด้านบนตามลำดับ...</span>
          ) : (
            act2Order.map((id, idx) => {
              const item = items.find(it => it.id === id);
              return (
                <React.Fragment key={id}>
                  {idx > 0 && <span style={{ color: 'var(--text-secondary)' }}>➔</span>}
                  <span style={{
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {item?.name.split(' ')[0]}
                  </span>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Controls and Feedback */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setAct2Order([])}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '6px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            ล้างลำดับ
          </button>

          <button
            onClick={() => setAct2Order([2, 4, 1, 3])}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '6px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            เฉลยลำดับ
          </button>
        </div>

        {act2Order.length === 4 && (
          <div className="animate-fade-in-box" style={{
            background: isCorrectOrder ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: isCorrectOrder ? '1px solid #22c55e' : '1px solid #ef4444',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '13px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {isCorrectOrder ? (
              <span style={{ color: '#22c55e' }}>ถูกต้อง! 🎉 ลำดับ D-O-R-A: Discover ➔ Offer ➔ Request ➔ Acknowledge</span>
            ) : (
              <span style={{ color: '#ef4444' }}>ลำดับยังไม่ถูกต้องครับ! ลองสะกดเป็นคำว่า D-O-R-A นะครับ</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAct3 = () => {
    // กิจกรรม 3: จับคู่คำศัพท์การตั้งค่า DHCP
    const pairs = [
      { num: 1, desc: '1. ระยะเวลาที่เครื่อง Client ได้รับสิทธิ์อนุญาตให้ครอบครองและใช้งาน IP Address นั้นๆ', term: 'Lease Time (อายุสัญญาเช่า)', color: '#3b82f6' },
      { num: 2, desc: '2. การจับคู่ผูกหมายเลข IP Address ไว้กับ MAC Address ของอุปกรณ์เป็นการถาวร', term: 'Reservations (การจอง IP ถาวร)', color: '#10b981' },
      { num: 3, desc: '3. ขอบเขตช่วงหมายเลข IP Address (IP Range) ทั้งหมดที่เซิร์ฟเวอร์มีสิทธิ์แจกจ่ายได้', term: 'Scope (ช่วงของ IP ที่แจกได้)', color: '#f59e0b' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-primary)', lineHeight: '1.4' }}>
          วิเคราะห์คำจำกัดความเชิงระบบและจับคู่กับการตั้งค่า DHCP ที่ถูกต้อง
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pairs.map(p => (
            <div key={p.num} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', lineHeight: '1.4', color: 'var(--text-primary)' }}>{p.desc}</div>
              {revealedAct3 ? (
                <div className="animate-fade-in-box" style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderLeft: `4px solid ${p.color}`,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: p.color
                }}>
                  ➔ คำเฉลย: {p.term}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  (รอเปิดเฉลยด้านล่าง)
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setRevealedAct3(!revealedAct3)}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 2px 8px var(--accent-dim)'
            }}
          >
            {revealedAct3 ? 'ซ่อนเฉลยจับคู่' : 'เปิดดูเฉลยจับคู่'}
          </button>
        </div>
      </div>
    );
  };

  const renderAct4 = () => {
    // กิจกรรม 4: ความท้าทายไร้สมุดรายชื่อ
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {/* Visual Vintage Phone Card */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          background: 'var(--bg-elevated)',
          padding: '18px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '48px', animation: 'pulse-box 1.5s infinite' }}>📞</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>สมุดเบอร์โทรศัพท์มือถือหายเกลี้ยง!</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>คุณต้องโทรหาเพื่อน 5 คนแบบจำเบอร์ไม่ได้</div>
          </div>
        </div>

        <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
          ถ้านักศึกษาต้องกดเบอร์เพื่อน 5 คนโดยไม่มีระบบช่วยบันทึก จะกดถูกในครั้งแรกหรือไม่?
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setSelectedOption('A')}
            style={{
              flex: 1,
              background: selectedOption === 'A' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-elevated)',
              border: selectedOption === 'A' ? '2px solid #ef4444' : '1px solid var(--border)',
              borderRadius: '10px',
              padding: '15px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ก) จำได้และกดถูกหมดแน่นอน
          </button>
          <button
            onClick={() => setSelectedOption('B')}
            style={{
              flex: 1,
              background: selectedOption === 'B' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-elevated)',
              border: selectedOption === 'B' ? '2px solid #22c55e' : '1px solid var(--border)',
              borderRadius: '10px',
              padding: '15px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ข) จำไม่ได้เลย หรือสับสนสลับเบอร์
          </button>
        </div>

        {selectedOption && (
          <div className="animate-fade-in-box" style={{
            background: 'var(--bg-elevated)',
            borderLeft: '4px solid var(--accent)',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            lineHeight: '1.4'
          }}>
            {selectedOption === 'B' ? (
              <span><strong>ถูกต้องครับ! 🎉</strong> มนุษย์ไม่ถนัดจำตัวเลขยาวๆ จึงเป็นเหตุผลที่ระบบอินเทอร์เน็ตต้องการ <strong>DNS</strong> เพื่อแปลงชื่อโดเมนจำง่าย (สมุดโทรศัพท์) ไปเป็น IP Address (เบอร์โทร) นั่นเองครับ!</span>
            ) : (
              <span><strong>คุณอาจจะมีความจำที่เก่งมาก! 🧠</strong> แต่ในระบบส่วนใหญ่ นักเรียนจะพบว่า ข) คือความจริง นี่คือความสำคัญอันยิ่งใหญ่ของระบบ DNS ครับ!</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAct5 = () => {
    // กิจกรรม 5: วิเคราะห์ประเภทของ DNS Server (ตอบทีละข้อ)
    const questions = [
      {
        id: 1,
        title: 'คำถามข้อที่ 1: ผู้สืบค้นข้อมูลแทนเครื่อง Client',
        q: 'เครื่อง DNS Server ใดที่คอยให้บริการเครื่องลูกข่าย (Client) โดยทำหน้าที่วิ่งออกไปสืบค้นหาคำตอบจากลำดับชั้นของ DNS ต่างๆ แทนเครื่องคอมพิวเตอร์ของเราจนสำเร็จ?',
        options: [
          { key: 'A', text: 'ก) Authoritative DNS Server', isCorrect: false },
          { key: 'B', text: 'ข) Recursive DNS Server (ผู้สืบค้นแทน)', isCorrect: true }
        ],
        explCorrect: 'ถูกต้อง! 🎉 Recursive DNS Server (เช่น 8.8.8.8) จะรับหน้าที่เป็นตัวกลางในการวิ่งไล่ถามโฮสต์ตามระดับชั้นต่างๆ แทนเครื่อง Client จนกว่าจะได้ IP ส่งกลับมา!',
        explWrong: 'ยังไม่ถูกต้องครับ! ลองพิจารณาบทบาทการเป็นผู้สืบค้นข้อมูลแทน (เหมือนคนวิ่งค้นหาหนังสือในห้องสมุดให้เรา) อีกครั้งนะ'
      },
      {
        id: 2,
        title: 'คำถามข้อที่ 2: ผู้ถือเอกสารข้อมูลต้นฉบับจริง',
        q: 'เครื่อง DNS Server ใดทำหน้าที่จัดเก็บระเบียนข้อมูลจริง (DNS Records) ของชื่อโดเมนนั้นๆ และเป็นผู้มีสิทธิ์ขาดในการให้คำตอบของ IP Address ปลายทางตัวจริงอย่างเป็นทางการ?',
        options: [
          { key: 'A', text: 'ก) Authoritative DNS Server (ผู้ถือสิทธิ์ข้อมูลหลัก)', isCorrect: true },
          { key: 'B', text: 'ข) Recursive DNS Server', isCorrect: false }
        ],
        explCorrect: 'ถูกต้อง! 🎉 Authoritative DNS Server เป็นเซิร์ฟเวอร์ที่เก็บฐานข้อมูลจริงของชื่อโดเมนตัวจริง (เช่น Name Server ของโฮสติ้ง) และมีสิทธิ์ขาดในการตอบ IP ปลายทาง!',
        explWrong: 'ยังไม่ถูกต้องครับ! ลองพิจารณาบทบาทการเป็นผู้ถือครองสิทธิ์และเป็นเจ้าของทะเบียนต้นฉบับข้อมูลจริงดูอีกครั้งนะ'
      }
    ];

    const currentQ = questions[act5QuestionIdx];
    const isAnswered = selectedOptionAct5 !== null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
        {/* Quiz Progress header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '8px 15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>
            ⚡ บทเรียนทีละข้อ: ประเภท DNS Server
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            ข้อที่ {act5QuestionIdx + 1} / 2
          </span>
        </div>

        {/* Question Panel */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>
            {currentQ.title}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.4', color: 'var(--text-primary)' }}>
            {currentQ.q}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentQ.options.map(opt => {
            const isSelected = selectedOptionAct5 === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  if (!isAnswered) setSelectedOptionAct5(opt.key);
                }}
                disabled={isAnswered}
                style={{
                  background: isSelected ? (opt.isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)') : 'var(--bg-elevated)',
                  border: isSelected ? (opt.isCorrect ? '2px solid #22c55e' : '2px solid #ef4444') : '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px 18px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: 'var(--text-primary)',
                  cursor: isAnswered ? 'default' : 'pointer',
                  opacity: (isAnswered && !isSelected) ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Feedback Panel */}
        {isAnswered && (
          <div className="animate-fade-in-box" style={{
            background: currentQ.options.find(o => o.key === selectedOptionAct5)?.isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: currentQ.options.find(o => o.key === selectedOptionAct5)?.isCorrect ? '1px solid #22c55e' : '1px solid #ef4444',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.4',
            textAlign: 'center',
            fontWeight: 'bold',
            color: currentQ.options.find(o => o.key === selectedOptionAct5)?.isCorrect ? '#22c55e' : '#ef4444'
          }}>
            {currentQ.options.find(o => o.key === selectedOptionAct5)?.isCorrect ? currentQ.explCorrect : currentQ.explWrong}
          </div>
        )}

        {/* Navigation Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
          <button
            onClick={() => {
              setSelectedOptionAct5(null);
            }}
            disabled={!isAnswered}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: isAnswered ? 'pointer' : 'default',
              fontSize: '12px',
              fontWeight: 'bold',
              opacity: isAnswered ? 1 : 0.5
            }}
          >
            ทำใหม่ในข้อนี้
          </button>

          {isAnswered && act5QuestionIdx === 0 && (
            <button
              onClick={() => {
                setAct5QuestionIdx(1);
                setSelectedOptionAct5(null);
              }}
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px var(--accent-dim)'
              }}
            >
              ทำคำถามข้อที่ 2 ➔
            </button>
          )}

          {act5QuestionIdx === 1 && (
            <button
              onClick={() => {
                setAct5QuestionIdx(0);
                setSelectedOptionAct5(null);
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ⬅ ย้อนกลับไปข้อที่ 1
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAct6 = () => {
    // กิจกรรม 6: จริงหรือเท็จ True or False
    const questions = [
      { id: 1, text: '1. ในวงแลนเดียวกัน ควรมี DHCP Server เปิดพร้อมกันหลายตัว', answer: false, expl: 'ผิด: ควรมีตัวเดียวเลี่ยงปัญหา IP ชนกัน (IP Conflict)' },
      { id: 2, text: '2. DHCP แจกเฉพาะหมายเลข IP Address เท่านั้น ไม่บอกอย่างอื่น', answer: false, expl: 'ผิด: แจกข้อมูลคู่มาเป็นชุด เช่น Subnet, Gateway, DNS Server' },
      { id: 3, text: '3. CNAME Record ใช้สำหรับสร้างชื่อเล่นหรือชี้โดเมนไปยังอีกโดเมน', answer: true, expl: 'ถูก: ใช้สร้าง alias เช่น ชี้ www.google.com ไปที่ google.com' },
      { id: 4, text: '4. หาก DNS Server ล่ม เรายังคงพิมพ์เลข IP ตรงๆ เพื่อเข้าเว็บได้', answer: true, expl: 'ถูก: สายสัญญาณไม่ขาด สื่อสาร IP ยังได้ แค่แปลงชื่อเว็บไม่ได้' }
    ];

    const handleAct6Click = (id: number, val: boolean) => {
      setAct6Answers({ ...act6Answers, [id]: val });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', height: '100%' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
          วิเคราะห์คำถาม ถูก-ผิด (True or False Challenge)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          {questions.map(q => {
            const userAns = act6Answers[q.id];
            const hasAns = userAns !== undefined;
            const isCorrect = hasAns && userAns === q.answer;

            return (
              <div key={q.id} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', lineHeight: '1.3' }}>{q.text}</span>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleAct6Click(q.id, true)}
                      style={{
                        background: userAns === true ? '#22c55e' : 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: userAns === true ? 'white' : 'var(--text-primary)',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ถูก
                    </button>
                    <button
                      onClick={() => handleAct6Click(q.id, false)}
                      style={{
                        background: userAns === false ? '#ef4444' : 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: userAns === false ? 'white' : 'var(--text-primary)',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ผิด
                    </button>
                  </div>
                </div>

                {hasAns && (
                  <div className="animate-fade-in-box" style={{
                    background: isCorrect ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    color: isCorrect ? '#22c55e' : '#ef4444',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {isCorrect ? `🎯 ถูกต้องครับ! ${q.expl}` : `❌ ยังไม่ถูกใจครับ! ${q.expl}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderW3bAct1 = () => {
    const handleW3bAct1Cmd = (cmd: string) => {
      setW3bAct1Error(null);
      if (cmd === "cd /var/log") {
        setW3bAct1Path("/var/log");
      } else if (cmd === "cd /") {
        setW3bAct1Path("/");
      } else if (cmd === "cd ..") {
        if (w3bAct1Path === "/home/student") {
          setW3bAct1Path("/home");
        } else if (w3bAct1Path === "/home") {
          setW3bAct1Path("/");
        } else if (w3bAct1Path === "/var/log") {
          setW3bAct1Path("/var");
        } else if (w3bAct1Path === "/var") {
          setW3bAct1Path("/");
        }
      } else if (cmd === "cd home") {
        if (w3bAct1Path === "/") {
          setW3bAct1Path("/home");
        } else {
          setW3bAct1Error("bash: cd: home: No such file or directory");
        }
      } else if (cmd === "cd student") {
        if (w3bAct1Path === "/home") {
          setW3bAct1Path("/home/student");
        } else {
          setW3bAct1Error("bash: cd: student: No such file or directory");
        }
      } else if (cmd === "cd var") {
        if (w3bAct1Path === "/") {
          setW3bAct1Path("/var");
        } else {
          setW3bAct1Error("bash: cd: var: No such file or directory");
        }
      } else if (cmd === "cd log") {
        if (w3bAct1Path === "/var") {
          setW3bAct1Path("/var/log");
        } else {
          setW3bAct1Error("bash: cd: log: No such file or directory");
        }
      }
    };

    const isSuccess = w3bAct1Path === "/var/log";

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-primary)' }}>
          ภารกิจ: ย้ายตำแหน่งจาก <span style={{ color: 'var(--accent)' }}>/home/student</span> ไปยังเป้าหมาย <span style={{ color: '#22c55e' }}>/var/log</span>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {/* Terminal Simulator */}
          <div style={{
            flex: 1.2,
            minWidth: '280px',
            background: '#0c1017',
            border: '1px solid #30363d',
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#e6edf3',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            {/* Header bar */}
            <div style={{ background: '#161b22', padding: '8px 12px', borderBottom: '1px solid #30363d', display: 'flex', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
              <span style={{ marginLeft: '10px', color: '#8b949e', fontSize: '10px' }}>Terminal - student@ubuntu-server</span>
            </div>
            {/* Content area */}
            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '140px' }}>
              <div>student@ubuntu-server:~$ pwd</div>
              <div style={{ color: '#8b949e' }}>/home/student</div>

              {w3bAct1Path !== "/home/student" && (
                <>
                  <div>student@ubuntu-server:~$ cd ...</div>
                  <div>student@ubuntu-server:~$ pwd</div>
                  <div style={{ color: '#58a6ff', fontWeight: 'bold' }}>{w3bAct1Path}</div>
                </>
              )}

              {w3bAct1Error && (
                <div style={{ color: '#f85149' }}>{w3bAct1Error}</div>
              )}

              {isSuccess ? (
                <div style={{ color: '#3fb950', marginTop: '8px', borderTop: '1px dashed #30363d', paddingTop: '8px' }}>
                  🎯 ยอดเยี่ยม! ย้ายตำแหน่งไปถึง /var/log สำเร็จแล้ว
                </div>
              ) : (
                <div style={{ color: '#8b949e', borderTop: '1px dashed #30363d', paddingTop: '8px', animation: 'pulse-box 1.5s infinite' }}>
                  พิมพ์คำสั่ง cd เพื่อเดินทาง... (ตำแหน่งปัจจุบัน: {w3bAct1Path})
                </div>
              )}
            </div>
          </div>

          {/* Directory Map */}
          <div style={{
            flex: 0.8,
            minWidth: '180px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>แผนผังต้นไม้ (Directory Tree)</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              <div>/ (root)</div>
              <div>├── home/</div>
              <div style={{ color: w3bAct1Path === '/home/student' ? 'var(--accent)' : 'inherit', fontWeight: w3bAct1Path === '/home/student' ? 'bold' : 'normal' }}>
                │   └── student/ {w3bAct1Path === '/home/student' && '◀'}
              </div>
              <div>├── var/</div>
              <div style={{ color: w3bAct1Path === '/var/log' ? '#22c55e' : 'inherit', fontWeight: w3bAct1Path === '/var/log' ? 'bold' : 'normal' }}>
                │   └── log/ 🎯 {w3bAct1Path === '/var/log' && '◀'}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>เลือกคำสั่งเพื่อเดินทาง:</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'cd .. (ขึ้น 1 ระดับ)', cmd: 'cd ..' },
              { label: 'cd / (กลับ root)', cmd: 'cd /' },
              { label: 'cd home (เข้า home)', cmd: 'cd home' },
              { label: 'cd student (เข้า student)', cmd: 'cd student' },
              { label: 'cd var (เข้า var)', cmd: 'cd var' },
              { label: 'cd log (เข้า log)', cmd: 'cd log' },
              { label: 'cd /var/log (พิกัดสมบูรณ์)', cmd: 'cd /var/log' }
            ].map((opt, i) => (
              <button
                key={i}
                disabled={isSuccess}
                onClick={() => handleW3bAct1Cmd(opt.cmd)}
                style={{
                  background: isSuccess ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: isSuccess ? 'var(--text-secondary)' : 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: isSuccess ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isSuccess && (
          <div className="animate-fade-in-box" style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            lineHeight: '1.4'
          }}>
            <strong>คำอธิบายสรุป:</strong> คุณสามารถย้ายไดเรกทอรีได้ 2 วิธี คือ
            (1) <strong>Absolute Path (พิกัดสมบูรณ์):</strong> ใช้ <code>cd /var/log</code> เพื่อข้ามไปยังจุดหมายทันที
            หรือ (2) <strong>Relative Path (พิกัดสัมพัทธ์):</strong> ถอยกลับไปยัง root ก่อนด้วย <code>cd ..</code> และ <code>cd ..</code> จากนั้นค่อยเดินต่อไปยัง <code>cd var</code> และ <code>cd log</code> ครับ
          </div>
        )}
      </div>
    );
  };

  const renderW3bAct2 = () => {
    const leftOptions = [
      { key: "la", text: "-la (ตัวเลือกใน ls)" },
      { key: "r", text: "-r (ตัวเลือกใน rm)" },
      { key: "ctrlO", text: "Ctrl+O (ใน nano)" },
      { key: "ctrlX", text: "Ctrl+X (ใน nano)" }
    ];

    const rightOptions = [
      { key: "r_desc", text: "ลบไดเรกทอรีและไฟล์ย่อยทั้งหมดแบบเรียกซ้ำ (Recursive)" },
      { key: "la_desc", text: "แสดงรายละเอียดสิทธิ์ ขนาด วันที่ และแสดงไฟล์ที่ซ่อนอยู่" },
      { key: "ctrlX_desc", text: "ออกจากหน้าต่างโปรแกรมแก้ไขข้อความ nano" },
      { key: "ctrlO_desc", text: "บันทึกข้อมูล/เขียนข้อความลงไฟล์ใน nano" }
    ];

    const matchesMap: { [key: string]: string } = {
      "la": "la_desc",
      "r": "r_desc",
      "ctrlO": "ctrlO_desc",
      "ctrlX": "ctrlX_desc"
    };

    const handleLeftClick = (key: string) => {
      if (w3bAct2Matches[key]) return;
      setW3bAct2SelectedLeft(key);
    };

    const handleRightClick = (rightKey: string) => {
      if (!w3bAct2SelectedLeft) return;
      const expectedRight = matchesMap[w3bAct2SelectedLeft];
      if (expectedRight === rightKey) {
        setW3bAct2Matches({
          ...w3bAct2Matches,
          [w3bAct2SelectedLeft]: rightKey
        });
        setW3bAct2SelectedLeft(null);
      } else {
        setW3bAct2SelectedLeft(null);
      }
    };

    const totalMatches = Object.keys(w3bAct2Matches).length;
    const isCompleted = totalMatches === 4;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', textAlign: 'center' }}>
          จับคู่ตัวเลือกเสริม (Options) และปุ่มลัดควบคุมให้ตรงกับหน้างานปฏิบัติ
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Left Columns - Keys */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>ตัวเลือกเสริม / ปุ่มลัด:</div>
            {leftOptions.map(opt => {
              const isMatched = !!w3bAct2Matches[opt.key];
              const isSelected = w3bAct2SelectedLeft === opt.key;
              return (
                <button
                  key={opt.key}
                  disabled={isMatched}
                  onClick={() => handleLeftClick(opt.key)}
                  style={{
                    background: isMatched ? 'rgba(34, 197, 94, 0.08)' : (isSelected ? 'var(--accent-dim)' : 'var(--bg-card)'),
                    border: isMatched ? '2px solid #22c55e' : (isSelected ? '2px solid var(--accent)' : '1px solid var(--border)'),
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: isMatched ? '#22c55e' : 'var(--text-primary)',
                    cursor: isMatched ? 'default' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isMatched ? '✓ ' : ''}{opt.text}
                </button>
              );
            })}
          </div>

          {/* Right Columns - Descriptions */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>หน้าที่การทำงาน:</div>
            {rightOptions.map(opt => {
              const matchedKey = Object.keys(w3bAct2Matches).find(k => w3bAct2Matches[k] === opt.key);
              const isMatched = !!matchedKey;
              const canClick = !!w3bAct2SelectedLeft;
              return (
                <button
                  key={opt.key}
                  disabled={isMatched || !canClick}
                  onClick={() => handleRightClick(opt.key)}
                  style={{
                    background: isMatched ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-card)',
                    border: isMatched ? '2px solid #22c55e' : (canClick ? '1px dashed var(--accent)' : '1px solid var(--border)'),
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px',
                    color: isMatched ? '#22c55e' : 'var(--text-primary)',
                    cursor: isMatched ? 'default' : (canClick ? 'pointer' : 'not-allowed'),
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isMatched ? '✓ ' : ''}{opt.text}
                </button>
              );
            })}
          </div>
        </div>

        {isCompleted && (
          <div className="animate-fade-in-box" style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            textAlign: 'center',
            color: '#22c55e',
            fontWeight: 'bold'
          }}>
            🎉 ยอดเยี่ยม! ทบทวนเรื่องตัวเลือกเสริมของคำสั่งจัดการไฟล์และปุ่มควบคุม nano สำเร็จ
          </div>
        )}
      </div>
    );
  };

  const renderW3bAct3 = () => {
    const tabs = [
      { id: 1, title: '1. ปัญหาคำสั่ง cd..' },
      { id: 2, title: '2. ปัญหาโฟลเดอร์เว้นวรรก' },
      { id: 3, title: '3. ปัญหาการลบ rm' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', textAlign: 'center' }}>
          คลินิกแก้ไขจุดผิดพลาดลินุกซ์ที่พบบ่อย (CLI Troubleshooting Clinic)
        </div>

        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setW3bAct3Tab(tab.id)}
              style={{
                flex: 1,
                background: w3bAct3Tab === tab.id ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                borderBottom: w3bAct3Tab === tab.id ? '2px solid var(--accent)' : 'none',
                color: w3bAct3Tab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                padding: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {w3bAct3Tab === 1 && (
          <div className="animate-fade-in-box" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff5f56' }}>สถานการณ์ข้อผิดพลาด: พิมพ์ cd.. แล้วไม่ทำงาน</div>

            <div style={{ background: '#0c1017', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e6edf3', border: '1px solid #30363d' }}>
              <div>student@ubuntu-server:~$ cd..</div>
              <div style={{ color: '#f85149' }}>-bash: cd..: command not found</div>
            </div>

            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <strong>สาเหตุของปัญหา:</strong> ลินุกซ์ต้องการการแยกวิเคราะห์คำสั่งด้วย
              <strong>เครื่องหมายเว้นวรรค (Space)</strong> อย่างเคร่งครัด ระบบจะมองคำว่า <code>cd..</code> เป็นชื่อคำสั่งใหม่ทั้งหมด
              ซึ่งไม่มีคำสั่งชื่อนี้ในระบบปฏิบัติการ (แตกต่างจาก Windows ที่อนุโลมให้พิมพ์ติดกันได้)
            </div>

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#27c93f', marginTop: '5px' }}>วิธีพิมพ์ที่ถูกต้อง:</div>

            <div style={{ background: '#0c1017', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e6edf3', border: '1px solid #30363d' }}>
              <div>student@ubuntu-server:~$ cd ..</div>
              <div>student@ubuntu-server:/home$ </div>
            </div>
          </div>
        )}

        {w3bAct3Tab === 2 && (
          <div className="animate-fade-in-box" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff5f56' }}>สถานการณ์ข้อผิดพลาด: ตั้งชื่อโฟลเดอร์เว้นวรรคแล้วได้โฟลเดอร์แยกกัน</div>

            <div style={{ background: '#0c1017', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e6edf3', border: '1px solid #30363d' }}>
              <div>student@ubuntu-server:~$ mkdir my labs</div>
              <div>student@ubuntu-server:~$ ls</div>
              <div style={{ color: '#58a6ff', fontWeight: 'bold' }}>labs  my</div>
            </div>

            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <strong>สาเหตุของปัญหา:</strong> คำสั่ง <code>mkdir</code> มองช่องว่างเว้นวรรคเป็นตัวแบ่งตัวแปรเป้าหมาย (Arguments)
              ทำให้ระบุเป้าหมายกลายเป็นสร้าง 2 โฟลเดอร์แยกขาดจากกัน (คือ โฟลเดอร์ชื่อ my และ โฟลเดอร์ชื่อ labs)
            </div>

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#27c93f', marginTop: '5px' }}>วิธีพิมพ์ที่ถูกต้อง (ครอบด้วยอัญประกาศหรือใช้ขีดล่าง):</div>

            <div style={{ background: '#0c1017', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e6edf3', border: '1px solid #30363d' }}>
              <div>student@ubuntu-server:~$ mkdir "my labs"</div>
              <div># หรือใช้ขีดล่าง: mkdir my_labs</div>
            </div>
          </div>
        )}

        {w3bAct3Tab === 3 && (
          <div className="animate-fade-in-box" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff5f56' }}>สถานการณ์ข้อผิดพลาด: สั่งลบโฟลเดอร์แต่ขึ้นเตือนว่า Is a directory</div>

            <div style={{ background: '#0c1017', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e6edf3', border: '1px solid #30363d' }}>
              <div>student@ubuntu-server:~$ rm my_labs</div>
              <div style={{ color: '#f85149' }}>rm: cannot remove 'my_labs': Is a directory</div>
            </div>

            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <strong>สาเหตุของปัญหา:</strong> คำสั่ง <code>rm</code> ตัวปกติใช้สำหรับทำลายไฟล์เดี่ยวๆ เท่านั้น
              และเพื่อความปลอดภัยระดับแกนระบบ ลินุกซ์จะไม่ยอมให้ลบโฟลเดอร์/ไดเรกทอรีแบบลอยๆ เพราะอาจมีโครงสร้างไฟล์ซับซ้อนด้านใน
            </div>

            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#27c93f', marginTop: '5px' }}>วิธีพิมพ์ที่ถูกต้อง (ใช้ออปชัน -r ย่อมาจาก recursive เพื่อสั่งลบซ้ำลึกเข้าไปข้างใน):</div>

            <div style={{ background: '#0c1017', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e6edf3', border: '1px solid #30363d' }}>
              <div>student@ubuntu-server:~$ rm -r my_labs</div>
              <div>student@ubuntu-server:~$ </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderW3bCommandQuiz = () => {
    if (!s.question || !s.options) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          borderLeft: '4px solid var(--accent)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>❓ คำถามประเมินความเข้าใจ</span>
          </h3>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
            {s.question}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {s.options.map((opt, i) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === s.answer;
            let optStyle: React.CSSProperties = {
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              fontSize: '13px'
            };

            if (selectedOption !== null) {
              if (isCorrect) {
                optStyle = {
                  ...optStyle,
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid #22c55e',
                  color: '#22c55e',
                  fontWeight: 'bold'
                };
              } else if (isSelected) {
                optStyle = {
                  ...optStyle,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  fontWeight: 'bold'
                };
              } else {
                optStyle = {
                  ...optStyle,
                  opacity: 0.5
                };
              }
            }

            return (
              <div
                key={i}
                style={optStyle}
                onClick={() => {
                  if (selectedOption === null) {
                    setSelectedOption(opt);
                  }
                }}
              >
                <span>{opt}</span>
                {selectedOption !== null && (
                  isCorrect ? (
                    <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold' }}>✓ ถูกต้อง</span>
                  ) : isSelected ? (
                    <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>✗ ผิดพลาด</span>
                  ) : null
                )}
              </div>
            );
          })}
        </div>

        {selectedOption !== null && s.explanation && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginTop: '8px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              💡 คำอธิบายเพิ่มเติม
            </span>
            <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              {s.explanation}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGenericQuiz = () => {
    if (!s.question || !s.options) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '20px', borderLeft: '4px solid var(--accent)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            ❓ คำถามประเมินความเข้าใจ
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
            {s.question}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {s.options.map((opt: string, i: number) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === s.answer;
            const hasAnswered = selectedOption !== null;
            const letters = ['ก', 'ข', 'ค', 'ง', 'จ'];
            let bg = 'var(--bg-card)', border = '1px solid var(--border)', color = 'var(--text-primary)';
            let suffix: React.ReactNode = null;
            if (hasAnswered) {
              if (isCorrect) { bg = 'rgba(34,197,94,0.10)'; border = '2px solid #22c55e'; color = '#22c55e'; suffix = <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold' }}>✓ ถูกต้อง</span>; }
              else if (isSelected) { bg = 'rgba(239,68,68,0.10)'; border = '2px solid #ef4444'; color = '#ef4444'; suffix = <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>✗ ผิด</span>; }
            }
            return (
              <div key={i} onClick={() => { if (!hasAnswered) setSelectedOption(opt); }} style={{
                background: bg, border, borderRadius: '10px', padding: '13px 18px',
                cursor: hasAnswered ? 'default' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', transition: 'all 0.2s ease', fontSize: '13px', color,
                fontWeight: (hasAnswered && (isCorrect || isSelected)) ? 'bold' : 'normal'
              }}>
                <span><span style={{ fontWeight: 'bold', marginRight: '8px', opacity: 0.5 }}>{letters[i]})</span>{opt}</span>
                {suffix}
              </div>
            );
          })}
        </div>
        {selectedOption !== null && s.explanation && (
          <div style={{
            background: selectedOption === s.answer ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${selectedOption === s.answer ? '#22c55e' : '#ef4444'}`,
            borderRadius: '10px', padding: '14px 18px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>💡 คำอธิบาย</div>
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)' }}>{s.explanation}</div>
          </div>
        )}
        {selectedOption !== null && selectedOption !== s.answer && (
          <button onClick={() => setSelectedOption(null)} style={{
            alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
          }}>🔄 ลองใหม่</button>
        )}
      </div>
    );
  };

  return (
    <div className="slide slide-content slide-interactive-act" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>

      <div style={{ display: 'flex', gap: '30px', flex: 1, overflow: 'visible', marginTop: '10px', minHeight: '0' }}>
        {/* Left Column: Speaker Instruction / Notes */}
        <div style={{ flex: 0.8, minWidth: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto', maxHeight: '100%' }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '15px',
            borderRadius: '10px',
            borderLeft: '4px solid var(--accent)',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>💡 คำแนะนำสำหรับผู้สอน:</strong>
            <div style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
              สไลด์หน้านี้เป็นระบบกราฟิกแบบโต้ตอบออนไลน์ คุณครูสามารถใช้ประกอบกิจกรรมการเรียนการสอนสดได้ดังนี้:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
                <span>ให้นักเรียนส่งคำตอบเข้ามาในช่องแชทออนไลน์</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
                <span>ผู้สอนกดแสดงผลแผงวงจรคำเฉลย/คลิกโต้ตอบบนหน้าจอพร้อมกันสดๆ</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
                <span>อภิปรายและอธิบายเหตุผลหลักการเบื้องหลังเพื่อเช็คความรู้</span>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            opacity: 0.6,
            marginTop: '12px'
          }}>
            ระบบโต้ตอบกราฟิก | วิชา ระบบปฏิบัติการเครื่องแม่ข่าย
          </div>
        </div>

        {/* Right Column: Dynamic Graphic Activity Board */}
        <div style={{
          flex: 1.2,
          background: 'var(--bg-elevated)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          overflowY: 'auto',
          maxHeight: '100%'
        }}>
          {s.id === 'w3a-act1' && renderAct1()}
          {s.id === 'w3a-act2' && renderAct2()}
          {s.id === 'w3a-act3' && renderAct3()}
          {s.id === 'w3a-act4' && renderAct4()}
          {s.id === 'w3a-act5' && renderAct5()}
          {s.id === 'w3a-act6' && renderAct6()}
          {s.id === 'w3b-act1' && renderW3bAct1()}
          {s.id === 'w3b-act2' && renderW3bAct2()}
          {s.id === 'w3b-act3' && renderW3bAct3()}
          {s.id?.startsWith('w3b-cmd-') && renderW3bCommandQuiz()}
          {/* Generic quiz renderer for all other weeks */}
          {!['w3a-act1', 'w3a-act2', 'w3a-act3', 'w3a-act4', 'w3a-act5', 'w3a-act6', 'w3b-act1', 'w3b-act2', 'w3b-act3'].includes(s.id ?? '') &&
            !s.id?.startsWith('w3b-cmd-') &&
            s.question && s.options && renderGenericQuiz()}
        </div>
      </div>
    </div>
  );
}

function HomeworkSlide({ s }: { s: SlideData }) {
  const isW3b = s.id?.startsWith('w3b');
  const isW6a = s.id?.startsWith('w6a');

  const scenarioTitle = isW3b ? '🏠 สถานการณ์จำลองในการฝึกปฏิบัติ' : '🏠 สถานการณ์จำลองในโจทย์';

  let scenarioDesc = '';
  if (isW3b) {
    scenarioDesc = 'นักเรียนล็อกอินเข้าระบบ Linux Server และต้องการเตรียมความพร้อมสร้างสภาพแวดล้อมไดเรกทอรีทำงาน พร้อมทดสอบความเข้าใจเกี่ยวกับการจัดการไฟล์และการนำทาง';
  } else if (isW6a) {
    scenarioDesc = 'นักเรียนล็อกอินเข้าระบบ Linux Server เพื่อสร้างบัญชีและจำกัดสิทธิ์ผู้ใช้งาน รวมถึงการติดตั้ง SSH Key-based Authentication และลงกลอนความปลอดภัยเซิร์ฟเวอร์';
  } else {
    scenarioDesc = 'ให้นักเรียนสมมติว่าตนเอง "กลับถึงบ้าน หยิบสมาร์ทโฟน/คอมพิวเตอร์มาเชื่อมต่อ Wi-Fi ที่บ้าน จากนั้นพิมพ์เปิดเว็บไซต์ www.google.com" เพื่อสืบค้นสื่อการสอน';
  }

  const scenarioSteps = isW3b ? (
    <>
      <span>📁 ย้ายไปยัง /home/student</span>
      <span>➔</span>
      <span>📝 สร้างและเขียน config.txt</span>
      <span>➔</span>
      <span>🔍 ตรวจสอบและอ่านไฟล์</span>
    </>
  ) : isW6a ? (
    <>
      <span>👤 สร้างและสลับผู้ใช้งาน</span>
      <span>➔</span>
      <span>🔒 กำหนดสิทธิ์ chmod/chown</span>
      <span>➔</span>
      <span>🔑 เปิดใช้ SSH Key & Hardening</span>
    </>
  ) : (
    <>
      <span>🔌 เชื่อมต่อ Wi-Fi (DHCP)</span>
      <span>➔</span>
      <span>🔍 พิมพ์ google.com</span>
      <span>➔</span>
      <span>🌐 เปิดเว็บสำเร็จ (DNS)</span>
    </>
  );

  const tasksHeader = isW3b
    ? '📋 ภารกิจปฏิบัติการที่ต้องเขียนอธิบาย (กรุณาตอบให้ครบทั้ง 4 ข้อ):'
    : '📋 ภารกิจคำถามทฤษฎีที่ต้องเขียนอธิบาย (กรุณาตอบให้ครบทั้ง 4 ข้อ):';

  let tasks = [];
  if (isW3b) {
    tasks = [
      {
        title: 'การเดินทางและสร้างไดเรกทอรีทำงาน',
        desc: 'เขียนลำดับคำสั่งที่ถูกต้องเพื่อเดินทางไปยังโฟลเดอร์ home ของ student แล้วสร้างโฟลเดอร์ย่อยใหม่ชื่อ lab-dhcp'
      },
      {
        title: 'การจัดการไฟล์และการเขียนข้อมูลด้วย nano',
        desc: 'หากต้องการย้ายตำแหน่งเข้าไปในโฟลเดอร์ lab-dhcp แล้วเขียนสร้างไฟล์ข้อความชื่อ config.txt พร้อมบันทึกข้อความภายในไฟล์ด้วย nano ต้องพิมพ์สั่งงานอย่างไร'
      },
      {
        title: 'การตรวจสอบไฟล์และแสดงเนื้อหาเบื้องต้น',
        desc: 'ระบุคำสั่งในการตรวจสอบรายชื่อไฟล์เพื่อดูว่ามีไฟล์ config.txt อยู่จริง แสดงรายละเอียดสิทธิ์และขนาด และแสดงเนื้อความข้างในโดยไม่ต้องเปิดโปรแกรมแก้ไขข้อความ nano'
      },
      {
        title: 'การเช็คหมายเลขไอพีและการแก้ไวยากรณ์ผิดพลาด',
        desc: 'บอกวิธีการตรวจสอบหมายเลข IP ของเซิร์ฟเวอร์ และระบุสาเหตุข้อผิดพลาดพร้อมตัวอย่างวิธีพิมพ์แก้ที่ถูกต้องเมื่อพบปัญหา cd.. หรือการใช้คำสั่ง rm เพื่อลบโฟลเดอร์แล้วระบบแสดงข้อความปฏิเสธ'
      }
    ];
  } else if (isW6a) {
    tasks = [
      {
        title: 'การจัดการผู้ใช้และสิทธิ์ยกระดับ (`su` & `sudo`)',
        desc: 'อธิบายความแตกต่างระหว่างคำสั่ง `su` และ `sudo` พร้อมเหตุผลว่าทำไมในระบบเครือข่ายระดับองค์กรจึงไม่แนะนำให้ใช้สิทธิ์ `root` ในการควบคุมเซิร์ฟเวอร์โดยตรง'
      },
      {
        title: 'หลักการของสิทธิ์ไฟล์ระบบ (`chmod` & `chown`)',
        desc: 'เปรียบเทียบและชี้แจงความแตกต่างของสิทธิ์ตัวเลข `644`, `755` และ `600` เมื่อนำไปกำหนดให้กับไฟล์หรือโฟลเดอร์ และหากผู้เขียนเผลอรันคำสั่ง `chmod 777` กับโฟลเดอร์เก็บข้อมูลหลัก จะเสี่ยงต่อความปลอดภัยระบบอย่างไร'
      },
      {
        title: 'การทำงานของระบบกุญแจเข้ารหัส (`SSH Key`)',
        desc: 'อธิบายหลักการทำงานร่วมกันของคู่กุญแจเข้ารหัส `Private Key` และ `Public Key` ในการเชื่อมต่อควบคุมเซิร์ฟเวอร์ และตอบคำถามว่าทำไมวิธีการนี้จึงปลอดภัยจากการถูกสุ่มเดารหัสผ่าน (`Brute Force Attack`) มากกว่าแบบปกติ'
      },
      {
        title: 'การลงกลอนเพิ่มความปลอดภัยของ SSH (`Hardening`)',
        desc: 'การตั้งค่าในไฟล์ `/etc/ssh/sshd_config` ด้วยตัวแปร `PermitRootLogin no` และ `PasswordAuthentication no` มีวัตถุประสงค์เพื่ออะไร และตอบคำถามว่าทำไมเราห้ามปิดหน้าต่าง Terminal แรกที่รันงานอยู่จนกว่าจะทดสอบเชื่อมต่อสำเร็จ'
      }
    ];
  } else {
    tasks = [
      {
        title: 'วิเคราะห์การเชื่อมต่อ DHCP & ขั้นตอน DORA',
        desc: 'เครื่องคอมพิวเตอร์หรืออุปกรณ์พกพาได้รับหมายเลข IP Address มาได้อย่างไร? อธิบายพร้อมสรุปขั้นตอนการคุยสัญญาณแบบย่อ 4 ลำดับ DORA ด้วยภาษาและความเข้าใจของตนเอง'
      },
      {
        title: 'ระบุชุดข้อมูลเครือข่ายนอกเหนือจาก IP',
        desc: 'ให้ระบุว่านอกจากหมายเลข IP Address หลักแล้ว เราเตอร์ (DHCP Server) ตอบส่งข้อมูลเครือข่ายส่วนสำคัญอะไรมาให้เครื่องของเราอีกบ้างเพื่อช่วยให้ใช้อินเทอร์เน็ตได้? (ระบุ 3 ข้อมูลเครือข่ายสำคัญ)'
      },
      {
        title: 'กลไกการสืบค้นแคชและการแปลงชื่อ (DNS Process)',
        desc: 'หลังจากเครื่องของเราได้เลขไอพีแล้ว ระบบทำการติดต่อและแปลงชื่อเว็บไซต์ www.google.com ให้เป็น IP Address ปลายทางของทางกูเกิลผ่าน DNS Server ได้อย่างไร? (อธิบายลำดับการค้นหาข้อมูล)'
      },
      {
        title: 'ประเภทและการใช้งานของ DNS Records',
        desc: 'หากหน่วยงานต้องการเปิดใช้งานเว็บไซต์หลักและระบบเซิร์ฟเวอร์รับส่งอีเมลเป็นของตนเอง จะต้องเข้าไปทำการตั้งค่า DNS Records ประเภทใดบ้าง? ให้เขียนระบุความหมายและการยกตัวอย่างระเบียนหลักทั้ง 4 ชนิด (A, CNAME, MX, TXT Record)'
      }
    ];
  }

  return (
    <div className="slide slide-content slide-homework" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div className="slide-tag" style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}>
        {s.tag || 'การบ้านท้ายบทเรียน'}
      </div>
      <h2>{s.title || 'การบ้านเดี่ยว: เขียนอธิบายการทำงานเครือข่าย'}</h2>

      {/* Grid container */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '0', marginTop: '8px' }}>
        {/* Left Column: Metadata & Scenario */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Metadata Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 12px',
            borderLeft: '4px solid var(--accent)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>วิชาเรียน</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>ระบบปฏิบัติการเครื่องแม่ข่าย (ปวส.1)</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>คะแนนเต็ม</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#22c55e' }}>10 คะแนน</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>กำหนดส่ง</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>ก่อนเข้าเรียนคาบถัดไป</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ช่องทางการส่ง</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>Google Classroom</div>
            </div>
          </div>

          {/* Scenario Card */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {scenarioTitle}
            </span>
            <div style={{ fontSize: '12px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
              {renderFormattedText(scenarioDesc)}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px dashed var(--border)',
              marginTop: '4px',
              fontSize: '10px',
              color: 'var(--text-secondary)'
            }}>
              {scenarioSteps}
            </div>
          </div>
        </div>

        {/* Right Column: Assignment Tasks List */}
        <div style={{
          flex: 1.2,
          minWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          maxHeight: '330px',
          paddingRight: '5px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '2px' }}>
            {tasksHeader}
          </div>

          {tasks.map((task, index) => (
            <div key={index} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              gap: '10px'
            }}>
              <div style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>{index + 1}</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{renderFormattedText(task.title)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                  {renderFormattedText(task.desc)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Card Footer */}
      <div style={{
        marginTop: '10px',
        background: 'rgba(34, 197, 94, 0.05)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        borderRadius: '8px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>📝</span>
          <span style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
            <strong>คำชี้แจงเพิ่มเติม:</strong> เขียนสรุปความเข้าใจด้วยลายมือตนเองลงในสมุดจดบันทึกเรียน (แล้วใช้มือถือถ่ายรูปส่ง) หรือจะพิมพ์ลงใน Google Docs ก็ได้
          </span>
        </div>
        <span style={{
          background: '#22c55e',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '10px'
        }}>
          ห้ามลอกเลียนผลงานกันโดยเด็ดขาด
        </span>
      </div>
    </div>
  );
}

function ScoringSlide({ s }: { s: SlideData }) {
  return (
    <div className="slide slide-scoring">
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>
      <table className="score-table">
        <thead><tr><th>หัวข้อ</th><th>รายละเอียด</th><th>คะแนน</th></tr></thead>
        <tbody>
          {s.rows?.map((r, i) => (
            <tr key={i}>
              <td><strong>{r.item}</strong></td>
              <td>{r.detail}</td>
              <td><span className="score-badge">{r.score}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LabSlide({ s }: { s: SlideData }) {
  return (
    <div className="slide slide-lab">
      <div className="slide-tag" style={{ color: "#22c55e" }}>{s.tag}</div>
      <h2>{s.title}</h2>
      <div className="lab-meta">
        {s.duration && <span>⏱ {s.duration}</span>}
      </div>
      <div className="lab-grid">
        <div className="lab-col">
          <div className="lab-section-title">🎯 วัตถุประสงค์</div>
          <ul className="objectives">
            {s.objectives?.map((o, i) => <li key={i}><span style={{ flex: 1, minWidth: 0 }}>{renderFormattedText(o)}</span></li>)}
          </ul>
        </div>
        <div className="lab-col">
          <div className="lab-section-title">📋 ขั้นตอน</div>
          <ul className="steps">
            {s.steps?.map((st, i) => {
              const lines = st.split('\n');
              const text = lines[0].replace(/^\d+\.\s*/, '');
              const cmds = lines.slice(1);
              return (
                <li key={i} data-step={`${i + 1}.`} style={{ marginBottom: cmds.length > 0 ? '14px' : '6px', listStyleType: 'none', paddingLeft: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: cmds.length > 0 ? '6px' : '0', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                      {renderFormattedText(text)}
                    </div>
                    {cmds.length > 0 && (
                      <div style={{
                        background: '#0d1117',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid #30363d',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        width: '100%',
                        marginTop: '6px',
                        display: 'block'
                      }}>
                        {/* Terminal titlebar */}
                        <div style={{ background: '#161b22', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #30363d' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
                          <span style={{ fontSize: '10px', color: '#8b949e', marginLeft: '6px', fontFamily: 'monospace' }}>
                            Terminal
                          </span>
                        </div>
                        {/* Command lines */}
                        <div style={{
                          padding: '10px 14px',
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                          fontSize: '12px',
                          lineHeight: '1.7',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          background: '#0d1117'
                        }}>
                          {cmds.map((cmd, ci) => {
                            const trimmed = cmd.trim();
                            const isPrompt = trimmed.startsWith('$ ') || trimmed.startsWith('# ');
                            if (isPrompt) {
                              const prompt = trimmed.slice(0, 2);
                              const rest = trimmed.slice(2);
                              return (
                                <div key={ci}>
                                  <span style={{ color: '#79c0ff', marginRight: '6px' }}>{prompt}</span>
                                  <span style={{ color: '#7ee787' }}>{rest}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={ci} style={{ color: '#e6edf3' }}>
                                {cmd}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummarySlide({ s }: { s: SlideData }) {
  return (
    <div className="slide slide-summary">
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>
      <ul>{s.items?.map((item, i) => <li key={i}><span style={{ flex: 1, minWidth: 0 }}>{renderFormattedText(item)}</span></li>)}</ul>
    </div>
  );
}

/* --- Diagram SVGs --- */
function DiagramClientServer() {
  const box = { fill: "#191d29", stroke: "#22d3ee", strokeWidth: 1.5, rx: 8 };
  const txt = { fill: "#e8eaf0", fontSize: 13, fontFamily: "Inter,sans-serif", textAnchor: "middle" as const };
  const sub = { fill: "#8892a4", fontSize: 10, fontFamily: "Inter,sans-serif", textAnchor: "middle" as const };
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Client */}
      <rect x="20" y="60" width="130" height="80" {...box} />
      <text x="85" y="95" {...txt}>💻 Client</text>
      <text x="85" y="114" {...sub}>ผู้ส่งคำขอ (Request)</text>
      {/* Arrow right */}
      <line x1="150" y1="100" x2="210" y2="100" stroke="#22d3ee" strokeWidth="2" />
      <polygon points="210,95 220,100 210,105" fill="#22d3ee" />
      <text x="185" y="88" {...sub}>HTTP Request</text>
      {/* Network */}
      <rect x="220" y="60" width="120" height="80" {...box} fill="#12151d" />
      <text x="280" y="95" {...txt}>🌐 Network</text>
      <text x="280" y="114" {...sub}>สื่อกลาง (Medium)</text>
      {/* Arrow right */}
      <line x1="340" y1="100" x2="400" y2="100" stroke="#22d3ee" strokeWidth="2" />
      <polygon points="400,95 410,100 400,105" fill="#22d3ee" />
      <text x="375" y="88" {...sub}>Process</text>
      {/* Server */}
      <rect x="410" y="60" width="130" height="80" {...box} />
      <text x="475" y="95" {...txt}>🖥️ Server</text>
      <text x="475" y="114" {...sub}>ผู้ให้บริการ (Response)</text>
      {/* Return arrow */}
      <line x1="410" y1="115" x2="150" y2="115" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6,3" />
      <polygon points="150,110 140,115 150,120" fill="#22c55e" />
      <text x="280" y="148" style={{ fill: "#22c55e", fontSize: 10, fontFamily: "Inter,sans-serif", textAnchor: "middle" }}>HTTP Response (200 OK)</text>
    </svg>
  );
}

function DiagramDORA() {
  const colors = ["#22d3ee", "#a78bfa", "#f59e0b", "#22c55e"];
  const labels = ["DISCOVER", "OFFER", "REQUEST", "ACK"];
  const descs = ["Client ตะโกนหา DHCP", "DHCP เสนอ IP ให้", "Client ขอยืนยัน IP", "DHCP ยืนยันและแจก"];
  const icons = ["📡", "📨", "✋", "✅"];
  return (
    <svg viewBox="0 0 560 180" style={{ width: "100%", height: "100%" }}>
      {labels.map((lbl, i) => {
        const cx = 60 + i * 130;
        return (
          <g key={i}>
            <circle cx={cx} cy={70} r={38} fill="#12151d" stroke={colors[i]} strokeWidth={2} />
            <text x={cx} y={62} textAnchor="middle" fontSize={20}>{icons[i]}</text>
            <text x={cx} y={82} textAnchor="middle" fontSize={10} fill={colors[i]} fontWeight={700}>{lbl}</text>
            <text x={cx} y={126} textAnchor="middle" fontSize={9} fill="#8892a4">{descs[i]}</text>
            {i < 3 && <line x1={cx + 38} y1={70} x2={cx + 92} y2={70} stroke={colors[i]} strokeWidth={1.5} />}
            {i < 3 && <polygon points={`${cx + 92},65 ${cx + 102},70 ${cx + 92},75`} fill={colors[i + 1]} />}
          </g>
        );
      })}
      <text x="280" y="160" textAnchor="middle" fontSize={11} fill="#4a5568">กระบวนการขอ IP อัตโนมัติ (DHCP)</text>
    </svg>
  );
}

function DiagramDNS() {
  const box = (x: number, y: number, w: number, color: string, label: string, sub: string) => (
    <g>
      <rect x={x} y={y} width={w} height={50} rx={8} fill="#191d29" stroke={color} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize={12} fill="#e8eaf0" fontFamily="Inter,sans-serif">{label}</text>
      <text x={x + w / 2} y={y + 38} textAnchor="middle" fontSize={9} fill="#8892a4" fontFamily="Inter,sans-serif">{sub}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {box(20, 20, 150, "#22d3ee", "💻 Browser", "พิมพ์ google.com")}
      <line x1="170" y1="45" x2="205" y2="45" stroke="#22d3ee" strokeWidth={1.5} />
      <polygon points="205,40 215,45 205,50" fill="#22d3ee" />
      {box(215, 20, 130, "#a78bfa", "🌍 Root DNS", "ชี้ไปยัง .com TLD")}
      <line x1="345" y1="45" x2="380" y2="45" stroke="#a78bfa" strokeWidth={1.5} />
      <polygon points="380,40 390,45 380,50" fill="#a78bfa" />
      {box(390, 20, 150, "#f59e0b", "📂 .com TLD", "ชี้ไปยัง google.com")}
      <line x1="465" y1="70" x2="465" y2="105" stroke="#f59e0b" strokeWidth={1.5} />
      <polygon points="460,105 465,115 470,105" fill="#22c55e" />
      {box(390, 115, 150, "#22c55e", "🎯 Authoritative", "google.com = 142.250.x.x")}
      <line x1="390" y1="140" x2="170" y2="140" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5,3" />
      <polygon points="170,135 160,140 170,145" fill="#22c55e" />
      <text x="280" y="180" textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="Inter,sans-serif">DNS Resolution แปลงชื่อ → IP Address</text>
    </svg>
  );
}

function DiagramNOSvsDesktop() {
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* NOS Side */}
      <rect x="20" y="20" width="240" height="160" rx={10} fill="#0c1a2e" stroke="#22d3ee" strokeWidth={2} />
      <text x="140" y="46" textAnchor="middle" fontSize={13} fill="#22d3ee" fontWeight={700} fontFamily="Inter,sans-serif">🌐 Network OS (NOS)</text>
      {["Multi-user: 100+ คน พร้อมกัน", "CLI เป็นหลัก (ประสิทธิภาพสูง)", "Uptime 99.999% (Five Nines)", "Daemon / Background Services", "RAM เน้น Cache ข้อมูล"].map((t, i) => (
        <text key={i} x="36" y={68 + i * 20} fontSize={10} fill="#8892a4" fontFamily="Inter,sans-serif">▸ {t}</text>
      ))}
      {/* Desktop Side */}
      <rect x="300" y="20" width="240" height="160" rx={10} fill="#1a1200" stroke="#f59e0b" strokeWidth={2} />
      <text x="420" y="46" textAnchor="middle" fontSize={13} fill="#f59e0b" fontWeight={700} fontFamily="Inter,sans-serif">💻 Desktop OS</text>
      {["Single-user: ใช้งานคนเดียว", "GUI เป็นหลัก (ใช้งานง่าย)", "ปิด-เปิด รายวัน", "Foreground Applications", "RAM เน้นโปรแกรมที่เปิดอยู่"].map((t, i) => (
        <text key={i} x="316" y={68 + i * 20} fontSize={10} fill="#8892a4" fontFamily="Inter,sans-serif">▸ {t}</text>
      ))}
      <text x="280" y="196" textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="Inter,sans-serif">NOS ถูกออกแบบมาสำหรับรองรับผู้ใช้หลายคน Desktop OS เพื่อผู้ใช้คนเดียว</text>
    </svg>
  );
}

function DiagramHypervisor() {
  const lyr = (x: number, y: number, w: number, h: number, color: string, lbl: string, sub: string = "") => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#191d29" stroke={color} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fontSize={12} fill={color} fontFamily="Inter,sans-serif" fontWeight={600}>{lbl}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize={9} fill="#8892a4" fontFamily="Inter,sans-serif">{sub}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      <text x="130" y="18" textAnchor="middle" fontSize={11} fill="#22d3ee" fontFamily="Inter,sans-serif" fontWeight={700}>Type 1 — Bare Metal</text>
      {lyr(20, 25, 220, 30, "#a78bfa", "VM1 (Win)")}
      <rect x={125} y={25} width={2} height={30} fill="#22d3ee" opacity={0.3} />
      {lyr(125, 25, 115, 30, "#a78bfa", "VM2 (Linux)")}
      {lyr(20, 60, 220, 30, "#22d3ee", "Hypervisor", "VMware ESXi / KVM")}
      {lyr(20, 95, 220, 30, "#f59e0b", "Hardware", "CPU / RAM / Disk")}
      <text x="130" y="145" textAnchor="middle" fontSize={9} fill="#22c55e" fontFamily="Inter,sans-serif">✅ ประสิทธิภาพสูงสุด (Production)</text>
      <text x="420" y="18" textAnchor="middle" fontSize={11} fill="#f59e0b" fontFamily="Inter,sans-serif" fontWeight={700}>Type 2 — Hosted</text>
      {lyr(320, 25, 200, 30, "#a78bfa", "VM (Ubuntu)")}
      {lyr(320, 60, 200, 30, "#f59e0b", "VirtualBox / VMware WS", "")}
      {lyr(320, 95, 200, 30, "#22d3ee", "Host OS (Windows/macOS)")}
      {lyr(320, 130, 200, 25, "#f59e0b", "Hardware")}
      <text x="420" y="170" textAnchor="middle" fontSize={9} fill="#22d3ee" fontFamily="Inter,sans-serif">🔵 ใช้ทำแล็บ (Development)</text>
    </svg>
  );
}

function DiagramNTier() {
  const row = (y: number, color: string, icon: string, lbl: string, sub: string) => (
    <g>
      <rect x={160} y={y} width={240} height={36} rx={8} fill="#191d29" stroke={color} strokeWidth={1.5} />
      <text x={180} y={y + 22} fontSize={14}>{icon}</text>
      <text x={204} y={y + 15} fontSize={12} fill={color} fontFamily="Inter,sans-serif" fontWeight={600}>{lbl}</text>
      <text x={204} y={y + 30} fontSize={9} fill="#8892a4" fontFamily="Inter,sans-serif">{sub}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 560 210" style={{ width: "100%", height: "100%" }}>
      {row(20, "#22d3ee", "💻", "Presentation Layer", "Browser / Mobile App — ส่วนที่ผู้ใช้เห็น")}
      <line x1="280" y1="56" x2="280" y2="76" stroke="#22d3ee" strokeWidth={1.5} />
      <polygon points="275,76 280,86 285,76" fill="#a78bfa" />
      {row(86, "#a78bfa", "⚙️", "Application Layer", "Business Logic / API Server — ประมวลผล")}
      <line x1="280" y1="122" x2="280" y2="142" stroke="#a78bfa" strokeWidth={1.5} />
      <polygon points="275,142 280,152 285,142" fill="#22c55e" />
      {row(152, "#22c55e", "🗄️", "Data Layer", "Database Server — จัดเก็บข้อมูล")}
      <text x="280" y="202" textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="Inter,sans-serif">3-Tier Architecture: แยกส่วนทำให้ขยายระบบง่ายและปลอดภัยขึ้น</text>
    </svg>
  );
}

function DiagramAnimOSI() {
  const layers = [
    { name: "7. Application", color: "#f43f5e", desc: "แอปพลิเคชัน (Browser, LINE)" },
    { name: "6. Presentation", color: "#ec4899", desc: "เข้ารหัส/จัดรูปแบบ (JPEG, SSL)" },
    { name: "5. Session", color: "#d946ef", desc: "ควบคุมการเชื่อมต่อ" },
    { name: "4. Transport", color: "#8b5cf6", desc: "แบ่งข้อมูลย่อยๆ (TCP/UDP)" },
    { name: "3. Network", color: "#3b82f6", desc: "หาเส้นทาง (IP Address, Router)" },
    { name: "2. Data Link", color: "#06b6d4", desc: "ส่งในวง LAN (MAC Address, Switch)" },
    { name: "1. Physical", color: "#10b981", desc: "สายแลน/คลื่น (010101...)" }
  ];

  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      {/* Sender Stack (Left) */}
      <text x="100" y="15" textAnchor="middle" fill="#e8eaf0" fontSize="12" fontWeight="bold">เครื่องต้นทาง (ผู้ส่ง)</text>
      {layers.map((l, i) => (
        <g key={`sender-${i}`}>
          <rect x="20" y={25 + i * 24} width="160" height="20" rx="3" fill="#191d29" stroke={l.color} strokeWidth="1.5" />
          <text x="100" y={39 + i * 24} textAnchor="middle" fill={l.color} fontSize="11" fontWeight="bold">{l.name}</text>
        </g>
      ))}

      {/* Receiver Stack (Right) */}
      <text x="460" y="15" textAnchor="middle" fill="#e8eaf0" fontSize="12" fontWeight="bold">เครื่องปลายทาง (ผู้รับ)</text>
      {layers.map((l, i) => (
        <g key={`receiver-${i}`}>
          <rect x="380" y={25 + i * 24} width="160" height="20" rx="3" fill="#191d29" stroke={l.color} strokeWidth="1.5" />
          <text x="460" y={39 + i * 24} textAnchor="middle" fill={l.color} fontSize="11" fontWeight="bold">{l.name}</text>
        </g>
      ))}

      {/* Center Descriptions */}
      {layers.map((l, i) => (
        <text key={`desc-${i}`} x="280" y={39 + i * 24} textAnchor="middle" fill="#8892a4" fontSize="10">{l.desc}</text>
      ))}

      {/* Data Packet Animation */}
      {/* Downward on Sender */}
      <circle cx="10" cy="35" r="5" fill="#facc15">
        <animate attributeName="cy" values="35;180;180" keyTimes="0;0.4;1" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.4;1" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Across Network (L1 to L1) */}
      <line x1="180" y1="180" x2="380" y2="180" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="180" cy="180" r="4" fill="#10b981" opacity="0">
        <animate attributeName="cx" values="180;380" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.35;0.4;0.6;1" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Upward on Receiver */}
      <circle cx="550" cy="180" r="5" fill="#facc15" opacity="0">
        <animate attributeName="cy" values="180;180;35" keyTimes="0;0.6;1" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.6;0.65;0.95;1" dur="4s" repeatCount="indefinite" />
      </circle>

      <text x="280" y="215" textAnchor="middle" fontSize="10" fill="#4a5568">ผู้ส่งจะห่อข้อมูลจาก L7 ลงไป L1 → ส่งผ่านสายแลน → ผู้รับแกะข้อมูลจาก L1 ขึ้นไป L7</text>
    </svg>
  );
}

/* --- Layer 7 (Application) Animation --- */
function DiagramAnimL7() {
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">จุดเชื่อมต่อกับผู้ใช้งาน (Layer 7: Application)</text>

      {/* Web Browser */}
      <rect x="80" y="60" width="140" height="80" rx="4" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
      <text x="150" y="90" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">Web Browser</text>
      <text x="150" y="110" textAnchor="middle" fill="#f43f5e" fontSize="10">HTTP / HTTPS</text>

      {/* Email Client */}
      <rect x="340" y="60" width="140" height="80" rx="4" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
      <text x="410" y="90" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">Email App</text>
      <text x="410" y="110" textAnchor="middle" fill="#f43f5e" fontSize="10">SMTP / IMAP</text>

      {/* Data generation */}
      <circle cx="150" cy="125" r="4" fill="#fff">
        <animate attributeName="cy" values="125;160" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="410" cy="125" r="4" fill="#fff">
        <animate attributeName="cy" values="125;160" dur="2s" begin="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0" dur="2s" begin="1s" repeatCount="indefinite" />
      </circle>

      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="12">L7 คือหน้าต่างที่โปรแกรมใช้งานเพื่อส่งข้อมูลเข้าสู่ระบบเครือข่าย</text>
    </svg>
  );
}

/* --- Layer 6 (Presentation) Animation --- */
function DiagramAnimL6() {
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">การแปลภาษาและเข้ารหัส (Layer 6: Presentation)</text>

      {/* Plain Text */}
      <rect x="60" y="80" width="100" height="40" rx="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
      <text x="110" y="105" textAnchor="middle" fill="#fff" fontSize="12">"PASSWORD"</text>

      {/* Process Box */}
      <rect x="230" y="70" width="100" height="60" rx="4" fill="#ec4899" />
      <text x="280" y="95" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">Encryption</text>
      <text x="280" y="115" textAnchor="middle" fill="#fff" fontSize="10">(เข้ารหัส)</text>

      {/* Cipher Text */}
      <rect x="400" y="80" width="100" height="40" rx="4" fill="#1e293b" stroke="#ec4899" strokeWidth="2" />
      <text x="450" y="105" textAnchor="middle" fill="#ec4899" fontSize="12" fontWeight="bold" letterSpacing="2">
        *#$&@!
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.5;0.8;1" dur="2s" repeatCount="indefinite" />
      </text>

      {/* Arrows */}
      <line x1="170" y1="100" x2="220" y2="100" stroke="#475569" strokeWidth="2" />
      <line x1="340" y1="100" x2="390" y2="100" stroke="#ec4899" strokeWidth="2" />

      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="12">L6 แปลงข้อมูลให้อยู่ในรูปแบบมาตรฐาน บีบอัดไฟล์ (JPEG, ZIP) และเข้ารหัสความปลอดภัย (SSL/TLS)</text>
    </svg>
  );
}

/* --- Layer 5 (Session) Animation --- */
function DiagramAnimL5() {
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">การจัดการการเชื่อมต่อ (Layer 5: Session)</text>

      {/* PC 1 */}
      <rect x="60" y="80" width="60" height="40" rx="4" fill="#64748b" />
      <text x="90" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">Client</text>

      {/* Server */}
      <rect x="440" y="60" width="60" height="80" rx="4" fill="#3b82f6" />
      <text x="470" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">Server</text>

      {/* Connection Tunnel */}
      <rect x="130" y="90" width="300" height="20" rx="10" fill="none" stroke="#d946ef" strokeWidth="2" strokeDasharray="5 5">
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="4s" repeatCount="indefinite" />
      </rect>

      {/* Session State Text */}
      <text x="280" y="80" textAnchor="middle" fill="#d946ef" fontSize="12" fontWeight="bold">
        <tspan opacity="0"><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.1;0.2" dur="4s" repeatCount="indefinite" />1. สร้าง Session</tspan>
        <tspan opacity="0"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.7;0.8" dur="4s" repeatCount="indefinite" />2. แลกเปลี่ยนข้อมูล (ล็อกอินค้างไว้)</tspan>
        <tspan opacity="0"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.8;0.9;1" dur="4s" repeatCount="indefinite" />3. ปิด Session</tspan>
      </text>

      {/* Data Syncing */}
      <circle cx="140" cy="100" r="4" fill="#fff" opacity="0">
        <animate attributeName="cx" values="140;420" dur="1s" begin="0.8s" repeatCount="3" />
        <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.5;1" dur="1s" begin="0.8s" repeatCount="3" />
      </circle>

      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="12">L5 คอยเปิด, ควบคุม, และปิดช่องทางการสนทนา (Session) ระหว่างสองเครื่อง เช่น การล็อกอินเว็บ</text>
    </svg>
  );
}

/* --- Layer 4 (Transport) Animation --- */
function DiagramAnimL4() {
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="30" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">การแบ่งข้อมูลเป็น Segment (Layer 4)</text>

      {/* Big Data Chunk */}
      <rect x="50" y="80" width="120" height="60" rx="4" fill="#f43f5e" />
      <text x="110" y="115" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">Data ก้อนใหญ่</text>

      {/* Knife / Slicing */}
      <line x1="190" y1="110" x2="220" y2="110" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="4 2">
        <animate attributeName="x2" values="190;240;190" dur="2s" repeatCount="indefinite" />
      </line>

      {/* Segments */}
      <g transform="translate(260, 0)">
        <rect x="0" y="80" width="30" height="60" rx="4" fill="#8b5cf6">
          <animate attributeName="opacity" values="0;1;1" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite" />
          <animate attributeName="x" values="0;20;20" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="15" y="115" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">S1</text>
        <rect x="40" y="80" width="30" height="60" rx="4" fill="#8b5cf6">
          <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.3;0.8;1" dur="2s" repeatCount="indefinite" />
          <animate attributeName="x" values="40;60;60" keyTimes="0;0.3;1" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="55" y="115" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">S2</text>
        <rect x="80" y="80" width="30" height="60" rx="4" fill="#8b5cf6">
          <animate attributeName="opacity" values="0;0;0;1" keyTimes="0;0.5;0.9;1" dur="2s" repeatCount="indefinite" />
          <animate attributeName="x" values="80;100;100" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="95" y="115" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">S3</text>
      </g>

      <text x="280" y="190" textAnchor="middle" fill="#8892a4" fontSize="12">L4 นำข้อมูลแอปพลิเคชันมาหั่นเป็นชิ้นย่อยๆ (Segment) เพื่อให้ส่งได้ง่าย</text>
    </svg>
  );
}

/* --- Layer 3 (Network) Animation --- */
function DiagramAnimL3() {
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">การหาเส้นทางข้ามเครือข่ายด้วย IP (Layer 3)</text>

      {/* PC 1 */}
      <rect x="30" y="80" width="40" height="30" rx="4" fill="#64748b" />
      <text x="50" y="130" textAnchor="middle" fill="#94a3b8" fontSize="10">IP: 10.0.0.1</text>

      {/* Routers */}
      <circle cx="150" cy="95" r="20" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      <text x="150" y="130" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">Router A</text>

      <circle cx="280" cy="50" r="20" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      <text x="280" y="30" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">Router B</text>

      <circle cx="280" cy="140" r="20" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      <text x="280" y="175" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">Router C</text>

      <circle cx="410" cy="95" r="20" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      <text x="410" y="130" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">Router D</text>

      {/* PC 2 */}
      <rect x="490" y="80" width="40" height="30" rx="4" fill="#64748b" />
      <text x="510" y="130" textAnchor="middle" fill="#94a3b8" fontSize="10">IP: 192.168.1.5</text>

      {/* Connections */}
      <line x1="70" y1="95" x2="130" y2="95" stroke="#334155" strokeWidth="2" />
      <line x1="170" y1="85" x2="260" y2="55" stroke="#334155" strokeWidth="2" />
      <line x1="170" y1="105" x2="260" y2="135" stroke="#334155" strokeWidth="2" />
      <line x1="300" y1="55" x2="390" y2="85" stroke="#334155" strokeWidth="2" />
      <line x1="300" y1="135" x2="390" y2="105" stroke="#334155" strokeWidth="2" />
      <line x1="430" y1="95" x2="490" y2="95" stroke="#334155" strokeWidth="2" />

      {/* Packet Animation */}
      <rect x="50" y="85" width="16" height="10" rx="2" fill="#facc15">
        <animate attributeName="x" values="70;140;140;270;270;400;400;490;490" keyTimes="0;0.15;0.25;0.4;0.5;0.65;0.75;0.9;1" dur="5s" repeatCount="indefinite" />
        <animate attributeName="y" values="90;90;90;45;45;90;90;90;90" keyTimes="0;0.15;0.25;0.4;0.5;0.65;0.75;0.9;1" dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="5s" repeatCount="indefinite" />
      </rect>

      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="12">L3 จะดู IP ปลายทางและตัดสินใจส่ง Packet ไปทางที่ดีที่สุด (ผ่าน Router B)</text>
    </svg>
  );
}

/* --- Layer 2 (Data Link) Animation --- */
function DiagramAnimL2() {
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">การส่งข้อมูลในวง LAN เดียวกัน (Layer 2)</text>

      {/* Switch */}
      <rect x="200" y="80" width="160" height="40" rx="6" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
      <text x="280" y="105" textAnchor="middle" fill="#06b6d4" fontSize="14" fontWeight="bold">Switch</text>

      {/* PCs */}
      <rect x="40" y="30" width="40" height="30" rx="4" fill="#64748b" />
      <text x="60" y="75" textAnchor="middle" fill="#94a3b8" fontSize="10">MAC: AA:BB...</text>
      <text x="60" y="20" textAnchor="middle" fill="#fff" fontSize="12">ผู้ส่ง</text>
      <line x1="80" y1="50" x2="200" y2="85" stroke="#334155" strokeWidth="2" />

      <rect x="40" y="140" width="40" height="30" rx="4" fill="#64748b" />
      <text x="60" y="185" textAnchor="middle" fill="#94a3b8" fontSize="10">MAC: CC:DD...</text>
      <line x1="80" y1="150" x2="200" y2="115" stroke="#334155" strokeWidth="2" />

      <rect x="480" y="30" width="40" height="30" rx="4" fill="#64748b" />
      <text x="500" y="75" textAnchor="middle" fill="#94a3b8" fontSize="10">MAC: EE:FF...</text>
      <text x="500" y="20" textAnchor="middle" fill="#fff" fontSize="12">ผู้รับ</text>
      <line x1="480" y1="50" x2="360" y2="85" stroke="#334155" strokeWidth="2" />

      <rect x="480" y="140" width="40" height="30" rx="4" fill="#64748b" />
      <text x="500" y="185" textAnchor="middle" fill="#94a3b8" fontSize="10">MAC: GG:HH...</text>
      <line x1="480" y1="150" x2="360" y2="115" stroke="#334155" strokeWidth="2" />

      {/* Frame Animation */}
      <rect x="80" y="45" width="20" height="10" rx="2" fill="#06b6d4">
        <animate attributeName="x" values="80;200;200;360;460;460" keyTimes="0;0.3;0.4;0.7;0.9;1" dur="4s" repeatCount="indefinite" />
        <animate attributeName="y" values="45;80;80;80;45;45" keyTimes="0;0.3;0.4;0.7;0.9;1" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="4s" repeatCount="indefinite" />
      </rect>

      <text x="280" y="205" textAnchor="middle" fill="#8892a4" fontSize="12">Switch จะจดจำ MAC Address ว่าอยู่สายไหน และส่ง Frame ข้อมูลให้ถูกคนเท่านั้น</text>
    </svg>
  );
}

/* --- Layer 1 (Physical) Animation --- */
function DiagramAnimL1() {
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">การแปลงข้อมูลเป็นสัญญาณ (Layer 1)</text>

      {/* Bit stream */}
      <text x="120" y="110" textAnchor="middle" fill="#94a3b8" fontSize="16" fontWeight="bold" letterSpacing="4">0101101</text>

      {/* Conversion Process */}
      <rect x="230" y="80" width="100" height="50" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
      <text x="280" y="110" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">Transceiver</text>

      {/* Waves output */}
      <path d="M 350 105 Q 365 70, 380 105 T 410 105 T 440 105 T 470 105" fill="none" stroke="#10b981" strokeWidth="3">
        <animate attributeName="d"
          values="M 350 105 Q 365 70, 380 105 T 410 105 T 440 105 T 470 105;
                  M 350 105 Q 365 140, 380 105 T 410 105 T 440 105 T 470 105;
                  M 350 105 Q 365 70, 380 105 T 410 105 T 440 105 T 470 105"
          dur="0.5s" repeatCount="indefinite" />
      </path>

      {/* Copper pulses output */}
      <path d="M 350 145 L 370 145 L 370 125 L 390 125 L 390 145 L 410 145 L 410 125 L 430 125 L 430 145 L 450 145" fill="none" stroke="#facc15" strokeWidth="3">
        <animate attributeName="stroke-dashoffset" values="100;0" dur="2s" repeatCount="indefinite" />
        <animate attributeName="stroke-dasharray" values="10, 10" dur="2s" repeatCount="indefinite" />
      </path>

      <text x="410" y="80" textAnchor="middle" fill="#10b981" fontSize="10">สัญญาณคลื่น (Wi-Fi)</text>
      <text x="410" y="165" textAnchor="middle" fill="#facc15" fontSize="10">สัญญาณไฟฟ้า (สายทองแดง)</text>

      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="12">L1 จะเอา Bit ดิจิทัล (0,1) มาแปลงสภาพให้เดินทางผ่านสื่อกลางทางกายภาพได้</text>
    </svg>
  );
}

/* --- Animated Networking Equipment Diagrams --- */
function DiagramAnimSwitch() {
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Central Switch */}
      <rect x="220" y="80" width="120" height="40" rx="4" fill="#191d29" stroke="#22d3ee" strokeWidth="2" />
      <text x="280" y="104" textAnchor="middle" fill="#22d3ee" fontSize="14" fontWeight="bold">SWITCH</text>

      {/* PC 1 (Top Left) */}
      <rect x="80" y="20" width="40" height="30" rx="2" fill="#12151d" stroke="#8892a4" strokeWidth="1.5" />
      <text x="100" y="40" textAnchor="middle" fill="#e8eaf0" fontSize="12">PC 1</text>
      <line x1="120" y1="50" x2="220" y2="90" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2" />

      {/* PC 2 (Bottom Left) */}
      <rect x="80" y="150" width="40" height="30" rx="2" fill="#12151d" stroke="#8892a4" strokeWidth="1.5" />
      <text x="100" y="170" textAnchor="middle" fill="#e8eaf0" fontSize="12">PC 2</text>
      <line x1="120" y1="150" x2="220" y2="110" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2" />

      {/* PC 3 (Top Right) */}
      <rect x="440" y="20" width="40" height="30" rx="2" fill="#12151d" stroke="#8892a4" strokeWidth="1.5" />
      <text x="460" y="40" textAnchor="middle" fill="#e8eaf0" fontSize="12">PC 3</text>
      <line x1="340" y1="90" x2="440" y2="50" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2" />

      {/* PC 4 (Bottom Right) */}
      <rect x="440" y="150" width="40" height="30" rx="2" fill="#12151d" stroke="#8892a4" strokeWidth="1.5" />
      <text x="460" y="170" textAnchor="middle" fill="#e8eaf0" fontSize="12">PC 4</text>
      <line x1="340" y1="110" x2="440" y2="150" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2" />

      {/* Animated Packet from PC 1 to PC 4 */}
      <circle r="6" fill="#f59e0b">
        <animate attributeName="cx" values="120;280;280;440" keyTimes="0;0.4;0.6;1" dur="3s" repeatCount="indefinite" />
        <animate attributeName="cy" values="50;100;100;150" keyTimes="0;0.4;0.6;1" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;1;0" keyTimes="0;0.8;0.9;1" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Animated Packet from PC 2 to PC 3 */}
      <circle r="6" fill="#22c55e">
        <animate attributeName="cx" values="120;280;280;440" keyTimes="0;0.4;0.6;1" dur="3s" begin="1.5s" repeatCount="indefinite" />
        <animate attributeName="cy" values="150;100;100;50" keyTimes="0;0.4;0.6;1" dur="3s" begin="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.1;0.8;0.9;1" dur="3s" begin="1.5s" repeatCount="indefinite" />
      </circle>

      <text x="280" y="190" textAnchor="middle" fontSize="10" fill="#4a5568">Switch ส่งข้อมูลเฉพาะเครื่องปลายทาง (Unicast) ตาม MAC Address</text>
    </svg>
  );
}

function DiagramAnimRouter() {
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Network A */}
      <ellipse cx="120" cy="100" rx="80" ry="60" fill="#22d3ee" fillOpacity="0.1" stroke="#22d3ee" strokeWidth="1" strokeDasharray="5 5" />
      <text x="120" y="55" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold">Subnet A (192.168.1.0)</text>

      {/* Network B */}
      <ellipse cx="440" cy="100" rx="80" ry="60" fill="#a78bfa" fillOpacity="0.1" stroke="#a78bfa" strokeWidth="1" strokeDasharray="5 5" />
      <text x="440" y="55" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold">Subnet B (10.0.0.0)</text>

      {/* Router */}
      <circle cx="280" cy="100" r="30" fill="#191d29" stroke="#f59e0b" strokeWidth="2" />
      <text x="280" y="104" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="bold">ROUTER</text>

      {/* Connections */}
      <line x1="200" y1="100" x2="250" y2="100" stroke="#4a5568" strokeWidth="2" />
      <line x1="310" y1="100" x2="360" y2="100" stroke="#4a5568" strokeWidth="2" />

      {/* PC A */}
      <rect x="100" y="85" width="40" height="30" rx="2" fill="#12151d" stroke="#22d3ee" strokeWidth="1.5" />
      <text x="120" y="105" textAnchor="middle" fill="#e8eaf0" fontSize="12">PC A</text>

      {/* PC B */}
      <rect x="420" y="85" width="40" height="30" rx="2" fill="#12151d" stroke="#a78bfa" strokeWidth="1.5" />
      <text x="440" y="105" textAnchor="middle" fill="#e8eaf0" fontSize="12">PC B</text>

      {/* Animated Packet */}
      <circle r="6" fill="#f87171">
        <animate attributeName="cx" values="140;200;280;360;420" keyTimes="0;0.2;0.5;0.8;1" dur="4s" repeatCount="indefinite" />
        <animate attributeName="cy" values="100;100;100;100;100" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;1;1;0" keyTimes="0;0.2;0.5;0.9;1" dur="4s" repeatCount="indefinite" />
      </circle>

      <text x="280" y="190" textAnchor="middle" fontSize="10" fill="#4a5568">Router เชื่อมโยงเครือข่ายย่อยที่ต่างกัน และหาเส้นทางที่เร็วที่สุด (Routing)</text>
    </svg>
  );
}

function DiagramAnimGateway() {
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Internal Network */}
      <rect x="40" y="60" width="140" height="80" rx="8" fill="#191d29" stroke="#22d3ee" strokeWidth="1.5" />
      <text x="110" y="104" textAnchor="middle" fill="#e8eaf0" fontSize="14">Local Network</text>

      {/* Gateway */}
      <polygon points="240,60 320,60 300,140 260,140" fill="#191d29" stroke="#f59e0b" strokeWidth="2" />
      <text x="280" y="104" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">GATEWAY</text>

      {/* Internet/Cloud */}
      <path d="M420,60 Q450,40 480,60 Q520,60 510,90 Q530,120 490,130 Q470,150 440,140 Q400,140 400,110 Q380,80 420,60 Z" fill="#191d29" stroke="#a78bfa" strokeWidth="1.5" />
      <text x="455" y="104" textAnchor="middle" fill="#a78bfa" fontSize="14" fontWeight="bold">Internet</text>

      {/* Connections */}
      <line x1="180" y1="100" x2="250" y2="100" stroke="#4a5568" strokeWidth="2" />
      <line x1="310" y1="100" x2="410" y2="100" stroke="#4a5568" strokeWidth="2" />

      {/* Packet Animation (Translating Protocol/Format) */}
      <rect y="92" width="16" height="16" rx="2" fill="#22d3ee">
        <animate attributeName="x" values="180;260" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.4;0.5;1" dur="2s" repeatCount="indefinite" />
      </rect>

      <circle cy="100" r="8" fill="#a78bfa" opacity="0">
        <animate attributeName="cx" values="300;410" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.4;0.5;0.9;1" dur="2s" repeatCount="indefinite" />
      </circle>

      <text x="280" y="180" textAnchor="middle" fontSize="10" fill="#4a5568">Gateway ทำหน้าที่เป็นตัวกลางและแปลงรูปแบบโปรโตคอล (Translation)</text>
    </svg>
  );
}

function DiagramAnimAP() {
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Switch/Router */}
      <rect x="40" y="85" width="80" height="30" rx="4" fill="#191d29" stroke="#4a5568" strokeWidth="2" />
      <text x="80" y="105" textAnchor="middle" fill="#8892a4" fontSize="12">Network</text>

      {/* Line to AP */}
      <line x1="120" y1="100" x2="200" y2="100" stroke="#4a5568" strokeWidth="2" strokeDasharray="4 2" />

      {/* Access Point */}
      <circle cx="230" cy="100" r="30" fill="#191d29" stroke="#22d3ee" strokeWidth="2" />
      <circle cx="230" cy="100" r="10" fill="#22d3ee" />
      <text x="230" y="145" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold">Access Point</text>

      {/* Wi-Fi Waves Animation */}
      <g stroke="#22c55e" strokeWidth="2" fill="none" opacity="0">
        <path d="M250,70 A40,40 0 0,1 250,130" />
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
      </g>
      <g stroke="#22c55e" strokeWidth="2" fill="none" opacity="0">
        <path d="M265,55 A60,60 0 0,1 265,145" />
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
      </g>
      <g stroke="#22c55e" strokeWidth="2" fill="none" opacity="0">
        <path d="M280,40 A80,80 0 0,1 280,160" />
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
      </g>

      {/* Wireless Devices */}
      <rect x="400" y="40" width="40" height="60" rx="4" fill="#12151d" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="420" y="75" textAnchor="middle" fill="#f59e0b" fontSize="20">📱</text>

      <rect x="400" y="130" width="60" height="40" rx="4" fill="#12151d" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="430" y="157" textAnchor="middle" fill="#f59e0b" fontSize="20">💻</text>

      <text x="280" y="190" textAnchor="middle" fontSize="10" fill="#4a5568">Access Point แปลงสัญญาณจากสายแลนเป็นคลื่น Wi-Fi ให้อุปกรณ์ไร้สาย</text>
    </svg>
  );
}

/* --- UTP Cable Anatomy --- */
function DiagramUTPAnatomy() {
  const colors = [
    { wire: "#f97316", label: "ขาวส้ม", cx: 200 },
    { wire: "#fb923c", label: "ส้ม", cx: 220 },
    { wire: "#4ade80", label: "ขาวเขียว", cx: 240 },
    { wire: "#3b82f6", label: "น้ำเงิน", cx: 260 },
    { wire: "#93c5fd", label: "ขาวน้ำเงิน", cx: 280 },
    { wire: "#22c55e", label: "เขียว", cx: 300 },
    { wire: "#c8a285", label: "ขาวน้ำตาล", cx: 320 },
    { wire: "#92400e", label: "น้ำตาล", cx: 340 },
  ];
  return (
    <svg viewBox="0 0 560 230" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="15" fontWeight="bold">โครงสร้างภายในสาย UTP (Unshielded Twisted Pair)</text>
      {/* Outer jacket */}
      <rect x="60" y="50" width="440" height="90" rx="45" fill="none" stroke="#4a5568" strokeWidth="4" />
      <rect x="60" y="50" width="440" height="90" rx="45" fill="#1e293b" opacity="0.8" />
      {/* Cut-away label */}
      <line x1="185" y1="50" x2="185" y2="140" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
      <text x="122" y="46" textAnchor="middle" fill="#ef4444" fontSize="11">ตัดเปลือกนอกออก</text>
      {/* Twisted pairs (left intact side) */}
      {[["#f97316", "#fb923c"], ["#4ade80", "#22c55e"], ["#3b82f6", "#93c5fd"], ["#c8a285", "#92400e"]].map(([c1, c2], pi) => (
        <g key={pi}>
          <ellipse cx={90 + pi * 22} cy={95} rx="8" ry="36" fill="#12151d" stroke={c1} strokeWidth="2" />
          <path d={`M${80 + pi * 22},75 Q${88 + pi * 22},95 ${80 + pi * 22},115`} fill="none" stroke={c1} strokeWidth="2" />
          <path d={`M${100 + pi * 22},75 Q${92 + pi * 22},95 ${100 + pi * 22},115`} fill="none" stroke={c2} strokeWidth="2" />
        </g>
      ))}
      {/* Exposed wires (right cut-away side) */}
      {colors.map((c, i) => (
        <g key={i}>
          <line x1="190" y1={95} x2="490" y2={95} stroke={c.wire} strokeWidth="6" strokeDasharray="0"
            transform={`translate(0, ${(i - 3.5) * 9})`} />
          <circle cx="492" cy={95 + (i - 3.5) * 9} r="5" fill={c.wire} />
          <text x="506" y={99 + (i - 3.5) * 9} fill={c.wire} fontSize="9" fontFamily="Inter,sans-serif">{c.label}</text>
        </g>
      ))}
      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="11">สาย UTP มี 8 เส้น (4 คู่) แต่ละคู่พันกันเพื่อลดสัญญาณรบกวน (Crosstalk)</text>
      <text x="280" y="218" textAnchor="middle" fill="#4a5568" fontSize="10">Layer 1 (Physical): สาย UTP คืออุปกรณ์หลักในชั้นนี้</text>
    </svg>
  );
}

/* --- T568A / T568B Color Coding Comparison --- */
function DiagramColorCode() {
  const t568b = [
    { color: "#fb923c", stripe: true, label: "ขาวส้ม" },
    { color: "#fb923c", stripe: false, label: "ส้ม" },
    { color: "#22c55e", stripe: true, label: "ขาวเขียว" },
    { color: "#3b82f6", stripe: false, label: "น้ำเงิน" },
    { color: "#3b82f6", stripe: true, label: "ขาวน้ำเงิน" },
    { color: "#22c55e", stripe: false, label: "เขียว" },
    { color: "#92400e", stripe: true, label: "ขาวน้ำตาล" },
    { color: "#92400e", stripe: false, label: "น้ำตาล" },
  ];
  const t568a = [
    { color: "#22c55e", stripe: true, label: "ขาวเขียว" },
    { color: "#22c55e", stripe: false, label: "เขียว" },
    { color: "#fb923c", stripe: true, label: "ขาวส้ม" },
    { color: "#3b82f6", stripe: false, label: "น้ำเงิน" },
    { color: "#3b82f6", stripe: true, label: "ขาวน้ำเงิน" },
    { color: "#fb923c", stripe: false, label: "ส้ม" },
    { color: "#92400e", stripe: true, label: "ขาวน้ำตาล" },
    { color: "#92400e", stripe: false, label: "น้ำตาล" },
  ];

  const targetB = [2, 5, 0, 3, 4, 1, 6, 7];

  return (
    <svg viewBox="0 0 560 380" style={{ width: "100%", height: "100%" }}>
      <defs>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#22c55e" />
        </marker>
        <marker id="arrow-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fb923c" />
        </marker>
      </defs>

      <text x="280" y="18" textAnchor="middle" fill="#e8eaf0" fontSize="15" fontWeight="bold">การเรียงรหัสสีตามมาตรฐาน T568A และ T568B</text>

      {/* --- T568A (Left) --- */}
      <g>
        <text x="115" y="38" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">มาตรฐาน T568A</text>
        {/* Plug Body */}
        <rect x="60" y="46" width="110" height="66" rx="6" fill="#1e293b" stroke="#4a5568" strokeWidth="1.5" />
        {/* Metallic Contacts Shield */}
        <rect x="65" y="51" width="100" height="10" rx="1.5" fill="#0f172a" />
        {/* Wires inside plug */}
        {t568a.map((w, i) => {
          const xWire = 60 + 10 + i * 11;
          return (
            <g key={i}>
              <rect x={xWire} y="64" width="9" height="38" rx="1" fill={w.color} />
              {w.stripe && <line x1={xWire} y1="64" x2={xWire + 9} y2="102" stroke="white" strokeWidth="2" opacity="0.6" />}
              <text x={xWire + 4.5} y="60" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="bold">{i + 1}</text>
            </g>
          );
        })}
        {/* Vertical list under T568A */}
        {t568a.map((w, i) => {
          const yRow = 145 + i * 26;
          const xWire = 60 + 10 + i * 11;
          return (
            <g key={i}>
              {/* Fan-out wire from plug pin to list box */}
              <path d={`M ${xWire + 4.5} 112 C ${xWire + 4.5} 128, 67 128, 67 ${yRow + 7}`} fill="none" stroke={w.color} strokeWidth="1.5" opacity="0.75" />
              {/* Color Box */}
              <rect x="60" y={yRow} width="14" height="14" rx="2.5" fill={w.stripe ? "#fff" : w.color} stroke={w.color} strokeWidth="1.5" />
              {w.stripe && <line x1="60" y1={yRow + 14} x2="74" y2={yRow} stroke={w.color} strokeWidth="2.5" />}
              {/* Text */}
              <text x="82" y={yRow + 11} textAnchor="start" fill="#e8eaf0" fontSize="10.5" fontFamily="Inter, sans-serif">{i + 1}. {w.label}</text>
            </g>
          );
        })}
      </g>

      {/* --- T568B (Right) --- */}
      <g>
        <text x="445" y="38" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold">มาตรฐาน T568B (หลักที่ใช้ในไทย) ⭐</text>
        {/* Plug Body */}
        <rect x="390" y="46" width="110" height="66" rx="6" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
        {/* Metallic Contacts Shield */}
        <rect x="395" y="51" width="100" height="10" rx="1.5" fill="#0f172a" />
        {/* Wires inside plug */}
        {t568b.map((w, i) => {
          const xWire = 390 + 10 + i * 11;
          return (
            <g key={i}>
              <rect x={xWire} y="64" width="9" height="38" rx="1" fill={w.color} />
              {w.stripe && <line x1={xWire} y1="64" x2={xWire + 9} y2="102" stroke="white" strokeWidth="2" opacity="0.6" />}
              <text x={xWire + 4.5} y="60" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="bold">{i + 1}</text>
            </g>
          );
        })}
        {/* Vertical list under T568B */}
        {t568b.map((w, i) => {
          const yRow = 145 + i * 26;
          const xWire = 390 + 10 + i * 11;
          return (
            <g key={i}>
              {/* Fan-out wire from plug pin to list box */}
              <path d={`M ${xWire + 4.5} 112 C ${xWire + 4.5} 128, 407 128, 407 ${yRow + 7}`} fill="none" stroke={w.color} strokeWidth="1.5" opacity="0.75" />
              {/* Color Box */}
              <rect x="400" y={yRow} width="14" height="14" rx="2.5" fill={w.stripe ? "#fff" : w.color} stroke={w.color} strokeWidth="1.5" />
              {w.stripe && <line x1="400" y1={yRow + 14} x2="414" y2={yRow} stroke={w.color} strokeWidth="2.5" />}
              {/* Text */}
              <text x="422" y={yRow + 11} textAnchor="start" fill="#e8eaf0" fontSize="10.5" fontFamily="Inter, sans-serif">{i + 1}. {w.label}</text>
            </g>
          );
        })}
      </g>

      {/* --- Middle Connections & Crossover Paths --- */}
      <text x="280" y="136" textAnchor="middle" fill="#f59e0b" fontSize="10.5" fontWeight="bold">🔄 Crossover (สูตรลัดการสลับคู่สาย)</text>

      {t568a.map((w, i) => {
        const yStart = 145 + i * 26 + 7;
        const j = targetB[i];
        const yEnd = 145 + j * 26 + 7;
        const isSwapped = i !== j;

        if (isSwapped) {
          // Green or orange crossover curves
          const strokeColor = w.color;
          const markerName = strokeColor === "#22c55e" ? "arrow-green" : "arrow-orange";

          return (
            <g key={i}>
              {/* Left connection node */}
              <circle cx="170" cy={yStart} r="3" fill="#1e293b" stroke={strokeColor} strokeWidth="1.5" />
              {/* Curve path */}
              <path
                d={`M 170 ${yStart} C 280 ${yStart}, 280 ${yEnd}, 390 ${yEnd}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeDasharray={w.stripe ? "5 3" : undefined}
                markerEnd={`url(#${markerName})`}
              />
            </g>
          );
        } else {
          // Unchanged lines (blue and brown) drawn with subtle styling
          return (
            <g key={i}>
              {/* Left node */}
              <circle cx="170" cy={yStart} r="2.5" fill="#1e293b" stroke="#4a5568" strokeWidth="1.2" opacity="0.5" />
              {/* Straight line */}
              <line
                x1="170"
                y1={yStart}
                x2="390"
                y2={yEnd}
                stroke="#4a5568"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.5"
              />
              {/* Right node */}
              <circle cx="390" cy={yEnd} r="2.5" fill="#1e293b" stroke="#4a5568" strokeWidth="1.2" opacity="0.5" />
            </g>
          );
        }
      })}

      <text x="280" y="364" textAnchor="middle" fill="#8892a4" fontSize="10">พินที่นิ่งอยู่กับที่: พิน 4-5 (คู่สีน้ำเงิน) และ พิน 7-8 (คู่สีน้ำตาล) จะล็อกอยู่ที่เดิมเสมอ ไม่เปลี่ยนตำแหน่ง</text>
    </svg>
  );
}

/* --- Straight-Through vs Crossover Cable --- */
function DiagramCableType() {
  return (
    <svg viewBox="0 0 560 230" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="15" fontWeight="bold">รูปแบบการเชื่อมต่อ: สายตรง vs สายไขว้</text>
      {/* Straight Through */}
      <text x="140" y="44" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold">✅ สายตรง (Straight-Through)</text>
      <text x="140" y="58" textAnchor="middle" fill="#4a5568" fontSize="10">T568B ↔ T568B (เหมือนกัน)</text>
      {/* Left RJ45 */}
      <rect x="30" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
      {["#fb923c", "#fb923c", "#22c55e", "#3b82f6", "#3b82f6", "#22c55e", "#c8a285", "#92400e"].map((c, i) => (
        <rect key={i} x={33 + i * 3} y="70" width="2.5" height="70" fill={c} />
      ))}
      {/* Wires going straight */}
      {["#fb923c", "#fb923c", "#22c55e", "#3b82f6", "#3b82f6", "#22c55e", "#c8a285", "#92400e"].map((c, i) => (
        <line key={i} x1="58" y1={72 + i * 8.5} x2="192" y2={72 + i * 8.5} stroke={c} strokeWidth="1.5" />
      ))}
      {/* Right RJ45 */}
      <rect x="192" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
      {["#fb923c", "#fb923c", "#22c55e", "#3b82f6", "#3b82f6", "#22c55e", "#c8a285", "#92400e"].map((c, i) => (
        <rect key={i} x={195 + i * 3} y="70" width="2.5" height="70" fill={c} />
      ))}
      {/* Use case icons */}
      <text x="50" y="162" textAnchor="middle" fill="#94a3b8" fontSize="18">💻</text>
      <text x="210" y="162" textAnchor="middle" fill="#94a3b8" fontSize="18">🔀</text>
      <text x="130" y="175" textAnchor="middle" fill="#94a3b8" fontSize="10">PC → Switch/Router</text>

      {/* Crossover */}
      <text x="420" y="44" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">⚡ สายไขว้ (Crossover)</text>
      <text x="420" y="58" textAnchor="middle" fill="#4a5568" fontSize="10">T568A ↔ T568B (ต่างกัน)</text>
      {/* Left RJ45 A */}
      <rect x="310" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
      {["#22c55e", "#22c55e", "#fb923c", "#3b82f6", "#3b82f6", "#fb923c", "#c8a285", "#92400e"].map((c, i) => (
        <rect key={i} x={313 + i * 3} y="70" width="2.5" height="70" fill={c} />
      ))}
      {/* Crossover wires (pin 1↔3, 2↔6 crossed) */}
      <line x1="338" y1="72" x2="472" y2="97" stroke="#22c55e" strokeWidth="1.5" />
      <line x1="338" y1="80" x2="472" y2="122" stroke="#22c55e" strokeWidth="1.5" />
      <line x1="338" y1="89" x2="472" y2="72" stroke="#fb923c" strokeWidth="1.5" />
      <line x1="338" y1="97" x2="472" y2="80" stroke="#fb923c" strokeWidth="1.5" />
      {["#3b82f6", "#3b82f6", "#c8a285", "#92400e"].map((c, i) => (
        <line key={i} x1="338" y1={106 + i * 8.5} x2="472" y2={106 + i * 8.5} stroke={c} strokeWidth="1.5" />
      ))}
      {/* Right RJ45 B */}
      <rect x="472" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
      {["#fb923c", "#fb923c", "#22c55e", "#3b82f6", "#3b82f6", "#22c55e", "#c8a285", "#92400e"].map((c, i) => (
        <rect key={i} x={475 + i * 3} y="70" width="2.5" height="70" fill={c} />
      ))}
      <text x="330" y="162" textAnchor="middle" fill="#94a3b8" fontSize="18">💻</text>
      <text x="490" y="162" textAnchor="middle" fill="#94a3b8" fontSize="18">💻</text>
      <text x="410" y="175" textAnchor="middle" fill="#94a3b8" fontSize="10">PC ↔ PC หรือ Switch ↔ Switch</text>
      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="11">📌 ปัจจุบันอุปกรณ์รุ่นใหม่มี Auto MDI-X แต่ต้องจำไว้เพื่อการสอบ</text>
    </svg>
  );
}

/* --- Crimping Steps Animation --- */
function DiagramCrimpSteps() {
  const steps = [
    { num: "1", icon: "🔌", label: "สวมปลอก Boot", color: "#22d3ee" },
    { num: "2", icon: "✂️", label: "ปอกสาย 3 ซม.", color: "#22c55e" },
    { num: "3", icon: "🎨", label: "เรียงสี T568B", color: "#f59e0b" },
    { num: "4", icon: "📏", label: "ตัดปลาย 1.5 ซม.", color: "#f97316" },
    { num: "5", icon: "🔷", label: "สอดเข้าหัว RJ-45", color: "#a78bfa" },
    { num: "6", icon: "🔨", label: "ย้ำด้วยคีม", color: "#ef4444" },
    { num: "7", icon: "✅", label: "ทดสอบ LAN Tester", color: "#22c55e" },
  ];
  return (
    <svg viewBox="0 0 560 230" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="15" fontWeight="bold">ขั้นตอนการเข้าหัว RJ-45 (7 ขั้นตอน)</text>
      {steps.map((s, i) => {
        const cx = 42 + i * 72;
        const cy = 110;
        return (
          <g key={i}>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <line x1={cx + 28} y1={cy} x2={cx + 72 - 28} y2={cy} stroke="#334155" strokeWidth="2" strokeDasharray="4 2">
                <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1 + i * 0.2}s`} repeatCount="indefinite" />
              </line>
            )}
            {/* Circle */}
            <circle cx={cx} cy={cy} r="28" fill="#1e293b" stroke={s.color} strokeWidth="2">
              <animate attributeName="r" values="27;29;27" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18">{s.icon}</text>
            <text x={cx} y={cy + 15} textAnchor="middle" fill={s.color} fontSize="9" fontWeight="bold">{s.num}</text>
            {/* Label */}
            <text x={cx} y={cy + 46} textAnchor="middle" fill="#94a3b8" fontSize="9">{s.label.split(' ').map((w: string, wi: number) => (
              <tspan key={wi} x={cx} dy={wi === 0 ? 0 : 11}>{w}</tspan>
            ))}</text>
          </g>
        );
      })}
      {/* Animated packet */}
      <circle r="6" fill="#facc15" opacity="0">
        <animate attributeName="cx" values="42;114;186;258;330;402;474" calcMode="discrete" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="cy" values="110;110;110;110;110;110;110" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;1;1;1;1;1;0" keyTimes="0;0.14;0.28;0.43;0.57;0.71;0.86;1" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <text x="280" y="185" textAnchor="middle" fill="#8892a4" fontSize="11">ทำตามลำดับครบทั้ง 7 ขั้นตอน เพื่อให้สายแลนมีคุณภาพและผ่านการทดสอบ</text>
      <text x="280" y="200" textAnchor="middle" fill="#4a5568" fontSize="10">⚠️ ระวัง: สอดสายให้ทองแดงชนสุดก่อนย้ำ และตรวจสีก่อนทุกครั้ง</text>
    </svg>
  );
}

/* --- LAN Tester Animation --- */
function DiagramLANTester() {
  const straight = [1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <svg viewBox="0 0 560 240" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="15" fontWeight="bold">การทดสอบสายแลนด้วย LAN Tester</text>
      {/* Tester Left (Master) */}
      <rect x="60" y="50" width="90" height="130" rx="8" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
      <text x="105" y="72" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold">MASTER</text>
      {straight.map((n, i) => {
        const pinsColor = ["#fb923c", "#fb923c", "#22c55e", "#3b82f6", "#3b82f6", "#22c55e", "#c8a285", "#92400e"][i];
        return (
          <g key={i}>
            <circle cx="135" cy={83 + i * 12} r="4" fill="#0f172a" stroke={pinsColor} strokeWidth="1.5">
              <animate attributeName="fill" values={`#0f172a;${pinsColor};#0f172a`} dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
            </circle>
            <text x="75" y={87 + i * 12} textAnchor="middle" fill={pinsColor} fontSize="9">Pin {n}</text>
          </g>
        );
      })}
      {/* Cable Line */}
      {straight.map((_, i) => (
        <line key={i} x1="135" y1={83 + i * 12} x2="365" y2={83 + i * 12} stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2">
          <animate attributeName="stroke" values={["#334155", "#22c55e", "#334155"].join(";")} dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
        </line>
      ))}
      {/* Light Animation Ball */}
      {straight.map((_, i) => (
        <circle key={i} cx="135" cy={83 + i * 12} r="3" fill="#22c55e" opacity="0">
          <animate attributeName="cx" values="135;365" dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Tester Right (Remote) */}
      <rect x="365" y="50" width="90" height="130" rx="8" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
      <text x="410" y="72" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">REMOTE</text>
      {straight.map((n, i) => {
        const pinsColor = ["#fb923c", "#fb923c", "#22c55e", "#3b82f6", "#3b82f6", "#22c55e", "#c8a285", "#92400e"][i];
        return (
          <g key={i}>
            <circle cx="370" cy={83 + i * 12} r="4" fill="#0f172a" stroke={pinsColor} strokeWidth="1.5">
              <animate attributeName="fill" values={`#0f172a;${pinsColor};#0f172a`} dur="1s" begin={`${i * 0.12 + 0.6}s`} repeatCount="indefinite" />
            </circle>
            <text x="440" y={87 + i * 12} textAnchor="middle" fill={pinsColor} fontSize="9">Pin {n}</text>
          </g>
        );
      })}
      <text x="280" y="200" textAnchor="middle" fill="#8892a4" fontSize="11">✅ สายตรง: ไฟวิ่ง 1→1, 2→2, ... 8→8 (ตรงกันทั้ง 8 ขา)</text>
      <text x="280" y="215" textAnchor="middle" fill="#f59e0b" fontSize="10">⚠️ สายไขว้: ไฟวิ่ง 1→3, 2→6, 3→1, 6→2 (สลับกัน)</text>
      <text x="280" y="228" textAnchor="middle" fill="#ef4444" fontSize="10">❌ หากไฟดับ หรือวิ่งผิดขา = ต้องเข้าหัวใหม่</text>
    </svg>
  );
}

/* --- Full Network Topology Animation --- */
function DiagramAnimNetworkFull() {
  return (
    <svg viewBox="0 0 560 260" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="16" fontWeight="bold">สรุปการเชื่อมต่อระบบเครือข่ายองค์กร (Network Topology)</text>

      {/* The Internet (Cloud) */}
      <path d="M 50 100 Q 50 70 80 70 Q 100 40 130 60 Q 160 40 170 70 Q 200 80 180 110 Q 200 130 160 140 Q 120 160 80 140 Q 40 130 50 100 Z" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      <text x="115" y="105" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">Internet</text>

      {/* Gateway / Router */}
      <rect x="230" y="70" width="60" height="60" rx="30" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
      <text x="260" y="105" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">Router</text>

      {/* Internet to Router link */}
      <line x1="175" y1="100" x2="230" y2="100" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2">
        <animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite" />
      </line>

      {/* Core Switch */}
      <rect x="340" y="80" width="80" height="40" rx="4" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
      <text x="380" y="105" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold">Switch</text>

      {/* Router to Switch link */}
      <line x1="290" y1="100" x2="340" y2="100" stroke="#8b5cf6" strokeWidth="2" />

      {/* PC 1 (Wired) */}
      <rect x="470" y="40" width="50" height="30" rx="2" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
      <text x="495" y="60" textAnchor="middle" fill="#10b981" fontSize="10">PC (LAN)</text>

      {/* Switch to PC link */}
      <line x1="420" y1="90" x2="470" y2="55" stroke="#10b981" strokeWidth="2" />

      {/* Server (Wired) */}
      <rect x="470" y="90" width="50" height="40" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
      <text x="495" y="115" textAnchor="middle" fill="#f59e0b" fontSize="10">Server</text>

      {/* Switch to Server link */}
      <line x1="420" y1="100" x2="470" y2="110" stroke="#f59e0b" strokeWidth="2" />

      {/* Access Point */}
      <circle cx="380" cy="180" r="20" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
      <text x="380" y="184" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold">AP</text>

      {/* Switch to AP link */}
      <line x1="380" y1="120" x2="380" y2="160" stroke="#06b6d4" strokeWidth="2" />

      {/* Mobile Device (Wi-Fi) */}
      <rect x="470" y="170" width="30" height="40" rx="4" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
      <text x="485" y="195" textAnchor="middle" fill="#06b6d4" fontSize="10">📱</text>

      {/* Wi-Fi Waves */}
      <g stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0">
        <path d="M 410 170 A 20 20 0 0 1 410 190" />
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
      </g>
      <g stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0">
        <path d="M 425 160 A 40 40 0 0 1 425 200" />
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
      </g>

      {/* Data packet traveling from PC to Internet */}
      <circle cx="470" cy="55" r="4" fill="#10b981">
        <animate attributeName="cx" values="470;380;260;115" keyTimes="0;0.3;0.6;1" dur="3s" repeatCount="indefinite" />
        <animate attributeName="cy" values="55;100;100;105" keyTimes="0;0.3;0.6;1" dur="3s" repeatCount="indefinite" />
      </circle>

      <text x="280" y="240" textAnchor="middle" fill="#8892a4" fontSize="12">PC และ Server เชื่อมต่อด้วยสายเข้า Switch ➜ มือถือเชื่อมผ่าน AP ➜ ทั้งหมดออก Internet ผ่าน Router (Gateway)</text>
    </svg>
  );
}

/* --- Week 2 Custom Interactive Animated Diagrams --- */
function DiagramTerminalSim() {
  const [activeTab, setActiveTab] = useState("pwd");
  const [typedText, setTypedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const terminalData: Record<string, {
    cmd: string;
    description: string;
    explanation: string;
    output: string[];
    spacedCmd?: string;
  }> = {
    "pwd": {
      cmd: "pwd",
      description: "เช็กพิกัดปัจจุบัน (GPS)",
      explanation: "คำสั่งแสดงเส้นทางโฟลเดอร์ปัจจุบันที่เราทำงานอยู่ (Print Working Directory)",
      output: [
        "/home/student"
      ]
    },
    "ls": {
      cmd: "ls -la",
      spacedCmd: "ls[เว้นวรรค]-la",
      description: "ส่องสิ่งของในโฟลเดอร์",
      explanation: "คำสั่งแสดงรายชื่อไฟล์และโฟลเดอร์ทั้งหมด รวมถึงไฟล์ระบบที่ถูกซ่อน (-la)",
      output: [
        "total 24",
        "drwxr-xr-x 4 student student 4096 May 25 10:50 .",
        "drwxr-xr-x 3 root    root    4096 May 25 10:45 ..",
        "-rw-r--r-- 1 student student  220 May 25 10:45 .bash_logout",
        "-rw-r--r-- 1 student student 3771 May 25 10:45 .bashrc",
        "drwxr-xr-x 2 student student 4096 May 25 10:50 Documents",
        "-rw-r--r-- 1 student student    0 May 25 10:50 note.txt"
      ]
    },
    "cd": {
      cmd: "cd Documents",
      spacedCmd: "cd[เว้นวรรค]Documents",
      description: "เดินทางเข้าห้องย่อย",
      explanation: "คำสั่งเปลี่ยนไดเรกทอรีการทำงาน (Change Directory) ไปยังโฟลเดอร์ปลายทาง Documents",
      output: [
        "student@ubuntu-server:~/Documents$ "
      ]
    },
    "cd-back": {
      cmd: "cd ..",
      spacedCmd: "cd[เว้นวรรค]..",
      description: "ปีนถอยหลัง 1 ชั้น",
      explanation: "คำสั่งถอยหลังกลับไปโฟลเดอร์ระดับบน 1 ระดับ ห้ามพิมพ์ cd.. ชิดกันเด็ดขาด!",
      output: [
        "student@ubuntu-server:~$ "
      ]
    },
    "mkdir": {
      cmd: "mkdir lab-week2",
      spacedCmd: "mkdir[เว้นวรรค]lab-week2",
      description: "สร้างโฟลเดอร์ใหม่",
      explanation: "คำสั่งสร้างโฟลเดอร์ย่อยใหม่ (Make Directory) ห้ามเว้นวรรคในชื่อโฟลเดอร์",
      output: [
        "(สร้างโฟลเดอร์ lab-week2 สำเร็จ - ลองสั่ง ls เพื่อตรวจดู)"
      ]
    },
    "touch": {
      cmd: "touch my-profile.txt",
      spacedCmd: "touch[เว้นวรรค]my-profile.txt",
      description: "เสกสร้างไฟล์เปล่า",
      explanation: "คำสั่งสร้างไฟล์ใหม่ขนาด 0 ไบต์ หรืออัปเดตเวลาการแก้ไขไฟล์",
      output: [
        "(สร้างไฟล์ my-profile.txt สำเร็จ - ลองสั่ง ls เพื่อตรวจดู)"
      ]
    },
    "nano": {
      cmd: "nano profile.txt",
      spacedCmd: "nano[เว้นวรรค]profile.txt",
      description: "เขียนและแก้ไขข้อความ",
      explanation: "คำสั่งเปิดโปรแกรมแก้ไขข้อความในคอนโซล (Text Editor) บันทึกด้วย Ctrl+O และออกด้วย Ctrl+X",
      output: [
        "[ GNU nano 7.2              profile.txt              Modified ]",
        "สมชาย เรียนดี",
        "รหัสประจำตัวนักศึกษา ปวส.1",
        "IP Address: 192.168.1.100",
        "",
        "^G Help      ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos",
        "^X Exit      ^R Justify   ^W Where Is  ^V Next Pg   ^U Uncut Text^T To Spell"
      ]
    },
    "cat": {
      cmd: "cat my-profile.txt",
      spacedCmd: "cat[เว้นวรรค]my-profile.txt",
      description: "เปิดแสดงข้อความไฟล์",
      explanation: "คำสั่งแสดงข้อมูลตัวอักษรทั้งหมดที่อยู่ข้างในไฟล์ออกมาทางหน้าจอดำทันที",
      output: [
        "สมชาย เรียนดี",
        "ปวส.1 แผนกเทคโนโลยีสารสนเทศ",
        "IP Address: 192.168.1.100"
      ]
    },
    "rm": {
      cmd: "rm my-profile.txt",
      spacedCmd: "rm[เว้นวรรค]my-profile.txt",
      description: "ทำลายไฟล์ถาวร",
      explanation: "คำสั่งลบไฟล์ออกจากระบบถาวรทันที ไม่มีถังขยะพักไฟล์ โปรดใช้ด้วยความระมัดระวัง!",
      output: [
        "(ลบไฟล์ my-profile.txt สำเร็จ - ไฟล์สลายตัวถาวร)"
      ]
    },
    "ip-a": {
      cmd: "ip a",
      spacedCmd: "ip[เว้นวรรค]a",
      description: "ตรวจสอบ IP Address",
      explanation: "คำสั่งตรวจสอบที่อยู่เครือข่ายและสถานะการ์ดแลนทั้งหมดบนเครื่องเซิร์ฟเวอร์",
      output: [
        "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000",
        "    inet 127.0.0.1/8 scope host lo",
        "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000",
        "    inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic eth0",
        "    valid_lft 86321sec preferred_lft 86321sec"
      ]
    }
  };

  const data = terminalData[activeTab] || terminalData.pwd;

  useEffect(() => {
    setTypedText("");
    setIsTypingComplete(false);

    const fullText = data.cmd;
    let currentText = "";
    let index = 0;

    const interval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText[index];
        setTypedText(currentText);
        index++;
      } else {
        clearInterval(interval);
        setIsTypingComplete(true);
      }
    }, 45); // 45ms per character typing speed

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", fontFamily: "Inter, sans-serif" }}>
      {/* Tab Navigation */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
        {Object.entries(terminalData).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid " + (activeTab === key ? "var(--accent)" : "var(--border)"),
              background: activeTab === key ? "var(--accent-dim)" : "var(--bg-surface)",
              color: activeTab === key ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all var(--transition)"
            }}
          >
            {item.cmd}
          </button>
        ))}
      </div>

      {/* Description Panel */}
      <div style={{ marginBottom: "12px", background: "var(--bg-elevated)", padding: "10px 14px", borderRadius: "8px", borderLeft: "4px solid var(--accent)" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>{data.description}</div>
        <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>{data.explanation}</div>
      </div>

      {/* Terminal Display */}
      <div className="mock-terminal" style={{
        flex: 1,
        background: "#0f172a",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        textAlign: "left",
        overflowY: "auto",
        minHeight: "180px"
      }}>
        {/* Terminal Header */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", opacity: 0.6 }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }}></span>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#eab308" }}></span>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }}></span>
          <span style={{ color: "#94a3b8", fontSize: "10px", marginLeft: "10px", fontFamily: "Inter, sans-serif" }}>Ubuntu Terminal (Simulated)</span>
        </div>

        {/* Command Line Prompt */}
        <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
          <span style={{ color: "#4ade80", fontWeight: "bold" }}>student@ubuntu-server</span>
          <span style={{ color: "#e2e8f0" }}>:</span>
          <span style={{ color: "#38bdf8", fontWeight: "bold" }}>~</span>
          <span style={{ color: "#e2e8f0" }}>$ </span>

          {/* Main command with formatting */}
          {!isTypingComplete ? (
            <span style={{ color: "#f472b6", fontWeight: "bold" }}>{typedText}</span>
          ) : data.spacedCmd ? (
            <span>
              {data.spacedCmd.split("[เว้นวรรค]").map((part, index, arr) => (
                <span key={index}>
                  <span style={{ color: index === 0 ? "#f472b6" : "#60a5fa", fontWeight: "bold" }}>{part}</span>
                  {index < arr.length - 1 && (
                    <span style={{
                      display: "inline-block",
                      background: "rgba(234, 179, 8, 0.25)",
                      border: "1px dashed #eab308",
                      color: "#fbbf24",
                      fontSize: "9px",
                      padding: "0px 4px",
                      borderRadius: "3px",
                      margin: "0px 4px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "bold",
                      verticalAlign: "middle"
                    }}>[เว้นวรรค]</span>
                  )}
                </span>
              ))}
            </span>
          ) : (
            <span style={{ color: "#f472b6", fontWeight: "bold" }}>{data.cmd}</span>
          )}
          <span className="terminal-cursor" style={{
            display: "inline-block",
            width: "7px",
            height: "14px",
            background: "#38bdf8",
            marginLeft: "4px",
            verticalAlign: "middle"
          }}></span>
        </div>

        {/* Terminal Output */}
        <div style={{
          marginTop: "8px",
          color: "#94a3b8",
          fontSize: "11px",
          lineHeight: "1.4",
          whiteSpace: "pre-wrap",
          opacity: isTypingComplete ? 1 : 0,
          transform: isTypingComplete ? "translateY(0)" : "translateY(5px)",
          transition: "opacity 0.3s ease, transform 0.3s ease"
        }}>
          {data.output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Week 2 Custom Interactive Animated Diagrams --- */
function DiagramInstallationSteps() {
  const textStyle = { fill: "var(--text-primary)", fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: "bold" };
  const descStyle = { fill: "var(--text-secondary)", fontSize: 8, fontFamily: "Inter, sans-serif" };
  const nodeBg = { fill: "var(--accent-dim)", stroke: "var(--accent)", strokeWidth: 2, rx: 6 };

  const steps = [
    { num: "1", title: "สร้างเครื่องเสมือน (VM)", sub: "RAM 2GB / HDD 20GB", x: 10, y: 30, w: 160, h: 45 },
    { num: "2", title: "เปิดเครื่อง & เลือกภาษา", sub: "เมาส์ใช้ไม่ได้ / คีย์บอร์ดเท่านั้น", x: 190, y: 30, w: 160, h: 45 },
    { num: "3", title: "ตั้งค่าการสื่อสาร (DHCP)", sub: "รับ IP อัตโนมัติ", x: 370, y: 30, w: 160, h: 45 },
    { num: "4", title: "แบ่งพื้นที่ฮาร์ดดิสก์", sub: "Use entire disk (20GB)", x: 370, y: 110, w: 160, h: 45 },
    { num: "5", title: "ตั้งชื่อผู้ใช้ & รหัสผ่าน", sub: "Username / Password ห้ามลืม!", x: 190, y: 110, w: 160, h: 45 },
    { num: "6", title: "เสร็จสิ้นและรีบูตระบบ", sub: "Reboot Now / เอาแผ่น ISO ออก", x: 10, y: 110, w: 160, h: 45 },
  ];

  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Step connection paths with dashoffset animation flowing forward/backward */}
      {/* Step 1 to 2 */}
      <line x1="170" y1="52.5" x2="190" y2="52.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="1s" repeatCount="indefinite" />
      </line>
      <polygon points="190,49.5 195,52.5 190,55.5" fill="var(--accent)" />

      {/* Step 2 to 3 */}
      <line x1="350" y1="52.5" x2="370" y2="52.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="1s" repeatCount="indefinite" />
      </line>
      <polygon points="370,49.5 375,52.5 370,55.5" fill="var(--accent)" />

      {/* Step 3 to 4 */}
      <path d="M 530 52.5 L 545 52.5 L 545 132.5 L 530 132.5" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="1s" repeatCount="indefinite" />
      </path>
      <polygon points="530,129.5 525,132.5 530,135.5" fill="var(--accent)" />

      {/* Step 4 to 5 */}
      <line x1="370" y1="132.5" x2="350" y2="132.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite" />
      </line>
      <polygon points="350,129.5 345,132.5 350,135.5" fill="var(--accent)" />

      {/* Step 5 to 6 */}
      <line x1="190" y1="132.5" x2="170" y2="132.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite" />
      </line>
      <polygon points="170,129.5 165,132.5 170,135.5" fill="var(--accent)" />

      {steps.map((st, i) => (
        <g key={i}>
          {/* Radar halo waves */}
          <circle cx={st.x + 15} cy={st.y + 22} r="10" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </circle>

          <rect x={st.x} y={st.y} width={st.w} height={st.h} {...nodeBg} />
          <circle cx={st.x + 15} cy={st.y + 22} r="10" fill="var(--accent)" />
          <text x={st.x + 15} y={st.y + 25} fill="var(--bg-surface)" fontSize={9} fontFamily="Inter, sans-serif" fontWeight="bold" textAnchor="middle">{st.num}</text>
          <text x={st.x + 32} y={st.y + 18} {...textStyle} textAnchor="start">{st.title}</text>
          <text x={st.x + 32} y={st.y + 34} {...descStyle} textAnchor="start">{st.sub}</text>
        </g>
      ))}

      {/* Staggered Animated Flow Packets moving along the exact steps path */}
      <circle cx="0" cy="0" r="4" fill="var(--green)" opacity="0.9">
        <animateMotion
          path="M 90 52.5 L 270 52.5 L 450 52.5 L 530 52.5 L 545 52.5 L 545 132.5 L 530 132.5 L 450 132.5 L 270 132.5 L 90 132.5 Z"
          dur="6s"
          repeatCount="indefinite"
          begin="0s"
        />
      </circle>
      <circle cx="0" cy="0" r="4" fill="var(--green)" opacity="0.6">
        <animateMotion
          path="M 90 52.5 L 270 52.5 L 450 52.5 L 530 52.5 L 545 52.5 L 545 132.5 L 530 132.5 L 450 132.5 L 270 132.5 L 90 132.5 Z"
          dur="6s"
          repeatCount="indefinite"
          begin="2s"
        />
      </circle>
      <circle cx="0" cy="0" r="4" fill="var(--green)" opacity="0.3">
        <animateMotion
          path="M 90 52.5 L 270 52.5 L 450 52.5 L 530 52.5 L 545 52.5 L 545 132.5 L 530 132.5 L 450 132.5 L 270 132.5 L 90 132.5 Z"
          dur="6s"
          repeatCount="indefinite"
          begin="4s"
        />
      </circle>

      <text x="280" y="185" textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="Inter, sans-serif">
        แผนผังกระบวนการติดตั้ง Ubuntu Server 26.04 LTS ทั้งหมด 6 ขั้นตอนหลักแบบเป็นลำดับ
      </text>
    </svg>
  );
}

function DiagramLinuxDir() {
  const lineStyle = { stroke: "var(--accent)", strokeWidth: 2, fill: "none" };
  const textStyle = { fill: "var(--text-primary)", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: "bold" };
  const descStyle = { fill: "var(--text-secondary)", fontSize: 10, fontFamily: "Inter, sans-serif" };
  const nodeBg = { fill: "var(--bg-elevated)", stroke: "var(--accent)", strokeWidth: 1.5, rx: 6 };

  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Root Node (/) */}
      <rect x="230" y="15" width="100" height="36" {...nodeBg} strokeWidth={2} />
      <text x="280" y="37" {...textStyle} textAnchor="middle" fontSize={15} fill="var(--accent)">📁 / (Root)</text>

      {/* Main branches with glowing animated electricity flow */}
      {/* Root to bin */}
      <path d="M 280 51 L 280 75 L 80 75 L 80 110" {...lineStyle} strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="1.2s" repeatCount="indefinite" />
      </path>
      {/* Root to etc */}
      <path d="M 280 51 L 280 75 L 210 75 L 210 110" {...lineStyle} strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="1.2s" repeatCount="indefinite" />
      </path>
      {/* Root to home */}
      <path d="M 280 51 L 280 75 L 350 75 L 350 110" {...lineStyle} strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="1.2s" repeatCount="indefinite" />
      </path>
      {/* Root to var */}
      <path d="M 280 51 L 280 75 L 480 75 L 480 110" {...lineStyle} strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* /bin node */}
      <rect x="30" y="110" width="100" height="45" {...nodeBg} />
      <text x="80" y="128" {...textStyle} textAnchor="middle">📁 /bin</text>
      <text x="80" y="142" {...descStyle} textAnchor="middle">(คำสั่งระบบ / CLI)</text>

      {/* /etc node */}
      <rect x="160" y="110" width="100" height="45" {...nodeBg} />
      <text x="210" y="128" {...textStyle} textAnchor="middle">📁 /etc</text>
      <text x="210" y="142" {...descStyle} textAnchor="middle">(ตั้งค่าระบบ / Config)</text>

      {/* /home node */}
      <rect x="300" y="110" width="100" height="45" {...nodeBg} />
      <text x="350" y="128" {...textStyle} textAnchor="middle">📁 /home</text>
      <text x="350" y="142" {...descStyle} textAnchor="middle">(ห้องพักนักศึกษา)</text>

      {/* /var node */}
      <rect x="430" y="110" width="100" height="45" {...nodeBg} />
      <text x="480" y="128" {...textStyle} textAnchor="middle">📁 /var</text>
      <text x="480" y="142" {...descStyle} textAnchor="middle">(ข้อมูลแปรผัน / Log)</text>

      {/* Animated Flow Packets from Root (/) down the paths with staggered delay offsets */}
      <circle cx="0" cy="0" r="4.5" fill="var(--green)" opacity="0.9">
        <animateMotion
          path="M 280 51 L 280 75 L 80 75 L 80 110"
          dur="3.2s"
          repeatCount="indefinite"
          begin="0s"
        />
      </circle>
      <circle cx="0" cy="0" r="4.5" fill="var(--green)" opacity="0.9">
        <animateMotion
          path="M 280 51 L 280 75 L 210 75 L 210 110"
          dur="3.2s"
          repeatCount="indefinite"
          begin="0.8s"
        />
      </circle>
      <circle cx="0" cy="0" r="4.5" fill="var(--green)" opacity="0.9">
        <animateMotion
          path="M 280 51 L 280 75 L 350 75 L 350 110"
          dur="3.2s"
          repeatCount="indefinite"
          begin="1.6s"
        />
      </circle>
      <circle cx="0" cy="0" r="4.5" fill="var(--green)" opacity="0.9">
        <animateMotion
          path="M 280 51 L 280 75 L 480 75 L 480 110"
          dur="3.2s"
          repeatCount="indefinite"
          begin="2.4s"
        />
      </circle>

      <text x="280" y="185" textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="Inter, sans-serif">
        ลินุกซ์เริ่มต้นจากจุดเดียวคือ Root (/) แตกแขนงออกเป็นห้องย่อยๆ เสมือนรากต้นไม้
      </text>
    </svg>
  );
}

function DiagramCliConcept() {
  const textStyle = { fill: "var(--text-primary)", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: "bold" };
  const descStyle = { fill: "var(--text-secondary)", fontSize: 11, fontFamily: "Inter, sans-serif" };

  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* Dissected Blocks */}
      {/* 1. Command Block (ls) */}
      <rect x="60" y="50" width="100" height="50" rx="8" fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="2" />
      <text x="110" y="80" {...textStyle} textAnchor="middle" fontSize={20} fill="var(--accent)">ls</text>
      <text x="110" y="125" {...textStyle} textAnchor="middle" fontSize={12}>1. Command</text>
      <text x="110" y="145" {...descStyle} textAnchor="middle">(สั่งให้ทำอะไร)</text>

      {/* Operator Plus */}
      <text x="190" y="82" fontSize={24} fill="var(--text-muted)" textAnchor="middle">+</text>

      {/* 2. Option Block (-la) */}
      <rect x="220" y="50" width="110" height="50" rx="8" fill="rgba(22,163,74,.08)" stroke="var(--green)" strokeWidth="2" />
      <text x="275" y="80" {...textStyle} textAnchor="middle" fontSize={20} fill="var(--green)">-la</text>
      <text x="275" y="125" {...textStyle} textAnchor="middle" fontSize={12}>2. Option</text>
      <text x="275" y="145" {...descStyle} textAnchor="middle">(ระบุเงื่อนไข/ตัวเลือก)</text>

      {/* Operator Plus */}
      <text x="360" y="82" fontSize={24} fill="var(--text-muted)" textAnchor="middle">+</text>

      {/* 3. Argument Block (/var/log) */}
      <rect x="390" y="50" width="120" height="50" rx="8" fill="rgba(220,38,38,.08)" stroke="var(--red)" strokeWidth="2" />
      <text x="450" y="80" {...textStyle} textAnchor="middle" fontSize={16} fill="var(--red)">/var/log</text>
      <text x="450" y="125" {...textStyle} textAnchor="middle" fontSize={12}>3. Argument</text>
      <text x="450" y="145" {...descStyle} textAnchor="middle">(ระบุเป้าหมาย/ปลายทาง)</text>

      <text x="280" y="185" textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="Inter, sans-serif">
        โครงสร้าง: คำสั่งหลัก [ls] ➔ ส่งออปชันเงื่อนไข [-la] ➔ ทำงานบนเป้าหมาย [/var/log]
      </text>
    </svg>
  );
}

const DIAGRAMS: Record<string, React.FC> = {
  "terminal-sim": DiagramTerminalSim,
  "install-steps": DiagramInstallationSteps,
  "linux-dir": DiagramLinuxDir,
  "cli-concept": DiagramCliConcept,
  "client-server": DiagramClientServer,
  "dora-process": DiagramDORA,
  "dns-hierarchy": DiagramDNS,
  "nos-vs-desktop": DiagramNOSvsDesktop,
  "hypervisor": DiagramHypervisor,
  "n-tier": DiagramNTier,
  "anim-switch": DiagramAnimSwitch,
  "anim-router": DiagramAnimRouter,
  "anim-gateway": DiagramAnimGateway,
  "anim-ap": DiagramAnimAP,
  "anim-osi": DiagramAnimOSI,
  "anim-l4": DiagramAnimL4,
  "anim-l3": DiagramAnimL3,
  "anim-l2": DiagramAnimL2,
  "anim-l1": DiagramAnimL1,
  "anim-l7": DiagramAnimL7,
  "anim-l6": DiagramAnimL6,
  "anim-l5": DiagramAnimL5,
  "anim-network-full": DiagramAnimNetworkFull,
  /* RJ-45 Diagrams */
  "utp-anatomy": DiagramUTPAnatomy,
  "color-code": DiagramColorCode,
  "cable-type": DiagramCableType,
  "crimp-steps": DiagramCrimpSteps,
  "lan-tester": DiagramLANTester,
};

function DiagramSlide({ s }: { s: SlideData }) {
  const Diagram = s.diagramType ? DIAGRAMS[s.diagramType] : null;
  return (
    <div className="slide slide-diagram">
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>
      <div className="diagram-body">
        <div className="diagram-svg-wrap">
          {s.image && <div className="diagram-img"><img src={s.image} alt="" /></div>}
          {Diagram && <div className="diagram-svg"><Diagram /></div>}
          {!s.image && !Diagram && <div style={{ color: "var(--text-muted)", fontSize: 12 }}>ไม่พบเนื้อหา</div>}
        </div>
        {s.description && <p className="diagram-desc" style={{ whiteSpace: "pre-line" }}>{s.description}</p>}
        {s.items && s.items.length > 0 && (
          <ul className="diagram-points">
            {s.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function WaygroundSlide({ s }: { s: SlideData }) {
  const [downloading, setDownloading] = useState(false);

  const w2Questions = [
    { q: "คำสั่งใดใช้แสดงตำแหน่งโฟลเดอร์ปัจจุบันที่กำลังทำงานอยู่?", a: "pwd", options: ["ls", "cd", "pwd", "mkdir"] },
    { q: "คำสั่ง ls -la ทำงานอย่างไร?", a: "แสดงไฟล์ทั้งหมดรวมไฟล์ซ่อน", options: ["ลบไฟล์ทั้งหมด", "แสดงไฟล์ทั้งหมดรวมไฟล์ซ่อน", "สร้างโฟลเดอร์ใหม่", "เปลี่ยนตำแหน่งทำงาน"] },
    { q: "ข้อใดเป็นวิธีถอยกลับขึ้น 1 ระดับโฟลเดอร์ที่ถูกต้อง?", a: "cd ..", options: ["cd..", "cd ..", "cd/", "cd ~"] },
    { q: "หากพิมพ์ mkdir project homework จะเกิดอะไรขึ้น?", a: "สร้าง 2 โฟลเดอร์แยกกัน", options: ["สร้าง 1 โฟลเดอร์ชื่อ project homework", "ระบบฟ้อง error", "สร้าง 2 โฟลเดอร์แยกกัน", "ลบโฟลเดอร์เดิม"] },
    { q: "คำสั่ง touch สร้างอะไร?", a: "ไฟล์เปล่าขนาด 0 ไบต์", options: ["โฟลเดอร์เปล่า", "ไฟล์เปล่าขนาด 0 ไบต์", "สำเนาไฟล์", "ลิงก์ไฟล์"] },
    { q: "ปุ่มลัดใดใช้บันทึกไฟล์ใน nano?", a: "Ctrl+O แล้ว Enter", options: ["Ctrl+S แล้ว Enter", "Ctrl+O แล้ว Enter", "Ctrl+X แล้ว Enter", "Ctrl+C แล้ว Enter"] },
    { q: "คำสั่งใดใช้เปิดอ่านเนื้อหาในไฟล์โดยไม่เข้าสู่โหมดแก้ไข?", a: "cat", options: ["nano", "vim", "cat", "touch"] },
    { q: "ข้อใดเป็นจริงเกี่ยวกับคำสั่ง rm บนลินุกซ์?", a: "ไฟล์จะถูกลบถาวรทันที", options: ["ไฟล์จะย้ายไปถังขยะก่อน", "ไฟล์จะถูกลบถาวรทันที", "ไฟล์จะถูกซ่อนไว้ 30 วัน", "ระบบจะขอยืนยันเสมอ"] },
    { q: "คำสั่งใดใช้ตรวจสอบ IP Address ของเครื่อง?", a: "ip a", options: ["ping localhost", "ip a", "netstat -a", "ifconfig -v"] },
    { q: "คำสั่งหรือปุ่มลัดใดใช้เคลียร์หน้าจอเทอร์มินัล?", a: "clear หรือ Ctrl+L", options: ["exit", "reset", "clear หรือ Ctrl+L", "rm -rf"] }
  ];

  const w3Questions = [
    { q: "DHCP ย่อมาจากคำว่าอะไร?", a: "Dynamic Host Configuration Protocol", options: ["Dynamic Host Configuration Protocol", "Domain Host Control Program", "Data Host Connection Protocol", "Dynamic Hosting Control Platform"] },
    { q: "DHCP Server ทำหน้าที่สำคัญอะไรในเครือข่าย?", a: "แจกจ่าย IP Address และค่าเครือข่ายอัตโนมัติ", options: ["แปลงชื่อโดเมนเป็น IP Address", "แจกจ่าย IP Address และค่าเครือข่ายอัตโนมัติ", "รับส่งจดหมายอีเมลของโดเมน", "จัดเก็บไฟล์ของหน้าเว็บไซต์"] },
    { q: "ทำไมเครื่องคอมพิวเตอร์ลูกข่าย (Client) จึงต้องมีระยะเวลาเช่าใช้งาน IP Address (Lease Time)?", a: "เพื่อหมุนเวียนนำ IP Address กลับมาแจกจ่ายใหม่เมื่ออุปกรณ์อื่นไม่ได้เชื่อมต่อแล้ว", options: ["เพื่อช่วยเร่งความเร็วในการเชื่อมต่อ Wi-Fi", "เพื่อหมุนเวียนนำ IP Address กลับมาแจกจ่ายใหม่เมื่ออุปกรณ์อื่นไม่ได้เชื่อมต่อแล้ว", "เพื่อจำกัดเวลาเรียนของนักศึกษาในห้องเรียน", "เพื่อป้องกันการติดตั้งโปรแกรมแปลกปลอมในคอมพิวเตอร์"] },
    { q: "ในกระบวนการ DORA ของ DHCP ขั้นตอนแรกสุดที่ Client จะทำการ Broadcast เครือข่ายเพื่อค้นหา DHCP Server คืออะไร?", a: "DHCP Discover", options: ["DHCP Offer", "DHCP Request", "DHCP Discover", "DHCP Acknowledgment"] },
    { q: "เพราะเหตุใดในวงแลน (LAN) เดียวกันจึงควรมี DHCP Server เพียงตัวเดียว?", a: "เพื่อป้องกันปัญหาการชนกันหรือแจกจ่าย IP Address ซ้ำซ้อน (IP Conflict)", options: ["เพื่อประหยัดพลังงานเครื่องแม่ข่าย", "เพื่อควบคุมสิทธิ์ความปลอดภัยของผู้ใช้อินเทอร์เน็ต", "เพื่อป้องกันปัญหาการชนกันหรือแจกจ่าย IP Address ซ้ำซ้อน (IP Conflict)", "เพื่อเพิ่มความเร็วในการโอนถ่ายข้อมูลภายในระบบ"] },
    { q: "การตั้งค่า DHCP ในข้อใดเป็นตัวกำหนดว่าช่วงหมายเลข IP Address ใดที่จะถูกนำมาแจกจ่ายแก่ Client?", a: "Scope", options: ["Scope", "Lease Time", "Reservations", "Default Gateway"] },
    { q: "หากต้องการล็อกหมายเลข IP เดิมให้เครื่องพิมพ์ (Printer) ในเครือข่ายตลอดเวลา ควรใช้ฟังก์ชันใดใน DHCP?", a: "Reservations (การจอง IP จาก MAC Address)", options: ["Scope Expansion", "Lease Time Extension", "Reservations (การจอง IP จาก MAC Address)", "DHCP Relay"] },
    { q: "DNS ย่อมาจากคำว่าอะไร?", a: "Domain Name System", options: ["Domain Name System", "Dynamic Name Service", "Data Network System", "Digital Name Server"] },
    { q: "ข้อใดคือจุดประสงค์หลักของการมีระบบ DNS (Domain Name System) ในเครือข่ายคอมพิวเตอร์?", a: "เพื่อแปลงชื่อโดเมนที่มนุษย์เข้าใจง่ายเป็น IP Address ที่อุปกรณ์คอมพิวเตอร์เข้าใจ", options: ["เพื่อสแกนไวรัสในการรับส่งข้อมูลผ่านอีเมล", "เพื่อแปลงชื่อโดเมนที่มนุษย์เข้าใจง่ายเป็น IP Address ที่อุปกรณ์คอมพิวเตอร์เข้าใจ", "เพื่อเพิ่มความปลอดภัยจากการถูกแฮกรหัสผ่าน", "เพื่อป้องกันไม่ให้แอปพลิเคชันอื่นเข้าใช้งานเน็ตเวิร์ก"] },
    { q: "DNS Server ประเภทใดทำหน้าที่รับคำร้องขอสืบค้นจากผู้ใช้ แล้วออกไปค้นหาคำตอบจาก Root, TLD, และ Authoritative แทนเราจนได้ IP Address?", a: "Recursive DNS Server", options: ["Authoritative DNS Server", "Recursive DNS Server", "Secondary DNS Server", "Master DNS Server"] }
  ];

  const w3bQuestions = [
    { q: "คำสั่ง pwd ย่อมาจากคำว่าอะไร และทำหน้าที่อะไรในระบบลินุกซ์?", a: "Print Working Directory - แสดงเส้นทางพิกัดปัจจุบันที่เรากำลังอยู่", options: ["Path Word Directory - กำหนดรหัสผ่านของโฟลเดอร์", "Print Working Directory - แสดงเส้นทางพิกัดปัจจุบันที่เรากำลังอยู่", "Process Windows Driver - ตรวจสอบไดรเวอร์ของระบบ", "Public Web Directory - ค้นหาเว็บไซต์ภายนอกเครือข่าย"] },
    { q: "หากอยู่ที่ /home/student และต้องการย้ายเข้าไปในโฟลเดอร์ย่อยชื่อ labs ข้อใดเป็นคำสั่งที่ถูกต้อง?", a: "cd labs", options: ["cd labs", "ls labs", "pwd labs", "mkdir labs"] },
    { q: "หากต้องการสั่งย้อนกลับขึ้นไป 1 ระดับชั้นของไดเรกทอรี ต้องพิมพ์คำสั่งข้อใดที่ถูกต้อง?", a: "cd ..", options: ["cd..", "cd", "cd /", "cd .."] },
    { q: "การพิมพ์คำสั่ง mkdir folder1 folder2 บนเทอร์มินัล จะส่งผลอย่างไรต่อระบบไฟล์?", a: "สร้างโฟลเดอร์ใหม่แยกกัน 2 โฟลเดอร์ คือ folder1 และ folder2", options: ["สร้างโฟลเดอร์เดียวชื่อ folder1 folder2", "สร้างโฟลเดอร์ย่อย folder2 อยู่ด้านใน folder1", "สร้างโฟลเดอร์ใหม่แยกกัน 2 โฟลเดอร์ คือ folder1 และ folder2", "ระบบฟ้องข้อผิดพลาด (Syntax Error) เนื่องจากห้ามเว้นวรรค"] },
    { q: "คำสั่ง touch ในระบบปฏิบัติการลินุกซ์ มีวัตถุประสงค์หลักเพื่อทำสิ่งใด?", a: "สร้างไฟล์เปล่าขนาด 0 ไบต์ หรือใช้สำหรับอัปเดตข้อมูลเวลาของไฟล์", options: ["ลบไฟล์ที่ไม่มีการใช้งานออกจากเซิร์ฟเวอร์", "สร้างไฟล์เปล่าขนาด 0 ไบต์ หรือใช้สำหรับอัปเดตข้อมูลเวลาของไฟล์", "ย้ายตำแหน่งไฟล์ไปยังโฟลเดอร์รูท", "แก้ไขข้อความภายในไฟล์อย่างเร่งด่วน"] },
    { q: "วิธีการบันทึกข้อมูลและออกจากโปรแกรมแก้ไขข้อความ nano คือกดปุ่มลัดข้อใดตามลำดับ?", a: "Ctrl+O แล้ว Enter จากนั้น Ctrl+X", options: ["Ctrl+S แล้ว Enter จากนั้น Ctrl+Q", "Ctrl+W แล้ว Enter จากนั้น Ctrl+E", "Ctrl+O แล้ว Enter จากนั้น Ctrl+X", "Ctrl+C แล้ว Enter จากนั้น Ctrl+Z"] },
    { q: "คำสั่งใดใช้แสดงเนื้อหาข้อความทั้งหมดในไฟล์ออกหน้าจอคอนโซลทันที โดยไม่มีการเปิดโปรแกรมแก้ไข?", a: "cat", options: ["nano", "cat", "ls", "touch"] },
    { q: "หากพิมพ์คำสั่ง rm myfolder บนลินุกซ์เพื่อลบโฟลเดอร์ จะส่งผลอย่างไร?", a: "ระบบปฏิเสธการลบและแจ้ง error เนื่องจาก myfolder เป็นไดเรกทอรี (Directory)", options: ["โฟลเดอร์ถูกลบออกไปและเข้าไปเก็บในถังขยะชั่วคราว", "ระบบปฏิเสธการลบและแจ้ง error เนื่องจาก myfolder เป็นไดเรกทอรี (Directory)", "ลบเฉพาะโฟลเดอร์เปล่าทันที แต่หากมีไฟล์ข้างในระบบจะลบไม่ได้", "ลบโฟลเดอร์และไฟล์ทั้งหมดด้านในออกไปอย่างถาวรทันที"] },
    { q: "การใช้ตัวเลือกเสริม (Options) -la ในคำสั่ง ls -la จะส่งผลอย่างไรต่อการแสดงรายการไฟล์?", a: "แสดงรายละเอียดขนาด สิทธิ์ วันที่แก้ไข และแสดงไฟล์ที่ซ่อนอยู่ทั้งหมด", options: ["แสดงผลไฟล์เรียงตามลำดับความยาวของตัวอักษร", "แสดงรายละเอียดขนาด สิทธิ์ วันที่แก้ไข และแสดงไฟล์ที่ซ่อนอยู่ทั้งหมด", "คัดลอกไฟล์ทั้งหมดในโฟลเดอร์ปัจจุบันไปที่สำรองข้อมูล", "ล้างหน้าจอแสดงผลคำสั่งทั้งหมดให้สะอาด"] },
    { q: "คำสั่งใดใช้ตรวจสอบหมายเลข IP Address ของการ์ดอินเทอร์เฟสเครือข่ายบนลินุกซ์เซิร์ฟเวอร์?", a: "ip a", options: ["ip a", "ping localhost", "clear", "cat /etc/hosts"] }
  ];

  const w4aQuestions = [
    { q: "เทคโนโลยี Virtualization ในระบบเครือข่ายคอมพิวเตอร์มีจุดประสงค์หลักเพื่อทำสิ่งใด?", a: "จำลองแบ่งฮาร์ดแวร์เพื่อรันเครื่องคอมพิวเตอร์เสมือนหลายเครื่องพร้อมกัน", options: ["ป้องกันระบบจากการบุกรุกของแฮกเกอร์", "จำลองแบ่งฮาร์ดแวร์เพื่อรันเครื่องคอมพิวเตอร์เสมือนหลายเครื่องพร้อมกัน", "เพิ่มความเร็วการเชื่อมต่ออินเทอร์เน็ตของเครื่องลูกข่าย", "บีบอัดขนาดไฟล์ข้อมูลระบบทั้งหมดให้มีขนาดเล็กลง"] },
    { q: "Hypervisor ประเภทใดที่ถูกติดตั้งลงบนฮาร์ดแวร์ของเครื่องเซิร์ฟเวอร์โดยตรง (Bare-metal)?", a: "Type 1 Hypervisor", options: ["Type 1 Hypervisor", "Type 2 Hypervisor", "Type 3 Hypervisor", "Hosted Hypervisor"] },
    { q: "ข้อใดจัดเป็นตัวอย่างของ Type 1 (Bare-metal) Hypervisor ที่ใช้งานบนเซิร์ฟเวอร์?", a: "Proxmox VE", options: ["VirtualBox", "VMware Workstation", "Proxmox VE", "Parallels Desktop"] },
    { q: "ซอฟต์แวร์จำลองเครื่องเสมือนประเภทใดที่มีความเบาหวิว (Lightweight) และแบ่งปันการใช้งานระบบ Kernel ร่วมกับระบบหลัก?", a: "LXC (Linux Containers)", options: ["KVM (Kernel-based Virtual Machine)", "LXC (Linux Containers)", "Windows Server VM", "Hyper-V VM"] },
    { q: "โดเมนของหน้าจอควบคุมระบบ Web UI ของ Proxmox VE ทำงานอยู่ภายใต้พอร์ตหลักหมายเลขใด?", a: "HTTPS พอร์ต 8006", options: ["HTTP พอร์ต 80", "HTTPS พอร์ต 443", "HTTPS พอร์ต 8006", "HTTP พอร์ต 8006"] },
    { q: "หากต้องการติดตั้งเซิร์ฟเวอร์จริงขึ้นมาเป็น Proxmox VE สิ่งใดเป็นเงื่อนไขสำคัญที่ต้องเข้าไปเปิดใช้งานในหน้าจอ BIOS?", a: "เปิดใช้งานเทคโนโลยีระบบเสมือน (VT-x หรือ AMD-V)", options: ["เปิดใช้ระบบ DHCP Server", "เปิดใช้งานเทคโนโลยีระบบเสมือน (VT-x หรือ AMD-V)", "เปิดใช้สิทธิ์การ์ดอินเทอร์เฟส Wi-Fi", "เปิดการทำ RAID 0 เสมอ"] },
    { q: "ในหน้าจอติดตั้งระบบช่วง Network Configuration ตัวแปร IP Address จะต้องกำหนดในรูปแบบใด?", a: "กำหนด IP แบบคงที่ (Static IP) พร้อมรหัส CIDR เช่น 192.168.10.50/24", options: ["กำหนด IP แบบสุ่มโดยใช้ DHCP", "กำหนด IP แบบคงที่ (Static IP) พร้อมรหัส CIDR เช่น 192.168.10.50/24", "กรอกเฉพาะไอพีโดยไม่ต้องใส่ Mask เช่น 192.168.10.50", "ใช้หมายเลข IP เดียวกันกับเครื่องเราเตอร์หลัก"] },
    { q: "หลังการบูตติดตั้ง Proxmox VE สำเร็จและเครื่องทำการ Reboot ตัวเอง สิ่งแรกที่ควรดำเนินการคือข้อใด?", a: "ถอดแฟลชไดรฟ์ USB บูตออกเพื่อไม่ให้ระบบวนกลับไปหน้าต่างติดตั้งใหม่", options: ["กดสวิตช์ปิดหน้าจอทันทีเพื่อรอสัญญาณเชื่อมต่อ", "ถอดแฟลชไดรฟ์ USB บูตออกเพื่อไม่ให้ระบบวนกลับไปหน้าต่างติดตั้งใหม่", "สั่งปิดพอร์ต 8006 บนเราเตอร์ของสถาบัน", "พิมพ์รหัสผ่าน root ซ้ำๆ บนหน้าจอบูตเพื่อเข้ารหัส"] },
    { q: "ข้อความเตือนความปลอดภัย \"Not Secure\" เมื่อเปิดเบราว์เซอร์เข้าลิงก์ Proxmox เกิดขึ้นจากสาเหตุใด?", a: "ระบบใช้ใบรับรองความปลอดภัยแบบลงนามเอง (Self-signed Certificate) ซึ่งเป็นเรื่องปกติของเครื่องภายในแลน", options: ["ระบบเซิร์ฟเวอร์โดนแฮกข้อมูลและไม่ปลอดภัย", "ระบบใช้ใบรับรองความปลอดภัยแบบลงนามเอง (Self-signed Certificate) ซึ่งเป็นเรื่องปกติของเครื่องภายในแลน", "สัญญาณสายแลนของเครื่องนักเรียนไม่แน่น", "รหัสผ่านผู้ใช้งาน root มีการพิมพ์ผิดพลาด"] },
    { q: "ระบบปฏิบัติการหลัก (Base OS) ของตัวควบคุม Proxmox VE มีฐานข้อมูลรันอยู่บน Linux ค่ายใด?", a: "Debian", options: ["CentOS", "Alpine Linux", "Red Hat Enterprise", "Debian"] }
  ];

  const w4bQuestions = [
    { q: "หน้าที่หลักของซอฟต์แวร์ Web Server เช่น Nginx ในระบบเครือข่ายคือข้อใด?", a: "รับส่งแพ็กเกจ HTTP Request และคืนผลลัพธ์เป็นหน้าเว็บเพจ (HTTP Response)", options: ["เชื่อมต่อสายไฟอินเทอร์เน็ตเข้ามายังอาคาร", "รับส่งแพ็กเกจ HTTP Request และคืนผลลัพธ์เป็นหน้าเว็บเพจ (HTTP Response)", "แจกจ่ายหมายเลข IP Address ให้แก่เครื่องลูกข่ายโดยอัตโนมัติ", "ล้างหน้าจอระบบเพื่อลบประวัติการควบคุมระบบทั้งหมด"] },
    { q: "ช่องทางพอร์ตมาตรฐานในการรับส่งข้อมูลบริการเว็บไซต์ธรรมดา (HTTP) และเว็บแบบปลอดภัย (HTTPS) คืออะไร?", a: "พอร์ต 80 และ พอร์ต 443", options: ["พอร์ต 22 และ พอร์ต 80", "พอร์ต 80 และ พอร์ต 443", "พอร์ต 443 และ พอร์ต 8006", "พอร์ต 80 และ พอร์ต 8080"] },
    { q: "โปรโตคอล SSH (Secure Shell) ซึ่งใช้ควบคุมเซิร์ฟเวอร์ระยะไกล ทำงานอยู่บนพอร์ตมาตรฐานใด?", a: "พอร์ต 22", options: ["พอร์ต 80", "พอร์ต 443", "พอร์ต 22", "พอร์ต 8006"] },
    { q: "หากต้องการเชื่อมต่อ SSH เข้าสู่ตู้เสมือนด้วยสิทธิ์ root บนไอพี 192.168.10.150 ควรป้อนคำสั่งอย่างไร?", a: "ssh root@192.168.10.150", options: ["ssh 192.168.10.150 -root", "ssh root@192.168.10.150", "connect ssh root to 192.168.10.150", "ssh root:192.168.10.150"] },
    { q: "ก่อนทำคำสั่งติดตั้ง Nginx บนระบบลินุกซ์ด้วยคำสั่ง sudo apt install nginx ควรทำสิ่งใดก่อน?", a: "รันคำสั่ง sudo apt update เพื่ออัปเดตรายการดัชนีแอปพลิเคชันล่าสุด", options: ["สั่งปิดพอร์ต 22 เพื่อรักษาความปลอดภัย", "รันคำสั่ง sudo apt update เพื่ออัปเดตรายการดัชนีแอปพลิเคชันล่าสุด", "สั่งลบโฟลเดอร์ผู้ใช้อื่นออกจากไดเรกทอรี /home", "ทำการเปลี่ยนชื่อ Hostname เป็น nginx.local"] },
    { q: "คำสั่งใดใช้เพื่อเริ่มการทำงานใหม่ของ Nginx แบบล้างโปรเซสทำงานเก่าหลังแก้ไขคอนฟิก?", a: "sudo systemctl restart nginx", options: ["sudo systemctl status nginx", "sudo systemctl stop nginx", "sudo systemctl restart nginx", "sudo systemctl enable nginx"] },
    { q: "พิกัดไดเรกทอรีมาตรฐาน (Default Document Root) ที่ Nginx ใช้เก็บไฟล์หน้าเว็บ index.html คือพิกัดใด?", a: "/var/www/html/", options: ["/etc/nginx/html/", "/var/www/html/", "/home/student/html/", "/usr/share/nginx/"] },
    { q: "เหตุใดการเขียนหรือลบไฟล์ index.html ในโฟลเดอร์ /var/www/html/ จึงต้องใส่ sudo นำหน้า?", a: "เพราะโฟลเดอร์นี้ถูกรันด้วยสิทธิ์ความปลอดภัยสูงสุดและจำกัดสิทธิ์เฉพาะ root", options: ["เพราะโฟลเดอร์นี้ถูกรันด้วยสิทธิ์ความปลอดภัยสูงสุดและจำกัดสิทธิ์เฉพาะ root", "เพื่อทำให้หน้าเว็บเปิดแสดงผลกราฟิกสีสันได้รวดเร็วยิ่งขึ้น", "เพื่อหลีกเลี่ยงข้อจำกัดการเชื่อมต่อพอร์ต 8006", "เป็นกฎบังคับของการใช้บราวเซอร์ Google Chrome เสมอ"] },
    { q: "กฎเหล็กในการตรวจสอบความถูกต้องของไวยากรณ์ไฟล์ตั้งค่า Nginx ก่อนรันระบบใหม่คืออะไร?", a: "sudo nginx -t", options: ["sudo systemctl test nginx", "sudo nginx -t", "check -nginx config", "verify nginx.conf"] },
    { q: "หากสั่งแก้ไขไฟล์คอนฟิกของ Nginx ผิดไวยากรณ์ไป 1 ตัวอักษร แล้วรันคำสั่ง restart ผลลัพธ์จะเป็นอย่างไร?", a: "บริการ Nginx จะล้มเหลวในการเปิดตัวและหยุดการทำงานลงทันที (เว็บล่ม)", options: ["ระบบจะข้ามข้อความที่สะกดผิดไปรันค่าเดิมอัตโนมัติ", "บริการ Nginx จะล้มเหลวในการเปิดตัวและหยุดการทำงานลงทันที (เว็บล่ม)", "การ์ดเครือข่ายของเซิร์ฟเวอร์จะปิดตัวและยกเลิกรับค่า IP Address", "หน้าจอเทอร์มินัลจะสั่งลบไฟล์เก็บข้อมูลเว็บทิ้งถาวร"] }
  ];

  const w7aPreQuestions = [
    { q: "พอร์ต 22 บนระบบ Linux Server มักถูกสงวนไว้สำหรับการทำงานของบริการข้อใด?", a: "SSH (Secure Shell) สำหรับควบคุมระยะไกล", options: ["HTTP Web Server (หน้าเว็บไม่เข้ารหัส)", "SSH (Secure Shell) สำหรับควบคุมระยะไกล", "MariaDB / MySQL Database Server", "DNS Name Resolution สำหรับแปลงชื่อโดเมน"] },
    { q: "ข้อใดอธิบายความแตกต่างระหว่าง TCP และ UDP ได้ถูกต้องที่สุด?", a: "TCP ต้องทำการ Handshake (จับมือตกลงเชื่อมต่อ) ก่อนส่งข้อมูลจริง แต่ UDP ไม่ต้อง", options: ["UDP มีระบบตรวจสอบความครบถ้วนของข้อมูลก่อนส่ง แต่ TCP ไม่มี", "TCP ทำงานได้รวดเร็วกว่า UDP เนื่องจากไม่ต้องมีการตรวจสอบสัญญาณตอบกลับ", "TCP ต้องทำการ Handshake (จับมือตกลงเชื่อมต่อ) ก่อนส่งข้อมูลจริง แต่ UDP ไม่ต้อง", "UDP เหมาะสำหรับบริการแชร์ไฟล์ที่ห้ามมีข้อมูลสูญหายเด็ดขาด"] },
    { q: "พอร์ตมาตรฐานสำหรับการให้บริการเว็บไซต์แบบธรรมดาที่ไม่มีการเข้ารหัสความปลอดภัย (HTTP) คือพอร์ตใด?", a: "พอร์ต 80", options: ["พอร์ต 22", "พอร์ต 80", "พอร์ต 443", "พอร์ต 3306"] },
    { q: "พอร์ตมาตรฐานสำหรับการให้บริการเว็บไซต์แบบปลอดภัยที่มีการเข้ารหัสความปลอดภัย (HTTPS) คือพอร์ตใด?", a: "พอร์ต 443", options: ["พอร์ต 22", "พอร์ต 80", "พอร์ต 443", "พอร์ต 3306"] },
    { q: "พอร์ตหมายเลข 3306 มักเกี่ยวข้องกับการให้บริการของซอฟต์แวร์ประเภทใดบนเซิร์ฟเวอร์?", a: "MariaDB / MySQL Database Server", options: ["Nginx Web Server", "OpenSSH Server", "MariaDB / MySQL Database Server", "Samba File Sharing Server"] },
    { q: "หากต้องการตรวจสอบว่าระบบ Linux ของเราเปิดบริการพอร์ตใดค้างไว้เพื่อรอรับสายการเชื่อมต่อ (Listen) อยู่ ควรใช้คำสั่งใด?", a: "ss -tulpn", options: ["ip address show", "ss -tulpn", "ping -c 4 localhost", "curl -I localhost"] },
    { q: "การกำหนด Socket Binding ของโปรแกรมบริการไปที่ที่อยู่ 127.0.0.1 มีความหมายอย่างไร?", a: "อนุญาตให้เชื่อมต่อได้เฉพาะจากโปรแกรมที่รันอยู่ภายในเซิร์ฟเวอร์เครื่องเดียวกันเท่านั้น", options: ["อนุญาตการเชื่อมต่อจากอุปกรณ์ภายนอกระบบทั้งหมดโดยไม่ต้องยืนยันตัวตน", "อนุญาตให้เชื่อมต่อได้เฉพาะจากโปรแกรมที่รันอยู่ภายในเซิร์ฟเวอร์เครื่องเดียวกันเท่านั้น", "เป็นการปิดพอร์ตบริการนั้นๆ ชั่วคราวบนระบบปฏิบัติการ", "อนุญาตให้เชื่อมต่อเข้ามาเฉพาะจากอุปกรณ์เครือข่ายภายในวงแลนเดียวกัน"] },
    { q: "ที่อยู่ไอพี (IP Address) ของอุปกรณ์เราเตอร์ที่ทำหน้าที่เป็นประตูทางออกนอกเครือข่ายอินเทอร์เน็ต เรียกว่าอะไร?", a: "Default Gateway", options: ["Subnet Mask", "Default Gateway", "DNS Server", "Loopback Address"] },
    { q: "ซอฟต์แวร์เครื่องมือ Nmap (Network Mapper) ถูกนำมาใช้ประโยชน์ในข้อใดมากที่สุด?", a: "ใช้สแกนเครือข่ายเพื่อค้นหาพอร์ตและบริการที่เปิดอยู่รวมถึงช่องโหว่", options: ["ตรวจสอบและวิเคราะห์การใช้งานพื้นที่บนฮาร์ดดิสก์", "ใช้สแกนเครือข่ายเพื่อค้นหาพอร์ตและบริการที่เปิดอยู่รวมถึงช่องโหว่", "ใช้จัดการสิทธิ์ผู้ใช้อันดับสูงภายในระบบปฏิบัติการ", "เปิดใช้งานหน้าต่าง Firewall ของ Ubuntu"] },
    { q: "การ Bind บริการเครือข่ายไว้ที่ไอพี 0.0.0.0 มีความหมายว่าอย่างไร?", a: "ยินดีรับสายและเชื่อมต่อจากทุก IP Interface ที่ชี้มาหาเครื่องเซิร์ฟเวอร์นี้", options: ["ยินดีรับสายและเชื่อมต่อจากทุก IP Interface ที่ชี้มาหาเครื่องเซิร์ฟเวอร์นี้", "จำกัดสิทธิ์เฉพาะเครื่องแม่ข่ายกลางเท่านั้นที่มีสิทธิ์สั่งการ", "ไอพีเครือข่ายจะทำงานเฉพาะเมื่อเซิร์ฟเวอร์เปิดหน้าเว็บพอร์ต 80 เท่านั้น", "ระบบจะทำลายแพ็กเก็ตทราฟฟิกข้อมูลที่ส่งมาผิดพลาดทิ้งทันที"] }
  ];

  const w7aPostQuestions = [
    { q: "หากผลลัพธ์จากคำสั่ง ss -tulpn ระบุพอร์ต 3306 ผูกอยู่กับ localhost (127.0.0.1:3306) ผลลัพธ์ในแง่ความปลอดภัยเป็นอย่างไร?", a: "ปลอดภัยมาก เพราะบุคคลภายนอกไม่สามารถเข้าถึงพอร์ต 3306 ได้โดยตรงแม้ไม่มีไฟร์วอลล์", options: ["เครื่องอื่นในระบบยังเชื่อมเข้าใช้งานฐานข้อมูลได้ตามปกติ", "ปลอดภัยมาก เพราะบุคคลภายนอกไม่สามารถเข้าถึงพอร์ต 3306 ได้โดยตรงแม้ไม่มีไฟร์วอลล์", "ทำให้โปรแกรม PHP/NodeJS ในเครื่องเดียวกันไม่สามารถดึงข้อมูลได้", "พอร์ตจะถูกบล็อกและปิดบริการไปโดยอัตโนมัติ"] },
    { q: "หากใช้ Nmap สแกนพอร์ตเป้าหมายแล้วได้รับสถานะพอร์ตระบุเป็น 'filtered' หมายความว่าอย่างใด?", a: "มีไฟร์วอลล์คอยบล็อกกั้นแพ็กเก็ตสแกน ทำให้ตรวจสถานะจริงไม่ได้", options: ["พอร์ตนี้ถูกปิดและไม่มีบริการใดๆ ทำงานอยู่เบื้องหลัง", "พอร์ตเปิดทำงานอยู่และไม่มีการคัดกรองความปลอดภัยใดๆ", "มีไฟร์วอลล์คอยบล็อกกั้นแพ็กเก็ตสแกน ทำให้ตรวจสถานะจริงไม่ได้", "บริการในพอร์ตนี้มีการเข้ารหัสความปลอดภัยระดับโปรโตคอล TLS"] },
    { q: "คำสั่งสแกน Nmap ในข้อใดใช้สแกนพอร์ตพร้อมตรวจสอบเวอร์ชันของซอฟต์แวร์ที่รันอยู่เบื้องหลัง (Service Version Detection)?", a: "nmap -sV 192.168.1.100", options: ["nmap -sV 192.168.1.100", "nmap -p 1-100 192.168.1.100", "nmap localhost", "nmap -v 192.168.1.100"] },
    { q: "คำสั่งใดใช้ตรวจสอบรายละเอียด IP Address ของอุปกรณ์เน็ตเวิร์กการ์ด (Network Interface) ในเซิร์ฟเวอร์ Ubuntu?", a: "ip a", options: ["ip a", "hostname -I", "ip route", "ss -tulpn"] },
    { q: "คำสั่ง 'telnet 192.168.1.100 80' มีประโยชน์อย่างไรสำหรับ System Administrator?", a: "ใช้ตรวจสอบว่าพอร์ต 80 ของไอพีเป้าหมายเปิดรับสายหรือไม่", options: ["ใช้ควบคุม CLI ของเครื่อง 192.168.1.100 ระยะไกล", "ใช้ตรวจสอบว่าพอร์ต 80 ของไอพีเป้าหมายเปิดรับสายหรือไม่", "ใช้วัดความเร็วอินเทอร์เน็ตในการส่งข้อมูลไปยัง Nginx", "ใช้สั่งปิดการทำงานพอร์ตเว็บเซิร์ฟเวอร์แบบฉุกเฉิน"] },
    { q: "ในการทำงานของโปรโตคอล TCP ข้อมูลเริ่มแรกที่จะทำการขอเปิดการเชื่อมต่อ (Handshake 1) จะใช้แพ็กเก็ตชนิดใด?", a: "SYN (Synchronize)", options: ["ACK (Acknowledge)", "SYN (Synchronize)", "SYN-ACK (Synchronize-Acknowledge)", "FIN (Finish)"] },
    { q: "พอร์ตหมายเลข 445 บนระบบ Linux Server มักถูกสงวนไว้สำหรับการทำงานของบริการข้อใด?", a: "Samba Server สำหรับแชร์ไฟล์ข้ามระบบปฏิบัติการ", options: ["SSH (Secure Shell) สำหรับควบคุมระยะไกล", "Nginx HTTP Web Server", "Samba Server สำหรับแชร์ไฟล์ข้ามระบบปฏิบัติการ", "MariaDB Database Server"] },
    { q: "หากต้องการตรวจสอบ Default Gateway บนตารางเส้นทางข้ามเครือข่ายของเซิร์ฟเวอร์ลินุกซ์ด้วย CLI ควรใช้คำสั่งใด?", a: "ip route", options: ["ip route", "ip a show", "ping localhost", "ss -tulpn"] },
    { q: "ข้อใดเป็นคุณสมบัติเด่นที่ถูกต้องของการรับส่งข้อมูลแบบ UDP (User Datagram Protocol)?", a: "เน้นความเร็วสูงสุดโดยไม่มีขั้นตอนต่อสาย (Handshake) ก่อนส่งข้อมูล", options: ["รับประกันการส่งข้อมูลถึงผู้รับครบถ้วนโดยไม่มีข้อมูลสูญหาย", "เน้นความเร็วสูงสุดโดยไม่มีขั้นตอนต่อสาย (Handshake) ก่อนส่งข้อมูล", "บังคับเชื่อมต่อสัญญาณระดับฮาร์ดแวร์ก่อนส่งข้อมูลเสมอ", "มีการจัดเรียงลำดับชุดข้อมูลให้ถูกต้องก่อนแสดงผลปลายทาง"] },
    { q: "ระบบ Firewall ส่วนใหญ่ทำงานในการกลั่นกรองอนุญาตหรือปิดกั้นข้อมูล โดยอิงจากข้อมูลหลักในข้อใด (OSI Layer 3-4)?", a: "หมายเลขไอพีเครื่องต้นทาง/ปลายทาง และหมายเลขพอร์ตบริการ", options: ["MAC Address ของตัวเครื่องและสายแลน", "หมายเลขไอพีเครื่องต้นทาง/ปลายทาง และหมายเลขพอร์ตบริการ", "HTTP Request Method และความยาวของไฟล์", "ชื่อบัญชีของระบบปฏิบัติการและระดับสิทธิ์ไฟล์"] }
  ];

  let questions = w2Questions;
  if (s.id.startsWith("w4a")) {
    questions = w4aQuestions;
  } else if (s.id.startsWith("w4b")) {
    questions = w4bQuestions;
  } else if (s.id.startsWith("w3b")) {
    questions = w3bQuestions;
  } else if (s.id.startsWith("w3")) {
    questions = w3Questions;
  } else if (s.id.startsWith("w7a-pre")) {
    questions = w7aPreQuestions;
  } else if (s.id.startsWith("w7a-post")) {
    questions = w7aPostQuestions;
  }

  const downloadPath = s.csvPath || "/data/week-2_wayground_import.xlsx";
  const downloadName = downloadPath.split("/").pop() || "wayground_import.xlsx";

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = downloadPath;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div className="slide slide-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '3% 4%' }}>
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>
      {s.body && <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: 15 }}>{s.body}</p>}

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left Side: Question Preview */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📝</span> รายการคำถามในเทมเพลต (10 ข้อ)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {questions.map((q, idx) => (
              <div key={idx} style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {idx + 1}. {q.q}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = opt === q.a;
                    return (
                      <span key={oIdx} style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: isCorrect ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                        border: isCorrect ? '1px solid var(--accent)' : '1px solid var(--border)',
                        color: isCorrect ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: isCorrect ? 'bold' : 'normal'
                      }}>
                        {isCorrect ? '✓ ' : '• '} {opt}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Action and Guides */}
        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Brand/Download Card */}
          <div style={{
            background: 'linear-gradient(135deg, #090d16 0%, #111a2e 50%, #1e1b4b 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.15)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎮</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.5px', color: '#818cf8' }}>Wayground Quiz Template</h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px', maxWidth: '280px' }}>
              พร้อมนำไปอัปโหลดเข้าคลังข้อสอบใน Wayground ได้ทันทีเพื่อประเมินผลผู้เรียน
            </p>
            <button
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)'; }}
            >
              <span>📥</span>
              {downloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด Excel Template'}
            </button>
          </div>

          {/* Import Guide Card */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px', flex: 1, overflowY: 'auto' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-primary)' }}>
              📖 ขั้นตอนการนำเข้า (How to Import):
            </h4>
            <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
              <li>คลิกปุ่ม <strong>ดาวน์โหลด Excel Template</strong> ด้านบนเพื่อรับไฟล์</li>
              <li>เปิดเบราว์เซอร์เข้าสู่ระบบผู้สอนที่ <a href="https://wayground.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Wayground.com</a></li>
              <li>ไปที่เมนู <strong>คลังข้อสอบ (Quiz Library)</strong> แล้วกดสร้างเกมใหม่</li>
              <li>เลือกนำเข้าข้อมูลทางฝั่ง <strong>Import Spreadsheet (Excel/XLSX)</strong></li>
              <li>อัปโหลดไฟล์ <code>{downloadName}</code> ที่โหลดไปเข้าระบบ</li>
              <li>ตรวจสอบเฉลยและกำหนดเวลา จากนั้นกด <strong>บันทึกเกม (Save)</strong> เพื่อเริ่มประลองความรู้ได้เลย!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Dynamic Interactive Document component for Proxmox VE --- */
interface ContainerType {
  id: string;
  name: string;
  ip: string;
  status: "running" | "stopped";
  isNginxInstalled: boolean;
  isNginxRunning: boolean;
  htmlContent: string;
}

function ProxmoxGuideDocument() {
  const [step, setStep] = useState(0);
  const [selectedDisk, setSelectedDisk] = useState("/dev/sda - SSD 250GB");
  const [timezone, setTimezone] = useState("Asia/Bangkok");
  const [rootPass, setRootPass] = useState("RootAdmin@123");
  const [mgmtIP, setMgmtIP] = useState("192.168.10.50/24");
  const [installProgress, setInstallProgress] = useState(0);

  // Containers state for Web UI simulator
  const [containers, setContainers] = useState<ContainerType[]>([
    {
      id: "101",
      name: "std01-nginx",
      ip: "192.168.10.101",
      status: "running",
      isNginxInstalled: true,
      isNginxRunning: true,
      htmlContent: "<h1>ยินดีต้อนรับสู่เว็บเซิร์ฟเวอร์ของ นายสมชาย (std01)</h1>\n<p>สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1</p>\n<div style='color: #0284c7; font-weight: bold; margin-top: 15px; border-top: 2px dashed #0284c7; padding-top: 10px;'>Status: Nginx is working successfully on Port 80!</div>"
    },
    {
      id: "102",
      name: "std02-nginx",
      ip: "192.168.10.102",
      status: "stopped",
      isNginxInstalled: false,
      isNginxRunning: false,
      htmlContent: "<h1>ยินดีต้อนรับสู่เว็บไซต์ของ std02</h1>\n<p>กำลังอยู่ในระหว่างการพัฒนาเซ็ตอัป...</p>"
    }
  ]);
  const [newContainerName, setNewContainerName] = useState("student-labs");
  const [selectedContainerId, setSelectedContainerId] = useState<string>("101");
  const [activeTab, setActiveTab] = useState<"summary" | "console" | "browser">("summary");
  const [terminalLogs, setTerminalLogs] = useState<string[]>(["root@std01-nginx:~# "]);
  const [showNanoEditor, setShowNanoEditor] = useState(false);
  const [nanoText, setNanoText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedHost, setSelectedHost] = useState(true);

  // Interactive Network Topology state
  const [topoMode, setTopoMode] = useState<"overview" | "ssh" | "web">("overview");
  const [sshTerminalStep, setSshTerminalStep] = useState(0); // 0: idle, 1: typing, 2: ready
  const [sshLogs, setSshLogs] = useState<string[]>([]);
  const [sshTyping, setSshTyping] = useState(false);

  // Auto-progress installer loading bar
  useEffect(() => {
    if (step === 7) {
      setInstallProgress(0);
      const interval = setInterval(() => {
        setInstallProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setStep(8);
            }, 600);
            return 100;
          }
          return p + 4;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Synchronize terminal logs and state when selecting container
  useEffect(() => {
    const container = containers.find(c => c.id === selectedContainerId);
    if (container) {
      setTerminalLogs([`root@${container.name}:~# `]);
      setShowNanoEditor(false);
    }
  }, [selectedContainerId, containers]);

  const handleAddContainer = () => {
    if (!newContainerName) return;
    const num = containers.length + 1;
    const padNum = String(num).padStart(2, "0");
    const containerId = String(100 + num);
    const newIp = `192.168.10.1${padNum}`;

    setContainers([
      ...containers,
      {
        id: containerId,
        name: `std${padNum}-${newContainerName}`,
        ip: newIp,
        status: "running",
        isNginxInstalled: false,
        isNginxRunning: false,
        htmlContent: `<h1>เว็บไซต์ทดสอบของตู้จำลอง ID ${containerId}</h1>\n<p>ยินดีต้อนรับเข้าสู่ระบบเว็บเซิร์ฟเวอร์จำลองจากการปฏิบัติการ!</p>`
      }
    ]);
    setSelectedContainerId(containerId);
    setSelectedHost(false);
    setNewContainerName("student-labs");
  };

  const handleRunCommand = (cmd: "update" | "install" | "start" | "nano") => {
    if (isTyping) return;
    const container = containers.find(c => c.id === selectedContainerId);
    if (!container) return;
    if (container.status === "stopped") {
      setTerminalLogs(prev => [...prev, "Error: Container is offline! Please start it first.", `root@${container.name}:~# `]);
      return;
    }

    setIsTyping(true);
    let logs = [...terminalLogs];

    if (cmd === "update") {
      logs.push(`apt update`);
      setTerminalLogs(logs);
      setTimeout(() => {
        setTerminalLogs(prev => [
          ...prev,
          "Get:1 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]",
          "Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]",
          "Get:3 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]",
          "Fetched 508 kB in 0.8s (635 kB/s)",
          "Reading package lists... Done",
          "All packages are up to date.",
          `root@${container.name}:~# `
        ]);
        setIsTyping(false);
      }, 1000);
    } else if (cmd === "install") {
      logs.push(`apt install nginx -y`);
      setTerminalLogs(logs);
      setTimeout(() => {
        setTerminalLogs(prev => [
          ...prev,
          "Reading package lists... Done",
          "Building dependency tree... Done",
          "The following NEW packages will be installed:",
          "  nginx nginx-common nginx-core libpcre3",
          "Need to get 1,024 kB of archives.",
          "Unpacking nginx (1.24.0-1) ...",
          "Setting up nginx (1.24.0-1) ...",
          "Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service.",
          `root@${container.name}:~# `
        ]);
        setContainers(prev => prev.map(c => c.id === container.id ? { ...c, isNginxInstalled: true } : c));
        setIsTyping(false);
      }, 1200);
    } else if (cmd === "start") {
      logs.push(`systemctl start nginx && systemctl status nginx`);
      setTerminalLogs(logs);
      setTimeout(() => {
        setTerminalLogs(prev => [
          ...prev,
          "● nginx.service - A high performance web server",
          "     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)",
          "     Active: active (running) since Tue 2026-06-07 16:40:00 UTC",
          "   Main PID: 7421 (nginx)",
          `root@${container.name}:~# `
        ]);
        setContainers(prev => prev.map(c => c.id === container.id ? { ...c, isNginxRunning: true } : c));
        setIsTyping(false);
      }, 800);
    } else if (cmd === "nano") {
      logs.push(`nano /var/www/html/index.html`);
      setTerminalLogs(logs);
      setTimeout(() => {
        setNanoText(container.htmlContent);
        setShowNanoEditor(true);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleSaveNano = () => {
    setContainers(prev => prev.map(c => c.id === selectedContainerId ? { ...c, htmlContent: nanoText } : c));
    setShowNanoEditor(false);
    const container = containers.find(c => c.id === selectedContainerId);
    setTerminalLogs(prev => [
      ...prev,
      "[ File '/var/www/html/index.html' written successfully ]",
      `root@${container?.name || "container"}:~# `
    ]);
  };

  // SSH simulation inside Topology Section
  const handleTriggerSshSim = () => {
    if (sshTyping) return;
    setSshTyping(true);
    setSshTerminalStep(1);
    setSshLogs(["$ ssh root@192.168.10.101"]);

    setTimeout(() => {
      setSshLogs(prev => [
        ...prev,
        "Connecting to 192.168.10.101:22...",
        "The authenticity of host '192.168.10.101' can't be established.",
        "ECDSA key fingerprint is SHA256:7mP4e2gX9fD/K+vR3wJ2Y1b5x.",
        "Are you sure you want to continue connecting (yes/no)?"
      ]);
      setSshTerminalStep(2);

      setTimeout(() => {
        setSshLogs(prev => [
          ...prev,
          "yes",
          "Warning: Permanently added '192.168.10.101' to the list of known hosts.",
          "root@192.168.10.101's password: *********"
        ]);

        setTimeout(() => {
          setSshLogs(prev => [
            ...prev,
            "Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-pve)",
            " * Documentation:  https://help.ubuntu.com",
            "",
            "Last login: Sun Jun  7 23:45:12 2026 from 192.168.10.12",
            "root@std01-nginx:~# "
          ]);
          setSshTerminalStep(3);
          setSshTyping(false);
        }, 1000);
      }, 1200);
    }, 1000);
  };

  const handleToggleContainerPower = (action: "start" | "stop" | "restart") => {
    setContainers(prev => prev.map(c => {
      if (c.id === selectedContainerId) {
        if (action === "start") {
          return { ...c, status: "running" };
        } else if (action === "stop") {
          return { ...c, status: "stopped", isNginxRunning: false };
        } else {
          return { ...c, status: "running", isNginxRunning: c.isNginxInstalled };
        }
      }
      return c;
    }));
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '30px 4%',
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      lineHeight: '1.7',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes packetFlowDash {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animate-packet-flow {
          stroke-dasharray: 8, 4;
          animation: packetFlowDash 1.2s linear infinite;
        }
        @keyframes pulseGlowRing {
          0% { r: 6; opacity: 0.8; }
          100% { r: 18; opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulseGlowRing 2s infinite ease-out;
        }
        .pve-window {
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .installer-nav-btn {
          padding: 8px 18px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .installer-nav-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .installer-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .installer-sidebar-item {
          padding: 10px 14px;
          font-size: 11px;
          border-left: 3px solid transparent;
          color: #94a3b8;
          transition: all 0.2s;
        }
        .installer-sidebar-item.active {
          border-left-color: #f97316;
          color: #ffffff;
          background: rgba(249,115,22,0.1);
          font-weight: 700;
        }
        .quick-action-btn {
          background: rgba(2,132,199,0.1);
          border: 1px solid rgba(2,132,199,0.3);
          color: #38bdf8;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }
        .quick-action-btn:hover:not(:disabled) {
          background: #0284c7;
          color: #ffffff;
          border-color: #0284c7;
        }
        .quick-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        @keyframes cursorBlink {
          50% { opacity: 0; }
        }
        .term-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: #38bdf8;
          margin-left: 4px;
          animation: cursorBlink 1s infinite;
          vertical-align: middle;
        }
      `}} />

      {/* Header */}
      <div style={{
        borderBottom: '2px solid var(--border)',
        paddingBottom: '20px',
        marginBottom: '28px'
      }}>
        <span style={{
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          padding: '6px 14px',
          borderRadius: '99px',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          เอกสารประกอบห้องปฏิบัติการ — ครูผู้สอน (Instructor Deployment Manual)
        </span>
        <h1 style={{
          fontSize: 'clamp(26px, 3.2vw, 40px)',
          fontWeight: '800',
          lineHeight: '1.2',
          marginTop: '12px',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          คู่มือปฏิบัติการติดตั้งเซิร์ฟเวอร์เสมือน Proxmox VE & Nginx Web Server
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          คู่มือแนะนำการออกแบบเครือข่ายจำลอง แอนิเมชันแสดงสถาปัตยกรรม LAN, ตัวโปรแกรมจำลองการติดตั้งระบบปฏิบัติการเสมือน (Bare-metal Hypervisor) และระบบบอร์ดบริหารจัดการ LXC Containers สำหรับนักศึกษา
        </p>
      </div>

      {/* Section 1: Animated Network Topology */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '22px' }}>🎬</span> แผนผังจำลองสถาปัตยกรรมแล็บบนเครื่องแม่ข่าย (Interactive Topology & Data Flow)
        </h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
          เลือกแท็บจำลองด้านล่างเพื่อแสดงการรับส่งข้อมูลและการทำงานของพอร์ตเครือข่ายแล็บเสมือน (SSH พอร์ต 22 และ Web HTTP พอร์ต 80)
        </p>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setTopoMode("overview")}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: topoMode === "overview" ? 'var(--accent)' : 'var(--border)',
              background: topoMode === "overview" ? 'var(--accent)' : 'var(--bg-surface)',
              color: topoMode === "overview" ? '#ffffff' : 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
          >
            🌐 1. ภาพรวมเครือข่าย LAN
          </button>
          <button
            onClick={() => {
              setTopoMode("ssh");
              setSshTerminalStep(0);
              setSshLogs([]);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: topoMode === "ssh" ? '#0ea5e9' : 'var(--border)',
              background: topoMode === "ssh" ? '#0ea5e9' : 'var(--bg-surface)',
              color: topoMode === "ssh" ? '#ffffff' : 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
          >
            🔑 2. จำลอง SSH (Port 22)
          </button>
          <button
            onClick={() => setTopoMode("web")}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: topoMode === "web" ? '#10b981' : 'var(--border)',
              background: topoMode === "web" ? '#10b981' : 'var(--bg-surface)',
              color: topoMode === "web" ? '#ffffff' : 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
          >
            📰 3. จำลองหน้าเว็บ HTTP (Port 80)
          </button>
        </div>

        {/* SVG Diagram and Interactive Details Split Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', minHeight: '340px' }}>

          {/* SVG Container */}
          <div style={{
            background: '#040815',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <svg className="docker-guide-svg" viewBox="0 0 540 280" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <linearGradient id="serverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#0b1329" />
                </linearGradient>
                <linearGradient id="pveLayerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* PC นักเรียน (Left) */}
              <g transform="translate(60, 140)">
                <rect x="-40" y="-30" width="80" height="50" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <rect x="-30" y="20" width="60" height="6" rx="2" fill="#475569" />
                <text x="0" y="2" textAnchor="middle" fill="#f8fafc" fontSize="10px" fontWeight="bold">💻 PC นักเรียน</text>
                <text x="0" y="14" textAnchor="middle" fill="#94a3b8" fontSize="8px">IP: 192.168.10.12</text>

                {/* Active node glow */}
                {(topoMode === "ssh" || topoMode === "web") && (
                  <>
                    <circle cx="0" cy="-30" r="5" fill={topoMode === "ssh" ? "#0ea5e9" : "#10b981"} />
                    <circle cx="0" cy="-30" r="5" fill={topoMode === "ssh" ? "#0ea5e9" : "#10b981"} className="animate-pulse-ring" />
                  </>
                )}
              </g>

              {/* LAN Switch (Middle) */}
              <g transform="translate(210, 140)">
                <rect x="-35" y="-25" width="70" height="50" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <line x1="-25" y1="5" x2="25" y2="5" stroke="rgba(56,189,248,0.2)" strokeWidth="3" />
                <circle cx="-20" cy="-10" r="3" fill="#22c55e" />
                <circle cx="-5" cy="-10" r="3" fill="#22c55e" />
                <circle cx="10" cy="-10" r="3" fill="#22c55e" />
                <circle cx="20" cy="-10" r="3" fill="#38bdf8" />
                <text x="0" y="18" textAnchor="middle" fill="#38bdf8" fontSize="9px" fontWeight="bold">⚡ Switch</text>
              </g>

              {/* Physical Server Box (Right) */}
              <g transform="translate(420, 140)">
                {/* Hardware */}
                <rect x="-95" y="-105" width="190" height="210" rx="8" fill="url(#serverGrad)" stroke="#1d4ed8" strokeWidth="2" />
                <rect x="-85" y="-95" width="170" height="26" rx="4" fill="#1e40af" />
                <text x="0" y="-78" textAnchor="middle" fill="#ffffff" fontSize="10px" fontWeight="bold">🛡️ PHYSICAL SERVER (แม่ข่าย)</text>

                {/* Proxmox Hypervisor Layer */}
                <rect x="-85" y="-60" width="170" height="42" rx="4" fill="url(#pveLayerGrad)" stroke="#ea580c" strokeWidth="1.5" />
                <text x="0" y="-44" textAnchor="middle" fill="#f97316" fontSize="9px" fontWeight="bold">💿 Proxmox VE (Type-1)</text>
                <text x="0" y="-30" textAnchor="middle" fill="#fdba74" fontSize="7px">Web Manager HTTPS Port: 8006</text>

                {/* LXC Containers Box */}
                <rect x="-85" y="-8" width="170" height="85" rx="5" fill="#030712" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2" />
                <text x="0" y="8" textAnchor="middle" fill="#10b981" fontSize="9px" fontWeight="bold">📦 isolated LXC Containers</text>

                {/* Container 101 */}
                <g transform="translate(-40, 42)">
                  <rect x="-35" y="-20" width="70" height="32" rx="4" fill={topoMode === "ssh" ? "#1e3a5f" : topoMode === "web" ? "#064e3b" : "#111827"} stroke={topoMode === "ssh" ? "#0ea5e9" : topoMode === "web" ? "#10b981" : "#374151"} strokeWidth="1.5" />
                  <text x="0" y="-8" textAnchor="middle" fill="#ffffff" fontSize="7px" fontWeight="bold">std01-nginx</text>
                  <text x="0" y="3" textAnchor="middle" fill="#94a3b8" fontSize="6px">192.168.10.101</text>
                  <text x="0" y="9" textAnchor="middle" fill={topoMode === "ssh" ? "#38bdf8" : topoMode === "web" ? "#34d399" : "#64748b"} fontSize="6px" fontWeight="bold">
                    {topoMode === "ssh" ? "Port 22 (SSH)" : topoMode === "web" ? "Port 80 (HTTP)" : "Active"}
                  </text>
                </g>

                {/* Container 102 */}
                <g transform="translate(40, 42)">
                  <rect x="-35" y="-20" width="70" height="32" rx="4" fill="#111827" stroke="#374151" strokeWidth="1" />
                  <text x="0" y="-8" textAnchor="middle" fill="#64748b" fontSize="7px">std02-nginx</text>
                  <text x="0" y="3" textAnchor="middle" fill="#64748b" fontSize="6px">192.168.10.102</text>
                  <text x="0" y="9" textAnchor="middle" fill="#f43f5e" fontSize="6.5px">Offline</text>
                </g>
              </g>

              {/* Cables & Connection Lines */}
              {/* PC to Switch */}
              <path d="M 100 140 L 175 140" fill="none" stroke="#334155" strokeWidth="2" />
              {/* Switch to Server */}
              <path d="M 245 140 L 325 140" fill="none" stroke="#334155" strokeWidth="2" />

              {/* Animated Flows */}
              {topoMode === "ssh" && (
                <>
                  <path d="M 100 140 L 175 140" fill="none" stroke="#0ea5e9" strokeWidth="2" className="animate-packet-flow" />
                  <path d="M 245 140 L 325 140 M 325 140 L 380 182" fill="none" stroke="#0ea5e9" strokeWidth="2" className="animate-packet-flow" />
                  <circle cx="100" cy="140" r="4" fill="#0ea5e9">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 0 0 L 75 0 M 145 0 L 225 0 L 280 42" />
                  </circle>
                </>
              )}

              {topoMode === "web" && (
                <>
                  <path d="M 100 140 L 175 140" fill="none" stroke="#10b981" strokeWidth="2" className="animate-packet-flow" />
                  <path d="M 245 140 L 325 140 M 325 140 L 380 182" fill="none" stroke="#10b981" strokeWidth="2" className="animate-packet-flow" />
                  <circle cx="100" cy="140" r="4" fill="#10b981">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 0 0 L 75 0 M 145 0 L 225 0 L 280 42" />
                  </circle>
                </>
              )}
            </svg>
          </div>

          {/* Interactive details sidebar */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px var(--border)'
          }}>
            {topoMode === "overview" && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '8px' }}>
                  ⚙️ โครงสร้างเครื่องแม่ข่ายเครือข่ายแล็บเสมือน
                </h3>
                <ul style={{ fontSize: '12.5px', color: 'var(--text-secondary)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><strong>Physical Server:</strong> เครื่องคอมพิวเตอร์หลักที่ห้องเรียน ถูกติดตั้งด้วยระบบ Proxmox VE</li>
                  <li><strong>Type-1 Hypervisor:</strong> ควบคุมฮาร์ดแวร์โดยตรง ไม่มี OS หลักขวางกั้น ทำให้ความเร็วการรัน VM/Container เร็วสูงสุดเทียบเท่าเครื่องจริง</li>
                  <li><strong>isolated Containers (LXC):</strong> ตู้จำลองระบบไฟล์ลินุกซ์ที่ครูผู้สอนโคลนเตรียมไว้ให้นักศึกษาแต่ละคนเป็นส่วนตัว เพื่อลงโปรแกรมทดลองได้อย่างอิสระโดยไม่กวนกัน</li>
                </ul>
              </div>
            )}

            {topoMode === "ssh" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0ea5e9' }}>
                  🔑 ปฏิบัติการเชื่อมต่อ SSH (Secure Shell)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  นักเรียนใช้คำสั่ง <code>ssh [user]@[IP_LXC]</code> เพื่อเชื่อมต่อเข้ารหัสผ่านพอร์ต 22 เพื่อควบคุมสั่งการตู้เสมือนของตนเองผ่านสายแลน
                </p>

                {/* Simulated SSH Terminal Panel */}
                <div style={{
                  background: '#090d16',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '11px',
                  color: '#e2e8f0',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid #1e293b'
                }}>
                  <div style={{ overflowY: 'auto', maxHeight: '140px' }}>
                    {sshLogs.map((log, i) => (
                      <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: '4px' }}>{log}</div>
                    ))}
                    {sshTyping && <span className="term-cursor" />}
                  </div>

                  {sshTerminalStep === 0 && (
                    <button
                      onClick={handleTriggerSshSim}
                      style={{
                        background: '#0ea5e9',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginTop: '8px',
                        width: '100%'
                      }}
                    >
                      🚀 เริ่มจำลองการเชื่อมต่อ SSH
                    </button>
                  )}
                  {sshTerminalStep === 3 && (
                    <span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', display: 'block', marginTop: '6px' }}>
                      ✓ เชื่อมต่อสำเร็จ! เข้าสู่หน้าควบคุมตู้ std01
                    </span>
                  )}
                </div>
              </div>
            )}

            {topoMode === "web" && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                  🌐 ปฏิบัติการรันเว็บ HTTP (Nginx Web Server)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  เมื่อติดตั้ง Nginx และรันบริการสำเร็จ พอร์ต 80 ของตู้ Container จะเปิดรอรับคำขอ (HTTP Request) เมื่อผู้ใช้นำหมายเลข IP ไปเข้าผ่าน Browser จะดึงข้อมูลจากไฟล์ไปแสดงผลทันที
                </p>

                {/* HTTP Request simulator details */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  fontFamily: 'Courier New, monospace'
                }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' }}>[HTTP GET REQUEST]</div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Request URL: http://192.168.10.101/<br />
                    Request Method: GET (Port 80)<br />
                    Status Code: <span style={{ color: '#10b981', fontWeight: 'bold' }}>200 OK</span>
                  </div>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>[HTTP RESPONSE - HTML]</div>
                  <div style={{
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    overflowX: 'auto',
                    whiteSpace: 'pre'
                  }}>
                    {containers[0].htmlContent.slice(0, 100) + "..."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Proxmox VE Setup Wizard / Web UI Dashboard Simulator */}
      {step < 9 ? (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '22px' }}>🎮</span> ตัวจำลองการติดตั้งระบบควบคุมคอมพิวเตอร์เสมือน (Proxmox VE Installer Simulator)
          </h2>
          <p style={{ marginBottom: '18px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            จำลองหน้าจอขั้นตอนการป้อนข้อมูลและกำหนดตัวเลือกของตัวติดตั้ง Proxmox VE 8.x เพื่อให้จดจำพารามิเตอร์ระบบเครือข่าย IP/Gateway ได้อย่างแม่นยำก่อนปฏิบัติการจริง
          </p>

          {/* High Fidelity PVE Installation Window */}
          <div className="pve-window" style={{
            borderRadius: '10px',
            border: '2px solid #ea580c',
            background: '#111827',
            color: '#f1f5f9',
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column'
          }}>

            {/* Top Installer Header */}
            <div style={{
              background: '#ea580c',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              <span>🟠 PROXMOX VIRTUAL ENVIRONMENT INSTALLER (GUI WIZARD)</span>
              <span>ขั้นตอนที่ {step + 1} / 9</span>
            </div>

            {/* Split Content: Left Info Column, Right Form Config Column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', flexGrow: 1, minHeight: '280px' }}>

              {/* Left Column (Installer Help Panel) */}
              <div style={{
                background: '#1f2937',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                padding: '16px',
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: '1.6'
              }}>
                <h4 style={{ color: '#fdba74', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>
                  ℹ️ คำอธิบายขั้นตอนช่วยจำ
                </h4>
                {step === 0 && (
                  <div>
                    <p><strong>ยินดีต้อนรับสู่ Proxmox VE</strong></p>
                    <p style={{ marginTop: '6px' }}>เลือกหัวข้อแรกสุด 'Install Proxmox VE (Graphical)' เพื่อรันติดตั้งแบบกราฟิกอินเตอร์เฟสผ่านเมาส์ ซึ่งเป็นโหมดหลักที่สะดวก รวดเร็ว และตั้งค่าได้ครอบคลุมที่สุด</p>
                  </div>
                )}
                {step === 1 && (
                  <div>
                    <p><strong>สัญญาข้อตกลงการใช้งาน (EULA)</strong></p>
                    <p style={{ marginTop: '6px' }}>สัญญาระบุสิทธิ์การใช้งานซอฟต์แวร์เสรีภายใต้ข้อกำหนดสัญญา GNU AGPLv3 แนะนำให้นักศึกษาทำความเข้าใจเงื่อนไขของ Open Source ก่อนยอมรับเงื่อนไขติดตั้ง</p>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <p><strong>การตั้งค่า Target Harddisk</strong></p>
                    <p style={{ marginTop: '6px' }}>ระบุไดรฟ์ดิสก์หลักที่จะใช้ลงระบบปฏิบัติการหลัก:
                      <br />- แนะนำ SSD สำหรับระบบ PVE
                      <br />- ข้อมูลในดิสก์ที่ถูกเลือกจะโดนล้างฟอร์แมตเขียนทับระบบไฟล์ทั้งหมด</p>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <p><strong>Location & Time Zone</strong></p>
                    <p style={{ marginTop: '6px' }}>ระบุที่ตั้งเพื่อซิงค์เวลาของเครื่องเซิร์ฟเวอร์กับเครือข่ายอินเทอร์เน็ต (NTP):
                      <br />- Country: Thailand
                      <br />- Timezone: Asia/Bangkok
                      <br />- การตั้งเวลาที่ถูกต้องจำเป็นสำหรับเวลาของ LOG เหตุการณ์ความผิดปกติ</p>
                  </div>
                )}
                {step === 4 && (
                  <div>
                    <p><strong>รหัสผ่าน root แอดมินหลัก</strong></p>
                    <p style={{ marginTop: '6px' }}>ตั้งรหัสผ่านสำหรับผู้ใช้ <code>root</code> ซึ่งเป็นบัญชีสูงสุดในระบบ:
                      <br />- ใช้สำหรับการล็อกอินผ่าน SSH, SFTP
                      <br />- ใช้ควบคุมหน้าจัดการเว็บเบราว์เซอร์ PVE Web Console
                      <br />- ห้ามทำหายหรือตั้งรหัสผ่านเดาได้ง่ายเกินไป</p>
                  </div>
                )}
                {step === 5 && (
                  <div>
                    <p><strong>Management Network</strong></p>
                    <p style={{ marginTop: '6px' }}>ตั้งค่าการเชื่อมต่อไอพีและช่องสื่อสารหลัก:
                      <br />- IP Address: ต้องใช้ Static IP คงที่ ห้ามใช้ไอพีแบบสุ่ม (DHCP) เพื่อไม่ให้หมายเลขควบคุมระบบหลุดเปลี่ยนระหว่างใช้งาน
                      <br />- Hostname: ตั้งเป็นรูปแบบ FQDN เช่น <code>pve-server.local</code></p>
                  </div>
                )}
                {step === 6 && (
                  <div>
                    <p><strong>ตรวจสอบ Summary สุดท้าย</strong></p>
                    <p style={{ marginTop: '6px' }}>ตรวจดูรายละเอียดทุกช่องพารามิเตอร์ว่าถูกต้องตามแผนผังเครือข่ายก่อนเขียนดิสก์จริง เมื่อกดยืนยันแล้วระบบจะเริ่มเขียนข้อมูลดิสก์และฟอร์แมตดิสก์ทันที</p>
                  </div>
                )}
                {step === 7 && (
                  <div>
                    <p><strong>กำลังเขียนข้อมูลระบบ...</strong></p>
                    <p style={{ marginTop: '6px' }}>ระบบปฏิบัติการจะแบ่งพื้นที่ดิสก์ ทำการสร้างพาร์ติชันสำหรับ LVM/ZFS, คัดลอก Linux Kernel ของ Debian, และเซ็ตอัปแพ็กเกจช่วยรันของ Proxmox VE</p>
                  </div>
                )}
                {step === 8 && (
                  <div>
                    <p><strong>ติดตั้งเสร็จสมบูรณ์!</strong></p>
                    <p style={{ marginTop: '6px' }}>คอมพิวเตอร์สั่ง Reboot เรียบร้อย หน้าจอแสดง URL หมายเลขไอพีควบคุมทางไกลผ่านพอร์ต 8006:
                      <br />- <code>https://192.168.10.50:8006/</code>
                      <br />- สังเกตสัญลักษณ์ความปลอดภัยแบบ HTTPS และหมายเลขพอร์ต 8006 เสมอ</p>
                  </div>
                )}
              </div>

              {/* Right Column (Actual Form Visual / Interactive Simulator) */}
              <div style={{
                background: '#0f172a',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                {step === 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#60a5fa', fontFamily: 'Courier New, monospace', marginBottom: '24px' }}>
                      Proxmox Virtual Environment 8.2<br />
                      GNU/Linux Kernel-based Hypervisor Boot Menu
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxWidth: '280px',
                      margin: '0 auto',
                      textAlign: 'left'
                    }}>
                      <div style={{ background: '#2563eb', color: '#ffffff', padding: '10px 14px', borderRadius: '4px', border: '1px solid #3b82f6', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }} onClick={() => setStep(1)}>
                        👉 Install Proxmox VE (Graphical)
                      </div>
                      <div style={{ background: '#1e293b', color: '#94a3b8', padding: '10px 14px', borderRadius: '4px', border: '1px solid #334155', fontSize: '13px', opacity: 0.5 }}>
                        Install Proxmox VE (Console Mode)
                      </div>
                      <div style={{ background: '#1e293b', color: '#94a3b8', padding: '10px 14px', borderRadius: '4px', border: '1px solid #334155', fontSize: '13px', opacity: 0.5 }}>
                        Advanced Options / Rescue System
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '20px' }}>
                      (แนะนำคลิกหัวข้อบนสุดเพื่อรันโหมดช่วยเหลือตัวช่วยแบบกราฟิก)
                    </span>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#f97316', marginBottom: '8px', fontWeight: 'bold' }}>
                      End User License Agreement (EULA)
                    </h4>
                    <div style={{
                      background: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: '6px',
                      padding: '10px',
                      height: '130px',
                      overflowY: 'scroll',
                      fontSize: '11px',
                      color: '#94a3b8',
                      lineHeight: '1.4',
                      marginBottom: '16px'
                    }}>
                      PROXMOX VIRTUAL ENVIRONMENT END USER LICENSE AGREEMENT.<br /><br />
                      * LICENSE GRANT: Proxmox Server Solutions GmbH grants you a non-exclusive license to use the Proxmox VE compiled software for internal host management.<br /><br />
                      * AGPL LICENSING: The source code is licensed under GNU Affero General Public License Version 3. You may view and contribute to the package.<br /><br />
                      * NO WARRANTY: The software is provided 'as is' without warranty of any kind. Use at your own risk.
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setStep(2)}
                        style={{
                          background: '#f97316',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 18px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        I Agree (ตกลงและยินยอม)
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#f97316', marginBottom: '12px', fontWeight: 'bold' }}>
                      Target Harddisk Selection (ระบุดิสก์ลงระบบ)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: '#1e293b',
                        padding: '10px 14px',
                        borderRadius: '6px'
                      }}>
                        <span style={{ fontSize: '12px', color: '#cbd5e1', width: '100px' }}>Target Disk:</span>
                        <select
                          value={selectedDisk}
                          onChange={(e) => setSelectedDisk(e.target.value)}
                          style={{
                            flexGrow: 1,
                            background: '#0f172a',
                            color: '#ffffff',
                            border: '1px solid #475569',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            fontSize: '12px'
                          }}
                        >
                          <option value="/dev/sda - SSD 250GB">/dev/sda - SSD 250GB (แนะนำ สำหรับระบบหลัก)</option>
                          <option value="/dev/sdb - HDD 2TB">/dev/sdb - HDD 2TB (ดิสก์สำรองเก็บข้อมูล)</option>
                        </select>
                      </div>
                      <div style={{ fontSize: '11px', color: '#f43f5e', padding: '4px' }}>
                        ⚠️ ข้อควรระวัง: ข้อมูลดิสก์ที่เลือกจะโดนล้างฟอร์แมตเขียนระบบใหม่ทั้งหมด กรุณาตรวจสอบและตั้งสติก่อนดำเนินการ
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#f97316', marginBottom: '12px', fontWeight: 'bold' }}>
                      Location and Time Zone Selection (ตั้งเขตเวลา)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1e293b', padding: '14px', borderRadius: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Country:</span>
                        <input type="text" readOnly value="Thailand" style={{ background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Time Zone:</span>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #475569', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }}
                        >
                          <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                          <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Keyboard:</span>
                        <input type="text" readOnly value="English (US)" style={{ background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }} />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#f97316', marginBottom: '12px', fontWeight: 'bold' }}>
                      Password and Email (รหัสแอดมิน root)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1e293b', padding: '14px', borderRadius: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Password:</span>
                        <input
                          type="text"
                          value={rootPass}
                          onChange={(e) => setRootPass(e.target.value)}
                          style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #475569', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Confirm Pass:</span>
                        <input type="password" value={rootPass} readOnly style={{ background: '#0f172a', color: '#64748b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Email Address:</span>
                        <input type="text" readOnly value="admin-alert@yourdomain.com" style={{ background: '#0f172a', color: '#64748b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }} />
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#f97316', marginBottom: '12px', fontWeight: 'bold' }}>
                      Management Network Config (เครือข่ายควบคุม)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1e293b', padding: '14px', borderRadius: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Management Interface:</span>
                        <input type="text" readOnly value="eno1 (Physical NIC)" style={{ background: '#0f172a', color: '#64748b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Hostname (FQDN):</span>
                        <input type="text" readOnly value="pve-server.local" style={{ background: '#0f172a', color: '#64748b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>IP Address / CIDR:</span>
                        <input
                          type="text"
                          value={mgmtIP}
                          onChange={(e) => setMgmtIP(e.target.value)}
                          style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #475569', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Gateway IP:</span>
                        <input type="text" readOnly value="192.168.10.1" style={{ background: '#0f172a', color: '#64748b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11.5px' }} />
                      </div>
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#f97316', marginBottom: '10px', fontWeight: 'bold' }}>
                      Summary (สรุปผลข้อมูลทั้งหมดก่อนตกลงเขียนดิสก์)
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: '#1e293b',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      marginBottom: '12px'
                    }}>
                      <div>Target Disk: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{selectedDisk}</span></div>
                      <div>Timezone: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{timezone}</span></div>
                      <div>IP Address: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{mgmtIP}</span></div>
                      <div>Gateway: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>192.168.10.1</span></div>
                      <div>DNS Server: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>8.8.8.8</span></div>
                      <div>Hostname: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>pve-server.local</span></div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '10.5px', color: '#f59e0b' }}>
                      ⚠️ ข้อมูลเดิมในไดรฟ์เป้าหมายปลายทางจะสูญหายถาวรเมื่อกดยืนยันการติดตั้ง
                    </div>
                  </div>
                )}

                {step === 7 && (
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ fontSize: '14px', color: '#f97316', marginBottom: '14px', fontWeight: 'bold' }}>
                      กำลังคัดลอกไฟล์และตั้งค่า Kernel...
                    </h4>
                    <div style={{
                      background: '#1e293b',
                      height: '18px',
                      borderRadius: '9px',
                      overflow: 'hidden',
                      border: '1px solid #475569',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)',
                        height: '100%',
                        width: `${installProgress}%`,
                        transition: 'width 0.1s ease-out'
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      กำลังจัดส่งแพ็คเกจ Debian & Proxmox... {installProgress}%
                    </span>
                  </div>
                )}

                {step === 8 && (
                  <div style={{ background: '#020617', padding: '14px', borderRadius: '6px', border: '1px solid #1e293b', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#22c55e', lineHeight: '1.4' }}>
                      Debian GNU/Linux 12 pve-server tty1<br /><br />
                      Welcome to the Proxmox Virtual Environment Web Manager.<br />
                      Please use your web browser to configure the host at:<br />
                      <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '12px' }}>https://192.168.10.50:8006/</span>
                    </div>
                    <button
                      onClick={() => setStep(9)}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: 'bold',
                        marginTop: '12px',
                        alignSelf: 'flex-end'
                      }}
                    >
                      🌐 ล็อกอินเข้า Web UI Dashboard (พอร์ต 8006)
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div style={{
              background: '#1e293b',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                className="installer-nav-btn"
                disabled={step === 0 || step >= 7}
                onClick={() => setStep(step - 1)}
                style={{
                  background: '#475569',
                  color: '#ffffff',
                  border: 'none'
                }}
              >
                ◀ ย้อนกลับ (Back)
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {step < 6 ? (
                  <button
                    className="installer-nav-btn"
                    onClick={() => setStep(step + 1)}
                    style={{
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none'
                    }}
                  >
                    ถัดไป (Next) ▶
                  </button>
                ) : step === 6 ? (
                  <button
                    className="installer-nav-btn"
                    onClick={() => setStep(7)}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none'
                    }}
                  >
                    💾 ยืนยันการติดตั้ง (Install)
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Section 3: Advanced Proxmox Web UI & LXC Simulator */
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '22px' }}>⚙️</span> ระบบจำลองการจัดการเครื่องเสมือน (Advanced Proxmox Web UI & Practice Lab)
            </h2>
            <button
              onClick={() => {
                setStep(0);
                setContainers(prev => prev.map((c, i) => i === 0 ? {
                  ...c,
                  status: 'running',
                  isNginxInstalled: true,
                  isNginxRunning: true,
                  htmlContent: "<h1>ยินดีต้อนรับสู่เว็บเซิร์ฟเวอร์ของ นายสมชาย (std01)</h1>\n<p>สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1</p>\n<div style='color: #0284c7; font-weight: bold; margin-top: 15px; border-top: 2px dashed #0284c7; padding-top: 10px;'>Status: Nginx is working successfully on Port 80!</div>"
                } : {
                  ...c,
                  status: 'stopped',
                  isNginxInstalled: false,
                  isNginxRunning: false,
                  htmlContent: "<h1>ยินดีต้อนรับสู่เว็บไซต์ของ std02</h1>\n<p>กำลังอยู่ในระหว่างการพัฒนาเซ็ตอัป...</p>"
                }));
              }}
              style={{
                background: '#f43f5e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 รีเซ็ตโปรแกรมจำลองทั้งหมด
            </button>
          </div>
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            ฝึกปฏิบัติการสร้างตู้คอนเทนเนอร์ LXC ส่วนตัว, ควบคุมการเปิด-ปิด (Power Settings), รันชุดคำสั่งคอนโซลลินุกซ์ และปรับปรุงหน้าเว็บไฟล์ HTML เพื่อทดลองเสมือนจริงในบอร์ดควบคุมหน้าจอด้านล่างนี้
          </p>

          {/* Proxmox VE Web UI Workspace Container */}
          <div style={{
            display: 'flex',
            height: '420px',
            background: '#0f172a',
            borderRadius: '10px',
            border: '2px solid #ea580c',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            color: '#e2e8f0'
          }}>

            {/* Tree Sidebar Menu */}
            <div style={{
              width: '180px',
              background: '#020617',
              borderRight: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  onClick={() => setSelectedHost(true)}
                  style={{
                    fontWeight: 'bold',
                    color: selectedHost ? '#f97316' : '#818cf8',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: selectedHost ? 'rgba(249,115,22,0.1)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🌐</span> Datacenter
                </div>

                <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    onClick={() => setSelectedHost(true)}
                    style={{
                      color: selectedHost ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: '3px',
                      fontWeight: selectedHost ? 'bold' : 'normal',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🖥️</span> pve-server
                  </div>

                  {/* Container nodes list */}
                  <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {containers.map(c => {
                      const isActive = !selectedHost && selectedContainerId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedHost(false);
                            setSelectedContainerId(c.id);
                          }}
                          style={{
                            color: isActive ? '#f97316' : c.status === "running" ? '#10b981' : '#94a3b8',
                            fontWeight: isActive ? 'bold' : 'normal',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            background: isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>📦</span> {c.id} ({c.name})
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sidebar bottom Creator Form */}
              <div style={{
                borderTop: '1px solid #1e293b',
                paddingTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>⚡ เมนูด่วนสร้างตู้ LXC:</span>
                <input
                  type="text"
                  placeholder="ชื่อตู้ (เช่น std03)"
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  style={{
                    background: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    color: '#ffffff'
                  }}
                />
                <button
                  onClick={handleAddContainer}
                  style={{
                    background: '#f97316',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  + สร้าง LXC Container
                </button>
              </div>
            </div>

            {/* Right Dashboard panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090d16', overflow: 'hidden' }}>

              {/* Header inside Panel */}
              <div style={{
                background: '#1e293b',
                padding: '10px 16px',
                borderBottom: '1px solid #2d3748',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12.5px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#f97316' }}>
                  {selectedHost ? "🖥️ Node: pve-server (Physical Main Host)" : `📦 Container ID: ${selectedContainerId}`}
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>● Logged: root@pam</span>
              </div>

              {/* Content Panel Body */}
              <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {selectedHost ? (
                  /* HOST VIEW SCREEN */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div style={{ background: '#020617', border: '1px solid #1e293b', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>CPU Usage</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>12.4%</div>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>4 Cores (Intel Xeon)</div>
                      </div>
                      <div style={{ background: '#020617', border: '1px solid #1e293b', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>RAM Allocation</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>4.8 GB / 16.0 GB</div>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>ระบบใช้ควบคุมเสถียรภาพ</div>
                      </div>
                      <div style={{ background: '#020617', border: '1px solid #1e293b', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>LXC Containers</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>{containers.length} เครื่องเสมือน</div>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>รันปกติ {containers.filter(c => c.status === "running").length} / ปิดอยู่ {containers.filter(c => c.status === "stopped").length}</div>
                      </div>
                    </div>

                    <div style={{ background: '#020617', border: '1px solid #1e293b', padding: '12px', borderRadius: '6px' }}>
                      <h4 style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold', marginBottom: '8px' }}>
                        📊 ตารางข้อมูลการบริหารจัดการเครือข่ายแล็บในเครื่องหลัก (Host IP: 192.168.10.50)
                      </h4>
                      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                            <th style={{ padding: '6px 4px' }}>ID / ชื่อตู้</th>
                            <th style={{ padding: '6px 4px' }}>หมายเลข IP</th>
                            <th style={{ padding: '6px 4px' }}>สถานะทำงาน</th>
                            <th style={{ padding: '6px 4px' }}>บริการเว็บ (Port 80)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {containers.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #1e293b' }}>
                              <td style={{ padding: '6px 4px' }}>{c.id} - {c.name}</td>
                              <td style={{ padding: '6px 4px', fontFamily: 'monospace' }}>{c.ip}</td>
                              <td style={{ padding: '6px 4px' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '99px',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  background: c.status === "running" ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)',
                                  color: c.status === "running" ? '#22c55e' : '#f43f5e'
                                }}>
                                  {c.status === "running" ? "Online" : "Offline"}
                                </span>
                              </td>
                              <td style={{ padding: '6px 4px' }}>
                                <span style={{ color: c.isNginxRunning ? '#22c55e' : '#94a3b8' }}>
                                  {c.isNginxRunning ? "✓ Nginx Active" : "✗ Not Working"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* CONTAINER VIEW SCREEN */
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
                    {/* Power Controls row */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '12px',
                      background: '#020617',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #1e293b',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>ควบคุมสิทธิ์ไฟฟ้า:</span>
                      <button
                        onClick={() => handleToggleContainerPower("start")}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ▶ Start
                      </button>
                      <button
                        onClick={() => handleToggleContainerPower("stop")}
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ■ Stop
                      </button>
                      <button
                        onClick={() => handleToggleContainerPower("restart")}
                        style={{
                          background: '#d97706',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Restart
                      </button>

                      <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#cbd5e1' }}>
                        สถานะเครื่อง: <span style={{
                          fontWeight: 'bold',
                          color: containers.find(c => c.id === selectedContainerId)?.status === "running" ? '#22c55e' : '#f43f5e'
                        }}>
                          {containers.find(c => c.id === selectedContainerId)?.status === "running" ? "รันอยู่ (Running)" : "ปิดเครื่องอยู่ (Stopped)"}
                        </span>
                      </div>
                    </div>

                    {/* Sub tabs selector inside Container View */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', marginBottom: '10px' }}>
                      <button
                        onClick={() => setActiveTab("summary")}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          background: activeTab === "summary" ? '#1e293b' : 'transparent',
                          color: activeTab === "summary" ? '#ffffff' : '#94a3b8',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: activeTab === "summary" ? 'bold' : 'normal',
                          borderRadius: '4px 4px 0 0'
                        }}
                      >
                        📋 รายละเอียดตู้ (Summary)
                      </button>
                      <button
                        onClick={() => setActiveTab("console")}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          background: activeTab === "console" ? '#1e293b' : 'transparent',
                          color: activeTab === "console" ? '#ffffff' : '#94a3b8',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: activeTab === "console" ? 'bold' : 'normal',
                          borderRadius: '4px 4px 0 0'
                        }}
                      >
                        💻 เทอร์มินัลแล็บ (Console CLI)
                      </button>
                      <button
                        onClick={() => setActiveTab("browser")}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          background: activeTab === "browser" ? '#1e293b' : 'transparent',
                          color: activeTab === "browser" ? '#ffffff' : '#94a3b8',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: activeTab === "browser" ? 'bold' : 'normal',
                          borderRadius: '4px 4px 0 0'
                        }}
                      >
                        🌐 ทดสอบเปิดเว็บ (Web Browser)
                      </button>
                    </div>

                    {/* Tab panels details switcher */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

                      {/* Summary Tab */}
                      {activeTab === "summary" && (
                        <div style={{ background: '#020617', border: '1px solid #1e293b', padding: '12px', borderRadius: '6px', fontSize: '11.5px', lineHeight: '1.6' }}>
                          <h4 style={{ color: '#f97316', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
                            ข้อมูลทางเทคนิคของตู้ LXC
                          </h4>
                          <div>ID ตู้จำลองเสมือน: <strong style={{ color: '#ffffff' }}>{selectedContainerId}</strong></div>
                          <div>ชื่อบริการเครือข่าย: <strong style={{ color: '#ffffff' }}>{containers.find(c => c.id === selectedContainerId)?.name}</strong></div>
                          <div>พิกัด IP Address: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{containers.find(c => c.id === selectedContainerId)?.ip}/24</strong></div>
                          <div>OS template: <strong style={{ color: '#ffffff' }}>ubuntu-24.04-standard (Linux)</strong></div>
                          <div>ขนาดพื้นที่จัดเก็บ: <strong style={{ color: '#ffffff' }}>8 GB (LVM shared pool)</strong></div>
                          <div style={{ marginTop: '10px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
                            ตัวเลือกแอปพลิเคชันติดตั้งภายในตู้:
                            <br />- Nginx installed status: <span style={{ color: containers.find(c => c.id === selectedContainerId)?.isNginxInstalled ? '#22c55e' : '#cbd5e1', fontWeight: 'bold' }}>{containers.find(c => c.id === selectedContainerId)?.isNginxInstalled ? "ติดตั้งสำเร็จ (Installed)" : "ยังไม่ได้ติดตั้ง (Not Installed)"}</span>
                            <br />- Nginx service active: <span style={{ color: containers.find(c => c.id === selectedContainerId)?.isNginxRunning ? '#22c55e' : '#cbd5e1', fontWeight: 'bold' }}>{containers.find(c => c.id === selectedContainerId)?.isNginxRunning ? "กำลังรันบริการ (Active / Running)" : "ปิดบริการอยู่ (Stopped)"}</span>
                          </div>
                        </div>
                      )}

                      {/* Console Tab */}
                      {activeTab === "console" && (
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>

                          {/* Nano Text Editor Popup inside Console Container */}
                          {showNanoEditor ? (
                            <div style={{
                              flexGrow: 1,
                              background: '#000000',
                              color: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              display: 'flex',
                              flexDirection: 'column',
                              fontFamily: 'monospace',
                              padding: '6px'
                            }}>
                              <div style={{ background: '#ffffff', color: '#000000', padding: '2px 8px', fontSize: '9px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                <span>GNU nano 7.2</span>
                                <span>/var/www/html/index.html</span>
                              </div>
                              <textarea
                                value={nanoText}
                                onChange={(e) => setNanoText(e.target.value)}
                                style={{
                                  flexGrow: 1,
                                  background: '#000000',
                                  color: '#22c55e',
                                  border: 'none',
                                  outline: 'none',
                                  padding: '8px',
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  resize: 'none'
                                }}
                              />
                              <div style={{ background: '#1e293b', padding: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '9px', color: '#94a3b8' }}>คำใบ้: ลองพิมพ์แก้ไขหัวข้อ HTML เช่น Hello My Server ให้เป็นชื่อตัวเอง</span>
                                <button
                                  onClick={handleSaveNano}
                                  style={{
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '3px',
                                    padding: '4px 10px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  💾 เซฟงานและปิดตัวแก้ไข (Ctrl+O & Ctrl+X)
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Linux Standard Terminal Box */
                            <div style={{
                              flexGrow: 1,
                              background: '#020617',
                              border: '1px solid #1e293b',
                              borderRadius: '6px',
                              padding: '10px',
                              fontFamily: 'Courier New, monospace',
                              fontSize: '11px',
                              color: '#cbd5e1',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              minHeight: '180px'
                            }}>
                              <div style={{ overflowY: 'auto', flexGrow: 1, maxHeight: '160px' }}>
                                {containers.find(c => c.id === selectedContainerId)?.status === "stopped" ? (
                                  <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '40px', fontWeight: 'bold' }}>
                                    Offline Console: ตู้จำลองปิดการใช้งานอยู่ กรุณากดปุ่ม Start ด้านบนเพื่อเปิดใช้งานเครื่อง
                                  </div>
                                ) : (
                                  <>
                                    {terminalLogs.map((log, i) => (
                                      <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: '3px' }}>{log}</div>
                                    ))}
                                    {isTyping && <span className="term-cursor" />}
                                  </>
                                )}
                              </div>

                              {/* Interactive Command helper triggers */}
                              {containers.find(c => c.id === selectedContainerId)?.status === "running" && (
                                <div style={{
                                  borderTop: '1px solid #1e293b',
                                  paddingTop: '8px',
                                  marginTop: '6px',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '6px'
                                }}>
                                  <button
                                    disabled={isTyping}
                                    onClick={() => handleRunCommand("update")}
                                    className="quick-action-btn"
                                  >
                                    1. อัปเดตแพ็คเกจ (apt update)
                                  </button>
                                  <button
                                    disabled={isTyping || !containers.find(c => c.id === selectedContainerId)?.status}
                                    onClick={() => handleRunCommand("install")}
                                    className="quick-action-btn"
                                  >
                                    2. ติดตั้ง Nginx (apt install nginx)
                                  </button>
                                  <button
                                    disabled={isTyping || !containers.find(c => c.id === selectedContainerId)?.isNginxInstalled}
                                    onClick={() => handleRunCommand("start")}
                                    className="quick-action-btn"
                                  >
                                    3. เปิดใช้งาน (systemctl start nginx)
                                  </button>
                                  <button
                                    disabled={isTyping || !containers.find(c => c.id === selectedContainerId)?.isNginxInstalled}
                                    onClick={() => handleRunCommand("nano")}
                                    className="quick-action-btn"
                                    style={{ borderColor: '#eab308', color: '#eab308' }}
                                  >
                                    ✍ 4. เขียนเว็บไฟล์ (nano index.html)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Web Browser Preview Tab */}
                      {activeTab === "browser" && (
                        <div style={{
                          flexGrow: 1,
                          background: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          color: '#000000',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '200px'
                        }}>

                          {/* Browser address bar */}
                          <div style={{
                            background: '#f1f5f9',
                            borderBottom: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px'
                          }}>
                            <span style={{ color: '#94a3b8' }}>🔒 Secure</span>
                            <div style={{
                              flexGrow: 1,
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              color: '#475569',
                              fontFamily: 'monospace'
                            }}>
                              http://{containers.find(c => c.id === selectedContainerId)?.ip}/
                            </div>
                            <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔄</span>
                          </div>

                          {/* Browser main display rendering HTML */}
                          <div style={{ flexGrow: 1, padding: '14px', overflowY: 'auto' }}>
                            {(!containers.find(c => c.id === selectedContainerId)?.isNginxInstalled ||
                              !containers.find(c => c.id === selectedContainerId)?.isNginxRunning ||
                              containers.find(c => c.id === selectedContainerId)?.status === "stopped") ? (
                              <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>
                                <div style={{ fontSize: '26px' }}>🚫</div>
                                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginTop: '6px' }}>
                                  ERR_CONNECTION_REFUSED
                                </h4>
                                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                  ไม่สามารถเข้าชมเว็บไซต์ได้เนื่องจากยังไม่ได้ติดตั้งหรือยังไม่เริ่มรัน Nginx ที่พอร์ต 80 ในตู้นี้
                                </p>
                              </div>
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{ __html: containers.find(c => c.id === selectedContainerId)?.htmlContent || "" }}
                                style={{ fontSize: '13px', color: '#0f172a' }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Detailed Step-by-Step CLI Instructions */}
      <section style={{ marginBottom: '20px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '22px' }}>📖</span> สรุปขั้นตอนปฏิบัติการอย่างละเอียดตามข้อความอ้างอิง (Official text references)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)'
          }}>
            <h4 style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '13px', marginBottom: '8.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>🖥️</span> 1. สรุปติดตั้ง Proxmox VE (วันอังคาร)
            </h4>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6.5px' }}>
              <li><strong>บูตผ่านแฟลชไดรฟ์:</strong> เสียบสื่อเขียน ISO เลือกบูต UEFI/BIOS ไปที่หน้า boot menu แล้วเลือก Install Proxmox VE (Graphical)</li>
              <li><strong>EULA & Harddisk:</strong> กดยอมรับสัญญาการใช้งาน เลือกดิสก์ความเร็วสูง SSD (เช่น <code>/dev/sda</code>) สำหรับลงตัวนำ Hypervisor</li>
              <li><strong>พิกัดและรหัสผ่าน:</strong> กำหนด Country: Thailand, Timezone: Asia/Bangkok และกรอกรหัสผ่าน root สำหรับใช้ดูแลระบบ</li>
              <li><strong>สถิติเน็ตเวิร์กคงที่ (Static IP):</strong> ตั้งค่า Hostname: <code>pve-server.local</code> และระบุหมายเลขไอพีเฉพาะ <code>192.168.10.50/24</code></li>
              <li><strong>เข้าควบคุมหน้าเว็บ:</strong> หลังบูตเสร็จ ระบบจะแสดงหน้าต่างดำระบุลิงก์ ให้พิมพ์ <code>https://192.168.10.50:8006/</code> เพื่อเข้าแดชบอร์ดหลัก</li>
            </ol>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)'
          }}>
            <h4 style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px', marginBottom: '8.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>📦</span> 2. สรุปติดตั้ง Nginx Web Server (วันศุกร์)
            </h4>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6.5px' }}>
              <li><strong>เชื่อมต่อ SSH พอร์ต 22:</strong> นักศึกษาเชื่อมต่อเข้าตู้ LXC ของตนเองผ่าน Terminal: <code>ssh root@192.168.10.101</code></li>
              <li><strong>อัปเดตและสั่งติดตั้ง:</strong> สั่งรันคำสั่ง <code>sudo apt update</code> ตามด้วย <code>sudo apt install nginx -y</code> เพื่อดึงและติดตั้งแพ็คเกจ</li>
              <li><strong>ดูแลควบคุมบริการ:</strong> สั่งรันบริการเช็คสถานะด้วย <code>sudo systemctl status nginx</code> หรือสั่งเริ่มใหม่ด้วย <code>sudo systemctl restart nginx</code></li>
              <li><strong>ปรับแต่งหน้าหลัก:</strong> เขียนทับหน้าแรกของเว็บที่ <code>/var/www/html/index.html</code> โดยใช้โปรแกรม <code>sudo nano</code> เขียนแต่งโค้ด HTML ประจำตัว</li>
              <li><strong>ตรวจสอบและทดสอบ:</strong> รันตรวจความถูกต้องของไวยากรณ์ก่อนรีสตาร์ทบริการทุกครั้งด้วย <code>sudo nginx -t</code> เพื่อลดความเสี่ยงเว็บล่ม</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   INTERACTIVE CHMOD & CHOWN VISUALIZER
   ============================================================ */
function ChmodChownVisualizer({ s }: { s: SlideData }) {
  // Permission state for Owner, Group, Others
  const [perms, setPerms] = useState({
    owner: { r: true, w: true, x: false },
    group: { r: true, w: false, x: false },
    others: { r: true, w: false, x: false },
  });

  // Chown state
  const [fileOwner, setFileOwner] = useState('root');
  const [fileGroup, setFileGroup] = useState('root');
  const [chownAnimating, setChownAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<'chmod' | 'chown'>('chmod');

  // Calculate octal for a single group
  const calcOctal = (p: { r: boolean; w: boolean; x: boolean }) =>
    (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);

  // Full octal string
  const octalStr = `${calcOctal(perms.owner)}${calcOctal(perms.group)}${calcOctal(perms.others)}`;

  // ls -l string
  const toLs = (p: { r: boolean; w: boolean; x: boolean }) =>
    `${p.r ? 'r' : '-'}${p.w ? 'w' : '-'}${p.x ? 'x' : '-'}`;
  const lsStr = `-${toLs(perms.owner)}${toLs(perms.group)}${toLs(perms.others)}`;

  // Security assessment
  const getSecurityLevel = () => {
    const o = octalStr;
    if (o === '777' || o === '776' || o === '767') return { level: 'อันตรายมาก!', color: '#ef4444', emoji: '🚨', desc: 'ทุกคนสามารถอ่าน เขียน รันได้ ห้ามใช้บน Production!' };
    if (o === '666' || o === '667') return { level: 'ไม่ปลอดภัย', color: '#f97316', emoji: '⚠️', desc: 'ทุกคนสามารถแก้ไขไฟล์ได้ เสี่ยงต่อการถูกแก้ไข' };
    if (o === '644' || o === '755') return { level: 'แนะนำ ✓', color: '#22c55e', emoji: '✅', desc: o === '644' ? 'เหมาะสำหรับไฟล์ทั่วไป เช่น HTML, CSS, JS' : 'เหมาะสำหรับโฟลเดอร์หรือ Script' };
    if (o === '600' || o === '400') return { level: 'ปลอดภัยสูง', color: '#3b82f6', emoji: '🔒', desc: 'เหมาะสำหรับไฟล์ลับ เช่น SSH Key, .env' };
    if (o === '700') return { level: 'ปลอดภัยสูง', color: '#3b82f6', emoji: '🔒', desc: 'เหมาะสำหรับโฟลเดอร์ส่วนตัว เช่น ~/.ssh' };
    if (o === '000') return { level: 'ล็อกทั้งหมด', color: '#6b7280', emoji: '🔐', desc: 'ไม่มีใครเข้าถึงไฟล์ได้เลย' };
    return { level: 'กำหนดเอง', color: '#8b5cf6', emoji: '⚙️', desc: 'สิทธิ์กำหนดเอง ตรวจสอบว่าเหมาะสมกับสถานการณ์' };
  };

  const security = getSecurityLevel();

  // Presets
  const presets = [
    { label: '📄 ไฟล์เว็บ', value: '644', owner: { r: true, w: true, x: false }, group: { r: true, w: false, x: false }, others: { r: true, w: false, x: false } },
    { label: '📁 โฟลเดอร์เว็บ', value: '755', owner: { r: true, w: true, x: true }, group: { r: true, w: false, x: true }, others: { r: true, w: false, x: true } },
    { label: '🔑 SSH Key', value: '600', owner: { r: true, w: true, x: false }, group: { r: false, w: false, x: false }, others: { r: false, w: false, x: false } },
    { label: '📂 ~/.ssh', value: '700', owner: { r: true, w: true, x: true }, group: { r: false, w: false, x: false }, others: { r: false, w: false, x: false } },
    { label: '🔓 อ่านอย่างเดียว', value: '444', owner: { r: true, w: false, x: false }, group: { r: true, w: false, x: false }, others: { r: true, w: false, x: false } },
    { label: '⚠️ 777 อันตราย', value: '777', owner: { r: true, w: true, x: true }, group: { r: true, w: true, x: true }, others: { r: true, w: true, x: true } },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setPerms({ owner: { ...p.owner }, group: { ...p.group }, others: { ...p.others } });
  };

  const togglePerm = (target: 'owner' | 'group' | 'others', perm: 'r' | 'w' | 'x') => {
    setPerms(prev => ({
      ...prev,
      [target]: { ...prev[target], [perm]: !prev[target][perm] }
    }));
  };

  // Chown users
  const users = ['root', 'student01', 'webadmin', 'nginx'];
  const groups = ['root', 'www-data', 'webadmins', 'sudo'];

  const handleChown = (newOwner: string, newGroup: string) => {
    setChownAnimating(true);
    setTimeout(() => {
      setFileOwner(newOwner);
      setFileGroup(newGroup);
      setChownAnimating(false);
    }, 600);
  };

  const permColors = { r: '#60a5fa', w: '#f59e0b', x: '#22c55e' };
  const permLabels = { r: 'Read', w: 'Write', x: 'Execute' };
  const targetLabels = { owner: { label: 'Owner (u)', icon: '👤', color: '#60a5fa' }, group: { label: 'Group (g)', icon: '👥', color: '#a78bfa' }, others: { label: 'Others (o)', icon: '🌍', color: '#f97316' } };

  return (
    <div className="slide slide-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes chmod-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes chmod-glow { 0%,100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 20px 4px rgba(99,102,241,0.4); } }
        @keyframes chown-fly { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-20px) scale(1.15); opacity: 0.6; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes chmod-pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes chmod-check { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .chmod-toggle { transition: all 0.15s ease; cursor: pointer; user-select: none; }
        .chmod-toggle:hover { transform: scale(1.08); }
        .chmod-toggle:active { transform: scale(0.95); }
        .chmod-result { animation: chmod-pop 0.2s ease-out; }
        .chmod-preset { transition: all 0.2s ease; cursor: pointer; }
        .chmod-preset:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .chown-card { transition: all 0.3s ease; }
        .chown-fly { animation: chown-fly 0.6s ease-in-out; }
        .chmod-tab { transition: all 0.2s; cursor: pointer; }
        .chmod-tab:hover { opacity: 0.9; }
      `}} />

      <div className="slide-tag">{s.tag}</div>
      <h2 style={{ marginBottom: '8px', fontSize: 'clamp(18px, 2.2vw, 26px)' }}>{s.title}</h2>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)' }}>
        <div className="chmod-tab" onClick={() => setActiveTab('chmod')} style={{
          flex: 1, padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px',
          background: activeTab === 'chmod' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
          color: activeTab === 'chmod' ? 'white' : 'var(--text-secondary)',
          boxShadow: activeTab === 'chmod' ? '0 2px 10px rgba(99,102,241,0.3)' : 'none'
        }}>🔐 chmod — เครื่องคำนวณสิทธิ์</div>
        <div className="chmod-tab" onClick={() => setActiveTab('chown')} style={{
          flex: 1, padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px',
          background: activeTab === 'chown' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
          color: activeTab === 'chown' ? 'white' : 'var(--text-secondary)',
          boxShadow: activeTab === 'chown' ? '0 2px 10px rgba(99,102,241,0.3)' : 'none'
        }}>👤 chown — เปลี่ยนเจ้าของไฟล์</div>
      </div>

      {activeTab === 'chmod' ? (
        /* ═══ CHMOD TAB ═══ */
        <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0 }}>

          {/* LEFT: Permission toggles */}
          <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Permission grid */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', padding: '12px', flex: 1 }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}></div>
                {(['r', 'w', 'x'] as const).map(p => (
                  <div key={p} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: permColors[p] }}>
                    {p.toUpperCase()} ({permLabels[p]})
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ค่า {p === 'r' ? 4 : p === 'w' ? 2 : 1}</div>
                  </div>
                ))}
              </div>

              {/* Permission rows */}
              {(['owner', 'group', 'others'] as const).map(target => {
                const info = targetLabels[target];
                const octal = calcOctal(perms[target]);
                return (
                  <div key={target} style={{
                    display: 'grid', gridTemplateColumns: '120px repeat(3, 1fr)', gap: '6px', alignItems: 'center',
                    padding: '8px 6px', borderRadius: '8px', marginBottom: '4px',
                    background: `${info.color}08`, border: `1px solid ${info.color}22`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{info.icon}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: info.color }}>{info.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{octal}</div>
                      </div>
                    </div>
                    {(['r', 'w', 'x'] as const).map(perm => (
                      <div
                        key={perm}
                        className="chmod-toggle"
                        onClick={() => togglePerm(target, perm)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '8px 4px', borderRadius: '8px',
                          background: perms[target][perm] ? `${permColors[perm]}22` : 'var(--bg-card)',
                          border: `2px solid ${perms[target][perm] ? permColors[perm] : 'var(--border)'}`,
                          boxShadow: perms[target][perm] ? `0 0 8px ${permColors[perm]}33` : 'none'
                        }}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '2px' }}>
                          {perms[target][perm] ? (perm === 'r' ? '📖' : perm === 'w' ? '✏️' : '⚡') : '🚫'}
                        </div>
                        <div style={{
                          fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace',
                          color: perms[target][perm] ? permColors[perm] : '#6b7280'
                        }}>
                          {perms[target][perm] ? perm : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {presets.map((p, i) => (
                <div key={i} className="chmod-preset" onClick={() => applyPreset(p)} style={{
                  background: octalStr === p.value ? 'var(--accent-dim, rgba(99,102,241,0.15))' : 'var(--bg-card)',
                  border: `1px solid ${octalStr === p.value ? 'var(--accent, #6366f1)' : 'var(--border)'}`,
                  borderRadius: '8px', padding: '6px 8px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{p.label}</div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', color: octalStr === p.value ? 'var(--accent, #6366f1)' : 'var(--text-secondary)' }}>{p.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Result display */}
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Big octal display */}
            <div key={octalStr} className="chmod-result" style={{
              background: `${security.color}15`, border: `2px solid ${security.color}`,
              borderRadius: '14px', padding: '14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>ค่าสิทธิ์ (Octal)</div>
              <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: "'JetBrains Mono', monospace", color: security.color, letterSpacing: '8px', lineHeight: 1.1 }}>
                {octalStr}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '16px' }}>{security.emoji}</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: security.color }}>{security.level}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{security.desc}</div>
            </div>

            {/* ls -l display */}
            <div style={{ background: '#0d1117', borderRadius: '10px', padding: '10px 12px', border: '1px solid #30363d' }}>
              <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>$ ls -l result</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', display: 'flex', gap: '0' }}>
                <span style={{ color: '#8b949e' }}>-</span>
                <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{toLs(perms.owner)}</span>
                <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{toLs(perms.group)}</span>
                <span style={{ color: '#f97316', fontWeight: 'bold' }}>{toLs(perms.others)}</span>
                <span style={{ color: '#8b949e' }}> 1 {fileOwner} {fileGroup}</span>
              </div>
              <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
                {lsStr.split('').map((ch, i) => (
                  <div key={i} style={{
                    width: '18px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', borderRadius: '3px',
                    background: i === 0 ? '#21262d' : i <= 3 ? '#60a5fa18' : i <= 6 ? '#a78bfa18' : '#f9731618',
                    color: ch === '-' ? '#6b7280' : i <= 3 ? '#60a5fa' : i <= 6 ? '#a78bfa' : '#f97316',
                    border: `1px solid ${ch === '-' ? '#30363d' : i <= 3 ? '#60a5fa33' : i <= 6 ? '#a78bfa33' : '#f9731633'}`
                  }}>{ch}</div>
                ))}
              </div>
              <div style={{ display: 'flex', marginTop: '3px', fontSize: '9px', color: '#8b949e' }}>
                <span style={{ width: '18px', textAlign: 'center' }}>ชนิด</span>
                <span style={{ width: '54px', textAlign: 'center', marginLeft: '2px' }}>Owner</span>
                <span style={{ width: '54px', textAlign: 'center', marginLeft: '2px' }}>Group</span>
                <span style={{ width: '54px', textAlign: 'center', marginLeft: '2px' }}>Others</span>
              </div>
            </div>

            {/* chmod command */}
            <div style={{ background: '#0d1117', borderRadius: '10px', padding: '10px 12px', border: '1px solid #30363d' }}>
              <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>คำสั่ง chmod ที่ต้องพิมพ์</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                <span style={{ color: '#79c0ff' }}>$ </span>
                <span style={{ color: '#7ee787' }}>chmod</span>
                <span style={{ color: '#ffa657', fontWeight: 'bold' }}> {octalStr}</span>
                <span style={{ color: '#c9d1d9' }}> filename</span>
              </div>
            </div>

            {/* Calculation breakdown */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '10px', border: '1px solid var(--border)', flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>📊 วิธีคิดตัวเลข</div>
              {(['owner', 'group', 'others'] as const).map(target => {
                const p = perms[target];
                const info = targetLabels[target];
                return (
                  <div key={target} style={{ fontSize: '11px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: info.color, fontWeight: 'bold', minWidth: '55px' }}>{info.icon} {target === 'owner' ? 'Owner' : target === 'group' ? 'Group' : 'Others'}:</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {p.r ? '4' : '0'}+{p.w ? '2' : '0'}+{p.x ? '1' : '0'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>=</span>
                    <span style={{ fontWeight: 'bold', color: info.color, fontFamily: 'monospace', fontSize: '14px' }}>{calcOctal(p)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ═══ CHOWN TAB ═══ */
        <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0 }}>

          {/* LEFT: File visualization */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Current file info */}
            <div className={chownAnimating ? 'chown-fly' : ''} style={{
              background: 'var(--bg-elevated)', borderRadius: '14px', border: '2px solid var(--border)',
              padding: '16px', textAlign: 'center', transition: 'all 0.3s'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '6px' }}>📄</div>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>/var/www/html/index.html</div>

              {/* Owner / Group display */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '6px' }}>
                <div style={{ background: '#60a5fa18', border: '2px solid #60a5fa', borderRadius: '10px', padding: '10px 16px', minWidth: '100px' }}>
                  <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 'bold', marginBottom: '4px' }}>👤 Owner</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: '#60a5fa' }}>{fileOwner}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px', color: 'var(--text-secondary)' }}>:</div>
                <div style={{ background: '#a78bfa18', border: '2px solid #a78bfa', borderRadius: '10px', padding: '10px 16px', minWidth: '100px' }}>
                  <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold', marginBottom: '4px' }}>👥 Group</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: '#a78bfa' }}>{fileGroup}</div>
                </div>
              </div>

              {/* ls -l preview */}
              <div style={{ background: '#0d1117', borderRadius: '8px', padding: '8px 12px', marginTop: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#c9d1d9', textAlign: 'left' }}>
                <span style={{ color: '#8b949e' }}>{lsStr}</span> 1 <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{fileOwner}</span> <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{fileGroup}</span> 612 Jun 10 index.html
              </div>
            </div>

            {/* Chown command preview */}
            <div style={{ background: '#0d1117', borderRadius: '10px', padding: '12px 16px', border: '1px solid #30363d' }}>
              <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '6px' }}>คำสั่ง chown ที่ใช้</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: 1.8 }}>
                <div>
                  <span style={{ color: '#79c0ff' }}>$ </span>
                  <span style={{ color: '#ff7b72' }}>sudo</span>
                  <span style={{ color: '#7ee787' }}> chown</span>
                  <span style={{ color: '#60a5fa', fontWeight: 'bold' }}> {fileOwner}</span>
                  <span style={{ color: '#c9d1d9' }}>:</span>
                  <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{fileGroup}</span>
                  <span style={{ color: '#ffa657' }}> /var/www/html/index.html</span>
                </div>
              </div>
            </div>

            {/* Common chown scenarios */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--border)', flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>📌 สถานการณ์จำลอง (กดเพื่อทดลอง)</div>
              {[
                { label: '🌐 มอบไฟล์เว็บให้ student01 + www-data', owner: 'student01', group: 'www-data', desc: 'ลง Nginx แล้วไฟล์เป็น root ต้องมอบให้นักเรียน' },
                { label: '👨‍💻 มอบให้ทีม webadmins ดูแล', owner: 'webadmin', group: 'webadmins', desc: 'ให้ทีมงานทั้งกลุ่มมีสิทธิ์จัดการร่วมกัน' },
                { label: '🔙 คืนเจ้าของให้ root', owner: 'root', group: 'root', desc: 'กลับค่าเริ่มต้น เจ้าของเป็น root ทั้งคู่' },
                { label: '🟢 มอบให้ Nginx ดูแล', owner: 'nginx', group: 'www-data', desc: 'ให้ Nginx service เป็นเจ้าของจัดการเอง' },
              ].map((sc, i) => (
                <div key={i} className="chmod-preset" onClick={() => handleChown(sc.owner, sc.group)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', marginBottom: '4px',
                  background: fileOwner === sc.owner && fileGroup === sc.group ? 'var(--accent-dim, rgba(99,102,241,0.15))' : 'var(--bg-elevated)',
                  border: `1px solid ${fileOwner === sc.owner && fileGroup === sc.group ? 'var(--accent, #6366f1)' : 'var(--border)'}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{sc.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{sc.desc}</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent, #6366f1)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{sc.owner}:{sc.group}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Controls */}
          <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Change Owner */}
            <div style={{ background: '#60a5fa12', border: '1px solid #60a5fa44', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '6px' }}>👤 เปลี่ยน Owner (เจ้าของ)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {users.map(u => (
                  <div key={u} className="chmod-toggle" onClick={() => handleChown(u, fileGroup)} style={{
                    padding: '6px 8px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold',
                    fontFamily: 'monospace',
                    background: fileOwner === u ? '#60a5fa' : 'var(--bg-card)',
                    color: fileOwner === u ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${fileOwner === u ? '#60a5fa' : 'var(--border)'}`
                  }}>{u}</div>
                ))}
              </div>
            </div>

            {/* Change Group */}
            <div style={{ background: '#a78bfa12', border: '1px solid #a78bfa44', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '6px' }}>👥 เปลี่ยน Group (กลุ่ม)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {groups.map(g => (
                  <div key={g} className="chmod-toggle" onClick={() => handleChown(fileOwner, g)} style={{
                    padding: '6px 8px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold',
                    fontFamily: 'monospace',
                    background: fileGroup === g ? '#a78bfa' : 'var(--bg-card)',
                    color: fileGroup === g ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${fileGroup === g ? '#a78bfa' : 'var(--border)'}`
                  }}>{g}</div>
                ))}
              </div>
            </div>

            {/* Info boxes */}
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e44', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#22c55e', marginBottom: '4px' }}>💡 จำง่ายๆ</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#60a5fa' }}>chmod</strong> = เปลี่ยน <strong>สิทธิ์</strong> (ทำอะไรได้บ้าง?)<br />
                <strong style={{ color: '#a78bfa' }}>chown</strong> = เปลี่ยน <strong>เจ้าของ</strong> (ของใคร?)<br />
                <strong style={{ color: '#f97316' }}>chgrp</strong> = เปลี่ยนแค่ <strong>กลุ่ม</strong> อย่างเดียว
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>🔄 ออปชัน -R (Recursive)</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                เปลี่ยนทั้งโฟลเดอร์และไฟล์ลูกข้างในทั้งหมดทีเดียว:<br />
                <code style={{ color: '#7ee787', background: '#0d1117', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                  chown -R student01:www-data /var/www/
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideRenderer({ slide }: { slide: SlideData }) {
  switch (slide.type) {
    case "cover": return <CoverSlide s={slide} />;
    case "content": return <ContentSlide s={slide} />;
    case "two-col": return <TwoColSlide s={slide} />;
    case "scoring": return <ScoringSlide s={slide} />;
    case "lab": return <LabSlide s={slide} />;
    case "summary": return <SummarySlide s={slide} />;
    case "diagram": return <DiagramSlide s={slide} />;
    case "wayground": return <WaygroundSlide s={slide} />;
    case "dhcp-hotel": return <DhcpHotelAnimation s={slide} />;
    case "interactive-act": return <InteractiveActivitySlide s={slide} />;
    case "homework": return <HomeworkSlide s={slide} />;
    case "stack-installer-anim": return <StackInstallerAnimation s={slide} />;
    case "nginx-config": return <NginxConfigSlide s={slide} />;
    case "nginx-flow-anim": return <NginxFlowAnimation s={slide} />;
    case "mariadb-query-anim": return <MariaDBQueryAnimation s={slide} />;
    case "nodejs-request-anim": return <NodeJSRequestAnimation s={slide} />;
    case "chmod-chown-visual": return <ChmodChownVisualizer s={slide} />;
    case "tcp-udp-anim": return <TCPUDPAnimation s={slide} />;
    case "socket-binding-anim": return <SocketBindingAnimation s={slide} />;
    case "port-scan-anim": return <PortScanAnimation s={slide} />;
    case "ip-infographic": return <IPAddressInfographic s={slide} />;
    case "packet-flow-anim": return <PacketFlowAnimation s={slide} />;
    case "ufw-rules-visualizer": return <UFWRulesVisualizer s={slide} />;
    case "nmap-handshake-anim": return <NmapHandshakeAnim s={slide} />;
    case "ufw-log-analyzer": return <UFWLogAnalyzer s={slide} />;
    case "firewall-attack-sim": return <FirewallAttackSim s={slide} />;
    case "nmap-recon-mission": return <NmapReconMission s={slide} />;
    case "network-topology-anim": return <NetworkTopologyAnim s={slide} />;
    case "osi-layer-drill": return <OSILayerDrill s={slide} />;
    case "tcp-state-machine": return <TCPStateMachine s={slide} />;
    case "subnetting-calculator": return <SubnettingCalculator s={slide} />;
    case "service-hardening-quiz": return <ServiceHardeningQuiz s={slide} />;
    case "ufw-netfilter-arch": return <UFWNetfilterArchitecture s={slide} />;
    case "stateful-conn-tracking": return <StatefulConnectionTracking s={slide} />;
    case "network-attacks-defenses": return <NetworkAttacksDefenses s={slide} />;
    case "ufw-log-dissector": return <UFWLogDissector s={slide} />;
    case "ufw-log-homework": return <UFWLogHomework s={slide} />;
    case "nmap-handshake-diagram": return <NmapHandshakeDiagram s={slide} />;
    case "workshop-architecture": return <WorkshopArchitecture s={slide} />;
    case "proxmox-arch-visualizer": return <ProxmoxArchVisualizer s={slide} />;
    case "proxmox-install-steps": return <ProxmoxInstallStepVisualizer s={slide} />;
    case "proxmox-create-ct-steps": return <ProxmoxCreateCTVisualizer s={slide} />;
    default: return <ContentSlide s={slide} />;
  }
}

/* --- Download helper --- */
function downloadSlideJSON(weekData: WeekData) {
  const blob = new Blob([JSON.stringify(weekData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `week-${String(weekData.week).padStart(2, "0")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* --- Dynamic Interactive Document component for Week 3a --- */
function DockerGuideDocument() {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '40px 5%',
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      lineHeight: '1.7',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Document Header */}
      <div style={{
        borderBottom: '2px solid var(--border)',
        paddingBottom: '24px',
        marginBottom: '32px'
      }}>
        <span style={{
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          padding: '6px 14px',
          borderRadius: '99px',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          คู่มือปฏิบัติการระบบเครือข่ายแม่ข่ายคอมพิวเตอร์ — ฉบับสมบูรณ์ (Hand-on Lab Manual)
        </span>
        <h1 style={{
          fontSize: 'clamp(28px, 3.5vw, 44px)',
          fontWeight: '800',
          lineHeight: '1.2',
          marginTop: '12px',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          คู่มือปฏิบัติการติดตั้ง Ubuntu Server 26.04 LTS สำหรับ Web Application ด้วย Docker & Nginx
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          เอกสารคู่มือแล็บฉบับเต็มโดยละเอียด แสดงทุกคำสั่งใน Terminal สำหรับระบบเครือข่าย LAN ผ่าน Switch, การตั้งค่าความปลอดภัย UFW Firewall, การเชื่อมทาง Nginx Reverse Proxy และการสร้าง Docker Container แบบ Step-by-Step.
        </p>
      </div>

      {/* Overview Interactive Animation */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>🎬</span> แผนผังจำลองการไหลของข้อมูลเสมือนจริง (Comprehensive Network Topology)
        </h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
          ไดอะแกรมแสดงเส้นทางการรับส่งแพ็กเกจคำขอ (HTTP Request) จากเว็บเบราว์เซอร์ของ Client ผ่าน LAN Switch เข้าสู่พอร์ต 80 ของเซิร์ฟเวอร์ย่อยที่ให้บริการโดย Nginx Reverse Proxy จากนั้น Nginx จะทำการเชื่อมทางส่งต่อข้อมูล (Proxy Pass) ไปยังพอร์ต 3000 ของตู้คอนเทนเนอร์ Docker (ชื่อคอนเทนเนอร์: website) ที่รันอยู่เบื้องหลังอย่างเป็นระบบ.
        </p>

        {/* Dynamic Overview Flow SVG */}
        <div style={{
          background: '#090d16',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          <svg className="docker-guide-svg" viewBox="0 0 800 340" style={{ width: '100%', height: 'auto' }}>
            <defs>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Network Connections Lines */}
            <path d="M 120 170 L 260 170" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <path d="M 380 170 L 500 120" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <path d="M 620 155 L 620 200" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />

            {/* Glowing Flow Paths for motion animation */}
            <path id="reqFlow" d="M 100 170 L 320 170 L 620 120 L 620 230" fill="none" stroke="rgba(14,165,233,0.15)" strokeWidth="2" strokeDasharray="6,4" />
            <path id="resFlow" d="M 620 230 L 620 120 L 320 170 L 100 170" fill="none" stroke="rgba(10,185,129,0.15)" strokeWidth="2" strokeDasharray="6,4" />

            {/* Request Packet Pulse (Yellow/Orange) */}
            <circle r="7" fill="#f59e0b" filter="url(#glow)">
              <animateMotion dur="5s" repeatCount="indefinite" path="M 100 170 L 320 170 L 620 120 L 620 230" keyTimes="0; 0.3; 0.7; 1" />
            </circle>

            {/* Response Packet Pulse (Green) */}
            <circle r="7" fill="#10b981" filter="url(#glow)">
              <animateMotion dur="5s" begin="2.5s" repeatCount="indefinite" path="M 620 230 L 620 120 L 320 170 L 100 170" keyTimes="0; 0.3; 0.7; 1" />
            </circle>

            {/* Client PC Node */}
            <rect className="node-client" x="40" y="130" width="120" height="80" rx="8" fill="#111827" stroke="#0ea5e9" strokeWidth="2" />
            <text className="text-white" x="100" y="165" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">💻 Client PC</text>
            <text className="text-muted" x="100" y="185" fill="#94a3b8" fontSize="10" textAnchor="middle">192.168.1.100</text>
            <text className="text-blue" x="100" y="197" fill="#38bdf8" fontSize="8" fontWeight="600" textAnchor="middle">ส่ง HTTP Request</text>

            {/* Unmanaged Switch Node */}
            <rect className="node-switch" x="260" y="130" width="120" height="80" rx="8" fill="#111827" stroke="#10b981" strokeWidth="2" />
            <text className="text-white" x="320" y="165" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">🎛️ LAN Switch</text>
            <text className="text-muted" x="320" y="185" fill="#94a3b8" fontSize="9" textAnchor="middle">Unmanaged (L2)</text>
            <text className="text-green" x="320" y="197" fill="#34d399" fontSize="8" fontWeight="600" textAnchor="middle">กระจายข้อมูลวงแลน</text>

            {/* Host Server Box Container */}
            <rect className="node-server" x="480" y="25" width="280" height="285" rx="12" fill="rgba(99, 102, 241, 0.04)" stroke="#6366f1" strokeWidth="2" />
            <text className="text-purple" x="620" y="50" fill="#a5b4fc" fontSize="11" fontWeight="bold" textAnchor="middle">🖥️ HOST SERVER (Ubuntu 26.04)</text>
            <text className="text-purple" x="620" y="65" fill="#6366f1" fontSize="9" fontWeight="600" textAnchor="middle">Static IP: 192.168.1.10</text>

            {/* Nginx Service Inside Server */}
            <rect className="node-nginx" x="500" y="85" width="240" height="70" rx="8" fill="#1f2937" stroke="#f43f5e" strokeWidth="1.5" />
            <text className="text-white" x="620" y="112" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">⚙️ Nginx Reverse Proxy</text>
            <text className="text-red" x="620" y="130" fill="#fca5a5" fontSize="9" textAnchor="middle">รับ Request พอร์ต 80 (HTTP)</text>
            <text className="text-rose-strong" x="620" y="142" fill="#f43f5e" fontSize="8" fontWeight="600" textAnchor="middle">ส่งต่อ ➔ http://localhost:3000</text>

            {/* Docker Container website inside Server */}
            <rect className="node-docker" x="500" y="200" width="240" height="80" rx="8" fill="#1f2937" stroke="#38bdf8" strokeWidth="1.5" />
            <text className="text-white" x="620" y="228" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">🐋 Docker Container</text>
            <text className="text-purple" x="620" y="244" fill="#93c5fd" fontSize="9" textAnchor="middle">ชื่อ container: website</text>
            <text className="text-blue" x="620" y="258" fill="#38bdf8" fontSize="8" fontWeight="600" textAnchor="middle">Next.js App (พอร์ต 3000)</text>
          </svg>
        </div>
      </section>

      {/* ขั้นตอนที่ 1: แผนการเชื่อมต่อและกำหนดไอพีเครือข่ายกายภาพ */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔌</span> ขั้นตอนที่ 1: การวางแผนโครงสร้างเครือข่ายและการเข้าสายแลน (Physical Topology)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          การจัดทำระบบแม่ข่ายภายในสถาบันการศึกษา จะใช้สาย LAN ชนิด **Straight-through (สายตรง)** เข้าหัวต่อ **RJ-45** ตามมาตรฐาน **TIA/EIA 568B** ในการเชื่อมโยงการ์ดเครือข่ายจากคอมพิวเตอร์เข้าสู่พอร์ตของ Unmanaged Switch.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
            <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>🌈 มาตรฐานลำดับสีการเข้าหัวสายตรง (TIA-568B)</strong>
            <ol style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>ขาวส้ม</li>
              <li>ส้ม</li>
              <li>ขาวเขียว</li>
              <li>น้ำเงิน</li>
              <li>ขาวน้ำเงิน</li>
              <li>เขียว</li>
              <li>ขาวน้ำตาล</li>
              <li>น้ำตาล</li>
            </ol>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--green)' }}>
            <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>📋 ตารางระบุขอบเขตหมายเลขเครือข่าย (IP Allocation)</strong>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 0', color: 'var(--accent)' }}>อุปกรณ์</th>
                  <th style={{ padding: '6px 0', color: 'var(--accent)' }}>หมายเลข IP</th>
                  <th style={{ padding: '6px 0', color: 'var(--accent)' }}>บทบาท</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '6px 0' }}>Router</td>
                  <td style={{ padding: '6px 0' }}>`192.168.1.1`</td>
                  <td style={{ padding: '6px 0' }}>Default Gateway</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '6px 0' }}>Ubuntu Server</td>
                  <td style={{ padding: '6px 0' }}>`192.168.1.10`</td>
                  <td style={{ padding: '6px 0' }}>Static Server (โฮสต์รับข้อมูล)</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0' }}>Client PC</td>
                  <td style={{ padding: '6px 0' }}>`192.168.1.100+`</td>
                  <td style={{ padding: '6px 0' }}>เครื่องของนักศึกษา (เปิดทดสอบ)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>🛠️ คำสั่งตรวจสอบเครือข่ายฮาร์ดแวร์ก่อนเริ่มต้น:</strong>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>1. ตรวจสอบรายชื่อการ์ดเครือข่ายฮาร์ดแวร์ที่ติดตั้งในตัวเครื่อง:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo lshw -C network
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* สังเกตข้อมูลการ์ดแลนและไดรเวอร์เครือข่ายเพื่อประกอบการระบุตำแหน่งอินเทอร์เฟซ.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>2. ตรวจสอบว่าสาย LAN เชื่อมต่อทางกายภาพกับ Switch แล้วหรือไม่ (Link detected):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ethtool enp3s0
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* หากรายงานบรรทัดสุดท้ายระบุ "Link detected: yes" แสดงว่าสาย LAN เชื่อมโยงปกติและมีการส่งสัญญาณไฟแลน.</span>
          </div>
        </div>
      </section>

      {/* ขั้นตอนที่ 2: การตรวจสอบการ์ดแลนและการกำหนด Static IP */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🛠️</span> ขั้นตอนที่ 2: การกำหนด Static IP บน Ubuntu ด้วย Netplan
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          ในการปฏิบัติงานจริง เซิร์ฟเวอร์จำเป็นต้องใช้หมายเลขไอพีคงที่เพื่อป้องกันบริการปลายทางเสียหายหลังจากเปิดใช้งานระบบใหม่ โดยในระบบ Ubuntu Server 26.04 จะจัดการเครือข่ายผ่าน **Netplan (YAML)**.
        </p>

        {/* Command instructions block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>1. ตรวจสอบรายชื่อการ์ดจอเครือข่ายและสถานะ IP ปัจจุบัน:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              ip a
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* จดจำชื่อการ์ดจอเครือข่ายที่จะใส่ เช่น `enp3s0` หรือ `eth0`.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>2. สแกนตรวจสอบไฟล์ตั้งค่า Netplan ที่มีอยู่ในโฟลเดอร์ระบบ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              ls -la /etc/netplan/
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>3. ตรวจสอบข้อมูลในไฟล์การตั้งค่า Netplan ที่เป็นของเดิมก่อนทำการแก้ไข:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              cat /etc/netplan/*.yaml
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>4. ทำการคัดลอกไฟล์สำรอง (Backup) ไว้ล่วงหน้า ป้องกันระบบเครือข่ายเสียหายจนเชื่อมไม่ได้:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo cp /etc/netplan/50-cloud-init.yaml /etc/netplan/50-cloud-init.yaml.bak
            </code>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '8px' }}>
            <strong style={{ color: '#ef4444', fontSize: '13px', display: 'block', marginBottom: '6px' }}>⚠️ กฎการใช้งานโปรแกรม Nano ในการเขียนไฟล์เครือข่าย YAML:</strong>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0, lineHeight: '1.6' }}>
              <li>ใช้ปุ่มลูกศร (Arrow Keys) บนคีย์บอร์ดเพื่อเลื่อนเคอร์เซอร์ซ้าย-ขวา-บน-ล่าง.</li>
              <li>การจัดย่อหน้าเว้นวรรค ให้ใช้การกดเคาะปุ่ม Spacebar สองครั้งเท่านั้น ห้ามกดปุ่ม Tab บนคีย์บอร์ดเด็ดขาด เนื่องจากเป็นกฎโครงสร้างไวยากรณ์ YAML หากกด Tab ระบบจะรันเครือข่ายไม่ผ่าน.</li>
              <li>เมื่อทำการเขียนเสร็จสิ้น: บันทึกข้อมูลด้วยการกด `Ctrl + O` ตามด้วยการกดปุ่ม `Enter` และสั่งออกจากโปรแกรม Nano ด้วยการกดปุ่ม `Ctrl + X`.</li>
            </ul>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>5. สั่งเปิดโปรแกรม Nano เพื่อเข้าไปจัดการเขียนค่า Static IP:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo nano /etc/netplan/50-cloud-init.yaml
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>6. ลบข้อมูลเดิมออกทั้งหมด และทำการเคาะเว้นวรรคป้อนค่าเครือข่ายลงไปอย่างรอบคอบ:</span>
            <div style={{
              background: '#090d16',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.06)',
              overflowX: 'auto',
              marginTop: '6px'
            }}>
              <div><span style={{ color: '#facc15' }}>network:</span></div>
              <div><span style={{ color: '#facc15' }}>  version:</span> 2</div>
              <div><span style={{ color: '#facc15' }}>  renderer:</span> networkd</div>
              <div><span style={{ color: '#facc15' }}>  ethernets:</span></div>
              <div><span style={{ color: '#facc15' }}>    enp3s0:</span> <span style={{ color: '#8892a4' }}># แก้ไขชื่อตัวการ์ดแลนให้ตรงตามข้อมูลจาก 'ip a' ที่ตรวจสอบพบในเซิร์ฟเวอร์จริง</span></div>
              <div><span style={{ color: '#facc15' }}>      dhcp4:</span> false</div>
              <div><span style={{ color: '#facc15' }}>      addresses:</span></div>
              <div>        - <span style={{ color: '#34d399' }}>192.168.1.10/24</span></div>
              <div><span style={{ color: '#facc15' }}>      routes:</span></div>
              <div>        - <span style={{ color: '#facc15' }}>to:</span> default</div>
              <div>          <span style={{ color: '#facc15' }}>via:</span> <span style={{ color: '#34d399' }}>192.168.1.1</span> <span style={{ color: '#8892a4' }}># ชี้ไปเกตเวย์ของเราเตอร์หลัก</span></div>
              <div><span style={{ color: '#facc15' }}>      nameservers:</span></div>
              <div>        <span style={{ color: '#facc15' }}>addresses:</span></div>
              <div>          - <span style={{ color: '#34d399' }}>192.168.1.1</span> <span style={{ color: '#8892a4' }}># ชี้ DNS ปลายทางวงแลน</span></div>
              <div>          - <span style={{ color: '#34d399' }}>8.8.8.8</span> <span style={{ color: '#8892a4' }}># เพิ่ม DNS นอกระบบสำหรับค้นหาและเชื่อมต่อเว็บด้านนอก (Google)</span></div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* ทำการบันทึกด้วย `Ctrl + O` ➔ `Enter` และกด `Ctrl + X` เพื่อออก.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>7. บังคับระดับความปลอดภัยสูงสุดของสิทธิ์ในการเข้าถึงและอ่านไฟล์ Netplan คอนฟิก:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo chmod 600 /etc/netplan/50-cloud-init.yaml
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>8. สั่งเกตประเมินโครงสร้างไวยากรณ์ (Syntax Evaluation) ก่อนทำการบังคับใช้ ป้องกันระบบเครือข่ายตัดการทำงานชั่วกัปชั่วกัลป์:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo netplan try
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* ระบบจะนับถอยหลัง 120 วินาที หากไม่มีการกด Enter ยืนยันการเปลี่ยนแปลงระบบจะทำการ Rollback กลับอัตโนมัติ.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>9. ยืนยันการเปลี่ยนแปลงเครือข่ายให้ทำงานอย่างเป็นทางการ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo netplan apply
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>10. ตรวจสอบหมายเลขไอพีใหม่ว่าผูกเข้ากับการ์ดแลนสมบูรณ์หรือไม่:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              ip addr show enp3s0
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>11. ตรวจสอบตารางการจัดการส่งต่อแพ็กเกจข้อมูลเกตเวย์หลัก (Routing Table):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              ip route show
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>12. ตรวจสอบการผูกชื่อโดเมน DNS Server ปัจจุบันของเครื่องเซิร์ฟเวอร์:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              resolvectl status
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>13. คำสั่งทำการส่ง Ping ตรวจสัญญาณความเชื่อมโยงกับ Router ปลายทาง:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              ping -c 4 192.168.1.1
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>14. คำสั่งทดสอบการเข้าถึงเครือข่ายอินเทอร์เน็ตของโฮสต์โดยส่ง Ping ไปยังโฮสต์ภายนอกสากล:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              ping -c 4 google.com
            </code>
          </div>
        </div>
      </section>

      {/* ขั้นตอนที่ 3: การติดตั้ง Nginx Web Server และการทำ Reverse Proxy */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔗</span> ขั้นตอนที่ 3: การติดตั้ง Nginx Web Server และการผูกตัวชี้ทางข้อมูล (Reverse Proxy)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          เมื่อจัดการเชื่อมต่อเครือข่ายเรียบร้อย ขั้นตอนต่อมาคือการติดตั้งและจัดแจง **Nginx Web Server** เพื่อใช้รับการเรียกคำขอของ Client (ที่พอร์ต 80) แล้วเชื่อมพาสทางเดิน (Reverse Proxy) ไปรออยู่ที่พอร์ต 3000 ของตัวแอปพลิเคชันที่จะนำมาเปิดการทำงานช่วงสุดท้าย.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>1. อัปเดตดัชนีแพ็กเกจระบบเพื่อให้ได้ระบบแอปเวอร์ชันล่าสุดจากคลังต้นฉบับ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo apt update
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>2. อัปเกรดแอปพลิเคชันพื้นฐานทั้งหมดของตัวระบบปฏิบัติการเพื่อหลีกเลี่ยงข้อขัดข้องด้านไลบรารี:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo apt upgrade -y
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>3. สั่งดาวน์โหลดและติดตั้ง Nginx เข้ามาประจำการในเครื่องแม่ข่าย:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo apt install -y nginx
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>4. สั่งสั่งเริ่มต้นกระบวนการการทำงาน (Start Service) ของเซิร์ฟเวอร์ Nginx ทันที:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo systemctl start nginx
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>5. สั่งผูกล็อกอินให้ Nginx ทำงานโดยอัตโนมัติเมื่อเครื่องเริ่มต้นเปิดระบบใหม่ในอนาคต (Enable on Boot):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo systemctl enable nginx
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>6. ตรวจสอบสถานะการทำงานในหน่วยความจำของ Nginx ในกระบวนการทำงานหลัก:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo systemctl status nginx
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* หน้าจอรายงานจะต้องขึ้น "Active: active (running)" บรรทัดสีเขียวอย่างสวยงาม.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>7. สร้างไฟล์ตั้งค่าระบบสำหรับเว็บไซต์หลักในคลังเก็บต้นฉบับการแสดงผล (sites-available):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo nano /etc/nginx/sites-available/webapp
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>8. เขียนชุดคำสั่ง Nginx Server Block ลงไปในหน้าแก้ไขเพื่อจัดการ Reverse Proxy ชี้เข้าหาพอร์ต 3000:</span>
            <div style={{
              background: '#090d16',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.06)',
              overflowX: 'auto',
              marginTop: '6px'
            }}>
              <div><span style={{ color: '#fca5a5' }}>server</span> &#123;</div>
              <div>  <span style={{ color: '#fca5a5' }}>listen</span> 80;</div>
              <div>  <span style={{ color: '#fca5a5' }}>server_name</span> 192.168.1.10; <span style={{ color: '#8892a4' }}># ผูกหมายเลข Static IP ของโฮสต์เซิร์ฟเวอร์</span></div>
              <br />
              <div>  <span style={{ color: '#fca5a5' }}>location</span> / &#123;</div>
              <div>    <span style={{ color: '#fca5a5' }}>proxy_pass</span> http://127.0.0.1:3000; <span style={{ color: '#8892a4' }}># ลิงก์เชื่อมโยงคำขอส่งต่อปลายทางไปยังพอร์ต 3000</span></div>
              <div>    <span style={{ color: '#fca5a5' }}>proxy_http_version</span> 1.1;</div>
              <div>    <span style={{ color: '#fca5a5' }}>proxy_set_header</span> Upgrade $http_upgrade;</div>
              <div>    <span style={{ color: '#fca5a5' }}>proxy_set_header</span> Connection 'upgrade';</div>
              <div>    <span style={{ color: '#fca5a5' }}>proxy_set_header</span> Host $host;</div>
              <div>    <span style={{ color: '#fca5a5' }}>proxy_cache_bypass</span> $http_upgrade;</div>
              <div>  &#125;</div>
              <div>&#125;</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* ทำการบันทึกด้วย `Ctrl + O` ➔ `Enter` และกด `Ctrl + X` เพื่อปิดโปรแกรมแก้ไข Nano.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>9. ทำการสร้าง Symbolic Link ข้ามโฟลเดอร์เพื่อผูกเข้าห้องส่งข้อมูลทำงานจริง (sites-enabled):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ln -sf /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>10. ตรวจสอบในห้องส่งข้อมูลจริงว่า Symbolic link ได้รับการสร้างเชื่อมโยงสมบูรณ์:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              ls -la /etc/nginx/sites-enabled/
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>11. ลบลิงก์หน้าเว็บต้อนรับดั้งเดิม of Nginx ออก เพื่อสลับคำขอให้มารับที่โครงสร้างบล็อกใหม่แทน:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo rm -f /etc/nginx/sites-enabled/default
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>12. ตรวจสอบไวยากรณ์และความปลอดภัยในการเขียนคอนฟิกทุกบรรทัดของ Nginx:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo nginx -t
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* ตรวจบันทึกในหน้าจอคอนโซลจะต้องแสดงผล "syntax is ok" และ "test is successful" จึงจะดำเนินงานต่อได้.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>13. สั่งให้ Nginx โหลดค่าการตั้งค่าใหม่โดยทันทีโดยไม่มีการปิดการทำงานชั่วคราว (Zero-Downtime Reload):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo systemctl reload nginx
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>14. ทดสอบเรียกใช้พอร์ต 80 ของเว็บเซิร์ฟเวอร์แบบโลคอลเพื่อตรวจสอบการตอบกลับ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              curl -I http://localhost
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', background: 'rgba(56, 189, 248, 0.05)', padding: '8px', borderLeft: '3px solid var(--accent)', borderRadius: '4px', marginTop: '4px' }}>
              💡 <strong>ความรู้แล็บปฏิบัติการ:</strong> ในสเต็ปนี้ นักเรียนจะได้รับการตอบรับกลับมาเป็นรหัสสถานะ <strong>HTTP/1.1 502 Bad Gateway</strong> ซึ่งถือว่าถูกต้องและเป็นปกติ เนื่องจาก Nginx ได้รับคำขอแล้วและพยายามส่งต่อไปที่พอร์ต 3000 ทว่าแอปพลิเคชันตู้ระบบคอนเทนเนอร์ยังไม่ได้รับการสร้างและเปิดทำงานในพอร์ต 3000 เลย.
            </span>
          </div>
        </div>
      </section>

      {/* ขั้นตอนที่ 4: การติดตั้ง Docker & Docker Compose */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🐋</span> ขั้นตอนที่ 4: การติดตั้งระบบคอนเทนเนอร์ Docker & Docker Compose
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          เมื่อจัดการโครงสร้างหลักของสถาปัตยกรรมทางเดินพอร์ตเสร็จเรียบร้อยแล้ว ในช่วงขั้นตอนสุดท้ายนี้เราจะเริ่มเตรียมการติดตั้งโปรแกรมจำลองตู้ระบบ **Docker Engine** และ **Docker Compose** เพื่อที่จะทำการ Deploy แอปพลิเคชันจริงขึ้นสู่การทำงาน.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>1. ล้างตระกูลโปรแกรม Docker รุ่นเก่าที่อาจมากับตัว OS เพื่อป้องกันสิทธิ์เข้าถึงทำงานขัดกัน:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo apt remove -y docker docker-engine docker.io containerd runc
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>2. ทำการสแกนอัปเดตระบบ และทำการดาวน์โหลดโปรแกรมตัวช่วยในด้านการดาวน์โหลด GPG Key คลังภายนอก:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo apt update && sudo apt install -y ca-certificates curl gnupg lsb-release
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>3. สั่งตั้งสร้างโฟลเดอร์สำหรับเก็บคีย์ความปลอดภัยอย่างถูกต้องเป็นสากลในลินุกซ์:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo install -m 0755 -d /etc/apt/keyrings
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>4. คำสั่งดึงคีย์ GPG ของ Docker เพื่อใช้ในการรับรองความปลอดภัยของแพ็กเกจภายนอก:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '12px' }}>
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>5. อนุญาตและตั้งระดับสิทธิ์การอ่านคีย์รักษาความปลอดภัยให้แก่ผู้ใช้งานทุกฝ่าย:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo chmod a+r /etc/apt/keyrings/docker.gpg
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>6. คำสั่งทำการบันทึกรายการ Repository แหล่งดาวน์โหลดหลักของ Docker ลงในไฟล์ระบบ Ubuntu 26.04:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list &gt; /dev/null
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>7. สั่งรีเฟรชอัปเดตดัชนีแพ็กเกจของระบบเพื่อให้รับรู้แหล่งดาวน์โหลด Docker คลังใหม่ล่าสุด:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo apt update
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>8. ติดตั้งชุดเครื่องมือในการรันตู้ Docker และส่วนควบคุมบิวต์จัดระเบียบ Docker Compose ทั้งชุด:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '12px' }}>
              sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>9. สั่งยืนยันบังคับให้เบื้องหลังบริการของ Docker เริ่มทำงานทันทีในหน่วยความจำเครื่อง:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo systemctl start docker
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>10. ตั้งค่าระบบให้เปิดโปรแกรมเบื้องหลัง Docker ทุกครั้งเมื่อมีสตาร์ตเครื่องโฮสต์ (Enable on Boot):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo systemctl enable docker
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>11. ตรวจสอบเวอร์ชันอย่างเป็นทางการของ Docker Engine ว่าสามารถใช้งานได้เรียบร้อย:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              docker --version
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>12. ตรวจสอบตรวจสอบรุ่นของชุดควบคุมบริการระบบ Compose:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              docker compose version
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>13. คำสั่งผูกล็อกบัญชีผู้ใช้ปัจจุบันกับสิทธิ์กลุ่มผู้ใช้งาน docker เพื่อที่จะป้อนรันระบบโดยไม่ต้องอาศัย sudo อีกต่อไป:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo usermod -aG docker $USER
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>14. สั่งบังคับการโหลดกลุ่มผู้ใช้ระบบใหม่ลงในเชลล์เซสชันนี้ในทันที โดยไม่ต้องทำการ Logout ออกระบบ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              newgrp docker
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>15. รันตู้ทดลองเริ่มต้นต้นฉบับดึงจาก Docker Hub ยืนยันสิทธิ์และความปลอดภัย:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              docker run hello-world
            </code>
          </div>
        </div>
      </section>

      {/* ขั้นตอนที่ 5: การสร้างไฟล์ Dockerfile และ docker-compose.yml */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🏗️</span> ขั้นตอนที่ 5: การเขียนคอนฟิก Dockerfile & Docker Compose และสั่งเริ่มรันระบบแอปพลิเคชัน
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          ในขั้นตอนนี้ เราจะนำแอปพลิเคชันที่ได้รับการพัฒนาเสร็จเป็นที่เรียบร้อย (Development Done) มาบรรจุลงในตู้ระบบ และใช้ระบบ **Docker Compose** เพื่อควบคุมการเปิดการทำงานของตู้อุปกรณ์ที่พอร์ต 3000.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>1. สร้างห้องทำงานสำหรับแอปพลิเคชันเครือข่าย และเปลี่ยนไดเรกทอรีเข้าไปด้านใน:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              mkdir -p ~/projects/website && cd ~/projects/website
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>2. ตรวจสอบโฟลเดอร์ปัจจุบันว่าเปลี่ยนไดเรกทอรีมาอยู่ในตำแหน่งที่ต้องการแน่นอนแล้ว:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              pwd
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>3. สั่งสร้างไฟล์ Dockerfile ในโปรแกรมแก้ข้อความ Nano:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              nano Dockerfile
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>4. คัดลอกคอนฟิกโครงสร้างไฟล์ Dockerfile สำหรับแอปพลิเคชัน (แบบ Node.js Production) วางในหน้าแก้ไข:</span>
            <div style={{
              background: '#090d16',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.06)',
              overflowX: 'auto',
              marginTop: '6px'
            }}>
              <div><span style={{ color: '#38bdf8' }}>FROM</span> node:20-alpine</div>
              <div><span style={{ color: '#38bdf8' }}>WORKDIR</span> /app</div>
              <div><span style={{ color: '#38bdf8' }}>COPY</span> package*.json ./</div>
              <div><span style={{ color: '#38bdf8' }}>RUN</span> npm install --production <span style={{ color: '#8892a4' }}># ติดตั้ง Library เฉพาะตัวจำเป็นสำหรับรันจริง</span></div>
              <div><span style={{ color: '#38bdf8' }}>COPY</span> . .</div>
              <div><span style={{ color: '#38bdf8' }}>EXPOSE</span> 3000</div>
              <div><span style={{ color: '#38bdf8' }}>CMD</span> ["npm", "start"]</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* บันทึกข้อมูลด้วยการกด `Ctrl + O` ➔ `Enter` และกด `Ctrl + X` เพื่อออก.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>5. สั่งสร้างไฟล์ docker-compose.yml ซึ่งใช้สำหรับจัดระดับควบคุมและจำกัดขอบเขตตู้ระบบ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              nano docker-compose.yml
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>6. ป้อนโค้ดคอนฟิก docker-compose.yml เพื่อกำหนดโครงสร้างตู้ชื่อ container "website" และเปิดพอร์ต 3000:</span>
            <div style={{
              background: '#090d16',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.06)',
              overflowX: 'auto',
              marginTop: '6px'
            }}>
              <div><span style={{ color: '#38bdf8' }}>services:</span></div>
              <div><span style={{ color: '#38bdf8' }}>  website:</span></div>
              <div><span style={{ color: '#38bdf8' }}>    container_name:</span> <span style={{ color: '#34d399' }}>website</span></div>
              <div><span style={{ color: '#38bdf8' }}>    build:</span></div>
              <div><span style={{ color: '#38bdf8' }}>      context:</span> .</div>
              <div><span style={{ color: '#38bdf8' }}>      dockerfile:</span> Dockerfile</div>
              <div><span style={{ color: '#38bdf8' }}>    ports:</span></div>
              <div>      - <span style={{ color: '#34d399' }}>"3000:3000"</span> <span style={{ color: '#8892a4' }}># เปิดให้บริการพอร์ต 3000 เข้าหาตู้แอป</span></div>
              <div><span style={{ color: '#38bdf8' }}>    environment:</span></div>
              <div>      - <span style={{ color: '#34d399' }}>NODE_ENV=production</span></div>
              <div><span style={{ color: '#38bdf8' }}>    restart:</span> unless-stopped</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* บันทึกข้อมูลด้วยการกด `Ctrl + O` ➔ `Enter` และกด `Ctrl + X` เพื่อออก.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>7. เริ่มทำการสั่งสร้างภาพอิมเมจ และเริ่มการสั่งรันตู้คอนเทนเนอร์ในฉากหลังแบบเงียบเชียบ (Detached Mode):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              docker compose up -d --build
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>8. สั่งให้ Docker แสดงตู้คอนเทนเนอร์ปัจจุบันทั้งหมดที่เปิดใช้งานเรียบร้อยแล้ว:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              docker ps
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* ควรจะเห็นคอนเทนเนอร์ชื่อ website และสถานะ Up อย่างสวยงาม.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>9. สั่งตรวจสอบประวัติการรันและดูบันทึกประวัติการรันเว็บภายในคอนเทนเนอร์:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              docker logs website
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>10. ตรวจเช็คข้อมูลแรมและทรัพยากรการประมวลผลพื้นฐานของตู้คอนเทนเนอร์:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              docker stats --no-stream
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>11. ทดสอบยิงคำขอเพื่อติดต่อพอร์ต 3000 ของตู้คอนเทนเนอร์ภายในระบบแบบโลคอล:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              curl -I http://localhost:3000
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* ควรได้รับ HTTP response รหัส 200 OK หรือรหัสอื่นๆ ที่แสดงว่าแอปพลิเคชันทำงานได้.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>12. ทดสอบเรียกใช้พอร์ต 80 ของเซิร์ฟเวอร์ด่านหน้าอีกครั้ง (ผ่าน Nginx Reverse Proxy):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              curl -I http://localhost
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', background: 'rgba(16, 185, 129, 0.05)', padding: '8px', borderLeft: '3px solid var(--green)', borderRadius: '4px', marginTop: '4px' }}>
              🎉 <strong>ผลการเรียนรู้แล็บปฏิบัติการ:</strong> ในสเต็ปนี้ นักเรียนจะต้องได้รับรหัสสถานะ <strong>HTTP/1.1 200 OK</strong> อย่างสวยงามและไม่มีข้อผิดพลาด. เนื่องจากเซิร์ฟเวอร์ Nginx ได้รับความเรียกร้องเข้ามาในพอร์ต 80 แล้วทำหน้าที่ Reverse Proxy เชื่อมเส้นทางเดินแพ็กเกจส่งมอบเข้าหาพอร์ต 3000 ของตู้ระบบ Docker Container ที่เพิ่งเปิดขึ้นมาใหม่ได้รวดเร็วตามหลักสถาปัตยกรรมระบบ.
            </span>
          </div>
        </div>
      </section>

      {/* ขั้นตอนที่ 6: การตั้งค่า UFW Firewall และทดสอบระบบ */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🛡️</span> ขั้นตอนที่ 6: การตั้งค่าความปลอดภัยระบบเครือข่ายเซิร์ฟเวอร์ (UFW Firewall & Port Scanning)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          ความปลอดภัยเป็นเรื่องสำคัญในระบบเครือข่าย ในขั้นตอนสุดท้ายนี้นักเรียนจะต้องทำการเปิดใช้งาน **UFW (Uncomplicated Firewall)** ของเซิร์ฟเวอร์ และทำการอนุญาตเฉพาะช่องการเข้าถึงระบบที่ปลอดภัยเท่านั้น.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>1. ตรวจสอบสถานะการทำงานของไฟร์วอลล์ระบบลินุกซ์ปัจจุบัน:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ufw status
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>2. กำหนดนโยบายความปลอดภัยพื้นฐาน: ไม่อนุญาตแพ็กเกจขาเข้าทุกรอยต่อ (Default Deny Incoming):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ufw default deny incoming
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>3. กำหนดนโยบายความปลอดภัยพื้นฐาน: อนุญาตแพ็กเกจเดินทางออกไปทุกทิศทาง (Default Allow Outgoing):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ufw default allow outgoing
            </code>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '6px' }}>
            <strong style={{ color: '#ef4444', fontSize: '13px', display: 'block', marginBottom: '4px' }}>🚨 จุดสำคัญที่สุดในการทำแล็บ (โปรดระมัดระวัง):</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              นักเรียนห้ามสั่งเปิดใช้งานไฟร์วอลล์เด็ดขาด หากยังไม่ได้ทำการอนุญาตพอร์ต OpenSSH (พอร์ต 22) มิฉะนั้น ระบบไฟร์วอลล์จะทำการบล็อกสิทธิ์และจะตัดการเชื่อมต่อระยะไกล (SSH) ในทันที ทำให้นักเรียนหลุดการรีโมตจากห้องแล็บ.
            </span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>4. สั่งสั่งเปิดช่องทางให้อนุญาตบริการรับรีโมตผ่านพอร์ต SSH ปลอดภัย (พอร์ต 22):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ufw allow OpenSSH
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>5. สั่งอนุญาตพอร์ตหลักสำหรับการเชื่อมต่อภายนอกเข้าหาเว็บแอปพลิเคชัน (ครอบคลุมทั้ง HTTP และ HTTPS):</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ufw allow 'Nginx Full'
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>6. คำสั่งเปิดการใช้งานระบบ UFW Firewall ระบบรักษาความปลอดภัยเครือข่ายของเครื่องแม่ข่ายอย่างเป็นทางการ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ufw enable
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* หากคอนโซลถามคำตอบ "Command may disrupt existing ssh connections. Proceed?" ให้พิมพ์คีย์บอร์ด `y` แล้วกด `Enter` เพื่อยืนยันสิทธิ์.</span>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>7. สั่งตรวจสอบตารางความปลอดภัยไฟร์วอลล์และสิทธิ์พอร์ตที่มีการเปิดใช้อย่างเป็นทางการ:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ufw status verbose
            </code>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>8. สแกนตรวจสอบระบบเครือข่ายเซิร์ฟเวอร์ว่าเปิดรับฟัง (Listening) หมายเลขพอร์ตใดในฮาร์ดแวร์บ้าง:</span>
            <code style={{ display: 'block', background: '#090d16', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
              sudo ss -tulpn
            </code>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* หน้าจอรายงานสแกนพอร์ตจะมีพอร์ต `80` (Nginx) และพอร์ต `3000` (Docker Container) เปิดสถานะการรับสัญญาณคำขออย่างถูกต้อง.</span>
          </div>
        </div>
      </section>

      {/* Lab Steps for Students */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '30px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--green)', marginBottom: '20px', borderLeft: '4px solid var(--green)', paddingLeft: '12px' }}>
          🏁 แผนปฏิบัติงานและเกณฑ์การทดสอบสำหรับนักศึกษา (Lab Steps & Evaluation Rubrics)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎯</span> <strong style={{ fontSize: '15px', display: 'block', margin: '8px 0 4px' }}>วัตถุประสงค์หลักแล็บ</strong>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
              <li>ทำคู่มือและคำนวณตั้ง Static IP บนเครื่องเซิร์ฟเวอร์ระบบ Ubuntu 26.04 สำเร็จ.</li>
              <li>ติดตั้งและตั้งค่า Nginx ทำหน้าที่เป็น Reverse Proxy ม้วนส่งพอร์ต 3000 เรียบร้อย.</li>
              <li>ติดตั้งกลุ่มชุดระบบตู้คอนเทนเนอร์ Docker & Docker Compose สำเร็จเรียบร้อย.</li>
              <li>Deploy แอปพลิเคชันจริงผ่านคำสั่ง docker compose up คอนเทนเนอร์ชื่อ website ได้สมบูรณ์.</li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: '8px' }}>
            <span style={{ fontSize: '20px' }}>📋</span> <strong style={{ fontSize: '15px', display: 'block', margin: '8px 0 4px' }}>ขั้นตอนเช็คคะแนนสำหรับส่งงาน</strong>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
              <li>Client PC สามารถส่ง Ping เข้าเซิร์ฟเวอร์โฮสต์ไอพี `192.168.1.10` ผ่านฉลุย.</li>
              <li>Client PC เรียกดูหน้าเว็บ `http://192.168.1.10` ได้ทันทีแสดงเว็บแอปของเราไร้ที่ติ.</li>
              <li>ตรวจสอบสถานะไฟล์ logs ของ Nginx ไม่แสดงข้อบกพร่องรหัส 502 หลังจากตู้ Docker รันปกติ.</li>
            </ul>
          </div>
        </div>

        <div style={{
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent-glow)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          💡 <strong>เมื่อนักเรียนเสร็จสิ้นแล็บ:</strong> ให้บันทึกรูปหน้าจอการเรียกใช้หน้าเว็บผ่าน Client PC แสดงลิงก์ URL เป็นหมายเลข Static IP ของโฮสต์เซิร์ฟเวอร์ พร้อมส่งอาจารย์ผ่านแพลตฟอร์มการจัดการเรียนการสอน.
        </div>
      </section>
    </div>
  );
}

function PostUbuntuStackGuideDocument() {
  const Code = ({ children }: { children: React.ReactNode }) => (
    <pre style={{
      background: '#0f172a',
      color: '#e2e8f0',
      padding: '14px 16px',
      borderRadius: '8px',
      overflowX: 'auto',
      fontSize: '13px',
      lineHeight: 1.7,
      border: '1px solid rgba(15,23,42,.18)',
      marginTop: '10px'
    }}><code>{children}</code></pre>
  );

  const Section = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
    <section style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '22px',
      marginBottom: '16px'
    }}>
      <h2 style={{
        fontSize: '24px',
        marginBottom: '12px',
        color: 'var(--text-primary)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <span style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: 'var(--accent)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          flexShrink: 0
        }}>{num}</span>
        {title}
      </h2>
      <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </section>
  );

  const CheckItem = ({ children }: { children: React.ReactNode }) => (
    <li style={{ marginBottom: '8px', paddingLeft: '2px' }}>{children}</li>
  );

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '28px',
      background: 'var(--bg-base)'
    }}>
      <article style={{ maxWidth: '980px', margin: '0 auto' }}>
        <header style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #075985 100%)',
          color: '#fff',
          borderRadius: '8px',
          padding: '34px',
          marginBottom: '18px'
        }}>
          <div style={{ fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', opacity: .8, marginBottom: '10px' }}>
            คู่มือปฏิบัติหลังติดตั้ง Ubuntu Server
          </div>
          <h1 style={{ fontSize: '34px', lineHeight: 1.25, marginBottom: '12px' }}>
            Git, Nginx Reverse Proxy, MariaDB และ Node.js
          </h1>
          <p style={{ maxWidth: '760px', lineHeight: 1.8, opacity: .92 }}>
            ใบงานนี้เรียงจากหลังติดตั้ง Ubuntu Server เสร็จแล้ว ไปจนถึงการรัน Web Application ผ่าน Nginx Reverse Proxy โดยใช้ Node.js เชื่อมต่อ MariaDB
          </p>
        </header>

        <Section num="0" title="ภาพรวมระบบที่ต้องได้">
          <p>ปลายทางของคู่มือนี้คือระบบพื้นฐานที่ผู้ใช้เข้าเว็บผ่าน Nginx แล้ว Nginx ส่งต่อไปยัง Node.js ที่อยู่หลังบ้าน จากนั้น Node.js อ่านข้อมูลจาก MariaDB</p>
          <Code>{`Browser
  -> Nginx :80
  -> Reverse Proxy
  -> Node.js :3000
  -> MariaDB :3306`}</Code>
          <ul style={{ marginTop: '12px', paddingLeft: '22px' }}>
            <CheckItem>ผู้ใช้ภายนอกเข้าเว็บผ่านพอร์ต 80</CheckItem>
            <CheckItem>Node.js รันภายในเครื่องที่ `127.0.0.1:3000`</CheckItem>
            <CheckItem>MariaDB ใช้เก็บข้อมูล และไม่ควรเปิดให้ภายนอกเชื่อมต่อโดยตรง</CheckItem>
            <CheckItem>ทุกครั้งที่แก้ Nginx ต้องตรวจด้วย `sudo nginx -t` ก่อน reload</CheckItem>
          </ul>
        </Section>

        <Section num="1" title="ตรวจสอบเครื่องหลังติดตั้ง Ubuntu Server">
          <p>หลัง Login เข้า Ubuntu Server ให้ตรวจ IP, Internet, DNS, Disk และ RAM ก่อนเริ่มติดตั้งบริการ</p>
          <Code>{`ip a
hostname -I
ping -c 4 8.8.8.8
ping -c 4 google.com
df -h
free -h`}</Code>
          <p style={{ marginTop: '10px' }}>ตั้งชื่อเครื่องให้จำง่าย เช่น `webserver01`</p>
          <Code>{`sudo hostnamectl set-hostname webserver01
hostnamectl`}</Code>
        </Section>

        <Section num="2" title="อัปเดตระบบและติดตั้งเครื่องมือพื้นฐาน">
          <Code>{`sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget nano unzip htop net-tools ca-certificates gnupg`}</Code>
          <p style={{ marginTop: '10px' }}>ถ้า `ping 8.8.8.8` ได้แต่ `ping google.com` ไม่ได้ ให้ตรวจ DNS หรือ Netplan ก่อนทำขั้นถัดไป</p>
        </Section>

        <Section num="3" title="ติดตั้งและตั้งค่า Git">
          <Code>{`sudo apt install -y git
git --version

git config --global user.name "Student Name"
git config --global user.email "student@example.com"
git config --global init.defaultBranch main
git config --global --list`}</Code>
          <p style={{ marginTop: '10px' }}>ถ้ามี Repository ให้ Clone ด้วยคำสั่งนี้</p>
          <Code>{`cd ~
git clone https://github.com/example/myapp.git
cd myapp
git status`}</Code>
        </Section>

        <Section num="4" title="ติดตั้ง Nginx Web Server">
          <Code>{`sudo apt update
sudo apt install -y nginx
sudo systemctl status nginx
sudo systemctl enable nginx
curl http://localhost`}</Code>
          <p style={{ marginTop: '10px' }}>ไฟล์หน้าเว็บเริ่มต้นอยู่ที่ `/var/www/html/index.html` สามารถทดสอบแก้หน้าเว็บได้ด้วย `sudo nano /var/www/html/index.html`</p>
          <Code>{`sudo nginx -t
sudo systemctl reload nginx`}</Code>
        </Section>

        <Section num="5" title="ติดตั้งและ Secure MariaDB">
          <Code>{`sudo apt update
sudo apt install -y mariadb-server
sudo systemctl status mariadb
sudo systemctl enable mariadb
mariadb --version

sudo mysql_secure_installation`}</Code>
          <p style={{ marginTop: '10px' }}>แนวทางตอบ `mysql_secure_installation`: ตั้งรหัสผ่าน root, ลบ anonymous user, ปิด remote root login, ลบ test database และ reload privilege tables</p>
        </Section>

        <Section num="6" title="สร้าง Database และ User สำหรับแอป">
          <Code>{`sudo mariadb`}</Code>
          <Code>{`CREATE DATABASE app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'StrongPass123!';
GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
SELECT User, Host FROM mysql.user;
EXIT;`}</Code>
          <p style={{ marginTop: '10px' }}>ทดสอบ Login ด้วย user ของแอป ไม่ใช้ root</p>
          <Code>{`mariadb -u app_user -p app_db`}</Code>
          <Code>{`CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

INSERT INTO students (name, email)
VALUES ('Student One', 'student1@example.com');

SELECT * FROM students;
EXIT;`}</Code>
        </Section>

        <Section num="7" title="ติดตั้ง Node.js และ npm">
          <p>วิธีพื้นฐานจาก Ubuntu Repository</p>
          <Code>{`sudo apt install -y nodejs npm
node -v
npm -v`}</Code>
          <p style={{ marginTop: '10px' }}>ถ้าต้องการ Node.js LTS จาก NodeSource ให้ใช้ชุดนี้</p>
          <Code>{`curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v`}</Code>
        </Section>

        <Section num="8" title="สร้าง Node.js App ที่เชื่อม MariaDB">
          <Code>{`mkdir -p ~/myapp
cd ~/myapp
npm init -y
npm install express mysql2
nano server.js`}</Code>
          <Code>{`const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = 3000;

const dbConfig = {
  host: "localhost",
  user: "app_user",
  password: "StrongPass123!",
  database: "app_db",
};

app.get("/", async (req, res) => {
  res.send(\`
    <h1>Node.js is running behind Nginx</h1>
    <p>Try <a href="/students">/students</a></p>
  \`);
});

app.get("/students", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM students");
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(\`Node.js app listening at http://127.0.0.1:\${port}\`);
});`}</Code>
          <Code>{`node server.js
curl http://127.0.0.1:3000
curl http://127.0.0.1:3000/students`}</Code>
        </Section>

        <Section num="9" title="รัน Node.js ในพื้นหลัง">
          <Code>{`cd ~/myapp
nohup node server.js > app.log 2>&1 &
cat app.log
ps aux | grep node
curl http://127.0.0.1:3000`}</Code>
          <p style={{ marginTop: '10px' }}>ถ้าต้องหยุดโปรแกรม ให้ดู PID จาก `ps aux | grep node` แล้วใช้ `kill PID_NUMBER`</p>
        </Section>

        <Section num="10" title="ตั้งค่า Nginx Reverse Proxy ไปยัง Node.js">
          <Code>{`sudo nano /etc/nginx/sites-available/myapp`}</Code>
          <Code>{`server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}</Code>
          <Code>{`sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

curl http://localhost
curl http://localhost/students`}</Code>
        </Section>

        <Section num="11" title="เปิด Firewall เฉพาะพอร์ตที่จำเป็น">
          <Code>{`sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
sudo ss -tulpn`}</Code>
          <ul style={{ marginTop: '12px', paddingLeft: '22px' }}>
            <CheckItem>เปิด SSH เพื่อ remote เข้าเครื่อง</CheckItem>
            <CheckItem>เปิด Nginx เพื่อให้ผู้ใช้เข้าเว็บผ่าน 80/443</CheckItem>
            <CheckItem>ไม่ต้องเปิดพอร์ต 3000 เพราะ Node.js อยู่หลัง Reverse Proxy</CheckItem>
            <CheckItem>ไม่ต้องเปิดพอร์ต 3306 ถ้า MariaDB ใช้งานเฉพาะเครื่องเดียวกัน</CheckItem>
          </ul>
        </Section>

        <Section num="12" title="Checklist ส่งงาน">
          <ul style={{ paddingLeft: '22px' }}>
            <CheckItem>ผลคำสั่ง `hostname -I`</CheckItem>
            <CheckItem>ผลคำสั่ง `git --version`</CheckItem>
            <CheckItem>ผลคำสั่ง `sudo systemctl status nginx`</CheckItem>
            <CheckItem>หน้าเว็บ `http://SERVER_IP` ที่ผ่าน Reverse Proxy ไปยัง Node.js</CheckItem>
            <CheckItem>ผลคำสั่ง `SELECT * FROM students;` ใน MariaDB</CheckItem>
            <CheckItem>ผลลัพธ์ `http://SERVER_IP/students` ที่แสดง JSON จากฐานข้อมูล</CheckItem>
            <CheckItem>ผลคำสั่ง `sudo ss -tlnp | grep -E ':22|:80|:3000|:3306'`</CheckItem>
          </ul>
        </Section>

        <Section num="13" title="Troubleshooting ที่พบบ่อย">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--accent)' }}>อาการ</th>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--accent)' }}>วิธีตรวจ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['เปิดเว็บไม่ได้', 'sudo systemctl status nginx'],
                  ['Nginx reload ไม่ได้', 'sudo nginx -t'],
                  ['ยังเห็นหน้า default', 'ตรวจ /etc/nginx/sites-enabled/'],
                  ['/students error', 'cat ~/myapp/app.log'],
                  ['MariaDB Access denied', 'mariadb -u app_user -p app_db'],
                  ['Node.js ไม่ตอบ', 'ps aux | grep node'],
                  ['เครื่องอื่นเข้าเว็บไม่ได้', 'sudo ufw status']
                ].map(([a, b]) => (
                  <tr key={a}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>{a}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </article>
    </div>
  );
}

/* ======================================= */
/* --- MAIN APP --- */
/* ======================================= */
/* ===== PROXMOX PRACTICAL EXAM MODAL ===== */
/* ======================================= */
interface ExamSetData {
  id: number;
  title: string;
  role: string;
  badgeColor: string;
  icon: string;
  ctId: string;
  hostname: string;
  password: string;
  template: string;
  disk: string;
  cpu: string;
  ram: string;
  swap: string;
  ip: string;
  gateway: string;
  dns: string;
  headingText: string;
}

const examSetsData: ExamSetData[] = [
  {
    id: 1,
    title: "ชุดที่ 1",
    role: "Web Frontend Service",
    badgeColor: "#10b981",
    icon: "🌐",
    ctId: "101",
    hostname: "frontend-web-01",
    password: "Nos@2026_ct101",
    template: "ubuntu-22.04-standard",
    disk: "10 GiB",
    cpu: "1 Core",
    ram: "512 MB",
    swap: "256 MB",
    ip: "192.168.1.101/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 1] WEB FRONTEND SERVICE"
  },
  {
    id: 2,
    title: "ชุดที่ 2",
    role: "API Backend Gateway",
    badgeColor: "#3b82f6",
    icon: "⚡",
    ctId: "102",
    hostname: "api-gateway-02",
    password: "Nos@2026_ct102",
    template: "ubuntu-22.04-standard",
    disk: "12 GiB",
    cpu: "2 Cores",
    ram: "1024 MB",
    swap: "512 MB",
    ip: "192.168.1.102/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 2] API BACKEND GATEWAY"
  },
  {
    id: 3,
    title: "ชุดที่ 3",
    role: "Authentication Portal",
    badgeColor: "#8b5cf6",
    icon: "🔐",
    ctId: "103",
    hostname: "auth-portal-03",
    password: "Nos@2026_ct103",
    template: "ubuntu-22.04-standard",
    disk: "15 GiB",
    cpu: "1 Core",
    ram: "1024 MB",
    swap: "512 MB",
    ip: "192.168.1.103/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 3] AUTHENTICATION PORTAL SERVICE"
  },
  {
    id: 4,
    title: "ชุดที่ 4",
    role: "E-Commerce Online Store",
    badgeColor: "#f59e0b",
    icon: "🛍️",
    ctId: "104",
    hostname: "shop-online-04",
    password: "Nos@2026_ct104",
    template: "ubuntu-22.04-standard",
    disk: "10 GiB",
    cpu: "2 Cores",
    ram: "1024 MB",
    swap: "512 MB",
    ip: "192.168.1.104/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 4] E-COMMERCE ONLINE STORE"
  },
  {
    id: 5,
    title: "ชุดที่ 5",
    role: "Student Information System",
    badgeColor: "#06b6d4",
    icon: "🎓",
    ctId: "105",
    hostname: "student-sis-05",
    password: "Nos@2026_ct105",
    template: "ubuntu-22.04-standard",
    disk: "15 GiB",
    cpu: "1 Core",
    ram: "1536 MB",
    swap: "512 MB",
    ip: "192.168.1.105/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 5] STUDENT INFORMATION SYSTEM (SIS)"
  },
  {
    id: 6,
    title: "ชุดที่ 6",
    role: "Corporate News & Blog",
    badgeColor: "#ec4899",
    icon: "📰",
    ctId: "106",
    hostname: "corp-news-06",
    password: "Nos@2026_ct106",
    template: "ubuntu-22.04-standard",
    disk: "8 GiB",
    cpu: "1 Core",
    ram: "512 MB",
    swap: "256 MB",
    ip: "192.168.1.106/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 6] CORPORATE NEWS & BLOG PORTAL"
  },
  {
    id: 7,
    title: "ชุดที่ 7",
    role: "Payment Gateway Web",
    badgeColor: "#14b8a6",
    icon: "💳",
    ctId: "107",
    hostname: "pay-gateway-07",
    password: "Nos@2026_ct107",
    template: "ubuntu-22.04-standard",
    disk: "12 GiB",
    cpu: "2 Cores",
    ram: "1024 MB",
    swap: "512 MB",
    ip: "192.168.1.107/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 7] PAYMENT GATEWAY SERVICE"
  },
  {
    id: 8,
    title: "ชุดที่ 8",
    role: "Customer Support Helpdesk",
    badgeColor: "#eab308",
    icon: "🎧",
    ctId: "108",
    hostname: "helpdesk-web-08",
    password: "Nos@2026_ct108",
    template: "ubuntu-22.04-standard",
    disk: "10 GiB",
    cpu: "1 Core",
    ram: "1024 MB",
    swap: "512 MB",
    ip: "192.168.1.108/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 8] CUSTOMER SUPPORT HELPDESK"
  },
  {
    id: 9,
    title: "ชุดที่ 9",
    role: "Realtime Monitoring Dashboard",
    badgeColor: "#6366f1",
    icon: "📊",
    ctId: "109",
    hostname: "monitor-dash-09",
    password: "Nos@2026_ct109",
    template: "ubuntu-22.04-standard",
    disk: "15 GiB",
    cpu: "2 Cores",
    ram: "2048 MB",
    swap: "512 MB",
    ip: "192.168.1.109/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 9] REALTIME MONITORING DASHBOARD"
  },
  {
    id: 10,
    title: "ชุดที่ 10",
    role: "File Repository & Assets Web",
    badgeColor: "#84cc16",
    icon: "📁",
    ctId: "110",
    hostname: "repo-assets-10",
    password: "Nos@2026_ct110",
    template: "ubuntu-22.04-standard",
    disk: "20 GiB",
    cpu: "1 Core",
    ram: "1024 MB",
    swap: "512 MB",
    ip: "192.168.1.110/24",
    gateway: "192.168.1.1",
    dns: "8.8.8.8",
    headingText: "[ชุดที่ 10] FILE REPOSITORY & ASSETS WEB"
  }
];

function ExamNotificationBanner() {
  const [showPanel, setShowPanel] = useState(false);
  const [activeSetId, setActiveSetId] = useState<number | "host">(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => setShowPanel(true);
    window.addEventListener('open-exam-modal', handleOpen);
    return () => window.removeEventListener('open-exam-modal', handleOpen);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const currentSet = examSetsData.find(s => s.id === activeSetId) || examSetsData[0];

  return (
    <>
      {/* Top Banner Bar */}
      <div className="exam-notification-wrapper">
        <div
          className="exam-notification-bar"
          onClick={() => setShowPanel(!showPanel)}
          style={{
            background: "linear-gradient(135deg, #b91c1c 0%, #c2410c 50%, #b45309 100%)",
            boxShadow: "0 4px 20px rgba(194, 65, 12, 0.4)"
          }}
        >
          <span className="exam-badge" style={{ background: "#fff", color: "#b91c1c" }}>📋 สอบปฏิบัติ</span>
          <span className="exam-notification-text">
            🔔 โจทย์สอบปฏิบัติการ: การติดตั้ง Proxmox VE และการตั้งค่า LXC Container (10 ชุดข้อสอบ) — คลิกเพื่อเปิดดูโจทย์
          </span>
          <span className="exam-notification-arrow">{showPanel ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Modal Popup */}
      {showPanel && (
        <>
          <div className="exam-panel-overlay" onClick={() => setShowPanel(false)} />
          <div className="exam-panel" style={{
            maxWidth: "1000px", borderRadius: "18px",
            background: "#0a0f1d", color: "#f8fafc",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.8)"
          }}>
            {/* Modal Header */}
            <div className="exam-panel-header" style={{
              background: "linear-gradient(135deg, #111827 0%, #1e293b 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ background: "#dc2626", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "99px", letterSpacing: "0.5px" }}>
                    PRACTICAL EXAM
                  </span>
                  <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 700 }}>
                    ⏱️ เวลาสอบ 2 ชั่วโมง (120 นาที) • คะแนนเต็ม 20 คะแนน
                  </span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", margin: "4px 0 2px" }}>
                  📝 โจทย์สอบปฏิบัติการ: การติดตั้ง Proxmox VE และการสร้าง LXC Container
                </h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  วิชา: ระบบปฏิบัติการเครื่องแม่ข่าย (NOS) • เลือกชุดข้อสอบของตนเองด้านล่าง (ชุดที่ 1 ถึง 10)
                </p>
              </div>
              <button
                className="exam-panel-close"
                onClick={() => setShowPanel(false)}
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: "50%", width: "32px", height: "32px", border: "none", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>

            {/* Set Selection Tabs */}
            <div style={{
              background: "#0f172a", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex", gap: "6px", overflowX: "auto", flexWrap: "wrap"
            }}>
              <button
                onClick={() => setActiveSetId("host")}
                style={{
                  background: activeSetId === "host" ? "#f97316" : "rgba(255,255,255,0.05)",
                  color: activeSetId === "host" ? "#000" : "#cbd5e1",
                  border: activeSetId === "host" ? "2px solid #fdba74" : "1px solid rgba(255,255,255,0.1)",
                  padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                }}
              >
                <span>🖥️</span> ติดตั้ง Proxmox แม่ข่าย
              </button>

              <div style={{ width: "1px", height: "26px", background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

              {examSetsData.map(set => {
                const isActive = activeSetId === set.id;
                return (
                  <button
                    key={set.id}
                    onClick={() => setActiveSetId(set.id)}
                    style={{
                      background: isActive ? `${set.badgeColor}25` : "rgba(255,255,255,0.03)",
                      color: isActive ? "#fff" : "#94a3b8",
                      border: isActive ? `2px solid ${set.badgeColor}` : "1px solid rgba(255,255,255,0.08)",
                      padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: isActive ? 800 : 500,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s"
                    }}
                  >
                    <span>{set.icon}</span>
                    <span>{set.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="exam-panel-body" style={{ padding: "20px 24px", background: "#0a0f1d" }}>
              {activeSetId === "host" ? (
                /* Proxmox Host Setup Guide */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ background: "rgba(249, 115, 22, 0.12)", border: "1px solid rgba(249, 115, 22, 0.3)", borderRadius: "12px", padding: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#fb923c", margin: "0 0 6px" }}>
                      📌 ขั้นตอนมาตรฐาน: การติดตั้ง Proxmox VE บนเครื่องเซิร์ฟเวอร์ (Host Machine)
                    </h3>
                    <p style={{ fontSize: "12px", color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>
                      ขั้นตอนนี้เป็นการติดตั้งระบบปฏิบัติการ Hypervisor ลงบนเครื่องเซิร์ฟเวอร์กลุ่ม นักศึกษาทุกคนใช้ค่า Configuration มาตรฐานเดียวกัน
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", marginBottom: "8px" }}>
                        1. การเตรียมระบบ & เลือกไดรฟ์
                      </div>
                      <ul style={{ fontSize: "11.5px", color: "#cbd5e1", paddingLeft: "16px", margin: 0, lineHeight: 1.8 }}>
                        <li>เปิด BIOS ตรวจสอบว่าเปิด <code>Intel VT-x / AMD-V</code> เป็น Enabled</li>
                        <li>บูตตัวติดตั้ง เลือก <code>Install Proxmox VE (Graphical)</code></li>
                        <li>อ่านและกดยอมรับข้อตกลงสิทธิ์การใช้งาน (EULA)</li>
                        <li>เลือก Target Harddisk สำหรับติดตั้งระบบ (ข้อมูลเดิมจะถูกล้าง)</li>
                      </ul>
                    </div>

                    <div style={{ background: "rgba(30, 41, 59, 0.6)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", marginBottom: "8px" }}>
                        2. Timezone & รหัสผ่าน Root
                      </div>
                      <ul style={{ fontSize: "11.5px", color: "#cbd5e1", paddingLeft: "16px", margin: 0, lineHeight: 1.8 }}>
                        <li>Country: <code>Thailand</code> | Timezone: <code>Asia/Bangkok</code></li>
                        <li>Keyboard Layout: <code>U.S. English</code></li>
                        <li>Password: ตั้งรหัสผ่าน root สำหรับ Proxmox (เช่น <code>Proxmox@2026</code>)</li>
                        <li>Email: ระบุอีเมลแจ้งเตือนของกลุ่ม</li>
                      </ul>
                    </div>

                    <div style={{ background: "rgba(30, 41, 59, 0.6)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)", gridColumn: "span 2" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>
                        3. การตั้งค่า Management Network & การเข้าใช้งาน Web GUI
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontFamily: "monospace", fontSize: "11.5px" }}>
                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "6px" }}>
                          <span style={{ color: "#94a3b8" }}>Hostname:</span><br /><strong style={{ color: "#60a5fa" }}>pve-server.lab.local</strong>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "6px" }}>
                          <span style={{ color: "#94a3b8" }}>Management IP:</span><br /><strong style={{ color: "#4ade80" }}>192.168.1.50/24</strong>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "6px" }}>
                          <span style={{ color: "#94a3b8" }}>Gateway:</span><br /><strong style={{ color: "#fcd34d" }}>192.168.1.1</strong>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "6px" }}>
                          <span style={{ color: "#94a3b8" }}>DNS Server:</span><br /><strong style={{ color: "#fcd34d" }}>8.8.8.8</strong>
                        </div>
                      </div>
                      <div style={{ marginTop: "10px", fontSize: "11.5px", color: "#a7f3d0", background: "rgba(16, 185, 129, 0.15)", padding: "8px 12px", borderRadius: "6px" }}>
                        🌐 เมื่อรีบูตเสร็จสิ้น เปิดเบราว์เซอร์เข้า: <strong>https://192.168.1.50:8006</strong> ล็อกอินด้วย User: <code>root</code>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Individual Container Exam Set */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Set Banner */}
                  <div style={{
                    background: `linear-gradient(135deg, ${currentSet.badgeColor}20 0%, rgba(15, 23, 42, 0.8) 100%)`,
                    border: `1px solid ${currentSet.badgeColor}50`, borderRadius: "14px", padding: "16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "24px" }}>{currentSet.icon}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#fff" }}>
                            ข้อสอบปฏิบัติการ {currentSet.title} : ระบบ {currentSet.role}
                          </h3>
                          <span style={{ fontSize: "12px", color: currentSet.badgeColor, fontWeight: 700 }}>
                            CT ID: {currentSet.ctId} • Hostname: {currentSet.hostname} • IP: {currentSet.ip}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`ssh root@${currentSet.ip.split('/')[0]}`, 'ssh')}
                      style={{
                        background: copiedText === 'ssh' ? '#22c55e' : 'rgba(255,255,255,0.1)',
                        color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                        padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {copiedText === 'ssh' ? '✓ คัดลอกคำสั่ง SSH แล้ว' : `📋 Copy SSH Command`}
                    </button>
                  </div>

                  {/* Configuration Table Grid */}
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>
                      ⚙️ ตารางพารามิเตอร์ที่ต้องตั้งค่าใน Proxmox (ชุดที่ {currentSet.id}):
                    </div>
                    <div style={{
                      background: "rgba(15, 23, 42, 0.8)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)",
                      overflow: "hidden"
                    }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "sans-serif" }}>
                        <thead>
                          <tr style={{ background: "rgba(30, 41, 59, 0.8)", color: "#94a3b8", textAlign: "left" }}>
                            <th style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", width: "20%" }}>เมนู / แท็บ</th>
                            <th style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", width: "35%" }}>รายการพารามิเตอร์</th>
                            <th style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>ค่าที่ต้องกำหนดเป๊ะๆ (Values)</th>
                          </tr>
                        </thead>
                        <tbody style={{ color: "#e2e8f0" }}>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "8px 14px", fontWeight: 700, color: "#38bdf8" }} rowSpan={3}>General</td>
                            <td style={{ padding: "8px 14px" }}>CT ID</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#4ade80", fontWeight: 700 }}>{currentSet.ctId}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "8px 14px" }}>Hostname</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#60a5fa", fontWeight: 700 }}>{currentSet.hostname}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "8px 14px" }}>Root Password</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#fcd34d" }}>{currentSet.password}</td>
                          </tr>

                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "8px 14px", fontWeight: 700, color: "#38bdf8" }}>Template</td>
                            <td style={{ padding: "8px 14px" }}>OS Template</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#cbd5e1" }}>{currentSet.template}</td>
                          </tr>

                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "8px 14px", fontWeight: 700, color: "#38bdf8" }}>Disks</td>
                            <td style={{ padding: "8px 14px" }}>Disk Size</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#a78bfa", fontWeight: 700 }}>{currentSet.disk}</td>
                          </tr>

                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "8px 14px", fontWeight: 700, color: "#38bdf8" }}>CPU</td>
                            <td style={{ padding: "8px 14px" }}>Cores</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#a78bfa", fontWeight: 700 }}>{currentSet.cpu}</td>
                          </tr>

                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "8px 14px", fontWeight: 700, color: "#38bdf8" }}>Memory</td>
                            <td style={{ padding: "8px 14px" }}>Memory (RAM) / Swap</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#a78bfa", fontWeight: 700 }}>{currentSet.ram} (Swap: {currentSet.swap})</td>
                          </tr>

                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "8px 14px", fontWeight: 700, color: "#38bdf8" }} rowSpan={3}>Network</td>
                            <td style={{ padding: "8px 14px" }}>Bridge</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#cbd5e1" }}>vmbr0</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "8px 14px" }}>IPv4 (Static)</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#4ade80", fontWeight: 700 }}>{currentSet.ip}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "8px 14px" }}>Gateway (IPv4) / DNS</td>
                            <td style={{ padding: "8px 14px", fontFamily: "monospace", color: "#cbd5e1" }}>{currentSet.gateway} (DNS: {currentSet.dns})</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tasks & Instructions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#38bdf8", marginBottom: "10px" }}>
                        🛠️ ขั้นตอนการปฏิบัติงาน (4 ขั้นตอน):
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#cbd5e1" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ color: "#38bdf8", fontWeight: 800 }}>1.</span>
                          <span>คลิกปุ่ม <strong>Create CT</strong> ที่มุมบนขวาของหน้าเว็บ Proxmox</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ color: "#38bdf8", fontWeight: 800 }}>2.</span>
                          <span>กรอกข้อมูลและจัดสรรทรัพยากร (General, Template, Disks, CPU, Memory, Network, DNS) ให้ตรงตามตารางเป๊ะๆ</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ color: "#38bdf8", fontWeight: 800 }}>3.</span>
                          <span>กด <strong>Finish</strong> เพื่อสร้างตู้ จากนั้นคลิกเลือกตู้ <code>{currentSet.ctId}</code> แล้วกดปุ่ม <strong>Start</strong></span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ color: "#38bdf8", fontWeight: 800 }}>4.</span>
                          <span>ตรวจสอบว่าไอคอนตู้ขึ้นสถานะ <strong>สีเขียว (Running)</strong> และเปิด <strong>Console</strong> หรือ SSH ล็อกอินตรวจสอบ IP <code>{currentSet.ip.split('/')[0]}</code></span>
                        </div>
                      </div>
                    </div>

                    {/* Proxmox CT Status Summary Preview */}
                    <div style={{
                      background: "#080c14", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex", flexDirection: "column", overflow: "hidden"
                    }}>
                      <div style={{
                        background: "#1e293b", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: "1px solid rgba(255,255,255,0.06)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#f8fafc" }}>CT {currentSet.ctId} ({currentSet.hostname})</span>
                        </div>
                        <span style={{ background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                          ● RUNNING
                        </span>
                      </div>

                      <div style={{ padding: "14px", color: "#f8fafc", fontFamily: "sans-serif", flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                          <span style={{ color: "#94a3b8" }}>Node / Server:</span>
                          <strong style={{ color: "#38bdf8" }}>pve-server</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                          <span style={{ color: "#94a3b8" }}>IPv4 Address:</span>
                          <strong style={{ color: "#4ade80", fontFamily: "monospace" }}>{currentSet.ip}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                          <span style={{ color: "#94a3b8" }}>CPU Cores:</span>
                          <strong style={{ color: "#fcd34d" }}>{currentSet.cpu}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                          <span style={{ color: "#94a3b8" }}>Memory / Swap:</span>
                          <strong style={{ color: "#c084fc" }}>{currentSet.ram} / {currentSet.swap}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#94a3b8" }}>Disk Size:</span>
                          <strong style={{ color: "#c084fc" }}>{currentSet.disk}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rubric Score */}
                  <div style={{
                    background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)",
                    borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontSize: "11.5px", color: "#dcfce7"
                  }}>
                    <span>📊 <strong>เกณฑ์คะแนน (20 คะแนน):</strong> General & Template (5) + Specs Resources (5) + Network Static IP (5) + สถานะ Start Running (5)</span>
                    <span style={{ fontWeight: 800, color: "#4ade80" }}>พร้อมตรวจหน้าเครื่อง</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}


export default function Home() {
  const [weekGroups, setWeekGroups] = useState<WeekGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "Week 1": true });
  const [activeWeek, setActiveWeek] = useState<string>("1a");
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesVisible, setNotesVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/data/weeks.json?v=${Date.now()}`).then(r => r.json()).then((d: WeekGroup[]) => {
      setWeekGroups(d);
      setLoading(false);
      const exp: Record<string, boolean> = {};
      d.forEach(g => exp[g.weekLabel] = true);
      setExpandedGroups(exp);
    });
  }, []);

  // Load week data
  const documentModes = ["proxmox-guide", "post-ubuntu-stack-guide"];

  useEffect(() => {
    if (documentModes.includes(activeWeek)) {
      setWeekData(null);
      setSlideIdx(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const num = activeWeek;
    fetch(`/data/week-${num}.json?v=${Date.now()}`).then(r => r.json()).then((d: WeekData) => {
      setWeekData(d); setSlideIdx(0); setLoading(false);
    });
  }, [activeWeek]);

  // Keyboard navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!weekData) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setSlideIdx(i => Math.min(i + 1, weekData.slides.length - 1));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setSlideIdx(i => Math.max(i - 1, 0));
    }
    if (e.key === "Escape" && fullscreen) setFullscreen(false);
    if (e.key === "f" || e.key === "F") setFullscreen(f => !f);
  }, [weekData, fullscreen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const totalSlides = weekData?.slides.length ?? 0;
  const currentSlide = weekData?.slides[slideIdx] ?? null;
  const progressPct = totalSlides > 0 ? ((slideIdx + 1) / totalSlides * 100) : 0;


  /* --- Fullscreen View --- */
  if (fullscreen && currentSlide) {
    return (
      <div className="fullscreen-overlay">
        <div className="fullscreen-topbar">
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            สัปดาห์ {activeWeek} — {currentSlide.title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="slide-counter">{slideIdx + 1} / {totalSlides}</span>
            <button className="nav-btn" onClick={() => setSlideIdx(i => Math.max(i - 1, 0))} disabled={slideIdx === 0}><ChevLeft /></button>
            <button className="nav-btn" onClick={() => setSlideIdx(i => Math.min(i + 1, totalSlides - 1))} disabled={slideIdx === totalSlides - 1}><ChevRight /></button>
            <button className="nav-btn fullscreen-btn" onClick={() => setFullscreen(false)}><MinIcon /></button>
          </div>
        </div>
        <div className="slide-stage">
          <div className="slide-container" key={`${activeWeek}-${slideIdx}`}>
            <SlideRenderer slide={currentSlide} />
          </div>
        </div>
      </div>
    );
  }

  /* --- Normal View --- */
  return (
    <>
      <ExamNotificationBanner />
      <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div>
              <div className="logo-title">NOS</div>
              <div className="logo-sub">ระบบปฏิบัติการเครื่องแม่ข่าย</div>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen(false)}><MenuIcon /></button>
        </div>

        <div className="week-list">
          {weekGroups.map(group => (
            <div key={group.weekLabel} className="week-group" style={{ marginBottom: '8px' }}>
              <div
                className="week-group-header"
                onClick={() => setExpandedGroups(prev => ({ ...prev, [group.weekLabel]: !prev[group.weekLabel] }))}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}
              >
                <span>{group.weekLabel}</span>
                <span style={{ fontSize: '10px' }}>{expandedGroups[group.weekLabel] ? '▼' : '▶'}</span>
              </div>
              {expandedGroups[group.weekLabel] && <div style={{ paddingTop: '4px' }}>
                {group.sessions && group.sessions.map(s => (
                  <button
                    key={s.id}
                    className={`week-item ${s.id === activeWeek ? "active" : ""}`}
                    onClick={() => !s.disabled && setActiveWeek(s.id)}
                    disabled={s.disabled}
                    style={{
                      paddingLeft: '24px',
                      opacity: s.disabled ? 0.3 : 1,
                      cursor: s.disabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="week-num" style={{ fontSize: '13px', width: '36px', height: '36px' }}>{s.displayNum}</span>
                    <span className="week-label">
                      {s.title}
                      <span className="week-topic">{s.topic}</span>
                    </span>
                  </button>
                ))}
              </div>}
            </div>
          ))}
        </div>

        {/* Pinned Docker & Proxmox Guide Buttons */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className={`pinned-stack-btn ${activeWeek === "post-ubuntu-stack-guide" ? "active" : ""}`}
            onClick={() => setActiveWeek("post-ubuntu-stack-guide")}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: activeWeek === "post-ubuntu-stack-guide" ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeWeek === "post-ubuntu-stack-guide" ? 'var(--accent-dim)' : 'var(--bg-elevated)',
              color: activeWeek === "post-ubuntu-stack-guide" ? 'var(--accent)' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🧭</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '12px', lineHeight: '1.2' }}>คู่มือ Ubuntu Server Stack</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Git, Nginx, MariaDB, Node.js</div>
            </div>
          </button>


          <button
            className={`pinned-proxmox-btn ${activeWeek === "proxmox-guide" ? "active" : ""}`}
            onClick={() => setActiveWeek("proxmox-guide")}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: activeWeek === "proxmox-guide" ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeWeek === "proxmox-guide" ? 'var(--accent-dim)' : 'var(--bg-elevated)',
              color: activeWeek === "proxmox-guide" ? 'var(--accent)' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🖥️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '12px', lineHeight: '1.2' }}>คู่มือติดตั้ง Proxmox VE</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>วิธีการลง Hypervisor แบบละเอียด</div>
            </div>
          </button>

          <button
            className="pinned-exam-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-exam-modal'))}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))',
              color: '#f87171',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>📋</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '12px', lineHeight: '1.2', color: '#fca5a5' }}>โจทย์สอบปฏิบัติ Proxmox & CT</div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>ชุดข้อสอบ 10 ชุดรายบุคคล</div>
            </div>
          </button>
        </div>

        <div className="sidebar-footer" style={{ flexShrink: 0 }}>
          {documentModes.includes(activeWeek) ? (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', padding: '4px 0' }}>
              📖 กำลังอ่าน: โหมดเอกสารคู่มือฉบับเต็ม
            </div>
          ) : (
            <>
              <div className="progress-info">
                <span>สไลด์</span>
                <span>{slideIdx + 1} / {totalSlides}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main-area">
        {activeWeek === "post-ubuntu-stack-guide" ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <header className="topbar" style={{ flexShrink: 0 }}>
              <div className="topbar-left">
                {!sidebarOpen && (
                  <button className="icon-btn mobile-toggle" style={{ display: "flex" }} onClick={() => setSidebarOpen(true)}>
                    <MenuIcon />
                  </button>
                )}
                <span className="topbar-chapter" style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                  📖 คู่มือหลังติดตั้ง Ubuntu Server: Git, Nginx Reverse Proxy, MariaDB และ Node.js
                </span>
              </div>
            </header>
            <PostUbuntuStackGuideDocument />
          </div>
        ) : activeWeek === "proxmox-guide" ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <header className="topbar" style={{ flexShrink: 0 }}>
              <div className="topbar-left">
                {!sidebarOpen && (
                  <button className="icon-btn mobile-toggle" style={{ display: "flex" }} onClick={() => setSidebarOpen(true)}>
                    <MenuIcon />
                  </button>
                )}
                <span className="topbar-chapter" style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                  📖 คู่มือติดตั้งและทดสอบ Proxmox VE (Type-1 Hypervisor)
                </span>
              </div>
            </header>
            <ProxmoxGuideDocument />
          </div>
        ) : (
          <>
            <header className="topbar">
              <div className="topbar-left">
                {!sidebarOpen && (
                  <button className="icon-btn mobile-toggle" style={{ display: "flex" }} onClick={() => setSidebarOpen(true)}>
                    <MenuIcon />
                  </button>
                )}
                <span className="topbar-chapter">
                  สัปดาห์ {activeWeek} — {weekData?.title || ""}
                </span>
              </div>
              <div className="topbar-right">
                <span className="slide-counter">{slideIdx + 1} / {totalSlides}</span>
                <button className="nav-btn" onClick={() => setSlideIdx(i => Math.max(i - 1, 0))} disabled={slideIdx === 0}><ChevLeft /></button>
                <button className="nav-btn" onClick={() => setSlideIdx(i => Math.min(i + 1, totalSlides - 1))} disabled={slideIdx === totalSlides - 1}><ChevRight /></button>
                <button className="nav-btn fullscreen-btn" onClick={() => setFullscreen(true)} title="เต็มจอ (F)"><MaxIcon /></button>
                {weekData && (
                  <button className="nav-btn download-btn" onClick={() => downloadSlideJSON(weekData)} title="ดาวน์โหลด JSON"><DownloadIcon /></button>
                )}
              </div>
            </header>

            <div className="slide-stage">
              {loading ? (
                <div style={{ color: "var(--text-muted)", fontSize: 14 }}>กำลังโหลด...</div>
              ) : currentSlide ? (
                <div className="slide-container" key={`${activeWeek}-${slideIdx}`}>
                  <SlideRenderer slide={currentSlide} />
                </div>
              ) : null}
            </div>

            {/* Notes */}
            {currentSlide?.speakerNotes && (
              <div className="notes-panel">
                <div className="notes-header" onClick={() => setNotesVisible(v => !v)}>
                  <NoteIcon />
                  <span>บันทึกครูผู้สอน</span>
                  <button className="notes-toggle">{notesVisible ? "ซ่อน" : "แสดง"}</button>
                </div>
                <div className={`notes-body ${notesVisible ? "" : "hidden"}`}>
                  {currentSlide.speakerNotes}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TCP vs UDP Animation  (week-7a slide type: tcp-udp-anim)
───────────────────────────────────────────────────────────────────────── */
function TCPUDPAnimation({ s }: { s: SlideData }) {
  const [tab, setTab] = useState<"theory" | "anim">("theory");
  const [tcpStep, setTcpStep] = useState(-1);
  const [tcpRunning, setTcpRunning] = useState(false);
  const [tcpDone, setTcpDone] = useState(false);
  const [udpStep, setUdpStep] = useState(-1);
  const [udpRunning, setUdpRunning] = useState(false);
  const [udpDone, setUdpDone] = useState(false);

  const tcpSteps = [
    { label: "SYN", fullname: "Synchronize", color: "#3b82f6", desc: "1️⃣ Client ส่ง SYN ขอเปิดการเชื่อมต่อ" },
    { label: "SYN-ACK", fullname: "Synchronize-Acknowledge", color: "#8b5cf6", desc: "2️⃣ Server ตอบรับด้วย SYN-ACK ยืนยันพร้อม" },
    { label: "ACK", fullname: "Acknowledge", color: "#3b82f6", desc: "3️⃣ Client ส่ง ACK — Handshake สำเร็จ!" },
    { label: "DATA 1", fullname: "Data Segment #1", color: "#10b981", desc: "4️⃣ ส่งข้อมูลชุดที่ 1" },
    { label: "ACK ✓", fullname: "Acknowledge #1", color: "#8b5cf6", desc: "5️⃣ Server ยืนยันรับชุดที่ 1" },
    { label: "DATA 2", fullname: "Data Segment #2", color: "#10b981", desc: "6️⃣ ส่งข้อมูลชุดที่ 2" },
    { label: "ACK ✓", fullname: "Acknowledge #2", color: "#8b5cf6", desc: "7️⃣ Server ยืนยันรับชุดที่ 2 ✅ ครบถ้วน!" },
  ];

  const udpSteps = [
    { label: "DATA 1", fullname: "Datagram #1", color: "#f59e0b", desc: "1️⃣ ส่งชุดที่ 1 ออกไปเลย ไม่รอ", lost: false },
    { label: "DATA 2", fullname: "Datagram #2", color: "#f59e0b", desc: "2️⃣ ส่งชุดที่ 2 ต่อเนื่อง ไม่รอยืนยัน", lost: false },
    { label: "DATA 3", fullname: "Datagram #3", color: "#ef4444", desc: "3️⃣ ชุดที่ 3 หายกลางทาง! ❌ ไม่มีการแจ้งเตือน", lost: true },
    { label: "DATA 4", fullname: "Datagram #4", color: "#f59e0b", desc: "4️⃣ ส่งชุดที่ 4 ต่อ — ปลายทางไม่รู้ว่าหาย!", lost: false },
  ];

  const runTCP = () => {
    setTcpStep(-1); setTcpDone(false); setTcpRunning(true);
    tcpSteps.forEach((_, i) => {
      setTimeout(() => {
        setTcpStep(i);
        if (i === tcpSteps.length - 1) { setTcpRunning(false); setTcpDone(true); }
      }, i * 900);
    });
  };

  const runUDP = () => {
    setUdpStep(-1); setUdpDone(false); setUdpRunning(true);
    udpSteps.forEach((_, i) => {
      setTimeout(() => {
        setUdpStep(i);
        if (i === udpSteps.length - 1) { setUdpRunning(false); setUdpDone(true); }
      }, i * 700);
    });
  };

  const pktRow = (st: { label: string; fullname?: string; color: string; desc: string; lost?: boolean }, active: boolean) => (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
      borderRadius: "10px", transition: "all 0.4s",
      background: active ? `${st.color}18` : "rgba(255,255,255,0.03)",
      border: `1px solid ${active ? st.color + "55" : "rgba(255,255,255,0.06)"}`,
      opacity: active ? 1 : 0.3,
    }}>
      {/* Badge: abbreviation + full name below */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
        <span style={{
          fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "6px",
          background: active ? st.color : "rgba(255,255,255,0.1)", color: "#fff",
          textDecoration: st.lost ? "line-through" : "none",
          whiteSpace: "nowrap",
        }}>{st.label}</span>
        {st.fullname && (
          <span style={{
            fontSize: "8px", color: active ? `${st.color}cc` : "rgba(255,255,255,0.2)",
            fontStyle: "italic", whiteSpace: "nowrap", letterSpacing: "0.2px",
          }}>{st.fullname}</span>
        )}
      </div>
      <span style={{ fontSize: "10px", color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
        {st.desc}
      </span>
      {st.lost && active && <span style={{ marginLeft: "auto", fontSize: "14px" }}>💥</span>}
    </div>
  );

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "3% 4%",
      background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai',sans-serif", boxSizing: "border-box", gap: "16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            อนิเมชันเปรียบเทียบโปรโตคอล
          </span>
          <h2 style={{ margin: "4px 0 0", fontSize: "clamp(16px,2.2vw,24px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["theory", "anim"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: "12px", transition: "all 0.2s",
              background: tab === t ? "#6366f1" : "rgba(255,255,255,0.08)",
              color: tab === t ? "#fff" : "rgba(255,255,255,0.5)",
            }}>
              {t === "theory" ? "📚 ทฤษฎี" : "▶ อนิเมชัน"}
            </button>
          ))}
        </div>
      </div>

      {/* THEORY TAB */}
      {tab === "theory" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", flex: 1 }}>
          {[
            {
              proto: "TCP", fullname: "Transmission Control Protocol", icon: "🔗", color: "#3b82f6",
              tagColor: "#93c5fd",
              facts: [
                ["🤝 3-Way Handshake", "ต้องจับมือ SYN→SYN-ACK→ACK ก่อนส่งข้อมูลทุกครั้ง"],
                ["✅ รับประกันครบถ้วน", "ถ้าข้อมูลหาย ระบบส่งใหม่อัตโนมัติ"],
                ["📦 จัดลำดับข้อมูล", "ข้อมูลถึงปลายทางเรียงลำดับถูกต้องเสมอ"],
                ["🐢 ช้ากว่า UDP", "ต้องรอยืนยัน ACK ก่อนส่งต่อ"],
              ],
              usedBy: "SSH (22), HTTP (80), HTTPS (443), MariaDB (3306), Samba (445)",
              usedColor: "#6ee7b7",
              usedBg: "rgba(16,185,129,0.1)", usedBorder: "rgba(16,185,129,0.2)",
            },
            {
              proto: "UDP", fullname: "User Datagram Protocol", icon: "⚡", color: "#f59e0b",
              tagColor: "#fcd34d",
              facts: [
                ["🚀 ไม่มี Handshake", "ส่งข้อมูลออกไปเลยทันที ไม่ต้องรอจับมือ"],
                ["❌ ไม่รับประกัน", "ถ้าข้อมูลหาย ไม่แจ้งเตือน ไม่ส่งซ้ำ"],
                ["⚡ เร็วกว่า TCP", "ไม่มีขั้นตอน Handshake หรือรอ ACK"],
                ["📻 เหมือนสัญญาณวิทยุ", "ส่งออกอากาศเลย ได้ยินก็ดี ถ้าหลุดก็ช่าง"],
              ],
              usedBy: "DNS (53), DHCP (67/68), MQTT (1883), วีดีโอคอล, เกมออนไลน์",
              usedColor: "#fcd34d",
              usedBg: "rgba(245,158,11,0.1)", usedBorder: "rgba(245,158,11,0.2)",
            },
          ].map(item => (
            <div key={item.proto} style={{
              background: `${item.color}08`, border: `1px solid ${item.color}35`,
              borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
            }}>
              <div style={{ fontWeight: 800, fontSize: "15px", color: item.color }}>
                {item.icon} {item.proto} — {item.fullname}
              </div>
              {item.facts.map(([k, v]) => (
                <div key={k} style={{ background: `${item.color}10`, borderRadius: "8px", padding: "8px 10px", border: `1px solid ${item.color}20` }}>
                  <div style={{ fontWeight: 700, fontSize: "11px", color: item.tagColor, marginBottom: "2px" }}>{k}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>{v}</div>
                </div>
              ))}
              <div style={{ marginTop: "auto", background: item.usedBg, borderRadius: "8px", padding: "8px 10px", border: `1px solid ${item.usedBorder}`, fontSize: "10px", color: item.usedColor }}>
                📌 <strong>ใช้กับ:</strong> {item.usedBy}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANIMATION TAB */}
      {tab === "anim" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flex: 1 }}>
            {/* TCP Panel */}
            <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: "#3b82f6" }}>🔗 TCP</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>3-Way Handshake ก่อนส่งข้อมูล</div>
                </div>
                <button onClick={runTCP} disabled={tcpRunning} style={{
                  padding: "7px 14px", borderRadius: "8px", border: "none", cursor: tcpRunning ? "wait" : "pointer",
                  background: tcpRunning ? "rgba(59,130,246,0.3)" : "#3b82f6", color: "#fff",
                  fontWeight: 700, fontSize: "12px", transition: "all 0.2s",
                }}>{tcpRunning ? "กำลังส่ง..." : "▶ Play TCP"}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {tcpSteps.map((st, i) => <div key={i}>{pktRow(st, tcpStep >= i)}</div>)}
              </div>
              {tcpDone && (
                <div style={{ textAlign: "center", color: "#10b981", fontWeight: 700, fontSize: "12px", padding: "8px", background: "rgba(16,185,129,0.12)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.3)" }}>
                  ✅ ส่งข้อมูลสำเร็จ — ได้รับครบ 100%!
                </div>
              )}
            </div>

            {/* UDP Panel */}
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: "#f59e0b" }}>⚡ UDP</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>ยิงข้อมูลออกไปเลย ไม่รอ ไม่ยืนยัน</div>
                </div>
                <button onClick={runUDP} disabled={udpRunning} style={{
                  padding: "7px 14px", borderRadius: "8px", border: "none", cursor: udpRunning ? "wait" : "pointer",
                  background: udpRunning ? "rgba(245,158,11,0.3)" : "#d97706", color: "#fff",
                  fontWeight: 700, fontSize: "12px", transition: "all 0.2s",
                }}>{udpRunning ? "กำลังส่ง..." : "▶ Play UDP"}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {udpSteps.map((st, i) => <div key={i}>{pktRow(st, udpStep >= i)}</div>)}
              </div>
              {udpDone && (
                <div style={{ textAlign: "center", color: "#f59e0b", fontWeight: 700, fontSize: "12px", padding: "8px", background: "rgba(245,158,11,0.1)", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.3)" }}>
                  ⚡ ส่งเร็วมาก แต่ชุดที่ 3 หาย — ไม่มีการแจ้งเตือน!
                </div>
              )}
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", flexShrink: 0 }}>
            {[
              { label: "ความเร็ว", tcp: "ช้ากว่า (ต้อง Handshake)", udp: "เร็วกว่า (ไม่ต้องรอ)" },
              { label: "ความน่าเชื่อถือ", tcp: "สูง — มีการยืนยัน ACK", udp: "ต่ำ — ไม่ยืนยัน" },
              { label: "เหมาะกับ", tcp: "SSH, HTTP, Database", udp: "DNS, DHCP, MQTT" },
              { label: "ตัวอย่าง", tcp: "ส่งไฟล์, เว็บ, DB Query", udp: "วีดีโอคอล, เกม, IoT" },
            ].map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "10px", color: "#a5b4fc", fontWeight: 700, marginBottom: "6px" }}>{r.label}</div>
                <div style={{ fontSize: "11px", color: "#60a5fa", marginBottom: "3px" }}>🔗 {r.tcp}</div>
                <div style={{ fontSize: "11px", color: "#fbbf24" }}>⚡ {r.udp}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Socket Binding Animation  (week-7a slide type: socket-binding-anim)
───────────────────────────────────────────────────────────────────────── */
function SocketBindingAnimation({ s }: { s: SlideData }) {
  const [binding, setBinding] = useState<"0.0.0.0" | "127.0.0.1">("0.0.0.0");
  const [attacking, setAttacking] = useState(false);
  const [packets, setPackets] = useState<{ id: number; blocked: boolean }[]>([]);
  const nextId = React.useRef(0);

  const launchAttack = () => {
    if (attacking) return;
    setAttacking(true);
    let count = 0;
    const iv = setInterval(() => {
      const id = nextId.current++;
      const blocked = binding === "127.0.0.1";
      setPackets(prev => [...prev, { id, blocked }]);
      setTimeout(() => setPackets(prev => prev.filter(p => p.id !== id)), 2400);
      count++;
      if (count >= 6) { clearInterval(iv); setTimeout(() => setAttacking(false), 600); }
    }, 320);
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "3% 4%",
      background: "linear-gradient(135deg,#0f172a 0%,#1a0a2e 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai',sans-serif", boxSizing: "border-box", gap: "16px",
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          ⚠️ หัวข้อความปลอดภัยสำคัญ
        </span>
        <h2 style={{ margin: "4px 0 0", fontSize: "clamp(16px,2.2vw,24px)", fontWeight: 800 }}>{s.title}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", flex: 1 }}>
        {/* Left: Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#a5b4fc", marginBottom: "12px" }}>⚙️ เลือก Binding Address:</div>
            {(["0.0.0.0", "127.0.0.1"] as const).map(addr => (
              <button key={addr} onClick={() => setBinding(addr)} style={{
                display: "block", width: "100%", marginBottom: "8px", textAlign: "left",
                padding: "12px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
                background: binding === addr ? (addr === "0.0.0.0" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)") : "rgba(255,255,255,0.06)",
                color: "#fff", fontWeight: 700, fontSize: "13px", transition: "all 0.2s",
                outline: binding === addr ? `2px solid ${addr === "0.0.0.0" ? "#ef4444" : "#10b981"}` : "none",
              }}>
                {addr === "0.0.0.0" ? "🌍" : "🔒"} {addr}
                <span style={{ display: "block", fontSize: "10px", fontWeight: 400, color: "rgba(255,255,255,0.6)", marginTop: "3px" }}>
                  {addr === "0.0.0.0" ? "รับสายจากทุกคนในโลก (อันตราย!)" : "เฉพาะในเครื่องตัวเองเท่านั้น (ปลอดภัย)"}
                </span>
              </button>
            ))}
          </div>

          <button onClick={launchAttack} disabled={attacking} style={{
            padding: "14px", borderRadius: "12px", border: "none", cursor: attacking ? "wait" : "pointer",
            background: attacking ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg,#ef4444,#b91c1c)",
            color: "#fff", fontWeight: 800, fontSize: "14px", transition: "all 0.2s",
          }}>
            {attacking ? "🔴 กำลังส่งแพ็กเก็ต..." : "🚨 จำลองการโจมตี!"}
          </button>

          <div style={{
            padding: "14px", borderRadius: "12px", transition: "all 0.3s",
            background: binding === "0.0.0.0" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            border: `1px solid ${binding === "0.0.0.0" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: binding === "0.0.0.0" ? "#ef4444" : "#10b981", marginBottom: "6px" }}>
              {binding === "0.0.0.0" ? "⚠️ สถานะ: อันตราย!" : "✅ สถานะ: ปลอดภัย!"}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              {binding === "0.0.0.0"
                ? "บริการนี้เปิดรับสายจากทุก IP ในโลก แฮกเกอร์สแกนเจอและโจมตีได้โดยตรง!"
                : "บริการนี้รับเฉพาะ localhost เท่านั้น แม้ไม่มีไฟร์วอลล์ก็ไม่มีใครจากภายนอกเข้าได้!"}
            </div>
          </div>
        </div>

        {/* Right: Visualization */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
          <div style={{ fontWeight: 700, fontSize: "12px", color: "#a5b4fc" }}>🖥️ จำลองการเชื่อมต่อ</div>

          {/* Network diagram */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "10px 14px", textAlign: "center", minWidth: "72px" }}>
              <div style={{ fontSize: "20px" }}>👤</div>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "10px" }}>Attacker</div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>Internet</div>
            </div>

            <div style={{ flex: 1, position: "relative", height: "44px" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.12)", transform: "translateY(-50%)" }} />
              {/* Animated packets */}
              {packets.map(p => (
                <div key={p.id} style={{
                  position: "absolute", top: "50%", fontSize: "16px",
                  transform: "translateY(-50%)",
                  animation: `pkt${p.blocked ? "Block" : "Pass"}_${p.id % 3} 2.2s ease-in forwards`,
                  left: "0%",
                }}>📦</div>
              ))}
            </div>

            <div style={{
              background: binding === "127.0.0.1" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${binding === "127.0.0.1" ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: "8px", padding: "10px 14px", textAlign: "center", minWidth: "82px",
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: "20px" }}>🖥️</div>
              <div style={{ color: binding === "127.0.0.1" ? "#10b981" : "#94a3b8", fontWeight: 700, fontSize: "10px" }}>Server</div>
              <div style={{ fontSize: "9px", color: binding === "0.0.0.0" ? "#ef4444" : "#10b981", fontWeight: 700 }}>{binding}</div>
            </div>
          </div>

          {/* Detail card */}
          {[
            {
              addr: "0.0.0.0", icon: "🌍", title: "0.0.0.0 — รับสายจากทุก Interface", color: "#ef4444",
              points: ["รับสายจากทุก IP Address ที่เข้ามา", "แฮกเกอร์ภายนอกเชื่อมต่อได้โดยตรง", "⚠️ ต้องใช้ Firewall ป้องกันทุกครั้ง", "Config: bind-address = 0.0.0.0"]
            },
            {
              addr: "127.0.0.1", icon: "🔒", title: "127.0.0.1 — Loopback เท่านั้น", color: "#10b981",
              points: ["รับเฉพาะ localhost ภายในเครื่อง", "ภายนอกเชื่อมต่อไม่ได้แม้ไม่มีไฟร์วอลล์", "PHP/Python ในเครื่องเดียวกันเชื่อมได้", "Config: bind-address = 127.0.0.1"]
            },
          ].filter(item => item.addr === binding).map(item => (
            <div key={item.addr} style={{ background: `${item.color}08`, borderRadius: "10px", padding: "12px", border: `1px solid ${item.color}25`, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "12px", color: item.color, marginBottom: "8px" }}>{item.icon} {item.title}</div>
              {item.points.map((pt, i) => (
                <div key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", padding: "3px 0", display: "flex", gap: "6px" }}>
                  <span style={{ color: item.color, flexShrink: 0 }}>•</span> {pt}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pktPass_0 { 0%{left:0%;opacity:1} 100%{left:calc(100% - 20px);opacity:0.4} }
        @keyframes pktPass_1 { 0%{left:0%;opacity:1} 100%{left:calc(100% - 20px);opacity:0.4} }
        @keyframes pktPass_2 { 0%{left:0%;opacity:1} 100%{left:calc(100% - 20px);opacity:0.4} }
        @keyframes pktBlock_0 { 0%{left:0%;opacity:1} 50%{left:42%;opacity:1;transform:translateY(-50%) scale(1)} 65%{left:42%;opacity:1;transform:translateY(-50%) scale(1.4)} 100%{left:42%;opacity:0;transform:translateY(-50%) scale(0.4)} }
        @keyframes pktBlock_1 { 0%{left:0%;opacity:1} 50%{left:42%;opacity:1;transform:translateY(-50%) scale(1)} 65%{left:42%;opacity:1;transform:translateY(-50%) scale(1.4)} 100%{left:42%;opacity:0;transform:translateY(-50%) scale(0.4)} }
        @keyframes pktBlock_2 { 0%{left:0%;opacity:1} 50%{left:42%;opacity:1;transform:translateY(-50%) scale(1)} 65%{left:42%;opacity:1;transform:translateY(-50%) scale(1.4)} 100%{left:42%;opacity:0;transform:translateY(-50%) scale(0.4)} }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Port Scan Animation  (week-7a slide type: port-scan-anim)
───────────────────────────────────────────────────────────────────────── */
function PortScanAnimation({ s }: { s: SlideData }) {
  const ports = [
    { port: 22, name: "SSH", color: "#3b82f6", open: true, icon: "🔑" },
    { port: 80, name: "HTTP", color: "#10b981", open: true, icon: "🌐" },
    { port: 443, name: "HTTPS", color: "#10b981", open: false, icon: "🔐" },
    { port: 3306, name: "MariaDB", color: "#ef4444", open: true, icon: "🗄️" },
    { port: 445, name: "Samba", color: "#f59e0b", open: false, icon: "📁" },
    { port: 8080, name: "HTTP-Alt", color: "#8b5cf6", open: false, icon: "🔧" },
    { port: 1883, name: "MQTT", color: "#06b6d4", open: false, icon: "📡" },
    { port: 9999, name: "Unknown?", color: "#ef4444", open: false, icon: "❓" },
  ];

  const [scanning, setScanning] = useState(false);
  const [scannedIdx, setScannedIdx] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "scanning" | "found" | "exploiting" | "pwned">("idle");

  const startScan = () => {
    if (scanning) return;
    setScanning(true); setScannedIdx(-1); setPhase("scanning");
    ports.forEach((_, i) => {
      setTimeout(() => {
        setScannedIdx(i);
        if (i === ports.length - 1) {
          setScanning(false); setPhase("found");
          setTimeout(() => setPhase("exploiting"), 1500);
          setTimeout(() => setPhase("pwned"), 3200);
        }
      }, i * 480 + 300);
    });
  };

  const resetScan = () => { setScanning(false); setScannedIdx(-1); setPhase("idle"); };

  const terminalContent: Record<string, React.ReactNode> = {
    idle: <span style={{ color: "rgba(255,255,255,0.3)" }}>กด "เริ่ม nmap Scan" เพื่อดูการโจมตี...</span>,
    scanning: <span style={{ color: "#94a3b8" }}>$ nmap -sV 192.168.1.100<br />กำลังสแกน...</span>,
    found: <>
      <span style={{ color: "#94a3b8" }}>$ nmap -sV 192.168.1.100{"\n"}</span>
      <span style={{ color: "#10b981" }}>PORT     STATE  SERVICE{"\n"}22/tcp   open   ssh OpenSSH 8.9{"\n"}80/tcp   open   http Nginx 1.18{"\n"}</span>
      <span style={{ color: "#ef4444", fontWeight: 700 }}>3306/tcp open   mysql MariaDB 10.6{"\n"}</span>
      <span style={{ color: "#fbbf24" }}>⚠️ พบพอร์ต 3306 เปิดอยู่ที่ 0.0.0.0!</span>
    </>,
    exploiting: <>
      <span style={{ color: "#10b981" }}>PORT 3306 — MariaDB detected!{"\n"}</span>
      <span style={{ color: "#fbbf24" }}>$ mysql -h 192.168.1.100 -u root -p{"\n"}</span>
      <span style={{ color: "#94a3b8" }}>Trying root/root...{"\n"}Trying root/admin...{"\n"}</span>
      <span style={{ color: "#ef4444" }}>Brute-forcing...</span>
    </>,
    pwned: <>
      <span style={{ color: "#10b981" }}>Welcome to the MariaDB monitor!{"\n"}</span>
      <span style={{ color: "#ef4444", fontWeight: 700 }}>☠️ ACCESS GRANTED!{"\n"}ขโมยข้อมูลทั้งหมดได้แล้ว!</span>
    </>,
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "3% 4%",
      background: "linear-gradient(135deg,#0a0a0a 0%,#1a0505 50%,#0a0a0a 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai','Fira Code',monospace", boxSizing: "border-box", gap: "14px",
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            🚨 จำลองการโจมตี Port Scanning
          </span>
          <h2 style={{ margin: "4px 0 0", fontSize: "clamp(14px,2vw,22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={startScan} disabled={scanning} style={{
            padding: "8px 16px", borderRadius: "10px", border: "none", cursor: scanning ? "wait" : "pointer",
            background: scanning ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg,#ef4444,#991b1b)",
            color: "#fff", fontWeight: 700, fontSize: "12px", transition: "all 0.2s",
          }}>
            {scanning ? "⏳ กำลังสแกน..." : "🔭 เริ่ม nmap Scan"}
          </button>
          {phase !== "idle" && !scanning && (
            <button onClick={resetScan} style={{
              padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.6)",
              fontWeight: 700, fontSize: "12px",
            }}>↺ รีเซต</button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px", flex: 1 }}>
        {/* Port grid */}
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px", fontFamily: "monospace" }}>
            $ nmap -sV 192.168.1.100
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
            {ports.map((p, i) => {
              const scanned = scannedIdx >= i;
              const isCurrentlyScan = i === scannedIdx && scanning;
              return (
                <div key={p.port} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "9px 12px", borderRadius: "10px", transition: "all 0.4s",
                  background: !scanned ? "rgba(255,255,255,0.03)" : p.open ? `${p.color}18` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${!scanned ? "rgba(255,255,255,0.06)" : p.open ? p.color + "55" : "rgba(255,255,255,0.1)"}`,
                }}>
                  <span style={{ fontSize: "16px", opacity: scanned ? 1 : 0.3 }}>{p.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "12px", fontWeight: 700, fontFamily: "monospace",
                      color: !scanned ? "rgba(255,255,255,0.2)" : p.open ? p.color : "rgba(255,255,255,0.4)"
                    }}>
                      :{p.port}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>{p.name}</div>
                  </div>
                  {scanned && (
                    <span style={{
                      fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
                      background: p.open ? `${p.color}30` : "rgba(255,255,255,0.07)",
                      color: p.open ? p.color : "rgba(255,255,255,0.4)",
                      border: `1px solid ${p.open ? p.color + "44" : "rgba(255,255,255,0.1)"}`,
                    }}>{p.open ? "OPEN" : "closed"}</span>
                  )}
                  {isCurrentlyScan && <span style={{ fontSize: "11px" }}>🔍</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal + result */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{
            background: "rgba(10,10,10,0.9)", borderRadius: "12px", padding: "14px",
            border: "1px solid rgba(239,68,68,0.2)", fontFamily: "monospace", fontSize: "11px",
            lineHeight: 1.9, flex: 1, whiteSpace: "pre-wrap",
          }}>
            <div style={{ color: "#ef4444", fontWeight: 700, marginBottom: "8px" }}>🖥️ Terminal — Attacker</div>
            {terminalContent[phase]}
          </div>

          {phase === "pwned" && (
            <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(16,185,129,0.3)", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "12px", color: "#10b981", marginBottom: "8px" }}>🛡️ วิธีป้องกัน:</div>
              {[
                "ติดตั้ง UFW Firewall บล็อกพอร์ต 3306",
                "Bind MariaDB ที่ 127.0.0.1 ไม่ใช่ 0.0.0.0",
                "ใช้ Fail2Ban บล็อก IP ที่ Login ผิดซ้ำ",
                "เปลี่ยน Default Password ทันที",
              ].map((tip, i) => (
                <div key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", padding: "3px 0", display: "flex", gap: "6px" }}>
                  <span style={{ color: "#10b981", flexShrink: 0 }}>✅</span> {tip}
                </div>
              ))}
            </div>
          )}

          {phase === "idle" && (
            <div style={{ background: "rgba(239,68,68,0.07)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "12px", color: "#ef4444", marginBottom: "6px" }}>⚠️ ข้อควรระวัง:</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                ห้ามใช้ nmap สแกนเครื่องที่ไม่ได้รับอนุญาตในชีวิตจริง ถือเป็นการละเมิดกฎหมายคอมพิวเตอร์! ใช้ได้เฉพาะเซิร์ฟเวอร์ของตัวเองครับ
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────
   IP Address Infographic  (week-7a slide type: ip-infographic)
───────────────────────────────────────────────────────────────────────── */
function IPAddressInfographic({ s }: { s: SlideData }) {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [showCmd, setShowCmd] = useState(false);

  const components = [
    {
      icon: "🔢", label: "IP Address", value: "192.168.1.100", color: "#6366f1", shadow: "rgba(99,102,241,0.35)",
      analogy: "เลขห้องในคอนโด", range: "0–255 ต่อชุด",
      desc: "หมายเลขประจำตัวเครื่อง ใช้ระบุตำแหน่งในการส่งข้อมูล ประกอบด้วยตัวเลข 4 ชุด คั่นด้วยจุด",
    },
    {
      icon: "🏢", label: "Subnet Mask", value: "/24 = 255.255.255.0", color: "#3b82f6", shadow: "rgba(59,130,246,0.35)",
      analogy: "ชื่อตึกของคอนโด", range: "/24 = 256 เครื่อง  /16 = 65,536 เครื่อง",
      desc: "ตัวกำหนดขอบเขตวงเครือข่าย บอกว่าอุปกรณ์ใดอยู่ในวงเดียวกัน",
    },
    {
      icon: "🚪", label: "Default Gateway", value: "192.168.1.1", color: "#10b981", shadow: "rgba(16,185,129,0.35)",
      analogy: "ประตูออกสู่อินเทอร์เน็ต", range: "ปกติเป็น IP แรกในวง เช่น .1",
      desc: "IP ของเราเตอร์ทำหน้าที่เป็นประตูทางออกนอกเครือข่าย ถ้าไม่มี — เข้าเน็ตไม่ได้!",
    },
    {
      icon: "📖", label: "DNS Server", value: "8.8.8.8 (Google)", color: "#f59e0b", shadow: "rgba(245,158,11,0.35)",
      analogy: "สมุดโทรศัพท์ดิจิทัล", range: "8.8.8.8 (Google), 1.1.1.1 (Cloudflare)",
      desc: "แปลง Domain Name เช่น google.com ให้เป็น IP ที่คอมพิวเตอร์เข้าใจ",
    },
  ];

  const commands = [
    { cmd: "ip a", desc: "ดู IP และ Network Interface ทั้งหมด", color: "#6366f1" },
    { cmd: "ip a show eth0", desc: "ดูเฉพาะการ์ดแลนชื่อ eth0", color: "#3b82f6" },
    { cmd: "hostname -I", desc: "แสดง IP Address อย่างรวดเร็ว", color: "#10b981" },
    { cmd: "ip route", desc: "ดู Routing Table และ Default Gateway", color: "#f59e0b" },
  ];

  const ipParts = ["192", "168", "1", "100"];
  const ipColors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg,#0a0f1e 0%,#0f172a 50%,#0a1628 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai',sans-serif", boxSizing: "border-box", gap: "12px",
      position: "relative", overflow: "hidden",
    }}>
      {/* BG orbs */}
      <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "260px", height: "260px", borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>🌐 พื้นฐานเครือข่าย</span>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(18px,2.2vw,26px)", fontWeight: 800, letterSpacing: "-0.5px" }}>{s.title}</h2>
        </div>
        <button onClick={() => setShowCmd(!showCmd)} style={{
          padding: "7px 14px", borderRadius: "10px", border: `1px solid rgba(99,102,241,0.3)`, cursor: "pointer",
          background: showCmd ? "#6366f1" : "rgba(99,102,241,0.15)",
          color: showCmd ? "#fff" : "#a5b4fc", fontWeight: 700, fontSize: "12px", transition: "all 0.25s",
        }}>
          {showCmd ? "📊 ดู Infographic" : "💻 ดูคำสั่ง CLI"}
        </button>
      </div>

      {!showCmd ? (
        <>
          {/* IP breakdown */}
          <div style={{ background: "rgba(99,102,241,0.07)", borderRadius: "16px", padding: "12px 18px", border: "1px solid rgba(99,102,241,0.2)", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: 700, letterSpacing: "1px" }}>🔍 กายวิภาค IP Address</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0" }}>
              {ipParts.map((part, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{
                      fontSize: "clamp(20px,2.8vw,32px)", fontWeight: 900, fontFamily: "monospace",
                      color: ipColors[i], padding: "7px 14px",
                      background: `${ipColors[i]}15`, borderRadius: "10px", border: `2px solid ${ipColors[i]}40`,
                      minWidth: "62px", textAlign: "center",
                    }}>{part}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{["ตัวที่ 1", "ตัวที่ 2", "ตัวที่ 3", "ตัวที่ 4"][i]}</div>
                  </div>
                  {i < 3 && <div style={{ fontSize: "26px", fontWeight: 900, color: "rgba(255,255,255,0.25)", padding: "0 3px", marginBottom: "16px" }}>.</div>}
                </React.Fragment>
              ))}
              <div style={{ marginLeft: "18px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "7px 14px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>ช่วงที่ใช้ได้</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#e2e8f0" }}>0 – 255</div>
                <div style={{ fontSize: "9px", color: "#94a3b8" }}>ต่อชุด</div>
              </div>
            </div>
          </div>

          {/* 4 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", flex: 1 }}>
            {components.map((c, i) => (
              <div key={i} onClick={() => setActiveCard(activeCard === i ? null : i)} style={{
                borderRadius: "16px", padding: "14px 12px", cursor: "pointer",
                background: activeCard === i ? `${c.color}18` : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${activeCard === i ? c.color + "66" : "rgba(255,255,255,0.08)"}`,
                transition: "all 0.25s", display: "flex", flexDirection: "column", gap: "9px",
                boxShadow: activeCard === i ? `0 8px 28px ${c.shadow}` : "none",
                transform: activeCard === i ? "translateY(-2px)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "20px", width: "40px", height: "40px", borderRadius: "11px", background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${c.color}30`, flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "12px", color: c.color }}>{c.label}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>คลิกดูรายละเอียด</div>
                  </div>
                </div>
                <div style={{ background: `${c.color}15`, borderRadius: "8px", padding: "7px 9px", border: `1px solid ${c.color}25` }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: c.color, fontFamily: "monospace" }}>{c.value}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>🏷️ <span style={{ color: "rgba(255,255,255,0.65)" }}>{c.analogy}</span></div>
                </div>
                {activeCard === i && (
                  <div style={{ animation: "fadeIn 0.2s ease" }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginBottom: "7px" }}>{c.desc}</div>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "5px 8px", fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>📏 {c.range}</div>
                  </div>
                )}
                <div style={{ textAlign: "center", color: `${c.color}80`, fontSize: "11px", marginTop: "auto" }}>{activeCard === i ? "▲" : "▼"}</div>
              </div>
            ))}
          </div>

          {/* Network strip */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "10px 16px", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, whiteSpace: "nowrap" }}>ตัวอย่าง:</div>
            {[
              { icon: "💻", label: "เครื่องคุณ", ip: "192.168.1.100", color: "#6366f1" },
              { icon: "→", label: "", ip: "", color: "#334155" },
              { icon: "📡", label: "Switch", ip: "Layer 2", color: "#3b82f6" },
              { icon: "→", label: "", ip: "", color: "#334155" },
              { icon: "🌐", label: "Router/GW", ip: "192.168.1.1", color: "#10b981" },
              { icon: "→", label: "", ip: "", color: "#334155" },
              { icon: "☁️", label: "Internet", ip: "DNS: 8.8.8.8", color: "#f59e0b" },
            ].map((n, i) => n.icon === "→"
              ? <div key={i} style={{ fontSize: "18px", color: "#334155" }}>→</div>
              : (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "22px" }}>{n.icon}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: n.color, marginTop: "2px" }}>{n.label}</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{n.ip}</div>
                </div>
              )
            )}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>💻 คำสั่งดูข้อมูลเครือข่ายบน Linux Terminal:</div>
          {commands.map((c, i) => (
            <div key={i} style={{ background: "rgba(15,23,42,0.8)", borderRadius: "14px", padding: "15px 20px", border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: `${c.color}20`, borderRadius: "10px", padding: "9px 16px", fontFamily: "monospace", fontSize: "14px", fontWeight: 700, color: c.color, border: `1px solid ${c.color}40`, whiteSpace: "nowrap", flexShrink: 0 }}>
                $ {c.cmd}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{c.desc}</div>
            </div>
          ))}
          <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: "14px", padding: "14px 18px", border: "1px solid rgba(99,102,241,0.2)", display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "22px", flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#a5b4fc", marginBottom: "5px" }}>อ่านผลลัพธ์ ip a อย่างไร?</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                ในผลลัพธ์จะเห็น <span style={{ color: "#6366f1", fontFamily: "monospace", fontWeight: 700 }}>inet</span> แสดง IPv4 และ <span style={{ color: "#8b5cf6", fontFamily: "monospace", fontWeight: 700 }}>inet6</span> แสดง IPv6 ของแต่ละการ์ดเครือข่าย
                <br />การ์ดเครือข่ายใน LXC/VM มักชื่อว่า <span style={{ color: "#10b981", fontFamily: "monospace" }}>eth0</span> หรือ <span style={{ color: "#10b981", fontFamily: "monospace" }}>ens18</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Packet Flow Animation  (week-7a slide type: packet-flow-anim)
   Shows OSI Layer encapsulation step-by-step with interactive controls
───────────────────────────────────────────────────────────────────────── */
function PacketFlowAnimation({ s }: { s: SlideData }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showFirewall, setShowFirewall] = useState(false);

  const steps = [
    {
      layer: "Layer 7 — Application",
      icon: "🌐",
      color: "#6366f1",
      title: "Browser สร้าง HTTP Request",
      desc: "ผู้ใช้พิมพ์ URL → Browser สร้างข้อความขอหน้าเว็บ",
      packet: { type: "HTTP", label: "GET / HTTP/1.1\nHost: 192.168.1.5", color: "#6366f1" },
      explain: "ณ จุดนี้ข้อมูลยังเป็นแค่ \"ข้อความคำขอ\" ธรรมดา ยังไม่มีที่อยู่ปลายทางใดๆ ระบบจะส่งต่อลงมายัง Layer 4 เพื่อห่อด้วย TCP",
    },
    {
      layer: "Layer 4 — Transport (TCP)",
      icon: "📦",
      color: "#3b82f6",
      title: "TCP ห่อข้อมูลเป็น Segment",
      desc: "กำหนด Source Port (สุ่มอัตโนมัติ) และ Destination Port (80 สำหรับ HTTP)",
      packet: { type: "TCP Segment", label: "Src Port: 54321\nDst Port: 80\n[HTTP Data]", color: "#3b82f6" },
      explain: "TCP เพิ่ม \"ป้าย\" ระบุหมายเลขช่องทาง (Port) ทำให้เซิร์ฟเวอร์รู้ว่าข้อมูลนี้ต้องส่งให้ Nginx ที่รออยู่พอร์ต 80 ไม่ใช่โปรแกรมอื่น",
    },
    {
      layer: "Layer 3 — Network (IP)",
      icon: "🗺️",
      color: "#10b981",
      title: "IP ห่ออีกชั้น เพิ่มที่อยู่",
      desc: "บันทึก Source IP ของเครื่องส่ง และ Destination IP ของเซิร์ฟเวอร์",
      packet: { type: "IP Packet", label: "Src IP: 192.168.1.100\nDst IP: 192.168.1.5\n[TCP][HTTP]", color: "#10b981" },
      explain: "IP เหมือนซองจดหมายที่เขียนที่อยู่ผู้ส่งและผู้รับ เราเตอร์จะใช้ข้อมูลชั้นนี้ตัดสินใจว่าจะส่ง Packet ไปทางไหน",
    },
    {
      layer: "Layer 2 — Data Link (Ethernet)",
      icon: "🔌",
      color: "#f59e0b",
      title: "Ethernet ห่อชั้นนอกสุด",
      desc: "ใส่ MAC Address เครื่องต้นทางและปลายทาง เพื่อส่งข้ามสวิตช์ในวงแลน",
      packet: { type: "Ethernet Frame", label: "Src MAC: AA:BB:CC\nDst MAC: 11:22:33\n[IP][TCP][HTTP]", color: "#f59e0b" },
      explain: "MAC Address ใช้เฉพาะในวงแลนเดียวกัน เมื่อข้ามไปวงอื่น เราเตอร์จะเปลี่ยน MAC ใหม่ แต่ IP ยังคงเดิมตลอดทาง",
    },
    {
      layer: "🚦 Firewall ตรวจสอบ (Layer 3-4)",
      icon: "🛡️",
      color: "#ef4444",
      title: "Firewall คอยตรวจ Packet",
      desc: "Firewall อ่าน IP และ Port แล้วเปรียบกับกฎที่ตั้งไว้",
      packet: { type: "INSPECT", label: "IP: 192.168.1.100 ✓\nPort: 80 ✓\n→ ALLOW", color: "#ef4444" },
      explain: "Firewall ทำงานที่ Layer 3-4 มองเห็นแค่ IP และ Port ไม่ได้อ่านเนื้อหาข้อมูลจริงๆ ดังนั้นถ้าต้องการ Block พอร์ต 3306 (MariaDB) ก็เขียนกฎ: ห้าม Port 3306 เข้า",
    },
    {
      layer: "🖥️ Server แกะชั้น & ส่งให้ Nginx",
      icon: "⚙️",
      color: "#8b5cf6",
      title: "Server แกะข้อมูลทีละชั้น",
      desc: "แกะ Ethernet → IP → TCP → อ่าน Port 80 → ส่ง HTTP Request ให้ Nginx",
      packet: { type: "Delivered!", label: "→ Nginx (Port 80)\nGET / HTTP/1.1\n✅ ประมวลผลและตอบกลับ", color: "#8b5cf6" },
      explain: "เซิร์ฟเวอร์แกะชั้นออกทีละชั้น (Decapsulation) ตรงข้ามกับตอนส่ง เมื่อถึง TCP ชั้น ระบบดู Destination Port = 80 จึงโยน Request ให้ Nginx ประมวลผลและส่ง HTML กลับ",
    },
  ];

  const currentStep = steps[step];

  const goNext = () => { if (step < steps.length - 1) setStep(s => s + 1); };
  const goPrev = () => { if (step > 0) setStep(s => s - 1); };

  React.useEffect(() => {
    if (!playing) return;
    if (step >= steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), 1800);
    return () => clearTimeout(t);
  }, [playing, step]);

  const layerColors = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg,#0a0f1e 0%,#0f172a 60%,#0a1020 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai',sans-serif", boxSizing: "border-box", gap: "12px",
      position: "relative", overflow: "hidden",
    }}>
      {/* BG decoration */}
      <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: `radial-gradient(circle,${currentStep.color}18 0%,transparent 70%)`, pointerEvents: "none", transition: "background 0.5s" }} />

      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>แนวคิดการส่งข้อมูล</span>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(15px,2vw,22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => { setStep(0); setPlaying(false); }} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>↺ รีเซต</button>
          <button onClick={() => setPlaying(!playing)} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "12px", background: playing ? "rgba(239,68,68,0.25)" : `${currentStep.color}`, color: "#fff", transition: "all 0.2s" }}>
            {playing ? "⏸ หยุด" : step === steps.length - 1 ? "✅ จบแล้ว" : "▶ Auto Play"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "14px", flex: 1 }}>

        {/* Left: Layer stepper */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Progress steps */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
            {steps.map((st, i) => (
              <React.Fragment key={i}>
                <button onClick={() => { setStep(i); setPlaying(false); }} style={{
                  width: "32px", height: "32px", borderRadius: "50%", border: "none", cursor: "pointer",
                  background: i <= step ? layerColors[i] : "rgba(255,255,255,0.08)",
                  color: "#fff", fontWeight: 800, fontSize: "13px", transition: "all 0.3s",
                  boxShadow: i === step ? `0 0 0 3px ${layerColors[i]}44` : "none",
                  transform: i === step ? "scale(1.15)" : "scale(1)",
                  flexShrink: 0,
                }}>
                  {i < step ? "✓" : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: i < step ? layerColors[i] : "rgba(255,255,255,0.08)", transition: "background 0.4s", minWidth: "8px" }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Current step card */}
          <div style={{
            background: `${currentStep.color}10`, borderRadius: "16px", padding: "18px",
            border: `1.5px solid ${currentStep.color}40`, flex: 1,
            display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.4s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "28px", width: "52px", height: "52px", borderRadius: "14px", background: `${currentStep.color}20`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${currentStep.color}35`, flexShrink: 0 }}>
                {currentStep.icon}
              </div>
              <div>
                <div style={{ fontSize: "10px", color: `${currentStep.color}`, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{currentStep.layer}</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#f1f5f9", marginTop: "3px" }}>{currentStep.title}</div>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
              {currentStep.desc}
            </div>

            {/* Packet visual */}
            <div style={{ fontFamily: "monospace" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600 }}>📦 PACKET ณ ขั้นตอนนี้:</div>
              <div style={{
                background: "rgba(10,15,30,0.8)", borderRadius: "10px", padding: "12px 14px",
                border: `1px solid ${currentStep.color}50`,
                whiteSpace: "pre", fontSize: "11px", color: `${currentStep.color}`,
                fontWeight: 600, lineHeight: 1.7,
              }}>{currentStep.packet.label}</div>
            </div>

            {/* Explanation */}
            <div style={{ background: `${currentStep.color}08`, borderRadius: "10px", padding: "10px 14px", border: `1px solid ${currentStep.color}20`, marginTop: "auto" }}>
              <div style={{ fontSize: "10px", color: `${currentStep.color}`, fontWeight: 700, marginBottom: "4px" }}>💡 ทำไมถึงต้องมีชั้นนี้?</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>{currentStep.explain}</div>
            </div>
          </div>

          {/* Prev / Next */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={goPrev} disabled={step === 0} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: step === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: step === 0 ? "default" : "pointer", fontWeight: 700, fontSize: "13px" }}>
              ← ย้อนกลับ
            </button>
            <button onClick={goNext} disabled={step === steps.length - 1} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: step === steps.length - 1 ? "rgba(255,255,255,0.06)" : currentStep.color, color: step === steps.length - 1 ? "rgba(255,255,255,0.3)" : "#fff", cursor: step === steps.length - 1 ? "default" : "pointer", fontWeight: 700, fontSize: "13px", transition: "all 0.2s" }}>
              ถัดไป →
            </button>
          </div>
        </div>

        {/* Right: Encapsulation visual */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>🧅 การห่อชั้น (Encapsulation) — เหมือนหัวหอม</div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "5px" }}>
            {[
              { num: 2, name: "Ethernet Frame", sub: "MAC Address", color: "#f59e0b", active: step >= 3 },
              { num: 3, name: "IP Packet", sub: "Source / Dest IP", color: "#10b981", active: step >= 2 },
              { num: 4, name: "TCP Segment", sub: "Port 54321 → 80", color: "#3b82f6", active: step >= 1 },
              { num: 7, name: "HTTP Request", sub: "GET / HTTP/1.1", color: "#6366f1", active: step >= 0 },
            ].map((layer, i) => (
              <div key={i} style={{
                padding: `${9 - i * 1}px ${12 + i * 10}px`,
                borderRadius: "10px",
                background: layer.active ? `${layer.color}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${layer.active ? layer.color + "55" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.5s", opacity: layer.active ? 1 : 0.3,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: layer.active ? layer.color : "rgba(255,255,255,0.3)" }}>
                    Layer {layer.num}: {layer.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "1px", fontFamily: "monospace" }}>{layer.sub}</div>
                </div>
                {layer.active && <span style={{ fontSize: "14px" }}>✅</span>}
              </div>
            ))}
          </div>

          {/* Firewall callout */}
          <div style={{
            background: step >= 4 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)",
            borderRadius: "12px", padding: "12px 14px",
            border: step >= 4 ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.06)",
            transition: "all 0.5s",
          }}>
            <div style={{ fontWeight: 700, fontSize: "12px", color: step >= 4 ? "#ef4444" : "rgba(255,255,255,0.2)", marginBottom: "5px" }}>
              🛡️ Firewall ทำงานที่ Layer 3-4
            </div>
            <div style={{ fontSize: "11px", color: step >= 4 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
              ตรวจสอบ <strong>IP Address</strong> และ <strong>Port Number</strong><br />
              เพื่อ Allow หรือ Block ก่อนข้อมูลถึงปลายทาง
            </div>
            {step >= 4 && (
              <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "10px", color: "#10b981", background: "rgba(16,185,129,0.08)", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(16,185,129,0.2)" }}>
                ufw allow 80/tcp<br />
                ufw deny 3306/tcp
              </div>
            )}
          </div>

          {/* Network path */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, marginBottom: "6px" }}>เส้นทาง:</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
              {[
                { icon: "💻", label: "Client", color: "#6366f1", active: step >= 0 },
                { icon: "→", label: "", color: "#334155", active: true },
                { icon: "📡", label: "Switch", color: "#3b82f6", active: step >= 3 },
                { icon: "→", label: "", color: "#334155", active: true },
                { icon: "🛡️", label: "FW", color: "#ef4444", active: step >= 4 },
                { icon: "→", label: "", color: "#334155", active: true },
                { icon: "🖥️", label: "Server", color: "#8b5cf6", active: step >= 5 },
              ].map((n, i) => n.icon === "→"
                ? <div key={i} style={{ color: "#334155", fontSize: "14px" }}>→</div>
                : (
                  <div key={i} style={{ textAlign: "center", opacity: n.active ? 1 : 0.3, transition: "opacity 0.4s" }}>
                    <div style={{ fontSize: "18px" }}>{n.icon}</div>
                    <div style={{ fontSize: "9px", color: n.color, fontWeight: 700 }}>{n.label}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   UFW Rules Flow Visualizer  (week-7b slide type: ufw-rules-visualizer)
───────────────────────────────────────────────────────────────────────── */
function UFWRulesVisualizer({ s }: { s: SlideData }) {
  const [rules, setRules] = useState([
    { id: 1, action: "ALLOW", src: "any", port: "22", proto: "tcp", desc: "รีโมทควบคุม SSH" },
    { id: 2, action: "ALLOW", src: "any", port: "80", proto: "tcp", desc: "เปิดบริการเว็บทั่วไป" },
    { id: 3, action: "ALLOW", src: "192.168.1.150", port: "3306", proto: "tcp", desc: "Whitelist Web Server" },
    { id: 4, action: "DENY", src: "192.168.1.180", port: "any", proto: "any", desc: "แบนไอพีผู้ก่อกวน" }
  ]);

  const [activePacket, setActivePacket] = useState<{ src: string; port: string; proto: string } | null>(null);
  const [evaluatingRuleId, setEvaluatingRuleId] = useState<number | null>(null);
  const [evalResult, setEvalResult] = useState<{ matchedRule: any; finalAction: "ALLOW" | "DENY" | "DEFAULT_DENY" } | null>(null);
  const [packetProgress, setPacketProgress] = useState(0); // animation state

  const presetPackets = [
    { src: "192.168.1.150", port: "3306", proto: "tcp", label: "Web Server → MariaDB (:3306)" },
    { src: "192.168.1.180", port: "80", proto: "tcp", label: "แฮกเกอร์ → Nginx (:80) — บล็อกโดยกฎแบนก่อน" },
    { src: "192.168.1.99", port: "3306", proto: "tcp", label: "ไอพีแปลกหน้า → MariaDB (:3306) — ติด Default Deny" },
    { src: "192.168.1.88", port: "22", proto: "tcp", label: "ผู้ใช้ทั่วไป → SSH (:22)" }
  ];

  const handleTestPacket = (pkt: typeof presetPackets[0]) => {
    setActivePacket(pkt);
    setEvaluatingRuleId(null);
    setEvalResult(null);
    setPacketProgress(0);

    // Start evaluation steps
    let currentRuleIdx = 0;
    const interval = setInterval(() => {
      if (currentRuleIdx < rules.length) {
        const rule = rules[currentRuleIdx];
        setEvaluatingRuleId(rule.id);
        setPacketProgress((currentRuleIdx + 1) / (rules.length + 1) * 80);

        // Check matching
        const matchesSrc = rule.src === "any" || rule.src === pkt.src;
        const matchesPort = rule.port === "any" || rule.port === pkt.port;
        const matchesProto = rule.proto === "any" || rule.proto === pkt.proto;

        if (matchesSrc && matchesPort && matchesProto) {
          // Found match! Stop evaluating
          clearInterval(interval);
          setEvalResult({
            matchedRule: rule,
            finalAction: rule.action as any
          });
          setPacketProgress(100);
          return;
        }
        currentRuleIdx++;
      } else {
        // Reached end, default deny
        clearInterval(interval);
        setEvalResult({
          matchedRule: null,
          finalAction: "DEFAULT_DENY"
        });
        setPacketProgress(100);
      }
    }, 850);
  };

  const addRule = () => {
    if (rules.some(r => r.port === "3306" && r.src === "any")) return;
    setRules(prev => [
      ...prev.slice(0, 3),
      { id: 99, action: "ALLOW", src: "any", port: "3306", proto: "tcp", desc: "เปิดฐานข้อมูลสาธารณะ (อันตราย!)" },
      ...prev.slice(3)
    ]);
  };

  const removeRules3306Public = () => {
    setRules(prev => prev.filter(r => r.id !== 99));
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "14px",
      position: "relative", overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            เครื่องจำลองกฎไฟร์วอลล์
          </span>
          <h2 style={{ margin: "4px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {!rules.some(r => r.id === 99) ? (
            <button onClick={addRule} style={{
              padding: "7px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: "11px"
            }}>➕ เพิ่มกฎ: ALLOW 3306 (Public)</button>
          ) : (
            <button onClick={removeRules3306Public} style={{
              padding: "7px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.6)",
              fontWeight: 700, fontSize: "11px"
            }}>➖ ลบกฎ 3306 (Public) ออก</button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Left: Rules List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#a5b4fc", fontWeight: 700 }}>
            <span>ลำดับการสแกนกฎ UFW (บนลงล่าง)</span>
            <span>Default Policy: Incoming DENY</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", flex: 1 }}>
            {rules.map((rule, idx) => {
              const isEvaluating = evaluatingRuleId === rule.id;
              const isMatched = evalResult?.matchedRule?.id === rule.id;
              return (
                <div key={rule.id} style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px",
                  background: isMatched ? (rule.action === "ALLOW" ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)")
                    : isEvaluating ? "rgba(99,102,241,0.15)"
                      : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isMatched ? (rule.action === "ALLOW" ? "#10b981" : "#ef4444")
                      : isEvaluating ? "#6366f1"
                        : "rgba(255,255,255,0.06)"
                    }`,
                  transition: "all 0.3s"
                }}>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>[{idx + 1}]</span>
                  <span style={{
                    fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "5px",
                    background: rule.action === "ALLOW" ? "#10b981" : "#ef4444", color: "#fff"
                  }}>{rule.action}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>
                      From: {rule.src} → Port: {rule.port} ({rule.proto})
                    </div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{rule.desc}</div>
                  </div>
                  {isEvaluating && <span style={{ fontSize: "11px", animation: "pulse 0.5s infinite" }}>🔍 กำลังตรวจ...</span>}
                  {isMatched && <span style={{ fontSize: "14px" }}>🎯 MATCH!</span>}
                </div>
              );
            })}

            {/* Default Deny box */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px",
              background: evalResult?.finalAction === "DEFAULT_DENY" ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.02)",
              border: `1.5px dashed ${evalResult?.finalAction === "DEFAULT_DENY" ? "#ef4444" : "rgba(255,255,255,0.15)"}`
            }}>
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>[∞]</span>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "5px", background: "#ef4444", color: "#fff" }}>DENY</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 700 }}>Default Policy (บล็อกเริ่มต้น)</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>หากไม่เข้ากฎข้อใดเลยข้างต้น จะถูกสกัดกั้นทันที</div>
              </div>
              {evalResult?.finalAction === "DEFAULT_DENY" && <span style={{ fontSize: "14px" }}>🔒 บล็อกกั้น</span>}
            </div>
          </div>
        </div>

        {/* Right: Simulation Controller & Animation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Packet Selector */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 700, marginBottom: "8px" }}>🚀 ทดสอบส่งแพ็กเก็ตจำลอง:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {presetPackets.map((pkt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTestPacket(pkt)}
                  disabled={evaluatingRuleId !== null && evalResult === null}
                  style={{
                    padding: "9px 12px", borderRadius: "8px", border: "none", textAlign: "left",
                    background: activePacket?.src === pkt.src && activePacket?.port === pkt.port
                      ? "rgba(99,102,241,0.25)"
                      : "rgba(255,255,255,0.05)",
                    color: "#fff", fontSize: "11px", cursor: "pointer", transition: "all 0.2s",
                    borderLeft: activePacket?.src === pkt.src && activePacket?.port === pkt.port
                      ? "3px solid #6366f1"
                      : "3px solid transparent"
                  }}
                >
                  {pkt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visualization screen */}
          <div style={{
            background: "rgba(10,15,30,0.8)", borderRadius: "14px", padding: "16px", flex: 1,
            border: "1px solid rgba(99,102,241,0.2)", display: "flex", flexDirection: "column", gap: "10px",
            position: "relative"
          }}>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>🖥️ Stateful Packet Inspection Display</div>

            {activePacket ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", justifyContent: "center" }}>
                {/* Packet travelling */}
                <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "8px", background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "10px" }}>
                  <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "8px", padding: "6px 10px", fontSize: "10px" }}>
                    <div style={{ color: "#6366f1", fontWeight: 700 }}>IP PACKET</div>
                    <div style={{ fontFamily: "monospace", marginTop: "2px" }}>SRC: {activePacket.src}</div>
                    <div style={{ fontFamily: "monospace" }}>PORT: {activePacket.port}</div>
                  </div>
                  <div style={{ flex: 1, position: "relative", height: "4px", background: "rgba(255,255,255,0.1)" }}>
                    <div style={{
                      position: "absolute", left: `${packetProgress}%`, top: "50%", transform: "translate(-50%, -50%)",
                      width: "12px", height: "12px", borderRadius: "50%", background: "#6366f1", transition: "left 0.2s"
                    }} />
                  </div>
                  <div style={{ fontSize: "24px" }}>🛡️</div>
                </div>

                {/* Result Display */}
                {evalResult && (
                  <div style={{
                    animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: "6px", padding: "12px", borderRadius: "10px",
                    background: evalResult.finalAction === "ALLOW" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    border: `1.5px solid ${evalResult.finalAction === "ALLOW" ? "#10b981" : "#ef4444"}`
                  }}>
                    <span style={{ fontSize: "28px" }}>
                      {evalResult.finalAction === "ALLOW" ? "✅" : "❌"}
                    </span>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: evalResult.finalAction === "ALLOW" ? "#10b981" : "#ef4444" }}>
                      {evalResult.finalAction === "ALLOW" ? "ALLOW (ทราฟฟิกผ่านฉลุย)" : "DENY (ทราฟฟิกถูกสกัดกั้น)"}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 1.5, marginTop: "4px" }}>
                      {evalResult.matchedRule ? (
                        <>สอดคล้องกับกฎข้อที่ {evalResult.matchedRule.id === 99 ? "แทรกใหม่" : evalResult.matchedRule.id} — Action: {evalResult.matchedRule.action}</>
                      ) : (
                        <>ไม่พบกฎการอนุญาตข้อใดเลย → ติดกฎป้องกันขาเข้าเริ่มต้น (Default Policy Incoming Deny)</>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "8px", color: "#cbd5e1" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#a5b4fc" }}>💡 หลักการประเมินกฎ UFW (บนลงล่าง)</span>
                <div style={{ fontSize: "11.5px", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: "6px" }}><strong>1. ตรวจแบบ First-Match:</strong> UFW จะนำสัญญานอินเทอร์เน็ตที่วิ่งเข้ามา มาเปิดเปรียบเทียบกับรายการกฎความปลอดภัย เรียงลำดับจาก <strong>ข้อ 1 ลงไปถึงข้อสุดท้าย</strong></p>
                  <p style={{ marginBottom: "6px" }}><strong>2. หยุดตรวจทันทีเมื่อตรงกฎ:</strong> ทันทีที่เจอเงื่อนไขที่ตรงกัน (เช่น บล็อกไอพีคนร้ายในข้อ 1) ระบบจะทำตามคำสั่งนั้นทันที และ <strong>หยุดตรวจสอบกฎข้อถัดไปทั้งหมดทันที</strong></p>
                  <p style={{ marginBottom: "6px" }}><strong>3. บล็อกถ้าไม่เข้าเกณฑ์:</strong> หากเปรียบเทียบกฎจนสุดเล่มแล้วไม่ตรงกับข้อใดเลย จะติดบล็อกของนโยบายเริ่มต้น (Default Policy Deny incoming) ทันที</p>
                  <p style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>👉 <strong>วิธีใช้งาน:</strong> คลิกเลือกส่งแพ็กเก็ตทดสอบในเมนูด้านบนซ้าย เพื่อดูเส้นทางการวิ่งตรวจสอบกฎแบบทีละวินาที</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Nmap Handshake Anim  (week-7b slide type: nmap-handshake-anim)
───────────────────────────────────────────────────────────────────────── */
function NmapHandshakeAnim({ s }: { s: SlideData }) {
  const [scanType, setScanType] = useState<"-sT" | "-sS" | "-sF">("-sS");
  const [portState, setPortState] = useState<"OPEN" | "CLOSED">("OPEN");

  const [animSteps, setAnimSteps] = useState<{ label: string; from: "client" | "server"; desc: string; color: string }[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const handleRunScan = () => {
    setRunning(true);
    setCurrentStep(-1);
    setShowLogs(false);

    // Build steps based on scan type & port state
    let steps: typeof animSteps = [];

    if (scanType === "-sT") {
      // TCP Connect
      if (portState === "OPEN") {
        steps = [
          { label: "SYN", from: "client", color: "#3b82f6", desc: "1️⃣ Nmap ส่ง SYN เริ่มต้นต่อวงจร" },
          { label: "SYN-ACK", from: "server", color: "#8b5cf6", desc: "2️⃣ Server ตอบ SYN-ACK พอร์ตนี้เปิดให้บริการ" },
          { label: "ACK", from: "client", color: "#3b82f6", desc: "3️⃣ Nmap ตอบ ACK — เชื่อมต่อสำเร็จ 3-Way!" },
          { label: "RST", from: "client", color: "#ef4444", desc: "4️⃣ Nmap รีบส่ง RST บังคับตัดการเชื่อมต่อทันที" }
        ];
      } else {
        steps = [
          { label: "SYN", from: "client", color: "#3b82f6", desc: "1️⃣ Nmap ส่ง SYN" },
          { label: "RST-ACK", from: "server", color: "#ef4444", desc: "2️⃣ Server ตอบ RST-ACK พอร์ตปิด ไม่เปิดรับ" }
        ];
      }
    } else if (scanType === "-sS") {
      // SYN Stealth
      if (portState === "OPEN") {
        steps = [
          { label: "SYN", from: "client", color: "#3b82f6", desc: "1️⃣ Nmap ส่ง SYN เริ่มต้นสแกน" },
          { label: "SYN-ACK", from: "server", color: "#8b5cf6", desc: "2️⃣ Server ตอบ SYN-ACK พอร์ตเปิดอยู่" },
          { label: "RST", from: "client", color: "#ef4444", desc: "3️⃣ Nmap สวนทันทีด้วย RST บล็อก 3-Way (Stealth!)" }
        ];
      } else {
        steps = [
          { label: "SYN", from: "client", color: "#3b82f6", desc: "1️⃣ Nmap ส่ง SYN" },
          { label: "RST-ACK", from: "server", color: "#ef4444", desc: "2️⃣ Server สวน RST-ACK พอร์ตปิด" }
        ];
      }
    } else if (scanType === "-sF") {
      // FIN Scan
      if (portState === "OPEN") {
        steps = [
          { label: "FIN", from: "client", color: "#f59e0b", desc: "1️⃣ Nmap ส่ง FIN เดี่ยวๆ (ผิดวิสัยปกติ)" },
          { label: "ไม่มีสัญญาณ", from: "server", color: "rgba(255,255,255,0.3)", desc: "2️⃣ RFC ระบุหากพอร์ตเปิดอยู่ ให้เพิกเฉยทิ้ง" }
        ];
      } else {
        steps = [
          { label: "FIN", from: "client", color: "#f59e0b", desc: "1️⃣ Nmap ส่ง FIN" },
          { label: "RST-ACK", from: "server", color: "#ef4444", desc: "2️⃣ Server ตอบกลับด้วย RST-ACK บอกพอร์ตปิด" }
        ];
      }
    }

    setAnimSteps(steps);
    steps.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        if (i === steps.length - 1) {
          setRunning(false);
          setShowLogs(true);
        }
      }, (i + 1) * 900);
    });
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #090b11 0%, #150606 50%, #090b11 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "14px",
      position: "relative", overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            ระบบเปรียบเทียบการสแกนเครือข่าย
          </span>
          <h2 style={{ margin: "4px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {["-sT", "-sS", "-sF"].map(type => (
            <button key={type} onClick={() => setScanType(type as any)} disabled={running} style={{
              padding: "6px 12px", borderRadius: "8px", border: "none", cursor: running ? "default" : "pointer",
              background: scanType === type ? "#ef4444" : "rgba(255,255,255,0.08)",
              color: "#fff", fontWeight: 700, fontSize: "11px"
            }}>
              {type === "-sT" ? "TCP Connect (-sT)" : type === "-sS" ? "SYN Stealth (-sS)" : "FIN Scan (-sF)"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Left: Controls and Packet Animation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Target port state select */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc" }}>⚙️ สถานะพอร์ตเป้าหมาย:</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {["OPEN", "CLOSED"].map(st => (
                <button key={st} onClick={() => setPortState(st as any)} disabled={running} style={{
                  padding: "5px 12px", borderRadius: "6px", cursor: running ? "default" : "pointer",
                  background: portState === st ? (st === "OPEN" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)") : "rgba(255,255,255,0.05)",
                  color: "#fff", fontWeight: 700, fontSize: "10px",
                  border: portState === st ? `1px solid ${st === "OPEN" ? "#10b981" : "#ef4444"}` : "none"
                }}>{st}</button>
              ))}
            </div>
          </div>

          {/* Play button */}
          <button onClick={handleRunScan} disabled={running} style={{
            padding: "12px", borderRadius: "10px", border: "none", cursor: running ? "wait" : "pointer",
            background: running ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg, #ef4444, #991b1b)",
            color: "#fff", fontWeight: 800, fontSize: "13px"
          }}>
            {running ? "⏳ กำลังสแกนพอร์ต..." : "⚡ รันคำสั่งสแกน Nmap"}
          </button>

          {/* Graphical diagram */}
          <div style={{
            background: "rgba(0,0,0,0.4)", borderRadius: "14px", padding: "16px", flex: 1,
            border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
            justifyContent: "space-between", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "20px" }}>🔭</span>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#6366f1" }}>Nmap Client</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "20px" }}>🖥️</span>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#8b5cf6" }}>Server (:22)</div>
                <div style={{ fontSize: "8px", color: portState === "OPEN" ? "#10b981" : "#ef4444" }}>({portState})</div>
              </div>
            </div>

            {/* Steps output */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "14px 0" }}>
              {animSteps.map((st, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px",
                  background: currentStep >= i ? `${st.color}15` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${currentStep >= i ? st.color + "40" : "rgba(255,255,255,0.05)"}`,
                  opacity: currentStep >= i ? 1 : 0.25,
                  transition: "all 0.3s"
                }}>
                  <span style={{
                    fontSize: "9px", fontWeight: 900, padding: "2px 6px", borderRadius: "4px",
                    background: st.color, color: "#fff"
                  }}>{st.label}</span>
                  <span style={{ fontSize: "10px", color: currentStep >= i ? "#e2e8f0" : "rgba(255,255,255,0.3)" }}>
                    {st.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Technical Explanation & Terminal Logs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Theory card */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: "12px", color: "#a5b4fc", marginBottom: "6px" }}>
              ℹ️ วิธีการวิเคราะห์ของ Nmap
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
              {scanType === "-sT" && (
                <>
                  <strong>TCP Connect Scan (-sT):</strong> รันระบบเชื่อมต่อเต็มลูปโดยดึง API ทั่วไปของ OS มีการจับมือ 3-Way ครบถ้วน
                  <br />🔴 <strong>ข้อเสีย:</strong> ถูกบันทึกประวัติลงใน Application Log ของเซิร์ฟเวอร์ปลายทางทันที (ทิ้งร่องรอย)
                </>
              )}
              {scanType === "-sS" && (
                <>
                  <strong>TCP SYN Stealth Scan (-sS):</strong> ส่งเพียง SYN เพื่อดูการตอบสนอง หากเซิร์ฟเวอร์ตอบกลับ SYN-ACK แสดงว่าพอร์ตเปิด แต่ Nmap จะส่ง RST สวนทันทีเพื่อตัดสาย ทำให้การเชื่อมต่อไม่เสร็จสิ้นสมบูรณ์
                  <br />✅ <strong>ข้อดี:</strong> พอร์ตเปิดแสดงผล open ทันทีโดยแอปพลิเคชันปลายทางไม่เคยรับรู้หรือบันทึกประวัติการเยือน (Stealth)
                </>
              )}
              {scanType === "-sF" && (
                <>
                  <strong>TCP FIN Scan (-sF):</strong> ส่งสัญญาณ FIN ซึ่งเป็นตัวปิดการเชื่อมต่อโดยตรงโดยไม่เคยจับมือก่อน
                  <br />🔍 <strong>หลักการ:</strong> หากพอร์ตปิดอยู่ เซิร์ฟเวอร์จะตอบกลับ RST แต่หากพอร์ตเปิดจะนิ่งเงียบ ช่วยหลีกเลี่ยงการจับตาของไฟร์วอลล์บางค่ายได้
                </>
              )}
            </div>
          </div>

          {/* Simulator Terminal Output */}
          <div style={{
            background: "rgba(5,5,5,0.95)", borderRadius: "14px", padding: "14px", flex: 1,
            border: "1px solid rgba(239,68,68,0.2)", fontFamily: "monospace", fontSize: "10.5px",
            lineHeight: 1.8, whiteSpace: "pre-wrap"
          }}>
            <div style={{ color: "#ef4444", fontWeight: 700, marginBottom: "8px" }}>🖥️ Terminal Logs & Result</div>

            {showLogs ? (
              <>
                <span style={{ color: "#10b981" }}>$ nmap {scanType} -p 22 192.168.1.100</span>
                {"\n"}Starting Nmap 7.92 ( https://nmap.org ) at 2026-06-30
                {"\n"}Nmap scan report for 192.168.1.100
                {"\n"}Host is up (0.00045s latency).
                {"\n"}
                {"\n"}<span style={{ color: "#a5b4fc" }}>PORT   STATE    SERVICE</span>
                {"\n"}22/tcp <span style={{ color: portState === "OPEN" ? "#10b981" : "#ef4444", fontWeight: 700 }}>{portState === "OPEN" ? "open" : "closed"}</span>   ssh
                {"\n"}
                {"\n"}<span style={{ color: "#fbbf24" }}>📝 บันทึกประวัติบนระบบปลายทาง:</span>
                {scanType === "-sT" && portState === "OPEN" ? (
                  <span style={{ color: "#ef4444" }}>{"\n"}⚠️ /var/log/auth.log: Connection from 192.168.1.180 port 22 (Logged!)</span>
                ) : (
                  <span style={{ color: "#10b981" }}>{"\n"}✅ /var/log/auth.log: (ไม่มีประวัติการเชื่อมต่อ - บันทึกไม่พบร่องรอย)</span>
                )}
              </>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.3)" }}>[รอนักศึกษากด "รันคำสั่งสแกน Nmap" เพื่อดึงประวัติเทอร์มินัล]</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UFW LOG ANALYZER  (type: ufw-log-analyzer)
═══════════════════════════════════════════════════════════════ */
function UFWLogAnalyzer({ s }: { s: SlideData }) {
  const fakeLogs = [
    { time: "Jun 30 22:01:03", action: "BLOCK", srcIP: "185.220.101.45", dstPort: "22", proto: "TCP", iface: "eth0", threat: "high" },
    { time: "Jun 30 22:01:07", action: "BLOCK", srcIP: "45.33.32.156", dstPort: "3306", proto: "TCP", iface: "eth0", threat: "high" },
    { time: "Jun 30 22:01:12", action: "ALLOW", srcIP: "192.168.1.150", dstPort: "3306", proto: "TCP", iface: "eth0", threat: "none" },
    { time: "Jun 30 22:01:19", action: "BLOCK", srcIP: "194.165.16.9", dstPort: "80", proto: "TCP", iface: "eth0", threat: "medium" },
    { time: "Jun 30 22:01:25", action: "ALLOW", srcIP: "192.168.1.100", dstPort: "22", proto: "TCP", iface: "eth0", threat: "none" },
    { time: "Jun 30 22:01:31", action: "BLOCK", srcIP: "91.108.4.13", dstPort: "8080", proto: "TCP", iface: "eth0", threat: "medium" },
    { time: "Jun 30 22:01:38", action: "BLOCK", srcIP: "185.220.101.46", dstPort: "22", proto: "TCP", iface: "eth0", threat: "high" },
    { time: "Jun 30 22:01:44", action: "ALLOW", srcIP: "203.0.113.50", dstPort: "80", proto: "TCP", iface: "eth0", threat: "none" },
    { time: "Jun 30 22:01:50", action: "BLOCK", srcIP: "198.20.70.114", dstPort: "23", proto: "TCP", iface: "eth0", threat: "high" },
    { time: "Jun 30 22:01:56", action: "BLOCK", srcIP: "5.188.206.26", dstPort: "5900", proto: "TCP", iface: "eth0", threat: "high" },
  ];
  const [selectedLog, setSelectedLog] = useState<typeof fakeLogs[0] | null>(null);
  const [filter, setFilter] = useState<"ALL" | "BLOCK" | "ALLOW">("ALL");
  const [streaming, setStreaming] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const filtered = fakeLogs.filter(l => filter === "ALL" || l.action === filter);

  const startStream = () => {
    setStreaming(true);
    setVisibleCount(0);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= fakeLogs.length) { clearInterval(iv); setStreaming(false); }
    }, 350);
  };

  const portLabel: Record<string, string> = {
    "22": "SSH (Brute Force?)", "3306": "MariaDB", "80": "HTTP",
    "443": "HTTPS", "8080": "Alt HTTP", "23": "Telnet (อันตราย!)",
    "5900": "VNC Remote Desktop"
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #020617 0%, #0c1a2e 50%, #020617 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#22d3ee", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>🔍 UFW Log Analyzer</div>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(14px, 2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {["ALL", "BLOCK", "ALLOW"].map(f => (
            <button key={f} onClick={() => setFilter(f as any)} style={{
              padding: "5px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700,
              background: filter === f ? (f === "BLOCK" ? "#ef4444" : f === "ALLOW" ? "#10b981" : "#6366f1") : "rgba(255,255,255,0.08)",
              color: "#fff"
            }}>{f}</button>
          ))}
          <button onClick={startStream} disabled={streaming} style={{
            padding: "5px 14px", borderRadius: "6px", border: "none", cursor: streaming ? "wait" : "pointer",
            background: "rgba(34,211,238,0.2)", color: "#22d3ee", fontWeight: 700, fontSize: "11px",
            borderLeft: "2px solid #22d3ee"
          }}>
            {streaming ? "⏺ Streaming..." : "▶ จำลอง tail -f"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "14px", flex: 1, minHeight: 0 }}>
        {/* Log stream */}
        <div style={{
          background: "rgba(0,0,0,0.8)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(34,211,238,0.2)",
          fontFamily: "monospace", fontSize: "10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px"
        }}>
          <div style={{ color: "#22d3ee", marginBottom: "6px", fontSize: "9px" }}>
            $ sudo tail -f /var/log/ufw.log | grep {filter === "ALL" ? "" : filter}
          </div>
          {filtered.slice(0, visibleCount === 0 ? filtered.length : visibleCount).map((log, i) => (
            <div key={i} onClick={() => setSelectedLog(log)} style={{
              display: "flex", gap: "8px", alignItems: "center", padding: "5px 8px", borderRadius: "6px",
              cursor: "pointer",
              background: selectedLog === log ? "rgba(99,102,241,0.2)" : "transparent",
              border: `1px solid ${selectedLog === log ? "#6366f1" : "transparent"}`,
              transition: "all 0.15s",
              animation: streaming ? "fadeIn 0.3s ease-out" : "none"
            }}>
              <span style={{ color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{log.time}</span>
              <span style={{
                fontWeight: 800, padding: "1px 6px", borderRadius: "3px", fontSize: "9px",
                background: log.action === "BLOCK" ? "#ef444433" : "#10b98133",
                color: log.action === "BLOCK" ? "#ef4444" : "#10b981"
              }}>{log.action}</span>
              <span style={{ color: "#a5b4fc" }}>{log.srcIP}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>→ :{log.dstPort}</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>[{log.proto}]</span>
              {log.threat === "high" && <span style={{ color: "#ef4444", fontSize: "9px" }}>🚨 HIGH</span>}
              {log.threat === "medium" && <span style={{ color: "#f59e0b", fontSize: "9px" }}>⚠️ MED</span>}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {selectedLog ? (
            <div style={{
              background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "14px",
              border: `1px solid ${selectedLog.action === "BLOCK" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
              display: "flex", flexDirection: "column", gap: "8px"
            }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: selectedLog.action === "BLOCK" ? "#ef4444" : "#10b981" }}>
                {selectedLog.action === "BLOCK" ? "🚫 ถูกบล็อกกั้น" : "✅ ผ่านอนุญาต"}
              </div>
              {[
                ["เวลา", selectedLog.time],
                ["IP ต้นทาง", selectedLog.srcIP],
                ["พอร์ตปลายทาง", `${selectedLog.dstPort} — ${portLabel[selectedLog.dstPort] || "Unknown"}`],
                ["โปรโตคอล", selectedLog.proto],
                ["Interface", selectedLog.iface],
                ["ระดับภัยคุกคาม", selectedLog.threat.toUpperCase()]
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "14px",
              border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)",
              fontSize: "11px", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              คลิกที่รายการ Log เพื่อดูรายละเอียด
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              { label: "BLOCK ทั้งหมด", val: fakeLogs.filter(l => l.action === "BLOCK").length, color: "#ef4444" },
              { label: "ALLOW ทั้งหมด", val: fakeLogs.filter(l => l.action === "ALLOW").length, color: "#10b981" },
              { label: "ภัย HIGH", val: fakeLogs.filter(l => l.threat === "high").length, color: "#f87171" },
              { label: "พอร์ต SSH", val: fakeLogs.filter(l => l.dstPort === "22").length, color: "#a5b4fc" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px",
                border: "1px solid rgba(255,255,255,0.06)", textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", fontWeight: 900, color: stat.color }}>{stat.val}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FIREWALL ATTACK SIMULATOR  (type: firewall-attack-sim)
═══════════════════════════════════════════════════════════════ */
function FirewallAttackSim({ s }: { s: SlideData }) {
  type AttackType = "brute-force" | "port-scan" | "sql-inject" | "ddos";
  const [activeAttack, setActiveAttack] = useState<AttackType | null>(null);
  const [defenses, setDefenses] = useState({ rateLimitSSH: false, blockRange: false, ufw22: true, ufw80: true, ufw3306: false });
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [packets, setPackets] = useState<{ id: number; x: number; blocked: boolean }[]>([]);

  const attacks = [
    { id: "brute-force" as AttackType, label: "🔨 SSH Brute Force", desc: "ลองรหัสผ่านซ้ำๆ หลายพัน-หมื่นครั้ง", blocked_by: ["rateLimitSSH"], requires: ["ufw22"] },
    { id: "port-scan" as AttackType, label: "🔭 Nmap Port Scan", desc: "สำรวจว่าพอร์ตใดเปิดอยู่บ้าง", blocked_by: [], requires: [] },
    { id: "sql-inject" as AttackType, label: "💉 SQL Injection via DB", desc: "เจาะฐานข้อมูลผ่านพอร์ต 3306", blocked_by: ["ufw3306"], requires: [] },
    { id: "ddos" as AttackType, label: "💥 DDoS HTTP Flood", desc: "ส่ง request จำนวนมากถล่มเซิร์ฟเวอร์", blocked_by: ["blockRange"], requires: ["ufw80"] },
  ];

  const runAttack = (attack: typeof attacks[0]) => {
    if (animating) return;
    setActiveAttack(attack.id);
    setResult(null);
    setAnimating(true);
    setPackets([]);

    // Spawn packet animations
    const pktIds = [1, 2, 3, 4, 5];
    pktIds.forEach((id, i) => {
      setTimeout(() => {
        setPackets(prev => [...prev, { id, x: 0, blocked: false }]);
        // Check if blocked
        const isBlocked = attack.blocked_by.some(d => defenses[d as keyof typeof defenses]);
        setTimeout(() => {
          setPackets(prev => prev.map(p => p.id === id ? { ...p, x: isBlocked ? 45 : 100, blocked: isBlocked } : p));
        }, 300);
      }, i * 200);
    });

    setTimeout(() => {
      const isBlocked = attack.blocked_by.some(d => defenses[d as keyof typeof defenses]);
      const notReachable = attack.requires.length > 0 && !attack.requires.some(d => defenses[d as keyof typeof defenses]);

      if (notReachable) {
        setResult({ success: false, msg: "❌ พอร์ตปิดอยู่ การโจมตีไม่มีเป้าหมาย" });
      } else if (isBlocked) {
        setResult({ success: false, msg: "🛡️ UFW บล็อกสำเร็จ! การโจมตีถูกสกัดกั้น" });
      } else {
        setResult({ success: true, msg: "💀 การโจมตีสำเร็จ! เซิร์ฟเวอร์ถูกเจาะ ต้องเพิ่มการป้องกัน!" });
      }
      setAnimating(false);
    }, 1800);
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #0a0000 0%, #1a0505 50%, #0a0000 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "10px", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>🎮 Attack vs Defense Simulator</div>
        <h2 style={{ margin: "3px 0 0", fontSize: "clamp(14px, 2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", flex: 1, minHeight: 0 }}>
        {/* Attack panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444" }}>⚔️ ฝ่ายโจมตี</div>
          {attacks.map(atk => (
            <button key={atk.id} onClick={() => runAttack(atk)} disabled={animating} style={{
              padding: "10px 12px", borderRadius: "10px", border: `1px solid ${activeAttack === atk.id ? "#ef4444" : "rgba(239,68,68,0.2)"}`,
              background: activeAttack === atk.id ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.03)",
              color: "#fff", textAlign: "left", cursor: animating ? "wait" : "pointer", transition: "all 0.2s"
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>{atk.label}</div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>{atk.desc}</div>
            </button>
          ))}
        </div>

        {/* Network visualization */}
        <div style={{
          background: "rgba(0,0,0,0.5)", borderRadius: "12px", padding: "16px",
          border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center", gap: "16px", position: "relative"
        }}>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", position: "absolute", top: "10px" }}>🌐 INTERNET → 🛡️ UFW → 🖥️ SERVER</div>
          {/* Packet animation area */}
          <div style={{ width: "100%", height: "60px", position: "relative", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
            {packets.map(pkt => (
              <div key={pkt.id} style={{
                position: "absolute", top: `${8 + (pkt.id % 3) * 14}px`,
                left: `${pkt.x}%`, width: "12px", height: "12px", borderRadius: "50%",
                background: pkt.blocked ? "#ef4444" : "#6366f1",
                transition: "left 0.5s ease-out",
                boxShadow: `0 0 6px ${pkt.blocked ? "#ef4444" : "#6366f1"}`
              }} />
            ))}
            {packets.length === 0 && (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>
                เลือกการโจมตีจากด้านซ้าย
              </div>
            )}
          </div>

          {result && (
            <div style={{
              padding: "10px 14px", borderRadius: "10px", textAlign: "center",
              background: result.success ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              border: `1px solid ${result.success ? "#ef4444" : "#10b981"}`,
              fontSize: "11px", fontWeight: 700, animation: "fadeIn 0.3s"
            }}>
              {result.msg}
            </div>
          )}
        </div>

        {/* Defense panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>🛡️ ฝ่ายป้องกัน (UFW Rules)</div>
          {[
            { key: "ufw22", label: "ALLOW Port 22 (SSH)", desc: "เปิดให้เชื่อมต่อ SSH ได้" },
            { key: "ufw80", label: "ALLOW Port 80 (HTTP)", desc: "เปิดให้เข้าเว็บได้" },
            { key: "ufw3306", label: "DENY Port 3306", desc: "ปิด MariaDB จาก outside" },
            { key: "rateLimitSSH", label: "LIMIT SSH (6/30s)", desc: "Rate limit ป้องกัน brute force" },
            { key: "blockRange", label: "DENY from 0.0.0.0/0", desc: "บล็อก IP range อันตราย" },
          ].map(d => (
            <div key={d.key} onClick={() => setDefenses(prev => ({ ...prev, [d.key]: !prev[d.key as keyof typeof prev] }))} style={{
              padding: "8px 12px", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s",
              background: defenses[d.key as keyof typeof defenses] ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${defenses[d.key as keyof typeof defenses] ? "#10b981" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              <span style={{ fontSize: "14px" }}>{defenses[d.key as keyof typeof defenses] ? "✅" : "⬜"}</span>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700 }}>{d.label}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NMAP RECON MISSION  (type: nmap-recon-mission)
═══════════════════════════════════════════════════════════════ */
function NmapReconMission({ s }: { s: SlideData }) {
  const targets = [
    { ip: "192.168.1.10", hostname: "web-server", os: "Ubuntu 22.04", ports: [{ p: 22, state: "open", service: "ssh", ver: "OpenSSH 8.9" }, { p: 80, state: "open", service: "http", ver: "nginx 1.18.0" }, { p: 443, state: "open", service: "https", ver: "nginx 1.18.0" }, { p: 3306, state: "filtered", service: "mysql", ver: "" }] },
    { ip: "192.168.1.20", hostname: "db-server", os: "CentOS 8", ports: [{ p: 22, state: "open", service: "ssh", ver: "OpenSSH 8.0" }, { p: 3306, state: "open", service: "mysql", ver: "MariaDB 10.5.9" }, { p: 8080, state: "open", service: "http-proxy", ver: "Apache 2.4.37" }] },
    { ip: "192.168.1.30", hostname: "old-server", os: "Ubuntu 18.04", ports: [{ p: 21, state: "open", service: "ftp", ver: "vsftpd 3.0.3" }, { p: 22, state: "open", service: "ssh", ver: "OpenSSH 7.6" }, { p: 23, state: "open", service: "telnet", ver: "" }, { p: 80, state: "open", service: "http", ver: "Apache 2.4.29" }] },
  ];

  const [scannedTargets, setScannedTargets] = useState<string[]>([]);
  const [scanning, setScanning] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<typeof targets[0] | null>(null);
  const [findings, setFindings] = useState<string[]>([]);

  const scanTarget = (target: typeof targets[0]) => {
    if (scanning) return;
    setScanning(target.ip);
    setTimeout(() => {
      setScanning(null);
      setScannedTargets(prev => [...prev, target.ip]);
      setSelectedTarget(target);

      const newFindings: string[] = [];
      target.ports.forEach(p => {
        if (p.p === 23) newFindings.push(`🚨 ${target.ip}: Telnet (Port 23) เปิดอยู่ — ส่งข้อมูลแบบ plaintext อันตรายมาก!`);
        if (p.p === 21) newFindings.push(`⚠️ ${target.ip}: FTP (Port 21) เปิดอยู่ — ควรเปลี่ยนเป็น SFTP`);
        if (p.p === 3306 && p.state === "open") newFindings.push(`🚨 ${target.ip}: MariaDB (Port 3306) เปิดสาธารณะ — ต้องปิดด้วย UFW ทันที!`);
        if (p.p === 8080 && p.state === "open") newFindings.push(`⚠️ ${target.ip}: Port 8080 เปิดอยู่ — ตรวจสอบว่าจำเป็นหรือไม่`);
        if (p.ver && p.ver.includes("7.6")) newFindings.push(`⚠️ ${target.ip}: OpenSSH 7.6 เวอร์ชันเก่า มีช่องโหว่ CVE หลายรายการ`);
        if (p.ver && p.ver.includes("2.4.29")) newFindings.push(`⚠️ ${target.ip}: Apache 2.4.29 outdated — ต้อง upgrade`);
      });
      setFindings(prev => [...prev.filter(f => !f.includes(target.ip)), ...newFindings]);
    }, 1500);
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #000a0f 0%, #051a10 50%, #000a0f 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>🔭 Nmap Recon Mission</div>
        <h2 style={{ margin: "3px 0 0", fontSize: "clamp(14px, 2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>
        {/* Target list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>🎯 เป้าหมายในแลน</div>
          {targets.map(t => (
            <div key={t.ip} style={{
              padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
              background: selectedTarget?.ip === t.ip ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${scannedTargets.includes(t.ip) ? "#10b981" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.2s"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{t.ip}</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>{t.hostname} — {t.os}</div>
                </div>
                <button onClick={() => scanTarget(t)} disabled={!!scanning} style={{
                  padding: "4px 10px", borderRadius: "6px", border: "none", cursor: scanning ? "wait" : "pointer",
                  background: scannedTargets.includes(t.ip) ? "rgba(16,185,129,0.2)" : "#10b981",
                  color: "#fff", fontSize: "10px", fontWeight: 700
                }}>
                  {scanning === t.ip ? "⏳..." : scannedTargets.includes(t.ip) ? "✅ แล้ว" : "▶ สแกน"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Scan results */}
        <div style={{
          background: "rgba(0,0,0,0.6)", borderRadius: "12px", padding: "12px",
          border: "1px solid rgba(16,185,129,0.2)", fontFamily: "monospace", fontSize: "9.5px"
        }}>
          <div style={{ color: "#10b981", marginBottom: "8px", fontSize: "10px" }}>
            {selectedTarget ? `nmap -sV ${selectedTarget.ip}` : "เลือกเป้าหมายและกด สแกน"}
          </div>
          {selectedTarget && (
            <>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>Starting Nmap 7.92 ...</div>
              <div>Scan report for {selectedTarget.hostname} ({selectedTarget.ip})</div>
              <div>OS: {selectedTarget.os}</div>
              <div style={{ marginTop: "8px", color: "#a5b4fc" }}>PORT     STATE     SERVICE    VERSION</div>
              {selectedTarget.ports.map(p => (
                <div key={p.p} style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                  <span style={{ width: "50px" }}>{p.p}/tcp</span>
                  <span style={{ width: "60px", color: p.state === "open" ? "#10b981" : p.state === "filtered" ? "#f59e0b" : "#ef4444" }}>
                    {p.state}
                  </span>
                  <span style={{ width: "60px" }}>{p.service}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.ver}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Vulnerability findings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b" }}>📋 ช่องโหว่ที่ค้นพบ</div>
          {findings.length > 0 ? findings.map((f, i) => (
            <div key={i} style={{
              padding: "8px 10px", borderRadius: "8px", fontSize: "10px", lineHeight: 1.5,
              background: f.includes("🚨") ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
              border: `1px solid ${f.includes("🚨") ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`
            }}>
              {f}
            </div>
          )) : (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", marginTop: "20px" }}>
              สแกนเป้าหมายเพื่อค้นหาช่องโหว่
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NETWORK TOPOLOGY ANIMATION  (type: network-topology-anim)
═══════════════════════════════════════════════════════════════ */
function NetworkTopologyAnim({ s }: { s: SlideData }) {
  const [activeFlow, setActiveFlow] = useState<"web" | "ssh" | "db" | "attack" | null>(null);
  const [packetPos, setPacketPos] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);

  const flows = [
    {
      id: "web" as const,
      label: "HTTP Web Traffic",
      color: "#6366f1",
      path: "Client -> Router -> UFW Firewall -> Web Server :80",
      allowed: true,
      points: [
        { x: 10, y: 40, label: "Client" },
        { x: 34, y: 40, label: "Router" },
        { x: 54, y: 40, label: "UFW Firewall" },
        { x: 80, y: 22, label: "Web Server (:80)" }
      ]
    },
    {
      id: "ssh" as const,
      label: "SSH Admin Login",
      color: "#10b981",
      path: "Admin -> UFW Firewall -> SSH Server :22",
      allowed: true,
      points: [
        { x: 92, y: 40, label: "Admin" },
        { x: 54, y: 40, label: "UFW Firewall" },
        { x: 80, y: 22, label: "Web Server (:22)" }
      ]
    },
    {
      id: "db" as const,
      label: "MariaDB Query",
      color: "#f59e0b",
      path: "Web Server -> UFW Firewall -> MariaDB :3306",
      allowed: true,
      points: [
        { x: 80, y: 22, label: "Web Server" },
        { x: 54, y: 40, label: "UFW Firewall" },
        { x: 80, y: 58, label: "MariaDB (:3306)" }
      ]
    },
    {
      id: "attack" as const,
      label: "Hacker Port Scan",
      color: "#ef4444",
      path: "Hacker -> Router -> UFW Firewall (BLOCKED!)",
      allowed: false,
      points: [
        { x: 10, y: 40, label: "Hacker" },
        { x: 34, y: 40, label: "Router" },
        { x: 54, y: 40, label: "UFW Firewall" }
      ]
    }
  ];

  const getPointOnPath = (points: { x: number; y: number }[], progress: number) => {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];
    if (progress <= 0) return points[0];
    if (progress >= 100) return points[points.length - 1];

    const segmentCount = points.length - 1;
    const segmentWidth = 100 / segmentCount;
    const segmentIndex = Math.min(Math.floor(progress / segmentWidth), segmentCount - 1);
    const segmentProgress = (progress % segmentWidth) / segmentWidth;

    const p1 = points[segmentIndex];
    const p2 = points[segmentIndex + 1];

    return {
      x: p1.x + (p2.x - p1.x) * segmentProgress,
      y: p1.y + (p2.y - p1.y) * segmentProgress
    };
  };

  const runFlow = (flow: typeof flows[0]) => {
    if (animating) return;
    setAnimating(true);
    setActiveFlow(flow.id);
    setPacketPos(0);
    setBlocked(false);
    setTerminalLogs([`[SYSTEM] Init flow: ${flow.label}...`]);

    let progress = 0;
    const maxProgress = 100;
    const interval = setInterval(() => {
      progress += 2;
      setPacketPos(progress);

      if (progress === 10) {
        setTerminalLogs(prev => [...prev, `[NETWORK] Dispatching packet from source node: ${flow.points[0].label}`]);
      }
      if (progress === 30 && flow.points.length > 3) {
        setTerminalLogs(prev => [...prev, `[GATEWAY] Packet arrived at Router gateway. Route lookups OK.`]);
      }
      if (progress === 50) {
        setTerminalLogs(prev => [...prev, `[UFW] Intercepted by Stateful Firewall. Evaluating connection state...`]);
      }
      if (progress === 70) {
        if (flow.allowed) {
          setTerminalLogs(prev => [...prev, `[UFW] Rule matched: ALLOW. Traffic allowed.`]);
        } else {
          setTerminalLogs(prev => [...prev, `[UFW] Rule matched: DENY. Dropping incoming packet!`]);
        }
      }

      const ufwStopPoint = flow.id === "attack" ? 68 : null;
      if (ufwStopPoint && progress >= ufwStopPoint) {
        setBlocked(true);
        setPacketPos(ufwStopPoint);
        setTerminalLogs(prev => [...prev, `[SYSTEM] Packet blocked successfully at firewall.`]);
        clearInterval(interval);
        setAnimating(false);
      } else if (progress >= maxProgress) {
        setTerminalLogs(prev => [...prev, `[SYSTEM] Packet reached destination: ${flow.points[flow.points.length - 1].label}`]);
        clearInterval(interval);
        setAnimating(false);
      }
    }, 40);
  };

  const nodes = [
    { id: "internet", label: "Public Net", x: 10, y: 40, color: "#6366f1", desc: "192.168.1.150" },
    { id: "router", label: "Gateway", x: 34, y: 40, color: "#8b5cf6", desc: "192.168.1.1" },
    { id: "ufw", label: "UFW Active", x: 54, y: 40, color: "#f59e0b", desc: "Firewall Node" },
    { id: "web", label: "Nginx Server", x: 80, y: 22, color: "#10b981", desc: "Port 80/443" },
    { id: "db", label: "MariaDB", x: 80, y: 58, color: "#3b82f6", desc: "Port 3306 (Local)" },
    { id: "admin", label: "SSH Client", x: 92, y: 40, color: "#a78bfa", desc: "192.168.1.99" }
  ];

  const curFlow = flows.find(f => f.id === activeFlow);
  const packetCoords = curFlow ? getPointOnPath(curFlow.points, packetPos) : { x: 0, y: 0 };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #090d16 0%, #111827 50%, #030712 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "14px",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none",
        backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px"
      }} />

      <div style={{ flexShrink: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            Network Topology
          </span>
          <h2 style={{ margin: "4px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "16px", flex: 1, minHeight: 0, zIndex: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0 }}>
          <div style={{
            background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "14px",
            border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "8px"
          }}>
            <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 700 }}>เลือกรูปแบบ Traffic เพื่อจำลองการเดินทาง:</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px" }}>
              {flows.map(flow => (
                <button
                  key={flow.id}
                  onClick={() => runFlow(flow)}
                  disabled={animating}
                  style={{
                    padding: "10px 14px", borderRadius: "8px", border: "none", textAlign: "left",
                    background: activeFlow === flow.id
                      ? `linear-gradient(135deg, ${flow.color}33, ${flow.color}11)`
                      : "rgba(255,255,255,0.04)",
                    color: "#fff", fontSize: "12px", cursor: animating ? "default" : "pointer",
                    borderLeft: `4px solid ${activeFlow === flow.id ? flow.color : "transparent"}`,
                    transition: "all 0.2s",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{flow.label}</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>ส่งแพ็กเก็ต</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: "rgba(0,0,0,0.75)", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.2)",
            padding: "14px", flex: 1, display: "flex", flexDirection: "column", gap: "6px", minHeight: 0
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#6366f1", fontWeight: 700 }}>TERMINAL CONSOLE LOGS</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
              </div>
            </div>
            <div style={{
              flex: 1, overflowY: "auto", fontFamily: "monospace", fontSize: "10.5px",
              lineHeight: 1.6, color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px"
            }}>
              {terminalLogs.length > 0 ? (
                terminalLogs.map((log, i) => (
                  <div key={i} style={{
                    color: log.includes("ALLOW") ? "#10b981" : log.includes("DENY") || log.includes("blocked") ? "#ef4444" : "#cbd5e1",
                    fontWeight: log.includes("ALLOW") || log.includes("DENY") ? 700 : 400
                  }}>
                    {log}
                  </div>
                ))
              ) : (
                <span style={{ color: "rgba(255,255,255,0.25)" }}>[ระบบพร้อมจำลองการเชื่อมต่อ]</span>
              )}
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(15,23,42,0.4)", borderRadius: "16px", padding: "20px",
          border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
          position: "relative", minHeight: 0, justifyContent: "space-between"
        }}>
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <svg className="security-diagram-svg" width="100%" height="100%" viewBox="0 0 100 80" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <line x1="10" y1="40" x2="34" y2="40" stroke="url(#lineGrad)" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
              <line x1="34" y1="40" x2="54" y2="40" stroke="url(#lineGrad)" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
              <line x1="54" y1="40" x2="80" y2="22" stroke="url(#lineGrad)" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
              <line x1="54" y1="40" x2="80" y2="58" stroke="url(#lineGrad)" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
              <line x1="80" y1="22" x2="80" y2="58" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="1,1" />
              <line x1="92" y1="40" x2="54" y2="40" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" strokeDasharray="1.5,1.5" />

              {activeFlow && (
                <circle
                  cx={packetCoords.x}
                  cy={packetCoords.y}
                  r="1.8"
                  fill={blocked ? "#ef4444" : curFlow?.color || "#fff"}
                  filter="url(#glow)"
                  style={{ transition: "all 0.05s linear" }}
                />
              )}

              {blocked && (
                <g transform="translate(54, 34)">
                  <circle r="4" fill="#ef4444" opacity="0.25" />
                  <circle r="2.5" fill="#ef4444" />
                  <text y="7" textAnchor="middle" fill="#ef4444" fontSize="3" fontWeight="bold">BLOCKED</text>
                </g>
              )}

              {nodes.map(n => {
                const isActive = curFlow?.points.some(p => p.label.includes(n.label.split(" ")[1] || n.label));
                return (
                  <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                    {isActive && (
                      <rect x="-9" y="-8" width="18" height="13" rx="3"
                        fill="none" stroke={n.color} strokeWidth="1" opacity="0.6" filter="url(#glow)"
                      />
                    )}
                    <rect x="-8" y="-7" width="16" height="11" rx="2"
                      fill="rgba(30,41,59,0.7)"
                      stroke={isActive ? n.color : "rgba(255,255,255,0.08)"}
                      strokeWidth="0.5"
                    />
                    <text y="-2" textAnchor="middle" fill="#fff" fontSize="2.8" fontWeight="bold">
                      {n.label.split(" ")[0]}
                    </text>
                    <text y="1.2" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="2" fontWeight="700">
                      {n.label.split(" ").slice(1).join(" ")}
                    </text>
                    <text y="3.2" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="1.6" fontFamily="monospace">
                      {n.desc}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {curFlow && (
            <div style={{
              padding: "10px 14px", borderRadius: "10px", fontSize: "11.5px", marginTop: "10px",
              background: curFlow.allowed && !blocked ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1.5px solid ${curFlow.allowed && !blocked ? "#10b981" : "#ef4444"}30`,
              fontFamily: "monospace", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span><strong>เส้นทาง:</strong> {curFlow.path}</span>
              <span style={{
                color: curFlow.allowed && !blocked ? "#10b981" : "#ef4444", fontWeight: "bold",
                background: curFlow.allowed && !blocked ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                padding: "2px 8px", borderRadius: "4px"
              }}>
                {blocked ? "🚫 BLOCKED" : packetPos >= 100 ? "✅ SUCCESS" : "⏳ RUNNING"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OSI LAYER DRILL  (type: osi-layer-drill)
═══════════════════════════════════════════════════════════════ */
function OSILayerDrill({ s }: { s: SlideData }) {
  const layers = [
    { n: 7, name: "Application", thai: "แอปพลิเคชัน", color: "#8b5cf6", proto: "HTTP, HTTPS, DNS, SSH, FTP", fw: false, desc: "ส่วนที่ซอฟต์แวร์แอปพลิเคชันสื่อสาร" },
    { n: 6, name: "Presentation", thai: "การนำเสนอ", color: "#6366f1", proto: "SSL/TLS, JPEG, MPEG", fw: false, desc: "แปลงรูปแบบข้อมูล เข้ารหัส/ถอดรหัส" },
    { n: 5, name: "Session", thai: "เซสชัน", color: "#3b82f6", proto: "NetBIOS, PPTP", fw: false, desc: "สร้างและจัดการเซสชันการเชื่อมต่อ" },
    { n: 4, name: "Transport", thai: "การขนส่ง", color: "#0ea5e9", proto: "TCP, UDP", fw: true, desc: "จัดการพอร์ต (UFW ทำงานที่ชั้นนี้!)" },
    { n: 3, name: "Network", thai: "เครือข่าย", color: "#10b981", proto: "IP, ICMP, IPSec", fw: true, desc: "จัดการ IP address และ routing" },
    { n: 2, name: "Data Link", thai: "ข้อมูลลิงก์", color: "#f59e0b", proto: "Ethernet, Wi-Fi, ARP", fw: false, desc: "จัดการ MAC address ในแลน" },
    { n: 1, name: "Physical", thai: "กายภาพ", color: "#ef4444", proto: "สาย Ethernet, Fiber, Wi-Fi สัญญาณ", fw: false, desc: "สายสัญญาณและคลื่นวิทยุจริงๆ" },
  ];

  const [selected, setSelected] = useState<typeof layers[0] | null>(null);
  const [quiz, setQuiz] = useState<{ q: string; ans: number; options: string[] } | null>(null);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);

  const quizzes = [
    { q: "UFW Firewall ทำงานอยู่ในชั้น OSI ใดเป็นหลัก?", ans: 4, options: ["Layer 7 — Application", "Layer 5 — Session", "Layer 4 — Transport", "Layer 2 — Data Link"] },
    { q: "TCP และ UDP อยู่ในชั้น OSI ใด?", ans: 4, options: ["Layer 3 — Network", "Layer 4 — Transport", "Layer 5 — Session", "Layer 6 — Presentation"] },
    { q: "IP Address เป็นส่วนหนึ่งของชั้น OSI ใด?", ans: 3, options: ["Layer 2 — Data Link", "Layer 3 — Network", "Layer 4 — Transport", "Layer 1 — Physical"] },
  ];

  const startQuiz = () => {
    const q = quizzes[Math.floor(Math.random() * quizzes.length)];
    setQuiz(q);
    setQuizResult(null);
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(180deg, #0a0020 0%, #0d1b2a 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "10px"
    }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>📚 OSI Model Interactive</div>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(14px, 2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <button onClick={startQuiz} style={{
          padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
          background: "rgba(99,102,241,0.3)", color: "#a5b4fc", fontWeight: 700, fontSize: "11px"
        }}>🎯 ทดสอบความเข้าใจ</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>
        {/* OSI stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", justifyContent: "center" }}>
          {layers.map(layer => (
            <div key={layer.n} onClick={() => setSelected(selected?.n === layer.n ? null : layer)} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px",
              cursor: "pointer", transition: "all 0.2s",
              background: selected?.n === layer.n ? layer.color + "25" : layer.fw ? layer.color + "10" : "rgba(255,255,255,0.03)",
              border: `1px solid ${selected?.n === layer.n ? layer.color : layer.fw ? layer.color + "50" : "rgba(255,255,255,0.06)"}`,
            }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: layer.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, flexShrink: 0 }}>
                {layer.n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 700 }}>{layer.name} <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "9px" }}>({layer.thai})</span></div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>{layer.proto}</div>
              </div>
              {layer.fw && <span style={{ fontSize: "10px", background: "#f59e0b33", color: "#f59e0b", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>UFW</span>}
            </div>
          ))}
        </div>

        {/* Detail / Quiz panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {selected && !quiz && (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "16px", border: `1px solid ${selected.color}40`, flex: 1 }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: selected.color }}>Layer {selected.n}</div>
              <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px" }}>{selected.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "8px", lineHeight: 1.6 }}>{selected.desc}</div>
              <div style={{ marginTop: "12px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "10px", fontFamily: "monospace", fontSize: "11px" }}>
                <div style={{ color: selected.color, marginBottom: "4px" }}>โปรโตคอลหลัก:</div>
                {selected.proto}
              </div>
              {selected.fw && (
                <div style={{ marginTop: "8px", background: "rgba(245,158,11,0.1)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(245,158,11,0.3)", fontSize: "11px" }}>
                  🛡️ UFW (Uncomplicated Firewall) ตรวจสอบ IP address (L3) และ Port/Protocol (L4) เพื่อตัดสินใจ ALLOW หรือ DENY
                </div>
              )}
            </div>
          )}
          {quiz && (
            <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(99,102,241,0.3)", flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "12px", lineHeight: 1.5 }}>❓ {quiz.q}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {quiz.options.map((opt, i) => {
                  const layerN = parseInt(opt.split("Layer ")[1]);
                  const isCorrect = layerN === quiz.ans;
                  return (
                    <button key={i} onClick={() => setQuizResult(isCorrect)} style={{
                      padding: "8px 12px", borderRadius: "8px", border: "1px solid",
                      borderColor: quizResult !== null ? (isCorrect ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.1)",
                      background: quizResult !== null ? (isCorrect ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.04)",
                      color: "#fff", cursor: "pointer", textAlign: "left", fontSize: "11px"
                    }}>{opt}</button>
                  );
                })}
              </div>
              {quizResult !== null && (
                <div style={{ marginTop: "10px", fontSize: "12px", fontWeight: 700, color: quizResult ? "#10b981" : "#ef4444" }}>
                  {quizResult ? "✅ ถูกต้อง!" : "❌ ลองใหม่อีกครั้ง"}
                </div>
              )}
              <button onClick={() => { setQuiz(null); setQuizResult(null); }} style={{
                marginTop: "8px", padding: "5px 12px", borderRadius: "6px", border: "none",
                background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "10px"
              }}>← กลับไปดู OSI Layers</button>
            </div>
          )}
          {!selected && !quiz && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center" }}>
              คลิกที่ชั้น OSI เพื่อดูรายละเอียด<br />หรือกดปุ่มทดสอบ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TCP STATE MACHINE  (type: tcp-state-machine)
═══════════════════════════════════════════════════════════════ */
function TCPStateMachine({ s }: { s: SlideData }) {
  const states = [
    { id: "CLOSED", x: 50, y: 5, color: "#ef4444" },
    { id: "LISTEN", x: 80, y: 20, color: "#f59e0b" },
    { id: "SYN_SENT", x: 15, y: 30, color: "#6366f1" },
    { id: "SYN_RCVD", x: 80, y: 45, color: "#8b5cf6" },
    { id: "ESTABLISHED", x: 45, y: 55, color: "#10b981" },
    { id: "FIN_WAIT_1", x: 15, y: 70, color: "#0ea5e9" },
    { id: "CLOSE_WAIT", x: 80, y: 70, color: "#f97316" },
    { id: "TIME_WAIT", x: 15, y: 90, color: "#a78bfa" },
  ];

  const [activeState, setActiveState] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState(-1);
  const demoSequence = ["CLOSED", "SYN_SENT", "ESTABLISHED", "FIN_WAIT_1", "TIME_WAIT", "CLOSED"];

  const runDemo = () => {
    setDemoStep(0);
    setActiveState(demoSequence[0]);
    demoSequence.forEach((state, i) => {
      setTimeout(() => {
        setActiveState(state);
        setDemoStep(i);
      }, i * 1000);
    });
  };

  const stateInfo: Record<string, { desc: string; trigger: string }> = {
    CLOSED: { desc: "ไม่มีการเชื่อมต่อ — สถานะเริ่มต้น", trigger: "ไม่มี" },
    LISTEN: { desc: "เซิร์ฟเวอร์รอรับ SYN จาก Client", trigger: "passive open (server bind)" },
    SYN_SENT: { desc: "Client ส่ง SYN และรอ SYN-ACK", trigger: "active open (client connect)" },
    SYN_RCVD: { desc: "Server ได้รับ SYN แล้วส่ง SYN-ACK รอ ACK", trigger: "ได้รับ SYN" },
    ESTABLISHED: { desc: "🎉 เชื่อมต่อสำเร็จ! ส่งข้อมูลได้ปกติ", trigger: "ได้รับ ACK (3-Way Handshake เสร็จสิ้น)" },
    FIN_WAIT_1: { desc: "Client ส่ง FIN เริ่มกระบวนการปิดการเชื่อมต่อ", trigger: "active close" },
    CLOSE_WAIT: { desc: "Server ได้รับ FIN ส่ง ACK และรอส่ง FIN ของตัวเอง", trigger: "ได้รับ FIN" },
    TIME_WAIT: { desc: "รอ 2MSL เพื่อให้แน่ใจว่าแพ็กเก็ตที่ค้างในเครือข่ายหายหมดแล้ว", trigger: "ได้รับ FIN+ACK" },
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #000814, #001d3d)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "10px"
    }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#0ea5e9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>🔄 TCP State Machine</div>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(14px, 2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <button onClick={runDemo} style={{
          padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
          background: "rgba(14,165,233,0.3)", color: "#0ea5e9", fontWeight: 700, fontSize: "11px"
        }}>▶ จำลอง Client Connect</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>
        {/* State diagram */}
        <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(14,165,233,0.2)", position: "relative" }}>
          <svg className="security-diagram-svg" width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: "visible" }}>
            {states.map(state => {
              const isActive = activeState === state.id;
              const isDemoPath = demoSequence.includes(state.id);
              return (
                <g key={state.id} onClick={() => setActiveState(state.id)} style={{ cursor: "pointer" }}>
                  <ellipse cx={state.x} cy={state.y} rx="12" ry="5"
                    fill={isActive ? state.color + "55" : state.color + "22"}
                    stroke={isActive ? state.color : state.color + "88"}
                    strokeWidth={isActive ? "1" : "0.5"}
                    style={{ filter: isActive ? `drop-shadow(0 0 4px ${state.color})` : "none", transition: "all 0.3s" }}
                  />
                  <text x={state.x} y={state.y + 0.8} textAnchor="middle" fill={isActive ? "#fff" : state.color}
                    fontSize="3" fontWeight={isActive ? "bold" : "normal"} style={{ transition: "all 0.3s" }}>
                    {state.id.replace("_", "\n")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* State detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {activeState && stateInfo[activeState] ? (
            <div style={{
              background: "rgba(14,165,233,0.08)", borderRadius: "12px", padding: "16px",
              border: "1px solid rgba(14,165,233,0.3)"
            }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: states.find(s => s.id === activeState)?.color, fontFamily: "monospace" }}>
                {activeState}
              </div>
              <div style={{ fontSize: "11px", marginTop: "8px", lineHeight: 1.6 }}>{stateInfo[activeState].desc}</div>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>
                Trigger: {stateInfo[activeState].trigger}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
              คลิกที่สถานะเพื่อดูรายละเอียด
            </div>
          )}

          {/* ss -tulpn output */}
          <div style={{ background: "rgba(0,0,0,0.7)", borderRadius: "10px", padding: "12px", fontFamily: "monospace", fontSize: "9.5px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: "#10b981", marginBottom: "6px" }}>$ ss -tulpn | grep ESTABLISHED</div>
            <div style={{ color: "rgba(255,255,255,0.6)" }}>tcp ESTAB 0.0.0.0:22 192.168.1.5:54321 (sshd)</div>
            <div style={{ color: "rgba(255,255,255,0.6)" }}>tcp ESTAB 0.0.0.0:80 203.0.113.10:45678 (nginx)</div>
            <div style={{ color: "rgba(255,255,255,0.3)", marginTop: "6px", fontSize: "8px" }}>→ สถานะ ESTABLISHED = มีการเชื่อมต่อ TCP ที่กำลังใช้งานอยู่จริง</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBNETTING CALCULATOR  (type: subnetting-calculator)
═══════════════════════════════════════════════════════════════ */
function SubnettingCalculator({ s }: { s: SlideData }) {
  const [ip, setIp] = useState("192.168.1.0");
  const [prefix, setPrefix] = useState(24);
  const [calc, setCalc] = useState<{ network: string; broadcast: string; first: string; last: string; hosts: number; mask: string } | null>(null);

  const calculate = () => {
    try {
      const parts = ip.split(".").map(Number);
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return;

      const maskBits = 0xFFFFFFFF << (32 - prefix);
      const ipInt = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      const networkInt = ipInt & maskBits;
      const broadcastInt = networkInt | (~maskBits & 0xFFFFFFFF);
      const firstInt = networkInt + 1;
      const lastInt = broadcastInt - 1;
      const hosts = Math.pow(2, 32 - prefix) - 2;

      const intToIp = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
      const maskToStr = (bits: number) => intToIp(bits >>> 0);

      setCalc({
        network: intToIp(networkInt >>> 0),
        broadcast: intToIp(broadcastInt >>> 0),
        first: intToIp(firstInt >>> 0),
        last: intToIp(lastInt >>> 0),
        hosts: Math.max(0, hosts),
        mask: maskToStr(maskBits)
      });
    } catch { }
  };

  const presets = [
    { ip: "192.168.1.0", prefix: 24, label: "/24 — คลาส C ทั่วไป" },
    { ip: "10.0.0.0", prefix: 8, label: "/8 — คลาส A ใหญ่" },
    { ip: "172.16.0.0", prefix: 16, label: "/16 — คลาส B กลาง" },
    { ip: "192.168.1.0", prefix: 28, label: "/28 — แลนขนาดเล็ก 14 hosts" },
  ];

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #050f1a, #0a1f33)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>🧮 Subnetting Calculator</div>
        <h2 style={{ margin: "3px 0 0", fontSize: "clamp(14px, 2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", flex: 1, minHeight: 0 }}>
        {/* Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ background: "rgba(59,130,246,0.08)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "10px", color: "#93c5fd" }}>📥 ป้อน IP / Prefix</div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
              <input
                value={ip} onChange={e => setIp(e.target.value)}
                style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "6px", padding: "7px 10px", color: "#fff", fontFamily: "monospace", fontSize: "13px" }}
              />
              <span style={{ color: "#93c5fd", fontWeight: 700 }}>/</span>
              <input
                type="number" min="1" max="30" value={prefix}
                onChange={e => setPrefix(parseInt(e.target.value))}
                style={{ width: "48px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "6px", padding: "7px 8px", color: "#fff", fontFamily: "monospace", fontSize: "13px", textAlign: "center" }}
              />
            </div>
            <button onClick={calculate} style={{
              width: "100%", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", fontWeight: 800, fontSize: "13px"
            }}>🧮 คำนวณ Subnetting</button>
          </div>

          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>💡 ตัวอย่างที่ใช้บ่อย</div>
          {presets.map(p => (
            <button key={p.label} onClick={() => { setIp(p.ip); setPrefix(p.prefix); }} style={{
              padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(59,130,246,0.2)",
              background: "rgba(255,255,255,0.03)", color: "#fff", cursor: "pointer", textAlign: "left", fontSize: "11px"
            }}>
              <span style={{ fontFamily: "monospace", color: "#93c5fd" }}>{p.ip}/{p.prefix}</span> — {p.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {calc ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Network Address", val: `${calc.network}/${prefix}`, color: "#3b82f6" },
              { label: "Subnet Mask", val: calc.mask, color: "#8b5cf6" },
              { label: "First Usable Host", val: calc.first, color: "#10b981" },
              { label: "Last Usable Host", val: calc.last, color: "#10b981" },
              { label: "Broadcast Address", val: calc.broadcast, color: "#ef4444" },
              { label: "Usable Hosts", val: calc.hosts.toLocaleString() + " เครื่อง", color: "#f59e0b" },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 14px",
                border: `1px solid ${item.color}30`
              }}>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: item.color, fontSize: "13px" }}>{item.val}</span>
              </div>
            ))}

            {/* Binary visualization */}
            <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "10px", fontFamily: "monospace", fontSize: "9px" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Subnet Mask (binary):</div>
              <div>
                {Array(32).fill(0).map((_, i) => (
                  <span key={i} style={{ color: i < prefix ? "#3b82f6" : "rgba(255,255,255,0.3)", fontWeight: i < prefix ? 700 : 400 }}>
                    {i < prefix ? "1" : "0"}
                    {(i + 1) % 8 === 0 && i < 31 ? "." : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center" }}>
            กรอก IP Address และ Prefix<br />แล้วกดคำนวณ
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SERVICE HARDENING QUIZ  (type: service-hardening-quiz)
═══════════════════════════════════════════════════════════════ */
function ServiceHardeningQuiz({ s }: { s: SlideData }) {
  const scenarios = [
    {
      title: "สถานการณ์ที่ 1: เซิร์ฟเวอร์ใหม่เพิ่งติดตั้ง",
      desc: "ผลสแกน ss -tulpn พบ: SSH :22, HTTP :80, MariaDB :3306 (0.0.0.0), Telnet :23 ทุกอันผูกกับ 0.0.0.0",
      question: "คุณจะทำอะไรก่อนเป็นอันดับแรก?",
      options: [
        "เปิด UFW และ block port 3306 กับ 23 ก่อน",
        "เปิด UFW โดยไม่ทำอะไรก่อน",
        "ปิด Telnet service แล้วค่อยตั้งค่า UFW",
        "ลบ MariaDB ออกก่อน",
      ],
      correct: 0,
      explanation: "ต้องเปิด UFW และ block พอร์ตอันตราย (3306, 23) ก่อน เพราะทั้งสองเปิดสาธารณะอยู่ แต่จำไว้ว่าต้อง allow 22 ก่อน enable UFW!"
    },
    {
      title: "สถานการณ์ที่ 2: พบ Port 8080 เปิดอยู่",
      desc: "Nmap สแกนเซิร์ฟเวอร์เพื่อนพบ Port 8080 ขึ้นเป็น open — service: http-alt",
      question: "ควรทำอะไรกับพอร์ตนี้?",
      options: [
        "ปล่อยไว้ เป็นพอร์ตเว็บปกติ",
        "ถามเจ้าของเซิร์ฟเวอร์ว่าใช้งานจริงหรือไม่ก่อน",
        "Block ทันทีไม่ต้องถาม",
        "Ignore — ไม่เกี่ยวกับงาน",
      ],
      correct: 1,
      explanation: "ต้องถามก่อนเสมอ! อาจเป็น development server ที่จำเป็น หากไม่ใช้จริงค่อย block ด้วย UFW"
    },
    {
      title: "สถานการณ์ที่ 3: SSH ถูก Brute Force",
      desc: "/var/log/auth.log แสดง Failed password จาก IP 185.x.x.x กว่า 500 ครั้งในชั่วโมงเดียว",
      question: "วิธีป้องกันที่ดีที่สุดคืออะไร?",
      options: [
        "sudo ufw deny 22 — ปิด SSH เลย",
        "sudo ufw limit 22/tcp — Rate limit SSH",
        "เปลี่ยน password ให้ยากขึ้น",
        "Reboot เซิร์ฟเวอร์",
      ],
      correct: 1,
      explanation: "`ufw limit 22/tcp` บล็อก IP ที่ลองเกิน 6 ครั้งใน 30 วินาทีโดยอัตโนมัติ ดีกว่าปิด SSH เพราะยังเข้าถึงได้ปกติ"
    },
  ];

  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number[]>([]);

  const scenario = scenarios[currentScenario];

  const handleAnswer = (idx: number) => {
    if (answered.includes(currentScenario)) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    setAnswered(prev => [...prev, currentScenario]);
    if (idx === scenario.correct) setScore(prev => prev + 1);
  };

  const next = () => {
    setCurrentScenario(prev => Math.min(prev + 1, scenarios.length - 1));
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #0d0d0d, #1a1a2e)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>🛡️ Security Hardening Quiz</div>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(14px, 2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b" }}>คะแนน: {score}/{answered.length || "—"}</div>
          <div style={{ display: "flex", gap: "4px" }}>
            {scenarios.map((_, i) => (
              <div key={i} onClick={() => { setCurrentScenario(i); setSelectedAnswer(null); setShowExplanation(false); }} style={{
                width: "20px", height: "8px", borderRadius: "3px", cursor: "pointer",
                background: i === currentScenario ? "#f59e0b" : answered.includes(i) ? (selectedAnswer === scenarios[i].correct ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.15)"
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Scenario card */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: "14px", padding: "14px", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#f59e0b", marginBottom: "6px" }}>📋 {scenario.title}</div>
          <div style={{ fontSize: "11px", lineHeight: 1.6, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "10px", fontFamily: "monospace", marginBottom: "8px" }}>
            {scenario.desc}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>❓ {scenario.question}</div>
        </div>

        {/* Options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {scenario.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === scenario.correct;
            const showResult = showExplanation;
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered.includes(currentScenario)} style={{
                padding: "12px 14px", borderRadius: "10px", textAlign: "left", cursor: "pointer", fontSize: "11px", lineHeight: 1.5,
                border: `1px solid ${showResult ? (isCorrect ? "#10b981" : isSelected ? "#ef4444" : "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.1)"}`,
                background: showResult ? (isCorrect ? "rgba(16,185,129,0.15)" : isSelected ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.03)") : "rgba(255,255,255,0.04)",
                color: "#fff", transition: "all 0.2s",
                fontWeight: isSelected ? 700 : 400
              }}>
                <span style={{ color: showResult ? (isCorrect ? "#10b981" : "rgba(255,255,255,0.4)") : "#f59e0b", marginRight: "8px", fontWeight: 800 }}>
                  {showResult ? (isCorrect ? "✅" : isSelected ? "❌" : `${i + 1}.`) : `${i + 1}.`}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div style={{ background: "rgba(99,102,241,0.1)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(99,102,241,0.3)", animation: "fadeIn 0.3s" }}>
            <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "11px", color: "#a5b4fc" }}>💡 คำอธิบาย:</div>
            <div style={{ fontSize: "11px", lineHeight: 1.6 }}>{scenario.explanation}</div>
            {currentScenario < scenarios.length - 1 && (
              <button onClick={next} style={{ marginTop: "8px", padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: "11px" }}>
                โจทย์ถัดไป →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FIREWALL SIMPLE EXPLAINER  (type: ufw-netfilter-arch)
   ─────────────────────────────────────────────────────────────────────────── */
function UFWNetfilterArchitecture({ s }: { s: SlideData }) {
  const [activePort, setActivePort] = useState<string | null>(null);

  const ports = [
    {
      id: "web",
      port: "80 / 443",
      label: "เว็บไซต์",
      icon: "🌐",
      color: "#10b981",
      borderColor: "#10b98140",
      status: "ALLOW",
      statusColor: "#10b981",
      desc: "พอร์ตเว็บ (80 = HTTP, 443 = HTTPS) — เปิดให้คนทั่วไปเข้าชมเว็บไซต์ได้",
      cmd: "sudo ufw allow 80/tcp\nsudo ufw allow 443/tcp",
      analogy: "📖 คล้ายประตูหน้าคอนโดที่เปิดรับแขกสาธารณะเข้าชมห้องตัวอย่าง"
    },
    {
      id: "ssh",
      port: "22",
      label: "SSH (จัดการระบบ)",
      icon: "🔑",
      color: "#f59e0b",
      borderColor: "#f59e0b40",
      status: "LIMIT",
      statusColor: "#f59e0b",
      desc: "พอร์ต SSH (22) — ให้แอดมินเชื่อมต่อจัดการระบบจากระยะไกลได้ แต่จำกัดการเดารหัสผ่าน",
      cmd: "sudo ufw limit 22/tcp",
      analogy: "🔐 คล้ายประตูห้องทำงานแอดมิน: พนักงานผ่านได้ แต่เดารหัสผิด 6 ครั้งโดนล็อค"
    },
    {
      id: "db",
      port: "3306",
      label: "ฐานข้อมูล (MariaDB)",
      icon: "🗄️",
      color: "#ef4444",
      borderColor: "#ef444440",
      status: "DENY",
      statusColor: "#ef4444",
      desc: "พอร์ตฐานข้อมูล (3306) — บล็อกคนนอกทั้งหมด เปิดเฉพาะ IP เพื่อนร่วมระบบ",
      cmd: "sudo ufw deny 3306/tcp\nsudo ufw allow from 192.168.1.x to any port 3306",
      analogy: "🏦 คล้ายห้องนิรภัยธนาคาร: ปิดถาวร เข้าได้เฉพาะคนที่ลงทะเบียนไว้"
    },
    {
      id: "other",
      port: "อื่นๆ ทั้งหมด",
      label: "พอร์ตที่ไม่ได้ลงทะเบียน",
      icon: "🚫",
      color: "#64748b",
      borderColor: "#64748b40",
      status: "DEFAULT DENY",
      statusColor: "#ef4444",
      desc: "พอร์ตอื่นๆ ที่ไม่ได้เขียนกฎอนุญาตไว้ — UFW บล็อกให้อัตโนมัติทุกพอร์ต",
      cmd: "sudo ufw default deny incoming",
      analogy: "🚧 กฎเหล็กเริ่มต้น: ห้ามเข้าทุกประตูหากไม่มีชื่ออยู่ในสมุดบัญชีกฎ"
    }
  ];

  const selected = ports.find(p => p.id === activePort);

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #0a0f1e 0%, #1a1a3e 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "14px"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          Firewall คืออะไร?
        </span>
        <h2 style={{ margin: "4px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flex: 1, minHeight: 0 }}>

        {/* LEFT — Visual Diagram */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Simple flow diagram */}
          <div style={{
            background: "rgba(0,0,0,0.4)", borderRadius: "16px", padding: "20px",
            border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "14px"
          }}>
            <div style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: 700, textAlign: "center" }}>
              🗺️ เส้นทางทราฟฟิกผ่านไฟร์วอลล์ (คลิกพอร์ตด้านล่างเพื่อดูรายละเอียด)
            </div>

            {/* Internet → Firewall → Server flow */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Internet box */}
              <div style={{
                background: "rgba(99,102,241,0.15)", borderRadius: "12px", padding: "12px 16px",
                border: "1.5px solid #6366f1", textAlign: "center", minWidth: "80px"
              }}>
                <div style={{ fontSize: "22px" }}>🌍</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", marginTop: "4px" }}>อินเทอร์เน็ต</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>คนแปลกหน้า/คนร้าย</div>
              </div>

              {/* Arrow in */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <div style={{ color: "#ef4444", fontSize: "9px", fontWeight: 700 }}>ทราฟฟิกขาเข้า</div>
                <div style={{ fontSize: "18px", color: "#94a3b8" }}>→</div>
              </div>

              {/* Firewall box */}
              <div style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(99,102,241,0.2))",
                borderRadius: "14px", padding: "14px 20px",
                border: "2px solid #818cf8", textAlign: "center", minWidth: "100px",
                boxShadow: "0 0 20px rgba(99,102,241,0.3)"
              }}>
                <div style={{ fontSize: "26px" }}>🛡️</div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#c7d2fe", marginTop: "4px" }}>UFW Firewall</div>
                <div style={{ fontSize: "9px", color: "#818cf8" }}>รปภ. คัดกรองพอร์ต</div>
              </div>

              {/* Arrow out */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <div style={{ color: "#10b981", fontSize: "9px", fontWeight: 700 }}>ที่ผ่านอนุมัติ</div>
                <div style={{ fontSize: "18px", color: "#94a3b8" }}>→</div>
              </div>

              {/* Server box */}
              <div style={{
                background: "rgba(16,185,129,0.15)", borderRadius: "12px", padding: "12px 16px",
                border: "1.5px solid #10b981", textAlign: "center", minWidth: "80px"
              }}>
                <div style={{ fontSize: "22px" }}>🖥️</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6ee7b7", marginTop: "4px" }}>เซิร์ฟเวอร์</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>ภายในคอนโด</div>
              </div>
            </div>

            {/* Port Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {ports.map(p => (
                <div
                  key={p.id}
                  onClick={() => setActivePort(activePort === p.id ? null : p.id)}
                  style={{
                    padding: "8px 10px", borderRadius: "10px", cursor: "pointer",
                    background: activePort === p.id ? `${p.color}22` : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${activePort === p.id ? p.color : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#e2e8f0" }}>Port {p.port}</div>
                    <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.5)", marginTop: "1px" }}>{p.label}</div>
                  </div>
                  <span style={{
                    fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px",
                    background: `${p.statusColor}22`, color: p.statusColor, border: `1px solid ${p.statusColor}44`
                  }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Explanation Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {selected ? (
            /* Detailed view for selected port */
            <div style={{
              background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "18px",
              border: `1.5px solid ${selected.color}66`, flex: 1, display: "flex", flexDirection: "column", gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>{selected.icon}</span>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#e2e8f0" }}>Port {selected.port}</div>
                  <div style={{ fontSize: "11px", color: selected.statusColor, fontWeight: 700 }}>สถานะ: {selected.status}</div>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.7 }}>{selected.desc}</div>
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "12px", fontFamily: "monospace", fontSize: "11px" }}>
                <div style={{ color: "#94a3b8", marginBottom: "6px", fontSize: "9px" }}>📋 คำสั่ง UFW ที่ใช้:</div>
                <pre style={{ color: "#6ee7b7", margin: 0, whiteSpace: "pre-wrap" }}>{selected.cmd}</pre>
              </div>
              <div style={{
                background: `${selected.color}15`, borderRadius: "10px", padding: "12px",
                border: `1px solid ${selected.color}33`, fontSize: "11.5px", color: "#e2e8f0", lineHeight: 1.6
              }}>
                {selected.analogy}
              </div>
            </div>
          ) : (
            /* Default overview when nothing selected */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <div style={{
                background: "rgba(99,102,241,0.1)", borderRadius: "16px", padding: "18px",
                border: "1.5px solid rgba(99,102,241,0.3)"
              }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#a5b4fc", marginBottom: "10px" }}>
                  🛡️ Firewall คืออะไร?
                </div>
                <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.8 }}>
                  <p style={{ marginBottom: "8px" }}>
                    <strong style={{ color: "#818cf8" }}>Firewall</strong> คือ &ldquo;รปภ. ประจำคอนโด&rdquo; ที่ยืนเฝ้าประตูทุกบานของเซิร์ฟเวอร์ตลอด 24 ชั่วโมง
                  </p>
                  <p style={{ marginBottom: "8px" }}>
                    ทุกครั้งที่มีสัญญาณเน็ตวิ่งเข้ามา รปภ. จะดู <strong style={{ color: "#f59e0b" }}>พอร์ตปลายทาง</strong> แล้วเปิดสมุดกฎตรวจว่า &ldquo;พอร์ตนี้ลงทะเบียนไว้ไหม?&rdquo;
                  </p>
                  <p>
                    ถ้าไม่มีชื่ออยู่ในสมุด → <strong style={{ color: "#ef4444" }}>บล็อกทันที</strong> ไม่มีข้อยกเว้น
                  </p>
                </div>
              </div>

              <div style={{
                background: "rgba(16,185,129,0.08)", borderRadius: "14px", padding: "14px",
                border: "1px solid rgba(16,185,129,0.25)", fontSize: "12px", color: "#cbd5e1", lineHeight: 1.7
              }}>
                <div style={{ fontWeight: 800, color: "#10b981", marginBottom: "8px" }}>💡 UFW ย่อมาจากอะไร?</div>
                <p style={{ marginBottom: "6px" }}><strong>UFW = Uncomplicated Firewall</strong></p>
                <p>เป็นโปรแกรมบน Ubuntu/Linux ที่ออกแบบมาให้ใช้งานง่าย พิมพ์คำสั่งสั้นๆ แทนการต้องจัดการ iptables ที่ซับซ้อน</p>
              </div>

              <div style={{
                background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px",
                border: "1px solid rgba(255,255,255,0.07)", fontSize: "11px", color: "rgba(255,255,255,0.5)",
                textAlign: "center"
              }}>
                👆 คลิกการ์ดพอร์ตทางซ้ายเพื่อดูตัวอย่างการตั้งค่ากฎความปลอดภัยแต่ละพอร์ต
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Speaker Notes strip */}
      {s.speakerNotes && (
        <div style={{
          flexShrink: 0, background: "rgba(255,255,255,0.03)", borderRadius: "10px",
          padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)",
          fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "flex", gap: "8px", alignItems: "flex-start"
        }}>
          <span style={{ flexShrink: 0, color: "#6366f1" }}>📝 บันทึกครู:</span>
          <span>{s.speakerNotes}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   STATEFUL CONNECTION TRACKING  (type: stateful-conn-tracking)
───────────────────────────────────────────────────────────────────────── */
interface Connection {
  proto: string;
  srcIP: string;
  srcPort: number;
  dstIP: string;
  dstPort: number;
  state: "NEW" | "ESTABLISHED" | "RELATED";
}

function StatefulConnectionTracking({ s }: { s: SlideData }) {
  const [conns, setConns] = useState<Connection[]>([
    { proto: "tcp", srcIP: "192.168.1.50", srcPort: 49512, dstIP: "192.168.1.100", dstPort: 80, state: "ESTABLISHED" },
    { proto: "tcp", srcIP: "192.168.1.60", srcPort: 52110, dstIP: "192.168.1.100", dstPort: 22, state: "ESTABLISHED" }
  ]);

  const [activeStep, setActiveStep] = useState<string | null>(null);

  const simulateStep = (type: "new_syn" | "reply" | "ftp_data") => {
    if (type === "new_syn") {
      setActiveStep("new_syn");
      // Add NEW connection
      const newConn: Connection = { proto: "tcp", srcIP: "192.168.1.75", srcPort: 51220, dstIP: "192.168.1.100", dstPort: 80, state: "NEW" };
      setConns(prev => [...prev.filter(c => c.srcIP !== "192.168.1.75"), newConn]);
    } else if (type === "reply") {
      setActiveStep("reply");
      // Promote NEW to ESTABLISHED
      setConns(prev => prev.map(c => c.srcIP === "192.168.1.75" ? { ...c, state: "ESTABLISHED" } : c));
    } else if (type === "ftp_data") {
      setActiveStep("ftp_data");
      // Add RELATED connection
      const relatedConn: Connection = { proto: "tcp", srcIP: "192.168.1.50", srcPort: 20, dstIP: "192.168.1.100", dstPort: 40150, state: "RELATED" };
      setConns(prev => [...prev.filter(c => c.srcPort !== 20), relatedConn]);
    }
  };

  const clearConns = () => {
    setConns([
      { proto: "tcp", srcIP: "192.168.1.50", srcPort: 49512, dstIP: "192.168.1.100", dstPort: 80, state: "ESTABLISHED" }
    ]);
    setActiveStep(null);
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>
            Stateful Firewall Connection Table
          </span>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => simulateStep("new_syn")} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer", background: "#6366f1", color: "#fff", fontSize: "11px", fontWeight: 700 }}>ส่ง SYN (NEW)</button>
          <button onClick={() => simulateStep("reply")} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer", background: "#10b981", color: "#fff", fontSize: "11px", fontWeight: 700 }}>ส่ง SYN-ACK (ESTABLISHED)</button>
          <button onClick={() => simulateStep("ftp_data")} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer", background: "#f59e0b", color: "#fff", fontSize: "11px", fontWeight: 700 }}>ส่ง Data Port (RELATED)</button>
          <button onClick={clearConns} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", background: "transparent", color: "#cbd5e1", fontSize: "11px" }}>รีเซ็ตตาราง</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Table representation */}
        <div style={{ background: "rgba(0,0,0,0.45)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#10b981" }}>🖥️ conntrack connection table (/proc/net/nf_conntrack)</span>

          <div style={{ overflowY: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px", fontFamily: "monospace" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", textAlign: "left" }}>
                  <th style={{ padding: "8px" }}>PROTOCOL</th>
                  <th style={{ padding: "8px" }}>SRC IP</th>
                  <th style={{ padding: "8px" }}>SRC PORT</th>
                  <th style={{ padding: "8px" }}>DST IP</th>
                  <th style={{ padding: "8px" }}>DST PORT</th>
                  <th style={{ padding: "8px" }}>STATE</th>
                </tr>
              </thead>
              <tbody>
                {conns.map((conn, idx) => (
                  <tr key={idx} style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: (activeStep === "new_syn" && conn.state === "NEW") ||
                      (activeStep === "reply" && conn.srcIP === "192.168.1.75" && conn.state === "ESTABLISHED") ||
                      (activeStep === "ftp_data" && conn.srcPort === 20)
                      ? "rgba(99,102,241,0.15)" : "transparent",
                    transition: "all 0.3s"
                  }}>
                    <td style={{ padding: "8px", fontWeight: "bold", color: "#6366f1" }}>{conn.proto.toUpperCase()}</td>
                    <td style={{ padding: "8px" }}>{conn.srcIP}</td>
                    <td style={{ padding: "8px" }}>{conn.srcPort}</td>
                    <td style={{ padding: "8px" }}>{conn.dstIP}</td>
                    <td style={{ padding: "8px" }}>{conn.dstPort}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        padding: "2px 6px", borderRadius: "4px", fontSize: "9.5px", fontWeight: 800,
                        background: conn.state === "ESTABLISHED" ? "#10b98133" : conn.state === "NEW" ? "#6366f133" : "#f59e0b33",
                        color: conn.state === "ESTABLISHED" ? "#10b981" : conn.state === "NEW" ? "#818cf8" : "#f59e0b"
                      }}>{conn.state}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Explain Card with simple Thai analogies */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)", flex: 1 }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#10b981" }}>🔍 ระบบความจำไฟร์วอลล์ (Stateful)</span>
            <div style={{ fontSize: "11.5px", color: "#cbd5e1", marginTop: "8px", lineHeight: 1.6 }}>
              {activeStep === "new_syn" && (
                <>
                  <p style={{ color: "#818cf8", fontWeight: 700, marginBottom: "4px" }}>สถานะ 1: NEW (โจร/ผู้ใช้มาถึงประตูครั้งแรก)</p>
                  เมื่อมีแพ็กเก็ตส่งมาครั้งแรก รปภ. จะนำไปเทียบในสมุด VIP ว่ามีพอร์ตเปิดไว้ไหม และจะคัดลอกบันทึกสถานะไว้ในตารางความจำว่านี่คือการเปิดการเชื่อมต่อครั้งใหม่ <strong>(NEW)</strong>
                </>
              )}
              {activeStep === "reply" && (
                <>
                  <p style={{ color: "#10b981", fontWeight: 700, marginBottom: "4px" }}>สถานะ 2: ESTABLISHED (การแจกสายรัดข้อมือผ่านทาง)</p>
                  เมื่อมีการตอบรับคุยสัญญากันเรียบร้อย (จับมือ 3-way handshake) รปภ. จะแจก <strong>สายรัดข้อมือผ่านทาง</strong> ข้อมูลขากลับของ IP นี้จึงวิ่งผ่านเข้าออกได้ทันทีโดยไม่ต้องไปต่อคิวเริ่มตรวจกฎในสมุดใหม่
                </>
              )}
              {activeStep === "ftp_data" && (
                <>
                  <p style={{ color: "#f59e0b", fontWeight: 700, marginBottom: "4px" }}>สถานะ 3: RELATED (ผู้ติดตาม/เพื่อนของผู้รับสิทธิ์)</p>
                  เป็นบริการข้างเคียงที่สร้างพอร์ตเสริมแยกออกไป (เช่น พอร์ตส่งไฟล์ข้อมูล FTP) UFW มีความฉลาดพอที่จะมองออกว่าไอพีนี้เชื่อมโยงกับเซสชันหลักที่เคยแลกบัตรผ่านไปแล้ว จึงอนุญาตให้วิ่งผ่านได้
                </>
              )}
              {!activeStep && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <p><strong>💡 คำอธิบายตาราง:</strong> ไฟร์วอลล์ที่ดีต้องมี 'ความจำ' (Stateful) โดยจดจำการเชื่อมต่อลงตาราง <code>conntrack</code> (ตารางด้านซ้าย)</p>
                  <p><strong>👉 วิธีทดสอบ:</strong> คลิกปุ่มจำลองการส่งข้อมูลแถบด้านบน (เช่น ส่ง SYN) เพื่อส่องดูการเปลี่ยนผ่านสถานะในตาราง</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(16,185,129,0.2)", fontSize: "11px" }}>
            🛡️ <strong>กฎ UFW Stateful:</strong> UFW มีกฎลับข้อแรกคือ <code>-A ufw-before-input -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT</code> ซึ่งจะช่วยลดการประมวลผลซีพียูได้อย่างมหาศาล เพราะเช็คเฉพาะทราฟฟิกที่เป็นสายโทรเข้าสายใหม่เท่านั้น!
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NETWORK ATTACKS & DEFENSIVE LAYERS  (type: network-attacks-defenses)
───────────────────────────────────────────────────────────────────────── */
function NetworkAttacksDefenses({ s }: { s: SlideData }) {
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [isDefenseOn, setIsDefenseOn] = useState(false);
  const [packets, setPackets] = useState<{ id: number; offset: number; blocked: boolean }[]>([]);

  const runAttack = (atk: string) => {
    setActiveAttack(atk);
    setPackets([]);
    const count = atk === "ddos" ? 12 : 5;
    const interval = 120;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const isBlocked = isDefenseOn && (
          (atk === "brute" && i >= 3) || // Limit kicks in after 3 attempts in simulation
          atk === "scan" ||
          atk === "ddos"
        );
        setPackets(prev => [...prev, { id: i, offset: 0, blocked: isBlocked }]);

        setTimeout(() => {
          setPackets(prev => prev.map(p => p.id === i ? { ...p, offset: isBlocked ? 50 : 100 } : p));
        }, 100);
      }, i * interval);
    }
  };

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #090a0f 0%, #150606 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#f87171", fontWeight: 700, textTransform: "uppercase" }}>
            Network Threats & Mitigations
          </span>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: isDefenseOn ? "#10b981" : "#f87171" }}>
            ระบบป้องกัน UFW: {isDefenseOn ? "เปิดทำงาน (ON)" : "ปิดการควบคุม (OFF)"}
          </span>
          <button
            onClick={() => { setIsDefenseOn(!isDefenseOn); setPackets([]); }}
            style={{
              padding: "6px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
              background: isDefenseOn ? "#10b981" : "#ef4444", color: "#fff", fontWeight: 800, fontSize: "11px"
            }}
          >
            {isDefenseOn ? "ปิดระบบ UFW" : "เปิดใช้ UFW RULES"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Left pane: Attacks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { id: "scan", label: "🔭 Nmap Port Scanning", desc: "แฮกเกอร์สำรวจพอร์ตเพื่อค้นหาระบบเวอร์ชัน", rule: "ufw default deny incoming" },
            { id: "brute", label: "🔨 SSH Brute Force", desc: "การเดารหัสผ่านซ้ำๆ ด้วยบอทผ่านพอร์ต 22", rule: "ufw limit 22/tcp" },
            { id: "ddos", label: "💥 DDoS Attack", desc: "ส่งทราฟฟิกมหาศาลถล่มจนเว็บล่ม", rule: "ufw deny from [IP]" }
          ].map(atk => (
            <button
              key={atk.id}
              onClick={() => runAttack(atk.id)}
              style={{
                padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left",
                background: activeAttack === atk.id ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)",
                borderLeft: `4px solid ${activeAttack === atk.id ? "#ef4444" : "transparent"}`,
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#ef4444" }}>{atk.label}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{atk.desc}</div>
              {isDefenseOn && (
                <div style={{ fontSize: "9px", color: "#10b981", marginTop: "6px", fontFamily: "monospace" }}>
                  🛡️ ป้องกันด้วย: {atk.rule}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right pane: Graphic visualizer replaced with clean, text-based explanation card */}
        <div style={{
          background: "rgba(15,23,42,0.6)", borderRadius: "14px", padding: "20px",
          border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
          justifyContent: "space-between", position: "relative", minHeight: 0
        }}>
          {!activeAttack ? (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: "12px", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
              <span style={{ fontSize: "36px" }}>🛡️</span>
              <span style={{ fontSize: "13px", fontWeight: 700 }}>เลือกรูปแบบภัยคุกคามด้านซ้าย</span>
              <span style={{ fontSize: "11px", maxWidth: "280px", lineHeight: 1.5 }}>เพื่อดูคำอธิบายเปรียบเทียบในชีวิตจริง และวิธีที่ Firewall ป้องกันระบบ</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", overflowY: "auto", minHeight: 0 }}>
              {activeAttack === "scan" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(239,68,68,0.2)", paddingBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>🔭</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#f87171" }}>Nmap Port Scanning (การแอบเขย่าลูกบิดประตู)</span>
                  </div>
                  <div style={{ fontSize: "12px", lineHeight: 1.6, color: "#cbd5e1" }}>
                    <p style={{ marginBottom: "8px" }}>
                      <strong>🏠 เปรียบเทียบกับ รปภ.:</strong> เหมือนมีโจรมาเดินเดินวนเวียนรอบๆ คอนโด แล้วลอง
                      <span style={{ color: "#f59e0b", fontWeight: 700 }}> เอามือขยับลูกบิดประตูห้องต่างๆ </span>
                      เพื่อหาดูว่ามีห้องไหนลืมล็อกทิ้งไว้ (พอร์ตสถานะ Open)
                    </p>
                    <p style={{ marginBottom: "8px" }}>
                      <strong>⚠️ ความเสียหาย:</strong> โจรจะรู้ทันทีว่ามีบริการอะไรเปิดอยู่บ้าง และรู้เวอร์ชันของโปรแกรมเพื่อเตรียมแผนการเจาะระบบขั้นถัดไป
                    </p>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(255,255,255,0.06)", marginTop: "10px" }}>
                      <div style={{ fontSize: "10.5px", fontFamily: "monospace", color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>
                        🛡️ คำสั่ง UFW ป้องกัน:
                      </div>
                      <div style={{ fontSize: "11.5px", fontFamily: "monospace", background: "#0f172a", padding: "6px", borderRadius: "4px", color: "#10b981", fontWeight: "bold" }}>
                        sudo ufw default deny incoming
                      </div>
                      <p style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.5)", marginTop: "6px", lineHeight: 1.4 }}>
                        <strong>หลักการทำงาน:</strong> {isDefenseOn ? (
                          <span style={{ color: "#10b981", fontWeight: 700 }}>
                            [UFW เปิดทำงาน] รปภ. สร้างกำแพงบังหน้าห้องไว้ทั้งหมด ทำให้ Nmap สแกนแล้วพบสถานะ filtered (ประตูล่องหน) โจรจะไม่เห็นบริการใดๆ เลย ปลอดภัย 100%!
                          </span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>
                            [UFW ปิดใช้งาน] รปภ. ไม่ทำงาน โจรจะสแกนเจอพอร์ต 22, 80, 3306 ขึ้นเป็น open ทันที! พร้อมบุกรุกระบบ
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeAttack === "brute" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(239,68,68,0.2)", paddingBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>🔨</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#f87171" }}>SSH Brute Force (การรัวเดารหัสผ่านประตู)</span>
                  </div>
                  <div style={{ fontSize: "12px", lineHeight: 1.6, color: "#cbd5e1" }}>
                    <p style={{ marginBottom: "8px" }}>
                      <strong>🏠 เปรียบเทียบกับ รปภ.:</strong> เหมือนโจรมายืนหน้าประตูห้อง SSH (พอร์ต 22) แล้ว
                      <span style={{ color: "#ef4444", fontWeight: 700 }}> รัวกดรหัสผ่านประตูดังปิ๊บๆ ซ้ำๆ </span>
                      เป็นพันครั้ง หวังว่าจะมีสักครั้งที่เดาถูก
                    </p>
                    <p style={{ marginBottom: "8px" }}>
                      <strong>⚠️ ความเสียหาย:</strong> หากไม่ได้ตั้งรหัสที่ยากพอ โจรจะสามารถถอดรหัสและเข้าควบคุมระบบทั้งหมดของเซิร์ฟเวอร์ได้ทันที
                    </p>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(255,255,255,0.06)", marginTop: "10px" }}>
                      <div style={{ fontSize: "10.5px", fontFamily: "monospace", color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>
                        🛡️ คำสั่ง UFW ป้องกัน:
                      </div>
                      <div style={{ fontSize: "11.5px", fontFamily: "monospace", background: "#0f172a", padding: "6px", borderRadius: "4px", color: "#10b981", fontWeight: "bold" }}>
                        sudo ufw limit 22/tcp
                      </div>
                      <p style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.5)", marginTop: "6px", lineHeight: 1.4 }}>
                        <strong>หลักการทำงาน:</strong> {isDefenseOn ? (
                          <span style={{ color: "#10b981", fontWeight: 700 }}>
                            [UFW เปิดทำงาน] รปภ. ติดตั้งสปริงกลไกลูกบิดพิเศษ หากพบ IP เดิมมาพยายามล็อกอินล้มเหลวเกิน 6 ครั้งใน 30 วินาที ระบบจะดึงสัญญาณแบนและบล็อกการเชื่อมต่อ IP นั้นทันที
                          </span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>
                            [UFW ปิดใช้งาน] บอทคนร้ายสามารถทำสอบรหัสซ้ำได้ไม่จำกัดจำนวนครั้ง ส่งผลให้ทรัพยากร CPU ของระบบโหลดหนักมาก
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeAttack === "ddos" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(239,68,68,0.2)", paddingBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>💥</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#f87171" }}>DDoS Attack (ฝูงชนบุกพังประตู)</span>
                  </div>
                  <div style={{ fontSize: "12px", lineHeight: 1.6, color: "#cbd5e1" }}>
                    <p style={{ marginBottom: "8px" }}>
                      <strong>🏠 เปรียบเทียบกับ รปภ.:</strong> เหมือนโจรจ้าง
                      <span style={{ color: "#ef4444", fontWeight: 700 }}> ผู้คนนับหมื่นวิ่งรู้อัดแน่นเข้ามาขวางทางเข้าประตูทางออกคอนโด </span>
                      ทำให้ลูกค้าจริงไม่สามารถเดินเข้ามาใช้บริการในคอนโดได้เลย
                    </p>
                    <p style={{ marginBottom: "8px" }}>
                      <strong>⚠️ ความเสียหาย:</strong> เซิร์ฟเวอร์และแอปพลิเคชันเว็บล่ม (Service Outage) เนื่องจากระบบเครือข่ายตอบสนองปริมาณข้อมูลขยะไม่ไหว
                    </p>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(255,255,255,0.06)", marginTop: "10px" }}>
                      <div style={{ fontSize: "10.5px", fontFamily: "monospace", color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>
                        🛡️ คำสั่ง UFW ป้องกัน (แบนเฉพาะเจาะจง IP):
                      </div>
                      <div style={{ fontSize: "11.5px", fontFamily: "monospace", background: "#0f172a", padding: "6px", borderRadius: "4px", color: "#10b981", fontWeight: "bold" }}>
                        sudo ufw deny from [ไอพีคนร้าย]
                      </div>
                      <p style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.5)", marginTop: "6px", lineHeight: 1.4 }}>
                        <strong>หลักการทำงาน:</strong> {isDefenseOn ? (
                          <span style={{ color: "#10b981", fontWeight: 700 }}>
                            [UFW เปิดทำงาน] รปภ. ติดป้ายแบล็คลิสต์และคัดกรองแพ็กเก็ตจาก IP โจมตีทิ้งลงถังขยะตั้งแต่หน้าประตูดิน ปล่อยให้ผู้ใช้รายอื่นยังเรียกชมเว็บได้ตามปกติ
                          </span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>
                            [UFW ปิดใช้งาน] ข้อมูลขยะทราฟฟิกพุ่งเข้าชนเซิร์ฟเวอร์ตรงๆ ดึงทรัพยากร CPU เกิน 100% ส่งผลให้เว็บโหลดช้าหรือปิดตัวลง
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   UFW LOG DISSECTOR  (type: ufw-log-dissector)
───────────────────────────────────────────────────────────────────────── */
function UFWLogDissector({ s }: { s: SlideData }) {
  const [activeToken, setActiveToken] = useState<string | null>(null);

  // Color categories for each token type
  const categories: Record<string, { color: string; label: string }> = {
    timestamp: { color: "#f59e0b", label: "เวลา" },
    action: { color: "#ef4444", label: "การกระทำ" },
    in_iface: { color: "#a78bfa", label: "Network" },
    out_iface: { color: "#a78bfa", label: "Network" },
    mac: { color: "#64748b", label: "Layer 2" },
    src_ip: { color: "#f97316", label: "ต้นทาง" },
    dst_ip: { color: "#22d3ee", label: "ปลายทาง" },
    len: { color: "#6b7280", label: "Packet" },
    proto: { color: "#818cf8", label: "Protocol" },
    src_port: { color: "#fb923c", label: "ต้นทาง" },
    dst_port: { color: "#34d399", label: "ปลายทาง" },
    flags: { color: "#f43f5e", label: "TCP Flag" },
  };

  const rawLog = [
    { text: "Jul  1 22:01:03", token: "timestamp", desc: "📅 วันที่และเวลา (Timestamp): บันทึกว่า UFW สกัดทราฟฟิกนี้เมื่อวันที่ 1 กรกฎาคม เวลา 22:01:03 น. ใช้ดู Pattern การโจมตีว่าเกิดช่วงเวลาไหน เช่น ถ้าเกิดตอนดึกๆ ทุกคืนก็น่าสงสัยมาก" },
    { text: "[UFW BLOCK]", token: "action", desc: "🔥 การกระทำของไฟร์วอลล์ (Action): [UFW BLOCK] = ไฟร์วอลล์สกัดกั้นและทิ้งแพ็กเก็ตนี้ทันที | [UFW ALLOW] = อนุญาตให้ผ่าน | [UFW LIMIT] = จำกัดความถี่" },
    { text: "IN=eth0", token: "in_iface", desc: "🔌 Interface ขาเข้า (Input Interface): eth0 คือการ์ดเน็ตเวิร์กหลักที่รับสัญญาณจากอินเทอร์เน็ต หากเป็น lo คือ localhost หากเป็น wlan0 คือ Wi-Fi" },
    { text: "OUT=", token: "out_iface", desc: "🔀 Interface ขาออก (Output Interface): ค่าว่างเปล่า (OUT=) แปลว่าแพ็กเก็ตนี้ตั้งใจเข้าสู่เครื่องเซิร์ฟเวอร์โดยตรง ไม่ได้ถูกส่งต่อ (Forward) ไปเครื่องอื่น" },
    { text: "MAC=00:11:22:33:44:55", token: "mac", desc: "💾 MAC Address (Layer 2): ข้อมูลที่อยู่ฮาร์ดแวร์ของการ์ดเน็ตเวิร์ก ใช้บ่งชี้อุปกรณ์ในวงแลน แต่ในการโจมตีจากอินเทอร์เน็ตจะเป็น MAC ของ Router/Gateway ไม่ใช่ผู้โจมตีจริง" },
    { text: "SRC=185.220.101.45", token: "src_ip", desc: "🌍 IP ต้นทาง (Source IP): นี่คือ IP ของผู้ส่งหรือผู้บุกรุก ในตัวอย่างนี้ 185.220.101.45 เป็น IP จากต่างประเทศที่พยายามสแกนพอร์ต SSH — ควร Blacklist IP นี้ทันที!" },
    { text: "DST=192.168.1.100", token: "dst_ip", desc: "🎯 IP ปลายทาง (Destination IP): IP ของเซิร์ฟเวอร์ของเราที่โดนเล็งโจมตี 192.168.1.100 คือ Private IP บนวงแลน ในสภาพแวดล้อมจริงจะเป็น Public IP ของ VPS" },
    { text: "LEN=40", token: "len", desc: "📦 ขนาดแพ็กเก็ต (Packet Length): 40 ไบต์ คือขนาดของ IP Header (20 bytes) + TCP Header (20 bytes) เปล่าๆ โดยไม่มีข้อมูล payload — ลักษณะเฉพาะของ SYN Scan!" },
    { text: "PROTO=TCP", token: "proto", desc: "📡 โปรโตคอล (Protocol): TCP = ต้องจับมือเชื่อมต่อก่อนส่งข้อมูล | UDP = ส่งข้อมูลตรงๆ ไม่ต้องเชื่อมต่อ | ICMP = Ping สัญญาณตรวจสอบการเชื่อมต่อ" },
    { text: "SPT=54321", token: "src_port", desc: "🔢 พอร์ตต้นทาง (Source Port): พอร์ตสุ่มฝั่ง Client (Ephemeral Port ช่วง 1024-65535) ที่ใช้รับสัญญาณตอบกลับจากเซิร์ฟเวอร์ ไม่ได้มีความหมายพิเศษมากนัก" },
    { text: "DPT=22", token: "dst_port", desc: "⚠️ พอร์ตเป้าหมาย (Destination Port): DPT=22 → โจมตีพอร์ต SSH! นี่คือหัวใจสำคัญที่สุด บอกว่าผู้บุกรุกพยายามทำอะไร: DPT=80 (เว็บ), DPT=3306 (ฐานข้อมูล), DPT=22 (รีโมต), DPT=23 (Telnet เก่า)" },
    { text: "SYN", token: "flags", desc: "🚩 TCP Flag: SYN = คำขอเปิดการเชื่อมต่อใหม่ (คนเดินเข้ามาเคาะประตู) | ACK = ยืนยันรับข้อมูล | RST = ปิดทันที | FIN = จบการสนทนา | SYN ACK = ตอบรับคำขอ" },
  ];

  // 3 example log lines for context
  const exampleLines = [
    { label: "🔴 BLOCK SSH Brute Force", color: "#ef4444", log: "Jul  1 22:01:03 [UFW BLOCK] IN=eth0 SRC=185.220.101.45 DST=192.168.1.100 PROTO=TCP SPT=54321 DPT=22 SYN" },
    { label: "🟢 ALLOW HTTP เว็บปกติ", color: "#10b981", log: "Jul  1 22:01:44 [UFW ALLOW] IN=eth0 SRC=203.0.113.50 DST=192.168.1.100 PROTO=TCP SPT=49200 DPT=80 SYN" },
    { label: "🔴 BLOCK พอร์ต DB จากนอก", color: "#f97316", log: "Jul  1 22:01:07 [UFW BLOCK] IN=eth0 SRC=45.33.32.156 DST=192.168.1.100 PROTO=TCP SPT=61234 DPT=3306 SYN" },
  ];

  const activeInfo = rawLog.find(t => t.token === activeToken);

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2% 3%",
      background: "linear-gradient(135deg, #020617 0%, #0c1a2e 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "10px",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          🔍 Log Analysis Tool — คลิกแต่ละส่วนเพื่ออ่านความหมาย
        </span>
        <h2 style={{ margin: "2px 0 0", fontSize: "clamp(13px, 1.8vw, 19px)", fontWeight: 800 }}>{s.title}</h2>
      </div>

      {/* Example log lines reference */}
      <div style={{ flexShrink: 0, background: "rgba(0,0,0,0.4)", borderRadius: "10px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "5px", fontWeight: 700 }}>📋 ตัวอย่าง UFW Log 3 แบบที่พบบ่อย:</div>
        {exampleLines.map((ex, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "2px" }}>
            <span style={{ fontSize: "9px", color: ex.color, fontWeight: 700, whiteSpace: "nowrap", minWidth: "140px" }}>{ex.label}</span>
            <span style={{ fontFamily: "monospace", fontSize: "8.5px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.log}</span>
          </div>
        ))}
      </div>

      {/* Interactive dissector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minHeight: 0 }}>
        {/* Clickable token log line */}
        <div style={{
          background: "rgba(0,0,0,0.65)", borderRadius: "12px", padding: "12px 14px",
          border: "1px solid rgba(96,165,250,0.2)", fontFamily: "monospace",
          fontSize: "clamp(9px, 1vw, 12px)", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center"
        }}>
          <span style={{ color: "#475569", fontSize: "9px", width: "100%", marginBottom: "2px" }}>
            👆 คลิกที่ส่วนต่างๆ ด้านล่างเพื่อดูความหมาย:
          </span>
          {rawLog.map((token, idx) => {
            const isSelected = activeToken === token.token;
            const cat = categories[token.token];
            return (
              <span
                key={idx}
                onClick={() => setActiveToken(isSelected ? null : token.token)}
                style={{
                  cursor: "pointer", padding: "4px 9px", borderRadius: "6px",
                  background: isSelected ? `${cat.color}22` : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isSelected ? cat.color : "rgba(255,255,255,0.08)"}`,
                  color: isSelected ? cat.color : "#cbd5e1",
                  fontWeight: isSelected ? 800 : 400,
                  transition: "all 0.15s",
                  position: "relative"
                }}
              >
                {token.text}
                {isSelected && (
                  <span style={{
                    position: "absolute", top: "-8px", right: "-2px", fontSize: "7px",
                    background: cat.color, color: "#000", borderRadius: "4px", padding: "1px 3px", fontWeight: 800
                  }}>{cat.label}</span>
                )}
              </span>
            );
          })}
        </div>

        {/* Color legend */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flexShrink: 0 }}>
          {[
            { color: "#f59e0b", label: "เวลา" },
            { color: "#ef4444", label: "การกระทำ" },
            { color: "#f97316", label: "ต้นทาง" },
            { color: "#22d3ee", label: "ปลายทาง" },
            { color: "#818cf8", label: "Protocol" },
            { color: "#34d399", label: "Port ปลายทาง" },
            { color: "#f43f5e", label: "TCP Flag" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color }} />
              <span style={{ fontSize: "9px", color: "#94a3b8" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Explain card */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {activeInfo ? (
            <div style={{
              background: `${categories[activeToken!]?.color}11`, borderRadius: "12px", padding: "14px 18px",
              border: `1px solid ${categories[activeToken!]?.color}55`, height: "100%", boxSizing: "border-box"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  background: categories[activeToken!]?.color, borderRadius: "6px",
                  padding: "3px 10px", fontSize: "11px", fontWeight: 800, color: "#000",
                  fontFamily: "monospace"
                }}>{activeInfo.text}</div>
                <span style={{ fontSize: "9px", color: categories[activeToken!]?.color, fontWeight: 700 }}>
                  — {categories[activeToken!]?.label}
                </span>
              </div>
              <div style={{ fontSize: "clamp(10px, 1.2vw, 13px)", color: "rgba(255,255,255,0.85)", lineHeight: 1.75 }}>
                {activeInfo.desc}
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "16px",
              border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center",
              justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: "11px",
              height: "100%", boxSizing: "border-box", flexDirection: "column", gap: "6px"
            }}>
              <div style={{ fontSize: "22px" }}>👆</div>
              <div>คลิกที่ส่วนใดส่วนหนึ่งของ log ด้านบน เพื่อถอดรหัสและอ่านความหมาย</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   UFW LOG HOMEWORK  (type: ufw-log-homework)
═══════════════════════════════════════════════════════════════════════ */
function UFWLogHomework({ s }: { s: SlideData }) {
  const [activeQ, setActiveQ] = useState(0);

  const homeworkItems = [
    {
      id: "hw1",
      label: "โจทย์ข้อที่ 1",
      title: "การตรวจวิเคราะห์ Log เบื้องต้น (SSH Port)",
      log: "Jul  2 03:14:22 server01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=00:16:3e:aa:bb:cc SRC=185.220.101.47 DST=10.0.0.5 LEN=40 TOS=0x00 PREC=0x00 TTL=241 ID=54321 PROTO=TCP SPT=49823 DPT=22 WINDOW=1024 SYN",
      questions: [
        "ไฟร์วอลล์ทำหน้าที่อย่างไรกับแพ็กเก็ตนี้?",
        "ระบุไอพีต้นทางของผู้ส่ง (SRC) และพอร์ตปลายทางเป้าหมาย (DPT) ของแพ็กเก็ตนี้",
        "พอร์ตปลายทาง DPT=22 เป็นพอร์ตมาตรฐานของบริการใดในระบบ Linux?"
      ]
    },
    {
      id: "hw2",
      label: "โจทย์ข้อที่ 2",
      title: "การอนุญาตบริการเว็บเข้ารหัส (HTTPS traffic)",
      log: "Jul  2 10:35:07 server01 kernel: [UFW ALLOW] IN=eth0 OUT= MAC=00:16:3e:aa:bb:cc SRC=203.150.10.22 DST=10.0.0.5 LEN=60 TOS=0x00 PREC=0x00 TTL=54 ID=12345 PROTO=TCP SPT=51234 DPT=443 WINDOW=65535 SYN",
      questions: [
        "ในข้อนี้ไฟร์วอลล์บล็อกหรืออนุญาตทราฟฟิกนี้ให้ผ่านเข้าเซิร์ฟเวอร์ได้?",
        "พอร์ตปลายทาง DPT=443 คือบริการใด และแพ็กเก็ตนี้วิ่งเข้ามาผ่านการ์ดเน็ตเวิร์ก (IN) ชื่ออะไร?",
        "เพราะเหตุใดไฟร์วอลล์ถึงยอมปล่อยผ่านทราฟฟิกนี้?"
      ]
    },
    {
      id: "hw3",
      label: "โจทย์ข้อที่ 3",
      title: "การตรวจสอบและจำกัดพอร์ตฐานข้อมูล (DB Port)",
      log: "Jul  2 14:22:51 server01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=00:16:3e:aa:bb:cc SRC=45.33.32.156 DST=10.0.0.5 LEN=40 TOS=0x00 PREC=0x00 TTL=238 ID=8888 PROTO=TCP SPT=61234 DPT=3306 WINDOW=1024 SYN",
      questions: [
        "พอร์ต DPT=3306 คือพอร์ตบริการของโปรแกรมฐานข้อมูลใด?",
        "จาก log บรรทัดนี้ ผู้ส่งพยายามเชื่อมต่อพอร์ตฐานข้อมูลจากภายนอกสำเร็จหรือไม่ และโดนจัดการด้วยวิธีใด?",
        "หากต้องการเขียนคำสั่ง UFW เพื่ออนุญาตให้เครื่องไอพี 192.168.1.150 เข้ามาใช้พอร์ต 3306 เพียงเครื่องเดียว ต้องเขียนอย่างไร?"
      ]
    },
    {
      id: "hw4",
      label: "โจทย์ข้อที่ 4",
      title: "การปิดกั้นบริการที่ไม่ปลอดภัย (Telnet Port)",
      log: "Jul  2 22:58:03 server01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=00:16:3e:aa:bb:cc SRC=91.108.4.13 DST=10.0.0.5 LEN=40 TOS=0x00 PREC=0x00 TTL=245 ID=31337 PROTO=TCP SPT=55667 DPT=23 WINDOW=65535 SYN",
      questions: [
        "พอร์ตปลายทาง DPT=23 คือบริการใด และเหตุใดในปัจจุบันจึงควรปิดใช้งานและเปลี่ยนไปใช้ SSH แทน?",
        "แพ็กเก็ตข้อนี้พยายามเชื่อมต่อด้วยโปรโตคอล (PROTO) ใด?",
        "หากต้องการเขียนคำสั่งเพื่อสั่งบล็อก (Deny) พอร์ต 23 ในระบบ UFW ต้องพิมพ์คำสั่งอย่างไร?"
      ]
    }
  ];

  const currentItem = homeworkItems[activeQ];

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #020617 0%, #0b1528 50%, #020617 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px" }}>
            📝 การบ้านประจำสัปดาห์ (Homework Assignment)
          </span>
          <h2 style={{ margin: "2px 0 0", fontSize: "clamp(14px, 2.2vw, 20px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: "8px", padding: "4px 12px", fontSize: "11px", color: "#f59e0b", fontWeight: 700
        }}>
          คำถามข้อเขียนอัตนัย (Subjective Questions)
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "0.6fr 1.4fr", gap: "16px", flex: 1, minHeight: 0 }}>

        {/* Left Side: Question List Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
          {homeworkItems.map((item, idx) => {
            const isActive = activeQ === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveQ(idx)}
                style={{
                  padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                  background: isActive ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
                  border: `1.5px solid ${isActive ? "#6366f1" : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "10px", color: isActive ? "#818cf8" : "#94a3b8", fontWeight: 700 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 800, marginTop: "2px", color: isActive ? "#fff" : "#cbd5e1" }}>
                  {item.title}
                </div>
              </div>
            );
          })}

          {/* Guide Box */}
          <div style={{
            marginTop: "auto", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)", fontSize: "10px", color: "#94a3b8", lineHeight: 1.5
          }}>
            💡 ให้นักศึกษาพิจารณาข้อความ Log บรรทัดที่กำหนด แล้วเขียนวิเคราะห์อธิบายคำตอบลงในสมุดบันทึกหรือส่งตามช่องทางที่อาจารย์กำหนด
          </div>
        </div>

        {/* Right Side: Log display and Written Questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0 }}>

          {/* Active Log Box */}
          <div style={{
            background: "rgba(0,0,0,0.8)", borderRadius: "12px", padding: "14px 18px",
            border: "1px solid rgba(99,102,241,0.25)", fontFamily: "monospace", display: "flex",
            flexDirection: "column", gap: "6px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "8px", color: "#6366f1", fontWeight: 700 }}>$ sudo tail -n 1 /var/log/ufw.log</span>
              <span style={{ fontSize: "8px", color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>UFW Log String</span>
            </div>
            <div style={{
              fontSize: "clamp(8px, 0.95vw, 11px)", color: "#e2e8f0", lineHeight: 1.6,
              wordBreak: "break-all", whiteSpace: "pre-wrap"
            }}>
              {currentItem.log}
            </div>
          </div>

          {/* Written Questions List */}
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.02)", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px",
            overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px"
          }}>
            <div style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
              📋 คำถามวิเคราะห์อัตนัย ({currentItem.label})
            </div>
            {currentItem.questions.map((qText, qIdx) => (
              <div key={qIdx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{
                  background: "rgba(99,102,241,0.2)", color: "#818cf8", width: "20px", height: "20px",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 800, flexShrink: 0, marginTop: "2px"
                }}>
                  {qIdx + 1}
                </div>
                <div style={{ fontSize: "clamp(11px, 1.2vw, 14px)", color: "#e2e8f0", lineHeight: 1.6 }}>
                  {qText}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NMAP HANDSHAKE DIAGRAM  (type: nmap-handshake-diagram)
───────────────────────────────────────────────────────────────────────── */
function NmapHandshakeDiagram({ s }: { s: SlideData }) {
  const [scanType, setScanType] = useState<"connect" | "stealth">("stealth");

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #090b11 0%, #1a1b26 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase" }}>
            Nmap Audit Mechanics
          </span>
          <h2 style={{ margin: "3px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setScanType("stealth")} style={{
            padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "11px",
            background: scanType === "stealth" ? "#6366f1" : "rgba(255,255,255,0.06)",
            color: "#fff", fontWeight: 700, transition: "all 0.2s"
          }}>SYN Stealth Scan (-sS)</button>
          <button onClick={() => setScanType("connect")} style={{
            padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "11px",
            background: scanType === "connect" ? "#6366f1" : "rgba(255,255,255,0.06)",
            color: "#fff", fontWeight: 700, transition: "all 0.2s"
          }}>TCP Connect Scan (-sT)</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Diagram Area */}
        <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg className="security-diagram-svg" width="100%" height="90%" viewBox="0 0 100 60" style={{ overflow: "visible" }}>
            {/* Host lines */}
            <line x1="20" y1="10" x2="20" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            <line x1="80" y1="10" x2="80" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

            <text x="20" y="8" textAnchor="middle" fill="#fff" fontSize="2.5" fontWeight="bold">Nmap Client</text>
            <text x="80" y="8" textAnchor="middle" fill="#fff" fontSize="2.5" fontWeight="bold">Server Port 80</text>

            {scanType === "stealth" ? (
              <>
                {/* SYN packet */}
                <line x1="20" y1="15" x2="80" y2="25" stroke="#6366f1" strokeWidth="0.8" markerEnd="url(#arrow)" />
                <text x="50" y="19" textAnchor="middle" fill="#818cf8" fontSize="2" fontWeight="bold">1. SYN [ต้องการเชื่อมต่อ]</text>

                {/* SYN-ACK packet */}
                <line x1="80" y1="28" x2="20" y2="38" stroke="#10b981" strokeWidth="0.8" markerEnd="url(#arrow)" />
                <text x="50" y="32" textAnchor="middle" fill="#34d399" fontSize="2" fontWeight="bold">2. SYN-ACK [ตอบกลับว่าพอร์ตเปิด]</text>

                {/* RST packet */}
                <line x1="20" y1="41" x2="80" y2="51" stroke="#ef4444" strokeWidth="0.8" markerEnd="url(#arrow)" />
                <text x="50" y="45" textAnchor="middle" fill="#f87171" fontSize="2" fontWeight="bold">3. RST [รีเซ็ตตัดการเชื่อมต่อทันที!]</text>
              </>
            ) : (
              <>
                {/* SYN packet */}
                <line x1="20" y1="15" x2="80" y2="25" stroke="#6366f1" strokeWidth="0.8" />
                <text x="50" y="19" textAnchor="middle" fill="#818cf8" fontSize="2" fontWeight="bold">1. SYN</text>

                {/* SYN-ACK packet */}
                <line x1="80" y1="25" x2="20" y2="35" stroke="#10b981" strokeWidth="0.8" />
                <text x="50" y="29" textAnchor="middle" fill="#34d399" fontSize="2" fontWeight="bold">2. SYN-ACK</text>

                {/* ACK packet */}
                <line x1="20" y1="35" x2="80" y2="45" stroke="#3b82f6" strokeWidth="0.8" />
                <text x="50" y="39" textAnchor="middle" fill="#60a5fa" fontSize="2" fontWeight="bold">3. ACK [เชื่อมต่อ 3-way ครบถ้วน]</text>

                {/* RST packet */}
                <line x1="20" y1="47" x2="80" y2="53" stroke="#ef4444" strokeWidth="0.8" />
                <text x="50" y="49" textAnchor="middle" fill="#f87171" fontSize="1.8">4. RST-ACK [ตัดสายปกติ]</text>
              </>
            )}
          </svg>
        </div>

        {/* Explain Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)", flex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc" }}>⚙️ กลไกความปลอดภัยการส่งแพ็กเก็ต</span>
            <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.7)", marginTop: "8px", lineHeight: 1.6 }}>
              {scanType === "stealth" ? (
                <>
                  <strong>SYN Stealth Scan (-sS):</strong> เป็นวิธียอดนิยมที่สุดของ Nmap โดยการส่งฟลัก SYN ไปเพื่อดูการตอบรับของพอร์ตปลายทาง ทันทีที่เซิร์ฟเวอร์ส่ง SYN-ACK กลับมา (ซึ่งเพียงพอสำหรับบอกว่าพอร์ตเปิดแล้ว) Nmap จะตอบกลับด้วย <strong>RST (Reset)</strong> ทันทีเพื่อปิดสายตัดวงจร ทำให้ระบบไม่เคยบันทึกประวัติการเชื่อมต่อไปยัง Application Log (เพราะ 3-Way Handshake ไม่เสร็จสมบูรณ์)
                </>
              ) : (
                <>
                  <strong>TCP Connect Scan (-sT):</strong> ใช้วิธีเรียกผ่าน API เครือข่ายของระบบปฏิบัติการเพื่อทำการเชื่อมต่อแบบจับมือ 3-Way (SYN → SYN-ACK → ACK) เต็มระบบ วิธีนี้จะมีความเสถียรสูงกว่าในสภาพเครือข่ายที่ไม่คงที่ แต่มีข้อเสียคือระบบฝั่งเซิร์ฟเวอร์ (เช่น Nginx หรือ MySQL) จะตรวจพบการเชื่อมต่อและบันทึกประวัติลง Log ทันที ทำให้ทิ้งร่องรอยไว้ครบถ้วน
                </>
              )}
            </div>
          </div>
          <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(239,68,68,0.25)", fontSize: "11px" }}>
            ⚠️ <strong>ความต่างระดับ Log:</strong> การสแกนแบบ <code>-sS</code> จะแอบทำเงียบๆ แต่ในฝั่งเซิร์ฟเวอร์ระบบตรวจจับระดับล่าง (IDS/IPS) เช่น Snort หรือ Suricata ก็ยังจับแพ็กเก็ต RST ถี่ๆ แบบนี้ได้ และระบุพฤติกรรมเป็นการสแกนพอร์ตทันที
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   WORKSHOP ARCHITECTURE  (type: workshop-architecture)
───────────────────────────────────────────────────────────────────────── */
function WorkshopArchitecture({ s }: { s: SlideData }) {
  const [activePort, setActivePort] = useState<string | null>(null);

  const targets = [
    { port: "22", name: "SSH Control Service", state: "LIMITED", cmd: "sudo ufw limit 22/tcp", desc: "อนุญาตเฉพาะ IP เจ้าหน้าที่ แต่อันตรายจาก Brute force จึงต้องทำ Rate limiting (6 ครั้งต่อ 30 วินาที)" },
    { port: "80", name: "Web Server (Nginx)", state: "ALLOWED", cmd: "sudo ufw allow 80/tcp", desc: "เปิดให้ผู้ใช้อินเทอร์เน็ตสาธารณะเชื่อมต่อเข้ามาเรียกหน้าเว็บได้ตลอดเวลา" },
    { port: "3306", name: "Database (MariaDB)", state: "DENIED", cmd: "sudo ufw deny 3306/tcp", desc: "ปิดกั้นจากอินเทอร์เน็ตสาธารณะโดยสิ้นเชิง อนุญาตเฉพาะภายใน (localhost) เท่านั้น" }
  ];

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2.5% 3.5%",
      background: "linear-gradient(135deg, #090a0f 0%, #0d1b2a 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "12px"
    }}>
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>
          Workshop Security Blueprint
        </span>
        <h2 style={{ margin: "3px 0 0", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 800 }}>{s.title}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Network diagram blueprint */}
        <div style={{
          background: "rgba(0,0,0,0.35)", borderRadius: "14px", padding: "20px",
          border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
        }}>
          <svg className="security-diagram-svg" width="100%" height="90%" viewBox="0 0 100 60" style={{ overflow: "visible" }}>
            {/* Server perimeter boundary */}
            <rect x="42" y="5" width="54" height="50" rx="4" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
            <text x="69" y="9" textAnchor="middle" fill="#10b981" fontSize="2.5" fontWeight="bold">Server Security Perimeter</text>

            {/* Public Client */}
            <circle cx="15" cy="18" r="5" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="0.8" />
            <text x="15" y="27" textAnchor="middle" fill="#fff" fontSize="2.2">Public Internet Client</text>

            {/* Admin Client */}
            <circle cx="15" cy="42" r="5" fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" strokeWidth="0.8" />
            <text x="15" y="51" textAnchor="middle" fill="#fff" fontSize="2.2">System Administrator</text>

            {/* UFW Guard line */}
            <line x1="45" y1="10" x2="45" y2="50" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="41" y="30" textAnchor="middle" fill="#f59e0b" fontSize="2.5" fontWeight="bold" transform="rotate(-90 41 30)">UFW FIREWALL</text>

            {/* Ports inside server */}
            {/* Port 80 */}
            <g onClick={() => setActivePort("80")} style={{ cursor: "pointer" }}>
              <rect x="62" y="13" width="22" height="10" rx="2" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="0.6" />
              <text x="73" y="19" textAnchor="middle" fill="#10b981" fontSize="2.2" fontWeight="bold">Nginx Server (:80)</text>
              <line x1="15" y1="18" x2="62" y2="18" stroke="#10b981" strokeWidth="0.6" />
            </g>

            {/* Port 22 */}
            <g onClick={() => setActivePort("22")} style={{ cursor: "pointer" }}>
              <rect x="62" y="27" width="22" height="10" rx="2" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="0.6" />
              <text x="73" y="33" textAnchor="middle" fill="#f59e0b" fontSize="2.2" fontWeight="bold">SSH Server (:22)</text>
              <line x1="15" y1="42" x2="62" y2="32" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
            </g>

            {/* Port 3306 */}
            <g onClick={() => setActivePort("3306")} style={{ cursor: "pointer" }}>
              <rect x="62" y="41" width="22" height="10" rx="2" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="0.6" />
              <text x="73" y="47" textAnchor="middle" fill="#ef4444" fontSize="2.2" fontWeight="bold">MariaDB (:3306)</text>
              {/* Blocked attempt path */}
              <line x1="15" y1="18" x2="45" y2="46" stroke="#ef4444" strokeWidth="0.6" />
              <text x="43" y="42" fill="#ef4444" fontSize="3" fontWeight="bold">X</text>
            </g>
          </svg>
        </div>

        {/* Info detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {activePort ? (
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#10b981" }}>พอร์ต: {activePort} — {targets.find(t => t.port === activePort)?.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "8px", lineHeight: 1.6 }}>{targets.find(t => t.port === activePort)?.desc}</div>
              <div style={{ marginTop: "12px", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "monospace", fontSize: "10.5px" }}>
                <div style={{ color: "#f59e0b", marginBottom: "4px" }}>คำสั่งตั้งค่า UFW:</div>
                {targets.find(t => t.port === activePort)?.cmd}
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              💡 คลิกที่กล่องพอร์ตในสถาปัตยกรรมตัวอย่างเพื่อดูรายละเอียดภัยคุกคามและคำสั่ง Hardening
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", lineHeight: 1.6 }}>
            🏆 <strong>เป้าหมายของระบบ Hardened:</strong>
            <br />1. บล็อกสายเข้าที่ไม่ผ่านการอนุญาตทั้งหมด (Stateful Default Block)
            <br />2. บล็อกการเดารหัสผ่านความถี่สูงผ่าน SSH Limit
            <br />3. จำกัดวงเชื่อมต่อฐานข้อมูลตรงจากภายนอก เพื่อไม่ให้ใครสแกนเจอหรือเจาะระบบได้
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROXMOX ARCHITECTURE & OVERVIEW VISUALIZER (WEEK 12a)
   ============================================================ */
function ProxmoxArchVisualizer({ s }: { s: SlideData }) {
  const [selectedNode, setSelectedNode] = useState<string>("host");

  const nodeDetails: Record<string, {
    title: string;
    subtitle: string;
    icon: string;
    badge: string;
    color: string;
    desc: string;
    specs: string[];
    useCase: string;
    why: string;
  }> = {
    host: {
      title: "Proxmox VE Host (Type-1 Bare-Metal Hypervisor)",
      subtitle: "ระบบปฏิบัติการแม่ข่ายหลัก ติดตั้งตรงบน Hardware เซิร์ฟเวอร์",
      icon: "🖥️",
      badge: "Bare-Metal OS",
      color: "#f97316",
      desc: "Proxmox VE พัฒนาบนพื้นฐาน Debian Linux + KVM Kernel ทำหน้าที่เป็นศูนย์กลางบริหารจัดการฮาร์ดแวร์จริง ควบคุม Virtual Machine และ Container ทั้งหมดผ่านหน้าเว็บ Web GUI พอร์ต 8006",
      specs: [
        "🌐 Web GUI: https://192.168.1.50:8006 (จัดการได้จากเบราว์เซอร์ทุกเครื่องในวง LAN)",
        "🌉 Virtual Switch (Bridge: vmbr0): กระจายเครือข่ายให้ทุก VM/CT เชื่อมต่อออกอินเทอร์เน็ตได้",
        "💾 Storage Management: จัดการ Disk, ISO Image, OS Templates, และระบบ Backup อัตโนมัติ"
      ],
      useCase: "ใช้เป็นเซิร์ฟเวอร์แม่ข่ายของห้องแล็บ หรือศูนย์ข้อมูลองค์กรเพื่อรวมเครื่องหลายตัวให้เหลือเครื่องเดียว",
      why: "เป็น Open-Source 100% ประสิทธิภาพสูงเกือบเทียบเท่าฮาร์ดแวร์จริง (Near Bare-Metal Performance)"
    },
    ct101: {
      title: "LXC Container 101: Nginx Web Server",
      subtitle: "ตู้คอนเทนเนอร์ระดับระบบปฏิบัติการ (OS-level Virtualization)",
      icon: "📦",
      badge: "LXC Container",
      color: "#22c55e",
      desc: "LXC ใช้ Linux Kernel ร่วมกับเครื่อง Host ทำให้ไม่ต้องจำลองฮาร์ดแวร์ใหม่ทั้งชุด บูตเปิดเครื่องได้ภายใน 1-2 วินาที และใช้ RAM เริ่มต้นน้อยมากเพียง 256-512MB",
      specs: [
        "🏷️ CT ID: 101 | Hostname: web-server-01",
        "🌐 IP Address: 192.168.1.101/24 (Static IP อิสระในวงแล็บ)",
        "⚡ ทรัพยากร: 1 Core CPU, 512 MB RAM, 10 GB Disk (เพียงพอสำหรับ Web Server)",
        "🚀 บริการ: Nginx Web Server พอร์ต 80 (HTTP)"
      ],
      useCase: "เหมาะสำหรับจัดสรรให้นักศึกษา/ผู้เรียนแต่ละคนมีเครื่องเซิร์ฟเวอร์ประจำตัวคนละตู้ หรือรัน Web App",
      why: "เบา เร็ว และประหยัดทรัพยากรที่สุด เครื่องเซิร์ฟเวอร์ 1 เครื่องสร้างได้หลายสิบตู้พร้อมกัน!"
    },
    ct102: {
      title: "LXC Container 102: React / Node.js Backend",
      subtitle: "ตู้คอนเทนเนอร์สำหรับรัน Application & Database",
      icon: "⚡",
      badge: "LXC Container",
      color: "#3b82f6",
      desc: "ตู้ Linux แยกอิสระ มีสภาพแวดล้อม Root Filesystem ของตนเอง สามารถติดตั้ง Node.js, Python, MariaDB, Docker ได้เหมือนเครื่องจริง",
      specs: [
        "🏷️ CT ID: 102 | Hostname: app-backend-02",
        "🌐 IP Address: 192.168.1.102/24 (Static IP อิสระ)",
        "⚡ ทรัพยากร: 2 Cores CPU, 1024 MB RAM, 15 GB Disk",
        "🚀 บริการ: Node.js / PM2 Process Manager, React Build Server"
      ],
      useCase: "รัน Backend API, Database หรือ Web App โดยไม่รบกวนตู้ Container อื่นๆ",
      why: "แยกสิทธิ์และพื้นที่การทำงานชัดเจน (Isolation) ตู้ใดตู้หนึ่งพัง จะไม่มีผลกระทบต่อตู้ข้างเคียง"
    },
    kvm: {
      title: "KVM Virtual Machine 201: Full OS Emulation",
      subtitle: "เครื่องเสมือนสมบูรณ์แบบ (จำลองทั้ง Virtual Hardware)",
      icon: "💻",
      badge: "KVM VM",
      color: "#a855f7",
      desc: "KVM (Kernel-based Virtual Machine) เป็นการจำลองคอมพิวเตอร์ทั้งเครื่อง (vCPU, vRAM, vDisk, BIOS) ทำให้สามารถติดตั้ง OS ตระกูลใดก็ได้ เช่น Windows Server หรือ Linux แบบ Custom Kernel",
      specs: [
        "🏷️ VM ID: 201 | Name: win-server-vm",
        "🌐 IP Address: 192.168.1.201/24",
        "⚡ ทรัพยากร: 4 Cores CPU, 4096 MB RAM, 50 GB Disk",
        "🚀 ระบบปฏิบัติการ: Windows Server 2022 หรือ Linux พิเศษ"
      ],
      useCase: "งานที่ต้องการระบบปฏิบัติการที่ต่างจาก Host หรือต้องการความปลอดภัยแยกขาดระดับฮาร์ดแวร์",
      why: "รองรับ OS ทุกประเภท แต่กินแรมและ CPU มากกว่า Container"
    }
  };

  const current = nodeDetails[selectedNode] || nodeDetails.host;

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2% 3%",
      background: "radial-gradient(ellipse at 20% 0%, #0d1b2a 0%, #060913 70%, #020408 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "10px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: "11px", color: "#f97316", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            {s.tag || "1. Proxmox VE Architecture & Overview"}
          </span>
          <h2 style={{ margin: "2px 0 0", fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 800, color: "#f8fafc" }}>
            {s.title || "Proxmox ทำอะไรได้บ้าง? โครงสร้างและสถาปัตยกรรมระบบ"}
          </h2>
        </div>
        <div style={{
          background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.4)",
          padding: "5px 12px", borderRadius: "20px", fontSize: "12px", color: "#fdba74", fontWeight: 600
        }}>
          💡 คลิกที่การ์ดเพื่อดูรายละเอียดการทำงาน
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "14px", flex: 1, minHeight: 0 }}>
        {/* Left: Interactive Diagram Map */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)", borderRadius: "14px", padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "10px",
          backdropFilter: "blur(8px)", position: "relative", overflow: "hidden"
        }}>
          {/* Top Level: Management Access */}
          <div style={{
            background: "rgba(30, 41, 59, 0.7)", borderRadius: "10px", padding: "10px 14px",
            border: "1px dashed rgba(59, 130, 246, 0.4)", display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🌐</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa" }}>Web Management Interface (GUI)</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>เข้าถึงผ่านเบราว์เซอร์: <code>https://192.168.1.50:8006</code></div>
              </div>
            </div>
            <span style={{ fontSize: "10px", background: "rgba(59, 130, 246, 0.2)", color: "#93c5fd", padding: "2px 8px", borderRadius: "6px" }}>พอร์ต 8006</span>
          </div>

          {/* Middle Level: Virtual Guests Grid (LXC vs VM) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", flex: 1 }}>
            {/* CT 101 Card */}
            <div
              onClick={() => setSelectedNode("ct101")}
              style={{
                background: selectedNode === "ct101" ? "rgba(34, 197, 94, 0.2)" : "rgba(30, 41, 59, 0.5)",
                border: selectedNode === "ct101" ? "2px solid #22c55e" : "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "10px", padding: "10px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "16px" }}>📦</span>
                  <span style={{ fontSize: "9px", background: "#22c55e", color: "#000", fontWeight: 700, padding: "1px 5px", borderRadius: "4px" }}>LXC</span>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "6px", color: "#4ade80" }}>CT 101: Web</div>
                <div style={{ fontSize: "10px", color: "#cbd5e1" }}>IP: 192.168.1.101</div>
                <div style={{ fontSize: "9.5px", color: "#94a3b8", marginTop: "2px" }}>Nginx Web Server</div>
              </div>
              <div style={{ fontSize: "9px", color: "#86efac", background: "rgba(34, 197, 94, 0.15)", padding: "2px 4px", borderRadius: "4px", textAlign: "center" }}>
                RAM 512MB • บูต 1s
              </div>
            </div>

            {/* CT 102 Card */}
            <div
              onClick={() => setSelectedNode("ct102")}
              style={{
                background: selectedNode === "ct102" ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.5)",
                border: selectedNode === "ct102" ? "2px solid #3b82f6" : "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "10px", padding: "10px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "16px" }}>⚡</span>
                  <span style={{ fontSize: "9px", background: "#3b82f6", color: "#fff", fontWeight: 700, padding: "1px 5px", borderRadius: "4px" }}>LXC</span>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "6px", color: "#60a5fa" }}>CT 102: App</div>
                <div style={{ fontSize: "10px", color: "#cbd5e1" }}>IP: 192.168.1.102</div>
                <div style={{ fontSize: "9.5px", color: "#94a3b8", marginTop: "2px" }}>Node.js / React</div>
              </div>
              <div style={{ fontSize: "9px", color: "#93c5fd", background: "rgba(59, 130, 246, 0.15)", padding: "2px 4px", borderRadius: "4px", textAlign: "center" }}>
                RAM 1GB • Isolation
              </div>
            </div>

            {/* KVM 201 Card */}
            <div
              onClick={() => setSelectedNode("kvm")}
              style={{
                background: selectedNode === "kvm" ? "rgba(168, 85, 247, 0.2)" : "rgba(30, 41, 59, 0.5)",
                border: selectedNode === "kvm" ? "2px solid #a855f7" : "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "10px", padding: "10px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "16px" }}>💻</span>
                  <span style={{ fontSize: "9px", background: "#a855f7", color: "#fff", fontWeight: 700, padding: "1px 5px", borderRadius: "4px" }}>KVM VM</span>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "6px", color: "#c084fc" }}>VM 201: Full OS</div>
                <div style={{ fontSize: "10px", color: "#cbd5e1" }}>IP: 192.168.1.201</div>
                <div style={{ fontSize: "9.5px", color: "#94a3b8", marginTop: "2px" }}>Windows / Linux</div>
              </div>
              <div style={{ fontSize: "9px", color: "#d8b4fe", background: "rgba(168, 85, 247, 0.15)", padding: "2px 4px", borderRadius: "4px", textAlign: "center" }}>
                Full Hardware VM
              </div>
            </div>
          </div>

          {/* Proxmox VE Hypervisor Core Card */}
          <div
            onClick={() => setSelectedNode("host")}
            style={{
              background: selectedNode === "host" ? "rgba(249, 115, 22, 0.25)" : "rgba(249, 115, 22, 0.12)",
              border: selectedNode === "host" ? "2px solid #f97316" : "1px solid rgba(249, 115, 22, 0.4)",
              borderRadius: "10px", padding: "10px 14px", cursor: "pointer", transition: "all 0.2s",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🖥️</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#fb923c" }}>Proxmox Virtual Environment (PVE)</div>
                <div style={{ fontSize: "10.5px", color: "#cbd5e1" }}>Type-1 Bare-Metal Hypervisor (Debian Kernel + KVM + LXC Core)</div>
              </div>
            </div>
            <span style={{ fontSize: "10px", background: "#f97316", color: "#000", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>
              HOST NODE
            </span>
          </div>

          {/* Bottom Level: Physical Hardware & Bridge */}
          <div style={{
            background: "rgba(15, 23, 42, 0.9)", borderRadius: "10px", padding: "8px 12px",
            border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "space-around",
            fontSize: "10px", color: "#94a3b8"
          }}>
            <span>⚙️ CPU: Intel/AMD VT-x</span>
            <span>💾 Storage: NVMe / SSD / ZFS</span>
            <span>🌉 Network: Bridge vmbr0</span>
            <span>🔌 LAN: 1 GbE NIC</span>
          </div>
        </div>

        {/* Right: Inspector Detail Panel */}
        <div style={{
          background: "rgba(15, 23, 42, 0.7)", borderRadius: "14px", padding: "16px",
          border: `1px solid ${current.color}40`, display: "flex", flexDirection: "column",
          gap: "10px", overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{
                background: `${current.color}25`, color: current.color,
                padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700
              }}>
                {current.badge}
              </span>
              <h3 style={{ margin: "6px 0 2px", fontSize: "16px", fontWeight: 800, color: "#f8fafc" }}>
                {current.icon} {current.title}
              </h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{current.subtitle}</p>
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: 1.5, background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px" }}>
            {current.desc}
          </div>

          {/* Specs & Capabilities */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: current.color, marginBottom: "4px" }}>
              📋 รายละเอียดและบทบาทหน้าที่:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {current.specs.map((spec, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#cbd5e1", background: "rgba(255,255,255,0.03)", padding: "5px 8px", borderRadius: "6px" }}>
                  {spec}
                </div>
              ))}
            </div>
          </div>

          {/* Use case & Why */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginTop: "auto" }}>
            <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "8px", padding: "8px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#4ade80" }}>🎯 การนำไปใช้งานจริง:</div>
              <div style={{ fontSize: "10.5px", color: "#e2e8f0", marginTop: "2px" }}>{current.useCase}</div>
            </div>
            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: "8px", padding: "8px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#60a5fa" }}>💡 ทำไมต้องใช้?</div>
              <div style={{ fontSize: "10.5px", color: "#e2e8f0", marginTop: "2px" }}>{current.why}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROXMOX INSTALLATION STEPS VISUALIZER (WEEK 12a)
   ============================================================ */
function ProxmoxInstallStepVisualizer({ s }: { s: SlideData }) {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      num: "1",
      name: "USB & BIOS",
      title: "ขั้นตอนที่ 1: เตรียม Flash Drive ISO & เปิด Virtualization ใน BIOS",
      tag: "Hardware Prep & BIOS",
      icon: "💽",
      color: "#3b82f6",
      keySummary: "ดาวน์โหลดไฟล์ ISO เขียนลง USB และเปิด Intel VT-x / AMD-V ใน BIOS",
      screenTitle: "BIOS / UEFI Setup Utility — Advanced CPU Configuration",
      screenLines: [
        "CPU Configuration:",
        "> Intel (VMX) Virtualization Technology ............ [Enabled]  <-- สำคัญมาก!",
        "> VT-d / AMD-V Support ............................. [Enabled]",
        "> Secure Boot ...................................... [Disabled / Other OS]",
        "> Boot Option #1 ................................... [UEFI: SanDisk USB 3.0]"
      ],
      checkList: [
        "ดาวน์โหลด Proxmox VE ISO Installer จากเว็บไซต์ทางการ proxmox.com",
        "เขียนไฟล์ ISO ลงแฟลชไดรฟ์ด้วยโปรแกรม Rufus (เลือกโหมด DD) หรือ BalenaEtcher",
        "เสียบ Flash Drive เข้าเซิร์ฟเวอร์ เปิดเครื่องแล้วกด F2, F12 หรือ Del เข้า BIOS",
        "เปิด Virtualization Technology (Intel VT-x หรือ AMD-V) ให้เป็น Enabled เสมอ!"
      ],
      tip: "💡 หากใน BIOS ปิด VT-x ไว้ Proxmox จะแจ้งเตือน 'KVM acceleration not available' และไม่สามารถเปิดเครื่องเสมือนได้"
    },
    {
      num: "2",
      name: "บูต & เลือกดิสก์",
      title: "ขั้นตอนที่ 2: เริ่มต้นตัวติดตั้ง (Installer) & เลือก Target Harddisk",
      tag: "Boot & Target Disk",
      icon: "🖥️",
      color: "#06b6d4",
      keySummary: "เลือก Install Proxmox VE (Graphical), ยอมรับ EULA และเลือกไดรฟ์ SSD",
      screenTitle: "Proxmox VE 8.x Graphical Installer — Target Harddisk",
      screenLines: [
        "+----------------------------------------------------------------+",
        "| Proxmox Virtual Environment (PVE)                              |",
        "|                                                                |",
        "|  Target Harddisk: [/dev/nvme0n1 - 500GB NVMe SSD          v]   |",
        "|  Filesystem:      [ext4 (หรือ zfs-raid1 ในกรณีมี 2 ลูก)    v]   |",
        "|                                                                |",
        "|  [ Options ]                                [ Next Step -> ]   |",
        "+----------------------------------------------------------------+"
      ],
      checkList: [
        "ที่เมนูบูต เลือก 'Install Proxmox VE (Graphical)' แล้วกด Enter",
        "อ่านและกดยอมรับข้อตกลงสิทธิ์การใช้งาน (End User License Agreement: EULA)",
        "เลือกดิสก์เป้าหมายสำหรับติดตั้ง (Target Harddisk เช่น SSD หรือ NVMe หลักของเครื่อง)",
        "ข้อควรระวัง: ระบบจะ Format ลบข้อมูลเก่าทั้งหมดในดิสก์ที่เลือกเพื่อเตรียมพื้นที่ใหม่"
      ],
      tip: "⚠️ ตรวจสอบให้แน่ใจว่าเลือกดิสก์ถูกต้อง เพราะข้อมูลเดิมในไดรฟ์นั้นจะถูกล้างทิ้งทั้งหมด"
    },
    {
      num: "3",
      name: "Timezone & ภาษา",
      title: "ขั้นตอนที่ 3: กำหนดประเทศ โซนเวลา และภาษาคีย์บอร์ด",
      tag: "Location & Timezone",
      icon: "🌍",
      color: "#10b981",
      keySummary: "ตั้งค่า Country เป็น Thailand และ Timezone เป็น Asia/Bangkok",
      screenTitle: "Proxmox VE Installer — Location and Time Zone Selection",
      screenLines: [
        "+----------------------------------------------------------------+",
        "| Location and Time Zone:                                        |",
        "|                                                                |",
        "|  Country:         [ Thailand                               v]  |",
        "|  Time zone:       [ Asia/Bangkok                           v]  |",
        "|  Keyboard Layout: [ U.S. English                           v]  |",
        "|                                                                |",
        "|  [ <- Back ]                                [ Next Step -> ]   |",
        "+----------------------------------------------------------------+"
      ],
      checkList: [
        "ช่อง Country พิมพ์ค้นหา 'Thailand'",
        "ช่อง Time zone จะเลือกเป็น 'Asia/Bangkok' โดยอัตโนมัติ",
        "Keyboard Layout เลือกเป็น 'U.S. English'",
        "กดปุ่ม Next เพื่อไปยังขั้นตอนถัดไป"
      ],
      tip: "🕒 การตั้ง Timezone ให้ถูกต้องจะทำให้ Log และเวลาของระบบใน Container ตรงกับเวลาจริงในประเทศไทย"
    },
    {
      num: "4",
      name: "รหัสผ่าน Admin",
      title: "ขั้นตอนที่ 4: ตั้งรหัสผ่านผู้ดูแลระบบ (Root Password) & Email",
      tag: "Admin Credentials",
      icon: "🔑",
      color: "#f59e0b",
      keySummary: "ตั้งรหัสผ่านสำหรับ user root และกรอกอีเมลแจ้งเตือนของกลุ่ม",
      screenTitle: "Proxmox VE Installer — Administration Password and Email",
      screenLines: [
        "+----------------------------------------------------------------+",
        "| Administrator Password & Email:                                |",
        "|                                                                |",
        "|  Password:         [ ••••••••••••••••                        ] |",
        "|  Confirm Password: [ ••••••••••••••••                        ] |",
        "|  Email:            [ admin-group1@lab.local                  ] |",
        "|                                                                |",
        "|  [ <- Back ]                                [ Next Step -> ]   |",
        "+----------------------------------------------------------------+"
      ],
      checkList: [
        "กำหนดรหัสผ่าน root ที่ปลอดภัยและจำได้สำหรับสมาชิกในกลุ่ม",
        "พิมพ์รหัสผ่านซ้ำในช่อง Confirm Password ให้ตรงกัน",
        "กรอก Email สำหรับรับการแจ้งเตือนสถานะความผิดปกติของเซิร์ฟเวอร์",
        "จดบันทึกรหัสผ่าน root ไว้ เพราะต้องใช้เข้าหน้า Web GUI และคำสั่ง root ทาง SSH"
      ],
      tip: "🔒 รหัสผ่าน root นี้มีสิทธิ์สูงสุดในการควบคุมเซิร์ฟเวอร์ทั้งหมด ห้ามลืมเด็ดขาด!"
    },
    {
      num: "5",
      name: "ตั้งค่า IP Network",
      title: "ขั้นตอนที่ 5: กำหนดค่าเครือข่าย Management Network (หัวใจสำคัญ)",
      tag: "Management IP & Network",
      icon: "🌐",
      color: "#8b5cf6",
      keySummary: "กำหนด Hostname, Static IP (เช่น 192.168.1.50/24), Gateway และ DNS",
      screenTitle: "Proxmox VE Installer — Management Network Configuration",
      screenLines: [
        "+----------------------------------------------------------------+",
        "| Management Network Configuration:                              |",
        "|                                                                |",
        "|  Management Interface: [ enp3s0 (00:1a:2b:3c:4d:5e)         v] |",
        "|  Hostname (FQDN):      [ proxmox-g1.lab.local                ] |",
        "|  IP Address (CIDR):    [ 192.168.1.50/24                     ] |",
        "|  Gateway:              [ 192.168.1.1                         ] |",
        "|  DNS Server:           [ 192.168.1.1                         ] |",
        "|                                                                |",
        "|  [ <- Back ]                                [ Install Now! ]   |",
        "+----------------------------------------------------------------+"
      ],
      checkList: [
        "Management Interface: เลือกการ์ดแลนที่ต่อสายแลนจริง (เช่น enp3s0 หรือ eth0)",
        "Hostname (FQDN): ตั้งชื่อเครื่อง เช่น proxmox-g1.lab.local",
        "IP Address (CIDR): ใส่ IP คงที่ของเครื่อง เช่น 192.168.1.50/24 (ห้ามชนกับกลุ่มอื่น!)",
        "Gateway & DNS: ระบุ IP ของ Router ห้องแล็บ เช่น 192.168.1.1",
        "กด Install แล้วรอแถบความคืบหน้าจนครบ 100% เครื่องจะรีบูตเข้าสู่ Proxmox"
      ],
      tip: "⭐ IP นี้จะเป็น IP Address ถาวรที่ใช้เปิดหน้าเว็บควบคุม Proxmox Web GUI"
    },
    {
      num: "6",
      name: "เข้าใช้งาน Web GUI",
      title: "ขั้นตอนที่ 6: การติดตั้งเสร็จสมบูรณ์ และการเข้าสู่ Proxmox Web GUI",
      tag: "Login & Web GUI",
      icon: "🚀",
      color: "#ec4899",
      keySummary: "เปิดเบราว์เซอร์เข้า https://IP:8006 ล็อกอินด้วย root และรหัสผ่านที่ตั้งไว้",
      screenTitle: "Web Browser — Proxmox Virtual Environment Web Management",
      screenLines: [
        "URL: https://192.168.1.50:8006/",
        "-----------------------------------------------------------------",
        "  Welcome to Proxmox VE Web Management Console",
        "",
        "  User name: [ root                                           ]",
        "  Password:  [ ••••••••••••••••                               ]",
        "  Realm:     [ Linux PAM standard authentication             v]",
        "  Language:  [ English                                       v]",
        "",
        "  [ Login ] -> เข้าสู่ระบบสำเร็จ ยินดีต้อนรับสู่ Proxmox VE!"
      ],
      checkList: [
        "เมื่อบูตเสร็จ หน้าจอเซิร์ฟเวอร์จะขึ้นข้อความ: Welcome to Proxmox VE URL: https://IP:8006",
        "เปิดเว็บเบราว์เซอร์จากคอมพิวเตอร์ในวง LAN พิมพ์ URL: https://192.168.1.50:8006",
        "เบราว์เซอร์จะขึ้นเตือน SSL ให้กด 'Advanced' -> 'Proceed to IP (unsafe)'",
        "กรอก User name: 'root' และ Password ที่ตั้งไว้ -> กด Login เพื่อเข้าสู่แผงควบคุม"
      ],
      tip: "🎉 ยินดีด้วย! เครื่องเซิร์ฟเวอร์ของคุณพร้อมสำหรับสร้าง Container แล้ว"
    }
  ];

  const current = steps[activeStep];

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2% 3%",
      background: "radial-gradient(ellipse at 50% 0%, #0c1a2e 0%, #060913 75%, #020408 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "10px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: "11px", color: current.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            {s.tag || "2. Proxmox Installation Steps"}
          </span>
          <h2 style={{ margin: "2px 0 0", fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 800, color: "#f8fafc" }}>
            {s.title || "ขั้นตอนการติดตั้ง Proxmox VE ลงบนเครื่องเซิร์ฟเวอร์จริง"}
          </h2>
        </div>

        {/* Step Prev/Next buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            style={{
              background: activeStep === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)", color: activeStep === 0 ? "#64748b" : "#fff",
              padding: "5px 12px", borderRadius: "8px", cursor: activeStep === 0 ? "not-allowed" : "pointer",
              fontSize: "12px", fontWeight: 600
            }}
          >
            ◀ ย้อนกลับ
          </button>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>
            {activeStep + 1} / {steps.length}
          </span>
          <button
            onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={activeStep === steps.length - 1}
            style={{
              background: activeStep === steps.length - 1 ? "rgba(255,255,255,0.05)" : current.color,
              border: "1px solid rgba(255,255,255,0.2)", color: activeStep === steps.length - 1 ? "#64748b" : "#000",
              padding: "5px 12px", borderRadius: "8px", cursor: activeStep === steps.length - 1 ? "not-allowed" : "pointer",
              fontSize: "12px", fontWeight: 700
            }}
          >
            ขั้นตอนถัดไป ▶
          </button>
        </div>
      </div>

      {/* Step Pills Bar */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: "6px", flexShrink: 0 }}>
        {steps.map((st, i) => {
          const isActive = activeStep === i;
          return (
            <div
              key={i}
              onClick={() => setActiveStep(i)}
              style={{
                background: isActive ? `${st.color}25` : "rgba(30, 41, 59, 0.4)",
                border: isActive ? `2px solid ${st.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px", padding: "6px 8px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: isActive ? st.color : "rgba(255,255,255,0.1)",
                color: isActive ? "#000" : "#94a3b8", fontWeight: 800, fontSize: "11px",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                {st.num}
              </div>
              <div style={{ fontSize: "11px", fontWeight: isActive ? 800 : 500, color: isActive ? "#fff" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {st.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content: Screen Mockup & Checklist */}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "14px", flex: 1, minHeight: 0 }}>
        {/* Left: Graphical Screen Mockup */}
        <div style={{
          background: "#080c14", borderRadius: "14px", border: `1px solid ${current.color}40`,
          display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 8px 30px rgba(0,0,0,0.5)`
        }}>
          {/* Screen Titlebar */}
          <div style={{
            background: "#111827", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "8px", fontWeight: 600, fontFamily: "monospace" }}>
                {current.screenTitle}
              </span>
            </div>
            <span style={{ fontSize: "10px", background: `${current.color}30`, color: current.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
              STEP {current.num}
            </span>
          </div>

          {/* Screen Body */}
          <div style={{
            padding: "16px", flex: 1, display: "flex", flexDirection: "column",
            justifyContent: "center", fontFamily: "monospace", fontSize: "12px",
            lineHeight: "1.7", color: "#e2e8f0", background: "linear-gradient(180deg, #090d16 0%, #030712 100%)"
          }}>
            {current.screenLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: line.includes("Enabled") || line.includes("100%") || line.includes("Login")
                    ? "#4ade80"
                    : line.includes("192.168.1.50") || line.includes("Password")
                    ? "#60a5fa"
                    : line.includes("Thailand") || line.includes("Asia/Bangkok")
                    ? "#fcd34d"
                    : "#cbd5e1"
                }}
              >
                {line}
              </div>
            ))}
          </div>

          {/* Screen Footer Status */}
          <div style={{
            background: "#0f172a", padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: "11px", color: "#94a3b8", display: "flex", justifyContent: "space-between"
          }}>
            <span>📌 สถานะ: รอดำเนินการตามขั้นตอน</span>
            <span style={{ color: current.color, fontWeight: 700 }}>{current.tag}</span>
          </div>
        </div>

        {/* Right: Step Checklist & Tips */}
        <div style={{
          background: "rgba(15, 23, 42, 0.7)", borderRadius: "14px", padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column",
          gap: "10px", overflowY: "auto"
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: current.color, textTransform: "uppercase" }}>
              {current.icon} สรุปการตั้งค่าในขั้นตอนนี้
            </div>
            <h3 style={{ margin: "4px 0 2px", fontSize: "15px", fontWeight: 800, color: "#f8fafc" }}>
              {current.title}
            </h3>
            <p style={{ margin: 0, fontSize: "11.5px", color: "#94a3b8" }}>{current.keySummary}</p>
          </div>

          {/* Checklist */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
              ✅ สิ่งที่ต้องปฏิบัติ:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {current.checkList.map((item, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "11.5px",
                  color: "#e2e8f0", background: "rgba(255,255,255,0.03)", padding: "7px 10px", borderRadius: "8px"
                }}>
                  <span style={{ color: current.color, fontWeight: 700 }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip Box */}
          <div style={{
            background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "10px", padding: "10px 12px", marginTop: "auto", fontSize: "11px", color: "#fef3c7", lineHeight: 1.5
          }}>
            {current.tip}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROXMOX CREATE CONTAINER STEP-BY-STEP VISUALIZER (WEEK 12a)
   ============================================================ */
function ProxmoxCreateCTVisualizer({ s }: { s: SlideData }) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [sshConnected, setSshConnected] = useState(false);

  const tabs = [
    {
      id: "template",
      tabName: "1. โหลด Template",
      icon: "📥",
      title: "ขั้นตอนที่ 1: ดาวน์โหลดแม่แบบระบบปฏิบัติการ (OS Template)",
      badge: "Storage: local",
      color: "#06b6d4",
      desc: "ก่อนสร้างตู้ Container จะต้องดาวน์โหลดแม่แบบ OS (เช่น Ubuntu 22.04) มาเก็บไว้ในเครื่อง Proxmox ก่อน โดยทำเพียงครั้งเดียว",
      uiPreview: {
        location: "Node: pve-server > local (pve-server) > CT Templates",
        fields: [
          { label: "เลือก Storage", value: "local", note: "ไดรฟ์จัดเก็บไฟล์ระบบของ Proxmox" },
          { label: "เมนู", value: "CT Templates -> คลิกปุ่ม 'Templates'", note: "เปิดหน้ารายการ OS ที่มีให้โหลด" },
          { label: "เลือกดาวน์โหลด", value: "ubuntu-22.04-standard_22.04-1_amd64.tar.zst", note: "Ubuntu 22.04 LTS ยอดนิยม" }
        ],
        action: "คลิกปุ่ม 'Download' แล้วรอจนขึ้นข้อความ TASK OK"
      },
      hint: "💡 นอกจาก Ubuntu ยังมี Debian, Alpine (ขนาดเล็กเพียง 5MB) และ CentOS ให้เลือกใช้"
    },
    {
      id: "general",
      tabName: "2. General & รหัส",
      icon: "🏷️",
      title: "ขั้นตอนที่ 2: กดปุ่ม Create CT & กำหนดชื่อตู้และรหัสผ่าน",
      badge: "Dialog: General",
      color: "#3b82f6",
      desc: "คลิกปุ่มสีฟ้า 'Create CT' ที่มุมขวาบนของหน้าจอ Proxmox แล้วระบุข้อมูลพื้นฐานของตู้",
      uiPreview: {
        location: "Create: LXC Container Wizard > Tab 1: General",
        fields: [
          { label: "Node", value: "pve-server", note: "เครื่องแม่ข่ายหลัก" },
          { label: "CT ID", value: "101", note: "หมายเลขประจำตู้ (เช่น 101, 102... ห้ามซ้ำกัน)" },
          { label: "Hostname", value: "web-server-01", note: "ชื่อเครื่อง Container ของคุณ" },
          { label: "Password", value: "••••••••", note: "ตั้งรหัสผ่าน root สำหรับล็อกอินเข้าตู้นี้" },
          { label: "Confirm Password", value: "••••••••", note: "ยืนยันรหัสผ่านอีกครั้ง" }
        ],
        action: "กดปุ่ม 'Next' เพื่อไปเลือก Template"
      },
      hint: "🔑 รหัสผ่านนี้คือรหัสผ่าน root ของ Container เอง (คนละตัวกับรหัสผ่าน Proxmox หลัก)"
    },
    {
      id: "template_disk",
      tabName: "3. Disks & Storage",
      icon: "💾",
      title: "ขั้นตอนที่ 3: เลือก OS Template และกำหนดขนาดความจุพื้นที่ดิสก์",
      badge: "Dialog: Disks",
      color: "#10b981",
      desc: "เลือกไฟล์ Ubuntu Template ที่โหลดไว้ และกำหนดขนาดพื้นที่ Harddisk ที่ตู้จะได้รับ",
      uiPreview: {
        location: "Create: LXC Container Wizard > Tab 2 & 3: Template & Disks",
        fields: [
          { label: "Storage (Template)", value: "local", note: "ตำแหน่งที่เก็บ Template" },
          { label: "Template", value: "ubuntu-22.04-standard", note: "เลือกไฟล์ที่ดาวน์โหลดไว้ในขั้นตอนที่ 1" },
          { label: "Storage (Root Disk)", value: "local-lvm (หรือ local)", note: "Storage สำหรับเก็บ Disk ของตู้" },
          { label: "Disk Size (GiB)", value: "15 GiB", note: "พื้นที่ดิสก์สำหรับ OS และโปรแกรม (10-20GB)" }
        ],
        action: "กดปุ่ม 'Next' เพื่อไปกำหนด CPU & RAM"
      },
      hint: "📦 15 GB เพียงพอสำหรับระบบปฏิบัติการ, Nginx, Node.js และเว็บแอปพลิเคชันทั่วไป"
    },
    {
      id: "cpu_ram",
      tabName: "4. CPU & RAM",
      icon: "⚡",
      title: "ขั้นตอนที่ 4: จัดสรรทรัพยากรประมวลผล (CPU Cores) และหน่วยความจำ (RAM)",
      badge: "Dialog: CPU & Memory",
      color: "#f59e0b",
      desc: "กำหนดจำนวน Core และ RAM ให้เหมาะสมกับงานที่ต้องการรัน",
      uiPreview: {
        location: "Create: LXC Container Wizard > Tab 4 & 5: CPU & Memory",
        fields: [
          { label: "Cores (CPU)", value: "1 Core (หรือ 2 Cores)", note: "จำนวนแกนประมวลผล" },
          { label: "Memory (MB)", value: "1024 MB (1 GB RAM)", note: "หน่วยความจำ RAM ประจำตู้" },
          { label: "Swap (MB)", value: "512 MB", note: "พื้นที่แรมเสมือนบนดิสก์สำรอง" }
        ],
        action: "กดปุ่ม 'Next' เพื่อไปตั้งค่าระบบเครือข่าย IP"
      },
      hint: "⚡ LXC มีประสิทธิภาพสูงมาก 1GB RAM สามารถรัน Web Server และ React ได้อย่างลื่นไหล"
    },
    {
      id: "network",
      tabName: "5. Network (Static IP)",
      icon: "🌐",
      title: "ขั้นตอนที่ 5: ตั้งค่าเครือข่าย Bridge & กำหนดหมายเลข Static IP",
      badge: "Dialog: Network",
      color: "#8b5cf6",
      desc: "กำหนดหมายเลข IP ประจำตู้ในวง LAN เพื่อให้คนอื่นสามารถเข้าชมเว็บหรือ SSH เข้ามาได้",
      uiPreview: {
        location: "Create: LXC Container Wizard > Tab 6: Network",
        fields: [
          { label: "Name (Interface)", value: "eth0", note: "การ์ดแลนเสมือนของตู้" },
          { label: "Bridge", value: "vmbr0", note: "เชื่อมต่อกับ Bridge หลักของ Proxmox" },
          { label: "IPv4", value: "Static", note: "เลือกเป็นแบบ Static กำหนด IP คงที่" },
          { label: "IPv4/CIDR", value: "192.168.1.101/24", note: "หมายเลข IP ประจำตู้ (ห้ามชนกับตู้คนอื่น!)" },
          { label: "Gateway (IPv4)", value: "192.168.1.1", note: "IP ของ Router เพื่อให้ออกเน็ตได้" }
        ],
        action: "กด 'Next' -> ตรวจสอบข้อมูลในแท็บ Confirm -> กดปุ่ม 'Finish'"
      },
      hint: "🌐 การใส่ /24 ด้านหลัง IP (CIDR notation) หมายถึง Subnet Mask 255.255.255.0"
    },
    {
      id: "start_ssh",
      tabName: "6. Start & ควบคุม",
      icon: "🚀",
      title: "ขั้นตอนที่ 6: สั่ง Start ตู้ และล็อกอินเข้าใช้งานผ่าน Console หรือ SSH",
      badge: "Start & Manage",
      color: "#ec4899",
      desc: "สั่งรัน Container และทดสอบล็อกอินเข้าไปติดตั้งโปรแกรมได้ทันที",
      uiPreview: {
        location: "Proxmox Tree > 101 (web-server-01) > Console / SSH",
        fields: [
          { label: "1. สั่งเปิดตู้", value: "คลิกปุ่ม 'Start' ด้านบนขวา", note: "ตู้จะพร้อมทำงานใน 1-2 วินาที" },
          { label: "2. เข้าผ่าน Web Console", value: "คลิกเมนู 'Console' บนหน้าเว็บ Proxmox", note: "ล็อกอินด้วย root + Password" },
          { label: "3. เชื่อมต่อผ่าน SSH", value: "ssh root@192.168.1.101", note: "เข้าควบคุมทางไกลผ่าน Terminal" }
        ],
        action: "พร้อมติดตั้งโปรแกรม: apt update && apt install -y nginx"
      },
      hint: "🎉 Container ของคุณพร้อมใช้งานแล้ว สามารถติดตั้ง Nginx หรือ Node.js ได้เหมือนเครื่องเซิร์ฟเวอร์จริง!"
    }
  ];

  const current = tabs[activeTab];

  return (
    <div className="slide slide-content" style={{
      display: "flex", flexDirection: "column", height: "100%", padding: "2% 3%",
      background: "radial-gradient(ellipse at 50% 0%, #0f172a 0%, #060913 75%, #020408 100%)",
      color: "#fff", fontFamily: "'Noto Sans Thai', sans-serif", boxSizing: "border-box", gap: "10px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: "11px", color: current.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            {s.tag || "3. How to Create LXC Container"}
          </span>
          <h2 style={{ margin: "2px 0 0", fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 800, color: "#f8fafc" }}>
            {s.title || "วิธีสร้าง LXC Container บน Proxmox VE แบบ Step-by-Step"}
          </h2>
        </div>

        {/* Step Prev/Next buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
            disabled={activeTab === 0}
            style={{
              background: activeTab === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)", color: activeTab === 0 ? "#64748b" : "#fff",
              padding: "5px 12px", borderRadius: "8px", cursor: activeTab === 0 ? "not-allowed" : "pointer",
              fontSize: "12px", fontWeight: 600
            }}
          >
            ◀ ย้อนกลับ
          </button>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>
            {activeTab + 1} / {tabs.length}
          </span>
          <button
            onClick={() => setActiveTab(prev => Math.min(tabs.length - 1, prev + 1))}
            disabled={activeTab === tabs.length - 1}
            style={{
              background: activeTab === tabs.length - 1 ? "rgba(255,255,255,0.05)" : current.color,
              border: "1px solid rgba(255,255,255,0.2)", color: activeTab === tabs.length - 1 ? "#64748b" : "#000",
              padding: "5px 12px", borderRadius: "8px", cursor: activeTab === tabs.length - 1 ? "not-allowed" : "pointer",
              fontSize: "12px", fontWeight: 700
            }}
          >
            ขั้นตอนถัดไป ▶
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, gap: "6px", flexShrink: 0 }}>
        {tabs.map((tb, i) => {
          const isActive = activeTab === i;
          return (
            <div
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                background: isActive ? `${tb.color}25` : "rgba(30, 41, 59, 0.4)",
                border: isActive ? `2px solid ${tb.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px", padding: "6px 8px", cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              <span style={{ fontSize: "14px" }}>{tb.icon}</span>
              <div style={{ fontSize: "11px", fontWeight: isActive ? 800 : 500, color: isActive ? "#fff" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {tb.tabName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "14px", flex: 1, minHeight: 0 }}>
        {/* Left: Form Mockup / Dialog UI */}
        <div style={{
          background: "#080c14", borderRadius: "14px", border: `1px solid ${current.color}40`,
          display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
        }}>
          {/* Modal Header */}
          <div style={{
            background: "#1e293b", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>📦</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
                {current.uiPreview.location}
              </span>
            </div>
            <span style={{ fontSize: "10px", background: `${current.color}30`, color: current.color, padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
              {current.badge}
            </span>
          </div>

          {/* Form Fields Simulation */}
          <div style={{
            padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "10px",
            background: "linear-gradient(180deg, #090d16 0%, #030712 100%)", overflowY: "auto"
          }}>
            {current.uiPreview.fields.map((f, idx) => (
              <div key={idx} style={{
                background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{f.label}</div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#60a5fa", fontFamily: "monospace", marginTop: "2px" }}>
                    {f.value}
                  </div>
                </div>
                <div style={{ fontSize: "10px", color: "#cbd5e1", background: "rgba(0,0,0,0.3)", padding: "3px 8px", borderRadius: "6px", maxWidth: "45%", textAlign: "right" }}>
                  {f.note}
                </div>
              </div>
            ))}

            {/* Action Bar */}
            <div style={{
              marginTop: "auto", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "11px", color: "#a7f3d0", fontWeight: 600 }}>👉 การดำเนินการ:</span>
              <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 700 }}>{current.uiPreview.action}</span>
            </div>
          </div>
        </div>

        {/* Right: Step Explanation & Interactive Simulation */}
        <div style={{
          background: "rgba(15, 23, 42, 0.7)", borderRadius: "14px", padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column",
          gap: "10px", overflowY: "auto"
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: current.color, textTransform: "uppercase" }}>
              {current.icon} สรุปขั้นตอน
            </div>
            <h3 style={{ margin: "4px 0 2px", fontSize: "15px", fontWeight: 800, color: "#f8fafc" }}>
              {current.title}
            </h3>
            <p style={{ margin: 0, fontSize: "11.5px", color: "#94a3b8" }}>{current.desc}</p>
          </div>

          {/* Interactive Simulation Box */}
          <div style={{
            background: "#030712", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
            padding: "10px", display: "flex", flexDirection: "column", gap: "8px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>🖥️ Terminal Simulation</span>
              <button
                onClick={() => setSshConnected(!sshConnected)}
                style={{
                  background: sshConnected ? "#ef4444" : "#22c55e", color: "#fff",
                  border: "none", padding: "3px 10px", borderRadius: "6px", fontSize: "10px",
                  fontWeight: 700, cursor: "pointer"
                }}
              >
                {sshConnected ? "🔌 Disconnect" : "🚀 Test SSH Connect"}
              </button>
            </div>

            <div style={{ fontFamily: "monospace", fontSize: "11px", lineHeight: 1.5, color: "#e2e8f0" }}>
              <div>$ ssh root@192.168.1.101</div>
              {sshConnected ? (
                <div style={{ color: "#4ade80", marginTop: "4px" }}>
                  <div>Welcome to Ubuntu 22.04.4 LTS (GNU/Linux x86_64)</div>
                  <div>root@web-server-01:~# systemctl status nginx</div>
                  <div style={{ color: "#93c5fd" }}>● nginx.service - active (running) [Port 80]</div>
                </div>
              ) : (
                <div style={{ color: "#64748b", marginTop: "4px" }}>
                  // กดปุ่ม Test SSH Connect ด้านบนเพื่อจำลองการเชื่อมต่อ
                </div>
              )}
            </div>
          </div>

          {/* Hint */}
          <div style={{
            background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)",
            borderRadius: "10px", padding: "10px 12px", marginTop: "auto", fontSize: "11px", color: "#bfdbfe", lineHeight: 1.5
          }}>
            {current.hint}
          </div>
        </div>
      </div>
    </div>
  );
}

