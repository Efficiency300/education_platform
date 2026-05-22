import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";

interface Props extends MotionProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  interactive?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  strong,
  interactive,
  ...motionProps
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      whileHover={interactive ? { y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } } : undefined}
      className={`${strong ? "glass-strong" : "glass"} p-6 ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
