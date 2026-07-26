import { Card } from "./Card";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";

export function HealthScore({ score, title = "Health Score" }) {
  const getScoreColor = () => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.danger;
  };

  const color = getScoreColor();
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="flex flex-col items-center justify-center text-center">
      <h3 style={{ fontSize: typography.sizes.cardTitle, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: "16px" }}>
        {title}
      </h3>
      
      <div className="relative flex items-center justify-center" style={{ width: "100px", height: "100px" }}>
        {/* Background Circle */}
        <svg className="absolute top-0 left-0" width="100" height="100" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" 
            stroke={colors.border} 
            strokeWidth="8"
          />
        </svg>
        
        {/* Progress Circle */}
        <svg 
          className="absolute top-0 left-0 transform -rotate-90" 
          width="100" height="100" viewBox="0 0 100 100"
        >
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" 
            stroke={color} 
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1s ease-out"
            }}
          />
        </svg>

        {/* Score Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span style={{ fontSize: "24px", fontWeight: typography.weights.extrabold, color: colors.textPrimary }}>
            {score}
          </span>
        </div>
      </div>
    </Card>
  );
}
