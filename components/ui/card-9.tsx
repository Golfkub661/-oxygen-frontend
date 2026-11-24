import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  title: string;
  description: string;
  buttonText: string;
  className?: string;
  backgroundColor?: string;
  onClick?: () => void;
}

const cardVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
} as const;

const arrowVariants = {
  initial: { x: 0 },
  hover: { x: 4, transition: { type: "spring", stiffness: 400, damping: 15 } },
} as const;

const ChallengeCard = React.forwardRef<HTMLDivElement, ChallengeCardProps>(
  ({ title, description, buttonText, className, backgroundColor = "bg-green-500", onClick }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl p-8 text-white cursor-pointer",
          backgroundColor,
          className
        )}
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
      >
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-base font-medium opacity-80">{description}</p>
        </div>

        <button
          onClick={onClick}
          className="mt-8 flex w-full items-center justify-between rounded-full bg-white pl-6 pr-2 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          <span>{buttonText}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
            <motion.div variants={arrowVariants}>
              <ArrowRight className="h-4 w-4 text-white" />
            </motion.div>
          </div>
        </button>
      </motion.div>
    );
  }
);

ChallengeCard.displayName = "ChallengeCard";
export { ChallengeCard };