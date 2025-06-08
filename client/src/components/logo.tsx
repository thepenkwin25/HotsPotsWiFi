interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Location pin base */}
        <path 
          d="M50 20C39.5 20 31 28.5 31 39C31 55 50 80 50 80S69 55 69 39C69 28.5 60.5 20 50 20Z" 
          fill="hsl(203, 89%, 53%)"
        />
        
        {/* WiFi rings */}
        <circle 
          cx="50" 
          cy="39" 
          r="8" 
          fill="hsl(203, 89%, 53%)"
          stroke="white" 
          strokeWidth="2"
        />
        
        {/* Outer WiFi signal - Orange */}
        <path 
          d="M35 25C40.5 19.5 59.5 19.5 65 25" 
          stroke="hsl(25, 95%, 53%)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none"
        />
        
        {/* Middle WiFi signal - Turquoise */}
        <path 
          d="M40 30C45 25 55 25 60 30" 
          stroke="hsl(177, 70%, 41%)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none"
        />
        
        {/* Inner WiFi signal - Light blue */}
        <path 
          d="M45 35C47.5 32.5 52.5 32.5 55 35" 
          stroke="hsl(203, 89%, 73%)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          fill="none"
        />
      </svg>
    </div>
  );
}