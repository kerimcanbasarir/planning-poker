"use client";

import { useEffect, useState, RefObject, useMemo } from "react";
import { SkillAnimation } from "@/types";
import { SKILLS, ARENA_W, ARENA_H } from "@/lib/skills";

interface SkillEffectProps {
  animation: SkillAnimation;
  arenaRef: RefObject<HTMLDivElement | null>;
}

function fireConfetti(
  arenaRef: RefObject<HTMLDivElement | null>,
  targetX: number,
  targetY: number,
  skill: SkillAnimation["skill"]
) {
  const rect = arenaRef.current?.getBoundingClientRect();
  if (!rect) return;

  const screenX = rect.left + (targetX / ARENA_W) * rect.width;
  const screenY = rect.top + (targetY / ARENA_H) * rect.height;
  const originX = screenX / window.innerWidth;
  const originY = screenY / window.innerHeight;

  import("canvas-confetti").then((mod) => {
    const confetti = mod.default;

    switch (skill) {
      case "fireball":
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { x: originX, y: originY },
          colors: ["#ff4500", "#ff6347", "#ffa500", "#ff0000", "#ffcc00"],
          startVelocity: 25,
          gravity: 1.2,
          ticks: 60,
          shapes: ["circle"],
          scalar: 1.2,
        });
        break;
      case "freeze":
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { x: originX, y: originY },
          colors: ["#38bdf8", "#e0f2fe", "#ffffff", "#93c5fd", "#bae6fd"],
          startVelocity: 15,
          gravity: 0.5,
          ticks: 80,
          shapes: ["circle"],
          scalar: 0.8,
        });
        break;
      case "zap":
        confetti({
          particleCount: 25,
          spread: 360,
          origin: { x: originX, y: originY },
          colors: ["#facc15", "#fef08a", "#ffffff", "#fbbf24"],
          startVelocity: 30,
          gravity: 2,
          ticks: 30,
          shapes: ["square"],
          scalar: 0.6,
        });
        // Second quick burst
        setTimeout(() => {
          confetti({
            particleCount: 15,
            spread: 360,
            origin: { x: originX, y: originY },
            colors: ["#facc15", "#ffffff"],
            startVelocity: 20,
            gravity: 2,
            ticks: 25,
            shapes: ["square"],
            scalar: 0.5,
          });
        }, 100);
        break;
      case "heal":
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { x: originX, y: originY },
          colors: ["#4ade80", "#86efac", "#bbf7d0", "#22c55e"],
          startVelocity: 18,
          gravity: -0.3,
          ticks: 100,
          shapes: ["circle"],
          scalar: 1,
          drift: 0,
        });
        break;
    }
  });
}

export default function SkillEffect({ animation, arenaRef }: SkillEffectProps) {
  const skill = SKILLS[animation.skill];
  const [phase, setPhase] = useState<"start" | "fly" | "done">("start");

  const fromX = (animation.fromPos.x / ARENA_W) * 100;
  const fromY = (animation.fromPos.y / ARENA_H) * 100;
  const toX = (animation.toPos.x / ARENA_W) * 100;
  const toY = (animation.toPos.y / ARENA_H) * 100;

  // Generate random particles for heal
  const healParticles = useMemo(() => {
    if (animation.skill !== "heal") return [];
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      offsetX: (Math.random() - 0.5) * 3,
      delay: i * 0.12,
    }));
  }, [animation.skill]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("fly"));
    const t = setTimeout(() => {
      setPhase("done");
      fireConfetti(arenaRef, animation.toPos.x, animation.toPos.y, animation.skill);
    }, 900);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (animation.skill === "heal") {
    return (
      <>
        {healParticles.map((p) => (
          <div
            key={p.id}
            className="heal-particle"
            style={{
              left: `${toX + p.offsetX}%`,
              top: `${toY}%`,
              fontSize: 16,
              animationDelay: `${p.delay}s`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {skill.emoji}
          </div>
        ))}
      </>
    );
  }

  const isFlying = phase === "fly";
  const isDone = phase === "done";

  return (
    <div
      style={{
        position: "absolute",
        left: `${isDone || isFlying ? toX : fromX}%`,
        top: `${isDone || isFlying ? toY : fromY}%`,
        transform: `translate(-50%, -50%) scale(${isDone ? 0.2 : isFlying ? 1.1 : 0.8})`,
        transition: phase === "start"
          ? "none"
          : "left 0.8s ease-in, top 0.8s ease-in, transform 0.2s ease-out, opacity 0.2s",
        opacity: isDone ? 0 : 1,
        fontSize: 22,
        pointerEvents: "none" as const,
        zIndex: 100,
      }}
    >
      {skill.emoji}
    </div>
  );
}
