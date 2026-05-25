"use client";
import { useState, useEffect, useCallback } from "react";

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
}
interface WeekData {
  week: string; title: string; topic: string; description: string;
  learningObjectives: string[];
  slides: SlideData[];
}
interface SessionMeta { id: string; displayNum: string; title: string; topic: string; disabled?: boolean; }
interface WeekGroup { weekLabel: string; sessions: SessionMeta[]; }

/* --- SVG Icons --- */
const MenuIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const ChevLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>;
const ChevRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,6 15,12 9,18"/></svg>;
const MaxIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>;
const MinIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6m10-10h-6V4m0 6l7-7M3 21l7-7"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const NoteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;

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

function ContentSlide({ s }: { s: SlideData }) {
  return (
    <div className="slide slide-content">
      <div className="slide-tag">{s.tag}</div>
      <h2>{s.title}</h2>
      {s.body && <p style={{ fontSize: 'clamp(20px,2.5vw,32px)', color: 'var(--text-secondary)', marginBottom: 20 }}>{s.body}</p>}
      <div style={{ display: 'flex', gap: '30px', flex: 1 }}>
        <div style={{ flex: s.image ? 1 : 'auto' }}>
          <ul>{s.items?.map((item, i) => <li key={i}>{item}</li>)}</ul>
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
            <ul>{col.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
          </div>
        ))}
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
            {s.objectives?.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
        <div className="lab-col">
          <div className="lab-section-title">📋 ขั้นตอน</div>
          <ul className="steps">
            {s.steps?.map((st, i) => <li key={i} data-step={`${i + 1}.`}>{st}</li>)}
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
      <ul>{s.items?.map((item, i) => <li key={i}>{item}</li>)}</ul>
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
            {i < 3 && <polygon points={`${cx+92},65 ${cx+102},70 ${cx+92},75`} fill={colors[i+1]} />}
          </g>
        );
      })}
      <text x="280" y="160" textAnchor="middle" fontSize={11} fill="#4a5568">กระบวนการขอ IP อัตโนมัติ (DHCP)</text>
    </svg>
  );
}

function DiagramDNS() {
  const box = (x:number,y:number,w:number,color:string,label:string,sub:string) => (
    <g>
      <rect x={x} y={y} width={w} height={50} rx={8} fill="#191d29" stroke={color} strokeWidth={1.5}/>
      <text x={x+w/2} y={y+22} textAnchor="middle" fontSize={12} fill="#e8eaf0" fontFamily="Inter,sans-serif">{label}</text>
      <text x={x+w/2} y={y+38} textAnchor="middle" fontSize={9} fill="#8892a4" fontFamily="Inter,sans-serif">{sub}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {box(20,20,150,"#22d3ee","💻 Browser","พิมพ์ google.com")}
      <line x1="170" y1="45" x2="205" y2="45" stroke="#22d3ee" strokeWidth={1.5}/>
      <polygon points="205,40 215,45 205,50" fill="#22d3ee"/>
      {box(215,20,130,"#a78bfa","🌍 Root DNS","ชี้ไปยัง .com TLD")}
      <line x1="345" y1="45" x2="380" y2="45" stroke="#a78bfa" strokeWidth={1.5}/>
      <polygon points="380,40 390,45 380,50" fill="#a78bfa"/>
      {box(390,20,150,"#f59e0b","📂 .com TLD","ชี้ไปยัง google.com")}
      <line x1="465" y1="70" x2="465" y2="105" stroke="#f59e0b" strokeWidth={1.5}/>
      <polygon points="460,105 465,115 470,105" fill="#22c55e"/>
      {box(390,115,150,"#22c55e","🎯 Authoritative","google.com = 142.250.x.x")}
      <line x1="390" y1="140" x2="170" y2="140" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5,3"/>
      <polygon points="170,135 160,140 170,145" fill="#22c55e"/>
      <text x="280" y="180" textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="Inter,sans-serif">DNS Resolution แปลงชื่อ → IP Address</text>
    </svg>
  );
}

