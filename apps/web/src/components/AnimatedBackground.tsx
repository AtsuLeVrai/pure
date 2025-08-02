"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  char: string;
}

export default function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  // Code characters related to Discord bots
  const codeChars = [
    "/",
    "!",
    "$",
    "{",
    "}",
    "(",
    ")",
    ">",
    "<",
    "=",
    "+",
    "-",
    "*",
    "&",
    "%",
    "#",
    "@",
  ];

  useEffect(() => {
    setMounted(true);

    // Only run on client side
    if (typeof window === "undefined") return;

    const createParticle = (id: number): Particle => ({
      id,
      x: Math.random() * (window.innerWidth || 1200),
      y: (window.innerHeight || 800) + Math.random() * 200, // Start below screen
      size: Math.random() * 6 + 14,
      speed: Math.random() * 0.5 + 0.2, // Not used with Framer Motion
      opacity: Math.random() * 0.12 + 0.08,
      char: codeChars[Math.floor(Math.random() * codeChars.length)],
    });

    // Create initial particles with staggered positions
    const initialParticles = Array.from({ length: 25 }, (_, i) => ({
      ...createParticle(i),
      y: (window.innerHeight || 800) + i * 50, // Stagger initial positions
    }));

    setParticles(initialParticles);
  }, []);

  // Don't render anything on server side
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating code particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-blue-400 font-mono font-bold select-none will-change-transform"
          initial={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            x: [
              particle.x,
              particle.x + Math.sin(particle.id) * 20, // Slight horizontal drift
              particle.x,
            ],
            y: particle.y - (window.innerHeight || 800) - 200, // Move completely off screen
            opacity: [
              0,
              particle.opacity,
              particle.opacity,
              particle.opacity * 0.5,
              0,
            ],
            scale: [0.8, 1, 1, 1.1, 0.8],
            rotate: [0, particle.id % 2 === 0 ? 5 : -5, 0], // Subtle rotation
          }}
          transition={{
            duration: 12 + Math.random() * 8, // Varied timing for natural effect
            ease: "linear",
            repeat: Infinity,
            delay: particle.id * 0.5, // Stagger start times
            x: {
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            },
          }}
          style={{
            fontSize: particle.size,
          }}
        >
          {particle.char}
        </motion.div>
      ))}

      {/* Top glow effect - more visible */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/8 rounded-full blur-[80px]" />

      {/* Side accent lights */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-[60px]" />
      <div className="absolute top-3/4 -right-32 w-64 h-64 bg-cyan-500/5 rounded-full blur-[60px]" />
    </div>
  );
}
