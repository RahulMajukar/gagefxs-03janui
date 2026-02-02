import React from "react";
import Lottie from "lottie-react";
import animationData from "../assets/Loading_animation/Settings.json";

export default function Loader({ message = "Loading...", height = 350, width = 350 }) {
  return (
    <div className="flex items-center justify-center flex-col">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ height, width }}
      />
      {message && <p className="text-gray-600 mt-2">{message}</p>}
    </div>
  );
}