function DiagramNOSvsDesktop() {
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      {/* NOS Side */}
      <rect x="20" y="20" width="240" height="160" rx={10} fill="#0c1a2e" stroke="#22d3ee" strokeWidth={2}/>
      <text x="140" y="46" textAnchor="middle" fontSize={13} fill="#22d3ee" fontWeight={700} fontFamily="Inter,sans-serif">🌐 Network OS (NOS)</text>
      {["Multi-user: 100+ คน พร้อมกัน","CLI เป็นหลัก (ประสิทธิภาพสูง)","Uptime 99.999% (Five Nines)","Daemon / Background Services","RAM เน้น Cache ข้อมูล"].map((t,i)=>(
        <text key={i} x="36" y={68+i*20} fontSize={10} fill="#8892a4" fontFamily="Inter,sans-serif">▸ {t}</text>
      ))}
      {/* Desktop Side */}
      <rect x="300" y="20" width="240" height="160" rx={10} fill="#1a1200" stroke="#f59e0b" strokeWidth={2}/>
      <text x="420" y="46" textAnchor="middle" fontSize={13} fill="#f59e0b" fontWeight={700} fontFamily="Inter,sans-serif">💻 Desktop OS</text>
      {["Single-user: ใช้งานคนเดียว","GUI เป็นหลัก (ใช้งานง่าย)","ปิด-เปิด รายวัน","Foreground Applications","RAM เน้นโปรแกรมที่เปิดอยู่"].map((t,i)=>(
        <text key={i} x="316" y={68+i*20} fontSize={10} fill="#8892a4" fontFamily="Inter,sans-serif">▸ {t}</text>
      ))}
      <text x="280" y="196" textAnchor="middle" fontSize={10} fill="#4a5568" fontFamily="Inter,sans-serif">NOS ถูกออกแบบมาสำหรับรองรับผู้ใช้หลายคน Desktop OS เพื่อผู้ใช้คนเดียว</text>
    </svg>
  );
}

function DiagramHypervisor() {
  const lyr = (x:number,y:number,w:number,h:number,color:string,lbl:string,sub:string="") => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#191d29" stroke={color} strokeWidth={1.5}/>
      <text x={x+w/2} y={y+h/2-4} textAnchor="middle" fontSize={12} fill={color} fontFamily="Inter,sans-serif" fontWeight={600}>{lbl}</text>
      {sub && <text x={x+w/2} y={y+h/2+12} textAnchor="middle" fontSize={9} fill="#8892a4" fontFamily="Inter,sans-serif">{sub}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "100%" }}>
      <text x="130" y="18" textAnchor="middle" fontSize={11} fill="#22d3ee" fontFamily="Inter,sans-serif" fontWeight={700}>Type 1 — Bare Metal</text>
      {lyr(20,25,220,30,"#a78bfa","VM1 (Win)")}
      <rect x={125} y={25} width={2} height={30} fill="#22d3ee" opacity={0.3}/>
      {lyr(125,25,115,30,"#a78bfa","VM2 (Linux)")}
      {lyr(20,60,220,30,"#22d3ee","Hypervisor","VMware ESXi / KVM")}
      {lyr(20,95,220,30,"#f59e0b","Hardware","CPU / RAM / Disk")}
      <text x="130" y="145" textAnchor="middle" fontSize={9} fill="#22c55e" fontFamily="Inter,sans-serif">✅ ประสิทธิภาพสูงสุด (Production)</text>
      <text x="420" y="18" textAnchor="middle" fontSize={11} fill="#f59e0b" fontFamily="Inter,sans-serif" fontWeight={700}>Type 2 — Hosted</text>
      {lyr(320,25,200,30,"#a78bfa","VM (Ubuntu)")}
      {lyr(320,60,200,30,"#f59e0b","VirtualBox / VMware WS","")}
      {lyr(320,95,200,30,"#22d3ee","Host OS (Windows/macOS)")}
      {lyr(320,130,200,25,"#f59e0b","Hardware")}
      <text x="420" y="170" textAnchor="middle" fontSize={9} fill="#22d3ee" fontFamily="Inter,sans-serif">🔵 ใช้ทำแล็บ (Development)</text>
    </svg>
  );
}

