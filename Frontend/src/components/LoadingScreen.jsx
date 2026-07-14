import { useState, useEffect } from "react";
import { Building2, Wifi, Activity } from "lucide-react";

const messages = [
  "Preparing your dashboard...",
  "Loading resident records...",
  "Checking room availability...",
  "Syncing payment details...",
  "Fetching hostel updates...",
  "Preparing food attendance system...",
  "Welcome to HostelMate",
];

const tips = [
  "💡 Tip: Use the QR code to share your hostel with potential residents",
  "📊 Tip: Track occupancy rates in real-time from your dashboard",
  "👥 Tip: Manage staff roles and permissions easily",
  "💳 Tip: Automated payment reminders reduce overdue amounts",
  "📱 Tip: Send notifications to all residents instantly",
  "🏠 Tip: Customize hostel rules for each resident agreement",
  "📈 Tip: Export reports for financial and occupancy analysis",
];

function LoadingScreen() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Message rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      setIsTyping(true);
      setDisplayText("");
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isTyping) return;

    const currentMessage = messages[currentMessageIndex];
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      if (charIndex <= currentMessage.length) {
        setDisplayText(currentMessage.slice(0, charIndex));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [currentMessageIndex, isTyping]);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Tip rotation every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#081028] via-[#0B1739] to-[#081028]">
        {/* Animated Glow Elements */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            animation: "pulse 5s ease-in-out infinite 1s",
          }}
        />

        {/* Floating Particles */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-green-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + i}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div
        className="relative z-10 flex flex-col items-center justify-center max-w-lg mx-auto px-6"
        style={{
          animation: "slideUp 0.8s ease-out",
        }}
      >
        {/* Glassmorphic Card */}
        <div
          className="backdrop-blur-2xl rounded-3xl p-8 md:p-12 flex flex-col items-center"
          style={{
            background: "rgba(11, 23, 57, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Logo/Icon with Pulse */}
          <div
            className="mb-8 relative"
            style={{
              animation: "float 4s ease-in-out infinite",
            }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)",
                border: "2px solid rgba(34, 197, 94, 0.3)",
                boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)",
              }}
            >
              <Building2 size={48} className="text-green-400" />
            </div>

            {/* Pulsing Ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid rgba(34, 197, 94, 0.5)",
                animation: "pulse-ring 2s ease-out infinite",
              }}
            />
          </div>

          {/* Title */}
          <h1
            className="text-3xl md:text-4xl font-bold text-white text-center mb-3"
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Connecting to Server...
          </h1>

          {/* Subtitle */}
          <p className="text-center text-sm md:text-base text-gray-300 mb-8">
            Please wait while we prepare your hostel dashboard
          </p>

          {/* Dynamic Message with Typing Effect */}
          <div
            className="h-12 mb-8 flex items-center justify-center"
            style={{
              animation: `fadeInOut 4s ease-in-out infinite`,
            }}
          >
            <div className="text-center">
              <p className="text-green-400 font-semibold text-lg">
                {displayText}
                {isTyping && <span className="animate-pulse">|</span>}
              </p>
            </div>
          </div>

          {/* Custom Loading Spinner */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-green-500"
                style={{
                  animation: `bounce 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full mb-6">
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 10px rgba(34, 197, 94, 0.5)",
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {Math.round(progress)}% Complete
            </p>
          </div>

          {/* Status Indicators */}
          <div className="flex gap-4 mb-8 w-full">
            <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
              <Activity size={16} className="text-green-400 animate-pulse" />
              <span className="text-xs text-gray-300">Backend</span>
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
              <Wifi size={16} className="text-gray-400" />
              <span className="text-xs text-gray-300">Connection</span>
            </div>
          </div>

          {/* Rotating Tip */}
          <div
            className="w-full p-4 rounded-xl text-center"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              animation: "fadeInOut 5s ease-in-out infinite",
            }}
          >
            <p className="text-xs md:text-sm text-gray-300">{tips[currentTip]}</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>HostelMate v1.0.0 • {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeInOut {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
