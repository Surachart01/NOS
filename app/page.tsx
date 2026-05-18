"use client";
import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
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
  week: number; title: string; topic: string; description: string;
  learningObjectives: string[];
  slides: SlideData[];
}
interface WeekMeta { week: number; title: string; topic: string; }

/* ─── SVG Icons ─── */
const MenuIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const ChevLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>;
const ChevRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,6 15,12 9,18"/></svg>;
const MaxIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>;
const MinIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6m10-10h-6V4m0 6l7-7M3 21l7-7"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const NoteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;

/* ─── Slide Renderers ─── */
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

/* ─── Diagram SVGs ─── */
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

/* ─── Layer 7 (Application) Animation ─── */
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

/* ─── Layer 6 (Presentation) Animation ─── */
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

/* ─── Layer 5 (Session) Animation ─── */
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

/* ─── Layer 4 (Transport) Animation ─── */
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

/* ─── Layer 3 (Network) Animation ─── */
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

/* ─── Layer 2 (Data Link) Animation ─── */
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

/* ─── Layer 1 (Physical) Animation ─── */
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

/* ─── Animated Networking Equipment Diagrams ─── */
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

/* ─── Full Network Topology Animation ─── */
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

const DIAGRAMS: Record<string, React.FC> = {
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

/* ─── Download helper ─── */
function downloadSlideJSON(weekData: WeekData) {
  const blob = new Blob([JSON.stringify(weekData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `week-${String(weekData.week).padStart(2, "0")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════ */
/* ─── MAIN APP ─── */
/* ═══════════════════════════════════════ */
export default function Home() {
  const [weeks, setWeeks] = useState<WeekMeta[]>([]);
  const [activeWeek, setActiveWeek] = useState(1);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesVisible, setNotesVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load week index
  useEffect(() => {
    fetch("/data/weeks.json").then(r => r.json()).then((d: WeekMeta[]) => { setWeeks(d); setLoading(false); });
  }, []);

  // Load week data
  useEffect(() => {
    setLoading(true);
    const num = String(activeWeek).padStart(2, "0");
    fetch(`/data/week-${num}.json`).then(r => r.json()).then((d: WeekData) => {
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

  // Group weeks by section
  const sections = [
    { label: "Windows Server", range: [1, 11] },
    { label: "Linux Server", range: [12, 14] },
    { label: "Advanced Topics", range: [15, 18] },
  ];

  /* ─── Fullscreen View ─── */
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

  /* ─── Normal View ─── */
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
              <div className="logo-sub">Network Operating System</div>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen(false)}><MenuIcon /></button>
        </div>

        <div className="week-list">
          {sections.map(sec => (
            <div key={sec.label}>
              <div className="week-section-label">{sec.label}</div>
              {weeks.filter(w => w.week >= sec.range[0] && w.week <= sec.range[1]).map(w => (
                <button
                  key={w.week}
                  className={`week-item ${w.week === activeWeek ? "active" : ""}`}
                  onClick={() => w.week === 1 && setActiveWeek(w.week)}
                  disabled={w.week !== 1}
                  style={{ opacity: w.week !== 1 ? 0.3 : 1, cursor: w.week !== 1 ? "not-allowed" : "pointer" }}
                >
                  <span className="week-num">{w.week}</span>
                  <span className="week-label">
                    {w.title}
                    <span className="week-topic">{w.topic}</span>
                  </span>
                </button>
              ))}
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