function DiagramNTier() {
  const row = (y:number,color:string,icon:string,lbl:string,sub:string) => (
    <g>
      <rect x={160} y={y} width={240} height={36} rx={8} fill="#191d29" stroke={color} strokeWidth={1.5}/>
      <text x={180} y={y+22} fontSize={14}>{icon}</text>
      <text x={204} y={y+15} fontSize={12} fill={color} fontFamily="Inter,sans-serif" fontWeight={600}>{lbl}</text>
      <text x={204} y={y+30} fontSize={9} fill="#8892a4" fontFamily="Inter,sans-serif">{sub}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 560 210" style={{ width: "100%", height: "100%" }}>
      {row(20,"#22d3ee","💻","Presentation Layer","Browser / Mobile App — ส่วนที่ผู้ใช้เห็น")}
      <line x1="280" y1="56" x2="280" y2="76" stroke="#22d3ee" strokeWidth={1.5}/>
      <polygon points="275,76 280,86 285,76" fill="#a78bfa"/>
      {row(86,"#a78bfa","⚙️","Application Layer","Business Logic / API Server — ประมวลผล")}
      <line x1="280" y1="122" x2="280" y2="142" stroke="#a78bfa" strokeWidth={1.5}/>
      <polygon points="275,142 280,152 285,142" fill="#22c55e"/>
      {row(152,"#22c55e","🗄️","Data Layer","Database Server — จัดเก็บข้อมูล")}
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
          <rect x="20" y={25 + i*24} width="160" height="20" rx="3" fill="#191d29" stroke={l.color} strokeWidth="1.5" />
          <text x="100" y={39 + i*24} textAnchor="middle" fill={l.color} fontSize="11" fontWeight="bold">{l.name}</text>
        </g>
      ))}

      {/* Receiver Stack (Right) */}
      <text x="460" y="15" textAnchor="middle" fill="#e8eaf0" fontSize="12" fontWeight="bold">เครื่องปลายทาง (ผู้รับ)</text>
      {layers.map((l, i) => (
        <g key={`receiver-${i}`}>
          <rect x="380" y={25 + i*24} width="160" height="20" rx="3" fill="#191d29" stroke={l.color} strokeWidth="1.5" />
          <text x="460" y={39 + i*24} textAnchor="middle" fill={l.color} fontSize="11" fontWeight="bold">{l.name}</text>
        </g>
      ))}

      {/* Center Descriptions */}
      {layers.map((l, i) => (
        <text key={`desc-${i}`} x="280" y={39 + i*24} textAnchor="middle" fill="#8892a4" fontSize="10">{l.desc}</text>
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
    { wire: "#fb923c", label: "ส้ม",    cx: 220 },
    { wire: "#4ade80", label: "ขาวเขียว", cx: 240 },
    { wire: "#3b82f6", label: "น้ำเงิน", cx: 260 },
    { wire: "#93c5fd", label: "ขาวน้ำเงิน", cx: 280 },
    { wire: "#22c55e", label: "เขียว",  cx: 300 },
    { wire: "#c8a285", label: "ขาวน้ำตาล", cx: 320 },
    { wire: "#92400e", label: "น้ำตาล", cx: 340 },
  ];
  return (
    <svg viewBox="0 0 560 230" style={{ width: "100%", height: "100%" }}>
      <text x="280" y="20" textAnchor="middle" fill="#e8eaf0" fontSize="15" fontWeight="bold">โครงสร้างภายในสาย UTP (Unshielded Twisted Pair)</text>
      {/* Outer jacket */}
      <rect x="60" y="50" width="440" height="90" rx="45" fill="none" stroke="#4a5568" strokeWidth="4"/>
      <rect x="60" y="50" width="440" height="90" rx="45" fill="#1e293b" opacity="0.8"/>
      {/* Cut-away label */}
      <line x1="185" y1="50" x2="185" y2="140" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2"/>
      <text x="122" y="46" textAnchor="middle" fill="#ef4444" fontSize="11">ตัดเปลือกนอกออก</text>
      {/* Twisted pairs (left intact side) */}
      {[["#f97316","#fb923c"],["#4ade80","#22c55e"],["#3b82f6","#93c5fd"],["#c8a285","#92400e"]].map(([c1,c2], pi) => (
        <g key={pi}>
          <ellipse cx={90 + pi * 22} cy={95} rx="8" ry="36" fill="#12151d" stroke={c1} strokeWidth="2"/>
          <path d={`M${80+pi*22},75 Q${88+pi*22},95 ${80+pi*22},115`} fill="none" stroke={c1} strokeWidth="2"/>
          <path d={`M${100+pi*22},75 Q${92+pi*22},95 ${100+pi*22},115`} fill="none" stroke={c2} strokeWidth="2"/>
        </g>
      ))}
      {/* Exposed wires (right cut-away side) */}
      {colors.map((c, i) => (
        <g key={i}>
          <line x1="190" y1={95} x2="490" y2={95} stroke={c.wire} strokeWidth="6" strokeDasharray="0"
            transform={`translate(0, ${(i - 3.5) * 9})`}/>
          <circle cx="492" cy={95 + (i - 3.5) * 9} r="5" fill={c.wire}/>
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
    { color: "#fb923c", stripe: true,  label: "ขาวส้ม" },
    { color: "#fb923c", stripe: false, label: "ส้ม" },
    { color: "#22c55e", stripe: true,  label: "ขาวเขียว" },
    { color: "#3b82f6", stripe: false, label: "น้ำเงิน" },
    { color: "#3b82f6", stripe: true,  label: "ขาวน้ำเงิน" },
    { color: "#22c55e", stripe: false, label: "เขียว" },
    { color: "#92400e", stripe: true,  label: "ขาวน้ำตาล" },
    { color: "#92400e", stripe: false, label: "น้ำตาล" },
  ];
  const t568a = [
    { color: "#22c55e", stripe: true,  label: "ขาวเขียว" },
    { color: "#22c55e", stripe: false, label: "เขียว" },
    { color: "#fb923c", stripe: true,  label: "ขาวส้ม" },
    { color: "#3b82f6", stripe: false, label: "น้ำเงิน" },
    { color: "#3b82f6", stripe: true,  label: "ขาวน้ำเงิน" },
    { color: "#fb923c", stripe: false, label: "ส้ม" },
    { color: "#92400e", stripe: true,  label: "ขาวน้ำตาล" },
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
      <rect x="30" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#22d3ee" strokeWidth="2"/>
      {["#fb923c","#fb923c","#22c55e","#3b82f6","#3b82f6","#22c55e","#c8a285","#92400e"].map((c, i) => (
        <rect key={i} x={33 + i * 3} y="70" width="2.5" height="70" fill={c}/>
      ))}
      {/* Wires going straight */}
      {["#fb923c","#fb923c","#22c55e","#3b82f6","#3b82f6","#22c55e","#c8a285","#92400e"].map((c, i) => (
        <line key={i} x1="58" y1={72 + i * 8.5} x2="192" y2={72 + i * 8.5} stroke={c} strokeWidth="1.5"/>
      ))}
      {/* Right RJ45 */}
      <rect x="192" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#22d3ee" strokeWidth="2"/>
      {["#fb923c","#fb923c","#22c55e","#3b82f6","#3b82f6","#22c55e","#c8a285","#92400e"].map((c, i) => (
        <rect key={i} x={195 + i * 3} y="70" width="2.5" height="70" fill={c}/>
      ))}
      {/* Use case icons */}
      <text x="50" y="162" textAnchor="middle" fill="#94a3b8" fontSize="18">💻</text>
      <text x="210" y="162" textAnchor="middle" fill="#94a3b8" fontSize="18">🔀</text>
      <text x="130" y="175" textAnchor="middle" fill="#94a3b8" fontSize="10">PC → Switch/Router</text>

      {/* Crossover */}
      <text x="420" y="44" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">⚡ สายไขว้ (Crossover)</text>
      <text x="420" y="58" textAnchor="middle" fill="#4a5568" fontSize="10">T568A ↔ T568B (ต่างกัน)</text>
      {/* Left RJ45 A */}
      <rect x="310" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="2"/>
      {["#22c55e","#22c55e","#fb923c","#3b82f6","#3b82f6","#fb923c","#c8a285","#92400e"].map((c, i) => (
        <rect key={i} x={313 + i * 3} y="70" width="2.5" height="70" fill={c}/>
      ))}
      {/* Crossover wires (pin 1↔3, 2↔6 crossed) */}
      <line x1="338" y1="72" x2="472" y2="97" stroke="#22c55e" strokeWidth="1.5"/>
      <line x1="338" y1="80" x2="472" y2="122" stroke="#22c55e" strokeWidth="1.5"/>
      <line x1="338" y1="89" x2="472" y2="72" stroke="#fb923c" strokeWidth="1.5"/>
      <line x1="338" y1="97" x2="472" y2="80" stroke="#fb923c" strokeWidth="1.5"/>
      {["#3b82f6","#3b82f6","#c8a285","#92400e"].map((c, i) => (
        <line key={i} x1="338" y1={106 + i * 8.5} x2="472" y2={106 + i * 8.5} stroke={c} strokeWidth="1.5"/>
      ))}
      {/* Right RJ45 B */}
      <rect x="472" y="65" width="28" height="80" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="2"/>
      {["#fb923c","#fb923c","#22c55e","#3b82f6","#3b82f6","#22c55e","#c8a285","#92400e"].map((c, i) => (
        <rect key={i} x={475 + i * 3} y="70" width="2.5" height="70" fill={c}/>
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
                <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1 + i * 0.2}s`} repeatCount="indefinite"/>
              </line>
            )}
            {/* Circle */}
            <circle cx={cx} cy={cy} r="28" fill="#1e293b" stroke={s.color} strokeWidth="2">
              <animate attributeName="r" values="27;29;27" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite"/>
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
        <animate attributeName="cx" values="42;114;186;258;330;402;474" calcMode="discrete" dur="3.5s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="110;110;110;110;110;110;110" dur="3.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;1;1;1;1;1;1;0" keyTimes="0;0.14;0.28;0.43;0.57;0.71;0.86;1" dur="3.5s" repeatCount="indefinite"/>
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
      <rect x="60" y="50" width="90" height="130" rx="8" fill="#1e293b" stroke="#22d3ee" strokeWidth="2"/>
      <text x="105" y="72" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold">MASTER</text>
      {straight.map((n, i) => {
        const pinsColor = ["#fb923c","#fb923c","#22c55e","#3b82f6","#3b82f6","#22c55e","#c8a285","#92400e"][i];
        return (
          <g key={i}>
            <circle cx="135" cy={83 + i * 12} r="4" fill="#0f172a" stroke={pinsColor} strokeWidth="1.5">
              <animate attributeName="fill" values={`#0f172a;${pinsColor};#0f172a`} dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite"/>
            </circle>
            <text x="75" y={87 + i * 12} textAnchor="middle" fill={pinsColor} fontSize="9">Pin {n}</text>
          </g>
        );
      })}
      {/* Cable Line */}
      {straight.map((_, i) => (
        <line key={i} x1="135" y1={83 + i * 12} x2="365" y2={83 + i * 12} stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2">
          <animate attributeName="stroke" values={["#334155","#22c55e","#334155"].join(";")} dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite"/>
        </line>
      ))}
      {/* Light Animation Ball */}
      {straight.map((_, i) => (
        <circle key={i} cx="135" cy={83 + i * 12} r="3" fill="#22c55e" opacity="0">
          <animate attributeName="cx" values="135;365" dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1s" begin={`${i * 0.12}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      {/* Tester Right (Remote) */}
      <rect x="365" y="50" width="90" height="130" rx="8" fill="#1e293b" stroke="#22c55e" strokeWidth="2"/>
      <text x="410" y="72" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">REMOTE</text>
      {straight.map((n, i) => {
        const pinsColor = ["#fb923c","#fb923c","#22c55e","#3b82f6","#3b82f6","#22c55e","#c8a285","#92400e"][i];
        return (
          <g key={i}>
            <circle cx="370" cy={83 + i * 12} r="4" fill="#0f172a" stroke={pinsColor} strokeWidth="1.5">
              <animate attributeName="fill" values={`#0f172a;${pinsColor};#0f172a`} dur="1s" begin={`${i * 0.12 + 0.6}s`} repeatCount="indefinite"/>
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
          {data.spacedCmd ? (
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
        <div style={{ marginTop: "8px", color: "#94a3b8", fontSize: "11px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
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
      {/* Step connection paths */}
      {/* Step 1 to 2 */}
      <line x1="170" y1="52.5" x2="190" y2="52.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="190,49.5 195,52.5 190,55.5" fill="var(--accent)" />

      {/* Step 2 to 3 */}
      <line x1="350" y1="52.5" x2="370" y2="52.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="370,49.5 375,52.5 370,55.5" fill="var(--accent)" />

      {/* Step 3 to 4 */}
      <path d="M 530 52.5 L 545 52.5 L 545 132.5 L 530 132.5" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="3 3" />
      <polygon points="530,129.5 525,132.5 530,135.5" fill="var(--accent)" />

      {/* Step 4 to 5 */}
      <line x1="370" y1="132.5" x2="350" y2="132.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="350,129.5 345,132.5 350,135.5" fill="var(--accent)" />

      {/* Step 5 to 6 */}
      <line x1="190" y1="132.5" x2="170" y2="132.5" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="170,129.5 165,132.5 170,135.5" fill="var(--accent)" />

      {steps.map((st, i) => (
        <g key={i}>
          <rect x={st.x} y={st.y} width={st.w} height={st.h} {...nodeBg} />
          <circle cx={st.x + 15} cy={st.y + 22} r="10" fill="var(--accent)" />
          <text x={st.x + 15} y={st.y + 25} fill="var(--bg-surface)" fontSize={9} fontFamily="Inter, sans-serif" fontWeight="bold" textAnchor="middle">{st.num}</text>
          <text x={st.x + 32} y={st.y + 18} {...textStyle} textAnchor="start">{st.title}</text>
          <text x={st.x + 32} y={st.y + 34} {...descStyle} textAnchor="start">{st.sub}</text>
        </g>
      ))}

      {/* Animated Flow Packets moving along the steps path */}
      <circle cx="0" cy="0" r="3.5" fill="var(--green)" opacity="0.9">
        <animateMotion 
          path="M 90 52.5 L 190 52.5 L 370 52.5 L 545 52.5 L 545 132.5 L 450 132.5 L 270 132.5 L 90 132.5" 
          dur="8s" 
          repeatCount="indefinite" 
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

      {/* Main branches */}
      {/* Root to bin */}
      <path d="M 280 51 L 280 75 L 80 75 L 80 110" {...lineStyle} />
      {/* Root to etc */}
      <path d="M 280 51 L 280 75 L 210 75 L 210 110" {...lineStyle} />
      {/* Root to home */}
      <path d="M 280 51 L 280 75 L 350 75 L 350 110" {...lineStyle} />
      {/* Root to var */}
      <path d="M 280 51 L 280 75 L 480 75 L 480 110" {...lineStyle} />

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

      {/* Animated Flow Packets from Root (/) down the paths */}
      <circle cx="280" cy="51" r="4" fill="var(--accent)" opacity="0.8">
        <animateMotion 
          path="M 280 51 L 280 75 L 80 75 L 80 110" 
          dur="3s" 
          repeatCount="indefinite" 
        />
      </circle>
      <circle cx="280" cy="51" r="4" fill="var(--accent)" opacity="0.8" begin="0.7s">
        <animateMotion 
          path="M 280 51 L 280 75 L 210 75 L 210 110" 
          dur="3s" 
          repeatCount="indefinite" 
        />
      </circle>
      <circle cx="280" cy="51" r="4" fill="var(--accent)" opacity="0.8" begin="1.4s">
        <animateMotion 
          path="M 280 51 L 280 75 L 350 75 L 350 110" 
          dur="3s" 
          repeatCount="indefinite" 
        />
      </circle>
      <circle cx="280" cy="51" r="4" fill="var(--accent)" opacity="0.8" begin="2.1s">
        <animateMotion 
          path="M 280 51 L 280 75 L 480 75 L 480 110" 
          dur="3s" 
          repeatCount="indefinite" 
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
          {!s.image && !Diagram && <div style={{color:"var(--text-muted)",fontSize:12}}>ไม่พบเนื้อหา</div>}
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

function SlideRenderer({ slide }: { slide: SlideData }) {
  switch (slide.type) {
    case "cover": return <CoverSlide s={slide} />;
    case "content": return <ContentSlide s={slide} />;
    case "two-col": return <TwoColSlide s={slide} />;
    case "scoring": return <ScoringSlide s={slide} />;
    case "lab": return <LabSlide s={slide} />;
    case "summary": return <SummarySlide s={slide} />;
    case "diagram": return <DiagramSlide s={slide} />;
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

/* ======================================= */
/* --- MAIN APP --- */
/* ======================================= */
export default function Home() {
  const [weekGroups, setWeekGroups] = useState<WeekGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({"Week 1": true});
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
  useEffect(() => {
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
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
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
                onClick={() => setExpandedGroups(prev => ({...prev, [group.weekLabel]: !prev[group.weekLabel]}))}
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
                    <span className="week-num" style={{fontSize: '13px', width: '36px', height: '36px'}}>{s.displayNum}</span>
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

        <div className="sidebar-footer">
          <div className="progress-info">
            <span>สไลด์</span>
            <span>{slideIdx + 1} / {totalSlides}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-area">
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
      </main>
    </div>
  );
}
