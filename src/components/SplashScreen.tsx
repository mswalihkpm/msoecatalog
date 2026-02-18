import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
        >
          {/* Animated background circles */}
          <div className="absolute inset-0">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 0.1 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2.5, opacity: 0.08 }}
              transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2, opacity: 0.05 }}
              transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary"
            />
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 20,
                  opacity: 0,
                }}
                animate={{
                  y: -20,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 1.5,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 rounded-full bg-primary/40"
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative flex flex-col items-center">
            {/* Logo with glow effect */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2,
              }}
              className="relative"
            >
              <motion.div
              animate={{
                  boxShadow: [
                    "0 0 20px hsl(350 75% 55% / 0.3)",
                    "0 0 40px hsl(350 75% 55% / 0.5)",
                    "0 0 20px hsl(350 75% 55% / 0.3)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden bg-card border-2 border-primary/30"
              >
                <img
                  src={logo}
                  alt="Imthiyaaz Library"
                  className="w-28 h-28 object-contain"
                />
              </motion.div>
            </motion.div>

            {/* Library name with typing effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <motion.h1
                className="font-serif text-4xl md:text-5xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <span className="text-primary">Imthiyaaz</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, letterSpacing: "0.3em" }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-muted-foreground text-lg uppercase tracking-widest mt-2"
              >
                Library
              </motion.p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.2,
                  delay: 1.3,
                  ease: "easeInOut",
                }}
                className="h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              Discover • Read • Grow
            </motion.p>
          </div>

          {/* Corner decorations */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/30"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/30"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
