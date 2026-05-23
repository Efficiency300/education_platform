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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={interactive ? { y: -1, transition: { duration: 0.15 } } : undefined}
      className={`${strong ? "glass-strong" : "glass"} ${className}`}
      style={{ padding: 20 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
