"use client";

import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ className, children, delay = 1000 }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const childrenArray = React.Children.toArray(children);

    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
      }, delay);

      return () => clearInterval(interval);
    }, [childrenArray.length, delay]);

    const itemsToShow = useMemo(
      () => childrenArray.slice(0, index + 1).reverse(),
      [index, childrenArray]
    );

    return (
      <div className={`flex flex-col items-center gap-4 ${className || ""}`}>
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";

export interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
  viewportRoot?: React.RefObject<Element | null>;
  index?: number;
}

export function AnimatedListItem({
  children,
  className = "",
  viewportRoot,
  index = 0,
}: AnimatedListItemProps) {
  const isScrollDriven = !!viewportRoot;

  const animations = isScrollDriven
    ? {
        initial: { opacity: 0, transform: "scale(0.95) translateY(6px)" },
        whileInView: { opacity: 1, transform: "scale(1) translateY(0px)" },
        viewport: { root: viewportRoot, amount: 0.1, once: true },
        exit: { opacity: 0, transform: "scale(0.95) translateY(-4px)" },
        transition: {
          type: "spring",
          mass: 0.8,
          stiffness: 380,
          damping: 30,
          delay: index < 3 ? index * 0.035 : 0,
        },
      }
    : {
        initial: { opacity: 0, transform: "scale(0.95) translateY(-4px)" },
        animate: { opacity: 1, transform: "scale(1) translateY(0px)" },
        exit: { opacity: 0, transform: "scale(0.95) translateY(-4px)" },
        transition: { type: "spring", stiffness: 350, damping: 40 },
      };

  return (
    <motion.div
      {...animations}
      className={`mx-auto w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
