import React, { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

const ScoreRing = ({ score = 0, size = 100, strokeWidth = 8, label = 'Risk Score' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const ringRef = useRef(null)

  useEffect(() => {
    if (ringRef.current) {
      ringRef.current.style.transition = 'stroke-dashoffset 1s ease-out'
      ringRef.current.style.strokeDashoffset = offset
    }
  }, [score, offset])

  const getColor = (score) => {
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // amber
    return '#f43f5e' // red
  }

  const color = getColor(score)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Glow track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          {/* Progress ring */}
          <circle
            ref={ringRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-slate-500 font-mono">/100</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-300 mt-2">{label}</p>
      <p className="text-xs text-slate-500">
        {score >= 80 ? 'Low risk' : score >= 60 ? 'Medium risk' : 'High risk'}
      </p>
    </div>
  )
}

export default ScoreRing