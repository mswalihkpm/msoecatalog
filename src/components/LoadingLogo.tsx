import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

interface LoadingLogoProps {
  text?: string;
  size?: number;
  className?: string;
}

export const LoadingLogo = ({ text, size = 48, className = "" }: LoadingLogoProps) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div style={{ width: size, height: size, perspective: 600 }}>
        <motion.img
          src={logo}
          alt="Loading"
          className="w-full h-full object-contain"
          animate={{ rotateY: [0, 180, 360] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ backfaceVisibility: "hidden" }}
        />
      </div>
      {text && (
        <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};
