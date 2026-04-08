"use client";

import { useState, useEffect, useRef } from "react";

interface Stats {
  servers: number;
  users: number;
  commandsRan: number;
  songsPlayed: number;
}

interface Node {
  id: string;
  host: string;
  port: number;
  connected: boolean;
  players: number;
  ping: number;
}

interface BotData {
  name: string;
  version: string;
  inviteURL: string;
  stats: Stats;
  nodes: Node[];
}

// Animated counter hook
function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

function StatCard({
  icon,
  value,
  label,
  loading,
}: {
  icon: string;
  value: number;
  label: string;
  loading: boolean;
}) {
  const animated = useCountUp(loading ? 0 : value);

  return (
    <div className="stat-card fade-in-up delay-2">
      <div className="stat-icon">{icon}</div>
      {loading ? (
        <div className="skeleton" style={{ height: "3rem", margin: "0.5rem auto", width: "70%" }} />
      ) : (
        <div className="stat-value">{animated.toLocaleString()}</div>
      )}
      <div className="stat-label">{label}</div>
    </div>
  );
}

function NodeCard({ node }: { node: Node }) {
  return (
    <div className="node-card">
      <div className="node-header">
        <div className="node-name">⚡ {node.id.toUpperCase()}</div>
        <span className={`node-status-badge ${node.connected ? "online" : "offline"}`}>
          <span className={`node-dot ${node.connected ? "pulse" : ""}`} />
          {node.connected ? "Online" : "Offline"}
        </span>
      </div>
      <div className="node-info">
        <div className="node-info-item">
          <span className="node-info-label">Host</span>
          <span className="node-info-value" style={{ fontSize: "0.8rem" }}>
            {node.host}
          </span>
        </div>
        <div className="node-info-item">
          <span className="node-info-label">Port</span>
          <span className="node-info-value">{node.port}</span>
        </div>
        <div className="node-info-item">
          <span className="node-info-label">Players</span>
          <span className="node-info-value">{node.players}</span>
        </div>
        <div className="node-info-item">
          <span className="node-info-label">Ping</span>
          <span className="node-info-value">
            {node.connected ? `${node.ping}ms` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<BotData | null>(null);
  const [loading, setLoading] = useState(true);

  const INVITE_URL =
    "https://discord.com/oauth2/authorize?client_id=1162381409604866078&permissions=277083450689&scope=bot%20applications.commands";
  const SUPPORT_URL = "https://discord.gg/eGkwfAQKMF";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, nodesRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/nodes"),
        ]);
        const stats = statsRes.ok ? await statsRes.json() : null;
        const nodes = nodesRes.ok ? await nodesRes.json() : [];
        setData({
          name: stats?.name || "Music Bot",
          version: stats?.version || "6.0-alpha",
          inviteURL: INVITE_URL,
          stats: stats || {
            servers: 0,
            users: 0,
            commandsRan: 0,
            songsPlayed: 0,
          },
          nodes: nodes || [],
        });
      } catch {
        setData({
          name: "Music Bot",
          version: "6.0-alpha",
          inviteURL: INVITE_URL,
          stats: { servers: 0, users: 0, commandsRan: 0, songsPlayed: 0 },
          nodes: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const onlineNodes = data?.nodes.filter((n) => n.connected).length ?? 0;
  const totalNodes = data?.nodes.length ?? 0;
  const allGood = onlineNodes === totalNodes && totalNodes > 0;
  const someDown = onlineNodes > 0 && onlineNodes < totalNodes;

  const features = [
    {
      icon: "🎵",
      color: "purple",
      title: "Đa Nền Tảng",
      desc: "Phát nhạc từ YouTube, Spotify, SoundCloud và nhiều nguồn hơn nữa chỉ với một lệnh đơn giản.",
    },
    {
      icon: "⚡",
      color: "cyan",
      title: "Lavalink V4",
      desc: "Hệ thống âm thanh mạnh mẽ, ổn định với Multi-Node, tự động chuyển đổi khi Server lỗi.",
    },
    {
      icon: "🔄",
      color: "green",
      title: "Auto Queue",
      desc: "Tự động thêm bài liên quan vào hàng đợi khi hàng đợi rỗng. Không bao giờ im lặng.",
    },
    {
      icon: "🌐",
      color: "pink",
      title: "Web Dashboard",
      desc: "Theo dõi thống kê Bot và trạng thái server nhạc theo thời gian thực ngay trên trình duyệt.",
    },
    {
      icon: "🎛️",
      color: "orange",
      title: "Bộ Điều Khiển",
      desc: "Điều khiển trực tiếp: Dừng, Tua, Tăng giảm âm lượng, Loop, Skip với các nút bấm trực quan.",
    },
    {
      icon: "🛡️",
      color: "yellow",
      title: "Admin Controls",
      desc: "Broadcast thông báo toàn server, quản lý Bot từ xa với các lệnh Admin độc quyền.",
    },
  ];

  return (
    <>
      {/* ====== NAVBAR ====== */}
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <div className="navbar-brand-icon">🎶</div>
          {data?.name || "Music Bot"}
        </a>
        <ul className="navbar-links">
          <li><a href="#features">Tính Năng</a></li>
          <li><a href="#stats">Thống Kê</a></li>
          <li><a href="#status">Trạng Thái</a></li>
        </ul>
        <div className="navbar-cta">
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
            💬 Hỗ Trợ
          </a>
          <a href={INVITE_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
            ✨ Thêm Bot
          </a>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="hero" id="home">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
        <div className="hero-content">
          <div className="hero-badge fade-in-up delay-1">
            <span className="hero-badge-dot" />
            Bot Đang Hoạt Động
          </div>
          <h1 className="hero-title fade-in-up delay-2">
            Bot Nhạc Discord
            <br />
            <span className="hero-title-gradient">Cực Đỉnh Nhất</span>
          </h1>
          <p className="hero-subtitle fade-in-up delay-3">
            {data?.name || "Music Bot"} — Phát nhạc chất lượng cao từ YouTube &amp; Spotify,
            hàng đợi vô tận, bộ lọc âm thanh, điều khiển trực quan và nhiều hơn
            nữa. Hoàn toàn miễn phí.
          </p>
          <div className="hero-actions fade-in-up delay-4">
            <a href={INVITE_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
              🚀 Thêm Vào Server
            </a>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="btn btn-outline">
              💬 Server Hỗ Trợ
            </a>
          </div>
        </div>
        <div className="hero-scroll fade-in-up delay-5">
          <span>Cuộn xuống</span>
          <span>↓</span>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="stats-section" id="stats">
        <div className="container">
          <div>
            <p className="section-label">Thống Kê Thời Gian Thực</p>
            <h2 className="section-title">Con Số Biết Nói</h2>
            <p className="section-desc">
              Tự động cập nhật mỗi 30 giây từ hệ thống Bot.
            </p>
          </div>
          <div className="stats-grid">
            <StatCard icon="🖥️" value={data?.stats.servers ?? 0} label="Servers Đang Dùng" loading={loading} />
            <StatCard icon="👥" value={data?.stats.users ?? 0} label="Users Trong Tầm Với" loading={loading} />
            <StatCard icon="🎵" value={data?.stats.songsPlayed ?? 0} label="Bài Hát Đã Phát" loading={loading} />
            <StatCard icon="⚡" value={data?.stats.commandsRan ?? 0} label="Lệnh Đã Chạy" loading={loading} />
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="features-header">
            <p className="section-label">Tính Năng</p>
            <h2 className="section-title">
              Mọi Thứ Bạn Cần
              <br />
              <span
                style={{
                  background: "var(--gradient-hero)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Trong Một Bot
              </span>
            </h2>
            <p className="section-desc" style={{ margin: "0 auto" }}>
              Được xây dựng với công nghệ hiện đại nhất, {data?.name || "Music Bot"} mang lại
              trải nghiệm nghe nhạc hoàn hảo trên Discord.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className={`feature-icon-wrap ${f.color}`}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== STATUS ====== */}
      <section className="status-section" id="status">
        <div className="container">
          <div className="status-header">
            <div>
              <p className="section-label">System Status</p>
              <h2 className="section-title">Trạng Thái Server Nhạc</h2>
            </div>
            {!loading && data && (
              <div
                className={`status-overall ${
                  allGood ? "all-good" : someDown ? "degraded" : "outage"
                }`}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "currentColor",
                    display: "inline-block",
                    animation: allGood ? "pulse 2s infinite" : "none",
                  }}
                />
                {allGood
                  ? `✅ Tất cả ${totalNodes} Node Hoạt Động Bình Thường`
                  : someDown
                  ? `⚠️ ${onlineNodes}/${totalNodes} Node Online`
                  : "❌ Toàn Bộ Node Ngoại Tuyến"}
              </div>
            )}
          </div>

          {loading ? (
            <div className="node-cards">
              {[1, 2, 3].map((i) => (
                <div className="node-card" key={i}>
                  <div className="skeleton" style={{ height: "100px" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="node-cards">
              {data?.nodes.map((node) => (
                <NodeCard key={node.id} node={node} />
              ))}
              {(!data?.nodes || data.nodes.length === 0) && (
                <div
                  style={{
                    gridColumn: "1/-1",
                    textAlign: "center",
                    padding: "3rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Không thể kết nối đến API. Vui lòng thử lại sau.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">
            Sẵn Sàng Trải Nghiệm
            <br />
            <span
              style={{
                background: "var(--gradient-hero)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Âm Nhạc Đỉnh Cao?
            </span>
          </h2>
          <p className="cta-desc">
            Thêm {data?.name || "Music Bot"} vào server của bạn ngay hôm nay. Hoàn toàn miễn
            phí, không giới hạn thời gian.
          </p>
          <div className="cta-actions">
            <a href={INVITE_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
              🚀 Thêm Bot Ngay — Miễn Phí
            </a>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
              💬 Tham Gia Support
            </a>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="footer">
        <div className="footer-brand">🎶 {data?.name || "Music Bot"}</div>
        <p className="footer-text">
          v{data?.version ?? "6.0-alpha"} • Made with ❤️ for Discord
        </p>
        <div className="footer-links">
          <a href={INVITE_URL} target="_blank" rel="noreferrer">Invite</a>
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer">Support</a>
          <a href="https://github.com/SudhanPlayz/Discord-MusicBot" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </>
  );
}
