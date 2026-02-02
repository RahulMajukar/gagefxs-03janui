import React, { useState, useEffect } from "react";

export default function DigitalClock({ 
  className = "text-green-400 text-2xl font-mono py-1 px-2" }) 
  {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", { hour12: false });

  return <div className={className}>{formattedTime}</div>;
}
